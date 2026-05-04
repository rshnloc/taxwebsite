import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Search, Eye, CheckCircle, XCircle, Clock, RefreshCw, FileText } from 'lucide-react';

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700',
  'under-review': 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function AdminPartnerRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedReq, setSelectedReq] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (filterStatus) params.status = filterStatus;
      const res = await api.getAllPartnerRequests(params);
      setRequests(res.requests || []);
      setTotal(res.total || 0);
    } catch {}
    setLoading(false);
  }, [search, filterStatus]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (req) => {
    setSelectedReq(req);
    setShowDetail(true);
  };

  const openStatus = (req) => {
    setStatusTarget(req);
    setNewStatus(req.status);
    setComments('');
    setShowStatusModal(true);
  };

  const saveStatus = async () => {
    setSaving(true);
    try {
      await api.updatePartnerRequestStatus(statusTarget.id, { status: newStatus, comments });
      setShowStatusModal(false);
      load();
      if (showDetail && selectedReq?.id === statusTarget.id) {
        setSelectedReq(r => ({ ...r, status: newStatus, adminComments: comments }));
      }
    } catch {}
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Partner Service Requests</h1>
            <p className="text-slate-500 text-sm">{total} total requests</p>
          </div>
          <button onClick={load} className="btn-outline flex items-center gap-2 text-sm">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9"
              placeholder="Search by reference, client, partner…" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-field w-auto">
            <option value="">All Statuses</option>
            {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? <PageLoading /> : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    {['Reference','Partner','Service','Client','Price','Status','Date','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-primary-600">{req.reference}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{req.partnerName || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{req.serviceName}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700 dark:text-slate-200">{req.clientName}</p>
                        <p className="text-xs text-slate-400">{req.clientEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">₹{Number(req.agreedPrice).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[req.status] || ''}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{new Date(req.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openDetail(req)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg" title="View">
                            <Eye size={15} />
                          </button>
                          <button onClick={() => openStatus(req)} className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg" title="Update Status">
                            <RefreshCw size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-slate-400">No requests found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && selectedReq && (
        <Modal isOpen={showDetail} title={`${selectedReq.reference} — Request Detail`} onClose={() => setShowDetail(false)} size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Reference', selectedReq.reference],
                ['Service', selectedReq.serviceName],
                ['Partner', selectedReq.partnerName],
                ['Agreed Price', `₹${Number(selectedReq.agreedPrice).toLocaleString('en-IN')}`],
                ['Client Name', selectedReq.clientName],
                ['Client Email', selectedReq.clientEmail],
                ['Client Phone', selectedReq.clientPhone || '—'],
                ['Status', selectedReq.status],
                ['Submitted', new Date(selectedReq.createdAt).toLocaleString('en-IN')],
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-400">{label}</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200 capitalize">{val}</p>
                </div>
              ))}
            </div>

            {selectedReq.dynamicData && Object.keys(selectedReq.dynamicData).length > 0 && (
              <div>
                <p className="font-medium text-slate-600 dark:text-slate-400 mb-2">Service Fields</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedReq.dynamicData).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                      <p className="text-xs text-slate-400 capitalize">{k.replace(/_/g,' ')}</p>
                      <p className="font-medium text-slate-700 dark:text-slate-200">{v || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReq.documents?.length > 0 && (
              <div>
                <p className="font-medium text-slate-600 dark:text-slate-400 mb-2">Documents</p>
                <div className="space-y-1">
                  {selectedReq.documents.map(doc => (
                    <div key={doc.id} className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <FileText size={14} className="text-slate-400 shrink-0" />
                      <span className="capitalize">{doc.fieldKey.replace(/_/g,' ')}</span>: {doc.originalName}
                      {doc.isPasswordProtected && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Password Protected</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedReq.adminComments && (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
                <p className="text-xs text-amber-600 font-medium mb-1">Admin Notes</p>
                <p className="text-slate-700 dark:text-slate-200">{selectedReq.adminComments}</p>
              </div>
            )}

            <button onClick={() => { setShowDetail(false); openStatus(selectedReq); }}
              className="btn-primary w-full">Update Status</button>
          </div>
        </Modal>
      )}

      {/* Status Modal */}
      {showStatusModal && statusTarget && (
        <Modal isOpen={showStatusModal} title={`Update Status — ${statusTarget.reference}`} onClose={() => setShowStatusModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">New Status</label>
              <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-field">
                {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Comments (optional)</label>
              <textarea rows={3} value={comments} onChange={e => setComments(e.target.value)} className="input-field resize-none" placeholder="Add a note for the partner…" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowStatusModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button onClick={saveStatus} disabled={saving} className="flex-1 btn-primary">
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
