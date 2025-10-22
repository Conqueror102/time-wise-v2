"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Owner root page - redirects to login or dashboard
 */
export default function OwnerPage() {
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("super_admin_token")
    
    if (token) {
      router.push("/owner/dashboard")
    } else {
      router.push("/owner/login")
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  )
}
