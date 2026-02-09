import { format } from 'date-fns'
import { Badge, Button } from '@/components/ui'
import type { RentalRecord } from '@/types'

interface RentalTableProps {
  rentals: RentalRecord[]
  onExtend?: (rental: RentalRecord) => void
}

function getStatusVariant(status: string): 'success' | 'warning' | 'danger' | 'default' {
  switch (status) {
    case 'active':
      return 'success'
    case 'pending':
      return 'warning'
    case 'expired':
    case 'canceled':
      return 'danger'
    default:
      return 'default'
  }
}

export function RentalTable({ rentals, onExtend }: RentalTableProps) {
  if (rentals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No rentals found.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Locker
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Student
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Period
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount
            </th>
            {onExtend && (
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rentals.map((rental) => (
            <tr key={rental.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="font-medium text-gray-900">
                  #{rental.lockerNumber}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{rental.studentName || '-'}</div>
                <div className="text-sm text-gray-500">{rental.studentEmail || '-'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {format(new Date(rental.startDate), 'MMM d, yyyy')} -{' '}
                {format(new Date(rental.endDate), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={getStatusVariant(rental.status)}>
                  {rental.status}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${(rental.totalAmount / 100).toFixed(2)}
              </td>
              {onExtend && (
                <td className="px-6 py-4 whitespace-nowrap">
                  {rental.status === 'active' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onExtend(rental)}
                    >
                      Extend
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
