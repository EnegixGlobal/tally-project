import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyName: string;
  phoneNumber: string;
  pan: string;
  userLimit: number;
  hasSubscription: boolean;
  hasCompany?: boolean;
  companyId?: string | null;
  subscriptionPlan?: "basic" | "professional" | "enterprise";
  createdAt?: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<boolean>;
  updateSubscription: (plan: "basic" | "professional" | "enterprise") => void;
  hasCompany: boolean;
  companyId: string | null;
  updateCompany: (companyId: string, companyInfo?: any) => void;
  isAuthenticated: boolean;
  permissions: Record<string, boolean>;
  checkPermission: (moduleId: string) => boolean;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  companyName: string;
  phoneNumber: string;
  pan: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [hasCompany, setHasCompany] = useState<boolean>(false);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Check if user is logged in on app start
    try {
      const savedUser = localStorage.getItem("user");
      const savedUserType = localStorage.getItem("userType");

      console.log(savedUser);
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      }

      const caEmployeeId = localStorage.getItem("user_id");
      // If CA employee, fetch permissions
      if (savedUserType === "ca_employee" && caEmployeeId) {
        fetch(`${import.meta.env.VITE_API_URL}/api/ca-employee-permissions?ca_employee_id=${caEmployeeId}`)
          .then(res => res.json())
          .then(data => {
            let perms = data.permissions || {};
            if (typeof perms === 'string') {
              try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
            }
            setPermissions(perms);
          })
          .catch(err => console.error("Error loading permissions:", err));
      }

      // read company info from localStorage
      const savedCompany = localStorage.getItem("company");
      const savedCompanyId = localStorage.getItem("company_id");
      if (savedCompany === "true" || savedCompany === "1") {
        setHasCompany(true);
      }
      if (savedCompanyId) {
        setCompanyId(savedCompanyId);
        // If company_id exists but company flag wasn't set, ensure hasCompany is true
        setHasCompany(true);
      }
    } catch (error) {
      console.error("Error loading user from localStorage:", error);
      // Clear corrupted data
      localStorage.removeItem("user");
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error("Login failed:", data);
        setIsLoading(false);
        return false;
      }

      // Prefer server-provided user object, fall back to data itself
      const userFromResponse = data.user ?? data;

      // Normalize a minimal user object if backend returns different shape
      const newUser: User = {
        id:
          userFromResponse.id?.toString() ??
          userFromResponse.user_id?.toString() ??
          "0",
        email: userFromResponse.email ?? email,
        firstName:
          userFromResponse.firstName ?? userFromResponse.first_name ?? "",
        lastName: userFromResponse.lastName ?? userFromResponse.last_name ?? "",
        companyName:
          userFromResponse.companyName ?? userFromResponse.company_name ?? "",
        phoneNumber:
          userFromResponse.phoneNumber ?? userFromResponse.phone_number ?? "",
        pan:
          userFromResponse.pan ?? "",
        userLimit:
          userFromResponse.userLimit ?? 1,
        hasSubscription:
          !!userFromResponse.hasSubscription || !!data.hasCompany || false,
        hasCompany: data.hasCompany ?? false,
        companyId: data.companyId?.toString() ?? null,
        subscriptionPlan: userFromResponse.subscriptionPlan,
        createdAt: userFromResponse.createdAt ?? userFromResponse.created_at,
        lastLoginAt:
          userFromResponse.lastLoginAt ?? userFromResponse.last_login_at,
      };

      setUser(newUser);


      try {
        if (data.token) localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(newUser));
        if (data.role) localStorage.setItem("userType", data.role);
        if (data.hasCompany !== undefined)
          localStorage.setItem("company", String(data.hasCompany));
        if (data.companyId !== undefined) {
          localStorage.setItem("company_id", String(data.companyId));
          localStorage.setItem("active_company_id", String(data.companyId));
        }
        if (data.companyInfo)
          localStorage.setItem("companyInfo", JSON.stringify(data.companyInfo));
        if (data.employee_id !== undefined)
          localStorage.setItem("employee_id", String(data.employee_id));
        if (data.user_id !== undefined)
          localStorage.setItem("user_id", String(data.user_id));
        if (data.supplier !== undefined)
          localStorage.setItem("supplier", String(data.supplier));
        if (data.companies !== undefined)
          localStorage.setItem("companies", JSON.stringify(data.companies));
      } catch (e) {
        console.warn("Could not write all items to localStorage:", e);
      }

      // Ensure React state reflects backend-provided company info immediately
      if (data.hasCompany !== undefined) setHasCompany(Boolean(data.hasCompany));
      if (data.companyId !== undefined) setCompanyId(String(data.companyId));
      if ((data as any).company_id !== undefined) {
        setCompanyId(String((data as any).company_id));
        setHasCompany(true);
      }

      if (data.role === "ca_employee" && data.user_id) {
        fetch(`${import.meta.env.VITE_API_URL}/api/ca-employee-permissions?ca_employee_id=${data.user_id}`)
          .then(res => res.json())
          .then(pData => {
            let perms = pData.permissions || {};
            if (typeof perms === 'string') {
              try { perms = JSON.parse(perms); } catch (e) { perms = {}; }
            }
            setPermissions(perms);
          })
          .catch(err => console.error("Error loading permissions immediately:", err));
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (userData: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/SignUp/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userData),
        }
      );

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
        pan: userData.pan || "",
        userLimit: 1,
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
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      console.error("Error during logout:", error);
      setUser(null);
      window.location.href = "/";
    }
  };


  const updateSubscription = (
    plan: "basic" | "professional" | "enterprise"
  ) => {
    if (user) {
      try {
        const updatedUser = {
          ...user,
          hasSubscription: true,
          subscriptionPlan: plan,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (error) {
        console.error("Error updating subscription:", error);
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

  const updateCompany = (newCompanyId: string, companyInfo?: any) => {
    try {
      console.log("updateCompany called with:", { newCompanyId, companyInfo });
      setCompanyId(String(newCompanyId));
      setHasCompany(true);
      localStorage.setItem("company_id", String(newCompanyId));
      localStorage.setItem("company", "true");
      if (companyInfo)
        localStorage.setItem("companyInfo", JSON.stringify(companyInfo));

      // also update user object if present
      if (user) {
        const updatedUser = { ...user } as any;
        // try to set hasCompany / companyId fields on user if backend expects
        (updatedUser as any).hasCompany = true;
        (updatedUser as any).companyId = newCompanyId;
        setUser(updatedUser as User);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
      console.log(
        "updateCompany complete. localStorage company_id:",
        localStorage.getItem("company_id")
      );
    } catch (error) {
      console.warn("Could not update company info in auth context", error);
    }
  };

  const checkPermission = (moduleId: string) => {
    const userType = localStorage.getItem("userType");

    // Restrictions for Trading (employee) and Trading Employee (company_user)
    if (userType === "employee" || userType === "company_user") {
      const restrictedModules = ["gst", "tds", "audit", "income-tax"];
      if (restrictedModules.includes(moduleId)) {
        return false;
      }
    }

    // If not CA employee, grant all other permissions
    if (userType !== "ca_employee") return true;

    // Check if module is allowed
    return !!permissions[moduleId];
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
        hasCompany,
        companyId,
        updateCompany,
        isAuthenticated: !!user,
        permissions,
        checkPermission,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
