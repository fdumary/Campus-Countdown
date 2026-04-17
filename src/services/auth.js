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
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAccounts(accounts) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function sanitizeAccount(account) {
  if (!account) return null;
  const safe = { ...account };
  delete safe.password;
  return safe;
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

export async function registerLocalAccount({ fullName, schoolEmail, password }) {
  await wait(300);

  const email = normalizeEmail(schoolEmail);
  const accounts = loadAccounts();
  const exists = accounts.some((item) => normalizeEmail(item.schoolEmail) === email);
  if (exists) {
    throw new Error("An account with this school email already exists.");
  }

  const next = {
    id: `acct-${Date.now()}`,
    fullName: String(fullName || "").trim(),
    schoolEmail: email,
    password,
    createdAt: new Date().toISOString(),
    googleCalendarLinked: false,
  };

  const updated = [...accounts, next];
  saveAccounts(updated);
  localStorage.setItem(ACTIVE_ACCOUNT_KEY, next.id);

  return sanitizeAccount(next);
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
  return sanitizeAccount(account);
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
  const next = { ...current, ...patch };

  accounts[index] = next;
  saveAccounts(accounts);

  const activeId = localStorage.getItem(ACTIVE_ACCOUNT_KEY);
  if (activeId === accountId) {
    localStorage.setItem(ACTIVE_ACCOUNT_KEY, next.id);
  }

  return sanitizeAccount(next);
}
