import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import api from '../../lib/api';
import { LoadingSpinner } from '../../components/ui';
import {
  Receipt, FileText, Building2, Shield, BarChart3, Award, Wallet, Globe,
  Factory, Store, UtensilsCrossed, Heart, Users, FileCheck, ChevronRight, Search
} from 'lucide-react';

const iconMap = {
  Receipt, FileText, Building2, Shield, BarChart3, Award, Wallet, Globe,
  Factory, Store, UtensilsCrossed, Heart, Users, FileCheck, FileSpreadsheet: FileText, UsersRound: Users,
};

const categories = [
  { key: '', label: 'All Services' },
  { key: 'tax', label: 'Tax' },
  { key: 'registration', label: 'Registration' },
  { key: 'compliance', label: 'Compliance' },
  { key: 'licensing', label: 'Licensing' },
  { key: 'legal', label: 'Legal' },
];

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchServices();
  }, [category]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const params = category ? `category=${category}` : '';
      const data = await api.getServices(params);
      setServices(data.services);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? services.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.shortDescription.toLowerCase().includes(search.toLowerCase())
      )
    : services;

  return (
    <>
      <Navbar />
      
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">Our Services</h1>
          <p className="text-lg text-primary-100 max-w-2xl mx-auto mb-8">
            Comprehensive CA services for all your business needs. Choose a service to get started.
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  category === cat.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(service => {
                const Icon = iconMap[service.icon] || FileText;
                return (
                  <Link key={service._id || service.slug} href={`/services/${service.slug}`}>
                    <div className="card-hover group cursor-pointer h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                          <Icon size={24} />
                        </div>
                        {service.isPopular && (
                          <span className="badge-green">Popular</span>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                        {service.shortDescription}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                        {service.pricing?.basePrice > 0 && !service.pricing?.isCustom ? (
                          <p className="text-lg font-bold text-slate-900 dark:text-white">
                            ₹{service.pricing.basePrice.toLocaleString('en-IN')}
                            <span className="text-xs font-normal text-slate-500 ml-1">+ GST</span>
                          </p>
                        ) : (
                          <p className="text-sm text-slate-500">Custom Pricing</p>
                        )}
                        <span className="text-sm font-medium text-primary-600 dark:text-primary-400 flex items-center gap-1">
                          Learn more <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-slate-500">No services found. Try a different search or category.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
