'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Smartphone, Fingerprint, ScanFace, CheckCircle2 } from 'lucide-react';

const Hero: React.FC = () => {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-t from-blue-500/40 via-blue-300/20 to-transparent">
      {/* Background Motion Gradients */}
      <div className="absolute inset-0 overflow-hidden -z-10">
        {/* Soft blue glow top-left */}
        <motion.div
          {...({
            initial: { opacity: 0.4, y: 0 },
            animate: { opacity: 0.6, y: [-24, 16, -24] },
            transition: { duration: 14, repeat: Infinity, ease: "easeInOut" },
          } as any)}
          className="absolute -top-40 -left-10 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/40 via-blue-500/25 to-transparent blur-3xl"
        />

        {/* Soft cyan glow top-right */}
        <motion.div
          {...({
            initial: { opacity: 0.3, y: 0 },
            animate: { opacity: 0.5, y: [16, -10, 16] },
            transition: { duration: 16, repeat: Infinity, ease: "easeInOut" },
          } as any)}
          className="absolute -top-48 right-0 w-[26rem] h-[26rem] rounded-full bg-gradient-to-bl from-blue-300/35 via-cyan-400/20 to-transparent blur-3xl"
        />

        {/* Very subtle base wash bottom-center */}
        <motion.div
          {...({
            initial: { opacity: 0.2, scale: 1 },
            animate: { opacity: [0.2, 0.35, 0.2], scale: [1, 1.06, 1] },
            transition: { duration: 18, repeat: Infinity, ease: "easeInOut" },
          } as any)}
          className="absolute -bottom-56 left-1/2 -translate-x-1/2 w-[34rem] h-[34rem] rounded-full bg-gradient-to-t from-blue-100/50 via-blue-400/20 to-transparent blur-3xl"
        />

        {/* Subtle radial overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),transparent_55%),radial-gradient(circle_at_bottom,_rgba(147,197,253,0.05),transparent_55%)]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div
            {...({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5 }
            } as any)}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium mb-6 backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            The Future of Attendance is Here
          </motion.div>

          <motion.h1
            {...({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, delay: 0.1 }
            } as any)}
            className="text-5xl md:text-7xl font-extrabold tracking-tight text-gray-900 mb-6 leading-tight"
          >
            Attendance Without <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-800">
              The Expensive Machines
            </span>
          </motion.h1>

          <motion.p
            {...({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, delay: 0.2 }
            } as any)}
            className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto"
          >
            No more bulky biometric devices. No more paper notebooks. 
            TimeWise turns everyday devices into secure, biometric attendance terminals.
          </motion.p>
          
          <motion.div
             {...({
              initial: { opacity: 0, scale: 0.95 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.5, delay: 0.25 }
            } as any)}
             className="flex flex-wrap justify-center gap-4 md:gap-8 mb-10 text-sm md:text-base font-semibold text-gray-800"
          >
             {["Low Cost", "High Accuracy", "Zero Cheating"].map((label, idx) => (
               <motion.span
                 key={label}
                 {...({
                   whileHover: { y: -3, scale: 1.02 },
                   transition: { type: "spring", stiffness: 260, damping: 18 },
                 } as any)}
                 className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200"
               >
                 <CheckCircle2 className="h-4 w-4 text-blue-600" />
                 {label}
               </motion.span>
             ))}
          </motion.div>

          <motion.div
            {...({
              initial: { opacity: 0, y: 20 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.5, delay: 0.3 }
            } as any)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <a
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-600/30 group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#features"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all shadow-md"
            >
              See How It Works
            </a>
          </motion.div>
        </div>

        {/* Feature Highlights/Visual */}
        <motion.div
          {...({
            initial: { opacity: 0, y: 40 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.7, delay: 0.5 }
          } as any)}
          className="mt-20 relative"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
             <div className="bg-white backdrop-blur-md p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300 hover:border-blue-300 shadow-lg">
                <div className="p-3 bg-blue-100 rounded-full mb-4">
                  <Smartphone className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Use Any Device</h3>
                <p className="text-sm text-gray-600 mt-2">Works on phones, laptops, and tablets you already own.</p>
             </div>
             <div className="bg-white backdrop-blur-md p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300 md:-translate-y-4 hover:border-blue-300 shadow-lg">
                <div className="p-3 bg-blue-100 rounded-full mb-4">
                  <ScanFace className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Biometric Security</h3>
                <p className="text-sm text-gray-600 mt-2">Supports FaceID, TouchID, and Windows Hello.</p>
             </div>
             <div className="bg-white backdrop-blur-md p-6 rounded-2xl border border-blue-100 flex flex-col items-center text-center transform hover:scale-105 transition-transform duration-300 hover:border-blue-300 shadow-lg">
                <div className="p-3 bg-blue-100 rounded-full mb-4">
                  <Fingerprint className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Zero Fraud</h3>
                <p className="text-sm text-gray-600 mt-2">100% verified check-ins. No more "buddy punching".</p>
             </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;