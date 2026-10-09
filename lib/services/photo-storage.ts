/**
 * Storage for check-in/check-out photos.
 *
 * Uses Cloudinary when it is configured; otherwise photos are kept in the
 * `attendance_photos` MongoDB collection, which deletes them automatically
 * after the retention period (TTL index). Attendance records store either a
 * Cloudinary URL or a "local:<id>" reference.
 */

import { Binary, Db, ObjectId } from "mongodb"
import { isCloudinaryConfigured, uploadCheckInPhoto, uploadCheckOutPhoto } from "@/lib/services/cloudinary"
import { signPhotoToken } from "@/lib/auth/checkin-tokens"

export const PHOTO_RETENTION_DAYS = 7
const COLLECTION = "attendance_photos"
const LOCAL_PREFIX = "local:"

let indexReady: Promise<unknown> | null = null

function ensureIndexes(db: Db) {
  if (!indexReady) {
    indexReady = db
      .collection(COLLECTION)
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: PHOTO_RETENTION_DAYS * 24 * 60 * 60 })
      .catch((error) => {
        indexReady = null
        console.error("Failed to create photo TTL index:", error)
      })
  }
  return indexReady
}

/** Base64 must decode to a JPEG or PNG */
function decodeImage(base64: string): { buffer: Buffer; contentType: string } | null {
  const buffer = Buffer.from(base64, "base64")
  if (buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8) return { buffer, contentType: "image/jpeg" }
  if (buffer.length > 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { buffer, contentType: "image/png" }
  }
  return null
}

export async function storeAttendancePhoto(
  db: Db,
  photoBase64: string,
  type: "check-in" | "check-out",
  tenantId: string,
  staffId: string
): Promise<{ ref?: string; publicId?: string }> {
  if (isCloudinaryConfigured()) {
    const upload = type === "check-in" ? uploadCheckInPhoto : uploadCheckOutPhoto
    const result = await upload(photoBase64, staffId, tenantId)
    if (result.success && result.url) return { ref: result.url, publicId: result.publicId }
    console.warn(`Cloudinary upload failed (${result.error}); storing ${type} photo locally`)
  }

  const image = decodeImage(photoBase64)
  if (!image) return {}

  await ensureIndexes(db)
  const { insertedId } = await db.collection(COLLECTION).insertOne({
    tenantId,
    staffId,
    type,
    contentType: image.contentType,
    data: new Binary(image.buffer),
    createdAt: new Date(),
  })
  return { ref: `${LOCAL_PREFIX}${insertedId.toString()}` }
}

/**
 * Turn a stored photo reference into something an <img> can load:
 * Cloudinary URLs pass through, local photos get a short-lived signed link.
 * Photos past the retention period are hidden.
 */
export function photoUrl(ref: string | undefined, tenantId: string, capturedAt?: Date | string): string | undefined {
  if (!ref) return undefined
  if (capturedAt && Date.now() - new Date(capturedAt).getTime() > PHOTO_RETENTION_DAYS * 24 * 60 * 60 * 1000) {
    return undefined
  }
  if (ref.startsWith(LOCAL_PREFIX)) {
    const id = ref.slice(LOCAL_PREFIX.length)
    return `/api/photos/${id}?token=${encodeURIComponent(signPhotoToken(tenantId, id))}`
  }
  return ref
}

export async function readLocalPhoto(db: Db, id: string, tenantId: string) {
  if (!ObjectId.isValid(id)) return null
  return db.collection(COLLECTION).findOne({ _id: new ObjectId(id), tenantId })
}
