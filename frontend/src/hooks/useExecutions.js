import { useState, useEffect, useCallback } from 'react';
import api from '../api/client';

/**
 * useExecutions — fetches and manages execution list
 * @param {object} options - { status, workflowId, myOnly, autoFetch }
 */
export function useExecutions({ status = '', workflowId = '', myOnly = false, autoFetch = true } = {}) {
  const [executions, setExecutions] = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status)     params.append('status', status);
      if (workflowId) params.append('workflowId', workflowId);
      if (myOnly)     params.append('myOnly', 'true');
      const res = await api.get(`/executions?${params}`);
      setExecutions(res.data.data.executions);
      setTotal(res.data.data.total);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load executions');
    } finally {
      setLoading(false);
    }
  }, [status, workflowId, myOnly]);

  useEffect(() => {
    if (autoFetch) fetch();
  }, [fetch, autoFetch]);

  const startExecution = async (workflowId, inputData = {}, priority = 'normal') => {
    const res = await api.post(`/workflows/${workflowId}/execute`, { inputData, priority });
    await fetch();
    return res.data.data.execution;
  };

  const cancelExecution = async (id, reason = '') => {
    await api.post(`/executions/${id}/cancel`, { reason });
    await fetch();
  };

  const retryExecution = async (id) => {
    await api.post(`/executions/${id}/retry`);
    await fetch();
  };

  const processAction = async (id, action, comment = '') => {
    const res = await api.post(`/executions/${id}/action`, { action, comment });
    await fetch();
    return res.data.data.execution;
  };

  return {
    executions, total, loading, error,
    refetch: fetch,
    startExecution, cancelExecution, retryExecution, processAction,
  };
}