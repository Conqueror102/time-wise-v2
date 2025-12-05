import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const Benefits: React.FC = () => {
  const benefits = [
    "Better accuracy",
    "Lower costs",
    "Easier tracking",
    "Real-time visibility",
    "Cleaner data",
    "Zero manipulation"
  ];

  return (
    <section id="benefits" className="py-20 bg-white border-y border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-12">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Why Choose TimeWise?</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Perfect for Modern Organizations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {/* Card 1 */}
           <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all duration-300 group shadow-sm hover:shadow-md">
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">Zero Hardware Cost</h3>
              <p className="text-slate-600 mb-6">Use your phone, laptop, or any device. Stop spending money on big biometric machines.</p>
              <div className="h-1 w-12 bg-blue-600 rounded-full group-hover:w-full transition-all duration-500"></div>
           </div>
           
           {/* Card 2 */}
           <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all duration-300 group shadow-sm hover:shadow-md">
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">Fully Biometric</h3>
              <p className="text-slate-600 mb-6">Supports Windows Hello, FaceID, TouchID, fingerprint sensors and more. Secure and fast.</p>
              <div className="h-1 w-12 bg-blue-600 rounded-full group-hover:w-full transition-all duration-500"></div>
           </div>

           {/* Card 3 */}
           <div className="bg-gradient-to-br from-white to-slate-50 p-8 rounded-2xl border border-slate-200 hover:border-blue-200 transition-all duration-300 group shadow-sm hover:shadow-md">
              <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-blue-600 transition-colors">Data Never Lost</h3>
              <p className="text-slate-600 mb-6">Cloud-backed history with filters & CSV export. Your records are always safe and accessible.</p>
              <div className="h-1 w-12 bg-blue-600 rounded-full group-hover:w-full transition-all duration-500"></div>
           </div>
        </div>

        <div className="mt-16 bg-blue-50 rounded-3xl p-8 md:p-12 border border-blue-100">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0">
               <h3 className="text-2xl font-bold text-slate-900 mb-2">The Results Speak for Themselves</h3>
               <p className="text-slate-600">Join organizations achieving transparency.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
              {benefits.map((item, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <span className="text-slate-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Benefits;