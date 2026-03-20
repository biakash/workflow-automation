import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';

const FIELD_TYPES = [
  { value: 'text',     label: 'Text'        },
  { value: 'number',   label: 'Number'      },
  { value: 'email',    label: 'Email'       },
  { value: 'dropdown', label: 'Dropdown'    },
  { value: 'date',     label: 'Date'        },
  { value: 'textarea', label: 'Text Area'   },
  { value: 'file',     label: 'File Upload' },
];

const uid = () => `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export default function FormSchemaBuilder({ formSchema = [], onChange }) {
  const [expanded, setExpanded] = useState({});

  const addField = () => {
    const newField = {
      fieldId: uid(),
      label: 'New Field',
      type: 'text',
      required: false,
      placeholder: '',
      options: [],
      min: null,
      max: null,
      order: formSchema.length + 1,
    };
    onChange([...formSchema, newField]);
    setExpanded(p => ({ ...p, [newField.fieldId]: true }));
  };

  const updateField = (fieldId, key, value) => {
    onChange(formSchema.map(f => f.fieldId === fieldId ? { ...f, [key]: value } : f));
  };

  const removeField = (fieldId) => {
    onChange(formSchema.filter(f => f.fieldId !== fieldId));
  };

  const toggleExpand = (fieldId) => {
    setExpanded(p => ({ ...p, [fieldId]: !p[fieldId] }));
  };

  const addOption = (fieldId) => {
    const field = formSchema.find(f => f.fieldId === fieldId);
    updateField(fieldId, 'options', [...(field.options || []), 'New Option']);
  };

  const updateOption = (fieldId, idx, val) => {
    const field = formSchema.find(f => f.fieldId === fieldId);
    const opts = [...(field.options || [])];
    opts[idx] = val;
    updateField(fieldId, 'options', opts);
  };

  const removeOption = (fieldId, idx) => {
    const field = formSchema.find(f => f.fieldId === fieldId);
    updateField(fieldId, 'options', field.options.filter((_, i) => i !== idx));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {formSchema.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 24,
          color: 'var(--text3)',
          background: 'var(--bg3)',
          borderRadius: 'var(--radius)',
          border: '1px dashed var(--border)',
        }}>
          No fields yet. Click "Add Field" to start building your form.
        </div>
      )}

      {formSchema.map((field) => (
        <div
          key={field.fieldId}
          style={{
            background: 'var(--bg3)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              cursor: 'pointer',
            }}
            onClick={() => toggleExpand(field.fieldId)}
          >
            <GripVertical size={14} color="var(--text3)" />
            <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem' }}>{field.label}</span>
            <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{field.type}</span>
            {field.required && (
              <span className="badge badge-red" style={{ fontSize: '0.7rem' }}>Required</span>
            )}
            <button
              className="btn btn-ghost btn-icon btn-sm"
              onClick={e => { e.stopPropagation(); removeField(field.fieldId); }}
            >
              <Trash2 size={12} color="var(--red)" />
            </button>
            {expanded[field.fieldId] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>

          {/* Expanded Edit Panel */}
          {expanded[field.fieldId] && (
            <div style={{
              padding: 14,
              borderTop: '1px solid var(--border)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}>
              <div className="input-group">
                <label className="input-label">Field Label *</label>
                <input
                  className="input"
                  value={field.label}
                  onChange={e => updateField(field.fieldId, 'label', e.target.value)}
                  placeholder="e.g. Full Name"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Field Type *</label>
                <select
                  className="select"
                  value={field.type}
                  onChange={e => updateField(field.fieldId, 'type', e.target.value)}
                >
                  {FIELD_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Placeholder</label>
                <input
                  className="input"
                  value={field.placeholder || ''}
                  onChange={e => updateField(field.fieldId, 'placeholder', e.target.value)}
                  placeholder="Hint text for user"
                />
              </div>

              <div className="input-group" style={{ alignSelf: 'end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={e => updateField(field.fieldId, 'required', e.target.checked)}
                  />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text2)' }}>Required field</span>
                </label>
              </div>

              {field.type === 'number' && (
                <>
                  <div className="input-group">
                    <label className="input-label">Min Value</label>
                    <input
                      className="input"
                      type="number"
                      value={field.min ?? ''}
                      onChange={e => updateField(field.fieldId, 'min', e.target.value ? Number(e.target.value) : null)}
                      placeholder="Minimum"
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Max Value</label>
                    <input
                      className="input"
                      type="number"
                      value={field.max ?? ''}
                      onChange={e => updateField(field.fieldId, 'max', e.target.value ? Number(e.target.value) : null)}
                      placeholder="Maximum"
                    />
                  </div>
                </>
              )}

              {field.type === 'dropdown' && (
                <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="input-label">Dropdown Options</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {(field.options || []).map((opt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input
                          className="input"
                          value={opt}
                          onChange={e => updateOption(field.fieldId, i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                        />
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => removeOption(field.fieldId, i)}
                        >
                          <Trash2 size={12} color="var(--red)" />
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-ghost btn-sm"
                      style={{ alignSelf: 'flex-start' }}
                      onClick={() => addOption(field.fieldId)}
                    >
                      <Plus size={12} /> Add Option
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      <button className="btn btn-ghost" onClick={addField} style={{ alignSelf: 'flex-start' }}>
        <Plus size={14} /> Add Field
      </button>
    </div>
  );
}