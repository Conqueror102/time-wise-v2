"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "@/components/ui/use-toast"

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

      // Verify token by making a request to the API
      const response = await fetch("/api/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Session expired")
        }
        throw new Error("Authentication failed")
      }

      // Load user/org from localStorage if available
      const userData = localStorage.getItem("user")
      const orgData = localStorage.getItem("organization")
      if (userData) {
        try {
          setUser(JSON.parse(userData))
        } catch {
          // ignore parse errors
        }
      }
      if (orgData) {
        try {
          setOrganization(JSON.parse(orgData))
        } catch {
          // ignore parse errors
        }
      }

      setIsLoading(false)
    } catch (err: any) {
      console.error("Auth check failed:", err)
      // Clear any stored auth data
      localStorage.removeItem("accessToken")
      localStorage.removeItem("user")
      localStorage.removeItem("organization")

      // Show appropriate message based on error
      const message = err?.message === "Session expired"
        ? "Your session has expired. Please login again."
        : "Please login to continue."

      toast({
        title: "Authentication Required",
        description: message,
        variant: "destructive",
      })

      // Redirect to login with return URL
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "/"
      router.push(`/login?returnUrl=${encodeURIComponent(currentPath)}`)
    }
  }

  return { isLoading, user, organization }
}