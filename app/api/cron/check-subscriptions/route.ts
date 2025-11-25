/**
 * Cron Job: Check and Update Expired Subscriptions
 * Should be called daily via Vercel Cron or external scheduler
 * 
 * Vercel Cron Configuration (vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/check-subscriptions",
 *     "schedule": "0 0 * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkExpiredSubscriptions } from '@/lib/subscription/subscription-manager'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Checking expired subscriptions...')
    
    await checkExpiredSubscriptions()
    
    console.log('[CRON] Subscription check completed successfully')
    
    return NextResponse.json({
      success: true,
      message: 'Subscription check completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[CRON] Subscription check failed:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Subscription check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
