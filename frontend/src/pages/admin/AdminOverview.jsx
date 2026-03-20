import React, { useEffect, useState } from 'react';
import { GitBranch, Play, Users, CheckCircle, XCircle, Clock, TrendingUp, Activity } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatDistanceToNow } from 'date-fns';

export default function AdminOverview() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ workflows: 0, executions: 0, users: 0, running: 0 });
  const [recentExecutions, setRecentExecutions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/workflows?limit=1'),
      api.get('/executions?limit=5'),
      api.get('/users?limit=1'),
      api.get('/executions?status=running&limit=1'),
    ]).then(([wf, ex, us, run]) => {
      setStats({
        workflows: wf.data.data.total,
        executions: ex.data.data.total,
        users: us.data.data.total,
        running: run.data.data.total,
      });
      setRecentExecutions(ex.data.data.executions);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Workflows', value: stats.workflows, icon: GitBranch, color: 'var(--accent)', bg: 'var(--accent-bg)' },
    { label: 'Total Executions', value: stats.executions, icon: Play, color: 'var(--purple)', bg: 'var(--purple-bg)' },
    { label: 'Registered Users', value: stats.users, icon: Users, color: 'var(--cyan)', bg: 'var(--cyan-bg)' },
    { label: 'Running Now', value: stats.running, icon: Activity, color: 'var(--green)', bg: 'var(--green-bg)' },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-subtitle">Here's what's happening in your workflow system</p>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map((s) => (
          <div key={s.label} className="stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">{s.label}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <s.icon size={18} color={s.color} />
              </div>
            </div>
            <span className="stat-value" style={{ color: s.color }}>
              {loading ? '—' : s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Recent Executions */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Recent Executions</h2>
          <a href="/admin/executions" style={{ fontSize: '0.82rem', color: 'var(--accent)', textDecoration: 'none' }}>View all →</a>
        </div>
        {loading ? (
          <div className="empty-state"><div className="spinner" /></div>
        ) : recentExecutions.length === 0 ? (
          <div className="empty-state"><Play size={32} /><p>No executions yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Execution ID</th>
                  <th>Workflow</th>
                  <th>Status</th>
                  <th>Started By</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {recentExecutions.map((ex) => (
                  <tr key={ex._id}>
                    <td><span className="mono" style={{ color: 'var(--accent2)' }}>{ex.executionId?.slice(0, 8)}...</span></td>
                    <td>{ex.workflowName || ex.workflowId?.name || '—'}</td>
                    <td><StatusBadge status={ex.status} /></td>
                    <td style={{ color: 'var(--text2)' }}>{ex.startedBy?.name || '—'}</td>
                    <td style={{ color: 'var(--text3)', fontSize: '0.78rem' }}>
                      {ex.startTime ? formatDistanceToNow(new Date(ex.startTime), { addSuffix: true }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}