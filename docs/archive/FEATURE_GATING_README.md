# Feature Gating System - README

## 🎯 Overview

A complete, production-ready feature gating system for a 3-tier SaaS pricing structure with client-side UX gates and server-side security validation.

## 📊 Pricing Plans

| Plan | Price | Staff Limit | Key Features |
|------|-------|-------------|--------------|
| **Starter** | Free (14-day trial) | 10 | All features during trial, basic check-in after |
| **Professional** | ₦5,000/month | 50 | Photo verification, basic analytics, history, reports |
| **Enterprise** | ₦10,000/month | Unlimited | All features including fingerprint & advanced analytics |

## 🚀 Quick Start

### For Developers

1. **Check feature access in components:**
```typescript
import { useSubscription } from "@/hooks/use-subscription"

function MyComponent() {
  const { hasFeature } = useSubscription()
  
  if (!hasFeature("photoVerification")) {
    return <UpgradePrompt />
  }
  
  return <PhotoCapture />
}
```

2. **Gate a specific feature:**
```typescript
import { FeatureGate } from "@/components/subscription/feature-gate"

<FeatureGate feature="exportData">
  <ExportButton />
</FeatureGate>
```

3. **Gate an entire page:**
```typescript
import { PageGate } from "@/components/subscription/page-gate"

export default function AnalyticsPage() {
  return (
    <PageGate feature="canAccessAnalytics">
      <AnalyticsContent />
    </PageGate>
  )
}
```

4. **Server-side validation:**
```typescript
const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
const { hasFeatureAccess } = await import("@/lib/features/feature-manager")

const sub = await getSubscriptionStatus(orgId)

if (!hasFeatureAccess(sub.plan, "canAddStaff", sub.isTrialActive)) {
  return NextResponse.json({ error: "Locked" }, { status: 403 })
}
```

### For Testing

Navigate to `/dev/plans` in development mode to test different plan states.

## 📁 Project Structure

```
lib/
├── features/
│   └── feature-manager.ts          # Feature definitions & logic
├── subscription/
│   └── subscription-manager.ts     # Subscription lifecycle
└── subscription-plans.ts           # Plan configurations

components/
└── subscription/
    ├── feature-gate.tsx            # Feature gate component
    ├── page-gate.tsx               # Page gate component
    └── upgrade-popup.tsx           # Upgrade prompt

hooks/
└── use-subscription.ts             # React hook for features

app/
├── api/
│   ├── staff/
│   │   ├── route.ts                # Add staff (validated)
│   │   └── [staffId]/route.ts      # Edit staff (validated)
│   ├── analytics/
│   │   ├── overview/route.ts       # Overview (Professional+)
│   │   ├── lateness/route.ts       # Lateness (Professional+)
│   │   ├── trends/route.ts         # Trends (Enterprise only)
│   │   ├── departments/route.ts    # Departments (Enterprise only)
│   │   ├── staff/route.ts          # Performance (Enterprise only)
│   │   └── export/route.ts         # CSV export (Professional+)
│   └── subscription/
│       └── status/route.ts         # Get subscription status
└── dev/
    └── plans/page.tsx              # Dev testing UI

scripts/
└── migrate-subscriptions.ts        # Database migration
```

## 🔑 Available Features

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

## 🧪 Testing

### Development Mode
All features are unlocked when `NODE_ENV=development`

### Test Different Plans
```bash
# Start dev server
npm run dev

# Navigate to testing page
http://localhost:3000/dev/plans
```

### Test API Validation
```bash
# Test locked feature
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/analytics/trends

# Expected: 403 with FEATURE_LOCKED
```

## 🔒 Security

### Client-Side (UX)
- Feature gates hide/disable UI elements
- Upgrade popups guide users
- Visual feedback for locked features

### Server-Side (Security)
- All API routes validate subscription
- Feature access checked before operations
- Staff limits enforced at database level
- Returns 403 with