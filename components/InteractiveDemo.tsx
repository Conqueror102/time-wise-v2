'use client';

import React, { useState, useEffect } from 'react';
import { ScanFace, QrCode, Hash, CheckCircle2, RefreshCcw, Smartphone, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ScreenState = 'home' | 'qr_scan' | 'pin_entry' | 'biometric_scan' | 'success';

const InteractiveDemo: React.FC = () => {
  const [screen, setScreen] = useState<ScreenState>('home');
  const [pin, setPin] = useState<string>('');
  const [method, setMethod] = useState<'qr' | 'manual' | null>(null);

  // Auto-progress logic for QR scanning
  useEffect(() => {
    if (screen === 'qr_scan') {
      const timer = setTimeout(() => {
        setScreen('biometric_scan');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Auto-progress logic for Biometric scanning
  useEffect(() => {
    if (screen === 'biometric_scan') {
      const timer = setTimeout(() => {
        setScreen('success');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  const handlePinClick = (num: number) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      if (newPin.length === 4) {
        setTimeout(() => setScreen('biometric_scan'), 500);
      }
    }
  };

  const handleStartQR = () => {
    setMethod('qr');
    setScreen('qr_scan');
  };

  const handleStartManual = () => {
    setMethod('manual');
    setPin('');
    setScreen('pin_entry');
  };

  const resetDemo = () => {
    setScreen('home');
    setPin('');
    setMethod(null);
  };

  return (
    <section className="py-24 bg-gray-900 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">See TimeWise In Action</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Interact with the phone below to simulate the secure check-in flow. Notice how every method is verified by biometrics.
          </p>
        </div>

        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-20">
          
          {/* Instructions / Context Side */}
          <div className="w-full md:w-1/3 space-y-8 order-2 md:order-1">
             <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <ShieldCheck className="text-blue-400 h-5 w-5" />
                  Security First Flow
                </h3>
                <div className="space-y-4">
                  <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${screen === 'home' ? 'bg-white/5' : 'opacity-50'}`}>
                    <div className="bg-blue-900/50 p-2 rounded text-blue-400 font-bold text-xs">1</div>
                    <p className="text-sm text-gray-300">Choose check-in method (QR Code or Manual PIN)</p>
                  </div>
                  <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${(screen === 'qr_scan' || screen === 'pin_entry') ? 'bg-white/5' : 'opacity-50'}`}>
                    <div className="bg-blue-900/50 p-2 rounded text-blue-400 font-bold text-xs">2</div>
                    <p className="text-sm text-gray-300">Validate ID credential</p>
                  </div>
                  <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${screen === 'biometric_scan' ? 'bg-white/5' : 'opacity-50'}`}>
                    <div className="bg-blue-900/50 p-2 rounded text-blue-400 font-bold text-xs">3</div>
                    <p className="text-sm text-gray-300">Biometric verification (FaceID)</p>
                  </div>
                  <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${screen === 'success' ? 'bg-white/5' : 'opacity-50'}`}>
                    <div className="bg-green-900/50 p-2 rounded text-green-400 font-bold text-xs">4</div>
                    <p className="text-sm text-gray-300">Attendance logged securely</p>
                  </div>
                </div>
             </div>

             <div className="text-center md:text-left">
               <button 
                onClick={resetDemo}
                className="text-gray-500 hover:text-white text-sm flex items-center gap-2 mx-auto md:mx-0 transition-colors"
               >
                 <RefreshCcw className="h-4 w-4" /> Restart Demo
               </button>
             </div>
          </div>

          {/* Interactive Device Side */}
          <div className="order-1 md:order-2">
            <div className="relative w-[320px] h-[640px] bg-black rounded-[3.5rem] border-8 border-gray-800 shadow-[0_0_50px_rgba(37,99,235,0.15)] overflow-hidden transform transition-transform hover:scale-[1.01]">
               {/* Dynamic Notch */}
               <div className="absolute top-0 inset-x-0 h-7 bg-black z-30 flex justify-center">
                  <div className="w-32 h-6 bg-black rounded-b-2xl"></div>
               </div>
               
               {/* Status Bar */}
               <div className="absolute top-2 w-full flex justify-between px-8 text-[10px] text-white font-medium z-20">
                  <span>9:41</span>
                  <div className="flex gap-1.5 items-center">
                    <div className="w-4 h-2.5 bg-white rounded-[2px]"></div>
                  </div>
               </div>
               
               {/* Main Screen Content */}
               <div className="w-full h-full bg-gray-950 flex flex-col relative">
                 
                 {/* SCREEN: HOME */}
                 <AnimatePresence mode="wait">
                   {screen === 'home' && (
                     <motion.div 
                       key="home"
                       {...({
                         initial: { opacity: 0 },
                         animate: { opacity: 1 },
                         exit: { opacity: 0, scale: 0.95 }
                       } as any)}
                       className="absolute inset-0 flex flex-col p-6 pt-20"
                     >
                       <div className="flex-1 flex flex-col items-center justify-center space-y-8">
                         <div className="text-center">
                           <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-600/20">
                              <Smartphone className="text-white h-8 w-8" />
                           </div>
                           <h3 className="text-2xl font-bold text-white">TimeWise</h3>
                           <p className="text-gray-500 text-sm">Secure Attendance Kiosk</p>
                         </div>
                         
                         <div className="w-full space-y-4">
                           <button 
                            onClick={handleStartQR}
                            className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 group transition-all"
                           >
                             <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                               <QrCode className="h-5 w-5" />
                             </div>
                             <div className="text-left">
                               <div className="text-white font-semibold">QR Check-in</div>
                               <div className="text-gray-500 text-xs">Use your Staff ID</div>
                             </div>
                             <ArrowRight className="ml-auto text-gray-600 group-hover:text-white h-4 w-4" />
                           </button>

                           <button 
                            onClick={handleStartManual}
                            className="w-full p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl flex items-center gap-4 group transition-all"
                           >
                             <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                               <Hash className="h-5 w-5" />
                             </div>
                             <div className="text-left">
                               <div className="text-white font-semibold">Manual Entry</div>
                               <div className="text-gray-500 text-xs">Use your PIN code</div>
                             </div>
                             <ArrowRight className="ml-auto text-gray-600 group-hover:text-white h-4 w-4" />
                           </button>
                         </div>
                       </div>
                       <p className="text-center text-gray-600 text-xs mt-auto">v2.4.0 • Enterprise Edition</p>
                     </motion.div>
                   )}

                   {/* SCREEN: QR SCAN */}
                   {screen === 'qr_scan' && (
                     <motion.div 
                       key="qr"
                       {...({
                         initial: { opacity: 0, x: 50 },
                         animate: { opacity: 1, x: 0 },
                         exit: { opacity: 0, x: -50 }
                       } as any)}
                       className="absolute inset-0 bg-black flex flex-col"
                     >
                       <div className="flex-1 relative">
                          {/* Fake Camera Feed */}
                          <div className="absolute inset-0 bg-gray-900">
                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <div className="w-full h-full flex items-center justify-center">
                              <p className="text-gray-500 text-xs">Camera Active</p>
                            </div>
                          </div>
                          
                          {/* QR Overlay */}
                          <div className="absolute inset-0 flex items-center justify-center">
                             <div className="w-64 h-64 border-2 border-blue-500/50 rounded-2xl relative overflow-hidden">
                                <motion.div 
                                  className="absolute top-0 left-0 right-0 h-1 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]"
                                  {...({
                                    animate: { top: ["0%", "100%", "0%"] },
                                    transition: { duration: 2.5, ease: "linear", repeat: Infinity }
                                  } as any)}
                                />
                                <div className="absolute inset-0 border-[20px] border-black/30"></div>
                             </div>
                          </div>
                          
                          <div className="absolute bottom-10 inset-x-0 text-center">
                            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full inline-block">
                              <p className="text-white text-sm font-medium">Position code in frame</p>
                            </div>
                          </div>
                       </div>
                     </motion.div>
                   )}

                   {/* SCREEN: PIN ENTRY */}
                   {screen === 'pin_entry' && (
                     <motion.div 
                       key="pin"
                       {...({
                         initial: { opacity: 0, x: 50 },
                         animate: { opacity: 1, x: 0 },
                         exit: { opacity: 0, x: -50 }
                       } as any)}
                       className="absolute inset-0 flex flex-col p-6 pt-20"
                     >
                       <div className="flex-1 flex flex-col items-center">
                         <h3 className="text-xl font-bold text-white mb-2">Enter PIN</h3>
                         <p className="text-gray-500 text-sm mb-8">Please enter your 4-digit staff PIN</p>

                         <div className="flex gap-4 mb-12">
                           {[0, 1, 2, 3].map((i) => (
                             <div 
                                key={i} 
                                className={`w-4 h-4 rounded-full transition-all duration-300 ${i < pin.length ? 'bg-blue-500 scale-110' : 'bg-gray-800 border border-white/10'}`}
                             />
                           ))}
                         </div>

                         <div className="w-full grid grid-cols-3 gap-y-6 gap-x-4 max-w-[260px]">
                           {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                             <button 
                               key={num}
                               onClick={() => handlePinClick(num)}
                               className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-xl font-semibold transition-colors mx-auto"
                             >
                               {num}
                             </button>
                           ))}
                           <div className="w-16"></div>
                           <button 
                             onClick={() => handlePinClick(0)}
                             className="w-16 h-16 rounded-full bg-gray-800 hover:bg-gray-700 text-white text-xl font-semibold transition-colors mx-auto"
                           >
                             0
                           </button>
                           <div className="w-16"></div>
                         </div>
                       </div>
                       <button onClick={resetDemo} className="text-gray-500 text-sm py-4">Cancel</button>
                     </motion.div>
                   )}

                   {/* SCREEN: BIOMETRIC SCAN */}
                   {screen === 'biometric_scan' && (
                     <motion.div 
                       key="bio"
                       {...({
                         initial: { opacity: 0 },
                         animate: { opacity: 1 },
                         exit: { opacity: 0 }
                       } as any)}
                       className="absolute inset-0 bg-gray-950 flex flex-col items-center justify-center p-6"
                     >
                        <div className="relative">
                           <motion.div 
                             {...({
                               initial: { scale: 0.9, opacity: 0.5 },
                               animate: { scale: 1.1, opacity: 0 },
                               transition: { duration: 1.5, repeat: Infinity }
                             } as any)}
                             className="absolute inset-0 bg-blue-500 rounded-full blur-xl"
                           />
                           <div className="w-24 h-24 rounded-full border-2 border-blue-500 bg-gray-900 flex items-center justify-center relative z-10">
                              <ScanFace className="w-12 h-12 text-blue-400" />
                           </div>
                           <motion.div 
                              className="absolute -inset-1 border-t-2 border-l-2 border-blue-400 rounded-full"
                              {...({
                                animate: { rotate: 360 },
                                transition: { duration: 1.5, repeat: Infinity, ease: "linear" }
                              } as any)}
                           />
                        </div>
                        <h3 className="text-xl font-bold text-white mt-8 mb-2">Verifying Identity...</h3>
                        <p className="text-gray-500 text-sm">Please look at the camera</p>
                     </motion.div>
                   )}

                   {/* SCREEN: SUCCESS */}
                   {screen === 'success' && (
                     <motion.div 
                       key="success"
                       {...({
                         initial: { opacity: 0, scale: 0.9 },
                         animate: { opacity: 1, scale: 1 },
                         exit: { opacity: 0 }
                       } as any)}
                       className="absolute inset-0 bg-green-600 flex flex-col items-center justify-center text-white p-6"
                     >
                       <motion.div 
                         {...({
                           initial: { scale: 0 },
                           animate: { scale: 1 },
                           transition: { type: "spring", stiffness: 200, damping: 10 }
                         } as any)}
                         className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl"
                       >
                          <CheckCircle2 className="h-10 w-10 text-green-600" />
                       </motion.div>
                       <h2 className="text-3xl font-bold mb-2">Checked In</h2>
                       <p className="text-green-100 text-lg mb-8">9:41 AM</p>
                       
                       <div className="bg-white/10 rounded-xl p-4 w-full backdrop-blur-sm border border-white/20">
                          <div className="flex justify-between items-center mb-2">
                             <span className="opacity-80 text-sm">Staff</span>
                             <span className="font-semibold">Jane Doe</span>
                          </div>
                          <div className="flex justify-between items-center mb-2">
                             <span className="opacity-80 text-sm">Department</span>
                             <span className="font-semibold">Marketing</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="opacity-80 text-sm">Verification</span>
                             <span className="font-semibold flex items-center gap-1"><ScanFace className="w-3 h-3"/> FaceID</span>
                          </div>
                       </div>

                       <button 
                        onClick={resetDemo}
                        className="mt-8 bg-white text-green-700 px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-100 transition-colors"
                       >
                         Done
                       </button>
                     </motion.div>
                   )}
                 </AnimatePresence>

               </div>
               
               {/* Home Indicator */}
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full opacity-20 z-30"></div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default InteractiveDemo;