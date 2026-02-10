import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { format, differenceInMonths } from 'date-fns'
import { Mail, CheckCircle } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, DatePicker, Input } from '@/components/ui'
import { LockerGrid } from '@/components/locker'
import { fetchLockers, sendPaymentLink, searchStudents } from '@/lib/api'
import type { StudentSearchResult } from '@/lib/api'
import type { Locker } from '@/types'

export function BookLockerTab() {
  // Date selection state
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [confirmedDates, setConfirmedDates] = useState<{ start: string; end: string } | null>(null)

  // Locker state
  const [lockers, setLockers] = useState<Locker[]>([])
  const [selectedLockerId, setSelectedLockerId] = useState<string | null>(null)
  const [isLoadingLockers, setIsLoadingLockers] = useState(false)

  // Student info state
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [studentId, setStudentId] = useState('')

  // Autofill state
  const [suggestions, setSuggestions] = useState<StudentSearchResult[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [sentToEmail, setSentToEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const loadLockers = useCallback(async (startDate: string, endDate: string) => {
    setIsLoadingLockers(true)
    setError(null)
    try {
      const response = await fetchLockers(startDate, endDate)
      if (response.success && response.data) {
        setLockers(response.data)
      } else {
        setError(response.error || 'Failed to fetch lockers')
      }
    } catch {
      setError('Failed to fetch lockers')
    } finally {
      setIsLoadingLockers(false)
    }
  }, [])

  const handleStudentFieldChange = useCallback((query: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await searchStudents(query)
        if (response.success && response.data && response.data.length > 0) {
          setSuggestions(response.data)
          setShowSuggestions(true)
        } else {
          setSuggestions([])
          setShowSuggestions(false)
        }
      } catch {
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  const handleSelectSuggestion = (suggestion: StudentSearchResult) => {
    setStudentName(suggestion.fullName)
    setStudentEmail(suggestion.email)
    setStudentId(suggestion.studentId)
    setSuggestions([])
    setShowSuggestions(false)
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCheckAvailability = async () => {
    if (!startDateInput || !endDateInput) return

    if (new Date(endDateInput) <= new Date(startDateInput)) {
      setError('End date must be after start date')
      return
    }

    setConfirmedDates({ start: startDateInput, end: endDateInput })
    setSelectedLockerId(null)
    setEmailSent(false)
    await loadLockers(startDateInput, endDateInput)
  }

  const handleLockerSelect = (locker: Locker) => {
    if (locker.status === 'available') {
      setSelectedLockerId(locker.id === selectedLockerId ? null : locker.id)
    }
  }

  const handleSendPaymentLink = async () => {
    if (!selectedLocker || !confirmedDates || !studentName || !studentEmail || !studentId) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await sendPaymentLink({
        lockerId: selectedLocker.id,
        startDate: confirmedDates.start,
        endDate: confirmedDates.end,
        totalMonths,
        studentEmail,
        studentName,
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to send payment link')
      }

      setEmailSent(true)
      setSentToEmail(response.data.email)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send payment link')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setStartDateInput('')
    setEndDateInput('')
    setConfirmedDates(null)
    setLockers([])
    setSelectedLockerId(null)
    setStudentName('')
    setStudentEmail('')
    setStudentId('')
    setSuggestions([])
    setShowSuggestions(false)
    setEmailSent(false)
    setSentToEmail('')
    setError(null)
  }

  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getMinEndDate = () => {
    if (!startDateInput) return getMinDate()
    const startDate = new Date(startDateInput)
    startDate.setDate(startDate.getDate() + 1)
    return startDate.toISOString().split('T')[0]
  }

  const availableLockers = lockers.filter((l) => l.status === 'available')
  const selectedLocker = lockers.find((l) => l.id === selectedLockerId)

  const KEY_DEPOSIT = 50 // $50 key deposit

  const { formattedStartDate, formattedEndDate, totalMonths, rentalPrice, totalPrice } = useMemo(() => {
    if (!confirmedDates) {
      return { formattedStartDate: '', formattedEndDate: '', totalMonths: 0, rentalPrice: 0, totalPrice: 0 }
    }
    const start = new Date(confirmedDates.start)
    const end = new Date(confirmedDates.end)
    // Calculate months, minimum 1 month
    const months = Math.max(1, differenceInMonths(end, start) || 1)
    const rental = months * 50
    return {
      formattedStartDate: format(start, 'MMMM d, yyyy'),
      formattedEndDate: format(end, 'MMMM d, yyyy'),
      totalMonths: months,
      rentalPrice: rental,
      totalPrice: rental + KEY_DEPOSIT,
    }
  }, [confirmedDates])

  const canSubmit = selectedLocker && studentName && studentEmail && studentId && !isSubmitting

  // Success state
  if (emailSent) {
    return (
      <Card variant="elevated">
        <CardContent className="py-12">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Payment Link Sent!
            </h3>
            <p className="text-green-700 mb-2">
              Payment link has been sent to:
            </p>
            <p className="font-medium text-green-800 flex items-center justify-center gap-2 mb-4">
              <Mail className="h-4 w-4" />
              {sentToEmail}
            </p>
            <p className="text-sm text-gray-600 mb-6">
              Locker #{selectedLocker?.number} | {formattedStartDate} - {formattedEndDate} | ${rentalPrice} rental + ${KEY_DEPOSIT} key deposit = ${totalPrice}
            </p>
            <Button onClick={handleReset} variant="primary">
              Book Another Locker
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step 1: Date Selection */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle>Step 1: Select Rental Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <DatePicker
                label="Start Date"
                value={startDateInput}
                onChange={(e) => {
                  setStartDateInput(e.target.value)
                  if (endDateInput && new Date(e.target.value) >= new Date(endDateInput)) {
                    setEndDateInput('')
                  }
                  setConfirmedDates(null)
                  setLockers([])
                  setSelectedLockerId(null)
                }}
                min={getMinDate()}
              />
            </div>
            <div className="flex-1">
              <DatePicker
                label="End Date"
                value={endDateInput}
                onChange={(e) => {
                  setEndDateInput(e.target.value)
                  setConfirmedDates(null)
                  setLockers([])
                  setSelectedLockerId(null)
                }}
                min={getMinEndDate()}
                disabled={!startDateInput}
              />
            </div>
            <Button
              onClick={handleCheckAvailability}
              disabled={!startDateInput || !endDateInput || isLoadingLockers}
              className="w-full sm:w-auto"
            >
              {isLoadingLockers ? 'Checking...' : 'Check Availability'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-center py-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {/* Step 2: Locker Selection */}
      {confirmedDates && lockers.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Step 2: Select a Locker</CardTitle>
            <p className="text-gray-600 mt-1">
              {availableLockers.length} of {lockers.length} lockers available for {formattedStartDate} - {formattedEndDate} ({totalMonths} month{totalMonths !== 1 ? 's' : ''})
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-200 border border-gray-300"></div>
                  <span className="text-gray-600">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-[#0660B2] border border-[#0660B2]"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
              </div>
            </div>
            <LockerGrid
              lockers={lockers}
              selectedLockerId={selectedLockerId}
              onSelect={handleLockerSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 3: Student Info & Send Payment Link */}
      {selectedLocker && (
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Step 3: Student Information</CardTitle>
            <div className="text-gray-600 mt-1 space-y-1">
              <p>Locker #{selectedLocker.number}</p>
              <p className="text-sm">
                Rental: ${rentalPrice} ({totalMonths} month{totalMonths !== 1 ? 's' : ''} x $50/month)
              </p>
              <p className="text-sm">
                Key Deposit: ${KEY_DEPOSIT} (refundable)
              </p>
              <p className="font-semibold text-gray-800">
                Total: ${totalPrice}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative" ref={suggestionsRef}>
              <div className="grid sm:grid-cols-3 gap-4 mb-6">
                <Input
                  label="Full Name"
                  value={studentName}
                  onChange={(e) => {
                    setStudentName(e.target.value)
                    handleStudentFieldChange(e.target.value)
                  }}
                  placeholder="John Doe"
                  required
                  autoComplete="off"
                />
                <Input
                  label="Email"
                  type="email"
                  value={studentEmail}
                  onChange={(e) => {
                    setStudentEmail(e.target.value)
                    handleStudentFieldChange(e.target.value)
                  }}
                  placeholder="john@example.com"
                  required
                  autoComplete="off"
                />
                <Input
                  label="Student ID"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value)
                    handleStudentFieldChange(e.target.value)
                  }}
                  placeholder="STU-12345"
                  required
                  autoComplete="off"
                />
              </div>
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 left-0 right-0 -mt-4 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {isSearching && (
                    <div className="px-4 py-2 text-sm text-gray-400">Searching...</div>
                  )}
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="text-sm font-medium text-gray-900">{suggestion.fullName}</div>
                      <div className="text-xs text-gray-500">
                        {suggestion.email}{suggestion.studentId ? ` · ${suggestion.studentId}` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <Button
              onClick={handleSendPaymentLink}
              disabled={!canSubmit}
              isLoading={isSubmitting}
              size="lg"
              className="w-full"
            >
              <Mail className="h-5 w-5 mr-2" />
              Send Payment Link
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
