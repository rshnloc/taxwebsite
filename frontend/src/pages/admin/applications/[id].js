import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, Modal } from '../../../components/ui';
import api from '../../../lib/api';
import { ArrowLeft, UserPlus, Download, Upload, MessageCircle, Clock, FileText, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['submitted', 'under-review', 'in-progress', 'pending-documents', 'completed', 'rejected', 'cancelled'];

export default function AdminApplicationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [app, setApp] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [note, setNote] = useState('');

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

  const handleStatusChange = async (status) => {
    try {
      await api.updateApplication(id, { status });
      toast.success('Status updated');
      fetchApplication();
    } catch (error) {
      toast.error('Failed to update');
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
              <div className="flex flex-wrap gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                      app.status === s
                        ? 'bg-primary-500 text-white'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {s.replace('-', ' ')}
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

            {/* Timeline */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Timeline</h2>
              <div className="space-y-4">
                {app.timeline?.map((entry, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-500"></div>
                      {idx < app.timeline.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 dark:bg-slate-700 mt-1"></div>}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-sm text-slate-900 dark:text-white">{entry.status?.replace('-', ' ')}</p>
                      <p className="text-xs text-slate-500">{entry.comment}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(entry.date), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Documents</h2>
              {app.documents?.length > 0 ? (
                <div className="space-y-2">
                  {app.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-primary-500" />
                        <span className="text-sm text-slate-700 dark:text-slate-300">{doc.name || doc.originalName || `Document ${idx + 1}`}</span>
                      </div>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}/${doc.path}`} target="_blank" rel="noreferrer" className="text-primary-600 hover:text-primary-700 text-sm">
                        <Download size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No documents uploaded</p>
              )}
            </div>

            {/* Add Note */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add Note</h2>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="input h-24 mb-3"
                placeholder="Write a note..."
              />
              <button onClick={handleAddNote} className="btn-primary btn-sm">Add Note</button>

              {app.notes && (
                <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-slate-700 dark:text-slate-300">
                  <strong>Notes:</strong> {app.notes}
                </div>
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

            {/* Payment */}
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

        {/* Assign Modal */}
        <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Employee">
          <div className="space-y-4">
            <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} className="input">
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp._id} value={emp._id}>{emp.name} ({emp.designation || 'Employee'})</option>
              ))}
            </select>
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
