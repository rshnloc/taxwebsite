import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import api from '../../lib/api';
import { BarChart3, Download, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

export default function AdminReports() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    try {
      const data = await api.getDashboardStats();
      setStats(data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const { totalClients = 0, totalEmployees = 0, totalApplications = 0, completedApplications = 0, totalRevenue = 0, monthlyStats = [], statusDistribution = [], servicePopularity = [] } = stats || {};
  const avgRevenue = monthlyStats.length ? Math.round(totalRevenue / monthlyStats.length) : 0;
  const completionRate = totalApplications ? ((completedApplications / totalApplications) * 100).toFixed(1) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <p className="text-sm text-slate-500">Total Revenue</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-green-600 mt-1">Avg ₹{avgRevenue.toLocaleString('en-IN')}/month</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Total Applications</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalApplications}</p>
            <p className="text-xs text-slate-500 mt-1">{completedApplications} completed</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Completion Rate</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{completionRate}%</p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: `${completionRate}%` }}></div>
            </div>
          </div>
          <div className="card p-5">
            <p className="text-sm text-slate-500">Total Clients</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{totalClients}</p>
            <p className="text-xs text-slate-500 mt-1">{totalEmployees} employees</p>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyStats}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(val) => [`₹${val.toLocaleString('en-IN')}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Two column charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Comparison */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Monthly Applications vs Revenue</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="_id" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Applications" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue (₹)" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Status Distribution */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Application Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="count" nameKey="_id">
                  {statusDistribution?.map((entry, index) => <Cell key={entry._id} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                <Legend formatter={(value) => value.replace('-', ' ')} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Service Performance */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Service Performance</h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={servicePopularity} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Applications" />
              <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} name="Revenue (₹)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Data Table */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Service Summary Table</h2>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Service</th>
                  <th>Applications</th>
                  <th>Revenue</th>
                  <th>Avg. Revenue</th>
                </tr>
              </thead>
              <tbody>
                {servicePopularity?.map(svc => (
                  <tr key={svc.name}>
                    <td className="font-medium">{svc.name}</td>
                    <td>{svc.count}</td>
                    <td className="font-semibold">₹{(svc.revenue || 0).toLocaleString('en-IN')}</td>
                    <td>₹{svc.count ? Math.round((svc.revenue || 0) / svc.count).toLocaleString('en-IN') : '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
