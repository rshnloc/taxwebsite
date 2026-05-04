import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { PageLoading } from '../../components/ui';
import api from '../../lib/api';
import { CheckCircle, Clock, DollarSign, TrendingUp, Award, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export default function EmployeeStats() {
  const [loading, setLoading] = useState(true);
  const [myStats, setMyStats] = useState(null);
  const [allEmployees, setAllEmployees] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.getPerformanceStats();
        const all = res.employees || [];
        setAllEmployees(all);
        // find own stats — API only returns self for employee role
        if (all.length > 0) setMyStats(all[0]);
      } catch {}
      setLoading(false);
    })();
  }, []);

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const s = myStats;

  const trendData = (allEmployees[0]?.taskTrend || []).map(r => ({
    month: r.month,
    Completed: Number(r.completed),
  }));

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">My Performance</h1>
          <p className="text-slate-500 text-sm mt-0.5">Your task stats and revenue contribution</p>
        </div>

        {!s ? (
          <div className="text-center py-16 text-slate-400">
            <AlertCircle className="mx-auto mb-2" size={40} />
            <p>No performance data found</p>
          </div>
        ) : (
          <>
            {/* Score card */}
            <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-xl p-6 text-white flex flex-wrap items-center gap-6">
              <div>
                <p className="text-primary-200 text-sm">Performance Score</p>
                <p className="text-5xl font-bold">{s.score}</p>
              </div>
              <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{s.completedTasks}</p>
                  <p className="text-xs text-primary-200">Completed</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">{s.onTimePercent}%</p>
                  <p className="text-xs text-primary-200">On Time</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">₹{(s.revenue/1000).toFixed(0)}K</p>
                  <p className="text-xs text-primary-200">Revenue</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold">#{s.rank}</p>
                  <p className="text-xs text-primary-200">Rank</p>
                </div>
              </div>
            </div>

            {/* Detailed stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Total Tasks Assigned', value: s.totalTasks, icon: Clock, color: 'slate' },
                { label: 'Tasks Completed', value: s.completedTasks, icon: CheckCircle, color: 'green' },
                { label: 'Pending Tasks', value: s.pendingTasks, icon: AlertCircle, color: 'amber' },
                { label: 'On-Time Deliveries', value: s.onTimeTasks, icon: TrendingUp, color: 'blue' },
                { label: 'Delayed Tasks', value: s.delayedTasks, icon: AlertCircle, color: 'red' },
                { label: 'Revenue Generated', value: `₹${s.revenue.toLocaleString('en-IN')}`, icon: DollarSign, color: 'violet' },
              ].map(card => (
                <div key={card.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl bg-${card.color}-100 dark:bg-${card.color}-900/30 flex items-center justify-center shrink-0`}>
                    <card.icon className={`text-${card.color}-600`} size={20} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-800 dark:text-white">{card.value}</p>
                    <p className="text-xs text-slate-500">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* On-time ratio bar */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-3">On-Time Delivery Ratio</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                  <div className="h-4 rounded-full bg-green-500 flex items-center justify-end pr-2"
                    style={{ width: `${Math.min(s.onTimePercent, 100)}%`, transition: 'width 1s ease' }}>
                    <span className="text-white text-[10px] font-bold">{s.onTimePercent}%</span>
                  </div>
                </div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{s.onTimeTasks} / {s.completedTasks}</span>
              </div>
              <div className="flex gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> On-time: {s.onTimeTasks}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Delayed: {s.delayedTasks}</span>
              </div>
            </div>

            {/* Rank among team */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h3 className="font-semibold text-slate-700 dark:text-slate-200 mb-1 flex items-center gap-2">
                <Award size={16} className="text-amber-500" /> Your Ranking
              </h3>
              <p className="text-slate-400 text-sm mb-4">Based on composite score (tasks × 0.4 + revenue × 0.3 + on-time% × 0.3)</p>
              <p className="text-4xl font-bold text-primary-600">#{s.rank} <span className="text-lg text-slate-400">of {allEmployees.length}</span></p>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
