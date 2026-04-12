import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Receipt, Plus, Download, Send, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
    items: [{ description: '', amount: 0 }],
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

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', amount: 0 }] });
  const removeItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });
  const updateItem = (idx, field, value) => {
    const items = [...form.items];
    items[idx][field] = field === 'amount' ? Number(value) : value;
    setForm({ ...form, items });
  };

  const subtotal = form.items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const gst = subtotal * 0.18;
  const total = subtotal + gst - (form.discount || 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createInvoice({
        client: form.client,
        application: form.application || undefined,
        items: form.items.filter(i => i.description && i.amount > 0),
        discount: form.discount,
        notes: form.notes
      });
      toast.success('Invoice created');
      setShowModal(false);
      fetchInvoices();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed');
    }
  };

  const downloadPDF = (id) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${id}/pdf`, '_blank');
  };

  const sendInvoice = async (id) => {
    try {
      await api.updateInvoice(id, { status: 'sent' });
      toast.success('Invoice sent');
      fetchInvoices();
    } catch (error) { toast.error('Failed'); }
  };

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
              setForm({ client: '', application: '', items: [{ description: '', amount: 0 }], discount: 0, notes: '' });
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
                    <tr key={inv._id}>
                      <td className="font-medium text-primary-600">{inv.invoiceNumber}</td>
                      <td className="text-sm">{inv.client?.name || '-'}</td>
                      <td className="text-sm">₹{inv.subtotal?.toLocaleString('en-IN') || '0'}</td>
                      <td className="text-sm">₹{inv.gst?.toLocaleString('en-IN') || '0'}</td>
                      <td className="font-semibold">₹{inv.total?.toLocaleString('en-IN') || '0'}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td className="text-sm text-slate-500">{format(new Date(inv.createdAt), 'dd MMM yyyy')}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => downloadPDF(inv._id)} className="text-primary-600 hover:text-primary-700" title="Download PDF">
                            <Download size={16} />
                          </button>
                          {inv.status === 'draft' && (
                            <button onClick={() => sendInvoice(inv._id)} className="text-green-600 hover:text-green-700" title="Send">
                              <Send size={16} />
                            </button>
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
                <label className="label">Client *</label>
                <select required value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} className="input">
                  <option value="">Select Client</option>
                  {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Application</label>
                <select value={form.application} onChange={e => setForm({ ...form, application: e.target.value })} className="input">
                  <option value="">None</option>
                  {applications.map(a => <option key={a._id} value={a._id}>{a.applicationId}</option>)}
                </select>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <label className="label">Items</label>
              {form.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="input flex-1" />
                  <input type="number" placeholder="Amount" value={item.amount || ''} onChange={e => updateItem(idx, 'amount', e.target.value)} className="input w-32" />
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-500 px-2">✕</button>
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
