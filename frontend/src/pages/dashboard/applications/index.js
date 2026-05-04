import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState } from '../../../components/ui';
import RatingModal, { StarDisplay } from '../../../components/RatingModal';
import api from '../../../lib/api';
import { FolderOpen, Star } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

export default function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [ratingApp, setRatingApp] = useState(null);

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

  const handleRated = (updatedApp) => {
    setApplications(prev => prev.map(a => a._id === updatedApp._id ? updatedApp : a));
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
              <div key={app._id} className="card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <Link href={`/dashboard/applications/${app._id}`} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FolderOpen className="text-primary-600 dark:text-primary-400" size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{app.service?.name || 'Service'}</p>
                    <p className="text-sm text-slate-500">{app.applicationId} • {format(new Date(app.createdAt), 'dd MMM yyyy')}</p>
                    {/* Show existing rating if already rated */}
                    {app.rating && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <StarDisplay value={app.rating} size={12} />
                        <span className="text-xs text-slate-400">Your rating</span>
                      </div>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-3 sm:text-right flex-shrink-0">
                  <StatusBadge status={app.status} />
                  {/* Rate button for completed, unrated apps */}
                  {app.status === 'completed' && !app.rating && (
                    <button
                      onClick={() => setRatingApp(app)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      Rate
                    </button>
                  )}
                  {app.assignedEmployee && !app.rating && app.status !== 'completed' && (
                    <span className="text-xs text-slate-500">CA: {app.assignedEmployee.name}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {ratingApp && (
          <RatingModal
            isOpen={!!ratingApp}
            onClose={() => setRatingApp(null)}
            application={ratingApp}
            onRated={handleRated}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
