/**
 * Hook for handling subscription upgrade payments
 * Integrates with Paystack payment gateway
 */

import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UpgradePaymentOptions {
  plan: 'professional' | 'enterprise'
  onSuccess?: () => void
  onError?: (error: string) => void
}

interface UpgradePaymentResult {
  success: boolean
  authorizationUrl?: string
  reference?: string
  amount?: number
  error?: string
}

export function useSubscriptionPayment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const initiateUpgradePayment = async (options: UpgradePaymentOptions) => {
    setLoading(true)
    setError(null)

    try {
      // Call the upgrade endpoint to initialize payment
      const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          targetPlan: options.plan,
        }),
      })

      const data = (await response.json()) as UpgradePaymentResult

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to initiate payment'
        setError(errorMessage)
        options.onError?.(errorMessage)
        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: errorMessage,
        })
        setLoading(false)
        return
      }

      if (!data.success || !data.authorizationUrl) {
        const errorMessage = data.error || 'Failed to get payment link'
        setError(errorMessage)
        options.onError?.(errorMessage)
        toast({
          variant: 'destructive',
          title: 'Payment Error',
          description: errorMessage,
        })
        setLoading(false)
        return
      }

      // Success - show toast and redirect to Paystack
      toast({
        title: 'Redirecting to Payment',
        description: `Upgrading to ${options.plan} plan. You will be redirected to complete payment.`,
      })

      // Store the upgrade info in sessionStorage for reference after payment
      sessionStorage.setItem('upgradeInProgress', JSON.stringify({
        plan: options.plan,
        reference: data.reference,
        timestamp: new Date().toISOString(),
      }))

      // Call success callback before redirect
      options.onSuccess?.()
      
      // Redirect to Paystack checkout (keep loading true during navigation)
      window.location.href = data.authorizationUrl
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while initiating payment'
      setError(errorMessage)
      options.onError?.(errorMessage)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: errorMessage,
      })
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    initiateUpgradePayment,
  }
}
