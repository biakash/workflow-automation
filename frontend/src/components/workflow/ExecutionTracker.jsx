import React from 'react';
import { Check, X, Clock, Loader, Ban, SkipForward, Bell, Play, FileText, GitFork, UserCheck, GitBranch, StopCircle } from 'lucide-react';

const STATUS_CONFIG = {
  completed: { icon: <Check size={13} />, dotClass: 'done', label: 'Approved ✓', color: 'var(--green)' },
  rejected: { icon: <X size={13} />, dotClass: 'failed', label: 'Rejected ✗', color: 'var(--red)' },
  failed: { icon: <X size={13} />, dotClass: 'failed', label: 'Failed', color: 'var(--red)' },
  running: { icon: <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />, dotClass: 'running', label: 'In Progress ⏳', color: 'var(--accent)' },
  pending: { icon: <Clock size={13} />, dotClass: 'pending', label: 'Waiting', color: 'var(--text3)' },
  cancelled: { icon: <Ban size={13} />, dotClass: 'cancelled', label: 'Cancelled', color: 'var(--text3)' },
  skipped: { icon: <SkipForward size={13} />, dotClass: 'pending', label: 'Skipped →', color: 'var(--yellow)' },
};

const NODE_TYPE_ICONS = {
  start: <Play size={11} />,
  end: <StopCircle size={11} />,
  input: <FileText size={11} />,
  condition: <GitFork size={11} />,
  task: <UserCheck size={11} />,
  approval: <UserCheck size={11} />,
  decision: <GitBranch size={11} />,
  notification: <Bell size={11} />,
};

const NODE_TYPE_COLORS = {
  start: '#22c55e',
  end: '#ef4444',
  input: '#3b82f6',
  condition: '#a855f7',
  task: '#6366f1',
  approval: '#6366f1',
  decision: '#f59e0b',
  notification: '#06b6d4',
};

// ─── Node History Display ──────────────────────────────────────────────────────
function NodeHistoryTrail({ nodeHistory = [] }) {
  if (!nodeHistory || nodeHistory.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        Execution Path
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
        {nodeHistory.map((h, i) => {
          const color = NODE_TYPE_COLORS[h.nodeType] || '#64748b';
          const icon = NODE_TYPE_ICONS[h.nodeType] || null;
          return (
            <React.Fragment key={i}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                background: `${color}18`,
                border: `1px solid ${color}44`,
                borderRadius: 20,
                fontSize: '0.72rem',
                color,
                fontWeight: 600,
              }}>
                <span style={{ color, display: 'flex' }}>{icon}</span>
                {h.label || h.nodeType}
              </div>
              {i < nodeHistory.length - 1 && (
                <span style={{ color: 'var(--text3)', fontSize: '0.7rem' }}>→</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Execution Tracker ───────────────────────────────────────────────────
export default function ExecutionTracker({
  steps = [],
  nodeHistory = [],
  rejectionReason = '',
  rejectedAt = '',
}) {
  const hasSteps = steps && steps.length > 0;
  const hasHistory = nodeHistory && nodeHistory.length > 0;

  if (!hasSteps && !hasHistory) {
    return (
      <p style={{ color: 'var(--text3)', fontSize: '0.875rem' }}>No execution data yet.</p>
    );
  }

  return (
    <div>
      {/* Graph node trail */}
      {hasHistory && <NodeHistoryTrail nodeHistory={nodeHistory} />}

      {/* Step-by-step audit (if steps available) */}
      {hasSteps && (
        <>
          <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Step Audit
          </p>
          <div className="timeline">
            {steps.map((step, i) => {
              const cfg = STATUS_CONFIG[step.status] || STATUS_CONFIG.pending;
              return (
                <div key={step._id || i} className="timeline-item">
                  <div className={`timeline-dot ${cfg.dotClass}`}>
                    {cfg.icon}
                  </div>

                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {step.stepName}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>

                    {step.assignedRole && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 2 }}>
                        Assigned to: <span className="badge badge-gray" style={{ fontSize: '0.68rem' }}>{step.assignedRole}</span>
                      </p>
                    )}

                    {(step.status === 'rejected' || step.status === 'failed') && (step.reason || step.comment) && (
                      <div style={{ marginTop: 6, background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 10px' }}>
                        {step.reason && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--red)', fontWeight: 600 }}>Reason: {step.reason}</p>
                        )}
                        {step.comment && (
                          <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 2 }}>"{step.comment}"</p>
                        )}
                      </div>
                    )}

                    {step.status === 'completed' && step.comment && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--text2)', marginTop: 4, background: 'var(--bg3)', borderRadius: 6, padding: '6px 10px', borderLeft: '3px solid var(--green)' }}>
                        "{step.comment}"
                      </p>
                    )}

                    {step.startTime && (
                      <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 3 }}>
                        {new Date(step.startTime).toLocaleString()}
                        {step.endTime && ` → ${new Date(step.endTime).toLocaleString()}`}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Overall rejection banner */}
      {rejectionReason && (
        <div style={{ marginTop: 16, background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, padding: '14px 16px' }}>
          <p style={{ fontWeight: 700, color: 'var(--red)', marginBottom: 4 }}>❌ Request Rejected</p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>{rejectionReason}</p>
          {rejectedAt && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginTop: 4 }}>Rejected at: {rejectedAt}</p>
          )}
        </div>
      )}
    </div>
  );
}