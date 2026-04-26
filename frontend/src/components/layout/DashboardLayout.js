import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  LayoutDashboard, Users, FileText, ClipboardList, Settings, LogOut,
  MessageSquare, Receipt, Bell, BarChart3, Sun, Moon, ChevronLeft,
  Briefcase, FolderOpen, CreditCard, User, Building2, Shield, UserCheck
} from 'lucide-react';
import { useState } from 'react';

const adminLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/applications', label: 'Applications', icon: FolderOpen },
  { href: '/admin/clients', label: 'Clients', icon: Users },
  { href: '/admin/employees', label: 'Employees', icon: Briefcase },
  { href: '/admin/tasks', label: 'Tasks', icon: ClipboardList },
  { href: '/admin/services', label: 'Services', icon: FileText },
  { href: '/admin/invoices', label: 'Invoices', icon: Receipt },
  { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin/chat', label: 'Messages', icon: MessageSquare },
  { href: '/admin/roles', label: 'Roles & Permissions', icon: Shield },
  { href: '/admin/client-types', label: 'Client Types', icon: Building2 },
  { href: '/admin/rm-assignments', label: 'RM Assignments', icon: UserCheck },
];

const employeeLinks = [
  { href: '/employee', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/employee/tasks', label: 'My Tasks', icon: ClipboardList },
  { href: '/employee/applications', label: 'Applications', icon: FolderOpen },
  { href: '/employee/chat', label: 'Messages', icon: MessageSquare },
];

const clientLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/applications', label: 'My Applications', icon: FolderOpen },
  { href: '/dashboard/apply', label: 'New Application', icon: FileText },
  { href: '/dashboard/invoices', label: 'Invoices', icon: Receipt },
  { href: '/dashboard/chat', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
];

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links = user.role === 'admin' ? adminLinks : user.role === 'employee' ? employeeLinks : clientLinks;

  const Sidebar = ({ mobile = false }) => (
    <aside className={`${mobile ? 'w-72' : collapsed ? 'w-20' : 'w-64'} bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full transition-all duration-300`}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
        {!collapsed && (
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">H</span>
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">Helpshack</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold">H</span>
          </div>
        )}
        {!mobile && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hidden lg:block"
          >
            <ChevronLeft size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {links.map(link => {
          const isActive = router.pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
              onClick={() => mobile && setMobileOpen(false)}
              title={collapsed ? link.label : ''}
            >
              <Icon size={20} />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-700 space-y-1">
        <button onClick={toggleTheme} className="sidebar-link w-full">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          {!collapsed && <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>
        <button onClick={logout} className="sidebar-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10">
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className="relative z-50">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <LayoutDashboard size={20} />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white capitalize">
                {router.pathname.split('/').pop() || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`${user.role === 'admin' ? '/admin' : user.role === 'employee' ? '/employee' : '/dashboard'}/chat`}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 relative"
            >
              <Bell size={20} />
            </Link>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-700">
              <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
                  {user.name?.charAt(0)}
                </span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 capitalize">{user.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
