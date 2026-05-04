import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import api from '../../lib/api';
import { Plus, Pencil, Trash2, CheckCircle, Building2, QrCode, Star } from 'lucide-react';

const EMPTY = { type: 'bank', label: '', accountHolder: '', accountNumber: '', ifscCode: '', bankName: '', branch: '', upiId: '', isDefault: false, isActive: true };

export default function PaymentAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [editId, setEditId] = useState(null);
  const [qrFile, setQrFile] = useState(null);
  const [qrPreview, setQrPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try { const d = await api.getPaymentAccounts(); setAccounts(d.accounts || []); } catch {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setQrFile(null); setQrPreview(null); setError(''); setModal('add'); };
  const openEdit = (a) => {
    setForm({ type: a.type, label: a.label || '', accountHolder: a.accountHolder || '', accountNumber: a.accountNumber || '', ifscCode: a.ifscCode || '', bankName: a.bankName || '', branch: a.branch || '', upiId: a.upiId || '', isDefault: !!a.isDefault, isActive: !!a.isActive });
    setEditId(a.id); setQrFile(null); setQrPreview(a.qrCodeUrl || null); setError(''); setModal('edit');
  };

  const handleQr = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setQrFile(f);
    setQrPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (qrFile) fd.append('qr_code', qrFile);
      if (modal === 'add') await api.createPaymentAccount(fd);
      else await api.updatePaymentAccount(editId, fd);
      setModal(null); load();
    } catch (e) { setError(e.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment account?')) return;
    try { await api.deletePaymentAccount(id); load(); } catch (e) { alert(e.message); }
  };

  const handleSetDefault = async (id) => {
    try { await api.setDefaultPaymentAccount(id); load(); } catch (e) { alert(e.message); }
  };

  const banks = accounts.filter(a => a.type === 'bank');
  const upis = accounts.filter(a => a.type === 'upi');

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Accounts</h1>
          <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4" /> Add Account
          </button>
        </div>

        {loading ? <p className="text-gray-500">Loading…</p> : (
          <>
            <Section title="Bank Accounts" icon={<Building2 className="w-5 h-5" />} items={banks} onEdit={openEdit} onDelete={handleDelete} onDefault={handleSetDefault} />
            <Section title="UPI / QR Codes" icon={<QrCode className="w-5 h-5" />} items={upis} onEdit={openEdit} onDelete={handleDelete} onDefault={handleSetDefault} />
          </>
        )}
      </div>

      {modal && (
        <Modal title={modal === 'add' ? 'Add Payment Account' : 'Edit Payment Account'} onClose={() => setModal(null)}>
          <div className="space-y-4">
            <div className="flex gap-4">
              {['bank','upi'].map(t => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => setForm(f => ({ ...f, type: t }))} />
                  <span className="capitalize">{t === 'upi' ? 'UPI / QR' : 'Bank Account'}</span>
                </label>
              ))}
            </div>
            <Field label="Label / Nickname" value={form.label} onChange={v => setForm(f => ({ ...f, label: v }))} placeholder="e.g. HDFC Main Account" />
            {form.type === 'bank' ? (
              <>
                <Field label="Account Holder Name" value={form.accountHolder} onChange={v => setForm(f => ({ ...f, accountHolder: v }))} />
                <Field label="Account Number" value={form.accountNumber} onChange={v => setForm(f => ({ ...f, accountNumber: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="IFSC Code" value={form.ifscCode} onChange={v => setForm(f => ({ ...f, ifscCode: v }))} />
                  <Field label="Bank Name" value={form.bankName} onChange={v => setForm(f => ({ ...f, bankName: v }))} />
                </div>
                <Field label="Branch" value={form.branch} onChange={v => setForm(f => ({ ...f, branch: v }))} />
              </>
            ) : (
              <>
                <Field label="UPI ID" value={form.upiId} onChange={v => setForm(f => ({ ...f, upiId: v }))} placeholder="name@upi" />
                <Field label="Account Holder Name" value={form.accountHolder} onChange={v => setForm(f => ({ ...f, accountHolder: v }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">QR Code Image</label>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleQr} className="hidden" />
                  <button type="button" onClick={() => fileRef.current.click()} className="px-3 py-2 border rounded text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    {qrFile ? qrFile.name : 'Choose Image'}
                  </button>
                  {qrPreview && <img src={qrPreview} alt="QR Preview" className="mt-2 h-28 object-contain rounded border" />}
                </div>
              </>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.isDefault} onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
              Set as default for this type
            </label>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setModal(null)} className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}

function Section({ title, icon, items, onEdit, onDelete, onDefault }) {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        {icon}
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h2>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-400 text-sm italic">No {title.toLowerCase()} added yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map(a => (
            <div key={a.id} className={`border rounded-xl p-4 bg-white dark:bg-gray-800 ${a.isDefault ? 'border-blue-500' : 'border-gray-200 dark:border-gray-700'}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800 dark:text-white">{a.label || (a.type === 'upi' ? 'UPI Account' : 'Bank Account')}</p>
                  {a.type === 'bank' ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                      <p>{a.accountHolder}</p>
                      <p>A/C: {a.accountNumber}</p>
                      <p>IFSC: {a.ifscCode} · {a.bankName}</p>
                      {a.branch && <p>{a.branch}</p>}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
                      <p>{a.upiId}</p>
                      {a.accountHolder && <p>{a.accountHolder}</p>}
                      {a.qrCodeUrl && <img src={a.qrCodeUrl} alt="QR" className="h-16 mt-1 rounded border" />}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  {a.isDefault && <span className="flex items-center gap-1 text-xs text-blue-600 font-semibold"><Star className="w-3 h-3 fill-blue-600" />Default</span>}
                  {!a.isDefault && <button onClick={() => onDefault(a.id)} title="Set Default" className="text-gray-400 hover:text-blue-500"><Star className="w-4 h-4" /></button>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => onEdit(a)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline"><Pencil className="w-3 h-3" />Edit</button>
                <button onClick={() => onDelete(a.id)} className="flex items-center gap-1 text-xs text-red-500 hover:underline"><Trash2 className="w-3 h-3" />Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder = '' }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
    </div>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold dark:text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
