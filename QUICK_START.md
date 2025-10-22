# ⚡ Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install @aws-sdk/client-rekognition
```

### Step 2: Setup Environment
```bash
# Copy environment file
cp .env.example .env.local

# Edit .env.local - Minimum required:
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/staff-checkin
JWT_SECRET=your-secret-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Run Application
```bash
npm run dev
```

Visit: http://localhost:3000

## ✅ What Works Immediately (No API Keys Needed)

### All Basic Features:
- ✅ Manual check-in
- ✅ QR code scanning  
- ✅ Fingerprint authentication (uses device sensor)
- ✅ Face recognition (development mode with mock data)
- ✅ Dashboard with all stats
- ✅ Attendance tracking
- ✅ Reports and CSV export
- ✅ Staff management
- ✅ Settings configuration

### Development Mode Benefits:
- No AWS account needed
- No payment setup needed
- All features functional
- Perfect for testing
- Mock data for face recognition

## 🔑 Optional API Keys (For Production)

### Paystack (For Real Payments)
```env
PAYSTACK_SECRET_KEY=sk_test_your_key
PAYSTACK_PUBLIC_KEY=pk_test_your_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key
```
Get from: https://dashboard.paystack.com/#/settings/developers

### AWS Rekognition (For Production Face Recognition)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REKOGNITION_COLLECTION_ID=staff-faces
```
Get from: AWS Console > IAM > Users

## 📋 Test Credentials

### Test Organization
```
Email: admin@test.com
Password: password123
```

### Test Payment (Paystack)
```
Card: 4084084084084081
Expiry: Any future date
CVV: Any 3 digits
```

## 🎯 Key Features

### Check-In Methods (4 Options)
1. **Manual Entry** - Type staff ID
2. **QR Code** - Scan unique QR
3. **Fingerprint** - Touch sensor (WebAuthn)
4. **Face Recognition** - Look at camera (AWS AI)

### Dashboard Views
- Overview with 6 stat cards
- Absent staff list
- Currently in workplace
- Late arrivals
- Early departures  
- Attendance history with filters

### Payment Plans
- **Basic:** ₦5,000/month (50 staff)
- **Professional:** ₦15,000/month (200 staff, biometrics)
- **Enterprise:** ₦30,000/month (unlimited, all features)

## 🔒 Security Features

- Organization passcode lock
- Email + passcode authentication
- Multi-tenant data isolation
- Biometric credential storage
- Session-based access

## 📱 How to Test

### 1. Register Organization
```
1. Go to /register
2. Fill organization details
3. Set admin credentials
4. Login to dashboard
```

### 2. Setup Check-In
```
1. Go to Settings
2. Set check-in passcode (e.g., "1234")
3. Configure work hours
4. Save settings
```

### 3. Add Staff
```
1. Go to Staff Management
2. Click "Add Staff"
3. Fill details
4. Download QR code
5. (Optional) Register biometrics
```

### 4. Test Check-In
```
1. Go to /checkin
2. Enter org email + passcode
3. Try all 4 check-in methods
4. View results in dashboard
```

### 5. Test Payment
```
1. Go to /pricing
2. Choose a plan
3. Click "Start Free Trial"
4. Use test card
5. Complete payment
```

## 🐛 Troubleshooting

### "Cannot find module @aws-sdk/client-rekognition"
```bash
npm install @aws-sdk/client-rekognition
```

### Fingerprint not working?
- Ensure HTTPS (or localhost)
- Check device has biometric sensor
- Try different browser (Chrome/Safari/Edge)

### Face recognition not working?
- In development: It uses mock data (should work)
- In production: Add AWS credentials

### Payment not working?
- Add Paystack test keys
- Check callback URL is accessible
- Verify test card details

## 📚 Documentation

- `INSTALLATION.md` - Detailed setup guide
- `FEATURES_GUIDE.md` - Complete feature documentation  
- `BIOMETRIC_IMPLEMENTATION.md` - Technical details
- `SETUP_COMPLETE.md` - Implementation summary

## 🎉 You're Ready!

Everything is implemented and functional. Start testing now!

### Quick Test Checklist:
- [ ] Install dependencies
- [ ] Setup .env.local
- [ ] Run npm run dev
- [ ] Register organization
- [ ] Set check-in passcode
- [ ] Add test staff
- [ ] Test all 4 check-in methods
- [ ] View dashboard
- [ ] Export attendance CSV
- [ ] Test payment flow

## 💡 Pro Tips

1. **Development Mode:** Works without any API keys
2. **Fingerprint:** Uses device sensor (no setup needed)
3. **Face Recognition:** Mock data in dev, AWS in production
4. **Payment:** Test mode available (no real charges)
5. **All Features:** Functional and ready to test

## 🚀 Start Now!

```bash
npm install @aws-sdk/client-rekognition
cp .env.example .env.local
npm run dev
```

Visit http://localhost:3000 and start testing! 🎊
