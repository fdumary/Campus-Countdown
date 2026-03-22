export function getTimeLeft(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { total: diff, d, h, m, s };
}

export function getUrgency(diff) {
  if (!diff) return "past";
  const hrs = diff.total / 3600000;
  if (hrs < 24) return "critical";
  if (hrs < 72) return "urgent";
  if (hrs < 168) return "soon";
  return "relaxed";
}