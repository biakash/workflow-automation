import React, { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api/client';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const TYPE_ICON = {
  approval_request: { Icon: AlertTriangle, color: 'var(--yellow)' },
  approval_done:    { Icon: CheckCircle,   color: 'var(--green)' },
  rejection:        { Icon: XCircle,       color: 'var(--red)' },
  workflow_complete:{ Icon: CheckCircle,   color: 'var(--green)' },
  workflow_failed:  { Icon: XCircle,       color: 'var(--red)' },
  info:             { Icon: Info,          color: 'var(--accent)' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unread, setUnread] = useState(0);

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unreadCount);
    } catch (e) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifs(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnread(p => Math.max(0, p - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/mark-all-read');
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
    toast.success('All notifications marked as read');
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unread} unread notification{unread !== 1 ? 's' : ''}</p>
        </div>
        {unread > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : notifications.length === 0 ? (
        <div className="empty-state card">
          <Bell size={40} />
          <p className="font-semibold">No notifications</p>
          <p className="text-sm text-muted">You're all caught up!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => {
            const { Icon, color } = TYPE_ICON[n.type] || TYPE_ICON.info;
            return (
              <div
                key={n._id}
                className="card card-sm"
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, cursor: 'pointer',
                  opacity: n.isRead ? 0.6 : 1,
                  borderColor: n.isRead ? 'var(--border)' : 'var(--border2)',
                  transition: 'all 0.15s',
                }}
                onClick={() => !n.isRead && markRead(n._id)}
              >
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={16} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{n.title}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text3)', flexShrink: 0 }}>
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 3 }}>{n.message}</p>
                </div>
                {!n.isRead && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}