# Implementation Plan

- [x] 1. Set up super admin authentication foundation


  - Create super_admins MongoDB collection schema

  - Implement super admin JWT authentication middleware
  - Create seed script to initialize first super admin account
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 12.1_


- [x] 1.1 Create super admin types and interfaces




  - Define SuperAdmin, SuperAdminJWTPayload, and SuperAdminContext interfaces in lib/types/super-admin.ts
  - Define error types and codes in lib/errors/super-admin-errors.ts
  - _Requirements: 1.1, 12.1_





- [x] 1.2 Implement super admin authentication middleware
  - Create lib/auth/super-admin.ts with withSuperAdminAuth function
  - Extend JWT generation to support super_admin role
  - Add token validation for super admin routes
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.9_

- [x] 1.3 Create super admin seed script
  - Write scripts/seed-super-admin.ts to create initial super admin from env variables
  - Hash password using bcrypt
  - Create database indexes for super_admins collection
  - _Requirements: 1.1, 1.7_

- [x] 1.4 Build super admin login page and API


  - Create app/owner/login/page.tsx with email/password form
  - Implement /api/owner/auth/login/route.ts to validate credentials and issue JWT
  - Implement /api/owner/auth/logout/route.ts
  - Implement /api/owner/auth/me/route.ts to get current super admin info
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.8_


- [-] 2. Create database collections and indexes


  - Set up system_audit_logs, paystack_webhooks, and platform_stats_cache collections
  - Create all required database indexes for performance
  - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 2.1 Create audit logs collection and schema


  - Define SystemAuditLog interface with all required fields
  - Create indexes on timestamp, actorId, and tenantId
  - _Requirements: 12.2_

- [x] 2.2 Create Paystack webhooks collection


  - Define PaystackWebhook interface
  - Create index on timestamp and tenantId
  - Update existing webhook handler to log events
  - _Requirements: 12.3_

- [x] 2.3 Create platform stats cache collection

  - Define PlatformStatsCache interface
  - Create TTL index on expiresAt field for auto-expiration
  - _Requirements: 12.4_

- [x] 2.4 Verify and extend organizations collection schema

  - Ensure organizations collection has status, subscriptionTier, subscriptionStatus, trialEnds fields
  - Create indexes on status and createdAt
  - _Requirements: 12.5_

- [ ] 3. Implement core service layer

  - Build modular services for analytics, audit logging, organization management, and user management
  - Implement caching strategy for expensive operations
  - _Requirements: 2.1, 2.2, 2.3, 2.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 15.4_

- [ ] 3.1 Create audit service
  - Implement lib/services/audit.ts with AuditService class
  - Add createLog, getLogs, exportLogs, and getRecentLogs methods
  - Include IP address and user agent tracking
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 15.2_

- [ ] 3.2 Create analytics service
  - Implement lib/services/analytics.ts with AnalyticsService class
  - Add methods for dashboard stats, revenue growth, org growth, subscription distribution
  - Implement caching with 5-minute TTL using platform_stats_cache
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 15.4_

- [ ] 3.3 Create organization service
  - Implement lib/services/organization.ts with OrganizationService class
  - Add methods for getAllOrganizations, getOrganizationDetails, suspend, activate, delete, updateSubscriptionPlan
  - Implement pagination with 50 records per page
  - Create audit logs for all actions
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 15.3, 15.6_

- [ ] 3.4 Create user management service
  - Implement lib/services/user-management.ts with UserManagementService class
  - Add methods for getAllUsers, suspendUser, deleteUser, resetUserPassword, sendEmailToUser
  - Implement pagination and filtering
  - Create audit logs for all actions
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 15.3_

- [ ] 4. Extend Paystack service for super admin features
  - Add methods to fetch all transactions, subscriptions, and plans across all tenants
  - Implement transaction statistics calculation
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 15.5_

- [ ] 4.1 Add Paystack data fetching methods
  - Extend lib/services/paystack.ts with getAllTransactions, getAllSubscriptions, getAllPlans
  - Add getTransactionStats method for revenue analytics
  - Implement pagination for large datasets
  - _Requirements: 5.1, 5.2, 5.3, 5.6_

- [ ] 4.2 Create Paystack webhook logging
  - Update /api/webhooks/paystack/route.ts to log events to paystack_webhooks collection
  - Store event type, tenant info, amount, status, and raw payload
  - _Requirements: 5.7_

- [ ] 5. Build super admin layout and navigation
  - Create responsive layout with sidebar navigation
  - Implement route protection on client side
  - Add header with user menu and notifications
  - _Requirements: 14.1, 14.2_

- [ ] 5.1 Create super admin layout component
  - Build app/owner/layout.tsx with sidebar and header
  - Add navigation links for all super admin pages
  - Implement client-side route protection
  - _Requirements: 14.1_

- [ ] 5.2 Create reusable UI components
  - Build components/owner/shared/DataTable.tsx for reusable tables
  - Build components/owner/shared/Pagination.tsx
  - Build components/owner/shared/SearchInput.tsx
  - Build components/owner/shared/DateRangePicker.tsx
  - Build components/owner/shared/LoadingSkeleton.tsx
  - _Requirements: 14.2, 14.3, 14.4_

- [ ] 6. Implement dashboard overview page
  - Create dashboard page with stat cards and charts
  - Fetch and display key metrics using analytics service
  - Implement time period filtering
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 6.1 Create dashboard stat cards
  - Build components/owner/dashboard/StatCard.tsx component
  - Display Total Organizations, Active Users, Active Subscriptions, Total Revenue, MRR, Active/Suspended Tenants, Daily Check-ins
  - Add loading skeletons
  - _Requirements: 2.1, 14.7_

- [ ] 6.2 Create revenue growth chart
  - Build components/owner/dashboard/RevenueChart.tsx using Recharts
  - Implement line chart showing revenue over time
  - Add time period filter (Day/Week/Month/Year)
  - _Requirements: 2.2, 2.6_

- [ ] 6.3 Create organization growth chart
  - Build components/owner/dashboard/OrgGrowthChart.tsx using Recharts
  - Implement bar chart showing new organizations per month
  - _Requirements: 2.3_

- [ ] 6.4 Create subscription distribution chart
  - Build components/owner/dashboard/SubscriptionPieChart.tsx using Recharts
  - Implement pie chart showing plan distribution
  - _Requirements: 2.4_

- [ ] 6.5 Create payment success rate chart
  - Build components/owner/dashboard/PaymentDonutChart.tsx using Recharts
  - Implement donut chart showing success vs failed payments
  - _Requirements: 2.5_

- [ ] 6.6 Build dashboard page
  - Create app/owner/dashboard/page.tsx
  - Integrate all stat cards and charts
  - Implement /api/owner/analytics/overview/route.ts
  - Add time period filtering
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [ ] 7. Build organizations management page
  - Create organizations list with search, filters, and actions
  - Implement organization details view
  - Add suspend, activate, delete, and plan update functionality
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [ ] 7.1 Create organizations table component
  - Build components/owner/organizations/OrganizationTable.tsx
  - Display columns: Name, Subdomain, Admin Email, Plan, Status, Trial Ends, Created At
  - Implement pagination
  - _Requirements: 3.1, 15.3_

- [ ] 7.2 Create organization filters and search
  - Build components/owner/organizations/OrganizationFilters.tsx
  - Add search by name, subdomain, or email
  - Add filters for status and subscription tier
  - _Requirements: 3.2_

- [ ] 7.3 Create organization actions component
  - Build components/owner/organizations/OrganizationActions.tsx
  - Add View Details, Suspend, Activate, Delete, Send Email buttons
  - Implement confirmation modals using shadcn/ui Dialog
  - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7, 15.6_

- [ ] 7.4 Create organization details page
  - Build app/owner/organizations/[id]/page.tsx
  - Display all users, subscription info, recent payments, analytics, and audit logs
  - Implement /api/owner/organizations/[id]/route.ts
  - _Requirements: 3.3_

- [ ] 7.5 Build organizations list page and APIs
  - Create app/owner/organizations/page.tsx
  - Implement /api/owner/organizations/route.ts for listing
  - Implement /api/owner/organizations/[id]/suspend/route.ts
  - Implement /api/owner/organizations/[id]/activate/route.ts
  - Implement /api/owner/organizations/[id]/delete/route.ts
  - Implement /api/owner/organizations/[id]/plan/route.ts
  - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.6, 3.8_

- [ ] 8. Build users management page
  - Create users list with search, filters, and actions
  - Implement suspend, delete, reset password, and send email functionality
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 8.1 Create users table component
  - Build components/owner/users/UserTable.tsx
  - Display columns: Name, Email, Role, Tenant Name, Status, Last Login
  - Implement pagination
  - _Requirements: 4.1, 15.3_

- [ ] 8.2 Create user filters and search
  - Build components/owner/users/UserFilters.tsx
  - Add search by name, email, or tenant
  - Add filters for role and status
  - _Requirements: 4.2, 4.6_

- [ ] 8.3 Create user actions component
  - Build components/owner/users/UserActions.tsx
  - Add Suspend, Delete, Reset Password, Send Email buttons
  - Implement confirmation modals
  - _Requirements: 4.3, 4.4, 4.5_

- [ ] 8.4 Build users page and APIs
  - Create app/owner/users/page.tsx
  - Implement /api/owner/users/route.ts for listing
  - Implement /api/owner/users/[id]/suspend/route.ts
  - Implement /api/owner/users/[id]/delete/route.ts
  - Implement /api/owner/users/[id]/reset-password/route.ts
  - Implement /api/owner/users/[id]/send-email/route.ts
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 9. Build payments and billing page
  - Create payments overview with transactions, subscriptions, and webhook logs
  - Display payment statistics and revenue analytics
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

- [ ] 9.1 Create transaction table component
  - Build components/owner/payments/TransactionTable.tsx
  - Display all Paystack transactions with pagination
  - _Requirements: 5.1_

- [ ] 9.2 Create subscription table component
  - Build components/owner/payments/SubscriptionTable.tsx
  - Display all active subscriptions
  - _Requirements: 5.1_

- [ ] 9.3 Create webhook logs table
  - Build components/owner/payments/WebhookLogTable.tsx
  - Display Event, Organization, Plan, Status, Amount, Date columns
  - _Requirements: 5.7_

- [ ] 9.4 Create payment statistics component
  - Build components/owner/payments/PaymentStats.tsx
  - Display total revenue, top paying orgs, failed payments, upcoming renewals
  - Show revenue chart by plan type
  - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 9.5 Build payments page and APIs
  - Create app/owner/payments/page.tsx
  - Implement /api/owner/payments/transactions/route.ts
  - Implement /api/owner/payments/subscriptions/route.ts
  - Implement /api/owner/payments/plans/route.ts
  - Implement /api/owner/payments/stats/route.ts
  - Implement /api/owner/payments/webhook-logs/route.ts
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ] 10. Build system analytics page
  - Create analytics page with global system statistics
  - Display check-ins, late arrivals, attendance logs, org growth, staff ratios, photo verification rate
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 10.1 Create analytics stat cards
  - Display today's check-ins, late arrivals, total attendance logs
  - Show active vs inactive staff ratio
  - Display photo verification usage rate
  - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6_

- [ ] 10.2 Create analytics charts
  - Build organization growth chart (monthly)
  - Create most active tenants list
  - Add time period filter
  - _Requirements: 6.4, 6.7, 6.8_

- [ ] 10.3 Build analytics page and APIs
  - Create app/owner/analytics/page.tsx
  - Implement /api/owner/analytics/system/route.ts
  - Fetch data from attendance, organizations, and users collections
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

- [ ] 11. Build audit logs page
  - Create audit logs viewer with filtering and export
  - Display real-time recent logs
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 11.1 Create audit log table component
  - Build components/owner/logs/AuditLogTable.tsx
  - Display Actor, Role, Tenant, Action, Timestamp, IP Address columns
  - Implement pagination
  - _Requirements: 7.1, 15.3_

- [ ] 11.2 Create log filters component
  - Build components/owner/logs/LogFilters.tsx
  - Add search by actor, action, or tenant
  - Add action type filter dropdown
  - Add date range picker
  - _Requirements: 7.2, 7.3, 7.4_

- [ ] 11.3 Create recent logs component
  - Build components/owner/logs/RecentLogs.tsx
  - Display 10 most recent actions in real-time
  - Use polling or server-sent events
  - _Requirements: 7.7_

- [ ] 11.4 Build audit logs page and APIs
  - Create app/owner/logs/page.tsx
  - Implement /api/owner/logs/route.ts with filtering
  - Implement /api/owner/logs/export/route.ts for CSV export
  - Implement /api/owner/logs/recent/route.ts
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 12. Build reports and exports page
  - Create report generation interface
  - Implement CSV, Excel, and PDF export functionality
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 12.1 Create report service
  - Implement lib/services/reports.ts with ReportService class
  - Add methods for revenue, org growth, attendance, payment, and user activity reports
  - Implement exportToCSV, exportToExcel, exportToPDF methods
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 12.2 Create report generator component
  - Build components/owner/reports/ReportGenerator.tsx
  - Add report type selector and date range picker
  - Add export format buttons (CSV, Excel, PDF)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 12.3 Build reports page and APIs
  - Create app/owner/reports/page.tsx
  - Implement /api/owner/reports/revenue/route.ts
  - Implement /api/owner/reports/growth/route.ts
  - Implement /api/owner/reports/attendance/route.ts
  - Implement /api/owner/reports/payments/route.ts
  - Implement /api/owner/reports/users/route.ts
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ] 13. Build system settings page
  - Create settings interface for API keys, maintenance mode, and system limits
  - Implement settings update functionality
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 15.1_

- [ ] 13.1 Create settings form components
  - Build forms for API keys (Resend, Paystack, AWS Rekognition)
  - Add maintenance mode toggle
  - Add trial duration and global limits inputs
  - Add API rate limit configuration
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 15.1_

- [ ] 13.2 Build settings page and APIs
  - Create app/owner/settings/page.tsx
  - Implement /api/owner/settings/route.ts (GET/PUT)
  - Implement /api/owner/settings/maintenance/route.ts
  - Implement /api/owner/settings/backup/route.ts
  - Encrypt sensitive API keys before storage
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 15.1_

- [ ] 14. Build system health monitoring page
  - Create health dashboard showing system status
  - Display uptime, error rates, and service health
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 14.1 Create health metrics components
  - Display system uptime percentage
  - Show API error rate
  - Display email delivery success rate
  - Show payment webhook failure count
  - Display MongoDB connection status
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 14.2 Build health page and API
  - Create app/owner/health/page.tsx
  - Implement /api/owner/health/route.ts
  - Monitor MongoDB connection and display alerts
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 15. Implement notifications center
  - Create notifications system for platform events
  - Display new org signups, payment events
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 15.1 Create notifications component
  - Build components/owner/layout/NotificationsCenter.tsx
  - Display recent platform events (new orgs, payments)
  - Implement real-time updates using polling or SSE
  - Add click-to-navigate functionality
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 16. Security and performance optimization
  - Implement rate limiting on API routes
  - Add input validation and sanitization
  - Optimize database queries and add caching
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7_

- [ ] 16.1 Implement security measures
  - Add rate limiting middleware for all /api/owner routes
  - Implement input validation using Zod schemas
  - Add CORS configuration
  - Ensure all sensitive data is encrypted
  - _Requirements: 15.1, 15.2, 15.5, 15.7_

- [ ] 16.2 Optimize performance
  - Verify all database indexes are created
  - Implement caching for dashboard metrics
  - Optimize pagination queries
  - Add compression for API responses
  - _Requirements: 15.3, 15.4_

- [ ] 17. Documentation and deployment
  - Create user documentation for super admin panel
  - Update environment variables documentation
  - Deploy and test in production
  - _Requirements: All_

- [ ] 17.1 Create documentation
  - Document super admin features and usage
  - Update .env.example with new variables
  - Create deployment guide
  - Document seed script usage

- [ ] 17.2 Deploy to production
  - Run seed script to create first super admin
  - Verify all environment variables are set
  - Test all features in production
  - Monitor for errors and performance issues
