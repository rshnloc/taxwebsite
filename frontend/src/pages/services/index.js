import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, FileText, Building2, Shield, BarChart3, Award, Wallet, Globe,
  Factory, Store, UtensilsCrossed, Heart, Users, FileCheck, ChevronRight, Search,
  Sparkles, ArrowRight, Star, Clock, CheckCircle, TrendingUp, Phone
} from 'lucide-react';

const iconMap = {
  Receipt, FileText, Building2, Shield, BarChart3, Award, Wallet, Globe,
  Factory, Store, UtensilsCrossed, Heart, Users, FileCheck, FileSpreadsheet: FileText, UsersRound: Users,
};

const categories = [
  { key: '', label: 'All Services', icon: Sparkles },
  { key: 'tax', label: 'Tax', icon: Receipt },
  { key: 'registration', label: 'Registration', icon: FileText },
  { key: 'compliance', label: 'Compliance', icon: Shield },
  { key: 'licensing', label: 'Licensing', icon: Award },
  { key: 'legal', label: 'Legal', icon: Building2 },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.5 } }),
};

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchServices(); }, [category]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = category ? `category=${category}` : '';
      const data = await api.getServices(params);
      setServices(data.services || []);
    } catch (error) {
      console.error('Failed to fetch services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? services.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.shortDescription?.toLowerCase().includes(search.toLowerCase())
      )
    : services;

  const stats = [
    { label: 'Services Offered', value: '15+', icon: Sparkles },
    { label: 'Happy Clients', value: '500+', icon: Users },
    { label: 'Years Experience', value: '10+', icon: TrendingUp },
    { label: 'Success Rate', value: '99%', icon: Star },
  ];

  const defaultServices = [
    { slug: 'income-tax-filing', name: 'Income Tax Filing', shortDescription: 'File your ITR accurately with our expert CAs. Maximize deductions and ensure timely compliance.', icon: 'Receipt', category: 'tax', isPopular: true, pricing: { basePrice: 999 }, timeline: '3-5 days' },
    { slug: 'gst-registration', name: 'GST Registration', shortDescription: 'Get your GSTIN in 3-7 working days. Complete documentation and filing support.', icon: 'FileText', category: 'registration', isPopular: true, pricing: { basePrice: 1499 }, timeline: '3-7 days' },
    { slug: 'company-registration', name: 'Company Registration', shortDescription: 'Register your Private Limited Company with expert guidance and complete compliance.', icon: 'Building2', category: 'registration', isPopular: true, pricing: { basePrice: 6999 }, timeline: '10-15 days' },
    { slug: 'trademark-registration', name: 'Trademark Registration', shortDescription: 'Protect your brand identity with trademark registration and IP protection.', icon: 'Shield', category: 'legal', pricing: { basePrice: 4999 }, timeline: '4-6 months' },
    { slug: 'gst-return-filing', name: 'GST Return Filing', shortDescription: 'Timely GST return filing with complete reconciliation and ITC optimization.', icon: 'BarChart3', category: 'compliance', pricing: { basePrice: 799 }, timeline: 'Monthly' },
    { slug: 'msme-registration', name: 'MSME/Udyam Registration', shortDescription: 'Get Udyam registration to avail government subsidies and schemes for MSMEs.', icon: 'Factory', category: 'registration', pricing: { basePrice: 499 }, timeline: '1-2 days' },
    { slug: 'fssai-license', name: 'FSSAI License', shortDescription: 'Food license and registration for food businesses. FSSAI basic, state, and central licenses.', icon: 'UtensilsCrossed', category: 'licensing', pricing: { basePrice: 2999 }, timeline: '30-60 days' },
    { slug: 'digital-signature', name: 'Digital Signature (DSC)', shortDescription: 'Class 2 and Class 3 Digital Signature Certificates for company filings and e-tendering.', icon: 'FileCheck', category: 'registration', pricing: { basePrice: 1299 }, timeline: '1-2 days' },
    { slug: 'accounting-bookkeeping', name: 'Accounting & Bookkeeping', shortDescription: 'Professional bookkeeping services to keep your financials clean and audit-ready.', icon: 'Wallet', category: 'compliance', pricing: { basePrice: 2999 }, timeline: 'Monthly' },
  ];

  const displayServices = filtered.length > 0 ? filtered : (!loading && services.length === 0 ? defaultServices : filtered);
  const displayFiltered = search && services.length === 0
    ? defaultServices.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(search.toLowerCase())
      )
    : displayServices;

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
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full mb-6 border border-white/20">
              <Sparkles size={14} className="text-yellow-300" />
              <span className="text-xs font-semibold text-white">Professional CA Services</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
              Expert Services for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Every Business Need
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-primary-100 max-w-3xl mx-auto mb-10 leading-relaxed">
              From tax filing to company registration — our experienced Chartered Accountants handle it all with precision and care.
            </p>
            <div className="max-w-lg mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={20} />
              <input
                type="text"
                placeholder="Search for a service..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 backdrop-blur-lg text-white placeholder-white/50 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 text-lg"
              />
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14 max-w-3xl mx-auto">
            {stats.map((s, i) => (
              <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-4 border border-white/10">
                <s.icon size={20} className="text-yellow-300 mx-auto mb-2" />
                <p className="text-2xl font-extrabold text-white">{s.value}</p>
                <p className="text-xs text-primary-200">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filters */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="flex flex-wrap gap-3 mb-12 justify-center">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  category === cat.key
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-105'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              >
                <cat.icon size={16} />
                {cat.label}
              </button>
            ))}
          </motion.div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={category + search} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayFiltered.map((service, index) => {
                  const Icon = iconMap[service.icon] || FileText;
                  return (
                    <motion.div key={service._id || service.slug} variants={fadeUp} initial="hidden" whileInView="visible"
                      viewport={{ once: true }} custom={index} whileHover={{ y: -8 }} transition={{ type: 'spring', stiffness: 300 }}>
                      <Link href={`/services/${service.slug}`} className="block h-full">
                        <div className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 h-full border border-slate-200 dark:border-slate-700 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-xl hover:shadow-primary-600/5 transition-all duration-300 group overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary-50 dark:from-primary-900/10 to-transparent rounded-bl-[80px] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="relative">
                            <div className="flex items-start justify-between mb-5">
                              <div className="w-14 h-14 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl flex items-center justify-center text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform">
                                <Icon size={26} />
                              </div>
                              <div className="flex items-center gap-2">
                                {service.isPopular && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-bold">
                                    <Star size={10} fill="currentColor" /> Popular
                                  </span>
                                )}
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                              {service.name}
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed">
                              {service.shortDescription}
                            </p>
                            {service.timeline && (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                                <Clock size={12} />
                                <span>{service.timeline}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                              {service.pricing?.basePrice > 0 && !service.pricing?.isCustom ? (
                                <p className="text-xl font-extrabold text-slate-900 dark:text-white">
                                  ₹{service.pricing.basePrice.toLocaleString('en-IN')}
                                  <span className="text-xs font-normal text-slate-400 ml-1">+ GST</span>
                                </p>
                              ) : (
                                <p className="text-sm font-medium text-slate-500">Custom Pricing</p>
                              )}
                              <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                                Details <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {!loading && displayFiltered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={32} className="text-slate-400" />
              </div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">No services found</p>
              <p className="text-slate-500 mt-1">Try a different search term or category</p>
            </motion.div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="relative bg-gradient-to-br from-primary-600 via-primary-700 to-blue-800 rounded-3xl p-10 md:p-16 text-center overflow-hidden">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full blur-3xl" />
              <div className="absolute bottom-10 right-10 w-60 h-60 bg-white rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
                Not Sure Which Service You Need?
              </h2>
              <p className="text-primary-100 text-lg max-w-2xl mx-auto mb-8">
                Talk to our expert CAs for free. We'll understand your requirements and recommend the best solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="tel:+918924954143" className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 rounded-xl font-bold hover:bg-primary-50 transition-colors shadow-lg">
                  <Phone size={20} /> Call Now — Free Consultation
                </a>
                <a href="https://wa.me/918924954143" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white rounded-xl font-bold border border-white/20 hover:bg-white/20 transition-colors">
                  WhatsApp Us
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
