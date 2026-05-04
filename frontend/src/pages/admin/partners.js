import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, Modal } from '../../components/ui';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Handshake, Search, Filter, CheckCircle, XCircle, Clock, RefreshCw, AlertCircle, Eye, CreditCard, Plus, ChevronDown, UserPlus, Copy, RefreshCcw } from 'lucide-react';

const STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'reviewed', label: 'Reviewed' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'needs_update', label: 'Needs Update' },
];

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', color: 'text-yellow-700 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  reviewed:       { label: 'Reviewed', color: 'text-blue-700 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', icon: RefreshCw },
  approved:       { label: 'Approved', color: 'text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
  rejected:       { label: 'Rejected', color: 'text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
  needs_update:   { label: 'Needs Update', color: 'text-orange-700 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400', icon: AlertCircle },
};

const RC_STATUS_CONFIG = {
  rate_pending_approval: { label: 'Pending', color: 'text-yellow-700 bg-yellow-100' },
  rate_approved:         { label: 'Approved', color: 'text-green-700 bg-green-100' },
  rate_rejected:         { label: 'Rejected', color: 'text-red-700 bg-red-100' },
};

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState(() => (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('status') || '' : ''));
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showRateCardModal, setShowRateCardModal] = useState(false);
  const [showBulkRcModal, setShowBulkRcModal] = useState(false);
  const [bulkRcRows, setBulkRcRows] = useState([]);       // [{serviceId, serviceName, basePrice, partnerPrice, effectiveDate, existing}]
  const [bulkRcOriginal, setBulkRcOriginal] = useState([]); // original values for reset
  const [bulkRcSaving, setBulkRcSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', comments: '' });
  const [services, setServices] = useState([]);
  const [rcForm, setRcForm] = useState({ serviceId: '', basePrice: '', partnerPrice: '', effectiveDate: new Date().toISOString().split('T')[0], expiryDate: '', notes: '' });
  const [rateCards, setRateCards] = useState([]);
  const [rcLoading, setRcLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Create Partner form state
  const EMPTY_CREATE = { name: '', email: '', phone: '', companyName: '', gst: '', pan: '', city: '', state: '', address: '', about: '', password: '', autoGenPass: true };
  const [createForm, setCreateForm] = useState(EMPTY_CREATE);
  const [createRateCards, setCreateRateCards] = useState([]); // [{serviceId, serviceName, basePrice, partnerPrice}]
  const [createStep, setCreateStep] = useState(1); // 1=details, 2=rate cards, 3=done
  const [createdCredentials, setCreatedCredentials] = useState(null); // {name, email, password}

  useEffect(() => { fetchServices(); }, []);
  // Re-fetch from API whenever search or status filter changes
  useEffect(() => { fetchPartners(); }, [filterStatus, search]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;
      const data = await api.getPartners(params);
      setPartners(data.partners || []);
    } catch (e) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const fetchServices = async () => {
    try { const d = await api.getServices(); setServices(d.services || []); } catch (e) {}
  };

  // Open bulk rate card manager for an existing partner
  const openBulkRcModal = async (partner) => {
    setSelectedPartner(partner);
    setRcLoading(true);
    setShowBulkRcModal(true);
    try {
      const [svcData, rcData] = await Promise.all([api.getServices(), api.getRateCards({ partnerId: partner.id })]);
      const svcs = svcData.services || [];
      const existing = rcData.rateCards || [];
      setRateCards(existing);
      const rows = svcs.map(s => {
        const ex = existing.find(rc => rc.serviceId === s.id || rc.service_id === s.id);
        const masterBase = parseFloat(s.pricing?.basePrice ?? 0);
        return {
          serviceId:     s.id,
          serviceName:   s.name,
          masterBasePrice: masterBase,
          basePrice:     ex
            ? String(ex.basePrice != null ? ex.basePrice : (ex.base_price != null ? ex.base_price : masterBase))
            : String(masterBase > 0 ? masterBase : ''),
          partnerPrice:  ex ? String(ex.partnerPrice ?? ex.partner_price ?? '') : '',
          effectiveDate: ex ? (ex.effectiveDate || ex.effective_date || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
          existingId:    ex ? ex.id : null,
          status:        ex ? ex.status : null,
          modified:      false,
        };
      });
      setBulkRcRows(rows);
      setBulkRcOriginal(JSON.parse(JSON.stringify(rows)));
    } catch (e) { toast.error(e.message); setShowBulkRcModal(false); }
    finally { setRcLoading(false); }
  };

  const updateBulkRow = (i, field, value) => {
    setBulkRcRows(prev => prev.map((r, j) => j === i ? { ...r, [field]: value, modified: true } : r));
  };

  const resetBulkRow = (i) => {
    setBulkRcRows(prev => prev.map((r, j) => j === i ? { ...bulkRcOriginal[i], modified: false } : r));
  };

  const resetAllBulkRows = () => {
    setBulkRcRows(prev => prev.map((r, i) => ({ ...bulkRcOriginal[i], modified: false })));
  };

  const saveBulkRateCards = async () => {
    const toSave = bulkRcRows.filter(r => r.modified && r.partnerPrice !== '' && parseFloat(r.partnerPrice) > 0);
    if (toSave.length === 0) { toast('No changes to save'); return; }
    setBulkRcSaving(true);
    try {
      const rateCards = toSave.map(r => ({
        serviceId:     r.serviceId,
        basePrice:     parseFloat(r.basePrice) || 0,
        partnerPrice:  parseFloat(r.partnerPrice),
        effectiveDate: r.effectiveDate,
      }));
      await api.adminBulkAssignRateCards(selectedPartner.id, rateCards);
      toast.success(`${toSave.length} rate card${toSave.length > 1 ? 's' : ''} saved`);
      setShowBulkRcModal(false);
      // Refresh detail view if open
      if (showDetail) {
        const d = await api.getRateCards({ partnerId: selectedPartner.id });
        setRateCards(d.rateCards || []);
      }
    } catch (e) { toast.error(e.message); }
    finally { setBulkRcSaving(false); }
  };

  // Auto-generate a password
  const genPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  };

  const openCreateModal = () => {
    const pwd = genPassword();
    setCreateForm({ ...EMPTY_CREATE, password: pwd });
    // Pre-fill rate card rows for all services
    setCreateRateCards([]);
    setCreateStep(1);
    setCreatedCredentials(null);
    setShowCreateModal(true);
  };

  const handleCreatePartner = async () => {
    if (!createForm.name || !createForm.email || !createForm.phone) {
      toast.error('Name, email and phone are required');
      return;
    }
    if (!createForm.city.trim() || !createForm.state.trim()) {
      toast.error('City and state are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...createForm,
        rateCards: createRateCards.filter(rc => rc.partnerPrice > 0).map(rc => ({
          serviceId: rc.serviceId,
          basePrice: parseFloat(rc.basePrice) || 0,
          partnerPrice: parseFloat(rc.partnerPrice),
        })),
      };
      const res = await api.adminCreatePartner(payload);
      setCreatedCredentials({ name: res.partner?.name, email: createForm.email, password: res.plainPassword });
      setCreateStep(3);
      fetchPartners();
      toast.success(`Partner "${res.partner?.name}" created & credentials emailed`);
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const initRateCardRows = () => {
    if (createRateCards.length === 0 && services.length > 0) {
      setCreateRateCards(services.map(s => {
        const bp = parseFloat(s.pricing?.basePrice ?? 0);
        return { serviceId: s.id, serviceName: s.name, basePrice: bp > 0 ? String(bp) : '', partnerPrice: '' };
      }));
    }
    setCreateStep(2);
  };

  const openDetail = async (partner) => {
    setSelectedPartner(partner);
    setShowDetail(true);
    setRcLoading(true);
    try {
      const d = await api.getRateCards({ partnerId: partner.id });
      setRateCards(d.rateCards || []);
    } catch (e) {}
    finally { setRcLoading(false); }
  };

  const openStatusModal = (partner) => {
    setStatusTarget(partner);
    setStatusForm({ status: partner.partnerStatus, comments: '' });
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    setSaving(true);
    try {
      await api.updatePartnerStatus(statusTarget.id, statusForm);
      toast.success('Status updated');
      setShowStatusModal(false);
      fetchPartners();
      if (selectedPartner?.id === statusTarget.id) {
        const d = await api.getPartnerById(statusTarget.id);
        setSelectedPartner(d.partner);
      }
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleCreateRateCard = async () => {
    setSaving(true);
    try {
      await api.createRateCard({ ...rcForm, partnerId: selectedPartner.id, basePrice: parseFloat(rcForm.basePrice) || 0, partnerPrice: parseFloat(rcForm.partnerPrice) });
      toast.success('Rate card created and partner notified');
      setShowRateCardModal(false);
      setRcForm({ serviceId: '', basePrice: '', partnerPrice: '', effectiveDate: new Date().toISOString().split('T')[0], expiryDate: '', notes: '' });
      const d = await api.getRateCards({ partnerId: selectedPartner.id });
      setRateCards(d.rateCards || []);
    } catch (e) { toast.error(e.message); }
    finally { setSaving(false); }
  };

  const handleRcAdminStatus = async (rcId, status) => {
    try {
      await api.adminUpdateRateCardStatus(rcId, { status });
      toast.success('Rate card status updated');
      const d = await api.getRateCards({ partnerId: selectedPartner.id });
      setRateCards(d.rateCards || []);
    } catch (e) { toast.error(e.message); }
  };

  const filtered = partners.filter(p =>
    (!search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.email?.toLowerCase().includes(search.toLowerCase()) || p.firmName?.toLowerCase().includes(search.toLowerCase())) &&
    (!filterStatus || p.partnerStatus === filterStatus)
  );

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><Handshake size={24} /> Associates Partners</h1>
            <p className="text-slate-500 text-sm mt-1">{partners.length} total partner{partners.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={openCreateModal} className="flex items-center gap-2 btn-primary text-sm px-4 py-2.5">
            <UserPlus size={16} /> Create Partner
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['pending_review','reviewed','approved','rejected','needs_update'].map(s => {
            const cnt = partners.filter(p => p.partnerStatus === s).length;
            const cfg = STATUS_CONFIG[s];
            const Icon = cfg.icon;
            return (
              <button key={s} onClick={() => setFilterStatus(filterStatus === s ? '' : s)} className={`p-3 rounded-xl border text-left transition-all ${filterStatus === s ? 'ring-2 ring-primary-500' : ''} bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700`}>
                <div className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-1 ${cfg.color}`}><Icon size={12} />{cfg.label}</div>
                <p className="text-xl font-bold text-slate-900 dark:text-white">{cnt}</p>
              </button>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners..." className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm">
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16"><Handshake size={40} className="mx-auto text-slate-300 mb-3" /><p className="text-slate-500">No partners found</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="text-left px-5 py-3">Partner</th>
                    <th className="text-left px-5 py-3">Firm</th>
                    <th className="text-left px-5 py-3">Reviewer</th>
                    <th className="text-left px-5 py-3">Status</th>
                    <th className="text-left px-5 py-3">Registered</th>
                    <th className="text-right px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filtered.map(p => {
                    const cfg = STATUS_CONFIG[p.partnerStatus] || STATUS_CONFIG.pending_review;
                    const Icon = cfg.icon;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-sm font-bold text-primary-600 dark:text-primary-400">{p.name?.charAt(0)?.toUpperCase()}</div>
                            <div>
                              <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                              <p className="text-xs text-slate-500">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-700 dark:text-slate-300">{p.firmName || '—'}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{p.reviewerName || 'Unassigned'}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${cfg.color}`}><Icon size={12} />{cfg.label}</span>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500">{p.registeredDate || p.createdAt?.split('T')[0]}</td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openStatusModal(p)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg" title="Update Status"><Filter size={15} /></button>
                            <button onClick={() => openDetail(p)} className="p-1.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg" title="View Detail"><Eye size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && statusTarget && (
        <Modal isOpen={showStatusModal} title={`Update Status — ${statusTarget.name}`} onClose={() => setShowStatusModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">New Status</label>
              <select value={statusForm.status} onChange={e => setStatusForm(p => ({ ...p, status: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option value="pending_review">Pending Review</option>
                <option value="reviewed">Reviewed</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_update">Needs Update</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Comments (optional)</label>
              <textarea rows={3} value={statusForm.comments} onChange={e => setStatusForm(p => ({ ...p, comments: e.target.value }))} placeholder="Add any comments or reasons..." className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm" />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowStatusModal(false)} className="flex-1 btn-outline">Cancel</button>
              <button onClick={handleUpdateStatus} disabled={saving} className="flex-1 btn-primary">{saving ? 'Saving...' : 'Update Status'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Partner Detail Modal */}
      {showDetail && selectedPartner && (
        <Modal isOpen={showDetail} title={`${selectedPartner.name} — Partner Detail`} onClose={() => setShowDetail(false)} size="xl">
          <div className="space-y-5">
            {/* Profile Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['Email', selectedPartner.email], ['Phone', selectedPartner.phone || '—'],
                ['Firm', selectedPartner.firmName || '—'], ['City', selectedPartner.city || '—'],
                ['State', selectedPartner.state || '—'], ['PAN', selectedPartner.pan || '—'],
                ['GST', selectedPartner.gst || '—'], ['Aadhaar', selectedPartner.aadhaar || '—'],
              ].map(([k, v]) => (
                <div key={k}><span className="text-slate-500">{k}: </span><span className="font-medium text-slate-900 dark:text-white">{v}</span></div>
              ))}
            </div>

            {selectedPartner.about && (
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">About</p>
                <p className="text-sm text-slate-700 dark:text-slate-300">{selectedPartner.about}</p>
              </div>
            )}

            {/* Rate Cards Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2"><CreditCard size={16} /> Rate Cards</h3>
                {selectedPartner.partnerStatus === 'approved' && (
                  <button onClick={() => openBulkRcModal(selectedPartner)} className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"><Plus size={14} /> Manage Rate Cards</button>
                )}
              </div>
              {rcLoading ? <p className="text-sm text-slate-500">Loading...</p> : rateCards.length === 0 ? (
                <p className="text-sm text-slate-500 py-4 text-center">No rate cards yet</p>
              ) : (
                <div className="space-y-2">
                  {rateCards.map(rc => {
                    const rcCfg = RC_STATUS_CONFIG[rc.status] || RC_STATUS_CONFIG.rate_pending_approval;
                    return (
                      <div key={rc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{rc.serviceName}</p>
                          <p className="text-xs text-slate-500">Partner Price: ₹{rc.partnerPrice?.toLocaleString('en-IN')} {rc.marginPercent ? `(${rc.marginPercent}% margin)` : ''}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rcCfg.color}`}>{rcCfg.label}</span>
                          {rc.status === 'rate_pending_approval' && (
                            <div className="flex gap-1">
                              <button onClick={() => handleRcAdminStatus(rc.id, 'rate_approved')} className="text-xs bg-green-100 text-green-700 rounded px-2 py-0.5 hover:bg-green-200">Approve</button>
                              <button onClick={() => handleRcAdminStatus(rc.id, 'rate_rejected')} className="text-xs bg-red-100 text-red-700 rounded px-2 py-0.5 hover:bg-red-200">Reject</button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Audit Log */}
            {selectedPartner.auditLogs && selectedPartner.auditLogs.length > 0 && (
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2 text-sm">Recent Activity</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedPartner.auditLogs.slice(0, 10).map((log, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full shrink-0" />
                      <span className="font-medium">{log.action}</span>
                      {log.by_name && <span>by {log.by_name}</span>}
                      <span className="ml-auto">{log.created_at?.split('T')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => openStatusModal(selectedPartner)} className="btn-outline text-sm flex-1">Update Status</button>
              <button onClick={() => setShowDetail(false)} className="btn-primary text-sm flex-1">Close</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Partner Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} title="Create Associate Partner" onClose={() => setShowCreateModal(false)} size="xl">
          {createStep === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Partner will be created as <strong>Active</strong> with no email verification required. Credentials will be emailed automatically.</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Full Name *</label>
                  <input value={createForm.name} onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Company / Firm Name</label>
                  <input value={createForm.companyName} onChange={e => setCreateForm(p => ({ ...p, companyName: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="ABC Consultants" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email *</label>
                  <input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="partner@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Mobile Number *</label>
                  <input value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="+91 9876543210" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">GST Number</label>
                  <input value={createForm.gst} onChange={e => setCreateForm(p => ({ ...p, gst: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">PAN Number</label>
                  <input value={createForm.pan} onChange={e => setCreateForm(p => ({ ...p, pan: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" placeholder="ABCDE1234F" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">City</label>
                  <input value={createForm.city} onChange={e => setCreateForm(p => ({ ...p, city: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">State</label>
                  <input value={createForm.state} onChange={e => setCreateForm(p => ({ ...p, state: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Address</label>
                <input value={createForm.address} onChange={e => setCreateForm(p => ({ ...p, address: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
              </div>
              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Login Password</label>
                <div className="flex gap-2">
                  <input value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm font-mono"
                    placeholder="Leave blank to auto-generate" />
                  <button type="button" onClick={() => setCreateForm(p => ({ ...p, password: genPassword() }))}
                    className="flex items-center gap-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" title="Generate password">
                    <RefreshCcw size={14} /> Auto
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-1">Password will be emailed to the partner. They can change it after login.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowCreateModal(false)} className="flex-1 btn-outline">Cancel</button>
                <button onClick={initRateCardRows} className="flex-1 btn-primary">Next: Assign Rate Cards →</button>
              </div>
            </div>
          )}

          {createStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">Set partner prices for each service. Leave <strong>Partner Price</strong> blank to skip that service. You can also assign these later.</p>
              <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-600 rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-slate-600 dark:text-slate-300">Service</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600 dark:text-slate-300 w-28">Base Price ₹</th>
                      <th className="text-right px-3 py-2 font-medium text-slate-600 dark:text-slate-300 w-28">Partner Price ₹</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {createRateCards.map((rc, i) => (
                      <tr key={rc.serviceId}>
                        <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{rc.serviceName}</td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={rc.basePrice} onChange={e => setCreateRateCards(rows => rows.map((r, j) => j === i ? { ...r, basePrice: e.target.value } : r))}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="0" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={rc.partnerPrice} onChange={e => setCreateRateCards(rows => rows.map((r, j) => j === i ? { ...r, partnerPrice: e.target.value } : r))}
                            className="w-full px-2 py-1 border border-slate-300 dark:border-slate-600 rounded text-right bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary-500" placeholder="skip" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400">{createRateCards.filter(r => r.partnerPrice > 0).length} of {createRateCards.length} services will have rate cards assigned.</p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setCreateStep(1)} className="btn-outline">← Back</button>
                <button onClick={handleCreatePartner} disabled={saving} className="flex-1 btn-primary disabled:opacity-60">
                  {saving ? 'Creating...' : '✓ Create Partner & Send Credentials'}
                </button>
              </div>
            </div>
          )}

          {createStep === 3 && createdCredentials && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                <CheckCircle className="text-green-500 shrink-0" size={24} />
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">Partner Created Successfully!</p>
                  <p className="text-sm text-green-700 dark:text-green-400">Credentials have been emailed to the partner.</p>
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 space-y-2 text-sm">
                <p className="font-semibold text-slate-700 dark:text-slate-300 mb-3">Login Credentials</p>
                {[['Name', createdCredentials.name], ['Email', createdCredentials.email], ['Password', createdCredentials.password]].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center">
                    <span className="text-slate-500">{k}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-900 dark:text-white">{v}</span>
                      <button onClick={() => { navigator.clipboard.writeText(v); toast.success(`${k} copied`); }}
                        className="text-slate-400 hover:text-primary-500"><Copy size={13} /></button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => setShowCreateModal(false)} className="w-full btn-primary">Done</button>
            </div>
          )}
        </Modal>
      )}

      {/* Bulk Rate Card Manager Modal */}
      {showBulkRcModal && selectedPartner && (
        <Modal isOpen={showBulkRcModal} title={`Manage Rate Cards — ${selectedPartner.name}`} onClose={() => setShowBulkRcModal(false)} size="xl">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Auto-populated from Service Master. Edit <span className="font-medium text-slate-700 dark:text-slate-300">Partner Price</span> to assign. Leave blank to skip.
              </p>
              <button onClick={resetAllBulkRows} className="text-xs text-slate-500 hover:text-primary-600 flex items-center gap-1 border border-slate-300 dark:border-slate-600 rounded px-2 py-1">
                <RefreshCcw size={12} /> Reset All
              </button>
            </div>

            {rcLoading ? (
              <div className="text-center py-10 text-slate-400">Loading services…</div>
            ) : (
              <>
                <div className="overflow-auto max-h-96 border border-slate-200 dark:border-slate-700 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0 z-10">
                      <tr>
                        <th className="text-left px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300">Service</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-500 w-28">Master Price ₹</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-28">Base Price ₹</th>
                        <th className="text-right px-3 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 w-32">Partner Price ₹ *</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 w-28">Effective</th>
                        <th className="text-center px-3 py-2.5 text-xs font-semibold text-slate-500 w-16">Status</th>
                        <th className="px-2 py-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {bulkRcRows.map((row, i) => {
                        const hasMissing = !row.partnerPrice || parseFloat(row.partnerPrice) <= 0;
                        const statusCfg = row.status ? (RC_STATUS_CONFIG[row.status] || RC_STATUS_CONFIG.rate_pending_approval) : null;
                        return (
                          <tr key={row.serviceId} className={row.modified ? 'bg-amber-50 dark:bg-amber-900/10' : ''}>
                            <td className="px-3 py-2 text-slate-800 dark:text-slate-200 font-medium">
                              {row.serviceName}
                              {row.modified && <span className="ml-1.5 text-[9px] font-semibold text-amber-600 bg-amber-100 px-1 py-0.5 rounded">EDITED</span>}
                            </td>
                            {/* Master price (read-only hint) */}
                            <td className="px-3 py-2 text-right text-slate-400 text-xs font-mono">
                              {row.masterBasePrice > 0 ? `₹${row.masterBasePrice.toLocaleString('en-IN')}` : '—'}
                            </td>
                            {/* Editable base price */}
                            <td className="px-2 py-1.5">
                              <input type="number" min="0" value={row.basePrice}
                                onChange={e => updateBulkRow(i, 'basePrice', e.target.value)}
                                className="w-full px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-right text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                                placeholder="0" />
                            </td>
                            {/* Partner price */}
                            <td className="px-2 py-1.5">
                              <input type="number" min="0" value={row.partnerPrice}
                                onChange={e => updateBulkRow(i, 'partnerPrice', e.target.value)}
                                className={`w-full px-2 py-1 border rounded text-right text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 ${hasMissing ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-700' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800'} text-slate-900 dark:text-white`}
                                placeholder={hasMissing ? '⚠ required' : '0'} />
                            </td>
                            {/* Effective date */}
                            <td className="px-2 py-1.5">
                              <input type="date" value={row.effectiveDate}
                                onChange={e => updateBulkRow(i, 'effectiveDate', e.target.value)}
                                className="w-full px-1 py-1 border border-slate-200 dark:border-slate-600 rounded text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-500" />
                            </td>
                            {/* Status */}
                            <td className="px-2 py-2 text-center">
                              {statusCfg ? (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${statusCfg.color}`}>{statusCfg.label}</span>
                              ) : (
                                <span className="text-[10px] text-slate-300">—</span>
                              )}
                            </td>
                            {/* Reset row */}
                            <td className="px-2 py-2 text-center">
                              {row.modified && (
                                <button onClick={() => resetBulkRow(i)} title="Reset this row" className="text-slate-300 hover:text-orange-500 p-0.5">
                                  <RefreshCcw size={12} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Summary */}
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-amber-400 rounded inline-block" /> {bulkRcRows.filter(r => r.modified).length} edited</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded inline-block" /> {bulkRcRows.filter(r => r.partnerPrice && parseFloat(r.partnerPrice) > 0).length} with price</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-orange-400 rounded inline-block" /> {bulkRcRows.filter(r => !r.partnerPrice || parseFloat(r.partnerPrice) <= 0).length} missing</span>
                </div>
              </>
            )}

            <div className="flex gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <button onClick={() => setShowBulkRcModal(false)} className="btn-outline flex-1">Cancel</button>
              <button onClick={saveBulkRateCards} disabled={bulkRcSaving || bulkRcRows.filter(r => r.modified).length === 0}
                className="btn-primary flex-1 disabled:opacity-60">
                {bulkRcSaving ? 'Saving…' : `Save ${bulkRcRows.filter(r => r.modified && r.partnerPrice > 0).length} Rate Cards`}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
