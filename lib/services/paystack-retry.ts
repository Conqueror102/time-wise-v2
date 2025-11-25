/**
 * Paystack Retry Logic
 * Adds retry functionality for payment verification
 */

import { verifyPayment, PaystackVerifyResponse } from './paystack'

/**
 * Verify payment with automatic retry on failure
 */
export async function verifyPaymentWithRetry(
  reference: string,
  maxRetries: number = 3
): Promise<PaystackVerifyResponse> {
  let lastError: any

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await verifyPayment(reference)
      
      // If successful, return immediately
      if (result.success) {
        return result
      }
      
      // If not successful but not a network error, don't retry
      if (result.error && !result.error.includes('network') && !result.error.includes('timeout')) {
        return result
      }
      
      lastError = result.error
    } catch (error: any) {
      lastError = error
      console.error(`Payment verification attempt ${attempt + 1} failed:`, error)
    }

    // Don't wait after the last attempt
    if (attempt < maxRetries - 1) {
      // Exponential backoff: 1s, 2s, 4s
      const waitTime = 1000 * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  // All retries failed
  return {
    success: false,
    error: lastError?.message || 'Payment verification failed after multiple attempts',
  }
}
