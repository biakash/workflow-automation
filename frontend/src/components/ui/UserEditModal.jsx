import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const ROLES = ['manager', 'employee', 'finance'];

export default function UserEditModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name || '',
    role: user.role || 'employee',
    isActive: user.isActive ?? true,
    password: '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    const payload = { name: form.name, role: form.role, isActive: form.isActive };
    if (form.password.length > 0) {
      if (form.password.length < 6) { toast.error('Password must be 6+ characters'); setSaving(false); return; }
      payload.password = form.password;
    }
    try {
      await api.put(`/users/${user._id}`, payload);
      toast.success('User updated!');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 style={{ fontWeight: 700 }}>Edit User</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="input-group">
            <label className="input-label">Full Name *</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Role</label>
            <select className="select" value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="select" value={form.isActive.toString()}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === 'true' }))}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">New Password (leave blank to keep current)</label>
            <input className="input" type="password" placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Save size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}