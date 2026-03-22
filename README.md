# 🎓 Campus Event Countdown Hub

A real-time countdown application that helps students stay on top of deadlines and campus events through **Live Urgency Awareness** — replacing traditional calendar views with dynamic, ticking countdowns that make time feel real.

Built for **CEN 5035-042 Software Engineering**.

## 🚀 Live Demo

[View Deployed App](https://campus-countdown.vercel.app)

> Replace the link above with your actual Vercel URL.

## 📸 Features

- **Dynamic Countdown Engine** — Real-time countdowns (days, hours, minutes, seconds) for every event
- **Urgency-Based Visual System** — Cards automatically change color based on how soon the deadline is:
  - 🔴 **Critical** (< 24 hours) — Red, pulsing animation
  - 🟠 **Urgent** (< 3 days) — Amber
  - 🔵 **Soon** (< 7 days) — Blue
  - ⚫ **Relaxed** (7+ days) — Dark
- **Filtered Event Feed** — Toggle between All, Academic, and Social events
- **Custom Deadlines** — Add your own events with title, date/time, and category
- **Pin & Delete** — Star important events to pin them to the top
- **Attendee Ticket** — Generate and display QR code tickets that are scanned at check-in
- **On-Site Account Creation** — Students can create a local attendee account directly at the event
- **Optional School SSO Link** — Students can optionally connect their school SSO account
- **Canvas Profile Sync (Mock)** — Canvas profile details sync through a backend-ready frontend contract
- **Local Storage Persistence** — Custom events are saved across browser sessions
- **Next Up Banner** — Highlights the nearest upcoming deadline at the top

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React | UI components and state management |
| Tailwind CSS | Utility-first styling |
| Vite | Build tool and dev server |
| Vercel | Deployment and hosting |
| localStorage | Client-side data persistence |

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or later)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/campus-countdown.git
   cd campus-countdown
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open `http://localhost:5173` in your browser.

## 📁 Project Structure

```
campus-countdown/
├── public/
├── src/
│   ├── App.jsx          # Main countdown component
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind import
├── index.html
├── vite.config.js       # Vite + Tailwind config
├── package.json
└── README.md
```

## 🧠 Concept: Live Urgency Awareness

Traditional calendars show dates — this app shows **time remaining**. By visualizing urgency through color, animation, and real-time ticking, students can:

- **Prioritize** tasks based on visual urgency cues
- **Plan ahead** by seeing exactly how much time is left
- **Reduce stress** by staying aware of upcoming deadlines
- **Balance** academic responsibilities with social events

## 📱 Ticket QR Flow

- Select an event card and press **Show Ticket**
- A unique ticket QR code is rendered in a modal for attendees to open on their phone
- Event organizers or volunteers can scan the attendee ticket at check-in
- The ticket code can also be copied and shared directly

## 👤 Account + SSO Flow

- Open **Create Account** to create an attendee profile
- Sign in to an existing account on the same device
- Optionally choose **Connect School SSO** to link Canvas credentials
- Use **Sync Canvas Profile** to refresh Canvas profile and calendar data

## 📄 License

This project is built for educational purposes as part of CEN 5035-042 Software Engineering.