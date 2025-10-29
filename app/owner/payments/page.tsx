"use client"

import { useEffect, useState } from "react"
import { DataTable, Column } from "@/components/owner/shared/DataTable"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, XCircle, Clock } from "lucide-react"
import { StatCard } from "@/components/owner/shared/StatCard"

interface Transaction {
  id: string
  reference: string
  amount: number
  currency: string
  status: string
  customer: {
    email: string
  }
  paid_at: string
  created_at: string
}

interface Subscription {
  subscription_code: string
  amount: number
  plan: {
    name: string
    plan_code: string
  }
  status: string
  next_payment_date: string
  created_at: string
}

interface WebhookLog {
  _id: string
  event: string
  organizationName?: string
  planCode?: string
  status: string
  amount?: number
  timestamp: string
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchPaymentData()
  }, [page])

  const fetchPaymentData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("super_admin_token")
      const headers = {
        Authorization: `Bearer ${token}`,
      }

      // Fetch transactions
      const transactionsRes = await fetch(
        `/api/owner/payments/transactions?page=${page}`,
        { headers }
      )
      if (transactionsRes.ok) {
        const data = await transactionsRes.json()
        setTransactions(data.transactions || [])
      }

      // Fetch subscriptions
      const subscriptionsRes = await fetch(
        `/api/owner/payments/subscriptions?page=${page}`,
        { headers }
      )
      if (subscriptionsRes.ok) {
        const data = await subscriptionsRes.json()
        setSubscriptions(data.subscriptions || [])
      }

      // Fetch webhook logs
      const webhookRes = await fetch(
        `/api/owner/payments/webhook-logs?page=${page}`,
        { headers }
      )
      if (webhookRes.ok) {
        const data = await webhookRes.json()
        setWebhookLogs(data.logs || [])
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error("Failed to fetch payment data:", error)
    } finally {
      setLoading(false)
    }
  }

  const transactionColumns: Column<Transaction>[] = [
    {
      header: "Reference",
      cell: (row) => (
        <span className="font-mono text-sm">{row.reference}</span>
      ),
    },
    {
      header: "Customer",
      cell: (row) => (
        <span className="text-sm text-gray-700">{row.customer.email}</span>
      ),
    },
    {
      header: "Amount",
      cell: (row) => (
        <span className="font-semibold">
          {row.currency} {(row.amount / 100).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge
          variant={row.status === "success" ? "default" : "destructive"}
        >
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Date",
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.paid_at || row.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ]

  const subscriptionColumns: Column<Subscription>[] = [
    {
      header: "Plan",
      cell: (row) => (
        <div>
          <div className="font-medium">{row.plan.name}</div>
          <div className="text-sm text-gray-500">{row.plan.plan_code}</div>
        </div>
      ),
    },
    {
      header: "Amount",
      cell: (row) => (
        <span className="font-semibold">
          ₦{(row.amount / 100).toLocaleString()}
        </span>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "active" ? "default" : "secondary"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Next Payment",
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.next_payment_date).toLocaleDateString()}
        </span>
      ),
    },
  ]

  const webhookColumns: Column<WebhookLog>[] = [
    {
      header: "Event",
      cell: (row) => (
        <Badge variant="outline" className="font-mono text-xs">
          {row.event}
        </Badge>
      ),
    },
    {
      header: "Organization",
      cell: (row) => (
        <span className="text-sm">{row.organizationName || "N/A"}</span>
      ),
    },
    {
      header: "Plan",
      cell: (row) => (
        <span className="text-sm text-gray-600">{row.planCode || "N/A"}</span>
      ),
    },
    {
      header: "Status",
      cell: (row) => (
        <Badge variant={row.status === "success" ? "default" : "destructive"}>
          {row.status}
        </Badge>
      ),
    },
    {
      header: "Amount",
      cell: (row) => (
        <span className="font-semibold">
          {row.amount ? `₦${(row.amount / 100).toLocaleString()}` : "N/A"}
        </span>
      ),
    },
    {
      header: "Date",
      cell: (row) => (
        <span className="text-sm text-gray-600">
          {new Date(row.timestamp).toLocaleDateString()}
        </span>
      ),
    },
  ]

  // Calculate stats
  const totalRevenue = transactions.reduce((sum, t) => sum + t.amount, 0) / 100
  const successfulTransactions = transactions.filter(
    (t) => t.status === "success"
  ).length
  const failedTransactions = transactions.filter(
    (t) => t.status === "failed"
  ).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Payments & Billing
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Monitor all payment transactions and subscriptions
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₦${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          loading={loading}
          iconColor="text-emerald-600"
        />
        <StatCard
          title="Active Subscriptions"
          value={subscriptions.filter((s) => s.status === "active").length}
          icon={TrendingUp}
          loading={loading}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Failed Payments"
          value={failedTransactions}
          icon={XCircle}
          loading={loading}
          iconColor="text-red-600"
        />
        <StatCard
          title="Pending"
          value={
            transactions.filter((t) => t.status === "pending").length
          }
          icon={Clock}
          loading={loading}
          iconColor="text-yellow-600"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={transactionColumns}
                data={transactions}
                loading={loading}
                pagination={{
                  page,
                  totalPages,
                  onPageChange: setPage,
                }}
                emptyMessage="No transactions found"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={subscriptionColumns}
                data={subscriptions}
                loading={loading}
                pagination={{
                  page,
                  totalPages,
                  onPageChange: setPage,
                }}
                emptyMessage="No subscriptions found"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Event Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={webhookColumns}
                data={webhookLogs}
                loading={loading}
                pagination={{
                  page,
                  totalPages,
                  onPageChange: setPage,
                }}
                emptyMessage="No webhook logs found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
