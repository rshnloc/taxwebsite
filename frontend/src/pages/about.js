import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Award, Users, Shield, Target, CheckCircle, Star, Building2, Briefcase } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeIn = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const values = [
  { icon: Shield, title: 'Trust & Transparency', description: 'We believe in 100% transparency with our clients. No hidden charges, no surprises.' },
  { icon: Target, title: 'Accuracy', description: 'Every filing, every document is meticulously reviewed to ensure zero errors.' },
  { icon: Users, title: 'Client First', description: 'Your success is our success. We go above and beyond to meet your compliance needs.' },
  { icon: Award, title: 'Excellence', description: 'We maintain the highest standards of professional excellence in all our services.' },
];

const stats = [
  { value: '1000+', label: 'Happy Clients' },
  { value: '5000+', label: 'Filings Done' },
  { value: '15+', label: 'Services' },
  { value: '99%', label: 'Success Rate' },
];

const team = [
  { name: 'CA Dhiraj Kumar', role: 'Founder & Senior CA', description: 'Over 10 years of experience in taxation, GST, and business compliance.' },
  { name: 'Team Tax Experts', role: 'Tax Department', description: 'Dedicated team handling Income Tax, GST, and TDS filings with precision.' },
  { name: 'Registration Team', role: 'Company Registration', description: 'Specialists in company incorporation, LLP, trademarks, and business registrations.' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      {/* Hero */}
      <section className="pt-24 pb-16 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-white blur-3xl"></div>
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full bg-white blur-3xl"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 initial="hidden" animate="visible" variants={fadeIn} className="text-4xl md:text-5xl font-bold mb-6">
            About Helpshack
          </motion.h1>
          <motion.p initial="hidden" animate="visible" variants={fadeIn} transition={{ delay: 0.1 }} className="text-xl text-primary-100 max-w-3xl mx-auto">
            Your trusted partner for all tax, compliance, and business registration services. We simplify the complex world of Indian business regulations.
          </motion.p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: idx * 0.1 }} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-primary-600">{stat.value}</p>
                <p className="text-slate-500 mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn}>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-600 dark:text-slate-300">
                <p>
                  Helpshack was founded with a simple mission — to make business compliance easy, affordable, and accessible for everyone. Based in Kanpur, Uttar Pradesh, we have been helping businesses of all sizes navigate the complex landscape of Indian regulations.
                </p>
                <p>
                  From income tax filings to company registration, GST compliance to trademark protection, we offer end-to-end professional services that let you focus on what matters most — growing your business.
                </p>
                <p>
                  Our team of experienced Chartered Accountants and compliance experts work tirelessly to ensure that every filing is accurate, every deadline is met, and every client is satisfied.
                </p>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: 0.2 }} className="relative">
              <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-2xl p-8">
                <div className="space-y-4">
                  {[
                    { icon: Building2, text: 'Established in Kanpur, UP' },
                    { icon: Briefcase, text: '15+ Professional Services' },
                    { icon: Users, text: '1000+ Satisfied Clients' },
                    { icon: Star, text: '99% Client Satisfaction Rate' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <item.icon className="text-primary-600" size={20} />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Values</h2>
            <p className="text-slate-500 mt-3 max-w-2xl mx-auto">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => (
              <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: idx * 0.1 }} className="card p-6 text-center hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="text-primary-600" size={28} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{value.title}</h3>
                <p className="text-sm text-slate-500">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Our Team</h2>
            <p className="text-slate-500 mt-3">Experienced professionals dedicated to your success</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {team.map((member, idx) => (
              <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: idx * 0.15 }} className="card p-8 text-center hover:shadow-lg transition-shadow">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{member.name}</h3>
                <p className="text-sm text-primary-600 mb-3">{member.role}</p>
                <p className="text-sm text-slate-500">{member.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-slate-50 dark:bg-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Why Choose Helpshack?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {[
              'Expert Chartered Accountants with 10+ years experience',
              'Affordable pricing with no hidden charges',
              'Quick turnaround — most services completed within 7 days',
              'Dedicated support team available for all your queries',
              'End-to-end service from filing to follow-up',
              'Secure document handling and data privacy',
              'Track your application status in real-time',
              'Trusted by 1000+ businesses across India',
            ].map((item, idx) => (
              <motion.div key={idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} transition={{ delay: idx * 0.05 }} className="flex items-center gap-3 p-3">
                <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
                <span className="text-slate-700 dark:text-slate-300">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
