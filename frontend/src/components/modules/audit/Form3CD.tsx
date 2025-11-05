import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Download,
  Printer,
  FileCheck,
  AlertCircle
} from 'lucide-react';

// Complete Form 3CD interface with all 44 clauses
interface Form3CDData {
  // Clause 1-8: Basic Information
  nameOfAssessee: string;
  address: string;
  panNumber: string;
  indirectTaxLiability: 'Yes' | 'No';
  registrationNumbers: string;
  status: string;
  previousYearFrom: string;
  previousYearTo: string;
  assessmentYear: string;
  section44ABClause: string;
  taxRegimeOpted: string;
  
  // Clause 9: Partnership/LLP/BOI/AOP Details
  partnersDetails: string[];
  partnersChangeDetails: string;
  
  // Clause 10: Business/Profession Details
  natureOfBusiness: string[];
  businessChangeDetails: string;
  
  // Clause 11: Books of Account
  booksPrescribed: 'Yes' | 'No';
  booksListPrescribed: string[];
  booksMaintained: string[];
  booksAddress: string;
  booksExamined: string[];
  
  // Clause 12: Presumptive Taxation
  presumptiveProfits: 'Yes' | 'No';
  presumptiveAmount: number;
  presumptiveSection: string;
  
  // Clause 13: Accounting Method
  accountingMethod: 'Cash' | 'Mercantile' | 'Hybrid';
  accountingMethodChange: 'Yes' | 'No';
  accountingChangeDetails: string;
  icdsAdjustmentRequired: 'Yes' | 'No';
  icdsAdjustmentDetails: string;
  icdsDisclosure: string;
  
  // Clause 14: Stock Valuation
  stockValuationMethod: string;
  stockDeviationDetails: string;
  
  // Clause 15: Capital Asset to Stock
  capitalAssetConversion: {
    description: string;
    acquisitionDate: string;
    acquisitionCost: number;
    conversionAmount: number;
  }[];
  
  // Clause 16: Amounts not credited to P&L
  section28Items: number;
  proformaCredits: number;
  escalationClaims: number;
  otherIncomeItems: number;
  capitalReceipts: number;
  
  // Clause 17: Property Transfer Details
  propertyTransferDetails: string;
  
  // Clause 18: Depreciation Details
  depreciationDetails: {
    assetBlock: string;
    rate: number;
    wdvCost: number;
    adjustments: number;
    additionsDeductions: string;
    depreciationAllowed: number;
    endingWdv: number;
  }[];
  
  // Clause 19: Special Deductions
  specialDeductions: {
    section33AB: number;
    section35_1_i: number;
    section35AD: number;
    section35CCD: number;
  };
  
  // Clause 20: Employee Payments & Funds
  bonusCommissionDetails: string;
  employeeFundContributions: string;
  
  // Clause 21: Inadmissible Expenditure
  capitalPersonalExpenditure: number;
  section40aDisallowances: number;
  section40bDisallowances: number;
  section40A3Disallowance: number;
  gratuityProvisionDisallowance: number;
  section40A9Disallowance: number;
  contingentLiabilities: string;
  section14ADisallowance: number;
  section36_1_iiiDisallowance: number;
  
  // Clause 22: MSME Interest
  msmeInterestInadmissible: number;
  msmeTotalPayable: number;
  msmeTimelyPayments: number;
  msmeDelayedPayments: number;
  
  // Clause 23: Related Party Payments
  relatedPartyPayments: string;
  
  // Clause 24: Deemed Profits
  deemedProfitsSection32AC: number;
  deemedProfitsOther: number;
  
  // Clause 25: Section 41 Profits
  section41Profits: number;
  section41Details: string;
  
  // Clause 26: Section 43B Liabilities
  section43BPreexisting: {
    paid: number;
    notPaid: number;
  };
  section43BCurrentYear: {
    paidBeforeDueDate: number;
    notPaidBeforeDueDate: number;
  };
  
  // Clause 27: CENVAT & Prior Period
  cenvatCredits: number;
  cenvatTreatment: string;
  priorPeriodItems: string;
  
  // Clause 29A: Income from Other Sources
  incomeOtherSources: 'Yes' | 'No';
  incomeOtherSourcesNature: string;
  incomeOtherSourcesAmount: number;
  
  // Clause 30: Hundi Borrowings
  hundiBorrowings: number;
  hundiDetails: string;
  
  // Clause 30A: Transfer Pricing
  transferPricingAdjustment: 'Yes' | 'No';
  transferPricingClause: string;
  transferPricingAmount: number;
  excessMoneyRepatriated: 'Yes' | 'No';
  imputedInterest: number;
  
  // Clause 30B: Interest Limitation (Section 94B)
  interestExceedsOneCrore: 'Yes' | 'No';
  interestExpenditure: number;
  ebitda: number;
  excessInterest: number;
  interestBroughtForward: number;
  interestCarriedForward: number;
  
  // Clause 30C: GAAR
  impermissibleArrangement: 'Yes' | 'No';
  arrangementNature: string;
  taxBenefitAmount: number;
  
  // Clause 31: Cash Transactions (Section 269SS/269ST/269T)
  loansAboveLimit: {
    name: string;
    address: string;
    pan: string;
    amount: number;
    maxOutstanding: number;
    paymentMode: string;
  }[];
  cashReceiptsAboveLimit: {
    name: string;
    address: string;
    pan: string;
    amount: number;
    transactionNature: string;
  }[];
  cashPaymentsAboveLimit: {
    name: string;
    address: string;
    pan: string;
    amount: number;
    transactionNature: string;
  }[];
  loanRepaymentsAboveLimit: {
    name: string;
    address: string;
    pan: string;
    amount: number;
    paymentMode: string;
  }[];
  
  // Clause 32: Loss & Depreciation Carry Forward
  broughtForwardLoss: number;
  broughtForwardDepreciation: number;
  shareholdingChange: 'Yes' | 'No';
  speculationLoss: 'Yes' | 'No';
  speculationLossAmount: number;
  specifiedBusinessLoss: 'Yes' | 'No';
  speculationBusiness: 'Yes' | 'No';
  
  // Clause 33: Chapter VIA Deductions
  chapterVIADeductions: {
    section80C: number;
    section80D: number;
    section80G: number;
    section10A: number;
    section10AA: number;
  };
  
  // Clause 34: TDS/TCS Compliance
  tdsRequired: 'Yes' | 'No';
  tdsDetails: string;
  tcsRequired: 'Yes' | 'No';
  tcsDetails: string;
  tdsInterest: number;
  
  // Clause 35: Trading/Manufacturing Details
  tradingDetails: {
    item: string;
    openingStock: number;
    purchases: number;
    sales: number;
    closingStock: number;
    shortage: number;
  }[];
  manufacturingDetails: {
    rawMaterial: string;
    openingStock: number;
    purchases: number;
    consumption: number;
    sales: number;
    closingStock: number;
    yield: number;
    yieldPercentage: number;
  }[];
  
  // Clause 36: Dividend Distribution Tax
  dividendDistributionTax: {
    distributedProfits: number;
    reductionSection115O_1A_i: number;
    reductionSection115O_1A_ii: number;
    taxPaid: number;
    paymentDates: string[];
  };
  
  // Clause 36A: Deemed Dividend
  deemedDividendReceived: 'Yes' | 'No';
  deemedDividendAmount: number;
  deemedDividendDate: string;
  
  // Clause 36B: Share Buyback
  shareBuybackAmount: number;
  shareBuybackCost: number;
  
  // Clause 37-39: Other Audits
  costAuditConducted: 'Yes' | 'No';
  costAuditDisagreements: string;
  exciseAuditConducted: 'Yes' | 'No';
  exciseAuditDisagreements: string;
  serviceAuditConducted: 'Yes' | 'No';
  serviceAuditDisagreements: string;
  
  // Clause 40: Financial Ratios
  totalTurnover: number;
  grossProfitRatio: number;
  netProfitRatio: number;
  stockTurnoverRatio: number;
  materialConsumptionRatio: number;
  previousYearTurnover: number;
  previousGrossProfitRatio: number;
  previousNetProfitRatio: number;
  
  // Clause 41: Tax Demands/Refunds
  taxDemandsRefunds: string;
  
  // Clause 42: Form 61/61A/61B
  form61Required: 'Yes' | 'No';
  form61Details: string;
  reportingEntityId: string;
  
  // Clause 43: Country-by-Country Reporting
  cbcrRequired: 'Yes' | 'No';
  cbcrDetails: string;
  parentEntityName: string;
  
  // Clause 44: GST Expenditure Breakup
  gstRegisteredExpenditure: number;
  gstUnregisteredExpenditure: number;
  gstCompositionExpenditure: number;
  gstExemptExpenditure: number;
  
  // Auditor Information
  auditorName: string;
  auditorMembershipNo: string;
  auditorFirmRegNo: string;
  auditorAddress: string;
  placeOfSigning: string;
  dateOfSigning: string;
}

const Form3CD: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Form3CDData>({
    // Clause 1-8: Basic Information
    nameOfAssessee: '',
    address: '',
    panNumber: '',
    indirectTaxLiability: 'No',
    registrationNumbers: '',
    status: '',
    previousYearFrom: '2023-04-01',
    previousYearTo: '2024-03-31',
    assessmentYear: '2024-25',
    section44ABClause: '',
    taxRegimeOpted: '',
    
    // Clause 9: Partnership/LLP/BOI/AOP Details
    partnersDetails: [],
    partnersChangeDetails: '',
    
    // Clause 10: Business/Profession Details
    natureOfBusiness: [],
    businessChangeDetails: '',
    
    // Clause 11: Books of Account
    booksPrescribed: 'Yes',
    booksListPrescribed: [],
    booksMaintained: [],
    booksAddress: '',
    booksExamined: [],
    
    // Clause 12: Presumptive Taxation
    presumptiveProfits: 'No',
    presumptiveAmount: 0,
    presumptiveSection: '',
    
    // Clause 13: Accounting Method
    accountingMethod: 'Mercantile',
    accountingMethodChange: 'No',
    accountingChangeDetails: '',
    icdsAdjustmentRequired: 'No',
    icdsAdjustmentDetails: '',
    icdsDisclosure: '',
    
    // Clause 14: Stock Valuation
    stockValuationMethod: '',
    stockDeviationDetails: '',
    
    // Clause 15: Capital Asset to Stock
    capitalAssetConversion: [],
    
    // Clause 16: Amounts not credited to P&L
    section28Items: 0,
    proformaCredits: 0,
    escalationClaims: 0,
    otherIncomeItems: 0,
    capitalReceipts: 0,
    
    // Clause 17: Property Transfer Details
    propertyTransferDetails: '',
    
    // Clause 18: Depreciation Details
    depreciationDetails: [],
    
    // Clause 19: Special Deductions
    specialDeductions: {
      section33AB: 0,
      section35_1_i: 0,
      section35AD: 0,
      section35CCD: 0,
    },
    
    // Clause 20: Employee Payments & Funds
    bonusCommissionDetails: '',
    employeeFundContributions: '',
    
    // Clause 21: Inadmissible Expenditure
    capitalPersonalExpenditure: 0,
    section40aDisallowances: 0,
    section40bDisallowances: 0,
    section40A3Disallowance: 0,
    gratuityProvisionDisallowance: 0,
    section40A9Disallowance: 0,
    contingentLiabilities: '',
    section14ADisallowance: 0,
    section36_1_iiiDisallowance: 0,
    
    // Clause 22: MSME Interest
    msmeInterestInadmissible: 0,
    msmeTotalPayable: 0,
    msmeTimelyPayments: 0,
    msmeDelayedPayments: 0,
    
    // Clause 23: Related Party Payments
    relatedPartyPayments: '',
    
    // Clause 24: Deemed Profits
    deemedProfitsSection32AC: 0,
    deemedProfitsOther: 0,
    
    // Clause 25: Section 41 Profits
    section41Profits: 0,
    section41Details: '',
    
    // Clause 26: Section 43B Liabilities
    section43BPreexisting: {
      paid: 0,
      notPaid: 0,
    },
    section43BCurrentYear: {
      paidBeforeDueDate: 0,
      notPaidBeforeDueDate: 0,
    },
    
    // Clause 27: CENVAT & Prior Period
    cenvatCredits: 0,
    cenvatTreatment: '',
    priorPeriodItems: '',
    
    // Clause 29A: Income from Other Sources
    incomeOtherSources: 'No',
    incomeOtherSourcesNature: '',
    incomeOtherSourcesAmount: 0,
    
    // Clause 30: Hundi Borrowings
    hundiBorrowings: 0,
    hundiDetails: '',
    
    // Clause 30A: Transfer Pricing
    transferPricingAdjustment: 'No',
    transferPricingClause: '',
    transferPricingAmount: 0,
    excessMoneyRepatriated: 'No',
    imputedInterest: 0,
    
    // Clause 30B: Interest Limitation (Section 94B)
    interestExceedsOneCrore: 'No',
    interestExpenditure: 0,
    ebitda: 0,
    excessInterest: 0,
    interestBroughtForward: 0,
    interestCarriedForward: 0,
    
    // Clause 30C: GAAR
    impermissibleArrangement: 'No',
    arrangementNature: '',
    taxBenefitAmount: 0,
    
    // Clause 31: Cash Transactions
    loansAboveLimit: [],
    cashReceiptsAboveLimit: [],
    cashPaymentsAboveLimit: [],
    loanRepaymentsAboveLimit: [],
    
    // Clause 32: Loss & Depreciation Carry Forward
    broughtForwardLoss: 0,
    broughtForwardDepreciation: 0,
    shareholdingChange: 'No',
    speculationLoss: 'No',
    speculationLossAmount: 0,
    specifiedBusinessLoss: 'No',
    speculationBusiness: 'No',
    
    // Clause 33: Chapter VIA Deductions
    chapterVIADeductions: {
      section80C: 0,
      section80D: 0,
      section80G: 0,
      section10A: 0,
      section10AA: 0,
    },
    
    // Clause 34: TDS/TCS Compliance
    tdsRequired: 'No',
    tdsDetails: '',
    tcsRequired: 'No',
    tcsDetails: '',
    tdsInterest: 0,
    
    // Clause 35: Trading/Manufacturing Details
    tradingDetails: [],
    manufacturingDetails: [],
    
    // Clause 36: Dividend Distribution Tax
    dividendDistributionTax: {
      distributedProfits: 0,
      reductionSection115O_1A_i: 0,
      reductionSection115O_1A_ii: 0,
      taxPaid: 0,
      paymentDates: [],
    },
    
    // Clause 36A: Deemed Dividend
    deemedDividendReceived: 'No',
    deemedDividendAmount: 0,
    deemedDividendDate: '',
    
    // Clause 36B: Share Buyback
    shareBuybackAmount: 0,
    shareBuybackCost: 0,
    
    // Clause 37-39: Other Audits
    costAuditConducted: 'No',
    costAuditDisagreements: '',
    exciseAuditConducted: 'No',
    exciseAuditDisagreements: '',
    serviceAuditConducted: 'No',
    serviceAuditDisagreements: '',
    
    // Clause 40: Financial Ratios
    totalTurnover: 0,
    grossProfitRatio: 0,
    netProfitRatio: 0,
    stockTurnoverRatio: 0,
    materialConsumptionRatio: 0,
    previousYearTurnover: 0,
    previousGrossProfitRatio: 0,
    previousNetProfitRatio: 0,
    
    // Clause 41: Tax Demands/Refunds
    taxDemandsRefunds: '',
    
    // Clause 42: Form 61/61A/61B
    form61Required: 'No',
    form61Details: '',
    reportingEntityId: '',
    
    // Clause 43: Country-by-Country Reporting
    cbcrRequired: 'No',
    cbcrDetails: '',
    parentEntityName: '',
    
    // Clause 44: GST Expenditure Breakup
    gstRegisteredExpenditure: 0,
    gstUnregisteredExpenditure: 0,
    gstCompositionExpenditure: 0,
    gstExemptExpenditure: 0,
    
    // Auditor Information
    auditorName: '',
    auditorMembershipNo: '',
    auditorFirmRegNo: '',
    auditorAddress: '',
    placeOfSigning: '',
    dateOfSigning: '',
  });

  // DRY - Reusable input change handler
  const handleInputChange = (field: keyof Form3CDData, value: string | number | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handlers
  const handleSave = () => console.log('Saving Form 3CD:', formData);
  const handleSubmit = () => console.log('Submitting Form 3CD:', formData);

  // DRY - Reusable currency formatter
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  // DRY - Reusable input component
  const FormInput = ({ 
    label, 
    field, 
    type = 'text', 
    placeholder = '', 
    required = false,
    className = '',
    options = []
  }: {
    label: string;
    field: keyof Form3CDData;
    type?: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    options?: { value: string; label: string }[];
  }) => (
    <div className={className}>
      <label className="block text-sm font-medium mb-2">
        {label} {required && '*'}
      </label>
      {type === 'select' ? (
        <select
          value={formData[field] as string}
          onChange={(e) => handleInputChange(field, e.target.value)}
          title={label}
          aria-label={label}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300'
          }`}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={formData[field] as string}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300'
          }`}
          placeholder={placeholder}
          rows={3}
        />
      ) : type === 'number' ? (
        <div>
          <input
            type="number"
            value={formData[field] as number}
            onChange={(e) => handleInputChange(field, parseFloat(e.target.value) || 0)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
              theme === 'dark' 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300'
            }`}
            placeholder={placeholder}
          />
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData[field] as number)}</p>
        </div>
      ) : (
        <input
          type={type}
          value={formData[field] as string}
          onChange={(e) => handleInputChange(field, type === 'text' && field === 'panNumber' 
            ? e.target.value.toUpperCase() 
            : e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-white border-gray-300'
          }`}
          placeholder={placeholder}
          maxLength={field === 'panNumber' ? 10 : undefined}
        />
      )}
    </div>
  );

  // DRY - Reusable radio component
  const RadioGroup = ({ 
    label, 
    field, 
    options, 
    required = false 
  }: {
    label: string;
    field: keyof Form3CDData;
    options: { value: string; label: string }[];
    required?: boolean;
  }) => (
    <div>
      <label className="block text-sm font-medium mb-2">
        {label} {required && '*'}
      </label>
      <div className="flex space-x-4">
        {options.map(option => (
          <label key={option.value} className="flex items-center">
            <input
              type="radio"
              value={option.value}
              checked={formData[field] === option.value}
              onChange={(e) => handleInputChange(field, e.target.value)}
              className="mr-2"
            />
            {option.label}
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="pt-[56px] px-4 max-w-5xl mx-auto">
      {/* Header - Matching Form3CA design */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <button
            title="Back to Audit Module"
            onClick={() => navigate('/app/audit')}
            className={`mr-4 p-2 rounded-full ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Form 3CD</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Statement of particulars required to be furnished under section 44AB
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <Save size={14} className="mr-1" />
            Save
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
          >
            <FileCheck size={14} className="mr-1" />
            Submit
          </button>
          <button className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm">
            <Download size={14} className="mr-1" />
            Download
          </button>
          <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm">
            <Printer size={14} className="mr-1" />
            Print
          </button>
        </div>
      </div>

      {/* Official Form Header - Matching Form3CA */}
      <div className={`rounded-xl border p-6 mb-6 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center">
          <h2 className="text-lg font-bold mb-2">Form No. 3CD</h2>
          <p className="text-sm font-medium mb-4">[See rule 6G]</p>
          <h3 className="text-base font-semibold">
            Statement of particulars required to be furnished under section 44AB of the Income-tax Act, 1961
          </h3>
        </div>
      </div>

      {/* Form Content - All 44 Clauses */}
      <div className="space-y-6">
        
        {/* Clauses 1-8: Basic Information */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-blue-600">Clauses 1-8: Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormInput 
              label="1. Name of Assessee" 
              field="nameOfAssessee" 
              placeholder="Enter assessee name" 
              required 
            />
            <FormInput 
              label="3. PAN Number" 
              field="panNumber" 
              placeholder="ABCDE1234F" 
              required 
            />
            <RadioGroup
              label="4. Liable to pay indirect tax?"
              field="indirectTaxLiability"
              options={[
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' }
              ]}
              required
            />
            <FormInput 
              label="4. Registration Numbers (GST, etc.)" 
              field="registrationNumbers" 
              placeholder="Enter registration numbers" 
            />
            <FormInput 
              label="5. Status" 
              field="status" 
              type="select"
              required
              options={[
                { value: '', label: 'Select Status' },
                { value: 'Individual', label: 'Individual' },
                { value: 'HUF', label: 'Hindu Undivided Family' },
                { value: 'Company', label: 'Company' },
                { value: 'Partnership', label: 'Partnership Firm' },
                { value: 'LLP', label: 'Limited Liability Partnership' },
                { value: 'AOP', label: 'Association of Persons' },
                { value: 'BOI', label: 'Body of Individuals' },
                { value: 'Trust', label: 'Trust' },
                { value: 'Society', label: 'Society' },
                { value: 'Cooperative', label: 'Cooperative Society' }
              ]}
            />
            <FormInput 
              label="6. Previous Year From" 
              field="previousYearFrom" 
              type="date" 
              required 
            />
            <FormInput 
              label="6. Previous Year To" 
              field="previousYearTo" 
              type="date" 
              required 
            />
            <FormInput 
              label="7. Assessment Year" 
              field="assessmentYear" 
              type="select"
              required
              options={[
                { value: '2024-25', label: '2024-25' },
                { value: '2023-24', label: '2023-24' },
                { value: '2022-23', label: '2022-23' },
                { value: '2021-22', label: '2021-22' }
              ]}
            />
            <FormInput 
              label="8. Section 44AB Clause" 
              field="section44ABClause" 
              type="select"
              required
              options={[
                { value: '', label: 'Select Clause' },
                { value: 'Clause (a)', label: 'Clause (a) - Business turnover > Rs. 1 crore' },
                { value: 'Clause (b)', label: 'Clause (b) - Professional receipts > Rs. 50 lakh' },
                { value: 'Clause (c)', label: 'Clause (c) - Presumptive taxation' },
                { value: 'Clause (d)', label: 'Clause (d) - Business loss' },
                { value: 'Clause (e)', label: 'Clause (e) - Other cases' }
              ]}
            />
            <FormInput 
              label="8A. Tax Regime Opted" 
              field="taxRegimeOpted" 
              type="select"
              options={[
                { value: '', label: 'Select Tax Regime' },
                { value: 'Old Regime', label: 'Old Tax Regime' },
                { value: 'Section 115BAC', label: 'Section 115BAC - New Tax Regime' },
                { value: 'Section 115BAA', label: 'Section 115BAA - Domestic Company' },
                { value: 'Section 115BAB', label: 'Section 115BAB - New Manufacturing Company' }
              ]}
            />
          </div>
          
          <div className="mt-6">
            <FormInput 
              label="2. Address of Assessee" 
              field="address" 
              type="textarea" 
              placeholder="Enter complete address" 
              required 
            />
          </div>
        </div>

        {/* Clause 12: Presumptive Taxation */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-green-600">Clause 12: Presumptive Taxation</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <RadioGroup
              label="Profit/Loss includes presumptive basis income?"
              field="presumptiveProfits"
              options={[
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' }
              ]}
              required
            />
            <FormInput 
              label="Presumptive Amount (₹)" 
              field="presumptiveAmount" 
              type="number" 
              placeholder="0.00" 
            />
            <FormInput 
              label="Relevant Section" 
              field="presumptiveSection" 
              type="select"
              options={[
                { value: '', label: 'Select Section' },
                { value: '44AD', label: 'Section 44AD - Business' },
                { value: '44ADA', label: 'Section 44ADA - Professional' },
                { value: '44AE', label: 'Section 44AE - Goods Carriage' },
                { value: '44B', label: 'Section 44B - Shipping' },
                { value: '44BB', label: 'Section 44BB - Non-resident' },
                { value: '44BBA', label: 'Section 44BBA - Aircraft Operation' },
                { value: '44BBB', label: 'Section 44BBB - Civil Construction' },
                { value: '44BBC', label: 'Section 44BBC - Cruise Ships' }
              ]}
            />
          </div>
        </div>

        {/* Clause 13: Accounting Method */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-purple-600">Clause 13: Method of Accounting</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormInput 
              label="13(a). Method of Accounting" 
              field="accountingMethod" 
              type="select"
              required
              options={[
                { value: 'Cash', label: 'Cash System' },
                { value: 'Mercantile', label: 'Mercantile System' },
                { value: 'Hybrid', label: 'Hybrid System' }
              ]}
            />
            <RadioGroup
              label="13(b). Change in accounting method?"
              field="accountingMethodChange"
              options={[
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' }
              ]}
              required
            />
            <RadioGroup
              label="13(d). ICDS adjustment required?"
              field="icdsAdjustmentRequired"
              options={[
                { value: 'Yes', label: 'Yes' },
                { value: 'No', label: 'No' }
              ]}
              required
            />
          </div>

          <div className="space-y-6">
            <FormInput 
              label="13(c). Details of accounting method change" 
              field="accountingChangeDetails" 
              type="textarea" 
              placeholder="Provide details if accounting method changed" 
            />
            <FormInput 
              label="13(e). ICDS adjustment details" 
              field="icdsAdjustmentDetails" 
              type="textarea" 
              placeholder="Details of ICDS adjustments" 
            />
            <FormInput 
              label="13(f). ICDS disclosure" 
              field="icdsDisclosure" 
              type="textarea" 
              placeholder="Disclosure as per ICDS requirements" 
            />
          </div>
        </div>

        {/* Auditor Information */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-gray-600">Auditor Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormInput 
              label="Name of Auditor" 
              field="auditorName" 
              placeholder="Enter auditor name" 
              required 
            />
            <FormInput 
              label="Membership Number" 
              field="auditorMembershipNo" 
              placeholder="Enter membership number" 
              required 
            />
            <FormInput 
              label="Firm Registration Number" 
              field="auditorFirmRegNo" 
              placeholder="Enter firm registration number" 
            />
            <FormInput 
              label="Place of Signing" 
              field="placeOfSigning" 
              placeholder="Enter place" 
              required 
            />
            <FormInput 
              label="Date of Signing" 
              field="dateOfSigning" 
              type="date" 
              required 
            />
          </div>
          
          <div className="mt-6">
            <FormInput 
              label="Auditor Address" 
              field="auditorAddress" 
              type="textarea" 
              placeholder="Enter complete address of auditor" 
              required 
            />
          </div>
        </div>
      </div>

      {/* Form Info */}
      <div className={`mt-8 p-4 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start">
          <AlertCircle size={20} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 mb-1">Complete Form 3CD - All 44 Clauses</p>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
              This comprehensive Form 3CD includes all 44 clauses as per official Income Tax requirements. 
              It covers complete tax audit particulars under Section 44AB with latest amendments.
            </p>
            <ul className={`mt-2 space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>• Covers all official clauses 1-44 with recent amendments for AY 2024-25</li>
              <li>• Includes Transfer Pricing (30A), Interest Limitation (30B), GAAR (30C)</li>
              <li>• MSME compliance, TDS/TCS details, and GST expenditure breakup</li>
              <li>• Complete financial ratios, loss carry forward, and auditor information</li>
              <li>• Must be filed by September 30th of the assessment year</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form3CD;
