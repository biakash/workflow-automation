import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

/**
 * useWorkflows — fetches and manages workflow list
 * @param {object} options - { status, category, search, autoFetch }
 */
export function useWorkflows({ status = '', category = '', search = '', autoFetch = true } = {}) {
  const [workflows, setWorkflows] = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status)   params.append('status', status);
      if (category) params.append('category', category);
      if (search)   params.append('search', search);
      const res = await api.get(`/workflows?${params}`);
      setWorkflows(res.data.data.workflows);
      setTotal(res.data.data.total);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, [status, category, search]);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [fetch, autoFetch]);

  const createWorkflow = async (data) => {
    const res = await api.post('/workflows', data);
    await fetch();
    return res.data.data.workflow;
  };

  const updateWorkflow = async (id, data) => {
    const res = await api.put(`/workflows/${id}`, data);
    await fetch();
    return res.data.data.workflow;
  };

  const deleteWorkflow = async (id) => {
    await api.delete(`/workflows/${id}`);
    await fetch();
  };

  const setStatus = async (id, newStatus) => {
    await api.patch(`/workflows/${id}/status`, { status: newStatus });
    await fetch();
  };

  return { workflows, total, loading, error, refetch: fetch, createWorkflow, updateWorkflow, deleteWorkflow, setStatus };
}