import { useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format, differenceInMonths } from 'date-fns'
import { LockerGrid } from '@/components/locker'
import { CheckoutButton } from '@/components/payment'
import { StudentInfoForm } from '@/components/student'
import { Button, Card, CardContent, CardHeader, CardTitle, DatePicker } from '@/components/ui'
import { useLockerStore } from '@/store/lockerStore'
import { fetchLockers } from '@/lib/api'
import type { Locker, Student } from '@/types'

export default function LockersPage() {
  const { lockers, setLockers, selectedLockerId, selectLocker } = useLockerStore()
  const [isLoading, setIsLoading] = useState(false)
  const [startDateInput, setStartDateInput] = useState('')
  const [endDateInput, setEndDateInput] = useState('')
  const [showGrid, setShowGrid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedDates, setConfirmedDates] = useState<{ start: string; end: string } | null>(null)
  const [student, setStudent] = useState<Student | null>(null)
  const [showStudentForm, setShowStudentForm] = useState(false)

  const loadLockers = useCallback(async (startDate: string, endDate: string) => {
    setIsLoading(true)
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
      setIsLoading(false)
    }
  }, [setLockers])

  const availableLockers = lockers.filter((l) => l.status === 'available')

  const selectedLocker = lockers.find((l) => l.id === selectedLockerId)

  const handleCheckAvailability = async () => {
    if (startDateInput && endDateInput) {
      if (new Date(endDateInput) <= new Date(startDateInput)) {
        setError('End date must be after start date')
        return
      }
      setConfirmedDates({ start: startDateInput, end: endDateInput })
      setShowGrid(true)
      setShowStudentForm(true)
      selectLocker(null)
      await loadLockers(startDateInput, endDateInput)
    }
  }

  const handleLockerSelect = (locker: Locker) => {
    if (locker.status === 'available') {
      selectLocker(locker.id === selectedLockerId ? null : locker.id)
    }
  }

  const handleStudentCreated = (newStudent: Student) => {
    setStudent(newStudent)
    setShowStudentForm(false)
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

  const { formattedStartDate, formattedEndDate, totalMonths, totalPrice } = useMemo(() => {
    if (!confirmedDates) {
      return { formattedStartDate: '', formattedEndDate: '', totalMonths: 0, totalPrice: 0 }
    }
    const start = new Date(confirmedDates.start)
    const end = new Date(confirmedDates.end)
    const months = Math.max(1, differenceInMonths(end, start))
    return {
      formattedStartDate: format(start, 'MMMM d, yyyy'),
      formattedEndDate: format(end, 'MMMM d, yyyy'),
      totalMonths: months,
      totalPrice: months * 50,
    }
  }, [confirmedDates])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link to="/">
            <img src="/prep.svg" alt="Prep Doctors" width={121} height={48} />
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Card variant="elevated" className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Rent a Locker</CardTitle>
            <p className="text-gray-600 mt-1">Select your rental period</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <DatePicker
                  label="Start Date"
                  id="start-date"
                  value={startDateInput}
                  onChange={(e) => {
                    setStartDateInput(e.target.value)
                    if (endDateInput && new Date(e.target.value) >= new Date(endDateInput)) {
                      setEndDateInput('')
                    }
                  }}
                  min={getMinDate()}
                />
              </div>
              <div className="flex-1">
                <DatePicker
                  label="End Date"
                  id="end-date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  min={getMinEndDate()}
                  disabled={!startDateInput}
                />
              </div>
              <Button
                onClick={handleCheckAvailability}
                disabled={!startDateInput || !endDateInput || isLoading}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Checking...' : 'Check Availability'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="text-center py-4 mb-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        {showStudentForm && !student && (
          <div className="mb-8">
            <StudentInfoForm
              onStudentCreated={handleStudentCreated}
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading lockers...</p>
          </div>
        ) : showGrid && confirmedDates && lockers.length > 0 ? (
          <>
            <Card variant="elevated" className="mb-6">
              <CardHeader>
                <CardTitle>Available from {formattedStartDate} to {formattedEndDate}</CardTitle>
                <p className="text-gray-600 mt-1">
                  {availableLockers.length} of {lockers.length} lockers available ({totalMonths} month{totalMonths !== 1 ? 's' : ''})
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
                  </div>
                </div>
                <LockerGrid
                  lockers={lockers}
                  selectedLockerId={selectedLockerId}
                  onSelect={handleLockerSelect}
                />
              </CardContent>
            </Card>

            {selectedLocker && selectedLocker.status === 'available' && student && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Selected: Locker #{selectedLocker.number}</CardTitle>
                  <p className="text-gray-600 mt-1">
                    ${totalPrice} total ({totalMonths} month{totalMonths !== 1 ? 's' : ''} x $50/month)
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    {formattedStartDate} - {formattedEndDate}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Student: {student.studentName} ({student.studentEmail})
                  </p>
                </CardHeader>
                <CardContent>
                  <CheckoutButton
                    locker={selectedLocker}
                    startDate={confirmedDates.start}
                    endDate={confirmedDates.end}
                    totalMonths={totalMonths}
                    studentDbId={student.id}
                    studentEmail={student.studentEmail}
                    studentName={student.studentName}
                  />
                </CardContent>
              </Card>
            )}

            {selectedLocker && selectedLocker.status === 'available' && !student && (
              <Card variant="bordered" className="border-amber-200 bg-amber-50">
                <CardContent className="text-center py-6">
                  <p className="text-amber-800">
                    Please fill in your student information above to proceed with the payment.
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
