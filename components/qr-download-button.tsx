"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QRDownloadButtonProps {
  qrCodeUrl: string
  staffName: string
  staffId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  className?: string
}

export function QRDownloadButton({
  qrCodeUrl,
  staffName,
  staffId,
  variant = "outline",
  size = "sm",
  className = "",
}: QRDownloadButtonProps) {
  const handleDownload = async () => {
    try {
      // Fetch the QR code image
      const response = await fetch(qrCodeUrl)
      const blob = await response.blob()

      // Create a download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `${staffId}-${staffName.replace(/\s+/g, "_")}-QR.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to download QR code:", error)
      alert("Failed to download QR code. Please try again.")
    }
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleDownload}
      className={className}
    >
      <Download className="w-4 h-4 mr-1" />
      Download
    </Button>
  )
}
