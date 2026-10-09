# Cloudinary Image Storage Setup

## Overview
The attendance system now uses **Cloudinary** for storing check-in and check-out photos instead of storing base64 images in MongoDB.

## Benefits
- ✅ Reduced MongoDB document size
- ✅ Faster image loading with CDN
- ✅ Automatic image optimization
- ✅ Better scalability
- ✅ Fallback to base64 if Cloudinary fails or is not configured

## Setup Instructions

### 1. Create Cloudinary Account
1. Go to [cloudinary.com](https://cloudinary.com)
2. Sign up for a free account
3. Verify your email

### 2. Get API Credentials
1. Log in to your Cloudinary dashboard
2. Navigate to **Dashboard** → **Account Details**
3. Copy the following credentials:
   - **Cloud Name**
   - **API Key**
   - **API Secret**

### 3. Add Credentials to .env
Add these environment variables to your `.env` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

### 4. Install Dependencies
```bash
npm install cloudinary
# or
pnpm install cloudinary
```

### 5. Test the Integration
1. Start your development server: `npm run dev`
2. Try checking in a staff member with a photo
3. Check the console logs for upload confirmation
4. Verify the image appears in admin attendance table

## How It Works

### Image Upload Flow
```
┌─────────────────────┐
│  Staff Captures     │
│  Photo (Frontend)   │
└──────────┬──────────┘
           │ Base64
           ▼
┌─────────────────────┐
│  API Route          │
│  /api/attendance/   │
│  checkin            │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Cloudinary Service │
│  uploads to cloud   │
└──────────┬──────────┘
           │ Returns URL
           ▼
┌─────────────────────┐
│  MongoDB Attendance │
│  Stores URL         │
│  (not base64)       │
└─────────────────────┘
```

### Folder Structure in Cloudinary
Images are organized by tenant:
```
timewise/
├── {tenantId}/
│   ├── attendance/
│   │   ├── check-in/
│   │   │   ├── STAFF001-1705920000000.jpg
│   │   │   └── STAFF002-1705920123000.jpg
│   │   └── check-out/
│   │       ├── STAFF001-1705950000000.jpg
│   │       └── STAFF002-1705950123000.jpg
```

## Image Transformations
Automatic optimizations applied:
- **Max dimensions**: 800x800px
- **Quality**: Auto (good)
- **Format**: Auto (WebP/AVIF for supported browsers)

## Fallback Mechanism
If Cloudinary fails or is not configured:
- ✅ System automatically falls back to base64 storage
- ✅ No errors thrown to users
- ✅ Existing base64 images still work

## Code Structure

### Service Layer
**File**: `lib/services/cloudinary.ts`
- `uploadImage()` - Generic upload function
- `uploadCheckInPhoto()` - Check-in specific
- `uploadCheckOutPhoto()` - Check-out specific  
- `deleteImage()` - Delete from Cloudinary
- `isCloudinaryConfigured()` - Check if configured

### API Integration
**File**: `app/api/attendance/checkin/route.ts`
- Uploads photos during check-in/check-out
- Falls back to base64 if upload fails

### Frontend Display
**Files**: 
- `app/(dashboard)/dashboard/attendance/page.tsx`
- `app/(dashboard)/dashboard/history/page.tsx`

**Helper**: `lib/utils/image.ts`
- `getImageSrc()` - Returns proper src (URL or base64)
- `isImageUrl()` - Checks if URL or base64
- `isCloudinaryImage()` - Checks if Cloudinary URL

## Database Schema
Updated `AttendanceLog` type in `lib/types/index.ts`:
```typescript
interface AttendanceLog {
  // ... other fields
  checkInPhoto?: string  // Cloudinary URL or base64
  checkOutPhoto?: string // Cloudinary URL or base64
  checkInPhotoPublicId?: string   // For Cloudinary deletion
  checkOutPhotoPublicId?: string  // For Cloudinary deletion
}
```

## Testing Checklist
- [ ] Cloudinary credentials added to `.env`
- [ ] Dependencies installed (`npm install`)
- [ ] Server restarted
- [ ] Check-in with photo works
- [ ] Photo displays in attendance table
- [ ] Photo opens in full size
- [ ] Check console for upload logs
- [ ] Verify image in Cloudinary dashboard

## Troubleshooting

### Images not uploading
1. Check console logs for errors
2. Verify Cloudinary credentials in `.env`
3. Ensure `CLOUDINARY_CLOUD_NAME` doesn't have spaces
4. Check internet connection

### Images not displaying
1. Check browser console for errors
2. Verify image URL in database
3. Check Cloudinary dashboard for image
4. Ensure image URL is accessible (not private)

### Fallback to base64
If you see "Cloudinary not configured" in logs:
- Cloudinary credentials missing/incorrect
- System will store as base64 in MongoDB
- Everything still works, just larger documents

## Cost Considerations
Cloudinary Free Tier includes:
- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ 25,000 transformations/month

For higher usage, upgrade to paid plan.

## Migration from Base64
If you have existing base64 images:
1. They will continue to work
2. New images will use Cloudinary
3. Old images won't be migrated automatically
4. You can manually migrate if needed

## Support
For issues with this implementation, check:
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Cloudinary Node.js SDK](https://github.com/cloudinary/cloudinary_npm)
