import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
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
  const storedCompanyId = localStorage.getItem("company_id");
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);

  useEffect(() => {
    const storedCompanyId = localStorage.getItem("company_id");

    if (!storedCompanyId) return;

    fetch(`http://localhost:5000/api/header/${storedCompanyId}`)
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
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-2 border-b h-14 ${
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
  {companyData
 ? `${companyData.name} ${
     companyData.fdAccountType &&
     companyData.fdAccountType.toLowerCase() === "accountant" &&
     companyData.AccountantName
       ? `| Accountant Name : ${companyData.AccountantName}`
       : ""
   }`
 : "No company assigned"}

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
      </div>
    </header>
  );
};

export default Header;
