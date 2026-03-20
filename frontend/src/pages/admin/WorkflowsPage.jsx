import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, PowerOff, Power, GitBranch, X, FileText, Save } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import WorkflowBuilder from '../../components/workflow/WorkflowBuilder';
import WorkflowEditModal from '../../components/workflow/WorkflowEditModal';
import FormSchemaBuilder from '../../components/workflow/FormSchemaBuilder';

// ── Workflow List ─────────────────────────────────────────────────────────────
function WorkflowList() {
  const navigate = useNavigate();
  const [workflows,    setWorkflows]    = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate,   setShowCreate]   = useState(false);
  const [createForm,   setCreateForm]   = useState({ name: '', description: '', category: 'custom' });
  const [creating,     setCreating]     = useState(false);
  const [editWorkflow, setEditWorkflow] = useState(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search)       params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const res = await api.get(`/workflows?${params}`);
      setWorkflows(res.data.data.workflows);
    } catch {
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchWorkflows(); }, [search, statusFilter]);

  const createWorkflow = async () => {
    if (!createForm.name.trim()) { toast.error('Name required'); return; }
    setCreating(true);
    try {
      const res = await api.post('/workflows', {
        name:        createForm.name,
        description: createForm.description,
        category:    createForm.category,
        status:      'draft',
        formSchema:  [],
        flowData:    { nodes: [], edges: [] },
      });
      toast.success('Workflow created! Now build the form and flow.');
      setShowCreate(false);
      setCreateForm({ name: '', description: '', category: 'custom' });
      // Go to form builder first
      navigate(`/admin/workflows/${res.data.data.workflow._id}/form`);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    } finally {
      setCreating(false);
    }
  };

  const deleteWorkflow = async (id) => {
    if (!confirm('Delete this workflow and all its steps?')) return;
    try {
      await api.delete(`/workflows/${id}`);
      toast.success('Deleted');
      fetchWorkflows();
    } catch {
      toast.error('Delete failed');
    }
  };

  const toggleStatus = async (wf) => {
    const ns = wf.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/workflows/${wf._id}/status`, { status: ns });
      toast.success(`Workflow ${ns}`);
      fetchWorkflows();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workflows</h1>
          <p className="page-subtitle">Create dynamic workflows — no code needed</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New Workflow
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} color="var(--text3)" />
          <input
            placeholder="Search workflows..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select"
          style={{ width: 160 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Info banner */}
      <div style={{
        marginBottom: 20,
        padding: '12px 16px',
        background: 'var(--accent-bg)',
        borderRadius: 8,
        border: '1px solid rgba(79,142,247,0.2)',
        fontSize: '0.875rem',
        color: 'var(--text2)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <GitBranch size={16} color="var(--accent)" />
        <span>
          <strong style={{ color: 'var(--text)' }}>How to create a workflow:</strong>
          {' '}1. Create → 2. Build Form Fields (📄) → 3. Build Flow with Conditions (🌿) → 4. Activate ⚡
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Form Fields</th>
                <th>Steps</th>
                <th>Version</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state"><div className="spinner" /></div>
                  </td>
                </tr>
              ) : workflows.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <div className="empty-state">
                      <GitBranch size={32} />
                      <p>No workflows yet</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text3)' }}>
                        Click "New Workflow" to get started
                      </p>
                    </div>
                  </td>
                </tr>
              ) : workflows.map(wf => (
                <tr key={wf._id}>
                  <td>
                    <div>
                      <span style={{ fontWeight: 600 }}>{wf.name}</span>
                      {wf.description && (
                        <p style={{ fontSize: '0.76rem', color: 'var(--text3)', marginTop: 2 }}>
                          {wf.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${wf.formSchema?.length > 0 ? 'badge-cyan' : 'badge-gray'}`}>
                      {wf.formSchema?.length || 0} fields
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${(wf.flowData?.nodes?.length > 0) ? 'badge-purple' : 'badge-gray'}`}>
                      {wf.flowData?.nodes?.length || 0} nodes
                    </span>
                  </td>
                  <td><span className="badge badge-blue">{wf.version}</span></td>
                  <td><StatusBadge status={wf.status} /></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Edit Details"
                        onClick={() => setEditWorkflow(wf)}
                      >
                        <Edit size={13} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Form Builder — Define user form fields"
                        onClick={() => navigate(`/admin/workflows/${wf._id}/form`)}
                      >
                        <FileText size={13} color="var(--cyan)" />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Flow Builder — Build steps and conditions"
                        onClick={() => navigate(`/admin/workflows/${wf._id}/builder`)}
                      >
                        <GitBranch size={13} color="var(--accent)" />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title={wf.status === 'active' ? 'Deactivate' : 'Activate'}
                        onClick={() => toggleStatus(wf)}
                      >
                        {wf.status === 'active'
                          ? <PowerOff size={13} color="var(--yellow)" />
                          : <Power   size={13} color="var(--green)"  />
                        }
                      </button>
                      <button
                        className="btn btn-ghost btn-sm btn-icon"
                        title="Delete"
                        onClick={() => deleteWorkflow(wf._id)}
                      >
                        <Trash2 size={13} color="var(--red)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontWeight: 700 }}>Create New Workflow</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowCreate(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Workflow Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Loan Approval"
                  value={createForm.name}
                  onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Description</label>
                <textarea
                  className="textarea"
                  placeholder="What does this workflow do?"
                  value={createForm.description}
                  onChange={e => setCreateForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>
              <div className="input-group">
                <label className="input-label">Category</label>
                <select
                  className="select"
                  value={createForm.category}
                  onChange={e => setCreateForm(p => ({ ...p, category: e.target.value }))}
                >
                  {['approval', 'finance', 'hr', 'operations', 'loan', 'custom'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div style={{
                padding: '12px 14px',
                background: 'var(--bg3)',
                borderRadius: 8,
                fontSize: '0.82rem',
                color: 'var(--text2)',
              }}>
                📋 After creating, you will be taken to the <strong>Form Builder</strong> to add fields,
                then to the <strong>Flow Builder</strong> to add steps and conditions.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createWorkflow} disabled={creating}>
                {creating
                  ? <div className="spinner" style={{ width: 14, height: 14 }} />
                  : <Plus size={14} />
                }
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}

      {editWorkflow && (
        <WorkflowEditModal
          workflow={editWorkflow}
          onClose={() => setEditWorkflow(null)}
          onSaved={fetchWorkflows}
        />
      )}
    </div>
  );
}

// ── Form Builder Page ─────────────────────────────────────────────────────────
function FormBuilderPage() {
  const navigate   = useNavigate();
  const pathParts  = window.location.pathname.split('/');
  const wfId       = pathParts[pathParts.indexOf('workflows') + 1];
  const [workflow,   setWorkflow]   = useState(null);
  const [formSchema, setFormSchema] = useState([]);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    api.get(`/workflows/${wfId}`)
      .then(res => {
        setWorkflow(res.data.data.workflow);
        setFormSchema(res.data.data.workflow.formSchema || []);
      })
      .catch(() => toast.error('Failed to load workflow'));
  }, [wfId]);

  const saveSchema = async () => {
    if (formSchema.length === 0) {
      toast.error('Please add at least one field');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/workflows/${wfId}/form-schema`, { formSchema });
      toast.success(`✅ Form schema saved with ${formSchema.length} field(s)!`);
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/admin/workflows')}
            style={{ marginBottom: 8 }}
          >
            ← Back to Workflows
          </button>
          <h1 className="page-title">Form Builder — {workflow?.name}</h1>
          <p className="page-subtitle">
            Define fields users must fill when applying for this workflow.
            These fields are also used in step conditions.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/admin/workflows/${wfId}/builder`)}
          >
            <GitBranch size={14} /> Go to Flow Builder →
          </button>
          <button className="btn btn-primary" onClick={saveSchema} disabled={saving}>
            {saving
              ? <div className="spinner" style={{ width: 14, height: 14 }} />
              : <Save size={14} />
            }
            Save Form Schema
          </button>
        </div>
      </div>

      {/* Steps guide */}
      <div style={{
        display: 'flex',
        gap: 8,
        marginBottom: 20,
        padding: '12px 16px',
        background: 'var(--bg3)',
        borderRadius: 8,
        border: '1px solid var(--border)',
      }}>
        {[
          { step: '1', label: 'Create Workflow', done: true },
          { step: '2', label: 'Build Form (here)', active: true },
          { step: '3', label: 'Build Flow' },
          { step: '4', label: 'Activate' },
        ].map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 24, height: 24,
              borderRadius: '50%',
              background: s.done ? 'var(--green)' : s.active ? 'var(--accent)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.72rem', fontWeight: 700, color: '#fff',
              flexShrink: 0,
            }}>
              {s.done ? '✓' : s.step}
            </div>
            <span style={{
              fontSize: '0.78rem',
              color: s.active ? 'var(--text)' : s.done ? 'var(--green)' : 'var(--text3)',
              fontWeight: s.active ? 600 : 400,
            }}>
              {s.label}
            </span>
            {i < 3 && <span style={{ color: 'var(--text3)', margin: '0 4px' }}>→</span>}
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          padding: '12px 16px',
          background: 'var(--accent-bg)',
          borderRadius: 8,
          border: '1px solid rgba(79,142,247,0.2)',
        }}>
          <FileText size={16} color="var(--accent)" />
          <div>
            <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>Dynamic Form Builder</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>
              Add fields here. The <strong>Field ID</strong> will be used in Flow Builder conditions.
              Example: fieldId "age" → condition: age {'>='} 21
            </p>
          </div>
        </div>
        <FormSchemaBuilder formSchema={formSchema} onChange={setFormSchema} />
      </div>
    </div>
  );
}

// ── Flow Builder Page ─────────────────────────────────────────────────────────
function BuilderPage() {
  const navigate  = useNavigate();
  const pathParts = window.location.pathname.split('/');
  const wfId      = pathParts[pathParts.indexOf('workflows') + 1];
  const [workflow, setWorkflow] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    api.get(`/workflows/${wfId}`)
      .then(res => setWorkflow(res.data.data.workflow))
      .catch(() => toast.error('Failed to load workflow'))
      .finally(() => setLoading(false));
  }, [wfId]);

  // This sends nodes to backend which extracts steps dynamically
  const handleSave = async ({ nodes, edges }) => {
    setSaving(true);
    try {
      const res = await api.post(`/workflows/${wfId}/flow-data`, { nodes, edges });
      const stepsCount = res.data.data?.steps?.length || 0;
      toast.success(`✅ Flow saved! ${stepsCount} step(s) extracted from nodes.`);
      // Refresh workflow data
      const updated = await api.get(`/workflows/${wfId}`);
      setWorkflow(updated.data.data.workflow);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="empty-state page-content">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/admin/workflows')}
            style={{ marginBottom: 8 }}
          >
            ← Back to Workflows
          </button>
          <h1 className="page-title">Flow Builder — {workflow?.name}</h1>
          <p className="page-subtitle">
            Drag and drop nodes. Each node becomes a step in DB. Add conditions using form field IDs.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate(`/admin/workflows/${wfId}/form`)}
          >
            <FileText size={14} /> Form Builder
          </button>
          <StatusBadge status={workflow?.status} />
        </div>
      </div>

      {/* Info about conditions */}
      {workflow?.formSchema?.length > 0 && (
        <div style={{
          marginBottom: 16,
          padding: '10px 16px',
          background: 'var(--green-bg)',
          borderRadius: 8,
          border: '1px solid rgba(34,197,94,0.2)',
          fontSize: '0.82rem',
          color: 'var(--text2)',
        }}>
          ✅ Form has <strong>{workflow.formSchema.length} fields</strong>.
          Available field IDs for conditions:{' '}
          {workflow.formSchema.map(f => (
            <code key={f.fieldId} style={{
              background: 'var(--bg3)',
              padding: '1px 6px',
              borderRadius: 4,
              fontSize: '0.75rem',
              marginRight: 4,
              color: 'var(--accent)',
            }}>
              {f.fieldId}
            </code>
          ))}
        </div>
      )}

      {workflow?.formSchema?.length === 0 && (
        <div style={{
          marginBottom: 16,
          padding: '10px 16px',
          background: 'var(--yellow-bg)',
          borderRadius: 8,
          border: '1px solid rgba(245,158,11,0.2)',
          fontSize: '0.82rem',
          color: 'var(--yellow)',
        }}>
          ⚠ No form fields defined yet.{' '}
          <button
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--yellow)', padding: '2px 8px' }}
            onClick={() => navigate(`/admin/workflows/${wfId}/form`)}
          >
            Go to Form Builder first →
          </button>
        </div>
      )}

      <WorkflowBuilder
        initialNodes={workflow?.flowData?.nodes || []}
        initialEdges={workflow?.flowData?.edges || []}
        onSave={handleSave}
        formSchema={workflow?.formSchema || []}
        saving={saving}
      />
    </div>
  );
}

// ── Router ────────────────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  return (
    <Routes>
      <Route index              element={<WorkflowList />}    />
      <Route path=":id/form"    element={<FormBuilderPage />} />
      <Route path=":id/builder" element={<BuilderPage />}     />
    </Routes>
  );
}