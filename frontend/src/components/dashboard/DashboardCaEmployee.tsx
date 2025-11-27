import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";

interface CompanyInfo {
    id: string; // Added for AppContext compatibility
    name: string;
    financialYear: string;
    booksBeginningYear: string;
    address: string;
    pin: string;
    phoneNumber: string;
    email: string;
    panNumber: string;
    gstNumber: string;
    vatNumber: string;
    cinNumber: string;
    state?: string;
    country?: string;
    taxType?: 'GST' | 'VAT';
    employeeId?: number;
    turnover?: number;
    registrationType?: string;
    assesseeOfOtherTerritory?: boolean;
    periodicityOfGstr1?: string;
    gstApplicableFrom?: string;
    eWayBillApplicable?: boolean;
    eWayBillThresholdLimit?: string;
    eWayBillIntrastate?: boolean;
    provideLutBond?: boolean;
    lutBondNumber?: string;
    lutBondValidity?: string;
    taxLiabilityOnAdvanceReceipts?: boolean;
    maintainBy?: 'self' | 'accountant';
    accountantName?: string;
  // add other fields as necessary collected from your API
}

const DashboardCaEmployee: React.FC = () => {
  const { theme, setCompanyInfo } = useAppContext();
  const [companyInfo, setCompanyInfoState] = useState<CompanyInfo | null>(null);
const [assignedCompanies, setAssignedCompanies] = useState<CompanyInfo[]>([]);
 const [selectedCompany, setSelectedCompany] = useState<string>("");

  const caEmployeeId = localStorage.getItem("employee_id"); // CA Employee's ID from login
  const companyIdFromStorage = localStorage.getItem("company_id");

  // Fetch companies assigned to this ca_employee on mount
  useEffect(() => {
    if (!caEmployeeId) return;

  fetch(`${import.meta.env.VITE_API_URL}/api/companies-by-ca-employee?ca_employee_id=${caEmployeeId}`)
      .then((res) => res.json())
      .then(data => {
      const companies: CompanyInfo[] = (data?.companies || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        financialYear: c.financial_year || '',
        booksBeginningYear: c.books_beginning_year || '',
        pin: c.pin || '',
        phoneNumber: c.phone_number || '',
        email: c.email || '',
        panNumber: c.pan_number || '',
        gstNumber: c.gst_number || null,
        state: c.state || '',
        country: c.country || 'India',
        taxType: c.tax_type || '',
        vatNumber: c.vat_number || null,
        address: c.address || '',
      }));
      setAssignedCompanies(companies);

      const storedCompanyId = companyIdFromStorage;
      if (!storedCompanyId || !companies.find(c => c.id.toString() === storedCompanyId)) {
        if (companies.length > 0) {
          setSelectedCompany(companies[0].id.toString());
          localStorage.setItem("company_id", companies[0].id.toString());
          setCompanyInfo(companies[0]);
          setCompanyInfoState(companies[0]);
        }
      } else {
        setSelectedCompany(storedCompanyId);
        const selected = companies.find(c => c.id.toString() === storedCompanyId) || null;
        if (selected) {
          setCompanyInfo(selected);
          setCompanyInfoState(selected);
        } else {
          setCompanyInfoState(null);
        }
      }
    })
    .catch(console.error);
}, [caEmployeeId, companyIdFromStorage, setCompanyInfo]);

  // Handler for company switch
  const handleCompanyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    setSelectedCompany(newId);
    localStorage.setItem("company_id", newId);

    const selected = assignedCompanies.find((c) => c.id.toString() === newId) || null;
    // setCompanyInfo(selected);
    setCompanyInfoState(selected);

    // optionally reload page or update app state fully
    window.location.reload();
  };

  if (!caEmployeeId) {
    return <p>Please login to view this page.</p>;
  }

  return (
    <div className="pt-[56px] px-4 max-w-3xl mx-auto">
      <h1 className={`text-3xl font-semibold mb-6 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
        Hello CA Employee
      </h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium text-gray-700">Switch Company</label>
        <select
          value={selectedCompany}
          onChange={handleCompanyChange}
          className="border px-3 py-2 rounded w-full max-w-xs"
          title="Select a company"
        >
          <option value="">Select Company</option>
          {assignedCompanies.map((c) => (
            <option key={c.id} value={c.id.toString()}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {companyInfo && (
        <div
          className={`p-6 rounded-lg shadow ${
            theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
          }`}
        >
          <h2 className="text-xl font-semibold mb-2">{companyInfo.name}</h2>
          <p>Financial Year: {companyInfo.financialYear || "N/A"}</p>
          <p>Books Beginning From: {companyInfo.booksBeginningYear || "N/A"}</p>
          <p>Address: {companyInfo.address || "N/A"}</p>
          <p>PAN: {companyInfo.panNumber || "N/A"}</p>
          <p>GST Number: {companyInfo.gstNumber || "N/A"}</p>
          <p>Tax Type: {companyInfo.taxType || "N/A"}</p>
        </div>
      )}
    </div>
  );
};

export default DashboardCaEmployee;
