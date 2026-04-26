import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Building2, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const AVAILABLE_FIELDS = [
  { value: 'pan',          label: 'PAN Number' },
  { value: 'gst',          label: 'GST Number' },
  { value: 'company_name', label: 'Company Name' },
  { value: 'phone',        label: 'Phone Number' },
  { value: 'dob',          label: 'Date of Birth' },
  { value: 'address',      label: 'Address' },
  { value: 'aadhar',       label: 'Aadhar Number' },
  { value: 'cin',          label: 'CIN (Company)' },
  { value: 'tan',          label: 'TAN Number' },
  { value: 'msme',         label: 'MSME Number' },
];

export default function AdminClientTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', required_fields: [] });
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try { const res = await api.getClientTypes(); setTypes(res.clientTypes || []); }
    catch { toast.error('Failed to load client types'); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditingType(null);
    setForm({ name: '', description: '', required_fields: [] });
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditingType(t);
    setForm({ name: t.name, description: t.description || '', required_fields: t.required_fields || [] });
    setShowModal(true);
  };

  const toggleField = (val) => {
    setForm(f => ({
      ...f,
      required_fields: f.required_fields.includes(val)
        ? f.required_fields.filter(v => v !== val)
        : [...f.required_fields, val],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingType) { await api.updateClientType(editingType.id, form); toast.success('Updated'); }
      else             { await api.createClientType(form); toast.success('Created'); }
      setShowModal(false); fetchTypes();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Delete client type "${t.name}"?`)) return;
    try { await api.deleteClientType(t.id); toast.success('Deleted'); fetchTypes(); }
    catch (err) { toast.error(err.message); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Client Types</h1>
            <p className="text-sm text-slate-500 mt-1">Define client categories and required profile fields</p>
          </div>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2"><Plus size={16} /> New Type</button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {types.map(t => (
            <div key={t.id} className="card p-5 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center">
                    <Building2 size={18} className="text-white"/>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{t.name}</h3>
                    <p className="text-xs text-slate-400">{(t.required_fields || []).length} required field(s)</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil size={14}/></button>
                  <button onClick={() => handleDelete(t)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 size={14}/></button>
                </div>
              </div>
              {t.description && <p className="text-sm text-slate-500">{t.description}</p>}
              <div className="flex flex-wrap gap-1.5">
                {(t.required_fields || []).map(f => (
                  <span key={f} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 px-2 py-0.5 rounded-full">
                    {AVAILABLE_FIELDS.find(af => af.value === f)?.label || f}
                  </span>
                ))}
                {(!t.required_fields || t.required_fields.length === 0) && (
                  <span className="text-xs text-slate-400 italic">No required fields defined</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingType ? 'Edit Client Type' : 'Create Client Type'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Type Name *</label>
            <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="e.g. Partnership Firm"/>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input h-20" placeholder="When should this type be assigned?"/>
          </div>
          <div>
            <label className="label">Required Profile Fields</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {AVAILABLE_FIELDS.map(f => {
                const on = form.required_fields.includes(f.value);
                return (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => toggleField(f.value)}
                    className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border transition-all text-left ${
                      on ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-indigo-300'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 ${on ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-600'}`}>
                      {on && <Check size={10} className="text-white"/>}
                    </span>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Saving...' : editingType ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
