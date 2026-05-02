import { useState, useEffect } from "react";
import { getTimeLeft, getUrgency } from "../utils/countdown";
import { urgencyStyles, categoryColors } from "../constants/styles";
import CountdownUnit from "./CountdownUnit";

export default function EventCard({ event, onDelete, onPin, onShowQr, isOrganizer = false, onOpenScanner }) {
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
      position: "relative", overflow: "hidden", opacity: (isPast && !isOrganizer) ? 0.5 : 1,
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
          {isOrganizer ? (
            <button
              onClick={() => onOpenScanner && onOpenScanner(event.id)}
              style={{ background: "rgba(255,255,255,0.12)", border: "none", color: s.text, borderRadius: 8, padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}
              title="Open Scanner"
            >
              Open Scanner
            </button>
          ) : (
            <button
              onClick={() => onShowQr(event.id)}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", color: s.text, borderRadius: 8, padding: "0 10px", height: 32, cursor: "pointer", fontSize: 11, fontWeight: 700, letterSpacing: 0.4 }}
              title="Show Ticket"
            >
              Show Ticket
            </button>
          )}
          <button onClick={() => onPin(event.id)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: s.text, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }} title="Pin">
            {event.pinned ? "★" : "☆"}
          </button>
          <button onClick={() => onDelete(event.id)} style={{ background: "rgba(255,255,255,0.15)", border: "none", color: s.text, borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14 }} title="Delete">
            ✕
          </button>
        </div>
      </div>
      {/* Attendee count - visible only to organizers */}
      {isOrganizer && event.attendees && typeof event.attendees.length === 'number' && (
        <div style={{ position: 'absolute', right: 12, bottom: 12, fontSize: 12, color: s.text, opacity: 0.9 }}>
          Attendees: <strong style={{ marginLeft: 6 }}>{(event.attendees || []).length}</strong>
        </div>
      )}

      {isOrganizer && event.attendees && event.attendees.length > 0 && (
        <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.04)', padding: 8, borderRadius: 8 }}>
          <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 6 }}>Attendees</div>
          {(event.attendees || []).slice().reverse().map(a => (
            <div key={a.id} style={{ fontSize: 12, color: s.text, opacity: 0.9, marginBottom: 4 }}>
              {a.userFullName ? `${a.userFullName} (${a.userEmail || 'no-email'})` : `${a.ticketCode}`}
            </div>
          ))}
        </div>
      )}

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
