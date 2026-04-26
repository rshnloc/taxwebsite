import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Shield, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const ACTION_COLORS = { read: 'blue', create: 'green', update: 'yellow', delete: 'red', export: 'purple' };
const ACTION_BG = { read:'bg-blue-100 text-blue-700', create:'bg-green-100 text-green-700', update:'bg-yellow-100 text-yellow-700', delete:'bg-red-100 text-red-700', export:'bg-purple-100 text-purple-700' };

export default function AdminRoles() {
  const [roles, setRoles] = useState([]);
  const [modules, setModules] = useState([]);
  const [allPerms, setAllPerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [expandedRole, setExpandedRole] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [selectedPerms, setSelectedPerms] = useState(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [rolesRes, permsRes] = await Promise.all([api.getRoles(), api.getPermissions()]);
      setRoles(rolesRes.roles || []);
      setModules(permsRes.modules || []);
      setAllPerms(permsRes.permissions || []);
    } catch (e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditingRole(null); setForm({ name: '', description: '' }); setShowModal(true); };
  const openEdit = (r) => { setEditingRole(r); setForm({ name: r.name, description: r.description || '' }); setShowModal(true); };

  const openPermissions = (role) => {
    setEditingRole(role);
    setSelectedPerms(new Set(role.permissions.map(p => p.id)));
    setShowPermModal(true);
  };

  const togglePerm = (id) => {
    setSelectedPerms(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleModule = (moduleActions) => {
    const ids = moduleActions.map(a => a.id);
    const allSelected = ids.every(id => selectedPerms.has(id));
    setSelectedPerms(prev => {
      const s = new Set(prev);
      ids.forEach(id => allSelected ? s.delete(id) : s.add(id));
      return s;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingRole) { await api.updateRole(editingRole.id, form); toast.success('Role updated'); }
      else             { await api.createRole(form); toast.success('Role created'); }
      setShowModal(false); fetchAll();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleSavePerms = async () => {
    setSaving(true);
    try {
      await api.updateRolePermissions(editingRole.id, [...selectedPerms]);
      toast.success('Permissions saved');
      setShowPermModal(false); fetchAll();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (r) => {
    if (r.isSystem) return toast.error('System roles cannot be deleted');
    if (!confirm(`Delete role "${r.name}"?`)) return;
    try { await api.deleteRole(r.id); toast.success('Role deleted'); fetchAll(); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Roles & Permissions</h1>
            <p className="text-sm text-slate-500 mt-1">Manage dynamic roles and assign module-level permissions</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Role</button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {roles.map(role => (
            <div key={role.id} className="card overflow-hidden">
              {/* Role Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedRole(expandedRole === role.id ? null : role.id)}>
                  {expandedRole === role.id ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <Shield size={16} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{role.name}</h3>
                      {role.isSystem && <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full">System</span>}
                      {!role.isActive && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-slate-500">{role.description || 'No description'} · <span className="flex items-center gap-1 inline-flex"><Users size={11}/> {role.userCount} users</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 mr-2">{role.permissions?.length || 0} permissions</span>
                  <button onClick={() => openPermissions(role)} className="p-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 text-primary-600 text-xs font-medium px-2">
                    Edit Permissions
                  </button>
                  {!role.isSystem && (
                    <>
                      <button onClick={() => openEdit(role)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil size={14}/></button>
                      <button onClick={() => handleDelete(role)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded: Permission chips */}
              {expandedRole === role.id && (
                <div className="border-t border-slate-100 dark:border-slate-700 p-4">
                  {role.permissions?.length === 0 ? (
                    <p className="text-sm text-slate-400 italic">No permissions assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions.map(p => (
                        <span key={p.id} className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_BG[p.action] || 'bg-slate-100 text-slate-600'}`}>
                          {p.module}.{p.action}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create/Edit Role Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRole ? 'Edit Role' : 'Create Role'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Role Name *</label>
            <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="e.g. Team Lead"/>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input h-20" placeholder="What does this role do?"/>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editingRole ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>

      {/* Permission Matrix Modal */}
      <Modal isOpen={showPermModal} onClose={() => setShowPermModal(false)} title={`Permissions — ${editingRole?.name}`}>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {modules.map(mod => {
            const allSelected = mod.actions.every(a => selectedPerms.has(a.id));
            const someSelected = mod.actions.some(a => selectedPerms.has(a.id));
            return (
              <div key={mod.module} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {/* Module header */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-50 dark:bg-slate-800">
                  <span className="font-medium text-sm capitalize text-slate-700 dark:text-slate-300">{mod.module.replace(/_/g,' ')}</span>
                  <button
                    type="button"
                    onClick={() => toggleModule(mod.actions)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${allSelected ? 'bg-primary-500 text-white' : someSelected ? 'bg-primary-100 text-primary-700' : 'bg-slate-200 text-slate-500'}`}
                  >
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
                {/* Actions */}
                <div className="flex flex-wrap gap-2 p-3">
                  {mod.actions.map(action => {
                    const on = selectedPerms.has(action.id);
                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => togglePerm(action.id)}
                        className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-all ${
                          on ? `${ACTION_BG[action.action] || 'bg-primary-100 text-primary-700'} border-transparent` : 'border-slate-200 text-slate-500 hover:border-primary-300'
                        }`}
                      >
                        {on ? <Check size={10}/> : <X size={10}/>} {action.action}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100 dark:border-slate-700 mt-2">
          <button onClick={() => setShowPermModal(false)} className="btn-outline">Cancel</button>
          <button onClick={handleSavePerms} disabled={saving} className="btn-primary">{saving ? 'Saving...' : `Save (${selectedPerms.size} permissions)`}</button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
