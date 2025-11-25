"use client"

/**
 * Biometric Registration Page
 * Staff members can register their fingerprint and face
 */

import { useState, useEffect, Suspense } from "react"
import { Fingerprint, ScanFace, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FingerprintScanner } from "@/components/fingerprint-scanner"
import { FaceRecognition } from "@/components/face-recognition"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

export default function RegisterBiometricContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState<"verify" | "register">("verify")
  const [staffId, setStaffId] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [staffName, setStaffName] = useState("")
  const [registeredFingerprint, setRegisteredFingerprint] = useState(false)
  const [registeredFace, setRegisteredFace] = useState(false)

  // Extract staffId and tenantId from URL parameter and auto-verify
  useEffect(() => {
    const urlStaffId = searchParams.get("staffId")
    const urlTenantId = searchParams.get("tenantId")
    console.log("URL staffId:", urlStaffId, "tenantId:", urlTenantId)
    if (urlStaffId && urlTenantId) {
      const upperStaffId = urlStaffId.toUpperCase()
      console.log("Setting staffId:", upperStaffId)
      setStaffId(upperStaffId)
      // Auto-verify the staff ID
      verifyStaffById(upperStaffId, urlTenantId)
    } else if (urlStaffId && !urlTenantId) {
      setError("Invalid registration link. Please use the link provided by your administrator.")
    }
  }, []) // Run only once on mount

  const verifyStaffById = async (id: string, tenantId?: string) => {
    setVerifying(true)
    setError("")

    try {
      const url = tenantId 
        ? `/api/staff/verify?staffId=${id}&tenantId=${tenantId}`
        : `/api/staff/verify?staffId=${id}`
      
      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Staff not found")
      }

      setStaffName(data.staff.name)
      setStep("register")
    } catch (err: any) {
      setError(err.message || "Failed to verify staff ID")
    } finally {
      setVerifying(false)
    }
  }

  const handleVerifyStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    await verifyStaffById(staffId)
  }

  const handleFingerprintRegistered = () => {
    setRegisteredFingerprint(true)
  }

  const handleFaceRegistered = () => {
    setRegisteredFace(true)
  }

  if (step === "verify") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Register Biometrics</CardTitle>
              <CardDescription>
                Enter your Staff ID to register your fingerprint or face
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleVerifyStaff} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="staffId">Staff ID</Label>
                  <Input
                    id="staffId"
                    type="text"
                    placeholder="e.g., STAFF001"
                    value={staffId}
                    onChange={(e) => {
                      setStaffId(e.target.value.toUpperCase())
                      setError("")
                    }}
                    className="text-center font-mono text-lg"
                    autoFocus
                    disabled={verifying}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={verifying || !staffId.trim()}
                >
                  {verifying ? "Verifying..." : "Continue"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/checkin" className="text-sm text-blue-600 hover:underline">
                  Back to Check-In
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/checkin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Check-In
            </Button>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Register Your Biometrics
            </h1>
            <p className="text-gray-600">
              Welcome, <span className="font-semibold">{staffName}</span> ({staffId})
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Register your fingerprint and/or face for faster check-in
            </p>
          </div>
        </div>

        {/* Success Message */}
        {(registeredFingerprint || registeredFace) && (
          <Card className="mb-6 border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Registration Successful!</p>
                  <p className="text-sm text-green-700">
                    {registeredFingerprint && "Fingerprint registered. "}
                    {registeredFace && "Face registered. "}
                    You can now use biometric check-in.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Registration Tabs */}
        <Tabs defaultValue="fingerprint" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="fingerprint">
              <Fingerprint className="w-4 h-4 mr-2" />
              Fingerprint
              {registeredFingerprint && (
                <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
              )}
            </TabsTrigger>
            <TabsTrigger value="face">
              <ScanFace className="w-4 h-4 mr-2" />
              Face Recognition
              {registeredFace && (
                <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Fingerprint Registration */}
          <TabsContent value="fingerprint">
            <Card>
              <CardHeader>
                <CardTitle>Register Fingerprint</CardTitle>
                <CardDescription>
                  Use your device's biometric sensor to register your fingerprint
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registeredFingerprint ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Fingerprint Already Registered
                    </h3>
                    <p className="text-gray-600 mb-4">
                      You can register additional devices if needed
                    </p>
                    <Button
                      onClick={() => setRegisteredFingerprint(false)}
                      variant="outline"
                    >
                      Register Another Device
                    </Button>
                  </div>
                ) : (
                  <FingerprintScanner
                    mode="register"
                    staffId={staffId}
                    onScan={handleFingerprintRegistered}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Face Registration */}
          <TabsContent value="face">
            <Card>
              <CardHeader>
                <CardTitle>Register Face</CardTitle>
                <CardDescription>
                  Use your camera to register your face for recognition
                </CardDescription>
              </CardHeader>
              <CardContent>
                {registeredFace ? (
                  <div className="text-center py-8">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Face Already Registered
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your face has been successfully registered
                    </p>
                    <Button
                      onClick={() => setRegisteredFace(false)}
                      variant="outline"
                    >
                      Re-register Face
                    </Button>
                  </div>
                ) : (
                  <FaceRecognition
                    mode="register"
                    staffId={staffId}
                    onScan={handleFaceRegistered}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Instructions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">How to Use Biometric Check-In</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  1
                </div>
                <p>
                  <strong>Register:</strong> Complete fingerprint and/or face registration above
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  2
                </div>
                <p>
                  <strong>Check-In:</strong> Go to the check-in page and select Fingerprint or Face tab
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  3
                </div>
                <p>
                  <strong>Authenticate:</strong> Use your biometric to automatically check in/out
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-4 justify-center">
          <Link href="/checkin">
            <Button size="lg">
              Go to Check-In
            </Button>
          </Link>
          {(registeredFingerprint || registeredFace) && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                setStep("verify")
                setStaffId("")
                setRegisteredFingerprint(false)
                setRegisteredFace(false)
              }}
            >
              Register Another Staff
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
