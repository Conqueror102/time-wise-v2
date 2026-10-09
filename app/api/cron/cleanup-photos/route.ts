/**
 * Cron job: delete check-in/check-out photos older than the retention period.
 * Called daily by Vercel Cron (vercel.json) with "Authorization: Bearer $CRON_SECRET".
 */

import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { deleteImage, isCloudinaryConfigured } from "@/lib/services/cloudinary"

export const dynamic = 'force-dynamic'

const RETENTION_DAYS = 7
const BATCH_SIZE = 500

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`)
  const provided = Buffer.from(request.headers.get("authorization") || "")
  return expected.length === provided.length && crypto.timingSafeEqual(expected, provided)
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    console.error("[CRON] CRON_SECRET is not configured")
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const db = await getDatabase()
    const attendance = db.collection("attendance")
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000)

    const expired = await attendance
      .find(
        {
          photosCapturedAt: { $lt: cutoff },
          $or: [{ checkInPhoto: { $exists: true } }, { checkOutPhoto: { $exists: true } }],
        },
        { projection: { checkInPhotoPublicId: 1, checkOutPhotoPublicId: 1 } }
      )
      .limit(BATCH_SIZE)
      .toArray()

    let deletedImages = 0
    let failedImages = 0
    const cloudinary = isCloudinaryConfigured()

    for (const record of expired) {
      const publicIds = [record.checkInPhotoPublicId, record.checkOutPhotoPublicId].filter(Boolean)
      let ok = true
      if (cloudinary) {
        for (const publicId of publicIds) {
          const result = await deleteImage(publicId)
          if (result.success) deletedImages++
          else {
            failedImages++
            ok = false
          }
        }
      }
      // Keep the reference if the image could not be deleted, so the next run retries it
      if (ok) {
        await attendance.updateOne(
          { _id: record._id },
          {
            $unset: { checkInPhoto: "", checkOutPhoto: "", checkInPhotoPublicId: "", checkOutPhotoPublicId: "" },
            $set: { photosDeletedAt: new Date() },
          }
        )
      }
    }

    console.log(`[CRON] Photo cleanup: ${expired.length} records, ${deletedImages} images deleted, ${failedImages} failed`)

    return NextResponse.json({
      success: true,
      recordsProcessed: expired.length,
      imagesDeleted: deletedImages,
      imagesFailed: failedImages,
      more: expired.length === BATCH_SIZE,
    })
  } catch (error) {
    console.error("[CRON] Photo cleanup failed:", error)
    return NextResponse.json({ success: false, error: "Photo cleanup failed" }, { status: 500 })
  }
}
