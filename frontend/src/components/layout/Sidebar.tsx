import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, BarChart2, BookOpen, FileText, Settings, 
  Database,  ShoppingCart,  Truck, 
  BookKey,
  Wallet
} from 'lucide-react';//DollarSign,Package,

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: <Home size={18} />, title: 'Dashboard', path: '/app', shortcut: 'Alt+F1' },
    { icon: <Database size={18} />, title: 'Masters', path: '/app/masters', shortcut: 'Alt+F3' },
    { icon: <FileText size={18} />, title: 'Vouchers', path: '/app/vouchers', shortcut: 'Alt+F5' },
    { icon: <BookKey  size={18} />, title: 'Vouchers Register', path: '/app/voucher-register' },
    { icon: <BarChart2 size={18} />, title: 'Reports', path: '/app/reports', shortcut: 'Alt+F9' },
    // { icon: <DollarSign size={18} />, title: 'Accounting', path: '/app/accounting', shortcut: 'Alt+F10' },
    // { icon: <Package size={18} />, title: 'Inventory', path: '/app/inventory', shortcut: 'Alt+F11' },
    { icon: <ShoppingCart size={18} />, title: 'GST', path: '/app/gst', shortcut: '' },
    { icon: <Truck size={18} />, title: 'TDS', path: '/app/tds', shortcut: '' },
    { icon: < Wallet size={18} />, title: 'Income Tax', path: '/app/income-tax', shortcut: '' },
    { icon: <BookOpen size={18} />, title: 'Audit', path: '/app/audit', shortcut: '' },
    { icon: <Settings size={18} />, title: 'Configuration', path: '/app/config', shortcut: 'Alt+F12' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div 
      className={`${
        isOpen ? 'w-60' : 'w-16'
      } transition-width duration-300 ease-in-out h-full ${
        theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-blue-800 text-white'
      } border-r ${
        theme === 'dark' ? 'border-gray-700' : 'border-blue-700'
      } fixed top-12 left-0 z-10`}
    >
      <nav className="p-2">
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <li key={index}>
              <button
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center p-2 rounded-md ${
                  isActive(item.path) 
                    ? theme === 'dark' 
                      ? 'bg-gray-700' 
                      : 'bg-blue-700'
                    : 'hover:bg-opacity-20 hover:bg-blue-700 dark:hover:bg-gray-700'
                } transition-colors`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {isOpen && (
                  <div className="ml-3 flex flex-grow justify-between items-center">
                    <span>{item.title}</span>
                    {item.shortcut && <span className="text-xs opacity-60">{item.shortcut}</span>}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;