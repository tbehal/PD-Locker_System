'use client'

import { cn } from '@/lib/utils'
import type { Locker } from '@/types'

interface LockerCardProps {
  locker: Locker
  isAvailable: boolean
  onSelect?: (locker: Locker) => void
  isSelected?: boolean
}

export function LockerCard({ locker, isAvailable, onSelect, isSelected }: LockerCardProps) {
  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={() => isAvailable && onSelect?.(locker)}
      className={cn(
        'aspect-square rounded-md flex items-center justify-center text-lg font-semibold transition-all',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0660B2]',
        isAvailable
          ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
          : 'bg-gray-200 text-gray-500 cursor-not-allowed',
        isSelected && 'ring-2 ring-[#0660B2] bg-[#0660B2] text-white hover:bg-[#0550A0]'
      )}
    >
      {locker.number}
    </button>
  )
}
