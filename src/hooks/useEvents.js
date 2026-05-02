import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { normalizeEvent, parseEventFromQrPayload, INITIAL_EVENTS } from "../utils/events";
import { getTimeLeft } from "../utils/countdown";
import { updateAccountRecord } from "../services/auth";

export function useEvents(activeAccount) {
  const [events, setEvents] = useState(() => {
    if (!activeAccount) return [];
    const saved = activeAccount.events;
    if (!saved) return [];
    try {
      if (!Array.isArray(saved)) return [];
      return saved.map(normalizeEvent);
    } catch {
      return [];
    }
  });

  // When activeAccount changes, load its events
  useEffect(() => {
    if (!activeAccount) {
      setEvents([]);
      return;
    }
    const saved = activeAccount.events || [];
    if (!Array.isArray(saved)) {
      setEvents([]);
      return;
    }
    setEvents(saved.map(normalizeEvent));
  }, [activeAccount]);

  // Persist events back to the user's account when they change
  useEffect(() => {
    if (!activeAccount) return;
    try {
      updateAccountRecord(activeAccount.id, { events });
    } catch {
      // ignore
    }
  }, [events, activeAccount]);

  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCat, setNewCat] = useState("academic");
  const [showImportQrModal, setShowImportQrModal] = useState(false);
  const [importMessage, setImportMessage] = useState({ type: "idle", text: "" });
  const [importCameraState, setImportCameraState] = useState("idle");
  const importScannerRef = useRef(null);
  const importScanLockRef = useRef(false);
  const [scannerMode, setScannerMode] = useState("import"); // 'import' | 'attend'
  const [scanningEventId, setScanningEventId] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [activeQrEventId, setActiveQrEventId] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");
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
    setImportMessage({ type: "idle", text: "" });
    setImportCameraState("idle");
  }, []);

  const openImportQrModal = useCallback(() => {
    setScannerMode('import');
    setScanningEventId(null);
    setImportMessage({ type: "idle", text: "" });
    setImportCameraState("loading");
    setShowImportQrModal(true);
  }, []);

  const openScannerForEvent = useCallback((eventId) => {
    setScannerMode('attend');
    setScanningEventId(eventId || null);
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
        attendees: [],
      });
      return [...current, nextEvent];
    });
    setImportMessage({ type: "success", text: "Event added from QR payload." });
    setShowAdd(false);
    window.setTimeout(() => { closeImportQrModal(); }, 900);
  }, [closeImportQrModal]);

  const createAttendanceFromQr = useCallback((rawPayload) => {
    const code = String(rawPayload || '').trim();
    if (!code) {
      setImportMessage({ type: 'error', text: 'Scanned empty QR.' });
      return;
    }

    setEvents((current) => {
      let found = false;
      const next = current.map((ev) => {
        if (scanningEventId && ev.id === scanningEventId) {
          // target event - record attendance if not already recorded for this ticket
          const exists = (ev.attendees || []).some(a => a.ticketCode === code);
          if (!exists) {
            const attendee = { id: `att-${Date.now()}`, scannedAt: new Date().toISOString(), ticketCode: code };
            found = true;
            return { ...ev, attendees: [...(ev.attendees || []), attendee] };
          }
        }
        // fallback: if no scanningEventId provided, match by qrCodeValue
        if (!scanningEventId && ev.qrCodeValue === code) {
          const exists = (ev.attendees || []).some(a => a.ticketCode === code);
          if (!exists) {
            const attendee = { id: `att-${Date.now()}`, scannedAt: new Date().toISOString(), ticketCode: code };
            found = true;
            return { ...ev, attendees: [...(ev.attendees || []), attendee] };
          }
        }
        return ev;
      });

      if (!found) {
        setImportMessage({ type: 'error', text: 'No matching event found for scanned ticket.' });
      } else {
        setImportMessage({ type: 'success', text: 'Attendance recorded.' });
        // auto-close after short delay
        window.setTimeout(() => { closeImportQrModal(); }, 900);
      }

      return next;
    });
  }, [scanningEventId, closeImportQrModal]);

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
        if (!cameras.length) throw new Error("No camera available.");

        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (importScanLockRef.current) return;
            importScanLockRef.current = true;
            try {
              if (scannerMode === 'import') {
                createEventFromQr(decodedText);
              } else {
                createAttendanceFromQr(decodedText);
              }
            } catch (error) {
              setImportMessage({ type: "error", text: error.message || "Could not process QR." });
            } finally {
              window.setTimeout(() => { importScanLockRef.current = false; }, 1000);
            }
          },
          () => {}
        );

        if (isMounted) setImportCameraState("ready");
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
      liveScanner.stop().catch(() => {}).finally(() => { liveScanner.clear().catch(() => {}); });
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
  const nearest = upcoming.length
    ? upcoming.reduce((a, b) => (getTimeLeft(a.date)?.total || Infinity) < (getTimeLeft(b.date)?.total || Infinity) ? a : b)
    : null;
  const nearestTime = nearest ? getTimeLeft(nearest.date) : null;

  return {
    setEvents,
    filter, setFilter,
    showAdd, setShowAdd,
    newTitle, setNewTitle,
    newDate, setNewDate,
    newCat, setNewCat,
    showImportQrModal, importMessage, importCameraState,
    showQrModal, activeQrEvent, copyMessage,
    filtered, nearest, nearestTime,
    addEvent, deleteEvent, pinEvent,
    openImportQrModal, closeImportQrModal,
    openQrModal, closeQrModal, copyQrCode,
    // organizer scanner
    openScannerForEvent,
    scanningEventId,
    scannerMode,
  };
}

