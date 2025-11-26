/**
 * Paystack Payment Service (Nigerian Payment Gateway)
 * Clean and modular implementation with retry logic and timeout
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL = "https://api.paystack.co"
const REQUEST_TIMEOUT = 30000 // 30 seconds
const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export interface PaystackInitializeResponse {
  success: boolean
  authorizationUrl?: string
  reference?: string
  error?: string
}

export interface PaystackVerifyResponse {
  success: boolean
  amount?: number
  currency?: string
  status?: string
  reference?: string
  metadata?: Record<string, any>
  customer?: {
    customer_code: string
    email: string
  }
  error?: string
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error: any) {
    clearTimeout(timeoutId)
    if (error.name === "AbortError") {
      throw new Error("Request timeout")
    }
    throw error
  }
}

/**
 * Retry logic for API calls
 */
async function retryFetch(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options)
      
      // If response is successful or client error (4xx), don't retry
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        return response
      }

      // Server error (5xx), retry
      lastError = new Error(`Server error: ${response.status}`)
    } catch (error: any) {
      lastError = error
      
      // Don't retry on timeout or abort
      if (error.message === "Request timeout" || error.name === "AbortError") {
        throw error
      }
    }

    // Wait before retrying (exponential backoff)
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * Math.pow(2, attempt)))
    }
  }

  throw lastError || new Error("Request failed after retries")
}

/**
 * Initialize Paystack payment
 */
export async function initializePayment(
  email: string,
  amount: number, // Amount in kobo (₦1 = 100 kobo)
  metadata: Record<string, any>
): Promise<PaystackInitializeResponse> {
  try {
    const response = await retryFetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount, // In kobo
        currency: "NGN",
        metadata,
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Failed to initialize payment",
      }
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    }
  } catch (error: any) {
    console.error("Paystack initialize error:", error)
    return {
      success: false,
      error: error.message || "Payment initialization failed",
    }
  }
}

/**
 * Verify Paystack payment
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyResponse> {
  try {
    const response = await retryFetch(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    })

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Payment verification failed",
      }
    }

    return {
      success: true,
      amount: data.data.amount,
      currency: data.data.currency,
      status: data.data.status,
      reference: data.data.reference,
      metadata: data.data.metadata,
      customer: data.data.customer,
    }
  } catch (error: any) {
    console.error("Paystack verify error:", error)
    return {
      success: false,
      error: error.message || "Payment verification failed",
    }
  }
}

/**
 * Convert Naira to Kobo
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100)
}

/**
 * Convert Kobo to Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100
}

/**
 * Initialize Paystack subscription
 */
export async function initializeSubscription(
  email: string,
  planCode: string,
  metadata: Record<string, any>
): Promise<PaystackInitializeResponse> {
  try {
    const response = await retryFetch(`${PAYSTACK_BASE_URL}/subscription`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customer: email,
        plan: planCode,
        metadata,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Failed to initialize subscription",
      }
    }

    return {
      success: true,
      authorizationUrl: data.data.authorization_url || "",
      reference: data.data.subscription_code,
    }
  } catch (error: any) {
    console.error("Paystack subscription error:", error)
    return {
      success: false,
      error: error.message || "Subscription initialization failed",
    }
  }
}

/**
 * Cancel Paystack subscription
 */
export async function cancelSubscription(
  subscriptionCode: string,
  emailToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/subscription/disable`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: subscriptionCode,
        token: emailToken,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Failed to cancel subscription",
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Paystack cancel subscription error:", error)
    return {
      success: false,
      error: error.message || "Subscription cancellation failed",
    }
  }
}

/**
 * Create Paystack customer
 */
export async function createCustomer(
  email: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; customerCode?: string; error?: string }> {
  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/customer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
      }),
    })

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Failed to create customer",
      }
    }

    return {
      success: true,
      customerCode: data.data.customer_code,
    }
  } catch (error: any) {
    console.error("Paystack create customer error:", error)
    return {
      success: false,
      error: error.message || "Customer creation failed",
    }
  }
}

/**
 * Super Admin Functions
 */

/**
 * Get all transactions (for super admin)
 */
export async function getAllTransactions(params?: {
  page?: number
  perPage?: number
  from?: string
  to?: string
}): Promise<{
  success: boolean
  transactions?: any[]
  meta?: any
  error?: string
}> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set("page", params.page.toString())
    if (params?.perPage) queryParams.set("perPage", params.perPage.toString())
    if (params?.from) queryParams.set("from", params.from)
    if (params?.to) queryParams.set("to", params.to)

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Failed to fetch transactions",
      }
    }

    return {
      success: true,
      transactions: data.data,
      meta: data.meta,
    }
  } catch (error: any) {
    console.error("Paystack get transactions error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch transactions",
    }
  }
}

/**
 * Get all subscriptions (for super admin)
 */
export async function getAllSubscriptions(params?: {
  page?: number
  perPage?: number
}): Promise<{
  success: boolean
  subscriptions?: any[]
  meta?: any
  error?: string
}> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set("page", params.page.toString())
    if (params?.perPage) queryParams.set("perPage", params.perPage.toString())

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/subscription?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Failed to fetch subscriptions",
      }
    }

    return {
      success: true,
      subscriptions: data.data,
      meta: data.meta,
    }
  } catch (error: any) {
    console.error("Paystack get subscriptions error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch subscriptions",
    }
  }
}

/**
 * Get all plans (for super admin)
 */
export async function getAllPlans(params?: {
  page?: number
  perPage?: number
}): Promise<{
  success: boolean
  plans?: any[]
  meta?: any
  error?: string
}> {
  try {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.set("page", params.page.toString())
    if (params?.perPage) queryParams.set("perPage", params.perPage.toString())

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/plan?${queryParams.toString()}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = await response.json()

    if (!data.status) {
      return {
        success: false,
        error: data.message || "Failed to fetch plans",
      }
    }

    return {
      success: true,
      plans: data.data,
      meta: data.meta,
    }
  } catch (error: any) {
    console.error("Paystack get plans error:", error)
    return {
      success: false,
      error: error.message || "Failed to fetch plans",
    }
  }
}
