# 🔐 Biometric Registration Flow

## Complete User Journey

### 📋 Overview

There are **TWO ways** to register biometrics:

1. **Self-Service Registration** (Staff registers themselves)
2. **Admin-Assisted Registration** (Admin registers for staff)

---

## 🚀 Method 1: Self-Service Registration (Recommended)

### Step-by-Step Flow:

#### **Step 1: Staff Goes to Registration Page**
```
URL: /register-biometric
```

**What they see:**
- Welcome screen
- Input field for Staff ID
- "Continue" button

**What they do:**
1. Enter their Staff ID (e.g., "STAFF001")
2. Click "Continue"

#### **Step 2: System Verifies Staff**
```
API Call: GET /api/staff/verify?staffId=STAFF001
```

**System checks:**
- ✅ Staff ID exists in database
- ✅ Staff is active
- ✅ Returns staff name and department

**If verification fails:**
- Shows error message
- Staff must contact admin

**If verification succeeds:**
- Shows welcome message with staff name
- Proceeds to registration tabs

#### **Step 3: Choose Registration Method**

**Two tabs available:**

##### **Tab 1: Fingerprint Registration**

**What staff sees:**
- Fingerprint scanner interface
- Instructions to use device sensor
- "Register Fingerprint" button

**What happens:**
1. Staff clicks "Register Fingerprint"
2. Browser prompts for biometric (Touch ID, Face ID, Windows Hello)
3. Staff authenticates with device
4. System captures credential

**Behind the scenes:**
```javascript
// WebAuthn creates credential
const credential = await navigator.credentials.create({
  publicKey: {
    challenge: randomChallenge,
    user: {
      id: staffId,
      name: staffId,
      displayName: staffName
    }
  }
})

// Save to database
POST /api/biometric/fingerprint/register
{
  staffId: "STAFF001",
  credentialId: "abc123...",
  publicKey: "xyz789...",
  deviceName: "Mac"
}
```

**Result:**
- ✅ Credential stored in database
- ✅ Linked to staff record
- ✅ Success message shown
- ✅ Can register multiple devices

##### **Tab 2: Face Registration**

**What staff sees:**
- Camera preview
- Face detection frame
- "Start Camera" button
- "Capture" button

**What happens:**
1. Staff clicks "Start Camera"
2. Browser requests camera permission
3. Camera opens with face frame overlay
4. Staff positions face in frame
5. Staff clicks "Capture"
6. System processes face image

**Behind the scenes:**
```javascript
// Capture face image
const imageData = canvas.toDataURL("image/jpeg")

// In Development Mode:
// - Stores image with mock face ID
// - No AWS needed

// In Production Mode:
// - Sends to AWS Rekognition
// - Extracts face embeddings
// - Stores embeddings in database

POST /api/biometric/face/register
{
  staffId: "STAFF001",
  faceImage: "base64string..."
}

// AWS Rekognition (Production)
AWS.Rekognition.IndexFaces({
  CollectionId: "staff-faces",
  Image: { Bytes: imageBuffer },
  ExternalImageId: "STAFF001"
})
```

**Result:**
- ✅ Face data stored in database
- ✅ Linked to staff record
- ✅ Success message shown
- ✅ Ready for authentication

#### **Step 4: Registration Complete**

**What staff sees:**
- Success message with checkmarks
- "Go to Check-In" button
- "Register Another Staff" button (optional)

**What they can do:**
- Go to check-in page
- Register another staff member
- Close and come back later

---

## 👨‍💼 Method 2: Admin-Assisted Registration

### Step-by-Step Flow:

#### **Step 1: Admin Goes to Staff Management**
```
URL: /dashboard/staff
```

**What admin sees:**
- List of all staff members
- Each staff has action buttons

#### **Step 2: Admin Clicks on Staff**

**Options available:**
- View QR Code
- Download QR Code
- **Register Biometrics** (new button to add)
- Edit Staff
- Delete Staff

#### **Step 3: Admin Registers Biometrics**

**Same interface as self-service:**
- Fingerprint tab
- Face tab
- Staff member uses their device/face
- Admin supervises

**Use case:**
- Staff needs help
- Bulk registration session
- Onboarding new employees

---

## 🔄 Authentication Flow (After Registration)

### Using Fingerprint:

#### **Step 1: Staff Goes to Check-In**
```
URL: /checkin
```

#### **Step 2: Unlock Check-In Page**
- Enter organization email
- Enter passcode
- Click "Unlock"

#### **Step 3: Select Fingerprint Tab**
- Click "Fingerprint" tab
- Fingerprint scanner appears

#### **Step 4: Authenticate**
```javascript
// Browser prompts for biometric
const assertion = await navigator.credentials.get({
  publicKey: {
    challenge: randomChallenge
  }
})

// Verify with database
POST /api/biometric/fingerprint/authenticate
{
  credentialId: "abc123..."
}

// Returns staff information
{
  success: true,
  staffId: "STAFF001",
  staffName: "John Doe"
}
```

#### **Step 5: Auto Check-In**
- Staff ID auto-filled
- Switches to Manual tab
- Shows check-in/check-out buttons
- Staff clicks button
- Done! ✅

### Using Face Recognition:

#### **Step 1-2:** Same as fingerprint

#### **Step 3: Select Face Tab**
- Click "Face" tab
- Camera interface appears

#### **Step 4: Authenticate**
```javascript
// Capture face image
const imageData = canvas.toDataURL("image/jpeg")

// In Development:
// - Returns mock staff ID

// In Production:
// - Sends to AWS Rekognition
// - Searches for matching face
// - Returns staff ID if match found

POST /api/biometric/face/authenticate
{
  faceImage: "base64string..."
}

// AWS Rekognition (Production)
AWS.Rekognition.SearchFacesByImage({
  CollectionId: "staff-faces",
  Image: { Bytes: imageBuffer },
  FaceMatchThreshold: 80
})

// Returns staff information
{
  success: true,
  staffId: "STAFF001",
  staffName: "John Doe",
  confidence: 99.5
}
```

#### **Step 5: Auto Check-In**
- Same as fingerprint flow

---

## 📊 Database Storage

### Staff Record After Registration:

```javascript
{
  "_id": ObjectId("..."),
  "tenantId": "org123",
  "staffId": "STAFF001",
  "name": "John Doe",
  "department": "Engineering",
  "qrCode": "base64...",
  
  // Fingerprint credentials (multiple devices)
  "biometricCredentials": [
    {
      "credentialId": "abc123...",
      "publicKey": "xyz789...",
      "deviceName": "Mac",
      "registeredAt": ISODate("2024-01-20"),
      "lastUsed": ISODate("2024-01-21")
    },
    {
      "credentialId": "def456...",
      "publicKey": "uvw012...",
      "deviceName": "iPhone",
      "registeredAt": ISODate("2024-01-20"),
      "lastUsed": null
    }
  ],
  
  // Face data (one per staff)
  "faceData": {
    "faceId": "face_STAFF001_1234567890",
    "faceImage": "base64...", // Development
    "faceEmbedding": "vector...", // Production (AWS)
    "registeredAt": ISODate("2024-01-20"),
    "lastUsed": ISODate("2024-01-21")
  }
}
```

---

## 🎯 Key Features

### Multiple Device Support (Fingerprint)
- Staff can register Mac, Windows, iPhone, etc.
- Each device gets unique credential
- All devices work for authentication
- Can revoke individual devices

### Single Face Per Staff
- One face registration per staff
- Can re-register to update
- Works across all devices with camera

### Security
- Fingerprint: Private keys never leave device
- Face: Encrypted storage, AI matching
- All data linked to staff record
- Revocable at any time

---

## 🔗 Complete User Journey Map

```
┌─────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                     │
└─────────────────────────────────────────────────────────┘

1. Staff visits /register-biometric
   ↓
2. Enters Staff ID
   ↓
3. System verifies (GET /api/staff/verify)
   ↓
4. Shows registration tabs
   ↓
5a. Fingerprint Tab                5b. Face Tab
    ↓                                  ↓
    Click "Register"                   Click "Start Camera"
    ↓                                  ↓
    Device prompts biometric           Camera opens
    ↓                                  ↓
    Authenticate with device           Position face
    ↓                                  ↓
    POST /api/biometric/               Click "Capture"
    fingerprint/register               ↓
    ↓                                  POST /api/biometric/
    Credential saved                   face/register
    ↓                                  ↓
    ✅ Success                         Face saved (AWS in prod)
                                       ↓
                                       ✅ Success
   ↓
6. Registration complete
   ↓
7. Go to check-in page

┌─────────────────────────────────────────────────────────┐
│                   AUTHENTICATION FLOW                    │
└─────────────────────────────────────────────────────────┘

1. Staff visits /checkin
   ↓
2. Enters org email + passcode
   ↓
3. Check-in page unlocked
   ↓
4a. Select Fingerprint Tab        4b. Select Face Tab
    ↓                                 ↓
    Scanner appears                   Camera appears
    ↓                                 ↓
    Device prompts biometric          Look at camera
    ↓                                 ↓
    POST /api/biometric/              POST /api/biometric/
    fingerprint/authenticate          face/authenticate
    ↓                                 ↓
    Returns staff ID                  AWS searches face
                                      ↓
                                      Returns staff ID
   ↓
5. Staff ID auto-filled
   ↓
6. Click Check-In or Check-Out
   ↓
7. ✅ Attendance recorded
```

---

## 📱 Access Points

### For Staff:
- **Registration:** `/register-biometric`
- **Check-In:** `/checkin`
- **Link from check-in page:** "Register your biometrics"

### For Admin:
- **Staff Management:** `/dashboard/staff`
- **View Credentials:** Click staff → View biometrics
- **Manage Credentials:** Delete fingerprint/face

---

## ✅ Complete Flow Summary

1. **Registration is self-service** - Staff can do it themselves
2. **No admin needed** - Just need Staff ID
3. **Multiple devices supported** - Register Mac, iPhone, etc.
4. **Works in development** - No AWS needed for testing
5. **Production ready** - AWS integration for accuracy
6. **Secure** - Biometric data properly stored
7. **User-friendly** - Clear instructions at each step

**The flow is complete and functional!** 🎉
