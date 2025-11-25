/**
 * Upgrade Subscription API
 * Initializes payment for upgrading to a higher plan
 */

import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth'
import { getSubscription } from '@/lib/subscription/subscription-manager'
import { initializePayment, nairaToKobo } from '@/lib/services/paystack'
import { getPlanByTier } from '@/lib/subscription-plans'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and get tenant context
    const context = await withAuth(request, {
      allowedRoles: ['org_admin'],
    })

    const { tenantId, user } = context
    const body = await request.json()
    const { targetPlan } = body

    // Validate target plan
    if (!['professional', 'enterprise'].includes(targetPlan)) {
      return NextResponse.json(
        { error: 'Invalid target plan' },
        { status: 400 }
      )
    }

    // Get plan details
    const plan = getPlanByTier(targetPlan)
    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      )
    }

    // Get current subscription (create if doesn't exist)
    let subscription = await getSubscription(tenantId)
    
    if (!subscription) {
      // Create a starter subscription if none exists
      const db = await getDatabase()
      const now = new Date()
      const trialEndDate = new Date(now)
      trialEndDate.setDate(trialEndDate.getDate() + 14)

      const newSubscription = {
        organizationId: tenantId,
        plan: "starter" as const,
        status: "active" as const,
        trialEndDate,
        isTrialActive: true,
        subscriptionStartDate: now,
        subscriptionEndDate: null,
        paystackSubscriptionCode: null,
        paystackCustomerCode: null,
        lastPaymentDate: null,
        nextPaymentDate: null,
        amount: 0,
        currency: "NGN",
        createdAt: now,
        updatedAt: now,
      }

      await db.collection('subscriptions').insertOne(newSubscription)
      subscription = await getSubscription(tenantId)
      
      if (!subscription) {
        return NextResponse.json(
          { error: 'Failed to create subscription' },
          { status: 500 }
        )
      }
    }

    // Check if it's actually an upgrade
    const planHierarchy = { starter: 0, professional: 1, enterprise: 2 }
    const currentLevel = planHierarchy[subscription.plan]
    const targetLevel = planHierarchy[targetPlan as keyof typeof planHierarchy]

    if (targetLevel <= currentLevel) {
      return NextResponse.json(
        { error: 'Target plan must be higher than current plan' },
        { status: 400 }
      )
    }

    // Get organization details
    const db = await getDatabase()
    const org = await db.collection('organizations').findOne({ _id: new ObjectId(tenantId) })
    
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Initialize payment with Paystack
    const paymentResult = await initializePayment(
      org.adminEmail,
      nairaToKobo(plan.price),
      {
        organizationId: tenantId,
        organizationName: org.name,
        plan: targetPlan,
        userId: user.userId,
        upgradeFrom: subscription.plan,
      }
    )

    if (!paymentResult.success) {
      return NextResponse.json(
        { error: paymentResult.error || 'Failed to initialize payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      authorizationUrl: paymentResult.authorizationUrl,
      reference: paymentResult.reference,
      amount: plan.price,
      plan: targetPlan,
    })
  } catch (error) {
    console.error('Upgrade subscription error:', error)
    
    return NextResponse.json(
      { error: 'Failed to upgrade subscription' },
      { status: 500 }
    )
  }
}
