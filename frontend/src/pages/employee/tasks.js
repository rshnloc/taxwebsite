import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState } from '../../components/ui';
import api from '../../lib/api';
import { ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUSES = ['all', 'pending', 'in-progress', 'review', 'completed', 'on-hold'];

export default function EmployeeTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    try {
      const data = await api.getMyTasks();
      setTasks(data.tasks || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const updateStatus = async (taskId, status) => {
    try {
      await api.updateTask(taskId, { status });
      toast.success('Task status updated');
      fetchTasks();
    } catch (error) { toast.error('Failed to update'); }
  };

  const filtered = tasks.filter(t => filter === 'all' || t.status === filter);
  const priorityColors = { low: 'green', medium: 'yellow', high: 'red', urgent: 'red' };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Tasks</h1>

        <div className="flex gap-2 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === s ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {s === 'all' ? `All (${tasks.length})` : `${s.replace('-', ' ')} (${tasks.filter(t => t.status === s).length})`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No tasks found" />
        ) : (
          <div className="space-y-3">
            {filtered.map(task => (
              <div key={task._id} className="card p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{task.title}</h3>
                      <span className={`badge badge-${priorityColors[task.priority] || 'blue'}`}>{task.priority}</span>
                    </div>
                    {task.description && <p className="text-sm text-slate-500 mb-2">{task.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {task.application && <span>📋 {task.application.applicationId}</span>}
                      {task.dueDate && <span>📅 Due: {format(new Date(task.dueDate), 'dd MMM yyyy')}</span>}
                      {task.assignedBy && <span>👤 By: {task.assignedBy.name}</span>}
                    </div>
                    {task.remarks && (
                      <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs text-slate-600 dark:text-slate-400">
                        <strong>Remarks:</strong> {task.remarks}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) => updateStatus(task._id, e.target.value)}
                      className="text-sm px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="review">Review</option>
                      <option value="completed">Completed</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
