import { useState, useCallback } from "react";
import { isValidSchoolEmail } from "../utils/validation";
import {
  getActiveAccount,
  hasLocalAccounts,
  registerLocalAccount,
  signInLocalAccount,
  signOutLocalAccount,
} from "../services/auth";

export function useAccount() {
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [authMode, setAuthMode] = useState("create");
  const [fullName, setFullName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userType, setUserType] = useState("user");
  const [activeAccount, setActiveAccount] = useState(() => getActiveAccount());
  const [hasAccounts, setHasAccounts] = useState(() => hasLocalAccounts());
  const [accountMessage, setAccountMessage] = useState({ type: "idle", text: "" });
  const [accountBusy, setAccountBusy] = useState(false);

  const resetAccountForm = useCallback(() => {
    setFullName(""); setSchoolEmail(""); setPassword(""); setConfirmPassword(""); setUserType("user");
  }, []);

  const openAccountModal = useCallback((mode = "create") => {
    setAuthMode(mode);
    setAccountMessage({ type: "idle", text: "" });
    setShowAccountModal(true);
  }, []);

  const closeAccountModal = useCallback(() => {
    setShowAccountModal(false);
    setAccountMessage({ type: "idle", text: "" });
    resetAccountForm();
  }, [resetAccountForm]);

  const submitAccountForm = useCallback(async () => {
    const nameValue = fullName.trim();
    const emailValue = schoolEmail.trim().toLowerCase();

    if (authMode === "create" && !nameValue) {
      setAccountMessage({ type: "error", text: "Full name is required." });
      return;
    }
    if (!isValidSchoolEmail(emailValue)) {
      setAccountMessage({ type: "error", text: "Enter a valid school email." });
      return;
    }
    if (!password || password.length < 6) {
      setAccountMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    if (authMode === "create" && password !== confirmPassword) {
      setAccountMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    setAccountBusy(true);
    setAccountMessage({ type: "idle", text: "" });

    try {
      const account = authMode === "create"
        ? await registerLocalAccount({ fullName: nameValue, schoolEmail: emailValue, password, userType })
        : await signInLocalAccount({ schoolEmail: emailValue, password });

      setActiveAccount(account);
      setHasAccounts(true);
      setAccountMessage({
        type: "success",
        text: authMode === "create" ? "Account created. You are signed in." : "Signed in successfully.",
      });

      if (authMode === "create") resetAccountForm();
    } catch (error) {
      setAccountMessage({ type: "error", text: error.message || "Could not complete this action." });
    } finally {
      setAccountBusy(false);
    }
  }, [authMode, fullName, schoolEmail, password, confirmPassword, userType, resetAccountForm]);

  const signOut = useCallback(() => {
    signOutLocalAccount();
    setActiveAccount(null);
    setHasAccounts(hasLocalAccounts());
    setAuthMode("signin");
    setAccountMessage({ type: "idle", text: "" });
    setShowAccountModal(false);
    resetAccountForm();
  }, [resetAccountForm]);

  return {
    showAccountModal, authMode, setAuthMode,
    fullName, setFullName,
    schoolEmail, setSchoolEmail,
    password, setPassword,
    confirmPassword, setConfirmPassword,
    userType, setUserType,
    activeAccount, hasAccounts,
    accountMessage, accountBusy,
    openAccountModal, closeAccountModal,
    submitAccountForm, signOut,
  };
}
