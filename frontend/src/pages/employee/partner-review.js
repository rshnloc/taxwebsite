import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, Modal } from '../../components/ui';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Handshake, Clock, CheckCircle, AlertCircle, Eye } from 'lucide-react';

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  reviewed:       { label: 'Reviewed', color: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', icon: CheckCircle },
  approved:       { label: 'Approved', color: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected:       { label: 'Rejected', color: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle },
  needs_update:   { label: 'Needs Update', color: 'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle },
};

export default function PartnerReview() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchQueue(); }, []);

  const fetchQueue = async () => {
    try {
      const data = await api.getPartnerReviewQueue();
      setPartners(data.partners || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleMarkReviewed = async () => {
    setSaving(true);
    try {
      await api.updatePartnerStatus(selected.id, { status: 'reviewed', comments });
      toast.success('Partner marked as reviewed! Admin has been notified.');
      setShowModal(false);
      setComments('');
      fetchQueue();
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const pendingCount = partners.filter(p => p.partnerStatus === 'pending_review').length;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Handshake size={24} /> Partner Review Queue</h1>
          <p className="text-slate-500 text-sm mt-1">Partners assigned to you for review ({pendingCount} pending)</p>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-20">
            <Handshake size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="text-slate-900 dark:text-white font-medium">No partners assigned</p>
            <p className="text-sm text-slate-500 mt-1">Partners assigned to you for review will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partners.map(p => {
              const cfg = STATUS_CONFIG[p.partnerStatus] || STATUS_CONFIG.pending_review;
              const Icon = cfg.icon;
              const isPending = p.partnerStatus === 'pending_review';
              return (
                <div key={p.id} className={`bg-white dark:bg-slate-800 rounded-2xl border ${isPending ? 'border-yellow-300 dark:border-yellow-700' : 'border-slate-200 dark:border-slate-700'} p-5`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-lg font-bold text-primary-600 dark:text-primary-400">
                        {p.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{p.name}</h3>
                        <p className="text-sm text-slate-500">{p.email}</p>
                        {p.firmName && <p className="text-sm text-slate-600 dark:text-slate-400">{p.firmName}</p>}
                        <p className="text-xs text-slate-400 mt-1">Applied: {p.registeredDate || p.createdAt?.split('T')[0]}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}>
                        <Icon size={12} /> {cfg.label}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    {[['City', p.city], ['State', p.state], ['PAN', p.pan], ['GST', p.gst]].map(([k, v]) => v ? (
                      <div key={k}><span className="text-slate-400 text-xs">{k}</span><br /><span className="text-slate-700 dark:text-slate-300">{v}</span></div>
                    ) : null)}
                  </div>

                  {p.about && (
                    <div className="mt-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-500">About</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{p.about}</p>
                    </div>
                  )}

                  {isPending && (
                    <div className="mt-4">
                      <button onClick={() => { setSelected(p); setShowModal(true); }} className="btn-primary text-sm flex items-center gap-2">
                        <CheckCircle size={16} /> Mark as Reviewed
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review Confirm Modal */}
      {showModal && selected && (
        <Modal title={`Mark "${selected.name}" as Reviewed`} onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Marking this partner as reviewed will notify the admin team that this application is ready for final approval.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Review Comments (optional)</label>
              <textarea rows={3} value={comments} onChange={e => setComments(e.target.value)} placeholder="Add any notes for the admin..." className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button onClick={handleMarkReviewed} disabled={saving} className="flex-1 btn-primary flex items-center justify-center gap-2">
                <CheckCircle size={16} /> {saving ? 'Submitting...' : 'Confirm Review'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
