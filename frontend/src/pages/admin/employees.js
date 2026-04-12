import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Users, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', department: '', designation: '' });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    try {
      const data = await api.getUsers({ role: 'employee' });
      setEmployees(data.users || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => {
    setEditingEmployee(null);
    setForm({ name: '', email: '', phone: '', password: '', department: '', designation: '' });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({ name: emp.name, email: emp.email, phone: emp.phone || '', password: '', department: emp.department || '', designation: emp.designation || '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        await api.updateUser(editingEmployee._id, updateData);
        toast.success('Employee updated');
      } else {
        await api.createUser({ ...form, role: 'employee' });
        toast.success('Employee created');
      }
      setShowModal(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.deleteUser(id);
      toast.success('Employee deleted');
      fetchEmployees();
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  const filtered = employees.filter(e =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employees</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2 text-sm w-48" />
            </div>
            <button onClick={openAdd} className="btn-primary btn-sm"><Plus size={16} className="mr-1" /> Add Employee</button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No employees found" description="Add your first employee" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(emp => (
              <div key={emp._id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold">
                      {emp.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{emp.name}</h3>
                      <p className="text-xs text-slate-500">{emp.designation || emp.department || 'Employee'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(emp._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p>📧 {emp.email}</p>
                  <p>📱 {emp.phone || '-'}</p>
                  {emp.department && <p>🏢 {emp.department}</p>}
                  <p className="text-xs text-slate-400">Joined: {format(new Date(emp.createdAt), 'dd MMM yyyy')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEmployee ? 'Edit Employee' : 'Add Employee'}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name *</label>
              <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" disabled={!!editingEmployee} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">{editingEmployee ? 'New Password' : 'Password *'}</label>
                <input type="password" required={!editingEmployee} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" placeholder={editingEmployee ? 'Leave blank' : ''} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Department</label>
                <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input" placeholder="e.g., Tax" />
              </div>
              <div>
                <label className="label">Designation</label>
                <input type="text" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="input" placeholder="e.g., CA" />
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">{editingEmployee ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
