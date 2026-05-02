import React from "react";
import { QRCodeSVG } from "qrcode.react";
import { inputStyle, overlayStyle, modalCardStyle, closeButtonStyle, statusBadgeStyle } from "../constants/styles";
import Event from "../models/Event";

export default function QRTicketModal({ activeQrEvent, closeQrModal, activeAccount }) {
  const [localCopyMessage, setLocalCopyMessage] = React.useState("");

  if (!activeQrEvent) return null;

  // ticket code should be the slug-only form
  const ticketCode = Event.createTicketCode(activeQrEvent);

  const payloadObj = {
    app: "campus-countdown",
    source: "Campus Countdown",
    type: "ticket",
    ticketCode,
    event: { id: activeQrEvent.id, title: activeQrEvent.title },
    user: { fullName: activeAccount?.fullName || null, email: activeAccount?.schoolEmail || null },
  };

  const payload = JSON.stringify(payloadObj);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setLocalCopyMessage("Ticket code copied");
      window.setTimeout(() => setLocalCopyMessage(""), 2000);
    } catch {
      setLocalCopyMessage("Ticket code copy failed");
      window.setTimeout(() => setLocalCopyMessage(""), 2000);
    }
  };

  return (
    <div style={overlayStyle(30)}>
      <div style={modalCardStyle(480)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#818cf8", marginBottom: 6 }}>Ticket</div>
            <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>{activeQrEvent?.title || "Selected Event"}</h3>
          </div>
          <button onClick={closeQrModal} style={closeButtonStyle}>✕</button>
        </div>
        <div style={{ marginTop: 14, borderRadius: 12, border: "1px solid rgba(148,163,184,0.25)", background: "#020617", padding: 24, display: "flex", justifyContent: "center" }}>
          <QRCodeSVG value={payload} size={240} bgColor="#ffffff" fgColor="#0f172a" level="M" includeMargin />
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <input value={payload} readOnly style={{ ...inputStyle, flex: 1, fontWeight: 700, letterSpacing: 0.8 }} />
          <button onClick={handleCopy} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Copy Ticket Code
          </button>
        </div>
        <div style={{ marginTop: 10, minHeight: 22 }}>
          {localCopyMessage && (
            <span style={statusBadgeStyle(localCopyMessage === "Ticket code copied" ? "success" : "error")}>{localCopyMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
}
