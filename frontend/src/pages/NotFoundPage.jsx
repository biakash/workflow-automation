import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goHome = () => {
    if (user) navigate(`/${user.role}`);
    else navigate('/login');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 24, padding: 24,
      background: 'var(--bg)',
    }}>
      {/* Decorative background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 40%, rgba(79,142,247,0.07) 0%, transparent 60%)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
        <div style={{ width: 36, height: 36, background: 'var(--accent-bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={18} color="var(--accent)" />
        </div>
        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
          Flow<span style={{ color: 'var(--accent)' }}>Forge</span>
        </span>
      </div>

      <div style={{ textAlign: 'center', position: 'relative' }}>
        <div style={{
          fontSize: '7rem', fontWeight: 900, lineHeight: 1,
          background: 'linear-gradient(135deg, var(--border2), var(--border))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.05em', marginBottom: 12,
          fontFamily: 'var(--mono)',
        }}>404</div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 10 }}>Page Not Found</h1>
        <p style={{ color: 'var(--text2)', fontSize: '0.9rem', maxWidth: 340 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>

      <button className="btn btn-primary btn-lg" onClick={goHome}>
        <ArrowLeft size={16} />
        {user ? 'Back to Dashboard' : 'Back to Login'}
      </button>
    </div>
  );
}