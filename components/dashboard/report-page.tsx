"use client"

import type { ReactNode } from "react"
import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateLabel, useDashboardStats, type DashboardStatsResponse } from "@/hooks/use-dashboard-stats"

interface ReportPageProps<T> {
  title: string
  description: string
  listTitle: string
  select: (data: DashboardStatsResponse) => T[]
  empty: { icon: ReactNode; title: string; subtitle: string }
  renderItem: (item: T) => ReactNode
  getKey: (item: T) => string
}

/** Layout shared by the "today" report pages (present, absent, late, early) */
export function ReportPage<T>({ title, description, listTitle, select, empty, renderItem, getKey }: ReportPageProps<T>) {
  const { data, loading, error, refresh } = useDashboardStats()
  const items = data ? select(data) : []

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-1">{description}</p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {listTitle} {data && `(${items.length})`}
          </CardTitle>
          <CardDescription>{formatDateLabel(data?.date)}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between gap-4">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={refresh}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {empty.icon}
              <p className="text-lg font-medium">{empty.title}</p>
              <p className="text-sm mt-1">{empty.subtitle}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={getKey(item)}>{renderItem(item)}</div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
