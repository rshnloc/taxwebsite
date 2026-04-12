import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Shield, CheckCircle, Star, Users, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success('Welcome back!');
      switch (user.role) {
        case 'admin': router.push('/admin'); break;
        case 'employee': router.push('/employee'); break;
        default: router.push('/dashboard');
      }
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-700 to-blue-900 items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
        <div className="relative max-w-lg">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link href="/" className="inline-flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center border border-white/20">
                <span className="text-white font-extrabold text-xl">H</span>
              </div>
              <span className="text-2xl font-extrabold text-white">Helpshack</span>
            </Link>
            <h2 className="text-4xl font-extrabold text-white mb-6 leading-tight">
              Your Trusted Partner for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Tax & Compliance</span>
            </h2>
            <p className="text-primary-100 text-lg mb-10 leading-relaxed">
              Access your dashboard, track applications, chat with experts, and manage all your CA services in one place.
            </p>
            <div className="space-y-4">
              {[
                { icon: Shield, text: 'Bank-grade security for your data' },
                { icon: CheckCircle, text: 'Real-time application tracking' },
                { icon: Star, text: 'Trusted by 1000+ businesses' },
                { icon: Users, text: 'Expert CA team at your service' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3 text-white/80">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                    <item.icon size={16} />
                  </div>
                  <span className="text-sm">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-extrabold text-xl">H</span>
              </div>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white">Helpshack</span>
            </Link>
          </div>

          <div className="text-center mb-8">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-4">
              <Sparkles size={14} className="text-primary-600" />
              <span className="text-xs font-semibold text-primary-600">Welcome Back</span>
            </motion.div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Sign In</h1>
            <p className="text-slate-500 mt-2">Enter your credentials to access your account</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="input pl-10" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={e => setPassword(e.target.value)} className="input pl-10 pr-10" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="btn-primary w-full justify-center text-base py-3.5">
                {loading ? <span className="spinner w-5 h-5" /> : <span className="flex items-center gap-2">Sign In <ArrowRight size={18} /></span>}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                {"Don't have an account? "}
                <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">Create Account</Link>
              </p>
            </div>
          </div>

          {/* Demo credentials */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Demo Accounts</p>
            <div className="space-y-2">
              {[
                { role: 'Admin', email: 'admin@helpshack.in', pass: 'admin123' },
                { role: 'Employee', email: 'employee@helpshack.in', pass: 'employee123' },
                { role: 'Client', email: 'client@helpshack.in', pass: 'client123' },
              ].map(d => (
                <button key={d.role} type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-700 transition-colors text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{d.role}</span>
                  <span className="text-slate-400">{d.email}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
