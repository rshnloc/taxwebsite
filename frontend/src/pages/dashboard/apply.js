import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';

export default function ApplyPage() {
  const router = useRouter();
  const { service: preSelectedSlug } = router.query;
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (preSelectedSlug && services.length > 0) {
      const found = services.find(s => s.slug === preSelectedSlug);
      if (found) setSelectedService(found._id);
    }
  }, [preSelectedSlug, services]);

  const fetchServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data.services);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileAdd = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedService) return toast.error('Please select a service');
    
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('serviceId', selectedService);
      formData.append('notes', notes);
      formData.append('formData', JSON.stringify({}));
      files.forEach(file => formData.append('documents', file));

      const data = await api.createApplication(formData);
      toast.success('Application submitted successfully!');
      router.push(`/dashboard/applications/${data.application._id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const selected = services.find(s => s._id === selectedService);

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Apply for Service</h1>
          <p className="text-slate-500">Choose a service and submit your documents</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Selection */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Select Service</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map(service => (
                <button
                  key={service._id}
                  type="button"
                  onClick={() => setSelectedService(service._id)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedService === service._id
                      ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-primary-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedService === service._id && <CheckCircle size={16} className="text-primary-600" />}
                    <span className="font-medium text-slate-900 dark:text-white text-sm">{service.name}</span>
                  </div>
                  {service.pricing?.basePrice > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      ₹{service.pricing.basePrice.toLocaleString('en-IN')} + GST
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Required Documents Info */}
          {selected?.requiredDocuments?.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Required Documents</h2>
              <ul className="space-y-2">
                {selected.requiredDocuments.map((doc, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <FileText size={16} className={doc.isMandatory ? 'text-red-500' : 'text-slate-400'} />
                    <span className="text-slate-700 dark:text-slate-300">{doc.name}</span>
                    {doc.isMandatory && <span className="text-red-500 text-xs">(Required)</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* File Upload */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Upload Documents</h2>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center">
              <Upload size={40} className="text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">
                Drag & drop files or{' '}
                <label className="text-primary-600 cursor-pointer hover:underline font-medium">
                  browse
                  <input type="file" multiple className="hidden" onChange={handleFileAdd}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                </label>
              </p>
              <p className="text-xs text-slate-400">PDF, Images, Word, Excel up to 10MB each</p>
            </div>

            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-primary-500" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{file.name}</span>
                      <span className="text-xs text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="text-slate-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Additional Notes</h2>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="input min-h-[100px]"
              placeholder="Any additional information or requirements..."
            />
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button type="button" onClick={() => router.back()} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting || !selectedService} className="btn-primary flex-1 justify-center">
              {submitting ? <span className="spinner w-5 h-5" /> : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
