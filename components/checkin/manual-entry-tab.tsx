"use client"

import { useState } from "react"
import { Clock, Loader2, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AttendanceStatus {
  hasCheckedIn: boolean
  hasCheckedOut: boolean
  checkInTime?: string
  checkOutTime?: string
  isLate?: boolean
  isEarly?: boolean
}

interface ManualEntryTabProps {
  staffId: string
  setStaffId: (id: string) => void
  loading: boolean
  error: string
  message: string
  messageType: "success" | "error" | ""
  capturePhotos: boolean
  attendanceStatus: AttendanceStatus | null
  statusLoading: boolean
  onCheckIn: (type: "check-in" | "check-out") => void
  onCheckAttendanceStatus: (staffId: string) => void
  onClearMessage: () => void
}

export function ManualEntryTab({
  staffId,
  setStaffId,
  loading,
  error,
  message,
  messageType,
  capturePhotos,
  attendanceStatus,
  statusLoading,
  onCheckIn,
  onCheckAttendanceStatus,
  onClearMessage,
}: ManualEntryTabProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="staffId" className="text-base">
          Enter Your Staff ID
        </Label>
        <Input
          id="staffId"
          type="text"
          placeholder="e.g., STAFF1234"
          value={staffId}
          onChange={(e) => {
            const newStaffId = e.target.value.toUpperCase()
            setStaffId(newStaffId)
          }}
          onFocus={() => {
            // Scroll input into view when focused
            setTimeout(() => {
              document.getElementById("staffId")?.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest"
              })
            }, 100)
          }}
          onBlur={() => {
            if (staffId.trim()) {
              onCheckAttendanceStatus(staffId)
            }
          }}
          className="text-lg h-12 text-center font-mono"
          disabled={loading}
          autoFocus
        />
      </div>

      {/* Status Display */}
      {attendanceStatus && staffId && (
        <div className={`px-4 py-3 rounded border ${
          attendanceStatus.hasCheckedOut
            ? "bg-gray-50 border-gray-200 text-gray-700"
            : attendanceStatus.hasCheckedIn
              ? "bg-blue-50 border-blue-200 text-blue-700"
              : "bg-green-50 border-green-200 text-green-700"
        }`}>
          {attendanceStatus.hasCheckedOut ? (
            <div className="text-center">
              <p className="font-medium">✅ Already completed for today</p>
              <p className="text-sm mt-1">
                Checked in: {attendanceStatus.checkInTime ? new Date(attendanceStatus.checkInTime).toLocaleTimeString() : "N/A"}
                {attendanceStatus.isLate && " (Late)"}
              </p>
              <p className="text-sm">
                Checked out: {attendanceStatus.checkOutTime ? new Date(attendanceStatus.checkOutTime).toLocaleTimeString() : "N/A"}
                {attendanceStatus.isEarly && " (Early)"}
              </p>
            </div>
          ) : attendanceStatus.hasCheckedIn ? (
            <div className="text-center">
              <p className="font-medium">🟢 Currently checked in</p>
              <p className="text-sm mt-1">
                Since: {attendanceStatus.checkInTime ? new Date(attendanceStatus.checkInTime).toLocaleTimeString() : "N/A"}
                {attendanceStatus.isLate && " (Late arrival)"}
              </p>
              <p className="text-sm text-blue-600">Ready to check out</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-medium">⭕ Not checked in today</p>
              <p className="text-sm mt-1 text-green-600">Ready to check in</p>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Photo Verification Notice */}
      {capturePhotos && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-red-800 mb-1">
                Mandatory Photo Verification
              </h4>
              <p className="text-sm text-red-700">
                Photo verification is required for attendance recording. Please position yourself clearly in front of the camera when prompted. 
                <span className="font-semibold">Your attendance will not be counted without successful photo verification.</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4">
        {statusLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Checking status...</span>
          </div>
        ) : !staffId.trim() ? (
          // No staff ID entered - show prompt
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Enter your Staff ID above to continue</p>
          </div>
        ) : !attendanceStatus ? (
          // Staff ID entered but status not checked yet - show nothing or prompt
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">Checking your status...</p>
          </div>
        ) : attendanceStatus.hasCheckedOut ? (
          // Already checked out
          <div className="text-center py-4">
            <p className="text-gray-600 mb-2">All done for today!</p>
            <Button
              onClick={() => {
                setStaffId("")
              }}
              variant="outline"
              className="w-full"
            >
              Check Another Staff Member
            </Button>
          </div>
        ) : attendanceStatus.hasCheckedIn ? (
          // Checked in - show ONLY check-out button
          <Button
            data-action="check-out"
            onClick={() => onCheckIn("check-out")}
            disabled={loading}
            className="h-12 bg-blue-600 hover:bg-blue-700 w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Check Out
              </>
            )}
          </Button>
        ) : (
          // Not checked in - show ONLY check-in button
          <Button
            data-action="check-in"
            onClick={() => onCheckIn("check-in")}
            disabled={loading}
            className="h-12 bg-green-600 hover:bg-green-700 w-full"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Check In
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}