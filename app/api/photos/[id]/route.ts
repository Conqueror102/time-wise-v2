/**
 * Serves a locally stored check-in photo. Requires the signed token that the
 * attendance APIs attach to each photo link.
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyPhotoToken } from "@/lib/auth/checkin-tokens"
import { readLocalPhoto } from "@/lib/services/photo-storage"

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  let claims
  try {
    claims = verifyPhotoToken(request.nextUrl.searchParams.get("token"))
  } catch {
    return NextResponse.json({ error: "Photo link expired" }, { status: 401 })
  }
  if (claims.photoId !== id) {
    return NextResponse.json({ error: "Invalid photo link" }, { status: 401 })
  }

  const db = await getDatabase()
  const photo = await readLocalPhoto(db, id, claims.tenantId)
  if (!photo) {
    return NextResponse.json({ error: "Photo not found or expired" }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(photo.data.buffer), {
    headers: {
      "Content-Type": photo.contentType || "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  })
}
