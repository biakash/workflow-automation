import React, { useEffect, useState } from 'react';
import { FileText, Clock, CheckCircle, XCircle, RefreshCw, X, AlertCircle } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import ExecutionTracker from '../../components/workflow/ExecutionTracker';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const STATUS_CONFIG = {
    running: { label: 'In Progress', color: 'var(--yellow)', bg: 'var(--yellow-bg)', icon: Clock },
    completed: { label: 'Completed', color: 'var(--green)', bg: 'var(--green-bg)', icon: CheckCircle },
    rejected: { label: 'Rejected', color: 'var(--red)', bg: 'var(--red-bg)', icon: XCircle },
    cancelled: { label: 'Cancelled', color: 'var(--text3)', bg: 'var(--bg3)', icon: XCircle },
};

export default function UserRequests() {
    const { user } = useAuth();
    const [executions, setExecutions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await api.get('/executions');
            setExecutions(res.data.data.executions || []);
        } catch {
            toast.error('Failed to load your requests');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const openDetail = async (ex) => {
        try {
            const res = await api.get(`/executions/${ex._id}`);
            setSelected(res.data.data.execution);
        } catch {
            toast.error('Failed to load details');
        }
    };

    const renderFormData = (formData, formSchema) => {
        if (!formData || Object.keys(formData).length === 0) return null;
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                {Object.entries(formData).map(([key, value]) => {
                    const field = (formSchema || []).find(f => f.fieldId === key);
                    return (
                        <div key={key} style={{ background: 'var(--bg3)', borderRadius: 8, padding: '10px 12px' }}>
                            <p style={{ fontSize: '0.72rem', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                                {field?.label || key}
                            </p>
                            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{String(value) || '—'}</p>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="page-content">
            <div className="page-header">
                <div>
                    <h1 className="page-title">My Requests</h1>
                    <p className="page-subtitle">Track the status of your submitted workflow requests.</p>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={fetchRequests}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {loading ? (
                <div className="empty-state">
                    <div className="spinner" style={{ width: 32, height: 32 }} />
                </div>
            ) : executions.length === 0 ? (
                <div className="empty-state card">
                    <FileText size={40} />
                    <p className="font-semibold">No requests yet</p>
                    <p className="text-sm text-muted">Go to Available Workflows to submit your first request.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {executions.map(ex => {
                        const cfg = STATUS_CONFIG[ex.status] || STATUS_CONFIG.running;
                        const Icon = cfg.icon;
                        return (
                            <div
                                key={ex._id}
                                className="card card-sm"
                                style={{ cursor: 'pointer', transition: 'border-color 0.15s' }}
                                onClick={() => openDetail(ex)}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 8,
                                        background: cfg.bg,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>
                                        <Icon size={16} color={cfg.color} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                                            <span style={{ fontWeight: 700 }}>{ex.workflowName}</span>
                                            <span style={{
                                                fontSize: '0.72rem', fontWeight: 600, padding: '2px 8px',
                                                borderRadius: 20, background: cfg.bg, color: cfg.color,
                                            }}>{cfg.label}</span>
                                        </div>
                                        <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                                            Step {(ex.currentStepIndex || 0) + 1} of {ex.steps?.length || '?'}
                                            {ex.status === 'rejected' && ex.rejectionReason && ` • ${ex.rejectionReason}`}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                                        {ex.startTime && formatDistanceToNow(new Date(ex.startTime), { addSuffix: true })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Detail Modal */}
            {selected && (
                <div className="modal-overlay" onClick={() => setSelected(null)}>
                    <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <h3 style={{ fontWeight: 700 }}>{selected.workflowName}</h3>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 2 }}>
                                    Submitted {selected.startTime && new Date(selected.startTime).toLocaleString()}
                                </p>
                            </div>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>
                                <X size={16} />
                            </button>
                        </div>

                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {/* Status banner */}
                            {selected.status === 'rejected' && (
                                <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: 16, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <AlertCircle size={20} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
                                    <div>
                                        <p style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>Request Rejected</p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>
                                            {selected.rejectionReason || 'No reason provided.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                            {selected.status === 'completed' && (
                                <div style={{ background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                                    <CheckCircle size={20} color="var(--green)" />
                                    <p style={{ fontWeight: 700, color: 'var(--green)' }}>Request Approved & Completed</p>
                                </div>
                            )}

                            {/* Your form data */}
                            {selected.formData && Object.keys(selected.formData).length > 0 && (
                                <div>
                                    <p style={{ fontWeight: 700, marginBottom: 12 }}>Your Submission</p>
                                    {renderFormData(selected.formData, selected.workflowId?.formSchema)}
                                </div>
                            )}

                            {/* Workflow Progress */}
                            <div>
                                <p style={{ fontWeight: 700, marginBottom: 12 }}>Progress</p>
                                <ExecutionTracker
                                    steps={selected.steps || []}
                                    rejectionReason={selected.rejectionReason}
                                    rejectedAt={selected.rejectedAt}
                                />
                            </div>
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
