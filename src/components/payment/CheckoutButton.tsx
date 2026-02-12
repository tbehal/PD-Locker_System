'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import type { Locker } from '@/types'

interface CheckoutButtonProps {
  locker: Locker
  startDate: string
  endDate: string
  totalWeeks: number
  disabled?: boolean
}

export function CheckoutButton({ locker, startDate, endDate, totalWeeks, disabled }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lockerId: locker.id, startDate, endDate, totalWeeks }),
      })

      const data = await response.json()

      if (!data.success || !data.data?.url) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      window.location.href = data.data.url
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Checkout failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      isLoading={isLoading}
      disabled={disabled}
      size="lg"
      className="w-full"
    >
      Proceed to Checkout
    </Button>
  )
}
