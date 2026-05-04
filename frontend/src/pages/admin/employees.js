import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, EmptyState, Modal } from '../../components/ui';
import { StarDisplay } from '../../components/RatingModal';
import api from '../../lib/api';
import { Users, Plus, Pencil, Trash2, Search, Star, Filter, Calendar, Cake, UserX, AlertTriangle } from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'resigned', label: 'Resigned' },
  { value: 'terminated', label: 'Terminated' },
  { value: 'on_leave', label: 'On Leave' },
];

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  resigned: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  terminated: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  on_leave: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterActive, setFilterActive] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    department: '', designation: '', roleId: '',
    joiningDate: '', dob: '', lastWorkingDay: '', employmentStatus: 'active',
  });
  const [ratingsData, setRatingsData] = useState(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [todayBirthdays, setTodayBirthdays] = useState([]);

  useEffect(() => { fetchEmployees(); fetchRoles(); fetchTodayBirthdays(); }, []);

  const fetchRoles = async () => {
    try { const data = await api.getRoles(); setRoles(data.roles || []); } catch (e) { console.error(e); }
  };

  const fetchTodayBirthdays = async () => {
    try { const data = await api.getBirthdaysToday(); setTodayBirthdays(data.employees || []); } catch (e) {}
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.getUsers({ role: 'employee' });
      setEmployees(data.users || []);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  const openAdd = () => {
    setEditingEmployee(null);
    setForm({ name: '', email: '', phone: '', password: '', department: '', designation: '', roleId: '', joiningDate: '', dob: '', lastWorkingDay: '', employmentStatus: 'active' });
    setShowModal(true);
  };

  const openEdit = (emp) => {
    setEditingEmployee(emp);
    setForm({
      name: emp.name, email: emp.email, phone: emp.phone || '',
      password: '', department: emp.department || '', designation: emp.designation || '',
      roleId: emp.roleId || '',
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      dob: emp.dob ? emp.dob.split('T')[0] : '',
      lastWorkingDay: emp.lastWorkingDay ? emp.lastWorkingDay.split('T')[0] : '',
      employmentStatus: emp.employmentStatus || 'active',
    });
    setShowModal(true);
  };

  const openRatings = async (emp) => {
    setRatingsData({ employee: emp, ratings: [], average: null, total: 0 });
    setRatingsLoading(true);
    try { const data = await api.getEmployeeRatings(emp._id); setRatingsData({ employee: emp, ...data }); }
    catch (e) { toast.error('Failed to load ratings'); }
    finally { setRatingsLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        const updateData = { ...form };
        if (!updateData.password) delete updateData.password;
        if (updateData.roleId) updateData.roleId = parseInt(updateData.roleId);
        await api.updateUser(editingEmployee._id, updateData);
        toast.success('Employee updated');
      } else {
        const payload = { ...form, role: 'employee' };
        if (payload.roleId) payload.roleId = parseInt(payload.roleId);
        await api.createUser(payload);
        toast.success('Employee created');
      }
      setShowModal(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this employee?')) return;
    try { await api.deleteUser(id); toast.success('Employee deactivated'); fetchEmployees(); }
    catch (error) { toast.error('Failed'); }
  };

  const handleRunBirthdayCheck = async () => {
    try {
      const data = await api.runBirthdayCheck();
      toast.success(data.count > 0 ? `Birthday notifications sent to ${data.count} employee(s)!` : 'No birthdays today');
      fetchTodayBirthdays();
    } catch (e) { toast.error(e.message || 'Failed'); }
  };

  const isBirthdayToday = (dob) => {
    if (!dob) return false;
    const today = new Date();
    const d = new Date(dob);
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };

  const filtered = employees.filter(emp => {
    const matchSearch = !search || emp.name?.toLowerCase().includes(search.toLowerCase()) || emp.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || (emp.employmentStatus || 'active') === filterStatus;
    const matchActive = filterActive === 'all' || (filterActive === 'active' ? emp.isActive : !emp.isActive);
    return matchSearch && matchStatus && matchActive;
  });

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Employees</h1>
            <p className="text-slate-500 text-sm mt-0.5">{employees.length} total</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2 text-sm w-48" />
            </div>
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input pl-8 py-2 text-sm pr-8 w-40">
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <select value={filterActive} onChange={e => setFilterActive(e.target.value)} className="input py-2 text-sm w-32">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button onClick={handleRunBirthdayCheck} className="btn-outline btn-sm flex items-center gap-1.5 text-pink-600 border-pink-300 hover:bg-pink-50 dark:hover:bg-pink-900/20">
              <Cake size={14} /> Birthdays
            </button>
            <button onClick={openAdd} className="btn-primary btn-sm"><Plus size={16} className="mr-1" /> Add Employee</button>
          </div>
        </div>

        {/* Birthday banner */}
        {todayBirthdays.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">🎂</span>
            <div>
              <p className="font-semibold text-purple-800 dark:text-purple-300 text-sm">Birthday{todayBirthdays.length > 1 ? 's' : ''} Today! 🎉</p>
              <p className="text-purple-600 dark:text-purple-400 text-xs">{todayBirthdays.map(e => e.name).join(', ')} {todayBirthdays.length === 1 ? 'is' : 'are'} celebrating today!</p>
            </div>
          </div>
        )}

        {/* Cards */}
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No employees found" description="Try adjusting your filters or add a new employee" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(emp => {
              const status = emp.employmentStatus || 'active';
              const birthdayToday = isBirthdayToday(emp.dob);
              const lwdPast = emp.lastWorkingDay && isPast(parseISO(emp.lastWorkingDay.split('T')[0]));
              return (
                <div key={emp._id} className={`card p-6 hover:shadow-lg transition-shadow relative ${!emp.isActive ? 'opacity-60' : ''} ${birthdayToday ? 'ring-2 ring-pink-400 ring-offset-2 dark:ring-offset-slate-900' : ''}`}>
                  {status !== 'active' && (
                    <div className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[status]}`}>
                      {STATUS_OPTIONS.find(s => s.value === status)?.label}
                    </div>
                  )}
                  {birthdayToday && <div className="absolute top-3 left-3 text-lg">🎂</div>}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${
                        status === 'terminated' ? 'bg-red-400' : status === 'resigned' ? 'bg-yellow-400' : 'bg-green-500'
                      }`}>
                        {emp.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{emp.name}</h3>
                        <p className="text-xs text-slate-500">{emp.designation || emp.department || 'Employee'}</p>
                        {emp.roleName && (
                          <span className="inline-block mt-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">{emp.roleName}</span>
                        )}
                        {!emp.isActive && <span className="inline-block mt-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full ml-1">Inactive</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <button onClick={() => openRatings(emp)} title="View ratings" className="p-1.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500"><Star size={14} /></button>
                      <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500"><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(emp._id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-1.5 text-sm text-slate-600 dark:text-slate-400">
                    <p>📧 {emp.email}</p>
                    <p>📱 {emp.phone || '-'}</p>
                    {emp.department && <p>🏢 {emp.department}</p>}
                    {emp.joiningDate && (
                      <p className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-primary-500 flex-shrink-0" />
                        Joined: {format(new Date(emp.joiningDate), 'dd MMM yyyy')}
                      </p>
                    )}
                    {emp.dob && (
                      <p className={`flex items-center gap-1.5 ${birthdayToday ? 'text-pink-600 dark:text-pink-400 font-medium' : ''}`}>
                        <Cake size={13} className={birthdayToday ? 'text-pink-500 flex-shrink-0' : 'text-slate-400 flex-shrink-0'} />
                        DOB: {format(new Date(emp.dob), 'dd MMM yyyy')}{birthdayToday && ' 🎉 Today!'}
                      </p>
                    )}
                    {emp.lastWorkingDay && (
                      <p className={`flex items-center gap-1.5 ${lwdPast ? 'text-red-500' : 'text-yellow-600 dark:text-yellow-400'}`}>
                        <UserX size={13} className="flex-shrink-0" />
                        LWD: {format(new Date(emp.lastWorkingDay.split('T')[0]), 'dd MMM yyyy')}{lwdPast ? ' (passed)' : ''}
                      </p>
                    )}
                  </div>
                  {emp.avgRating != null ? (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                      <StarDisplay value={Math.round(emp.avgRating)} size={13} />
                      <span className="text-xs font-semibold text-amber-600">{emp.avgRating.toFixed(1)}</span>
                      <span className="text-xs text-slate-400">({emp.ratingCount} review{emp.ratingCount !== 1 ? 's' : ''})</span>
                    </div>
                  ) : (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-xs text-slate-400 italic">No ratings yet</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingEmployee ? 'Edit Employee' : 'Add Employee'}>
          <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Full Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
              </div>
              <div className="col-span-2">
                <label className="label">Email *</label>
                <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" disabled={!!editingEmployee} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="text" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">{editingEmployee ? 'New Password' : 'Password *'}</label>
                <input type="password" required={!editingEmployee} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input" placeholder={editingEmployee ? 'Leave blank' : ''} />
              </div>
              <div>
                <label className="label">Department</label>
                <input type="text" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="input" />
              </div>
              <div>
                <label className="label">Designation</label>
                <input type="text" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="input" />
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Employment Details</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label flex items-center gap-1"><Calendar size={13} className="text-primary-500" /> Joining Date</label>
                  <input type="date" value={form.joiningDate} onChange={e => setForm({ ...form, joiningDate: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label flex items-center gap-1"><Cake size={13} className="text-pink-500" /> Date of Birth</label>
                  <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Employment Status</label>
                  <select value={form.employmentStatus} onChange={e => setForm({ ...form, employmentStatus: e.target.value })} className="input">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label flex items-center gap-1"><UserX size={13} className="text-red-400" /> Last Working Day</label>
                  <input type="date" value={form.lastWorkingDay} onChange={e => setForm({ ...form, lastWorkingDay: e.target.value })} className="input" />
                  {form.lastWorkingDay && form.employmentStatus !== 'active' && isPast(parseISO(form.lastWorkingDay)) && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <AlertTriangle size={11} /> Account auto-deactivates on save
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Role (Permissions)</label>
              <select value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className="input">
                <option value="">-- No specific role --</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">{editingEmployee ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>

        {/* Ratings Modal */}
        <Modal isOpen={!!ratingsData} onClose={() => setRatingsData(null)} title={ratingsData ? `${ratingsData.employee?.name} — Ratings` : ''}>
          {ratingsLoading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading ratings…</div>
          ) : ratingsData && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-5 py-4">
                <div className="text-center">
                  <p className="text-4xl font-bold text-amber-500">{ratingsData.average?.toFixed(1) ?? '—'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{ratingsData.total} review{ratingsData.total !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <StarDisplay value={Math.round(ratingsData.average || 0)} size={22} />
                  {[5, 4, 3, 2, 1].map(s => {
                    const count = ratingsData.ratings?.filter(r => r.rating === s).length || 0;
                    const pct = ratingsData.total > 0 ? Math.round((count / ratingsData.total) * 100) : 0;
                    return (
                      <div key={s} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-2">{s}</span>
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        <div className="w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {ratingsData.ratings?.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No reviews yet</p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {ratingsData.ratings.map(r => (
                    <div key={r._id} className="border border-slate-100 dark:border-slate-700 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <StarDisplay value={r.rating} size={13} />
                        <span className="text-xs text-slate-400">{r.ratedAt ? format(new Date(r.ratedAt), 'dd MMM yyyy') : ''}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{r.clientName} <span className="font-normal text-slate-400">• {r.serviceName}</span></p>
                      {r.feedback && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 italic">&ldquo;{r.feedback}&rdquo;</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
