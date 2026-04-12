import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState } from '../../components/ui';
import api from '../../lib/api';
import { FileText, Eye } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all', 'submitted', 'under-review', 'in-progress', 'pending-documents', 'completed'];

export default function EmployeeApplications() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchApplications(); }, []);

  const fetchApplications = async () => {
    try {
      const data = await api.getApplications({ limit: 100 });
      setApplications(data.applications || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const updateStatus = async (appId, status) => {
    try {
      await api.updateApplication(appId, { status });
      toast.success('Status updated');
      fetchApplications();
    } catch (error) { toast.error('Failed to update'); }
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
              {s === 'all' ? 'All' : s.replace('-', ' ')}
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
                      <select
                        value={app.status}
                        onChange={(e) => updateStatus(app._id, e.target.value)}
                        className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                      >
                        {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                          <option key={s} value={s}>{s.replace('-', ' ')}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <span className={`badge badge-${app.priority === 'high' || app.priority === 'urgent' ? 'red' : app.priority === 'medium' ? 'yellow' : 'green'}`}>
                        {app.priority || 'normal'}
                      </span>
                    </td>
                    <td className="text-sm text-slate-500">{format(new Date(app.createdAt), 'dd MMM yyyy')}</td>
                    <td>
                      <button onClick={() => router.push(`/dashboard/applications/${app._id}`)} className="text-primary-600 hover:text-primary-700">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
