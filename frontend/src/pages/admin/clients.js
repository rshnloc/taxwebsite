import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading, EmptyState, Modal } from '../../components/ui';
import api from '../../lib/api';
import { Users, Search, Mail, Phone, Eye, Ban, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => { fetchClients(); }, [page]);

  const fetchClients = async () => {
    try {
      const data = await api.getUsers({ role: 'client', page, limit: 15 });
      setClients(data.users || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, isActive) => {
    try {
      await api.updateUser(userId, { isActive: !isActive });
      toast.success(`Client ${!isActive ? 'activated' : 'deactivated'}`);
      fetchClients();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filtered = clients.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search)
  );

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Clients</h1>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9 py-2 text-sm w-60"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No clients found" />
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(client => (
                    <tr key={client._id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-semibold">
                            {client.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{client.name}</span>
                        </div>
                      </td>
                      <td className="text-sm text-slate-500">{client.email}</td>
                      <td className="text-sm">{client.phone || '-'}</td>
                      <td className="text-sm">{client.companyName || '-'}</td>
                      <td className="text-sm text-slate-500">{format(new Date(client.createdAt), 'dd MMM yyyy')}</td>
                      <td>
                        <span className={`badge badge-${client.isActive !== false ? 'green' : 'red'}`}>
                          {client.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedClient(client); setShowDetailModal(true); }}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(client._id, client.isActive !== false)}
                            className={client.isActive !== false ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'}
                          >
                            {client.isActive !== false ? <Ban size={16} /> : <CheckCircle size={16} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-outline btn-sm">
                  <ChevronLeft size={16} /> Prev
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-outline btn-sm">
                  Next <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Client Detail Modal */}
        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Client Details">
          {selectedClient && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold">
                  {selectedClient.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedClient.name}</h3>
                  <p className="text-sm text-slate-500">{selectedClient.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-slate-500">Phone:</span> <strong>{selectedClient.phone || '-'}</strong></div>
                <div><span className="text-slate-500">Company:</span> <strong>{selectedClient.companyName || '-'}</strong></div>
                <div><span className="text-slate-500">PAN:</span> <strong>{selectedClient.pan || '-'}</strong></div>
                <div><span className="text-slate-500">GST:</span> <strong>{selectedClient.gstNumber || '-'}</strong></div>
                <div className="col-span-2">
                  <span className="text-slate-500">Address:</span>
                  <p className="mt-1">{selectedClient.address ? `${selectedClient.address.street}, ${selectedClient.address.city}, ${selectedClient.address.state} - ${selectedClient.address.pincode}` : '-'}</p>
                </div>
                <div><span className="text-slate-500">Joined:</span> <strong>{format(new Date(selectedClient.createdAt), 'dd MMM yyyy')}</strong></div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
