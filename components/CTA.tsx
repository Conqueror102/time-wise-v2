import React from 'react';

const CTA: React.FC = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-[#2563eb]">
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
          Ready to transform your attendance tracking?
        </h2>
        <p className="text-[#dbeafe] text-lg md:text-xl mb-10 max-w-2xl mx-auto">
          Join hundreds of organizations already using TimeWise to streamline their workforce management.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-8 py-4 bg-white text-[#2563eb] rounded-full font-bold text-lg hover:bg-gray-100 transition-colors shadow-xl">
            Start Your Free Trial
          </button>
          <button className="px-8 py-4 bg-[#1d4ed8] text-white rounded-full font-bold text-lg hover:bg-[#1e40af] transition-colors border border-[#3b82f6]">
            Book a Demo
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;