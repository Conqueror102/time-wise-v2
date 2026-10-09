# New Pricing Structure Implementation

## 📋 Overview
Simplified pricing with just 2 options:
1. **14-Day Free Trial** - Full access to all features
2. **Paid Plan** - ₦4,000/month (owner can change price dynamically)

## 🎯 Changes Needed

### 1. Update Feature Manager
- Remove: `starter`, `professional`, `enterprise` plans
- Keep: `free_trial` and `paid` plans
- `paid` plan = all features unlocked

### 2. Update Pricing Page
- Show only 2 cards: Free Trial + Paid Plan
- Fetch dynamic price from API
- Update payment flow

### 3. Create Owner Pricing Settings
- New page: `/owner/pricing`
- Owner can set monthly price
- Stored in database

### 4. Update Payment Flow
- Single plan type: "paid"
- Use dynamic price from settings
- Update Paystack integration

### 5. Update Registration Flow
- All new users start with 14-day trial
- After trial: prompt to subscribe to paid plan
- No "starter" plan option

## 📊 New Plan Structure

```typescript
type PlanType = "free_trial" | "paid"

PLAN_FEATURES = {
  free_trial: {
    maxStaff: -1, // Unlimited during trial
    allFeatures: true
  },
  paid: {
    maxStaff: -1, // Unlimited
    allFeatures: true
  }
}
```

## 💰 Dynamic Pricing

```typescript
// Stored in database (owner settings)
{
  monthlyPrice: 4000, // Default ₦4,000
  currency: "NGN",
  lastUpdated: Date
}
```

## 🔄 Migration Path
1. Existing `starter` → `free_trial` (if within 14 days) or prompt to upgrade
2. Existing `professional` → `paid`
3. Existing `enterprise` → `paid`

Ready to implement?
