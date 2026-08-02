import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Truck } from 'lucide-react';
import blcLogo from '../../assets/blc-logo.png';

const Footer = () => {
  return (
    <footer className="bg-[#F4DDD2]/60 dark:bg-[#120a06] text-[#4A3226]/85 dark:text-[#F7E8DF]/75 border-t border-[#C98A63]/25 dark:border-[#C98A63]/15 transition-colors duration-300">
      
      {/* Brand values / trust triggers banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-b border-[#C98A63]/20 dark:border-[#C98A63]/15">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-3 text-luxury-gold-500 font-semibold uppercase tracking-widest text-xs sm:text-sm">
              <Truck className="w-5 h-5 text-[#C98A63]" />
              <span>COMPLIMENTARY INSURED SHIPPING</span>
            </div>
            <p className="text-xs text-[#4A3226]/70 dark:text-[#F7E8DF]/65 leading-relaxed">
              100% free &amp; fully insured Express delivery pan-India with real-time tracking on all orders.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-3 text-luxury-gold-500 font-semibold uppercase tracking-widest text-xs sm:text-sm">
              <Award className="w-5 h-5 text-[#C98A63]" />
              <span>PREMIUM QUALITY</span>
            </div>
            <p className="text-xs text-[#4A3226]/70 dark:text-[#F7E8DF]/65 leading-relaxed">
              Every piece is crafted with skin-friendly materials and durable finishes.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-start space-y-2">
            <div className="flex items-center space-x-3 text-luxury-gold-500 font-semibold uppercase tracking-widest text-xs sm:text-sm">
              <ShieldCheck className="w-5 h-5 text-[#C98A63]" />
              <span>100% SECURE &amp; AUTHENTIC</span>
            </div>
            <p className="text-xs text-[#4A3226]/70 dark:text-[#F7E8DF]/65 leading-relaxed">
              End-to-end encrypted transactions with official invoice receipt.
            </p>
          </div>
        </div>
      </div>

      {/* Main footer grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          
          {/* Column 1: Logo & description */}
          <div className="space-y-6">
            <Link to="/" className="inline-block transition-transform hover:scale-105">
              <img src={blcLogo} alt="BLC Brand Logo" className="h-14 w-auto object-contain brightness-110" />
            </Link>
            <p className="text-sm leading-relaxed text-[#4A3226]/70 dark:text-[#F7E8DF]/60">
              Curating modern fashion jewellery. We combine minimal aesthetics with skin-friendly materials and meticulous design to elevate your style.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-luxury-gold-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z"/></svg>
              </a>
              <a href="#" className="hover:text-luxury-gold-500 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="hover:text-luxury-gold-500 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-[#4A3226] dark:text-white font-semibold uppercase tracking-widest text-xs font-playfair">Exquisite Collections</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shop?category=Rings" className="hover:text-luxury-gold-500 transition-colors">Rings & Bands</Link>
              </li>
              <li>
                <Link to="/shop?category=Hamper" className="hover:text-luxury-gold-500 transition-colors">Hampers</Link>
              </li>
              <li>
                <Link to="/shop?category=Bangles" className="hover:text-luxury-gold-500 transition-colors">Bangles</Link>
              </li>
              <li>
                <Link to="/shop?category=Bracelets" className="hover:text-luxury-gold-500 transition-colors">Bracelets</Link>
              </li>
              <li>
                <Link to="/shop?category=Watches" className="hover:text-luxury-gold-500 transition-colors">Premium Timepieces</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Customer Care */}
          <div className="space-y-4">
            <h4 className="text-[#4A3226] dark:text-white font-semibold uppercase tracking-widest text-xs font-playfair">Client Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/contact" className="hover:text-luxury-gold-500 transition-colors">Contact Relations</Link>
              </li>
              <li>
                <Link to="/#faq" className="hover:text-luxury-gold-500 transition-colors">Frequently Asked Questions</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-luxury-gold-500 transition-colors">Shop Catalog</Link>
              </li>
              <li>
                <a href="#" className="hover:text-luxury-gold-500 transition-colors">Privacy & Cookie Policies</a>
              </li>
            </ul>
          </div>

          {/* Column 4: Address */}
          <div className="space-y-4">
            <h4 className="text-[#4A3226] dark:text-white font-semibold uppercase tracking-widest text-xs font-playfair">The Atelier</h4>
            <ul className="space-y-2 text-sm text-[#4A3226]/70 dark:text-[#F7E8DF]/65">
              <li>bloomluxecollection</li>
              <li>C-242, Harsh Vihar, Hari Nagar</li>
              <li>Jaitpur, Badarpur, New Delhi – 110044</li>
              <li className="pt-2 text-[#4A3226]/80 dark:text-[#F7E8DF]/60">
                Email: <a href="mailto:bloomluxe.support@gmail.com" className="hover:text-luxury-gold-500">bloomluxe.support@gmail.com</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="border-t border-[#C98A63]/25 dark:border-[#C98A63]/15 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#4A3226]/60 dark:text-[#F7E8DF]/50">
          <p>© {new Date().getFullYear()} bloomluxecollection. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <a href="#" className="hover:text-neutral-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-neutral-400 transition-colors">Accessibility Statement</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
