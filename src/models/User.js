class User {
  constructor({ id, fullName, schoolEmail, password, createdAt, googleCalendarLinked = false, userType = 'user', events = [] } = {}) {
    this._id = id || `acct-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    this._fullName = String(fullName || '').trim();
    this._schoolEmail = String(schoolEmail || '').trim().toLowerCase();
    this._password = typeof password !== 'undefined' ? password : null;
    this._createdAt = createdAt || new Date().toISOString();
    this._googleCalendarLinked = Boolean(googleCalendarLinked);
    // userType: 'user' | 'organizer' | 'admin'
    this._userType = userType;
    this._events = Array.isArray(events) ? events.slice() : [];
  }

  // Getters and setters
  get id() {
    return this._id;
  }
  set id(value) {
    this._id = String(value);
  }

  get fullName() {
    return this._fullName;
  }
  set fullName(value) {
    this._fullName = String(value || '').trim();
  }

  get schoolEmail() {
    return this._schoolEmail;
  }
  set schoolEmail(value) {
    this._schoolEmail = String(value || '').trim().toLowerCase();
  }

  get password() {
    return this._password;
  }
  set password(value) {
    this._password = typeof value !== 'undefined' ? value : null;
  }

  get createdAt() {
    return this._createdAt;
  }
  set createdAt(value) {
    this._createdAt = value || new Date().toISOString();
  }

  get googleCalendarLinked() {
    return this._googleCalendarLinked;
  }
  set googleCalendarLinked(value) {
    this._googleCalendarLinked = Boolean(value);
  }

  get userType() {
    return this._userType;
  }
  set userType(value) {
    this._userType = value;
  }

  get events() {
    return this._events.slice();
  }
  set events(value) {
    this._events = Array.isArray(value) ? value.slice() : [];
  }

  isOrganizer() {
    return this.userType === 'organizer';
  }

  isUser() {
    return this.userType === 'user';
  }

  isAdmin() {
    return this.userType === 'admin';
  }

  toJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      schoolEmail: this.schoolEmail,
      password: this.password,
      createdAt: this.createdAt,
      googleCalendarLinked: this.googleCalendarLinked,
      userType: this.userType,
      events: this.events,
    };
  }

  sanitize() {
    const { password, ...rest } = this.toJSON();
    return rest;
  }

  static fromObject(obj = {}) {
    if (obj instanceof User) return obj;
    return new User(obj);
  }
}

export default User;
