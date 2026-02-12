import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SuccessPage from '@/pages/SuccessPage'
import AdminLoginPage from '@/pages/admin/LoginPage'
import AdminDashboardPage from '@/pages/admin/DashboardPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect home to admin login */}
        <Route path="/" element={<Navigate to="/admin" replace />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />

        {/* Success page for Stripe payment confirmation */}
        <Route path="/success" element={<SuccessPage />} />

        {/* Catch all - redirect to admin */}
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
