"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OverviewStats } from "@/components/analytics/overview-stats"
import { AttendanceTrends } from "@/components/analytics/attendance-trends"
import { LatenessAnalysis } from "@/components/analytics/lateness-analysis"
import { DepartmentBreakdown } from "@/components/analytics/department-breakdown"
import { StaffPerformance } from "@/components/analytics/staff-performance"
import { TimeRangeSelector } from "@/components/analytics/time-range-selector"
import { ExportButton } from "@/components/analytics/export-button"
import { BarChart3, TrendingUp, Clock, Users, Calendar } from "lucide-react"
import { PageGate } from "@/components/subscription/page-gate"
import { FeatureGate } from "@/components/subscription/feature-gate"
import { useSubscription } from "@/hooks/use-subscription"

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const [activeView, setActiveView] = useState("overview")
  const { hasFeature } = useSubscription()

  return (
    <PageGate feature="canAccessAnalytics">
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
            <FeatureGate feature="exportData" showLockOverlay={false}>
              <ExportButton timeRange={timeRange} />
            </FeatureGate>
          </div>
        </div>

        {/* Overview Stats - Always visible when analytics page is accessible */}
        <OverviewStats timeRange={timeRange} />

        {/* Main Analytics Tabs */}
        <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-100 p-1">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              disabled={!hasFeature("analyticsOverview")}
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="trends" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              disabled={!hasFeature("analyticsTrends")}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Trends
            </TabsTrigger>
            <TabsTrigger 
              value="lateness" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              disabled={!hasFeature("analyticsLateness")}
            >
              <Clock className="w-4 h-4 mr-2" />
              Lateness
            </TabsTrigger>
            <TabsTrigger 
              value="departments" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              disabled={!hasFeature("analyticsDepartment")}
            >
              <Users className="w-4 h-4 mr-2" />
              Departments
            </TabsTrigger>
            <TabsTrigger 
              value="staff" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
              disabled={!hasFeature("analyticsPerformance")}
            >
              <Users className="w-4 h-4 mr-2" />
              Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <FeatureGate feature="analyticsOverview">
              <AttendanceTrends timeRange={timeRange} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6 mt-6">
            <FeatureGate feature="analyticsTrends">
              <AttendanceTrends timeRange={timeRange} detailed />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="lateness" className="space-y-6 mt-6">
            <FeatureGate feature="analyticsLateness">
              <LatenessAnalysis timeRange={timeRange} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="departments" className="space-y-6 mt-6">
            <FeatureGate feature="analyticsDepartment">
              <DepartmentBreakdown timeRange={timeRange} />
            </FeatureGate>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6 mt-6">
            <FeatureGate feature="analyticsPerformance">
              <StaffPerformance timeRange={timeRange} />
            </FeatureGate>
          </TabsContent>
        </Tabs>
      </div>
    </PageGate>
  )
}
