import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Upload, ArrowLeft, Save, Plus, Trash2, Eye, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Types for Form 27EQ based on provided PDF
interface CollectorDetails {
  tan: string;
  financialYear: string;
  panOfCollector: string;
  typeOfCollector: 'Central Govt' | 'State Govt' | 'Company' | 'Firm' | 'Individual/HUF' | 'Others';
  collectorName: string;
  address: {
    flatNo: string;
    premisesName: string;
    roadStreet: string;
    area: string;
    town: string;
    state: string;
    pinCode: string;
  };
  mobileNo: string;
  alternateMobile: string;
  email: string;
  alternateEmail: string;
  responsiblePerson: {
    name: string;
    pan: string;
    address: {
      flatNo: string;
      premisesName: string;
      roadStreet: string;
      area: string;
      town: string;
      state: string;
      pinCode: string;
    };
    mobileNo: string;
    alternateMobile: string;
    alternateEmail: string;
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
  interest: number;
  fee: number;
  total: number;
  minorHead: string;
}

interface CollecteeDetails {
  serialNo: number;
  panOfCollectee: string;
  nameOfCollectee: string;
  amountReceived: number;
  taxCollected: number;
  taxDeposited: number;
  dateOfCollection: string;
  sectionCode: string;
  rateOfCollection: number;
  remarkCode?: string;
}

interface Verification {
  capacity: 'Collector' | 'Authorized Representative';
  declarationPlace: string;
  declarationDate: string;
  fullName: string;
  designation: string;
  signature: string;
}

// Reusable Components (same as Form 26Q for consistent UI)
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

const Form27EQ: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'upload'>('list');
  // We need errors state but we'll use it later for validation
  const [errors] = useState<Record<string, string>>({});
const [returnList, setReturnList] = useState([]);
const [selectedYear] = useState("2024-25");
const [selectedQuarter] = useState("");
const [, setLoading] = useState(false);
  // Form data state
  const [collectorDetails, setCollectorDetails] = useState<CollectorDetails>({
    tan: '',
    financialYear: '2024-25',
    panOfCollector: 'PANNOTREQD', // Default for Government collectors
    typeOfCollector: 'Company',
    collectorName: '',
    address: {
      flatNo: '',
      premisesName: '',
      roadStreet: '',
      area: '',
      town: '',
      state: '',
      pinCode: ''
    },
    mobileNo: '',
    alternateMobile: '',
    email: '',
    alternateEmail: '',
    responsiblePerson: {
      name: '',
      pan: '',
      address: {
        flatNo: '',
        premisesName: '',
        roadStreet: '',
        area: '',
        town: '',
        state: '',
        pinCode: ''
      },
      mobileNo: '',
      alternateMobile: '',
      alternateEmail: ''
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
    interest: 0,
    fee: 0,
    total: 0,
    minorHead: ''
  }]);

  const [collecteeDetails, setCollecteeDetails] = useState<CollecteeDetails[]>([{
    serialNo: 1,
    panOfCollectee: '',
    nameOfCollectee: '',
    amountReceived: 0,
    taxCollected: 0,
    taxDeposited: 0,
    dateOfCollection: '',
    sectionCode: '206C1',
    rateOfCollection: 0,
    remarkCode: ''
  }]);

  const [verification, setVerification] = useState<Verification>({
    capacity: 'Collector',
    declarationPlace: '',
    declarationDate: '',
    fullName: '',
    designation: '',
    signature: ''
  });

  // Constants
  const quarters = [
    { value: 'Q1', label: 'Q1 (April-June)' },
    { value: 'Q2', label: 'Q2 (July-September)' },
    { value: 'Q3', label: 'Q3 (October-December)' },
    { value: 'Q4', label: 'Q4 (January-March)' }
  ];

  const financialYears = [
    { value: '2025-26', label: 'FY 2025-26' },
    { value: '2024-25', label: 'FY 2024-25' },
    { value: '2023-24', label: 'FY 2023-24' },
    { value: '2022-23', label: 'FY 2022-23' }
  ];

  const sectionCodes = [
    { value: '206C1', label: '206C(1) - Sale of forest produce' },
    { value: '206C1C', label: '206C(1C) - License for parking lot' },
    { value: '206C1F', label: '206C(1F) - Sale of motor vehicle' },
    { value: '206C1H', label: '206C(1H) - Sale of goods' },
    { value: '206C2', label: '206C(2) - Collection of cash' },
    { value: '206C3', label: '206C(3) - Grant of lease/license' },
    { value: '206C5', label: '206C(5) - Jewelry purchase' },
    { value: '206CA', label: '206CA - Tax collection at source' }
  ];

  // Handler functions
  const handleCollectorChange = (key: keyof CollectorDetails, value: string) => {
    setCollectorDetails(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleResponsiblePersonChange = (key: string, value: string) => {
    setCollectorDetails(prev => ({
      ...prev,
      responsiblePerson: {
        ...prev.responsiblePerson,
        [key]: value
      }
    }));
  };
  
  // Function for handling address changes that we'll use in future implementation
  // const handleAddressChange = (type: 'collector' | 'responsible', key: string, value: string) => {
  //   if (type === 'collector') {
  //     setCollectorDetails(prev => ({
  //       ...prev,
  //       address: {
  //         ...prev.address,
  //         [key]: value
  //       }
  //     }));
  //   } else {
  //     setCollectorDetails(prev => ({
  //       ...prev,
  //       responsiblePerson: {
  //         ...prev.responsiblePerson,
  //         address: {
  //           ...prev.responsiblePerson.address,
  //           [key]: value
  //         }
  //       }
  //     }));
  //   }
  // };

  const handleChallanChange = (index: number, key: keyof ChallanDetails, value: string | number) => {
    const newChallanDetails = [...challanDetails];
    newChallanDetails[index] = {
      ...newChallanDetails[index],
      [key]: value
    };
    
    // Recalculate total
    if (['tax', 'surcharge', 'educationCess', 'interest', 'fee'].includes(key)) {
      const { tax, surcharge, educationCess, interest, fee } = newChallanDetails[index];
      newChallanDetails[index].total = tax + surcharge + educationCess + interest + fee;
    }
    
    setChallanDetails(newChallanDetails);
  };
  
  const handleCollecteeChange = (index: number, key: keyof CollecteeDetails, value: string | number) => {
    const newCollecteeDetails = [...collecteeDetails];
    newCollecteeDetails[index] = {
      ...newCollecteeDetails[index],
      [key]: value
    };
    setCollecteeDetails(newCollecteeDetails);
  };
  
  const addChallan = () => {
    setChallanDetails(prev => [
      ...prev,
      {
        serialNo: prev.length + 1,
        bsrCode: '',
        dateOfDeposit: '',
        challanSerialNo: '',
        tax: 0,
        surcharge: 0,
        educationCess: 0,
        interest: 0,
        fee: 0,
        total: 0,
        minorHead: ''
      }
    ]);
  };
  
  const removeChallan = (index: number) => {
    if (challanDetails.length === 1) return;
    
    const newChallanDetails = challanDetails.filter((_, i) => i !== index);
    // Update serial numbers
    newChallanDetails.forEach((challan, i) => {
      challan.serialNo = i + 1;
    });
    
    setChallanDetails(newChallanDetails);
  };
  
  const addCollectee = () => {
    setCollecteeDetails(prev => [
      ...prev,
      {
        serialNo: prev.length + 1,
        panOfCollectee: '',
        nameOfCollectee: '',
        amountReceived: 0,
        taxCollected: 0,
        taxDeposited: 0,
        dateOfCollection: '',
        sectionCode: '206C1',
        rateOfCollection: 0,
        remarkCode: ''
      }
    ]);
  };
  
  const removeCollectee = (index: number) => {
    if (collecteeDetails.length === 1) return;
    
    const newCollecteeDetails = collecteeDetails.filter((_, i) => i !== index);
    // Update serial numbers
    newCollecteeDetails.forEach((collectee, i) => {
      collectee.serialNo = i + 1;
    });
    
    setCollecteeDetails(newCollecteeDetails);
  };

  // Calculate summary totals
  const totalSummary = useMemo(() => {
    return {
      totalCollectees: collecteeDetails.length,
      totalChallan: challanDetails.length,
      totalAmountReceived: collecteeDetails.reduce((sum, item) => sum + item.amountReceived, 0),
      totalTaxCollected: collecteeDetails.reduce((sum, item) => sum + item.taxCollected, 0),
      totalTaxDeposited: collecteeDetails.reduce((sum, item) => sum + item.taxDeposited, 0)
    };
  }, [collecteeDetails, challanDetails]);
  
  // Handle tab switching
  // We're using setActiveTab directly in buttons, so this function is not needed
  // const switchTab = (tab: 'list' | 'create' | 'upload') => {
  //   setActiveTab(tab);
  // };
  
useEffect(() => {
  if (activeTab !== "list") return;
  setLoading(true);
  const params = new URLSearchParams();
  if (selectedYear) params.append("year", selectedYear);
  if (selectedQuarter) params.append("quarter", selectedQuarter);

  fetch(`${import.meta.env.VITE_API_URL}/api/tcs27eq?${params.toString()}`)
    .then((res) => res.json())
    .then((data) => {
      setReturnList(data);
      setLoading(false);
    })
    .catch(() => {
      setReturnList([]);
      setLoading(false);
    });
}, [activeTab, selectedYear, selectedQuarter]);
const handleSaveForm = async (e: React.FormEvent) => {
  e.preventDefault();

  // Optional: validate the form fields here.

  const payload = {
    collectorDetails,
    challanDetails,
    collecteeDetails,
    verification,
  };

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tcs27eq`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      alert("Form 27EQ saved successfully!");
      // Optional: Reset form or navigate away
    } else {
      alert("Failed to save: " + (data.error || "Unknown error"));
    }
  } catch (error) {
    console.error("Error saving Form 27EQ:", error);
    alert("Error during saving the form.");
  }
};

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <div className="flex items-center gap-2">
            <button
              title='Back to Reports'
              type='button'
              onClick={() => navigate('/app/tds')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Form 27EQ</h1>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-3 sm:p-6 mb-6 overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Form 27EQ - TCS Quarterly Return</h1>
          </div>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`py-3 px-6 font-medium text-sm ${activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('list')}
            >
              Return List
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm ${activeTab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('create')}
            >
              Create New
            </button>
            <button
              className={`py-3 px-6 font-medium text-sm ${activeTab === 'upload' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload Filed Return
            </button>
          </div>

          <div className="space-y-6">
            {/* Return List Tab */}
            {activeTab === 'list' && (
              <div>
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg font-semibold">Recent TCS Returns (Form 27EQ)</h2>
                  <div className="flex gap-2">
                    <ActionButton
                      onClick={() => setActiveTab('create')}
                      icon={Plus}
                      label="Create New"
                      size="sm"
                    />
                    <ActionButton
                      onClick={() => setActiveTab('upload')}
                      icon={Upload}
                      label="Upload Filed Return"
                      size="sm"
                      variant="secondary"
                    />
                  </div>
                </div>

                {/* Sample Return List Table */}
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">TAN</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Quarter</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Financial Year</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Filing Date</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      
                      {returnList.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-3 text-center text-gray-500">No returns found.</td>
                        </tr>
                      ) : (
                        returnList.map((ret: any, idx: number) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm text-gray-800">{ret.tan}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{ret.quarter || '-'}</td>
                            <td className="px-4 py-3 text-sm text-gray-800">{ret.financialYear || '-'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                ret.status === 'Filed'
                                  ? 'bg-green-100 text-green-800'
                                  : ret.status === 'Draft'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {ret.status || 'Draft'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-800">{ret.filingDate || '-'}</td>
                            <td className="px-4 py-3 text-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-800" title="View Return"><Eye size={16} /></button>
                              <button className="text-green-600 hover:text-green-800" title="Download"><FileText size={16} /></button>
                              {ret.status === 'Draft' && (
                                <button className="text-red-600 hover:text-red-800" title="Delete Draft"><Trash2 size={16} /></button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Create New Return Tab */}
            {activeTab === 'create' && (
              <div className="space-y-6">
                {/* Form Header with Save Button */}
                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div>
                    <h2 className="text-lg font-semibold">New TCS Return - Form 27EQ</h2>
                    <p className="text-sm text-gray-600">Tax Collection at Source (TCS) Return</p>
                  </div>
                  <div className="flex gap-2">
                    <ActionButton
                                          onClick={() => handleSaveForm(new Event('submit') as unknown as React.FormEvent)}
                                          icon={Save}
                                          label="Save as Draft"
                                          variant="primary"
                                        />
                  </div>
                </div>

                {/* Collector Details */}
                <FormSection title="Part A - General Information">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="TAN"
                      name="tan"
                      value={collectorDetails.tan}
                      onChange={(e) => handleCollectorChange('tan', e.target.value)}
                      required
                    />
                    <FormField
                      label="Financial Year"
                      name="financialYear"
                      value={collectorDetails.financialYear}
                      onChange={(e) => handleCollectorChange('financialYear', e.target.value)}
                      options={[
                        { value: '2024-25', label: '2024-25' },
                        { value: '2023-24', label: '2023-24' }
                      ]}
                      required
                    />
                    
                    <FormField
                      label="PAN of Collector"
                      name="panOfCollector"
                      value={collectorDetails.panOfCollector}
                      onChange={(e) => handleCollectorChange('panOfCollector', e.target.value)}
                      placeholder="PANNOTREQD"
                    />
                    <FormField
                      label="Type of Collector"
                      name="typeOfCollector"
                      value={collectorDetails.typeOfCollector}
                      onChange={(e) => handleCollectorChange('typeOfCollector', e.target.value)}
                      options={[
                        { value: 'Central Govt', label: 'Central Govt' },
                        { value: 'State Govt', label: 'State Govt' },
                        { value: 'Company', label: 'Company' },
                        { value: 'Firm', label: 'Firm' },
                        { value: 'Individual/HUF', label: 'Individual/HUF' },
                        { value: 'Others', label: 'Others' }
                      ]}
                      required
                    />
                    <FormField
                      label="Collector Name"
                      name="collectorName"
                      value={collectorDetails.collectorName}
                      onChange={(e) => handleCollectorChange('collectorName', e.target.value)}
                      required
                    />
                    <FormField
                      label="Mobile No."
                      name="mobileNo"
                      value={collectorDetails.mobileNo}
                      onChange={(e) => handleCollectorChange('mobileNo', e.target.value)}
                      required
                    />
                    <FormField
                      label="Email"
                      name="email"
                      value={collectorDetails.email}
                      onChange={(e) => handleCollectorChange('email', e.target.value)}
                      placeholder="example@domain.com"
                      required
                    />
                    <FormField
                      label="Responsible Person - Name"
                      name="responsiblePerson.name"
                      value={collectorDetails.responsiblePerson.name}
                      onChange={(e) => handleResponsiblePersonChange('name', e.target.value)}
                      required
                    />
                    <FormField
                      label="Responsible Person - PAN"
                      name="responsiblePerson.pan"
                      value={collectorDetails.responsiblePerson.pan}
                      onChange={(e) => handleResponsiblePersonChange('pan', e.target.value)}
                      placeholder="PANNOTREQD"
                    />
                    <FormField
                      label="Responsible Person - Mobile No."
                      name="responsiblePerson.mobileNo"
                      value={collectorDetails.responsiblePerson.mobileNo}
                      onChange={(e) => handleResponsiblePersonChange('mobileNo', e.target.value)}
                      required
                    />
                    <FormField
                      label="Responsible Person - Email"
                      name="responsiblePerson.alternateEmail"
                      value={collectorDetails.responsiblePerson.alternateEmail}
                      onChange={(e) => handleResponsiblePersonChange('alternateEmail', e.target.value)}
                      placeholder="example@domain.com"
                    />
                  </div>
                </FormSection>

                {/* Challan Details */}
                <FormSection title="Part B - Details of Tax Collected and Deposited">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">Details of challan-cum-receipt for tax collected</p>
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
                          <th className="border border-gray-300 px-2 py-2 text-xs">Interest</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Fee</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Total</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Minor Head</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {challanDetails.map((challan, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-2 py-1 text-center">{challan.serialNo}</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="BSR Code"
                                type="text"
                                value={challan.bsrCode}
                                onChange={(e) => handleChallanChange(index, 'bsrCode', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="BSR Code"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Date of Deposit"
                                type="date"
                                value={challan.dateOfDeposit}
                                onChange={(e) => handleChallanChange(index, 'dateOfDeposit', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Challan Serial No."
                                type="text"
                                value={challan.challanSerialNo}
                                onChange={(e) => handleChallanChange(index, 'challanSerialNo', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="Serial No."
                              />
                            </td>
                            {['tax', 'surcharge', 'educationCess', 'interest', 'fee'].map(field => (
                              <td key={field} className="border border-gray-300 px-1 py-1">
                                <input
                                  title={field.charAt(0).toUpperCase() + field.slice(1)}
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
                              <input
                                title="Minor Head"
                                type="text"
                                value={challan.minorHead}
                                onChange={(e) => handleChallanChange(index, 'minorHead', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="Minor Head"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {challanDetails.length > 1 && (
                                <button
                                  title="Remove Challan"
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

                {/* Collectee Details */}
                <FormSection title="Part C - Details of Amount Received and Tax Collected">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-600">Details of amount received/debited and tax collected</p>
                    <ActionButton
                      onClick={addCollectee}
                      icon={Plus}
                      label="Add Collectee"
                      size="sm"
                    />
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full border border-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-2 py-2 text-xs">S.No.</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">PAN of Collectee</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Name of Collectee</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Amount Received</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Tax Collected</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Tax Deposited</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Date of Collection</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Section</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Rate %</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Remark Code</th>
                          <th className="border border-gray-300 px-2 py-2 text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collecteeDetails.map((collectee, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-2 py-1 text-center">{collectee.serialNo}</td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="PAN of Collectee"
                                type="text"
                                value={collectee.panOfCollectee}
                                onChange={(e) => handleCollecteeChange(index, 'panOfCollectee', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="ABCDE1234F"
                                maxLength={10}
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Name of Collectee"
                                type="text"
                                value={collectee.nameOfCollectee}
                                onChange={(e) => handleCollecteeChange(index, 'nameOfCollectee', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="Collectee Name"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Amount Received"
                                type="number"
                                value={collectee.amountReceived}
                                onChange={(e) => handleCollecteeChange(index, 'amountReceived', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Tax Collected"
                                type="number"
                                value={collectee.taxCollected}
                                onChange={(e) => handleCollecteeChange(index, 'taxCollected', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Tax Deposited"
                                type="number"
                                value={collectee.taxDeposited}
                                onChange={(e) => handleCollecteeChange(index, 'taxDeposited', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                step="0.01"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Date of Collection"
                                type="date"
                                value={collectee.dateOfCollection}
                                onChange={(e) => handleCollecteeChange(index, 'dateOfCollection', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <select
                                title="Section Code"
                                value={collectee.sectionCode}
                                onChange={(e) => handleCollecteeChange(index, 'sectionCode', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                              >
                                {sectionCodes.map(section => (
                                  <option key={section.value} value={section.value}>{section.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Rate of Collection"
                                type="number"
                                value={collectee.rateOfCollection}
                                onChange={(e) => handleCollecteeChange(index, 'rateOfCollection', parseFloat(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="0"
                                step="0.01"
                                max="100"
                              />
                            </td>
                            <td className="border border-gray-300 px-1 py-1">
                              <input
                                title="Remark Code"
                                type="text"
                                value={collectee.remarkCode || ''}
                                onChange={(e) => handleCollecteeChange(index, 'remarkCode', e.target.value)}
                                className="w-full px-1 py-1 text-xs border-0 focus:ring-1 focus:ring-blue-500"
                                placeholder="Remark Code"
                              />
                            </td>
                            <td className="border border-gray-300 px-2 py-1 text-center">
                              {collecteeDetails.length > 1 && (
                                <button
                                  title="Remove Collectee"
                                  onClick={() => removeCollectee(index)}
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
                        <span className="text-sm text-gray-600">Total Amount Received/Debited: </span>
                        <span className="font-medium">₹{totalSummary.totalAmountReceived.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Total Tax Collected: </span>
                        <span className="font-medium">₹{totalSummary.totalTaxCollected.toLocaleString()}</span>
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
                        I solemnly declare that the information given above is correct and complete and that the amount of tax collected 
                        and reflected in this statement has been paid to the credit of the Central Government.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        label="Capacity"
                        name="capacity"
                        value={verification.capacity}
                        onChange={(e) => setVerification(prev => ({ ...prev, capacity: e.target.value as 'Collector' | 'Authorized Representative' }))}
                        options={[
                          { value: 'Collector', label: 'Collector' },
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
                    Upload the acknowledgment receipt (.txt/.pdf) received after successfully filing Form 27EQ with the Income Tax Department.
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
                      title="Upload Acknowledgment File"
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
                    label="Financial Year"
                    name="financialYear"
                    value=""
                    onChange={() => {}}
                    options={financialYears}
                    required
                  />
                </div>

                {/* Upload Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Upload Instructions</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Ensure the file is the official acknowledgment from Income Tax Department</li>
                    <li>• File should contain acknowledgment number and receipt details</li>
                    <li>• Verify quarter and financial year before uploading</li>
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

export default Form27EQ;