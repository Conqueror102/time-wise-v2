import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"

export async function POST(req: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 })
  }

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan, isTrialActive } = await req.json()

    const db = await getDatabase()
    const now = new Date()
    const trialEndDate = isTrialActive ? new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) : new Date(now.getTime() - 1000)

    await db.collection("subscriptions").updateOne(
      { organizationId: session.user.organizationId },
      {
        $set: {
          plan,
          isTrialActive,
          trialEndDate,
          updatedAt: now,
        },
      },
      { upsert: true }
    )

    return NextResponse.json({ success: true, plan, isTrialActive })
  } catch (error) {
    console.error("Dev switch plan error:", error)
    return NextResponse.json({ error: "Failed to switch plan" }, { status: 500 })
  }
}
