/**
 * Example API call using company_id from CompanyContext
 * 
 * This file demonstrates how to use company_id in API calls
 * throughout your application.
 */

import { useCompany } from '../context/CompanyContext';

/**
 * Example: Fetching data for the current company
 */
export async function fetchCompanyData() {
  // Get active company ID from localStorage (synced by CompanyContext)
  const companyId = localStorage.getItem('active_company_id') || localStorage.getItem('company_id');
  
  if (!companyId) {
    throw new Error('No active company selected');
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const response = await fetch(`${apiUrl}/api/company/${companyId}/data`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch company data');
  }

  return response.json();
}

/**
 * Example: Using company_id in a React component
 */
export function ExampleComponent() {
  const { activeCompanyId, companyInfo } = useCompany();

  const handleFetchData = async () => {
    if (!activeCompanyId) {
      alert('Please select a company first');
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL;
      const token = localStorage.getItem('token');

      const response = await fetch(`${apiUrl}/api/vouchers?company_id=${activeCompanyId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await response.json();
      console.log('Vouchers for company:', data);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  return (
    <div>
      <p>Current Company: {companyInfo?.name || 'None'}</p>
      <p>Company ID: {activeCompanyId || 'None'}</p>
      <button onClick={handleFetchData}>Fetch Data</button>
    </div>
  );
}

/**
 * Example: Creating a voucher with company_id
 */
export async function createVoucher(voucherData: any) {
  const companyId = localStorage.getItem('active_company_id') || localStorage.getItem('company_id');
  
  if (!companyId) {
    throw new Error('No active company selected');
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem('token');

  const response = await fetch(`${apiUrl}/api/vouchers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      ...voucherData,
      company_id: companyId, // Always include company_id
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create voucher');
  }

  return response.json();
}

