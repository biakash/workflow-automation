import React, { useState } from 'react';
import { User, Lock, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ newPassword: '', confirmPassword: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    if (!profileForm.name.trim()) { toast.error('Name required'); return; }
    setSavingProfile(true);
    try {
      await api.patch('/auth/me', { name: profileForm.name });
      // Update local storage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, name: profileForm.name }));
      toast.success('Profile updated!');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!pwForm.newPassword) { toast.error('Enter a new password'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await api.patch('/auth/me', { password: pwForm.newPassword });
      toast.success('Password changed! Please log in again.');
      setPwForm({ newPassword: '', confirmPassword: '' });
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setSavingPw(false);
    }
  };

  const ROLE_COLORS = { admin: 'var(--purple)', manager: 'var(--cyan)', employee: 'var(--accent)', finance: 'var(--green)' };
  const roleColor = ROLE_COLORS[user?.role] || 'var(--accent)';
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-subtitle">Manage your account information</p>
        </div>
      </div>

      {/* Avatar card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 20 }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: `${roleColor}20`, border: `2px solid ${roleColor}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', fontWeight: 800, color: roleColor, flexShrink: 0,
        }}>
          {initials}
        </div>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</h2>
          <p style={{ color: 'var(--text2)', fontSize: '0.875rem' }}>{user?.email}</p>
          <span className="badge" style={{ marginTop: 6, background: `${roleColor}18`, color: roleColor, display: 'inline-flex' }}>
            {user?.role?.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Personal info */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <User size={16} color="var(--accent)" />
          <h3 style={{ fontWeight: 700 }}>Personal Information</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
          <div className="input-group">
            <label className="input-label">Full Name</label>
            <input className="input" value={profileForm.name}
              onChange={(e) => setProfileForm({ name: e.target.value })} />
          </div>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input className="input" value={user?.email || ''} disabled
              style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <div className="input-group">
            <label className="input-label">Role</label>
            <input className="input" value={user?.role || ''} disabled
              style={{ opacity: 0.5, cursor: 'not-allowed', textTransform: 'capitalize' }} />
          </div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}
            onClick={saveProfile} disabled={savingProfile}>
            {savingProfile ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
            Save Profile
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Lock size={16} color="var(--accent)" />
          <h3 style={{ fontWeight: 700 }}>Change Password</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
          <div className="input-group">
            <label className="input-label">New Password</label>
            <input className="input" type="password" placeholder="Min 6 characters"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, newPassword: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Confirm New Password</label>
            <input className="input" type="password" placeholder="Repeat new password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))} />
          </div>
          <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}
            onClick={savePassword} disabled={savingPw}>
            {savingPw ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Lock size={14} />}
            Update Password
          </button>
        </div>
      </div>
    </div>
  );
}