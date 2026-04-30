import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '', phone: user?.phone || '', companyName: user?.companyName || '',
    pan: user?.pan || '', gst: user?.gst || '',
    address: { street: user?.address?.street || '', city: user?.address?.city || '',
      state: user?.address?.state || '', pincode: user?.address?.pincode || '' }
  });
  const [saving, setSaving] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

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

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) return toast.error('New passwords do not match');
    if (pwForm.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setSavingPw(true);
    try {
      await api.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed successfully!');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSavingPw(false);
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

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="space-y-4 card">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock size={18} /> Change Password
          </h2>
          {[
            { key: 'currentPassword', label: 'Current Password', placeholder: 'Enter current password' },
            { key: 'newPassword', label: 'New Password', placeholder: 'Min 8 characters' },
            { key: 'confirmPassword', label: 'Confirm New Password', placeholder: 'Repeat new password' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw[key === 'currentPassword' ? 'current' : key === 'newPassword' ? 'new' : 'confirm'] ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={e => setPwForm(p => ({ ...p, [key]: e.target.value }))}
                  className="input pl-10 pr-10"
                  placeholder={placeholder}
                  required
                />
                <button type="button"
                  onClick={() => setShowPw(p => ({ ...p, [key === 'currentPassword' ? 'current' : key === 'newPassword' ? 'new' : 'confirm']: !p[key === 'currentPassword' ? 'current' : key === 'newPassword' ? 'new' : 'confirm'] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw[key === 'currentPassword' ? 'current' : key === 'newPassword' ? 'new' : 'confirm'] ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          ))}
          <button type="submit" disabled={savingPw} className="btn-primary">
            {savingPw ? <span className="spinner w-5 h-5" /> : 'Change Password'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
