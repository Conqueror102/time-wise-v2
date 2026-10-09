"use client"

/**
 * Biometric Registration Page
 * Staff register their face from an admin-issued link.
 * (Fingerprints are enrolled directly on a fingerprint attendance device.)
 */

import { useState, useEffect, Suspense } from "react"
import { ScanFace, CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FaceRecognition } from "@/components/face-recognition"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function RegisterBiometricContent() {
  const searchParams = useSearchParams()
  const enrollToken = searchParams.get("token") || ""
  const [step, setStep] = useState<"verify" | "register">("verify")
  const [staffId, setStaffId] = useState("")
  const [error, setError] = useState("")
  const [staffName, setStaffName] = useState("")
  const [registeredFace, setRegisteredFace] = useState(false)

  // Registration links are issued by an administrator and carry a signed token
  useEffect(() => {
    if (!enrollToken) {
      setError("Invalid registration link. Please use the link provided by your administrator.")
      return
    }

    const verify = async () => {
      try {
        const response = await fetch(`/api/staff/verify?token=${encodeURIComponent(enrollToken)}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Staff not found")
        }

        setStaffId(data.staff.staffId)
        setStaffName(data.staff.name)
        setStep("register")
      } catch (err: any) {
        setError(err.message || "Failed to verify registration link")
      }
    }
    verify()
  }, [enrollToken])

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
                <ScanFace className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Register Biometrics</CardTitle>
              <CardDescription>
                {error ? "This link can't be used" : "Checking your registration link..."}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {error ? (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                  {error}
                </div>
              ) : (
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              )}

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
              Register your face so you can check in just by looking at the kiosk camera
            </p>
          </div>
        </div>

        {/* Success Message */}
        {registeredFace && (
          <Card className="mb-6 border-green-500 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Registration Successful!</p>
                  <p className="text-sm text-green-700">
                    {registeredFace && "Face registered. "}
                    You can now use biometric check-in.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Face Registration */}
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
                    enrollToken={enrollToken}
                    onScan={handleFaceRegistered}
                  />
                )}
              </CardContent>
            </Card>


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
                  <strong>Register:</strong> Capture your face above (look straight at the camera, in good light)
                </p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  2
                </div>
                <p>
                  <strong>Check-In:</strong> At the kiosk, open the Face tab and step up to the camera
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
        </div>
      </div>
    </div>
  )
}

// Wrapper component with Suspense boundary
export default function RegisterBiometricPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-center text-gray-600 mt-4">Loading registration...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <RegisterBiometricContent />
    </Suspense>
  )
}
