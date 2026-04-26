import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, Modal } from '../../components/ui';
import api from '../../lib/api';
import { UserCheck, Plus, Pencil, Trash2, Search, RefreshCw, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
  active:   'bg-green-100 text-green-700',
  inactive: 'bg-slate-100 text-slate-500',
  transferred: 'bg-yellow-100 text-yellow-700',
};

export default function AdminRMAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [rmList, setRMList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form, setForm] = useState({ rm_id: '', client_id: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterRM, setFilterRM] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      const [aRes, rRes] = await Promise.all([api.getRMAssignments(), api.getRMList()]);
      setAssignments(aRes.assignments || []);
      setRMList(rRes.rms || []);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditingAssignment(null); setForm({ rm_id: '', client_id: '', notes: '' }); setShowModal(true); };
  const openEdit = (a) => { setEditingAssignment(a); setForm({ rm_id: a.rm_id, client_id: a.client_id, notes: a.notes || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingAssignment) { await api.updateRMAssignment(editingAssignment.id, form); toast.success('Assignment updated'); }
      else                   { await api.assignRM(form); toast.success('RM assigned'); }
      setShowModal(false); fetchAll();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleUnassign = async (a) => {
    if (!confirm(`Remove RM assignment for ${a.client_name}?`)) return;
    try { await api.unassignRM(a.id); toast.success('Assignment removed'); fetchAll(); }
    catch (err) { toast.error(err.message); }
  };

  const filtered = assignments.filter(a => {
    const q = search.toLowerCase();
    if (q && !a.client_name?.toLowerCase().includes(q) && !a.rm_name?.toLowerCase().includes(q) && !a.client_email?.toLowerCase().includes(q)) return false;
    if (filterRM && a.rm_id != filterRM) return false;
    if (filterStatus && a.status !== filterStatus) return false;
    return true;
  });

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">RM Assignments</h1>
            <p className="text-sm text-slate-500 mt-1">Assign Relationship Managers to clients</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="btn-outline flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
            <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16}/> Assign RM</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Assignments', val: assignments.length, color: 'bg-blue-50 text-blue-600' },
            { label: 'Active', val: assignments.filter(a => a.status === 'active').length, color: 'bg-green-50 text-green-600' },
            { label: 'Unique RMs', val: new Set(assignments.map(a => a.rm_id)).size, color: 'bg-indigo-50 text-indigo-600' },
            { label: 'Unique Clients', val: new Set(assignments.map(a => a.client_id)).size, color: 'bg-orange-50 text-orange-600' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <div className="text-2xl font-bold">{s.val}</div>
              <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-8 py-2" placeholder="Search client or RM..."/>
          </div>
          <div className="relative min-w-[150px]">
            <select value={filterRM} onChange={e => setFilterRM(e.target.value)} className="input py-2 appearance-none pr-8">
              <option value="">All RMs</option>
              {rmList.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          </div>
          <div className="relative min-w-[140px]">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input py-2 appearance-none pr-8">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="transferred">Transferred</option>
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Client</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Relationship Manager</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Assigned On</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Notes</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-slate-400">No assignments found</td></tr>
                ) : filtered.map(a => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{a.client_name}</div>
                      <div className="text-xs text-slate-400">{a.client_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-white">{a.rm_name}</div>
                      <div className="text-xs text-slate-400">{a.rm_email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[a.status] || 'bg-slate-100 text-slate-500'}`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 max-w-[160px] truncate" title={a.notes}>{a.notes || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(a)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil size={14}/></button>
                        {a.status === 'active' && (
                          <button onClick={() => handleUnassign(a)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assign/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAssignment ? 'Edit Assignment' : 'Assign RM to Client'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Relationship Manager *</label>
            <div className="relative">
              <select required value={form.rm_id} onChange={e => setForm({...form, rm_id: e.target.value})} className="input appearance-none pr-8">
                <option value="">Select RM...</option>
                {rmList.map(r => (
                  <option key={r.id} value={r.id}>{r.name} — {r.email}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"/>
            </div>
          </div>
          {!editingAssignment && (
            <div>
              <label className="label">Client User ID *</label>
              <input required type="number" value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})} className="input" placeholder="Enter client user ID"/>
              <p className="text-xs text-slate-400 mt-1">You can find the User ID from the Users management page</p>
            </div>
          )}
          <div>
            <label className="label">Notes</label>
            <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="input h-20" placeholder="Optional notes about this assignment"/>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editingAssignment ? 'Update' : 'Assign'}</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
