/**
 * Downgrade Subscription API
 * Allows users to downgrade their subscription plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/middleware'
import { getSubscription } from '@/lib/subscription/subscription-manager'
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
    const body = await request.json()
    const { targetPlan } = body

    // Validate target plan
    if (!['starter', 'professional'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid target plan' },
        { status: 400 }
      )
    }

    // Get current subscription
    const subscription = await getSubscription(tenantId)
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Check if it's actually a downgrade
    const planHierarchy = { starter: 0, professional: 1, enterprise: 2 }
    const currentLevel = planHierarchy[subscription.plan]
    const targetLevel = planHierarchy[targetPlan as keyof typeof planHierarchy]

    if (targetLevel >= currentLevel) {
      return NextResponse.json(
        { error: 'Target plan must be lower than current plan' },
        { status: 400 }
      )
    }

    const db = await getDatabase()

    // Check staff count if downgrading
    if (targetPlan === 'starter') {
      const staffCount = await db.collection('staff').countDocuments({ tenantId })
      if (staffCount > 10) {
        return NextResponse.json(
          {
            error: 'Cannot downgrade to Starter plan. You have more than 10 staff members. Please remove staff first.',
            currentStaffCount: staffCount,
            maxAllowed: 10,
          },
          { status: 400 }
        )
      }
    } else if (targetPlan === 'professional') {
      const staffCount = await db.collection('staff').countDocuments({ tenantId })
      if (staffCount > 50) {
        return NextResponse.json(
          {
            error: 'Cannot downgrade to Professional plan. You have more than 50 staff members. Please remove staff first.',
            currentStaffCount: staffCount,
            maxAllowed: 50,
          },
          { status: 400 }
        )
      }
    }

    // Schedule downgrade for end of billing period
    await db.collection('subscriptions').updateOne(
      { organizationId: tenantId },
      {
        $set: {
          scheduledDowngrade: {
            targetPlan,
            scheduledFor: subscription.nextPaymentDate || new Date(),
            requestedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      }
    )

    // Update organization
    await db.collection('organizations').updateOne(
      { _id: new ObjectId(tenantId) },
      {
        $set: {
          updatedAt: new Date(),
        },
      }
    )

    return NextResponse.json({
      success: true,
      message: `Downgrade to ${targetPlan} plan scheduled. Your plan will change at the end of your current billing period.`,
      scheduledFor: subscription.nextPaymentDate || new Date(),
    })
  } catch (error) {
    console.error('Downgrade subscription error:', error)
    
    return NextResponse.json(
      { error: 'Failed to downgrade subscription' },
      { status: 500 }
    )
  }
}
