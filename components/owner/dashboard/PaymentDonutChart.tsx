"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface PaymentRateData {
  successful: number
  failed: number
  successRate: number
}

interface PaymentDonutChartProps {
  data: PaymentRateData | null
  loading?: boolean
}

const COLORS = {
  successful: "#10b981",
  failed: "#ef4444",
}

export function PaymentDonutChart({ data, loading }: PaymentDonutChartProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Success Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  const chartData = data
    ? [
        { name: "Successful", value: data.successful },
        { name: "Failed", value: data.failed },
      ]
    : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Success Rate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center mb-4">
          <p className="text-3xl font-bold text-green-600">
            {data?.successRate.toFixed(1)}%
          </p>
          <p className="text-sm text-gray-600">Success Rate</p>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === "Successful"
                      ? COLORS.successful
                      : COLORS.failed
                  }
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
