"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ExportButtonProps {
  timeRange: "7d" | "30d" | "90d" | "1y"
}

/** Downloads the attendance records for the selected range as CSV (opens in Excel) */
export function ExportButton({ timeRange }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const token = localStorage.getItem("accessToken")
      const response = await fetch(`/api/analytics/export?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Export failed")
      }

      const filename =
        response.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] || `attendance-${timeRange}.csv`
      const url = window.URL.createObjectURL(await response.blob())
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: error instanceof Error ? error.message : "Please try again.",
      })
    } finally {
      setExporting(false)
    }
  }

  return (
    <Button variant="outline" disabled={exporting} onClick={handleExport}>
      {exporting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Exporting...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </>
      )}
    </Button>
  )
}
