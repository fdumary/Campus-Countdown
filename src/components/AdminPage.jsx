import React from "react";
import { getAllAccounts } from "../services/auth";

export default function AdminPage({ onSignOut, adminName }) {
  const accounts = getAllAccounts();
  const total = accounts.length;
  const byType = accounts.reduce((acc, a) => {
    const t = a.userType || 'user';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1a', color: '#e2e8f0', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: 40 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>Admin Dashboard</h1>
          <div>
            <strong style={{ marginRight: 12 }}>{adminName}</strong>
            <button onClick={onSignOut} style={{ padding: '8px 12px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none' }}>Sign Out</button>
          </div>
        </div>

        <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div style={{ padding: 20, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Total users</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{total}</div>
          </div>

          <div style={{ padding: 20, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Regular users</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{byType['user'] || 0}</div>
          </div>

          <div style={{ padding: 20, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Event organizers</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{byType['organizer'] || 0}</div>
          </div>

          <div style={{ padding: 20, borderRadius: 8, background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>Admins</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{byType['admin'] || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
