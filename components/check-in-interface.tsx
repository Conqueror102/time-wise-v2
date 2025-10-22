"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, KeyRound, Camera, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { QRScanner } from "./qr-scanner"

export function CheckInInterface() {
  const [staffId, setStaffId] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [messageType, setMessageType] = useState<"success" | "error" | "warning">("success")
  const [showScanner, setShowScanner] = useState(false)

  const handleCheckIn = async (id: string, type: "check-in" | "check-out") => {
    if (!id.trim()) {
      setMessage("Please enter a staff ID")
      setMessageType("error")
      return
    }

    setLoading(true)
    setMessage("")

    try {
      const response = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ staffId: id.trim(), type }),
      })

      const data = await response.json()

      if (data.success) {
        setMessage(
          `${data.staff} ${type === "check-in" ? "checked in" : "checked out"} successfully${data.isLate ? " (Late)" : ""}`,
        )
        setMessageType(data.isLate ? "warning" : "success")
        setStaffId("")
      } else {
        setMessage(data.error || `${type} failed`)
        setMessageType("error")
      }
    } catch (error) {
      setMessage("Network error. Please try again.")
      setMessageType("error")
    } finally {
      setLoading(false)
    }
  }

  const handleQRScan = (scannedId: string) => {
    setStaffId(scannedId)
    setShowScanner(false)
  }

  const getMessageIcon = () => {
    switch (messageType) {
      case "success":
        return <CheckCircle className="w-4 h-4" />
      case "warning":
        return <AlertTriangle className="w-4 h-4" />
      case "error":
        return <AlertTriangle className="w-4 h-4" />
    }
  }

  const getAlertVariant = () => {
    switch (messageType) {
      case "error":
        return "destructive"
      default:
        return "default"
    }
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle>Staff Check-In/Out</CardTitle>
          <CardDescription>Enter your staff ID or scan your QR code</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual" className="flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Manual ID
              </TabsTrigger>
              <TabsTrigger value="qr" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                QR Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="staffId">Staff ID</Label>
                <Input
                  id="staffId"
                  type="text"
                  placeholder="Enter your staff ID"
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  className="text-center font-mono"
                />
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4">
              <div className="text-center">
                {!showScanner ? (
                  <Button onClick={() => setShowScanner(true)} variant="outline" className="w-full">
                    <Camera className="w-4 h-4 mr-2" />
                    Start QR Scanner
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <QRScanner onScan={handleQRScan} />
                    <Button onClick={() => setShowScanner(false)} variant="outline" size="sm">
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
              {staffId && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">Scanned ID:</p>
                  <p className="font-mono font-bold">{staffId}</p>
                </div>
              )}
            </TabsContent>
          </Tabs>

          {message && (
            <Alert variant={getAlertVariant()} className="mt-4">
              {getMessageIcon()}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mt-6">
            <Button
              onClick={() => handleCheckIn(staffId, "check-in")}
              disabled={loading || !staffId.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? "Processing..." : "Check In"}
            </Button>
            <Button
              onClick={() => handleCheckIn(staffId, "check-out")}
              disabled={loading || !staffId.trim()}
              variant="outline"
              className="flex-1"
            >
              {loading ? "Processing..." : "Check Out"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
