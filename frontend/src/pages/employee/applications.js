import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all', 'submitted', 'under-review', 'in-progress', 'pending-documents', 'completed', 'rejected'];
const CHANGE_OPTIONS = STATUS_OPTIONS.filter(s => s !== 'all');

export default function EmployeeApplications() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Status change modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [pendingApp, setPendingApp] = useState(null);
  const [pendingStatus, setPendingStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const data = await api.getApplications({ limit: 100 });
      setApplications(data.applications || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const openStatusModal = (app, status) => {
    setPendingApp(app);
    setPendingStatus(status);
    setStatusRemarks('');
    setShowStatusModal(true);
  };

  const confirmStatusChange = async () => {
    if (!statusRemarks.trim()) return toast.error('Please add remarks before updating');
    setUpdatingStatus(true);
    try {
      await api.updateApplicationStatus(pendingApp._id, { status: pendingStatus, message: statusRemarks });
      toast.success('Status updated');
      setShowStatusModal(false);
      fetchApplications();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filtered = applications.filter(a => filter === 'all' || a.status === filter);

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Assigned Applications</h1>

        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === s ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? 'All' : s.replace(/-/g, ' ')}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No applications found" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Client</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => (
                  <tr key={app._id}>
                    <td className="font-medium text-primary-600">{app.applicationId}</td>
                    <td>
                      <div>
                        <p className="font-medium text-sm">{app.client?.name || '-'}</p>
                        <p className="text-xs text-slate-500">{app.client?.email}</p>
                      </div>
                    </td>
                    <td className="text-sm">{app.service?.name || '-'}</td>
                    <td>
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={app.status} />
                        <select
                          value=""
                          onChange={(e) => { if (e.target.value) openStatusModal(app, e.target.value); }}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-500 cursor-pointer"
                          title="Change status"
                        >
                          <option value="">Change…</option>
                          {CHANGE_OPTIONS.filter(s => s !== app.status).map(s => (
                            <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${app.priority === 'high' || app.priority === 'urgent' ? 'red' : app.priority === 'medium' ? 'yellow' : 'green'}`}>
                        {app.priority || 'normal'}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500">{format(new Date(app.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      <button onClick={() => router.push(`/admin/applications/${app._id}`)} className="text-primary-600 hover:text-primary-700">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Status Change Modal */}
        <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Application Status">
          <div className="space-y-4">
            {pendingApp && (
              <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm">
                <span className="font-medium text-slate-700 dark:text-slate-300">{pendingApp.applicationId}</span>
                <span className="text-slate-500"> — {pendingApp.client?.name}</span>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <span className="text-sm text-slate-500">Current:</span>
              <StatusBadge status={pendingApp?.status} />
              <span className="text-slate-300 dark:text-slate-500">→</span>
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
              <p className="text-xs text-slate-400 mt-1">Remarks appear in the application timeline. An email will be sent to the client and admin.</p>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowStatusModal(false)} className="btn-outline">Cancel</button>
              <button onClick={confirmStatusChange} disabled={updatingStatus || !statusRemarks.trim()} className="btn-primary">
                {updatingStatus ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
