import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  hasSubscription: boolean;
  subscriptionPlan?: 'basic' | 'professional' | 'enterprise';
  createdAt?: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  updateSubscription: (plan: 'basic' | 'professional' | 'enterprise') => void;
  isAuthenticated: boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    try {
      const savedUser = localStorage.getItem('user');
      console.log(savedUser);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock authentication - in real app, this would validate credentials with API
      if (!email || !password) {
        setIsLoading(false);
        return false;
      }
      
      // Mock user data - in real app, this would come from API response
      const mockUser: User = {
        id: '1',
        email,
        firstName: 'John',
        lastName: 'Doe',
        companyName: 'Demo Company',
        phoneNumber: '1234567890',
        hasSubscription: false,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      setIsLoading(false);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
  setIsLoading(true);
  try {
    const response = await fetch("http://localhost:5000/api/SignUp/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error("Registration failed");
    }

    // Set user data from form (or response if backend returns it)
    const newUser: User = {
      id: Date.now().toString(), // Ideally, get this from backend response
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      companyName: userData.companyName,
      phoneNumber: userData.phoneNumber,
      hasSubscription: false,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    setUser(newUser);
    localStorage.setItem("user", JSON.stringify(newUser));
    return true;
  } catch (error) {
    console.error("Registration error:", error);
    return false;
  } finally {
    setIsLoading(false);
  }
};


  const logout = () => {
    try {
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error during logout:', error);
      // Force clear user state even if localStorage fails
      setUser(null);
    }
  };

  const updateSubscription = (plan: 'basic' | 'professional' | 'enterprise') => {
    if (user) {
      try {
        const updatedUser = {
          ...user,
          hasSubscription: true,
          subscriptionPlan: plan,
        };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Error updating subscription:', error);
        // Update state even if localStorage fails
        const updatedUser = {
          ...user,
          hasSubscription: true,
          subscriptionPlan: plan,
        };
        setUser(updatedUser);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        register,
        updateSubscription,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Fast Refresh warning is expected for Context files that export both provider and hook
// This is the standard React Context pattern and doesn't affect functionality
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
