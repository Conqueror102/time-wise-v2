'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  ScanFace, 
  Fingerprint, 
  Laptop, 
  CheckCircle2,
  Apple,
  Chrome
} from 'lucide-react';

const SupportedDevices: React.FC = () => {
  const devices = [
    {
      icon: <Smartphone className="w-8 h-8" />,
      title: "Smartphones",
      desc: "iOS & Android",
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: <Tablet className="w-8 h-8" />,
      title: "Tablets",
      desc: "iPad & Android Tablets",
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      icon: <Laptop className="w-8 h-8" />,
      title: "Laptops",
      desc: "MacBook & Windows",
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      icon: <Monitor className="w-8 h-8" />,
      title: "Desktops",
      desc: "iMac & PC Workstations",
      color: "text-slate-600",
      bg: "bg-slate-100"
    }
  ];

  const biometrics = [
    {
      name: "Face ID",
      platform: "Apple Devices",
      icon: <ScanFace className="w-6 h-6" />,
      status: "Supported"
    },
    {
      name: "Touch ID",
      platform: "Mac & iOS",
      icon: <Fingerprint className="w-6 h-6" />,
      status: "Supported"
    },
    {
      name: "Windows Hello",
      platform: "Windows 10/11",
      icon: <ScanFace className="w-6 h-6" />,
      status: "Supported"
    },
    {
      name: "Android Biometrics",
      platform: "Android Devices",
      icon: <Fingerprint className="w-6 h-6" />,
      status: "Supported"
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Works With What You Have
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-lg">
              No need to buy expensive hardware. TimeWise runs securely on the devices your team already uses.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column: Device Support */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl shadow-slate-200/50"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <Monitor className="w-6 h-6 text-blue-600" />
              Supported Devices
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {devices.map((device, idx) => (
                <div 
                  key={idx}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-300 group"
                >
                  <div className={`w-14 h-14 rounded-xl ${device.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={device.color}>{device.icon}</div>
                  </div>
                  <h4 className="font-bold text-slate-900">{device.title}</h4>
                  <p className="text-sm text-slate-500">{device.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-8 border-t border-slate-100 flex flex-wrap gap-4">
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                 <Apple className="w-4 h-4" /> iOS & macOS
               </span>
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                 <Monitor className="w-4 h-4" /> Windows
               </span>
               <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-medium">
                 <Smartphone className="w-4 h-4" /> Android
               </span>
            </div>
          </motion.div>

          {/* Right Column: Biometric Support */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
               {/* Decorative circles */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>

               <h3 className="text-2xl font-bold mb-2 relative z-10">Biometric Security</h3>
               <p className="text-blue-100 mb-8 relative z-10">
                 We use the secure hardware already built into your devices for bank-grade authentication.
               </p>

               <div className="space-y-3 relative z-10">
                 {biometrics.map((bio, idx) => (
                   <div key={idx} className="flex items-center justify-between bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-white/20 rounded-lg">
                          {bio.icon}
                        </div>
                        <div>
                          <p className="font-semibold">{bio.name}</p>
                          <p className="text-xs text-blue-200">{bio.platform}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-medium bg-green-500/20 text-green-300 px-2 py-1 rounded-full border border-green-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        {bio.status}
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-lg flex items-center gap-4">
               <div className="p-3 bg-green-100 rounded-full text-green-600">
                 <CheckCircle2 className="w-6 h-6" />
               </div>
               <div>
                 <h4 className="font-bold text-slate-900">Privacy First</h4>
                 <p className="text-sm text-slate-600">Biometric data stays on the device. We never store actual fingerprints or face data.</p>
               </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default SupportedDevices;
