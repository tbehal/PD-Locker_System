import { Badge } from '@/components/ui'
import type { LockerStatus as LockerStatusType } from '@/types'

interface LockerStatusProps {
  status: LockerStatusType
}

const statusConfig: Record<LockerStatusType, { label: string; variant: 'success' | 'danger' }> = {
  available: { label: 'Available', variant: 'success' },
  occupied: { label: 'Occupied', variant: 'danger' },
}

export function LockerStatus({ status }: LockerStatusProps) {
  const config = statusConfig[status]

  return <Badge variant={config.variant}>{config.label}</Badge>
}
