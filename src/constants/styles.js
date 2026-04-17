export const urgencyStyles = {
  critical: { bg: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)", text: "#fff", badge: "#fca5a5", badgeText: "#7f1d1d", pulse: true },
  urgent: { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", text: "#fff", badge: "#fde68a", badgeText: "#78350f", pulse: false },
  soon: { bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", text: "#fff", badge: "#bfdbfe", badgeText: "#1e3a5f", pulse: false },
  relaxed: { bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", text: "#e2e8f0", badge: "#334155", badgeText: "#cbd5e1", pulse: false },
  past: { bg: "linear-gradient(135deg, #374151 0%, #1f2937 100%)", text: "#9ca3af", badge: "#4b5563", badgeText: "#9ca3af", pulse: false },
};

export const categoryColors = { academic: "#f87171", social: "#34d399" };

export const inputStyle = {
  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
  padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
};

export const btnStyle = (active) => ({
  padding: "8px 20px", borderRadius: 99, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer",
  background: active ? "#fff" : "rgba(255,255,255,0.08)", color: active ? "#0f172a" : "#94a3b8",
  transition: "all 0.2s",
});

export const overlayStyle = (zIndex) => ({
  position: "fixed", inset: 0, zIndex, background: "rgba(2,6,23,0.82)",
  display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
});

export const modalCardStyle = (maxWidth) => ({
  width: "100%", maxWidth, background: "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))",
  border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20, boxShadow: "0 24px 50px rgba(0,0,0,0.5)",
});

export const closeButtonStyle = {
  background: "rgba(148,163,184,0.2)", border: "none", color: "#e2e8f0",
  borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, lineHeight: 1,
};

export const statusBadgeStyle = (type) => ({
  display: "inline-block", fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 99,
  background: type === "success" ? "#34d399" : "#fca5a5",
  color: type === "success" ? "#052e16" : "#7f1d1d",
});