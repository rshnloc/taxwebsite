import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { User, Mail, Phone, Lock, Building2, CreditCard, MapPin, FileText, CheckCircle, ArrowRight, ArrowLeft, Handshake } from 'lucide-react';

const STEPS = [
  { title: 'Personal Info', icon: User },
  { title: 'Firm Details', icon: Building2 },
  { title: 'Address & About', icon: MapPin },
  { title: 'Review & Submit', icon: CheckCircle },
];

// Defined OUTSIDE component so React never remounts inputs on re-render
const InputField = ({ label, icon: Icon, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
    <div className="relative">
      {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
      <input
        {...props}
        className={`w-full ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent`}
      />
    </div>
  </div>
);

export default function RegisterPartner() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    firmName: '', pan: '', gst: '', aadhaar: '',
    city: '', state: '', about: '',
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.name.trim()) return 'Full name is required';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'Valid email is required';
      if (!form.phone.trim()) return 'Phone number is required';
      if (form.password.length < 8) return 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
    }
    if (step === 1) {
      if (!form.firmName.trim()) return 'Firm / Business name is required';
    }
    if (step === 2) {
      if (!form.city.trim()) return 'City is required';
      if (!form.state.trim()) return 'State is required';
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.registerPartner({
        name: form.name, email: form.email, phone: form.phone, password: form.password,
        firmName: form.firmName, pan: form.pan, gst: form.gst, aadhaar: form.aadhaar,
        city: form.city, state: form.state, about: form.about,
      });
      setSubmitted(true);
    } catch (e) {
      toast.error(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Application Submitted! 🎉</h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">Your Associates Partner application has been received. Our team will review it and get back to you within 2-3 business days.</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">A confirmation email has been sent to <strong>{form.email}</strong>.</p>
          <Link href="/login" className="btn-primary inline-flex items-center gap-2">
            <ArrowRight size={16} /> Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
              <Handshake size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">Tax CareerXera</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Become an Associates Partner</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Join our network and earn by referring clients</p>
        </motion.div>

        {/* Step Indicators */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${i < step ? 'bg-green-500 text-white' : i === step ? 'bg-primary-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                {i < step ? <CheckCircle size={16} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && <div className={`w-12 h-0.5 mx-1 transition-all ${i < step ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">{STEPS[step].title}</h2>

          {step === 0 && (
            <div className="space-y-4">
              <InputField label="Full Name *" icon={User} type="text" placeholder="Your full name" value={form.name} onChange={set('name')} />
              <InputField label="Email Address *" icon={Mail} type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} />
              <InputField label="Phone Number *" icon={Phone} type="tel" placeholder="10-digit mobile number" value={form.phone} onChange={set('phone')} />
              <InputField label="Password *" icon={Lock} type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} />
              <InputField label="Confirm Password *" icon={Lock} type="password" placeholder="Repeat your password" value={form.confirmPassword} onChange={set('confirmPassword')} />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <InputField label="Firm / Business Name *" icon={Building2} type="text" placeholder="Your firm or business name" value={form.firmName} onChange={set('firmName')} />
              <InputField label="PAN Number" icon={CreditCard} type="text" placeholder="ABCDE1234F" value={form.pan} onChange={set('pan')} maxLength={10} />
              <InputField label="GST Number" icon={FileText} type="text" placeholder="22AAAAA0000A1Z5" value={form.gst} onChange={set('gst')} />
              <InputField label="Aadhaar Number" icon={CreditCard} type="text" placeholder="12-digit Aadhaar" value={form.aadhaar} onChange={set('aadhaar')} maxLength={12} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="City" icon={MapPin} type="text" placeholder="Your city" value={form.city} onChange={set('city')} />
                <InputField label="State" icon={MapPin} type="text" placeholder="Your state" value={form.state} onChange={set('state')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">About You / Your Business</label>
                <textarea
                  rows={4}
                  placeholder="Tell us about your business, experience, and how you plan to refer clients..."
                  value={form.about}
                  onChange={set('about')}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-5 space-y-3 text-sm">
                {[
                  ['Name', form.name], ['Email', form.email], ['Phone', form.phone],
                  ['Firm Name', form.firmName], ['PAN', form.pan || '—'], ['GST', form.gst || '—'],
                  ['Aadhaar', form.aadhaar || '—'], ['City', form.city || '—'], ['State', form.state || '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{label}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{val}</span>
                  </div>
                ))}
              </div>
              {form.about && (
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                  <p className="text-xs text-slate-500 mb-1">About</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{form.about}</p>
                </div>
              )}
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">By submitting, you agree to our Terms of Service and Partner Agreement.</p>
            </div>
          )}

          <div className="flex justify-between mt-8">
            {step > 0 ? (
              <button onClick={() => setStep(s => s - 1)} className="btn-outline inline-flex items-center gap-2">
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <Link href="/login" className="btn-outline inline-flex items-center gap-2">
                <ArrowLeft size={16} /> Back to Login
              </Link>
            )}

            {step < STEPS.length - 1 ? (
              <button onClick={nextStep} className="btn-primary inline-flex items-center gap-2">
                Next <ArrowRight size={16} />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
                {loading ? 'Submitting...' : 'Submit Application'} <CheckCircle size={16} />
              </button>
            )}
          </div>
        </motion.div>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
          Already have an account? <Link href="/login" className="text-primary-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
