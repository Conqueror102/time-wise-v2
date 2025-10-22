import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const db = await getDatabase()

    let settings = await db.collection("settings").findOne({})

    if (!settings) {
      // Create default settings
      const defaultSettings = {
        latenessTime: "09:00",
        workEndTime: "17:00",
        createdAt: new Date(),
      }
      const result = await db.collection("settings").insertOne(defaultSettings)
      settings = { ...defaultSettings, _id: result.insertedId }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { latenessTime, workEndTime } = await request.json()

    const db = await getDatabase()

    await db.collection("settings").updateOne(
      {},
      {
        $set: { latenessTime, workEndTime },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
