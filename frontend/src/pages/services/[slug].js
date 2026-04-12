import { useRouter } from 'next/router';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';
import {
  CheckCircle, Clock, FileText, ArrowRight, ChevronDown, ChevronUp,
  Upload, Shield, Phone
} from 'lucide-react';

export default function ServiceDetailPage() {
  const router = useRouter();
  const { slug } = router.query;
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    if (slug) fetchService();
  }, [slug]);

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

  if (loading) return <><Navbar /><LoadingSpinner /><Footer /></>;
  if (!service) return <><Navbar /><div className="min-h-[60vh] flex items-center justify-center"><p>Service not found</p></div><Footer /></>;

  return (
    <>
      <Navbar />
      
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <Link href="/services" className="text-primary-200 hover:text-white text-sm mb-4 inline-block">
              ← Back to Services
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">{service.name}</h1>
            <p className="text-lg text-primary-100 mb-6">{service.shortDescription}</p>
            <div className="flex flex-wrap gap-4 items-center">
              {service.pricing?.basePrice > 0 && (
                <div className="bg-white/10 backdrop-blur rounded-xl px-6 py-3">
                  <p className="text-sm text-primary-200">Starting from</p>
                  <p className="text-2xl font-bold text-white">
                    ₹{service.pricing.basePrice.toLocaleString('en-IN')}
                    <span className="text-sm font-normal text-primary-200 ml-1">+ GST</span>
                  </p>
                </div>
              )}
              <div className="flex items-center gap-2 text-primary-200">
                <Clock size={18} />
                <span>{service.timeline}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <div className="card">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">About This Service</h2>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{service.description}</p>
            </div>

            {/* Features */}
            {service.features?.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">What&apos;s Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {service.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                      <span className="text-slate-700 dark:text-slate-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Process */}
            {service.process?.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">How It Works</h2>
                <div className="space-y-6">
                  {service.process.map((step, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/20 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{step.step}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQs */}
            {service.faqs?.length > 0 && (
              <div className="card">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">FAQs</h2>
                <div className="space-y-2">
                  {service.faqs.map((faq, i) => (
                    <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl">
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-4 text-left"
                      >
                        <span className="font-medium text-slate-900 dark:text-white">{faq.question}</span>
                        {openFaq === i ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                      {openFaq === i && (
                        <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            <div className="card sticky top-24">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Ready to Apply?</h3>
              {service.pricing?.basePrice > 0 && (
                <div className="mb-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500">Base Price</span>
                    <span className="font-medium">₹{service.pricing.basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-500">GST ({service.pricing.gstPercent}%)</span>
                    <span className="font-medium">₹{((service.pricing.basePrice * service.pricing.gstPercent) / 100).toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold text-primary-600">₹{service.pricing.totalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
              <Link href={`/dashboard/apply?service=${service.slug}`} className="btn-primary w-full justify-center mb-3">
                Apply Now <ArrowRight size={18} className="ml-2" />
              </Link>
              <a href="tel:+918924954143" className="btn-outline w-full justify-center">
                <Phone size={18} className="mr-2" /> Call Us
              </a>
            </div>

            {/* Documents Required */}
            {service.requiredDocuments?.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                  <Upload size={18} className="inline mr-2" />
                  Documents Required
                </h3>
                <ul className="space-y-2">
                  {service.requiredDocuments.map((doc, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <FileText size={16} className={`mt-0.5 flex-shrink-0 ${doc.isMandatory ? 'text-red-500' : 'text-slate-400'}`} />
                      <div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{doc.name}</span>
                        {doc.isMandatory && <span className="text-red-500 ml-1">*</span>}
                        {doc.description && <p className="text-xs text-slate-400">{doc.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trust */}
            <div className="card">
              <div className="flex items-center gap-3 mb-3">
                <Shield size={20} className="text-green-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white">100% Secure</h3>
              </div>
              <p className="text-sm text-slate-500">
                Your documents are encrypted and securely stored. We follow strict data protection protocols.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
