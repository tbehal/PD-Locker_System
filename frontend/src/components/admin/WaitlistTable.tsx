import { format } from 'date-fns'
import { Pencil, Trash2 } from 'lucide-react'
import { Badge, Button } from '@/components/ui'
import type { WaitlistEntry, WaitlistStatus } from '@/types'

interface WaitlistTableProps {
  entries: WaitlistEntry[]
  onEdit: (entry: WaitlistEntry) => void
  onDelete: (entry: WaitlistEntry) => void
}

function getStatusVariant(status: WaitlistStatus): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'none':
      return 'default'
    case 'contacted':
      return 'default'
    case 'link_sent':
      return 'warning'
    case 'not_needed':
      return 'danger'
    case 'paid':
      return 'success'
    default:
      return 'default'
  }
}

function getStatusLabel(status: WaitlistStatus): string {
  switch (status) {
    case 'none':
      return 'None'
    case 'contacted':
      return 'Contacted'
    case 'link_sent':
      return 'Link Sent'
    case 'not_needed':
      return 'Not Needed'
    case 'paid':
      return 'Paid'
    default:
      return status
  }
}

export function WaitlistTable({ entries, onEdit, onDelete }: WaitlistTableProps) {
  if (entries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No waitlist entries found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Potential Dates
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Added
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.map((entry, index) => (
            <tr key={entry.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{entry.fullName}</div>
                <div className="text-sm text-gray-500">{entry.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {entry.studentId}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(entry.potentialStartDate), 'MMM d, yyyy')} -{' '}
                {format(new Date(entry.potentialEndDate), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusVariant(entry.status)}>
                  {getStatusLabel(entry.status)}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(entry.createdAt), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(entry)}
                    aria-label="Edit entry"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(entry)}
                    aria-label="Delete entry"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
