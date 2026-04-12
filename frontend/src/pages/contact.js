import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { MapPin, Phone, Mail, Clock, Send, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const contactInfo = [
  { icon: MapPin, title: 'Visit Us', details: ['128/389 H-2, Block Kidwai Nagar', 'Kanpur, Uttar Pradesh 208011'] },
  { icon: Phone, title: 'Call Us', details: ['+91 89249 54143', 'Mon–Sat, 10 AM – 7 PM'] },
  { icon: Mail, title: 'Email Us', details: ['dhirajame89@gmail.com', 'support@helpshack.in'] },
  { icon: Clock, title: 'Business Hours', details: ['Monday – Saturday', '10:00 AM – 7:00 PM'] },
];

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate form submission
    setTimeout(() => {
      toast.success('Message sent successfully! We will get back to you soon.');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setSubmitting(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeIn} className="text-4xl md:text-5xl font-bold mb-6">
            Get in Touch
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }} className="text-xl text-primary-100 max-w-2xl mx-auto">
            Have questions about our services? Need help with tax filings? We're here to help!
          </motion.p>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 -mt-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {contactInfo.map((item, idx) => (
              <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: idx * 0.1 }} className="card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                  <item.icon className="text-primary-600" size={24} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                {item.details.map((detail, i) => (
                  <p key={i} className="text-sm text-slate-500">{detail}</p>
                ))}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form + Map */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Send Us a Message</h2>
              <p className="text-slate-500 mb-8">Fill out the form below and we'll get back to you within 24 hours.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" placeholder="Your name" />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" placeholder="your@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Phone</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div>
                    <label className="label">Subject *</label>
                    <select required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="input">
                      <option value="">Select a subject</option>
                      <option value="tax-filing">Tax Filing</option>
                      <option value="gst">GST Related</option>
                      <option value="registration">Company Registration</option>
                      <option value="compliance">Compliance</option>
                      <option value="general">General Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label">Message *</label>
                  <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="input h-32" placeholder="Describe your query..." />
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full sm:w-auto">
                  {submitting ? (
                    <span className="flex items-center gap-2"><span className="spinner w-4 h-4"></span> Sending...</span>
                  ) : (
                    <span className="flex items-center gap-2"><Send size={18} /> Send Message</span>
                  )}
                </button>
              </form>
            </motion.div>

            {/* Map / Info */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: 0.2 }}>
              <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden h-full min-h-[400px] flex flex-col">
                {/* Google Maps Embed */}
                <div className="flex-1 min-h-[300px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3571.1234!2d80.3476!3d26.4499!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x399c3797!2sKidwai+Nagar%2C+Kanpur!5e0!3m2!1sen!2sin!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '300px' }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-t-2xl"
                  ></iframe>
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Quick Contact</h3>
                  <div className="space-y-3">
                    <a href="tel:+918924954143" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">
                      <Phone size={16} className="text-primary-500" /> +91 89249 54143
                    </a>
                    <a href="mailto:dhirajame89@gmail.com" className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300 hover:text-primary-600 transition-colors">
                      <Mail size={16} className="text-primary-500" /> dhirajame89@gmail.com
                    </a>
                    <a href="https://wa.me/918924954143" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
                      <MessageCircle size={16} /> Chat on WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h2>
          <p className="text-primary-100 mb-8 text-lg">Join 1000+ businesses who trust Helpshack for their compliance needs.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/services" className="px-8 py-3 bg-white text-primary-600 rounded-xl font-semibold hover:bg-primary-50 transition-colors">
              Explore Services
            </a>
            <a href="tel:+918924954143" className="px-8 py-3 border-2 border-white text-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
              Call Now
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
