/**
 * Cancel Subscription API
 * Allows users to cancel their subscription
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { cancelSubscription, getSubscription } from '@/lib/subscription/subscription-manager'
import { cancelSubscription as cancelPaystackSubscription } from '@/lib/services/paystack'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get tenant context
    const context = await withAuth(request, { allowedRoles: ['org_admin'] })
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

    // Can't cancel if already cancelled
    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Subscription is already cancelled' },
        { status: 400 }
      )
    }

    // If on starter plan, just mark as cancelled
    if (subscription.plan === 'starter') {
      await cancelSubscription(tenantId)
      
      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled successfully. You can reactivate anytime.',
      })
    }

    // For paid plans, cancel with Paystack first
    if (subscription.paystackSubscriptionCode) {
      const db = await getDatabase()
      const org = await db.collection('organizations').findOne({ _id: new ObjectId(tenantId) })
      
      if (org) {
        const cancelResult = await cancelPaystackSubscription(
          subscription.paystackSubscriptionCode,
          org.adminEmail
        )
        
        if (!cancelResult.success) {
          console.error('Failed to cancel Paystack subscription:', cancelResult.error)
          // Continue anyway - mark as cancelled in our system
        }
      }
    }

    // Cancel in our system
    await cancelSubscription(tenantId)

    // Update organization status
    const db = await getDatabase()
    await db.collection('organizations').updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          subscriptionStatus: 'cancelled',
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully. You will retain access until the end of your billing period.',
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
