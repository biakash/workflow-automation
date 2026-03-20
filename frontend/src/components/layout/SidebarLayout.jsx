import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Zap, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';
import NotificationBell from './NotificationBell';

export default function SidebarLayout({ navItems, children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchNotifs = () => {
      api.get('/notifications?isRead=false&limit=1')
        .then(res => setUnread(res.data.data.unreadCount || 0))
        .catch(() => { });
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const roleColors = { admin: 'var(--purple)', manager: 'var(--cyan)', employee: 'var(--accent)', finance: 'var(--green)' };
  const roleColor = roleColors[user?.role] || 'var(--accent)';

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'var(--accent-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={16} color="var(--accent)" />
            </div>
            <span className="logo-text">Flow<span>Forge</span></span>
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge" style={{ background: `${roleColor}18`, color: roleColor, fontSize: '0.68rem', padding: '2px 8px' }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            if (item.type === 'section') {
              return <div key={item.label} className="sidebar-section">{item.label}</div>;
            }
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                {item.label === 'Notifications' && unread > 0 && (
                  <span className="nav-badge">{unread > 99 ? '99+' : unread}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar" style={{ background: `${roleColor}18`, color: roleColor }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
            <button onClick={handleLogout} className="btn btn-ghost btn-icon btn-sm" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {/* Top bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '8px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}>
          <NotificationBell />
        </div>
        {children}
      </main>
    </div>
  );
}