# Trial Access Rules - 14-Day Starter Plan

## Overview
During the **14-day free trial**, Starter plan users get **FULL ACCESS** to ALL features - complete app experience.

## Trial Access Matrix

### ✅ UNLOCKED During Trial (Starter Plan + isTrialActive=true)

#### Check-in Methods
- ✅ QR Code Check-in
- ✅ Manual Entry Check-in
- ✅ Photo Verification
- ✅ Fingerprint Check-in

#### Analytics & Reports
- ✅ Analytics Page (Full Access)
  - ✅ Overview Stats
  - ✅ Lateness Analysis
  - ✅ Attendance Trends
  - ✅ Department Breakdown
  - ✅ Staff Performance
  - ✅ Export Data (CSV)
- ✅ Check-in History Page
- ✅ Reports Page

#### Staff Management
- ✅ Add Staff (up to 10)
- ✅ Edit Staff
- ✅ Delete Staff

#### Support
- ✅ Priority Support

## What Changes After Trial Expires

When the 14-day trial ends (`isTrialActive = false`), Starter plan users only get:

### ✅ STILL AVAILABLE After Trial
- ✅ QR Code Check-in
- ✅ Manual Entry Check-in
- ✅ Basic Staff Management (max 10 staff)

### ❌ LOCKED After Trial
- ❌ Photo Verification
- ❌ Analytics & Reports (all pages/features)
- ❌ Check-in History Details
- ❌ Data Export
- ❌ Advanced Analytics Tabs
- ❌ Staff Editing
- ❌ Priority Support

## Implementation Details

### Core Logic: `hasFeatureAccess()` in `lib/features/feature-manager.ts`

```typescript
if (plan === "starter" && isTrialActive) {
  return true  // ALL features unlocked during trial
}
```

### Feature Gates Applied To

1. **Pages**: `PageGate feature="canAccessAnalytics"` blocks entire page
2. **Tabs**: Individual analytics tabs disabled via `disabled={!hasFeature("analyticsTrends")}`
3. **Features**: `FeatureGate` wraps specific components

### Database Fields

- `subscription.isTrialActive` - true/false
- `subscription.trialEndDate` - 14 days from creation
- `subscription.plan` - always "starter" during trial

## Testing Trial Access

### In Development Mode

1. Go to `/dev/plans` (dev mode only)
2. Switch to "Starter" plan with "Trial Active" enabled
3. Verify all analytics and reports are accessible
4. Switch to "Trial Expired" - verify they lock

### Debugging

Check browser console logs:

```log
[Trial] Checking canAccessAnalytics: true (plan: starter, trial: true)
[Subscription] Trial active for [tenantId]: days remaining = 12
```

## Troubleshooting

If locks appear during trial when they shouldn't:

1. **Check Database**: Verify `isTrialActive: true` in subscriptions collection
2. **Check API Response**: `/api/subscription/status` returns `isTrialActive: true`
3. **Check Logic**: `hasFeatureAccess("starter", "canAccessAnalytics", true)` should return `true`
4. **Check Pages**: All analytics/reports pages use `PageGate feature="canAccessAnalytics"`

## Plan Comparison

| Feature | Starter (Trial) | Starter (Expired) | Professional | Enterprise |
|---------|-----------------|-------------------|--------------|------------|
| Max Staff | 10 | 10 | 50 | Unlimited |
| QR Check-in | ✅ | ✅ | ✅ | ✅ |
| Manual Check-in | ✅ | ✅ | ✅ | ✅ |
| Photo Verification | ✅ | ❌ | ✅ | ✅ |
| Fingerprint Check-in | ✅ | ❌ | ❌ | ✅ |
| Analytics | ✅ | ❌ | ✅ (Limited) | ✅ (Full) |
| Reports | ✅ | ❌ | ✅ | ✅ |
| Export Data | ✅ | ❌ | ✅ | ✅ |
| Priority Support | ✅ | ❌ | ✅ | ✅ |
| Price | Free 14 Days | $0/month | ₦5,000/month | ₦10,000/month |
