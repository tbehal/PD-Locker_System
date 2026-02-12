import { useState, useEffect, useId } from 'react'
import { X } from 'lucide-react'
import { Button, Input, DatePicker, Select, type SelectOption } from '@/components/ui'
import type { WaitlistEntry, WaitlistStatus, CreateWaitlistData, UpdateWaitlistData } from '@/types'

interface WaitlistFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateWaitlistData | UpdateWaitlistData) => Promise<void>
  entry?: WaitlistEntry | null
  isLoading?: boolean
  error?: string | null
}

const statusOptions: SelectOption[] = [
  { value: 'none', label: 'None' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'link_sent', label: 'Link Sent' },
  { value: 'not_needed', label: 'Not Needed' },
  { value: 'paid', label: 'Paid (removes from list)' },
]

export function WaitlistForm({ isOpen, onClose, onSubmit, entry, isLoading, error }: WaitlistFormProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [studentId, setStudentId] = useState('')
  const [potentialStartDate, setPotentialStartDate] = useState('')
  const [potentialEndDate, setPotentialEndDate] = useState('')
  const [status, setStatus] = useState<WaitlistStatus>('none')
  const [formError, setFormError] = useState<string | null>(null)

  const titleId = useId()
  const descriptionId = useId()
  const isEditing = !!entry

  useEffect(() => {
    if (entry) {
      setFullName(entry.fullName)
      setEmail(entry.email)
      setStudentId(entry.studentId)
      setPotentialStartDate(entry.potentialStartDate)
      setPotentialEndDate(entry.potentialEndDate)
      setStatus(entry.status)
    } else {
      setFullName('')
      setEmail('')
      setStudentId('')
      setPotentialStartDate('')
      setPotentialEndDate('')
      setStatus('none')
    }
    setFormError(null)
  }, [entry, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Basic validation
    if (!fullName.trim()) {
      setFormError('Full name is required')
      return
    }
    if (!email.trim()) {
      setFormError('Email is required')
      return
    }
    if (!studentId.trim()) {
      setFormError('Student ID is required')
      return
    }
    if (!potentialStartDate) {
      setFormError('Start date is required')
      return
    }
    if (!potentialEndDate) {
      setFormError('End date is required')
      return
    }
    if (new Date(potentialEndDate) < new Date(potentialStartDate)) {
      setFormError('End date must be after start date')
      return
    }

    await onSubmit({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      studentId: studentId.trim(),
      potentialStartDate,
      potentialEndDate,
      status,
    })
  }

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 id={titleId} className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Waitlist Entry' : 'Add to Waitlist'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p id={descriptionId} className="sr-only">
          {isEditing ? 'Edit the details of the waitlist entry.' : 'Fill out the form to add a new student to the waitlist.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="John Doe"
            disabled={isLoading}
            required
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john.doe@example.com"
            disabled={isLoading}
            required
          />

          <Input
            label="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="STU123456"
            disabled={isLoading}
            required
          />

          <DatePicker
            label="Potential Start Date"
            value={potentialStartDate}
            onChange={(e) => setPotentialStartDate(e.target.value)}
            disabled={isLoading}
            required
          />

          <DatePicker
            label="Potential End Date"
            value={potentialEndDate}
            onChange={(e) => setPotentialEndDate(e.target.value)}
            min={potentialStartDate}
            disabled={isLoading}
            required
          />

          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as WaitlistStatus)}
            options={statusOptions}
            disabled={isLoading}
          />

          {(formError || error) && (
            <p className="text-sm text-red-600" role="alert">{formError || error}</p>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : isEditing ? 'Save Changes' : 'Add to Waitlist'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
