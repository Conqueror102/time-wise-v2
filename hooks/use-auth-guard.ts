"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "@/hooks/use-toast"

/**
 * Loads the signed-in user and organization from the server (so settings
 * changed elsewhere are picked up) and redirects to login when the session
 * is missing, expired or deactivated.
 */
export const useAuthGuard = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem("accessToken")
      if (!token) {
        throw new Error("No token found")
      }

      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(response.status === 401 || response.status === 403 ? data.error || "Session expired" : "Authentication failed")
      }

      localStorage.setItem("user", JSON.stringify(data.user))
      localStorage.setItem("organization", JSON.stringify(data.organization))
      setUser(data.user)
      setOrganization(data.organization)
      setIsLoading(false)
    } catch (err: any) {
      console.error("Auth check failed:", err)
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user")
      localStorage.removeItem("organization")

      toast({
        title: "Authentication Required",
        description: err?.message === "No token found" ? "Please login to continue." : err?.message || "Please login again.",
        variant: "destructive",
      })

      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/"
      router.push(`/login?returnUrl=${encodeURIComponent(currentPath)}`)
    }
  }

  return { isLoading, user, organization }
}
