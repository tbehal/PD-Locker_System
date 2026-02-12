import { useState } from 'react'
import { Button, Input, Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { createStudent } from '@/lib/api'
import type { Student } from '@/types'

interface StudentInfoFormProps {
  onStudentCreated: (student: Student) => void
  onSkip?: () => void
}

export function StudentInfoForm({ onStudentCreated, onSkip }: StudentInfoFormProps) {
  const [studentName, setStudentName] = useState('')
  const [studentId, setStudentId] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await createStudent({
        studentName,
        studentId,
        studentEmail,
      })

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to save student information')
      }

      onStudentCreated(response.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save student information')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card variant="elevated">
      <CardHeader>
        <CardTitle>Student Information</CardTitle>
        <p className="text-gray-600 mt-1">Please enter your details to continue with the rental</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="John Doe"
            required
          />
          <Input
            label="Student ID"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g., STU-12345"
            required
          />
          <Input
            label="Email Address"
            type="email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            placeholder="john@example.com"
            required
          />

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              isLoading={isLoading}
              disabled={!studentName || !studentId || !studentEmail}
              className="flex-1"
            >
              Continue
            </Button>
            {onSkip && (
              <Button
                type="button"
                variant="outline"
                onClick={onSkip}
                disabled={isLoading}
              >
                Skip
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
