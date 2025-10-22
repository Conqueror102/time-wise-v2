"use client"

import { useEffect, useRef, useState } from "react"
import { Html5QrcodeScanner } from "html5-qrcode"

interface QRScannerProps {
  onScan: (result: string) => void
}

export function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    if (!isScanning) {
      setIsScanning(true)

      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false,
      )

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText)
          scannerRef.current?.clear()
        },
        (error) => {
          // Handle scan error silently
        },
      )
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [onScan, isScanning])

  return (
    <div className="w-full">
      <div id="qr-reader" className="w-full"></div>
    </div>
  )
}
