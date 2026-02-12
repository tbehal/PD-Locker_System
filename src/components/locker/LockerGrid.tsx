'use client'

import { LockerCard } from './LockerCard'
import type { Locker } from '@/types'

interface LockerGridProps {
  lockers: Locker[]
  selectedLockerId?: string | null
  onSelect?: (locker: Locker) => void
}

export function LockerGrid({ lockers, selectedLockerId, onSelect }: LockerGridProps) {
  if (lockers.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No lockers found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-5 gap-3">
      {lockers.map((locker) => (
        <LockerCard
          key={locker.id}
          locker={locker}
          isAvailable={locker.status === 'available'}
          isSelected={locker.id === selectedLockerId}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}
