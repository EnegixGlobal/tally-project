import React, { useState, useCallback, useMemo } from 'react';
import { FileText, Upload, ArrowLeft, Save, Printer, Plus, Trash2, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Types - All mandatory as per Form 26Q
interface DeductorDetails {
  tan: string;
  assessmentYear: string;
  panOfDeductor: string;
  category: 'Company' | 'Individual/HUF' | 'Firm' | 'AOP/BOI' | 'Local Authority' | 'Artificial Juridical Person' | 'Govt' | 'Others';
  deductorName: string;
  branchSrlNo?: string;
  address: {
    flatNo: string;
    premisesName: string;
    roadStreet: string;
    area: string;
    town: string;
    state: string;
    country: string;
    pinCode: string;
  };
  stdCodeNo: string;
  telephoneNo: string;
  email: string;
  responsiblePerson: {
    status: 'Deductor' | 'Representative Assessee' | 'Others';
    designation: string;
    name: string;
    fatherName: string;
    pan: string;
  };
}

interface ChallanDetails {
  serialNo: number;
  bsrCode: string;
  dateOfDeposit: string;
  challanSerialNo: string;
  tax: number;
  surcharge: number;
  educationCess: number;
  other: number;
  interest: number;
  penalty: number;
  fee: number;
  total: number;
  transferVoucherNo?: string;
  status: 'Deposited' | 'Book Adjustment';
}

interface DeducteeDetails {
  serialNo: number;
  panOfDeductee: string;
  nameOfDeductee: string;
  amountPaid: number;
  amountOfTax: number;
  taxDeposited: number;
  dateOfPayment: string;
  natureOfPayment: string;
  sectionUnderDeducted: string;
  rateOfDeduction: number;
  certSerialNo?: string;
  dateOfTDSCertificate?: string;
  amountPaidCredited: number;
  gstIdentificationNo?: string;
  remarkCode?: string;
}

interface AnnexureDetails {
  panOfDeductee: string;
  nameOfDedductee: string;
  detailsOfPANApplication: string;
  acknowledgeNo: string;
  gstIdentificationNo?: string;
}

interface TaxDeductionDetails {
  totalAmountPaidCredited: number;
  totalTaxDeducted: number;
  totalTaxDeposited: number;
  aggregateAmountPaid: number;
  aggregateTaxDeducted: number;
  aggregateTaxDeposited: number;
}

interface Verification {
  capacity: 'Deductor' | 'Authorized Representative';
  declarationPlace: string;
  declarationDate: string;
  fullName: string;
  designation: string;
  signature: string;
}

interface QuarterlyReturn {
  id: string;
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  assessmentYear: string;
  status: 'draft' | 'filed' | 'revised' | 'belated' | 'rectification';
  filingDate?: string;
  acknowledgmentNo?: string;
  receiptNo?: string;
  deductorDetails: DeductorDetails;
  challanDetails: ChallanDetails[];
  deducteeDetails: DeducteeDetails[];
  annexureDetails: AnnexureDetails[];
  taxDeductionDetails: TaxDeductionDetails;
  verification: Verification;
  summary: {
    totalDeductees: number;
    totalChallan: number;
    totalAmountPaid: number;
    totalTaxDeducted: number;
    totalTaxDeposited: number;
  };
}

// Reusable Components with DRY principle
const FormSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">{title}</h3>
    {children}
  </div>
);

const FormField: React.FC<{
  label: string;
  name: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  className?: string;
}> = ({ label, name, type = 'text', value, onChange, required = false, options, placeholder, error, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <label className="block text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {options ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        title={label}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    ) : type === 'textarea' ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={3}
      />
    ) : (
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
    )}
    {error && <p className="text-red-500 text-xs">{error}</p>}
  </div>
);

const ActionButton: React.FC<{
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}> = ({ onClick, icon: Icon, label, variant = 'primary', size = 'md', disabled = false }) => {
  const baseClasses = "inline-flex items-center gap-2 font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300",
    danger: "bg-red-600 hover:bg-red-700 text-white"
  };
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
    >
      <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />
      {label}
    </button>
  );
};

const Form26Q: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'upload'>('list');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form data state
  const [deductorDetails, setDeductorDetails] = useState<DeductorDetails>({
    tan: '',
    assessmentYear: '2024-25',
    panOfDeductor: '',
    category: 'Company',
    deductorName: '',
    branchSrlNo: '',
    address: {
      flatNo: '',
      premisesName: '',
      roadStreet: '',
      area: '',
      town: '',
      state: '',
      country: 'India',
      pinCode: ''
    },
    stdCodeNo: '',
    telephoneNo: '',
    email: '',
    responsiblePerson: {
      status: 'Deductor',
      designation: '',
      name: '',
      fatherName: '',
      pan: ''
    }
  });

  const [challanDetails, setChallanDetails] = useState<ChallanDetails[]>([{
    serialNo: 1,
    bsrCode: '',
    dateOfDeposit: '',
    challanSerialNo: '',
    tax: 0,
    surcharge: 0,
    educationCess: 0,
    other: 0,
    interest: 0,
    penalty: 0,
    fee: 0,
    total: 0,
    transferVoucherNo: '',
    status: 'Deposited'
  }]);

  const [deducteeDetails, setDeducteeDetails] = useState<DeducteeDetails[]>([{
    serialNo: 1,
    panOfDeductee: '',
    nameOfDeductee: '',
    amountPaid: 0,
    amountOfTax: 0,
    taxDeposited: 0,
    dateOfPayment: '',
    natureOfPayment: '',
    sectionUnderDeducted: '194C',
    rateOfDeduction: 0,
    certSerialNo: '',
    dateOfTDSCertificate: '',
    amountPaidCredited: 0,
    gstIdentificationNo: '',
    remarkCode: ''
  }]);

  const [annexureDetails] = useState<AnnexureDetails[]>([]);

  const [verification, setVerification] = useState<Verification>({
    capacity: 'Deductor',
    declarationPlace: '',
    declarationDate: new Date().toISOString().split('T')[0],
    fullName: '',
    designation: '',
    signature: ''
  });

  // Mock data for filed returns
  const [quarterlyReturns] = useState<QuarterlyReturn[]>([
    {
      id: '1',
      quarter: 'Q4',
      assessmentYear: '2024-25',
      status: 'filed',
      filingDate: '2024-01-15',
      acknowledgmentNo: 'ACK123456789',
      receiptNo: 'RCP987654321',
      deductorDetails,
      challanDetails,
      deducteeDetails,
      annexureDetails,
      taxDeductionDetails: {
        totalAmountPaidCredited: 1500000,
        totalTaxDeducted: 150000,
        totalTaxDeposited: 150000,
        aggregateAmountPaid: 1500000,
        aggregateTaxDeducted: 150000,
        aggregateTaxDeposited: 150000
      },
      verification,
      summary: {
        totalDeductees: 85,
        totalChallan: 3,
        totalAmountPaid: 1500000,
        totalTaxDeducted: 150000,
        totalTaxDeposited: 150000
      }
    }
  ]);

  // Constants for form options
  const assessmentYears = [
    { value: '2024-25', label: 'AY 2024-25' },
    { value: '2023-24', label: 'AY 2023-24' },
    { value: '2022-23', label: 'AY 2022-23' }
  ];

  const quarters = [
    { value: 'Q1', label: 'Q1 (Apr-Jun)' },
    { value: 'Q2', label: 'Q2 (Jul-Sep)' },
    { value: 'Q3', label: 'Q3 (Oct-Dec)' },
    { value: 'Q4', label: 'Q4 (Jan-Mar)' }
  ];

  const deductorCategories = [
    { value: 'Company', label: 'Company' },
    { value: 'Individual/HUF', label: 'Individual/HUF' },
    { value: 'Firm', label: 'Firm' },
    { value: 'AOP/BOI', label: 'AOP/BOI' },
    { value: 'Local Authority', label: 'Local Authority' },
    { value: 'Artificial Juridical Person', label: 'Artificial Juridical Person' },
    { value: 'Govt', label: 'Government' },
    { value: 'Others', label: 'Others' }
  ];

  const sectionCodes = [
    { value: '192', label: '192 - Salary' },
    { value: '193', label: '193 - Interest on Securities' },
    { value: '194', label: '194 - Dividend' },
    { value: '194A', label: '194A - Interest other than on Securities' },
    { value: '194B', label: '194B - Winnings from Lottery/Crossword Puzzle' },
    { value: '194BB', label: '194BB - Winnings from Horse Race' },
    { value: '194C', label: '194C - Payment to Contractors/Sub-contractors' },
    { value: '194D', label: '194D - Insurance Commission' },
    { value: '194E', label: '194E - Payment to Non-resident Sportsmen' },
    { value: '194EE', label: '194EE - Payment in respect of deposits under NSS' },
    { value: '194F', label: '194F - Payment on account of repurchase of units' },
    { value: '194G', label: '194G - Commission paid by Mutual Fund' },
    { value: '194H', label: '194H - Commission/Brokerage' },
    { value: '194I', label: '194I - Rent' },
    { value: '194J', label: '194J - Fees for Professional/Technical Services' },
    { value: '194K', label: '194K - Payment of units' },
    { value: '194LA', label: '194LA - Payment of compensation on acquisition of property' },
    { value: '194LB', label: '194LB - Interest on infrastructure debt fund' },
    { value: '194LC', label: '194LC - Interest on rupee denominated bond of an Indian company' },
    { value: '194M', label: '194M - Payment of certain sums by individuals/HUF' },
    { value: '194N', label: '194N - Cash withdrawal exceeding prescribed limit' },
    { value: '194O', label: '194O - Payment for sale of goods/services by e-commerce operator' },
    { value: '195', label: '195 - Other sums' },
    { value: '196A', label: '196A - Income of Foreign Companies' },
    { value: '196B', label: '196B - Income from units' },
    { value: '196C', label: '196C - Income from foreign currency bonds' },
    { value: '196D', label: '196D - Income in respect of FII' }
  ];

  const states = [
    { value: 'AN', label: 'Andaman and Nicobar Islands' },
    { value: 'AP', label: 'Andhra Pradesh' },
    { value: 'AR', label: 'Arunachal Pradesh' },
    { value: 'AS', label: 'Assam' },
    { value: 'BR', label: 'Bihar' },
    { value: 'CG', label: 'Chhattisgarh' },
    { value: 'CH', label: 'Chandigarh' },
    { value: 'DN', label: 'Dadra and Nagar Haveli' },
    { value: 'DD', label: 'Daman and Diu' },
    { value: 'DL', label: 'Delhi' },
    { value: 'GA', label: 'Goa' },
    { value: 'GJ', label: 'Gujarat' },
    { value: 'HR', label: 'Haryana' },
    { value: 'HP', label: 'Himachal Pradesh' },
    { value: 'JK', label: 'Jammu and Kashmir' },
    { value: 'JH', label: 'Jharkhand' },
    { value: 'KA', label: 'Karnataka' },
    { value: 'KL', label: 'Kerala' },
    { value: 'LD', label: 'Lakshadweep' },
    { value: 'MP', label: 'Madhya Pradesh' },
    { value: 'MH', label: 'Maharashtra' },
    { value: 'MN', label: 'Manipur' },
    { value: 'ML', label: 'Meghalaya' },
    { value: 'MZ', label: 'Mizoram' },
    { value: 'NL', label: 'Nagaland' },
    { value: 'OR', label: 'Odisha' },
    { value: 'PY', label: 'Puducherry' },
    { value: 'PB', label: 'Punjab' },
    { value: 'RJ', label: 'Rajasthan' },
    { value: 'SK', label: 'Sikkim' },
    { value: 'TN', label: 'Tamil Nadu' },
    { value: 'TS', label: 'Telangana' },
    { value: 'TR', label: 'Tripura' },
    { value: 'UP', label: 'Uttar Pradesh' },
    { value: 'UK', label: 'Uttarakhand' },
    { value: 'WB', label: 'West Bengal' }
  ];
// Add selectedYear state before useEffect
const [selectedYear] = useState('2024-25');

React.useEffect(() => {
  const fetchReturns = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/tds26q?year=${selectedYear}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setReturnsList(data);
    } catch (error) {
      console.error("Fetch returns error:", error);
      setReturnsList([]);
    } finally {
      setLoading(false);
    }
  };
  fetchReturns();
}, [selectedYear]);
  // Handler functions
  const handleDeductorChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setDeductorDetails(prev => ({
        ...prev,
        [parent]: {
          ...((prev[parent as keyof DeductorDetails] as Record<string, string>)),
          [child]: value
        }
      }));
    } else {
      setDeductorDetails(prev => ({ ...prev, [name]: value }));
    }
    setErrors(prev => ({ ...prev, [name]: '' }));
  }, []);

  const addChallan = useCallback(() => {
    setChallanDetails(prev => [...prev, {
      serialNo: prev.length + 1,
      bsrCode: '',
      dateOfDeposit: '',
      challanSerialNo: '',
      tax: 0,
      surcharge: 0,
      educationCess: 0,
      other: 0,
      interest: 0,
      penalty: 0,
      fee: 0,
      total: 0,
      transferVoucherNo: '',
      status: 'Deposited'
    }]);
  }, []);

  const removeChallan = useCallback((index: number) => {
    setChallanDetails(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleChallanChange = useCallback((index: number, field: keyof ChallanDetails, value: string | number) => {
    setChallanDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Auto-calculate total
      if (['tax', 'surcharge', 'educationCess', 'other', 'interest', 'penalty', 'fee'].includes(field)) {
        updated[index].total = updated[index].tax + updated[index].surcharge + updated[index].educationCess + 
                              updated[index].other + updated[index].interest + updated[index].penalty + updated[index].fee;
      }
      
      return updated;
    });
  }, []);

  const addDeductee = useCallback(() => {
    setDeducteeDetails(prev => [...prev, {
      serialNo: prev.length + 1,
      panOfDeductee: '',
      nameOfDeductee: '',
      amountPaid: 0,
      amountOfTax: 0,
      taxDeposited: 0,
      dateOfPayment: '',
      natureOfPayment: '',
      sectionUnderDeducted: '194C',
      rateOfDeduction: 0,
      certSerialNo: '',
      dateOfTDSCertificate: '',
      amountPaidCredited: 0,
      gstIdentificationNo: '',
      remarkCode: ''
    }]);
  }, []);

  const removeDeductee = useCallback((index: number) => {
    setDeducteeDetails(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleDeducteeChange = useCallback((index: number, field: keyof DeducteeDetails, value: string | number) => {
    setDeducteeDetails(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    // Validate deductor details
    if (!deductorDetails.tan) newErrors.tan = 'TAN is required';
    if (!deductorDetails.panOfDeductor) newErrors.panOfDeductor = 'PAN is required';
    if (!deductorDetails.deductorName) newErrors.deductorName = 'Deductor name is required';
    if (!deductorDetails.email) newErrors.email = 'Email is required';
    if (!deductorDetails.address.pinCode) newErrors.pinCode = 'PIN code is required';
    
    // Validate challan details
    challanDetails.forEach((challan, index) => {
      if (!challan.bsrCode) newErrors[`challan_${index}_bsrCode`] = 'BSR code is required';
      if (!challan.dateOfDeposit) newErrors[`challan_${index}_dateOfDeposit`] = 'Date of deposit is required';
      if (!challan.challanSerialNo) newErrors[`challan_${index}_challanSerialNo`] = 'Challan serial number is required';
    });
    
    // Validate deductee details
    deducteeDetails.forEach((deductee, index) => {
      if (!deductee.panOfDeductee) newErrors[`deductee_${index}_panOfDeductee`] = 'PAN is required';
      if (!deductee.nameOfDeductee) newErrors[`deductee_${index}_nameOfDeductee`] = 'Name is required';
      if (!deductee.dateOfPayment) newErrors[`deductee_${index}_dateOfPayment`] = 'Date of payment is required';
    });
    
    // Validate verification
    if (!verification.fullName) newErrors.verificationName = 'Full name is required';
    if (!verification.declarationPlace) newErrors.declarationPlace = 'Declaration place is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [deductorDetails, challanDetails, deducteeDetails, verification]);

  const handleSaveForm = useCallback(async () => {
    
  const payload = {
    deductorDetails,
    challanDetails,
    deducteeDetails,
    verification,
    assessmentYear: deductorDetails.assessmentYear,
  };

  try {
    const res = await fetch("http://localhost:5000/api/tds26q", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (res.ok && data.success) {
      alert("Form 26Q saved successfully.");
      // Optionally reset form or redirect
    } else {
      alert("Failed to save: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Error submitting Form 26Q:", err);
    alert("Error submitting form.");
  }

  }, [validateForm]);

  const generatePreviewHTML = useCallback(() => {
    return `
      <html>
        <head><title>Form 26Q Preview</title></head>
        <body>
          <h1>FORM NO. 26Q</h1>
          <h2>QUARTERLY STATEMENT OF TAX DEDUCTED AT SOURCE ON PAYMENT OTHER THAN SALARY</h2>
          <!-- Add complete form structure here -->
        </body>
      </html>
    `;
  }, []);

  const handlePreview = useCallback(() => {
    if (validateForm()) {
      // Open preview in new window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        // Generate preview HTML content
        printWindow.document.write(generatePreviewHTML());
        printWindow.document.close();
      }
    }
  }, [validateForm, generatePreviewHTML]);

  const totalSummary = useMemo(() => ({
    totalDeductees: deducteeDetails.length,
    totalAmountPaid: deducteeDetails.reduce((sum, d) => sum + (d.amountPaid || 0), 0),
    totalTaxDeducted: deducteeDetails.reduce((sum, d) => sum + (d.amountOfTax || 0), 0),
    totalTaxDeposited: challanDetails.reduce((sum, c) => sum + (c.total || 0), 0)
  }), [deducteeDetails, challanDetails]);

  return (
    <div className="min-h-screen pt-14 px-4 ">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/app/tds')}
              className="mr-4 p-2"
              title="Back to TDS"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Form 26Q</h1>
              <p className="text-gray-600">TDS Quarterly Return (Non-Salary)</p>
            </div>
          </div>
          {activeTab === 'create' && (
            <div className="flex gap-2">
              <ActionButton onClick={handleSaveForm} icon={Save} label="Save" />
              <ActionButton onClick={handlePreview} icon={Eye} label="Preview" variant="secondary" />
              <ActionButton onClick={() => {}} icon={Printer} label="Print" variant="secondary" />
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'list', label: 'Filed Returns', icon: FileText },
                { id: 'create', label: 'Create Return', icon: Plus },
                { id: 'upload', label: 'Upload Return', icon: Upload }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'list' | 'create' | 'upload')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Filed Returns Tab */}
            {activeTab === 'list' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-900">Form 26Q Returns</h3>
                  </div>
                  <p className="text-blue-700 text-sm">
                    Quarterly statement of tax deducted at source on payments other than salary under sections 193 to 196D.
                  </p>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Total Returns', value: quarterlyReturns.length, color: 'blue' },
                    { label: 'Filed', value: quarterlyReturns.filter(r => r.status === 'filed').length, color: 'green' },
                    { label: 'Draft', value: quarterlyReturns.filter(r => r.status === 'draft').length, color: 'yellow' },
                    { label: 'Revised', value: quarterlyReturns.filter(r => r.status === 'revised').length, color: 'orange' }
                  ].map(stat => (
                    <div key={stat.label} className={`bg-${stat.color}-50 border border-${stat.color}-200 rounded-lg p-4`}>
                      <div className={`text-2xl font-bold text-${stat.color}-700`}>{stat.value}</div>
                      <div className={`text-sm text-${stat.color}-600`}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Returns Table */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          {['Quarter', 'Assessment Year', 'Status', 'Filing Date', 'Deductees', 'Total TDS', 'Actions'].map(header => (
                            <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {quarterlyReturns.map(return_ => (
                          <tr key={return_.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {return_.quarter}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {return_.assessmentYear}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                return_.status === 'filed' ? 'bg-green-100 text-green-800' :
                                return_.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {return_.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {return_.filingDate || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {return_.summary.totalDeductees}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              ₹{return_.summary.totalTaxDeducted.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <div className="flex gap-2">
                                <button className="text-blue-600 hover:text-blue-800">View</button>
                                <button className="text-green-600 hover:text-green-800">Download</button>
                                {return_.status === 'draft' && (
                                  <button className="text-orange-600 hover:text-orange-800">Edit</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Create Return Tab */}
            {activeTab === 'create' && (
              <div className="space-y-8">
                {/* Summary */}
                <FormSection title="Return Summary">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{totalSummary.totalDeductees}</div>
                      <div className="text-sm text-blue-600">Total Deductees</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">₹{totalSummary.totalAmountPaid.toLocaleString()}</div>
                      <div className="text-sm text-green-600">Amount Paid</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">₹{totalSummary.totalTaxDeducted.toLocaleString()}</div>
                      <div className="text-sm text-orange-600">Tax Deducted</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">₹{totalSummary.totalTaxDeposited.toLocaleString()}</div>
                      <div className="text-sm text-purple-600">Tax Deposited</div>
                    </div>
                  </div>
                </FormSection>

                {/* Deductor Details */}
                <FormSection title="Part A - Details of the Deductor">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      label="TAN of the Deductor"
                      name="tan"
                      value={deductorDetails.tan}
                      onChange={handleDeductorChange}
                      required
                      placeholder="ABCD12345E"
                      error={errors.tan}
                    />
                    <FormField
                      label="Assessment Year"
                      name="assessmentYear"
                      value={deductorDetails.assessmentYear}
                      onChange={handleDeductorChange}
                      options={assessmentYears}
                      required
                    />
                    <FormField
                      label="PAN of the Deductor"
                      name="panOfDeductor"
                      value={deductorDetails.panOfDeductor}
                      onChange={handleDeductorChange}
                      required
                      placeholder="ABCDE1234F"
                      error={errors.panOfDeductor}
                    />
                    <FormField
                      label="Category of Deductor"
                      name="category"
                      value={deductorDetails.category}
                      onChange={handleDeductorChange}
                      options={deductorCategories}
                      required
                    />
                    <FormField
                      label="Name of the Deductor"
                      name="deductorName"
                      value={deductorDetails.deductorName}
                      onChange={handleDeductorChange}
                      required
                      error={errors.deductorName}
                      className="md:col-span-2"
                    />
                    <FormField
                      label="Branch Serial Number"
                      name="branchSrlNo"
                      value={deductorDetails.branchSrlNo || ''}
                      onChange={handleDeductorChange}
                      placeholder="Optional"
                    />
                  </div>

                  {/* Address Details */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-4">Address of the Deductor</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Flat/Door/Block No."
                        name="address.flatNo"
                        value={deductorDetails.address.flatNo}
                        onChange={handleDeductorChange}
                      />
                      <FormField
                        label="Name of Premises/Building/Village"
                        name="address.premisesName"
                        value={deductorDetails.address.premisesName}
                        onChange={handleDeductorChange}
                      />
                      <FormField
                        label="Road/Street/Lane/Post Office"
                        name="address.roadStreet"
                        value={deductorDetails.address.roadStreet}
                        onChange={handleDeductorChange}
                      />
                      <FormField
                        label="Area/Locality/Taluka/Sub-Division"
                        name="address.area"
                        value={deductorDetails.address.area}
                        onChange={handleDeductorChange}
                      />
                      <FormField
                        label="Town/City/District"
                        name="address.town"
                        value={deductorDetails.address.town}
                        onChange={handleDeductorChange}
                      />
                      <FormField
                        label="State"
                        name="address.state"
                        value={deductorDetails.address.state}
                        onChange={handleDeductorChange}
                        options={states}
                        required
                      />
                      <FormField
                        label="Country"
                        name="address.country"
                        value={deductorDetails.address.country}
                        onChange={handleDeductorChange}
                        required
                      />
                      <FormField
                        label="PIN Code"
                        name="address.pinCode"
                        value={deductorDetails.address.pinCode}
                        onChange={handleDeductorChange}
                        required
                        error={errors.pinCode}
                      />
                    </div>
                  </div>

                  {/* Contact Details */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-4">Contact Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        label="STD Code"
                        name="stdCodeNo"
                        value={deductorDetails.stdCodeNo}
                        onChange={handleDeductorChange}
                        placeholder="022"
                      />
                      <FormField
                        label="Telephone Number"
                        name="telephoneNo"
                        value={deductorDetails.telephoneNo}
                        onChange={handleDeductorChange}
                        placeholder="12345678"
                      />
                      <FormField
                        label="Email Address"
                        name="email"
                        type="email"
                        value={deductorDetails.email}
                        onChange={handleDeductorChange}
                        required
                        error={errors.email}
                      />
                    </div>
                  </div>

                  {/* Responsible Person Details */}
                  <div className="mt-6">
                    <h4 className="font-medium mb-4">Details of Responsible Person</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Status"
                        name="responsiblePerson.status"
                        value={deductorDetails.responsiblePerson.status}
                        onChange={handleDeductorChange}
                        options={[
                          { value: 'Deductor', label: 'Deductor' },
                          { value: 'Representative Assessee', label: 'Representative Assessee' },
                          { value: 'Others', label: 'Others' }
                        ]}
                        required
                      />
                      <FormField
                        label="Designation"
                        name="responsiblePerson.designation"
                        value={deductorDetails.responsiblePerson.designation}
                        onChange={handleDeductorChange}
                        placeholder="Managing Director/Partner etc."
                      />
                      <FormField
                        label="Name"
                        name="responsiblePerson.name"
                        value={deductorDetails.responsiblePerson.name}
                        onChange={handleDeductorChange}
                        required
                      />
                      <FormField
                        label="Father's Name"
                        name="responsiblePerson.fatherName"
                        value={deductorDetails.responsiblePerson.fatherName}
                        onChange={handleDeductorChange}
                      />
                      <FormField
                        label="PAN"
                        name="responsiblePerson.pan"
                        value={deductorDetails.responsiblePerson.pan}
                        onChange={handleDeductorChange}
                        placeholder="ABCDE1234F"
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Challan Details */}
                <FormSection title="Part B - Details of Tax Deposited">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">Details of challan-cum-receipt for tax deposited</p>
                    <ActionButton
                      onClick={addChallan}
                      icon={Plus}
                      label="Add Challan"
                      size="sm"
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-2 py-2 text-xs">S.No.</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">BSR Code</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Date of Deposit</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Challan Serial No.</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Tax</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Surcharge</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Education Cess</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Other</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Interest</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Penalty</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Fee</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Total</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Status</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {challanDetails.map((challan, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-2 py-1 text-center">{challan.serialNo}</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                              title='BSR Code'
                                type="text"
                                value={challan.bsrCode}
                                onChange={(e) => handleChallanChange(index, 'bsrCode', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="BSR Code"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                              title='Date of Deposit'
                                type="date"
                                value={challan.dateOfDeposit}
                                onChange={(e) => handleChallanChange(index, 'dateOfDeposit', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                title='Challan Serial No.'
                                value={challan.challanSerialNo}
                                onChange={(e) => handleChallanChange(index, 'challanSerialNo', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="Serial No."
                              />
                            </td>
                            {['tax', 'surcharge', 'educationCess', 'other', 'interest', 'penalty', 'fee'].map(field => (
                              <td key={field} className="border border-gray-300 px-1 py-1">
                                <input
                                title='Amount'
                                  type="number"
                                  value={challan[field as keyof ChallanDetails]}
                                  onChange={(e) => handleChallanChange(index, field as keyof ChallanDetails, parseFloat(e.target.value) || 0)}
                                  className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                  placeholder="0"
                                  step="0.01"
                                />
                              </td>
                            ))}
                            <td className="border border-gray-300 px-2 py-1 text-center text-xs font-medium">
                              ₹{challan.total.toLocaleString()}
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <select
                              title='Status'
                                value={challan.status}
                                onChange={(e) => handleChallanChange(index, 'status', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                              >
                                <option value="Deposited">Deposited</option>
                                <option value="Book Adjustment">Book Adjustment</option>
                              </select>
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {challanDetails.length > 1 && (
                                <button
                                title='Remove Challan'
                                  onClick={() => removeChallan(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </FormSection>

                {/* Deductee Details */}
                <FormSection title="Part C - Details of Payment and Tax Deducted">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">Details of amount paid/credited and tax deducted</p>
                    <ActionButton
                      onClick={addDeductee}
                      icon={Plus}
                      label="Add Deductee"
                      size="sm"
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-2 py-2 text-xs">S.No.</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">PAN of Deductee</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Name of Deductee</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Amount Paid</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Tax Deducted</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Tax Deposited</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Date of Payment</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Nature of Payment</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Section</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Rate %</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Certificate No.</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">GST No.</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deducteeDetails.map((deductee, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-2 py-1 text-center">{deductee.serialNo}</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                title='PAN of Deductee'
                                value={deductee.panOfDeductee}
                                onChange={(e) => handleDeducteeChange(index, 'panOfDeductee', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="ABCDE1234F"
                                maxLength={10}
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                value={deductee.nameOfDeductee}
                                onChange={(e) => handleDeducteeChange(index, 'nameOfDeductee', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="Deductee Name"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                title='Amount Paid'
                                value={deductee.amountPaid}
                                onChange={(e) => handleDeducteeChange(index, 'amountPaid', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                value={deductee.amountOfTax}
                                onChange={(e) => handleDeducteeChange(index, 'amountOfTax', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                title='Tax Deposited'
                                value={deductee.taxDeposited}
                                onChange={(e) => handleDeducteeChange(index, 'taxDeposited', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                              title='Date of Payment'
                                type="date"
                                value={deductee.dateOfPayment}
                                onChange={(e) => handleDeducteeChange(index, 'dateOfPayment', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                title='Nature of Payment'
                                value={deductee.natureOfPayment}
                                onChange={(e) => handleDeducteeChange(index, 'natureOfPayment', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g., Professional Fees"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <select
                                title='Section Under which Deducted'
                                value={deductee.sectionUnderDeducted}
                                onChange={(e) => handleDeducteeChange(index, 'sectionUnderDeducted', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                              >
                                {sectionCodes.map(section => (
                                  <option key={section.value} value={section.value}>{section.value}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="number"
                                title='Rate of Deduction'
                                value={deductee.rateOfDeduction}
                                onChange={(e) => handleDeducteeChange(index, 'rateOfDeduction', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                step="0.01"
                                max="100"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                title='Certificate Serial No.'
                                value={deductee.certSerialNo || ''}
                                onChange={(e) => handleDeducteeChange(index, 'certSerialNo', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="Certificate No."
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                type="text"
                                value={deductee.gstIdentificationNo || ''}
                                onChange={(e) => handleDeducteeChange(index, 'gstIdentificationNo', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="GST No."
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {deducteeDetails.length > 1 && (
                                <button
                                title='Remove Deductee'
                                  onClick={() => removeDeductee(index)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Totals */}
                  <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Summary Totals</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">Total Amount Paid/Credited: </span>
                        <span className="font-medium">₹{totalSummary.totalAmountPaid.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Tax Deducted: </span>
                        <span className="font-medium">₹{totalSummary.totalTaxDeducted.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Tax Deposited: </span>
                        <span className="font-medium">₹{totalSummary.totalTaxDeposited.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </FormSection>

                {/* Verification */}
                <FormSection title="Verification">
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <h4 className="font-medium text-yellow-900">Declaration</h4>
                      </div>
                      <p className="text-sm text-yellow-800">
                        I solemnly declare that the information given above is correct and complete and that the amount of tax deducted 
                        and reflected in this statement has been paid to the credit of the Central Government.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Capacity"
                        name="capacity"
                        value={verification.capacity}
                        onChange={(e) => setVerification(prev => ({ ...prev, capacity: e.target.value as 'Deductor' | 'Authorized Representative' }))}
                        options={[
                          { value: 'Deductor', label: 'Deductor' },
                          { value: 'Authorized Representative', label: 'Authorized Representative' }
                        ]}
                        required
                      />
                      <FormField
                        label="Place of Declaration"
                        name="declarationPlace"
                        value={verification.declarationPlace}
                        onChange={(e) => setVerification(prev => ({ ...prev, declarationPlace: e.target.value }))}
                        required
                        error={errors.declarationPlace}
                      />
                      <FormField
                        label="Date of Declaration"
                        name="declarationDate"
                        type="date"
                        value={verification.declarationDate}
                        onChange={(e) => setVerification(prev => ({ ...prev, declarationDate: e.target.value }))}
                        required
                      />
                      <FormField
                        label="Full Name"
                        name="fullName"
                        value={verification.fullName}
                        onChange={(e) => setVerification(prev => ({ ...prev, fullName: e.target.value }))}
                        required
                        error={errors.verificationName}
                      />
                      <FormField
                        label="Designation"
                        name="designation"
                        value={verification.designation}
                        onChange={(e) => setVerification(prev => ({ ...prev, designation: e.target.value }))}
                        required
                      />
                      <FormField
                        label="Signature"
                        name="signature"
                        value={verification.signature}
                        onChange={(e) => setVerification(prev => ({ ...prev, signature: e.target.value }))}
                        placeholder="Digital Signature/Manual Signature"
                      />
                    </div>
                  </div>
                </FormSection>
              </div>
            )}

            {/* Upload Return Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-6">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="h-5 w-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">Upload Filed Return</h3>
                  </div>
                  <p className="text-orange-700 text-sm">
                    Upload the acknowledgment receipt (.txt/.pdf) received after successfully filing Form 26Q with the Income Tax Department.
                  </p>
                </div>

                {/* File Upload Area */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Acknowledgment File</h3>
                  <p className="text-gray-600 mb-4">Drag and drop your file here, or click to browse</p>
                  <p className="text-sm text-gray-500 mb-4">Supports: .txt, .pdf files (Max: 5MB)</p>
                  
                  <div className="relative">
                    <input
                    title='Upload Acknowledgment File'
                      type="file"
                      accept=".txt,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          console.log('File selected:', file.name);
                          // Handle file upload logic here
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <ActionButton
                      onClick={() => {}}
                      icon={Upload}
                      label="Choose File"
                      variant="primary"
                    />
                  </div>
                </div>

                {/* Quarter and Year Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="Quarter"
                    name="quarter"
                    value=""
                    onChange={() => {}}
                    options={quarters}
                    required
                  />
                  <FormField
                    label="Assessment Year"
                    name="assessmentYear"
                    value=""
                    onChange={() => {}}
                    options={assessmentYears}
                    required
                  />
                </div>

                {/* Upload Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Upload Instructions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensure the file is the official acknowledgment from Income Tax Department</li>
                    <li>• File should contain acknowledgment number and receipt details</li>
                    <li>• Verify quarter and assessment year before uploading</li>
                    <li>• Keep a backup copy of the uploaded file for your records</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <ActionButton
                    onClick={() => {
                      console.log('Processing upload...');
                      alert('File uploaded successfully!');
                    }}
                    icon={Save}
                    label="Process Upload"
                    variant="primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form26Q;

function setReturnsList(_data: any) {
  throw new Error('Function not implemented.');
}
function setLoading(_arg0: boolean) {
  throw new Error('Function not implemented.');
}

