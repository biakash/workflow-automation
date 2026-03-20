import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';

export default function DynamicForm({ formSchema = [], onSubmit, loading = false }) {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  const sorted = [...formSchema].sort((a, b) => a.order - b.order);

  const handleChange = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) setErrors(prev => ({ ...prev, [fieldId]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    for (const field of sorted) {
      const val = formData[field.fieldId];
      if (field.required && (val === undefined || val === '' || val === null)) {
        newErrors[field.fieldId] = `${field.label} is required`;
      }
      if (field.type === 'number' && val !== '' && val !== undefined) {
        if (field.min !== null && field.min !== undefined && Number(val) < field.min) {
          newErrors[field.fieldId] = `${field.label} must be at least ${field.min}`;
        }
        if (field.max !== null && field.max !== undefined && Number(val) > field.max) {
          newErrors[field.fieldId] = `${field.label} must be at most ${field.max}`;
        }
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  const inputStyle = (fieldId) => ({
    width: '100%',
    background: errors[fieldId] ? 'rgba(239,68,68,0.05)' : 'var(--bg3)',
    border: `1px solid ${errors[fieldId] ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    fontFamily: 'var(--font)',
    fontSize: '0.9rem',
    padding: '10px 14px',
    outline: 'none',
    transition: 'border-color 0.18s',
  });

  const renderField = (field) => {
    const val = formData[field.fieldId] ?? '';

    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <input
            style={inputStyle(field.fieldId)}
            type={field.type}
            placeholder={field.placeholder || `Enter ${field.label}`}
            value={val}
            onChange={e => handleChange(field.fieldId, e.target.value)}
          />
        );

      case 'number':
        return (
          <input
            style={inputStyle(field.fieldId)}
            type="number"
            placeholder={field.placeholder || `Enter ${field.label}`}
            value={val}
            min={field.min ?? undefined}
            max={field.max ?? undefined}
            onChange={e => handleChange(field.fieldId, e.target.value)}
          />
        );

      case 'date':
        return (
          <input
            style={inputStyle(field.fieldId)}
            type="date"
            value={val}
            onChange={e => handleChange(field.fieldId, e.target.value)}
          />
        );

      case 'dropdown':
        return (
          <select
            style={{ ...inputStyle(field.fieldId), appearance: 'none', cursor: 'pointer' }}
            value={val}
            onChange={e => handleChange(field.fieldId, e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {(field.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            style={{ ...inputStyle(field.fieldId), minHeight: 90, resize: 'vertical' }}
            placeholder={field.placeholder || `Enter ${field.label}`}
            value={val}
            onChange={e => handleChange(field.fieldId, e.target.value)}
          />
        );

      case 'file':
        return (
          <input
            style={{ ...inputStyle(field.fieldId), padding: '8px' }}
            type="file"
            onChange={e => handleChange(field.fieldId, e.target.files[0]?.name || '')}
          />
        );

      default:
        return null;
    }
  };

  if (sorted.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 32, color: 'var(--text3)' }}>
        <AlertCircle size={32} style={{ margin: '0 auto 12px', display: 'block' }} />
        <p>No form fields configured for this workflow.</p>
        <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Contact admin to set up the form.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
        {sorted.map(field => (
          <div key={field.fieldId} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text2)',
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
            }}>
              {field.label}
              {field.required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
            </label>
            {renderField(field)}
            {errors[field.fieldId] && (
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--red)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}>
                <AlertCircle size={11} /> {errors[field.fieldId]}
              </span>
            )}
          </div>
        ))}
      </div>

      <div style={{
        borderTop: '1px solid var(--border)',
        paddingTop: 16,
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
          {loading ? (
            <><div className="spinner" style={{ width: 16, height: 16 }} /> Submitting...</>
          ) : (
            <><Send size={16} /> Submit Request</>
          )}
        </button>
      </div>
    </form>
  );
}