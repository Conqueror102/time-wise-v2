# Subscription Management Implementation

Complete implementation of subscription upgrade, downgrade, and cancellation features.

## ✅ Implemented Features

### 1. Subscription Endpoints

#### **Upgrade** (`/api/subscription/upgrade`)
- Initializes Paystack payment for upgrading to higher plans
- Validates plan hierarchy (must be an upgrade)
- Returns Paystack checkout URL
- Includes metadata for webhook processing

#### **Downgrade** (`/api/subscription/downgrade`)
- Schedules downgrade for end of billing period
- Validates staff count limits:
  - Starter: max 10 staff
  - Professional: max 50 staff
- Prevents immediate downgrade to avoid service disruption
- Stores scheduled downgrade in subscription document

#### **Cancel Scheduled Downgrade** (`/api/subscription/downgrade/cancel`)
- Cancels a previously scheduled downgrade
- Allows users to change their mind
- Removes scheduled downgrade from subscription

#### **Cancel Subscription** (`/api/subscription/cancel`)
- Cancels subscription with Paystack (for paid plans)
- Marks subscription as cancelled in database
- Retains access until end of billing period
- Immediate cancellation for starter plan

#### **Get Status** (`/api/subscription/status`)
- Returns current subscription details
- Includes trial information
- Shows scheduled downgrades if any

### 2. Subscription Manager Functions

#### Core Functions
- `createTrialSubscription()` - Creates 14-day trial
- `getSubscription()` - Retrieves subscription
- `updateSubscriptionAfterPayment()` - Updates after successful payment
- `cancelSubscription()` - Marks subscription as cancelled
- `getSubscriptionStatus()` - Returns detailed status

#### New Functions
- `processScheduledDowngrades()` - Processes due downgrades
- `cancelScheduledDowngrade()` - Cancels scheduled downgrade
- `downgradeSubscription()` - Immediate downgrade (for starter)
- `checkExpiredSubscriptions()` - Checks trials, past due, and processes downgrades

### 3. Payment Integration

#### Paystack Service Enhancements
- **Retry Logic**: Automatic retry with exponential backoff (3 attempts)
- **Timeout**: 30-second timeout on all API requests
- **Smart Retry**: Only retries on server errors (5xx), not client errors (4xx)
- Applied to:
  - `initializePayment()`
  - `verifyPayment()`
  - `initializeSubscription()`

### 4. Automated Processing

#### Cron Job (`/api/cron/check-subscriptions`)
Runs daily to:
1. Mark expired trials as inactive
2. Mark past-due subscriptions
3. **Process scheduled downgrades**
4. Update subscription statuses

Protected by `CRON_SECRET` environment variable.

---

## 📊 Subscription Flow

### Upgrade Flow
```
User clicks "Upgrade" 
  → POST /api/subscription/upgrade
  → Initialize Paystack payment
  → Redirect to Paystack checkout
  → User completes payment
  → Paystack webhook fires
  → Subscription updated immediately
  → User gets new features
```

### Downgrade Flow
```
User clicks "Downgrade"
  → POST /api/subscription/downgrade
  → Validate staff count
  → Schedule downgrade for billing period end
  → User retains current features
  → Cron job processes downgrade on scheduled date
  → User moved to lower plan
```

### Cancellation Flow
```
User clicks "Cancel"
  → POST /api/subscription/cancel
  → Cancel with Paystack (if paid plan)
  → Mark as cancelled in database
  → User retains access until billing period end
  → Subscription expires naturally
```

---

## 🔒 Security Features

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Only org admins can manage subscriptions
3. **Validation**: 
   - Plan hierarchy validation
   - Staff count validation
   - Status validation
4. **Cron Protection**: Secret token required for cron endpoint
5. **Webhook Verification**: Paystack signature verification

---

## 📝 Database Schema

### Subscription Document
```typescript
{
  organizationId: string
  plan: "starter" | "professional" | "enterprise"
  status: "active" | "cancelled" | "expired" | "past_due"
  trialEndDate: Date | null
  isTrialActive: boolean
  subscriptionStartDate: Date
  subscriptionEndDate: Date | null
  paystackSubscriptionCode: string | null
  paystackCustomerCode: string | null
  lastPaymentDate: Date | null
  nextPaymentDate: Date | null
  amount: number
  currency: string
  scheduledDowngrade?: {
    targetPlan: "starter" | "professional" | "enterprise"
    scheduledFor: Date
    requestedAt: Date
  }
  createdAt: Date
  updatedAt: Date
}
```

---

## 🚀 Deployment Checklist

### Environment Variables
```env
# Required
PAYSTACK_SECRET_KEY=sk_live_xxx
CRON_SECRET=your-secure-random-string

# Optional (defaults provided)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Vercel Cron Configuration
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/check-subscriptions",
    "schedule": "0 0 * * *"
  }]
}
```

### Paystack Setup
1. Create plans in Paystack dashboard:
   - Professional: `PLN_professional_monthly` (₦5,000)
   - Enterprise: `PLN_enterprise_monthly` (₦10,000)
2. Configure webhook URL: `https://yourdomain.com/api/webhooks/paystack`
3. Copy secret key to environment variables

---

## 🧪 Testing

### Manual Testing
1. **Upgrade**: Test payment flow with Paystack test cards
2. **Downgrade**: Schedule downgrade and verify it's stored
3. **Cancel Downgrade**: Cancel scheduled downgrade
4. **Cancel Subscription**: Test cancellation flow
5. **Cron Job**: Manually trigger with Bearer token

### Test Scenarios
- ✅ Upgrade from starter to professional
- ✅ Upgrade from professional to enterprise
- ✅ Downgrade with staff count validation
- ✅ Cancel scheduled downgrade
- ✅ Cancel paid subscription
- ✅ Cancel starter subscription
- ✅ Process scheduled downgrades via cron
- ✅ Handle payment failures gracefully

---

## 📚 Documentation

- **API Documentation**: `docs/SUBSCRIPTION_API.md`
- **Implementation Details**: This file
- **Deployment Guide**: `DEPLOYMENT_GUIDE.md`

---

## 🎯 Key Features

1. **Graceful Downgrades**: Users retain access until billing period ends
2. **Staff Validation**: Prevents downgrades that would exceed limits
3. **Flexible Cancellation**: Can cancel scheduled downgrades anytime
4. **Retry Logic**: Handles temporary Paystack API issues
5. **Timeout Protection**: Prevents hanging requests
6. **Automated Processing**: Cron job handles scheduled changes
7. **Comprehensive Logging**: All actions logged for debugging

---

## 🔄 Future Enhancements

Potential improvements:
- Prorated upgrades (charge difference immediately)
- Annual billing with discount
- Custom enterprise pricing
- Usage-based billing
- Subscription pause/resume
- Refund handling
- Email notifications for subscription changes
