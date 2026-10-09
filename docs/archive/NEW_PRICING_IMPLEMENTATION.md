# New Pricing Structure Implementation

## Overview
Implemented a simplified 3-tier pricing structure with clear feature gating and trial management.

## Plan Structure

### 1. Starter (Free 14-Day Trial)
- **Price**: Free
- **Staff Limit**: 10
- **During Trial**:
  - ✓ All features unlocked (except fingerprint)
  - ✓ Photo verification
  - ✓ Analytics & reports
  - ✓ History access
  - ✓ CSV export
  
- **After Trial Expires**:
  - ✓ Basic check-in/check-out (QR & manual only)
  - ✓ View staff list (read-only)
  - ✗ Add/edit staff
  - ✗ Analytics page (completely blocked)
  - ✗ History page (blocked)
  - ✗ Reports (blocked)
  - ✗ CSV exports
  - ✗ Photo verification
  - ✗ Biometrics

### 2. Professional (₦5,000/month)
- **Staff Limit**: 50
- **Features**:
  - ✓ Add/edit staff
  - ✓ Photo verification
  - ✓ Basic analytics (daily summary, individual history, late count)
  - ✓ Attendance history
  - ✓ Reports access
  - ✓ CSV export
  - ✓ Priority support
  - ✗ Fingerprint verification (locked - Enterprise only)
  - ✗ Advanced analytics (trends, patterns, predictions)

### 3. Enterprise (₦10,000/month)
- **Staff Limit**: Unlimited
- **Features**:
  - ✓ All features unlocked
  - ✓ Fingerprint verification
  - ✓ Photo verification
  - ✓ Advanced analytics (trends, patterns, predictions)
  - ✓ Full reports & history
  - ✓ CSV export
  - ✓ Priority support

## Files Created/Updated

### Core Logic
- `lib/features/feature-manager.ts` - Feature gating logic with trial support
- `lib/subscription/subscription-manager.ts` - Subscription lifecycle management

### Components
- `components/subscription/upgrade-popup.tsx` - Upgrade prompt when features are locked

### API Routes
- `app/api/subscription/status/route.ts` - Get subscription status
- `app/api/dev/check/route.ts` - Check if in development mode
- `app/api/dev/switch-plan/route.ts` - Switch plans (dev only)

### Dev Tools
- `app/dev/plans/page.tsx` - Dev testing UI for plan switching
- `hooks/use-subscription.ts` - React hook for subscription checks

### Landing Page
- `app/page.tsx` - Updated pricing cards

### Migration
- `scripts/migrate-subscriptions.ts` - Migrate existing subscriptions

## Development Mode

When `NODE_ENV=development`:
- All features unlocked regardless of plan
- No trial restrictions
- Access to `/dev/plans` for testing different plan states

## Usage Examples

### Check Feature Access
```typescript
import { useSubscription } from "@/hooks/use-subscription"

function MyComponent() {
  const { hasFeature, subscription } = useSubscription()
  
  if (!hasFeature("canAccessAnalytics")) {
    // Show upgrade popup
    return <UpgradePopup />
  }
  
  // Render analytics
}
```

### Check Staff Limit
```typescript
const { canAddStaff } = useSubscription()

if (!canAddStaff(currentStaffCount)) {
  // Show upgrade popup
}
```

### Show Upgrade Popup
```typescript
import { UpgradePopup } from "@/components/subscription/upgrade-popup"
import { getFeatureGateMessage, getRecommendedPlan } from "@/lib/features/feature-manager"

<UpgradePopup
  isOpen={showUpgrade}
  onClose={() => setShowUpgrade(false)}
  feature="Analytics"
  message={getFeatureGateMessage("canAccessAnalytics", currentPlan)}
  currentPlan={currentPlan}
  recommendedPlan={getRecommendedPlan("canAccessAnalytics")}
/>
```

## Migration Steps

1. **Backup Database**
   ```bash
   # Backup your MongoDB database first!
   ```

2. **Run Migration**
   ```bash
   npx ts-node scripts/migrate-subscriptions.ts
   ```

3. **Verify**
   - Check subscriptions collection
   - Ensure all plans are updated
   - Test feature access

## Testing

### Dev Mode Testing
1. Start dev server: `npm run dev`
2. Navigate to `/dev/plans`
3. Switch between different plan states
4. Test feature access in each state

### Test Scenarios
- ✓ Starter with active trial - all features work
- ✓ Starter with expired trial - only basic check-in works
- ✓ Professional - photo works, fingerprint blocked
- ✓ Enterprise - all features work

## Next Steps

1. **Implement Feature Gates** - Add upgrade popups to:
   - Analytics page
   - History page
   - Reports page
   - Staff add/edit forms
   - Photo verification
   - Fingerprint verification

2. **Update Payment Flow** - Integrate with Paystack for Professional/Enterprise plans

3. **Add Trial Countdown** - Show remaining trial days in dashboard

4. **Email Notifications** - Send emails when trial is ending/expired

## Notes

- Face recognition is commented out for now (not implemented)
- Dev mode bypasses all restrictions for testing
- Migration script is idempotent (safe to run multiple times)
- All feature checks are centralized in `feature-manager.ts`
