# Super Admin Owner Panel Setup

This document describes how to set up and use the Super Admin Owner Panel for TimeWise.

## Overview

The Super Admin Owner Panel is a comprehensive management interface that allows platform owners to:
- Monitor all organizations and users
- View system-wide analytics and metrics
- Manage subscriptions and payments
- Access audit logs
- Configure system settings
- Generate reports

## Initial Setup

### 1. Configure Environment Variables

Add the following variables to your `.env` file:

```bash
# JWT Secret (required for authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Super Admin Credentials
SUPER_ADMIN_SEED_EMAIL=admin@timewise.com
SUPER_ADMIN_SEED_PASSWORD=ChangeThisSecurePassword123!
SUPER_ADMIN_FIRST_NAME=Super
SUPER_ADMIN_LAST_NAME=Admin
```

**Important:** Change these values in production!

### 2. Run the Seed Script

Create the initial super admin account by running:

```bash
npm run seed:super-admin
```

Or directly:

```bash
npx tsx scripts/seed-super-admin.ts
```

This script will:
- Create the first super admin account in the `super_admins` collection
- Hash the password using bcrypt
- Create all required database indexes for optimal performance
- Set up collections: `super_admins`, `system_audit_logs`, `paystack_webhooks`, `platform_stats_cache`

### 3. Access the Owner Panel

Navigate to: `http://localhost:3000/owner/login`

Use the credentials you configured in the environment variables to log in.

## Architecture

### Authentication

- **JWT-based authentication** with 24-hour token expiration
- Tokens include `role: "super_admin"` to distinguish from regular users
- All `/owner/*` routes are protected and require super admin authentication

### Database Collections

1. **super_admins** - Stores super admin accounts (separate from tenant users)
2. **system_audit_logs** - Records all administrative actions
3. **paystack_webhooks** - Logs payment webhook events
4. **platform_stats_cache** - Caches expensive analytics calculations (5-minute TTL)

### API Routes

All super admin API routes are under `/api/owner/`:

- `/api/owner/auth/login` - Login endpoint
- `/api/owner/auth/logout` - Logout endpoint
- `/api/owner/auth/me` - Get current super admin info

## Security Features

1. **Password Hashing**: All passwords are hashed using bcrypt with 12 salt rounds
2. **JWT Tokens**: Secure token-based authentication
3. **Audit Logging**: All actions are logged with IP address and user agent
4. **Role Validation**: Every request validates the `super_admin` role
5. **Account Status**: Inactive accounts cannot log in

## Files Created

### Types and Interfaces
- `lib/types/super-admin.ts` - TypeScript interfaces for super admin functionality
- `lib/errors/super-admin-errors.ts` - Custom error types and codes

### Authentication
- `lib/auth/super-admin.ts` - Authentication middleware and JWT utilities

### API Routes
- `app/api/owner/auth/login/route.ts` - Login endpoint
- `app/api/owner/auth/logout/route.ts` - Logout endpoint
- `app/api/owner/auth/me/route.ts` - Get current user endpoint

### Frontend
- `app/owner/login/page.tsx` - Login page UI

### Scripts
- `scripts/seed-super-admin.ts` - Database seeding script

## Next Steps

After completing this initial setup, you can proceed with implementing:

1. Dashboard overview with analytics
2. Organization management
3. User management
4. Payment and billing monitoring
5. System analytics
6. Audit logs viewer
7. Reports and exports
8. System settings
9. Health monitoring

Refer to `.kiro/specs/super-admin-owner-panel/tasks.md` for the complete implementation plan.

## Troubleshooting

### "Super admin already exists" error
If you need to reset the super admin account:
1. Connect to MongoDB
2. Delete the existing super admin: `db.super_admins.deleteOne({ email: "admin@timewise.com" })`
3. Run the seed script again

### "Invalid token" error
- Check that `JWT_SECRET` is set in your environment
- Ensure the token hasn't expired (24-hour expiration)
- Clear localStorage and log in again

### Database connection issues
- Verify `MONGODB_URI` is correctly set
- Ensure MongoDB is running
- Check network connectivity

## Security Best Practices

1. **Change default credentials** immediately after first login
2. **Use strong passwords** (minimum 8 characters, uppercase, lowercase, numbers)
3. **Keep JWT_SECRET secure** and never commit it to version control
4. **Rotate secrets regularly** in production
5. **Monitor audit logs** for suspicious activity
6. **Use HTTPS** in production
7. **Implement rate limiting** on authentication endpoints (future enhancement)

## Support

For issues or questions, refer to:
- Design document: `.kiro/specs/super-admin-owner-panel/design.md`
- Requirements: `.kiro/specs/super-admin-owner-panel/requirements.md`
- Tasks: `.kiro/specs/super-admin-owner-panel/tasks.md`
