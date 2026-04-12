import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, PageLoading, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { ClipboardList, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [dashData, tasksData, appsData] = await Promise.all([
        api.getDashboardStats(),
        api.getMyTasks(),
        api.getApplications({ limit: 5 })
      ]);
      setStats(dashData);
      setTasks(tasksData.tasks || []);
      setApplications(appsData.applications || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name}!</h1>
          <p className="text-slate-500 mt-1">Here's your work overview</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} label="Total Tasks" value={totalTasks} color="blue" />
          <StatCard icon={Clock} label="Pending" value={pendingTasks} color="yellow" />
          <StatCard icon={AlertCircle} label="In Progress" value={inProgressTasks} color="purple" />
          <StatCard icon={CheckCircle} label="Completed" value={completedTasks} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Tasks</h2>
              <Link href="/employee/tasks" className="text-primary-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {tasks.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.application?.applicationId || ''} {task.dueDate ? `• Due: ${format(new Date(task.dueDate), 'dd MMM')}` : ''}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No tasks assigned yet</p>}
            </div>
          </div>

          {/* Assigned Applications */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assigned Applications</h2>
              <Link href="/employee/applications" className="text-primary-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {applications.slice(0, 5).map(app => (
                <div key={app._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-primary-600">{app.applicationId}</p>
                    <p className="text-xs text-slate-500">{app.service?.name} • {app.client?.name}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
              {applications.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No applications assigned yet</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
