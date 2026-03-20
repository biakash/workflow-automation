import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

/**
 * useNotifications — fetches notifications with optional polling
 * @param {object} options - { pollInterval ms, autoFetch }
 */
export function useNotifications({ pollInterval = 30000, autoFetch = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const [loading, setLoading]             = useState(false);

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount || 0);
    } catch {}
  }, []);

  useEffect(() => {
    if (!autoFetch) return;
    setLoading(true);
    fetch().finally(() => setLoading(false));
    const timer = setInterval(fetch, pollInterval);
    return () => clearInterval(timer);
  }, [fetch, autoFetch, pollInterval]);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/mark-all-read');
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  return { notifications, unreadCount, loading, refetch: fetch, markRead, markAllRead };
}