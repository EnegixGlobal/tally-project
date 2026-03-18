import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import Header from './Header';
import Sidebar from './Sidebar';
import ShortcutsHelp from './ShortcutsHelp';
import HorizontalMenu from './HorizontalMenu';
import { useAuth } from '../../home/context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import ErrorBoundary from './ErrorBoundary';


const MainLayout: React.FC = () => {
  const { theme } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const { isAuthenticated, isLoading: authLoading, hasCompany, checkPermission, user } = useAuth();
  const { isLoading: companyLoading } = useCompany();
  const navigate = useNavigate();

  const isLoading = authLoading || companyLoading;

  const location = useLocation();

  useEffect(() => {
    // If auth has finished loading and user is not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
      return;
    }

    // If authenticated but no company, force user to company creation page
    // Allow access to the company creation route itself to avoid redirect loop
    if (!isLoading && isAuthenticated && !hasCompany) {
      if (!location.pathname.startsWith('/app/company')) {
        navigate('/app/company');
        return;
      }
    }

    // Role-based route protection
    if (!isLoading && isAuthenticated) {
      const restrictedPaths = [
        { path: '/app/gst', moduleId: 'gst' },
        { path: '/app/tds', moduleId: 'tds' },
        { path: '/app/audit', moduleId: 'audit' },
        { path: '/app/income-tax', moduleId: 'income-tax' },
      ];

      const currentRestricted = restrictedPaths.find(p => location.pathname.startsWith(p.path));
      if (currentRestricted && !checkPermission(currentRestricted.moduleId)) {
        console.warn(`Access denied to ${location.pathname} for current role`);
        navigate('/app');
      }
    }
  }, [isLoading, isAuthenticated, hasCompany, navigate, location, checkPermission]);

  // Global subscription UI guard: if subscription / trial expired, only allow dashboard
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    const trialDays = user.trialDaysRemaining ?? null;
    const status = user.subscriptionStatus ?? null;

    const isExpired =
      status === 'expired' ||
      (user.isTrial && trialDays !== null && trialDays <= 0);

    // Allow access to dashboard (index) even if expired
    const isAtDashboard = location.pathname === '/app' || location.pathname === '/app/';
    // Allow config pages to be viewed even when expired
    const isConfigPath = location.pathname.startsWith('/app/config');

    if (isExpired && !isAtDashboard && !isConfigPath) {
      // Redirect user to dashboard and show a modal prompting renewal
      navigate('/app');
      setShowSubscriptionModal(true);
    }
  }, [isLoading, isAuthenticated, user, location.pathname, navigate]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1 for help
      if (e.key === 'F1') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }

      // Escape to close shortcuts help
      if (e.key === 'Escape' && showShortcuts) {
        setShowShortcuts(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showShortcuts]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  // Removed the unlockedCompanyId check - All companies are now directly accessible with full UI


  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
      <Header toggleSidebar={() => setSidebarOpen(prev => !prev)} />
      {/* <HorizontalMenu /> */}
      <HorizontalMenu sidebarOpen={sidebarOpen} />
      {/* Subscription modal shown when user attempts to access pages after expiry */}
      {showSubscriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black opacity-40" onClick={() => setShowSubscriptionModal(false)} />
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full p-6 z-10">
            <h3 className="text-lg font-semibold mb-2">Subscription Required</h3>
            <p className="text-sm text-gray-700 mb-4">Your free trial or subscription has expired. Please renew to continue accessing all features.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSubscriptionModal(false)}
                className="px-4 py-2 rounded-md border"
              >
                Close
              </button>
              <button
                onClick={() => { setShowSubscriptionModal(false); navigate('/pricing'); }}
                className="px-4 py-2 rounded-md bg-blue-600 text-white"
              >
                Renew Now
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'} pt-12`}>
          <div className="p-4 h-full">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  );
};

export default MainLayout;