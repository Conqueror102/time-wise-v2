# Design Document

## Overview

The Super Admin Owner Panel is a comprehensive administrative interface built as a separate module within the TimeWise Multi-Tenant Attendance Management System. It provides platform-wide oversight, management capabilities, and analytics for the platform owner. The design follows a modular, service-oriented architecture that integrates seamlessly with the existing Next.js 15 App Router structure, MongoDB database, and third-party services (Paystack, Resend, AWS Rekognition).

### Key Design Principles

1. **Separation of Concerns**: Super admin functionality is isolated from tenant operations
2. **Reusability**: Leverage existing services (auth, database, email, payment) where possible
3. **Security First**: All routes protected with JWT validation and role-based access control
4. **Performance**: Implement caching, pagination, and optimized queries for large datasets
5. **Scalability**: Design for growth with efficient data structures and query patterns
6. **Maintainability**: Modular service layer with clear responsibilities

## Architecture

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Super Admin Panel                         │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Frontend   │  │   API Layer  │  │   Services   │     │
│  │  (Next.js)   │──│  (Routes)    │──│   (Logic)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         │                  │                  │             │
│         └──────────────────┴──────────────────┘             │
│                            │                                │
└────────────────────────────┼────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
         ┌──────▼──────┐          ┌──────▼──────┐
         │   MongoDB   │          │  External   │
         │  Database   │          │  Services   │
         └─────────────┘          └─────────────┘
                                  │ Paystack    │
                                  │ Resend      │
                                  │ AWS Rekog   │
                                  └─────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui, Recharts
- **Backend**: Next.js API Routes, TypeScript
- **Database**: MongoDB (existing connection)
- **Authentication**: JWT with bcrypt password hashing
- **External Services**: Paystack (payments), Resend (email), AWS Rekognition (photo verification)
- **State Management**: React hooks, Server Components
- **Styling**: TailwindCSS with shadcn/ui components


## Components and Interfaces

### 1. Authentication System

#### Super Admin JWT Payload

```typescript
interface SuperAdminJWTPayload {
  userId: string
  role: "super_admin"
  email: string
  iat: number
  exp: number
}
```

#### Authentication Flow

1. **Login Process**:
   - User submits email/password at `/owner/login`
   - API validates against `super_admins` collection
   - On success, generate JWT with 24-hour expiration
   - Store JWT in httpOnly cookie or localStorage
   - Redirect to `/owner/dashboard`

2. **Route Protection**:
   - Middleware checks JWT on all `/owner/*` routes
   - Validates token signature, expiration, and role
   - Redirects to `/owner/login` if invalid

3. **Session Management**:
   - JWT stored client-side
   - Auto-refresh on activity (optional)
   - Logout clears token and redirects

#### Middleware Implementation

```typescript
// lib/auth/super-admin.ts
export async function withSuperAdminAuth(request: NextRequest): Promise<SuperAdminContext> {
  const token = extractTokenFromHeader(request.headers.get("Authorization"))
  
  if (!token) {
    throw new TenantError("Authentication required", ErrorCodes.UNAUTHORIZED, 401)
  }
  
  const payload = verifyToken(token) as SuperAdminJWTPayload
  
  if (payload.role !== "super_admin") {
    throw new TenantError("Super admin access required", ErrorCodes.UNAUTHORIZED, 403)
  }
  
  return {
    userId: payload.userId,
    email: payload.email,
    role: payload.role
  }
}
```


### 2. Database Schema Design

#### Super Admins Collection

```typescript
interface SuperAdmin {
  _id: ObjectId
  email: string // unique index
  password: string // bcrypt hashed
  firstName: string
  lastName: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
}
```

#### System Audit Logs Collection

```typescript
interface SystemAuditLog {
  _id: ObjectId
  actorId: string // super admin _id
  actorRole: "super_admin"
  actorEmail: string
  tenantId?: string // optional, for tenant-specific actions
  action: AuditAction
  metadata: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Date
}

type AuditAction =
  | "SUSPEND_TENANT"
  | "ACTIVATE_TENANT"
  | "DELETE_TENANT"
  | "UPGRADE_PLAN"
  | "DOWNGRADE_PLAN"
  | "DELETE_USER"
  | "SUSPEND_USER"
  | "RESET_PASSWORD"
  | "VIEW_REPORT"
  | "EXPORT_DATA"
  | "UPDATE_SETTINGS"
  | "PAYMENT_SUCCESS"
  | "PAYMENT_FAILED"
  | "LOGIN"
  | "LOGOUT"
```

#### Paystack Webhooks Collection

```typescript
interface PaystackWebhook {
  _id: ObjectId
  event: PaystackEvent
  tenantId?: string
  organizationName?: string
  planCode?: string
  status: "success" | "failed"
  amount?: number
  currency?: string
  reference: string
  timestamp: Date
  rawPayload: Record<string, any>
}

type PaystackEvent =
  | "charge.success"
  | "subscription.create"
  | "subscription.disable"
  | "invoice.payment_failed"
  | "invoice.payment_success"
```

#### Platform Stats Cache Collection

```typescript
interface PlatformStatsCache {
  _id: ObjectId
  metric: string // e.g., "total_organizations", "mrr", "daily_checkins"
  value: number | string | Record<string, any>
  calculatedAt: Date
  expiresAt: Date // TTL index for auto-deletion
}
```

#### Extended Organizations Collection

Ensure existing `organizations` collection has these fields:

```typescript
interface Organization {
  _id: ObjectId
  name: string
  subdomain: string // unique index
  adminEmail: string
  status: "active" | "trial" | "suspended" | "cancelled"
  subscriptionTier: "free" | "basic" | "pro" | "enterprise"
  subscriptionStatus: "active" | "cancelled" | "past_due"
  trialEnds?: Date
  paystackCustomerCode?: string
  paystackSubscriptionCode?: string
  createdAt: Date
  updatedAt: Date
  settings: {
    latenessTime: string
    workStartTime: string
    workEndTime: string
    maxStaff: number
    allowedMethods: string[]
    timezone: string
  }
}
```


### 3. Service Layer Architecture

#### Analytics Service (`lib/services/analytics.ts`)

```typescript
export class AnalyticsService {
  // Dashboard Overview
  async getDashboardStats(): Promise<DashboardStats>
  async getRevenueGrowth(period: TimePeriod): Promise<RevenueData[]>
  async getOrganizationGrowth(): Promise<OrgGrowthData[]>
  async getSubscriptionDistribution(): Promise<SubscriptionData[]>
  async getPaymentSuccessRate(): Promise<PaymentRateData>
  
  // System Analytics
  async getTodayCheckins(): Promise<number>
  async getTodayLateArrivals(): Promise<number>
  async getTotalAttendanceLogs(): Promise<number>
  async getActiveVsInactiveStaff(): Promise<StaffRatioData>
  async getPhotoVerificationRate(): Promise<number>
  async getMostActiveTenants(limit: number): Promise<TenantActivity[]>
  
  // Caching
  private async getCachedMetric(key: string): Promise<any>
  private async setCachedMetric(key: string, value: any, ttl: number): Promise<void>
}
```

#### Audit Service (`lib/services/audit.ts`)

```typescript
export class AuditService {
  async createLog(params: CreateAuditLogParams): Promise<void>
  async getLogs(filters: AuditLogFilters): Promise<PaginatedAuditLogs>
  async exportLogs(filters: AuditLogFilters): Promise<string> // CSV content
  async getRecentLogs(limit: number): Promise<SystemAuditLog[]>
}

interface CreateAuditLogParams {
  actorId: string
  actorEmail: string
  tenantId?: string
  action: AuditAction
  metadata: Record<string, any>
  ipAddress: string
  userAgent: string
}
```

#### Organization Service (`lib/services/organization.ts`)

```typescript
export class OrganizationService {
  async getAllOrganizations(filters: OrgFilters): Promise<PaginatedOrganizations>
  async getOrganizationDetails(orgId: string): Promise<OrganizationDetails>
  async suspendOrganization(orgId: string, actorId: string): Promise<void>
  async activateOrganization(orgId: string, actorId: string): Promise<void>
  async deleteOrganization(orgId: string, actorId: string): Promise<void>
  async updateSubscriptionPlan(orgId: string, plan: string, actorId: string): Promise<void>
  async getOrganizationUsers(orgId: string): Promise<User[]>
  async getOrganizationPayments(orgId: string): Promise<Payment[]>
  async getOrganizationAnalytics(orgId: string): Promise<OrgAnalytics>
}
```

#### User Management Service (`lib/services/user-management.ts`)

```typescript
export class UserManagementService {
  async getAllUsers(filters: UserFilters): Promise<PaginatedUsers>
  async suspendUser(userId: string, actorId: string): Promise<void>
  async deleteUser(userId: string, actorId: string): Promise<void>
  async resetUserPassword(userId: string, actorId: string): Promise<void>
  async sendEmailToUser(userId: string, subject: string, body: string): Promise<void>
}
```

#### Extended Paystack Service (`lib/services/paystack.ts`)

Extend existing service with:

```typescript
// Add to existing PaystackService
export async function getAllTransactions(params: {
  page?: number
  perPage?: number
  from?: Date
  to?: Date
}): Promise<PaystackTransaction[]>

export async function getAllSubscriptions(): Promise<PaystackSubscription[]>

export async function getAllPlans(): Promise<PaystackPlan[]>

export async function getTransactionStats(): Promise<TransactionStats>
```

#### Report Service (`lib/services/reports.ts`)

```typescript
export class ReportService {
  async generateRevenueReport(dateRange: DateRange): Promise<RevenueReport>
  async generateOrganizationGrowthReport(dateRange: DateRange): Promise<OrgGrowthReport>
  async generateAttendanceOverview(dateRange: DateRange): Promise<AttendanceReport>
  async generatePaymentReport(dateRange: DateRange): Promise<PaymentReport>
  async generateUserActivityReport(dateRange: DateRange): Promise<UserActivityReport>
  
  async exportToCSV(report: any): Promise<string>
  async exportToExcel(report: any): Promise<Buffer>
  async exportToPDF(report: any): Promise<Buffer>
}
```


### 4. API Routes Structure

```
/api/owner
├── auth
│   ├── login/route.ts          # POST - Super admin login
│   ├── logout/route.ts         # POST - Super admin logout
│   └── me/route.ts             # GET - Get current super admin info
│
├── analytics
│   ├── overview/route.ts       # GET - Dashboard overview stats
│   ├── revenue/route.ts        # GET - Revenue analytics
│   ├── tenants/route.ts        # GET - Tenant growth analytics
│   ├── users/route.ts          # GET - User analytics
│   └── system/route.ts         # GET - System-wide analytics
│
├── organizations
│   ├── route.ts                # GET - List all organizations (paginated)
│   ├── [id]/route.ts           # GET - Organization details
│   ├── [id]/suspend/route.ts   # POST - Suspend organization
│   ├── [id]/activate/route.ts  # POST - Activate organization
│   ├── [id]/delete/route.ts    # DELETE - Delete organization
│   ├── [id]/users/route.ts     # GET - Organization users
│   ├── [id]/payments/route.ts  # GET - Organization payments
│   └── [id]/plan/route.ts      # PUT - Update subscription plan
│
├── users
│   ├── route.ts                # GET - List all users (paginated)
│   ├── [id]/suspend/route.ts   # POST - Suspend user
│   ├── [id]/delete/route.ts    # DELETE - Delete user
│   ├── [id]/reset-password/route.ts # POST - Reset user password
│   └── [id]/send-email/route.ts # POST - Send email to user
│
├── payments
│   ├── transactions/route.ts   # GET - All Paystack transactions
│   ├── subscriptions/route.ts  # GET - All subscriptions
│   ├── plans/route.ts          # GET - All payment plans
│   ├── stats/route.ts          # GET - Payment statistics
│   └── webhook-logs/route.ts   # GET - Paystack webhook logs
│
├── logs
│   ├── route.ts                # GET - Audit logs (paginated, filtered)
│   ├── export/route.ts         # GET - Export logs to CSV
│   └── recent/route.ts         # GET - Recent logs (real-time)
│
├── reports
│   ├── revenue/route.ts        # POST - Generate revenue report
│   ├── growth/route.ts         # POST - Generate org growth report
│   ├── attendance/route.ts     # POST - Generate attendance report
│   ├── payments/route.ts       # POST - Generate payment report
│   └── users/route.ts          # POST - Generate user activity report
│
├── settings
│   ├── route.ts                # GET/PUT - System settings
│   ├── maintenance/route.ts    # POST - Toggle maintenance mode
│   └── backup/route.ts         # POST - Trigger database backup
│
└── health
    └── route.ts                # GET - System health metrics
```

#### API Route Pattern

All routes follow this pattern:

```typescript
// Example: /api/owner/organizations/route.ts
import { NextRequest, NextResponse } from "next/server"
import { withSuperAdminAuth } from "@/lib/auth/super-admin"
import { OrganizationService } from "@/lib/services/organization"
import { AuditService } from "@/lib/services/audit"

export async function GET(request: NextRequest) {
  try {
    // Authenticate super admin
    const context = await withSuperAdminAuth(request)
    
    // Extract query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const search = searchParams.get("search") || ""
    
    // Call service
    const orgService = new OrganizationService()
    const result = await orgService.getAllOrganizations({ page, search })
    
    // Log action
    const auditService = new AuditService()
    await auditService.createLog({
      actorId: context.userId,
      actorEmail: context.email,
      action: "VIEW_ORGANIZATIONS",
      metadata: { page, search },
      ipAddress: request.ip || "unknown",
      userAgent: request.headers.get("user-agent") || "unknown"
    })
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode || 500 }
    )
  }
}
```


### 5. Frontend Architecture

#### Page Structure

```
/app/owner
├── layout.tsx                  # Super admin layout with sidebar
├── login/page.tsx              # Login page (public)
├── dashboard/page.tsx          # Dashboard overview
├── organizations
│   ├── page.tsx                # Organizations list
│   └── [id]/page.tsx           # Organization details
├── users/page.tsx              # Users management
├── payments/page.tsx           # Payments & billing
├── analytics/page.tsx          # System analytics
├── logs/page.tsx               # Audit logs
├── reports/page.tsx            # Reports & exports
├── settings/page.tsx           # System settings
└── health/page.tsx             # System health
```

#### Shared Components

```
/components/owner
├── layout
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── Header.tsx              # Top header with user menu
│   └── ProtectedRoute.tsx      # Client-side route protection
│
├── dashboard
│   ├── StatCard.tsx            # Metric display card
│   ├── RevenueChart.tsx        # Revenue line chart
│   ├── OrgGrowthChart.tsx      # Organization bar chart
│   ├── SubscriptionPieChart.tsx # Subscription distribution
│   └── PaymentDonutChart.tsx   # Payment success rate
│
├── organizations
│   ├── OrganizationTable.tsx   # Organizations data table
│   ├── OrganizationFilters.tsx # Search and filters
│   ├── OrganizationDetails.tsx # Detailed view
│   └── OrganizationActions.tsx # Action buttons
│
├── users
│   ├── UserTable.tsx           # Users data table
│   ├── UserFilters.tsx         # Search and filters
│   └── UserActions.tsx         # Action buttons
│
├── payments
│   ├── TransactionTable.tsx    # Transactions table
│   ├── SubscriptionTable.tsx   # Subscriptions table
│   ├── WebhookLogTable.tsx     # Webhook logs
│   └── PaymentStats.tsx        # Payment statistics
│
├── logs
│   ├── AuditLogTable.tsx       # Audit logs table
│   ├── LogFilters.tsx          # Date range and filters
│   └── RecentLogs.tsx          # Real-time recent logs
│
├── reports
│   ├── ReportGenerator.tsx     # Report generation form
│   └── ReportPreview.tsx       # Report preview
│
└── shared
    ├── DataTable.tsx           # Reusable data table
    ├── Pagination.tsx          # Pagination component
    ├── SearchInput.tsx         # Search input
    ├── DateRangePicker.tsx     # Date range selector
    ├── ExportButton.tsx        # Export functionality
    └── LoadingSkeleton.tsx     # Loading states
```

#### Component Design Patterns

**StatCard Component**:
```typescript
interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  loading?: boolean
}

export function StatCard({ title, value, icon, trend, loading }: StatCardProps) {
  if (loading) return <Skeleton className="h-32" />
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className={cn("text-xs", trend.isPositive ? "text-green-600" : "text-red-600")}>
            {trend.isPositive ? "↑" : "↓"} {trend.value}% from last period
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

**DataTable Component**:
```typescript
interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  pagination?: {
    page: number
    totalPages: number
    onPageChange: (page: number) => void
  }
  loading?: boolean
  onRowClick?: (row: T) => void
}

export function DataTable<T>({ columns, data, pagination, loading, onRowClick }: DataTableProps<T>) {
  // Implementation using shadcn/ui Table
}
```


## Data Models

### TypeScript Interfaces

```typescript
// lib/types/super-admin.ts

export interface SuperAdminContext {
  userId: string
  email: string
  role: "super_admin"
}

export interface DashboardStats {
  totalOrganizations: number
  totalActiveUsers: number
  totalActiveSubscriptions: number
  totalRevenue: number
  mrr: number
  activeTenants: number
  suspendedTenants: number
  dailyCheckins: number
}

export interface RevenueData {
  date: string
  amount: number
  currency: string
}

export interface OrgGrowthData {
  month: string
  count: number
}

export interface SubscriptionData {
  plan: string
  count: number
  percentage: number
}

export interface PaymentRateData {
  successful: number
  failed: number
  successRate: number
}

export interface TenantActivity {
  organizationId: string
  organizationName: string
  totalCheckins: number
  activeUsers: number
}

export interface OrganizationDetails {
  organization: Organization
  users: User[]
  recentPayments: Payment[]
  analytics: {
    totalStaff: number
    activeStaff: number
    totalCheckins: number
    averageAttendanceRate: number
  }
  auditLogs: SystemAuditLog[]
}

export interface PaginatedOrganizations {
  organizations: Organization[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export interface PaginatedUsers {
  users: UserWithTenant[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export interface UserWithTenant extends User {
  tenantName: string
  tenantSubdomain: string
}

export interface PaginatedAuditLogs {
  logs: SystemAuditLog[]
  pagination: {
    page: number
    perPage: number
    total: number
    totalPages: number
  }
}

export interface PaystackTransaction {
  id: string
  reference: string
  amount: number
  currency: string
  status: string
  customer: {
    email: string
    customer_code: string
  }
  metadata: Record<string, any>
  paid_at: string
  created_at: string
}

export interface PaystackSubscription {
  subscription_code: string
  email_token: string
  amount: number
  plan: {
    name: string
    plan_code: string
  }
  status: string
  next_payment_date: string
  created_at: string
}

export interface TransactionStats {
  totalTransactions: number
  successfulTransactions: number
  failedTransactions: number
  totalRevenue: number
  averageTransactionValue: number
}

export interface RevenueReport {
  dateRange: DateRange
  totalRevenue: number
  revenueByPlan: Array<{ plan: string; amount: number }>
  revenueByTenant: Array<{ tenant: string; amount: number }>
  revenueTrend: Array<{ date: string; amount: number }>
}

export interface DateRange {
  from: Date
  to: Date
}

export interface OrgFilters {
  page?: number
  perPage?: number
  search?: string
  status?: string
  subscriptionTier?: string
}

export interface UserFilters {
  page?: number
  perPage?: number
  search?: string
  role?: string
  tenantId?: string
  isActive?: boolean
}

export interface AuditLogFilters {
  page?: number
  perPage?: number
  search?: string
  action?: AuditAction
  tenantId?: string
  dateFrom?: Date
  dateTo?: Date
}
```


## Error Handling

### Error Types

```typescript
// lib/errors/super-admin-errors.ts

export class SuperAdminError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number
  ) {
    super(message)
    this.name = "SuperAdminError"
  }
}

export const SuperAdminErrorCodes = {
  UNAUTHORIZED: "SUPER_ADMIN_UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  ORGANIZATION_NOT_FOUND: "ORGANIZATION_NOT_FOUND",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  CANNOT_DELETE_ACTIVE_ORG: "CANNOT_DELETE_ACTIVE_ORG",
  PAYSTACK_API_ERROR: "PAYSTACK_API_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
  EXPORT_FAILED: "EXPORT_FAILED",
} as const
```

### Error Handling Pattern

```typescript
// In API routes
try {
  // ... operation
} catch (error) {
  if (error instanceof SuperAdminError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.statusCode }
    )
  }
  
  // Log unexpected errors
  console.error("Unexpected error:", error)
  
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  )
}
```

### Frontend Error Handling

```typescript
// hooks/useApiCall.ts
export function useApiCall<T>() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const call = async (fn: () => Promise<T>): Promise<T | null> => {
    setLoading(true)
    setError(null)
    
    try {
      const result = await fn()
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
      toast.error(message)
      return null
    } finally {
      setLoading(false)
    }
  }
  
  return { call, loading, error }
}
```


## Testing Strategy

### Unit Tests

**Service Layer Tests**:
- Test each service method in isolation
- Mock database calls
- Test error handling
- Verify audit log creation

```typescript
// __tests__/services/organization.test.ts
describe("OrganizationService", () => {
  it("should suspend organization and create audit log", async () => {
    const mockDb = createMockDatabase()
    const service = new OrganizationService(mockDb)
    
    await service.suspendOrganization("org123", "admin123")
    
    expect(mockDb.organizations.updateOne).toHaveBeenCalledWith(
      { _id: "org123" },
      { $set: { status: "suspended" } }
    )
    expect(mockDb.system_audit_logs.insertOne).toHaveBeenCalled()
  })
})
```

**API Route Tests**:
- Test authentication middleware
- Test request validation
- Test response formats
- Test error scenarios

```typescript
// __tests__/api/owner/organizations.test.ts
describe("GET /api/owner/organizations", () => {
  it("should return 401 without valid token", async () => {
    const response = await fetch("/api/owner/organizations")
    expect(response.status).toBe(401)
  })
  
  it("should return paginated organizations", async () => {
    const token = generateTestToken({ role: "super_admin" })
    const response = await fetch("/api/owner/organizations", {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toHaveProperty("organizations")
    expect(data).toHaveProperty("pagination")
  })
})
```

### Integration Tests

- Test complete flows (login → dashboard → action)
- Test Paystack webhook handling
- Test report generation
- Test data export functionality

### E2E Tests (Optional)

- Use Playwright or Cypress
- Test critical user journeys
- Test responsive design
- Test error states


## Security Considerations

### Authentication & Authorization

1. **JWT Security**:
   - Use strong JWT_SECRET (minimum 32 characters)
   - Set appropriate expiration (24 hours)
   - Store tokens in httpOnly cookies (preferred) or secure localStorage
   - Implement token refresh mechanism

2. **Password Security**:
   - Use bcrypt with 12 salt rounds
   - Enforce strong password requirements
   - Implement rate limiting on login attempts
   - Log failed login attempts

3. **Role-Based Access Control**:
   - Validate role on every request
   - Separate super_admin from tenant roles
   - No cross-tenant access for super admins (they have global access)

### Data Protection

1. **Sensitive Data**:
   - Never log passwords or tokens
   - Encrypt API keys in settings
   - Sanitize user inputs
   - Use parameterized queries (MongoDB prevents injection by default)

2. **Audit Logging**:
   - Log all administrative actions
   - Include IP address and user agent
   - Retain logs for compliance (configurable retention period)
   - Implement log rotation

### API Security

1. **Rate Limiting**:
   - Implement rate limiting on all API routes
   - Stricter limits on authentication endpoints
   - Use Redis or in-memory cache for rate limit tracking

2. **Input Validation**:
   - Validate all request parameters
   - Sanitize search queries
   - Validate file uploads (for exports)
   - Use Zod or similar for schema validation

3. **CORS Configuration**:
   - Restrict CORS to known origins
   - No wildcard CORS in production

### Infrastructure Security

1. **Environment Variables**:
   - Never commit .env files
   - Use Vercel environment variables
   - Rotate secrets regularly

2. **Database Security**:
   - Use MongoDB connection string with authentication
   - Enable MongoDB encryption at rest
   - Regular backups
   - Implement connection pooling

3. **Third-Party Services**:
   - Validate Paystack webhook signatures
   - Use HTTPS for all external API calls
   - Implement retry logic with exponential backoff
   - Monitor API quota usage


## Performance Optimization

### Caching Strategy

1. **Dashboard Metrics Cache**:
   - Cache expensive calculations (MRR, total revenue, etc.)
   - TTL: 5 minutes
   - Use `platform_stats_cache` collection with TTL index
   - Invalidate on relevant data changes

```typescript
// Example caching implementation
async function getCachedMetric(key: string, calculator: () => Promise<any>, ttl: number) {
  const cached = await db.collection("platform_stats_cache").findOne({
    metric: key,
    expiresAt: { $gt: new Date() }
  })
  
  if (cached) return cached.value
  
  const value = await calculator()
  
  await db.collection("platform_stats_cache").insertOne({
    metric: key,
    value,
    calculatedAt: new Date(),
    expiresAt: new Date(Date.now() + ttl)
  })
  
  return value
}
```

2. **Query Optimization**:
   - Create indexes on frequently queried fields
   - Use projection to limit returned fields
   - Implement cursor-based pagination for large datasets
   - Use aggregation pipelines for complex queries

3. **Frontend Optimization**:
   - Use React Server Components for initial data loading
   - Implement SWR or React Query for client-side caching
   - Lazy load charts and heavy components
   - Use skeleton loaders for better perceived performance

### Database Indexes

```typescript
// Required indexes
await db.collection("super_admins").createIndex({ email: 1 }, { unique: true })
await db.collection("system_audit_logs").createIndex({ timestamp: -1 })
await db.collection("system_audit_logs").createIndex({ actorId: 1, timestamp: -1 })
await db.collection("system_audit_logs").createIndex({ tenantId: 1, timestamp: -1 })
await db.collection("paystack_webhooks").createIndex({ timestamp: -1 })
await db.collection("paystack_webhooks").createIndex({ tenantId: 1, timestamp: -1 })
await db.collection("platform_stats_cache").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
await db.collection("organizations").createIndex({ status: 1, createdAt: -1 })
await db.collection("users").createIndex({ tenantId: 1, role: 1 })
await db.collection("attendance").createIndex({ tenantId: 1, date: -1 })
```

### Pagination Strategy

```typescript
interface PaginationParams {
  page: number
  perPage: number
}

async function paginateQuery<T>(
  collection: Collection,
  query: Filter<T>,
  { page, perPage }: PaginationParams
) {
  const skip = (page - 1) * perPage
  
  const [data, total] = await Promise.all([
    collection.find(query).skip(skip).limit(perPage).toArray(),
    collection.countDocuments(query)
  ])
  
  return {
    data,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage)
    }
  }
}
```

### API Response Optimization

1. **Compression**: Enable gzip compression for API responses
2. **Selective Fields**: Allow clients to specify required fields
3. **Batch Requests**: Support batching multiple requests
4. **Streaming**: Use streaming for large exports


## Integration with Existing System

### Reusing Existing Services

1. **Database Connection**:
   - Use existing `lib/mongodb.ts` connection
   - Extend `getDatabase()` helper for super admin queries

2. **Authentication**:
   - Extend existing `lib/auth/jwt.ts` for super admin tokens
   - Create new `lib/auth/super-admin.ts` for super admin middleware
   - Reuse `lib/auth/password.ts` for password hashing

3. **Email Service**:
   - Use existing `lib/services/email.ts` (Resend)
   - Add new email templates for super admin notifications

4. **Paystack Service**:
   - Extend existing `lib/services/paystack.ts`
   - Add methods for fetching all transactions, subscriptions, plans

### New Collections

Create these collections without affecting existing data:
- `super_admins` - Isolated super admin accounts
- `system_audit_logs` - Platform-wide audit trail
- `paystack_webhooks` - Webhook event logs
- `platform_stats_cache` - Performance optimization cache

### Webhook Enhancement

Update existing `/api/webhooks/paystack/route.ts` to also log to `paystack_webhooks` collection:

```typescript
// In existing webhook handler
export async function POST(request: NextRequest) {
  // ... existing webhook handling
  
  // Add logging for super admin visibility
  await db.collection("paystack_webhooks").insertOne({
    event: body.event,
    tenantId: metadata.tenantId,
    organizationName: metadata.organizationName,
    status: body.data.status,
    amount: body.data.amount,
    reference: body.data.reference,
    timestamp: new Date(),
    rawPayload: body
  })
  
  // ... rest of existing code
}
```

### Environment Variables

Add to `.env`:
```
# Super Admin
JWT_SECRET=your-existing-jwt-secret
SUPER_ADMIN_SEED_EMAIL=admin@timewise.com
SUPER_ADMIN_SEED_PASSWORD=SecurePassword123!

# Existing variables remain unchanged
MONGODB_URI=...
PAYSTACK_SECRET_KEY=...
RESEND_API_KEY=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```


## Deployment Considerations

### Vercel Deployment

1. **Environment Variables**:
   - Set all required env vars in Vercel dashboard
   - Use different values for preview vs production
   - Enable "Sensitive" flag for secrets

2. **Build Configuration**:
   - No changes needed to existing `next.config.js`
   - Super admin routes are part of the same Next.js app

3. **Database Migration**:
   - Run seed script after deployment
   - Create indexes via migration script
   - Test with staging environment first

### Seed Script

```typescript
// scripts/seed-super-admin.ts
import { MongoClient } from "mongodb"
import { hashPassword } from "@/lib/auth/password"

async function seedSuperAdmin() {
  const client = new MongoClient(process.env.MONGODB_URI!)
  await client.connect()
  
  const db = client.db("staff_checkin")
  
  // Check if super admin already exists
  const existing = await db.collection("super_admins").findOne({
    email: process.env.SUPER_ADMIN_SEED_EMAIL
  })
  
  if (existing) {
    console.log("Super admin already exists")
    await client.close()
    return
  }
  
  // Create super admin
  const hashedPassword = await hashPassword(process.env.SUPER_ADMIN_SEED_PASSWORD!)
  
  await db.collection("super_admins").insertOne({
    email: process.env.SUPER_ADMIN_SEED_EMAIL,
    password: hashedPassword,
    firstName: "Super",
    lastName: "Admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
  
  console.log("✅ Super admin created successfully")
  
  // Create indexes
  await db.collection("super_admins").createIndex({ email: 1 }, { unique: true })
  await db.collection("system_audit_logs").createIndex({ timestamp: -1 })
  await db.collection("paystack_webhooks").createIndex({ timestamp: -1 })
  await db.collection("platform_stats_cache").createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0 }
  )
  
  console.log("✅ Indexes created")
  
  await client.close()
}

seedSuperAdmin().catch(console.error)
```

Run with: `npx ts-node scripts/seed-super-admin.ts`

### Monitoring

1. **Logging**:
   - Use Vercel logs for API route monitoring
   - Implement structured logging
   - Set up alerts for errors

2. **Performance Monitoring**:
   - Monitor API response times
   - Track database query performance
   - Monitor Paystack API usage

3. **Security Monitoring**:
   - Alert on failed login attempts
   - Monitor for unusual activity patterns
   - Track API rate limit violations


## UI/UX Design Specifications

### Design System

**Colors** (using TailwindCSS):
- Primary: `purple-600` (matches existing TimeWise branding)
- Secondary: `gray-700`
- Success: `green-600`
- Warning: `yellow-600`
- Danger: `red-600`
- Background: `gray-50`
- Card: `white`

**Typography**:
- Headings: `font-bold`
- Body: `font-normal`
- Metrics: `font-semibold text-2xl`

**Spacing**:
- Container padding: `p-6`
- Card spacing: `space-y-4`
- Grid gaps: `gap-6`

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header (Logo, Search, Notifications, User Menu)       │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │  Main Content Area                          │
│          │                                              │
│ - Dash   │  ┌────────────────────────────────────┐    │
│ - Orgs   │  │  Page Title                        │    │
│ - Users  │  └────────────────────────────────────┘    │
│ - Pay    │                                              │
│ - Logs   │  ┌────────────────────────────────────┐    │
│ - Reports│  │  Content (Cards, Tables, Charts)   │    │
│ - Settings│  │                                    │    │
│          │  │                                    │    │
│          │  └────────────────────────────────────┘    │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────┐
│  Dashboard Overview                                      │
├─────────────────────────────────────────────────────────┤
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐    │
│  │ Orgs │  │Users │  │ Subs │  │ Rev  │  │ MRR  │    │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘    │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌──────────────────────┐ │
│  │  Revenue Growth Chart   │  │  Org Growth Chart    │ │
│  │  (Line Chart)           │  │  (Bar Chart)         │ │
│  └─────────────────────────┘  └──────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┐  ┌──────────────────────┐ │
│  │  Subscription Dist      │  │  Payment Success     │ │
│  │  (Pie Chart)            │  │  (Donut Chart)       │ │
│  └─────────────────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Responsive Design

- **Desktop** (>1024px): Full sidebar + content
- **Tablet** (768px-1024px): Collapsible sidebar
- **Mobile** (<768px): Bottom navigation or hamburger menu

### Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation support
- Focus indicators
- Screen reader friendly
- Color contrast ratio > 4.5:1
- Alt text for icons

### Loading States

- Skeleton loaders for cards and tables
- Spinner for button actions
- Progress bar for exports
- Shimmer effect for loading content

### Empty States

- Friendly illustrations
- Clear messaging
- Call-to-action buttons
- Helpful tips


## Implementation Phases

### Phase 1: Foundation (Week 1)
- Set up super admin authentication
- Create seed script
- Implement JWT middleware
- Build login page
- Create basic layout with sidebar

### Phase 2: Core Services (Week 2)
- Implement analytics service
- Implement organization service
- Implement user management service
- Implement audit service
- Set up database indexes

### Phase 3: Dashboard & Analytics (Week 3)
- Build dashboard overview page
- Implement stat cards
- Create Recharts components
- Implement caching layer
- Build analytics page

### Phase 4: Management Pages (Week 4)
- Build organizations management page
- Build users management page
- Implement data tables with pagination
- Add search and filters
- Implement action modals

### Phase 5: Payments & Billing (Week 5)
- Extend Paystack service
- Build payments page
- Implement webhook logging
- Create transaction tables
- Add payment statistics

### Phase 6: Audit & Reports (Week 6)
- Build audit logs page
- Implement log filtering and export
- Build reports page
- Implement CSV/Excel/PDF exports
- Add real-time log streaming

### Phase 7: Settings & Health (Week 7)
- Build settings page
- Implement system health monitoring
- Add maintenance mode toggle
- Create backup functionality
- Implement notifications center

### Phase 8: Testing & Polish (Week 8)
- Write unit tests
- Write integration tests
- Performance optimization
- Security audit
- Documentation
- Bug fixes

## Success Metrics

### Performance Metrics
- Dashboard load time < 2 seconds
- API response time < 500ms (p95)
- Database query time < 100ms (p95)
- Export generation < 5 seconds for 10k records

### Reliability Metrics
- Uptime > 99.9%
- Error rate < 0.1%
- Successful authentication rate > 99%

### Usability Metrics
- Time to complete common tasks < 30 seconds
- User satisfaction score > 4.5/5
- Mobile responsiveness score > 90

## Future Enhancements

### Phase 2 Features (Post-MVP)
- Two-factor authentication for super admins
- Advanced analytics with custom date ranges
- Automated report scheduling
- Email notifications for critical events
- Multi-language support
- Dark mode
- Advanced search with filters
- Bulk operations (suspend multiple orgs)
- API rate limiting dashboard
- Custom dashboard widgets
- Export templates
- Webhook retry mechanism
- Advanced audit log analysis
- Predictive analytics
- Integration with external monitoring tools

