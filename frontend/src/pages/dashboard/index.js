import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, StatusBadge, PageLoading } from '../../components/ui';
import api from '../../lib/api';
import { FolderOpen, FileText, CheckCircle, CreditCard, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function ClientDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user]);

  const fetchDashboard = async () => {
    try {
      const result = await api.getClientDashboard();
      setData(result);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Welcome back, {user?.name}!
            </h1>
            <p className="text-slate-500">Here&apos;s an overview of your account</p>
          </div>
          <Link href="/dashboard/apply" className="btn-primary">
            <FileText size={18} className="mr-2" /> New Application
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FolderOpen} label="Total Applications" value={data?.stats?.totalApplications || 0} color="primary" />
          <StatCard icon={Clock} label="Active" value={data?.stats?.activeApplications || 0} color="yellow" />
          <StatCard icon={CheckCircle} label="Completed" value={data?.stats?.completedApplications || 0} color="green" />
          <StatCard icon={CreditCard} label="Pending Payments" value={data?.stats?.pendingPayments || 0} color="red" />
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Applications</h2>
            <Link href="/dashboard/applications" className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          
          {data?.recentApplications?.length > 0 ? (
            <div className="space-y-3">
              {data.recentApplications.map(app => (
                <Link
                  key={app._id}
                  href={`/dashboard/applications/${app._id}`}
                  className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                      <FileText size={20} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{app.service?.name}</p>
                      <p className="text-xs text-slate-500">{app.applicationId} • {format(new Date(app.createdAt), 'dd MMM yyyy')}</p>
                    </div>
                  </div>
                  <StatusBadge status={app.status} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderOpen size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 mb-4">No applications yet</p>
              <Link href="/dashboard/apply" className="btn-primary btn-sm">Apply Now</Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: 'Apply for Service', desc: 'Start a new application', href: '/dashboard/apply', icon: FileText },
            { title: 'View Invoices', desc: 'Check your invoices', href: '/dashboard/invoices', icon: CreditCard },
            { title: 'Messages', desc: 'Chat with your CA', href: '/dashboard/chat', icon: FolderOpen },
          ].map(action => (
            <Link key={action.href} href={action.href} className="card-hover group">
              <action.icon size={24} className="text-primary-600 dark:text-primary-400 mb-3" />
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600">{action.title}</h3>
              <p className="text-sm text-slate-500">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
