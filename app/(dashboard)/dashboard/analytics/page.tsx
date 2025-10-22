"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewStats } from "@/components/analytics/overview-stats"
import { AttendanceTrends } from "@/components/analytics/attendance-trends"
import { LatenessAnalysis } from "@/components/analytics/lateness-analysis"
import { DepartmentBreakdown } from "@/components/analytics/department-breakdown"
import { StaffPerformance } from "@/components/analytics/staff-performance"
import { TimeRangeSelector } from "@/components/analytics/time-range-selector"
import { ExportButton } from "@/components/analytics/export-button"
import { BarChart3, TrendingUp, Clock, Users, Calendar } from "lucide-react"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [activeView, setActiveView] = useState("overview")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive attendance insights and trends
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} />
          <ExportButton timeRange={timeRange} />
        </div>
      </div>

      {/* Overview Stats */}
      <OverviewStats timeRange={timeRange} />

      {/* Main Analytics Tabs */}
      <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Calendar className="w-4 h-4 mr-2" />
            Trends
          </TabsTrigger>
          <TabsTrigger value="lateness" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-2" />
            Lateness
          </TabsTrigger>
          <TabsTrigger value="departments" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="staff" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" />
            Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <AttendanceTrends timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6 mt-6">
          <AttendanceTrends timeRange={timeRange} detailed />
        </TabsContent>

        <TabsContent value="lateness" className="space-y-6 mt-6">
          <LatenessAnalysis timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="departments" className="space-y-6 mt-6">
          <DepartmentBreakdown timeRange={timeRange} />
        </TabsContent>

        <TabsContent value="staff" className="space-y-6 mt-6">
          <StaffPerformance timeRange={timeRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
