import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import SchoolDetail from './pages/SchoolDetail';
import PersonnelManagementPage from './pages/PersonnelManagementPage';
import UserManagementPage from './pages/UserManagementPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import BehaviorScorePage from './pages/BehaviorScorePage';
import NewsManagementPage from './pages/NewsManagementPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <SchoolProvider>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school/:schoolId"
              element={
                <ProtectedRoute>
                  <SchoolDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/personnel"
              element={
                <ProtectedRoute>
                  <PersonnelManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SystemSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/behavior"
              element={
                <ProtectedRoute>
                  <BehaviorScorePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/news"
              element={
                <ProtectedRoute>
                  <NewsManagementPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SchoolProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
