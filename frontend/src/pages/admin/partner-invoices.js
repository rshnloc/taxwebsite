import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import { Plus, RefreshCw, Download, Send, CheckCircle, XCircle, Eye, CreditCard, FileText } from 'lucide-react';

const STATUS_COLORS = {
  auto_generated: 'bg-gray-100 text-gray-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  finalized: 'bg-blue-100 text-blue-700',
  sent: 'bg-purple-100 text-purple-700',
  paid: 'bg-green-100 text-green-700',
  partial: 'bg-orange-100 text-orange-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-200 text-gray-500',
};

const STATUS_LABELS = { auto_generated: 'Auto Generated', pending_review: 'Pending Review', finalized: 'Finalized', sent: 'Sent', paid: 'Paid', partial: 'Partial', overdue: 'Overdue', cancelled: 'Cancelled' };

export default function PartnerInvoicesAdmin() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', search: '', period: '' });
  const [modal, setModal] = useState(null); // 'review' | 'record' | 'auto' | 'detail' | 'create'
  const [selected, setSelected] = useState(null);
  const [autoForm, setAutoForm] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() === 0 ? 12 : new Date().getMonth() });
  const [reviewForm, setReviewForm] = useState({ items: [], gstPercent: 18, discount: 0, extraCharges: 0, extraChargesNote: '', adminNotes: '', paymentAccountId: '' });
  const [paymentForm, setPaymentForm] = useState({ amount: '', paymentDate: '', paymentMethod: 'bank_transfer', reference: '', notes: '' });
  const [accounts, setAccounts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const p = {};
      if (filters.status) p.status = filters.status;
      if (filters.search) p.search = filters.search;
      if (filters.period) p.period = filters.period;
      const d = await api.getPartnerInvoices(p);
      setInvoices(d.invoices || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [filters]);
  useEffect(() => { api.getPaymentAccounts().then(d => setAccounts(d.accounts || [])).catch(() => {}); }, []);

  const openReview = (inv) => {
    setSelected(inv);
    setReviewForm({
      items: (inv.items || []).map(i => ({ ...i })),
      gstPercent: inv.gstPercent || 18,
      discount: inv.discount || 0,
      extraCharges: inv.extraCharges || 0,
      extraChargesNote: inv.extraChargesNote || '',
      adminNotes: inv.adminNotes || '',
      paymentAccountId: inv.paymentAccount?.id || '',
    });
    setErr(''); setModal('review');
  };

  const openRecord = (inv) => {
    setSelected(inv);
    setPaymentForm({ amount: inv.balanceDue || '', paymentDate: new Date().toISOString().slice(0,10), paymentMethod: 'bank_transfer', reference: '', notes: '' });
    setErr(''); setModal('record');
  };

  const handleAutoGenerate = async () => {
    setBusy(true); setErr('');
    try {
      const r = await api.autoGeneratePartnerInvoices({ year: Number(autoForm.year), month: Number(autoForm.month) });
      alert(`Generated ${r.generated} invoice(s). Skipped ${r.skipped}.`);
      setModal(null); load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const handleReviewSave = async () => {
    setBusy(true); setErr('');
    try {
      await api.reviewPartnerInvoice(selected.id, reviewForm);
      setModal(null); load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const handleFinalize = async (id) => {
    if (!confirm('Finalize this invoice?')) return;
    try { await api.finalizePartnerInvoice(id); load(); } catch (e) { alert(e.message); }
  };

  const handleSend = async (id) => {
    if (!confirm('Send invoice to partner by email?')) return;
    try { await api.sendPartnerInvoice(id); load(); alert('Invoice sent!'); } catch (e) { alert(e.message); }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this invoice?')) return;
    try { await api.cancelPartnerInvoice(id); load(); } catch (e) { alert(e.message); }
  };

  const handleRecordPayment = async () => {
    setBusy(true); setErr('');
    try {
      await api.recordPartnerInvoicePayment(selected.id, paymentForm);
      setModal(null); load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  };

  const handlePDF = (id) => { api.downloadPartnerInvoicePDF(id).catch(e => alert(e.message)); };
  const handleCSV = () => {
    const p = {};
    if (filters.period) p.period = filters.period;
    api.exportPartnerInvoicesCSV(p).catch(e => alert(e.message));
  };

  const updateItem = (idx, field, val) => {
    setReviewForm(f => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: val };
      return { ...f, items };
    });
  };
  const addItem = () => setReviewForm(f => ({ ...f, items: [...f.items, { description: '', quantity: 1, rate: 0, amount: 0, itemType: 'service' }] }));
  const removeItem = (idx) => setReviewForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Partner Invoices</h1>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setErr(''); setModal('auto'); }} className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-indigo-700">
              <RefreshCw className="w-4 h-4" /> Auto-Generate
            </button>
            <button onClick={handleCSV} className="flex items-center gap-2 border px-3 py-2 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-white">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <input value={filters.search} onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} placeholder="Search partner…"
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">All Statuses</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <input type="month" value={filters.period} onChange={e => setFilters(f => ({ ...f, period: e.target.value }))}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <button onClick={() => setFilters({ status: '', search: '', period: '' })} className="text-sm text-gray-400 hover:text-gray-600">Clear</button>
        </div>

        {loading ? <p className="text-gray-500">Loading…</p> : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-xl shadow">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                <tr>
                  {['Invoice #','Partner','Period','Total','Paid','Balance','Status','Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {invoices.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No invoices found</td></tr>
                ) : invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800 dark:text-white">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{inv.partner?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{inv.billingPeriodStart?.slice(0,7)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800 dark:text-white">₹{Number(inv.total).toLocaleString()}</td>
                    <td className="px-4 py-3 text-green-600">₹{Number(inv.paidTotal || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-orange-600">₹{Number(inv.balanceDue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABELS[inv.status] || inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {['auto_generated','pending_review'].includes(inv.status) && (
                          <button onClick={() => openReview(inv)} className="text-xs text-blue-600 hover:underline">Review</button>
                        )}
                        {inv.status === 'pending_review' && (
                          <button onClick={() => handleFinalize(inv.id)} className="text-xs text-indigo-600 hover:underline">Finalize</button>
                        )}
                        {inv.status === 'finalized' && (
                          <button onClick={() => handleSend(inv.id)} className="flex items-center gap-1 text-xs text-purple-600 hover:underline"><Send className="w-3 h-3"/>Send</button>
                        )}
                        {['sent','partial','overdue'].includes(inv.status) && (
                          <button onClick={() => openRecord(inv)} className="flex items-center gap-1 text-xs text-green-600 hover:underline"><CreditCard className="w-3 h-3"/>Record Payment</button>
                        )}
                        <button onClick={() => handlePDF(inv.id)} className="flex items-center gap-1 text-xs text-gray-500 hover:underline"><FileText className="w-3 h-3"/>PDF</button>
                        {!['paid','cancelled'].includes(inv.status) && (
                          <button onClick={() => handleCancel(inv.id)} className="text-xs text-red-400 hover:underline">Cancel</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Auto-Generate Modal */}
      {modal === 'auto' && (
        <Modal title="Auto-Generate Invoices" onClose={() => setModal(null)}>
          <p className="text-sm text-gray-500 mb-4">Generate invoices for all partners based on completed service requests for the selected month.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <input type="number" value={autoForm.year} onChange={e => setAutoForm(f => ({ ...f, year: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
              <select value={autoForm.month} onChange={e => setAutoForm(f => ({ ...f, month: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
          </div>
          {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button onClick={handleAutoGenerate} disabled={busy} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-60">
              {busy ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </Modal>
      )}

      {/* Review Modal */}
      {modal === 'review' && selected && (
        <Modal title={`Review Invoice ${selected.invoiceNumber}`} onClose={() => setModal(null)} wide>
          <div className="space-y-4">
            {/* Payment Account */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Account</label>
              <select value={reviewForm.paymentAccountId} onChange={e => setReviewForm(f => ({ ...f, paymentAccountId: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="">— Select Account —</option>
                {accounts.map(a => <option key={a.id} value={a.id}>{a.label || a.type} {a.isDefault ? '(Default)' : ''}</option>)}
              </select>
            </div>
            {/* Items */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Line Items</label>
                <button onClick={addItem} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Plus className="w-3 h-3"/>Add Item</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500">
                    <tr>
                      <th className="px-2 py-1 text-left">Description</th>
                      <th className="px-2 py-1 text-left w-20">Type</th>
                      <th className="px-2 py-1 text-right w-16">Qty</th>
                      <th className="px-2 py-1 text-right w-20">Rate</th>
                      <th className="px-2 py-1 text-right w-20">Amount</th>
                      <th className="px-2 py-1 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviewForm.items.map((item, idx) => (
                      <tr key={idx} className="border-b dark:border-gray-700">
                        <td className="px-2 py-1"><input value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full border rounded px-1 py-0.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></td>
                        <td className="px-2 py-1">
                          <select value={item.itemType || 'service'} onChange={e => updateItem(idx, 'itemType', e.target.value)} className="w-full border rounded px-1 py-0.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xs">
                            <option value="service">Service</option>
                            <option value="deduction">Deduction</option>
                            <option value="extra">Extra</option>
                            <option value="pending">Pending</option>
                          </select>
                        </td>
                        <td className="px-2 py-1"><input type="number" value={item.quantity || 1} onChange={e => updateItem(idx, 'quantity', e.target.value)} className="w-full border rounded px-1 py-0.5 text-right dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></td>
                        <td className="px-2 py-1"><input type="number" value={item.rate || 0} onChange={e => updateItem(idx, 'rate', e.target.value)} className="w-full border rounded px-1 py-0.5 text-right dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></td>
                        <td className="px-2 py-1"><input type="number" value={item.amount || 0} onChange={e => updateItem(idx, 'amount', e.target.value)} className="w-full border rounded px-1 py-0.5 text-right dark:bg-gray-700 dark:border-gray-600 dark:text-white" /></td>
                        <td className="px-2 py-1"><button onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600">&times;</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Adjustments */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">GST %</label>
                <input type="number" value={reviewForm.gstPercent} onChange={e => setReviewForm(f => ({ ...f, gstPercent: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Discount (₹)</label>
                <input type="number" value={reviewForm.discount} onChange={e => setReviewForm(f => ({ ...f, discount: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Extra Charges (₹)</label>
                <input type="number" value={reviewForm.extraCharges} onChange={e => setReviewForm(f => ({ ...f, extraCharges: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Extra Charges Note</label>
                <input value={reviewForm.extraChargesNote} onChange={e => setReviewForm(f => ({ ...f, extraChargesNote: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Admin Notes</label>
              <textarea value={reviewForm.adminNotes} onChange={e => setReviewForm(f => ({ ...f, adminNotes: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            {err && <p className="text-red-500 text-sm">{err}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleReviewSave} disabled={busy} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {busy ? 'Saving…' : 'Save Review'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      {modal === 'record' && selected && (
        <Modal title={`Record Payment – ${selected.invoiceNumber}`} onClose={() => setModal(null)}>
          <p className="text-sm text-gray-500 mb-4">Balance Due: <strong>₹{Number(selected.balanceDue || 0).toLocaleString()}</strong></p>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount (₹)</label>
                <input type="number" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Payment Date</label>
                <input type="date" value={paymentForm.paymentDate} onChange={e => setPaymentForm(f => ({ ...f, paymentDate: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Method</label>
              <select value={paymentForm.paymentMethod} onChange={e => setPaymentForm(f => ({ ...f, paymentMethod: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                <option value="bank_transfer">Bank Transfer</option>
                <option value="upi">UPI</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Reference / UTR</label>
              <input value={paymentForm.reference} onChange={e => setPaymentForm(f => ({ ...f, reference: e.target.value }))} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Notes</label>
              <textarea value={paymentForm.notes} onChange={e => setPaymentForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full border rounded px-2 py-1.5 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            </div>
          </div>
          {err && <p className="text-red-500 text-sm mt-2">{err}</p>}
          <div className="flex justify-end gap-3 mt-4">
            <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
            <button onClick={handleRecordPayment} disabled={busy} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-60">
              {busy ? 'Recording…' : 'Record Payment'}
            </button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-2xl ${wide ? 'w-full max-w-3xl' : 'w-full max-w-lg'} max-h-[90vh] overflow-y-auto shadow-2xl`}>
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
