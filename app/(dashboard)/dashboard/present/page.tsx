"use client"

import { AlertCircle } from "lucide-react"
import { getLocalTimeString } from "@/lib/utils/date"
import { ReportPage } from "@/components/dashboard/report-page"

export default function PresentPage() {
  return (
    <ReportPage
      title="Present Today"
      description="Everyone who has checked in today"
      listTitle="Checked In"
      select={(data) => data.presentToday}
      getKey={(staff) => staff.staffId}
      empty={{
        icon: <AlertCircle className="w-16 h-16 mx-auto mb-3 opacity-50" />,
        title: "No one has checked in yet",
        subtitle: "Check-ins will appear here as staff arrive",
      }}
      renderItem={(staff) => (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div>
            <div className="font-medium text-gray-900">{staff.name}</div>
            <div className="text-sm text-gray-500">
              {staff.staffId} • {staff.department}
            </div>
          </div>
          <div className="text-right text-sm">
            <div className="font-medium">In: {getLocalTimeString(new Date(staff.checkInTime))}</div>
            {staff.checkOutTime ? (
              <div className="text-gray-500">Out: {getLocalTimeString(new Date(staff.checkOutTime))}</div>
            ) : (
              <div className="text-green-600 font-medium">Still in</div>
            )}
            {staff.isLate && <div className="text-xs text-orange-600">Late</div>}
          </div>
        </div>
      )}
    />
  )
}
