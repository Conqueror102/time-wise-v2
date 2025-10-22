# Requirements Document

## Introduction

The Super Admin Owner Panel is a comprehensive management interface for the TimeWise Multi-Tenant Attendance Management System. THE System SHALL enable the platform owner to oversee all organizations, manage users, monitor subscriptions, analyze system-wide metrics, track audit logs, and configure platform settings. THE System SHALL provide real-time analytics, payment integration with Paystack, and administrative controls to ensure efficient platform operation and scalability.

## Glossary

- **System**: The Super Admin Owner Panel module of TimeWise
- **Super_Admin**: A platform owner stored in the super_admins collection who authenticates with email/password and has full access to all system features
- **Super_Admins_Collection**: MongoDB collection storing super admin accounts separately from tenant users
- **Seed_Script**: A script that creates initial super admin accounts in the super_admins collection
- **Tenant**: An organization using the TimeWise platform (stored in organizations collection)
- **Tenant_Admin**: An organization administrator with role "org_admin"
- **Staff_Member**: An employee within a tenant organization
- **Paystack**: Nigerian payment gateway used for subscription billing
- **MRR**: Monthly Recurring Revenue from all active subscriptions
- **Audit_Log**: A record of significant system actions performed by users
- **JWT**: JSON Web Token used for authentication
- **Resend**: Email service provider for system notifications
- **AWS_Rekognition**: Amazon service for facial recognition in photo verification
- **Recharts**: React charting library for data visualization
- **MongoDB**: NoSQL database storing all system data
- **Subscription_Status**: Current state of a tenant's subscription (active, trial, suspended, cancelled)

## Requirements

### Requirement 1: Super Admin Authentication and Seeding

**User Story:** As a platform owner, I want to create super admin accounts via a seed script and securely log in with JWT authentication, so that only authorized personnel can access platform management features.

#### Acceptance Criteria

1. WHEN THE Seed_Script is executed, THE System SHALL create super admin accounts in the Super_Admins_Collection with email, hashed password, firstName, lastName, isActive, createdAt, and updatedAt fields
2. WHEN THE Super_Admin navigates to /owner/login, THE System SHALL display a secure login form with email and password fields
3. WHEN THE Super_Admin submits credentials, THE System SHALL query the Super_Admins_Collection to validate email and verify hashed password
4. WHEN THE Super_Admin submits valid credentials, THE System SHALL generate a JWT token with role "super_admin", userId, and expiration time, then redirect to /owner/dashboard
5. WHEN THE Super_Admin submits invalid credentials, THE System SHALL display an error message and prevent access
6. WHEN THE Super_Admin accesses any /owner/* route without a valid JWT token with role "super_admin", THE System SHALL redirect to /owner/login
7. WHEN THE JWT token expires, THE System SHALL redirect THE Super_Admin to /owner/login
8. WHEN THE Super_Admin logs out, THE System SHALL clear the JWT token and redirect to /owner/login
9. WHEN THE System validates JWT tokens, THE System SHALL check token expiration and role "super_admin"

### Requirement 2: Dashboard Overview Analytics

**User Story:** As a platform owner, I want to view key system metrics at a glance, so that I can quickly assess platform health and performance.

#### Acceptance Criteria

1. WHEN THE Super_Admin views the dashboard, THE System SHALL display stat cards showing Total Organizations, Total Active Users, Total Active Subscriptions, Total Revenue, MRR, Active vs Suspended Tenants, and Daily Check-ins
2. WHEN THE Super_Admin views the dashboard, THE System SHALL display a line chart showing revenue growth over the selected time period
3. WHEN THE Super_Admin views the dashboard, THE System SHALL display a bar chart showing new organizations per month for the last 12 months
4. WHEN THE Super_Admin views the dashboard, THE System SHALL display a pie chart showing subscription plan distribution across all tenants
5. WHEN THE Super_Admin views the dashboard, THE System SHALL display a donut chart showing payment success vs failed transactions
6. WHEN THE Super_Admin selects a time filter (Day/Week/Month/Year), THE System SHALL update all charts to reflect the selected time period
7. WHEN THE System calculates Total Revenue, THE System SHALL aggregate all successful Paystack transactions across all tenants

### Requirement 3: Organization Management

**User Story:** As a platform owner, I want to view and manage all organizations on the platform, so that I can monitor tenant activity and take administrative actions when needed.

#### Acceptance Criteria

1. WHEN THE Super_Admin navigates to /owner/organizations, THE System SHALL display a paginated table with columns: Organization Name, Subdomain, Admin Email, Subscription Plan, Status, Trial Ends, Created At
2. WHEN THE Super_Admin enters text in the search field, THE System SHALL filter organizations by name, subdomain, or admin email
3. WHEN THE Super_Admin clicks "View Details" for a Tenant, THE System SHALL display all related users, current subscription info, recent payments, attendance analytics, and audit logs for that Tenant
4. WHEN THE Super_Admin clicks "Suspend" for an active Tenant, THE System SHALL update the Tenant status to "suspended" and create an Audit_Log entry
5. WHEN THE Super_Admin clicks "Activate" for a suspended Tenant, THE System SHALL update the Tenant status to "active" and create an Audit_Log entry
6. WHEN THE Super_Admin clicks "Delete" for a Tenant, THE System SHALL display a confirmation modal and upon confirmation delete the Tenant and all related data
7. WHEN THE Super_Admin clicks "Send Email" for a Tenant, THE System SHALL open a modal to compose and send an email via Resend to the Tenant_Admin
8. WHEN THE Super_Admin manually upgrades or downgrades a Tenant subscription plan, THE System SHALL update the Tenant subscriptionTier and create an Audit_Log entry

### Requirement 4: User Management

**User Story:** As a platform owner, I want to view and manage all users across all organizations, so that I can handle user-related issues and maintain platform security.

#### Acceptance Criteria

1. WHEN THE Super_Admin navigates to /owner/users, THE System SHALL display a paginated table with columns: Name, Email, Role, Tenant Name, Status, Last Login
2. WHEN THE Super_Admin enters text in the search field, THE System SHALL filter users by name, email, or tenant name
3. WHEN THE Super_Admin clicks "Suspend User", THE System SHALL set the user isActive field to false and create an Audit_Log entry
4. WHEN THE Super_Admin clicks "Reset Password" for a user, THE System SHALL generate a password reset token and send a reset email via Resend
5. WHEN THE Super_Admin clicks "Delete User", THE System SHALL display a confirmation modal and upon confirmation delete the user account
6. WHEN THE Super_Admin filters by role, THE System SHALL display only users with the selected role (org_admin, manager, staff)

### Requirement 5: Subscription and Billing Management

**User Story:** As a platform owner, I want to monitor all subscription and payment activity through Paystack integration, so that I can track revenue and identify payment issues.

#### Acceptance Criteria

1. WHEN THE Super_Admin navigates to /owner/payments, THE System SHALL fetch and display all transactions from Paystack API
2. WHEN THE Super_Admin views the payments page, THE System SHALL display total revenue analytics for daily and monthly periods
3. WHEN THE Super_Admin views the payments page, THE System SHALL display a list of top paying organizations ranked by total payment amount
4. WHEN THE Super_Admin views the payments page, THE System SHALL display failed payment logs with Tenant information
5. WHEN THE Super_Admin views the payments page, THE System SHALL display upcoming subscription renewals within the next 30 days
6. WHEN THE Super_Admin views the payments page, THE System SHALL display a revenue chart grouped by subscription plan type
7. WHEN THE Super_Admin navigates to webhook logs, THE System SHALL display all Paystack webhook events (charge.success, subscription.create, subscription.disable, invoice.payment_failed, invoice.payment_success) with Event, Organization, Plan, Status, Amount, and Date columns
8. WHEN THE Super_Admin manually assigns a subscription plan to a Tenant, THE System SHALL update the Tenant subscriptionTier and subscriptionStatus fields

### Requirement 6: System Analytics

**User Story:** As a platform owner, I want to view global statistics across the entire platform, so that I can understand usage patterns and system performance.

#### Acceptance Criteria

1. WHEN THE Super_Admin navigates to /owner/analytics, THE System SHALL display total check-ins today across all tenants
2. WHEN THE Super_Admin navigates to /owner/analytics, THE System SHALL display total late arrivals today across all tenants
3. WHEN THE Super_Admin navigates to /owner/analytics, THE System SHALL display total attendance logs in the system
4. WHEN THE Super_Admin navigates to /owner/analytics, THE System SHALL display organization growth chart showing new tenants per month
5. WHEN THE Super_Admin navigates to /owner/analytics, THE System SHALL display active vs inactive staff ratio across all tenants
6. WHEN THE Super_Admin navigates to /owner/analytics, THE System SHALL display photo verification usage rate calculated from AWS_Rekognition API calls or MongoDB attendance records with method "photo"
7. WHEN THE Super_Admin navigates to /owner/analytics, THE System SHALL display a list of most active tenants ranked by total check-ins
8. WHEN THE Super_Admin selects a time filter (Day/Week/Month/Year), THE System SHALL update all analytics to reflect the selected period

### Requirement 7: Audit Logs

**User Story:** As a platform owner, I want to view a complete record of all major system actions, so that I can track administrative activities and troubleshoot issues.

#### Acceptance Criteria

1. WHEN THE Super_Admin navigates to /owner/logs, THE System SHALL display a paginated table of all Audit_Log entries with columns: Actor, Role, Tenant, Action, Timestamp, IP Address
2. WHEN THE Super_Admin enters text in the search field, THE System SHALL filter logs by actor name, action type, or tenant name
3. WHEN THE Super_Admin selects an action type filter, THE System SHALL display only logs matching the selected action (SUSPEND_TENANT, UPGRADE_PLAN, DELETE_USER, VIEW_REPORT, PAYMENT_SUCCESS)
4. WHEN THE Super_Admin selects a date range, THE System SHALL display only logs within the specified date range
5. WHEN THE Super_Admin clicks "Export to CSV", THE System SHALL generate and download a CSV file containing all filtered log entries
6. WHEN THE System creates an Audit_Log entry, THE System SHALL record actorId, actorRole, tenantId, action, metadata, ipAddress, userAgent, and timestamp
7. WHEN THE Super_Admin views the logs page, THE System SHALL display a real-time stream of the 10 most recent actions

### Requirement 8: System Settings

**User Story:** As a platform owner, I want to configure platform-wide settings, so that I can manage API keys, system limits, and operational parameters.

#### Acceptance Criteria

1. WHEN THE Super_Admin navigates to /owner/settings, THE System SHALL display configuration fields for Resend API key, Paystack keys, and AWS_Rekognition keys
2. WHEN THE Super_Admin updates API keys, THE System SHALL validate the format and save the encrypted values to environment configuration
3. WHEN THE Super_Admin toggles maintenance mode, THE System SHALL set a system-wide flag that displays a maintenance message to all non-super-admin users
4. WHEN THE Super_Admin updates the default trial duration, THE System SHALL apply the new duration to all future Tenant registrations
5. WHEN THE Super_Admin sets global limits (max tenants in trial), THE System SHALL enforce the limit on new trial registrations
6. WHEN THE Super_Admin configures API rate limits, THE System SHALL apply the limits to all API endpoints
7. WHEN THE Super_Admin clicks "Trigger Backup", THE System SHALL initiate a MongoDB backup process

### Requirement 9: Notifications Center

**User Story:** As a platform owner, I want to receive real-time notifications about platform events, so that I can stay informed of important activities.

#### Acceptance Criteria

1. WHEN THE Super_Admin views the notifications center, THE System SHALL display recent platform events including new organization signups, payment successes, and payment failures
2. WHEN a new Tenant registers, THE System SHALL create a notification entry visible in the notifications center
3. WHEN a payment succeeds or fails, THE System SHALL create a notification entry with Tenant and payment details
4. WHEN THE Super_Admin clicks a notification entry, THE System SHALL redirect to the related detail page (organization details, payment details, etc.)
5. WHEN THE System creates notifications, THE System SHALL use server-sent events or polling to update the notifications center in real-time

### Requirement 10: Reports and Exports

**User Story:** As a platform owner, I want to generate and download comprehensive reports, so that I can analyze platform performance and share insights with stakeholders.

#### Acceptance Criteria

1. WHEN THE Super_Admin navigates to /owner/reports, THE System SHALL display options to generate Revenue Reports, Organization Growth Reports, Attendance Overview, Payment Reports, and User Activity Reports
2. WHEN THE Super_Admin selects a report type and date range, THE System SHALL generate the report with relevant data
3. WHEN THE Super_Admin clicks "Export as CSV", THE System SHALL generate and download a CSV file containing the report data
4. WHEN THE Super_Admin clicks "Export as Excel", THE System SHALL generate and download an Excel file using the xlsx library
5. WHEN THE Super_Admin clicks "Export as PDF", THE System SHALL generate and download a PDF file using the pdfkit library
6. WHEN THE System generates a Revenue Report, THE System SHALL include total revenue, revenue by plan, revenue by tenant, and revenue trends
7. WHEN THE System generates an Organization Growth Report, THE System SHALL include new tenants per period, active vs suspended tenants, and tenant retention metrics

### Requirement 11: Error Monitoring and System Health

**User Story:** As a platform owner, I want to monitor system health and error rates, so that I can proactively identify and resolve issues.

#### Acceptance Criteria

1. WHEN THE Super_Admin navigates to /owner/health, THE System SHALL display system uptime percentage for the last 30 days
2. WHEN THE Super_Admin views the health page, THE System SHALL display API error rate calculated from failed API requests
3. WHEN THE Super_Admin views the health page, THE System SHALL display email delivery success rate from Resend API
4. WHEN THE Super_Admin views the health page, THE System SHALL display payment webhook failure count from Paystack webhook logs
5. WHEN THE Super_Admin views the health page, THE System SHALL display MongoDB connection status (connected/disconnected)
6. WHEN THE System detects MongoDB connection failure, THE System SHALL display an alert on the health page

### Requirement 12: Data Models and Collections

**User Story:** As a developer, I want well-defined MongoDB collections and schemas, so that the super admin panel can efficiently query and manage platform data.

#### Acceptance Criteria

1. WHEN THE System stores super admin accounts, THE System SHALL use a super_admins collection with fields: _id, email (unique), password (hashed with bcrypt), firstName, lastName, isActive, createdAt, updatedAt, lastLogin
2. WHEN THE System stores audit logs, THE System SHALL use a system_audit_logs collection with fields: _id, actorId, actorRole, tenantId, action, metadata, ipAddress, userAgent, timestamp
3. WHEN THE System receives Paystack webhooks, THE System SHALL store events in a paystack_webhooks collection with fields: _id, event, tenantId, planCode, status, amount, reference, timestamp, rawPayload
4. WHEN THE System caches analytics, THE System SHALL use a platform_stats_cache collection with fields: _id, metric, value, calculatedAt, expiresAt
5. WHEN THE System queries organizations, THE System SHALL ensure the organizations collection includes fields: _id, name, subdomain, adminEmail, status, subscriptionTier, subscriptionStatus, trialEnds, createdAt, updatedAt, settings
6. WHEN THE System queries users, THE System SHALL ensure the users collection includes fields: _id, tenantId, email, password, role, firstName, lastName, isActive, lastLogin, createdAt, updatedAt
7. WHEN THE System queries attendance, THE System SHALL ensure the attendance collection includes fields: _id, tenantId, staffId, staffName, department, type, timestamp, date, isLate, method, photoVerified

### Requirement 13: API Routes and Middleware

**User Story:** As a developer, I want modular and secure API routes, so that the super admin panel backend is maintainable and protected.

#### Acceptance Criteria

1. WHEN THE System receives a request to any /api/owner/* route, THE System SHALL validate that the JWT token contains role "super_admin"
2. WHEN THE System validates a super admin request, THE System SHALL use a withSuperAdminAuth middleware function
3. WHEN THE System creates API routes, THE System SHALL organize them under /api/owner with subdirectories: auth, analytics, organizations, users, payments, logs, settings
4. WHEN THE System implements analytics services, THE System SHALL create modular service files in lib/services/analytics.ts
5. WHEN THE System implements Paystack extended features, THE System SHALL extend lib/services/paystack.ts with functions to fetch all transactions, subscriptions, and plans
6. WHEN THE System implements audit logging, THE System SHALL create lib/services/audit.ts with functions to create and query audit logs

### Requirement 14: Frontend Pages and Components

**User Story:** As a developer, I want reusable UI components and well-structured pages, so that the super admin interface is consistent and maintainable.

#### Acceptance Criteria

1. WHEN THE System renders super admin pages, THE System SHALL use a layout component with navigation sidebar for /owner/* routes
2. WHEN THE System displays data tables, THE System SHALL use shadcn/ui Table component with pagination, search, and filter capabilities
3. WHEN THE System displays charts, THE System SHALL use Recharts library with responsive configuration
4. WHEN THE System displays loading states, THE System SHALL use shadcn/ui Skeleton components
5. WHEN THE System displays modals, THE System SHALL use shadcn/ui Dialog component for confirmations and forms
6. WHEN THE System displays notifications, THE System SHALL use shadcn/ui Toast component for success and error messages
7. WHEN THE System renders stat cards, THE System SHALL create a reusable StatCard component with icon, label, value, and trend indicator

### Requirement 15: Security and Performance

**User Story:** As a platform owner, I want the super admin panel to be secure and performant, so that sensitive data is protected and the interface remains responsive.

#### Acceptance Criteria

1. WHEN THE System stores API keys in settings, THE System SHALL encrypt sensitive values before storing in the database
2. WHEN THE System logs audit entries, THE System SHALL include IP address and user agent for security tracking
3. WHEN THE System queries large datasets, THE System SHALL implement pagination with a maximum of 50 records per page
4. WHEN THE System calculates dashboard metrics, THE System SHALL use the platform_stats_cache collection to cache results for 5 minutes
5. WHEN THE System fetches Paystack data, THE System SHALL implement rate limiting to avoid exceeding API quotas
6. WHEN THE System allows Tenant deletion, THE System SHALL require confirmation and create a backup before deletion
7. WHEN THE System detects suspicious activity (multiple failed login attempts), THE System SHALL create an Audit_Log entry and send an alert email via Resend
