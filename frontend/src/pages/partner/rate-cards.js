import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { CreditCard, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, IndianRupee } from 'lucide-react';

const STATUS_CONFIG = {
  rate_pending_approval: { label: 'Pending Your Response', color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400', needsAction: true },
  rate_approved:         { label: 'Approved', color: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400', needsAction: false },
  rate_rejected:         { label: 'Rejected', color: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400', needsAction: false },
};

export default function PartnerRateCards() {
  const { user } = useAuth();
  const [rateCards, setRateCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [responding, setResponding] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => { fetchRateCards(); }, []);

  const fetchRateCards = async () => {
    try {
      const data = await api.getRateCards();
      setRateCards(data.rateCards || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleRespond = async (id, action) => {
    try {
      await api.partnerRespondRateCard(id, { action, feedback });
      toast.success(`Rate card ${action === 'accept' ? 'accepted' : 'rejected'} successfully`);
      setResponding(null);
      setFeedback('');
      fetchRateCards();
    } catch (e) { toast.error(e.message); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const pending = rateCards.filter(r => r.status === 'rate_pending_approval');
  const others = rateCards.filter(r => r.status !== 'rate_pending_approval');

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard size={24} /> Rate Cards</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review and respond to your assigned rate cards</p>
        </div>

        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400 mb-3 flex items-center gap-2"><Clock size={16} /> Awaiting Your Response ({pending.length})</h2>
            <div className="space-y-3">
              {pending.map(rc => (
                <div key={rc.id} className="bg-white dark:bg-slate-800 rounded-xl border-2 border-yellow-300 dark:border-yellow-700 overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{rc.serviceName}</h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1"><IndianRupee size={14} /> Base Price: ₹{rc.basePrice?.toLocaleString('en-IN')}</span>
                          <span className="flex items-center gap-1 font-medium text-primary-600">Your Price: ₹{rc.partnerPrice?.toLocaleString('en-IN')}</span>
                          {rc.marginPercent && <span>Margin: {rc.marginPercent}%</span>}
                        </div>
                        {rc.notes && <p className="text-sm text-slate-500 mt-2">{rc.notes}</p>}
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span>Effective: {rc.effectiveDate}</span>
                          {rc.expiryDate && <span>Expires: {rc.expiryDate}</span>}
                        </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 shrink-0">Pending Response</span>
                    </div>

                    {responding === rc.id ? (
                      <div className="mt-4 space-y-3">
                        <textarea
                          rows={2}
                          placeholder="Optional: Add your feedback or comments..."
                          value={feedback}
                          onChange={e => setFeedback(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleRespond(rc.id, 'accept')} className="flex-1 btn-primary flex items-center justify-center gap-2 py-2 text-sm">
                            <CheckCircle size={16} /> Accept Rate Card
                          </button>
                          <button onClick={() => handleRespond(rc.id, 'reject')} className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2 text-sm font-medium hover:bg-red-100 flex items-center justify-center gap-2">
                            <XCircle size={16} /> Reject
                          </button>
                          <button onClick={() => { setResponding(null); setFeedback(''); }} className="btn-outline text-sm px-4">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setResponding(rc.id)} className="mt-3 btn-primary text-sm py-2 px-4">
                        Review & Respond
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {others.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">All Rate Cards</h2>
            <div className="space-y-2">
              {others.map(rc => {
                const cfg = STATUS_CONFIG[rc.status];
                const isOpen = expanded === rc.id;
                return (
                  <div key={rc.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <button onClick={() => setExpanded(isOpen ? null : rc.id)} className="w-full p-4 flex items-center justify-between text-left">
                      <div className="flex items-center gap-3">
                        <CreditCard size={18} className="text-slate-400 shrink-0" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{rc.serviceName}</p>
                          <p className="text-sm text-slate-500">Your Price: ₹{rc.partnerPrice?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${cfg?.color}`}>{cfg?.label}</span>
                        {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3 space-y-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          <span>Base Price: <strong className="text-slate-900 dark:text-white">₹{rc.basePrice?.toLocaleString('en-IN')}</strong></span>
                          <span>Partner Price: <strong className="text-slate-900 dark:text-white">₹{rc.partnerPrice?.toLocaleString('en-IN')}</strong></span>
                          {rc.marginPercent && <span>Margin: <strong className="text-slate-900 dark:text-white">{rc.marginPercent}%</strong></span>}
                          {rc.commission && <span>Commission: <strong className="text-slate-900 dark:text-white">₹{rc.commission}</strong></span>}
                          <span>Effective: <strong className="text-slate-900 dark:text-white">{rc.effectiveDate}</strong></span>
                          {rc.expiryDate && <span>Expires: <strong className="text-slate-900 dark:text-white">{rc.expiryDate}</strong></span>}
                        </div>
                        {rc.notes && <p className="text-slate-500">{rc.notes}</p>}
                        {rc.partnerFeedback && (
                          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 mt-2">
                            <p className="text-xs text-slate-500 mb-1">Your Feedback:</p>
                            <p>{rc.partnerFeedback}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {rateCards.length === 0 && (
          <div className="text-center py-16">
            <CreditCard size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="font-medium text-slate-900 dark:text-white">No rate cards yet</h3>
            <p className="text-sm text-slate-500 mt-1">Admin will assign rate cards to you once your application is approved.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
