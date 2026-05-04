import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { StatCard, PageLoading, StatusBadge } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import { ClipboardList, FileText, CheckCircle, Clock, AlertCircle, Calendar, Cake, X } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showBirthdayPopup, setShowBirthdayPopup] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const isBirthdayToday = (dob) => {
    if (!dob) return false;
    const today = new Date();
    const d = new Date(dob);
    return d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  };

  const fetchData = async () => {
    try {
      const [dashData, tasksData, appsData, profileData] = await Promise.all([
        api.getEmployeeDashboard(),
        api.getMyTasks(),
        api.getApplications({ limit: 5 }),
        api.getMyProfile().catch(() => null),
      ]);
      setStats(dashData);
      setTasks(tasksData.tasks || []);
      setApplications(appsData.applications || []);
      if (profileData?.user) {
        setProfile(profileData.user);
        if (isBirthdayToday(profileData.user.dob)) {
          // Show popup only once per session
          const key = `birthday_shown_${new Date().getFullYear()}`;
          if (typeof window !== 'undefined' && !sessionStorage.getItem(key)) {
            setShowBirthdayPopup(true);
            sessionStorage.setItem(key, '1');
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Birthday popup */}
        <AnimatePresence>
          {showBirthdayPopup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center overflow-hidden">
                <button onClick={() => setShowBirthdayPopup(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={20} />
                </button>
                {/* Confetti-like decorations */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500" />
                <div className="text-6xl mb-4 animate-bounce">🎂</div>
                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent mb-2">
                  Happy Birthday!
                </h2>
                <p className="text-slate-700 dark:text-slate-300 font-semibold text-lg mb-3">
                  {user?.name || 'You'} 🎉
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                  Wishing you a wonderful birthday filled with joy, happiness, and success! The entire Tax CareerXera family celebrates with you today! 🌟
                </p>
                <div className="flex gap-2 justify-center text-2xl mb-6">
                  {['🎈', '🎁', '🥳', '🎊', '🌟'].map((e, i) => (
                    <motion.span key={i} animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, delay: i * 0.2, duration: 1.5 }}>{e}</motion.span>
                  ))}
                </div>
                <button onClick={() => setShowBirthdayPopup(false)}
                  className="btn-primary w-full justify-center py-3 bg-gradient-to-r from-pink-500 to-purple-600 border-0 hover:from-pink-600 hover:to-purple-700">
                  Thank You! 💙
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome, {user?.name}!</h1>
          <p className="text-slate-500 mt-1">
            <span className="inline-flex items-center gap-1">
              <span className="capitalize font-medium text-primary-600">{user?.role}</span>
              {user?.designation && <span>· {user.designation}</span>}
              {user?.department && <span>· {user.department}</span>}
            </span>
            {' '}· Here&apos;s your work overview
          </p>
        </div>

        {/* Profile info strip */}
        {profile && (profile.joiningDate || profile.dob) && (
          <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            {profile.joiningDate && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar size={15} className="text-primary-500" />
                <span>Joined: <span className="font-medium text-slate-800 dark:text-slate-200">{format(new Date(profile.joiningDate), 'dd MMM yyyy')}</span></span>
              </div>
            )}
            {profile.dob && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Cake size={15} className={isBirthdayToday(profile.dob) ? 'text-pink-500' : 'text-slate-400'} />
                <span>Birthday: <span className={`font-medium ${isBirthdayToday(profile.dob) ? 'text-pink-600 dark:text-pink-400' : 'text-slate-800 dark:text-slate-200'}`}>
                  {format(new Date(profile.dob), 'dd MMM')}
                  {isBirthdayToday(profile.dob) && ' 🎂 Today!'}
                </span></span>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={ClipboardList} label="Total Tasks" value={totalTasks} color="blue" />
          <StatCard icon={Clock} label="Pending" value={pendingTasks} color="yellow" />
          <StatCard icon={AlertCircle} label="In Progress" value={inProgressTasks} color="purple" />
          <StatCard icon={CheckCircle} label="Completed" value={completedTasks} color="green" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tasks */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">My Tasks</h2>
              <Link href="/employee/tasks" className="text-primary-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {tasks.slice(0, 5).map(task => (
                <div key={task._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-slate-900 dark:text-white">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.application?.applicationId || ''} {task.dueDate ? `• Due: ${format(new Date(task.dueDate), 'dd MMM')}` : ''}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
              {tasks.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No tasks assigned yet</p>}
            </div>
          </div>

          {/* Assigned Applications */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Assigned Applications</h2>
              <Link href="/employee/applications" className="text-primary-600 text-sm font-medium hover:underline">View All</Link>
            </div>
            <div className="space-y-3">
              {applications.slice(0, 5).map(app => (
                <div key={app._id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm text-primary-600">{app.applicationId}</p>
                    <p className="text-xs text-slate-500">{app.service?.name} • {app.client?.name}</p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
              {applications.length === 0 && <p className="text-sm text-slate-500 text-center py-4">No applications assigned yet</p>}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
