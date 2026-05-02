import React, { useState, useEffect } from "react";
import { getAllAccounts, deleteAccount, createLocalAccount } from "../services/auth";

export default function AdminPage({ onSignOut, adminName }) {
  const [accounts, setAccounts] = useState([]);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newUserType, setNewUserType] = useState('user');

  useEffect(() => {
    setAccounts(getAllAccounts());
  }, []);

  const total = accounts.length;
  const byType = accounts.reduce((acc, a) => {
    const t = a.userType || 'user';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  // Do not display admin accounts in the users table
  const displayedAccounts = accounts.filter((a) => a.userType !== 'admin');

  const handleDelete = (id, name) => {
    const acct = accounts.find((a) => a.id === id);
    if (acct && acct.userType === 'admin') {
      window.alert('Cannot delete admin accounts.');
      return;
    }

    if (!window.confirm(`Delete user ${name || id}? This action cannot be undone.`)) return;
    deleteAccount(id);
    setAccounts(getAllAccounts());
  };

  const handleCreateUser = () => {
    if (!newEmail || !newPassword) {
      window.alert('Email and password are required.');
      return;
    }

    try {
      createLocalAccount({ fullName: newFullName, schoolEmail: newEmail, password: newPassword, userType: newUserType });
      setAccounts(getAllAccounts());
      setNewFullName(''); setNewEmail(''); setNewPassword(''); setNewUserType('user');
      window.alert('User created successfully.');
    } catch (err) {
      window.alert(err.message || 'Could not create user.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1a', color: '#e2e8f0', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", padding: 40 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
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

        <div style={{ marginTop: 28, padding: 16, borderRadius: 8, background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Create new user</h3>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input value={newFullName} onChange={(e) => setNewFullName(e.target.value)} placeholder="Full name" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', background: 'transparent', color: '#e2e8f0', minWidth: 200 }} />
            <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Email" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', background: 'transparent', color: '#e2e8f0', minWidth: 220 }} />
            <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Password" type="password" style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', background: 'transparent', color: '#e2e8f0', minWidth: 160 }} />
            <select value={newUserType} onChange={(e) => setNewUserType(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.04)', background: 'white', color: 'black' }}>
              <option value="user">User</option>
              <option value="organizer">Organizer</option>
            </select>
            <button onClick={handleCreateUser} style={{ padding: '8px 12px', borderRadius: 6, background: '#10b981', color: '#fff', border: 'none' }}>Create</button>
          </div>
        </div>

        <div style={{ marginTop: 32 }}>
          <h2 style={{ margin: '0 0 12px 0' }}>Users</h2>

          {displayedAccounts.length === 0 ? (
            <p style={{ color: '#94a3b8' }}>No users found.</p>
          ) : (
            <div style={{ overflowX: 'auto', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>Name</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>Username</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>Type</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Events</th>
                    <th style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedAccounts.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.02)' }}>
                      <td style={{ padding: '12px 16px' }}>{a.fullName || '-'}</td>
                      <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>{a.schoolEmail}</td>
                      <td style={{ padding: '12px 16px' }}>{a.userType}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>{(a.events && a.events.length) || 0}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => handleDelete(a.id, a.fullName)} style={{ padding: '6px 10px', borderRadius: 6, background: '#ef4444', color: '#fff', border: 'none' }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
