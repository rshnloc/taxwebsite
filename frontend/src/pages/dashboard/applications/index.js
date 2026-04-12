import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState } from '../../components/ui';
import api from '../../lib/api';
import { FolderOpen, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchApplications();
  }, [status]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const params = status ? `status=${status}` : '';
      const data = await api.getMyApplications(params);
      setApplications(data.applications);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const statuses = ['', 'submitted', 'under-review', 'in-progress', 'pending-documents', 'completed'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Applications</h1>
          <Link href="/dashboard/apply" className="btn-primary btn-sm">+ New Application</Link>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {statuses.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === s ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              {s ? s.replace(/-/g, ' ') : 'All'}
            </button>
          ))}
        </div>

        {loading ? <PageLoading /> : applications.length === 0 ? (
          <EmptyState icon={FolderOpen} title="No applications found" description="Start by applying for a service" 
            action={<Link href="/dashboard/apply" className="btn-primary btn-sm">Apply Now</Link>} />
        ) : (
          <div className="space-y-3">
            {applications.map(app => (
              <Link key={app._id} href={`/dashboard/applications/${app._id}`}
                className="card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center">
                    <FolderOpen className="text-primary-600 dark:text-primary-400" size={22} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{app.service?.name || 'Service'}</p>
                    <p className="text-sm text-slate-500">{app.applicationId} • {format(new Date(app.createdAt), 'dd MMM yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <StatusBadge status={app.status} />
                  {app.assignedEmployee && (
                    <span className="text-xs text-slate-500">Assigned to: {app.assignedEmployee.name}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
