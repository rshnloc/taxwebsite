import { useState, useEffect } from 'react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState, Modal } from '../../../components/ui';
import api from '../../../lib/api';
import { FileText, Search, Filter, UserPlus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import SearchableSelect from '../../../components/SearchableSelect';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['all', 'submitted', 'under-review', 'in-progress', 'pending-documents', 'completed', 'rejected', 'cancelled'];

export default function AdminApplications() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [statusModalNew, setStatusModalNew] = useState('');
  const [statusRemark, setStatusRemark] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [invoiceStep, setInvoiceStep] = useState(false); // show invoice prompt after completing
  const [invoiceForm, setInvoiceForm] = useState({ amount: '', dueDate: '', notes: '' });
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  useEffect(() => { fetchApplications(); }, [statusFilter, page]);
  useEffect(() => { fetchEmployees(); }, []);

  const fetchApplications = async () => {
    try {
      const params = { page, limit: 15 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const data = await api.getApplications(params);
      setApplications(data.applications);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const data = await api.getUsers({ role: 'employee' });
      setEmployees(data.users || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAssign = async () => {
    if (!selectedEmployee || !selectedApp) return;
    try {
      await api.updateApplication(selectedApp._id, { assignedEmployee: selectedEmployee });
      toast.success('Employee assigned successfully');
      setShowAssignModal(false);
      setSelectedApp(null);
      setSelectedEmployee('');
      fetchApplications();
    } catch (error) {
      toast.error('Failed to assign employee');
    }
  };

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await api.updateApplicationStatus(appId, { status: newStatus, message: statusRemark || `Status updated to ${newStatus}` });
      toast.success('Status updated');
      setStatusRemark('');
      if (newStatus === 'completed') {
        setInvoiceStep(true); // stay open, show invoice prompt
      } else {
        setShowStatusModal(false);
        fetchApplications();
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally { setUpdatingStatus(false); }
  };

  const openStatusModal = (app) => {
    setStatusModalApp(app);
    setStatusModalNew(app.status);
    setStatusRemark('');
    setInvoiceStep(false);
    setInvoiceForm({ amount: app.payment?.total || '', dueDate: '', notes: '' });
    setShowStatusModal(true);
  };

  const handleCreateInvoice = async () => {
    if (!statusModalApp) return;
    setCreatingInvoice(true);
    try {
      const amount = parseFloat(invoiceForm.amount) || 0;
      await api.createInvoice({
        applicationId: statusModalApp._id,
        clientId: statusModalApp.client?._id,
        items: [{ description: statusModalApp.service?.name || 'Service', quantity: 1, rate: amount, amount }],
        dueDate: invoiceForm.dueDate || null,
        notes: invoiceForm.notes || null,
        gstPercent: 18,
        discount: 0,
      });
      toast.success('Invoice created successfully!');
    } catch (e) {
      toast.error('Failed to create invoice');
    } finally {
      setCreatingInvoice(false);
      setInvoiceStep(false);
      setShowStatusModal(false);
      fetchApplications();
    }
  };

  const filtered = applications.filter(app =>
    !search || app.applicationId?.toLowerCase().includes(search.toLowerCase()) ||
    app.client?.name?.toLowerCase().includes(search.toLowerCase()) ||
    app.service?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Applications</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 py-2 text-sm w-60"
              />
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                statusFilter === s
                  ? 'bg-primary-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {s === 'all' ? 'All' : s.replace('-', ' ')}
            </button>
          ))}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <EmptyState icon={FileText} title="No applications found" />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Application ID</th>
                    <th>Client</th>
                    <th>Service</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(app => (
                    <tr key={app._id}>
                      <td className="font-medium text-primary-600 cursor-pointer" onClick={() => router.push(`/admin/applications/${app._id}`)}>
                        {app.applicationId}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-sm">{app.client?.name || '-'}</p>
                          <p className="text-xs text-slate-500">{app.client?.email}</p>
                        </div>
                      </td>
                      <td className="text-sm">{app.service?.name || '-'}</td>
                      <td>
                        <button
                          onClick={() => openStatusModal(app)}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50"
                        >
                          {app.status?.replace(/-/g, ' ')} ✏️
                        </button>
                      </td>
                      <td>
                        {app.assignedEmployee ? (
                          <span className="text-sm text-slate-700 dark:text-slate-300">{app.assignedEmployee.name}</span>
                        ) : (
                          <button
                            onClick={() => { setSelectedApp(app); setShowAssignModal(true); }}
                            className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                          >
                            <UserPlus size={14} /> Assign
                          </button>
                        )}
                      </td>
                      <td className="text-sm text-slate-500">{format(new Date(app.createdAt), 'dd MMM yyyy')}</td>
                      <td className="font-semibold text-sm">₹{app.payment?.total?.toLocaleString('en-IN') || '0'}</td>
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

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm">
                  <ChevronLeft size={16} /> Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline btn-sm">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Assign Employee Modal */}
        <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Employee">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Assign an employee to application <strong>{selectedApp?.applicationId}</strong>
            </p>
            <SearchableSelect
              value={selectedEmployee}
              onChange={v => setSelectedEmployee(v)}
              options={employees.map(emp => ({ value: emp._id, label: emp.name + ' — ' + (emp.designation || emp.department || 'Employee') }))}
              placeholder="Select Employee…"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowAssignModal(false)} className="btn-outline">Cancel</button>
              <button onClick={handleAssign} disabled={!selectedEmployee} className="btn-primary">Assign</button>
            </div>
          </div>
        </Modal>

        {/* Status Change Modal */}
        <Modal isOpen={showStatusModal} onClose={() => { setShowStatusModal(false); setInvoiceStep(false); fetchApplications(); }} title={invoiceStep ? 'Create Invoice' : 'Update Status'}>
          {!invoiceStep ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Application: <strong className="text-slate-800 dark:text-white">{statusModalApp?.applicationId}</strong> — {statusModalApp?.client?.name}</p>
              <div>
                <label className="label">New Status</label>
                <select
                  value={statusModalNew}
                  onChange={e => setStatusModalNew(e.target.value)}
                  className="input capitalize"
                >
                  {STATUS_OPTIONS.filter(s => s !== 'all').map(s => (
                    <option key={s} value={s}>{s.replace(/-/g, ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Remarks / Notes <span className="text-slate-400 font-normal">(optional, sent to client)</span></label>
                <textarea
                  value={statusRemark}
                  onChange={e => setStatusRemark(e.target.value)}
                  placeholder="Add a remark for the client about this status change..."
                  className="input h-24 resize-none"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowStatusModal(false)} className="btn-outline">Cancel</button>
                <button
                  onClick={() => { setUpdatingStatus(true); handleStatusChange(statusModalApp._id, statusModalNew); }}
                  disabled={updatingStatus}
                  className="btn-primary"
                >
                  {updatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="text-green-600 text-xl">✅</span>
                <div>
                  <p className="font-medium text-green-800 dark:text-green-300 text-sm">Application marked as completed!</p>
                  <p className="text-green-700 dark:text-green-400 text-xs">Would you like to create an invoice for <strong>{statusModalApp?.client?.name}</strong>?</p>
                </div>
              </div>
              <div>
                <label className="label">Amount (₹) *</label>
                <input
                  type="number"
                  value={invoiceForm.amount}
                  onChange={e => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                  className="input"
                  placeholder="Enter invoice amount"
                  min="0"
                />
              </div>
              <div>
                <label className="label">Due Date</label>
                <input
                  type="date"
                  value={invoiceForm.dueDate}
                  onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Notes</label>
                <input
                  type="text"
                  value={invoiceForm.notes}
                  onChange={e => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="input"
                  placeholder="Optional notes on the invoice"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button onClick={() => { setInvoiceStep(false); setShowStatusModal(false); fetchApplications(); }} className="btn-outline">Skip</button>
                <button
                  onClick={handleCreateInvoice}
                  disabled={creatingInvoice || !invoiceForm.amount}
                  className="btn-primary"
                >
                  {creatingInvoice ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
