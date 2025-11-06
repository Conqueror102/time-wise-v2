"use client"

import { Loader2 } from "lucide-react"

export function AuthenticatingScreen() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-900">
          Verifying your session...
        </h2>
        <p className="text-gray-500">
          Please wait while we authenticate your access
        </p>
      </div>
    </div>
  )
}