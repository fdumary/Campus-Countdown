import { QRCodeSVG } from "qrcode.react";
import { inputStyle, overlayStyle, modalCardStyle, closeButtonStyle, statusBadgeStyle } from "../constants/styles";

export default function QRTicketModal({ activeQrEvent, copyMessage, copyQrCode, closeQrModal }) {
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
          {activeQrEvent && (
            <QRCodeSVG value={activeQrEvent.qrCodeValue} size={240} bgColor="#ffffff" fgColor="#0f172a" level="M" includeMargin />
          )}
        </div>
        <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
          <input value={activeQrEvent?.qrCodeValue || ""} readOnly style={{ ...inputStyle, flex: 1, fontWeight: 700, letterSpacing: 0.8 }} />
          <button onClick={copyQrCode} style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            Copy Ticket Code
          </button>
        </div>
        <div style={{ marginTop: 10, minHeight: 22 }}>
          {copyMessage && (
            <span style={statusBadgeStyle(copyMessage === "Ticket code copied" ? "success" : "error")}>{copyMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
}
