import React from 'react';
import { Quote, Building2, Globe2, Cpu, Zap, Triangle } from 'lucide-react';

const Testimonials: React.FC = () => {
  const logos = [
    { name: 'TechFlow', icon: <Cpu className="w-6 h-6" /> },
    { name: 'GlobalCorp', icon: <Globe2 className="w-6 h-6" /> },
    { name: 'Innovate', icon: <Zap className="w-6 h-6" /> },
    { name: 'NextGen', icon: <Triangle className="w-6 h-6" /> },
    { name: 'BuildWell', icon: <Building2 className="w-6 h-6" /> },
  ];

  const testimonials = [
    {
      quote: "TimeWise saved us over $15k in hardware costs immediately. We just used our existing tablets.",
      author: "Sarah Jenkins",
      role: "HR Director",
      company: "TechFlow"
    },
    {
      quote: "Finally, a system that actually stops buddy punching. The biometric verification is flawless and fast.",
      author: "Michael Chen",
      role: "Operations Manager",
      company: "Innovate Inc."
    },
    {
      quote: "The analytics are a game changer. I can see who is late or absent in real-time from my phone.",
      author: "David Okon",
      role: "CEO",
      company: "BuildWell"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-white to-slate-50 border-y border-slate-200 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logos */}
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-8">Trusted by forward-thinking teams</p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {logos.map((logo, idx) => (
              <div key={idx} className="flex items-center gap-2 group cursor-default">
                <span className="text-slate-400 group-hover:text-blue-600 transition-colors">{logo.icon}</span>
                <span className="text-lg font-bold text-slate-400 group-hover:text-slate-900 transition-colors">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <div key={idx} className="bg-slate-50 p-8 rounded-2xl border border-slate-200 relative hover:bg-white hover:shadow-lg transition-all">
              <Quote className="h-8 w-8 text-blue-200 absolute top-6 right-6" />
              <p className="text-slate-600 mb-6 relative z-10 leading-relaxed italic">"{item.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3b82f6] to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  {item.author[0]}
                </div>
                <div>
                  <h4 className="text-slate-900 font-semibold text-sm">{item.author}</h4>
                  <p className="text-slate-500 text-xs">{item.role}, {item.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;