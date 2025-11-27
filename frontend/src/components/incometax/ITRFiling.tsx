import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Save, Download, Printer, Calculator, User } from 'lucide-react';

interface AssesseeInfo {
  name: string;
  fatherName: string;
  address: string;
  pan: string;
  aadhar: string;
  email: string;
  dateOfBirth: string;
  assessmentYear: string;
  financialYear: string;
}

interface SalaryIncome {
  salaryIncome: number;
  section17Income: number;
  deduction16: number;
}

interface BusinessIncome {
  netProfit: number;
  businessType: string;
  grossTurnover: number;
  section44AD: boolean;
  section44AB: boolean;
}

interface HouseProperty {
  annualValue: number;
  tenantName1: string;
  tenantAddress1: string;
  tenantPan1: string;
  tenantName2: string;
  tenantAddress2: string;
  tenantPan2: string;
  deduction30Percent: number;
}

interface CapitalGain {
  saleConsideration: number;
  saleDate: string;
  purchaseConsiderationCost: number;
  purchaseConsiderationIndex: number;
  improvementCost1: number;
  improvementIndex1: number;
  improvementCost2: number;
  improvementIndex2: number;
  improvementCost3: number;
  improvementIndex3: number;
}

interface OtherSources {
  agricultureIncome: number;
  savingInterest80TTA: number;
  fixedDepositJHGRB: number;
  fixedDepositSBI: number;
  fixedDepositSahara: number;
  tuitionFee: number;
}

interface Deductions80C {
  lifeInsurancePremium: number;
  policies: Array<{
    date: string;
    policyNo: string;
    remark: string;
    value: number;
  }>;
  tuitionFeeFirstSecondChild: number;
}

interface TaxPayment {
  date: string;
  chequeNo: string;
  bsrCode: string;
  bankName: string;
  amount: number;
}

interface ITRData {
  assessee: AssesseeInfo;
  salary: SalaryIncome;
  business: BusinessIncome;
  houseProperty: HouseProperty;
  capitalGain: CapitalGain;
  otherSources: OtherSources;
  deductions80C: Deductions80C;
  tdsDeducted: number;
  taxPayments: TaxPayment[];
}

const ITRFiling: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ITRData>({
    assessee: {
      name: '',
      fatherName: '',
      address: '',
      pan: '',
      aadhar: '',
      email: '',
      dateOfBirth: '',
      assessmentYear: '2024-25',
      financialYear: '2023-24'
    },
    salary: {
      salaryIncome: 0,
      section17Income: 0,
      deduction16: 0
    },
    business: {
      netProfit: 0,
      businessType: '',
      grossTurnover: 0,
      section44AD: false,
      section44AB: false
    },
    houseProperty: {
      annualValue: 0,
      tenantName1: '',
      tenantAddress1: '',
      tenantPan1: '',
      tenantName2: '',
      tenantAddress2: '',
      tenantPan2: '',
      deduction30Percent: 0
    },
    capitalGain: {
      saleConsideration: 0,
      saleDate: '',
      purchaseConsiderationCost: 0,
      purchaseConsiderationIndex: 0,
      improvementCost1: 0,
      improvementIndex1: 0,
      improvementCost2: 0,
      improvementIndex2: 0,
      improvementCost3: 0,
      improvementIndex3: 0
    },
    otherSources: {
      agricultureIncome: 0,
      savingInterest80TTA: 0,
      fixedDepositJHGRB: 0,
      fixedDepositSBI: 0,
      fixedDepositSahara: 0,
      tuitionFee: 0
    },
    deductions80C: {
      lifeInsurancePremium: 0,
      policies: [
        { date: '', policyNo: '', remark: '', value: 0 }
      ],
      tuitionFeeFirstSecondChild: 0
    },
    tdsDeducted: 0,
    taxPayments: [
      { date: '', chequeNo: '', bsrCode: '', bankName: '', amount: 0 }
    ]
  });
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  try {
    const employee_id = localStorage.getItem('employee_id');
    const company_id = localStorage.getItem('company_id') || '';


    if (!employee_id) {
      alert('Employee ID not found in local storage');
      return;
    }

    const payload = {
      ...formData,
      employee_id,
      company_id,
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/itr-filling`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // If the server responds with an error status
      const errorData = await response.json();
      alert('Failed to file ITR: ' + (errorData.error || response.statusText));
      return;
    }

    const data: { success: boolean; id?: number; error?: string } = await response.json();

    if (data.success) {
      alert(`ITR filed successfully with ID: ${data.id}`);
      // Optionally reset form or redirect here
    } else {
      alert('Failed to file ITR');
    }
  } catch (error: any) {
    alert('Error submitting ITR: ' + (error.message || "Unknown error"));
  }
};


  const handleInputChange = (section: keyof ITRData, field: string, value: string | number | boolean) => {
    setFormData(prev => {
      const currentSection = prev[section];
      if (typeof currentSection === 'object' && currentSection !== null && !Array.isArray(currentSection)) {
        return {
          ...prev,
          [section]: {
            ...currentSection,
            [field]: value
          }
        };
      }
      return prev;
    });
  };

  const addPolicy = () => {
    setFormData(prev => ({
      ...prev,
      deductions80C: {
        ...prev.deductions80C,
        policies: [...prev.deductions80C.policies, { date: '', policyNo: '', remark: '', value: 0 }]
      }
    }));
  };

  const updatePolicy = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      deductions80C: {
        ...prev.deductions80C,
        policies: prev.deductions80C.policies.map((policy, i) => 
          i === index ? { ...policy, [field]: value } : policy
        )
      }
    }));
  };

  const addTaxPayment = () => {
    setFormData(prev => ({
      ...prev,
      taxPayments: [...prev.taxPayments, { date: '', chequeNo: '', bsrCode: '', bankName: '', amount: 0 }]
    }));
  };

  const updateTaxPayment = (index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      taxPayments: prev.taxPayments.map((payment, i) => 
        i === index ? { ...payment, [field]: value } : payment
      )
    }));
  };

  // Calculations
  const incomeFromSalary = formData.salary.salaryIncome + formData.salary.section17Income - formData.salary.deduction16;
  const incomeFromBusiness = formData.business.netProfit;
  const incomeFromHouseProperty = formData.houseProperty.annualValue - formData.houseProperty.deduction30Percent;
  const incomeFromCapitalGain = formData.capitalGain.saleConsideration - 
    (formData.capitalGain.purchaseConsiderationCost + formData.capitalGain.purchaseConsiderationIndex +
     formData.capitalGain.improvementCost1 + formData.capitalGain.improvementIndex1 +
     formData.capitalGain.improvementCost2 + formData.capitalGain.improvementIndex2 +
     formData.capitalGain.improvementCost3 + formData.capitalGain.improvementIndex3);
  const incomeFromOtherSources = formData.otherSources.savingInterest80TTA + formData.otherSources.fixedDepositJHGRB +
    formData.otherSources.fixedDepositSBI + formData.otherSources.fixedDepositSahara + formData.otherSources.tuitionFee;

  const totalTaxableIncome = incomeFromSalary + incomeFromBusiness + incomeFromHouseProperty + 
    incomeFromCapitalGain + incomeFromOtherSources;

  const total80CDeductions = formData.deductions80C.lifeInsurancePremium + formData.deductions80C.tuitionFeeFirstSecondChild;
  const netTaxableIncome = totalTaxableIncome - total80CDeductions;
  const roundedTaxableIncome = Math.round(netTaxableIncome / 10) * 10;

  // Tax calculation
  const calculateTax = (income: number) => {
    if (income <= 250000) return 0;
    if (income <= 500000) return (income - 250000) * 0.05;
    if (income <= 1000000) return 12500 + (income - 500000) * 0.20;
    return 112500 + (income - 1000000) * 0.30;
  };

  const taxOnTotalIncome = calculateTax(roundedTaxableIncome);
  const taxRelief87A = Math.min(12500, taxOnTotalIncome);
  const balanceAfterRelief = taxOnTotalIncome - taxRelief87A;
  const educationCess = balanceAfterRelief * 0.04;
  const totalTax = balanceAfterRelief + educationCess;
  const totalTaxPayments = formData.taxPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const balanceTax = totalTax - formData.tdsDeducted - totalTaxPayments;

  const inputClass = (hasError?: boolean) => 
    `w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${hasError ? 'border-red-500' : ''}`;

  const sectionClass = `p-6 mb-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`;

  // Frontend-only PAN based autofill from AssesseeManagement localStorage
  const ASSESSEE_STORAGE_KEY = 'assessee_list_v1';
  type StoredAssessee = {
    name?: string;
    fatherName?: string;
    dateOfBirth?: string;
    pan?: string;
    aadhar?: string;
    email?: string;
    phone?: string;
    address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  };

  const tryAutofillFromPAN = (pan: string) => {
    const normalized = (pan || '').toUpperCase().trim();
    if (normalized.length !== 10) return; // basic PAN length check
    try {
      const raw = localStorage.getItem(ASSESSEE_STORAGE_KEY);
      if (!raw) return;
      const list: unknown = JSON.parse(raw);
      if (!Array.isArray(list)) return;
      const match = (list as StoredAssessee[]).find((a) => ((a?.pan ?? '').toUpperCase() === normalized));
      if (!match) return;

      const combinedAddress = [match.address?.line1, match.address?.line2, match.address?.city, match.address?.state, match.address?.pincode]
        .filter(Boolean)
        .join(', ');

      setFormData(prev => ({
        ...prev,
        assessee: {
          ...prev.assessee,
          name: match.name || '',
          fatherName: match.fatherName || '',
          dateOfBirth: match.dateOfBirth || '',
          address: combinedAddress,
          pan: normalized,
          aadhar: match.aadhar || '',
          email: match.email || '',
          phone: match.phone || ''
        }
      }));
    } catch (e) {
      console.warn('PAN autofill failed', e);
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/income-tax')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          title="Back to Income Tax"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">ITR Computation  - Statement of Taxable Income</h1>
        <div className="ml-auto flex space-x-2">
          <button
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Calculate Tax"
          >
            <Calculator size={18} />
          </button>
          <button
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Print"
          >
            <Printer size={18} />
          </button>
          <button
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Download"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Assessee Information */}
      <form onSubmit={handleSubmit}>

      <div className={sectionClass}>
        <div className="flex items-center mb-4">
          <User size={20} className="mr-2" />
          <h2 className="text-xl font-semibold">Assessee Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Assessee Name</label>
            <input
              type="text"
              value={formData.assessee.name}
              onChange={(e) => handleInputChange('assessee', 'name', e.target.value)}
              className={inputClass()}
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">S/o, D/o, W/o</label>
            <input
              type="text"
              value={formData.assessee.fatherName}
              onChange={(e) => handleInputChange('assessee', 'fatherName', e.target.value)}
              className={inputClass()}
              placeholder="Enter father's name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date of Birth</label>
            <input
             title='Select Date of Birth'
              type="date"
              value={formData.assessee.dateOfBirth}
              onChange={(e) => handleInputChange('assessee', 'dateOfBirth', e.target.value)}
              className={inputClass()}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input
              type="text"
              value={formData.assessee.address}
              onChange={(e) => handleInputChange('assessee', 'address', e.target.value)}
              className={inputClass()}
              placeholder="Enter address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">PAN</label>
            <input
              type="text"
              value={formData.assessee.pan}
              onChange={(e) => handleInputChange('assessee', 'pan', e.target.value.toUpperCase())}
              onBlur={(e) => tryAutofillFromPAN(e.target.value)}
              className={inputClass()}
              placeholder="ABCDE1234F"
              maxLength={10}
            />
            <div className="mt-1 text-xs text-gray-500">Enter PAN and tab out to auto-fill from Assessee Management.</div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Aadhar</label>
            <input
              type="text"
              value={formData.assessee.aadhar}
              onChange={(e) => handleInputChange('assessee', 'aadhar', e.target.value)}
              className={inputClass()}
              placeholder="1234 5678 9012"
              maxLength={12}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={formData.assessee.email}
              onChange={(e) => handleInputChange('assessee', 'email', e.target.value)}
              className={inputClass()}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assessment Year</label>
            <select
              value={formData.assessee.assessmentYear}
              onChange={(e) => handleInputChange('assessee', 'assessmentYear', e.target.value)}
              className={inputClass()}
              title="Select Assessment Year"
            >
              <option value="2024-25">2024-25</option>
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Financial Year</label>
            <select
              value={formData.assessee.financialYear}
              onChange={(e) => handleInputChange('assessee', 'financialYear', e.target.value)}
              className={inputClass()}
              title="Select Financial Year"
            >
              <option value="2023-24">2023-24</option>
              <option value="2022-23">2022-23</option>
              <option value="2021-22">2021-22</option>
            </select>
          </div>
        </div>
      </div>

      {/* Income from Salary */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">INCOME FROM SALARY</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Salary Income U/S 17(I) From</label>
            <input
              type="number"
              value={formData.salary.section17Income}
              onChange={(e) => handleInputChange('salary', 'section17Income', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Less - Deduction 16</label>
            <input
              type="number"
              value={formData.salary.deduction16}
              onChange={(e) => handleInputChange('salary', 'deduction16', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Total Salary Income</label>
            <div className={`p-2 rounded border bg-gray-100 ${theme === 'dark' ? 'bg-gray-600' : 'bg-gray-100'}`}>
              ₹{incomeFromSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Income from Business & Professional */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">INCOME FROM BUSINESS & PROFESSIONAL</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Net Profit as per P/L A/C U/S 44AD/44AB</label>
            <input
              type="number"
              value={formData.business.netProfit}
              onChange={(e) => handleInputChange('business', 'netProfit', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Business Type</label>
            <input
              type="text"
              value={formData.business.businessType}
              onChange={(e) => handleInputChange('business', 'businessType', e.target.value)}
              className={inputClass()}
              placeholder="e.g., Embroidery Work"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gross Turnover</label>
            <input
              type="number"
              value={formData.business.grossTurnover}
              onChange={(e) => handleInputChange('business', 'grossTurnover', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="mt-4 flex space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.business.section44AD}
              onChange={(e) => handleInputChange('business', 'section44AD', e.target.checked)}
              className="mr-2"
            />
            Section 44AD
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.business.section44AB}
              onChange={(e) => handleInputChange('business', 'section44AB', e.target.checked)}
              className="mr-2"
            />
            Section 44AB
          </label>
        </div>
      </div>

      {/* Income from House Property */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">INCOME FROM HOUSE PROPERTY</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Annual Value of Property</label>
            <input
              type="number"
              value={formData.houseProperty.annualValue}
              onChange={(e) => handleInputChange('houseProperty', 'annualValue', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Less - Deduction U/S 30%</label>
            <input
              type="number"
              value={formData.houseProperty.deduction30Percent}
              onChange={(e) => handleInputChange('houseProperty', 'deduction30Percent', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">Tenant 1 Details</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.houseProperty.tenantName1}
                onChange={(e) => handleInputChange('houseProperty', 'tenantName1', e.target.value)}
                className={inputClass()}
                placeholder="Tenant Name"
              />
              <input
                type="text"
                value={formData.houseProperty.tenantAddress1}
                onChange={(e) => handleInputChange('houseProperty', 'tenantAddress1', e.target.value)}
                className={inputClass()}
                placeholder="Address"
              />
              <input
                type="text"
                value={formData.houseProperty.tenantPan1}
                onChange={(e) => handleInputChange('houseProperty', 'tenantPan1', e.target.value.toUpperCase())}
                className={inputClass()}
                placeholder="PAN"
                maxLength={10}
              />
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-2">Tenant 2 Details</h3>
            <div className="space-y-2">
              <input
                type="text"
                value={formData.houseProperty.tenantName2}
                onChange={(e) => handleInputChange('houseProperty', 'tenantName2', e.target.value)}
                className={inputClass()}
                placeholder="Tenant Name"
              />
              <input
                type="text"
                value={formData.houseProperty.tenantAddress2}
                onChange={(e) => handleInputChange('houseProperty', 'tenantAddress2', e.target.value)}
                className={inputClass()}
                placeholder="Address"
              />
              <input
                type="text"
                value={formData.houseProperty.tenantPan2}
                onChange={(e) => handleInputChange('houseProperty', 'tenantPan2', e.target.value.toUpperCase())}
                className={inputClass()}
                placeholder="PAN"
                maxLength={10}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Income from Capital Gain */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">INCOME FROM CAPITAL GAIN</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Sale Consideration of Land & Building</label>
            <input
              type="number"
              value={formData.capitalGain.saleConsideration}
              onChange={(e) => handleInputChange('capitalGain', 'saleConsideration', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
              title="Sale Consideration Amount"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sale Date</label>
            <input
              type="date"
              value={formData.capitalGain.saleDate}
              onChange={(e) => handleInputChange('capitalGain', 'saleDate', e.target.value)}
              className={inputClass()}
              title="Sale Date"
            />
          </div>
          <div></div>
        </div>

        <div className="mt-6">
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="font-medium"></div>
            <div className="font-medium text-center">AT COST</div>
            <div className="font-medium text-center">INDEX COST</div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="flex items-center">LESS - Purchase Consideration of Land</div>
            <input
              type="number"
              value={formData.capitalGain.purchaseConsiderationCost}
              onChange={(e) => handleInputChange('capitalGain', 'purchaseConsiderationCost', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
            <input
              type="number"
              value={formData.capitalGain.purchaseConsiderationIndex}
              onChange={(e) => handleInputChange('capitalGain', 'purchaseConsiderationIndex', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="flex items-center">ADD - Improvement of Property DT</div>
            <input
              type="number"
              value={formData.capitalGain.improvementCost1}
              onChange={(e) => handleInputChange('capitalGain', 'improvementCost1', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
            <input
              type="number"
              value={formData.capitalGain.improvementIndex1}
              onChange={(e) => handleInputChange('capitalGain', 'improvementIndex1', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="flex items-center">ADD - Improvement of Property DT</div>
            <input
              type="number"
              value={formData.capitalGain.improvementCost2}
              onChange={(e) => handleInputChange('capitalGain', 'improvementCost2', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
            <input
              type="number"
              value={formData.capitalGain.improvementIndex2}
              onChange={(e) => handleInputChange('capitalGain', 'improvementIndex2', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-2">
            <div className="flex items-center">ADD - Improvement of Property DT</div>
            <input
              type="number"
              value={formData.capitalGain.improvementCost3}
              onChange={(e) => handleInputChange('capitalGain', 'improvementCost3', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
            <input
              type="number"
              value={formData.capitalGain.improvementIndex3}
              onChange={(e) => handleInputChange('capitalGain', 'improvementIndex3', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Income from Other Sources */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">INCOME FROM OTHER SOURCES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Agriculture Income</label>
            <input
              type="number"
              value={formData.otherSources.agricultureIncome}
              onChange={(e) => handleInputChange('otherSources', 'agricultureIncome', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Saving Interest U/S 80TTA</label>
            <input
              type="number"
              value={formData.otherSources.savingInterest80TTA}
              onChange={(e) => handleInputChange('otherSources', 'savingInterest80TTA', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fixed Deposit JH GRB Interest</label>
            <input
              type="number"
              value={formData.otherSources.fixedDepositJHGRB}
              onChange={(e) => handleInputChange('otherSources', 'fixedDepositJHGRB', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fixed Deposit SBI Interest</label>
            <input
              type="number"
              value={formData.otherSources.fixedDepositSBI}
              onChange={(e) => handleInputChange('otherSources', 'fixedDepositSBI', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fixed Deposit Sahara Interest</label>
            <input
              type="number"
              value={formData.otherSources.fixedDepositSahara}
              onChange={(e) => handleInputChange('otherSources', 'fixedDepositSahara', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tuition Fee</label>
            <input
              type="number"
              value={formData.otherSources.tuitionFee}
              onChange={(e) => handleInputChange('otherSources', 'tuitionFee', parseFloat(e.target.value) || 0)}
              className={inputClass()}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Total Taxable Income */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">TOTAL TAXABLE INCOME</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium">Income from Salary:</div>
          <div className="text-right">₹{incomeFromSalary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">Income from Business & Professional:</div>
          <div className="text-right">₹{incomeFromBusiness.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">Income from House Property:</div>
          <div className="text-right">₹{incomeFromHouseProperty.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">Income from Capital Gain:</div>
          <div className="text-right">₹{incomeFromCapitalGain.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">Income from Other Sources:</div>
          <div className="text-right">₹{incomeFromOtherSources.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-bold text-lg border-t pt-2">TOTAL TAXABLE INCOME:</div>
          <div className="font-bold text-lg text-right border-t pt-2">₹{totalTaxableIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Deductions */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">DEDUCTION</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-4">U/S 80C</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Life Insurance Premium</label>
              <input
                type="number"
                value={formData.deductions80C.lifeInsurancePremium}
                onChange={(e) => handleInputChange('deductions80C', 'lifeInsurancePremium', parseFloat(e.target.value) || 0)}
                className={inputClass()}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tuition Fee First & Second Child</label>
              <input
                type="number"
                value={formData.deductions80C.tuitionFeeFirstSecondChild}
                onChange={(e) => handleInputChange('deductions80C', 'tuitionFeeFirstSecondChild', parseFloat(e.target.value) || 0)}
                className={inputClass()}
                placeholder="0.00"
              />
            </div>
          </div>

          <h4 className="font-medium mb-2">Life Insurance Policy Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Policy No</th>
                  <th className="px-4 py-2 text-left">Remark</th>
                  <th className="px-4 py-2 text-right">Value</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {formData.deductions80C.policies.map((policy, index) => (
                  <tr key={index} className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                    <td className="px-4 py-2">
                      <input
                        type="date"
                        value={policy.date}
                        onChange={(e) => updatePolicy(index, 'date', e.target.value)}
                        className={inputClass()}
                        title="Policy Date"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={policy.policyNo}
                        onChange={(e) => updatePolicy(index, 'policyNo', e.target.value)}
                        className={inputClass()}
                        placeholder="Policy Number"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={policy.remark}
                        onChange={(e) => updatePolicy(index, 'remark', e.target.value)}
                        className={inputClass()}
                        placeholder="LIC/ULIP"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        value={policy.value}
                        onChange={(e) => updatePolicy(index, 'value', parseFloat(e.target.value) || 0)}
                        className={inputClass()}
                        placeholder="0.00"
                      />
                    </td>
                    <td className="px-4 py-2">
                      {index === formData.deductions80C.policies.length - 1 && (
                        <button
                          onClick={addPolicy}
                          className="text-blue-600 hover:text-blue-800"
                          title="Add Policy"
                        >
                          +
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="font-medium">Total 80C Deductions:</div>
            <div className="text-right font-medium">₹{total80CDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
      </div>

      {/* Net Taxable Income */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">NET TAXABLE INCOME</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium">Gross Taxable Income:</div>
          <div className="text-right">₹{totalTaxableIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">Less: Total Deductions:</div>
          <div className="text-right">₹{total80CDeductions.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-bold text-lg border-t pt-2">NET TAXABLE INCOME:</div>
          <div className="font-bold text-lg text-right border-t pt-2">₹{netTaxableIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-bold text-lg">ROUND OFF:</div>
          <div className="font-bold text-lg text-right">₹{roundedTaxableIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      {/* Tax Computation */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">TAX COMPUTATION</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium">Tax on Total Taxable Income:</div>
          <div className="text-right">₹{taxOnTotalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">Less - Deduction of Tax Relief U/S 87A:</div>
          <div className="text-right">₹{taxRelief87A.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">Balance:</div>
          <div className="text-right">₹{balanceAfterRelief.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">Education Cess @4%:</div>
          <div className="text-right">₹{educationCess.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-bold text-lg border-t pt-2">TOTAL TAX:</div>
          <div className="font-bold text-lg text-right border-t pt-2">₹{totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium mb-2">TDS Deduction</h3>
          <input
            type="number"
            value={formData.tdsDeducted}
            onChange={(e) => setFormData(prev => ({ ...prev, tdsDeducted: parseFloat(e.target.value) || 0 }))}
            className={inputClass()}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Tax Payment Details */}
      <div className={sectionClass}>
        <h2 className="text-xl font-semibold mb-4">TAX PAYMENT U/S 140A</h2>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">CH No</th>
                <th className="px-4 py-2 text-left">BSR Code</th>
                <th className="px-4 py-2 text-left">Bank Name</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {formData.taxPayments.map((payment, index) => (
                <tr key={index} className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                  <td className="px-4 py-2">
                    <input
                      type="date"
                      value={payment.date}
                      onChange={(e) => updateTaxPayment(index, 'date', e.target.value)}
                      className={inputClass()}
                      title="Payment Date"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={payment.chequeNo}
                      onChange={(e) => updateTaxPayment(index, 'chequeNo', e.target.value)}
                      className={inputClass()}
                      placeholder="Cheque No"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={payment.bsrCode}
                      onChange={(e) => updateTaxPayment(index, 'bsrCode', e.target.value)}
                      className={inputClass()}
                      placeholder="BSR Code"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={payment.bankName}
                      onChange={(e) => updateTaxPayment(index, 'bankName', e.target.value)}
                      className={inputClass()}
                      placeholder="Bank Name"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={payment.amount}
                      onChange={(e) => updateTaxPayment(index, 'amount', parseFloat(e.target.value) || 0)}
                      className={inputClass()}
                      placeholder="0.00"
                    />
                  </td>
                  <td className="px-4 py-2">
                    {index === formData.taxPayments.length - 1 && (
                      <button
                        onClick={addTaxPayment}
                        className="text-blue-600 hover:text-blue-800"
                        title="Add Payment"
                      >
                        +
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="font-medium">Total Tax Payments:</div>
          <div className="text-right">₹{totalTaxPayments.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-medium">TDS Deducted:</div>
          <div className="text-right">₹{formData.tdsDeducted.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          
          <div className="font-bold text-lg border-t pt-2">BALANCE TAX:</div>
          <div className={`font-bold text-lg text-right border-t pt-2 ${balanceTax > 0 ? 'text-red-600' : 'text-green-600'}`}>
            ₹{Math.abs(balanceTax).toLocaleString('en-IN', { minimumFractionDigits: 2 })} {balanceTax > 0 ? '(Payable)' : '(Refund)'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mb-8">
        <button
          className={`px-6 py-2 rounded-md ${
            theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600' 
              : 'bg-gray-200 hover:bg-gray-300'
          }`}
        >
          Save Draft
        </button>
        <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center">
          <Save size={16} className="mr-2" />
          Submit ITR
        </button>
      </div>
</form>

      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Note:</span> This is a comprehensive Income Tax Return filing form. Ensure all information is accurate before submission. 
          Consult a tax professional for complex situations.
        </p>
      </div>
    </div>
  );
};

export default ITRFiling;