import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Clock, FileText, ArrowRight, ChevronDown, ChevronUp,
  Upload, Shield, Phone, ArrowLeft, Star, Sparkles, Users, Zap,
  MessageCircle, IndianRupee, Award, BadgeCheck
} from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function ServiceDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => { if (slug) fetchService(); }, [slug]);

  const fetchService = async () => {
    try {
      const data = await api.getServiceBySlug(slug);
      setService(data.service);
    } catch (error) {
      console.error('Service not found:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <><Navbar /><div className="min-h-[60vh] flex items-center justify-center"><LoadingSpinner /></div><Footer /></>;
  if (!service) return (
    <>
      <Navbar />
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Service Not Found</h2>
          <p className="text-slate-500 mb-6">The service you are looking for does not exist.</p>
          <Link href="/services" className="btn-primary">Browse All Services</Link>
        </motion.div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-blue-900 py-20 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Link href="/services" className="inline-flex items-center gap-2 text-primary-200 hover:text-white text-sm mb-6 group transition-colors">
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Back to Services
            </Link>
            <div className="max-w-3xl">
              {service.isPopular && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full mb-4 border border-white/20">
                  <Star size={14} className="text-yellow-300" fill="currentColor" />
                  <span className="text-xs font-semibold text-white">Popular Service</span>
                </div>
              )}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4 leading-tight">{service.name}</h1>
              <p className="text-lg text-primary-100 mb-8 leading-relaxed max-w-2xl">{service.shortDescription}</p>
              <div className="flex flex-wrap gap-4 items-center">
                {service.pricing?.basePrice > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-lg rounded-2xl px-6 py-4 border border-white/20">
                    <p className="text-xs text-primary-200 uppercase tracking-wide mb-1">Starting from</p>
                    <p className="text-3xl font-extrabold text-white">
                      ₹{service.pricing.basePrice.toLocaleString('en-IN')}
                      <span className="text-sm font-normal text-primary-200 ml-1">+ GST</span>
                    </p>
                  </motion.div>
                )}
                <div className="flex items-center gap-2 text-primary-200 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
                  <Clock size={18} />
                  <span className="font-medium">{service.timeline || '3-7 days'}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Highlight Bar */}
      <section className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
            {[
              { icon: BadgeCheck, label: 'CA Verified', color: 'text-green-600 bg-green-50 dark:bg-green-900/20' },
              { icon: Shield, label: '100% Secure', color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
              { icon: Zap, label: 'Fast Processing', color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' },
              { icon: MessageCircle, label: 'Free Support', color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon size={18} />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-50 dark:bg-primary-900/20 rounded-lg flex items-center justify-center">
                  <FileText size={16} className="text-primary-600" />
                </div>
                About This Service
              </h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-base">{service.description}</p>
            </motion.div>

            {/* Features */}
            {service.features?.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <CheckCircle size={16} className="text-green-600" />
                  </div>
                  What&apos;s Included
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {service.features.map((feature, i) => (
                    <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                      className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 hover:bg-green-50 dark:hover:bg-green-900/10 transition-colors group">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
                      <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Process */}
            {service.process?.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-8 flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Zap size={16} className="text-blue-600" />
                  </div>
                  How It Works
                </h2>
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-400 via-primary-300 to-transparent" />
                  <div className="space-y-8">
                    {service.process.map((step, i) => (
                      <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                        className="relative flex gap-5 pl-2">
                        <div className="relative z-10 w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary-600/30">
                          <span className="text-sm font-bold text-white">{step.step}</span>
                        </div>
                        <div className="pt-1.5">
                          <h3 className="font-bold text-slate-900 dark:text-white text-base">{step.title}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{step.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* FAQs */}
            {service.faqs?.length > 0 && (
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={3}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <MessageCircle size={16} className="text-purple-600" />
                  </div>
                  Frequently Asked Questions
                </h2>
                <div className="space-y-3">
                  {service.faqs.map((faq, i) => (
                    <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden hover:border-primary-300 dark:hover:border-primary-700 transition-colors">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-5 text-left group"
                      >
                        <span className="font-semibold text-slate-900 dark:text-white pr-4">{faq.question}</span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${openFaq === i ? 'bg-primary-100 dark:bg-primary-900/20 text-primary-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                          {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </button>
                      <AnimatePresence>
                        {openFaq === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}>
                            <div className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="sticky top-24">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                  <Sparkles size={18} className="text-primary-600" />
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ready to Apply?</h3>
                </div>
                {service.pricing?.basePrice > 0 && (
                  <div className="mb-5 p-4 bg-gradient-to-br from-slate-50 to-primary-50/30 dark:from-slate-700/50 dark:to-primary-900/10 rounded-xl border border-slate-100 dark:border-slate-600">
                    <div className="flex justify-between mb-3">
                      <span className="text-slate-500 text-sm">Base Price</span>
                      <span className="font-semibold text-slate-900 dark:text-white">₹{service.pricing.basePrice.toLocaleString('en-IN')}</span>
                    </div>
                    {service.pricing?.gstPercent && (
                      <div className="flex justify-between mb-3">
                        <span className="text-slate-500 text-sm">GST ({service.pricing.gstPercent}%)</span>
                        <span className="font-semibold text-slate-900 dark:text-white">₹{((service.pricing.basePrice * service.pricing.gstPercent) / 100).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-3 border-t border-slate-200 dark:border-slate-600">
                      <span className="font-bold text-slate-900 dark:text-white">Total</span>
                      <span className="text-xl font-extrabold text-primary-600">{service.pricing.totalPrice ? `₹${service.pricing.totalPrice.toLocaleString('en-IN')}` : `₹${service.pricing.basePrice.toLocaleString('en-IN')}`}</span>
                    </div>
                  </div>
                )}
                <Link href={`/dashboard/apply?service=${service.slug}`}
                  className="btn-primary w-full justify-center mb-3 py-3.5 text-base">
                  Apply Now <ArrowRight size={18} className="ml-2" />
                </Link>
                <a href="tel:+918924954143" className="btn-outline w-full justify-center py-3">
                  <Phone size={18} className="mr-2" /> Call Us
                </a>
                <a href="https://wa.me/918924954143" target="_blank" rel="noopener noreferrer"
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl font-semibold text-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <MessageCircle size={18} /> Chat on WhatsApp
                </a>
              </div>

              {/* Documents */}
              {service.requiredDocuments?.length > 0 && (
                <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Upload size={18} className="text-primary-600" /> Documents Required
                  </h3>
                  <ul className="space-y-3">
                    {service.requiredDocuments.map((doc, i) => (
                      <li key={i} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        <FileText size={16} className={`mt-0.5 flex-shrink-0 ${doc.isMandatory ? 'text-red-500' : 'text-slate-400'}`} />
                        <div>
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.name}</span>
                          {doc.isMandatory && <span className="text-red-500 ml-1 text-xs font-bold">Required</span>}
                          {doc.description && <p className="text-xs text-slate-400 mt-0.5">{doc.description}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Trust */}
              <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-100 dark:border-green-800/30">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                    <Shield size={20} className="text-green-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">100% Secure</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Your documents are encrypted and securely stored. We follow strict data protection protocols.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {['SSL Encrypted', 'Data Protected', 'CA Verified'].map((tag, i) => (
                    <span key={i} className="text-xs font-medium px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 rounded-3xl p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Have Questions About This Service?
              </h2>
              <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-8">
                Get a free consultation with our expert CAs. We&apos;ll help you understand the process and requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href={`/dashboard/apply?service=${service.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-lg">
                  <ArrowRight size={20} /> Apply Now
                </Link>
                <a href="tel:+918924954143" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-colors">
                  <Phone size={20} /> Talk to an Expert
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </>
  );
}
