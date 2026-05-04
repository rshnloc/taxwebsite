import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { User, Building2, CreditCard, MapPin, Save, Pencil } from 'lucide-react';

export default function PartnerProfile() {
  const { user } = useAuth();
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.getMyPartnerProfile();
      setPartner(data.partner);
      setForm({
        name: data.partner.name || '',
        phone: data.partner.phone || '',
        firmName: data.partner.firmName || '',
        pan: data.partner.pan || '',
        gst: data.partner.gst || '',
        aadhaar: data.partner.aadhaar || '',
        city: data.partner.city || '',
        state: data.partner.state || '',
        about: data.partner.about || '',
      });
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMyPartnerProfile(form);
      toast.success('Profile updated');
      setEditing(false);
      fetchProfile();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const Field = ({ label, value, field, type = 'text' }) => (
    <div>
      <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</label>
      {editing ? (
        <input
          type={type}
          value={form[field] || ''}
          onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      ) : (
        <p className="text-slate-900 dark:text-white font-medium">{value || '—'}</p>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Profile</h1>
            <p className="text-slate-500 text-sm mt-1">Associates Partner Profile</p>
          </div>
          {editing ? (
            <div className="flex gap-2">
              <button onClick={() => setEditing(false)} className="btn-outline text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm flex items-center gap-2">
                <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-outline text-sm flex items-center gap-2">
              <Pencil size={16} /> Edit Profile
            </button>
          )}
        </div>

        {/* Personal Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><User size={18} /> Personal Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" value={partner?.name} field="name" />
            <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Email Address</label><p className="text-slate-900 dark:text-white font-medium">{partner?.email}</p></div>
            <Field label="Phone" value={partner?.phone} field="phone" />
            <div><label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Registered Date</label><p className="text-slate-900 dark:text-white font-medium">{partner?.registeredDate || '—'}</p></div>
          </div>
        </div>

        {/* Firm Details */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Building2 size={18} /> Firm Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Firm / Business Name" value={partner?.firmName} field="firmName" />
            <Field label="PAN Number" value={partner?.pan} field="pan" />
            <Field label="GST Number" value={partner?.gst} field="gst" />
            <Field label="Aadhaar Number" value={partner?.aadhaar} field="aadhaar" />
          </div>
        </div>

        {/* Address */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><MapPin size={18} /> Location</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="City" value={partner?.city} field="city" />
            <Field label="State" value={partner?.state} field="state" />
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">About</label>
            {editing ? (
              <textarea rows={3} value={form.about || ''} onChange={e => setForm(p => ({ ...p, about: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            ) : (
              <p className="text-slate-700 dark:text-slate-300">{partner?.about || '—'}</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
