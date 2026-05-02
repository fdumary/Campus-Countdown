import { categoryColors, btnStyle } from "./constants/styles";
import EventCard from "./components/EventCard";
import AccountModal from "./components/AccountModal";
import ImportQRModal from "./components/ImportQRModal";
import QRTicketModal from "./components/QRTicketModal";
import { useAccount } from "./hooks/useAccount";
import { useGoogleCalendar } from "./hooks/useGoogleCalendar";
import AdminPage from "./components/AdminPage";
import { useEvents } from "./hooks/useEvents";

export default function App() {
  const {
    showAccountModal, authMode, setAuthMode,
    fullName, setFullName, schoolEmail, setSchoolEmail,
    password, setPassword, confirmPassword, setConfirmPassword,
    userType, setUserType,
    activeAccount, hasAccounts, accountMessage, accountBusy,
    openAccountModal, closeAccountModal, submitAccountForm, signOut,
  } = useAccount();

  const {
    setEvents, filter, setFilter, showAdd, setShowAdd,
    newTitle, setNewTitle, newDate, setNewDate, newCat, setNewCat,
    showImportQrModal, importMessage, importCameraState,
    showQrModal, activeQrEvent, copyMessage,
    filtered, nearest, nearestTime,
    addEvent, deleteEvent, pinEvent,
    openImportQrModal, closeImportQrModal,
    openQrModal, closeQrModal, copyQrCode,
    openScannerForEvent,
  } = useEvents(activeAccount);

  const { googleBusy, googleMessage, importFromGoogle } = useGoogleCalendar(setEvents);

  // If not signed in, show a simple sign-in prompt only
  if (!activeAccount) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0b0f1a", color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>Campus Countdown</h1>
          <p style={{ color: "#94a3b8", marginBottom: 20 }}>Please sign in to view your events.</p>
          <button onClick={() => openAccountModal(hasAccounts ? "signin" : "create")} style={{ padding: "10px 14px", borderRadius: 8, background: "#6366f1", color: "#fff", border: "none", cursor: "pointer" }}>Sign In / Create Account</button>

          {showAccountModal && (
            <AccountModal
              activeAccount={activeAccount} authMode={authMode} setAuthMode={setAuthMode}
              fullName={fullName} setFullName={setFullName}
              schoolEmail={schoolEmail} setSchoolEmail={setSchoolEmail}
              password={password} setPassword={setPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              userType={userType} setUserType={setUserType}
              accountMessage={accountMessage} accountBusy={accountBusy}
              submitAccountForm={submitAccountForm} closeAccountModal={closeAccountModal}
              googleBusy={googleBusy} googleMessage={googleMessage} importFromGoogle={importFromGoogle}
            />
          )}
        </div>
      </div>
    );
  }

  // If signed-in user is an admin, show the admin dashboard instead of the main UI.
  if (activeAccount && activeAccount.userType === 'admin') {
    return <AdminPage onSignOut={signOut} adminName={activeAccount.fullName} />;
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1a", color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 12px rgba(220,38,38,0)} }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
      `}</style>

      {/* Header */}
      <div style={{ padding: "32px 24px 24px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Campus Countdown
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => openAccountModal(activeAccount ? "signin" : (hasAccounts ? "signin" : "create"))} style={btnStyle(false)}>
              {activeAccount ? "Account" : (hasAccounts ? "Sign In" : "Create Account")}
            </button>
            {activeAccount && (
              <button onClick={signOut} style={btnStyle(false)}>Sign Out</button>
            )}
          </div>
        </div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {activeAccount && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, background: "#34d399", color: "#052e16", padding: "3px 9px", borderRadius: 99 }}>
              Signed In
            </span>
          )}
          {activeAccount && (
            <span style={{ color: "#94a3b8", fontSize: 12 }}>{activeAccount.fullName} • {activeAccount.schoolEmail}</span>
          )}
        </div>
      </div>

      {/* Next Up Banner */}
      {nearest && nearestTime && (
        <div style={{ maxWidth: 640, margin: "0 auto 20px", padding: "0 24px" }}>
          <div style={{ background: "linear-gradient(135deg, #1e1b4b, #312e81)", borderRadius: 16, padding: "20px 24px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#818cf8", marginBottom: 4 }}>Next Up</div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{nearest.title}</div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{nearestTime.d}<span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>d</span></span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{nearestTime.h}<span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>h</span></span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{nearestTime.m}<span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>m</span></span>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{nearestTime.s}<span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>s</span></span>
            </div>
          </div>
        </div>
      )}

      {/* Filters + Add */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[["all", "All"], ["academic", "Academic"], ["social", "Social"]].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={btnStyle(filter === val)}>{label}</button>
          ))}
        </div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ ...btnStyle(false), background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }}>
          {showAdd ? "Cancel" : "+ Add Event"}
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div style={{ maxWidth: 640, margin: "0 auto 20px", padding: "0 24px" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <input placeholder="Event title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
            <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" }} />
            <div style={{ display: "flex", gap: 8 }}>
              {["academic", "social"].map(c => (
                <button key={c} onClick={() => setNewCat(c)} style={{ ...btnStyle(newCat === c), flex: 1, background: newCat === c ? categoryColors[c] : "rgba(255,255,255,0.06)", color: newCat === c ? "#000" : "#94a3b8" }}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
            <button onClick={openImportQrModal} style={{ ...btnStyle(false), background: "rgba(147,197,253,0.18)", color: "#bfdbfe", border: "1px solid rgba(147,197,253,0.35)" }}>
              Scan QR Code
            </button>
            <button onClick={addEvent} style={{ padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              Add Deadline
            </button>
          </div>
        </div>
      )}

      {/* Event List */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && <p style={{ textAlign: "center", color: "#475569", padding: 40 }}>No events found. Add one above!</p>}
        {filtered.map(e => <EventCard key={e.id} event={e} onDelete={deleteEvent} onPin={pinEvent} onShowQr={openQrModal} isOrganizer={activeAccount && activeAccount.userType === 'organizer'} onOpenScanner={openScannerForEvent} />)}
      </div>

      {/* Modals */}
      {showAccountModal && (
        <AccountModal
          activeAccount={activeAccount} authMode={authMode} setAuthMode={setAuthMode}
          fullName={fullName} setFullName={setFullName}
          schoolEmail={schoolEmail} setSchoolEmail={setSchoolEmail}
          password={password} setPassword={setPassword}
          confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
          userType={userType} setUserType={setUserType}
          accountMessage={accountMessage} accountBusy={accountBusy}
          submitAccountForm={submitAccountForm} closeAccountModal={closeAccountModal}
          googleBusy={googleBusy} googleMessage={googleMessage} importFromGoogle={importFromGoogle}
        />
      )}
      {showImportQrModal && (
        <ImportQRModal
          importMessage={importMessage}
          importCameraState={importCameraState}
          closeImportQrModal={closeImportQrModal}
        />
      )}
      {showQrModal && (
        <QRTicketModal
          activeQrEvent={activeQrEvent}
          activeAccount={activeAccount}
          closeQrModal={closeQrModal}
        />
      )}
    </div>
  );
}
