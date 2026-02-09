import { useEffect, useState, useId } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { DollarSign, Users, Key, Percent, LogOut, Plus, AlertCircle } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { RentalTable, AnalyticsCard, WaitlistTable, WaitlistForm, BookLockerTab, ExtensionModal } from '@/components/admin'
import {
  verifyAdmin,
  adminLogout,
  fetchRentals,
  fetchAnalytics,
  fetchWaitlist,
  addToWaitlist,
  updateWaitlistEntry,
  deleteWaitlistEntry,
} from '@/lib/api'
import type { RentalRecord, AnalyticsData, WaitlistEntry, CreateWaitlistData, UpdateWaitlistData } from '@/types'

type MainTab = 'book' | 'rentals' | 'waitlist'
type RentalFilter = 'all' | 'active'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [rentals, setRentals] = useState<RentalRecord[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([])

  const [mainTab, setMainTab] = useState<MainTab>('book')
  const [rentalFilter, setRentalFilter] = useState<RentalFilter>('all')

  // Waitlist form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WaitlistEntry | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Delete confirmation state
  const [deletingEntry, setDeletingEntry] = useState<WaitlistEntry | null>(null)

  // Extension modal state
  const [extendingRental, setExtendingRental] = useState<RentalRecord | null>(null)

  // ARIA IDs for tabs and modals
  const tabBookId = useId()
  const tabRentalsId = useId()
  const tabWaitlistId = useId()
  const tabPanelBookId = useId()
  const tabPanelRentalsId = useId()
  const tabPanelWaitlistId = useId()
  const deleteModalTitleId = useId()

  useEffect(() => {
    const checkAuth = async () => {
      const response = await verifyAdmin()
      if (!response.success || !response.data?.authenticated) {
        navigate('/admin/login')
        return
      }
      loadData()
    }

    checkAuth()
  }, [navigate])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [rentalsRes, analyticsRes, waitlistRes] = await Promise.all([
        fetchRentals(rentalFilter),
        fetchAnalytics(),
        fetchWaitlist(),
      ])

      if (rentalsRes.success && rentalsRes.data) {
        setRentals(rentalsRes.data)
      }

      if (analyticsRes.success && analyticsRes.data) {
        setAnalytics(analyticsRes.data)
      }

      if (waitlistRes.success && waitlistRes.data) {
        setWaitlistEntries(waitlistRes.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isLoading) {
      loadRentals()
    }
  }, [rentalFilter])

  const loadRentals = async () => {
    const rentalsRes = await fetchRentals(rentalFilter)
    if (rentalsRes.success && rentalsRes.data) {
      setRentals(rentalsRes.data)
    }
  }

  const loadWaitlist = async () => {
    const waitlistRes = await fetchWaitlist()
    if (waitlistRes.success && waitlistRes.data) {
      setWaitlistEntries(waitlistRes.data)
    }
  }

  const handleLogout = async () => {
    await adminLogout()
    navigate('/admin/login')
  }

  const handleAddEntry = () => {
    setEditingEntry(null)
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleEditEntry = (entry: WaitlistEntry) => {
    setEditingEntry(entry)
    setFormError(null)
    setIsFormOpen(true)
  }

  const handleDeleteEntry = (entry: WaitlistEntry) => {
    setDeletingEntry(entry)
  }

  const confirmDelete = async () => {
    if (!deletingEntry) return

    const response = await deleteWaitlistEntry(deletingEntry.id)
    if (response.success) {
      await loadWaitlist()
    }
    setDeletingEntry(null)
  }

  const handleFormSubmit = async (data: CreateWaitlistData | UpdateWaitlistData) => {
    setFormLoading(true)
    setFormError(null)

    try {
      if (editingEntry) {
        const response = await updateWaitlistEntry(editingEntry.id, data as UpdateWaitlistData)
        if (!response.success) {
          setFormError(response.error || 'Failed to update entry')
          return
        }
      } else {
        const response = await addToWaitlist(data as CreateWaitlistData)
        if (!response.success) {
          setFormError(response.error || 'Failed to add entry')
          return
        }
      }

      await loadWaitlist()
      setIsFormOpen(false)
      setEditingEntry(null)
    } finally {
      setFormLoading(false)
    }
  }

  const handleFormClose = () => {
    setIsFormOpen(false)
    setEditingEntry(null)
    setFormError(null)
  }

  if (isLoading && !analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="/prep.svg" alt="Prep Doctors" width={121} height={48} />
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Admin Panel</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Waitlist Alert - Show when lockers available and people waiting */}
        {analytics && waitlistEntries.length > 0 && (42 - analytics.activeRentals) > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3" role="alert">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="font-semibold text-amber-800">Lockers Available - Waitlist Pending</h3>
              <p className="text-amber-700 text-sm mt-1">
                <strong>{42 - analytics.activeRentals}</strong> locker{42 - analytics.activeRentals !== 1 ? 's' : ''} available and <strong>{waitlistEntries.length}</strong> {waitlistEntries.length === 1 ? 'person is' : 'people are'} on the waitlist.
              </p>
              <button
                onClick={() => setMainTab('waitlist')}
                className="text-sm text-amber-800 underline hover:text-amber-900 mt-2"
              >
                View Waitlist
              </button>
            </div>
          </div>
        )}

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <AnalyticsCard
              title="Total Revenue"
              value={`$${(analytics.totalRevenue / 100).toLocaleString()}`}
              icon={<DollarSign className="w-8 h-8" />}
            />
            <AnalyticsCard
              title="Unique Students"
              value={analytics.uniqueStudents}
              icon={<Users className="w-8 h-8" />}
            />
            <AnalyticsCard
              title="Active Rentals"
              value={analytics.activeRentals}
              subtitle={`of ${analytics.totalRentals} total`}
              icon={<Key className="w-8 h-8" />}
            />
            <AnalyticsCard
              title="Occupancy Rate"
              value={`${analytics.occupancyRate}%`}
              icon={<Percent className="w-8 h-8" />}
            />
          </div>
        )}

        {/* Main Tab Navigation */}
        <div className="flex gap-4 mb-6 border-b border-gray-200" role="tablist" aria-label="Dashboard sections">
          <button
            id={tabBookId}
            role="tab"
            aria-selected={mainTab === 'book'}
            aria-controls={tabPanelBookId}
            tabIndex={mainTab === 'book' ? 0 : -1}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              mainTab === 'book'
                ? 'border-[#0660B2] text-[#0660B2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setMainTab('book')}
          >
            Book Locker
          </button>
          <button
            id={tabRentalsId}
            role="tab"
            aria-selected={mainTab === 'rentals'}
            aria-controls={tabPanelRentalsId}
            tabIndex={mainTab === 'rentals' ? 0 : -1}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              mainTab === 'rentals'
                ? 'border-[#0660B2] text-[#0660B2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setMainTab('rentals')}
          >
            Rentals
          </button>
          <button
            id={tabWaitlistId}
            role="tab"
            aria-selected={mainTab === 'waitlist'}
            aria-controls={tabPanelWaitlistId}
            tabIndex={mainTab === 'waitlist' ? 0 : -1}
            className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${
              mainTab === 'waitlist'
                ? 'border-[#0660B2] text-[#0660B2]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setMainTab('waitlist')}
          >
            Waitlist ({waitlistEntries.length})
          </button>
        </div>

        {/* Book Locker Tab Content */}
        {mainTab === 'book' && (
          <div
            id={tabPanelBookId}
            role="tabpanel"
            aria-labelledby={tabBookId}
            tabIndex={0}
          >
            <BookLockerTab />
          </div>
        )}

        {/* Rentals Tab Content */}
        {mainTab === 'rentals' && (
          <div
            id={tabPanelRentalsId}
            role="tabpanel"
            aria-labelledby={tabRentalsId}
            tabIndex={0}
          >
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Rentals</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant={rentalFilter === 'all' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setRentalFilter('all')}
                    >
                      All
                    </Button>
                    <Button
                      variant={rentalFilter === 'active' ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setRentalFilter('active')}
                    >
                      Active Only
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RentalTable rentals={rentals} onExtend={(rental) => setExtendingRental(rental)} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Waitlist Tab Content */}
        {mainTab === 'waitlist' && (
          <div
            id={tabPanelWaitlistId}
            role="tabpanel"
            aria-labelledby={tabWaitlistId}
            tabIndex={0}
          >
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Waitlist</CardTitle>
                  <Button variant="primary" size="sm" onClick={handleAddEntry}>
                    <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
                    Add Entry
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <WaitlistTable
                  entries={waitlistEntries}
                  onEdit={handleEditEntry}
                  onDelete={handleDeleteEntry}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Extension Modal */}
      <ExtensionModal
        isOpen={!!extendingRental}
        onClose={() => setExtendingRental(null)}
        rental={extendingRental}
        onSuccess={() => {
          setExtendingRental(null)
          loadRentals()
        }}
      />

      {/* Waitlist Form Modal */}
      <WaitlistForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        entry={editingEntry}
        isLoading={formLoading}
        error={formError}
      />

      {/* Delete Confirmation Modal */}
      {deletingEntry && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={deleteModalTitleId}
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDeletingEntry(null)}
            aria-hidden="true"
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-6">
            <h3 id={deleteModalTitleId} className="text-lg font-semibold text-gray-900 mb-2">Delete Entry</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{deletingEntry.fullName}</strong> from the waitlist? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingEntry(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={confirmDelete}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
