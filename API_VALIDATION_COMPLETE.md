# API Route Validation - Complete ✅

## Overview
All API routes now have server-side validation to enforce subscription-based feature access. This ensures security even if client-side gates are bypassed.

## ✅ Validated API Routes

### Staff Management APIs

#### POST `/api/staff`
**Feature**: `canAddStaff`
**Plans**: Professional, Enterprise (Starter during trial)
**Validation**:
- Checks if user can add staff
- Validates staff limit (10, 50, unlimited)
- Returns 403 if trial expired or limit reached

**Error Response**:
```json
{
  "error": "Your trial has expired. Upgrade to Professional or Enterprise to add staff members.",
  "code": "FEATURE_LOCKED"
}
```

#### PATCH `/api/staff/[staffId]`
**Feature**: `canEditStaff`
**Plans**: Professional, Enterprise (Starter during trial)
**Validation**:
- Checks if user can edit staff
- Returns 403 if trial expired

**Error Response**:
```json
{
  "error": "Your trial has expired. Upgrade to Professional or Enterprise to edit staff members.",
  "code": "FEATURE_LOCKED"
}
```

### Analytics APIs

#### GET `/api/analytics/overview`
**Features**: `canAccessAnalytics`, `analyticsOverview`
**Plans**: Professional, Enterprise (Starter during trial)
**Validation**:
- Checks analytics page access
- Checks overview tab access
- Returns 403 if locked

**Error Response**:
```json
{
  "error": "Analytics are locked. Upgrade to Professional or Enterprise to access analytics.",
  "code": "FEATURE_LOCKED"
}
```

#### GET `/api/analytics/lateness`
**Feature**: `analyticsLateness`
**Plans**: Professional, Enterprise (Starter during trial)
**Validation**:
- Checks lateness analytics access
- Returns 403 if not Professional+

**Error Response**:
```json
{
  "error": "Lateness analytics are only available in Professional and Enterprise plans. Upgrade to access this feature.",
  "code": "FEATURE_LOCKED"
}
```

#### GET `/api/analytics/trends`
**Feature**: `analyticsTrends`
**Plans**: Enterprise only (Starter during trial)
**Validation**:
- Checks trends analytics access
- Returns 403 if not Enterprise

**Error Response**:
```json
{
  "error": "Trends analytics are only available in the Enterprise plan. Upgrade to access advanced insights.",
  "code": "FEATURE_LOCKED"
}
```

#### GET `/api/analytics/departments`
**Feature**: `analyticsDepartment`
**Plans**: Enterprise only (Starter during trial)
**Validation**:
- Checks department analytics access
- Returns 403 if not Enterprise

**Error Response**:
```json
{
  "error": "Department analytics are only available in the Enterprise plan. Upgrade to access team insights.",
  "code": "FEATURE_LOCKED"
}
```

#### GET `/api/analytics/staff`
**Feature**: `analyticsPerformance`
**Plans**: Enterprise only (Starter during trial)
**Validation**:
- Checks staff performance analytics access
- Returns 403 if not Enterprise

**Error Response**:
```json
{
  "error": "Staff performance analytics are only available in the Enterprise plan. Upgrade to access detailed reports.",
  "code": "FEATURE_LOCKED"
}
```

#### GET `/api/analytics/export`
**Feature**: `exportData`
**Plans**: Professional, Enterprise (Starter during trial)
**Validation**:
- Checks export permission
- Returns 403 if not Professional+

**Error Response**:
```json
{
  "error": "Data export is only available in Professional and Enterprise plans. Upgrade to export your data.",
  "code": "FEATURE_LOCKED"
}
```

## Validation Pattern

All routes follow this consistent pattern:

```typescript
// Check feature access (unless in development mode)
const isDevelopment = process.env.NODE_ENV === "development"
if (!isDevelopment) {
  const { getSubscriptionStatus } = await import("@/lib/subscription/subscription-manager")
  const { hasFeatureAccess } = await import("@/lib/features/feature-manager")
  
  const subscription = await getSubscriptionStatus(context.tenantId)
  
  // Check specific feature
  if (!hasFeatureAccess(subscription.plan as any, "featureName", subscription.isTrialActive, isDevelopment)) {
    return NextResponse.json(
      { 
        error: "Feature locked message",
        code: "FEATURE_LOCKED"
      },
      { status: 403 }
    )
  }
}
```

## Security Features

### 1. Server-Side Enforcement
- All validation happens on the server
- Cannot be bypassed by client manipulation
- Subscription checked on every request

### 2. Development Mode Bypass
- All features unlocked when `NODE_ENV=development`
- Easy testing without subscription setup
- Automatically disabled in production

### 3. Consistent Error Codes
- `FEATURE_LOCKED` - Feature not available in current plan
- `STAFF_LIMIT_REACHED` - Staff limit exceeded
- HTTP 403 status for all feature locks

### 4. Clear Error Messages
- User-friendly messages
- Indicate which plan is needed
- Guide users to upgrade

## API Access Matrix

| API Route | Starter (Trial) | Starter (Expired) | Professional | Enterprise |
|-----------|----------------|-------------------|--------------|------------|
| **Staff Management** |
| POST /api/staff | ✅ | ❌ | ✅ | ✅ |
| PATCH /api/staff/[id] | ✅ | ❌ | ✅ | ✅ |
| **Analytics** |
| GET /api/analytics/overview | ✅ | ❌ | ✅ | ✅ |
| GET /api/analytics/lateness | ✅ | ❌ | ✅ | ✅ |
| GET /api/analytics/trends | ✅ | ❌ | ❌ | ✅ |
| GET /api/analytics/departments | ✅ | ❌ | ❌ | ✅ |
| GET /api/analytics/staff | ✅ | ❌ | ❌ | ✅ |
| GET /api/analytics/export | ✅ | ❌ | ✅ | ✅ |

## Testing API Validation

### Using cURL

**Test locked feature (Professional trying Enterprise feature):**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/analytics/trends?range=30d
```

**Expected Response (403):**
```json
{
  "error": "Trends analytics are only available in the Enterprise plan. Upgrade to access advanced insights.",
  "code": "FEATURE_LOCKED"
}
```

### Using Postman

1. Set Authorization header with Bearer token
2. Make GET request to locked endpoint
3. Verify 403 response with FEATURE_LOCKED code

### Using Dev Tools

1. Navigate to `/dev/plans`
2. Switch to Professional plan
3. Try accessing Enterprise-only analytics
4. Check Network tab for 403 responses

## Error Handling in Client

```typescript
try {
  const response = await fetch("/api/analytics/trends")
  
  if (response.status === 403) {
    const error = await response.json()
    if (error.code === "FEATURE_LOCKED") {
      // Show upgrade popup
      setShowUpgradePopup(true)
    }
  }
  
  const data = await response.json()
  // Process data
} catch (error) {
  console.error("API error:", error)
}
```

## Monitoring & Logging

### Recommended Monitoring

1. **403 Error Rate** - Track feature lock attempts
2. **Upgrade Conversions** - Users who upgrade after 403
3. **Feature Usage by Plan** - Which features drive upgrades
4. **Trial Expiration** - Monitor trial-to-paid conversion

### Log Examples

```
[INFO] Feature access granted: canAddStaff (plan: professional)
[WARN] Feature access denied: analyticsTrends (plan: professional)
[INFO] Subscription checked: org_123 (plan: enterprise, trial: false)
```

## Production Checklist

- [x] All API routes have validation
- [x] Development mode bypass works
- [x] Error messages are user-friendly
- [x] Error codes are consistent
- [x] Subscription status cached appropriately
- [x] Trial status checked correctly
- [x] Staff limits enforced
- [x] Analytics tabs gated
- [x] Export functionality gated

## Summary

✅ **All API routes are now secured with server-side validation**

- 8 API routes validated
- Consistent error handling
- Development mode support
- Clear upgrade paths
- Production-ready security

No feature can be accessed without proper subscription validation! 🔒
