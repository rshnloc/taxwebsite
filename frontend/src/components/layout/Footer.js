import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

const services = [
  { name: 'Income Tax', href: '/services/income-tax' },
  { name: 'GST', href: '/services/gst' },
  { name: 'Company Incorporation', href: '/services/company-incorporation' },
  { name: 'Trademarks', href: '/services/trademarks' },
  { name: 'MSME Registration', href: '/services/msme-registration' },
  { name: 'LLP', href: '/services/llp' },
];

export default function Footer() {
  return (
    <footer className="bg-slate-900 dark:bg-slate-950 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-400 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">H</span>
              </div>
              <span className="text-xl font-bold text-white">
                Help<span className="text-primary-400">shack</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Professional Chartered Accountant services for all your tax, compliance, and registration needs. Trusted by 1000+ businesses.
            </p>
            <div className="flex gap-3">
              {['facebook', 'twitter', 'linkedin', 'instagram'].map(social => (
                <a
                  key={social}
                  href={`#${social}`}
                  className="w-9 h-9 bg-slate-800 hover:bg-primary-600 rounded-lg flex items-center justify-center transition-colors"
                >
                  <span className="text-xs uppercase font-bold text-slate-400 hover:text-white">
                    {social[0].toUpperCase()}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-white font-semibold mb-4">Services</h3>
            <ul className="space-y-2">
              {services.map(service => (
                <li key={service.href}>
                  <Link href={service.href} className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
                    {service.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              {[
                { name: 'About Us', href: '/about' },
                { name: 'All Services', href: '/services' },
                { name: 'Contact', href: '/contact' },
                { name: 'Client Login', href: '/login' },
                { name: 'Privacy Policy', href: '#' },
                { name: 'Terms & Conditions', href: '#' },
              ].map(link => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-slate-400 hover:text-primary-400 transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-primary-400 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-slate-400">128/389 H-2, Block Kidwai Nagar, Kanpur, 208011</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-primary-400 flex-shrink-0" />
                <a href="mailto:dhirajame89@gmail.com" className="text-sm text-slate-400 hover:text-primary-400">
                  dhirajame89@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-primary-400 flex-shrink-0" />
                <a href="tel:+918924954143" className="text-sm text-slate-400 hover:text-primary-400">
                  +91 89249 54143
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Helpshack. All rights reserved.
          </p>
          <p className="text-sm text-slate-500">
            Crafted with ❤️ in Kanpur, India
          </p>
        </div>
      </div>
    </footer>
  );
}
