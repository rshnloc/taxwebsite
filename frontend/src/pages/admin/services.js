import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Package, Plus, Pencil, Trash2, Search, Star, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'tax', 'registration', 'compliance', 'licensing', 'legal', 'other'];

const emptyDoc = () => ({ name: '', description: '', isMandatory: true });

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [editingService, setEditingService] = useState(null);
  const [documents, setDocuments] = useState([emptyDoc()]);
  const [form, setForm] = useState({
    name: '', shortDescription: '', description: '', category: 'tax', icon: '📄',
    'pricing.startingAt': '', 'pricing.gstIncluded': true, timeline: '',
    isPopular: false, isActive: true
  });

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data.services || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditingService(null);
    setActiveTab('basic');
    setDocuments([emptyDoc()]);
    setForm({
      name: '', shortDescription: '', description: '', category: 'tax', icon: '📄',
      'pricing.startingAt': '', 'pricing.gstIncluded': true, timeline: '',
      isPopular: false, isActive: true
    });
    setShowModal(true);
  };

  const openEdit = (svc) => {
    setEditingService(svc);
    setActiveTab('basic');
    setDocuments(
      svc.requiredDocuments?.length
        ? svc.requiredDocuments.map(d => ({ name: d.name || '', description: d.description || '', isMandatory: d.isMandatory !== false }))
        : [emptyDoc()]
    );
    setForm({
      name: svc.name, shortDescription: svc.shortDescription || '', description: svc.description || '',
      category: svc.category, icon: svc.icon || '📄',
      'pricing.startingAt': svc.pricing?.startingAt || '', 'pricing.gstIncluded': svc.pricing?.gstIncluded ?? true,
      timeline: svc.timeline || '', isPopular: svc.isPopular || false, isActive: svc.isActive !== false
    });
    setShowModal(true);
  };

  // Document helpers
  const addDoc = () => setDocuments(d => [...d, emptyDoc()]);
  const removeDoc = (i) => setDocuments(d => d.filter((_, idx) => idx !== i));
  const updateDoc = (i, field, value) => setDocuments(d => d.map((doc, idx) => idx === i ? { ...doc, [field]: value } : doc));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const validDocs = documents.filter(d => d.name.trim());
      const payload = {
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        category: form.category,
        icon: form.icon,
        pricing: { startingAt: Number(form['pricing.startingAt']), gstIncluded: form['pricing.gstIncluded'] },
        timeline: form.timeline,
        isPopular: form.isPopular,
        isActive: form.isActive,
        requiredDocuments: validDocs,
      };

      if (editingService) {
        await api.updateService(editingService._id, payload);
        toast.success('Service updated');
      } else {
        await api.createService(payload);
        toast.success('Service created');
      }
      setShowModal(false);
      fetchServices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this service?')) return;
    try {
      await api.deleteService(id);
      toast.success('Service deleted');
      fetchServices();
    } catch (error) { toast.error('Failed to delete'); }
  };

  const filtered = services.filter(s => {
    const matchesCategory = category === 'all' || s.category === category;
    const matchesSearch = !search || s.name?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Services</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2 text-sm w-48" />
            </div>
            <button onClick={openAdd} className="btn-primary btn-sm"><Plus size={16} className="mr-1" /> Add Service</button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                category === c ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Package} title="No services found" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(svc => (
              <div key={svc._id} className="card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{svc.icon}</span>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{svc.name}</h3>
                      <span className="text-xs text-slate-500 capitalize">{svc.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {svc.isPopular && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
                    <button onClick={() => openEdit(svc)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(svc._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{svc.shortDescription}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold text-primary-600">₹{svc.pricing?.startingAt?.toLocaleString('en-IN') || '0'}</span>
                  <div className="flex items-center gap-2">
                    {svc.requiredDocuments?.length > 0 && (
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <FileText size={12} /> {svc.requiredDocuments.length} docs
                      </span>
                    )}
                    <span className={`text-xs ${svc.isActive !== false ? 'text-green-600' : 'text-red-500'}`}>
                      {svc.isActive !== false ? '● Active' : '● Inactive'}
                    </span>
                  </div>
                </div>
                {svc.timeline && <p className="text-xs text-slate-400 mt-1">⏱ {svc.timeline}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Service Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingService ? 'Edit Service' : 'Add Service'}>
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 -mt-1">
            {[['basic', 'Basic Info'], ['documents', 'Documents Required']].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {label}
                {key === 'documents' && documents.filter(d => d.name).length > 0 && (
                  <span className="ml-1.5 bg-primary-100 text-primary-700 text-xs rounded-full px-1.5 py-0.5">
                    {documents.filter(d => d.name).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div className="col-span-1">
                    <label className="label">Icon</label>
                    <input type="text" value={form.icon} onChange={e => setForm({ ...form, icon: e.target.value })} className="input text-center text-2xl" />
                  </div>
                  <div className="col-span-3">
                    <label className="label">Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Short Description</label>
                  <input type="text" value={form.shortDescription} onChange={e => setForm({ ...form, shortDescription: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input h-20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category *</label>
                    <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="input">
                      {CATEGORIES.filter(c => c !== 'all').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Starting Price (₹)</label>
                    <input type="number" value={form['pricing.startingAt']} onChange={e => setForm({ ...form, 'pricing.startingAt': e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Timeline</label>
                  <input type="text" value={form.timeline} onChange={e => setForm({ ...form, timeline: e.target.value })} className="input" placeholder="e.g., 5-7 working days" />
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isPopular} onChange={e => setForm({ ...form, isPopular: e.target.checked })} className="rounded" />
                    Popular Service
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                    Active
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form['pricing.gstIncluded']} onChange={e => setForm({ ...form, 'pricing.gstIncluded': e.target.checked })} className="rounded" />
                    GST Included
                  </label>
                </div>
              </>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Define what documents clients must upload for this service.</p>
                  <button type="button" onClick={addDoc} className="btn-primary btn-sm flex items-center gap-1">
                    <Plus size={14} /> Add Document
                  </button>
                </div>

                {documents.length === 0 && (
                  <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No documents configured. Click "Add Document" to start.</p>
                  </div>
                )}

                {documents.map((doc, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className={doc.isMandatory ? 'text-red-500' : 'text-slate-400'} />
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Document name *"
                          value={doc.name}
                          onChange={e => updateDoc(i, 'name', e.target.value)}
                          className="input py-1.5 text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Description (optional)"
                          value={doc.description}
                          onChange={e => updateDoc(i, 'description', e.target.value)}
                          className="input py-1.5 text-sm"
                        />
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap cursor-pointer">
                        <input
                          type="checkbox"
                          checked={doc.isMandatory}
                          onChange={e => updateDoc(i, 'isMandatory', e.target.checked)}
                          className="rounded accent-red-500"
                        />
                        <span className={doc.isMandatory ? 'text-red-600 font-medium' : ''}>Required</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        disabled={documents.length === 1}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}

                {documents.some(d => d.isMandatory && d.name) && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    <AlertCircle size={13} />
                    <span>Documents marked <strong>Required</strong> must be uploaded by clients before submitting an application.</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">{editingService ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
