'use client';

import React from 'react';
import { Settings, Users, Smartphone, Fingerprint, QrCode, CheckCircle, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks: React.FC = () => {
  const steps = [
    {
      number: 1,
      title: "Set Up Check-In Screen",
      description: "Create a secure passcode from your dashboard settings to protect the check-in kiosk.",
      icon: Settings,
      color: "blue",
      details: [
        "Navigate to Settings in your dashboard",
        "Create a unique 4-digit passcode",
        "This locks the check-in screen from unauthorized access"
      ]
    },
    {
      number: 2,
      title: "Add Your Staff Members",
      description: "Create staff profiles with their details and assign unique Staff IDs.",
      icon: Users,
      color: "purple",
      details: [
        "Go to Staff Management",
        "Add staff with name, email, and ID",
        "Generate QR codes automatically"
      ]
    },
    {
      number: 3,
      title: "Register Biometrics",
      description: "Open the biometric registration URL on your check-in device to register fingerprints and photos.",
      icon: Fingerprint,
      color: "green",
      details: [
        "Open /register-biometric on kiosk device",
        "Staff scans fingerprint on the device",
        "Capture photo for verification",
        "Biometrics stored securely"
      ]
    },
    {
      number: 4,
      title: "Staff Check-In Ready",
      description: "Your staff can now check in using QR codes, manual PIN, or biometric verification.",
      icon: CheckCircle,
      color: "emerald",
      details: [
        "Staff scans QR code or enters PIN",
        "Biometric verification confirms identity",
        "Attendance logged automatically",
        "Real-time dashboard updates"
      ]
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; text: string; icon: string; glow: string }> = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-600',
        icon: 'text-blue-600',
        glow: 'shadow-blue-200'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-600',
        icon: 'text-purple-600',
        glow: 'shadow-purple-200'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-600',
        icon: 'text-green-600',
        glow: 'shadow-green-200'
      },
      emerald: {
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-600',
        icon: 'text-emerald-600',
        glow: 'shadow-emerald-200'
      }
    };
    return colors[color] || colors.blue;
  };

  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-white via-blue-50/30 to-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100 mb-4">
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600">Setup Guide</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Set up your attendance system in minutes. Follow this guide to configure your check-in kiosk and onboard your team.
            </p>
          </motion.div>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-purple-200 to-green-200 -translate-x-1/2"></div>

          <div className="space-y-16">
            {steps.map((step, index) => {
              const colors = getColorClasses(step.color);
              const isEven = index % 2 === 0;

              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative flex flex-col lg:flex-row items-center gap-8 ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
                >
                  {/* Content Card */}
                  <div className={`flex-1 ${isEven ? 'lg:text-right lg:pr-12' : 'lg:text-left lg:pl-12'}`}>
                    <div className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all border-2 ${colors.border} ${colors.glow}`}>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 ${colors.bg} rounded-full mb-4`}>
                        <span className={`text-sm font-bold ${colors.text}`}>Step {step.number}</span>
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-600 mb-6">{step.description}</p>
                      
                      <ul className={`space-y-3 ${isEven ? 'lg:text-right' : 'lg:text-left'}`}>
                        {step.details.map((detail, idx) => (
                          <li key={idx} className={`flex items-start gap-3 ${isEven ? 'lg:flex-row-reverse' : ''}`}>
                            <CheckCircle className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
                            <span className="text-sm text-gray-700">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Icon Circle */}
                  <div className="relative flex-shrink-0 z-10">
                    <div className={`w-24 h-24 rounded-full ${colors.bg} border-4 border-white shadow-xl flex items-center justify-center`}>
                      <step.icon className={`w-12 h-12 ${colors.icon}`} />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="hidden lg:block absolute top-full left-1/2 -translate-x-1/2 mt-4">
                        <ArrowRight className="w-6 h-6 text-gray-300 rotate-90" />
                      </div>
                    )}
                  </div>

                  {/* Spacer for alignment */}
                  <div className="flex-1 hidden lg:block"></div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
