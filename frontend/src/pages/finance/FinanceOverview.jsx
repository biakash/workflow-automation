import React, { useEffect, useState, useCallback } from 'react';
import { CheckSquare, Clock, CheckCircle, XCircle, RefreshCw, TrendingUp } from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function useLiveTaskStats(role) {
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        api.get(`/tasks?role=${role}&status=pending&limit=1`),
        api.get(`/tasks?role=${role}&status=approved&limit=1`),
        api.get(`/tasks?role=${role}&status=rejected&limit=1`),
      ]);
      setStats({
        pending: pendingRes.data.data.total || 0,
        approved: approvedRes.data.data.total || 0,
        rejected: rejectedRes.data.data.total || 0,
        total: (pendingRes.data.data.total || 0) + (approvedRes.data.data.total || 0) + (rejectedRes.data.data.total || 0),
      });
    } catch { }
    finally { setLoading(false); }
  }, [role]);

  useEffect(() => {
    load();
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, [load]);

  return { stats, loading, reload: load };
}

function StatCard({ label, value, icon: Icon, color, bg, loading }) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="stat-label">{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      {loading
        ? <div className="spinner" style={{ width: 22, height: 22, marginTop: 8 }} />
        : <span className="stat-value" style={{ color, marginTop: 4, display: 'block' }}>{value}</span>
      }
    </div>
  );
}

export default function FinanceOverview() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { stats, loading, reload } = useLiveTaskStats('finance');

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Finance Dashboard</h1>
          <p className="page-subtitle">Welcome, {user?.name}. Live task counts update every 15 seconds.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={reload}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard label="Pending Approvals" value={stats.pending} icon={Clock} color="var(--yellow)" bg="var(--yellow-bg)" loading={loading} />
        <StatCard label="Approved (All time)" value={stats.approved} icon={CheckCircle} color="var(--green)" bg="var(--green-bg)" loading={loading} />
        <StatCard label="Rejected (All time)" value={stats.rejected} icon={XCircle} color="var(--red)" bg="var(--red-bg)" loading={loading} />
        <StatCard label="Total Handled" value={stats.total} icon={TrendingUp} color="var(--accent)" bg="var(--accent-bg)" loading={loading} />
      </div>

      <div className="card">
        <p style={{ fontWeight: 700, marginBottom: 8 }}>Quick Actions</p>
        <p style={{ fontSize: '0.875rem', color: 'var(--text2)', marginBottom: 16 }}>
          Review finance requests assigned to your role.
          {stats.pending > 0 && <span style={{ color: 'var(--yellow)', fontWeight: 700 }}> {stats.pending} task{stats.pending !== 1 ? 's' : ''} waiting!</span>}
        </p>
        <button onClick={() => navigate('/finance/approvals')} className="btn btn-primary">
          <CheckSquare size={16} /> Open Approval Queue
          {stats.pending > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 99, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800, marginLeft: 4 }}>{stats.pending}</span>}
        </button>
      </div>
    </div>
  );
}