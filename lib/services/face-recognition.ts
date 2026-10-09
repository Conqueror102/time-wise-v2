/**
 * Face recognition entry point used by the API routes.
 *
 * Providers:
 * - "compreface": self-hosted CompreFace (free, open source) — default when COMPREFACE_API_KEY is set
 * - "rekognition": AWS Rekognition — used when AWS credentials are set
 *
 * Set FACE_RECOGNITION_PROVIDER to choose explicitly when both are configured.
 */

import * as compreface from "./compreface"
import * as rekognition from "./aws-rekognition"

export type FaceProvider = "compreface" | "rekognition"

export function getFaceProvider(): FaceProvider | null {
  const requested = process.env.FACE_RECOGNITION_PROVIDER
  if (requested === "compreface") return compreface.isCompreFaceConfigured() ? "compreface" : null
  if (requested === "rekognition") return rekognition.isRekognitionConfigured() ? "rekognition" : null
  if (compreface.isCompreFaceConfigured()) return "compreface"
  if (rekognition.isRekognitionConfigured()) return "rekognition"
  return null
}

export function isFaceRecognitionConfigured(): boolean {
  return getFaceProvider() !== null
}

const NOT_CONFIGURED = "Face recognition is not set up on this server"

export async function registerFace(
  imageBase64: string,
  tenantId: string,
  staffId: string
): Promise<{ success: boolean; faceId?: string; provider?: FaceProvider; error?: string }> {
  const provider = getFaceProvider()
  if (!provider) return { success: false, error: NOT_CONFIGURED }

  const result =
    provider === "compreface"
      ? await compreface.registerFace(imageBase64, tenantId, staffId)
      : await rekognition.registerFace(imageBase64, tenantId, staffId)
  return { ...result, provider }
}

export async function searchFace(imageBase64: string, tenantId: string): Promise<compreface.FaceMatch> {
  const provider = getFaceProvider()
  if (!provider) return { success: false, error: NOT_CONFIGURED }

  return provider === "compreface"
    ? compreface.searchFace(imageBase64, tenantId)
    : rekognition.searchFace(imageBase64, tenantId)
}

/**
 * Remove a staff member's stored face from the provider it was registered with.
 * Faces registered before providers were tracked came from Rekognition.
 */
export async function deleteFace(
  faceData: { faceId?: string; provider?: FaceProvider } | undefined,
  tenantId: string,
  staffId: string
): Promise<boolean> {
  if (!faceData) return true
  if (faceData.provider === "compreface") {
    return compreface.isCompreFaceConfigured() ? compreface.deleteFace(tenantId, staffId) : false
  }
  return faceData.faceId && rekognition.isRekognitionConfigured() ? rekognition.deleteFace(faceData.faceId) : false
}
