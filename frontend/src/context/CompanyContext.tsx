import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CompanyInfo } from '../types';

// LocalStorage keys
const STORAGE_KEYS = {
  COMPANIES: 'companies',
  ACTIVE_COMPANY_ID: 'active_company_id',
  COMPANY_INFO: 'companyInfo',
} as const;

// Company type for the companies array
type Company = {
  id: string | number;
  name: string;
  [key: string]: any; // Allow additional properties
};

interface CompanyContextProps {
  // State
  companies: Company[];
  activeCompanyId: string | null;
  companyInfo: CompanyInfo | null;
  unlockedCompanyId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  switchCompany: (companyId: string | number) => Promise<void>;
  setCompanies: (companies: Company[]) => void;
  setUnlockedCompany: (companyId: string | null) => void;
  addCompany: (company: Company) => void;
  updateCompany: (companyId: string | number, updates: Partial<CompanyInfo>) => void;
  refreshCompanyInfo: () => Promise<void>;
  clearError: () => void;
}

const CompanyContext = createContext<CompanyContextProps | undefined>(undefined);

/**
 * Safe JSON parse with error handling
 */
function safeParseJSON<T>(jsonString: string | null, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return fallback;
  }
}

/**
 * Safe localStorage getter
 */
function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error(`Failed to get localStorage item "${key}":`, error);
    return null;
  }
}

/**
 * Safe localStorage setter
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.error(`Failed to set localStorage item "${key}":`, error);
    return false;
  }
}

/**
 * Find company by ID in companies array
 */
function findCompanyById(companies: Company[], companyId: string | number): Company | null {
  return companies.find(c => String(c.id) === String(companyId)) || null;
}

/**
 * Convert company object to CompanyInfo format
 */
function convertToCompanyInfo(company: Company): CompanyInfo {
  const baseInfo: CompanyInfo = {
    id: String(company.id),
    name: company.name,
    financialYear: (company as any).financialYear || (company as any).financial_year || '',
    booksBeginningYear: (company as any).booksBeginningYear || (company as any).books_beginning_year || '',
    address: (company as any).address || '',
    pin: (company as any).pin || '',
    phoneNumber: (company as any).phoneNumber || (company as any).phone_number || '',
    email: (company as any).email || '',
    panNumber: (company as any).panNumber || (company as any).pan_number || '',
    tanNumber: (company as any).tanNumber || (company as any).tan_number || '',
    gstNumber: (company as any).gstNumber || (company as any).gst_number || '',
    vatNumber: (company as any).vatNumber || (company as any).vat_number || '',
    cinNumber: (company as any).cinNumber || (company as any).cin_number || '',
    state: (company as any).state || '',
    country: (company as any).country || 'India',
    taxType: (company as any).taxType || (company as any).tax_type || 'GST',
    maintainBy: (company as any).maintainBy || (company as any).maintain_by || 'self',
    accountantName: (company as any).accountantName || (company as any).accountant_name || '',
  };

  // Include any additional properties from company, but don't overwrite existing ones
  const { id, name, ...additionalProps } = company;

  return { ...baseInfo, ...additionalProps } as CompanyInfo;
}

/**
 * Fetch company info from API
 */
async function fetchCompanyFromAPI(companyId: string | number): Promise<CompanyInfo | null> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (!apiUrl) {
      throw new Error('API URL not configured');
    }

    const token = safeGetItem('token');
    const response = await fetch(`${apiUrl}/api/company/${companyId}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.company) {
        const companyInfo: CompanyInfo = convertToCompanyInfo(data.company);
        return companyInfo;
      }
    }
  } catch (error) {
    console.error('Failed to fetch company info from API:', error);
  }
  return null;
}

/**
 * Sync companyInfo with active_company_id
 * This ensures companyInfo always matches the selected company
 */
async function syncCompanyInfo(
  companies: Company[],
  activeCompanyId: string | null,
  setCompanyInfo: (info: CompanyInfo | null) => void,
  setError: (error: string | null) => void
): Promise<void> {
  if (!activeCompanyId) {
    setCompanyInfo(null);
    safeSetItem(STORAGE_KEYS.COMPANY_INFO, 'null');
    return;
  }

  // Step 1: Check if companyInfo in localStorage matches active_company_id
  const storedCompanyInfo = safeGetItem(STORAGE_KEYS.COMPANY_INFO);
  if (storedCompanyInfo) {
    const parsedInfo = safeParseJSON<CompanyInfo | null>(storedCompanyInfo, null);
    if (parsedInfo && String(parsedInfo.id) === String(activeCompanyId)) {
      // companyInfo matches active_company_id, use it
      setCompanyInfo(parsedInfo);
      return;
    }
  }

  // Step 2: Try to find company in companies array
  const company = findCompanyById(companies, activeCompanyId);
  if (company) {
    const companyInfo = convertToCompanyInfo(company);
    setCompanyInfo(companyInfo);
    safeSetItem(STORAGE_KEYS.COMPANY_INFO, JSON.stringify(companyInfo));
    return;
  }

  // Step 3: If company not found in array, try to fetch from API
  const apiCompanyInfo = await fetchCompanyFromAPI(activeCompanyId);
  if (apiCompanyInfo) {
    setCompanyInfo(apiCompanyInfo);
    safeSetItem(STORAGE_KEYS.COMPANY_INFO, JSON.stringify(apiCompanyInfo));
    return;
  }

  // Step 4: If all else fails, set error
  setError(`Company with ID ${activeCompanyId} not found`);
  setCompanyInfo(null);
}

export const CompanyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [companies, setCompaniesState] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [unlockedCompanyId, setUnlockedCompanyId] = useState<string | null>(() => {
    return sessionStorage.getItem('active_unlocked_company_id');
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Initialize companies and active company from localStorage on mount
   */
  useEffect(() => {
    try {
      // Load companies array
      const storedCompanies = safeGetItem(STORAGE_KEYS.COMPANIES);
      const parsedCompanies = safeParseJSON<Company[]>(storedCompanies, []);
      setCompaniesState(parsedCompanies);

      // Load active_company_id (prefer new key, fallback to old key for backward compatibility)
      let storedActiveId = safeGetItem(STORAGE_KEYS.ACTIVE_COMPANY_ID);
      if (!storedActiveId) {
        storedActiveId = safeGetItem('company_id'); // Legacy key
        if (storedActiveId) {
          // Migrate to new key
          safeSetItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, storedActiveId);
        }
      }

      if (storedActiveId) {
        setActiveCompanyId(storedActiveId);
      }
    } catch (error) {
      console.error('Failed to initialize company context:', error);
      setError('Failed to load company data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Auto-sync companyInfo whenever activeCompanyId or companies change
   * This ensures companyInfo always matches active_company_id
   */
  useEffect(() => {
    if (!isLoading) {
      syncCompanyInfo(companies, activeCompanyId, setCompanyInfo, setError);
    }
  }, [activeCompanyId, companies, isLoading]);

  /**
   * Switch to a different company
   * This is the main function to use when switching companies
   */
  const switchCompany = useCallback(async (companyId: string | number): Promise<void> => {
    const companyIdStr = String(companyId);

    // Validate company exists if we have companies list
    if (companies.length > 0) {
      const company = findCompanyById(companies, companyId);
      if (!company) {
        const errorMsg = `Company with ID ${companyIdStr} not found in companies list`;
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    }

    // Update active_company_id in state
    setActiveCompanyId(companyIdStr);

    // Update localStorage
    safeSetItem(STORAGE_KEYS.ACTIVE_COMPANY_ID, companyIdStr);

    // Also update legacy key for backward compatibility
    safeSetItem('company_id', companyIdStr);

    // Sync companyInfo (this will be handled by the useEffect above)
    // But we can also trigger it immediately for faster response
    await syncCompanyInfo(companies, companyIdStr, setCompanyInfo, setError);

    // Clear any previous errors
    setError(null);
  }, [companies]);

  /**
   * Set companies array
   */
  const setCompanies = useCallback((newCompanies: Company[]) => {
    setCompaniesState(newCompanies);
    safeSetItem(STORAGE_KEYS.COMPANIES, JSON.stringify(newCompanies));
  }, []);

  /**
   * Set unlocked company ID
   */
  const setUnlockedCompany = useCallback((id: string | null) => {
    setUnlockedCompanyId(id);
    if (id) {
      sessionStorage.setItem('active_unlocked_company_id', id);
    } else {
      sessionStorage.removeItem('active_unlocked_company_id');
    }
  }, []);

  /**
   * Add a new company
   */
  const addCompany = useCallback((company: Company) => {
    setCompaniesState(prev => {
      const updated = [...prev, company];
      safeSetItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /**
   * Update company information
   */
  const updateCompany = useCallback((companyId: string | number, updates: Partial<CompanyInfo>) => {
    setCompaniesState(prev => {
      const updated = prev.map(c =>
        String(c.id) === String(companyId)
          ? { ...c, ...updates }
          : c
      );
      safeSetItem(STORAGE_KEYS.COMPANIES, JSON.stringify(updated));
      return updated;
    });

    // If this is the active company, update companyInfo too
    if (String(activeCompanyId) === String(companyId) && companyInfo) {
      const updatedInfo = { ...companyInfo, ...updates };
      setCompanyInfo(updatedInfo);
      safeSetItem(STORAGE_KEYS.COMPANY_INFO, JSON.stringify(updatedInfo));
    }
  }, [activeCompanyId, companyInfo]);

  /**
   * Refresh company info from API
   */
  const refreshCompanyInfo = useCallback(async () => {
    if (!activeCompanyId) return;
    await syncCompanyInfo(companies, activeCompanyId, setCompanyInfo, setError);
  }, [activeCompanyId, companies]);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <CompanyContext.Provider
      value={{
        companies,
        activeCompanyId,
        companyInfo,
        unlockedCompanyId,
        isLoading,
        error,
        switchCompany,
        setCompanies,
        setUnlockedCompany,
        addCompany,
        updateCompany,
        refreshCompanyInfo,
        clearError,
      }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

/**
 * Hook to use CompanyContext
 * @example
 * const { switchCompany, companyInfo, activeCompanyId } = useCompany();
 */
export const useCompany = (): CompanyContextProps => {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
};

