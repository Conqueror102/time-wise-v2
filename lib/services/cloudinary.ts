/**
 * Cloudinary Service - Modular image upload service
 * Handles uploading attendance photos to Cloudinary
 */

import { v2 as cloudinary } from "cloudinary"

// Configure Cloudinary (done once)
if (
  !process.env.CLOUDINARY_CLOUD_NAME ||
  !process.env.CLOUDINARY_API_KEY ||
  !process.env.CLOUDINARY_API_SECRET
) {
  console.warn(
    "⚠️  Cloudinary credentials not configured. Image uploads will fail."
  )
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

export interface UploadResult {
  success: boolean
  url?: string
  publicId?: string
  error?: string
}

/**
 * Upload a base64 image to Cloudinary
 * @param base64Image - Base64 encoded image string (with or without data URI prefix)
 * @param folder - Cloudinary folder path (e.g., 'attendance/check-in')
 * @param publicId - Optional custom public ID for the image
 * @returns Upload result with URL and public ID
 */
export async function uploadImage(
  base64Image: string,
  folder: string = "attendance",
  publicId?: string
): Promise<UploadResult> {
  try {
    // Validate input
    if (!base64Image) {
      return {
        success: false,
        error: "No image provided",
      }
    }

    // Ensure base64 string has data URI prefix
    let imageData = base64Image
    if (!base64Image.startsWith("data:")) {
      imageData = `data:image/jpeg;base64,${base64Image}`
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(imageData, {
      folder,
      public_id: publicId,
      resource_type: "image",
      transformation: [
        {
          width: 800,
          height: 800,
          crop: "limit",
          quality: "auto:good",
          fetch_format: "auto",
        },
      ],
    })

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    }
  } catch (error: any) {
    console.error("Cloudinary upload error:", error)
    return {
      success: false,
      error: error.message || "Failed to upload image",
    }
  }
}

/**
 * Upload check-in photo with automatic naming
 * @param base64Image - Base64 encoded image
 * @param staffId - Staff ID for naming
 * @param tenantId - Tenant ID for folder organization
 * @returns Upload result
 */
export async function uploadCheckInPhoto(
  base64Image: string,
  staffId: string,
  tenantId: string
): Promise<UploadResult> {
  const folder = `timewise/${tenantId}/attendance/check-in`
  const publicId = `${staffId}-${Date.now()}`
  return uploadImage(base64Image, folder, publicId)
}

/**
 * Upload check-out photo with automatic naming
 * @param base64Image - Base64 encoded image
 * @param staffId - Staff ID for naming
 * @param tenantId - Tenant ID for folder organization
 * @returns Upload result
 */
export async function uploadCheckOutPhoto(
  base64Image: string,
  staffId: string,
  tenantId: string
): Promise<UploadResult> {
  const folder = `timewise/${tenantId}/attendance/check-out`
  const publicId = `${staffId}-${Date.now()}`
  return uploadImage(base64Image, folder, publicId)
}

/**
 * Delete an image from Cloudinary
 * @param publicId - The public ID of the image to delete
 * @returns Success status
 */
export async function deleteImage(publicId: string): Promise<UploadResult> {
  try {
    await cloudinary.uploader.destroy(publicId)
    return {
      success: true,
    }
  } catch (error: any) {
    console.error("Cloudinary delete error:", error)
    return {
      success: false,
      error: error.message || "Failed to delete image",
    }
  }
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  )
}
