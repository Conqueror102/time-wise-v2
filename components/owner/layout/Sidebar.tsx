"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  BarChart3,
  FileText,
  Settings,
  Activity,
  Shield,
  Bell,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  {
    name: "Dashboard",
    href: "/owner/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Activities",
    href: "/owner/activities",
    icon: Bell,
  },
  {
    name: "Organizations",
    href: "/owner/organizations",
    icon: Building2,
  },
  {
    name: "Users",
    href: "/owner/users",
    icon: Users,
  },
  {
    name: "Payments",
    href: "/owner/payments",
    icon: CreditCard,
  },
  {
    name: "Analytics",
    href: "/owner/analytics",
    icon: BarChart3,
  },
  {
    name: "Audit Logs",
    href: "/owner/logs",
    icon: FileText,
  },
  {
    name: "Reports",
    href: "/owner/reports",
    icon: FileText,
  },
  {
    name: "System Health",
    href: "/owner/health",
    icon: Activity,
  },
  {
    name: "Settings",
    href: "/owner/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden border-r bg-gray-50/40 lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      {/* Sidebar header */}
      <div className="flex h-16 shrink-0 items-center gap-2 border-b bg-white px-6">
        <Shield className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-lg font-bold text-gray-900">TimeWise</h1>
          <p className="text-xs text-gray-500">Super Admin Panel</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-y-7 overflow-y-auto px-4 py-4">
        <ul role="list" className="flex flex-1 flex-col gap-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex gap-x-3 rounded-lg p-3 text-sm font-semibold leading-6 transition-all",
                    isActive
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-700 hover:bg-gray-100 hover:text-purple-600"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 shrink-0",
                      isActive ? "text-white" : "text-gray-400 group-hover:text-purple-600"
                    )}
                  />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Footer info */}
        <div className="border-t border-gray-200 pt-4">
          <div className="rounded-lg bg-purple-50 p-4">
            <p className="text-xs font-medium text-purple-900">Platform Status</p>
            <p className="mt-1 text-xs text-purple-700">All systems operational</p>
            <div className="mt-2 flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
              <span className="text-xs text-purple-600">Online</span>
            </div>
          </div>
        </div>
      </nav>
    </div>
  )
}
