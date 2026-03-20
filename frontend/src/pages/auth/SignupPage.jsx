import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, User, Mail, Lock, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res = await signup(form.name, form.email, form.password);
      setSuccess(res.message || 'Sign-up successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Sign-up failed. Please try again.');
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

        <h1 style={styles.title}>Create your account</h1>
        <p style={styles.subtitle}>Join your team's workflow automation platform</p>

        {error && (
          <div style={{ ...styles.msgBox, background: 'var(--red-bg)', border: '1px solid rgba(239,68,68,0.25)', color: 'var(--red)' }}>
            <AlertCircle size={15} /><span>{error}</span>
          </div>
        )}
        {success && (
          <div style={{ ...styles.msgBox, background: 'var(--green-bg)', border: '1px solid rgba(34,197,94,0.25)', color: 'var(--green)' }}>
            <CheckCircle size={15} /><span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <div style={styles.inputWrap}>
              <User size={15} style={styles.inputIcon} />
              <input className="input" style={{ paddingLeft: 36 }} type="text" placeholder="John Smith"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Email address</label>
            <div style={styles.inputWrap}>
              <Mail size={15} style={styles.inputIcon} />
              <input className="input" style={{ paddingLeft: 36 }} type="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={styles.inputWrap}>
              <Lock size={15} style={styles.inputIcon} />
              <input className="input" style={{ paddingLeft: 36 }} type="password" placeholder="Min 6 characters"
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <ArrowRight size={16} />}
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p style={styles.loginLink}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' },
  bg: { position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%, rgba(79,142,247,0.08) 0%, transparent 60%)', pointerEvents: 'none' },
  card: { width: '100%', maxWidth: 420, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '36px 32px', position: 'relative', zIndex: 1, boxShadow: 'var(--shadow-lg)' },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: { width: 36, height: 36, background: 'var(--accent-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em' },
  title: { fontSize: '1.4rem', fontWeight: 700, marginBottom: 6 },
  subtitle: { color: 'var(--text2)', fontSize: '0.875rem', marginBottom: 24 },
  msgBox: { display: 'flex', alignItems: 'center', gap: 8, borderRadius: 'var(--radius)', padding: '10px 14px', fontSize: '0.875rem', marginBottom: 20 },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  inputWrap: { position: 'relative' },
  inputIcon: { position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' },
  loginLink: { textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text2)' },
};