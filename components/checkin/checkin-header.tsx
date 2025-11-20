"use client"

import { useState, useEffect } from "react"
import { Clock, Building2, Camera } from "lucide-react"

interface CheckinHeaderProps {
  organizationName: string
  capturePhotos: boolean
  isInTrial?: boolean
}

export function CheckinHeader({ organizationName, capturePhotos, isInTrial }: CheckinHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])
  return (
    <div className="mb-8">
      {/* Header with Time on Right */}
      <div className="flex items-start justify-between mb-6">
        <div className="text-center flex-1">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Clock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">TimeWise Check-In</h1>
          
          <div className="flex items-center justify-center gap-2 text-gray-600 mb-2">
            <Building2 className="w-5 h-5" />
            <span className="text-lg font-medium">{organizationName}</span>
            {isInTrial && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                14-Day Trial
              </span>
            )}
          </div>
          <p className="text-gray-600">Choose your preferred check-in method below</p>
        </div>
        
        {/* Live Time Display - Right Side */}
        <div className="text-right">
          <div className="text-4xl font-bold text-blue-600 mb-1">
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <div className="text-sm text-gray-500">
            {currentTime.toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>
      </div>
    </div>
  )
}