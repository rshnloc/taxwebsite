import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading } from '../../../components/ui';
import api from '../../../lib/api';
import { FileText, Upload, Clock, User, MessageSquare, Download } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function ApplicationDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const data = await api.getApplicationById(id);
      setApplication(data.application);
    } catch (error) {
      toast.error('Application not found');
      router.push('/dashboard/applications');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const formData = new FormData();
    for (const file of e.target.files) {
      formData.append('documents', file);
    }
    try {
      await api.uploadDocuments(id, formData);
      toast.success('Documents uploaded!');
      fetchApplication();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;
  if (!application) return null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{application.service?.name}</h1>
            <p className="text-slate-500">Application #{application.applicationId}</p>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timeline */}
            <div className="card">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                <Clock size={18} className="inline mr-2" />Application Timeline
              </h2>
              <div className="space-y-4">
                {application.timeline?.map((entry, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-primary-600 rounded-full" />
                      {i < application.timeline.length - 1 && <div className="w-px h-full bg-slate-200 dark:bg-slate-700" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{entry.message}</p>
                      <p className="text-xs text-slate-500">
                        {format(new Date(entry.timestamp), 'dd MMM yyyy, HH:mm')}
                        {entry.updatedBy?.name && ` • ${entry.updatedBy.name}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  <FileText size={18} className="inline mr-2" />Documents
                </h2>
                <label className="btn-primary btn-sm cursor-pointer">
                  <Upload size={16} className="mr-1" /> Upload
                  <input type="file" multiple className="hidden" onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" />
                </label>
              </div>
              
              {application.documents?.length > 0 ? (
                <div className="space-y-2">
                  {application.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-primary-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">{doc.name}</p>
                          <p className="text-xs text-slate-500">
                            {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ''} • {format(new Date(doc.uploadedAt), 'dd MMM yyyy')}
                          </p>
                        </div>
                      </div>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.path}`} target="_blank" rel="noreferrer"
                        className="p-2 text-slate-400 hover:text-primary-600">
                        <Download size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-4">No documents uploaded yet</p>
              )}
            </div>

            {/* Completed Documents */}
            {application.completedDocuments?.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  Completed Documents
                </h2>
                <div className="space-y-2">
                  {application.completedDocuments.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-green-500" />
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{doc.name}</span>
                      </div>
                      <a href={`${process.env.NEXT_PUBLIC_API_URL}${doc.path}`} target="_blank" rel="noreferrer"
                        className="btn-primary btn-sm">
                        <Download size={14} className="mr-1" /> Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Application Info */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Application Details</h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Status</dt>
                  <dd><StatusBadge status={application.status} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Priority</dt>
                  <dd><StatusBadge status={application.priority} /></dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-slate-500">Created</dt>
                  <dd className="text-sm font-medium">{format(new Date(application.createdAt), 'dd MMM yyyy')}</dd>
                </div>
                {application.dueDate && (
                  <div className="flex justify-between">
                    <dt className="text-sm text-slate-500">Due Date</dt>
                    <dd className="text-sm font-medium">{format(new Date(application.dueDate), 'dd MMM yyyy')}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Assigned Employee */}
            {application.assignedEmployee && (
              <div className="card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Assigned CA</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
                    <User size={18} className="text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{application.assignedEmployee.name}</p>
                    <p className="text-xs text-slate-500">{application.assignedEmployee.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment */}
            <div className="card">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Payment</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Amount</span>
                  <span className="font-medium">₹{(application.payment?.total || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Status</span>
                  <StatusBadge status={application.payment?.status || 'pending'} />
                </div>
              </div>
            </div>

            {/* Notes */}
            {application.notes?.length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Notes</h3>
                <div className="space-y-2">
                  {application.notes.filter(n => !n.isInternal).map((note, i) => (
                    <div key={i} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{note.text}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {note.author?.name} • {format(new Date(note.createdAt), 'dd MMM')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
