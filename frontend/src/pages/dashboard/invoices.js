import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatusBadge, PageLoading, EmptyState } from '../../components/ui';
import api from '../../lib/api';
import { Receipt, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchInvoices(); }, []);

  const fetchInvoices = async () => {
    try {
      const data = await api.getMyInvoices();
      setInvoices(data.invoices);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (id) => {
    window.open(`${process.env.NEXT_PUBLIC_API_URL}/api/invoices/${id}/pdf`, '_blank');
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Invoices</h1>

        {invoices.length === 0 ? (
          <EmptyState icon={Receipt} title="No invoices yet" description="Invoices will appear here once generated" />
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv._id}>
                    <td className="font-medium">{inv.invoiceNumber}</td>
                    <td>{format(new Date(inv.createdAt), 'dd MMM yyyy')}</td>
                    <td className="font-semibold">₹{inv.total.toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={inv.status} /></td>
                    <td>
                      <button onClick={() => downloadPDF(inv._id)} className="btn-primary btn-sm">
                        <Download size={14} className="mr-1" /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
