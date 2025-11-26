"use client"

import { useState, useEffect } from "react"
import { Copy, CheckCircle, Lock, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface CheckInUrlCopyProps {
  organization?: {
    settings?: {
      checkInPasscode?: string
    }
  }
}

export function CheckInUrlCopy({ organization }: CheckInUrlCopyProps) {
  const [checkInUrl, setCheckInUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [newPasscode, setNewPasscode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCheckInUrl(`${window.location.origin}/checkin`)
    }
  }, [])

  const hasPasscode = !!organization?.settings?.checkInPasscode

  const copyUrl = () => {
    if (!hasPasscode) {
      setShowModal(true)
      return
    }
    navigator.clipboard.writeText(checkInUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const setPasscode = async () => {
    if (!newPasscode.trim()) {
      setError("Passcode required")
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch("/api/organization/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checkInPasscode: newPasscode }),
      })

      if (!response.ok) throw new Error("Failed")

      const org = JSON.parse(localStorage.getItem("organization") || "{}")
      org.settings = org.settings || {}
      org.settings.checkInPasscode = newPasscode
      localStorage.setItem("organization", JSON.stringify(org))

      navigator.clipboard.writeText(checkInUrl)
      setCopied(true)
      setShowModal(false)
      setNewPasscode("")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError("Error saving passcode")
    } finally {
      setLoading(false)
    }
  }

  if (!checkInUrl) return null

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          value={checkInUrl}
          readOnly
          className="text-xs font-mono h-9"
        />
        <Button
          onClick={copyUrl}
          size="sm"
          variant="outline"
          className="gap-1 whitespace-nowrap"
        >
          {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-sm">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Set Passcode
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setNewPasscode("")
                    setError("")
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <Input
                type="text"
                placeholder="e.g., 1234"
                value={newPasscode}
                onChange={(e) => {
                  setNewPasscode(e.target.value)
                  setError("")
                }}
                disabled={loading}
                className="font-mono text-center"
                autoFocus
              />

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowModal(false)
                    setNewPasscode("")
                    setError("")
                  }}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={setPasscode}
                  disabled={loading || !newPasscode.trim()}
                  className="flex-1"
                >
                  {loading ? "Setting..." : "Set & Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
