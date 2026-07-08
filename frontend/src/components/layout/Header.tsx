import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Moon, Sun, Menu } from 'lucide-react';
import { useAuth } from '../../home/context/AuthContext';

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
  const { user } = useAuth();
  const storedCompanyId = localStorage.getItem("company_id");
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem("company_id");

    if (!storedCompanyId || storedCompanyId === "null") return;

    fetch(`${import.meta.env.VITE_API_URL}/api/header/${storedCompanyId}`)
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

  }, [storedCompanyId]);

  return (
    <header
      className={`print:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-2 border-b h-14 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-blue-900 border-blue-800'
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
       <div className="text-white font-bold">
  {companyData ? (
    <span className="inline-flex items-center flex-wrap gap-3">
      <span className="mr-1">{companyData.name}</span>
      {user && (
        <span className="inline-flex items-center gap-3">
          <span className="opacity-60">|</span>
          {localStorage.getItem('userType') === 'employee' ? (
             <>
               <span className="px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded shadow-sm border border-blue-400">
                 Trader Name: {companyData.TraderName || user.firstName || user.name}
               </span>
               {companyData.AccountantName && (
                 <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-sm font-bold rounded shadow-sm border border-yellow-400">
                   Accountant Name: {companyData.AccountantName}
                 </span>
               )}
               {companyData.NewCAName && (
                 <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded shadow-sm border border-green-400">
                   CA Name: {companyData.NewCAName}
                 </span>
               )}
             </>
          ) : localStorage.getItem('userType') === 'ca' ? (
             <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-sm font-bold rounded shadow-sm border border-yellow-400">
               Accountant Name: {user.firstName || user.name}
             </span>
          ) : localStorage.getItem('userType') === 'new_ca' ? (
             <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded shadow-sm border border-green-400">
               CA Name: {user.firstName || user.name}
             </span>
          ) : (
             <span className="px-3 py-1 bg-gray-500 text-white text-sm font-bold rounded shadow-sm border border-gray-400">
               User: {user.firstName || user.name}
             </span>
          )}
        </span>
      )}
    </span>
  ) : "No company assigned"}

<div className="text-xs text-blue-200 dark:text-gray-400">
  {companyData
    ? companyData.fdAccountType &&
      companyData.fdAccountType.toLowerCase() === "self"
      ? "Self Maintained"
      : "Accountant"
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
        <span className="text-white text-xs hidden md:inline-block">
          F1: Help | F2: Period | Alt+F1: Company
        </span>
        {localStorage.getItem('userType') === 'new_ca' ? (
          <span className="ml-4 px-3 py-1 bg-green-500 text-white text-sm font-bold rounded shadow-sm border border-green-400">
            CA
          </span>
        ) : localStorage.getItem('userType') === 'employee' ? (
          <span className="ml-4 px-3 py-1 bg-blue-500 text-white text-sm font-bold rounded shadow-sm border border-blue-400">
            Trader
          </span>
        ) : (
          <span className="ml-4 px-3 py-1 bg-yellow-500 text-yellow-900 text-sm font-bold rounded shadow-sm">
            Accountant
          </span>
        )}
      </div>
    </header>
  );
};

export default Header;
