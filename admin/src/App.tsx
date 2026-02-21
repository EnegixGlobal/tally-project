import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AdminProvider } from './context/AdminContext';
import { useAdmin } from './hooks/useAdmin';
import { useTheme } from './context/ThemeContext';
import { gsap } from 'gsap';
import Login from './components/Auth/Login';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import UserManagement from './components/Users/UserManagement';
import SubscriptionManagement from './components/Subscriptions/SubscriptionManagement';
import PaymentHistory from './components/Payments/PaymentHistory';
import Settings from './components/Settings/Settings';
import ProtectedRoute from './routes/ProtectedRoute';

const PageContent: React.FC = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (contentRef.current) {
      gsap.fromTo(contentRef.current,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 }
      );
    }
  }, [location.pathname]);

  return (
    <main className="flex-1 overflow-auto p-3 sm:p-4 lg:p-6">
      <div ref={contentRef}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<UserManagement />} />
            <Route path="/subscriptions" element={<SubscriptionManagement />} />
            <Route path="/payments" element={<PaymentHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </div>
    </main>
  );
};

const MainContent: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAdmin();

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-900'}`}>
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <PageContent />
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <AdminProvider>
          <MainContent />
        </AdminProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
