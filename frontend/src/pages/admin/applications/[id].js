import { useState, useEffect } from 'react';
import SearchableSelect from '../../../components/SearchableSelect';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, Modal } from '../../../components/ui';
import api from '../../../lib/api';
import { ArrowLeft, UserPlus, Download, Upload, MessageCircle, Clock, FileText, CheckCircle, Lock, Eye, EyeOff, AlertCircle, MessageSquare, Send, Shield } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['submitted', 'under-review', 'in-progress', 'pending-documents', 'completed', 'rejected', 'cancelled'];

// Document row with password reveal
function DocRow({ doc }) {
  const [revealedPwd, setRevealedPwd] = useState(null);
  const [loadingPwd, setLoadingPwd] = useState(false);

  const handleRevealPassword = async () => {
    if (revealedPwd !== null) { setRevealedPwd(null); return; }
    setLoadingPwd(true);
    try {
      const data = await api.getDocumentPassword(doc.id);
      setRevealedPwd(data.password);
    } catch (e) {
      toast.error('Failed to reveal password');
    } finally {
      setLoadingPwd(false);
    }
  };

  return (
    <div className="flex items-center justify-between px-3 py-2.5">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FileText size={15} className="text-primary-500 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate text-slate-800 dark:text-white">{doc.originalName || doc.name}</p>
          <div className="flex items-center gap-2 flex-wrap">
            {doc.size > 0 && <span className="text-xs text-slate-400">{(doc.size / 1024).toFixed(1)} KB</span>}
            {doc.uploadStatus && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                doc.uploadStatus === 'verified' ? 'bg-green-100 text-green-600' :
                doc.uploadStatus === 'rejected' ? 'bg-red-100 text-red-600' :
                'bg-yellow-100 text-yellow-700'
              }`}>{doc.uploadStatus}</span>
            )}
            {doc.isPasswordProtected && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded-full flex items-center gap-0.5 font-medium">
                <Lock size={8} />Protected
              </span>
            )}
          </div>
          {revealedPwd !== null && (
            <div className="mt-1 flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded font-mono">
              <Lock size={10} className="text-primary-500" />
              <span className="text-slate-800 dark:text-white select-all">{revealedPwd}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 ml-2">
        {doc.isPasswordProtected && (
          <button onClick={handleRevealPassword} disabled={loadingPwd}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary-600 transition-colors"
            title={revealedPwd !== null ? 'Hide password' : 'Reveal password'}>
            {loadingPwd ? <span className="spinner w-3 h-3" /> : revealedPwd !== null ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <a href={`${process.env.NEXT_PUBLIC_API_URL}/api/${doc.path}`} target="_blank" rel="noreferrer"
          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-primary-600 transition-colors">
          <Download size={15} />
        </a>
      </div>
    </div>
  );
}

export default function AdminApplicationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [app, setApp] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [note, setNote] = useState('');
  const [remarkText, setRemarkText] = useState('');
  const [remarkInternal, setRemarkInternal] = useState(false);
  const [addingRemark, setAddingRemark] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      fetchApplication();
      fetchEmployees();
    }
  }, [id]);

  const fetchApplication = async () => {
    try {
      const data = await api.getApplication(id);
      setApp(data.application);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.getUsers({ role: 'employee' });
      setEmployees(data.users || []);
    } catch (error) { console.error(error); }
  };

  const openStatusModal = (status) => {
    setPendingStatus(status);
    setStatusRemarks('');
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!statusRemarks.trim()) return toast.error('Please add remarks');
    setUpdatingStatus(true);
    try {
      await api.updateApplicationStatus(id, { status: pendingStatus, message: statusRemarks });
      toast.success('Status updated');
      setShowStatusModal(false);
      fetchApplication();
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedEmployee) return;
    try {
      await api.updateApplication(id, { assignedEmployee: selectedEmployee });
      toast.success('Employee assigned');
      setShowAssignModal(false);
      fetchApplication();
    } catch (error) {
      toast.error('Failed to assign');
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    try {
      await api.updateApplication(id, { notes: note });
      toast.success('Note added');
      setNote('');
      fetchApplication();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleAddRemark = async () => {
    if (!remarkText.trim()) return toast.error('Enter a remark');
    setAddingRemark(true);
    try {
      await api.addApplicationRemark(id, { message: remarkText, isInternal: remarkInternal });
      setRemarkText('');
      toast.success(remarkInternal ? 'Internal note added' : 'Remark added — client notified by email');
      fetchApplication();
    } catch (err) {
      toast.error(err.message || 'Failed to add remark');
    } finally {
      setAddingRemark(false);
    }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;
  if (!app) return <DashboardLayout><p>Application not found</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/admin/applications')} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{app.applicationId}</h1>
            <p className="text-sm text-slate-500">{app.service?.name}</p>
          </div>
          <StatusBadge status={app.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Control */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Update Status</h2>
              <p className="text-xs text-slate-500 mb-3">Click a status to update — you'll be asked for remarks that will be visible to the client.</p>
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => openStatusModal(s)}
                    disabled={app.status === s}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                      app.status === s
                        ? 'bg-primary-500 text-white cursor-default'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {s.replace(/-/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Client Info */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Client Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-slate-500">Name:</span> <strong>{app.client?.name}</strong></div>
                <div><span className="text-slate-500">Email:</span> <strong>{app.client?.email}</strong></div>
                <div><span className="text-slate-500">Phone:</span> <strong>{app.client?.phone || '-'}</strong></div>
                <div><span className="text-slate-500">PAN:</span> <strong>{app.client?.pan || '-'}</strong></div>
              </div>
            </div>

            {/* Timeline + Remarks */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Application Timeline</h2>
                <span className="text-xs text-slate-400">{app.timeline?.length || 0} entries</span>
              </div>

              {/* Add Remark box */}
              <div className="mb-6 border border-slate-200 dark:border-slate-700 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/50">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1"><MessageSquare size={13}/> Add Remark / Feedback</p>
                <textarea
                  value={remarkText}
                  onChange={e => setRemarkText(e.target.value)}
                  className="input h-20 text-sm"
                  placeholder="Write a remark, feedback, or update for this application…"
                />
                <div className="flex items-center justify-between mt-2">
                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                    <input type="checkbox" checked={remarkInternal} onChange={e => setRemarkInternal(e.target.checked)} className="rounded" />
                    <Shield size={12} className={remarkInternal ? 'text-amber-500' : 'text-slate-400'} />
                    <span className={remarkInternal ? 'text-amber-600 font-semibold' : ''}>Internal only (not visible to client)</span>
                  </label>
                  <button
                    onClick={handleAddRemark}
                    disabled={addingRemark || !remarkText.trim()}
                    className="btn-primary btn-sm flex items-center gap-1.5"
                  >
                    <Send size={13} />{addingRemark ? 'Adding…' : 'Post Remark'}
                  </button>
                </div>
              </div>

              {/* Timeline entries */}
              <div className="space-y-0">
                {app.timeline?.length > 0 ? [...app.timeline].reverse().map((entry, idx, arr) => {
                  const isRemark = entry.entryType === 'remark';
                  const isStatus = entry.entryType === 'status_change' || !entry.entryType;
                  const dotColor = entry.status === 'completed' ? 'bg-green-500' :
                    entry.status === 'rejected' || entry.status === 'cancelled' ? 'bg-red-500' :
                    entry.status === 'in-progress' ? 'bg-blue-500' :
                    isRemark ? (entry.isInternal ? 'bg-amber-400' : 'bg-violet-400') : 'bg-primary-500';
                  return (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1 ${dotColor}`}></div>
                        {idx < arr.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mt-1 min-h-4"></div>}
                      </div>
                      <div className="pb-5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          {isStatus && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${
                              entry.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              entry.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              entry.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              entry.status === 'pending-documents' ? 'bg-orange-100 text-orange-700' :
                              'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}>{(entry.status || '').replace(/-/g, ' ')}</span>
                          )}
                          {isRemark && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              entry.isInternal
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                            }`}>
                              {entry.isInternal ? '🔒 Internal Note' : '💬 Remark'}
                            </span>
                          )}
                          {entry.updatedBy?.name && (
                            <span className="text-xs text-slate-400">
                              by <span className="font-medium text-slate-600 dark:text-slate-300">{entry.updatedBy.name}</span>
                              <span className="ml-1 capitalize text-slate-400">({entry.updatedBy.role})</span>
                            </span>
                          )}
                        </div>
                        {entry.message && (
                          <p className={`text-sm mt-1.5 rounded-lg px-3 py-2 ${
                            entry.isInternal
                              ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                              : isRemark
                              ? 'bg-violet-50 dark:bg-violet-900/10 text-slate-700 dark:text-slate-300 border border-violet-200 dark:border-violet-800'
                              : 'bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                          }`}>{entry.message}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          {entry.timestamp && !isNaN(new Date(entry.timestamp))
                            ? format(new Date(entry.timestamp), 'dd MMM yyyy, hh:mm a')
                            : entry.timestamp || ''}
                        </p>
                      </div>
                    </div>
                  );
                }) : <p className="text-sm text-slate-500">No timeline entries yet</p>}
              </div>
            </div>

            {/* Internal Notes (separate from public timeline) */}
            {app.notes?.length > 0 && (
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Internal Notes</h2>
                <div className="space-y-2">
                  {app.notes.map((n, i) => (
                    <div key={i} className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs text-slate-500">{n.author?.name || 'Unknown'}</span>
                        <span className="text-xs text-slate-400">
                          {n.createdAt && !isNaN(new Date(n.createdAt)) ? format(new Date(n.createdAt), 'dd MMM yyyy, hh:mm a') : ''}
                        </span>
                      </div>
                      {n.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Documents</h2>
              {app.documents?.length > 0 ? (() => {
                // Group by fieldName
                const groups = {};
                app.documents.forEach(doc => {
                  const key = doc.fieldName || doc.name || 'Other';
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(doc);
                });
                return (
                  <div className="space-y-3">
                    {Object.entries(groups).map(([fieldName, docs]) => (
                      <div key={fieldName} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                          <FileText size={14} className="text-primary-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{fieldName}</span>
                          <span className="ml-auto text-[10px] text-slate-400">{docs.length} file{docs.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                          {docs.map((doc, di) => (
                            <DocRow key={di} doc={doc} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <p className="text-sm text-slate-500">No documents uploaded</p>
              )}
            </div>

            {/* Documents */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Documents</h2>
              {app.documents?.length > 0 ? (() => {
                const groups = {};
                app.documents.forEach(doc => {
                  const key = doc.fieldName || doc.name || 'Other';
                  if (!groups[key]) groups[key] = [];
                  groups[key].push(doc);
                });
                return (
                  <div className="space-y-3">
                    {Object.entries(groups).map(([fieldName, docs]) => (
                      <div key={fieldName} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="px-3 py-2 bg-slate-50 dark:bg-slate-700/50 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                          <FileText size={14} className="text-primary-500" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">{fieldName}</span>
                          <span className="ml-auto text-[10px] text-slate-400">{docs.length} file{docs.length > 1 ? 's' : ''}</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-700">
                          {docs.map((doc, di) => (
                            <DocRow key={di} doc={doc} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <p className="text-sm text-slate-500">No documents uploaded</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Assigned Employee */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Assigned Employee</h2>
              {app.assignedEmployee ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                    {app.assignedEmployee.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{app.assignedEmployee.name}</p>
                    <p className="text-xs text-slate-500">{app.assignedEmployee.email}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500 mb-3">No employee assigned</p>
              )}
              <button onClick={() => setShowAssignModal(true)} className="btn-primary btn-sm w-full mt-3">
                <UserPlus size={14} className="mr-1" /> {app.assignedEmployee ? 'Reassign' : 'Assign Employee'}
              </button>
            </div>
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Payment Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Amount</span><span>₹{app.payment?.amount?.toLocaleString('en-IN') || '0'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">GST (18%)</span><span>₹{app.payment?.gst?.toLocaleString('en-IN') || '0'}</span></div>
                <hr className="dark:border-slate-700" />
                <div className="flex justify-between font-bold"><span>Total</span><span>₹{app.payment?.total?.toLocaleString('en-IN') || '0'}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Status</span><StatusBadge status={app.payment?.status || 'pending'} /></div>
              </div>
            </div>

            {/* Service Details */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Service</h2>
              <p className="font-medium text-sm">{app.service?.name}</p>
              <p className="text-xs text-slate-500 mt-1">{app.service?.shortDescription}</p>
              <p className="text-sm font-semibold mt-3">Starting at ₹{app.service?.pricing?.startingAt?.toLocaleString('en-IN') || '0'}</p>
            </div>

            {/* Priority */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Priority</h2>
              <span className={`badge badge-${app.priority === 'high' || app.priority === 'urgent' ? 'red' : app.priority === 'medium' ? 'yellow' : 'green'}`}>
                {app.priority || 'Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* Status Change Modal */}
        <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Application Status">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-sm text-slate-500">Current:</span>
              <StatusBadge status={app?.status} />
              <span className="text-slate-300">→</span>
              <span className={`text-sm font-semibold capitalize px-2 py-0.5 rounded-full ${
                pendingStatus === 'completed' ? 'bg-green-100 text-green-700' :
                pendingStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                pendingStatus === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-200'
              }`}>{pendingStatus.replace(/-/g, ' ')}</span>
            </div>
            <div>
              <label className="label">Remarks <span className="text-red-500">*</span></label>
              <textarea
                value={statusRemarks}
                onChange={e => setStatusRemarks(e.target.value)}
                className="input h-24"
                placeholder="What was done? What's the next step? This will be visible to the client..."
                autoFocus
              />
              <p className="text-xs text-slate-400 mt-1">This remark will be shown in the application timeline to admin, client, and assignee. An email will be sent to the client and admin.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowStatusModal(false)} className="btn-outline">Cancel</button>
              <button onClick={confirmStatusChange} disabled={updatingStatus || !statusRemarks.trim()} className="btn-primary">
                {updatingStatus ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </Modal>

        {/* Assign Modal */}
        <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Employee">
          <div className="space-y-4">
            <SearchableSelect
              value={selectedEmployee}
              onChange={v => setSelectedEmployee(v)}
              options={employees.map(emp => ({ value: emp._id, label: emp.name + ' (' + (emp.designation || 'Employee') + ')' }))}
              placeholder="Select Employee…"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAssignModal(false)} className="btn-outline">Cancel</button>
              <button onClick={handleAssign} disabled={!selectedEmployee} className="btn-primary">Assign</button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
