import { useState, useRef } from 'react';
import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { motion, useInView } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle, ArrowRight, Sparkles, CheckCircle, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';

const fadeInUp = { hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } };
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

const contactInfo = [
  { icon: MapPin, title: 'Visit Us', details: ['128/389 H-2, Block Kidwai Nagar', 'Kanpur, UP 208011'], color: 'from-blue-500 to-blue-600' },
  { icon: Phone, title: 'Call Us', details: ['+91 89249 54143', 'Mon-Sat, 10 AM - 7 PM'], color: 'from-green-500 to-green-600' },
  { icon: Mail, title: 'Email Us', details: ['dhirajame89@gmail.com', 'support@helpshack.in'], color: 'from-purple-500 to-purple-600' },
  { icon: Clock, title: 'Business Hours', details: ['Monday - Saturday', '10:00 AM - 7:00 PM'], color: 'from-orange-500 to-orange-600' },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      toast.success('Message sent successfully! We will get back to you within 24 hours.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setSubmitting(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-900" />
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, type: 'spring' }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-white/10 backdrop-blur rounded-full mb-8 border border-white/20">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="text-sm font-semibold text-white">We respond within 24 hours</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            Get in <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">Touch</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-primary-100 max-w-2xl mx-auto">
            Have questions about our services? Need help with tax filings? Our expert team is here to help!
          </motion.p>
        </div>
      </section>

      {/* Contact Cards */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((item, i) => (
              <motion.div key={i} variants={scaleIn}
                className="group bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 transition-all text-center">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                {item.details.map((d, j) => <p key={j} className="text-sm text-slate-500">{d}</p>)}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Form + Map */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12">
            <Section>
              <span className="inline-block px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 text-sm font-semibold rounded-full mb-4">SEND MESSAGE</span>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Drop Us a Line</h2>
              <p className="text-slate-500 mb-8">Fill out the form and we will get back to you within 24 hours.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="input" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="input" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div>
                    <label className="label">Subject *</label>
                    <select required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="input">
                      <option value="">Select subject</option>
                      <option value="tax-filing">Tax Filing</option>
                      <option value="gst">GST Related</option>
                      <option value="registration">Company Registration</option>
                      <option value="compliance">Compliance</option>
                      <option value="general">General Inquiry</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea required value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="input h-32 resize-none" placeholder="Describe your query..." />
                </div>
                <motion.button type="submit" disabled={submitting} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full sm:w-auto text-lg px-8 py-4">
                  {submitting ? <span className="flex items-center gap-2"><span className="spinner w-5 h-5"></span> Sending...</span>
                    : <span className="flex items-center gap-2"><Send size={18} /> Send Message</span>}
                </motion.button>
              </form>
            </Section>

            <Section delay={0.2}>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-3xl overflow-hidden h-full border border-slate-200 dark:border-slate-700 flex flex-col">
                <div className="flex-1 min-h-[300px]">
                  <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3571.1234!2d80.3476!3d26.4499!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399c3797!2sKidwai+Nagar%2C+Kanpur!5e0!3m2!1sen!2sin!4v1234567890"
                    width="100%" height="100%" style={{ border: 0, minHeight: '300px' }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
                </div>
                <div className="p-6 space-y-4">
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 size={18} className="text-primary-600" /> Our Office
                  </h3>
                  <div className="space-y-3">
                    <a href="tel:+918924954143" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                      <Phone size={16} className="text-primary-500" /> +91 89249 54143
                    </a>
                    <a href="mailto:dhirajame89@gmail.com" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                      <Mail size={16} className="text-primary-500" /> dhirajame89@gmail.com
                    </a>
                    <a href="https://wa.me/918924954143" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-green-600 font-semibold transition-colors p-2 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20">
                      <MessageCircle size={16} /> Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800" />
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <Section>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">Ready to Get Started?</h2>
            <p className="text-primary-100 mb-8 text-lg">Join 1000+ businesses who trust Helpshack for their compliance needs.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/services" className="group inline-flex items-center px-8 py-4 bg-white text-primary-700 font-bold rounded-2xl shadow-xl hover:scale-105 transition-all">
                Explore Services <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              <a href="tel:+918924954143" className="inline-flex items-center px-8 py-4 border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all">
                <Phone size={18} className="mr-2" /> Call Now
              </a>
            </div>
          </Section>
        </div>
      </section>

      <Footer />
    </div>
  );
}
