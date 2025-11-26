# Payment Flow Implementation - Complete

## Overview
The payment flow has been fully implemented across the subscription upgrade system. When users attempt to access locked features, they can now seamlessly upgrade their subscription plan and complete payment through Paystack.

## Implementation Details

### 1. **Payment Hook: `useSubscriptionPayment`**
**File:** `hooks/use-subscription-payment.ts`

A custom React hook that manages the payment flow:
- **Function:** `initiateUpgradePayment(options)`
- **Parameters:**
  - `plan`: 'professional' | 'enterprise' (target plan)
  - `onSuccess?`: Callback when payment is initiated
  - `onError?`: Callback if payment fails

**Flow:**
```typescript
// Call the upgrade API to initialize payment
POST /api/subscription/upgrade
Body: { targetPlan: 'professional' | 'enterprise' }

// Response includes:
{
  success: boolean
  authorizationUrl: string  // Paystack checkout URL
  reference: string         // Payment reference
  amount: number           // Plan price
  plan: string
  error?: string
}

// On success:
1. Show toast notification
2. Store upgrade info in sessionStorage
3. Redirect user to Paystack checkout (window.location.href = authorizationUrl)

// On error:
1. Set error state
2. Show error toast
3. Call onError callback
```

**Return Values:**
- `loading`: Boolean indicating payment is being processed
- `error`: String containing error message if failed
- `initiateUpgradePayment`: Function to start payment flow

### 2. **Updated Components**

#### Check-In Page
**File:** `app/checkin/page.tsx`

```typescript
// Import the hook
import { useSubscriptionPayment } from '@/hooks/use-subscription-payment'

// Initialize hook in component
const { initiateUpgradePayment, loading: paymentLoading } = useSubscriptionPayment()

// In UpgradeModal component:
<UpgradeModal
  isOpen={showUpgradePopup}
  onClose={() => setShowUpgradePopup(false)}
  onUpgrade={(plan: "professional" | "enterprise") => {
    initiateUpgradePayment({
      plan,
      onSuccess: () => {
        setShowUpgradePopup(false)
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Payment Error",
          description: error,
        })
      },
    })
  }}
  loading={paymentLoading}
  feature="Fingerprint Verification"
  message="Fingerprint verification is only available in..."
  currentPlan={subscriptionPlan}
  recommendedPlan={getRecommendedPlan(upgradeFeature)}
/>
```

#### Staff Management Page
**File:** `app/(dashboard)/dashboard/staff/page.tsx`

Same implementation as check-in page:
- Import `useSubscriptionPayment` hook
- Initialize in component
- Wire `onUpgrade` callback to call `initiateUpgradePayment`
- Pass `loading` state to modal

### 3. **Upgrade Modal Component**
**File:** `components/subscription/upgrade-modal.tsx`

The modal now handles the complete upgrade flow:

**Props:**
- `onUpgrade`: Callback with signature `(plan: 'professional' | 'enterprise') => void`
- `loading?: boolean`: Shows loading state on "Continue to Payment" button

**Button Behavior:**
```typescript
<Button
  onClick={() => onUpgrade(selectedPlan)}
  disabled={loading}  // Disable while payment is processing
  className="flex-1"
>
  {loading ? "Processing..." : "Continue to Payment"}
</Button>
```

### 4. **API Endpoint: Upgrade Subscription**
**File:** `app/api/subscription/upgrade/route.ts`

Already implemented - handles:
1. Plan validation (professional | enterprise only)
2. Subscription hierarchy checking
3. Paystack payment initialization
4. Response with authorization URL

**Endpoint:** `POST /api/subscription/upgrade`
**Authentication:** Requires JWT auth token in header

### 5. **Payment Callback Flow**
**File:** `app/payment/callback/page.tsx`

Already implemented - handles:
1. Paystack redirect with payment reference
2. Payment verification via API
3. Success/failure display
4. Auto-redirect to dashboard after 3 seconds on success

**Endpoints:**
- `GET /api/payment/verify?reference={reference}`: Verifies payment was successful
- Handles updating subscription in database

### 6. **Paystack Integration**
**File:** `lib/services/paystack.ts`

Available functions:
- `initializePayment(email, amount, metadata)`: Creates checkout session
- `verifyPayment(reference)`: Verifies payment completion

**Payment Flow:**
1. User clicks "Continue to Payment" → `onUpgrade` called
2. `initiateUpgradePayment` calls `/api/subscription/upgrade`
3. API initializes Paystack payment → returns `authorizationUrl`
4. User redirected to Paystack checkout (handled by hook)
5. User completes payment on Paystack
6. Paystack redirects to `/payment/callback?reference={ref}`
7. Callback page verifies payment via `/api/payment/verify`
8. On success: Show success message, redirect to dashboard
9. Subscription updated automatically via webhook

## Feature Gates Integration

When users try to access locked features, the flow is:

1. **Feature Gate Check:** Check if user has access
   ```typescript
   if (fingerprintEnabled && !isDev && subscriptionPlan !== "enterprise") {
     setUpgradeFeature("fingerprintCheckIn")
     setShowUpgradePopup(true)
     return
   }
   ```

2. **Modal Shows:** Feature name and message displayed
   ```typescript
   feature="Fingerprint Verification"
   message="Fingerprint verification is only available in the Enterprise plan..."
   recommendedPlan="enterprise"
   ```

3. **User Upgrades:** Clicks "Continue to Payment"
   - `onUpgrade("enterprise")` called
   - Payment flow initiated
   - User redirected to Paystack

4. **After Payment:** User redirected to dashboard with upgraded plan

## Locked Features

**Fingerprint Check-In:**
- Requires: Enterprise plan
- Message: "Fingerprint verification is only available in the Enterprise plan"
- Used in check-in page

**Photo Verification:**
- Requires: Professional or Enterprise plan
- Message: "Photo verification is only available in the Professional and Enterprise plans"
- Used in check-in page

**Staff Management (Add/Edit):**
- Requires: Varies by plan
- Professional: Add 10 staff
- Enterprise: Unlimited staff
- Used in staff page

## Error Handling

The implementation includes comprehensive error handling:

1. **Payment API Errors:**
   - Network failures: Caught and displayed to user
   - Invalid plan: Returns 400 error
   - Paystack errors: Forwarded with message

2. **Callback Errors:**
   - Invalid reference: Shows error message
   - Verification failed: Shows error, no auto-redirect
   - Network issues: Shows error with retry option

3. **UI Feedback:**
   - Loading states: "Processing..." button text
   - Toast notifications: Success and error messages
   - Modal display: Feature context with message banner

## Testing Payment Flow

### Local Development
1. The upgrade API endpoint is available but requires valid Paystack config
2. `PAYSTACK_SECRET_KEY` must be set in `.env.local`
3. Mock payment in test mode using Paystack test cards

### Production
1. Real Paystack API calls with production secret key
2. Webhook validation ensures security
3. Database updates on successful payment via webhook

## SessionStorage Info

Payment info is stored for reference:
```typescript
{
  "upgradeInProgress": {
    "plan": "professional|enterprise",
    "reference": "paystack_reference_id",
    "timestamp": "ISO_timestamp"
  }
}
```

This can be used to:
- Track pending upgrades
- Handle payment retry scenarios
- Provide user context after redirect

## All Locations Updated

✅ `app/checkin/page.tsx` - Check-in upgrade flow
✅ `app/(dashboard)/dashboard/staff/page.tsx` - Staff management upgrade flow
✅ `components/subscription/upgrade-modal.tsx` - Already supports onUpgrade
✅ `hooks/use-subscription-payment.ts` - NEW payment hook
✅ `app/api/subscription/upgrade/route.ts` - Already implemented
✅ `app/payment/callback/page.tsx` - Already implemented
✅ `lib/services/paystack.ts` - Already implemented

## No More TODOs

All `// TODO: Implement payment flow` comments have been replaced with actual implementation.

The payment system is now fully functional end-to-end:
- User clicks upgrade button
- Payment modal opens with selected plan
- User clicks "Continue to Payment"
- Paystack checkout initialized
- User completes payment
- Redirect to callback page
- Payment verified
- Subscription updated
- User redirected to dashboard
