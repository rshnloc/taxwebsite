import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, EmptyState, Modal } from '../../components/ui';
import { Tags, Plus, Pencil, Trash2, GripVertical, ToggleLeft, ToggleRight } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const emptyForm = () => ({ name: '', description: '', icon: '📄', isActive: true, sortOrder: 0 });

export default function AdminDocumentFields() {
  const [fieldTypes, setFieldTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchFieldTypes(); }, []);

  const fetchFieldTypes = async () => {
    try {
      setLoading(true);
      const data = await api.getDocumentFieldTypes(false); // include inactive
      setFieldTypes(data.fieldTypes || []);
    } catch (e) { toast.error('Failed to load field types'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm(), sortOrder: fieldTypes.length + 1 });
    setShowModal(true);
  };

  const openEdit = (ft) => {
    setEditing(ft);
    setForm({ name: ft.name, description: ft.description || '', icon: ft.icon || '📄', isActive: ft.isActive, sortOrder: ft.sortOrder });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.updateDocumentFieldType(editing.id, form);
        toast.success('Field type updated');
      } else {
        await api.createDocumentFieldType(form);
        toast.success('Field type created');
      }
      setShowModal(false);
      fetchFieldTypes();
    } catch (e) { toast.error(e.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (ft) => {
    if (!confirm(`Delete "${ft.name}"? This won't affect existing services.`)) return;
    try {
      await api.deleteDocumentFieldType(ft.id);
      toast.success('Deleted');
      fetchFieldTypes();
    } catch (e) { toast.error('Failed to delete'); }
  };

  const toggleActive = async (ft) => {
    try {
      await api.updateDocumentFieldType(ft.id, { isActive: !ft.isActive });
      setFieldTypes(prev => prev.map(f => f.id === ft.id ? { ...f, isActive: !f.isActive } : f));
    } catch (e) { toast.error('Failed'); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const active = fieldTypes.filter(f => f.isActive);
  const inactive = fieldTypes.filter(f => !f.isActive);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Document Field Types</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Define the document types clients can upload. These appear as dropdown options when configuring service documents.
            </p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Add Field Type
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
            <p className="text-xs text-green-600 font-medium">Active</p>
            <p className="text-2xl font-bold text-green-700">{active.length}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
            <p className="text-xs text-slate-500 font-medium">Inactive</p>
            <p className="text-2xl font-bold text-slate-600 dark:text-slate-300">{inactive.length}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-4 py-3">
            <p className="text-xs text-blue-600 font-medium">Total</p>
            <p className="text-2xl font-bold text-blue-700">{fieldTypes.length}</p>
          </div>
        </div>

        {/* Active Field Types */}
        {active.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">Active Fields</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {active.sort((a, b) => a.sortOrder - b.sortOrder).map(ft => (
                <FieldCard key={ft.id} ft={ft} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />
              ))}
            </div>
          </div>
        )}

        {/* Inactive */}
        {inactive.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Inactive Fields</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 opacity-60">
              {inactive.map(ft => (
                <FieldCard key={ft.id} ft={ft} onEdit={openEdit} onDelete={handleDelete} onToggle={toggleActive} />
              ))}
            </div>
          </div>
        )}

        {fieldTypes.length === 0 && (
          <EmptyState icon={Tags} title="No field types yet" description="Add document types like PAN Card, Aadhaar, etc." />
        )}

        {/* Add / Edit Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Field Type' : 'Add Field Type'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-5 gap-3">
              <div className="col-span-1">
                <label className="label">Icon</label>
                <input
                  type="text"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                  className="input text-center text-2xl"
                  placeholder="📄"
                />
              </div>
              <div className="col-span-4">
                <label className="label">Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="input"
                  placeholder="e.g. PAN Card"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Description <span className="text-slate-400 font-normal">(hint shown to client)</span></label>
              <input
                type="text"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="input"
                placeholder="e.g. Upload front side of your PAN card"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                  className="input"
                  min="0"
                />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-slate-700 dark:text-slate-200 font-medium">Active</span>
                  <span className="text-slate-400 text-xs">(show in services dropdown)</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}

function FieldCard({ ft, onEdit, onDelete, onToggle }) {
  return (
    <div className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
      <span className="text-2xl flex-shrink-0">{ft.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{ft.name}</p>
        {ft.description && (
          <p className="text-xs text-slate-400 truncate mt-0.5">{ft.description}</p>
        )}
        <p className="text-xs text-slate-300 mt-0.5">Order: {ft.sortOrder}</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onToggle(ft)}
          className={`p-1.5 rounded-lg transition-colors ${ft.isActive ? 'text-green-500 hover:bg-green-50' : 'text-slate-400 hover:bg-slate-100'}`}
          title={ft.isActive ? 'Deactivate' : 'Activate'}
        >
          {ft.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </button>
        <button onClick={() => onEdit(ft)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(ft)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
