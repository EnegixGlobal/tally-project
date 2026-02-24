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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isAuthenticated, isLoading: authLoading, hasCompany } = useAuth();
  const { unlockedCompanyId, isLoading: companyLoading } = useCompany();
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
      }
    }
  }, [isLoading, isAuthenticated, hasCompany, navigate, location]);

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

  if (!unlockedCompanyId && isAuthenticated && hasCompany) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-[#f8fafc]'}`}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
      <Header toggleSidebar={() => setSidebarOpen(prev => !prev)} />
      {/* <HorizontalMenu /> */}
      <HorizontalMenu sidebarOpen={sidebarOpen} />
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