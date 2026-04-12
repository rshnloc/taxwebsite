import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowRight, Shield, CheckCircle, Star, Users, Sparkles, Zap } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success('Account created successfully!');
      router.push('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
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
              Start Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Compliance Journey</span>
              {' '}Today
            </h2>
            <p className="text-primary-100 text-lg mb-10 leading-relaxed">
              Create your free account and get access to expert CA services, real-time tracking, and a personalized dashboard.
            </p>
            <div className="space-y-4">
              {[
                { icon: Zap, text: 'Get started in under 2 minutes' },
                { icon: Shield, text: 'Your data is 100% secure' },
                { icon: CheckCircle, text: 'Free account — no credit card needed' },
                { icon: Star, text: 'First consultation is absolutely free' },
                { icon: Users, text: 'Dedicated CA assigned to you' },
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

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-md">
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
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full mb-4">
              <Sparkles size={14} className="text-green-600" />
              <span className="text-xs font-semibold text-green-600">Free Forever</span>
            </motion.div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Create Account</h1>
            <p className="text-slate-500 mt-2">Join Helpshack for expert CA services</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="name" type="text" required value={form.name} onChange={handleChange}
                    className="input pl-10" placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label className="label">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="email" type="email" required value={form.email} onChange={handleChange}
                    className="input pl-10" placeholder="you@example.com" />
                </div>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                    className="input pl-10" placeholder="+91 9876543210" />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="password" type={showPassword ? 'text' : 'password'} required minLength={6}
                    value={form.password} onChange={handleChange} className="input pl-10 pr-10" placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="label">Confirm Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input name="confirmPassword" type="password" required value={form.confirmPassword}
                    onChange={handleChange} className="input pl-10" placeholder="Confirm password" />
                </div>
              </div>
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                className="btn-primary w-full justify-center text-base py-3.5">
                {loading ? <span className="spinner w-5 h-5" /> : <span className="flex items-center gap-2">Create Account <ArrowRight size={18} /></span>}
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">Sign In</Link>
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center mt-4">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
