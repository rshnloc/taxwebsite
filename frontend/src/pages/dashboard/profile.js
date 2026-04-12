import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', companyName: user?.companyName || '',
    pan: user?.pan || '', gst: user?.gst || '',
    address: { street: user?.address?.street || '', city: user?.address?.city || '',
      state: user?.address?.state || '', pincode: user?.address?.pincode || '' }
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const key = name.split('.')[1];
      setForm(prev => ({ ...prev, address: { ...prev.address, [key]: value } }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = await api.updateProfile(form);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Personal Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input name="name" value={form.name} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input value={user?.email} disabled className="input bg-slate-50 dark:bg-slate-700 cursor-not-allowed" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input name="phone" value={form.phone} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Company Name</label>
                <input name="companyName" value={form.companyName} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">PAN Number</label>
                <input name="pan" value={form.pan} onChange={handleChange} className="input" placeholder="ABCDE1234F" />
              </div>
              <div>
                <label className="label">GST Number</label>
                <input name="gst" value={form.gst} onChange={handleChange} className="input" />
              </div>
            </div>
          </div>

          <div className="card space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Address</h2>
            <div>
              <label className="label">Street Address</label>
              <input name="address.street" value={form.address.street} onChange={handleChange} className="input" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">City</label>
                <input name="address.city" value={form.address.city} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">State</label>
                <input name="address.state" value={form.address.state} onChange={handleChange} className="input" />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input name="address.pincode" value={form.address.pincode} onChange={handleChange} className="input" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <span className="spinner w-5 h-5" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
