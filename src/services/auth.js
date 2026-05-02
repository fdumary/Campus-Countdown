import User from "../models/User";

const ACCOUNTS_KEY = "campus-user-accounts";
const ACTIVE_ACCOUNT_KEY = "campus-active-account-id";

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function loadAccounts() {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const arr = Array.isArray(parsed) ? parsed.map(User.fromObject) : [];

    // Always ensure a default admin account exists and has a minimum-strength password
    const ADMIN_EMAIL = 'admin@admin.com';
    const DEFAULT_ADMIN_PASSWORD = 'admin123';

    const adminByEmail = arr.find((a) => a && a.schoolEmail === ADMIN_EMAIL);

    if (!adminByEmail) {
      // No admin at all — insert one
      const admin = new User({ fullName: 'admin', schoolEmail: ADMIN_EMAIL, password: DEFAULT_ADMIN_PASSWORD, userType: 'admin' });
      arr.unshift(admin);
      saveAccounts(arr);
    } else {
      // If admin exists but password is too short, update it to default
      try {
        const pwd = String(adminByEmail.password || '');
        if (pwd.length < 6) {
          adminByEmail.password = DEFAULT_ADMIN_PASSWORD;
          saveAccounts(arr);
        }
      } catch (err) {
        // ignore and continue
      }
    }

    return arr;
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  const out = accounts.map((a) => (a instanceof User ? a.toJSON() : a));
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(out));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sanitizeAccount(account) {
  if (!account) return null;
  if (account instanceof User) return account.sanitize();
  return User.fromObject(account).sanitize();
}

export function getActiveAccount() {
  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (!activeId) return null;
  const account = loadAccounts().find((item) => item.id === activeId);
  return sanitizeAccount(account);
}

export function hasLocalAccounts() {
  return loadAccounts().length > 0;
}

// Returns User instances (including password). Use sanitize() before exposing.
export function getAllAccounts() {
  return loadAccounts();
}

export async function registerLocalAccount({ fullName, schoolEmail, password, userType = 'user' }) {
  await wait(300);

  const email = normalizeEmail(schoolEmail);
  const accounts = loadAccounts();
  const exists = accounts.some((item) => normalizeEmail(item.schoolEmail) === email);
  if (exists) {
    throw new Error("An account with this school email already exists.");
  }

  const next = new User({ fullName: String(fullName || "").trim(), schoolEmail: email, password, googleCalendarLinked: false, userType });

  const updated = [...accounts, next];
  saveAccounts(updated);
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, next.id);

  return next.sanitize();
}

export async function signInLocalAccount({ schoolEmail, password }) {
  await wait(250);

  const email = normalizeEmail(schoolEmail);
  const account = loadAccounts().find(
    (item) => normalizeEmail(item.schoolEmail) === email && item.password === password
  );

  if (!account) {
    throw new Error("Invalid school email or password.");
  }

  localStorage.setItem(ACTIVE_ACCOUNT_KEY, account.id);
  return account.sanitize();
}

export function signOutLocalAccount() {
  localStorage.removeItem(ACTIVE_ACCOUNT_KEY);
}

export function updateAccountRecord(accountId, updater) {
  const accounts = loadAccounts();
  const index = accounts.findIndex((item) => item.id === accountId);
  if (index < 0) return null;

  const current = accounts[index];
  const patch = typeof updater === "function" ? updater(current) : updater;
  const merged = { ...current.toJSON(), ...(patch instanceof User ? patch.toJSON() : patch) };
  const next = User.fromObject(merged);

  accounts[index] = next;
  saveAccounts(accounts);

  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (activeId === accountId) {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, next.id);
  }

  return next.sanitize();
}
