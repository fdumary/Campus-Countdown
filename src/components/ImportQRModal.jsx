import { overlayStyle, modalCardStyle, closeButtonStyle, statusBadgeStyle } from "../constants/styles";

export default function ImportQRModal({ importMessage, importCameraState, closeImportQrModal }) {
  return (
    <div style={overlayStyle(34)}>
      <div style={modalCardStyle(500)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>Scan QR Code to Import Event</h3>
          <button onClick={closeImportQrModal} style={closeButtonStyle}>✕</button>
        </div>
        <div style={{ marginTop: 14, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(148,163,184,0.25)", background: "#020617" }}>
          <div id="event-import-qr-reader" style={{ width: "100%", minHeight: 250 }} />
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12, color: "#94a3b8" }}>
          {importCameraState === "loading" && "Requesting camera access..."}
          {importCameraState === "ready" && "Camera is live. Hold event QR code in frame."}
          {importCameraState === "error" && "Camera unavailable on this device."}
        </p>
        <div style={{ marginTop: 10, minHeight: 22 }}>
          {importMessage.type !== "idle" && (
            <span style={statusBadgeStyle(importMessage.type)}>{importMessage.text}</span>
          )}
        </div>
      </div>
    </div>
  );
}
