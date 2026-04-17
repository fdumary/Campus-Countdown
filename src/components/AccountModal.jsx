import { btnStyle, inputStyle, overlayStyle, modalCardStyle, closeButtonStyle, statusBadgeStyle } from "../constants/styles";

export default function AccountModal({
  activeAccount, authMode, setAuthMode,
  fullName, setFullName, schoolEmail, setSchoolEmail,
  password, setPassword, confirmPassword, setConfirmPassword,
  accountMessage, accountBusy,
  submitAccountForm, closeAccountModal,
  googleBusy, googleMessage, importFromGoogle,
}) {
  return (
    <div style={overlayStyle(35)}>
      <div style={modalCardStyle(520)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>
            {activeAccount ? "Account Center" : "Create or sign in"}
          </h3>
          <button onClick={closeAccountModal} style={closeButtonStyle}>✕</button>
        </div>

        {!activeAccount && (
          <>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button onClick={() => setAuthMode("create")} style={{ ...btnStyle(authMode === "create"), flex: 1 }}>Create Account</button>
              <button onClick={() => setAuthMode("signin")} style={{ ...btnStyle(authMode === "signin"), flex: 1 }}>Sign In</button>
            </div>
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              {authMode === "create" && (
                <input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={inputStyle} />
              )}
              <input placeholder="School email" type="email" value={schoolEmail} onChange={(e) => setSchoolEmail(e.target.value)} style={inputStyle} />
              <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
              {authMode === "create" && (
                <input placeholder="Confirm password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
              )}
              <button onClick={submitAccountForm} disabled={accountBusy} style={{ padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: accountBusy ? "not-allowed" : "pointer", opacity: accountBusy ? 0.7 : 1 }}>
                {accountBusy ? "Please wait..." : authMode === "create" ? "Create Account" : "Sign In"}
              </button>
            </div>
          </>
        )}

        {activeAccount && (
          <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: "1px solid rgba(148,163,184,0.22)", background: "rgba(15,23,42,0.55)" }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, color: "#94a3b8" }}>
              Signed in as {activeAccount.fullName} ({activeAccount.schoolEmail})
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button onClick={() => importFromGoogle()} disabled={googleBusy} style={{ ...btnStyle(false), background: "rgba(66,133,244,0.2)", color: "#93c5fd", cursor: googleBusy ? "not-allowed" : "pointer", opacity: googleBusy ? 0.75 : 1 }}>
                {googleBusy ? "Importing..." : "Import from Google Calendar"}
              </button>
            </div>
            {googleMessage.type !== "idle" && (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(148,163,184,0.12)", fontSize: 12, color: googleMessage.type === "error" ? "#fca5a5" : "#34d399", lineHeight: 1.5 }}>
                {googleMessage.text}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 10, minHeight: 22 }}>
          {accountMessage.type !== "idle" && (
            <span style={statusBadgeStyle(accountMessage.type)}>{accountMessage.text}</span>
          )}
        </div>
      </div>
    </div>
  );
}
