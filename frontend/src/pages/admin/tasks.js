import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import {
  ClipboardList, Plus, Search, Pencil, Trash2, ChevronRight, ChevronLeft,
  User, FileText, UploadCloud, IndianRupee, CheckCircle2,
  X, AlertCircle, Loader2, Eye, Lock, Download, RotateCcw, ShieldCheck, XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  urgent: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STATUS_META = {
  pending:        { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700' },
  'in-progress':  { label: 'In Progress',      color: 'bg-blue-100 text-blue-700' },
  review:         { label: 'Under Review',     color: 'bg-purple-100 text-purple-700' },
  'on-hold':      { label: 'On Hold',          color: 'bg-slate-100 text-slate-600' },
  pending_review: { label: 'Pending Review ⏳', color: 'bg-orange-100 text-orange-700' },
  completed:      { label: 'Completed ✓',      color: 'bg-green-100 text-green-700' },
};

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

const inp = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm';

function ReviewDocsModal({ task, onClose, onSuccess }) {
  const [docs, setDocs] = useState(task.finalDocs || []);
  const [loading, setLoading] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [acting, setActing] = useState(false);
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || '';

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const d = await api.getTaskFinalDocs(task._id);
        setDocs(d.documents || []);
      } catch {}
      setLoading(false);
    };
    load();
  }, [task._id]);

  const handleApprove = async () => {
    setActing(true);
    try {
      await api.approveTask(task._id, { remarks });
      toast.success('Task approved and marked complete!');
      onSuccess();
    } catch (e) { toast.error(e.message || 'Failed to approve'); }
    setActing(false);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return toast.error('Please provide a revision reason');
    setActing(true);
    try {
      await api.rejectTask(task._id, { remarks: rejectReason });
      toast.success('Revision requested. Task sent back to employee.');
      onSuccess();
    } catch (e) { toast.error(e.message || 'Failed to request revision'); }
    setActing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Review Final Documents</h2>
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">Task: <span className="font-medium text-slate-700 dark:text-slate-300">{task.title}</span></p>
            {task.assignedTo && <p className="text-xs text-slate-400 mt-0.5">By: {task.assignedTo.name}</p>}
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-orange-600 shrink-0 mt-0.5" />
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Employee has submitted final documents for review. Approve to mark task complete or request revision.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : docs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{docs.length} Document{docs.length !== 1 ? 's' : ''} Uploaded</p>
              {docs.map(doc => (
                <div key={doc.id} className="border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <FileText size={15} className="text-primary-500 shrink-0" />
                        <span className="font-medium text-slate-800 dark:text-white text-sm">{doc.name}</span>
                        {doc.docType && <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400">{doc.docType}</span>}
                        {doc.hasPassword && <span className="flex items-center gap-1 text-xs text-amber-600"><Lock size={11} /> Protected</span>}
                      </div>
                      {doc.description && <p className="text-xs text-slate-500 mt-1 ml-5">{doc.description}</p>}
                      <div className="flex items-center gap-3 mt-1.5 ml-5 text-xs text-slate-400">
                        <span>{formatFileSize(doc.size)}</span>
                        {doc.uploadedAt && <span>Uploaded: {format(new Date(doc.uploadedAt), 'dd MMM yyyy, HH:mm')}</span>}
                      </div>
                      {doc.hasPassword && (
                        <div className="mt-2 ml-5 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1.5 text-xs text-amber-700 dark:text-amber-400">
                          <span className="font-medium">Password:</span> {doc.password}
                        </div>
                      )}
                    </div>
                    <a
                      href={`${apiBase}/uploads/task-final-docs/${task._id}/${doc.originalName || doc.name}`}
                      target="_blank" rel="noreferrer"
                      className="shrink-0 flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg font-medium"
                    >
                      <Download size={13} /> Download
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Employee remarks */}
          {task.remarks?.length > 0 && (() => {
            const lastRemark = task.remarks[task.remarks.length - 1];
            return (
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Employee note:</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{lastRemark?.text}</p>
              </div>
            );
          })()}

          {/* Admin remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Approval Note (optional)</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
              className={`${inp} resize-none`} placeholder="Internal note for approval…" />
          </div>

          {/* Reject input */}
          {showRejectInput && (
            <div>
              <label className="block text-sm font-medium text-red-600 mb-1">Revision Reason <span className="text-red-500">*</span></label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2}
                className={`${inp} resize-none border-red-300 dark:border-red-700`} placeholder="Explain what needs to be revised or corrected…" />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0 flex-wrap gap-3">
          <button onClick={onClose} className="btn-outline text-sm">Close</button>
          <div className="flex gap-3">
            {!showRejectInput ? (
              <button
                onClick={() => setShowRejectInput(true)}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <XCircle size={15} /> Request Revision
              </button>
            ) : (
              <button
                onClick={handleReject}
                disabled={acting}
                className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {acting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Send for Revision
              </button>
            )}
            <button
              onClick={handleApprove}
              disabled={acting || docs.length === 0}
              className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
            >
              {acting ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              Approve & Complete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldLabel({ text, required }) {
  return (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function SearchablePicker({ options = [], value, onChange, placeholder = 'Select…' }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const selected = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const filtered = options.filter(o => o.label.toLowerCase().includes(q.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(v => !v)}
        className={`${inp} flex items-center justify-between text-left`}>
        <span className={selected ? 'text-slate-900 dark:text-white' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronRight size={14} className={`text-slate-400 transition-transform shrink-0 ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl max-h-60 flex flex-col">
          <div className="p-2 border-b border-slate-100 dark:border-slate-700">
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} className={inp} placeholder="Search…" />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length === 0
              ? <p className="px-3 py-4 text-sm text-slate-400 text-center">No results</p>
              : filtered.map(o => (
                <button type="button" key={o.value}
                  onClick={() => { onChange(o.value); setOpen(false); setQ(''); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                    ${String(o.value) === String(value) ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 font-medium' : 'text-slate-700 dark:text-slate-300'}`}>
                  {o.label}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StepBar({ step, steps }) {
  return (
    <div className="flex items-center mb-6">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold shrink-0 transition-all
            ${i < step ? 'bg-primary-600 text-white' : i === step ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
            {i < step ? <CheckCircle2 size={15} /> : i + 1}
          </div>
          <span className={`ml-2 text-xs font-medium whitespace-nowrap hidden sm:block ${i === step ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>{s}</span>
          {i < steps.length - 1 && <div className={`flex-1 mx-3 h-0.5 rounded ${i < step ? 'bg-primary-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
        </div>
      ))}
    </div>
  );
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [applications, setApplications] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [reviewTask, setReviewTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', status: 'pending' });

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 0 - task basics
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', notes: '' });

  // Step 1 - app type
  const [appType, setAppType] = useState('existing');
  const [existingAppId, setExistingAppId] = useState('');
  const [appSearch, setAppSearch] = useState('');

  // Step 2 - external client + service
  const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', company: '', address: '' });
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [serviceDetail, setServiceDetail] = useState(null);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [customPrice, setCustomPrice] = useState('');

  // Step 3 - documents
  const [docFiles, setDocFiles] = useState({});

  const STEPS = appType === 'external'
    ? ['Task Info', 'App Type', 'Client & Service', 'Docs & Price']
    : ['Task Info', 'App Type', 'Review', 'Confirm'];

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [td, ed, ad, sd] = await Promise.all([
        api.getTasks(),
        api.getUsers({ role: 'employee' }),
        api.getApplications({ limit: 200 }),
        api.getServices(),
      ]);
      setTasks(td.tasks || []);
      setEmployees(ed.users || []);
      setApplications(ad.applications || []);
      setServices((sd.services || []).filter(s => s.isActive));
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (!selectedServiceId) { setServiceDetail(null); setCustomPrice(''); return; }
    const svc = services.find(s => String(s.id) === String(selectedServiceId));
    if (!svc) return;
    setServiceLoading(true);
    api.request(`/services/${svc.slug}/config`)
      .then(d => {
        setServiceDetail({ ...svc, requiredDocuments: d.documents || [] });
        setCustomPrice(String(svc.pricing?.basePrice > 0 ? svc.pricing.basePrice : ''));
      })
      .catch(() => {
        setServiceDetail(svc);
        setCustomPrice(String(svc.pricing?.basePrice > 0 ? svc.pricing.basePrice : ''));
      })
      .finally(() => setServiceLoading(false));
  }, [selectedServiceId]);

  const resetCreate = () => {
    setStep(0);
    setTaskForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '', notes: '' });
    setAppType('existing');
    setExistingAppId('');
    setAppSearch('');
    setClientForm({ name: '', email: '', phone: '', company: '', address: '' });
    setSelectedServiceId('');
    setServiceDetail(null);
    setCustomPrice('');
    setDocFiles({});
  };

  const nextStep = () => {
    if (step === 0) {
      if (!taskForm.title.trim()) return toast.error('Task title is required');
      if (!taskForm.assignedTo) return toast.error('Please assign an employee');
    }
    if (step === 2 && appType === 'external') {
      if (!clientForm.name.trim()) return toast.error('Client name is required');
      if (!clientForm.email.trim()) return toast.error('Client email is required');
      if (!selectedServiceId) return toast.error('Please select a service');
    }
    setStep(s => Math.min(s + 1, 3));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    if (appType === 'external' && !selectedServiceId) return toast.error('Service is required');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('appType', appType);
      fd.append('title', taskForm.title);
      fd.append('description', taskForm.description);
      fd.append('assignedTo', taskForm.assignedTo);
      fd.append('priority', taskForm.priority);
      if (taskForm.dueDate) fd.append('dueDate', taskForm.dueDate);
      if (taskForm.notes) fd.append('notes', taskForm.notes);

      if (appType === 'existing') {
        if (existingAppId) fd.append('existingAppId', existingAppId);
      } else {
        fd.append('clientName', clientForm.name);
        fd.append('clientEmail', clientForm.email);
        fd.append('clientPhone', clientForm.phone);
        fd.append('clientCompany', clientForm.company);
        fd.append('clientAddress', clientForm.address);
        fd.append('serviceId', selectedServiceId);
        if (customPrice !== '') fd.append('customPrice', customPrice);
        Object.entries(docFiles).forEach(([key, file]) => { if (file) fd.append(key, file); });
      }

      await api.adminCreateTaskWithClient(fd);
      toast.success('Task created successfully!');
      setShowCreateModal(false);
      fetchAll();
    } catch (e) { toast.error(e.message || 'Failed to create task'); }
    setSaving(false);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title || '',
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status || 'pending',
    });
    setShowEditModal(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.updateTask(editingTask._id, editForm);
      toast.success('Task updated');
      setShowEditModal(false);
      fetchAll();
    } catch { toast.error('Failed to update task'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await api.deleteTask(id); toast.success('Task deleted'); fetchAll(); }
    catch { toast.error('Failed to delete'); }
  };

  const filtered = tasks.filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredApps = applications.filter(app =>
    !appSearch || app.applicationId?.includes(appSearch) ||
    app.client?.name?.toLowerCase().includes(appSearch.toLowerCase()) ||
    app.service?.name?.toLowerCase().includes(appSearch.toLowerCase())
  );

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const empName = (id) => employees.find(e => String(e.id || e._id) === String(id))?.name || '—';
  const svcName = (id) => services.find(s => String(s.id) === String(id))?.name || '—';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
            <p className="text-sm text-slate-500 mt-0.5">{tasks.length} total tasks</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} className={`${inp} pl-9 w-52`} />
            </div>
            <button onClick={() => { resetCreate(); setShowCreateModal(true); }} className="btn-primary flex items-center gap-2 text-sm">
              <Plus size={16} /> Create Task
            </button>
          </div>
        </div>

        {/* Pending review alert */}
        {tasks.filter(t => t.status === 'pending_review').length > 0 && (
          <div
            className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            onClick={() => setReviewTask(tasks.find(t => t.status === 'pending_review'))}
          >
            <AlertCircle size={18} className="text-orange-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">
                {tasks.filter(t => t.status === 'pending_review').length} task{tasks.filter(t => t.status === 'pending_review').length !== 1 ? 's' : ''} pending your review
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-500">Click to review the first one, or click the 👁 icon on any pending row below.</p>
            </div>
          </div>
        )}

        {/* Tasks table */}
        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No tasks found" description="Create your first task using the button above" />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    {['Task', 'Assigned To', 'Application / Client', 'Priority', 'Status', 'Due Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(task => (
                    <tr key={task._id} className={`border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors ${task.status === 'pending_review' ? 'bg-orange-50/60 dark:bg-orange-900/10' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 dark:text-white">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">{task.description}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary-700 dark:text-primary-300">{task.assignedTo?.name?.[0] || '?'}</span>
                          </div>
                          <span className="text-slate-700 dark:text-slate-300">{task.assignedTo?.name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {task.application ? (
                          <div>
                            <span className="font-mono text-xs font-bold text-primary-600">{task.application.applicationId}</span>
                            <p className="text-xs text-slate-400">{task.application.client?.name}</p>
                          </div>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PRIORITY_COLORS[task.priority] || ''}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_META[task.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_META[task.status]?.label || task.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {task.status === 'pending_review' && (
                            <button
                              onClick={() => setReviewTask(task)}
                              className="p-1.5 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg"
                              title="Review Documents"
                            >
                              <Eye size={14} />
                            </button>
                          )}
                          <button onClick={() => openEdit(task)} className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg" title="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(task._id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════ ENHANCED CREATE MODAL ═══════════════════════════ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Create Task</h2>
                <p className="text-xs text-slate-400 mt-0.5">{STEPS[step]}</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                <X size={18} />
              </button>
            </div>

            <div className="px-6 pt-4 shrink-0">
              <StepBar step={step} steps={STEPS} />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 pb-2">

              {/* ── STEP 0: Task Basics ────────────────────────────────── */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <FieldLabel text="Task Title" required />
                    <input value={taskForm.title} onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                      className={inp} placeholder="E.g. File ITR for FY 2024-25" />
                  </div>
                  <div>
                    <FieldLabel text="Description" />
                    <textarea value={taskForm.description} onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
                      className={`${inp} h-20 resize-none`} placeholder="Optional task details…" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FieldLabel text="Assign To Employee" required />
                      <SearchablePicker
                        value={taskForm.assignedTo}
                        onChange={v => setTaskForm(p => ({ ...p, assignedTo: v }))}
                        options={employees.map(e => ({ value: String(e.id || e._id), label: e.name + (e.designation ? ` — ${e.designation}` : '') }))}
                        placeholder="Select employee…"
                      />
                    </div>
                    <div>
                      <FieldLabel text="Priority" />
                      <select value={taskForm.priority} onChange={e => setTaskForm(p => ({ ...p, priority: e.target.value }))} className={inp}>
                        {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <FieldLabel text="Due Date" />
                    <input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} className={inp} />
                  </div>
                  <div>
                    <FieldLabel text="Internal Notes" />
                    <textarea value={taskForm.notes} onChange={e => setTaskForm(p => ({ ...p, notes: e.target.value }))}
                      className={`${inp} h-16 resize-none`} placeholder="Notes visible to admin only…" />
                  </div>
                </div>
              )}

              {/* ── STEP 1: Application Type ───────────────────────────── */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'existing', icon: Eye, title: 'Existing Application', desc: 'Link to an already-registered client application' },
                      { value: 'external', icon: User, title: 'External / New Client', desc: 'Register a new client and create application on the spot' },
                    ].map(opt => (
                      <button key={opt.value} type="button" onClick={() => setAppType(opt.value)}
                        className={`relative flex flex-col items-start gap-3 p-4 rounded-xl border-2 text-left transition-all
                          ${appType === opt.value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`}>
                        <div className={`p-2 rounded-lg ${appType === opt.value ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>
                          <opt.icon size={18} />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${appType === opt.value ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>{opt.title}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                        </div>
                        {appType === opt.value && <CheckCircle2 size={16} className="absolute top-3 right-3 text-primary-500" />}
                      </button>
                    ))}
                  </div>

                  {appType === 'existing' && (
                    <div>
                      <FieldLabel text="Search & Select Application" />
                      <input value={appSearch} onChange={e => setAppSearch(e.target.value)}
                        className={`${inp} mb-2`} placeholder="Search by app ID, client name, service…" />
                      <div className="border border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                        {filteredApps.length === 0
                          ? <p className="text-center py-6 text-sm text-slate-400">No applications found</p>
                          : filteredApps.map(app => (
                            <button key={app.id || app._id} type="button"
                              onClick={() => setExistingAppId(String(app.id || app._id))}
                              className={`w-full flex items-center justify-between px-4 py-3 border-b last:border-0 border-slate-100 dark:border-slate-700 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors
                                ${String(app.id || app._id) === existingAppId ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
                              <div>
                                <span className="font-mono text-xs font-bold text-primary-600 mr-2">{app.applicationId}</span>
                                <span className="text-sm text-slate-700 dark:text-slate-300">{app.client?.name || '—'}</span>
                                <span className="text-xs text-slate-400 ml-2">• {app.service?.name || '—'}</span>
                              </div>
                              {String(app.id || app._id) === existingAppId && <CheckCircle2 size={15} className="text-primary-500 shrink-0" />}
                            </button>
                          ))}
                      </div>
                      {existingAppId && (
                        <p className="mt-2 text-xs text-primary-600 flex items-center gap-1">
                          <CheckCircle2 size={13} /> Application selected
                        </p>
                      )}
                    </div>
                  )}

                  {appType === 'external' && (
                    <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 flex items-start gap-2">
                      <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Fill in client details and select a service in the next step. If the email already exists, the existing client will be linked.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2: External Client + Service ─────────────────── */}
              {step === 2 && appType === 'external' && (
                <div className="space-y-5">
                  {/* Client form */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User size={15} className="text-primary-600" />
                      <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Client Details</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <FieldLabel text="Full Name" required />
                        <input value={clientForm.name} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} className={inp} placeholder="John Doe" />
                      </div>
                      <div>
                        <FieldLabel text="Email" required />
                        <input type="email" value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} className={inp} placeholder="client@example.com" />
                      </div>
                      <div>
                        <FieldLabel text="Phone" />
                        <input value={clientForm.phone} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} className={inp} placeholder="+91 9876543210" />
                      </div>
                      <div>
                        <FieldLabel text="Company Name" />
                        <input value={clientForm.company} onChange={e => setClientForm(p => ({ ...p, company: e.target.value }))} className={inp} placeholder="ABC Pvt Ltd" />
                      </div>
                      <div className="col-span-2">
                        <FieldLabel text="Address" />
                        <input value={clientForm.address} onChange={e => setClientForm(p => ({ ...p, address: e.target.value }))} className={inp} placeholder="Street, City, State" />
                      </div>
                    </div>
                  </div>

                  {/* Service selection */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={15} className="text-primary-600" />
                      <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Select Service <span className="text-red-500">*</span></h3>
                    </div>
                    <SearchablePicker
                      value={selectedServiceId}
                      onChange={v => setSelectedServiceId(v)}
                      options={services.map(s => ({ value: String(s.id), label: `${s.name} (${s.category})` }))}
                      placeholder="Choose a service…"
                    />
                    {serviceLoading && (
                      <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Loading service details…</p>
                    )}
                  </div>

                  {serviceDetail && !serviceLoading && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-white">{serviceDetail.name}</p>
                          <p className="text-xs text-slate-400 capitalize mt-0.5">{serviceDetail.category} • {serviceDetail.timeline}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-slate-400">Base price</p>
                          <p className="font-bold text-slate-800 dark:text-white">₹{Number(serviceDetail.pricing?.basePrice || 0).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      {serviceDetail.requiredDocuments?.length > 0 && (
                        <div className="text-xs text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                          <span className="font-medium text-slate-600 dark:text-slate-400">Required documents ({serviceDetail.requiredDocuments.length}): </span>
                          {serviceDetail.requiredDocuments.map(d => d.name).join(' • ')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── STEP 2 (existing): Review ──────────────────────────── */}
              {step === 2 && appType === 'existing' && (
                <div className="space-y-4">
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-primary-700 dark:text-primary-300">
                      {existingAppId
                        ? `✓ Linked to: ${applications.find(a => String(a.id || a._id) === existingAppId)?.applicationId || existingAppId}`
                        : 'No application linked — task will stand alone.'}
                    </p>
                  </div>
                  <p className="text-sm text-slate-500">Click <strong>Continue</strong> to proceed to final confirmation.</p>
                </div>
              )}

              {/* ── STEP 3: Documents + Price + Confirm ───────────────── */}
              {step === 3 && appType === 'external' && serviceDetail && (
                <div className="space-y-5">
                  {/* Price customization */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <IndianRupee size={15} className="text-green-600" />
                      <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Price Customization</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-400 mb-1">Default Price</p>
                        <p className="text-xl font-bold text-slate-800 dark:text-white">₹{Number(serviceDetail.pricing?.basePrice || 0).toLocaleString('en-IN')}</p>
                        {serviceDetail.pricing?.gstPercent > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">+ {serviceDetail.pricing.gstPercent}% GST = ₹{Number(serviceDetail.pricing?.totalPrice || 0).toLocaleString('en-IN')}</p>
                        )}
                      </div>
                      <div>
                        <FieldLabel text="Custom Price (leave blank for default)" />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                          <input type="number" min="0" step="1" value={customPrice}
                            onChange={e => setCustomPrice(e.target.value)}
                            className={`${inp} pl-7`} placeholder={String(serviceDetail.pricing?.basePrice || 0)} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Document uploads */}
                  {serviceDetail.requiredDocuments?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <UploadCloud size={15} className="text-primary-600" />
                        <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                          Service Documents — {serviceDetail.name}
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {serviceDetail.requiredDocuments.map((doc, i) => {
                          const key = doc.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                          const file = docFiles[key];
                          return (
                            <div key={i} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-xl">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.name}</p>
                                  <span className={`text-xs px-1.5 py-0.5 rounded ${doc.isMandatory ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                                    {doc.isMandatory ? 'Required' : 'Optional'}
                                  </span>
                                </div>
                                {doc.description && <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>}
                              </div>
                              <div className="shrink-0">
                                {file ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-lg text-xs font-medium">
                                      <CheckCircle2 size={12} />
                                      <span className="max-w-[100px] truncate">{file.name}</span>
                                    </div>
                                    <button type="button" onClick={() => setDocFiles(p => { const n = { ...p }; delete n[key]; return n; })}
                                      className="p-1 text-slate-400 hover:text-red-500 rounded">
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="cursor-pointer flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 bg-primary-50 dark:bg-primary-900/20 px-3 py-1.5 rounded-lg font-medium">
                                    <UploadCloud size={13} /> Upload
                                    <input type="file" className="hidden" onChange={e => {
                                      const f = e.target.files?.[0];
                                      if (f) setDocFiles(p => ({ ...p, [key]: f }));
                                    }} />
                                  </label>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
                    <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 mb-3">Review & Confirm</h3>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        ['Task', taskForm.title],
                        ['Assigned To', empName(taskForm.assignedTo)],
                        ['Priority', taskForm.priority],
                        ['Due Date', taskForm.dueDate || '—'],
                        ['Client', clientForm.name],
                        ['Client Email', clientForm.email],
                        ['Service', svcName(selectedServiceId)],
                        ['Final Price', customPrice ? `₹${Number(customPrice).toLocaleString('en-IN')} (custom)` : `₹${Number(serviceDetail.pricing?.basePrice || 0).toLocaleString('en-IN')} (default)`],
                      ].map(([k, v]) => (
                        <div key={k} className="bg-white dark:bg-slate-800 rounded-lg px-3 py-2">
                          <p className="text-slate-400">{k}</p>
                          <p className="font-medium text-slate-700 dark:text-slate-200 capitalize truncate">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3 existing confirm */}
              {step === 3 && appType === 'existing' && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300">Review & Confirm</h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ['Task', taskForm.title],
                      ['Assigned To', empName(taskForm.assignedTo)],
                      ['Priority', taskForm.priority],
                      ['Due Date', taskForm.dueDate || '—'],
                      ['Application', existingAppId ? (applications.find(a => String(a.id || a._id) === existingAppId)?.applicationId || existingAppId) : 'None'],
                    ].map(([k, v]) => (
                      <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                        <p className="text-slate-400">{k}</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200 capitalize truncate">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
              {step > 0
                ? <button type="button" onClick={prevStep} className="btn-outline flex items-center gap-2 text-sm"><ChevronLeft size={15} /> Back</button>
                : <div />}
              {step < 3
                ? <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-2 text-sm">Continue <ChevronRight size={15} /></button>
                : <button type="button" onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-60">
                    {saving ? <><Loader2 size={15} className="animate-spin" /> Creating…</> : <><CheckCircle2 size={15} /> Create Task</>}
                  </button>}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════ REVIEW DOCS MODAL ══════════════════════════ */}
      {reviewTask && (
        <ReviewDocsModal
          task={reviewTask}
          onClose={() => setReviewTask(null)}
          onSuccess={() => { setReviewTask(null); fetchAll(); }}
        />
      )}

      {/* ════════════════════════════ EDIT MODAL ═════════════════════════════ */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Task">
        <form onSubmit={saveEdit} className="space-y-4">
          <div>
            <FieldLabel text="Title" required />
            <input required value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className={inp} />
          </div>
          <div>
            <FieldLabel text="Description" />
            <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className={`${inp} h-20 resize-none`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel text="Assign To" />
              <SearchablePicker
                value={editForm.assignedTo}
                onChange={v => setEditForm(p => ({ ...p, assignedTo: v }))}
                options={employees.map(e => ({ value: String(e.id || e._id), label: e.name }))}
                placeholder="Select employee…"
              />
            </div>
            <div>
              <FieldLabel text="Priority" />
              <select value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))} className={inp}>
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel text="Status" />
              <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))} className={inp}>
                {['pending','in-progress','review','completed','on-hold'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <FieldLabel text="Due Date" />
              <input type="date" value={editForm.dueDate} onChange={e => setEditForm(p => ({ ...p, dueDate: e.target.value }))} className={inp} />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className="btn-outline">Cancel</button>
            <button type="submit" className="btn-primary">Update Task</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
