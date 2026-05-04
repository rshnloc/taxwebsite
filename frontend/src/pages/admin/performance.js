import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import api from '../../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, ResponsiveContainer, Cell
} from 'recharts';
import { Trophy, TrendingUp, TrendingDown, Download, RefreshCw, Star, Users, CheckCircle, Clock, DollarSign } from 'lucide-react';

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];
const PRESET_RANGES = [
  { label: 'This Month', getValue: () => { const d = new Date(); return { startDate: new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0,10), endDate: d.toISOString().slice(0,10) }; } },
  { label: 'Last Month', getValue: () => { const d = new Date(); const f = new Date(d.getFullYear(), d.getMonth()-1, 1); const l = new Date(d.getFullYear(), d.getMonth(), 0); return { startDate: f.toISOString().slice(0,10), endDate: l.toISOString().slice(0,10) }; } },
  { label: 'This Quarter', getValue: () => { const d = new Date(); const q = Math.floor(d.getMonth()/3); const f = new Date(d.getFullYear(), q*3, 1); return { startDate: f.toISOString().slice(0,10), endDate: d.toISOString().slice(0,10) }; } },
  { label: 'All Time', getValue: () => ({ startDate: '', endDate: '' }) },
];

export default function AdminPerformance() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [activePreset, setActivePreset] = useState('All Time');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [exporting, setExporting] = useState('');

  const load = useCallback(async (sd, ed) => {
    setLoading(true);
    try {
      const params = {};
      if (sd) params.startDate = sd;
      if (ed) params.endDate = ed;
      const res = await api.getPerformanceStats(params);
      setData(res);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load('', ''); }, [load]);

  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    const { startDate: sd, endDate: ed } = preset.getValue();
    setStartDate(sd); setEndDate(ed);
    load(sd, ed);
  };

  const applyCustom = () => {
    setActivePreset('Custom');
    load(startDate, endDate);
  };

  const handleExport = async (type) => {
    setExporting(type);
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (type === 'csv') await api.exportPerformanceCSV(params);
      else await api.exportPerformancePDF(params);
    } catch {}
    setExporting('');
  };

  const employees = data?.employees || [];
  const eotm = data?.eotm;

  const chartTaskData = employees.slice(0, 10).map(e => ({
    name: e.name.split(' ')[0],
    Completed: e.completedTasks,
    Pending: e.pendingTasks,
  }));
  const chartRevenueData = employees.slice(0, 10).map(e => ({
    name: e.name.split(' ')[0],
    Revenue: e.revenue,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Employee Performance</h1>
            <p className="text-slate-500 text-sm mt-0.5">Track task completion, revenue, and on-time delivery</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} disabled={!!exporting}
              className="btn-outline flex items-center gap-2 text-sm">
              <Download size={15} /> {exporting === 'csv' ? 'Downloading…' : 'Export CSV'}
            </button>
            <button onClick={() => handleExport('pdf')} disabled={!!exporting}
              className="btn-primary flex items-center gap-2 text-sm">
              <Download size={15} /> {exporting === 'pdf' ? 'Downloading…' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
          <div className="flex flex-wrap gap-2 items-center">
            {PRESET_RANGES.map(p => (
              <button key={p.label} onClick={() => applyPreset(p)}
                className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${activePreset === p.label ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                {p.label}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-auto">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field py-1.5 text-sm" />
              <span className="text-slate-400 text-sm">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field py-1.5 text-sm" />
              <button onClick={applyCustom} className="btn-outline py-1.5 px-3 text-sm flex items-center gap-1">
                <RefreshCw size={14} /> Apply
              </button>
            </div>
          </div>
        </div>

        {loading ? <PageLoading /> : (
          <>
            {/* EOTM Banner */}
            {eotm && (
              <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-xl p-5 shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <Trophy className="text-white" size={32} />
                  </div>
                  <div>
                    <p className="text-amber-900 text-sm font-semibold uppercase tracking-wide">🏆 Employee of the Month</p>
                    <p className="text-2xl font-bold text-white">{eotm.name}</p>
                    <p className="text-amber-900 text-sm">{eotm.designation || eotm.department || ''}</p>
                  </div>
                  <div className="ml-auto hidden sm:grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-3xl font-bold text-white">{eotm.completedTasks}</p>
                      <p className="text-amber-900 text-xs">Tasks Done</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">{eotm.onTimePercent}%</p>
                      <p className="text-amber-900 text-xs">On Time</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-white">₹{(eotm.revenue/1000).toFixed(0)}K</p>
                      <p className="text-amber-900 text-xs">Revenue</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Employees', value: employees.length, icon: Users, color: 'blue' },
                { label: 'Total Completed', value: employees.reduce((s,e) => s + e.completedTasks, 0), icon: CheckCircle, color: 'green' },
                { label: 'Avg On-Time %', value: employees.length ? (employees.reduce((s,e) => s + e.onTimePercent, 0) / employees.length).toFixed(1) + '%' : '—', icon: Clock, color: 'amber' },
                { label: 'Total Revenue', value: '₹' + (employees.reduce((s,e) => s + e.revenue, 0)/1000).toFixed(0) + 'K', icon: DollarSign, color: 'violet' },
              ].map(card => (
                <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                  <div className={`w-9 h-9 rounded-lg bg-${card.color}-100 dark:bg-${card.color}-900/30 flex items-center justify-center mb-2`}>
                    <card.icon className={`text-${card.color}-600`} size={18} />
                  </div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-white">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" /> Task Completion by Employee
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartTaskData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Completed" fill="#10b981" radius={[4,4,0,0]} />
                    <Bar dataKey="Pending" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <DollarSign size={16} className="text-blue-500" /> Revenue by Employee (₹)
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartRevenueData} margin={{ left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `₹${v.toLocaleString('en-IN')}`} />
                    <Bar dataKey="Revenue" radius={[4,4,0,0]}>
                      {chartRevenueData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue trend */}
            {(data?.revenueTrend || []).length > 0 && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
                <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2">
                  <TrendingUp size={16} className="text-primary-500" /> Monthly Revenue Trend
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.revenueTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Leaderboard */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-200">Performance Leaderboard</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/50">
                      {['Rank','Employee','Dept','Total','Done','Pending','On-Time','Delayed','On-Time %','Revenue','Score'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((e, i) => (
                      <tr key={e.id} className={`border-t border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30 ${i === 0 ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-300 text-slate-700' : i === 2 ? 'bg-orange-300 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}>{e.rank}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-700 dark:text-slate-200">{e.name}</p>
                          <p className="text-xs text-slate-400">{e.designation || ''}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{e.department || '—'}</td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{e.totalTasks}</td>
                        <td className="px-4 py-3 text-green-600 font-medium">{e.completedTasks}</td>
                        <td className="px-4 py-3 text-amber-500">{e.pendingTasks}</td>
                        <td className="px-4 py-3 text-blue-500">{e.onTimeTasks}</td>
                        <td className="px-4 py-3 text-red-500">{e.delayedTasks}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-green-500" style={{ width: `${Math.min(e.onTimePercent, 100)}%` }} />
                            </div>
                            <span className="text-xs font-medium">{e.onTimePercent}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">
                          ₹{e.revenue.toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold">
                            {e.score}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr><td colSpan={11} className="text-center py-10 text-slate-400">No performance data found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
