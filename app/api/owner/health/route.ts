/**
 * System health for the owner panel: a live database check plus whether each
 * external service is configured. External APIs are not called.
 */

import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { getDatabase } from "@/lib/mongodb"
import { isCloudinaryConfigured } from "@/lib/services/cloudinary"

export const dynamic = 'force-dynamic'

type Status = "healthy" | "degraded" | "down" | "not_configured"

export async function GET(request: NextRequest) {
  try {
    await withSuperAdminAuth(request)
    const lastChecked = new Date().toISOString()

    let database: { status: Status; responseTime: number; message: string }
    const started = Date.now()
    try {
      const db = await getDatabase()
      await db.command({ ping: 1 })
      const responseTime = Date.now() - started
      database = {
        status: responseTime > 1000 ? "degraded" : "healthy",
        responseTime,
        message: responseTime > 1000 ? "Database is responding slowly" : "Database reachable",
      }
    } catch (error: any) {
      database = { status: "down", responseTime: Date.now() - started, message: error.message || "Database unreachable" }
    }

    const configured = (service: string, ok: boolean) => ({
      service,
      status: (ok ? "healthy" : "not_configured") as Status,
      responseTime: 0,
      message: ok ? "Credentials configured" : "Not configured",
    })

    const services = [
      { service: "MongoDB Database", ...database },
      configured("Email (SMTP)", !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS)),
      configured("Cloudinary", isCloudinaryConfigured()),
      configured("AWS Rekognition", !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)),
      configured("Scheduled Jobs (CRON_SECRET)", !!process.env.CRON_SECRET),
    ].map((s) => ({ ...s, lastChecked }))

    return NextResponse.json({ services })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to check system health" },
      { status: error.statusCode || 500 }
    )
  }
}
