export async function generateQRCode(staffId: string): Promise<string> {
  try {
    const QRCode = (await import("qrcode")).default

    const qrCodeDataURL = await QRCode.toDataURL(staffId, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
    return qrCodeDataURL
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw new Error("Failed to generate QR code")
  }
}
