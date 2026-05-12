import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import AuthCallback from './pages/AuthCallback';
import PendingApproval from './pages/PendingApproval';

// User Pages
import Home from './pages/user/Home';
import Booking from './pages/user/Booking';
import Fields from './pages/user/Fields';
import Balls from './pages/user/Balls';
import History from './pages/user/History';
import Profile from './pages/user/Profile';
import Committee from './pages/user/Committee';
import Documents from './pages/user/Documents';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminFields from './pages/admin/AdminFields';
import AdminBalls from './pages/admin/AdminBalls';
import AdminBookings from './pages/admin/AdminBookings';
import AdminUsers from './pages/admin/AdminUsers';
import AdminPosts from './pages/admin/AdminPosts';
import AdminCommittee from './pages/admin/AdminCommittee';
import AdminDocuments from './pages/admin/AdminDocuments';
import AdminApprovals from './pages/admin/AdminApprovals';

// Auth Pages
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import RoleSelect from './pages/RoleSelect';

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center p-8">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'pending') return <Navigate to="/pending" replace />;
  if (requireAdmin && user.role !== 'admin') return <Navigate to="/" replace />;
  
  return children;
};

// Component ป้องกันไม่ให้ Admin เข้าหน้าของ User ธรรมดา (เว้นแต่จะเลือกโหมด user)
const AdminRedirect = ({ children }) => {
  const { user, adminAsUser } = useAuth();
  if (user?.role === 'admin' && !adminAsUser) return <Navigate to="/admin" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/role-select" element={<RoleSelect />} />
      <Route path="/pending" element={<PendingApproval />} />
      
      <Route path="/" element={<MainLayout />}>
        {/* Public / Guest Routes */}
        <Route index element={<AdminRedirect><Home /></AdminRedirect>} />
        <Route path="committee" element={<Committee />} />

        {/* Protected User Routes (Admin จะถูกเด้งไปหน้า /admin) */}
        <Route path="fields" element={<ProtectedRoute><AdminRedirect><Fields /></AdminRedirect></ProtectedRoute>} />
        <Route path="booking" element={<ProtectedRoute><AdminRedirect><Booking /></AdminRedirect></ProtectedRoute>} />
        <Route path="balls" element={<ProtectedRoute><AdminRedirect><Balls /></AdminRedirect></ProtectedRoute>} />
        <Route path="history" element={<ProtectedRoute><AdminRedirect><History /></AdminRedirect></ProtectedRoute>} />
        <Route path="profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="documents" element={<ProtectedRoute><AdminRedirect><Documents /></AdminRedirect></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
        <Route path="admin/fields" element={<ProtectedRoute requireAdmin><AdminFields /></ProtectedRoute>} />
        <Route path="admin/balls" element={<ProtectedRoute requireAdmin><AdminBalls /></ProtectedRoute>} />
        <Route path="admin/bookings" element={<ProtectedRoute requireAdmin><AdminBookings /></ProtectedRoute>} />
        <Route path="admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
        <Route path="admin/posts" element={<ProtectedRoute requireAdmin><AdminPosts /></ProtectedRoute>} />
        <Route path="admin/committee" element={<ProtectedRoute requireAdmin><AdminCommittee /></ProtectedRoute>} />
        <Route path="admin/documents" element={<ProtectedRoute requireAdmin><AdminDocuments /></ProtectedRoute>} />
        <Route path="admin/approvals" element={<ProtectedRoute requireAdmin><AdminApprovals /></ProtectedRoute>} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
