import { useState, useRef } from 'react';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { User, Lock, Camera, Eye, EyeOff, Save, Phone } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const avatarRef = useRef(null);

  /* ── Profile form ── */
  const [profile, setProfile] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    altPhone: user?.altPhone || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  /* ── Avatar ── */
  const [avatarPreview, setAvatarPreview] = useState(
    user?.avatar ? `${API_URL}/api/${user.avatar}` : null
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  /* ── Password form ── */
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw] = useState(false);

  /* ── Tab ── */
  const [tab, setTab] = useState('profile');

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error('Image must be under 3MB'); return; }
    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const data = await api.uploadAvatar(fd);
      updateUser(data.user);
      toast.success('Profile photo updated!');
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setAvatarPreview(user?.avatar ? `${API_URL}/api/${user.avatar}` : null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile.name.trim()) return toast.error('Name is required');
    setSavingProfile(true);
    try {
      const data = await api.updateProfile(profile);
      updateUser(data.user);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirmPassword) return toast.error('New passwords do not match');
    if (pw.newPassword.length < 8) return toast.error('Password must be at least 8 characters');
    setSavingPw(true);
    try {
      await api.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword, confirmPassword: pw.confirmPassword });
      toast.success('Password changed successfully!');
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to change password');
    } finally {
      setSavingPw(false);
    }
  };

  const TABS = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'password', label: 'Password', icon: Lock },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Account Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your profile, photo, and security settings.</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}>
              <Icon size={15} />{label}
            </button>
          ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div className="card p-6 space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center ring-4 ring-white dark:ring-slate-800 shadow-md">
                  {avatarPreview
                    ? <img src={avatarPreview} alt={user?.name} className="w-full h-full object-cover" />
                    : <span className="text-3xl font-bold text-primary-600">{user?.name?.charAt(0)}</span>
                  }
                </div>
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary-500 hover:bg-primary-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors disabled:opacity-60"
                >
                  <Camera size={13} />
                </button>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <p className="text-xs text-slate-400 mt-1 capitalize">{user?.role}</p>
                <button
                  type="button"
                  onClick={() => avatarRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="text-xs text-primary-600 hover:underline mt-1 disabled:opacity-60"
                >
                  {uploadingAvatar ? 'Uploading…' : 'Change photo'}
                </button>
              </div>
            </div>

            {/* Profile form */}
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input
                  type="text"
                  required
                  value={profile.name}
                  onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                  className="input"
                  placeholder="Your full name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Phone Number</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      className="input pl-9"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div>
                  <label className="label">Alternate Contact</label>
                  <div className="relative">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="tel"
                      value={profile.altPhone}
                      onChange={e => setProfile(p => ({ ...p, altPhone: e.target.value }))}
                      className="input pl-9"
                      placeholder="Alternate number"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-400 mb-3">
                  Email address cannot be changed. Contact support if needed.
                </p>
                <div className="flex justify-end">
                  <button type="submit" disabled={savingProfile} className="btn-primary flex items-center gap-2">
                    <Save size={15} />
                    {savingProfile ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── PASSWORD TAB ── */}
        {tab === 'password' && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {[
                { key: 'currentPassword', label: 'Current Password', show: showPw.current, toggle: () => setShowPw(p => ({ ...p, current: !p.current })) },
                { key: 'newPassword', label: 'New Password', show: showPw.new, toggle: () => setShowPw(p => ({ ...p, new: !p.new })) },
                { key: 'confirmPassword', label: 'Confirm New Password', show: showPw.confirm, toggle: () => setShowPw(p => ({ ...p, confirm: !p.confirm })) },
              ].map(({ key, label, show, toggle }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      required
                      value={pw[key]}
                      onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                      className="input pr-10"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={toggle}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-xs text-slate-500 space-y-1">
                <p className="font-medium text-slate-600 dark:text-slate-400">Password requirements:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li className={pw.newPassword.length >= 8 ? 'text-green-600' : ''}>At least 8 characters</li>
                  <li className={/[A-Z]/.test(pw.newPassword) ? 'text-green-600' : ''}>One uppercase letter</li>
                  <li className={/[0-9]/.test(pw.newPassword) ? 'text-green-600' : ''}>One number</li>
                </ul>
              </div>

              <div className="flex justify-end pt-1">
                <button type="submit" disabled={savingPw} className="btn-primary flex items-center gap-2">
                  <Lock size={15} />
                  {savingPw ? 'Changing…' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
