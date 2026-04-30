import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Receipt, Plus, Download, Send, Search, ChevronLeft, ChevronRight, CheckCircle, Bell } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    client: '', application: '',
    items: [{ description: '', quantity: 1, rate: 0, amount: 0 }],
    discount: 0, notes: ''
  });

  useEffect(() => { fetchInvoices(); }, [page]);
  useEffect(() => { fetchClients(); fetchApplications(); }, []);

  const fetchInvoices = async () => {
    try {
      const data = await api.getInvoices({ page, limit: 15 });
      setInvoices(data.invoices || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const fetchClients = async () => {
    try {
      const data = await api.getUsers({ role: 'client' });
      setClients(data.users || []);
    } catch (error) { console.error(error); }
  };

  const fetchApplications = async () => {
    try {
      const data = await api.getApplications({ limit: 100 });
      setApplications(data.applications || []);
    } catch (error) { console.error(error); }
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, rate: 0, amount: 0 }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = ['amount', 'rate', 'quantity'].includes(field) ? Number(value) : value;
    if (field === 'rate' || field === 'quantity') {
      items[idx].amount = (items[idx].rate || 0) * (items[idx].quantity || 1);
    }
    setForm({ ...form, items });
  };

  const handleApplicationSelect = (appId) => {
    const app = applications.find(a => a._id === appId);
    const updates = { application: appId };
    if (app) {
      // Auto-fill client
      if (app.client?._id) updates.client = app.client._id;
      // Auto-fill first item with service name & price
      if (app.service?.name) {
        const price = app.payment?.total || app.service?.pricing?.totalPrice || app.service?.pricing?.basePrice || 0;
        updates.items = [{ description: app.service.name, quantity: 1, rate: price, amount: price }];
      }
    }
    setForm(f => ({ ...f, ...updates }));
  };

  const subtotal = form.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst - (form.discount || 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createInvoice({
        clientId: form.client,
        applicationId: form.application || undefined,
        items: form.items.filter(i => i.description && i.amount > 0).map(i => ({
          description: i.description,
          quantity: i.quantity || 1,
          rate: i.rate || i.amount,
          amount: i.amount
        })),
        discount: form.discount,
        notes: form.notes
      });
      toast.success('Invoice created');
      setShowModal(false);
      fetchInvoices();
    } catch (error) {
      toast.error(error.message || 'Failed to create invoice');
    }
  };

  const downloadPDF = (id) => {
    const token = localStorage.getItem('token');
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${id}/pdf?token=${token}`, '_blank');
  };

  const sendInvoice = async (id) => {
    try {
      await api.updateInvoice(id, { status: 'sent' });
      toast.success('Invoice sent');
      fetchInvoices();
    } catch (error) { toast.error('Failed'); }
  };

  const markPaid = async (id) => {
    if (!confirm('Mark this invoice as paid? A thank-you email will be sent to the client.')) return;
    try {
      await api.markInvoicePaid(id);
      toast.success('Invoice marked as paid');
      fetchInvoices();
    } catch (error) { toast.error(error.message || 'Failed to mark paid'); }
  };

  const sendReminder = async (id) => {
    try {
      await api.sendInvoiceReminder(id);
      toast.success('Payment reminder sent');
    } catch (error) { toast.error(error.message || 'Failed to send reminder'); }
  };

  const isOverdue = (inv) => inv.status !== 'paid' && inv.status !== 'draft' && inv.dueDate && new Date(inv.dueDate) < new Date();

  const filtered = invoices.filter(inv =>
    !search || inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) || inv.client?.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2 text-sm w-48" />
            </div>
            <button onClick={() => {
              setForm({ client: '', application: '', items: [{ description: '', quantity: 1, rate: 0, amount: 0 }], discount: 0, notes: '' });
              setShowModal(true);
            }} className="btn-primary btn-sm">
              <Plus size={16} className="mr-1" /> Create Invoice
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices found" />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Client</th>
                    <th>Amount</th>
                    <th>GST</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv._id} className={isOverdue(inv) ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                      <td className="font-medium text-primary-600">
                        {inv.invoiceNumber}
                        {isOverdue(inv) && <span className="ml-2 text-xs text-red-500 font-semibold">OVERDUE</span>}
                      </td>
                      <td className="text-sm">{inv.client?.name || '-'}</td>
                      <td className="text-sm">₹{inv.subtotal?.toLocaleString('en-IN') || '0'}</td>
                      <td className="text-sm">₹{inv.gstAmount?.toLocaleString('en-IN') || '0'}</td>
                      <td className="font-semibold">₹{inv.total?.toLocaleString('en-IN') || '0'}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td className="text-sm text-slate-500">{format(new Date(inv.createdAt), 'dd MMM yyyy')}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => downloadPDF(inv._id)} className="text-primary-600 hover:text-primary-700" title="Download PDF">
                            <Download size={16} />
                          </button>
                          {inv.status === 'draft' && (
                            <button onClick={() => sendInvoice(inv._id)} className="text-green-600 hover:text-green-700" title="Send Invoice">
                              <Send size={16} />
                            </button>
                          )}
                          {(inv.status === 'sent' || inv.status === 'overdue') && (
                            <>
                              <button onClick={() => markPaid(inv._id)} className="text-emerald-600 hover:text-emerald-700" title="Mark as Paid">
                                <CheckCircle size={16} />
                              </button>
                              <button onClick={() => sendReminder(inv._id)} className="text-amber-500 hover:text-amber-600" title="Send Payment Reminder">
                                <Bell size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm"><ChevronLeft size={16} /> Prev</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline btn-sm">Next <ChevronRight size={16} /></button>
              </div>
            </div>
          </>
        )}

        {/* Create Invoice Modal */}
        <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Invoice">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Application <span className="text-slate-400 font-normal">(auto-fills client & amount)</span></label>
                <SearchableSelect
                  value={form.application}
                  onChange={v => handleApplicationSelect(v)}
                  options={[{ value: '', label: 'None' }, ...applications.map(a => ({ value: a._id, label: a.applicationId + ' — ' + (a.client?.name || 'Unknown') + ' / ' + (a.service?.name || 'N/A') }))]}
                  placeholder="None"
                />
              </div>
              <div>
                <label className="label">Client *</label>
                <SearchableSelect
                  required
                  value={form.client}
                  onChange={v => setForm({ ...form, client: v })}
                  options={clients.map(c => ({ value: c._id, label: c.name + ' — ' + c.email }))}
                  placeholder="Select Client…"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <label className="label">Items</label>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2 items-center">
                  <input type="text" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="input flex-1" />
                  <input type="number" placeholder="Qty" value={item.quantity || 1} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="input w-16" min="1" />
                  <input type="number" placeholder="Rate ₹" value={item.rate || ''} onChange={e => updateItem(idx, 'rate', e.target.value)} className="input w-28" />
                  <span className="text-sm text-slate-500 w-20 text-right">₹{(item.amount || 0).toLocaleString('en-IN')}</span>
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 px-1">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-primary-600 text-sm font-medium">+ Add Item</button>
            </div>

            <div>
              <label className="label">Discount (₹)</label>
              <input type="number" value={form.discount || ''} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} className="input w-40" />
            </div>

            <div>
              <label className="label">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input h-16" />
            </div>

            {/* Summary */}
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-1 text-sm">
              <div className="flex justify-between"><span>Subtotal:</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between"><span>GST (18%):</span><span>₹{gst.toLocaleString('en-IN')}</span></div>
              {form.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount:</span><span>-₹{form.discount.toLocaleString('en-IN')}</span></div>}
              <hr className="dark:border-slate-600" />
              <div className="flex justify-between font-bold text-base"><span>Total:</span><span>₹{total.toLocaleString('en-IN')}</span></div>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button type="submit" className="btn-primary">Create Invoice</button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
