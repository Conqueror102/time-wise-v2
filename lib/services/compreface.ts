/**
 * CompreFace (self-hosted, open source) face recognition client.
 * https://github.com/exadel-inc/CompreFace
 *
 * Uses one CompreFace recognition service for all organizations. Each face is
 * stored under the subject "<tenantId>__<staffId>" and searches only accept
 * matches from the caller's tenant.
 */

import { getImageSize } from "@/lib/utils/image-size"

// The first request after CompreFace has been idle can be slow while its models load
const REQUEST_TIMEOUT_MS = 30_000
// Minimum confidence the face in the photo is a real face
const DETECTION_THRESHOLD = 0.8

/** Image coordinates of the eyes and nose tip, as returned by face detectors */
export interface FaceLandmarks {
  eyes: [number, number][]
  nose: [number, number]
}

/**
 * How far the head is turned, from the landmarks: the nose tip's horizontal offset
 * from the point between the eyes, divided by the distance between the eyes.
 * 0 is straight on; positive means the nose moved to the image's right, which is the
 * person turning to their own left (the camera frame is not mirrored). Roughly
 * 0.35 x tan(yaw) for a real face, so 15 degrees is about 0.09.
 *
 * A printed photo or a screen tilted towards the camera shrinks horizontally as a
 * whole, so this ratio barely changes, unlike a real head turning.
 */
export function headTurn(landmarks: FaceLandmarks | undefined): number | undefined {
  if (!landmarks || landmarks.eyes.length < 2) return undefined
  const [first, second] = [...landmarks.eyes].sort((a, b) => a[0] - b[0])
  const distance = second[0] - first[0]
  if (!(distance > 0)) return undefined
  return (landmarks.nose[0] - (first[0] + second[0]) / 2) / distance
}

export interface FaceMatch {
  success: boolean
  staffId?: string
  confidence?: number
  /** Width of the detected face as a fraction of the photo width (0-1) */
  faceWidthRatio?: number
  /** True when no face was found at all (as opposed to an unknown face) */
  noFace?: boolean
  /** Head turn from the landmarks (see headTurn), used by the liveness check */
  turn?: number
  error?: string
}

export interface FaceRegistration {
  success: boolean
  faceId?: string
  error?: string
}

function baseUrl(): string {
  return (process.env.COMPREFACE_URL || "http://localhost:8001").replace(/\/+$/, "")
}

/** Similarity (0-1) a match must reach to be accepted */
function similarityThreshold(): number {
  const value = Number(process.env.COMPREFACE_SIMILARITY_THRESHOLD)
  return value > 0 && value <= 1 ? value : 0.9
}

export function isCompreFaceConfigured(): boolean {
  return !!process.env.COMPREFACE_API_KEY
}

function subjectFor(tenantId: string, staffId: string): string {
  return `${tenantId}__${staffId}`
}

class CompreFaceError extends Error {
  constructor(message: string, readonly status: number, readonly code?: number) {
    super(message)
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: {
        "x-api-key": process.env.COMPREFACE_API_KEY || "",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (error: any) {
    throw new CompreFaceError(`Face recognition service unreachable: ${error.message}`, 503)
  }

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new CompreFaceError(data.message || `Face recognition service error (${response.status})`, response.status, data.code)
  }
  return data as T
}

/** Turn CompreFace errors into messages suitable for staff at the kiosk */
function friendlyError(error: unknown): string {
  if (error instanceof CompreFaceError) {
    if (/no face is found/i.test(error.message)) return "No face detected. Face the camera in good light and try again."
    if (error.status === 401 || error.status === 403) return "Face recognition is misconfigured (invalid API key)"
    if (error.status === 503) return "Face recognition service is unavailable. Please try again shortly."
    return error.message
  }
  return "Face recognition failed"
}

/** Store a staff member's face, replacing any previous photo */
export async function registerFace(imageBase64: string, tenantId: string, staffId: string): Promise<FaceRegistration> {
  const subject = encodeURIComponent(subjectFor(tenantId, staffId))
  try {
    const result = await request<{ image_id: string }>(
      "POST",
      `/api/v1/recognition/faces?subject=${subject}&det_prob_threshold=${DETECTION_THRESHOLD}`,
      { file: imageBase64 }
    )

    // Only after the new photo is stored, remove older ones so a failed
    // re-registration never leaves the staff member without a face
    const existing = await request<{ faces: { image_id: string }[] }>(
      "GET",
      `/api/v1/recognition/faces?subject=${subject}&size=100`
    )
    for (const face of existing.faces || []) {
      if (face.image_id !== result.image_id) {
        await request("DELETE", `/api/v1/recognition/faces/${encodeURIComponent(face.image_id)}`).catch((error) =>
          console.error("CompreFace cleanup error:", error)
        )
      }
    }

    return { success: true, faceId: result.image_id }
  } catch (error) {
    console.error("CompreFace register error:", error)
    return { success: false, error: friendlyError(error) }
  }
}

/** Find which of this tenant's staff is in the photo */
export async function searchFace(imageBase64: string, tenantId: string): Promise<FaceMatch> {
  try {
    const result = await request<{
      result: { box?: { x_min: number; x_max: number }; landmarks?: [number, number][]; subjects?: { subject: string; similarity: number }[] }[]
    }>(
      "POST",
      `/api/v1/recognition/recognize?limit=1&prediction_count=20&det_prob_threshold=${DETECTION_THRESHOLD}&face_plugins=landmarks`,
      { file: imageBase64 }
    )

    const face = result.result?.[0]
    const imageWidth = getImageSize(Buffer.from(imageBase64, "base64"))?.width
    const faceWidthRatio = face?.box && imageWidth ? (face.box.x_max - face.box.x_min) / imageWidth : undefined

    // FaceNet landmarks: left eye, right eye, nose, mouth left, mouth right
    const points = face?.landmarks
    const turn = points && points.length >= 3 ? headTurn({ eyes: [points[0], points[1]], nose: points[2] }) : undefined
    const prefix = subjectFor(tenantId, "")
    const match = face?.subjects
      ?.filter((s) => s.subject.startsWith(prefix))
      .sort((a, b) => b.similarity - a.similarity)[0]

    if (!match || match.similarity < similarityThreshold()) {
      return { success: false, faceWidthRatio, turn, error: "Face not recognized" }
    }

    return { success: true, staffId: match.subject.slice(prefix.length), confidence: match.similarity, faceWidthRatio, turn }
  } catch (error) {
    if (error instanceof CompreFaceError && /no face is found/i.test(error.message)) {
      return { success: false, noFace: true, error: friendlyError(error) }
    }
    console.error("CompreFace search error:", error)
    return { success: false, error: friendlyError(error) }
  }
}

/** Remove all stored photos of a staff member */
export async function deleteFace(tenantId: string, staffId: string): Promise<boolean> {
  try {
    await request("DELETE", `/api/v1/recognition/faces?subject=${encodeURIComponent(subjectFor(tenantId, staffId))}`)
    return true
  } catch (error) {
    // Deleting a subject that has no photos is not an error
    if (error instanceof CompreFaceError && error.status === 404) return true
    console.error("CompreFace delete error:", error)
    return false
  }
}
