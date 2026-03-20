import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(`/${user.role}`, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bg} />
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}><Zap size={20} color="var(--accent)" /></div>
          <span style={styles.logoText}>Flow<span style={{ color: 'var(--accent)' }}>Forge</span></span>
        </div>

        <h1 style={styles.title}>Sign in to your account</h1>
        <p style={styles.subtitle}>Workflow automation at your fingertips</p>

        {error && (
          <div style={styles.errorBox}>
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <div style={styles.inputWrap}>
              <Mail size={15} style={styles.inputIcon} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                type="email"
                placeholder="you@company.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={styles.inputWrap}>
              <Lock size={15} style={styles.inputIcon} />
              <input
                className="input"
                style={{ paddingLeft: 36 }}
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <ArrowRight size={16} />}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={styles.signupLink}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent)' }}>Create one</Link>
        </p>

        
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  bg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(ellipse at 20% 50%, rgba(79,142,247,0.08) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(168,85,247,0.06) 0%, transparent 50%)',
    pointerEvents: 'none',
  },
  card: {
    width: '100%', maxWidth: 420,
    background: 'var(--bg2)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '36px 32px',
    position: 'relative',
    zIndex: 1,
    boxShadow: 'var(--shadow-lg)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: {
    width: 36, height: 36,
    background: 'var(--accent-bg)',
    borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' },
  title: { fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 },
  subtitle: { color: 'var(--text2)', fontSize: '0.875rem', marginBottom: 24 },
  errorBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--red-bg)',
    border: '1px solid rgba(239,68,68,0.25)',
    color: 'var(--red)',
    borderRadius: 'var(--radius)',
    padding: '10px 14px',
    fontSize: '0.875rem',
    marginBottom: 20,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' },
  signupLink: { textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text2)' },
  hint: {
    marginTop: 24,
    padding: '16px',
    background: 'var(--bg3)',
    borderRadius: 'var(--radius)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  demoBtn: {
    background: 'none', border: '1px solid var(--border)', borderRadius: 6,
    color: 'var(--text2)', padding: '5px 10px', cursor: 'pointer',
    fontFamily: 'var(--mono)', fontSize: '0.72rem', textAlign: 'left',
    transition: 'all 0.15s',
  },
};