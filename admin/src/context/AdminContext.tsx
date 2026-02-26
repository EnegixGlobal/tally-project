import React, { useState, useEffect } from 'react';
import { AdminContext } from './AdminContextDef';
import type { AdminData } from './AdminContextDef';

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!localStorage.getItem('adminToken');
  });
  const [adminData, setAdminData] = useState<AdminData | null>(() => {
    const saved = localStorage.getItem('adminData');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const login = (token: string, data: AdminData) => {
    localStorage.setItem('adminToken', token);
    localStorage.setItem('adminData', JSON.stringify(data));
    setAdminData(data);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    setAdminData(null);
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  // Sync auth state if needed
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token && isAuthenticated) {
      setIsAuthenticated(false);
      setAdminData(null);
    }
  }, [isAuthenticated]);

  return (
    <AdminContext.Provider value={{
      sidebarOpen,
      setSidebarOpen,
      currentPage,
      setCurrentPage,
      isAuthenticated,
      setIsAuthenticated,
      adminData,
      login,
      logout
    }}>
      {children}
    </AdminContext.Provider>
  );
};