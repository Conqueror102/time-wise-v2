"use client"

import { CheckCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface SuccessMessageProps {
  lastAction: {
    name: string
    type: string
    time: string
    isLate?: boolean
    isEarly?: boolean
  }
}

export function SuccessMessage({ lastAction }: SuccessMessageProps) {
  return (
    <Card className="mb-6 border-0 bg-green-50 shadow-lg" data-success-message>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-900 mb-1">
              {lastAction.type === "check-in" ? "Checked In Successfully" : "Checked Out Successfully"}!
            </h3>
            <p className="text-green-700 font-medium">
              {lastAction.name} • {lastAction.time}
            </p>
            {lastAction.isLate && lastAction.type === "check-in" && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-orange-100 rounded-lg">
                <span className="text-orange-600 text-sm font-medium">⚠️ Late Arrival</span>
              </div>
            )}
            {lastAction.isEarly && lastAction.type === "check-out" && (
              <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-sm font-medium">⚠️ Early Departure</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
