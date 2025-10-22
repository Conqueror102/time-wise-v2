"use client"

import { Button } from "@/components/ui/button"
import { Calendar } from "lucide-react"

interface TimeRangeSelectorProps {
  value: "7d" | "30d" | "90d" | "1y"
  onChange: (value: "7d" | "30d" | "90d" | "1y") => void
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  const ranges = [
    { label: "7 Days", value: "7d" as const },
    { label: "30 Days", value: "30d" as const },
    { label: "90 Days", value: "90d" as const },
    { label: "1 Year", value: "1y" as const },
  ]

  return (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      <Calendar className="w-4 h-4 text-gray-600 ml-2" />
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={value === range.value ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(range.value)}
          className={`${
            value === range.value
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          }`}
        >
          {range.label}
        </Button>
      ))}
    </div>
  )
}
