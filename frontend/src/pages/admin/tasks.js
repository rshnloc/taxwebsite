import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { ClipboardList, Plus, Search, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', assignedTo: '', application: '', priority: 'medium', dueDate: '', status: 'pending'
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    fetchApplications();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data.tasks || []);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.getUsers({ role: 'employee' });
      setEmployees(data.users || []);
    } catch (error) { console.error(error); }
  };

  const fetchApplications = async () => {
    try {
      const data = await api.getApplications({ limit: 100 });
      setApplications(data.applications || []);
    } catch (error) { console.error(error); }
  };

  const openAdd = () => {
    setEditingTask(null);
    setForm({ title: '', description: '', assignedTo: '', application: '', priority: 'medium', dueDate: '', status: 'pending' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      assignedTo: task.assignedTo?._id || '',
      application: task.application?._id || '',
      priority: task.priority || 'medium',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      status: task.status || 'pending'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...form };
      if (!payload.application) delete payload.application;
      if (!payload.dueDate) delete payload.dueDate;

      if (editingTask) {
        await api.updateTask(editingTask._id, payload);
        toast.success('Task updated');
      } else {
        await api.createTask(payload);
        toast.success('Task created');
      }
      setShowModal(false);
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    try {
      await api.deleteTask(id);
      toast.success('Task deleted');
      fetchTasks();
    } catch (error) { toast.error('Failed to delete'); }
  };

  const filtered = tasks.filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase()) || t.assignedTo?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const priorityColors = { low: 'green', medium: 'yellow', high: 'red', urgent: 'red' };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tasks</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2 text-sm w-48" />
            </div>
            <button onClick={openAdd} className="btn-primary btn-sm"><Plus size={16} className="mr-1" /> Create Task</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={ClipboardList} title="No tasks found" description="Create your first task" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Assigned To</th>
                  <th>Application</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(task => (
                  <tr key={task._id}>
                    <td>
                      <div>
                        <p className="font-medium text-sm">{task.title}</p>
                        {task.description && <p className="text-xs text-slate-500 line-clamp-1">{task.description}</p>}
                      </div>
                    </td>
                    <td className="text-sm">{task.assignedTo?.name || '-'}</td>
                    <td className="text-sm text-primary-600">{task.application?.applicationId || '-'}</td>
                    <td>
                      <span className={`badge badge-${priorityColors[task.priority] || 'blue'}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td><StatusBadge status={task.status} /></td>
                    <td className="text-sm text-slate-500">{task.dueDate ? format(new Date(task.dueDate), 'dd MMM yyyy') : '-'}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(task)} className="text-primary-600 hover:text-primary-700"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(task._id)} className="text-red-500 hover:text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Task Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTask ? 'Edit Task' : 'Create Task'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Title *</label>
              <input type="text" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input h-20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Assign To *</label>
                <select required value={form.assignedTo} onChange={e => setForm({ ...form, assignedTo: e.target.value })} className="input">
                  <option value="">Select</option>
                  {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Application</label>
                <select value={form.application} onChange={e => setForm({ ...form, application: e.target.value })} className="input">
                  <option value="">None</option>
                  {applications.map(app => <option key={app._id} value={app._id}>{app.applicationId}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Priority</label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="input">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="label">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="input">
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                  <option value="on-hold">On Hold</option>
                </select>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="input" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">{editingTask ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
