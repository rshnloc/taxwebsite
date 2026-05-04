import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Mail, Lock, Eye, EyeOff, KeyRound, ArrowRight, ArrowLeft, CheckCircle2, Shield } from 'lucide-react';
import api from '../lib/api';

const STEPS = { EMAIL: 'email', OTP: 'otp', NEW_PASSWORD: 'new_password', SUCCESS: 'success' };

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      toast.success('OTP sent to your email!');
      setStep(STEPS.OTP);
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) { toast.error('Enter the 6-digit OTP'); return; }
    setStep(STEPS.NEW_PASSWORD);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await api.resetPassword(email, otp, newPassword);
      toast.success('Password reset successfully!');
      setStep(STEPS.SUCCESS);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
      setStep(STEPS.OTP); // go back to OTP step
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-700 to-blue-900 items-center justify-center p-12">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-10 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
        <div className="relative max-w-lg text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="w-24 h-24 bg-white/10 backdrop-blur rounded-3xl flex items-center justify-center border border-white/20 mx-auto mb-8">
              <Shield size={48} className="text-white" />
            </div>
            <h2 className="text-4xl font-extrabold text-white mb-4">Secure Password Reset</h2>
            <p className="text-primary-100 text-lg leading-relaxed">
              We&apos;ll send a one-time password to your email. Enter it here to reset your password securely.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-slate-900 px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-extrabold text-lg">H</span>
              </div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">Helpshack</span>
            </Link>
          </div>

          {/* Progress indicator */}
          {step !== STEPS.SUCCESS && (
            <div className="flex items-center gap-2 mb-8">
              {[STEPS.EMAIL, STEPS.OTP, STEPS.NEW_PASSWORD].map((s, i) => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    step === s ? 'bg-primary-600 text-white shadow-lg shadow-primary-200' :
                    [STEPS.OTP, STEPS.NEW_PASSWORD, STEPS.SUCCESS].indexOf(step) > i ? 'bg-green-500 text-white' :
                    'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>{[STEPS.OTP, STEPS.NEW_PASSWORD, STEPS.SUCCESS].indexOf(step) > i ? <CheckCircle2 size={14} /> : i + 1}</div>
                  {i < 2 && <div className={`flex-1 h-0.5 rounded ${[STEPS.OTP, STEPS.NEW_PASSWORD, STEPS.SUCCESS].indexOf(step) > i ? 'bg-green-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
                </div>
              ))}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Email */}
            {step === STEPS.EMAIL && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-4">
                    <KeyRound size={14} className="text-primary-600" />
                    <span className="text-xs font-semibold text-primary-600">Password Recovery</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Forgot Password?</h1>
                  <p className="text-slate-500 mt-2 text-sm">Enter your registered email address and we&apos;ll send you an OTP to reset your password.</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                  <form onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <label className="label">Email Address</label>
                      <div className="relative">
                        <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                          className="input pl-10" placeholder="you@example.com" />
                      </div>
                    </div>
                    <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="btn-primary w-full justify-center text-base py-3.5">
                      {loading ? <span className="spinner w-5 h-5" /> : <span className="flex items-center gap-2">Send OTP <ArrowRight size={18} /></span>}
                    </motion.button>
                  </form>
                  <div className="mt-5 text-center">
                    <Link href="/login" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600 transition-colors">
                      <ArrowLeft size={14} /> Back to Login
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: OTP */}
            {step === STEPS.OTP && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-green-50 dark:bg-green-900/20 rounded-full mb-4">
                    <Mail size={14} className="text-green-600" />
                    <span className="text-xs font-semibold text-green-600">OTP Sent</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Enter OTP</h1>
                  <p className="text-slate-500 mt-2 text-sm">We&apos;ve sent a 6-digit OTP to <span className="font-semibold text-primary-600">{email}</span></p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                  <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div>
                      <label className="label">6-Digit OTP</label>
                      <input type="text" required maxLength={6} value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="input text-center text-2xl tracking-[0.5em] font-bold" placeholder="••••••" />
                      <p className="text-xs text-slate-400 mt-1.5">OTP is valid for 10 minutes</p>
                    </div>
                    <motion.button type="submit" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="btn-primary w-full justify-center text-base py-3.5">
                      <span className="flex items-center gap-2">Verify OTP <ArrowRight size={18} /></span>
                    </motion.button>
                  </form>
                  <div className="mt-5 text-center space-y-2">
                    <button onClick={() => { setOtp(''); handleSendOtp({ preventDefault: () => {} }); }}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      Resend OTP
                    </button>
                    <br />
                    <button onClick={() => setStep(STEPS.EMAIL)} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary-600">
                      <ArrowLeft size={14} /> Change email
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: New Password */}
            {step === STEPS.NEW_PASSWORD && (
              <motion.div key="newpass" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="text-center mb-8">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full mb-4">
                    <Lock size={14} className="text-purple-600" />
                    <span className="text-xs font-semibold text-purple-600">Set New Password</span>
                  </div>
                  <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">New Password</h1>
                  <p className="text-slate-500 mt-2 text-sm">Create a strong password for your account</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <div>
                      <label className="label">New Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input type={showPassword ? 'text' : 'password'} required minLength={8} value={newPassword}
                          onChange={e => setNewPassword(e.target.value)} className="input pl-10 pr-10" placeholder="Min. 8 characters" />
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
                        <input type={showConfirm ? 'text' : 'password'} required value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)} className="input pl-10 pr-10" placeholder="Repeat password" />
                        <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                      )}
                    </div>
                    <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                      className="btn-primary w-full justify-center text-base py-3.5">
                      {loading ? <span className="spinner w-5 h-5" /> : <span className="flex items-center gap-2">Reset Password <ArrowRight size={18} /></span>}
                    </motion.button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === STEPS.SUCCESS && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}
                  className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={48} className="text-green-500" />
                </motion.div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-3">Password Reset!</h2>
                <p className="text-slate-500 mb-8">Your password has been successfully reset. You can now log in with your new password.</p>
                <Link href="/login">
                  <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="btn-primary inline-flex items-center gap-2 px-8 py-3.5">
                    Go to Login <ArrowRight size={18} />
                  </motion.span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
