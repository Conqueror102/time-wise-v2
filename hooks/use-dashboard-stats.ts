"use client"

import { useCallback, useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"

export interface PresentEntry {
  staffId: string
  name: string
  department: string
  checkInTime: string
  checkOutTime?: string
  isLate: boolean
  isEarly: boolean
}

export interface DashboardStatsResponse {
  date: string
  stats: {
    totalStaff: number
    presentToday: number
    currentlyPresent: number
    lateToday: number
    absentToday: number
    earlyDepartureToday: number
  }
  presentToday: PresentEntry[]
  currentStaff: PresentEntry[]
  lateArrivals: PresentEntry[]
  earlyDepartures: (PresentEntry & { checkOutTime: string })[]
  absentStaff: { staffId: string; name: string; department: string }[]
}

/** Today's attendance, shared by the dashboard and the report pages */
export function useDashboardStats() {
  const [data, setData] = useState<DashboardStatsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setData(await apiFetch<DashboardStatsResponse>("/api/dashboard/stats"))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load attendance")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}

/** "Wednesday, September 23, 2026" for a "YYYY-MM-DD" date, without timezone shifts */
export function formatDateLabel(date: string | undefined): string {
  if (!date) return ""
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  })
}
