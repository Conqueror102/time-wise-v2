# Payment Flow Diagram & User Journey

## User Journey Flowchart

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  1. USER ATTEMPTS LOCKED FEATURE                                         │
│     (Fingerprint, Photo, Add Staff)                                      │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  2. FEATURE GATE CHECK                                                   │
│     ┌─────────────────────────────────────────────────────────────┐     │
│     │ if (!hasFeature(feature)) {                                │     │
│     │   setUpgradeFeature(feature)                               │     │
│     │   setShowUpgradePopup(true)                                │     │
│     │ }                                                           │     │
│     └─────────────────────────────────────────────────────────────┘     │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  3. UPGRADE MODAL DISPLAYED                                              │
│     Shows:                                                               │
│     • Feature name as subtitle                                           │
│     • Gate message (why it's locked)                                     │
│     • Available plans (professional/enterprise)                          │
│     • Recommended plan pre-selected                                      │
│     • Price for each plan                                                │
│                                                                           │
│     EXAMPLE:                                                             │
│     ┌──────────────────────────────────────────┐                       │
│     │ Upgrade Your Plan                        │                       │
│     │ Fingerprint Verification                 │                       │
│     │ ⚠️ Only available in Enterprise plan    │                       │
│     │                                          │                       │
│     │ ☐ Professional - ₦5,000/month           │                       │
│     │ ☑ Enterprise - ₦10,000/month (RECOMMENDED)                      │
│     │                                          │                       │
│     │ [Cancel] [Continue to Payment]          │                       │
│     └──────────────────────────────────────────┘                       │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                    USER CLICKS UPGRADE
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  4. INITIATE PAYMENT (useSubscriptionPayment Hook)                      │
│                                                                           │
│     onUpgrade("enterprise") called                                       │
│         ↓                                                                │
│     initiateUpgradePayment({                                             │
│       plan: "enterprise",                                                │
│       onSuccess: closeModal,                                             │
│       onError: showErrorToast                                            │
│     })                                                                   │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  5. CALL UPGRADE API                                                     │
│     POST /api/subscription/upgrade                                       │
│     Body: { targetPlan: "enterprise" }                                   │
│     Headers: { Authorization: "Bearer JWT_TOKEN" }                       │
│                                                                           │
│     API Validation:                                                      │
│     • Check plan is valid (pro/enterprise only)                          │
│     • Check it's actually an upgrade                                     │
│     • Get org email from database                                        │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  6. INITIALIZE PAYSTACK PAYMENT                                          │
│                                                                           │
│     API calls: initializePayment(                                        │
│       email: org.adminEmail,                                             │
│       amount: 1000000 (₦10,000 in kobo),                                │
│       metadata: {                                                        │
│         organizationId, organizationName,                                │
│         plan, userId, upgradeFrom                                        │
│       }                                                                  │
│     )                                                                    │
│                                                                           │
│     Response: {                                                          │
│       authorizationUrl: "https://checkout.paystack.com/...",            │
│       reference: "PAY_REF_12345",                                        │
│       amount: 10000,                                                     │
│       plan: "enterprise"                                                 │
│     }                                                                    │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  7. SHOW PAYMENT PROCESSING STATE                                        │
│     • Button shows "Processing..."                                       │
│     • Modal displays loading state                                       │
│     • Toast: "Redirecting to Payment. You will be redirected..."        │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  8. STORE INFO & REDIRECT TO PAYSTACK                                    │
│                                                                           │
│     sessionStorage.setItem("upgradeInProgress", {                        │
│       plan: "enterprise",                                                │
│       reference: "PAY_REF_12345",                                        │
│       timestamp: "2025-11-25T10:30:00Z"                                  │
│     })                                                                   │
│                                                                           │
│     window.location.href = authorizationUrl                              │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                   USER TAKEN TO PAYSTACK
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  9. PAYSTACK CHECKOUT                                                    │
│     • User enters card details                                           │
│     • Paystack processes payment                                         │
│     • Payment succeeds or fails                                          │
│                                                                           │
│     On Success:                                                          │
│     Paystack redirects to:                                               │
│     /payment/callback?reference=PAY_REF_12345                            │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  10. CALLBACK PAGE (/payment/callback)                                   │
│      • Extracts reference from URL query params                          │
│      • Calls: GET /api/payment/verify?reference=PAY_REF_12345           │
│      • Shows loading spinner with dots                                   │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  11. VERIFY PAYMENT API                                                  │
│      POST /api/payment/verify                                            │
│                                                                           │
│      API Actions:                                                        │
│      • Call Paystack: GET /transaction/verify/{reference}                │
│      • Check payment successful (status = success)                       │
│      • Update subscription in database                                   │
│      • Return plan info                                                  │
│                                                                           │
│      Response: {                                                         │
│        success: true,                                                    │
│        plan: "enterprise",                                               │
│        message: "Subscription upgraded successfully"                     │
│      }                                                                   │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  12. SUCCESS STATE                                                       │
│      • Stop loading spinner                                              │
│      • Show green checkmark ✓                                            │
│      • Display: "Payment successful! Your subscription has been          │
│        upgraded."                                                        │
│      • Show plan: "Enterprise"                                           │
│      • Auto-redirect to dashboard after 3 seconds                        │
│                                                                           │
│      OR User clicks dashboard button                                     │
│                                                                           │
│      ┌──────────────────────────────────┐                               │
│      │ ✓ Payment Successful            │                               │
│      │ Enterprise Plan                  │                               │
│      │ Your subscription has been       │                               │
│      │ upgraded successfully!           │                               │
│      │ Redirecting to dashboard...      │                               │
│      │ [Dashboard]                      │                               │
│      └──────────────────────────────────┘                               │
│                                                                           │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
            (Auto-redirect after 3 seconds)
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                           │
│  13. DASHBOARD                                                           │
│      • User has new plan: Enterprise                                     │
│      • Can now use locked features                                       │
│      • Show success banner (optional)                                    │
│      •   "Your subscription has been upgraded to Enterprise plan"        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘


```

## Error Handling Flow

```
Payment Failure at any stage:
                           ▼
         ┌─────────────────────────────────┐
         │ Error caught in hook or API     │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │ Show error toast:                │
         │ "Payment Error"                  │
         │ + detailed message               │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │ Call onError callback            │
         └─────────────────────────────────┘
                           │
                           ▼
         ┌─────────────────────────────────┐
         │ Modal stays open                 │
         │ Button enabled for retry         │
         │ User can try again or cancel     │
         └─────────────────────────────────┘
```

## API Endpoints Used

### 1. Initialize Payment
```
POST /api/subscription/upgrade
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

{
  "targetPlan": "professional" | "enterprise"
}

Response:
{
  "success": true,
  "authorizationUrl": "https://checkout.paystack.com/...",
  "reference": "PAY_REF_12345",
  "amount": 10000,
  "plan": "enterprise"
}
```

### 2. Verify Payment
```
GET /api/payment/verify?reference=PAY_REF_12345
Authorization: Bearer {JWT_TOKEN}

Response:
{
  "success": true,
  "plan": "enterprise",
  "message": "Subscription upgraded successfully"
}
```

### 3. Paystack Initialize (Internal)
```
POST https://api.paystack.co/transaction/initialize
Authorization: Bearer {PAYSTACK_SECRET_KEY}
Content-Type: application/json

{
  "email": "admin@org.com",
  "amount": 1000000,  // In kobo
  "currency": "NGN",
  "metadata": {
    "organizationId": "...",
    "plan": "enterprise",
    ...
  },
  "callback_url": "https://app.com/payment/callback"
}
```

### 4. Paystack Verify (Internal)
```
GET https://api.paystack.co/transaction/verify/{reference}
Authorization: Bearer {PAYSTACK_SECRET_KEY}
```

## Component Props

```typescript
// UpgradeModal Props
interface UpgradeModalProps {
  isOpen: boolean                              // Show/hide modal
  onClose: () => void                         // Close modal callback
  onUpgrade: (plan: 'professional' | 'enterprise') => void  // Payment callback
  currentPlan: string                         // 'starter' | 'professional' | 'enterprise'
  loading?: boolean                           // Show loading state
  feature?: string                            // Feature name (e.g., "Fingerprint Verification")
  message?: string                            // Gate message explanation
  recommendedPlan?: PlanType                  // Which plan to pre-select
}

// useSubscriptionPayment Hook
{
  loading: boolean
  error: string | null
  initiateUpgradePayment: (options: {
    plan: 'professional' | 'enterprise'
    onSuccess?: () => void
    onError?: (error: string) => void
  }) => Promise<void>
}
```

## Environment Variables Required

```
# .env.local
PAYSTACK_SECRET_KEY=sk_live_xxx...  # Production secret key
NEXT_PUBLIC_APP_URL=https://app.com   # For callback URL
```

## Feature Availability by Plan

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|-----------|
| Check-In | ✓ | ✓ | ✓ |
| Photo Verification | Trial Only | ✓ | ✓ |
| Fingerprint Check-In | ✗ | ✗ | ✓ |
| Staff (qty) | 5 | 10 | Unlimited |
| Analytics | ✗ | ✗ | ✓ |
| Multi-department | ✗ | ✓ | ✓ |

## Testing Locally

### 1. Setup Paystack Account
- Create account at paystack.co
- Get test secret key from dashboard

### 2. Set Environment Variable
```bash
export PAYSTACK_SECRET_KEY="sk_test_xxx..."
```

### 3. Test Card Details (Paystack Test Mode)
```
Card Number: 4012888888881881
Expiry: Any future date
CVV: Any 3 digits
OTP: 123456
```

### 4. Test Flow
1. Go to /checkin page
2. Try to enable fingerprint
3. Click "Upgrade to Enterprise"
4. See "Processing..." state
5. Redirected to Paystack checkout
6. Use test card above
7. Enter OTP when prompted
8. See success page
9. Redirected to dashboard

## Webhook Integration

Paystack sends webhook after successful payment:
```
POST /api/webhooks/paystack
Header: x-paystack-signature: {HMAC-SHA512}

Event: charge.success
Data: {
  status: "success",
  reference: "PAY_REF_12345",
  authorization: { ... },
  customer: { ... },
  metadata: { organizationId, plan, ... }
}
```

This updates subscription in database automatically.
