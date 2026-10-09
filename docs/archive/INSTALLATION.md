# Installation & Setup Guide

## 📦 Install Dependencies

```bash
# Install AWS SDK for Rekognition
npm install @aws-sdk/client-rekognition

# Or if using yarn
yarn add @aws-sdk/client-rekognition
```

## 🔧 Environment Variables Setup

1. Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

2. Fill in your environment variables:

### Database
```env
MONGODB_URI=mongodb://localhost:27017/staff-checkin
```

### JWT Secret
```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

### Paystack (Get from https://dashboard.paystack.com/#/settings/developers)
```env
PAYSTACK_SECRET_KEY=sk_test_your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_paystack_public_key
```

**How to get Paystack keys:**
1. Sign up at https://paystack.com
2. Go to Settings > API Keys & Webhooks
3. Copy your Test keys (use Live keys in production)

### AWS Rekognition (Get from AWS Console)
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_REKOGNITION_COLLECTION_ID=staff-faces
```

**How to get AWS credentials:**
1. Sign up at https://aws.amazon.com
2. Go to IAM > Users > Create User
3. Attach policy: `AmazonRekognitionFullAccess`
4. Create access key and copy credentials
5. Enable Rekognition in your region

### App Configuration
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## 🚀 Run the Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 🧪 Testing Features

### 1. Basic Check-In (No Payment Required)
- QR Code scanning ✅
- Manual entry ✅
- Works immediately

### 2. Fingerprint Authentication (No Payment Required)
- Uses WebAuthn (built into browsers)
- Works on Mac (Touch ID), Windows (Windows Hello), iPhone (Face ID/Touch ID)
- No additional setup needed

### 3. Face Recognition (Requires AWS or Development Mode)

**Development Mode (No AWS needed):**
- Set `NODE_ENV=development`
- Face recognition will use mock data
- Perfect for testing UI/UX

**Production Mode (Requires AWS):**
- Set up AWS credentials
- Face recognition uses AWS Rekognition
- Accurate AI-powered matching

### 4. Payment Integration (Requires Paystack)

**Test Mode:**
- Use Paystack test keys
- Test card: `4084084084084081`
- Any future expiry date
- Any CVV

**Live Mode:**
- Use Paystack live keys
- Real payments processed

## 📋 Feature Availability by Plan

### Basic Plan (₦5,000/month)
- ✅ QR Code check-in
- ✅ Manual entry
- ✅ Up to 50 staff
- ❌ Fingerprint
- ❌ Face recognition

### Professional Plan (₦15,000/month)
- ✅ QR Code check-in
- ✅ Manual entry
- ✅ Fingerprint authentication
- ✅ Face recognition (AWS AI)
- ✅ Up to 200 staff

### Enterprise Plan (₦30,000/month)
- ✅ All features
- ✅ Unlimited staff
- ✅ API access
- ✅ Priority support

## 🔐 Security Notes

1. **Never commit `.env.local` to git**
2. **Use strong JWT_SECRET in production**
3. **Enable AWS MFA for production**
4. **Use Paystack live keys only in production**
5. **Enable HTTPS in production**

## 🐛 Troubleshooting

### Fingerprint not working?
- Check browser compatibility (Chrome, Safari, Edge)
- Ensure HTTPS (required for WebAuthn)
- Check device has biometric sensor

### Face recognition not working?
- In development: Check `NODE_ENV=development`
- In production: Verify AWS credentials
- Check AWS Rekognition is enabled in your region

### Payment not working?
- Verify Paystack keys are correct
- Check test mode vs live mode
- Ensure callback URL is accessible

## 📞 Support

Need help? Contact support@clockin.app
