# 🔐 Check-In Passcode Guide

## ⚠️ Issue: "Invalid email or passcode"

### Why This Happens:
When you first register an organization, **no passcode is set yet**. You need to set one in Settings first.

---

## ✅ Solution: Two Options

### Option 1: Use Default Passcode (Development Mode)

**For testing immediately:**

1. **Email:** Use your organization's admin email (the one you registered with)
2. **Passcode:** Use `1234` (default development passcode)

This works automatically in development mode when no passcode is set.

### Option 2: Set Your Own Passcode (Recommended)

**Steps:**

1. **Go to Settings**
   ```
   Dashboard → Settings
   ```

2. **Scroll to "Check-In Passcode" field**
   - Enter a 4-6 digit code (e.g., "5678")
   - Click "Save Changes"

3. **Use Your Passcode**
   - Now use your custom passcode instead of "1234"

---

## 📋 How to Find Your Credentials

### New Page: Check-In Info

We've added a dedicated page that shows you everything you need:

```
Dashboard → Check-In Info
```

**This page shows:**
- ✅ Your check-in URL
- ✅ Your organization email
- ✅ Your current passcode (or "1234" if not set)
- ✅ Copy buttons for easy sharing
- ✅ Instructions for staff

---

## 🎯 Quick Test

### To test check-in right now:

1. **Open Check-In Page**
   ```
   http://localhost:3000/checkin
   ```

2. **Enter Credentials**
   - **Email:** Your admin email (from registration)
   - **Passcode:** `1234` (if no passcode set) OR your custom passcode

3. **Click "Unlock Check-In"**
   - Should work! ✅

---

## 🔍 Finding Your Admin Email

**Option 1: Check Dashboard**
- Look at the sidebar (bottom left)
- Your email is displayed under your name

**Option 2: Check Settings**
- Go to Settings
- Look at "Admin Email" field

**Option 3: Check Check-In Info Page**
- Go to Dashboard → Check-In Info
- Email is displayed with copy button

---

## 📝 Example Credentials

### If you registered with:
```
Email: admin@mycompany.com
Password: mypassword123
```

### Then for check-in page:
```
Organization Email: admin@mycompany.com
Passcode: 1234 (default) or your custom passcode
```

---

## 🛠️ Setting a Custom Passcode

### Step-by-Step:

1. **Login to Dashboard**
   ```
   http://localhost:3000/login
   ```

2. **Go to Settings**
   ```
   Dashboard → Settings
   ```

3. **Find "Check-In Passcode" Section**
   - Scroll down to "Work Hours & Attendance"
   - Look for "Check-In Passcode" field

4. **Enter Your Passcode**
   - Type a 4-6 digit code
   - Example: "5678" or "123456"

5. **Save**
   - Click "Save Changes" button
   - Wait for success message

6. **Test**
   - Go to check-in page
   - Use your new passcode

---

## 🎨 Visual Guide

### Settings Page:
```
┌─────────────────────────────────────┐
│  Settings                           │
│                                     │
│  Work Hours & Attendance            │
│  ─────────────────────────          │
│                                     │
│  Check-In Passcode                  │
│  ┌───────────────────────────────┐ │
│  │  [____1234____]               │ │
│  └───────────────────────────────┘ │
│  Required to unlock check-in page   │
│                                     │
│  [Save Changes]                     │
└─────────────────────────────────────┘
```

### Check-In Page:
```
┌─────────────────────────────────────┐
│  🔒 Check-In System Locked          │
│                                     │
│  Organization Email                 │
│  ┌───────────────────────────────┐ │
│  │  admin@mycompany.com          │ │
│  └───────────────────────────────┘ │
│                                     │
│  Check-In Passcode                  │
│  ┌───────────────────────────────┐ │
│  │  [____1234____]               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Unlock Check-In]                  │
└─────────────────────────────────────┘
```

---

## 🚨 Troubleshooting

### "Organization not found with this email"
- ❌ Wrong email address
- ✅ Use the exact email from registration
- ✅ Check for typos
- ✅ Check Check-In Info page for correct email

### "Invalid passcode"
- ❌ Wrong passcode
- ✅ Try "1234" (default)
- ✅ Check Settings for your custom passcode
- ✅ Check Check-In Info page

### "No passcode set"
- ❌ No passcode configured
- ✅ Use "1234" in development mode
- ✅ OR set a passcode in Settings

---

## 📱 Sharing with Staff

### What to tell your staff:

```
To check in:

1. Go to: http://localhost:3000/checkin
   (or your production URL)

2. Enter:
   Email: admin@mycompany.com
   Passcode: 1234

3. Choose your check-in method
4. Check in!
```

**Pro Tip:** Use the Check-In Info page to copy and share credentials easily!

---

## ✅ Summary

1. **Default passcode in development:** `1234`
2. **Set custom passcode:** Settings → Check-In Passcode
3. **Find credentials:** Dashboard → Check-In Info
4. **Email:** Your admin email from registration
5. **Test immediately:** Use email + "1234"

**Everything should work now!** 🎉
