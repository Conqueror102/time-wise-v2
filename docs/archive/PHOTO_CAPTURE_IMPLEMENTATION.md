# 📸 Photo Capture Feature Implementation

## ✅ What's Been Implemented

### 1. Database Schema Updated
- ✅ Added `checkInPhoto` and `checkOutPhoto` fields to AttendanceLog
- ✅ Added `capturePhotos` toggle to OrganizationSettings
- ✅ Added `photoRetentionDays` setting (default 7 days)

### 2. Photo Capture Component Created
- ✅ `components/photo-capture.tsx` - Reusable camera component
- ✅ Auto-capture with 3-second countdown
- ✅ Manual capture option
- ✅ Skip option for flexibility

### 3. Check-In Page Partially Updated
- ✅ Imported PhotoCapture component
- ✅ Added state for photo capture
- ⚠️ Needs completion (see below)

---

## 🔧 What Needs to Be Completed

### 1. Finish Check-In Page Integration

**File:** `app/checkin/page.tsx`

**Add these functions after line 93:**

```typescript
const handlePhotoCapture = (photoBase64: string) => {
  setShowPhotoCapture(false)
  if (pendingCheckIn) {
    handleCheckIn(pendingCheckIn.type, photoBase64)
    setPendingCheckIn(null)
  }
}

const handleSkipPhoto = () => {
  setShowPhotoCapture(false)
  if (pendingCheckIn) {
    handleCheckIn(pendingCheckIn.type)
    setPendingCheckIn(null)
  }
}
```

**Update useEffect (around line 96):**

```typescript
React.useEffect(() => {
  const storedTenantId = sessionStorage.getItem("checkInTenantId")
  const storedOrgName = sessionStorage.getItem("checkInOrgName")
  const storedCapturePhotos = sessionStorage.getItem("capturePhotos")
  
  if (storedTenantId && storedOrgName) {
    setTenantId(storedTenantId)
    setOrganizationName(storedOrgName)
    setCapturePhotos(storedCapturePhotos === "true")
    setIsUnlocked(true)
  }
}, [])
```

**Update handleUnlock (around line 60):**

```typescript
setCapturePhotos(data.capturePhotos || false)

// In sessionStorage
sessionStorage.setItem("capturePhotos", data.capturePhotos ? "true" : "false")
```

### 2. Update Check-In API

**File:** `app/api/attendance/checkin/route.ts`

**Add photo handling:**

```typescript
const { staffId, type, tenantId, photo } = await request.json()

// When creating attendance log:
await tenantDb.insertOne<AttendanceLog>("attendance", {
  staffId,
  staffName: staff.name,
  department: staff.department,
  type,
  timestamp: now,
  date: currentDate,
  isLate: isLate || false,
  isEarly: isEarly || false,
  method: "manual",
  ...(type === "check-in" && photo ? { checkInPhoto: photo } : {}),
  ...(type === "check-out" && photo ? { checkOutPhoto: photo } : {}),
  photosCapturedAt: photo ? new Date() : undefined,
} as any)
```

### 3. Update Verify Passcode API

**File:** `app/api/organization/verify-passcode/route.ts`

**Return capturePhotos setting:**

```typescript
return NextResponse.json({
  success: true,
  tenantId: organization._id.toString(),
  organizationName: organization.name,
  capturePhotos: organization.settings?.capturePhotos || false,
})
```

### 4. Update Settings Page

**File:** `app/(dashboard)/dashboard/settings/page.tsx`

**Add toggle for photo capture:**

```typescript
// In state
const [settings, setSettings] = useState({
  // ... existing settings
  capturePhotos: false,
  photoRetentionDays: 7,
})

// In useEffect
setSettings({
  // ... existing settings
  capturePhotos: org.settings?.capturePhotos || false,
  photoRetentionDays: org.settings?.photoRetentionDays || 7,
})

// In JSX (add after check-in passcode section)
<div className="space-y-4 border-t pt-4">
  <h3 className="font-semibold">Photo Verification</h3>
  
  <div className="flex items-center justify-between">
    <div>
      <Label htmlFor="capturePhotos">Capture Photos on Check-In/Out</Label>
      <p className="text-sm text-gray-500">
        Automatically take photos to verify staff identity
      </p>
    </div>
    <input
      type="checkbox"
      id="capturePhotos"
      checked={settings.capturePhotos}
      onChange={(e) => setSettings({ ...settings, capturePhotos: e.target.checked })}
      className="w-5 h-5"
    />
  </div>

  <div className="space-y-2">
    <Label htmlFor="photoRetentionDays">Photo Retention (Days)</Label>
    <Input
      id="photoRetentionDays"
      type="number"
      min="1"
      max="30"
      value={settings.photoRetentionDays}
      onChange={(e) => setSettings({ ...settings, photoRetentionDays: parseInt(e.target.value) })}
    />
    <p className="text-xs text-gray-500">
      Photos will be automatically deleted after this many days
    </p>
  </div>
</div>
```

### 5. Update Settings API

**File:** `app/api/organization/settings/route.ts`

**Add photo settings:**

```typescript
const { 
  // ... existing fields
  capturePhotos,
  photoRetentionDays,
} = body

// In update object
if (capturePhotos !== undefined) updateData["settings.capturePhotos"] = capturePhotos
if (photoRetentionDays !== undefined) updateData["settings.photoRetentionDays"] = photoRetentionDays
```

### 6. Create Photo Cleanup Cron Job

**File:** `app/api/cron/cleanup-photos/route.ts`

```typescript
/**
 * Cron Job - Cleanup Old Photos
 * Run weekly to delete photos older than retention period
 */

import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const db = await getDatabase()

    // Get all organizations
    const organizations = await db.collection("organizations").find({}).toArray()

    let totalCleaned = 0

    for (const org of organizations) {
      const retentionDays = org.settings?.photoRetentionDays || 7
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

      // Remove photos from old attendance records
      const result = await db.collection("attendance").updateMany(
        {
          tenantId: org._id.toString(),
          photosCapturedAt: { $lt: cutoffDate },
          $or: [
            { checkInPhoto: { $exists: true } },
            { checkOutPhoto: { $exists: true } }
          ]
        },
        {
          $unset: {
            checkInPhoto: "",
            checkOutPhoto: "",
            photosCapturedAt: ""
          }
        }
      )

      totalCleaned += result.modifiedCount
    }

    return NextResponse.json({
      success: true,
      message: `Cleaned ${totalCleaned} photo records`,
      cleanedCount: totalCleaned,
    })
  } catch (error) {
    console.error("Photo cleanup error:", error)
    return NextResponse.json(
      { error: "Failed to cleanup photos" },
      { status: 500 }
    )
  }
}
```

### 7. Update Attendance Display

**File:** `app/(dashboard)/dashboard/attendance/page.tsx`

**Show photos in attendance records:**

```typescript
{record.checkInPhoto && (
  <img 
    src={`data:image/jpeg;base64,${record.checkInPhoto}`}
    alt="Check-in photo"
    className="w-16 h-16 rounded object-cover cursor-pointer"
    onClick={() => {
      // Show full size in modal
      window.open(`data:image/jpeg;base64,${record.checkInPhoto}`, '_blank')
    }}
  />
)}

{record.checkOutPhoto && (
  <img 
    src={`data:image/jpeg;base64,${record.checkOutPhoto}`}
    alt="Check-out photo"
    className="w-16 h-16 rounded object-cover cursor-pointer"
    onClick={() => {
      window.open(`data:image/jpeg;base64,${record.checkOutPhoto}`, '_blank')
    }}
  />
)}
```

---

## 🎯 How It Works

### User Flow:

1. **Admin enables photo capture** in Settings
2. **Staff checks in** on check-in page
3. **Camera opens automatically** with 3-second countdown
4. **Photo captured** and attached to attendance record
5. **Same for check-out** - another photo captured
6. **Photos stored** in same attendance row (not new row)
7. **Weekly cleanup** removes photos older than retention period

### Database Structure:

```javascript
{
  "_id": ObjectId("..."),
  "staffId": "STAFF001",
  "type": "check-in",
  "date": "2024-01-20",
  "checkInPhoto": "base64string...",  // Added at check-in
  "checkOutPhoto": "base64string...", // Added at check-out (updates same row)
  "photosCapturedAt": ISODate("2024-01-20"),
  // ... other fields
}
```

### Cron Job Setup:

**Vercel:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/cleanup-photos",
    "schedule": "0 0 * * 0" // Every Sunday at midnight
  }]
}
```

**Environment Variable:**
```env
CRON_SECRET=your-secret-key-here
```

---

## ✅ Benefits

1. **Fraud Prevention** - Visual verification of who checked in
2. **Single Row** - Photos added to existing attendance record
3. **Auto Cleanup** - No manual maintenance needed
4. **Admin Control** - Toggle on/off anytime
5. **Configurable** - Set retention period (1-30 days)
6. **Privacy** - Photos deleted automatically

---

## 🚀 To Complete Implementation:

1. Apply all code changes above
2. Test photo capture flow
3. Set up cron job for cleanup
4. Add CRON_SECRET to environment
5. Test in production

**Estimated time: 30-45 minutes** 🎉
