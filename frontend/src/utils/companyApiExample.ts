/**
 * Example API call using company_id from CompanyContext
 * 
 * This file demonstrates how to use company_id in API calls
 * throughout your application.
 */

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
