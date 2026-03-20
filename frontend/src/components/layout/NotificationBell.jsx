import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ExternalLink, X } from 'lucide-react';
import api from '../../api/client';
import { formatDistanceToNow } from 'date-fns';

const TYPE_CONFIG = {
    approval_request: { color: '#4f8ef7', icon: '📋', label: 'Action Required' },
    rejection: { color: '#ef4444', icon: '❌', label: 'Rejected' },
    workflow_complete: { color: '#22c55e', icon: '✅', label: 'Completed' },
    info: { color: '#06b6d4', icon: '💡', label: 'Info' },
    warning: { color: '#f59e0b', icon: '⚠️', label: 'Warning' },
    alert: { color: '#a855f7', icon: '🔔', label: 'Alert' },
};

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [notifs, setNotifs] = useState([]);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef(null);

    const loadNotifs = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications?limit=15');
            setNotifs(res.data.data.notifications || []);
            setUnread(res.data.data.unreadCount || 0);
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadNotifs();
        const interval = setInterval(loadNotifs, 30000);
        return () => clearInterval(interval);
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const markRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`);
            setNotifs(ns => ns.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnread(c => Math.max(0, c - 1));
        } catch { }
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/mark-all-read');
            setNotifs(ns => ns.map(n => ({ ...n, isRead: true })));
            setUnread(0);
        } catch { }
    };

    const cfg = (type) => TYPE_CONFIG[type] || TYPE_CONFIG.info;

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Bell button */}
            <button
                className="btn btn-ghost btn-icon"
                style={{ position: 'relative' }}
                onClick={() => { setOpen(o => !o); if (!open) loadNotifs(); }}
                title="Notifications"
            >
                <Bell size={18} />
                {unread > 0 && (
                    <span style={{
                        position: 'absolute',
                        top: 2, right: 2,
                        background: '#ef4444',
                        color: '#fff',
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        borderRadius: 99,
                        minWidth: 16, height: 16,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '0 3px',
                        border: '2px solid var(--bg)',
                    }}>
                        {unread > 99 ? '99+' : unread}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 360,
                    background: 'var(--bg2)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    zIndex: 1000,
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid var(--border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Bell size={14} color="var(--accent)" />
                            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Notifications</span>
                            {unread > 0 && (
                                <span style={{
                                    background: '#ef4444',
                                    color: '#fff',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    borderRadius: 99,
                                    padding: '1px 6px',
                                }}>
                                    {unread} new
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                            {unread > 0 && (
                                <button
                                    className="btn btn-ghost btn-sm"
                                    style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                                    onClick={markAllRead}
                                >
                                    <CheckCheck size={11} /> Read all
                                </button>
                            )}
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setOpen(false)}>
                                <X size={13} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications list */}
                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {loading && notifs.length === 0 ? (
                            <div style={{ padding: 24, textAlign: 'center' }}>
                                <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto' }} />
                            </div>
                        ) : notifs.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text3)' }}>
                                <Bell size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                                <p style={{ fontSize: '0.875rem' }}>No notifications yet</p>
                            </div>
                        ) : (
                            notifs.map(n => {
                                const c = cfg(n.type);
                                return (
                                    <div
                                        key={n._id}
                                        onClick={() => { if (!n.isRead) markRead(n._id); }}
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: '1px solid var(--border)',
                                            background: n.isRead ? 'transparent' : 'rgba(79,142,247,0.04)',
                                            cursor: n.isRead ? 'default' : 'pointer',
                                            display: 'flex',
                                            gap: 12,
                                            alignItems: 'flex-start',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(79,142,247,0.04)'; }}
                                    >
                                        <div style={{
                                            width: 32, height: 32,
                                            background: `${c.color}18`,
                                            borderRadius: 8,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                            fontSize: '0.9rem',
                                        }}>
                                            {c.icon}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                                                <p style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)' }}>
                                                    {n.title}
                                                </p>
                                                {!n.isRead && (
                                                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 4 }} />
                                                )}
                                            </div>
                                            <p style={{ fontSize: '0.76rem', color: 'var(--text2)', marginTop: 2, lineHeight: 1.5 }}>
                                                {n.message}
                                            </p>
                                            <p style={{ fontSize: '0.68rem', color: 'var(--text3)', marginTop: 4 }}>
                                                {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }) : ''}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
