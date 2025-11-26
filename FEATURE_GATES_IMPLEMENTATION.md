# Feature Gates Implementation Guide

## Overview
This document outlines where and how to implement feature gates across the application for the new 3-tier pricing structure.

## Components Created

### 1. `PageGate` - Block Entire Pages
**Location**: `components/subscription/page-gate.tsx`
**Usage**: Wrap entire page content to block access

```typescript
import { PageGate } from "@/components/subscription/page-gate"

export default function MyPage() {
  return (
    <PageGate feature="canAccessAnalytics">
      <div>Page content here</div>
    </PageGate>
  )
}
```

### 2. `FeatureGate` - Block Specific Features
**Location**: `components/subscription/feature-gate.tsx`
**Usage**: Wrap specific UI elements or sections

```typescript
import { FeatureGate } from "@/components/subscription/feature-gate"

<FeatureGate feature="exportData">
  <ExportButton />
</FeatureGate>
```

### 3. `useSubscription` Hook
**Location**: `hooks/use-subscription.ts`
**Usage**: Check features programmatically

```typescript
import { useSubscription } from "@/hooks/use-subscription"

const { hasFeature, canAddStaff, subscription } = useSubscription()

if (!hasFeature("photoVerification")) {
  // Show upgrade prompt
}
```

## Implementation Checklist

### ✅ Completed
- [x] Analytics page - Page-level gate + tab-level gates
- [x] History page - Page-level gate
- [x] Feature manager with granular analytics control
- [x] Upgrade popup component
- [x] Dev testing route (`/dev/plans`)

### 🔄 To Implement

#### 1. Staff Management (`app/(dashboard)/dashboard/staff/page.tsx`)
```typescript
import { useSubscription } from "@/hooks/use-subscription"

const { canAddStaff, hasFeature } = useSubscription()

// Check before showing add button
const canAdd = canAddStaff(staffCount) && hasFeature("canAddStaff")

// Wrap add button
<FeatureGate feature="canAddStaff" showLockOverlay={false}>
  <Button onClick={handleAddStaff}>
    <Plus className="w-4 h-4 mr-2" />
    Add Staff
  </Button>
</FeatureGate>

// Check before edit
if (!hasFeature("canEditStaff")) {
  // Show upgrade popup
  return
}
```

#### 2. Check-in Page (`app/checkin/page.tsx`)
```typescript
import { useSubscription } from "@/hooks/use-subscription"

const { hasFeature } = useSubscription()

// Check photo verification
const canUsePhoto = hasFeature("photoVerification")

// Check fingerprint
const canUseFingerprint = hasFeature("fingerprintCheckIn")

// Disable methods if locked
<Button 
  disabled={!canUseFingerprint}
  onClick={handleFingerprintCheckIn}
>
  Fingerprint Check-in
</Button>

// Show upgrade prompt when clicked if locked
if (!canUseFingerprint) {
  setShowUpgradePopup(true)
  return
}
```

#### 3. Reports Page (if exists)
```typescript
import { PageGate } from "@/components/subscription/page-gate"

export default function ReportsPage() {
  return (
    <PageGate feature="canAccessReports">
      <ReportsContent />
    </PageGate>
  )
}
```

#### 4. Export Buttons (CSV/Excel)
```typescript
import { FeatureGate } from "@/components/subscription/feature-gate"

<FeatureGate feature="exportData" showLockOverlay={false}>
  <Button onClick={handleExport}>
    <Download className="w-4 h-4 mr-2" />
    Export CSV
  </Button>
</FeatureGate>
```

#### 5. Settings Page - Biometric Settings
```typescript
// Disable fingerprint toggle if not on Enterprise
<FeatureGate feature="fingerprintCheckIn">
  <Switch
    checked={fingerprintEnabled}
    onCheckedChange={setFingerprintEnabled}
  />
</FeatureGate>

// Disable photo toggle if not on Professional+
<FeatureGate feature="photoVerification">
  <Switch
    checked={photoEnabled}
    onCheckedChange={setPhotoEnabled}
  />
</FeatureGate>
```

## Feature Access Matrix

| Feature | Starter (Trial) | Starter (Expired) | Professional | Enterprise |
|---------|----------------|-------------------|--------------|------------|
| **Staff Management** |
| Add Staff | ✓ (max 10) | ✗ | ✓ (max 50) | ✓ (unlimited) |
| Edit Staff | ✓ | ✗ | ✓ | ✓ |
| **Check-in Methods** |
| QR Code | ✓ | ✓ | ✓ | ✓ |
| Manual | ✓ | ✓ | ✓ | ✓ |
| Photo Verification | ✓ | ✗ | ✓ | ✓ |
| Fingerprint | ✗ | ✗ | ✗ | ✓ |
| **Analytics** |
| Analytics Page | ✓ | ✗ | ✓ | ✓ |
| Overview Tab | ✓ | ✗ | ✓ | ✓ |
| Lateness Tab | ✓ | ✗ | ✓ | ✓ |
| Trends Tab | ✓ | ✗ | ✗ | ✓ |
| Department Tab | ✓ | ✗ | ✗ | ✓ |
| Performance Tab | ✓ | ✗ | ✗ | ✓ |
| **Data & Reports** |
| History Page | ✓ | ✗ | ✓ | ✓ |
| Reports Page | ✓ | ✗ | ✓ | ✓ |
| CSV Export | ✓ | ✗ | ✓ | ✓ |

## Security Best Practices

### 1. Server-Side Validation
Always validate feature access on the server:

```typescript
// app/api/staff/add/route.ts
import { getServerSession } from "next-auth"
import { getSubscriptionStatus } from "@/lib/subscription/subscription-manager"
import { hasFeatureAccess, canAddStaff } from "@/lib/features/feature-manager"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const subscription = await getSubscriptionStatus(session.user.organizationId)
  
  // Check feature access
  if (!hasFeatureAccess(subscription.plan, "canAddStaff", subscription.isTrialActive)) {
    return NextResponse.json({ error: "Feature not available" }, { status: 403 })
  }
  
  // Check staff limit
  const currentCount = await getStaffCount(session.user.organizationId)
  if (!canAddStaff(subscription.plan, currentCount, subscription.isTrialActive)) {
    return NextResponse.json({ error: "Staff limit reached" }, { status: 403 })
  }
  
  // Proceed with adding staff
}
```

### 2. Client-Side Gates (UI Only)
Client-side gates are for UX only - never trust them for security:

```typescript
// ✅ Good - Server validates
const handleAddStaff = async () => {
  const res = await fetch("/api/staff/add", { method: "POST", body: JSON.stringify(data) })
  if (res.status === 403) {
    // Show upgrade popup
  }
}

// ❌ Bad - Only client-side check
if (hasFeature("canAddStaff")) {
  // Directly add to database - INSECURE!
}
```

### 3. Database-Level Constraints
Add constraints in MongoDB:

```typescript
// Prevent adding staff beyond limit
const staffCount = await db.collection("staff").countDocuments({ organizationId })
const subscription = await getSubscription(organizationId)
const maxStaff = PLAN_FEATURES[subscription.plan].maxStaff

if (maxStaff !== -1 && staffCount >= maxStaff) {
  throw new Error("Staff limit reached")
}
```

## Testing

### Dev Mode Testing
1. Navigate to `/dev/plans`
2. Switch between plans
3. Test each feature in each plan state
4. Verify gates work correctly

### Manual Testing Checklist
- [ ] Starter (trial active) - all features work
- [ ] Starter (trial expired) - only basic check-in works
- [ ] Professional - photo works, fingerprint blocked, some analytics
- [ ] Enterprise - all features work
- [ ] Staff limits enforced (10, 50, unlimited)
- [ ] Upgrade popups show correct messaging
- [ ] Server-side validation blocks unauthorized requests

## Migration

Run the migration script to update existing subscriptions:

```bash
npx ts-node scripts/migrate-subscriptions.ts
```

## Next Steps

1. Implement remaining gates (staff, checkin, reports)
2. Add server-side validation to all API routes
3. Test thoroughly in dev mode
4. Update payment flow to handle plan upgrades
5. Add trial countdown UI
6. Set up email notifications for trial expiry
