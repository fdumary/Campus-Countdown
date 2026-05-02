export function createQrCodeValue(event) {
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18) || "event";
  return `EVT-${event.id}-${slug}`.toUpperCase();
}

export function normalizeEvent(event) {
  return {
    ...event,
    qrCodeValue: event.qrCodeValue || createQrCodeValue(event),
    isRegistered: Boolean(event.isRegistered),
    isAttended: Boolean(event.isAttended),
    registeredAt: event.registeredAt || null,
    attendedAt: event.attendedAt || null,
    // attendees: array of { id, scannedAt, ticketCode }
    attendees: Array.isArray(event.attendees) ? event.attendees.slice() : [],
  };
}

export function parseEventFromQrPayload(rawPayload) {
  const raw = String(rawPayload || "").trim();
  if (!raw) {
    throw new Error("QR payload is empty.");
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Unsupported QR format. Use event QR JSON payload.");
  }

  const title = String(parsed.title || parsed.eventTitle || "").trim();
  const date = String(parsed.date || parsed.eventDate || "").trim();
  const categoryRaw = String(parsed.category || "academic").toLowerCase();
  const category = categoryRaw === "social" ? "social" : "academic";
  const ticketCode = String(parsed.ticketCode || parsed.qrCodeValue || "").trim();

  if (!title) {
    throw new Error("QR event payload is missing a title.");
  }

  if (!date || Number.isNaN(new Date(date).getTime())) {
    throw new Error("QR event payload has an invalid date.");
  }

  return {
    title,
    date,
    category,
    qrCodeValue: ticketCode || null,
  };
}

export const INITIAL_EVENTS = [
  { id: 1, title: "Midterm Exam - Data Structures", date: "2026-03-20T09:00:00", category: "academic", pinned: false },
  { id: 2, title: "Software Engineering Project Due", date: "2026-03-25T23:59:00", category: "academic", pinned: false },
  { id: 3, title: "Spring Break Starts", date: "2026-04-04T17:00:00", category: "social", pinned: false },
  { id: 4, title: "Career Fair", date: "2026-03-15T10:00:00", category: "academic", pinned: false },
  { id: 5, title: "Campus Music Festival", date: "2026-04-12T18:00:00", category: "social", pinned: false },
  { id: 6, title: "Final Exam - Algorithms", date: "2026-04-28T14:00:00", category: "academic", pinned: false },
  { id: 7, title: "Club Hackathon", date: "2026-03-29T08:00:00", category: "social", pinned: false },
].map(normalizeEvent);