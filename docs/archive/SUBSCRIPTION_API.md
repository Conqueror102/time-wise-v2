# Subscription Management API

Complete API documentation for subscription management endpoints.

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

Only organization admins (`org_admin` role) can access these endpoints.

---

## Endpoints

### 1. Get Subscription Status

**GET** `/api/subscription/status`

Get the current subscription status for the authenticated organization.

**Response:**
```json
{
  "plan": "professional",
  "status": "active",
  "isActive": true,
  "isTrialActive": false,
  "needsUpgrade": false,
  "trialDaysRemaining": null,
  "features": {
    "organizationId": "...",
    "plan": "professional",
    "status": "active",
    "nextPaymentDate": "2025-12-22T00:00:00.000Z",
    "amount": 5000
  }
}
```

---

### 2. Upgrade Subscription

**POST** `/api/subscription/upgrade`

Initialize payment to upgrade to a higher plan.

**Request Body:**
```json
{
  "targetPlan": "professional" | "enterprise"
}
```

**Response:**
```json
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "ref_123456",
  "amount": 5000,
  "plan": "professional"
}
```

**Error Responses:**
- `400` - Invalid target plan or not an upgrade
- `404` - Organization or plan not found
- `500` - Payment initialization failed

---

### 3. Downgrade Subscription

**POST** `/api/subscription/downgrade`

Schedule a downgrade to a lower plan (takes effect at end of billing period).

**Request Body:**
```json
{
  "targetPlan": "starter" | "professional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Downgrade to starter plan scheduled. Your plan will change at the end of your current billing period.",
  "scheduledFor": "2025-12-22T00:00:00.000Z"
}
```

**Error Responses:**
- `400` - Invalid target plan, not a downgrade, or staff count exceeds limit
- `404` - No active subscription found

**Staff Limits:**
- Starter plan: Maximum 10 staff members
- Professional plan: Maximum 50 staff members

If you exceed these limits, you must remove staff before downgrading.

---

### 4. Cancel Scheduled Downgrade

**POST** `/api/subscription/downgrade/cancel`

Cancel a previously scheduled downgrade.

**Response:**
```json
{
  "success": true,
  "message": "Scheduled downgrade cancelled successfully. Your current plan will continue."
}
```

**Error Responses:**
- `400` - No scheduled downgrade found
- `404` - No active subscription found

---

### 5. Cancel Subscription

**POST** `/api/subscription/cancel`

Cancel the current subscription.

**Behavior:**
- **Starter plan**: Immediate cancellation
- **Paid plans**: Cancels with Paystack and marks as cancelled (access retained until end of billing period)

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully. You will retain access until the end of your billing period."
}
```

**Error Responses:**
- `400` - Subscription already cancelled
- `404` - No active subscription found

---

## Subscription Plans

### Starter (Free Trial)
- **Price**: ₦0
- **Staff Limit**: 10
- **Features**: 14-day trial with all features (except fingerprint)
- **After Trial**: Basic check-in only (manual & QR)

### Professional
- **Price**: ₦5,000/month
- **Staff Limit**: 50
- **Features**: Photo verification, analytics, reports, CSV export

### Enterprise
- **Price**: ₦10,000/month
- **Staff Limit**: Unlimited
- **Features**: All Professional features + fingerprint verification + advanced insights

---

## Subscription Lifecycle

### Trial Period
1. New organizations start with **Starter** plan
2. 14-day trial with all features unlocked (except fingerprint)
3. After trial expires:
   - Can continue using basic features (manual & QR check-in)
   - Must upgrade for advanced features

### Upgrades
1. User initiates upgrade via `/api/subscription/upgrade`
2. Redirected to Paystack payment page
3. After successful payment:
   - Webhook updates subscription
   - Plan activated immediately
   - Access to new features granted

### Downgrades
1. User schedules downgrade via `/api/subscription/downgrade`
2. Downgrade scheduled for end of current billing period
3. User retains current plan features until then
4. Can cancel scheduled downgrade anytime

### Cancellations
1. User cancels via `/api/subscription/cancel`
2. For paid plans:
   - Paystack subscription cancelled
   - Access retained until end of billing period
3. For starter plan:
   - Immediate cancellation
   - Can reactivate anytime

---

## Automated Processing

### Cron Job: `/api/cron/check-subscriptions`

Runs periodically to:
1. Mark expired trials as inactive
2. Mark past-due subscriptions
3. Process scheduled downgrades
4. Update subscription statuses

**Recommended**: Run every hour or daily

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "error": "Error message description"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Resource not found
- `500` - Server error

---

## Integration Example

```typescript
// Upgrade to Professional plan
async function upgradeToProfessional(token: string) {
  const response = await fetch('/api/subscription/upgrade', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetPlan: 'professional'
    })
  })
  
  const data = await response.json()
  
  if (data.success) {
    // Redirect user to Paystack payment page
    window.location.href = data.authorizationUrl
  }
}

// Downgrade to Starter plan
async function downgradeToStarter(token: string) {
  const response = await fetch('/api/subscription/downgrade', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      targetPlan: 'starter'
    })
  })
  
  const data = await response.json()
  
  if (data.success) {
    alert(data.message)
  } else {
    alert(data.error)
  }
}

// Cancel subscription
async function cancelSubscription(token: string) {
  const response = await fetch('/api/subscription/cancel', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  })
  
  const data = await response.json()
  
  if (data.success) {
    alert(data.message)
  }
}
```
