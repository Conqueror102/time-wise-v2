"use client"

/**
 * Check-In Information Page
 * Shows admin the credentials needed for check-in page
 */

import { useEffect, useState } from "react"
import { Copy, CheckCircle, Lock, Mail, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"

export default function CheckInInfoPage() {
  const [organization, setOrganization] = useState<any>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const orgData = localStorage.getItem("organization")
    if (orgData) {
      setOrganization(JSON.parse(orgData))
    }
  }, [])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const checkInPasscode = organization.settings?.checkInPasscode || "Not set (use 1234 in development)"
  const adminEmail = organization.adminEmail
  const checkInUrl = `${window.location.origin}/checkin`

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check-In Information</h1>
        <p className="text-gray-600 mt-1">
          Share these credentials with staff to access the check-in page
        </p>
      </div>

      {/* Warning if no passcode set */}
      {!organization.settings?.checkInPasscode && (
        <Card className="border-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lock className="w-6 h-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900 mb-1">
                  No Passcode Set
                </h3>
                <p className="text-sm text-orange-700 mb-3">
                  You haven't set a check-in passcode yet. In development mode, you can use "1234" as the default passcode.
                </p>
                <Link href="/dashboard/settings">
                  <Button size="sm" variant="outline" className="border-orange-300">
                    Go to Settings to Set Passcode
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Check-In URL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Check-In Page URL
          </CardTitle>
          <CardDescription>
            Share this URL with your staff or display it on a kiosk
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Check-In URL</Label>
            <div className="flex gap-2">
              <Input value={checkInUrl} readOnly className="font-mono text-sm" />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(checkInUrl, "url")}
              >
                {copied === "url" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/checkin" target="_blank">
              <Button>Open Check-In Page</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInUrl)}`
                window.open(qrUrl, "_blank")
              }}
            >
              Generate QR Code
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Check-In Credentials
          </CardTitle>
          <CardDescription>
            Staff need these credentials to unlock the check-in page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Organization Email</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                value={adminEmail}
                readOnly
                className="font-mono"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(adminEmail, "email")}
              >
                {copied === "email" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="passcode">Check-In Passcode</Label>
            <div className="flex gap-2">
              <Input
                id="passcode"
                value={checkInPasscode}
                readOnly
                className="font-mono text-2xl tracking-widest text-center"
              />
              <Button
                variant="outline"
                onClick={() => copyToClipboard(checkInPasscode, "passcode")}
                disabled={!organization.settings?.checkInPasscode}
              >
                {copied === "passcode" ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {!organization.settings?.checkInPasscode && (
              <p className="text-sm text-orange-600">
                ⚠️ Development mode: Use "1234" as passcode
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How Staff Use Check-In</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                1
              </span>
              <span>
                Go to the check-in page: <code className="bg-gray-100 px-2 py-1 rounded">{checkInUrl}</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                2
              </span>
              <span>
                Enter organization email: <code className="bg-gray-100 px-2 py-1 rounded">{adminEmail}</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                3
              </span>
              <span>
                Enter passcode: <code className="bg-gray-100 px-2 py-1 rounded">{checkInPasscode}</code>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                4
              </span>
              <span>Choose check-in method: Manual, QR Code, Fingerprint, or Face</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                5
              </span>
              <span>Check in or check out!</span>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex gap-4">
        <Link href="/dashboard/settings">
          <Button variant="outline">
            <Lock className="w-4 h-4 mr-2" />
            Change Passcode
          </Button>
        </Link>
        <Link href="/checkin" target="_blank">
          <Button>
            Test Check-In Page
          </Button>
        </Link>
      </div>
    </div>
  )
}
