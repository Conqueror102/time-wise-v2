/**
 * Cancel Scheduled Downgrade API
 * Allows users to cancel a scheduled downgrade
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/middleware/auth'
import { getSubscription, cancelScheduledDowngrade } from '@/lib/subscription/subscription-manager'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get tenant context
    const context = await verifyAuth(request, ['org_admin'])
    if (!context) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { tenantId } = context

    // Get current subscription
    const subscription = await getSubscription(tenantId)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Check if there's a scheduled downgrade
    if (!subscription.scheduledDowngrade) {
      return NextResponse.json(
        { error: 'No scheduled downgrade found' },
        { status: 400 }
      )
    }

    // Cancel the scheduled downgrade
    await cancelScheduledDowngrade(tenantId)

    return NextResponse.json({
      success: true,
      message: 'Scheduled downgrade cancelled successfully. Your current plan will continue.',
    })
  } catch (error) {
    console.error('Cancel scheduled downgrade error:', error)
    
    return NextResponse.json(
      { error: 'Failed to cancel scheduled downgrade' },
      { status: 500 }
    )
  }
}
