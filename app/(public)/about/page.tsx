import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Clock, Users, Target, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">About TimeWise</h1>
            <p className="text-xl text-gray-600">
              Simplifying attendance management for modern businesses
            </p>
          </div>

          {/* Mission */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Our Mission</h2>
            </div>
            <p className="text-gray-600 leading-relaxed">
              At TimeWise, we believe attendance tracking shouldn't be complicated or expensive. Our mission is to provide businesses of all sizes with a secure, accurate, and cost-effective solution that eliminates the headaches of traditional attendance systems.
            </p>
          </div>

          {/* Story */}
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-8 h-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Our Story</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              TimeWise was born from a simple observation: businesses were struggling with outdated attendance systems that were either too expensive, too complicated, or simply unreliable. We saw organizations dealing with buddy punching, manual data entry errors, and expensive hardware installations.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We set out to create a solution that combines the security of biometric verification with the simplicity of modern web technology. The result is TimeWise - an attendance system that works on any device, requires no special hardware, and provides enterprise-grade security at a fraction of the cost.
            </p>
          </div>

          {/* Values */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <Award className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Security First</h3>
              <p className="text-gray-600">
                We prioritize the security of your data with biometric verification and end-to-end encryption.
              </p>
            </div>
            <div className="bg-purple-50 rounded-2xl p-6 border border-purple-100">
              <Users className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">User-Centric</h3>
              <p className="text-gray-600">
                Built with both administrators and staff in mind, ensuring a smooth experience for everyone.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Attendance Tracking?</h2>
            <p className="mb-6 text-blue-100">Start your 14-day free trial today. No credit card required.</p>
            <a
              href="/register"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-blue-600 bg-white rounded-full hover:bg-gray-50 transition-all shadow-lg"
            >
              Get Started Free
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
