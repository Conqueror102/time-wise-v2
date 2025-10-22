/**
 * Image utility functions
 * Handles both Cloudinary URLs and base64 images
 */

/**
 * Check if a string is a URL (Cloudinary) or base64
 * @param imageString - Image string to check
 * @returns true if URL, false if base64
 */
export function isImageUrl(imageString: string): boolean {
  if (!imageString) return false
  return (
    imageString.startsWith("http://") ||
    imageString.startsWith("https://") ||
    imageString.startsWith("//")
  )
}

/**
 * Get the proper src attribute for an image
 * Handles both Cloudinary URLs and base64 strings
 * @param imageString - Image string (URL or base64)
 * @returns Proper src attribute value
 */
export function getImageSrc(imageString: string): string {
  if (!imageString) return ""

  // If it's a URL, return as-is
  if (isImageUrl(imageString)) {
    return imageString
  }

  // If it already has data URI prefix, return as-is
  if (imageString.startsWith("data:")) {
    return imageString
  }

  // Otherwise, add data URI prefix for base64
  return `data:image/jpeg;base64,${imageString}`
}

/**
 * Check if image storage is using Cloudinary
 * @param imageString - Image string to check
 * @returns true if using Cloudinary
 */
export function isCloudinaryImage(imageString: string): boolean {
  if (!imageString) return false
  return imageString.includes("cloudinary.com")
}
