import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useCompany } from '../../context/CompanyContext';
import { useAuth } from '../../home/context/AuthContext';
import { Moon, Sun, Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

interface CompanyData {
  name: string;
  fdAccountType: string;
  AccountantName?: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useAppContext();
  const { activeCompanyId } = useCompany();
  const { companyId: authCompanyId, user } = useAuth();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  const getRoleLabel = (role?: string) => {
    if (!role) return "User";
    switch (role.toLowerCase()) {
      case 'ca': return 'CA';
      case 'ca_employee': return 'CA Employee';
      case 'employee': return 'Trader';
      case 'company_user': return 'Trader Employee';
      default: return role;
    }
  };

  useEffect(() => {
    // Use activeCompanyId or fallback to authCompanyId from AuthContext
    const companyId = activeCompanyId || authCompanyId;

    if (!companyId) {
      setCompanyData(null);
      return;
    }

    fetch(`${import.meta.env.VITE_API_URL}/api/header/${companyId}`)
      .then(res => res.json())
      .then((data) => {
        if (data.error) {
          setCompanyData(null);
        } else {
          setCompanyData(data);
        }
      })
      .catch(err => {
        setCompanyData(null);
        console.error("Failed to fetch company info:", err);
      });
  }, [activeCompanyId, authCompanyId]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-2 border-b h-14 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-blue-900 border-blue-800'
        }`}
    >
      <div className="flex items-center">
        <button
          title="Toggle Sidebar"
          onClick={toggleSidebar}
          className="p-1 mr-2 rounded-md text-white hover:bg-blue-800 dark:hover:bg-gray-700"
        >
          <Menu size={20} />
        </button>
        <div className="text-white">
          <div className="font-bold leading-tight flex items-center">
            <span>{companyData ? companyData.name : "No company assigned"}</span>
            {companyData?.fdAccountType?.toLowerCase() === "accountant" && companyData.AccountantName && (
              <span className="text-blue-200 font-normal ml-2 mr-2">|</span>
            )}
            {companyData?.fdAccountType?.toLowerCase() === "accountant" && companyData.AccountantName && (
              <span className="text-sm font-medium text-blue-100">
                CA: {companyData.AccountantName}
              </span>
            )}
            
            {/* Logged in User Badge */}
            {user && (
              <div className={`ml-4 px-2 py-1 rounded flex items-center gap-2 border shadow-sm ${
                user.userType === 'ca' 
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-50' 
                  : user.userType === 'ca_employee'
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-50'
                  : user.userType === 'company_user'
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-50'
                  : 'bg-sky-500/20 border-sky-500/40 text-sky-50'
              }`}>
                 <div className={`w-2 h-2 rounded-full animate-pulse ${
                    user.userType === 'ca' ? 'bg-emerald-400' : 
                    user.userType === 'ca_employee' ? 'bg-amber-400' : 
                    user.userType === 'company_user' ? 'bg-indigo-400' : 'bg-sky-400'
                 }`}></div>
                 <span className="text-[10px] uppercase tracking-widest font-bold">
                   {getRoleLabel(user.userType)}: {user.firstName || user.name}
                 </span>
              </div>
            )}
          </div>

          <div className="text-xs text-blue-200 dark:text-gray-400 font-medium">
            {companyData
              ? companyData.fdAccountType?.toLowerCase() === "self"
                ? "Self Maintained"
                : `Accountant ${companyData.AccountantName ? `(${companyData.AccountantName})` : ""}`
              : ""}
          </div>
        </div>

      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={toggleTheme}
          className="p-1 rounded-md text-white hover:bg-blue-800 dark:hover:bg-gray-700"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
        <div className="flex flex-col items-end mr-2">
          <span className="text-white text-[10px] font-medium leading-none opacity-80 uppercase tracking-tighter">
             Logged In AS
          </span>
          <span className="text-white text-xs font-bold leading-none">
             {getRoleLabel(user?.userType).toUpperCase()}
          </span>
        </div>
        <span className="text-white text-xs hidden lg:inline-block border-l border-blue-700 dark:border-gray-700 pl-4 py-1">
          F1: Help | F2: Period | Alt+F1: Company
        </span>
      </div>
    </header>
  );
};

export default Header;
