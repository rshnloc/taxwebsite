import Link from 'next/link';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import {
  ArrowRight, CheckCircle, Shield, Clock, Users, Star, Phone,
  FileText, Building2, Award, Globe, Receipt, BarChart3, Wallet,
  Heart, Store, UtensilsCrossed, Factory, ChevronRight
} from 'lucide-react';

const services = [
  { name: 'Income Tax', slug: 'income-tax', icon: Receipt, desc: 'ITR filing & tax planning', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' },
  { name: 'GST', slug: 'gst', icon: FileText, desc: 'Registration & return filing', color: 'bg-green-50 dark:bg-green-900/20 text-green-600' },
  { name: 'Company Incorporation', slug: 'company-incorporation', icon: Building2, desc: 'Pvt Ltd, OPC, LLP', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' },
  { name: 'Trademarks', slug: 'trademarks', icon: Shield, desc: 'Brand protection', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600' },
  { name: 'Balance Sheet', slug: 'balance-sheet', icon: BarChart3, desc: 'Financial statements', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600' },
  { name: 'ISO Certification', slug: 'iso-certification', icon: Award, desc: 'Quality certification', color: 'bg-teal-50 dark:bg-teal-900/20 text-teal-600' },
  { name: 'MSME Registration', slug: 'msme-registration', icon: Factory, desc: 'Udyam registration', color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600' },
  { name: 'Import Export Code', slug: 'import-export-code', icon: Globe, desc: 'IEC registration', color: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600' },
];

const stats = [
  { label: 'Happy Clients', value: '1000+' },
  { label: 'Services Delivered', value: '5000+' },
  { label: 'Years Experience', value: '10+' },
  { label: 'Expert CAs', value: '15+' },
];

const testimonials = [
  { name: 'Rajesh Kumar', company: 'Kumar Enterprises', text: 'Helpshack made our GST filing effortless. Their team is incredibly professional and responsive.', rating: 5 },
  { name: 'Priya Agarwal', company: 'Agarwal Foods Pvt Ltd', text: 'Got our company incorporated in just 10 days. The entire process was smooth and transparent.', rating: 5 },
  { name: 'Amit Singh', company: 'Singh Logistics', text: 'Best CA service platform I have used. The dashboard makes tracking everything so easy.', rating: 5 },
];

export default function Home() {
  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 dark:bg-primary-900/30 rounded-full blur-3xl opacity-50" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-100 dark:bg-primary-900/20 rounded-full blur-3xl opacity-50" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-900/20 rounded-full mb-6">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium text-primary-700 dark:text-primary-400">Trusted by 1000+ businesses</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white leading-tight mb-6">
              Expert CA Services,{' '}
              <span className="gradient-text">Simplified.</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 mb-8 leading-relaxed max-w-2xl">
              From income tax to company registration — Helpshack provides end-to-end chartered accountant services with a modern, hassle-free experience. Track everything in real-time.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link href="/services" className="btn-primary text-lg px-8 py-4">
                Explore Services <ArrowRight size={20} className="ml-2" />
              </Link>
              <Link href="/contact" className="btn-outline text-lg px-8 py-4">
                <Phone size={20} className="mr-2" /> Talk to Expert
              </Link>
            </div>

            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: CheckCircle, text: 'Expert CAs' },
                { icon: Shield, text: '100% Secure' },
                { icon: Clock, text: 'Fast Delivery' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <item.icon size={16} className="text-green-500" />
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-slate-800 border-y border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              Our Services
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Comprehensive CA services covering tax, registration, compliance, and licensing needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(service => (
              <Link key={service.slug} href={`/services/${service.slug}`}>
                <div className="card-hover group cursor-pointer">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${service.color}`}>
                    <service.icon size={24} />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{service.desc}</p>
                  <span className="text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center gap-1">
                    Learn more <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link href="/services" className="btn-outline">
              View All Services <ArrowRight size={18} className="ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How It Works
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Simple 4-step process to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: 1, title: 'Choose Service', desc: 'Browse and select the service you need from our comprehensive list' },
              { step: 2, title: 'Submit Documents', desc: 'Upload required documents securely through our platform' },
              { step: 3, title: 'Expert Processing', desc: 'Our qualified CAs process your application with care' },
              { step: 4, title: 'Get Delivered', desc: 'Receive completed documents and certificates digitally' },
            ].map(item => (
              <div key={item.step} className="text-center relative">
                <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{item.step}</span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              What Our Clients Say
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="card">
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-primary-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-primary-100 mb-8">
            Join 1000+ businesses that trust Helpshack for their CA needs
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="inline-flex items-center px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all">
              Create Free Account <ArrowRight size={20} className="ml-2" />
            </Link>
            <Link href="/contact" className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-all">
              <Phone size={20} className="mr-2" /> +91 89249 54143
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
