/**
 * Get Current Pricing API
 * Returns pricing for all subscription plans
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { PLAN_PRICES } from "@/lib/features/feature-manager"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const db = await getDatabase()
    
    // Get custom pricing from owner settings (if any)
    const settings = await db.collection("owner_settings").findOne({ key: "pricing" })
    
    // Use custom pricing if set, otherwise use defaults
    const professionalPrice = settings?.value?.professional || PLAN_PRICES.professional.monthly
    const enterprisePrice = settings?.value?.enterprise || PLAN_PRICES.enterprise.monthly
    const currency = settings?.value?.currency || PLAN_PRICES.professional.currency

    return NextResponse.json({
      success: true,
      pricing: {
        starter: {
          monthly: 0,
          currency,
          formattedPrice: "Free",
          trial: "14 days",
        },
        professional: {
          monthly: professionalPrice,
          currency,
          formattedPrice: `₦${professionalPrice.toLocaleString()}`,
        },
        enterprise: {
          monthly: enterprisePrice,
          currency,
          formattedPrice: `₦${enterprisePrice.toLocaleString()}`,
        },
      },
    })
  } catch (error) {
    console.error("Get pricing error:", error)
    
    // Return default pricing on error
    return NextResponse.json({
      success: true,
      pricing: {
        starter: {
          monthly: 0,
          currency: "NGN",
          formattedPrice: "Free",
          trial: "14 days",
        },
        professional: {
          monthly: PLAN_PRICES.professional.monthly,
          currency: PLAN_PRICES.professional.currency,
          formattedPrice: `₦${PLAN_PRICES.professional.monthly.toLocaleString()}`,
        },
        enterprise: {
          monthly: PLAN_PRICES.enterprise.monthly,
          currency: PLAN_PRICES.enterprise.currency,
          formattedPrice: `₦${PLAN_PRICES.enterprise.monthly.toLocaleString()}`,
        },
      },
    })
  }
}
