import { useState } from 'react'
import { Button } from '@/components/ui'
import { sendPaymentLink } from '@/lib/api'
import type { Locker } from '@/types'
import { CheckCircle, Mail } from 'lucide-react'

interface CheckoutButtonProps {
  locker: Locker
  startDate: string
  endDate: string
  totalMonths: number
  studentDbId?: string
  studentEmail: string
  studentName: string
  disabled?: boolean
}

export function CheckoutButton({
  locker,
  startDate,
  endDate,
  totalMonths,
  studentDbId,
  studentEmail,
  studentName,
  disabled,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')

  const handleSendPaymentLink = async () => {
    setIsLoading(true)
    try {
      const response = await sendPaymentLink({
        lockerId: locker.id,
        startDate,
        endDate,
        totalMonths,
        studentDbId,
        studentEmail,
        studentName,
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to send payment link')
      }

      setEmailSent(true)
      setSentToEmail(response.data.email)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to send payment link. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-green-800 mb-2">
          Payment Link Sent!
        </h3>
        <p className="text-green-700 mb-2">
          We've sent a payment link to:
        </p>
        <p className="font-medium text-green-800 flex items-center justify-center gap-2">
          <Mail className="h-4 w-4" />
          {sentToEmail}
        </p>
        <p className="text-sm text-green-600 mt-4">
          Please check your email and complete the payment within 24 hours.
        </p>
      </div>
    )
  }

  return (
    <Button
      onClick={handleSendPaymentLink}
      isLoading={isLoading}
      disabled={disabled || !studentEmail || !studentName}
      size="lg"
      className="w-full"
    >
      <Mail className="h-5 w-5 mr-2" />
      Send Payment Link
    </Button>
  )
}
