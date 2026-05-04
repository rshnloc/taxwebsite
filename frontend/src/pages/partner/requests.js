import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Eye, FileText, PlusCircle } from 'lucide-react';
import Link from 'next/link';

const STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-700',
  'under-review': 'bg-yellow-100 text-yellow-700',
  'in-progress': 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

export default function PartnerRequests() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedReq, setSelectedReq] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getMyPartnerServiceRequests();
        setRequests(res.requests || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Service Requests</h1>
            <p className="text-slate-500 text-sm">{requests.length} request{requests.length !== 1 ? 's' : ''} submitted</p>
          </div>
          <Link href="/partner/apply" className="btn-primary flex items-center gap-2">
            <PlusCircle size={16} /> New Request
          </Link>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <FileText className="mx-auto text-slate-300 mb-3" size={48} />
            <p className="font-medium text-slate-600 dark:text-slate-300">No requests yet</p>
            <p className="text-sm text-slate-400 mb-5">Submit your first service request to get started</p>
            <Link href="/partner/apply" className="btn-primary">Submit Service Request</Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                    {['Reference','Service','Client','Price','Status','Submitted',''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {requests.map(req => (
                    <tr key={req.id} className="border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-primary-600">{req.reference}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{req.serviceName}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700 dark:text-slate-200">{req.clientName}</p>
                        <p className="text-xs text-slate-400">{req.clientEmail}</p>
                      </td>
                      <td className="px-4 py-3 font-semibold">₹{Number(req.agreedPrice).toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[req.status] || ''}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">{new Date(req.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setSelectedReq(req); setShowDetail(true); }}
                          className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg">
                          <Eye size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showDetail && selectedReq && (
        <Modal isOpen={showDetail} title={`${selectedReq.reference} — Details`} onClose={() => setShowDetail(false)} size="lg">
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Service', selectedReq.serviceName],
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

            {selectedReq.adminComments && (
              <div className={`rounded-lg p-3 ${selectedReq.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                <p className="text-xs font-medium mb-1 text-slate-500">Admin Note</p>
                <p className="text-slate-700 dark:text-slate-200">{selectedReq.adminComments}</p>
              </div>
            )}

            {selectedReq.documents?.length > 0 && (
              <div>
                <p className="font-medium text-slate-600 dark:text-slate-400 mb-2">Uploaded Documents</p>
                {selectedReq.documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                    <FileText size={12} />
                    <span className="capitalize">{doc.fieldKey.replace(/_/g,' ')}</span> — {doc.originalName}
                    {doc.isPasswordProtected && <span className="bg-yellow-100 text-yellow-700 px-1.5 rounded text-[10px]">Password Protected</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
