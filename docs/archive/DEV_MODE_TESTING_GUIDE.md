# 🧪 Development Mode & Plan Testing Guide

## Overview
Complete guide for testing subscription plans and feature gates in development mode.

---

## 🔓 Development Mode Behavior

### What is Development Mode?
When `NODE_ENV === "development"`, **ALL features are unlocked** regardless of subscription plan.

### Why?
- Allows developers to test all features without payment
- No need to upgrade during development
- Can test feature gates by switching plans
- Faster development workflow

### How It Works
```typescript
// In feature-manager.ts
if (isDevelopment) {
  return true // All features unlocked
}
```

---

## 🎯 Feature Gate Respect

### Frontend (UI)
**Hook**: `hooks/use-subscription.ts`
```typescript
const isDevelopment = process.env.NODE_ENV === "development"

const hasFeature = (feature: keyof PlanFeatures): boolean => {
  return hasFeatureAccess(
    subscription.plan,
    feature,
    subscription.isTrialActive,
    isDevelopment // ✅ Passes dev flag
  )
}
```

**Result**: In dev mode, all UI feature gates return `true`

### Backend (API)
**Module**: `lib/features/feature-access.ts`
```typescript
export async function hasFeatureAccess(
  tenantId: string,
  feature: keyof PlanFeatures,
  isDevelopment: boolean = false
): Promise<boolean> {
  if (isDevelopment) {
    return true // ✅ All features unlocked
  }
  // ... check subscription
}
```

**Usage in APIs**:
```typescript
const canAccessReports = await hasFeatureAccess(
  context.tenantId,
  "canAccessHistory",
  process.env.NODE_ENV === "development" // ✅ Passes dev flag
)
```

**Result**: In dev mode, all API feature checks return `true`

---

## 🧪 Testing Different Plans

### Access Dev Plans Page
Navigate to: `/dev/plans`

**Features:**
- Only accessible in development mode
- Shows current plan and trial status
- Allows switching between plans
- Visual indication of locked features per plan

### Available Test Plans

#### 1. Starter (Trial Active)
```
Plan: starter
Trial: Active
Features: All unlocked (except fingerprint)
Staff Limit: 10
```

**What to Test:**
- ✅ Can access Analytics
- ✅ Can access Reports
- ✅ Can access History
- ✅ Photo verification works
- ❌ Fingerprint locked (even in trial)

#### 2. Starter (Trial Expired)
```
Plan: starter
Trial: Expired
Features: Basic check-in only
Staff Limit: 10 (can't add more)
```

**What to Test:**
- ❌ Analytics shows upgrade modal
- ❌ Reports dropdown locked
- ❌ History shows upgrade modal
- ❌ Can't add/edit staff
- ✅ Basic check-in still works

#### 3. Professional
```
Plan: professional
Trial: N/A
Features: Most features unlocked
Staff Limit: 50
```

**What to Test:**
- ✅ Analytics accessible (Overview & Lateness tabs)
- ✅ Reports accessible
- ✅ History accessible
- ✅ Photo verification
- ❌ Fingerprint locked
- ❌ Advanced analytics tabs locked (Trends, Department, Performance)

#### 4. Enterprise
```
Plan: enterprise
Trial: N/A
Features: All features unlocked
Staff Limit: Unlimited
```

**What to Test:**
- ✅ All analytics tabs accessible
- ✅ All reports accessible
- ✅ Fingerprint verification
- ✅ Photo verification
- ✅ Unlimited staff

---

## 🔄 How to Test

### Step 1: Start Development Server
```bash
npm run dev
# or
yarn dev
```

### Step 2: Navigate to Dev Plans
```
http://localhost:3000/dev/plans
```

### Step 3: Switch Plans
Click "Switch to This" button on any plan card

### Step 4: Test Features
Navigate to different pages and test feature access:
- `/dashboard/analytics` - Analytics page
- `/dashboard/present` - Present report
- `/dashboard/absent` - Absent report
- `/dashboard/late` - Late arrivals
- `/dashboard/early` - Early departures
- `/dashboard/history` - Attendance history

### Step 5: Verify Behavior

**In Development Mode:**
- All features should work regardless of plan
- No upgrade modals should appear
- Reports dropdown always opens
- All API calls succeed

**Testing Feature Gates:**
Switch to "Starter (Trial Expired)" and verify:
- Reports dropdown shows lock icon
- Clicking Reports shows upgrade modal
- Accessing report pages shows upgrade modal
- API calls return 403 (but dev mode overrides this)

---

## 🎭 Development vs Production

### Development Mode (`NODE_ENV=development`)
```
✅ All features unlocked
✅ Can test all plans
✅ /dev/plans accessible
✅ No payment required
✅ Feature gates can be tested visually
```

### Production Mode (`NODE_ENV=production`)
```
❌ Features locked based on plan
❌ /dev/plans returns 403
❌ Payment required for upgrades
❌ Feature gates enforced
❌ API validation enforced
```

---

## 🔍 Verification Checklist

### Frontend Checks
- [ ] `useSubscription` hook passes `isDevelopment` flag
- [ ] All feature gates use `hasFeature()` from hook
- [ ] Reports dropdown checks `hasFeature("canAccessHistory")`
- [ ] PageGate components wrap protected pages
- [ ] FeatureGate components wrap protected features

### Backend Checks
- [ ] API endpoints import from `lib/features/feature-access`
- [ ] All feature checks pass `process.env.NODE_ENV === "development"`
- [ ] Dashboard stats API checks `canAccessHistory`
- [ ] Attendance history API checks `canAccessHistory`
- [ ] Analytics APIs check appropriate features

### Dev Tools Checks
- [ ] `/dev/plans` only accessible in development
- [ ] `/api/dev/check` returns `isDevelopment: true`
- [ ] `/api/dev/switch-plan` only works in development
- [ ] Plan switching updates subscription in database

---

## 🐛 Troubleshooting

### Issue: Features still locked in dev mode
**Solution**: Check that `NODE_ENV` is set to `development`
```bash
echo $NODE_ENV  # Should output: development
```

### Issue: /dev/plans not accessible
**Solution**: Verify you're running in development mode
```bash
npm run dev  # Not npm start
```

### Issue: Plan switching doesn't work
**Solution**: Check browser console for errors, verify database connection

### Issue: API returns 403 even in dev mode
**Solution**: Verify API is passing `process.env.NODE_ENV === "development"` to `hasFeatureAccess`

---

## 📊 Feature Matrix

| Feature | Starter (Trial) | Starter (Expired) | Professional | Enterprise | Dev Mode |
|---------|----------------|-------------------|--------------|------------|----------|
| Basic Check-in | ✅ | ✅ | ✅ | ✅ | ✅ |
| QR Check-in | ✅ | ✅ | ✅ | ✅ | ✅ |
| Photo Verification | ✅ | ❌ | ✅ | ✅ | ✅ |
| Fingerprint | ❌ | ❌ | ❌ | ✅ | ✅ |
| Analytics | ✅ | ❌ | ✅ (Limited) | ✅ (Full) | ✅ |
| Reports | ✅ | ❌ | ✅ | ✅ | ✅ |
| History | ✅ | ❌ | ✅ | ✅ | ✅ |
| Export Data | ✅ | ❌ | ✅ | ✅ | ✅ |
| Add/Edit Staff | ✅ | ❌ | ✅ | ✅ | ✅ |
| Staff Limit | 10 | 10 | 50 | Unlimited | Unlimited |

---

## 🎯 Testing Scenarios

### Scenario 1: Trial Expiration
1. Switch to "Starter (Trial Active)"
2. Verify all features work
3. Switch to "Starter (Trial Expired)"
4. Verify features are locked (but still work in dev mode)
5. Check that upgrade modals appear

### Scenario 2: Plan Upgrades
1. Start with "Starter (Trial Expired)"
2. Try to access Analytics → See upgrade modal
3. Switch to "Professional"
4. Verify Analytics now accessible
5. Try advanced analytics → See upgrade modal
6. Switch to "Enterprise"
7. Verify all analytics accessible

### Scenario 3: API Validation
1. Switch to "Starter (Trial Expired)"
2. Open browser dev tools
3. Try to call `/api/dashboard/stats`
4. Verify it works (dev mode override)
5. Check response includes all data

### Scenario 4: Staff Limits
1. Switch to "Starter (Trial Expired)"
2. Try to add staff → Should work in dev mode
3. Switch to "Professional"
4. Add 51st staff → Should work in dev mode
5. In production, these would be blocked

---

## 🚀 Production Deployment

### Before Deploying
1. ✅ Verify `NODE_ENV=production` in environment
2. ✅ Test feature gates work correctly
3. ✅ Verify `/dev/plans` returns 403
4. ✅ Test upgrade flows with test cards
5. ✅ Verify API validation works

### Environment Variables
```env
NODE_ENV=production
PAYSTACK_SECRET_KEY=sk_live_xxx
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 📝 Summary

**Development Mode:**
- All features unlocked for testing
- Can switch plans via `/dev/plans`
- Feature gates can be tested visually
- No payment required

**Production Mode:**
- Features locked based on subscription
- Payment required for upgrades
- Feature gates enforced
- API validation enforced

**Testing:**
- Use `/dev/plans` to switch between plans
- Verify feature gates show/hide correctly
- Test upgrade modals appear when expected
- Confirm API validation works

**The system respects development mode at ALL levels: UI, Pages, and APIs!**
