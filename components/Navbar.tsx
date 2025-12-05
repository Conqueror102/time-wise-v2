'use client';

import React, { useState, useEffect } from 'react';
import { Menu, X, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'Benefits', href: '#benefits' },
    { name: 'Pricing', href: '#pricing' },
  ];

  const handleNavClick = (href: string) => {
    setIsOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <nav
        className={`fixed top-0 md:top-6 left-0 right-0 z-50 transition-all duration-300 mx-auto ${
          scrolled || isOpen 
            ? 'w-full md:max-w-4xl bg-white/90 backdrop-blur-xl border-b md:border border-slate-200 md:rounded-full shadow-lg shadow-slate-200/50' 
            : 'w-full md:max-w-7xl bg-transparent border-transparent'
        }`}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-14">
            {/* Logo */}
            <div 
              className="flex-shrink-0 flex items-center gap-2 cursor-pointer group" 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <div className="bg-[#2563eb] p-1.5 rounded-lg group-hover:bg-[#3b82f6] transition-colors">
                <Clock className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">TimeWise</span>
            </div>
            
            {/* Desktop Nav */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-1">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.href)}
                    className="text-slate-600 hover:text-slate-900 hover:bg-slate-100 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200"
                  >
                    {link.name}
                  </button>
                ))}
                <div className="pl-4 ml-4 border-l border-slate-200">
                  <a
                    href="/register"
                    className="bg-[#2563eb] hover:bg-[#3b82f6] text-white px-5 py-1.5 rounded-full text-sm font-semibold transition-all shadow-lg shadow-[#1e3a8a]/20 hover:shadow-[#2563eb]/40"
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </div>
            
            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              >
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              {...({
                initial: { opacity: 0, height: 0 },
                animate: { opacity: 1, height: 'auto' },
                exit: { opacity: 0, height: 0 }
              } as any)}
              className="md:hidden bg-white border-b border-slate-200 overflow-hidden"
            >
              <div className="px-4 pt-2 pb-6 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => handleNavClick(link.href)}
                    className="text-slate-600 hover:text-slate-900 block px-3 py-3 rounded-md text-base font-medium w-full text-left hover:bg-slate-50"
                  >
                    {link.name}
                  </button>
                ))}
                 <a
                    href="/register"
                    onClick={() => setIsOpen(false)}
                    className="block w-full text-center bg-[#2563eb] text-white px-3 py-3 rounded-xl text-base font-semibold mt-6"
                  >
                    Start Free Trial
                  </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;