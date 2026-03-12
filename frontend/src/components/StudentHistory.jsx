import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useStudentHistory } from '../hooks/useStudentHistory';
import { nameSearchSchema } from '../schemas/history';
import ContactSearch from './ContactSearch';
import { SkeletonTable } from './ui/SkeletonTable';
import { Skeleton } from './ui/Skeleton';

function formatDate(isoString) {
  if (!isoString) return null;
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ChevronIcon({ expanded }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function getLabSummary(bookings) {
  const labMap = new Map();
  for (const b of bookings) {
    labMap.set(b.lab, (labMap.get(b.lab) || 0) + 1);
  }
  return Array.from(labMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([lab, weeks]) => ({ lab, weeks }));
}

function CycleGroup({ group, defaultExpanded }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const labSummary = getLabSummary(group.bookings);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <ChevronIcon expanded={expanded} />
          <span className="font-semibold text-foreground">{group.cycle.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {group.bookings.length} booking{group.bookings.length !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-card">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Lab</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Station</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Side</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Shift</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Week</th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Dates</th>
              </tr>
            </thead>
            <tbody>
              {group.bookings.map((b, i) => {
                const startStr = formatDate(b.startDate);
                const endStr = formatDate(b.endDate);
                const dateDisplay =
                  startStr && endStr ? `${startStr} – ${endStr}` : `Week ${b.week}`;

                return (
                  <tr
                    key={`${b.lab}-${b.stationNumber}-${b.shift}-${b.week}-${i}`}
                    className="border-b border-border/50 last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-2 text-foreground">{b.lab}</td>
                    <td className="px-4 py-2 text-foreground">{b.stationNumber}</td>
                    <td className="px-4 py-2 text-foreground">{b.side}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          b.shift === 'AM'
                            ? 'bg-info-muted text-info'
                            : 'bg-warning-muted text-warning'
                        }`}
                      >
                        {b.shift}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-foreground">{b.week}</td>
                    <td className="px-4 py-2 text-muted-foreground">{dateDisplay}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="px-4 py-3 bg-muted/30 border-t border-border">
            <div className="flex flex-wrap gap-3">
              {labSummary.map(({ lab, weeks }) => (
                <span
                  key={lab}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-card border border-border rounded-md text-sm"
                >
                  <span className="font-medium text-foreground">{lab}</span>
                  <span className="text-muted-foreground">
                    — {weeks} week{weeks !== 1 ? 's' : ''}
                  </span>
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-md text-sm">
                <span className="font-medium text-primary">Total</span>
                <span className="text-primary">
                  — {group.bookings.length} week{group.bookings.length !== 1 ? 's' : ''}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentHistory() {
  const navigate = useNavigate();
  const [searchMode, setSearchMode] = useState('contact');
  const [searchParams, setSearchParams] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

  const { data: cycleGroups, isLoading, error } = useStudentHistory(searchParams);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(nameSearchSchema),
    defaultValues: { name: '' },
  });

  const handleContactSelect = useCallback((contact) => {
    setSelectedContact(contact);
    if (contact) {
      setSearchParams({ contactId: contact.id });
    } else {
      setSearchParams(null);
    }
  }, []);

  const handleNameSearch = useCallback((data) => {
    setSearchParams({ name: data.name });
  }, []);

  const handleModeSwitch = useCallback(
    (mode) => {
      if (mode === searchMode) return;
      setSearchMode(mode);
      setSearchParams(null);
      setSelectedContact(null);
    },
    [searchMode],
  );

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/schedule')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-secondary-foreground bg-card border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </button>
          <h2 className="text-lg font-semibold text-foreground">Student History</h2>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleModeSwitch('contact')}
            className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
              searchMode === 'contact'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground border-input hover:bg-muted'
            }`}
          >
            Search by Contact
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('name')}
            className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
              searchMode === 'name'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'text-muted-foreground hover:text-foreground border-input hover:bg-muted'
            }`}
          >
            Search by Name
          </button>
        </div>

        {searchMode === 'contact' ? (
          <ContactSearch
            onContactSelect={handleContactSelect}
            selectedContact={selectedContact}
            placeholder="Search student by name, email, or student ID..."
          />
        ) : (
          <form onSubmit={handleSubmit(handleNameSearch)} className="flex gap-2">
            <div className="flex-1">
              <input
                {...register('name')}
                type="text"
                placeholder="Enter trainee name..."
                className="w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Search
            </button>
          </form>
        )}
      </div>

      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <SkeletonTable rows={5} columns={6} />
        </div>
      )}

      {error && (
        <div className="bg-destructive-muted border border-destructive/30 rounded-lg p-4 text-destructive">
          Failed to fetch student history. Please try again.
        </div>
      )}

      {!isLoading && !error && searchParams && cycleGroups?.length === 0 && (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          No bookings found for this student.
        </div>
      )}

      {!isLoading && !error && cycleGroups && cycleGroups.length > 0 && (
        <div className="space-y-3">
          {cycleGroups.map((group, i) => (
            <CycleGroup key={group.cycle.id} group={group} defaultExpanded={i === 0} />
          ))}
        </div>
      )}

      {!searchParams && !isLoading && (
        <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
          Search for a student to view their booking history.
        </div>
      )}
    </div>
  );
}
