"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, CheckCircle, AlertTriangle, X } from "lucide-react"

interface FingerprintScannerProps {
  onScan: (fingerprintData: string) => void
  onClose?: () => void
  mode: "register" | "authenticate"
  staffId?: string
}

export function FingerprintScanner({ onScan, onClose, mode, staffId }: FingerprintScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState(false)

  const checkWebAuthnSupport = () => {
    return !!(
      window.PublicKeyCredential && 
      navigator.credentials && 
      typeof navigator.credentials.create === "function" && 
      typeof navigator.credentials.get === "function"
    )
  }

  const startFingerprint = async () => {
    if (!checkWebAuthnSupport()) {
      setError("Fingerprint authentication is not supported on this device")
      return
    }

    setIsScanning(true)
    setError("")

    try {
      if (mode === "register") {
        await registerFingerprint()
      } else {
        await authenticateFingerprint()
      }
    } catch (err: any) {
      console.error("Fingerprint error:", err)
      setError(err.message || "Fingerprint authentication failed")
    } finally {
      setIsScanning(false)
    }
  }

  const registerFingerprint = async () => {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "Staff Check-in System",
          id: window.location.hostname,
        },
        user: {
          id: new TextEncoder().encode(staffId || "user"),
          name: staffId || "user",
          displayName: staffId || "User",
        },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
        authenticatorSelection: {
          authenticatorAttachment: "platform",
          userVerification: "required",
        },
        timeout: 60000,
        attestation: "direct",
      },
    })) as PublicKeyCredential

    if (credential) {
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)))
      const publicKey = btoa(
        String.fromCharCode(
          ...new Uint8Array(
            (credential.response as AuthenticatorAttestationResponse).getPublicKey() || new ArrayBuffer(0)
          )
        )
      )

      // Save to database
      const response = await fetch("/api/biometric/fingerprint/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          staffId,
          credentialId,
          publicKey,
          deviceName: navigator.userAgent.includes("Mac") ? "Mac" : 
                      navigator.userAgent.includes("Windows") ? "Windows" :
                      navigator.userAgent.includes("iPhone") ? "iPhone" : "Device",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to save fingerprint")
      }

      setSuccess(true)
      setTimeout(() => {
        onScan(credentialId)
      }, 1000)
    }
  }

  const authenticateFingerprint = async () => {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: "required",
      },
    })) as PublicKeyCredential

    if (assertion) {
      const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)))

      // Verify with database
      const response = await fetch("/api/biometric/fingerprint/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          credentialId,
        }),
      })

      if (!response.ok) {
        throw new Error("Fingerprint not recognized")
      }

      const data = await response.json()
      
      setSuccess(true)
      setTimeout(() => {
        onScan(data.staffId)
      }, 1000)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <Card className="glass-card shadow-xl border-2 border-purple-200">
        <CardHeader className="text-center">
          <div className="flex justify-between items-center mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
              <Fingerprint className="w-8 h-8 text-white" />
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <CardTitle className="text-xl text-primary-navy">
            {mode === "register" ? "Register Fingerprint" : "Fingerprint Authentication"}
          </CardTitle>
          <CardDescription>
            {mode === "register"
              ? "Place your finger on the sensor to register your fingerprint"
              : "Place your finger on the sensor to authenticate"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-center">
            <div
              className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                isScanning
                  ? "border-purple-500 bg-purple-50 animate-pulse"
                  : success
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
              }`}
            >
              {success ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <Fingerprint className={`w-12 h-12 ${isScanning ? "text-purple-600" : "text-gray-400"}`} />
              )}
            </div>

            <div className="mt-4">
              {isScanning && <p className="text-purple-600 font-medium">Scanning fingerprint...</p>}
              {success && (
                <p className="text-green-600 font-medium">
                  Fingerprint {mode === "register" ? "registered" : "authenticated"} successfully!
                </p>
              )}
              {!isScanning && !success && <p className="text-gray-600">Ready to scan</p>}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!checkWebAuthnSupport() && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>Fingerprint authentication requires a compatible device and browser.</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            {!success && (
              <Button
                onClick={startFingerprint}
                disabled={isScanning || !checkWebAuthnSupport()}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
              >
                {isScanning ? "Scanning..." : `${mode === "register" ? "Register" : "Scan"} Fingerprint`}
              </Button>
            )}
            {onClose && (
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
