import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import LoginPage from './components/LoginPage';
import ErrorBoundary from './components/ErrorBoundary';
import { Skeleton } from './components/ui/Skeleton';
import { SkeletonTable } from './components/ui/SkeletonTable';

const ScheduleView = lazy(() => import('./components/ScheduleView'));
const RegistrationList = lazy(() => import('./components/RegistrationList'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));

function ScheduleFallback() {
  return (
    <div className="p-6 space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
      <SkeletonTable rows={8} columns={7} />
    </div>
  );
}

function RegistrationFallback() {
  return (
    <div className="p-6 space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 space-y-3">
        <Skeleton className="h-8 w-56" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-24 ml-auto" />
        </div>
      </div>
      <SkeletonTable rows={10} columns={8} />
    </div>
  );
}

function AnalyticsFallback() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-48 w-full rounded" />
      </div>
      <div className="bg-card border border-border rounded-lg p-4">
        <Skeleton className="h-5 w-40 mb-4" />
        <Skeleton className="h-48 w-full rounded" />
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <ErrorBoundary>
        <LoginPage />
      </ErrorBoundary>
    ),
  },
  {
    path: '/',
    element: (
      <ErrorBoundary>
        <AppLayout />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <Navigate to="/schedule" replace /> },
      {
        path: 'schedule',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<ScheduleFallback />}>
              <ScheduleView />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'registration',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<RegistrationFallback />}>
              <RegistrationList />
            </Suspense>
          </ErrorBoundary>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ErrorBoundary>
            <Suspense fallback={<AnalyticsFallback />}>
              <AnalyticsDashboard />
            </Suspense>
          </ErrorBoundary>
        ),
      },
    ],
  },
]);
