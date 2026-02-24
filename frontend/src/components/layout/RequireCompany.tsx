import React from 'react';
import { useAuth } from '../../home/context/AuthContext';
import { useCompany } from '../../context/CompanyContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface RequireCompanyProps {
  children: React.ReactNode;
}

const RequireCompany: React.FC<RequireCompanyProps> = ({ children }) => {
  const { hasCompany, isLoading: authLoading, isAuthenticated } = useAuth();
  const { unlockedCompanyId, isLoading: companyLoading } = useCompany();
  const navigate = useNavigate();
  const location = useLocation();

  const isLoading = authLoading || companyLoading;

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      if (!hasCompany) {
        navigate('/app/company');
      } else if (!unlockedCompanyId && location.pathname !== '/app') {
        // If company is not unlocked, force them to the dashboard (gate)
        navigate('/app');
      }
    }
  }, [isLoading, isAuthenticated, hasCompany, unlockedCompanyId, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-500">Loading...</div>
      </div>
    );
  }

  // If user is not authenticated, MainLayout will handle the redirect
  if (!isAuthenticated) {
    return null;
  }

  // If no company, show message
  if (!hasCompany) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Company Required</h2>
          <p className="text-gray-600 mb-4">Please create a company first to access this feature.</p>
          <button
            onClick={() => navigate('/app/company')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Company
          </button>
        </div>
      </div>
    );
  }

  // User is authenticated and has company
  return <>{children}</>;
};

export default RequireCompany;
