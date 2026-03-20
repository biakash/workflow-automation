import React, { useEffect, useState, useRef, useCallback } from 'react';
import { GitBranch, X, CheckCircle, AlertCircle, FileText, Clock, RefreshCw, ArrowRight, CheckSquare } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import DynamicForm from '../../components/workflow/DynamicForm';
import ExecutionTracker from '../../components/workflow/ExecutionTracker';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

// ─── Status badge helper ──────────────────────────────────────────────────────
const STATUS_BADGE = {
    running: { cls: 'badge-blue', label: '⏳ In Progress' },
    completed: { cls: 'badge-green', label: '✅ Approved' },
    rejected: { cls: 'badge-red', label: '❌ Rejected' },
    cancelled: { cls: 'badge-gray', label: '🚫 Cancelled' },
    pending: { cls: 'badge-yellow', label: '⏸ Pending' },
};

// ─── Animated Progress Bar ────────────────────────────────────────────────────
function WorkflowProgressBar({ execution }) {
    const nodes = execution?.workflowId?.flowData?.nodes || [];
    const nodeHistory = execution?.nodeHistory || [];
    const status = execution?.status;

    if (nodes.length === 0 && nodeHistory.length === 0) return null;

    const total = Math.max(nodes.length, 1);
    const done = nodeHistory.length;
    const pct = status === 'completed' ? 100 : Math.min(Math.round((done / total) * 100), 95);
    const barColor = status === 'rejected' ? '#ef4444'
        : status === 'completed' ? '#22c55e'
            : '#4f8ef7';

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text2)' }}>
                    {status === 'completed' ? '🎉 Request Approved!' : status === 'rejected' ? '❌ Request Rejected' : '⏳ Processing...'}
                </span>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: barColor }}>{pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 4, background: 'var(--bg3)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                <div style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: barColor,
                    borderRadius: 4,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    boxShadow: status !== 'rejected' ? `0 0 8px ${barColor}80` : 'none',
                    ...(status === 'running' ? {
                        backgroundImage: `repeating-linear-gradient(
              -45deg, transparent, transparent 6px,
              rgba(255,255,255,0.12) 6px, rgba(255,255,255,0.12) 12px
            )`,
                        backgroundSize: '24px 24px',
                        animation: 'progress-stripe 1.2s linear infinite',
                    } : {}),
                }} />
            </div>
            {nodeHistory.length > 0 && (
                <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 6 }}>
                    {nodeHistory.length} step{nodeHistory.length !== 1 ? 's' : ''} processed
                    {execution.workflowId?.flowData?.nodes?.length
                        ? ` of ${execution.workflowId.flowData.nodes.length} total nodes`
                        : ''}
                </p>
            )}
        </div>
    );
}

// ─── Live Execution Panel (polls every 5 sec when running) ───────────────────
function LiveExecutionPanel({ executionId, onClose }) {
    const [execution, setExecution] = useState(null);
    const [loading, setLoading] = useState(true);
    const pollRef = useRef(null);

    const fetchExec = useCallback(async (id) => {
        try {
            const res = await api.get(`/executions/${id}`);
            const exec = res.data.data.execution;
            setExecution(exec);
            // Stop polling when terminal
            if (['completed', 'rejected', 'cancelled'].includes(exec.status)) {
                clearInterval(pollRef.current);
            }
        } catch {
            clearInterval(pollRef.current);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (!executionId) return;
        fetchExec(executionId);
        pollRef.current = setInterval(() => fetchExec(executionId), 5000);
        return () => clearInterval(pollRef.current);
    }, [executionId, fetchExec]);

    if (loading) return (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <div className="spinner" style={{ width: 28, height: 28, margin: '0 auto 10px' }} />
            <p style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>Loading progress...</p>
        </div>
    );

    if (!execution) return null;
    const s = STATUS_BADGE[execution.status] || STATUS_BADGE.pending;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Header status */}
            <div style={{
                background: execution.status === 'completed' ? 'var(--green-bg)'
                    : execution.status === 'rejected' ? 'var(--red-bg)'
                        : 'var(--accent-bg)',
                border: `1px solid ${execution.status === 'completed' ? 'rgba(34,197,94,0.25)' : execution.status === 'rejected' ? 'rgba(239,68,68,0.25)' : 'rgba(79,142,247,0.2)'}`,
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
            }}>
                {execution.status === 'completed' ? <CheckCircle size={20} color="var(--green)" />
                    : execution.status === 'rejected' ? <AlertCircle size={20} color="var(--red)" />
                        : <div style={{ width: 18, height: 18, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />}
                <div>
                    <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{execution.workflowName}</p>
                    <span className={`badge ${s.cls}`} style={{ marginTop: 4 }}>{s.label}</span>
                </div>
                <button
                    className="btn btn-ghost btn-icon btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => fetchExec(executionId)}
                    title="Refresh"
                >
                    <RefreshCw size={13} />
                </button>
            </div>

            {/* Animated progress bar */}
            <WorkflowProgressBar execution={execution} />

            {/* Rejection reason */}
            {execution.status === 'rejected' && execution.rejectionReason && (
                <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '12px 16px' }}>
                    <p style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Reason for Rejection</p>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{execution.rejectionReason}</p>
                </div>
            )}

            {/* Execution tracker */}
            <ExecutionTracker
                steps={execution.steps || []}
                nodeHistory={execution.nodeHistory || []}
                rejectionReason={execution.rejectionReason}
                rejectedAt={execution.rejectedAt}
            />

            {/* If running — show who is reviewing */}
            {execution.status === 'running' && (
                <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)' }}>
                    <Clock size={14} color="var(--yellow)" />
                    <p style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                        Waiting for <strong style={{ color: 'var(--yellow)' }}>reviewer action</strong>. This page auto-refreshes every 5 seconds.
                    </p>
                </div>
            )}
        </div>
    );
}

// ─── My Requests Tab ──────────────────────────────────────────────────────────
function MyRequests() {
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    useEffect(() => {
        api.get('/executions?myOnly=true&limit=20')
            .then(r => setExecutions(r.data.data.executions || []))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="empty-state"><div className="spinner" style={{ width: 28, height: 28 }} /></div>
    );
    if (executions.length === 0) return (
        <div className="empty-state card">
            <CheckSquare size={36} style={{ opacity: 0.3 }} />
            <p className="font-semibold" style={{ marginTop: 8 }}>No requests yet</p>
            <p className="text-sm text-muted">Your submitted workflow requests will appear here.</p>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {executions.map(ex => {
                const s = STATUS_BADGE[ex.status] || STATUS_BADGE.pending;
                return (
                    <div
                        key={ex._id}
                        className="card"
                        style={{ cursor: 'pointer', transition: 'border-color 0.18s' }}
                        onClick={() => setSelected(ex._id)}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700 }}>{ex.workflowName}</span>
                                    <span className={`badge ${s.cls}`}>{s.label}</span>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                                    {ex.startTime ? new Date(ex.startTime).toLocaleString() : ''}
                                </p>
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setSelected(ex._id); }}>
                                <ArrowRight size={13} /> Track
                            </button>
                        </div>

                        {/* Mini progress bar on card */}
                        {ex.status === 'running' && (
                            <div style={{ marginTop: 10, height: 4, borderRadius: 2, background: 'var(--bg3)', overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%', width: '60%', background: 'var(--accent)', borderRadius: 2,
                                    backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)',
                                    animation: 'progress-stripe 1.2s linear infinite',
                                }} />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Detail modal */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal" style={{ maxWidth: 660 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 style={{ fontWeight: 700 }}>Request Status</h3>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}><X size={16} /></button>
                        </div>
                        <div className="modal-body">
                            <LiveExecutionPanel executionId={selected} onClose={() => setSelected(null)} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setSelected(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main UserHome ────────────────────────────────────────────────────────────
export default function UserHome() {
    const { user } = useAuth();
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedWf, setSelectedWf] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const [activeTab, setActiveTab] = useState('apply'); // 'apply' | 'requests'

    useEffect(() => {
        api.get('/workflows?status=active')
            .then(res => setWorkflows(res.data.data.workflows))
            .catch(() => toast.error('Failed to load workflows'))
            .finally(() => setLoading(false));
    }, []);

    const handleApply = (wf) => { setSelectedWf(wf); setResult(null); };

    const handleFormSubmit = async (formData) => {
        setSubmitting(true);
        try {
            const res = await api.post(`/workflows/${selectedWf._id}/execute`, { formData, priority: 'normal' });
            if (res.data.rejected) {
                setResult({ rejected: true, message: res.data.message });
                toast.error('Application rejected automatically');
            } else {
                const exec = res.data.data.execution;
                setResult({ success: true, executionId: exec._id, message: res.data.message });
                toast.success('Request submitted!');
                // Switch to requests tab after brief delay
                setTimeout(() => setActiveTab('requests'), 1200);
            }
        } catch (e) {
            const msg = e.response?.data?.message || 'Submission failed';
            toast.error(msg);
            setResult({ rejected: true, message: msg });
        } finally { setSubmitting(false); }
    };

    const closeModal = () => { setSelectedWf(null); setResult(null); };

    return (
        <div className="page-content">
            {/* Page header + tabs */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Workflows</h1>
                    <p className="page-subtitle">Welcome, {user?.name}. Apply or track your requests.</p>
                </div>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg2)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
                {[
                    { id: 'apply', label: '📋 Apply' },
                    { id: 'requests', label: '🔍 My Requests' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '8px 18px',
                            borderRadius: 8,
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
                            color: activeTab === tab.id ? '#fff' : 'var(--text2)',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.18s',
                            fontFamily: 'var(--font)',
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Apply tab */}
            {activeTab === 'apply' && (
                loading ? (
                    <div className="empty-state"><div className="spinner" style={{ width: 32, height: 32 }} /></div>
                ) : workflows.length === 0 ? (
                    <div className="empty-state card">
                        <GitBranch size={40} style={{ opacity: 0.3 }} />
                        <p className="font-semibold">No active workflows</p>
                        <p className="text-sm text-muted">No workflows are available right now.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {workflows.map(wf => (
                            <div key={wf._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <GitBranch size={20} color="var(--accent)" />
                                    </div>
                                    <span className="badge badge-green">Active</span>
                                </div>
                                <div>
                                    <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{wf.name}</h3>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 4 }}>{wf.description || 'No description'}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    <span className="badge badge-blue">{wf.version}</span>
                                    <span className="badge badge-cyan">{wf.formSchema?.length || 0} fields</span>
                                </div>
                                <button className="btn btn-primary w-full" onClick={() => handleApply(wf)}>
                                    <FileText size={14} /> Apply / Request
                                </button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* My Requests tab */}
            {activeTab === 'requests' && <MyRequests />}

            {/* Application Modal */}
            {selectedWf && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontWeight: 700 }}>{selectedWf.name}</h3>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 2 }}>{selectedWf.description}</p>
                            </div>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={closeModal}><X size={16} /></button>
                        </div>

                        <div className="modal-body">
                            {/* Rejected */}
                            {result?.rejected && (
                                <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <AlertCircle size={20} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <p style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Application Rejected</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{result.message}</p>
                                    </div>
                                </div>
                            )}

                            {/* Submitted successfully — show live tracker */}
                            {result?.success && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <CheckCircle size={20} color="var(--green)" />
                                        <div>
                                            <p style={{ fontWeight: 700, color: 'var(--green)' }}>Request Submitted!</p>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 2 }}>Tracking progress below — auto-refreshes every 5 seconds.</p>
                                        </div>
                                    </div>
                                    <LiveExecutionPanel executionId={result.executionId} />
                                </div>
                            )}

                            {/* Form */}
                            {!result && (
                                <DynamicForm
                                    formSchema={selectedWf.formSchema || []}
                                    onSubmit={handleFormSubmit}
                                    loading={submitting}
                                />
                            )}
                        </div>

                        <div className="modal-footer">
                            {result?.success ? (
                                <>
                                    <button className="btn btn-ghost" onClick={closeModal}>Close</button>
                                    <button className="btn btn-primary" onClick={() => { closeModal(); setActiveTab('requests'); }}>
                                        <Clock size={14} /> View All Requests
                                    </button>
                                </>
                            ) : result?.rejected ? (
                                <>
                                    <button className="btn btn-ghost" onClick={() => setResult(null)}>Try Again</button>
                                    <button className="btn btn-ghost" onClick={closeModal}>Close</button>
                                </>
                            ) : (
                                <button className="btn btn-ghost" onClick={closeModal}>Cancel</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
