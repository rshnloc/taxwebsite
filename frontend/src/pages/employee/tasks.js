import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState } from '../../components/ui';
import api from '../../lib/api';
import {
  ClipboardList, UploadCloud, X, CheckCircle2, AlertCircle, Loader2,
  FileText, Lock, ChevronDown, Plus, Eye, RotateCcw,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'pending', 'in-progress', 'review', 'on-hold', 'pending_review', 'completed'];

const STATUS_META = {
  pending:        { label: 'Pending',          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  'in-progress':  { label: 'In Progress',      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  review:         { label: 'Under Review',     color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  'on-hold':      { label: 'On Hold',          color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400' },
  pending_review: { label: 'Pending Review ⏳', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  completed:      { label: 'Completed ✓',      color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
};

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700', medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700', urgent: 'bg-red-100 text-red-700',
};

const DOC_TYPES = [
  'Acknowledgement', 'Certificate', 'Challan', 'Filed Return', 'Report',
  'Receipt', 'Agreement', 'License', 'Registration Document', 'Other',
];

const inp = 'w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm';

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

function DocUploadModal({ task, onClose, onSuccess }) {
  const [files, setFiles] = useState([]); // [{file, name, docType, description, password}]
  const [remarks, setRemarks] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const addFiles = (newFiles) => {
    const entries = Array.from(newFiles).map(f => ({
      file: f,
      name: f.name.replace(/\.[^.]+$/, ''),
      docType: '',
      description: '',
      password: '',
      showPass: false,
    }));
    setFiles(p => [...p, ...entries]);
  };

  const updateEntry = (i, key, val) => setFiles(p => p.map((e, idx) => idx === i ? { ...e, [key]: val } : e));
  const removeEntry = (i) => setFiles(p => p.filter((_, idx) => idx !== i));

  const handleDrop = (e) => { e.preventDefault(); addFiles(e.dataTransfer.files); };

  const handleSubmit = async () => {
    if (files.length === 0) return toast.error('Please upload at least one final document');
    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((entry, i) => {
        fd.append(`file_${i}`, entry.file);
        fd.append('docNames', entry.name || entry.file.name);
        fd.append('docTypes', entry.docType || '');
        fd.append('docDescs', entry.description || '');
        fd.append('docPasswords', entry.password || '');
      });
      if (remarks) fd.append('remarks', remarks);
      await api.uploadTaskFinalDocs(task._id, fd);
      toast.success(`${files.length} document(s) uploaded! Task submitted for admin review.`);
      onSuccess();
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    }
    setUploading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Upload Final Documents</h2>
            <p className="text-sm text-slate-500 mt-0.5 line-clamp-1">Task: <span className="font-medium text-slate-700 dark:text-slate-300">{task.title}</span></p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* Info banner */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Upload proof of work. After submission, admin will review and approve the task before invoice generation.
            </p>
          </div>

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-all"
          >
            <UploadCloud size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Drag & drop files or <span className="text-primary-600">browse</span></p>
            <p className="text-xs text-slate-400 mt-1">PDF, Excel, CSV, JSON, JPG, PNG, JPEG and more</p>
            <input
              ref={fileRef} type="file" multiple className="hidden"
              accept=".pdf,.xls,.xlsx,.csv,.json,.jpg,.jpeg,.png,.doc,.docx,.zip"
              onChange={e => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-3">
              {files.map((entry, i) => (
                <div key={i} className="border border-slate-200 dark:border-slate-600 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={16} className="text-primary-500 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate">{entry.file.name}</span>
                      <span className="text-xs text-slate-400 shrink-0">({formatFileSize(entry.file.size)})</span>
                    </div>
                    <button onClick={() => removeEntry(i)} className="p-1 text-slate-400 hover:text-red-500 rounded shrink-0">
                      <X size={15} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Document Name</label>
                      <input value={entry.name} onChange={e => updateEntry(i, 'name', e.target.value)} className={inp} placeholder="e.g. ITR Filing Receipt" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Document Type</label>
                      <select value={entry.docType} onChange={e => updateEntry(i, 'docType', e.target.value)} className={inp}>
                        <option value="">Select type…</option>
                        {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Description (optional)</label>
                    <input value={entry.description} onChange={e => updateEntry(i, 'description', e.target.value)} className={inp} placeholder="Brief description of this document" />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => updateEntry(i, 'showPass', !entry.showPass)}
                      className="text-xs text-slate-500 flex items-center gap-1 hover:text-primary-600"
                    >
                      <Lock size={12} /> {entry.showPass ? 'Hide' : 'Add'} document password (if protected)
                    </button>
                    {entry.showPass && (
                      <input
                        type="text" value={entry.password}
                        onChange={e => updateEntry(i, 'password', e.target.value)}
                        className={`${inp} mt-1.5`} placeholder="Document password (stored securely)"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add more */}
          {files.length > 0 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-2 border border-dashed border-slate-300 dark:border-slate-600 rounded-xl text-sm text-slate-500 hover:text-primary-600 hover:border-primary-400 transition-colors flex items-center justify-center gap-2"
            >
              <Plus size={15} /> Add more files
            </button>
          )}

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Submission Note (optional)</label>
            <textarea value={remarks} onChange={e => setRemarks(e.target.value)} rows={2}
              className={`${inp} resize-none`} placeholder="Any notes for the admin regarding this submission…" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 shrink-0">
          <p className="text-sm text-slate-500">
            {files.length === 0
              ? 'No documents added yet'
              : `${files.length} document${files.length !== 1 ? 's' : ''} ready`}
          </p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline text-sm">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={uploading || files.length === 0}
              className="btn-primary text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {uploading
                ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
                : <><UploadCloud size={15} /> Submit for Review</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalDocsViewer({ task }) {
  const [docs, setDocs] = useState(task.finalDocs || []);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const d = await api.getTaskFinalDocs(task._id);
      setDocs(d.documents || []);
    } catch {}
    setLoading(false);
  };

  if (docs.length === 0) return null;

  return (
    <div className="mt-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-green-700 dark:text-green-400 flex items-center gap-1">
          <FileText size={13} /> Final Documents ({docs.length})
        </p>
        <button onClick={refresh} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Refresh
        </button>
      </div>
      <div className="space-y-1.5">
        {docs.map(doc => (
          <div key={doc.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-800 rounded-lg px-3 py-2">
            <div>
              <span className="font-medium text-slate-700 dark:text-slate-300">{doc.name}</span>
              {doc.docType && <span className="text-slate-400 ml-2">• {doc.docType}</span>}
              <span className="text-slate-400 ml-2">• {formatFileSize(doc.size)}</span>
            </div>
            {doc.hasPassword && <Lock size={11} className="text-slate-400" title="Password protected" />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [uploadTask, setUploadTask] = useState(null); // task for doc upload modal

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const data = await api.getMyTasks();
      setTasks(data.tasks || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const updateStatus = async (taskId, newStatus, task) => {
    // Intercept 'completed' — must go through doc upload flow
    if (newStatus === 'completed') {
      setUploadTask(task);
      return;
    }
    // pending_review is set by backend only
    if (newStatus === 'pending_review') return;

    try {
      await api.updateTaskStatus(taskId, { status: newStatus });
      toast.success('Status updated');
      fetchTasks();
    } catch (e) {
      toast.error(e.message || 'Failed to update status');
    }
  };

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter);
  const pendingReviewTasks = tasks.filter(t => t.status === 'pending_review');

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Tasks</h1>
            <p className="text-sm text-slate-500 mt-0.5">{tasks.length} total tasks</p>
          </div>
          {pendingReviewTasks.length > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-2 flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-600" />
              <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                {pendingReviewTasks.length} task{pendingReviewTasks.length !== 1 ? 's' : ''} awaiting admin review
              </span>
            </div>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => {
            const count = s === 'all' ? tasks.length : tasks.filter(t => t.status === s).length;
            const meta = STATUS_META[s];
            const isActive = filter === s;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  isActive
                    ? 'bg-primary-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {meta ? meta.label : (s === 'all' ? 'All' : s.replace('-', ' '))}
                {' '}({count})
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No tasks found" description="No tasks match the selected filter" />
        ) : (
          <div className="space-y-3">
            {filtered.map(task => {
              const isPendingReview = task.status === 'pending_review';
              const isCompleted = task.status === 'completed';
              const hasDocs = (task.finalDocsCount || 0) > 0;

              return (
                <div
                  key={task._id}
                  className={`card p-5 hover:shadow-md transition-shadow ${isPendingReview ? 'border-orange-300 dark:border-orange-700 bg-orange-50/30 dark:bg-orange-900/10' : ''} ${isCompleted ? 'border-green-200 dark:border-green-800' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>
                          {task.priority}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_META[task.status]?.color || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_META[task.status]?.label || task.status}
                        </span>
                      </div>

                      {task.description && <p className="text-sm text-slate-500 mb-2 line-clamp-2">{task.description}</p>}

                      <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                        {task.application && <span className="flex items-center gap-1">📋 {task.application.applicationId}</span>}
                        {task.dueDate && <span className="flex items-center gap-1">📅 Due: {format(new Date(task.dueDate), 'dd MMM yyyy')}</span>}
                        {task.assignedBy && <span className="flex items-center gap-1">👤 {task.assignedBy.name}</span>}
                      </div>

                      {/* Remarks */}
                      {task.remarks?.length > 0 && (
                        <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg text-xs text-slate-600 dark:text-slate-400">
                          <strong>Latest note:</strong> {task.remarks[task.remarks.length - 1]?.text}
                        </div>
                      )}

                      {/* Final docs (for pending_review/completed) */}
                      {(isPendingReview || isCompleted) && hasDocs && (
                        <FinalDocsViewer task={task} />
                      )}

                      {/* Pending review banner */}
                      {isPendingReview && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-orange-600 dark:text-orange-400">
                          <Loader2 size={14} className="animate-spin" />
                          Awaiting admin review & approval before marking complete
                        </div>
                      )}

                      {/* Completed banner */}
                      {isCompleted && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle2 size={14} />
                          Approved & completed{task.completedAt ? ` on ${format(new Date(task.completedAt), 'dd MMM yyyy')}` : ''}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 shrink-0 items-end">
                      {/* Status selector — disabled for pending_review/completed */}
                      {!isPendingReview && !isCompleted && (
                        <select
                          value={task.status}
                          onChange={e => updateStatus(task._id, e.target.value, task)}
                          className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                        >
                          <option value="pending">Pending</option>
                          <option value="in-progress">In Progress</option>
                          <option value="review">Under Review</option>
                          <option value="on-hold">On Hold</option>
                          <option value="completed">✓ Mark Complete</option>
                        </select>
                      )}

                      {/* Upload docs button for active tasks */}
                      {!isPendingReview && !isCompleted && (
                        <button
                          onClick={() => setUploadTask(task)}
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-lg"
                        >
                          <UploadCloud size={13} /> Upload & Submit
                        </button>
                      )}

                      {/* View docs button for pending/completed */}
                      {(isPendingReview || isCompleted) && hasDocs && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <FileText size={12} /> {task.finalDocsCount} doc{task.finalDocsCount !== 1 ? 's' : ''} uploaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Document Upload Modal */}
      {uploadTask && (
        <DocUploadModal
          task={uploadTask}
          onClose={() => setUploadTask(null)}
          onSuccess={() => { setUploadTask(null); fetchTasks(); }}
        />
      )}
    </DashboardLayout>
  );
}
