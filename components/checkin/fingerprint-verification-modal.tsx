"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, CheckCircle, AlertTriangle, Loader2 } from "lucide-react"

interface FingerprintVerificationModalProps {
  open: boolean
  onClose: () => void
  staffId: string
  tenantId: string
  onSuccess: () => void
}

export function FingerprintVerificationModal({
  open,
  onClose,
  staffId,
  tenantId,
  onSuccess,
}: FingerprintVerificationModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleVerify = async () => {
    setIsScanning(true)
    setError("")

    try {
      // Fetch user's credentials
      const credentialsResponse = await fetch("/api/biometric/fingerprint/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId, tenantId }),
      })

      if (!credentialsResponse.ok) {
        throw new Error("No fingerprint registered")
      }

      const { credentials } = await credentialsResponse.json()

      // Generate challenge
      const challenge = new Uint8Array(32)
      crypto.getRandomValues(challenge)
      const challengeBase64 = btoa(String.fromCharCode(...challenge))

      // Convert credential IDs
      const allowCredentials = credentials.map((cred: any) => ({
        id: Uint8Array.from(atob(cred.credentialId), c => c.charCodeAt(0)),
        type: "public-key" as const,
        transports: ["internal"] as AuthenticatorTransport[],
      }))

      // Request fingerprint authentication
      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: "required",
          rpId: window.location.hostname,
          allowCredentials,
        },
      })) as PublicKeyCredential

      if (!assertion) {
        throw new Error("Authentication cancelled")
      }

      const credentialId = btoa(String.fromCharCode(...new Uint8Array(assertion.rawId)))
      const assertionResponse = assertion.response as AuthenticatorAssertionResponse

      const authenticatorData = btoa(String.fromCharCode(...new Uint8Array(assertionResponse.authenticatorData)))
      const clientDataJSON = btoa(String.fromCharCode(...new Uint8Array(assertionResponse.clientDataJSON)))
      const signature = btoa(String.fromCharCode(...new Uint8Array(assertionResponse.signature)))

      // Verify with server
      const response = await fetch("/api/biometric/fingerprint/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credentialId,
          challenge: challengeBase64,
          authenticatorData,
          clientDataJSON,
          signature,
          tenantId,
        }),
      })

      if (!response.ok) {
        throw new Error("Fingerprint verification failed")
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } catch (err: any) {
      console.error("Fingerprint verification error:", err)
      setError(err.message || "Fingerprint verification failed")
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Fingerprint className="w-5 h-5" />
            Fingerprint Verification Required
          </DialogTitle>
          <DialogDescription>
            Please scan your fingerprint to verify your identity and complete check-in/out.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center py-6">
            <div
              className={`w-24 h-24 mx-auto rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
                isScanning
                  ? "border-blue-500 bg-blue-50 animate-pulse"
                  : success
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 bg-gray-50"
              }`}
            >
              {success ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : isScanning ? (
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
              ) : (
                <Fingerprint className="w-12 h-12 text-gray-400" />
              )}
            </div>

            <div className="mt-4">
              {isScanning && <p className="text-blue-600 font-medium">Scanning fingerprint...</p>}
              {success && <p className="text-green-600 font-medium">Verified successfully!</p>}
              {!isScanning && !success && <p className="text-gray-600">Ready to scan</p>}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            {!success && (
              <>
                <Button
                  onClick={handleVerify}
                  disabled={isScanning}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Scan Fingerprint
                    </>
                  )}
                </Button>
                <Button onClick={onClose} variant="outline" disabled={isScanning}>
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
