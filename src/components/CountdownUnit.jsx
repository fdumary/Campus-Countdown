export default function CountdownUnit({ value, label, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 48 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{String(value).padStart(2, "0")}</div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.7, color, marginTop: 2 }}>{label}</div>
    </div>
  );
}