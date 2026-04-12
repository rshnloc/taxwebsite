import { useRef } from 'react';
import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { motion, useInView } from 'framer-motion';
import {
  Award, Users, Shield, Target, CheckCircle, Star, Building2, Briefcase,
  Zap, Globe, Heart, TrendingUp, ArrowRight, Phone, Calendar,
  BookOpen, Scale, Sparkles, BadgeCheck
} from 'lucide-react';

const fadeInUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
const fadeInLeft = { hidden: { opacity: 0, x: -40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } };
const fadeInRight = { hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6 } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.1 } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.85 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } } };

function Section({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div ref={ref} initial="hidden" animate={inView ? 'visible' : 'hidden'}
      variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, delay } } }}
      className={className}>{children}</motion.div>
  );
}

const values = [
  { icon: Shield, title: 'Trust & Transparency', desc: 'No hidden charges, no surprises — ever. Complete transparency in every transaction.', color: 'from-blue-500 to-blue-600' },
  { icon: Target, title: 'Precision & Accuracy', desc: 'Every filing reviewed for zero errors. 99.9% accuracy rate across all services.', color: 'from-purple-500 to-purple-600' },
  { icon: Heart, title: 'Client First', desc: 'Your success is our success. We go above and beyond for every client.', color: 'from-rose-500 to-rose-600' },
  { icon: Award, title: 'Excellence', desc: 'Highest standards of professional excellence maintained in every service.', color: 'from-amber-500 to-amber-600' },
  { icon: Zap, title: 'Speed & Efficiency', desc: 'Fast turnaround powered by modern technology and streamlined processes.', color: 'from-green-500 to-green-600' },
  { icon: Globe, title: 'Pan-India Reach', desc: 'Serving businesses across India with localized expertise.', color: 'from-cyan-500 to-cyan-600' },
];

const timeline = [
  { year: '2014', title: 'Founded', desc: 'Helpshack established in Kanpur with a vision to simplify compliance.' },
  { year: '2016', title: 'Digital Transformation', desc: 'Launched online platform for digital filing management.' },
  { year: '2018', title: 'GST Expertise', desc: 'Became regional leader in GST compliance services.' },
  { year: '2020', title: 'Pandemic Pivot', desc: 'Went fully digital, helping 500+ businesses navigate COVID compliance.' },
  { year: '2022', title: 'Platform Launch', desc: 'Released client dashboard with real-time tracking and chat.' },
  { year: '2024', title: '1000+ Clients', desc: 'Crossed 1000+ satisfied clients with 99% retention rate.' },
];

const team = [
  { name: 'CA Dhiraj Kumar', role: 'Founder & Senior CA', desc: '10+ years in taxation, GST, and business compliance.', speciality: 'Tax & Compliance' },
  { name: 'CA Priya Verma', role: 'Head - Tax Dept', desc: 'Expert in Income Tax, TDS returns, and tax planning.', speciality: 'Income Tax' },
  { name: 'Rajat Gupta', role: 'Head - Registrations', desc: 'Specialist in company incorporation, LLP, and trademarks.', speciality: 'Registrations' },
  { name: 'Anita Sharma', role: 'GST Expert', desc: 'Deep expertise in GST compliance and reconciliation.', speciality: 'GST' },
  { name: 'Sanjay Tiwari', role: 'Accounts Manager', desc: 'Expert in bookkeeping and financial auditing.', speciality: 'Accounting' },
  { name: 'Neha Singh', role: 'Client Relations', desc: 'Ensuring every client receives prompt and seamless support.', speciality: 'Support' },
];

const achievements = [
  { value: '1000+', label: 'Happy Clients', icon: Users },
  { value: '5000+', label: 'Filings Done', icon: BookOpen },
  { value: '15+', label: 'Services', icon: Briefcase },
  { value: '99%', label: 'Success Rate', icon: TrendingUp },
  { value: '10+', label: 'Years Exp.', icon: Calendar },
  { value: '4.8★', label: 'Rating', icon: Star },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-900" />
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: 'spring' }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur rounded-full mb-8 border border-white/20">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="text-sm font-semibold text-white">10+ Years of Excellence</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Helpshack</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-primary-100 max-w-3xl mx-auto leading-relaxed">
            Your trusted partner for tax, compliance, and business registration. We simplify Indian business regulations with modern technology and deep expertise.
          </motion.p>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 -mt-1">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {achievements.map((s, i) => (
              <motion.div key={i} variants={fadeInUp} className="text-center group">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-3 rounded-xl bg-primary-50 dark:bg-primary-900/20 group-hover:scale-110 transition-transform">
                  <s.icon size={22} className="text-primary-600 dark:text-primary-400" />
                </div>
                <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{s.value}</p>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mt-1">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Section>
              <span className="inline-block px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 text-sm font-semibold rounded-full mb-4">OUR STORY</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight">
                From a Small Office to <span className="bg-gradient-to-r from-primary-600 to-blue-500 bg-clip-text text-transparent">Trusted by 1000+</span>
              </h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                <p>Helpshack was founded with a simple mission — to make business compliance <strong>easy, affordable, and accessible</strong> for everyone.</p>
                <p>From income tax to company registration, we offer <strong>end-to-end professional services</strong> that let you focus on growing your business.</p>
                <p>Our experienced CAs work tirelessly to ensure every filing is accurate and every deadline is met.</p>
              </div>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link href="/services" className="btn-primary">Our Services <ArrowRight size={18} className="ml-2" /></Link>
                <Link href="/contact" className="btn-secondary"><Phone size={18} className="mr-2" /> Contact Us</Link>
              </div>
            </Section>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-4">
              {[
                { icon: Building2, text: 'Headquartered in Kanpur, UP', sub: 'Serving clients pan-India' },
                { icon: Briefcase, text: '15+ Professional Services', sub: 'Tax, Registration, Compliance' },
                { icon: Users, text: '1000+ Satisfied Clients', sub: 'Startups to enterprises' },
                { icon: Star, text: '99% Client Satisfaction', sub: '4.8★ rating on Google' },
                { icon: BadgeCheck, text: 'ICAI Certified CAs', sub: 'Qualified & experienced team' },
              ].map((item, i) => (
                <motion.div key={i} variants={fadeInRight}
                  className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 flex items-center justify-center flex-shrink-0">
                    <item.icon size={22} className="text-primary-600 dark:text-primary-400" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{item.text}</p>
                    <p className="text-sm text-slate-500">{item.sub}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-5xl mx-auto px-4">
          <Section className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-sm font-semibold rounded-full mb-4">OUR JOURNEY</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white">
              A Decade of <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">Growth</span>
            </h2>
          </Section>
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-primary-500 to-primary-300 dark:from-primary-700 dark:via-primary-500 dark:to-primary-700" />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} variants={stagger} className="space-y-12">
              {timeline.map((item, i) => (
                <motion.div key={i} variants={i % 2 === 0 ? fadeInLeft : fadeInRight}
                  className={`relative flex items-center gap-8 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow">
                      <span className="text-xs font-bold text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-3 py-1 rounded-full">{item.year}</span>
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-3 mb-1">{item.title}</h3>
                      <p className="text-sm text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg flex-shrink-0 z-10 border-4 border-white dark:border-slate-900">
                    <Calendar size={18} className="text-white" />
                  </div>
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <Section className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 text-sm font-semibold rounded-full mb-4">OUR VALUES</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              What We <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">Stand For</span>
            </h2>
          </Section>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div key={i} variants={scaleIn}
                className="group bg-slate-50 dark:bg-slate-800 rounded-2xl p-7 border border-slate-200 dark:border-slate-700 hover:border-transparent hover:shadow-xl transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${v.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <v.icon size={26} className="text-white" />
                </div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/30">
        <div className="max-w-7xl mx-auto px-4">
          <Section className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 text-sm font-semibold rounded-full mb-4">OUR TEAM</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
              Meet the <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">Experts</span>
            </h2>
          </Section>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {team.map((m, i) => (
              <motion.div key={i} variants={fadeInUp}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-2xl font-extrabold mx-auto mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  {m.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{m.name}</h3>
                <p className="text-sm font-semibold text-primary-600 mb-1">{m.role}</p>
                <span className="inline-block text-xs px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 rounded-full mb-4">{m.speciality}</span>
                <p className="text-sm text-slate-500 leading-relaxed">{m.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <Section>
              <span className="inline-block px-4 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-sm font-semibold rounded-full mb-4">WHY HELPSHACK</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mb-8">
                Why Businesses <span className="bg-gradient-to-r from-blue-500 to-primary-500 bg-clip-text text-transparent">Choose Us</span>
              </h2>
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="space-y-4">
                {['Expert CAs with 10+ years experience', 'Affordable pricing with zero hidden charges', 'Most services completed within 7 days', 'Dedicated support for every client', 'End-to-end service from filing to follow-up', 'Bank-grade security for documents & data', 'Real-time tracking on client dashboard', 'Trusted by 1000+ businesses across India'].map((item, i) => (
                  <motion.div key={i} variants={fadeInLeft} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{item}</span>
                  </motion.div>
                ))}
              </motion.div>
            </Section>
            <Section delay={0.2}>
              <div className="bg-gradient-to-br from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 rounded-3xl p-8 border border-primary-100 dark:border-primary-800">
                <div className="text-center mb-6">
                  <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', delay: 0.3 }}
                    className="w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-700 rounded-3xl flex items-center justify-center mx-auto shadow-xl mb-4">
                    <Scale size={36} className="text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white">Our Promise</h3>
                </div>
                <div className="space-y-4">
                  {[{ title: 'Accuracy Guaranteed', desc: 'Zero-error filings with multi-level review' }, { title: 'On-Time Delivery', desc: 'We meet deadlines, every single time' }, { title: 'Money-Back Guarantee', desc: 'Full refund if we fail to deliver' }, { title: 'Free Consultation', desc: 'Expert advice before committing' }].map((p, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm">
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{p.title}</h4>
                      <p className="text-xs text-slate-500 mt-1">{p.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <Section>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">Ready to Work With Us?</h2>
            <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">Join 1000+ businesses that trust Helpshack. First consultation is absolutely free.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register" className="group inline-flex items-center px-10 py-5 bg-white text-primary-700 font-bold rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 transition-all text-lg">
                Get Started Free <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/contact" className="inline-flex items-center px-10 py-5 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-lg">
                <Phone size={20} className="mr-2" /> +91 89249 54143
              </Link>
            </div>
          </Section>
        </div>
      </section>

      <Footer />
    </div>
  );
}
