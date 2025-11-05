import React from 'react';
import { useAdmin } from '../../hooks/useAdmin';
import { useTheme } from '../../context/ThemeContext';
import { Menu, Bell, Search, User } from 'lucide-react';

const Header: React.FC = () => {
  const { sidebarOpen, setSidebarOpen } = useAdmin();
  const { theme } = useTheme();

  return (
    <header className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-sm border-b`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left side */}
        <div className="flex items-center space-x-4">
          <button
          title='Toggle Sidebar'
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
          >
            <Menu className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
          </button>
          
          <div className="relative hidden sm:block">
            <Search className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search..."
              className={`pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary w-64 lg:w-80 ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          <button 
          title='Notifications'
          className={`p-2 rounded-lg ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} relative transition-colors`}>
            <Bell className={`w-5 h-5 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`} />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-sm hidden md:block">
              <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Admin User</div>
              <div className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Super Admin</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;