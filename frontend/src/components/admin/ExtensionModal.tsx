import { useState, useEffect, useId } from 'react'
import { X, CheckCircle } from 'lucide-react'
import { format, addDays, differenceInMonths } from 'date-fns'
import { Button, DatePicker } from '@/components/ui'
import { sendExtensionPaymentLink } from '@/lib/api'
import type { RentalRecord } from '@/types'

interface ExtensionModalProps {
  isOpen: boolean
  onClose: () => void
  rental: RentalRecord | null
  onSuccess: () => void
}

export function ExtensionModal({ isOpen, onClose, rental, onSuccess }: ExtensionModalProps) {
  const [newEndDate, setNewEndDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const titleId = useId()

  const extensionStartDate = rental
    ? format(addDays(new Date(rental.endDate), 1), 'yyyy-MM-dd')
    : ''

  const extensionMonths = newEndDate && extensionStartDate
    ? Math.max(1, differenceInMonths(new Date(newEndDate), new Date(extensionStartDate)))
    : 0

  const rentalAmount = extensionMonths * 5000
  const totalAmount = rentalAmount

  useEffect(() => {
    if (isOpen) {
      setNewEndDate('')
      setError(null)
      setSuccessEmail(null)
      setIsLoading(false)
    }
  }, [isOpen, rental])

  const handleSubmit = async () => {
    if (!rental || !newEndDate || extensionMonths < 1) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await sendExtensionPaymentLink({
        rentalId: rental.id,
        newEndDate,
        extensionMonths,
      })

      if (!response.success) {
        setError(response.error || 'Failed to send extension payment link')
        return
      }

      setSuccessEmail(rental.studentEmail || rental.id)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (successEmail) {
      onSuccess()
    }
    onClose()
  }

  if (!isOpen || !rental) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 id={titleId} className="text-xl font-semibold text-gray-900">
            Extend Rental
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {successEmail ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-gray-900 font-medium mb-1">Payment link sent!</p>
            <p className="text-sm text-gray-500">
              Sent to {successEmail}
            </p>
            <div className="mt-6">
              <Button variant="primary" onClick={handleClose} className="w-full">
                Done
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Current Rental Info */}
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Locker:</span>{' '}
                <span className="font-medium text-gray-900">#{rental.lockerNumber}</span>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Student:</span>{' '}
                <span className="font-medium text-gray-900">
                  {rental.studentName || rental.studentEmail || '-'}
                </span>
              </div>
              {rental.studentEmail && (
                <div className="text-sm">
                  <span className="text-gray-500">Email:</span>{' '}
                  <span className="text-gray-900">{rental.studentEmail}</span>
                </div>
              )}
              <div className="text-sm">
                <span className="text-gray-500">Current period:</span>{' '}
                <span className="text-gray-900">
                  {format(new Date(rental.startDate), 'MMM d, yyyy')} - {format(new Date(rental.endDate), 'MMM d, yyyy')}
                </span>
              </div>
            </div>

            <hr className="my-4 border-gray-200" />

            {/* Extension Section */}
            <div className="space-y-4">
              <div className="text-sm">
                <span className="text-gray-500">Extension starts:</span>{' '}
                <span className="font-medium text-gray-900">
                  {format(new Date(extensionStartDate), 'MMM d, yyyy')}
                </span>
              </div>

              <DatePicker
                label="New End Date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                min={extensionStartDate}
                disabled={isLoading}
                required
              />

              {extensionMonths > 0 && (
                <div className="space-y-1 text-sm">
                  <div className="text-gray-700">
                    {extensionMonths} month{extensionMonths !== 1 ? 's' : ''} x $50/month = ${(rentalAmount / 100).toFixed(2)}
                  </div>
                  <div className="text-gray-400">
                    Key Deposit: $0 (already paid)
                  </div>
                  <div className="font-semibold text-gray-900 pt-1">
                    Total: ${(totalAmount / 100).toFixed(2)}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <p className="text-sm text-red-600 mt-4" role="alert">{error}</p>
            )}

            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                disabled={isLoading || extensionMonths < 1 || !newEndDate}
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Send Payment Link'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
