# Multi-Tenant Clock-In ERP System

A modern, secure, multi-tenant attendance management system where each organization gets their own isolated workspace.

## 🎯 Architecture Overview

### Multi-Tenancy Model
- **Complete Data Isolation**: Each organization's data is strictly separated using `tenantId` filters
- **Secure Authentication**: JWT tokens with embedded tenant context
- **Automatic Isolation**: TenantDatabase class ensures all queries include tenant filter
- **Role-Based Access**: Organization admins, managers, and staff roles

### Tech Stack
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with tenant-aware queries
- **Auth**: JWT + bcrypt password hashing
- **QR Codes**: Base64 encoded with tenant validation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB 6+
- npm or pnpm

### Installation

1. **Clone and Install**
```bash
cd staff-checkin-system
npm install
```

2. **Configure Environment**
```bash
# Copy the example env file
cp env.example.txt .env.local

# Edit .env.local with your settings
MONGODB_URI=mongodb://localhost:27017/staff_checkin
JWT_SECRET=your-secure-random-secret-here
```

3. **Run Database Migration** (if you have existing data)
```bash
npx ts-node scripts/migrate-to-multitenant.ts
```

4. **Start Development Server**
```bash
npm run dev
```

5. **Open Application**
```
http://localhost:3000
```

## 📋 Features

### For Organizations
- ✅ **Self-Service Registration**: Organizations can sign up themselves
- ✅ **Isolated Workspaces**: Complete data separation per organization
- ✅ **Custom Subdomains**: Each org gets their own subdomain
- ✅ **Free Trial**: 14-day trial with up to 10 staff members
- ✅ **Flexible Settings**: Configure work hours, lateness rules, etc.

### For Administrators
- ✅ **Staff Management**: Register, update, and deactivate staff
- ✅ **QR Code Generation**: Automatic QR codes with tenant validation
- ✅ **Real-Time Dashboard**: See who's present, late, or absent
- ✅ **Attendance Reports**: Filter by date, staff, department
- ✅ **Settings Control**: Manage organization-specific settings

### For Staff
- ✅ **Multiple Check-In Methods**: QR code scan or manual entry
- ✅ **Automatic Lateness Detection**: Based on configured rules
- ✅ **Check-In/Out Tracking**: Complete attendance history

## 🏗️ Project Structure

```
staff-checkin-system/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── layout.tsx        # Dashboard layout with sidebar
│   │   └── dashboard/        # Main dashboard page
│   ├── api/
│   │   ├── auth/             # Authentication endpoints
│   │   │   ├── register/     # Organization registration
│   │   │   ├── login/        # User login
│   │   │   └── me/           # Get current user
│   │   ├── staff/            # Staff management
│   │   ├── attendance/       # Check-in/out
│   │   └── dashboard/        # Dashboard stats
│   ├── landing/              # Public landing page
│   ├── login/                # Login page
│   ├── register/             # Organization signup
│   └── page.tsx              # Root redirect
├── lib/
│   ├── auth/                 # Authentication utilities
│   │   ├── password.ts       # bcrypt hashing
│   │   ├── jwt.ts            # JWT generation/validation
│   │   └── middleware.ts     # Auth middleware
│   ├── database/
│   │   ├── tenant-db.ts      # TenantDatabase class
│   │   └── validation.ts     # Input validation
│   ├── types/
│   │   └── index.ts          # TypeScript interfaces
│   └── mongodb.ts            # Database connection
├── scripts/
│   └── migrate-to-multitenant.ts  # Migration script
└── components/               # React components
```

## 🔒 Security Features

### Data Isolation
```typescript
// All queries automatically include tenantId
const tenantDb = createTenantDatabase(db, context.tenantId)
const staff = await tenantDb.find("staff", { department: "IT" })
// Actual query: { tenantId: "...", department: "IT" }
```

### Authentication Flow
1. User logs in with email/password
2. System validates credentials
3. JWT token generated with `{ userId, tenantId, role, email }`
4. Token included in all subsequent requests
5. Middleware extracts tenant context from token
6. All database operations use tenant context

### QR Code Security
```typescript
// QR codes contain encrypted tenant information
const qrData = {
  tenantId: "org-123",
  staffId: "STAFF-456",
  version: "1.0"
}
// Validated on check-in to prevent cross-tenant access
```

## 🗄️ Database Schema

### Collections

**organizations**
```typescript
{
  _id: ObjectId,
  name: string,
  subdomain: string (unique),
  adminEmail: string,
  status: "active" | "suspended" | "trial",
  subscriptionTier: "free" | "professional" | "enterprise",
  createdAt: Date,
  settings: {
    latenessTime: "09:00",
    workStartTime: "09:00",
    workEndTime: "17:00",
    maxStaff: number,
    allowedMethods: ["qr", "manual"],
    timezone: "UTC"
  }
}
```

**users**
```typescript
{
  _id: ObjectId,
  tenantId: string (refs organizations),
  email: string (unique),
  password: string (hashed),
  role: "super_admin" | "org_admin" | "manager" | "staff",
  firstName: string,
  lastName: string,
  isActive: boolean,
  createdAt: Date,
  lastLogin: Date
}
```

**staff**
```typescript
{
  _id: ObjectId,
  tenantId: string,
  staffId: string (unique within tenant),
  name: string,
  email: string,
  department: string,
  position: string,
  qrCode: string (base64),
  isActive: boolean,
  createdAt: Date
}
```

**attendance**
```typescript
{
  _id: ObjectId,
  tenantId: string,
  staffId: string,
  staffName: string,
  department: string,
  type: "check-in" | "check-out",
  timestamp: Date,
  date: "YYYY-MM-DD",
  isLate: boolean,
  method: "qr" | "manual"
}
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new organization
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

### Staff Management
- `GET /api/staff` - List all staff (tenant-filtered)
- `POST /api/staff` - Register new staff member
- `GET /api/staff/[staffId]` - Get staff details
- `PATCH /api/staff/[staffId]` - Update staff
- `DELETE /api/staff/[staffId]` - Delete staff

### Attendance
- `POST /api/attendance` - Check in/out
- `GET /api/attendance` - Get attendance logs

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

## 🧪 Testing

### Manual Testing Checklist

**Organization Registration**
- [ ] Register new organization with valid data
- [ ] Try duplicate subdomain (should fail)
- [ ] Try duplicate email (should fail)
- [ ] Verify password strength validation

**Login & Authentication**
- [ ] Login with valid credentials
- [ ] Try invalid credentials (should fail)
- [ ] Verify JWT token is stored
- [ ] Access protected route without token (should redirect)

**Staff Management**
- [ ] Register new staff member
- [ ] View all staff (should only see own org's staff)
- [ ] Update staff information
- [ ] Delete staff member

**Attendance**
- [ ] Check in with QR code
- [ ] Check in manually with staff ID
- [ ] Verify lateness detection
- [ ] Check out
- [ ] Try duplicate check-in same day (should fail)

**Data Isolation**
- [ ] Register second organization
- [ ] Login as Org B admin
- [ ] Verify cannot see Org A's staff
- [ ] Try using Org A's QR code (should fail)

## 🔧 Configuration

### Environment Variables
```bash
# Required
MONGODB_URI=mongodb://localhost:27017/staff_checkin
JWT_SECRET=your-secret-key-change-in-production

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Organization Settings
Configurable per organization:
- **Lateness Time**: When employees are considered late
- **Work Hours**: Start and end times
- **Max Staff**: Maximum number of employees
- **Allowed Methods**: QR, manual, face, fingerprint
- **Timezone**: Organization timezone

## 📦 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Important Production Steps
1. Set strong `JWT_SECRET` environment variable
2. Use production MongoDB URI
3. Enable HTTPS
4. Configure CORS if needed
5. Set up backup strategy
6. Monitor database indexes performance

## 🐛 Troubleshooting

### Common Issues

**"Invalid token" errors**
- Check JWT_SECRET is set correctly
- Verify token hasn't expired (24h default)
- Clear localStorage and login again

**"Cross-tenant access denied"**
- QR code might be from different organization
- Verify user has correct permissions
- Check tenantId in JWT matches request

**Database connection errors**
- Verify MONGODB_URI is correct
- Check MongoDB is running
- Ensure network connectivity

## 📝 Migration from Single-Tenant

If you have existing data:

1. **Backup your database**
```bash
mongodump --db staff_checkin --out backup/
```

2. **Run migration script**
```bash
npx ts-node scripts/migrate-to-multitenant.ts
```

3. **Verify migration**
- Login with legacy credentials (admin@legacy.local / admin123)
- Check all staff are visible
- Verify attendance logs are intact

4. **Change default password**
- Login and update admin password immediately

## 🤝 Contributing

When adding new features:
1. Always use `TenantDatabase` class for database operations
2. Include `withAuth` middleware in protected routes
3. Add `tenantId` field to new collections
4. Create database indexes with `tenantId` as first field
5. Test data isolation between organizations

## 📄 License

MIT License - feel free to use for your projects!

## 🎉 What's Next?

Future enhancements:
- [ ] Super admin dashboard
- [ ] Subdomain-based routing (org1.domain.com)
- [ ] Email notifications
- [ ] Advanced reporting and analytics
- [ ] Mobile app
- [ ] Biometric authentication
- [ ] Integration webhooks
- [ ] Custom branding per organization

---

**Need Help?** Check the code comments or create an issue!
