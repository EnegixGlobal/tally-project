import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import Header from './Header';
import Sidebar from './Sidebar';
import ShortcutsHelp from './ShortcutsHelp';
import HorizontalMenu from './HorizontalMenu';


const MainLayout: React.FC = () => {
  const { theme } = useAppContext();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showShortcuts, setShowShortcuts] = useState(false);

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

  return (
    <div className={`min-h-screen flex flex-col ${theme === 'dark' ? 'bg-gray-900 text-gray-200' : 'bg-gray-100 text-gray-900'}`}>
      <Header toggleSidebar={() => setSidebarOpen(prev => !prev)} />
        {/* <HorizontalMenu /> */}
        <HorizontalMenu sidebarOpen={sidebarOpen} />
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-60' : 'ml-16'} pt-12`}>
          <div className="p-4 h-full">
            <Outlet />
          </div>
        </main>
      </div>
      {showShortcuts && <ShortcutsHelp onClose={() => setShowShortcuts(false)} />}
    </div>
  );
};

export default MainLayout;