export function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <div className={`spinner ${sizes[size]}`} />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4" />
        <p className="text-slate-500">Loading...</p>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="text-center py-16">
      {Icon && (
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Icon size={28} className="text-slate-400" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      {description && <p className="text-slate-500 mb-4">{description}</p>}
      {action}
    </div>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    'submitted': 'badge-blue',
    'under-review': 'badge-yellow',
    'in-progress': 'badge-purple',
    'pending-documents': 'badge-yellow',
    'completed': 'badge-green',
    'rejected': 'badge-red',
    'cancelled': 'badge-gray',
    'pending': 'badge-yellow',
    'review': 'badge-purple',
    'on-hold': 'badge-gray',
    'paid': 'badge-green',
    'overdue': 'badge-red',
    'draft': 'badge-gray',
    'sent': 'badge-blue',
    'partial': 'badge-yellow',
    'low': 'badge-gray',
    'medium': 'badge-blue',
    'high': 'badge-yellow',
    'urgent': 'badge-red',
  };

  return (
    <span className={styles[status] || 'badge-gray'}>
      {status?.replace(/-/g, ' ')}
    </span>
  );
}

export function StatCard({ icon: Icon, label, value, trend, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="stat-card">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        {trend && <p className="text-xs text-green-600">{trend}</p>}
      </div>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl ${sizes[size]} w-full max-h-[90vh] overflow-y-auto animate-scale-in`}>
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
