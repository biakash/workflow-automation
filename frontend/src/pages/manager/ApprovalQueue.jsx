import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, XCircle, X, MessageSquare, RefreshCw, Clock, User, FileText } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import ExecutionTracker from '../../components/workflow/ExecutionTracker';
import { useAuth } from '../../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const PRIORITY_BADGE = {
  urgent: 'badge-red',
  high: 'badge-yellow',
  normal: 'badge-blue',
  low: 'badge-gray',
};

export default function ApprovalQueue() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // { task, execution }
  const [comment, setComment] = useState('');
  const [reason, setReason] = useState('');
  const [acting, setActing] = useState(false);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/tasks?role=${user.role}&status=pending`);
      setTasks(res.data.data?.tasks || []);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [user.role]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const openTask = async (task) => {
    try {
      // executionId may be a populated object (from .populate()) or a raw string
      const execId = task.executionId?._id || task.executionId;
      const res = await api.get(`/executions/${execId}`);
      setSelected({ task, execution: res.data.data.execution });
      setComment('');
      setReason('');
    } catch {
      toast.error('Failed to load execution details');
    }
  };

  const act = async (action) => {
    if (!selected) return;
    setActing(true);
    try {
      await api.post(`/executions/${selected.execution._id}/action`, {
        action,
        comment,
        reason,
      });
      toast.success(`Step ${action} ✓`);
      setSelected(null);
      loadTasks();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Task Queue</h1>
          <p className="page-subtitle">
            {tasks.length} pending task{tasks.length !== 1 ? 's' : ''} assigned to your role
            {' '}(<strong style={{ textTransform: 'capitalize' }}>{user.role}</strong>)
          </p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadTasks}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state card">
          <CheckCircle size={40} color="var(--green)" />
          <p className="font-semibold" style={{ marginTop: 12 }}>All clear!</p>
          <p className="text-sm text-muted">No pending tasks for your role right now</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tasks.map(task => (
            <div
              key={task._id}
              className="card"
              style={{ cursor: 'pointer', transition: 'all 0.18s' }}
              onClick={() => openTask(task)}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{task.workflowName}</span>
                    <span className="badge badge-yellow">⏳ Needs Action</span>
                    {task.priority && (
                      <span className={`badge ${PRIORITY_BADGE[task.priority] || 'badge-gray'}`} style={{ fontSize: '0.65rem' }}>
                        {task.priority}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text2)' }}>
                      <FileText size={12} color="var(--accent)" />
                      Step: <strong>{task.stepName}</strong>
                    </div>
                    {task.submittedBy && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.8rem', color: 'var(--text2)' }}>
                        <User size={12} color="var(--text3)" />
                        {task.submittedBy?.name || 'Unknown'}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.75rem', color: 'var(--text3)' }}>
                      <Clock size={11} />
                      {task.createdAt ? formatDistanceToNow(new Date(task.createdAt), { addSuffix: true }) : ''}
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={e => { e.stopPropagation(); openTask(task); }}
                >
                  <FileText size={13} /> Review →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontWeight: 700 }}>{selected.task.workflowName}</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }}>
                  Step: <strong>{selected.task.stepName}</strong>
                  {selected.task.submittedBy?.name && (
                    <> · Submitted by: {selected.task.submittedBy?.name}</>
                  )}
                </p>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              {/* Action required banner */}
              <div style={{
                background: 'var(--accent-bg)',
                border: '1px solid rgba(79,142,247,0.25)',
                borderRadius: 10,
                padding: '12px 16px',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Action Required: {selected.task.stepName}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 2 }}>
                    Assigned to: <span style={{ textTransform: 'capitalize', color: 'var(--accent)' }}>{selected.task.assignedRole}</span>
                  </p>
                </div>
              </div>

              {/* Form Data */}
              {selected.task.formData && Object.keys(selected.task.formData).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 10 }}>Submitted Form Data</p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 8,
                    background: 'var(--bg3)',
                    borderRadius: 10,
                    padding: 12,
                  }}>
                    {Object.entries(selected.task.formData).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{key}</span>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600 }}>{String(val) || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Workflow Progress */}
              {selected.execution && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 10 }}>Workflow Progress</p>
                  <ExecutionTracker
                    steps={selected.execution.steps || []}
                    nodeHistory={selected.execution.nodeHistory || []}
                    rejectionReason={selected.execution.rejectionReason}
                  />
                </div>
              )}

              {/* Comment & Reason */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="input-group">
                  <label className="input-label">
                    <MessageSquare size={12} style={{ display: 'inline', marginRight: 4 }} />
                    Reason (for rejection)
                  </label>
                  <input
                    className="input"
                    placeholder="Explain the reason for rejection..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Comment (optional)</label>
                  <textarea
                    className="textarea"
                    placeholder="Add any notes or comments..."
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    style={{ minHeight: 70 }}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
              <button
                className="btn btn-danger"
                onClick={() => act('rejected')}
                disabled={acting}
              >
                {acting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <XCircle size={14} />}
                Reject
              </button>
              <button
                className="btn btn-success"
                onClick={() => act('approved')}
                disabled={acting}
              >
                {acting ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <CheckCircle size={14} />}
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}