# Feature Gates - Quick Reference

## Plan Features at a Glance

### Starter (Free 14-day trial)
**During Trial:**
- ✅ 10 staff max
- ✅ All features (except fingerprint)

**After Trial:**
- ✅ Basic check-in only
- ❌ Everything else locked

### Professional (₦5,000/month)
- ✅ 50 staff max
- ✅ Photo verification
- ✅ Overview & Lateness analytics
- ✅ History & Reports
- ✅ CSV export
- ❌ Fingerprint (Enterprise only)
- ❌ Advanced analytics (Enterprise only)

### Enterprise (₦10,000/month)
- ✅ Everything unlocked
- ✅ Unlimited staff
- ✅ Fingerprint verification
- ✅ All analytics tabs

## Quick Code Snippets

### Check Feature in Component
```typescript
import { useSubscription } from "@/hooks/use-subscription"

const { hasFeature } = useSubscription()

if (!hasFeature("photoVerification")) {
  // Show upgrade
}
```

### Gate a Button/Feature
```typescript
import { FeatureGate } from "@/components/subscription/feature-gate"

<FeatureGate feature="exportData">
  <ExportButton />
</FeatureGate>
```

### Gate Entire Page
```typescript
import { PageGate } from "@/components/subscription/page-gate"

export default function MyPage() {
  return (
    <PageGate feature="canAccessAnalytics">
      <Content />
    </PageGate>
  )
}
```

### Server-Side Validation
```typescript
const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
const { hasFeatureAccess } = await import("@/lib/features/feature-manager")

const sub = await getSubscriptionStatus(orgId)

if (!hasFeatureAccess(sub.plan, "canAddStaff", sub.isTrialActive)) {
  return NextResponse.json({ error: "Locked" }, { status: 403 })
}
```

## Available Features to Check

### Staff Management
- `canAddStaff` - Can add new staff
- `canEditStaff` - Can edit existing staff
- `maxStaff` - Staff limit (10, 50, -1 for unlimited)

### Check-in Methods
- `qrCheckIn` - QR code check-in
- `manualCheckIn` - Manual entry
- `fingerprintCheckIn` - Fingerprint (Enterprise only)
- `photoVerification` - Photo capture (Professional+)

### Analytics & Reports
- `canAccessAnalytics` - Can access analytics page
- `canAccessHistory` - Can access history page
- `canAccessReports` - Can access reports page
- `analyticsOverview` - Overview tab (Professional+)
- `analyticsLateness` - Lateness tab (Professional+)
- `analyticsTrends` - Trends tab (Enterprise only)
- `analyticsDepartment` - Department tab (Enterprise only)
- `analyticsPerformance` - Performance tab (Enterprise only)
- `exportData` - CSV export (Professional+)

## Testing

### Dev Mode
Navigate to: `http://localhost:3000/dev/plans`

Switch between plans and test features.

### Manual Testing
1. Starter (trial active) - all features work
2. Starter (expired) - only basic check-in
3. Professional - photo works, fingerprint blocked
4. Enterprise - everything works

## Common Issues

**Features not locking?**
- Check `NODE_ENV` is not "development"
- Verify subscription in database

**Upgrade popup not showing?**
- Check `UpgradePopup` is imported
- Verify state is being set

**403 errors?**
- Check subscription status
- Verify trial dates
- Check server logs

## Migration

```bash
npx ts-node scripts/migrate-subscriptions.ts
```

## Key Files

- `lib/features/feature-manager.ts` - Feature definitions
- `hooks/use-subscription.ts` - React hook
- `components/subscription/feature-gate.tsx` - Feature gate
- `components/subscription/page-gate.tsx` - Page gate
- `components/subscription/upgrade-popup.tsx` - Upgrade prompt

## Support

Check `/dev/plans` to verify current plan state in development.
