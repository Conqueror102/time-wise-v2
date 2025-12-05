'use client';

import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSubscriptionPayment } from '@/hooks/use-subscription-payment';

const Pricing: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>('Starter');
  const router = useRouter();
  const { loading, initiateUpgradePayment } = useSubscriptionPayment();

  const handlePlanClick = (planName: string, price: string) => {
    setSelectedPlan(planName);
    // Check if user is authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    if (!token) {
      // Not authenticated - redirect to login with return URL to pricing
      router.push(`/login?returnUrl=${encodeURIComponent('/pricing')}`);
      return;
    }

    // For free trial, redirect to registration
    if (planName === 'Starter') {
      router.push('/register');
      return;
    }

    // For paid plans, initiate payment using existing hook
    const plan = planName.toLowerCase() as 'professional' | 'enterprise';
    initiateUpgradePayment({
      plan,
      onSuccess: () => {
        // Payment initiated successfully, user will be redirected to Paystack
        console.log(`Initiating ${plan} upgrade`);
      },
      onError: (error) => {
        console.error('Payment initiation failed:', error);
      }
    });
  };

  const plans = [
    {
      name: "Starter",
      price: "Free",
      desc: "14-day trial • Max 10 staff",
      features: [
        "All features unlocked for 14 days",
        "Up to 10 staff members",
        "QR & Manual check-in",
        "Photo verification",
        "After trial: Basic check-in only"
      ],
      cta: "Start Free Trial"
    },
    {
      name: "Professional",
      price: "₦5k",
      period: "/month",
      desc: "For growing businesses",
      features: [
        "Up to 50 staff members",
        "Photo verification",
        "Basic analytics & reports",
        "Attendance history",
        "CSV export",
        "Priority support"
      ],
      cta: "Get Started"
    },
    {
      name: "Enterprise",
      price: "₦10k",
      period: "/month",
      desc: "For large organizations",
      features: [
        "Unlimited staff members",
        "Fingerprint verification",
        "Photo verification",
        "Advanced analytics",
        "Full reports & history",
        "Priority support"
      ],
      cta: "Get Started"
    }
  ];

  return (
    <section id="pricing" className="py-24 bg-gradient-to-b from-slate-50 to-blue-50/30 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-600">Choose the plan that fits your team size and needs.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <div 
              key={idx}
              onClick={() => setSelectedPlan(plan.name)}
              className={`relative flex flex-col p-8 rounded-2xl transition-all duration-300 cursor-pointer ${
                selectedPlan === plan.name
                  ? 'bg-white border-2 border-blue-600 transform scale-105 shadow-xl shadow-blue-200/50 z-10' 
                  : 'bg-white border border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md'
              }`}
            >

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-slate-900">{plan.price}</span>
                  {plan.period && <span className="text-slate-500">{plan.period}</span>}
                </div>
                <p className="text-sm text-slate-600 mt-2">{plan.desc}</p>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, fIdx) => (
                  <li key={fIdx} className="flex items-start">
                    <Check className={`h-5 w-5 flex-shrink-0 mr-3 ${selectedPlan === plan.name ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="text-slate-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlanClick(plan.name, plan.price);
                }}
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedPlan === plan.name
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }`}
              >
                {loading ? 'Processing...' : plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;