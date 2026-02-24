import { createContext } from 'react';

export interface AdminData {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface AdminContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  isAuthenticated: boolean;
  adminData: AdminData | null;
  login: (token: string, data: AdminData) => void;
  logout: () => void;
  setIsAuthenticated: (auth: boolean) => void;
}

export const AdminContext = createContext<AdminContextType | undefined>(undefined);
