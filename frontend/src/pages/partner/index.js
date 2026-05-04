import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { CheckCircle, Clock, AlertCircle, XCircle, RefreshCw, CreditCard, Handshake, TrendingUp, FileText } from 'lucide-react';

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  reviewed:       { label: 'Reviewed', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', icon: RefreshCw },
  approved:       { label: 'Approved', color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected:       { label: 'Rejected', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  needs_update:   { label: 'Needs Update', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle },
};

const RATE_STATUS_CONFIG = {
  rate_pending_approval: { label: 'Pending', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
  rate_approved:         { label: 'Approved', color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
  rate_rejected:         { label: 'Rejected', color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
};

export default function PartnerDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [partner, setPartner] = useState(null);
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== 'partner') { router.replace('/dashboard'); return; }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const [p, rc] = await Promise.all([api.getMyPartnerProfile(), api.getRateCards()]);
      setPartner(p.partner);
      setRateCards(rc.rateCards || []);
    } catch (e) { toast.error(e.message || 'Failed to load data'); }
    finally { setLoading(false); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const status = partner?.partnerStatus || 'pending_review';
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending_review;
  const StatusIcon = cfg.icon;
  const approvedCards = rateCards.filter(r => r.status === 'rate_approved');
  const pendingCards = rateCards.filter(r => r.status === 'rate_pending_approval');
  const canApply = status === 'approved' && approvedCards.length > 0;

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {partner?.name || user?.name}! 👋</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Associates Partner Dashboard</p>
        </div>

        {/* Application Status Banner */}
        <div className={`rounded-2xl p-6 border ${status === 'approved' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : status === 'rejected' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : status === 'needs_update' ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'}`}>
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status === 'approved' ? 'bg-green-100 dark:bg-green-900/40' : status === 'rejected' ? 'bg-red-100 dark:bg-red-900/40' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
              <StatusIcon size={24} className={status === 'approved' ? 'text-green-600' : status === 'rejected' ? 'text-red-600' : status === 'needs_update' ? 'text-orange-600' : 'text-blue-600'} />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-slate-900 dark:text-white text-lg">Application Status</h2>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium mt-1 ${cfg.color}`}>
                <StatusIcon size={14} /> {cfg.label}
              </span>
              {status === 'pending_review' && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Your application is under review. We will notify you once it is processed.</p>}
              {status === 'reviewed' && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Your application has been reviewed by our team and is awaiting final admin approval.</p>}
              {status === 'approved' && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Congratulations! Your application is approved. You can now refer clients.</p>}
              {status === 'rejected' && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Your application was not approved. Please contact support for more information.</p>}
              {status === 'needs_update' && <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">Our team needs additional information. Please update your profile and resubmit.</p>}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Rate Cards', value: rateCards.length, icon: CreditCard, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
            { label: 'Approved Rate Cards', value: approvedCards.length, icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
            { label: 'Pending Response', value: pendingCards.length, icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Can Apply Notice */}
        {canApply && (
          <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-4">
              <Handshake size={32} className="opacity-90" />
              <div className="flex-1">
                <h3 className="font-bold text-lg">You are ready to refer clients! 🚀</h3>
                <p className="text-white/80 text-sm mt-0.5">Your account is approved and has active rate cards. Start referring clients to earn commissions.</p>
              </div>
            </div>
          </div>
        )}

        {/* Rate Cards Preview */}
        {rateCards.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard size={18} /> Rate Cards</h3>
              <button onClick={() => router.push('/partner/rate-cards')} className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All →</button>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {rateCards.slice(0, 5).map(rc => {
                const rCfg = RATE_STATUS_CONFIG[rc.status] || RATE_STATUS_CONFIG.rate_pending_approval;
                return (
                  <div key={rc.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{rc.serviceName}</p>
                      <p className="text-sm text-slate-500">Your Price: ₹{rc.partnerPrice?.toLocaleString('en-IN')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${rCfg.color}`}>{rCfg.label}</span>
                      {rc.status === 'rate_pending_approval' && (
                        <button onClick={() => router.push('/partner/rate-cards')} className="text-xs btn-outline py-1 px-3">Respond</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rateCards.length === 0 && status === 'approved' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
            <CreditCard size={40} className="mx-auto text-slate-400 mb-3" />
            <h3 className="font-medium text-slate-900 dark:text-white">No Rate Cards Yet</h3>
            <p className="text-sm text-slate-500 mt-1">Our admin team will create rate cards for you shortly. You will be notified by email.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
