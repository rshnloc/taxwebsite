import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Bell, Check, CheckCheck, FolderOpen, MessageSquare, ClipboardList, Receipt, Info, X } from 'lucide-react';
import api from '../lib/api';
import { formatDistanceToNow } from 'date-fns';

const TYPE_ICON = {
  application: FolderOpen,
  chat:        MessageSquare,
  task:        ClipboardList,
  invoice:     Receipt,
};

const TYPE_COLOR = {
  application: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  chat:        'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  task:        'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
  invoice:     'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20',
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  // Poll unread count every 30s
  const fetchCount = useCallback(async () => {
    try {
      const data = await api.getUnreadCount();
      setUnreadCount(data.count ?? 0);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30000);
    return () => clearInterval(id);
  }, [fetchCount]);

  // Fetch full list when panel opens
  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.getNotifications()
      .then(data => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target) &&
          buttonRef.current && !buttonRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleClick = async (n) => {
    if (!n.isRead) {
      try {
        await api.markNotificationRead(n.id);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
        setUnreadCount(c => Math.max(0, c - 1));
      } catch (_) {}
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const handleMarkAll = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(x => ({ ...x, isRead: true })));
      setUnreadCount(0);
    } catch (_) {}
  };

  const unread = notifications.filter(n => !n.isRead);
  const read   = notifications.filter(n =>  n.isRead);

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-12 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden flex flex-col"
          style={{ maxHeight: '520px' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  title="Mark all as read"
                >
                  <CheckCheck size={13} /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell size={32} className="mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <>
                {unread.length > 0 && (
                  <div>
                    <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">New</p>
                    {unread.map(n => <NotifItem key={n.id} n={n} onClick={handleClick} />)}
                  </div>
                )}
                {read.length > 0 && (
                  <div>
                    {unread.length > 0 && <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Earlier</p>}
                    {read.slice(0, 15).map(n => <NotifItem key={n.id} n={n} onClick={handleClick} />)}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifItem({ n, onClick }) {
  const Icon = TYPE_ICON[n.type] || Info;
  const colorClass = TYPE_COLOR[n.type] || 'text-slate-500 bg-slate-100 dark:bg-slate-700';
  let timeAgo = '';
  try { timeAgo = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }); } catch (_) {}

  return (
    <button
      onClick={() => onClick(n)}
      className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-700/50 ${!n.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
    >
      <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${colorClass}`}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-tight ${n.isRead ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
            {n.title}
          </p>
          {!n.isRead && <span className="mt-1 w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />}
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{timeAgo}</p>
      </div>
    </button>
  );
}
