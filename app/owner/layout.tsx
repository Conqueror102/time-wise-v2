"use client"

import { Sidebar } from "@/components/owner/layout/Sidebar"
import { Header } from "@/components/owner/layout/Header"
import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [superAdmin, setSuperAdmin] = useState<{
    email: string
    firstName: string
    lastName: string
  } | null>(null)

  useEffect(() => {
    // Skip auth check for login page
    if (pathname === "/owner/login") {
      setLoading(false)
      return
    }

    // Check authentication
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("super_admin_token")
        
        if (!token) {
          router.push("/owner/login")
          return
        }

        // Verify token with API
        const response = await fetch("/api/owner/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          localStorage.removeItem("super_admin_token")
          router.push("/owner/login")
          return
        }

        const data = await response.json()
        setSuperAdmin(data.user)
        setIsAuthenticated(true)
      } catch (error) {
        console.error("Auth check failed:", error)
        localStorage.removeItem("super_admin_token")
        router.push("/owner/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [pathname, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated and not on login page, don't render anything
  // (redirect will happen in useEffect)
  if (!isAuthenticated && pathname !== "/owner/login") {
    return null
  }

  // Login page doesn't need sidebar/header (handled by login/layout.tsx)
  if (pathname === "/owner/login") {
    return <>{children}</>
  }

  // Authenticated pages with sidebar and header
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="lg:pl-72">
        <Header superAdmin={superAdmin || undefined} />
        
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
