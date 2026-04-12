import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Package, Plus, Pencil, Trash2, Search, Star, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = ['all', 'tax', 'registration', 'compliance', 'licensing', 'legal', 'other'];

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
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
    setForm({
      name: '', shortDescription: '', description: '', category: 'tax', icon: '📄',
      'pricing.startingAt': '', 'pricing.gstIncluded': true, timeline: '',
      isPopular: false, isActive: true
    });
    setShowModal(true);
  };

  const openEdit = (svc) => {
    setEditingService(svc);
    setForm({
      name: svc.name, shortDescription: svc.shortDescription || '', description: svc.description || '',
      category: svc.category, icon: svc.icon || '📄',
      'pricing.startingAt': svc.pricing?.startingAt || '', 'pricing.gstIncluded': svc.pricing?.gstIncluded ?? true,
      timeline: svc.timeline || '', isPopular: svc.isPopular || false, isActive: svc.isActive !== false
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        category: form.category,
        icon: form.icon,
        pricing: { startingAt: Number(form['pricing.startingAt']), gstIncluded: form['pricing.gstIncluded'] },
        timeline: form.timeline,
        isPopular: form.isPopular,
        isActive: form.isActive
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
                  <span className={`text-xs ${svc.isActive !== false ? 'text-green-600' : 'text-red-500'}`}>
                    {svc.isActive !== false ? '● Active' : '● Inactive'}
                  </span>
                </div>
                {svc.timeline && <p className="text-xs text-slate-400 mt-1">⏱ {svc.timeline}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Service Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingService ? 'Edit Service' : 'Add Service'}>
          <form onSubmit={handleSubmit} className="space-y-4">
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
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">{editingService ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
