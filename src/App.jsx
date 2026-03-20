import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import {
  getActiveAccount,
  registerLocalAccount,
  signInLocalAccount,
  signOutLocalAccount,
  updateAccountRecord,
} from "./services/auth";
import { connectCanvasSSO, syncCanvasProfile } from "./services/canvasAuth";

function createQrCodeValue(event) {
  const slug = event.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 18) || "event";
  return `EVT-${event.id}-${slug}`.toUpperCase();
}

function normalizeEvent(event) {
  return {
    ...event,
    qrCodeValue: event.qrCodeValue || createQrCodeValue(event),
    isRegistered: Boolean(event.isRegistered),
    isAttended: Boolean(event.isAttended),
    registeredAt: event.registeredAt || null,
    attendedAt: event.attendedAt || null,
  };
}

function parseEventFromQrPayload(rawPayload) {
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

const INITIAL_EVENTS = [
  { id: 1, title: "Midterm Exam - Data Structures", date: "2026-03-20T09:00:00", category: "academic", pinned: false },
  { id: 2, title: "Software Engineering Project Due", date: "2026-03-25T23:59:00", category: "academic", pinned: false },
  { id: 3, title: "Spring Break Starts", date: "2026-04-04T17:00:00", category: "social", pinned: false },
  { id: 4, title: "Career Fair", date: "2026-03-15T10:00:00", category: "academic", pinned: false },
  { id: 5, title: "Campus Music Festival", date: "2026-04-12T18:00:00", category: "social", pinned: false },
  { id: 6, title: "Final Exam - Algorithms", date: "2026-04-28T14:00:00", category: "academic", pinned: false },
  { id: 7, title: "Club Hackathon", date: "2026-03-29T08:00:00", category: "social", pinned: false },
].map(normalizeEvent);

function getTimeLeft(dateStr) {
  const diff = new Date(dateStr) - new Date();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { total: diff, d, h, m, s };
}

function getUrgency(diff) {
  if (!diff) return "past";
  const hrs = diff.total / 3600000;
  if (hrs < 24) return "critical";
  if (hrs < 72) return "urgent";
  if (hrs < 168) return "soon";
  return "relaxed";
}

const urgencyStyles = {
  critical: { bg: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)", text: "#fff", badge: "#fca5a5", badgeText: "#7f1d1d", pulse: true },
  urgent: { bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", text: "#fff", badge: "#fde68a", badgeText: "#78350f", pulse: false },
  soon: { bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", text: "#fff", badge: "#bfdbfe", badgeText: "#1e3a5f", pulse: false },
  relaxed: { bg: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", text: "#e2e8f0", badge: "#334155", badgeText: "#cbd5e1", pulse: false },
  past: { bg: "linear-gradient(135deg, #374151 0%, #1f2937 100%)", text: "#9ca3af", badge: "#4b5563", badgeText: "#9ca3af", pulse: false },
};

const categoryColors = { academic: "#f87171", social: "#34d399" };

function CountdownUnit({ value, label, color }) {
  return (
    <div style={{ textAlign: "center", minWidth: 48 }}>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1, fontVariantNumeric: "tabular-nums" }}>{String(value).padStart(2, "0")}</div>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, opacity: 0.7, color, marginTop: 2 }}>{label}</div>
    </div>
  );
}

function EventCard({ event, onDelete, onPin, onShowQr }) {
  const [time, setTime] = useState(getTimeLeft(event.date));
  useEffect(() => {
    const iv = setInterval(() => setTime(getTimeLeft(event.date)), 1000);
    return () => clearInterval(iv);
  }, [event.date]);

  const urgency = getUrgency(time);
  const s = urgencyStyles[urgency];
  const isPast = urgency === "past";

  return (
    <div style={{
      background: s.bg, borderRadius: 16, padding: "20px 24px", color: s.text,
      position: "relative", overflow: "hidden", opacity: isPast ? 0.5 : 1,
      animation: s.pulse ? "pulse 2s infinite" : "none",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, background: categoryColors[event.category], color: "#000", padding: "2px 8px", borderRadius: 99 }}>
              {event.category}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, background: s.badge, color: s.badgeText, padding: "2px 8px", borderRadius: 99 }}>
              {isPast ? "Passed" : urgency}
            </span>
            {event.isRegistered && (
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, background: "#34d399", color: "#052e16", padding: "2px 8px", borderRadius: 99 }}>
                Registered
              </span>
            )}
            {event.isAttended && (
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, background: "#60a5fa", color: "#082f49", padding: "2px 8px", borderRadius: 99 }}>
                Attended
              </span>
            )}
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>{event.title}</h3>
          <p style={{ fontSize: 12, opacity: 0.7, margin: "4px 0 0" }}>{new Date(event.date).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onShowQr(event.id)}
            style={{ background: "rgba(255,255,255,0.2)", border: "none", color: s.text, borderRadius: 8, padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}
            title="Show Ticket"
          >
            Show Ticket
          </button>
          <button onClick={() => onPin(event.id)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: s.text, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }} title="Pin">
            {event.pinned ? "★" : "☆"}
          </button>
          <button onClick={() => onDelete(event.id)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: s.text, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }} title="Delete">
            ✕
          </button>
        </div>
      </div>
      {!isPast && time && (
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-start", marginTop: 8 }}>
          <CountdownUnit value={time.d} label="Days" color={s.text} />
          <div style={{ fontSize: 24, fontWeight: 300, color: s.text, opacity: 0.4, alignSelf: "flex-start", lineHeight: "32px" }}>:</div>
          <CountdownUnit value={time.h} label="Hrs" color={s.text} />
          <div style={{ fontSize: 24, fontWeight: 300, color: s.text, opacity: 0.4, alignSelf: "flex-start", lineHeight: "32px" }}>:</div>
          <CountdownUnit value={time.m} label="Min" color={s.text} />
          <div style={{ fontSize: 24, fontWeight: 300, color: s.text, opacity: 0.4, alignSelf: "flex-start", lineHeight: "32px" }}>:</div>
          <CountdownUnit value={time.s} label="Sec" color={s.text} />
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem("countdown-events");
    if (!saved) return INITIAL_EVENTS;
    try {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return INITIAL_EVENTS;
      return parsed.map(normalizeEvent);
    } catch {
      return INITIAL_EVENTS;
    }
  });

  useEffect(() => {
    localStorage.setItem("countdown-events", JSON.stringify(events));
  }, [events]);
  
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCat, setNewCat] = useState("academic");
  const [showImportQrModal, setShowImportQrModal] = useState(false);
  const [importPayload, setImportPayload] = useState("");
  const [importMessage, setImportMessage] = useState({ type: "idle", text: "" });
  const [importCameraState, setImportCameraState] = useState("idle");
  const importScannerRef = useRef(null);
  const importScanLockRef = useRef(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeQrEventId, setActiveQrEventId] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [authMode, setAuthMode] = useState("create");
  const [fullName, setFullName] = useState("");
  const [schoolEmail, setSchoolEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [activeAccount, setActiveAccount] = useState(() => getActiveAccount());
  const [accountMessage, setAccountMessage] = useState({ type: "idle", text: "" });
  const [accountBusy, setAccountBusy] = useState(false);
  const [ssoBusy, setSsoBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(iv);
  }, []);

  const addEvent = useCallback(() => {
    if (!newTitle.trim() || !newDate) return;
    setEvents(ev => [...ev, normalizeEvent({ id: Date.now(), title: newTitle.trim(), date: newDate, category: newCat, pinned: false })]);
    setNewTitle(""); setNewDate(""); setNewCat("academic"); setShowAdd(false);
  }, [newTitle, newDate, newCat]);

  const deleteEvent = useCallback((id) => setEvents(ev => ev.filter(e => e.id !== id)), []);
  const pinEvent = useCallback((id) => setEvents(ev => ev.map(e => e.id === id ? { ...e, pinned: !e.pinned } : e)), []);

  const closeImportQrModal = useCallback(() => {
    setShowImportQrModal(false);
    setImportPayload("");
    setImportMessage({ type: "idle", text: "" });
    setImportCameraState("idle");
  }, []);

  const openImportQrModal = useCallback(() => {
    setImportPayload("");
    setImportMessage({ type: "idle", text: "" });
    setImportCameraState("loading");
    setShowImportQrModal(true);
  }, []);

  const createEventFromQr = useCallback((rawPayload) => {
    const parsed = parseEventFromQrPayload(rawPayload);
    setEvents((current) => {
      const nextEvent = normalizeEvent({
        id: Date.now(),
        title: parsed.title,
        date: parsed.date,
        category: parsed.category,
        pinned: false,
        qrCodeValue: parsed.qrCodeValue || undefined,
      });
      return [...current, nextEvent];
    });

    setImportMessage({ type: "success", text: "Event added from QR payload." });
    setShowAdd(false);
    window.setTimeout(() => {
      closeImportQrModal();
    }, 900);
  }, [closeImportQrModal]);

  const importFromPayloadInput = useCallback(() => {
    try {
      createEventFromQr(importPayload);
    } catch (error) {
      setImportMessage({ type: "error", text: error.message || "Could not import event QR." });
    }
  }, [createEventFromQr, importPayload]);

  const closeQrModal = useCallback(() => {
    setShowQrModal(false);
    setActiveQrEventId(null);
    setCopyMessage("");
  }, []);

  const openQrModal = useCallback((eventId) => {
    setActiveQrEventId(eventId);
    setCopyMessage("");
    setShowQrModal(true);
  }, []);

  const activeQrEvent = useMemo(() => events.find(e => e.id === activeQrEventId) || null, [events, activeQrEventId]);

  useEffect(() => {
    if (!showImportQrModal) return undefined;

    let isMounted = true;
    const scanner = new Html5Qrcode("event-import-qr-reader");
    importScannerRef.current = scanner;

    const startScanner = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!isMounted) return;

        if (!cameras.length) {
          throw new Error("No camera available.");
        }

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (importScanLockRef.current) return;
            importScanLockRef.current = true;
            try {
              createEventFromQr(decodedText);
            } catch (error) {
              setImportMessage({ type: "error", text: error.message || "Could not import event QR." });
            } finally {
              window.setTimeout(() => {
                importScanLockRef.current = false;
              }, 1000);
            }
          },
          () => {}
        );

        if (isMounted) {
          setImportCameraState("ready");
        }
      } catch {
        if (isMounted) {
          setImportCameraState("error");
          setImportMessage({ type: "error", text: "Camera import unavailable. Paste QR payload below." });
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      importScanLockRef.current = false;

      const liveScanner = importScannerRef.current;
      importScannerRef.current = null;
      if (!liveScanner) return;

      liveScanner
        .stop()
        .catch(() => {})
        .finally(() => {
          liveScanner.clear().catch(() => {});
        });
    };
  }, [showImportQrModal, createEventFromQr]);

  const copyQrCode = useCallback(async () => {
    if (!activeQrEvent?.qrCodeValue) return;
    try {
      await navigator.clipboard.writeText(activeQrEvent.qrCodeValue);
      setCopyMessage("Ticket code copied");
    } catch {
      setCopyMessage("Ticket code copy failed");
    }
  }, [activeQrEvent]);

  const resetAccountForm = useCallback(() => {
    setFullName("");
    setSchoolEmail("");
    setPassword("");
    setConfirmPassword("");
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
        ? await registerLocalAccount({ fullName: nameValue, schoolEmail: emailValue, password })
        : await signInLocalAccount({ schoolEmail: emailValue, password });

      setActiveAccount(account);
      setAccountMessage({
        type: "success",
        text: authMode === "create" ? "Account created. You are signed in." : "Signed in successfully.",
      });

      if (authMode === "create") {
        resetAccountForm();
      }
    } catch (error) {
      setAccountMessage({ type: "error", text: error.message || "Could not complete this action." });
    } finally {
      setAccountBusy(false);
    }
  }, [authMode, fullName, schoolEmail, password, confirmPassword, resetAccountForm]);

  const signOut = useCallback(() => {
    signOutLocalAccount();
    setActiveAccount(null);
    setAccountMessage({ type: "idle", text: "" });
    setShowAccountModal(false);
    resetAccountForm();
  }, [resetAccountForm]);

  const connectSso = useCallback(async () => {
    if (!activeAccount) {
      setAccountMessage({ type: "error", text: "Create or sign in to an account first." });
      return;
    }

    setSsoBusy(true);
    setAccountMessage({ type: "idle", text: "" });

    try {
      const linkPatch = await connectCanvasSSO(activeAccount);
      const updated = updateAccountRecord(activeAccount.id, (current) => ({ ...current, ...linkPatch }));
      setActiveAccount(updated);
      setAccountMessage({ type: "success", text: "Canvas SSO linked (mock mode)." });
    } catch (error) {
      setAccountMessage({ type: "error", text: error.message || "Could not link Canvas SSO." });
    } finally {
      setSsoBusy(false);
    }
  }, [activeAccount]);

  const syncCanvas = useCallback(async () => {
    if (!activeAccount) {
      setAccountMessage({ type: "error", text: "Create or sign in to an account first." });
      return;
    }

    setSyncBusy(true);
    setAccountMessage({ type: "idle", text: "" });

    try {
      const syncPatch = await syncCanvasProfile(activeAccount);
      const updated = updateAccountRecord(activeAccount.id, (current) => ({ ...current, ...syncPatch }));
      setActiveAccount(updated);
      setAccountMessage({ type: "success", text: "Canvas profile synced." });
    } catch (error) {
      setAccountMessage({ type: "error", text: error.message || "Could not sync Canvas profile." });
    } finally {
      setSyncBusy(false);
    }
  }, [activeAccount]);

  const filtered = events
    .filter(e => filter === "all" || e.category === filter)
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      const aLeft = getTimeLeft(a.date), bLeft = getTimeLeft(b.date);
      if (!aLeft && !bLeft) return 0;
      if (!aLeft) return 1;
      if (!bLeft) return -1;
      return aLeft.total - bLeft.total;
    });

  const upcoming = events.filter(e => getTimeLeft(e.date));
  const nearest = upcoming.length ? upcoming.reduce((a, b) => (getTimeLeft(a.date)?.total || Infinity) < (getTimeLeft(b.date)?.total || Infinity) ? a : b) : null;
  const nearestTime = nearest ? getTimeLeft(nearest.date) : null;

  const btnStyle = (active) => ({
    padding: "8px 20px", borderRadius: 99, border: "none", fontWeight: 600, fontSize: 13, cursor: "pointer",
    background: active ? "#fff" : "rgba(255,255,255,0.08)", color: active ? "#0f172a" : "#94a3b8",
    transition: "all 0.2s",
  });

  const inputStyle = {
    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10,
    padding: "10px 14px", color: "#e2e8f0", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0b0f1a", color: "#e2e8f0", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,0.4)} 50%{box-shadow:0 0 0 12px rgba(220,38,38,0)} }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
      `}</style>

      {/* Header */}
      <div style={{ padding: "32px 24px 24px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, background: "linear-gradient(135deg, #60a5fa, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Campus Countdown
            </h1>
          </div>
          <button onClick={() => openAccountModal(activeAccount ? "signin" : "create")} style={btnStyle(false)}>
            {activeAccount ? "Account" : "Create Account"}
          </button>
        </div>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {activeAccount && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, background: "#34d399", color: "#052e16", padding: "3px 9px", borderRadius: 99 }}>
              Signed In
            </span>
          )}
          {activeAccount?.ssoLinked && (
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, background: "#93c5fd", color: "#082f49", padding: "3px 9px", borderRadius: 99 }}>
              Canvas Linked
            </span>
          )}
          {activeAccount && (
            <span style={{ color: "#94a3b8", fontSize: 12 }}>
              {activeAccount.fullName} • {activeAccount.schoolEmail}
            </span>
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
        <div style={{ display: "flex", gap: 8 }}>
          {activeAccount && (
            <button onClick={signOut} style={btnStyle(false)}>
              Sign Out
            </button>
          )}
          <button onClick={() => setShowAdd(!showAdd)} style={{ ...btnStyle(false), background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff" }}>
            {showAdd ? "Cancel" : "+ Add Event"}
          </button>
        </div>
      </div>

      {showAccountModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 35, background: "rgba(2,6,23,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 520, background: "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20, boxShadow: "0 24px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
              </div>
              <button onClick={closeAccountModal} style={{ background: "rgba(148,163,184,0.2)", border: "none", color: "#e2e8f0", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button onClick={() => setAuthMode("create")} style={{ ...btnStyle(authMode === "create"), flex: 1 }}>
                Create Account
              </button>
              <button onClick={() => setAuthMode("signin")} style={{ ...btnStyle(authMode === "signin"), flex: 1 }}>
                Sign In
              </button>
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
              <button
                onClick={submitAccountForm}
                disabled={accountBusy}
                style={{ padding: "12px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, fontSize: 14, cursor: accountBusy ? "not-allowed" : "pointer", opacity: accountBusy ? 0.7 : 1 }}
              >
                {accountBusy ? "Please wait..." : authMode === "create" ? "Create Account" : "Sign In"}
              </button>
            </div>

            {activeAccount && (
              <div style={{ marginTop: 14, padding: 12, borderRadius: 12, border: "1px solid rgba(148,163,184,0.22)", background: "rgba(15,23,42,0.55)" }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={connectSso} disabled={ssoBusy || activeAccount.ssoLinked} style={{ ...btnStyle(false), background: activeAccount.ssoLinked ? "rgba(52,211,153,0.2)" : "rgba(147,197,253,0.2)", color: activeAccount.ssoLinked ? "#34d399" : "#93c5fd", cursor: ssoBusy || activeAccount.ssoLinked ? "not-allowed" : "pointer", opacity: ssoBusy ? 0.75 : 1 }}>
                    {activeAccount.ssoLinked ? "Canvas Connected" : ssoBusy ? "Connecting..." : "Connect School SSO"}
                  </button>
                  <button onClick={syncCanvas} disabled={syncBusy} style={{ ...btnStyle(false), cursor: syncBusy ? "not-allowed" : "pointer", opacity: syncBusy ? 0.75 : 1 }}>
                    {syncBusy ? "Syncing..." : "Sync Canvas Profile"}
                  </button>
                </div>

                {activeAccount.canvasProfile && (
                  <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "rgba(148,163,184,0.12)", fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
                    <div><strong>Name:</strong> {activeAccount.canvasProfile.displayName}</div>
                    <div><strong>Email:</strong> {activeAccount.canvasProfile.primaryEmail}</div>
                    <div><strong>Canvas ID:</strong> {activeAccount.canvasProfile.canvasUserId}</div>
                    <div><strong>Last synced:</strong> {activeAccount.canvasLastSyncedAt ? new Date(activeAccount.canvasLastSyncedAt).toLocaleString() : "Never"}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: 10, minHeight: 22 }}>
              {accountMessage.type !== "idle" && (
                <span style={{
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: accountMessage.type === "success" ? "#34d399" : "#fca5a5",
                  color: accountMessage.type === "success" ? "#052e16" : "#7f1d1d",
                }}>
                  {accountMessage.text}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Form */}
      {showAdd && (
        <div style={{ maxWidth: 640, margin: "0 auto 20px", padding: "0 24px" }}>
          <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <input placeholder="Event title" value={newTitle} onChange={e => setNewTitle(e.target.value)} style={inputStyle} />
            <input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} style={inputStyle} />
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

      {showImportQrModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 34, background: "rgba(2,6,23,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 500, background: "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20, boxShadow: "0 24px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>Scan QR Code to Import Event</h3>
              </div>
              <button onClick={closeImportQrModal} style={{ background: "rgba(148,163,184,0.2)", border: "none", color: "#e2e8f0", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
                ✕
              </button>
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
                <span style={{
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: importMessage.type === "success" ? "#34d399" : "#fca5a5",
                  color: importMessage.type === "success" ? "#052e16" : "#7f1d1d",
                }}>
                  {importMessage.text}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Event List */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 && <p style={{ textAlign: "center", color: "#475569", padding: 40 }}>No events found. Add one above!</p>}
        {filtered.map(e => <EventCard key={e.id} event={e} onDelete={deleteEvent} onPin={pinEvent} onShowQr={openQrModal} />)}
      </div>

      {showQrModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 30, background: "rgba(2,6,23,0.82)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 480, background: "linear-gradient(145deg, rgba(30,41,59,0.95), rgba(15,23,42,0.95))", border: "1px solid rgba(148,163,184,0.2)", borderRadius: 16, padding: 20, boxShadow: "0 24px 50px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 2, color: "#818cf8", marginBottom: 6 }}>Ticket</div>
                <h3 style={{ margin: 0, fontSize: 18, lineHeight: 1.3 }}>{activeQrEvent?.title || "Selected Event"}</h3>
              </div>
              <button onClick={closeQrModal} style={{ background: "rgba(148,163,184,0.2)", border: "none", color: "#e2e8f0", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 14, borderRadius: 12, border: "1px solid rgba(148,163,184,0.25)", background: "#020617", padding: 24, display: "flex", justifyContent: "center" }}>
              {activeQrEvent && (
                <QRCodeSVG
                  value={activeQrEvent.qrCodeValue}
                  size={240}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                  level="M"
                  includeMargin
                />
              )}
            </div>

            <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={activeQrEvent?.qrCodeValue || ""}
                readOnly
                style={{ ...inputStyle, flex: 1, fontWeight: 700, letterSpacing: 0.8 }}
              />
              <button
                onClick={copyQrCode}
                style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Copy Ticket Code
              </button>
            </div>

            <div style={{ marginTop: 10, minHeight: 22 }}>
              {copyMessage && (
                <span style={{
                  display: "inline-block",
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: 99,
                  background: copyMessage === "Ticket code copied" ? "#34d399" : "#fca5a5",
                  color: copyMessage === "Ticket code copied" ? "#052e16" : "#7f1d1d",
                }}>
                  {copyMessage}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function isValidSchoolEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}