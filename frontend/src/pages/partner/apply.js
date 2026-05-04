import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import api from '../../lib/api';
import { CheckCircle, ChevronRight, FileText, Upload, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';

const STEPS = ['Select Service', 'Client Details', 'Upload Documents', 'Review & Submit'];

export default function PartnerApply() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rateCards, setRateCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [serviceConfig, setServiceConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [submitted, setSubmitted] = useState(null);
  const [error, setError] = useState('');

  // Step 2: client + dynamic fields
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [dynamicValues, setDynamicValues] = useState({});

  // Step 3: documents
  const [docFiles, setDocFiles] = useState({});
  const [docPasswords, setDocPasswords] = useState({});
  const [showPwd, setShowPwd] = useState({});

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getRateCards({ status: 'rate_approved' });
        setRateCards(data.rateCards || []);
      } catch {}
      setLoading(false);
    })();
  }, []);

  const selectCard = async (card) => {
    setSelectedCard(card);
    setConfigLoading(true);
    try {
      const cfg = await api.request(`/services/${card.serviceSlug}/config`);
      setServiceConfig(cfg);
    } catch {
      setServiceConfig({ formFields: [], documents: [] });
    }
    setConfigLoading(false);
    setStep(1);
  };

  const handleDynamicChange = (key, val) => setDynamicValues(v => ({ ...v, [key]: val }));

  const validateStep1 = () => {
    if (!clientName.trim()) return 'Client name is required';
    if (!clientEmail.trim()) return 'Client email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) return 'Invalid client email';
    const fields = serviceConfig?.formFields || [];
    for (const f of fields) {
      if (f.required && !dynamicValues[f.name]?.toString().trim()) return `${f.label} is required`;
    }
    return '';
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('serviceId', selectedCard.serviceId);
      fd.append('clientName', clientName);
      fd.append('clientEmail', clientEmail);
      fd.append('clientPhone', clientPhone);
      Object.entries(dynamicValues).forEach(([k, v]) => fd.append(`field_${k}`, v));
      Object.entries(docFiles).forEach(([fieldKey, file]) => {
        if (file) fd.append(`doc_${fieldKey}`, file);
      });
      Object.entries(docPasswords).forEach(([fieldKey, pwd]) => {
        if (pwd) fd.append(`pwd_${fieldKey}`, pwd);
      });

      const res = await api.createPartnerServiceRequest(fd);
      setSubmitted(res);
    } catch (e) {
      setError(e.message || 'Submission failed. Please try again.');
    }
    setSubmitting(false);
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="max-w-lg mx-auto mt-16 text-center">
          <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Request Submitted!</h2>
          <p className="text-slate-500 mb-1">Reference: <span className="font-mono font-bold text-primary-600">{submitted.reference}</span></p>
          <p className="text-slate-500 mb-6">Our team will review your request and update you shortly.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => { setSubmitted(null); setStep(0); setSelectedCard(null); setClientName(''); setClientEmail(''); setClientPhone(''); setDynamicValues({}); setDocFiles({}); setDocPasswords({}); }}
              className="btn-outline">Submit Another</button>
            <a href="/partner" className="btn-primary">Back to Dashboard</a>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const docs = serviceConfig?.documents || [];
  const formFields = serviceConfig?.formFields || [];

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">New Service Request</h1>
          <p className="text-slate-500 text-sm mt-1">Submit a new client application through your associate account</p>
        </div>

        {/* Step bar */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                }`}>
                  {i < step ? <CheckCircle size={16} /> : i + 1}
                </div>
                <span className={`text-xs mt-1 font-medium whitespace-nowrap ${i === step ? 'text-primary-600' : 'text-slate-400'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < step ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Select Service */}
        {step === 0 && (
          <div>
            <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Choose a Service</h2>
            {rateCards.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <AlertCircle className="mx-auto mb-3" size={40} />
                <p className="font-medium">No approved rate cards</p>
                <p className="text-sm">Your rate cards must be approved by admin before you can submit service requests.</p>
                <a href="/partner/rate-cards" className="btn-outline mt-4 inline-block">View Rate Cards</a>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {rateCards.map(rc => (
                  <button key={rc.id} onClick={() => selectCard(rc)}
                    className="text-left border-2 border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all group">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-white">{rc.serviceName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{rc.serviceCategory || 'Tax Service'}</p>
                      </div>
                      <ChevronRight className="text-slate-300 group-hover:text-primary-500 shrink-0 mt-0.5" size={20} />
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-xs text-slate-500">Your Referral Price</p>
                      <p className="text-xl font-bold text-primary-600">₹{Number(rc.partnerPrice).toLocaleString('en-IN')}</p>
                      {rc.note && <p className="text-xs text-slate-400 mt-1 italic">{rc.note}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Client Details */}
        {step === 1 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div>
                <p className="text-xs text-slate-500">Selected Service</p>
                <p className="font-semibold text-slate-800 dark:text-white">{selectedCard?.serviceName}</p>
              </div>
              <span className="ml-auto text-primary-600 font-bold text-lg">₹{Number(selectedCard?.partnerPrice).toLocaleString('en-IN')}</span>
            </div>

            {configLoading ? <PageLoading /> : (
              <>
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Client Information</h3>
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Client Name <span className="text-red-500">*</span></label>
                    <input value={clientName} onChange={e => setClientName(e.target.value)} className="input-field" placeholder="Full name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Client Email <span className="text-red-500">*</span></label>
                    <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="input-field" placeholder="email@example.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Client Phone</label>
                    <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="input-field" placeholder="+91 XXXXX XXXXX" />
                  </div>
                </div>

                {formFields.length > 0 && (
                  <>
                    <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Service Details</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {formFields.map(f => (
                        <div key={f.name}>
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                            {f.label} {f.required && <span className="text-red-500">*</span>}
                          </label>
                          {f.type === 'textarea' ? (
                            <textarea rows={3} value={dynamicValues[f.name] || ''} onChange={e => handleDynamicChange(f.name, e.target.value)} className="input-field resize-none" placeholder={f.placeholder || ''} />
                          ) : f.type === 'select' ? (
                            <select value={dynamicValues[f.name] || ''} onChange={e => handleDynamicChange(f.name, e.target.value)} className="input-field">
                              <option value="">Select...</option>
                              {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input type={f.type || 'text'} value={dynamicValues[f.name] || ''} onChange={e => handleDynamicChange(f.name, e.target.value)} className="input-field" placeholder={f.placeholder || ''} />
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Step 2: Documents */}
        {step === 2 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Upload Documents</h3>
            {docs.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No documents required for this service.</p>
            ) : (
              <div className="space-y-5">
                {docs.map(doc => (
                  <div key={doc.name} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText size={16} className="text-slate-400" />
                      <span className="font-medium text-slate-700 dark:text-slate-200 text-sm">{doc.label}</span>
                      {doc.required && <span className="text-red-500 text-xs">*</span>}
                    </div>
                    {doc.description && <p className="text-xs text-slate-400 mb-2">{doc.description}</p>}
                    <label className="flex items-center gap-2 cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-lg p-3 hover:border-primary-400 transition-colors">
                      <Upload size={14} className="text-slate-400" />
                      <span className="text-sm text-slate-500">{docFiles[doc.name] ? docFiles[doc.name].name : 'Click to upload'}</span>
                      <input type="file" className="sr-only" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        onChange={e => setDocFiles(f => ({ ...f, [doc.name]: e.target.files[0] }))} />
                    </label>
                    {doc.passwordEnabled && (
                      <div className="mt-2 relative">
                        <label className="block text-xs text-slate-500 mb-1">Document Password (if any)</label>
                        <input
                          type={showPwd[doc.name] ? 'text' : 'password'}
                          value={docPasswords[doc.name] || ''}
                          onChange={e => setDocPasswords(p => ({ ...p, [doc.name]: e.target.value }))}
                          className="input-field pr-10" placeholder="Password (optional)" />
                        <button type="button" className="absolute right-3 top-7 text-slate-400" onClick={() => setShowPwd(s => ({ ...s, [doc.name]: !s[doc.name] }))}>
                          {showPwd[doc.name] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
            <h3 className="font-semibold text-slate-700 dark:text-slate-200">Review Your Request</h3>

            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {[
                ['Service', selectedCard?.serviceName],
                ['Your Price', `₹${Number(selectedCard?.partnerPrice).toLocaleString('en-IN')}`],
                ['Client Name', clientName],
                ['Client Email', clientEmail],
                ['Client Phone', clientPhone || '—'],
                ...Object.entries(dynamicValues).map(([k, v]) => [k.replace(/_/g, ' '), v]),
              ].map(([label, val]) => (
                <div key={label} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-slate-400 capitalize">{label}</p>
                  <p className="font-medium text-slate-700 dark:text-slate-200 truncate">{val || '—'}</p>
                </div>
              ))}
            </div>

            {Object.keys(docFiles).length > 0 && (
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Documents</p>
                <div className="space-y-1">
                  {Object.entries(docFiles).map(([key, file]) => file && (
                    <div key={key} className="flex items-center gap-2 text-sm text-slate-500">
                      <CheckCircle size={14} className="text-green-500 shrink-0" />
                      <span className="capitalize">{key.replace(/_/g, ' ')}</span>: <span className="text-slate-400">{file.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                <AlertCircle size={16} /> {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation buttons */}
        {step > 0 && (
          <div className="flex justify-between mt-6">
            <button onClick={() => { setStep(s => s - 1); setError(''); }} className="btn-outline flex items-center gap-2">
              <ArrowLeft size={16} /> Back
            </button>
            {step < 3 ? (
              <button onClick={() => {
                if (step === 1) { const err = validateStep1(); if (err) { setError(err); return; } }
                setError('');
                setStep(s => s + 1);
              }} className="btn-primary flex items-center gap-2">
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex items-center gap-2 disabled:opacity-60">
                {submitting ? 'Submitting…' : 'Submit Request'} {!submitting && <CheckCircle size={16} />}
              </button>
            )}
          </div>
        )}

        {error && step === 1 && (
          <p className="mt-3 text-red-600 text-sm flex items-center gap-1"><AlertCircle size={14} />{error}</p>
        )}
      </div>
    </DashboardLayout>
  );
}
