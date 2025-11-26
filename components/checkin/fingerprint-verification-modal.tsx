"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Fingerprint, CheckCircle, AlertTriangle, Loader2, Shield, ScanFace } from "lucide-react"
import { detectBiometricType, type BiometricInfo } from "@/lib/utils/biometric-detector"

interface BiometricVerificationModalProps {
  open: boolean
  onClose: () => void
  staffId: string
  tenantId: string
  onSuccess: () => void
}

export function BiometricVerificationModal({
  open,
  onClose,
  staffId,
  tenantId,
  onSuccess,
}: BiometricVerificationModalProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [biometricInfo, setBiometricInfo] = useState<BiometricInfo | null>(null)

  useEffect(() => {
    setBiometricInfo(detectBiometricType())
  }, [])

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
        throw new Error("Biometric verification failed")
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    } catch (err: any) {
      console.error("Biometric verification error:", err)
      setError(err.message || "Biometric verification failed")
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {biometricInfo?.icon === 'shield' && <Shield className="w-5 h-5" />}
            {biometricInfo?.icon === 'fingerprint' && <Fingerprint className="w-5 h-5" />}
            {biometricInfo?.icon === 'scan' && <ScanFace className="w-5 h-5" />}
            {biometricInfo?.icon === 'face' && <ScanFace className="w-5 h-5" />}
            Biometric Verification Required
          </DialogTitle>
          <DialogDescription>
            {biometricInfo?.actionText || 'Use biometric authentication'} to verify your identity and complete check-in/out.
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
              ) : biometricInfo?.icon === 'shield' ? (
                <Shield className="w-12 h-12 text-gray-400" />
              ) : biometricInfo?.icon === 'scan' || biometricInfo?.icon === 'face' ? (
                <ScanFace className="w-12 h-12 text-gray-400" />
              ) : (
                <Fingerprint className="w-12 h-12 text-gray-400" />
              )}
            </div>

            <div className="mt-4">
              {isScanning && <p className="text-blue-600 font-medium">Verifying identity...</p>}
              {success && <p className="text-green-600 font-medium">Verified successfully!</p>}
              {!isScanning && !success && <p className="text-gray-600">Ready to authenticate</p>}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                {error.replace('fingerprint', 'biometric')}
                {error.includes("No fingerprint registered") && (
                  <div className="mt-2">
                    <a
                      href={`/register-biometric?staffId=${staffId}&tenantId=${tenantId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm underline hover:no-underline"
                    >
                      {biometricInfo?.registerText || 'Register biometric'} now →
                    </a>
                  </div>
                )}
              </AlertDescription>
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
                      Verifying...
                    </>
                  ) : (
                    <>
                      {biometricInfo?.icon === 'shield' && <Shield className="w-4 h-4 mr-2" />}
                      {biometricInfo?.icon === 'fingerprint' && <Fingerprint className="w-4 h-4 mr-2" />}
                      {(biometricInfo?.icon === 'scan' || biometricInfo?.icon === 'face') && <ScanFace className="w-4 h-4 mr-2" />}
                      {biometricInfo?.actionText || 'Authenticate'}
                    </>
                  )}
                </Button>
                <Button onClick={onClose} variant="outline" disabled={isScanning}>
                  Cancel
                </Button>
              </>
            )}
          </div>
          
          {!success && !error && (
            <div className="text-center text-sm text-gray-500 pt-2 border-t">
              <p>
                Don't have biometric registered?{" "}
                <a
                  href={`/register-biometric?staffId=${staffId}&tenantId=${tenantId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Register now
                </a>
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


// Export with both names for backward compatibility
export { BiometricVerificationModal as FingerprintVerificationModal }
