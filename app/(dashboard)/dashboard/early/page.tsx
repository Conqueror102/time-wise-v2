"use client"

import { Clock, CheckCircle } from "lucide-react"
import { getLocalTimeString } from "@/lib/utils/date"
import { ReportPage } from "@/components/dashboard/report-page"

export default function EarlyPage() {
  return (
    <ReportPage
      title="Early Departures"
      description="Staff who checked out before the early-departure threshold today"
      listTitle="Early Departures Today"
      select={(data) => data.earlyDepartures}
      getKey={(staff) => staff.staffId}
      empty={{
        icon: <CheckCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />,
        title: "No early departures today!",
        subtitle: "Everyone left at or after the scheduled time",
      }}
      renderItem={(staff) => (
        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-100">
          <div>
            <div className="font-medium text-gray-900">{staff.name}</div>
            <div className="text-sm text-gray-500">
              {staff.staffId} • {staff.department}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-purple-600">{getLocalTimeString(new Date(staff.checkOutTime))}</div>
            <div className="flex items-center gap-1 text-xs text-purple-600">
              <Clock className="w-3 h-3" />
              Early Departure
            </div>
          </div>
        </div>
      )}
    />
  )
}
