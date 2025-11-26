"use client"

/**
 * Protected Dashboard Layout
 */

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { useSubscription } from "@/hooks/use-subscription"
import Link from "next/link"
import {
  Building2,
  LayoutDashboard,
  Users,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  BarChart3,
  ChevronDown,
  ChevronRight,
  UserCheck,
  UserX,
  History,
  CreditCard,
  Lock,
  Copy,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AuthenticatingScreen } from "@/components/auth/authenticating-screen"
import { SubscriptionIndicator } from "@/components/subscription-indicator"
import { UpgradeModal } from "@/components/subscription/upgrade-modal"
import { TrialExpirationBanner } from "@/components/subscription/trial-expiration-banner"
import { getFeatureGateMessage } from "@/lib/features/feature-manager"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { isLoading, user, organization } = useAuthGuard()
  const { hasFeature, subscription } = useSubscription()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [reportsOpen, setReportsOpen] = useState(false) // Closed by default
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [lockedFeature, setLockedFeature] = useState<"canAccessAnalytics" | "canAccessHistory">("canAccessHistory")
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [checkInPasscode, setCheckInPasscode] = useState("")
  const [checkInLoading, setCheckInLoading] = useState(false)
  const [checkInError, setCheckInError] = useState("")
  const [checkInCopied, setCheckInCopied] = useState(false)

  // Authentication is now handled by useAuthGuard

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.clear()

    // Also clear sessionStorage
    sessionStorage.clear()

    console.log("User logged out, all data cleared")

    // Redirect to login
    router.push("/login")
  }

  const confirmLogout = () => {
    setShowLogoutModal(false)
    handleLogout()
  }

  const handleCheckInUrlCopy = async () => {
    if (!organization?.settings?.checkInPasscode) {
      setShowCheckInModal(true)
      return
    }

    const checkInUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/checkin`
    navigator.clipboard.writeText(checkInUrl)
    setCheckInCopied(true)
    setTimeout(() => setCheckInCopied(false), 2000)
  }

  const handleSetCheckInPasscode = async () => {
    if (!checkInPasscode.trim()) {
      setCheckInError("Passcode required")
      return
    }

    setCheckInLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checkInPasscode: checkInPasscode }),
      })

      if (!response.ok) throw new Error("Failed")

      // Update localStorage
      const org = JSON.parse(localStorage.getItem("organization") || "{}")
      org.settings = org.settings || {}
      org.settings.checkInPasscode = checkInPasscode
      localStorage.setItem("organization", JSON.stringify(org))

      // Refresh router to ensure auth/organization hooks pick up the change
      try {
        router.refresh()
      } catch (e) {
        // ignore if router.refresh isn't available in older Next versions
      }

      // Copy URL
      const checkInUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/checkin`
      navigator.clipboard.writeText(checkInUrl)
      setCheckInCopied(true)
      setShowCheckInModal(false)
      setCheckInPasscode("")
      setTimeout(() => setCheckInCopied(false), 2000)
    } catch {
      setCheckInError("Error saving passcode")
    } finally {
      setCheckInLoading(false)
    }
  }

  const mainNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresFeature: null },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, requiresFeature: "canAccessAnalytics" as const },
    { href: "/dashboard/attendance", label: "Attendance", icon: Clock, requiresFeature: null },
    { href: "/dashboard/staff", label: "Staff", icon: Users, requiresFeature: null },
  ]

  const reportsItems = [
    { href: "/dashboard/present", label: "Currently In", icon: UserCheck },
    { href: "/dashboard/absent", label: "Absent", icon: UserX },
    { href: "/dashboard/late", label: "Late Arrivals", icon: Clock },
    { href: "/dashboard/early", label: "Early Departures", icon: Clock },
    { href: "/dashboard/history", label: "History", icon: History },
  ]

  const bottomNavItems = [
    { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ]

  // Show loading state
  if (isLoading) {
    return <AuthenticatingScreen />
  }

  // If not loading but no user/org data, something went wrong
  if (!user || !organization) {
    router.push("/login")
    return null
  }

  return (
    <div key={user.id || user.email} className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">TimeWise</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-600">{organization.name}</div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {/* Main Navigation */}
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              const hasAccess = item.requiresFeature ? hasFeature(item.requiresFeature) : true
              
              if (!hasAccess) {
                // Show grayed out with lock icon
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setLockedFeature(item.requiresFeature!)
                      setShowUpgradeModal(true)
                    }}
                    className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-gray-400 cursor-not-allowed w-full text-left"
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    <Lock className="w-3 h-3 ml-auto" />
                  </button>
                )
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}

            {/* Reports Section */}
            <div className="pt-2">
              <button
                onClick={() => {
                  // Check if user has access to reports
                  const canAccessReports = hasFeature("canAccessHistory")
                  if (!canAccessReports) {
                    setLockedFeature("canAccessHistory")
                    setShowUpgradeModal(true)
                  } else {
                    setReportsOpen(!reportsOpen)
                  }
                }}
                className={`flex items-center justify-between w-full px-4 py-2 rounded-lg transition-colors ${
                  hasFeature("canAccessHistory")
                    ? "text-gray-700 hover:bg-gray-100"
                    : "text-gray-400 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5" />
                  <span className="font-medium">Reports</span>
                  {!hasFeature("canAccessHistory") && (
                    <Lock className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                {hasFeature("canAccessHistory") && (
                  reportsOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )
                )}
              </button>

              {/* Collapsible Reports Items */}
              {reportsOpen && hasFeature("canAccessHistory") && (
                <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-200 pl-4">
                  {reportsItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          isActive
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="pt-2 border-t border-gray-200 mt-2">
              {bottomNavItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                )
              })}

              {/* Copy Check-In URL */}
              <button
                onClick={handleCheckInUrlCopy}
                className="flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 w-full text-left text-sm mt-2"
              >
                {checkInCopied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="font-medium">Copy Check-In</span>
                  </>
                )}
              </button>
            </div>
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t">
            {/* Subscription Indicator */}
            <SubscriptionIndicator />
            
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setShowLogoutModal(true)}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Trial Expiration Banner - Shows on all pages */}
        <TrialExpirationBanner />

        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-gray-500 hover:text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span className="font-bold text-gray-900">TimeWise</span>
            </div>
            <div className="w-6" /> {/* Spacer */}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">{children}</main>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <LogOut className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Logout</h3>
                <p className="text-sm text-gray-500">Are you sure you want to logout?</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              You will be redirected to the login page and all your session data will be cleared.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmLogout}
                className="bg-red-600 hover:bg-red-700"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Check-In Passcode Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Set Check-In Passcode
              </h3>
              <button
                onClick={() => {
                  setShowCheckInModal(false)
                  setCheckInPasscode("")
                  setCheckInError("")
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Staff need a passcode to unlock the check-in page. Set one now to copy the check-in URL.
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="e.g., 1234"
                value={checkInPasscode}
                onChange={(e) => {
                  setCheckInPasscode(e.target.value)
                  setCheckInError("")
                }}
                disabled={checkInLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-center text-lg tracking-widest focus:outline-none focus:border-blue-500"
                autoFocus
              />
              {checkInError && (
                <p className="text-sm text-red-600">{checkInError}</p>
              )}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCheckInModal(false)
                    setCheckInPasscode("")
                    setCheckInError("")
                  }}
                  disabled={checkInLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSetCheckInPasscode}
                  disabled={checkInLoading || !checkInPasscode.trim()}
                  className="flex-1"
                >
                  {checkInLoading ? "Setting..." : "Set & Copy"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Modal for Locked Features */}
      {showUpgradeModal && (
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={async (plan) => {
            const token = localStorage.getItem("accessToken")
            const response = await fetch("/api/subscription/upgrade", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ targetPlan: plan }),
            })
            const data = await response.json()
            if (data.authorizationUrl) {
              window.location.href = data.authorizationUrl
            }
          }}
          currentPlan={subscription?.plan || "starter"}
        />
      )}
    </div>
  )
}
