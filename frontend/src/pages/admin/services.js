import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Package, Plus, Pencil, Trash2, Search, Star, FileText, AlertCircle, Lock, Key, ExternalLink, Upload, X, Image, Tag, Grid } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const POPULAR_EMOJIS = ['📄','📑','📋','🏢','💰','🧾','📊','📈','💼','🏦','🪙','⚖️','🔏','📜','🗂️','✅','🏠','🚗','💡','🛂','🪪'];
const CAT_EMOJIS = ['📁','🧾','🏢','✅','📜','⚖️','💼','🏦','📊','📈','🪙','🔏','💡','🛂','🪪','🏠','🚗','📋'];

const emptyDoc = () => ({ name: '', description: '', isMandatory: true, passwordEnabled: false });
const emptyCategory = () => ({ name: '', icon: '📁', description: '', sortOrder: 0 });

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('services'); // 'services' | 'categories'
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [editingService, setEditingService] = useState(null);
  const [documents, setDocuments] = useState([emptyDoc()]);
  const [fieldTypes, setFieldTypes] = useState([]);
  const [iconFile, setIconFile] = useState(null);
  const [iconPreview, setIconPreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const iconFileRef = useRef(null);
  // Category management
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState(emptyCategory());
  const [showCatEmojiPicker, setShowCatEmojiPicker] = useState(false);

  const [form, setForm] = useState({
    name: '', shortDescription: '', description: '', category: 'tax', icon: '📄',
    'pricing.startingAt': '', 'pricing.gstPercent': 18, 'pricing.gstIncluded': false, timeline: '',
    isPopular: false, isActive: true
  });

  useEffect(() => { fetchServices(); fetchFieldTypes(); fetchCategories(); }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.getServiceCategories();
      setCategories(data.categories || []);
    } catch (e) { console.error('Failed to load categories', e); }
  };

  const fetchFieldTypes = async () => {
    try {
      const data = await api.getDocumentFieldTypes(true);
      setFieldTypes(data.fieldTypes || []);
    } catch (e) { console.error('Failed to load field types', e); }
  };

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
    setIconFile(null); setIconPreview(null); setShowEmojiPicker(false);
    setForm({
      name: '', shortDescription: '', description: '',
      category: categories[0]?.slug || 'tax', icon: '📄',
      'pricing.startingAt': '', 'pricing.gstPercent': 18, 'pricing.gstIncluded': false, timeline: '',
      isPopular: false, isActive: true
    });
    setShowModal(true);
  };

  const openEdit = (svc) => {
    setEditingService(svc);
    setActiveTab('basic');
    setIconFile(null);
    setIconPreview(svc.iconUrl || null);
    setShowEmojiPicker(false);
    setDocuments(
      svc.requiredDocuments?.length
        ? svc.requiredDocuments.map(d => ({ name: d.name || '', description: d.description || '', isMandatory: d.isMandatory !== false, passwordEnabled: d.passwordEnabled || false }))
        : [emptyDoc()]
    );
    setForm({
      name: svc.name, shortDescription: svc.shortDescription || '', description: svc.description || '',
      category: svc.category, icon: svc.icon || '📄',
      'pricing.startingAt': svc.pricing?.basePrice || svc.pricing?.startingAt || '',
      'pricing.gstPercent': svc.pricing?.gstPercent ?? 18,
      'pricing.gstIncluded': svc.pricing?.gstIncluded ?? false,
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
    if (!form.name.trim()) {
      setActiveTab('basic');
      toast.error('Service name is required');
      return;
    }
    try {
      const validDocs = documents.filter(d => d.name.trim());
      const payload = {
        name: form.name,
        shortDescription: form.shortDescription,
        description: form.description,
        category: form.category,
        icon: iconPreview ? null : form.icon,
        iconUrl: iconPreview && !iconFile ? iconPreview : undefined,
        pricing: {
          startingAt: Number(form['pricing.startingAt']),
          gstPercent: Number(form['pricing.gstPercent']) || 18,
          gstIncluded: form['pricing.gstIncluded']
        },
        timeline: form.timeline,
        isPopular: form.isPopular,
        isActive: form.isActive,
        requiredDocuments: validDocs,
      };

      let savedService;
      if (editingService) {
        savedService = (await api.updateService(editingService._id, payload)).service;
        toast.success('Service updated');
      } else {
        savedService = (await api.createService(payload)).service;
        toast.success('Service created');
      }

      // Upload icon image if a new file was selected
      if (iconFile && savedService?.id) {
        const fd = new FormData();
        fd.append('icon', iconFile);
        const res = await api.uploadServiceIcon(savedService.id, fd);
        if (res.iconUrl) toast.success('Icon uploaded');
      }

      setShowModal(false);
      fetchServices();
    } catch (error) {
      toast.error(error.message || 'Failed');
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
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Services</h1>
            <div className="flex gap-1 mt-2">
              {[['services', 'Services', Package], ['categories', 'Categories', Tag]].map(([v, label, Icon]) => (
                <button key={v} onClick={() => setView(v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    view === v ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}>
                  <Icon size={14} />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {view === 'services' && (
              <>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2 text-sm w-48" />
                </div>
                <button onClick={openAdd} className="btn-primary btn-sm"><Plus size={16} className="mr-1" /> Add Service</button>
              </>
            )}
            {view === 'categories' && (
              <button onClick={() => { setEditingCat(null); setCatForm(emptyCategory()); setShowCatEmojiPicker(false); setShowCatModal(true); }} className="btn-primary btn-sm">
                <Plus size={16} className="mr-1" /> Add Category
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Category Filter (Services view) */}
        {view === 'services' && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                category === 'all' ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}>All</button>
            {categories.filter(c => c.isActive).map(c => (
              <button key={c.slug} onClick={() => setCategory(c.slug)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  category === c.slug ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        )}

        {/* ── CATEGORIES MANAGEMENT VIEW ── */}
        {view === 'categories' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.length === 0 ? (
                <EmptyState icon={Tag} title="No categories yet" description="Add your first service category" />
              ) : categories.map(cat => (
                <div key={cat.id} className="card p-4 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{cat.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{cat.name}</p>
                      <p className="text-xs text-slate-500">{cat.slug}</p>
                      {cat.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{cat.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className={`text-xs ${cat.isActive ? 'text-green-600' : 'text-red-500'}`}>
                      {cat.isActive ? '●' : '●'}
                    </span>
                    <button
                      onClick={() => { setEditingCat(cat); setCatForm({ name: cat.name, icon: cat.icon, description: cat.description || '', sortOrder: cat.sortOrder }); setShowCatEmojiPicker(false); setShowCatModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Delete "${cat.name}"?`)) return;
                        try { await api.deleteServiceCategory(cat.id); toast.success('Deleted'); fetchCategories(); }
                        catch (e) { toast.error(e.message); }
                      }}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === 'services' && (
          filtered.length === 0 ? (
            <EmptyState icon={Package} title="No services found" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(svc => (
              <div key={svc._id} className="card p-5 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 dark:bg-slate-700 overflow-hidden">
                      {svc.iconUrl
                        ? <img src={svc.iconUrl} alt={svc.name} className="w-full h-full object-contain" />
                        : <span className="text-2xl">{svc.icon}</span>}
                    </div>
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
                  <div>
                    <span className="text-lg font-bold text-primary-600">
                      ₹{(svc.pricing?.totalPrice || svc.pricing?.startingAt || 0).toLocaleString('en-IN')}
                    </span>
                    {svc.pricing?.gstPercent > 0 && (
                      <span className="ml-1 text-xs text-slate-400">+{svc.pricing.gstPercent}% GST</span>
                    )}
                  </div>
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
          )
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
                    {/* Preview */}
                    <div
                      className="w-full h-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center cursor-pointer relative overflow-hidden hover:border-primary-400 transition-colors"
                      onClick={() => setShowEmojiPicker(p => !p)}
                    >
                      {iconPreview ? (
                        <>
                          <img src={iconPreview} alt="icon" className="w-full h-full object-contain" />
                          <button
                            type="button"
                            className="absolute top-0.5 right-0.5 bg-white dark:bg-slate-700 rounded-full p-0.5 shadow"
                            onClick={e => { e.stopPropagation(); setIconPreview(null); setIconFile(null); }}
                          ><X size={10} /></button>
                        </>
                      ) : (
                        <span className="text-3xl">{form.icon || '📄'}</span>
                      )}
                    </div>
                    {/* Emoji picker dropdown */}
                    {showEmojiPicker && !iconPreview && (
                      <div className="absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 mt-1 w-52">
                        <div className="flex flex-wrap gap-1">
                          {POPULAR_EMOJIS.map(em => (
                            <button
                              key={em}
                              type="button"
                              className={`text-xl p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${form.icon === em ? 'bg-primary-100 dark:bg-primary-900/30' : ''}`}
                              onClick={() => { setForm(f => ({ ...f, icon: em })); setShowEmojiPicker(false); }}
                            >{em}</button>
                          ))}
                        </div>
                        <div className="mt-2 border-t pt-2">
                          <label className="label text-xs">Or type emoji</label>
                          <input
                            type="text"
                            value={form.icon}
                            onChange={e => setForm(f => ({ ...f, icon: e.target.value }))}
                            className="input py-1 text-lg text-center"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    )}
                    {/* Upload image button */}
                    <input
                      ref={iconFileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (f.size > 2 * 1024 * 1024) { toast.error('Image must be < 2MB'); return; }
                        setIconFile(f);
                        setIconPreview(URL.createObjectURL(f));
                        setShowEmojiPicker(false);
                      }}
                    />
                    <button
                      type="button"
                      className="mt-1 w-full text-xs text-slate-500 hover:text-primary-600 flex items-center justify-center gap-1 py-1"
                      onClick={() => iconFileRef.current?.click()}
                    >
                      <Upload size={11} /> Upload image
                    </button>
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
                      {categories.map(c => <option key={c.slug} value={c.slug}>{c.icon} {c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Base Price (₹)</label>
                    <input type="number" min="0" value={form['pricing.startingAt']} onChange={e => setForm({ ...form, 'pricing.startingAt': e.target.value })} className="input" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">GST %</label>
                    <input type="number" min="0" max="100" value={form['pricing.gstPercent']} onChange={e => setForm({ ...form, 'pricing.gstPercent': e.target.value })} className="input" />
                    {form['pricing.startingAt'] && Number(form['pricing.startingAt']) > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Total: ₹{(Number(form['pricing.startingAt']) * (1 + Number(form['pricing.gstPercent'] || 0) / 100)).toFixed(2)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center pt-6">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form['pricing.gstIncluded']} onChange={e => setForm({ ...form, 'pricing.gstIncluded': e.target.checked })} className="rounded" />
                      GST Included in price
                    </label>
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
                </div>
              </>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">
                    Select document types clients must upload. 
                    <Link href="/admin/document-fields" className="ml-1 text-primary-600 hover:underline inline-flex items-center gap-0.5">
                      Manage field types <ExternalLink size={11} />
                    </Link>
                  </p>
                  <button type="button" onClick={addDoc} className="btn-primary btn-sm flex items-center gap-1">
                    <Plus size={14} /> Add Field
                  </button>
                </div>

                {documents.length === 0 && (
                  <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No document fields yet. Click "Add Field" to start.</p>
                  </div>
                )}

                {documents.map((doc, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 space-y-2">
                    {/* Row 1: name dropdown + delete */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 w-5 text-center">{i + 1}</span>
                      <select
                        value={doc.name}
                        onChange={e => {
                          const selected = fieldTypes.find(ft => ft.name === e.target.value);
                          updateDoc(i, 'name', e.target.value);
                          if (selected?.description && !doc.description) updateDoc(i, 'description', selected.description);
                        }}
                        className="input py-1.5 text-sm flex-1"
                      >
                        <option value="">— Select document type —</option>
                        {fieldTypes.map(ft => (
                          <option key={ft.id} value={ft.name}>{ft.icon} {ft.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        disabled={documents.length === 1}
                        className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {/* Row 2: description + badges */}
                    <div className="flex items-center gap-3 pl-7">
                      <input
                        type="text"
                        placeholder="Hint for client (e.g. Upload front side only)"
                        value={doc.description}
                        onChange={e => updateDoc(i, 'description', e.target.value)}
                        className="input py-1.5 text-sm flex-1"
                      />
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap select-none">
                        <input
                          type="checkbox"
                          checked={doc.isMandatory}
                          onChange={e => updateDoc(i, 'isMandatory', e.target.checked)}
                          className="rounded accent-red-500"
                        />
                        <span className={doc.isMandatory ? 'text-red-600 font-semibold' : 'text-slate-500'}>Required</span>
                      </label>
                      <label className="flex items-center gap-1.5 text-xs cursor-pointer whitespace-nowrap select-none">
                        <input
                          type="checkbox"
                          checked={doc.passwordEnabled}
                          onChange={e => updateDoc(i, 'passwordEnabled', e.target.checked)}
                          className="rounded accent-primary-600"
                        />
                        <Key size={11} className={doc.passwordEnabled ? 'text-primary-600' : 'text-slate-400'} />
                        <span className={doc.passwordEnabled ? 'text-primary-600 font-semibold' : 'text-slate-500'}>Password</span>
                      </label>
                    </div>
                    {/* Badges row */}
                    <div className="flex gap-2 pl-7">
                      {doc.isMandatory && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 dark:bg-red-900/20 text-red-600 text-[10px] rounded-full font-medium">
                          <AlertCircle size={9} /> Required
                        </span>
                      )}
                      {doc.passwordEnabled && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/20 text-primary-600 text-[10px] rounded-full font-medium">
                          <Lock size={9} /> Password protected
                        </span>
                      )}
                      {!doc.isMandatory && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 text-[10px] rounded-full font-medium">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {documents.filter(d => d.name).length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                    <AlertCircle size={13} />
                    <span>
                      <strong>{documents.filter(d => d.isMandatory && d.name).length} required</strong>,{' '}
                      <strong>{documents.filter(d => !d.isMandatory && d.name).length} optional</strong> fields configured.
                      {documents.some(d => d.passwordEnabled) && <> <Lock size={10} className="inline" /> {documents.filter(d => d.passwordEnabled && d.name).length} with password option.</>}
                    </span>
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

        {/* Category add/edit modal */}
        <Modal isOpen={showCatModal} onClose={() => setShowCatModal(false)} title={editingCat ? 'Edit Category' : 'Add Category'}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              if (editingCat) {
                await api.updateServiceCategory(editingCat.id, catForm);
                toast.success('Category updated');
              } else {
                await api.createServiceCategory(catForm);
                toast.success('Category created');
              }
              setShowCatModal(false);
              fetchCategories();
            } catch (err) { toast.error(err.message || 'Failed'); }
          }} className="space-y-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0">
                <label className="label">Icon</label>
                <button type="button" onClick={() => setShowCatEmojiPicker(p => !p)}
                  className="text-4xl w-16 h-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex items-center justify-center hover:border-primary-400 transition-colors">
                  {catForm.icon}
                </button>
                {showCatEmojiPicker && (
                  <div className="absolute z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 mt-1 w-52">
                    <div className="flex flex-wrap gap-1">
                      {CAT_EMOJIS.map(em => (
                        <button key={em} type="button"
                          className={`text-xl p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${catForm.icon === em ? 'bg-primary-100' : ''}`}
                          onClick={() => { setCatForm(f => ({ ...f, icon: em })); setShowCatEmojiPicker(false); }}>
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <label className="label">Name *</label>
                  <input required value={catForm.name} onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))} className="input" placeholder="e.g. Tax Filing" />
                </div>
                <div>
                  <label className="label">Description</label>
                  <input value={catForm.description} onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))} className="input" placeholder="Optional" />
                </div>
                <div>
                  <label className="label">Sort Order</label>
                  <input type="number" value={catForm.sortOrder} onChange={e => setCatForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} className="input" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
              <button type="button" onClick={() => setShowCatModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">{editingCat ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
