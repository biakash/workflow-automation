import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  addEdge, useNodesState, useEdgesState,
  Controls, MiniMap, Background, MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Plus, Save, Trash2, X, Info, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

// Custom node components
import StartNode from './nodes/StartNode';
import EndNode from './nodes/EndNode';
import InputNode from './nodes/InputNode';
import ConditionNode from './nodes/ConditionNode';
import TaskNode from './nodes/TaskNode';
import DecisionNode from './nodes/DecisionNode';
import NotificationNode from './nodes/NotificationNode';

// Register node types with React Flow
const NODE_TYPES = {
  start: StartNode,
  end: EndNode,
  input: InputNode,
  condition: ConditionNode,
  task: TaskNode,
  decision: DecisionNode,
  notification: NotificationNode,
};

const ROLES = ['employee', 'manager', 'finance', 'admin', 'any'];
const OPERATORS = [
  { value: 'equals', label: '= Equals' },
  { value: 'not_equals', label: '≠ Not Equals' },
  { value: 'greater_than', label: '> Greater Than' },
  { value: 'less_than', label: '< Less Than' },
  { value: 'greater_equal', label: '>= Greater or Equal' },
  { value: 'less_equal', label: '<= Less or Equal' },
  { value: 'contains', label: '⊃ Contains' },
  { value: 'not_contains', label: '⊅ Not Contains' },
  { value: 'not_empty', label: '✓ Not Empty' },
  { value: 'is_empty', label: '∅ Is Empty' },
];

// Node palette config
const NODE_PALETTE = [
  { type: 'start', label: 'Start', icon: '▶', desc: 'Entry point', color: '#22c55e', disabled: false },
  { type: 'input', label: 'Input', icon: '📄', desc: 'Collect form data', color: '#3b82f6', disabled: false },
  { type: 'condition', label: 'Condition', icon: '◇', desc: 'IF/ELSE branch', color: '#a855f7', disabled: false },
  { type: 'task', label: 'Task', icon: '✅', desc: 'Human approval', color: '#6366f1', disabled: false },
  { type: 'decision', label: 'Decision', icon: '🔀', desc: 'Multi-branch choice', color: '#f59e0b', disabled: false },
  { type: 'notification', label: 'Notification', icon: '🔔', desc: 'Send alert (auto)', color: '#06b6d4', disabled: false },
  { type: 'end', label: 'End', icon: '⏹', desc: 'Terminal node', color: '#ef4444', disabled: false },
];

let _uid = 200;
const uid = () => `node-${++_uid}-${Date.now().toString(36)}`;

const makeEdgeStyle = () => ({
  animated: true,
  style: { stroke: '#334155', strokeWidth: 2 },
  markerEnd: { type: MarkerType.ArrowClosed, color: '#4f8ef7' },
});

const buildInitialNodeData = (type, priority) => {
  const base = { nodeType: type, label: type.charAt(0).toUpperCase() + type.slice(1), priority };
  switch (type) {
    case 'start': return { ...base, label: 'Start' };
    case 'end': return { ...base, label: 'End', message: '', endState: 'completed' };
    case 'input': return { ...base, label: 'Collect Input', fields: [] };
    case 'condition': return { ...base, label: 'Check Condition', conditions: [], rejectReason: '' };
    case 'task': return { ...base, label: 'Approval Required', assignedRole: 'manager', requireComment: false };
    case 'decision': return { ...base, label: 'Make Decision', assignedRole: 'manager', branches: [{ label: 'Option A', handle: 'optionA' }, { label: 'Option B', handle: 'optionB' }] };
    case 'notification': return { ...base, label: 'Send Notification', notifTitle: 'Notification', notifMessage: '', notifType: 'info', notifRecipientType: 'requestUser', notifRecipientRole: '' };
    default: return base;
  }
};

export default function WorkflowBuilder({
  initialNodes = [],
  initialEdges = [],
  onSave,
  formSchema = [],
  saving = false,
}) {
  const reactFlowWrapper = useRef(null);

  const defaultStart = {
    id: 'node-start',
    type: 'start',
    position: { x: 300, y: 80 },
    data: buildInitialNodeData('start', 0),
  };

  const [nodes, setNodes, onNodesChange] = useNodesState(
    initialNodes.length > 0 ? initialNodes.map(n => ({ ...n, type: n.data?.nodeType || n.type || 'task' })) : [defaultStart]
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({});

  const onConnect = useCallback(
    (params) => setEdges(eds => addEdge({ ...params, ...makeEdgeStyle() }, eds)),
    [setEdges]
  );

  // Drag from palette
  const onDragStart = (e, nodeType) => {
    e.dataTransfer.setData('application/reactflow', nodeType);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      const nodeType = e.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: e.clientX - bounds.left - 80,
        y: e.clientY - bounds.top - 40,
      };

      const id = uid();
      const priority = nodes.length + 1;
      const newNode = {
        id,
        type: nodeType,
        position,
        data: buildInitialNodeData(nodeType, priority),
      };

      setNodes(ns => [...ns, newNode]);
      toast.success(`${nodeType} node added`);
    },
    [nodes, setNodes]
  );

  const onDragOver = useCallback(e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((_, node) => {
    setSelected(node);
    setForm({ ...node.data });
  }, []);

  const updateNode = () => {
    setNodes(ns => ns.map(n =>
      n.id === selected.id
        ? { ...n, data: { ...form, nodeType: n.data.nodeType || n.type } }
        : n
    ));
    setSelected(null);
    toast.success('Node updated ✓');
  };

  const deleteNode = () => {
    setNodes(ns => ns.filter(n => n.id !== selected.id));
    setEdges(es => es.filter(e => e.source !== selected.id && e.target !== selected.id));
    setSelected(null);
  };

  const addCondition = () => {
    setForm(p => ({
      ...p,
      conditions: [
        ...(p.conditions || []),
        { field: formSchema[0]?.fieldId || '', operator: 'equals', value: '', logicalOperator: 'AND' },
      ],
    }));
  };

  const updateCondition = (idx, key, val) => {
    const conds = [...(form.conditions || [])];
    conds[idx] = { ...conds[idx], [key]: val };
    setForm(p => ({ ...p, conditions: conds }));
  };

  const removeCondition = (idx) => {
    setForm(p => ({ ...p, conditions: p.conditions.filter((_, i) => i !== idx) }));
  };

  const addBranch = () => {
    const label = `Branch ${(form.branches || []).length + 1}`;
    const handle = `branch_${Date.now()}`;
    setForm(p => ({ ...p, branches: [...(p.branches || []), { label, handle }] }));
  };

  const handleSave = async () => {
    if (nodes.length === 0) { toast.error('Add at least one node'); return; }
    const hasStart = nodes.some(n => n.data?.nodeType === 'start' || n.type === 'start');
    if (!hasStart) { toast.error('Flow must have a Start node'); return; }
    await onSave({ nodes, edges });
  };

  const nodeType = form?.nodeType || selected?.type || '';

  return (
    <div style={{ display: 'flex', height: '100%', gap: 0, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>

      {/* Left: Node Palette */}
      <div style={{
        width: 180,
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        overflowY: 'auto',
      }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Node Palette
        </p>
        <p style={{ fontSize: '0.6rem', color: 'var(--text3)', marginBottom: 8 }}>
          Drag nodes onto the canvas →
        </p>
        {NODE_PALETTE.map(p => (
          <div
            key={p.type}
            draggable
            onDragStart={e => onDragStart(e, p.type)}
            style={{
              padding: '8px 10px',
              background: 'var(--bg3)',
              border: `1px solid ${p.color}44`,
              borderRadius: 8,
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.15s',
              userSelect: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = p.color; e.currentTarget.style.background = `${p.color}15`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = `${p.color}44`; e.currentTarget.style.background = 'var(--bg3)'; }}
          >
            <div style={{
              width: 28, height: 28,
              background: `${p.color}22`,
              borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem',
              flexShrink: 0,
              border: `1px solid ${p.color}55`,
            }}>
              {p.icon}
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>{p.label}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text3)' }}>{p.desc}</div>
            </div>
          </div>
        ))}

        <div style={{ marginTop: 'auto', padding: '10px 0', borderTop: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.6rem', color: 'var(--text3)', lineHeight: 1.6 }}>
            <Info size={9} style={{ display: 'inline', marginRight: 3 }} />
            Connect ConditionNode TRUE handle (green) to success path.<br />FALSE handle (red) to rejection path.
          </p>
        </div>
      </div>

      {/* Center: React Flow Canvas */}
      <div
        ref={reactFlowWrapper}
        style={{ flex: 1, height: 600 }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          defaultEdgeOptions={makeEdgeStyle()}
        >
          <Controls />
          <MiniMap
            nodeColor={n => {
              const t = n.data?.nodeType || n.type;
              const entry = NODE_PALETTE.find(p => p.type === t);
              return entry?.color || '#4f8ef7';
            }}
            style={{ background: '#111520', border: '1px solid var(--border)' }}
          />
          <Background color="#1e2640" gap={24} />
        </ReactFlow>
      </div>

      {/* Right: Config / Save Panel */}
      <div style={{
        width: 300,
        background: 'var(--bg2)',
        borderLeft: '1px solid var(--border)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        overflowY: 'auto',
      }}>
        {/* Save button */}
        <button
          className="btn btn-primary w-full"
          onClick={handleSave}
          disabled={saving}
        >
          {saving
            ? <><div className="spinner" style={{ width: 13, height: 13 }} /> Saving...</>
            : <><Save size={14} /> Save Flow to DB</>
          }
        </button>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'Nodes', value: nodes.length, color: 'var(--accent)' },
            { label: 'Edges', value: edges.length, color: 'var(--green)' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center',
              background: 'var(--bg3)',
              borderRadius: 8, padding: '8px 0',
            }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Node editor */}
        {selected ? (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>
                Configure: <span style={{ color: 'var(--accent)', textTransform: 'capitalize' }}>{nodeType}</span>
              </p>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelected(null)}>
                <X size={12} />
              </button>
            </div>

            {/* Label field (all nodes) */}
            <div className="input-group">
              <label className="input-label">Label</label>
              <input
                className="input"
                style={{ fontSize: '0.82rem', padding: '7px 10px' }}
                value={form.label || ''}
                onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
              />
            </div>

            {/* ── INPUT NODE ── */}
            {nodeType === 'input' && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text2)', padding: '8px 10px', background: 'var(--bg3)', borderRadius: 6 }}>
                📄 This node auto-collects the workflow form fields. Form fields are defined in the Form Builder tab.
              </div>
            )}

            {/* ── CONDITION NODE ── */}
            {nodeType === 'condition' && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>
                    Rules (evaluated against form data):
                  </p>
                  {formSchema.length > 0 && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text3)', padding: '4px 8px', background: 'var(--bg3)', borderRadius: 5 }}>
                      Fields: {formSchema.map(f => <code key={f.fieldId} style={{ color: 'var(--accent)', marginRight: 4 }}>{f.fieldId}</code>)}
                    </div>
                  )}
                  {(form.conditions || []).map((cond, idx) => (
                    <div key={idx} style={{ background: 'var(--bg)', borderRadius: 8, padding: 8, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {idx > 0 && (
                        <select
                          style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 5, color: 'var(--accent)', padding: '2px 5px', fontSize: '0.7rem', fontWeight: 700 }}
                          value={cond.logicalOperator}
                          onChange={e => updateCondition(idx, 'logicalOperator', e.target.value)}
                        >
                          <option value="AND">AND</option>
                          <option value="OR">OR</option>
                        </select>
                      )}
                      <select
                        className="select"
                        style={{ fontSize: '0.76rem', padding: '5px 7px' }}
                        value={cond.field}
                        onChange={e => updateCondition(idx, 'field', e.target.value)}
                      >
                        <option value="">Select Field</option>
                        {formSchema.map(f => (
                          <option key={f.fieldId} value={f.fieldId}>{f.label} ({f.fieldId})</option>
                        ))}
                      </select>
                      <select
                        className="select"
                        style={{ fontSize: '0.76rem', padding: '5px 7px' }}
                        value={cond.operator}
                        onChange={e => updateCondition(idx, 'operator', e.target.value)}
                      >
                        {OPERATORS.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
                      </select>
                      {!['not_empty', 'is_empty'].includes(cond.operator) && (
                        <input
                          className="input"
                          style={{ fontSize: '0.76rem', padding: '5px 8px' }}
                          placeholder="Value"
                          value={cond.value || ''}
                          onChange={e => updateCondition(idx, 'value', e.target.value)}
                        />
                      )}
                      <button
                        className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--red)', fontSize: '0.7rem' }}
                        onClick={() => removeCondition(idx)}
                      >
                        <Trash2 size={10} /> Remove
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={addCondition}>
                    <Plus size={11} /> Add Rule
                  </button>
                </div>
                <div className="input-group">
                  <label className="input-label">Rejection Message (if conditions fail & no FALSE path)</label>
                  <input
                    className="input"
                    style={{ fontSize: '0.78rem', padding: '6px 8px' }}
                    value={form.rejectReason || ''}
                    onChange={e => setForm(p => ({ ...p, rejectReason: e.target.value }))}
                    placeholder="e.g. Age must be 21+"
                  />
                </div>
              </>
            )}

            {/* ── TASK NODE ── */}
            {(nodeType === 'task' || nodeType === 'approval') && (
              <>
                <div className="input-group">
                  <label className="input-label">Assigned Role</label>
                  <select
                    className="select"
                    style={{ fontSize: '0.82rem' }}
                    value={form.assignedRole || 'manager'}
                    onChange={e => setForm(p => ({ ...p, assignedRole: e.target.value }))}
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.requireComment || false}
                    onChange={e => setForm(p => ({ ...p, requireComment: e.target.checked }))}
                  />
                  <span style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>Require comment on action</span>
                </label>
              </>
            )}

            {/* ── DECISION NODE ── */}
            {nodeType === 'decision' && (
              <>
                <div className="input-group">
                  <label className="input-label">Assigned Role</label>
                  <select className="select" style={{ fontSize: '0.82rem' }} value={form.assignedRole || 'manager'} onChange={e => setForm(p => ({ ...p, assignedRole: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Branches (output handles)</label>
                  {(form.branches || []).map((b, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                      <input
                        className="input"
                        style={{ fontSize: '0.76rem', padding: '5px 8px' }}
                        value={b.label}
                        onChange={e => {
                          const bs = [...form.branches];
                          bs[i] = { ...bs[i], label: e.target.value, handle: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                          setForm(p => ({ ...p, branches: bs }));
                        }}
                        placeholder={`Branch ${i + 1}`}
                      />
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setForm(p => ({ ...p, branches: p.branches.filter((_, j) => j !== i) }))}>
                        <Trash2 size={11} color="var(--red)" />
                      </button>
                    </div>
                  ))}
                  <button className="btn btn-ghost btn-sm" onClick={addBranch}><Plus size={11} /> Add Branch</button>
                </div>
              </>
            )}

            {/* ── NOTIFICATION NODE ── */}
            {nodeType === 'notification' && (
              <>
                <div className="input-group">
                  <label className="input-label">Alert Title</label>
                  <input className="input" style={{ fontSize: '0.82rem' }} value={form.notifTitle || ''} onChange={e => setForm(p => ({ ...p, notifTitle: e.target.value }))} placeholder="e.g. Loan Approved" />
                </div>
                <div className="input-group">
                  <label className="input-label">Message (use {'{{fieldId}}'} for data)</label>
                  <textarea
                    className="textarea"
                    style={{ fontSize: '0.78rem', minHeight: 60 }}
                    value={form.notifMessage || ''}
                    onChange={e => setForm(p => ({ ...p, notifMessage: e.target.value }))}
                    placeholder="Your loan for {{amount}} has been approved!"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Notification Type</label>
                  <select className="select" style={{ fontSize: '0.82rem' }} value={form.notifType || 'info'} onChange={e => setForm(p => ({ ...p, notifType: e.target.value }))}>
                    {['info', 'success', 'warning', 'error'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                {/* ── Recipient Configuration (Issue 1 fix) ── */}
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 10, border: '1px solid var(--border)' }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Recipient Configuration</p>
                  <div className="input-group">
                    <label className="input-label">Send To</label>
                    <select
                      className="select"
                      style={{ fontSize: '0.82rem' }}
                      value={form.notifRecipientType || 'requestUser'}
                      onChange={e => setForm(p => ({ ...p, notifRecipientType: e.target.value, notifRecipientRole: '' }))}
                    >
                      <option value="requestUser">👤 Request Submitter (who submitted the form)</option>
                      <option value="role">👥 All users with a specific role</option>
                    </select>
                  </div>
                  {form.notifRecipientType === 'role' && (
                    <div className="input-group" style={{ marginTop: 8 }}>
                      <label className="input-label">Target Role</label>
                      <select
                        className="select"
                        style={{ fontSize: '0.82rem' }}
                        value={form.notifRecipientRole || ''}
                        onChange={e => setForm(p => ({ ...p, notifRecipientRole: e.target.value }))}
                      >
                        <option value="">Select role...</option>
                        {ROLES.filter(r => r !== 'any').map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── END NODE ── */}
            {nodeType === 'end' && (
              <>
                <div className="input-group">
                  <label className="input-label">End State</label>
                  <select
                    className="select"
                    style={{ fontSize: '0.82rem' }}
                    value={form.endState || 'completed'}
                    onChange={e => setForm(p => ({ ...p, endState: e.target.value }))}
                  >
                    <option value="completed">✅ Approved (Completed)</option>
                    <option value="rejected">❌ Rejected</option>
                  </select>
                </div>
                <div className="input-group">
                  <label className="input-label">Final Message (optional)</label>
                  <input className="input" style={{ fontSize: '0.82rem' }} value={form.message || ''} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder={form.endState === 'rejected' ? 'e.g. Request denied' : 'e.g. Process complete!'} />
                </div>
              </>
            )}

            <button className="btn btn-primary btn-sm w-full" onClick={updateNode}>
              <ChevronRight size={13} /> Apply Changes
            </button>
            <button className="btn btn-danger btn-sm w-full" onClick={deleteNode}>
              <Trash2 size={12} /> Delete Node
            </button>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '24px 10px',
            color: 'var(--text3)',
            fontSize: '0.78rem',
            lineHeight: 1.6,
          }}>
            <Info size={24} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
            Click a node on the canvas to configure it.
            <br />
            <span style={{ fontSize: '0.68rem', opacity: 0.6 }}>Drag from the left palette to add nodes.</span>
          </div>
        )}
      </div>
    </div>
  );
}