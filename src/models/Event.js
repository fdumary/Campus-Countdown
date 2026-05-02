class Event {
  constructor({ id, title, date, category = 'academic', pinned = false, qrCodeValue = null, isRegistered = false, isAttended = false, registeredAt = null, attendedAt = null, attendees = [] } = {}) {
    this.id = typeof id !== 'undefined' ? id : Date.now();
    this.title = String(title || '').trim();
    this.date = date || null;
    this.category = category === 'social' ? 'social' : 'academic';
    this.pinned = Boolean(pinned);
    this.qrCodeValue = qrCodeValue || Event.createQrCodeValue({ id: this.id, title: this.title });
    this.isRegistered = Boolean(isRegistered);
    this.isAttended = Boolean(isAttended);
    this.registeredAt = registeredAt || null;
    this.attendedAt = attendedAt || null;
    this.attendees = Array.isArray(attendees) ? attendees.slice() : [];
  }

  toObject() {
    return {
      id: this.id,
      title: this.title,
      date: this.date,
      category: this.category,
      pinned: this.pinned,
      qrCodeValue: this.qrCodeValue,
      isRegistered: this.isRegistered,
      isAttended: this.isAttended,
      registeredAt: this.registeredAt,
      attendedAt: this.attendedAt,
      attendees: this.attendees.slice(),
    };
  }

  static createQrCodeValue(event) {
    const slug = String((event && event.title) || '').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 18) || 'event';
    return `EVT-${event?.id || ''}-${slug}`.toUpperCase();
  }

  // Ticket code used in QR payloads: only the slug portion (lowercase, hyphenated)
  static createTicketCode(event) {
    return String((event && event.title) || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 18) || 'event';
  }

  static normalize(obj = {}) {
    const ev = new Event({
      id: obj.id || Date.now(),
      title: obj.title || obj.name || '',
      date: obj.date || obj.eventDate || null,
      category: (obj.category || 'academic'),
      pinned: Boolean(obj.pinned),
      qrCodeValue: obj.qrCodeValue || null,
      isRegistered: Boolean(obj.isRegistered),
      isAttended: Boolean(obj.isAttended),
      registeredAt: obj.registeredAt || null,
      attendedAt: obj.attendedAt || null,
      attendees: Array.isArray(obj.attendees) ? obj.attendees.slice() : [],
    });

    if (!ev.qrCodeValue) ev.qrCodeValue = Event.createQrCodeValue(ev);
    return ev.toObject();
  }

  static parseFromQrPayload(rawPayload) {
    const raw = String(rawPayload || '').trim();
    if (!raw) throw new Error('QR payload is empty.');

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error('Unsupported QR format. Use event QR JSON payload.');
    }

    if (parsed && parsed.app && parsed.app !== 'campus-countdown') {
      throw new Error('QR code is not from Campus Countdown.');
    }

    const content = (parsed.type === 'event' && parsed.event) ? parsed.event : parsed;

    const title = String(content.title || content.eventTitle || '').trim();
    const date = String(content.date || content.eventDate || '').trim();
    const categoryRaw = String(content.category || 'academic').toLowerCase();
    const category = categoryRaw === 'social' ? 'social' : 'academic';
    const ticketCode = String(parsed.ticketCode || parsed.qrCodeValue || content.ticketCode || '').trim();

    if (!title) throw new Error('QR event payload is missing a title.');
    if (!date || Number.isNaN(new Date(date).getTime())) throw new Error('QR event payload has an invalid date.');

    return {
      title,
      date,
      category,
      qrCodeValue: ticketCode || null,
    };
  }
}

export default Event;
