import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, useInView, useAnimation, AnimatePresence } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import {
  ArrowRight, CheckCircle, Shield, Clock, Users, Star, Phone,
  FileText, Building2, Award, Globe, Receipt, BarChart3, Wallet,
  Heart, Store, Factory, ChevronRight, ChevronDown,
  Zap, TrendingUp, Headphones, IndianRupee, Calculator,
  BookOpen, Scale, Landmark, Briefcase, FileCheck, UserCheck,
  ArrowUpRight, Play, MessageCircle, CalendarDays, Lock,
  Sparkles, Target, BadgeCheck
} from 'lucide-react';

/* ─── Animated Counter Hook ─── */
function useCounter(end, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, end, duration]);

  return { count, ref };
}

/* ─── Animation Variants ─── */
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const fadeInRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
};

/* ─── Section Wrapper with scroll animation ─── */
function AnimatedSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay, ease: 'easeOut' } }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Data ─── */
const services = [
  { name: 'Income Tax Filing', slug: 'income-tax', icon: Receipt, desc: 'ITR-1 to ITR-7, Tax Planning & Advisory', color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'GST Services', slug: 'gst', icon: FileText, desc: 'Registration, Returns, E-way Bills', color: 'from-green-500 to-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
  { name: 'Company Registration', slug: 'company-incorporation', icon: Building2, desc: 'Pvt Ltd, OPC, LLP, Section 8', color: 'from-purple-500 to-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { name: 'Trademark & IP', slug: 'trademarks', icon: Shield, desc: 'Brand Protection & Registration', color: 'from-orange-500 to-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { name: 'TDS Returns', slug: 'tds-returns', icon: Calculator, desc: 'TDS Filing & Compliance', color: 'from-red-500 to-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
  { name: 'Accounting & Bookkeeping', slug: 'balance-sheet', icon: BookOpen, desc: 'Balance Sheet, P&L, Ledger', color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
  { name: 'ISO Certification', slug: 'iso-certification', icon: Award, desc: 'Quality Standards Certification', color: 'from-teal-500 to-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  { name: 'MSME / Udyam', slug: 'msme-registration', icon: Factory, desc: 'MSME & Startup Registration', color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
  { name: 'Import Export Code', slug: 'import-export-code', icon: Globe, desc: 'IEC & DGFT Compliance', color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/20' },
  { name: 'Legal Compliance', slug: 'legal-compliance', icon: Scale, desc: 'ROC, Annual Filing, Audits', color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { name: 'Payroll Services', slug: 'payroll', icon: Wallet, desc: 'Salary Processing & PF/ESI', color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { name: 'Business Licensing', slug: 'fssai-license', icon: FileCheck, desc: 'FSSAI, Shop Act, Trade License', color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
];

const stats = [
  { label: 'Happy Clients', value: 1000, suffix: '+', icon: Users },
  { label: 'Services Delivered', value: 5000, suffix: '+', icon: FileCheck },
  { label: 'Years Experience', value: 10, suffix: '+', icon: Award },
  { label: 'Expert CAs', value: 15, suffix: '+', icon: UserCheck },
];

const testimonials = [
  { name: 'Rajesh Kumar', company: 'Kumar Enterprises', text: 'Helpshack made our GST filing effortless. Their team is incredibly professional and responsive. We saved 40% on our tax compliance costs.', rating: 5, service: 'GST Services' },
  { name: 'Priya Agarwal', company: 'Agarwal Foods Pvt Ltd', text: 'Got our company incorporated in just 10 days. The entire process was smooth and transparent. Highly recommend their services!', rating: 5, service: 'Company Registration' },
  { name: 'Amit Singh', company: 'Singh Logistics', text: 'Best CA service platform I have used. The dashboard makes tracking everything so easy. Real-time updates on all my applications.', rating: 5, service: 'Income Tax' },
  { name: 'Sneha Patel', company: 'SP Interiors', text: 'From trademark registration to annual compliance, Helpshack handles everything. Their expert team saved us from many legal complications.', rating: 5, service: 'Trademark & IP' },
  { name: 'Vikram Joshi', company: 'VJ Tech Solutions', text: 'The real-time chat feature is a game-changer. Got all my queries resolved instantly. Their CAs are knowledgeable and approachable.', rating: 5, service: 'TDS Returns' },
  { name: 'Deepika Sharma', company: 'Sharma Textiles', text: 'We have been using Helpshack for 3 years. The quality of service and attention to detail is unmatched. Truly a one-stop CA solution.', rating: 5, service: 'Accounting' },
];

const whyChooseUs = [
  { icon: Zap, title: 'Lightning Fast', desc: 'Get your work done 3x faster with our streamlined digital process and expert team.' },
  { icon: Shield, title: '100% Secure', desc: 'Bank-grade encryption and strict data privacy protocols protect your sensitive information.' },
  { icon: IndianRupee, title: 'Affordable Pricing', desc: 'Transparent pricing with no hidden charges. Save up to 40% compared to traditional CAs.' },
  { icon: Headphones, title: '24/7 Expert Support', desc: 'Get instant help from qualified CAs through chat, call, or email anytime.' },
  { icon: TrendingUp, title: 'Real-Time Tracking', desc: 'Track your application status in real-time through our intuitive dashboard.' },
  { icon: Target, title: '99.9% Accuracy', desc: 'Our expert CAs ensure error-free filing with multi-level quality checks.' },
];

const taxDeadlines = [
  { date: 'Jul 31', title: 'ITR Filing (No Audit)', desc: 'Individual / HUF / AOP / BOI' },
  { date: 'Oct 31', title: 'ITR Filing (Audit Cases)', desc: 'Companies & Audit cases' },
  { date: 'Nov 30', title: 'ITR (Transfer Pricing)', desc: 'Transfer pricing audit cases' },
  { date: 'Monthly', title: 'GST Returns', desc: 'GSTR-1, GSTR-3B filing' },
  { date: 'Quarterly', title: 'TDS Returns', desc: 'Form 24Q, 26Q, 27Q' },
  { date: 'Mar 15', title: 'Advance Tax', desc: 'Final installment payment' },
];

const faqs = [
  { q: 'What documents do I need for ITR filing?', a: 'You need PAN card, Aadhaar card, Form 16/16A, bank statements, investment proofs (80C, 80D etc.), and any other income documents like rental income, capital gains statements.' },
  { q: 'How long does GST registration take?', a: 'GST registration typically takes 3-7 working days from the date of submission of complete documents. With Helpshack, we expedite the process and keep you updated in real-time.' },
  { q: 'Can I track my application status online?', a: 'Yes! Helpshack provides a comprehensive dashboard where you can track all your applications, view status updates, communicate with our CAs, and download completed documents in real-time.' },
  { q: 'What types of companies can you register?', a: 'We handle registration for Private Limited Companies, One Person Companies (OPC), Limited Liability Partnerships (LLP), Section 8 Companies, and Partnerships. Each comes with complete compliance setup.' },
  { q: 'Do you provide ongoing compliance support?', a: 'Absolutely! We offer annual compliance packages that include ROC filings, annual returns, tax filings, and advisory services. You get a dedicated CA assigned to your business.' },
  { q: 'What are your payment options?', a: 'We accept all major payment methods including UPI, Net Banking, Credit/Debit Cards, and EMI options. Payment is processed securely through Razorpay.' },
];

const trustedLogos = [
  'Tata Consultancy', 'Reliance', 'Infosys', 'Wipro', 'HCL Tech', 
  'Tech Mahindra', 'Bajaj Finance', 'HDFC Bank', 'L&T', 'Adani Group'
];

/* ─── Floating particles background ─── */
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-primary-400/10 dark:bg-primary-400/5"
          style={{
            width: 60 + i * 40,
            height: 60 + i * 40,
            left: `${10 + i * 15}%`,
            top: `${20 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, 15, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Animated Counter Card ─── */
function StatCounter({ label, value, suffix, icon: Icon, index }) {
  const { count, ref } = useCounter(value, 2000);
  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      className="text-center group"
    >
      <div className="relative inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 group-hover:scale-110 transition-transform duration-300">
        <Icon size={28} className="text-primary-600 dark:text-primary-400" />
      </div>
      <p className="text-4xl sm:text-5xl font-extrabold gradient-text tabular-nums">
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 uppercase tracking-wide">{label}</p>
    </motion.div>
  );
}

/* ─── FAQ Accordion Item ─── */
function FAQItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      variants={fadeInUp}
      className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
    >
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full p-5 text-left bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <span className="font-semibold text-slate-900 dark:text-white pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={20} className="text-slate-400 flex-shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-700 pt-4">
              {a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Main Page ─── */
export default function Home() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Navbar />

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <FloatingParticles />
        
        {/* Decorative gradient orbs */}
        <div className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-primary-400/20 to-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-gradient-to-tr from-green-400/10 to-primary-400/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-200/10 dark:bg-primary-800/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-green-50 dark:from-primary-900/20 dark:to-green-900/20 border border-primary-200 dark:border-primary-800 rounded-full mb-6"
              >
                <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-400">Trusted by 1000+ Businesses Across India</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-6"
              >
                Expert{' '}
                <span className="relative">
                  <span className="gradient-text">Tax & CA</span>
                  <motion.div
                    className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary-600 to-green-500 rounded-full"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                  />
                </span>
                <br />
                Services,{' '}
                <span className="gradient-text">Simplified.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-xl"
              >
                From <strong>Income Tax</strong> to <strong>Company Registration</strong> — get end-to-end
                Chartered Accountant services with real-time tracking, expert guidance, and a completely digital experience.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-wrap gap-4"
              >
                <Link href="/services" className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold rounded-2xl shadow-lg shadow-primary-600/25 hover:shadow-xl hover:shadow-primary-600/40 transition-all duration-300 text-lg">
                  Get Started Free
                  <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/contact" className="group inline-flex items-center px-8 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-2xl hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300 text-lg">
                  <Phone size={20} className="mr-2" /> Talk to Expert
                </Link>
              </motion.div>

              {/* Trust Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap items-center gap-6 mt-10"
              >
                {[
                  { icon: BadgeCheck, text: 'Certified CAs', color: 'text-blue-500' },
                  { icon: Shield, text: 'ISO 27001 Secure', color: 'text-green-500' },
                  { icon: Clock, text: 'Same Day Start', color: 'text-orange-500' },
                  { icon: Star, text: '4.8★ Rated', color: 'text-yellow-500' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                    <item.icon size={18} className={item.color} />
                    {item.text}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right - Floating Cards Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative hidden lg:block"
            >
              <div className="relative w-full h-[500px]">
                {/* Main Card */}
                <motion.div
                  className="absolute top-10 left-8 w-72 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 border border-slate-100 dark:border-slate-700"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <CheckCircle size={22} className="text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">ITR Filed Successfully</p>
                      <p className="text-xs text-slate-500">Assessment Year 2024-25</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Refund Expected</span>
                    <span className="font-bold text-green-600">₹24,500</span>
                  </div>
                  <div className="mt-3 w-full bg-green-100 dark:bg-green-900/30 rounded-full h-2">
                    <motion.div
                      className="bg-green-500 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2, delay: 1 }}
                    />
                  </div>
                </motion.div>

                {/* GST Card */}
                <motion.div
                  className="absolute top-48 right-0 w-64 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-5 border border-slate-100 dark:border-slate-700"
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <FileText size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">GST Return Filed</p>
                      <p className="text-xs text-slate-500">GSTR-3B • Aug 2024</p>
                    </div>
                  </div>
                  <div className="badge-green text-xs">✓ Verified & Submitted</div>
                </motion.div>

                {/* Notification Card */}
                <motion.div
                  className="absolute bottom-16 left-4 w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 border border-slate-100 dark:border-slate-700"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <MessageCircle size={16} className="text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">New Message from CA</p>
                      <p className="text-xs text-slate-500">Your documents are verified ✓</p>
                    </div>
                  </div>
                </motion.div>

                {/* Rating Badge */}
                <motion.div
                  className="absolute top-2 right-16 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl shadow-lg px-4 py-2 flex items-center gap-2"
                  animate={{ rotate: [0, 2, -2, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                >
                  <Star size={16} className="text-white fill-white" />
                  <span className="text-sm font-bold text-white">4.8 / 5</span>
                </motion.div>

                {/* Decorative Ring */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border-2 border-dashed border-primary-200 dark:border-primary-800 rounded-full opacity-30" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRUSTED BY MARQUEE ═══════════ */}
      <section className="py-6 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 mb-3">
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest">Trusted by Leading Businesses</p>
        </div>
        <div className="relative">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...trustedLogos, ...trustedLogos].map((name, i) => (
              <div key={i} className="mx-8 flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <Briefcase size={16} />
                <span className="text-sm font-semibold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ ANIMATED STATS ═══════════ */}
      <section className="py-20 bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-50/50 via-transparent to-transparent dark:from-primary-950/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={staggerContainer}
            className="grid grid-cols-2 lg:grid-cols-4 gap-12"
          >
            {stats.map((stat, i) => (
              <StatCounter key={stat.label} {...stat} index={i} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ SERVICES GRID ═══════════ */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-semibold rounded-full mb-4">
              OUR SERVICES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Comprehensive CA Solutions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Everything you need for tax, compliance, registration, and business growth — all under one roof.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {services.map((service, i) => (
              <motion.div key={service.slug} variants={fadeInUp}>
                <Link href={`/services/${service.slug}`}>
                  <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-xl hover:shadow-primary-600/5 transition-all duration-300 overflow-hidden h-full">
                    {/* Gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300`} />
                    
                    <div className={`relative w-14 h-14 rounded-2xl ${service.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon size={26} className={`bg-gradient-to-br ${service.color} bg-clip-text`} style={{ color: 'inherit' }} />
                    </div>
                    <h3 className="relative font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {service.name}
                    </h3>
                    <p className="relative text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{service.desc}</p>
                    <span className="relative inline-flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                      Learn more <ArrowUpRight size={14} className="ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <AnimatedSection className="text-center mt-12" delay={0.3}>
            <Link href="/services" className="group inline-flex items-center px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl hover:shadow-xl transition-all duration-300 text-lg">
              View All Services <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════ WHY CHOOSE US ═══════════ */}
      <section className="py-24 bg-white dark:bg-slate-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/50 dark:bg-primary-900/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <AnimatedSection>
              <span className="inline-block px-4 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm font-semibold rounded-full mb-4">
                WHY HELPSHACK
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                Why <span className="gradient-text">1000+ Businesses</span> Trust Us
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                We combine deep CA expertise with modern technology to deliver a seamless, 
                transparent, and hassle-free experience that traditional firms simply cannot match.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/register" className="btn-primary">
                  Start Free Today <ArrowRight size={18} className="ml-2" />
                </Link>
                <Link href="/about" className="btn-secondary">
                  Learn More
                </Link>
              </div>
            </AnimatedSection>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="grid sm:grid-cols-2 gap-5"
            >
              {whyChooseUs.map((item, i) => (
                <motion.div
                  key={item.title}
                  variants={scaleIn}
                  className="group bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 hover:bg-primary-50 dark:hover:bg-primary-900/10 border border-transparent hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300"
                >
                  <div className="w-11 h-11 bg-white dark:bg-slate-700 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:shadow-md group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-all">
                    <item.icon size={22} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-1 text-sm">{item.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-semibold rounded-full mb-4">
              SIMPLE PROCESS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Get Started in 4 Easy Steps
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our streamlined digital process ensures you get expert CA services without any hassle.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-4 gap-8 relative"
          >
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-primary-200 via-primary-400 to-primary-200 dark:from-primary-800 dark:via-primary-600 dark:to-primary-800" />
            
            {[
              { step: 1, title: 'Choose Service', desc: 'Browse our 15+ services and select what you need. From ITR to Company Registration.', icon: Sparkles, color: 'from-blue-500 to-blue-600' },
              { step: 2, title: 'Submit Documents', desc: 'Upload documents securely through our encrypted platform. We guide you on what is needed.', icon: FileText, color: 'from-green-500 to-green-600' },
              { step: 3, title: 'Expert Processing', desc: 'Our qualified CAs process your application with multi-level quality checks.', icon: UserCheck, color: 'from-purple-500 to-purple-600' },
              { step: 4, title: 'Get Delivered', desc: 'Receive completed documents digitally. Track progress in real-time on your dashboard.', icon: CheckCircle, color: 'from-orange-500 to-orange-600' },
            ].map(item => (
              <motion.div key={item.step} variants={fadeInUp} className="text-center relative z-10">
                <div className="relative inline-flex items-center justify-center mb-6">
                  <div className={`w-20 h-20 bg-gradient-to-br ${item.color} rounded-3xl flex items-center justify-center shadow-lg rotate-3 group-hover:rotate-0 transition-transform`}>
                    <item.icon size={32} className="text-white -rotate-3" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-md border-2 border-primary-200 dark:border-primary-800">
                    <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400">{item.step}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[250px] mx-auto">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ TAX CALENDAR ═══════════ */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              variants={staggerContainer}
              className="order-2 lg:order-1"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                {taxDeadlines.map((item, i) => (
                  <motion.div
                    key={item.title}
                    variants={fadeInUp}
                    className="group bg-slate-50 dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center">
                        <span className="text-xs font-extrabold text-primary-600 dark:text-primary-400 leading-none text-center">{item.date}</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-0.5">{item.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{item.desc}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <AnimatedSection className="order-1 lg:order-2">
              <span className="inline-block px-4 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-semibold rounded-full mb-4">
                <CalendarDays size={14} className="inline mr-1" /> TAX CALENDAR
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                Never Miss a <span className="gradient-text">Tax Deadline</span>
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Stay compliant with important tax deadlines. Our platform sends automated reminders 
                so you never miss a due date and avoid penalties.
              </p>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Auto Reminders
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <CheckCircle size={16} className="text-green-500" />
                  Penalty Protection
                </div>
              </div>
              <Link href="/register" className="btn-primary mt-8 inline-flex">
                Set Up Reminders <ArrowRight size={18} className="ml-2" />
              </Link>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/30 dark:to-slate-900 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 text-sm font-semibold rounded-full mb-4">
              TESTIMONIALS
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Loved by <span className="gradient-text">Businesses</span> Across India
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Join thousands of satisfied clients who transformed their business compliance with Helpshack.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300 h-full flex flex-col">
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed flex-1 mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-white">{t.name[0]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-xs text-slate-500">{t.company}</p>
                      </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full">{t.service}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ FAQ SECTION ═══════════ */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <span className="inline-block px-4 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-sm font-semibold rounded-full mb-4">
              FAQ
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Got questions? We have got answers. Cannot find what you are looking for? Contact our support.
            </p>
          </AnimatedSection>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="space-y-4"
          >
            {faqs.map((faq, i) => (
              <FAQItem key={i} {...faq} index={i} />
            ))}
          </motion.div>

          <AnimatedSection className="text-center mt-10" delay={0.2}>
            <p className="text-slate-500 dark:text-slate-400 mb-4">Still have questions?</p>
            <Link href="/contact" className="btn-primary">
              Contact Our Team <ArrowRight size={18} className="ml-2" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800" />
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 bg-white/10 rounded-3xl mb-8 backdrop-blur-sm"
            >
              <Landmark size={40} className="text-white" />
            </motion.div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
              Ready to Simplify Your <br /> Tax & Compliance?
            </h2>
            <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Join 1000+ businesses that trust Helpshack for their Chartered Accountant needs. 
              Get started today — your first consultation is absolutely free.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="group inline-flex items-center px-10 py-5 bg-white text-primary-700 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 text-lg">
                Create Free Account <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="inline-flex items-center px-10 py-5 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 hover:border-white/50 transition-all duration-300 text-lg backdrop-blur-sm">
                <Phone size={20} className="mr-2" /> +91 89249 54143
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-12 text-white/70 text-sm">
              <div className="flex items-center gap-2">
                <Lock size={16} />
                <span>256-bit Encryption</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield size={16} />
                <span>Data Privacy Assured</span>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck size={16} />
                <span>ICAI Certified CAs</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />

      {/* Marquee animation styles */}
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </>
  );
}
