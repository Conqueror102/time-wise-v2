# Subscription UI Integration Guide

Complete guide for the subscription management UI integration.

## ✅ What's Been Implemented

### 1. Subscription Management Component
**Location**: `components/subscription/subscription-manager.tsx`

A comprehensive React component that provides:
- **Current subscription display** with plan details and status
- **Trial information** showing days remaining
- **Scheduled downgrade warnings** with cancel option
- **Upgrade modal** with plan selection and Paystack integration
- **Downgrade modal** with staff limit validation
- **Cancel subscription modal** with confirmation
- **Real-time status updates** after actions

### 2. Dedicated Subscription Page
**Location**: `app/(dashboard)/dashboard/subscription/page.tsx`

A full-page subscription management interface featuring:
- Subscription manager component
- Benefits section highlighting key features
- Clean, professional layout

### 3. Navigation Integration
**Updated**: `app/(dashboard)/layout.tsx`

Added "Subscription" link to the dashboard sidebar:
- Appears above "Settings" in the bottom navigation
- Uses CreditCard icon
- Accessible from any dashboard page

---

## 🎨 UI Features

### Current Subscription Card
- Displays current plan name and price
- Shows subscription status badge (active/cancelled/expired)
- Trial countdown for starter plans
- Warning banner for scheduled downgrades
- Action buttons: Upgrade, Downgrade, Cancel

### Upgrade Flow
1. Click "Upgrade Plan" button
2. Modal shows available higher-tier plans
3. Select desired plan
4. Click "Continue to Payment"
5. Redirects to Paystack checkout
6. After payment, webhook updates subscription

### Downgrade Flow
1. Click "Downgrade Plan" button
2. Modal shows available lower-tier plans
3. Warning about staff limits and feature restrictions
4. Select target plan
5. Click "Schedule Downgrade"
6. Downgrade scheduled for end of billing period
7. Can cancel scheduled downgrade anytime

### Cancel Flow
1. Click "Cancel Subscription" button
2. Confirmation modal with warning
3. Click "Cancel Subscription" to confirm
4. Subscription cancelled but access retained until billing period ends

---

## 🔌 API Integration

The UI component connects to these endpoints:

### GET `/api/subscription/status`
Fetches current subscription status including:
- Plan tier
- Status (active/cancelled/expired)
- Trial information
- Scheduled downgrades

### POST `/api/subscription/upgrade`
Initiates upgrade payment flow:
```typescript
{
  targetPlan: "professional" | "enterprise"
}
```
Returns Paystack authorization URL for payment.

### POST `/api/subscription/downgrade`
Schedules downgrade:
```typescript
{
  targetPlan: "starter" | "professional"
}
```
Validates staff count and schedules change.

### POST `/api/subscription/downgrade/cancel`
Cancels scheduled downgrade (no body required).

### POST `/api/subscription/cancel`
Cancels subscription (no body required).

---

## 🎯 User Experience

### Success Messages
- ✅ "Downgrade to starter plan scheduled. Your plan will change at the end of your current billing period."
- ✅ "Scheduled downgrade cancelled successfully. Your current plan will continue."
- ✅ "Subscription cancelled successfully. You will retain access until the end of your billing period."

### Error Handling
- ❌ Staff count validation errors with specific limits
- ❌ Payment initialization failures
- ❌ Network errors with retry suggestions
- ❌ Invalid plan selections

### Loading States
- Spinner during initial data fetch
- "Processing..." button text during actions
- Disabled buttons to prevent double-clicks

---

## 📱 Responsive Design

- **Desktop**: Full-width modals with side-by-side plan cards
- **Tablet**: Stacked plan cards in modals
- **Mobile**: Full-screen modals with scrollable content

---

## 🎨 Visual Design

### Color Scheme
- **Blue**: Primary actions (upgrade, active status)
- **Yellow**: Warnings (scheduled downgrades, trial expiring)
- **Red**: Destructive actions (cancel subscription)
- **Green**: Success messages and confirmations

### Icons
- 👑 Crown: Premium/Enterprise features
- ⚡ Zap: Professional plan
- 🛡️ Shield: Security features
- 📅 Calendar: Trial/scheduling
- 📈 TrendingUp: Upgrades
- 📉 TrendingDown: Downgrades
- ❌ XCircle: Cancellation

---

## 🔄 State Management

The component manages local state for:
- Subscription status data
- Loading states
- Error/success messages
- Modal visibility
- Selected plans

After each action, it refetches subscription status to ensure UI is up-to-date.

---

## 🧪 Testing Checklist

### Upgrade Testing
- [ ] Can view available upgrade plans
- [ ] Can select a plan
- [ ] Redirects to Paystack correctly
- [ ] Shows error if payment initialization fails

### Downgrade Testing
- [ ] Can view available downgrade plans
- [ ] Shows staff count validation errors
- [ ] Schedules downgrade correctly
- [ ] Shows scheduled downgrade warning
- [ ] Can cancel scheduled downgrade

### Cancel Testing
- [ ] Shows confirmation modal
- [ ] Cancels subscription correctly
- [ ] Shows success message
- [ ] Updates status display

### Edge Cases
- [ ] Handles network errors gracefully
- [ ] Prevents double-submissions
- [ ] Shows appropriate messages for each plan tier
- [ ] Handles expired trials correctly

---

## 🚀 Usage Example

```typescript
// In any dashboard page
import { SubscriptionManager } from "@/components/subscription/subscription-manager"

export default function MyPage() {
  return (
    <div>
      <h1>Manage Subscription</h1>
      <SubscriptionManager />
    </div>
  )
}
```

Or navigate to the dedicated page:
```
/dashboard/subscription
```

---

## 🔗 Navigation Access

Users can access subscription management via:
1. **Sidebar**: Click "Subscription" in the bottom navigation
2. **Direct URL**: `/dashboard/subscription`
3. **Settings Page**: Can add a link from settings if desired

---

## 📊 Analytics Integration (Future)

Consider tracking:
- Upgrade button clicks
- Downgrade attempts
- Cancellation reasons (add feedback form)
- Plan selection preferences
- Payment completion rates

---

## 🎁 Future Enhancements

Potential improvements:
- **Payment history** table showing past transactions
- **Invoice downloads** for paid subscriptions
- **Usage metrics** (staff count, check-ins, etc.)
- **Billing address** management
- **Payment method** update
- **Proration calculator** for mid-cycle upgrades
- **Cancellation feedback** form
- **Reactivation** flow for cancelled subscriptions
- **Annual billing** option with discount
- **Custom enterprise** pricing contact form

---

## 🐛 Troubleshooting

### "Failed to fetch subscription status"
- Check if user is authenticated
- Verify API endpoint is accessible
- Check browser console for errors

### "Failed to initialize payment"
- Verify Paystack secret key is set
- Check organization has valid email
- Ensure plan codes match Paystack dashboard

### "Cannot downgrade - too many staff"
- User must remove staff first
- Show current count vs. limit
- Provide link to staff management page

---

## 📝 Code Quality

The implementation follows:
- ✅ TypeScript for type safety
- ✅ React hooks for state management
- ✅ Tailwind CSS for styling
- ✅ Shadcn UI components
- ✅ Lucide icons
- ✅ Error boundaries (recommended to add)
- ✅ Loading states
- ✅ Accessibility (keyboard navigation, ARIA labels)

---

## 🎓 Developer Notes

### Component Structure
```
SubscriptionManager
├── Status fetching (useEffect)
├── Current plan card
│   ├── Plan details
│   ├── Trial info
│   ├── Scheduled downgrade warning
│   └── Action buttons
├── Upgrade modal
│   ├── Plan cards
│   └── Payment button
├── Downgrade modal
│   ├── Warning message
│   ├── Plan selection
│   └── Schedule button
└── Cancel modal
    ├── Confirmation warning
    └── Cancel button
```

### API Call Pattern
```typescript
const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(data),
})

const result = await response.json()

if (!response.ok) {
  throw new Error(result.error)
}

// Handle success
setSuccess(result.message)
await fetchSubscriptionStatus() // Refresh
```

---

## ✨ Summary

The subscription management UI is now fully integrated and provides:
- Complete subscription lifecycle management
- Intuitive user interface
- Secure payment integration
- Real-time status updates
- Comprehensive error handling
- Responsive design
- Professional appearance

Users can now easily upgrade, downgrade, and cancel their subscriptions directly from the dashboard!
