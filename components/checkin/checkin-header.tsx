"use client"

import { useState, useEffect } from "react"
import { Clock, Building2, Camera } from "lucide-react"

interface CheckinHeaderProps {
  organizationName: string
  capturePhotos: boolean
}

export function CheckinHeader({ organizationName, capturePhotos }: CheckinHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4 shadow-lg">
        <Clock className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 mb-3">TimeWise Check-In</h1>
      
      {/* Live Time Display */}
      <div className="mb-4">
        <div className="text-5xl font-bold text-blue-600 mb-2">
          {currentTime.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
        <div className="text-sm text-gray-500">
          {currentTime.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
        <Building2 className="w-5 h-5" />
        <span className="text-lg font-medium">{organizationName}</span>
      </div>
      <p className="text-gray-600">Choose your preferred check-in method below</p>
      
      {capturePhotos && (
        <div className="mt-6 p-5 bg-amber-50 border-2 border-amber-200 rounded-xl shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Camera className="w-6 h-6 text-amber-600" />
            </div>
            <div className="text-left">
              <h3 className="text-base font-bold text-amber-900 mb-2">
                Photo Verification Required
              </h3>
              <p className="text-sm text-amber-800 leading-relaxed">
                Photo verification is mandatory for all check-ins and check-outs. 
                Please ensure you face the camera clearly when prompted. 
                <span className="font-semibold block mt-1">Attendance will not be recorded without proper photo verification.</span>
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg">
        <Clock className="w-4 h-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  )
}