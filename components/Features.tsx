'use client';

import React from 'react';
import { ShieldCheck, Zap, Users, Download, Lock, Smartphone } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Mon', onTime: 85, late: 10, absent: 5 },
  { name: 'Tue', onTime: 88, late: 8, absent: 4 },
  { name: 'Wed', onTime: 92, late: 5, absent: 3 },
  { name: 'Thu', onTime: 80, late: 15, absent: 5 },
  { name: 'Fri', onTime: 85, late: 10, absent: 5 },
];

const Features: React.FC = () => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section id="features" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-blue-100/50 to-transparent pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything You Need to Succeed</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Powerful features designed for teams of all sizes, ensuring accuracy and simplicity.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                icon: <Smartphone className="h-6 w-6 text-[#60a5fa]" />,
                title: "Multiple Methods",
                desc: "QR codes, manual entry, facial recognition, and fingerprint scanning."
              },
              {
                icon: <Lock className="h-6 w-6 text-[#60a5fa]" />,
                title: "Enterprise Security",
                desc: "Bank-level encryption and complete data isolation for each organization."
              },
              {
                icon: <Users className="h-6 w-6 text-[#60a5fa]" />,
                title: "Staff Management",
                desc: "Easily manage staff members, departments, and roles from one dashboard."
              },
              {
                icon: <Download className="h-6 w-6 text-[#60a5fa]" />,
                title: "Easy Integration",
                desc: "Export reports for payroll (CSV) and integrate with existing systems."
              }
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-200 transition-colors shadow-sm hover:shadow-md">
                <div className="p-3 bg-slate-100 rounded-lg inline-block mb-4 border border-slate-200">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Analytics Visual */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl relative">
             <div className="absolute top-0 right-0 p-8 opacity-10">
                <Zap className="h-24 w-24 text-blue-600" />
             </div>
            <div className="mb-6">
               <h3 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2">
                 <ShieldCheck className="h-6 w-6 text-blue-600" />
                 Real-Time Analytics
               </h3>
               <p className="text-slate-600">Track attendance patterns, identify trends, and make data-driven decisions instantly.</p>
            </div>

            {/* Recharts Implementation */}
            <div className="h-64 w-full bg-slate-50 rounded-xl p-4 border border-slate-200">
               {mounted && (
                 <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(0,0,0,0.05)'}}
                      contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                      itemStyle={{ color: '#0f172a' }}
                    />
                    <Bar dataKey="onTime" name="On Time" stackId="a" radius={[0, 0, 4, 4]}>
                      {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="#3b82f6" />
                      ))}
                    </Bar>
                    <Bar dataKey="late" name="Late" stackId="a" fill="#eab308" />
                    <Bar dataKey="absent" name="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
               )}
            </div>
            
            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#3b82f6]"></div>
                <span>On Time</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Late</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Absent</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;