import React, { useState } from 'react';
import { AdminContext } from './AdminContextDef';

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <AdminContext.Provider value={{ 
      sidebarOpen, 
      setSidebarOpen, 
      currentPage, 
      setCurrentPage,
      isAuthenticated,
      setIsAuthenticated
    }}>
      {children}
    </AdminContext.Provider>
  );
};