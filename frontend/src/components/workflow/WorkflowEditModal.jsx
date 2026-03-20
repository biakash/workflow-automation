import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';

const CATEGORIES = ['approval', 'finance', 'hr', 'operations', 'custom'];

export default function WorkflowEditModal({ workflow, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: workflow.name || '',
    description: workflow.description || '',
    category: workflow.category || 'custom',
    status: workflow.status || 'draft',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      await api.put(`/workflows/${workflow._id}`, form);
      toast.success('Workflow updated!');
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
          <h3 style={{ fontWeight: 700 }}>Edit Workflow</h3>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="input-group">
            <label className="input-label">Workflow Name *</label>
            <input className="input" value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <textarea className="textarea" value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select className="select" value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label className="input-label">Status</label>
            <select className="select" value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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