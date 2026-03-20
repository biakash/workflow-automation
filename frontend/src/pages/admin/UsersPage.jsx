import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, Power, PowerOff, X, Users, Edit } from 'lucide-react';
import api from '../../api/client';
import toast from 'react-hot-toast';
import StatusBadge from '../../components/ui/StatusBadge';
import UserEditModal from '../../components/ui/UserEditModal';

const ROLES = ['manager', 'employee', 'finance'];
const ROLE_BADGE = { admin: 'badge-purple', manager: 'badge-cyan', employee: 'badge-blue', finance: 'badge-green' };

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [creating, setCreating] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const fetch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      const res = await api.get(`/users?${params}`);
      setUsers(res.data.data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [search, roleFilter]);

  const createUser = async () => {
    if (!form.name || !form.email || !form.password) { toast.error('All fields required'); return; }
    setCreating(true);
    try {
      await api.post('/users', form);
      toast.success('User created!');
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'employee' });
      fetch();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const toggleUser = async (user) => {
    try {
      await api.patch(`/users/${user._id}/toggle-status`);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetch();
    } catch { toast.error('Failed'); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Delete this user permanently?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('User deleted');
      fetch();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Create and manage system users</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> New User
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} color="var(--text3)" />
          <input placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {['admin', ...ROLES].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><div className="empty-state"><div className="spinner" /></div></td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7}><div className="empty-state"><Users size={32} /><p>No users found</p></div></td></tr>
              ) : users.map((u) => (
                <tr key={u._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: 'var(--accent-bg)', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
                      }}>
                        {u.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td><span className={`badge ${ROLE_BADGE[u.role] || 'badge-gray'}`}>{u.role}</span></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-green' : 'badge-red'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                    {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                  </td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text3)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" title={u.isActive ? 'Deactivate' : 'Activate'} onClick={() => toggleUser(u)}>
                        {u.isActive ? <PowerOff size={13} color="var(--yellow)" /> : <Power size={13} color="var(--green)" />}
                      </button>
                      <button className="btn btn-ghost btn-sm btn-icon" title="Edit" onClick={() => setEditUser(u)}>
                        <Edit size={13} />
                      </button>
                      {u.role !== 'admin' && (
                        <button className="btn btn-ghost btn-sm btn-icon" title="Delete" onClick={() => deleteUser(u._id)}>
                          <Trash2 size={13} color="var(--red)" />
                        </button>
                      )}
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
              <h3 style={{ fontWeight: 700 }}>Create New User</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowCreate(false)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input className="input" placeholder="John Smith" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address *</label>
                <input className="input" type="email" placeholder="user@company.com" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Password *</label>
                <input className="input" type="password" placeholder="Min 6 characters" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">Role *</label>
                <select className="select" value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createUser} disabled={creating}>
                {creating ? <div className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={14} />}
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editUser && (
        <UserEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={fetch}
        />
      )}
    </div>
  );
}