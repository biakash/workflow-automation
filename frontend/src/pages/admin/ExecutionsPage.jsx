import React, { useEffect, useState } from 'react';
import { RefreshCw, X, RotateCcw, StopCircle, FileText, Play } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import ExecutionTracker from '../../components/workflow/ExecutionTracker';
import { formatDistanceToNow } from 'date-fns';

export default function ExecutionsPage() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [detailEx, setDetailEx] = useState(null);
  const [logs, setLogs] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchExecutions = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const res = await api.get(`/executions${params}`);
      setExecutions(res.data.data.executions);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchExecutions(); }, [statusFilter]);

  const openDetail = async (ex) => {
    setDetailLoading(true);
    setDetailEx(ex);
    setLogs([]);
    try {
      const res = await api.get(`/executions/${ex._id}`);
      setDetailEx(res.data.data.execution);
      setLogs(res.data.data.logs || []);
    } catch { toast.error('Failed to load details'); }
    finally { setDetailLoading(false); }
  };

  const cancel = async (id) => {
    if (!confirm('Cancel this execution?')) return;
    try {
      await api.post(`/executions/${id}/cancel`, { reason: 'Cancelled by admin' });
      toast.success('Execution cancelled');
      fetchExecutions();
      if (detailEx?._id === id) setDetailEx(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const retry = async (id) => {
    try {
      await api.post(`/executions/${id}/retry`);
      toast.success('Retry initiated');
      fetchExecutions();
      setDetailEx(null);
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const LOG_COLORS = { info: 'var(--text2)', success: 'var(--green)', warning: 'var(--yellow)', error: 'var(--red)' };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Executions</h1>
          <p className="page-subtitle">Monitor and manage all workflow runs</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <select className="select" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {['running', 'completed', 'failed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={fetchExecutions}><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Execution ID</th>
                <th>Workflow</th>
                <th>Version</th>
                <th>Status</th>
                <th>Started By</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8}><div className="empty-state"><div className="spinner" /></div></td></tr>
              ) : executions.length === 0 ? (
                <tr><td colSpan={8}><div className="empty-state"><Play size={32} /><p>No executions found</p></div></td></tr>
              ) : executions.map((ex) => (
                <tr key={ex._id}>
                  <td>
                    <span className="mono" style={{ color: 'var(--accent2)', fontSize: '0.75rem' }}>
                      {ex.executionId?.slice(0, 12)}...
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{ex.workflowName}</td>
                  <td><span className="badge badge-purple">{ex.workflowVersion}</span></td>
                  <td><StatusBadge status={ex.status} /></td>
                  <td>{ex.startedBy?.name || '—'}</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                    {ex.startTime ? new Date(ex.startTime).toLocaleString() : '—'}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                    {ex.endTime ? new Date(ex.endTime).toLocaleString() : <span style={{ color: 'var(--yellow)' }}>In progress</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title="View Logs" onClick={() => openDetail(ex)}>
                        <FileText size={13} />
                      </button>
                      {ex.status === 'failed' && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Retry" onClick={() => retry(ex._id)}>
                          <RotateCcw size={13} color="var(--yellow)" />
                        </button>
                      )}
                      {['running', 'pending'].includes(ex.status) && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Cancel" onClick={() => cancel(ex._id)}>
                          <StopCircle size={13} color="var(--red)" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail / Logs Modal */}
      {detailEx && (
        <div className="modal-overlay" onClick={() => setDetailEx(null)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontWeight: 700 }}>Execution Details</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }} className="mono">{detailEx.executionId}</p>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDetailEx(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ gap: 20 }}>
              {/* Meta */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Workflow', detailEx.workflowName],
                  ['Version', detailEx.workflowVersion],
                  ['Status', null],
                  ['Started By', detailEx.startedBy?.name],
                ].map(([label, val]) => (
                  <div key={label}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</p>
                    {label === 'Status' ? <StatusBadge status={detailEx.status} /> : <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>{val || '—'}</p>}
                  </div>
                ))}
              </div>

              {detailEx.errorMessage && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.82rem', color: 'var(--red)' }}>
                  {detailEx.errorMessage}
                </div>
              )}

              {/* Progress Tracker */}
              <div>
                <p style={{ fontWeight: 700, marginBottom: 14 }}>Step Progress</p>
                {detailLoading ? <div className="spinner" /> : <ExecutionTracker steps={detailEx.steps || []} />}
              </div>

              {/* Logs */}
              {logs.length > 0 && (
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 10 }}>Activity Logs</p>
                  <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 16px', maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {logs.map((log, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, fontSize: '0.78rem' }}>
                        <span style={{ color: 'var(--text3)', flexShrink: 0, fontFamily: 'var(--mono)', fontSize: '0.7rem' }}>
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                        <span style={{ color: LOG_COLORS[log.level] || 'var(--text2)' }}>{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              {detailEx.status === 'failed' && (
                <button className="btn btn-ghost" style={{ color: 'var(--yellow)' }} onClick={() => retry(detailEx._id)}>
                  <RotateCcw size={14} /> Retry Failed Step
                </button>
              )}
              {['running', 'pending'].includes(detailEx.status) && (
                <button className="btn btn-danger" onClick={() => cancel(detailEx._id)}>
                  <StopCircle size={14} /> Cancel
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => setDetailEx(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}