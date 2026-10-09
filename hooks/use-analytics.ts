"use client"

import { useEffect, useState } from "react"
import { apiFetch } from "@/lib/api-client"

/** Fetch one analytics endpoint for a time range, with loading and error state */
export function useAnalytics<T = any>(endpoint: string, timeRange: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError("")
    apiFetch<T>(`${endpoint}?range=${timeRange}`)
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) {
          setData(null)
          setError(err instanceof Error ? err.message : "Failed to load analytics")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    // Ignore responses for a range the user has already switched away from
    return () => {
      cancelled = true
    }
  }, [endpoint, timeRange])

  return { data, loading, error }
}
