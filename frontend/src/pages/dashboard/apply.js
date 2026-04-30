import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Upload, FileText, X, CheckCircle, Lock, Eye, EyeOff, AlertCircle, ChevronRight } from 'lucide-react';

export default function ApplyPage() {
  const router = useRouter();
  const { service: preSelectedSlug } = router.query;
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);

  // { [fieldName]: { file, password, showPassword } }
  const [fieldUploads, setFieldUploads] = useState({});

  useEffect(() => { fetchServices(); }, []);

  useEffect(() => {
    if (preSelectedSlug && services.length > 0) {
      const found = services.find(s => s.slug === preSelectedSlug);
      if (found) { setSelectedService(found._id); initFields(found); setStep(2); }
    }
  }, [preSelectedSlug, services]);

  const fetchServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data.services || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const initFields = (svc) => {
    const init = {};
    (svc.requiredDocuments || []).forEach(doc => {
      init[doc.name] = { file: null, password: '', showPassword: false };
    });
    setFieldUploads(init);
  };

  const handleServiceSelect = (svc) => { setSelectedService(svc._id); initFields(svc); };

  const setField = (fieldName, key, val) =>
    setFieldUploads(prev => ({ ...prev, [fieldName]: { ...prev[fieldName], [key]: val } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) return toast.error('Please select a service');
    const selected = services.find(s => s._id === selectedService);
    const missing = (selected?.requiredDocuments || []).filter(d => d.isMandatory && !fieldUploads[d.name]?.file);
    if (missing.length > 0) return toast.error(`Please upload: ${missing.map(d => d.name).join(', ')}`);

    setSubmitting(true);
    try {
      const data = await api.createApplication({ serviceId: selectedService, notes, formData: {} });
      const appId = data.application._id || data.application.id;

      const hasFiles = Object.values(fieldUploads).some(f => f.file);
      if (hasFiles) {
        const fd = new FormData();
        let idx = 0;
        Object.entries(fieldUploads).forEach(([fieldName, { file, password }]) => {
          if (file) {
            fd.append('files', file);
            fd.append(`names[${idx}]`, fieldName);
            fd.append(`fieldNames[${idx}]`, fieldName);
            if (password) fd.append(`passwords[${idx}]`, password);
            idx++;
          }
        });
        try { await api.uploadDocuments(appId, fd); } catch (err) {
          toast.error('Application created but upload failed: ' + err.message);
        }
      }
      toast.success('Application submitted!');
      router.push(`/dashboard/applications/${appId}`);
    } catch (error) { toast.error(error.message); } finally { setSubmitting(false); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const selected = services.find(s => s._id === selectedService);
  const docFields = selected?.requiredDocuments || [];
  const mandatoryCount = docFields.filter(d => d.isMandatory).length;
  const uploadedCount = Object.values(fieldUploads).filter(f => f.file).length;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Apply for Service</h1>
          <p className="text-slate-500">Choose a service and upload the required documents</p>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-3">
          {[['1', 'Select Service'], ['2', 'Upload Documents']].map(([num, label], i) => (
            <div key={num} className="flex items-center gap-2">
              {i > 0 && <ChevronRight size={16} className="text-slate-300" />}
              <div className={`flex items-center gap-2 text-sm font-medium ${step >= Number(num) ? 'text-primary-600' : 'text-slate-400'}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= Number(num) ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{num}</span>
                <span className="hidden sm:inline">{label}</span>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── Step 1: Service Selection ── */}
          {step === 1 && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Select Service</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(svc => (
                  <button key={svc._id} type="button"
                    onClick={() => { handleServiceSelect(svc); setStep(2); }}
                    className="text-left p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-primary-400 transition-all group">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{svc.icon}</span>
                      <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-primary-600">{svc.name}</span>
                    </div>
                    <p className="text-xs text-slate-500">{svc.shortDescription}</p>
                    <div className="flex items-center gap-3 mt-2">
                      {svc.pricing?.startingAt > 0 && <span className="text-xs font-bold text-primary-600">₹{svc.pricing.startingAt.toLocaleString('en-IN')}</span>}
                      {svc.requiredDocuments?.length > 0 && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <FileText size={10} /> {svc.requiredDocuments.length} docs
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 2: Documents ── */}
          {step === 2 && selected && (
            <>
              {/* Service banner */}
              <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-700">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{selected.icon}</span>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{selected.name}</p>
                    <p className="text-xs text-slate-500">{mandatoryCount} required · {docFields.length - mandatoryCount} optional</p>
                  </div>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-xs text-primary-600 font-medium hover:underline">Change</button>
              </div>

              {/* Progress bar */}
              {docFields.length > 0 && (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full transition-all duration-300"
                      style={{ width: `${docFields.length ? (uploadedCount / docFields.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-xs font-medium text-slate-500 whitespace-nowrap">
                    {uploadedCount} / {docFields.length} uploaded
                  </span>
                </div>
              )}

              {/* Document field cards */}
              {docFields.length > 0 ? (
                <div className="space-y-3">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white">Upload Documents</h2>
                  {docFields.map((doc, i) => {
                    const up = fieldUploads[doc.name] || { file: null, password: '', showPassword: false };
                    const hasFile = !!up.file;
                    return (
                      <div key={i} className={`rounded-xl border-2 p-4 transition-all ${
                        hasFile ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                          : doc.isMandatory ? 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                          : 'border-dashed border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                      }`}>
                        {/* Header */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${hasFile ? 'bg-green-500' : 'bg-slate-100 dark:bg-slate-700'}`}>
                              {hasFile ? <CheckCircle size={16} className="text-white" /> : <FileText size={16} className="text-slate-400" />}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white text-sm">{doc.name}</p>
                              {doc.description && <p className="text-xs text-slate-500 mt-0.5">{doc.description}</p>}
                            </div>
                          </div>
                          <div className="flex gap-1.5 flex-shrink-0 ml-2">
                            {doc.isMandatory
                              ? <span className="text-[10px] px-2 py-0.5 bg-red-100 text-red-600 rounded-full font-semibold">Required</span>
                              : <span className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 rounded-full">Optional</span>}
                            {doc.passwordEnabled && (
                              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full font-semibold flex items-center gap-0.5">
                                <Lock size={8} />Password
                              </span>
                            )}
                          </div>
                        </div>

                        {/* File picker */}
                        {!hasFile ? (
                          <label className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-600 cursor-pointer hover:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors">
                            <Upload size={15} className="text-slate-400" />
                            <span className="text-sm text-slate-500">Upload <strong>{doc.name}</strong></span>
                            <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              onChange={e => e.target.files[0] && setField(doc.name, 'file', e.target.files[0])} />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-slate-700 rounded-lg border border-green-200 dark:border-green-700">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText size={15} className="text-green-500 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate text-slate-800 dark:text-white">{up.file.name}</p>
                                <p className="text-xs text-slate-400">{(up.file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <button type="button" onClick={() => setField(doc.name, 'file', null)}
                              className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                              <X size={14} />
                            </button>
                          </div>
                        )}

                        {/* Password input — shown for all docs when file is selected */}
                        {hasFile && (
                          <div className="mt-3 flex items-center gap-2">
                            <Lock size={14} className="text-slate-400 flex-shrink-0" />
                            <div className="relative flex-1">
                              <input
                                type={up.showPassword ? 'text' : 'password'}
                                value={up.password}
                                onChange={e => setField(doc.name, 'password', e.target.value)}
                                placeholder={doc.passwordEnabled ? 'Document password' : 'Password (optional, if document is protected)'}
                                className="input py-2 pr-10 text-sm"
                              />
                              <button type="button" onClick={() => setField(doc.name, 'showPassword', !up.showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {up.showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Generic uploader when no fields configured */
                <div className="card">
                  <h2 className="text-base font-semibold mb-3 text-slate-900 dark:text-white">Upload Supporting Documents</h2>
                  <label className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 cursor-pointer hover:border-primary-400 transition-colors">
                    <Upload size={28} className="text-slate-400" />
                    <span className="text-slate-500 text-sm">Click to browse files</span>
                    <span className="text-xs text-slate-400">PDF, Images, Word, Excel up to 10MB</span>
                    <input type="file" multiple className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={e => {
                        const updates = {};
                        Array.from(e.target.files).forEach(f => { updates[f.name] = { file: f, password: '', showPassword: false }; });
                        setFieldUploads(prev => ({ ...prev, ...updates }));
                      }} />
                  </label>
                  {Object.entries(fieldUploads).filter(([, v]) => v.file).map(([name, { file }]) => (
                    <div key={name} className="flex items-center justify-between mt-2 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-2"><FileText size={14} className="text-primary-500" /><span className="text-sm truncate">{file.name}</span></div>
                      <button type="button" onClick={() => setField(name, 'file', null)}><X size={14} className="text-slate-400 hover:text-red-500" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div className="card">
                <h2 className="text-base font-semibold mb-3 text-slate-900 dark:text-white">Additional Notes</h2>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  className="input min-h-[80px]" placeholder="Any additional information..." />
              </div>

              {/* Validation */}
              {mandatoryCount > 0 && uploadedCount < mandatoryCount && (
                <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>Upload all <strong>{mandatoryCount} required</strong> document{mandatoryCount !== 1 ? 's' : ''} to submit.</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">Back</button>
                <button type="submit" disabled={submitting || !selectedService} className="btn-primary flex-1 justify-center">
                  {submitting ? <span className="spinner w-5 h-5" /> : 'Submit Application'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </DashboardLayout>
  );
}
