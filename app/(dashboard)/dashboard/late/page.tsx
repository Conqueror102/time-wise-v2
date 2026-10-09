"use client"

import { Clock, CheckCircle } from "lucide-react"
import { getLocalTimeString } from "@/lib/utils/date"
import { ReportPage } from "@/components/dashboard/report-page"

export default function LatePage() {
  return (
    <ReportPage
      title="Late Arrivals"
      description="Staff who checked in after the lateness threshold today"
      listTitle="Late Today"
      select={(data) => data.lateArrivals}
      getKey={(staff) => staff.staffId}
      empty={{
        icon: <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />,
        title: "No late arrivals today!",
        subtitle: "Everyone arrived on time",
      }}
      renderItem={(staff) => (
        <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-100">
          <div>
            <div className="font-medium text-gray-900">{staff.name}</div>
            <div className="text-sm text-gray-500">
              {staff.staffId} • {staff.department}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-orange-600">{getLocalTimeString(new Date(staff.checkInTime))}</div>
            <div className="flex items-center gap-1 text-xs text-orange-600">
              <Clock className="w-3 h-3" />
              Late
            </div>
          </div>
        </div>
      )}
    />
  )
}
