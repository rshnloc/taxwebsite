import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import { Download, Eye, CreditCard, FileText } from 'lucide-react';

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

export default function PartnerInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('');
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const p = period ? { period } : {};
      const d = await api.getPartnerInvoices(p);
      setInvoices(d.invoices || []);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [period]);

  const openDetail = async (inv) => {
    try {
      const d = await api.getPartnerInvoiceById(inv.id);
      setSelected(d.invoice);
    } catch (e) { alert(e.message); }
  };

  const handlePDF = (id) => { api.downloadPartnerInvoicePDF(id).catch(e => alert(e.message)); };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Invoices</h1>
          <input type="month" value={period} onChange={e => setPeriod(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        </div>

        {loading ? <p className="text-gray-500">Loading…</p> : (
          <div className="space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No invoices found.</div>
            ) : invoices.map(inv => (
              <div key={inv.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                <div className="flex justify-between items-start flex-wrap gap-3">
                  <div>
                    <p className="font-mono font-bold text-gray-800 dark:text-white text-lg">{inv.invoiceNumber}</p>
                    <p className="text-sm text-gray-500 mt-0.5">Period: {inv.billingPeriodStart?.slice(0,7)}</p>
                    {inv.dueDate && <p className="text-sm text-gray-500">Due: {inv.dueDate}</p>}
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status] || 'bg-gray-100'}`}>
                      {STATUS_LABELS[inv.status] || inv.status}
                    </span>
                    <p className="text-xl font-bold text-gray-800 dark:text-white mt-2">₹{Number(inv.total).toLocaleString()}</p>
                    {Number(inv.balanceDue) > 0 && (
                      <p className="text-sm text-orange-500">Balance: ₹{Number(inv.balanceDue).toLocaleString()}</p>
                    )}
                    {inv.status === 'paid' && <p className="text-sm text-green-500 font-semibold">✓ Fully Paid</p>}
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => openDetail(inv)} className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <Eye className="w-4 h-4" /> View Details
                  </button>
                  <button onClick={() => handlePDF(inv.id)} className="flex items-center gap-1 text-sm text-gray-500 hover:underline">
                    <Download className="w-4 h-4" /> Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white">Invoice {selected.invoiceNumber}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><p className="text-gray-500">Period</p><p className="font-medium dark:text-white">{selected.billingPeriodStart?.slice(0,7)}</p></div>
                <div><p className="text-gray-500">Status</p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>{STATUS_LABELS[selected.status]}</span></div>
                <div><p className="text-gray-500">Total</p><p className="font-bold text-gray-800 dark:text-white text-lg">₹{Number(selected.total).toLocaleString()}</p></div>
                <div><p className="text-gray-500">Balance Due</p><p className={`font-bold text-lg ${Number(selected.balanceDue) > 0 ? 'text-orange-500' : 'text-green-500'}`}>₹{Number(selected.balanceDue || 0).toLocaleString()}</p></div>
                {selected.dueDate && <div><p className="text-gray-500">Due Date</p><p className="dark:text-white">{selected.dueDate}</p></div>}
              </div>

              {/* Items */}
              {selected.items?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Line Items</h3>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Description</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {selected.items.map((item, i) => (
                        <tr key={i} className={item.itemType === 'deduction' ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}>
                          <td className="px-3 py-2">{item.description}{item.itemType === 'deduction' ? ' (Deduction)' : ''}</td>
                          <td className="px-3 py-2 text-right">{item.itemType === 'deduction' ? '-' : ''}₹{Number(item.amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="mt-2 text-sm space-y-1 text-gray-600 dark:text-gray-400 text-right">
                    <p>Subtotal: ₹{Number(selected.subtotal || 0).toLocaleString()}</p>
                    {Number(selected.gstAmount) > 0 && <p>GST ({selected.gstPercent}%): ₹{Number(selected.gstAmount).toLocaleString()}</p>}
                    {Number(selected.discount) > 0 && <p className="text-green-600">Discount: -₹{Number(selected.discount).toLocaleString()}</p>}
                    {Number(selected.extraCharges) > 0 && <p>Extra ({selected.extraChargesNote}): ₹{Number(selected.extraCharges).toLocaleString()}</p>}
                    <p className="font-bold text-gray-800 dark:text-white text-base">Total: ₹{Number(selected.total).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Payment Account */}
              {selected.paymentAccount && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2"><CreditCard className="w-4 h-4"/>Payment Details</h3>
                  {selected.paymentAccount.type === 'bank' ? (
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
                      <p><strong>Account Holder:</strong> {selected.paymentAccount.accountHolder}</p>
                      <p><strong>Account Number:</strong> {selected.paymentAccount.accountNumber}</p>
                      <p><strong>IFSC:</strong> {selected.paymentAccount.ifscCode}</p>
                      <p><strong>Bank:</strong> {selected.paymentAccount.bankName} {selected.paymentAccount.branch ? `– ${selected.paymentAccount.branch}` : ''}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <p><strong>UPI ID:</strong> {selected.paymentAccount.upiId}</p>
                      {selected.paymentAccount.qrCodeUrl && <img src={selected.paymentAccount.qrCodeUrl} alt="QR Code" className="h-28 rounded border mt-2" />}
                    </div>
                  )}
                </div>
              )}

              {/* Payment History */}
              {selected.paymentHistory?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Payment History</h3>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Method</th>
                        <th className="px-3 py-2 text-left">Reference</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                      {selected.paymentHistory.map((p, i) => (
                        <tr key={i} className="text-gray-700 dark:text-gray-300">
                          <td className="px-3 py-2">{p.paymentDate}</td>
                          <td className="px-3 py-2 capitalize">{p.paymentMethod?.replace('_', ' ')}</td>
                          <td className="px-3 py-2">{p.reference || '—'}</td>
                          <td className="px-3 py-2 text-right text-green-600 font-semibold">₹{Number(p.amount).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                <button onClick={() => api.downloadPartnerInvoicePDF(selected.id).catch(e => alert(e.message))} className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <Download className="w-4 h-4"/>Download PDF
                </button>
                <button onClick={() => setSelected(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
