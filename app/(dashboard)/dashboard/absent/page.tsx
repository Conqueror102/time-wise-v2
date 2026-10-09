"use client"

import { UserCheck, UserX } from "lucide-react"
import { ReportPage } from "@/components/dashboard/report-page"

export default function AbsentPage() {
  return (
    <ReportPage
      title="Absent Staff"
      description="Active staff members who haven't checked in today"
      listTitle="Absent Today"
      select={(data) => data.absentStaff}
      getKey={(staff) => staff.staffId}
      empty={{
        icon: <UserCheck className="w-16 h-16 mx-auto mb-3 opacity-50" />,
        title: "All staff have checked in!",
        subtitle: "100% attendance today",
      }}
      renderItem={(staff) => (
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-100">
          <div>
            <div className="font-medium text-gray-900">{staff.name}</div>
            <div className="text-sm text-gray-500">
              {staff.staffId} • {staff.department}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UserX className="w-5 h-5 text-red-600" />
            <span className="text-sm text-red-600 font-medium">Absent</span>
          </div>
        </div>
      )}
    />
  )
}
