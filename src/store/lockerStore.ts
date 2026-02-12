import { create } from 'zustand'
import type { Locker } from '@/types'

interface LockerState {
  lockers: Locker[]
  selectedLockerId: string | null
  selectedDate: string | null
  isLoading: boolean
  error: string | null
}

interface LockerActions {
  setLockers: (lockers: Locker[]) => void
  updateLocker: (id: string, updates: Partial<Locker>) => void
  selectLocker: (id: string | null) => void
  setSelectedDate: (date: string | null) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  getAvailableLockers: () => Locker[]
}

type LockerStore = LockerState & LockerActions

export const useLockerStore = create<LockerStore>((set, get) => ({
  lockers: [],
  selectedLockerId: null,
  selectedDate: null,
  isLoading: false,
  error: null,

  setLockers: (lockers) => set({ lockers }),

  updateLocker: (id, updates) =>
    set((state) => ({
      lockers: state.lockers.map((locker) =>
        locker.id === id ? { ...locker, ...updates } : locker
      ),
    })),

  selectLocker: (id) => set({ selectedLockerId: id }),

  setSelectedDate: (date) => set({ selectedDate: date, selectedLockerId: null }),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  getAvailableLockers: () => {
    const { lockers } = get()
    return lockers.filter((locker) => locker.status === 'available')
  },
}))
