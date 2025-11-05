import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Filter, Upload, Save, Calculator, FileText, X } from 'lucide-react';

// Helper function to get month name
const getMonthName = (month: string): string => {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[parseInt(month) - 1] || '';
};

// Tax entry types for DRY principle
interface TaxEntry {
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
}

interface TaxableSupplyEntry extends TaxEntry {
  taxableValue: number;
}

interface TaxPaymentEntry {
  tax: number;
  interest: number;
  penalty: number;
  fees: number;
  others: number;
}

// Comprehensive GSTR-3B Data Interface
interface GSTR3BData {
  // Basic Information
  basicInfo: {
    gstin: string;
    legalName: string;
    tradeName: string;
    arn: string;
    dateOfArn: string;
  };
  returnPeriod: {
    month: string;
    year: string;
  };
  // Section 3.1 - Outward Supplies
  outwardSupplies: {
    taxableOutward: TaxableSupplyEntry;
    zeroRated: TaxableSupplyEntry;
    nilRatedExempted: TaxableSupplyEntry;
    intraStateSuppliesTo: TaxableSupplyEntry;
    interStateSuppliesTo: TaxableSupplyEntry;
  };
  // Section 3.1.1 - Amendment to outward supplies
  amendmentOutwardSupplies: TaxableSupplyEntry;
  // Section 3.2 - Inward Supplies
  inwardSupplies: {
    reverseCharge: TaxableSupplyEntry;
    importGoods: TaxableSupplyEntry;
    importServices: TaxableSupplyEntry;
    isdInward: TaxableSupplyEntry;
  };
  // Section 4 - Eligible ITC
  eligibleItc: {
    importGoods: TaxEntry;
    importServices: TaxEntry;
    inwardSupplies: TaxEntry;
    inwardSuppliesReverseCharge: TaxEntry;
    others: TaxEntry;
  };
  // Section 4.1 - ITC Reversed
  itcReversed: {
    asPerRule42And43: TaxEntry;
    others: TaxEntry;
  };
  // Section 5 - Values of exempt, nil-rated and non-GST inward supplies
  exemptNilNonGst: {
    interStateSupplies: number;
    intraStateSupplies: number;
  };
  // Section 6.1 - Interest & Late fee
  interestLateFee: TaxEntry;
  // Section 6.2 - Tax paid
  taxPaid: {
    igst: TaxPaymentEntry;
    cgst: TaxPaymentEntry;
    sgst: TaxPaymentEntry;
    cess: TaxPaymentEntry;
  };
  // Verification
  verification: {
    date: string;
    authorizedSignatoryName: string;
    designation: string;
    place: string;
  };
}

const GSTR3B: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // New state variables for enhanced features
  const [showDraftPreview, setShowDraftPreview] = useState(false);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [showArnModal, setShowArnModal] = useState(false);
  const [generatedArn, setGeneratedArn] = useState('');
  const [draftData, setDraftData] = useState<GSTR3BData | null>(null);

  // Default empty tax entry
  const emptyTaxEntry = (): TaxEntry => ({ igst: 0, cgst: 0, sgst: 0, cess: 0 });
  const emptyTaxableEntry = (): TaxableSupplyEntry => ({ taxableValue: 0, ...emptyTaxEntry() });
  const emptyTaxPaymentEntry = (): TaxPaymentEntry => ({ tax: 0, interest: 0, penalty: 0, fees: 0, others: 0 });

  const [gstr3bData, setGstr3bData] = useState<GSTR3BData>({
    basicInfo: {
      gstin: '',
      legalName: '',
      tradeName: '',
      arn: '',
      dateOfArn: '',
    },
    returnPeriod: {
      month: (new Date().getMonth() + 1).toString().padStart(2, '0'),
      year: new Date().getFullYear().toString(),
    },
    outwardSupplies: {
      taxableOutward: emptyTaxableEntry(),
      zeroRated: emptyTaxableEntry(),
      nilRatedExempted: emptyTaxableEntry(),
      intraStateSuppliesTo: emptyTaxableEntry(),
      interStateSuppliesTo: emptyTaxableEntry(),
    },
    amendmentOutwardSupplies: emptyTaxableEntry(),
    inwardSupplies: {
      reverseCharge: emptyTaxableEntry(),
      importGoods: emptyTaxableEntry(),
      importServices: emptyTaxableEntry(),
      isdInward: emptyTaxableEntry(),
    },
    eligibleItc: {
      importGoods: emptyTaxEntry(),
      importServices: emptyTaxEntry(),
      inwardSupplies: emptyTaxEntry(),
      inwardSuppliesReverseCharge: emptyTaxEntry(),
      others: emptyTaxEntry(),
    },
    itcReversed: {
      asPerRule42And43: emptyTaxEntry(),
      others: emptyTaxEntry(),
    },
    exemptNilNonGst: {
      interStateSupplies: 0,
      intraStateSupplies: 0,
    },
    interestLateFee: emptyTaxEntry(),
    taxPaid: {
      igst: emptyTaxPaymentEntry(),
      cgst: emptyTaxPaymentEntry(),
      sgst: emptyTaxPaymentEntry(),
      cess: emptyTaxPaymentEntry(),
    },
    verification: {
      date: new Date().toISOString().split('T')[0],
      authorizedSignatoryName: '',
      designation: '',
      place: '',
    },
  });

  // DRY helper functions
  const updateField = (section: keyof GSTR3BData, subsection: string, field: string, value: number | string) => {
    setGstr3bData(prev => {
      if (subsection) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const sectionData = prev[section] as any;
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [subsection]: {
              ...sectionData[subsection],
              [field]: value
            }
          }
        };
      } else {
        return {
          ...prev,
          [section]: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            ...(prev[section] as any),
            [field]: value
          }
        };
      }
    });
  };

  const updateBasicInfo = (field: keyof GSTR3BData['basicInfo'], value: string) => {
    setGstr3bData(prev => ({
      ...prev,
      basicInfo: { ...prev.basicInfo, [field]: value }
    }));
  };

  const updateReturnPeriod = (field: keyof GSTR3BData['returnPeriod'], value: string) => {
    setGstr3bData(prev => ({
      ...prev,
      returnPeriod: { ...prev.returnPeriod, [field]: value }
    }));
  };

  const updateVerification = (field: keyof GSTR3BData['verification'], value: string) => {
    setGstr3bData(prev => ({
      ...prev,
      verification: { ...prev.verification, [field]: value }
    }));
  };

  // Calculate totals
  const calculateTotals = () => {
    const totalOutwardTax = 
      gstr3bData.outwardSupplies.taxableOutward.igst + 
      gstr3bData.outwardSupplies.taxableOutward.cgst + 
      gstr3bData.outwardSupplies.taxableOutward.sgst +
      gstr3bData.outwardSupplies.zeroRated.igst + 
      gstr3bData.outwardSupplies.zeroRated.cgst + 
      gstr3bData.outwardSupplies.zeroRated.sgst;

    const totalInwardTax = 
      gstr3bData.inwardSupplies.reverseCharge.igst + 
      gstr3bData.inwardSupplies.reverseCharge.cgst + 
      gstr3bData.inwardSupplies.reverseCharge.sgst;

    const totalEligibleItc = 
      Object.values(gstr3bData.eligibleItc).reduce((sum, itc) => 
        sum + itc.igst + itc.cgst + itc.sgst + itc.cess, 0);

    const totalItcReversed = 
      Object.values(gstr3bData.itcReversed).reduce((sum, itc) => 
        sum + itc.igst + itc.cgst + itc.sgst + itc.cess, 0);

    // Calculate individual tax totals
    const totalIgst = 
      gstr3bData.outwardSupplies.taxableOutward.igst + 
      gstr3bData.outwardSupplies.zeroRated.igst +
      gstr3bData.inwardSupplies.reverseCharge.igst;
      
    const totalCgst = 
      gstr3bData.outwardSupplies.taxableOutward.cgst + 
      gstr3bData.outwardSupplies.zeroRated.cgst +
      gstr3bData.inwardSupplies.reverseCharge.cgst;
      
    const totalSgst = 
      gstr3bData.outwardSupplies.taxableOutward.sgst + 
      gstr3bData.outwardSupplies.zeroRated.sgst +
      gstr3bData.inwardSupplies.reverseCharge.sgst;
      
    const totalCess = 
      gstr3bData.outwardSupplies.taxableOutward.cess + 
      gstr3bData.outwardSupplies.zeroRated.cess;

    const netTaxLiability = Math.max(0, totalOutwardTax + totalInwardTax - totalEligibleItc + totalItcReversed);

    return {
      totalOutwardTax,
      totalInwardTax,
      totalEligibleItc,
      totalItcReversed,
      netTaxLiability,
      totalIgst,
      totalCgst,
      totalSgst,
      totalCess,
    };
  };

  // Auto-calculate on data change
  useEffect(() => {
    setIsCalculating(true);
    const timer = setTimeout(() => setIsCalculating(false), 500);
    return () => clearTimeout(timer);
  }, [gstr3bData]);

  // Validation
  const validateForm = () => {
    const errors: string[] = [];
    if (!gstr3bData.basicInfo.gstin) errors.push('GSTIN is required');
    if (!gstr3bData.basicInfo.legalName) errors.push('Legal Name is required');
    if (!gstr3bData.verification.authorizedSignatoryName) errors.push('Authorized Signatory Name is required');
    if (!gstr3bData.verification.designation) errors.push('Designation is required');
    
    if (errors.length > 0) {
      alert('Please fix the following errors:\\n' + errors.join('\\n'));
      return false;
    }
    return true;
  };

  const handleValidateAndPreview = () => {
    if (validateForm()) {
      setShowPreviewMode(true);
    }
  };

  const handleSubmitReturn = () => {
    if (validateForm()) {
      const totals = calculateTotals();
      const confirmSubmit = window.confirm(
        `Are you sure you want to submit GSTR-3B for ${getMonthName(gstr3bData.returnPeriod.month)} ${gstr3bData.returnPeriod.year}?\n\nNet Tax Liability: ₹${totals.netTaxLiability.toFixed(2)}`
      );
      
      if (confirmSubmit) {
        // Generate ARN (Acknowledgement Reference Number)
        const currentDate = new Date();
        const formattedDate = currentDate.getFullYear().toString() + 
                              (currentDate.getMonth() + 1).toString().padStart(2, '0') + 
                              currentDate.getDate().toString().padStart(2, '0');
        const randomNum = Math.floor(Math.random() * 900000) + 100000;
        const arn = `AB${formattedDate}${randomNum}`;
        
        console.log('Submitting GSTR-3B:', gstr3bData);
        setGeneratedArn(arn);
        setShowArnModal(true);
        
        // Clear preview mode if it was active
        setShowPreviewMode(false);
      }
    }
  };

  const saveDraft = () => {
    localStorage.setItem('gstr3b_draft', JSON.stringify(gstr3bData));
    alert('Draft saved successfully!');
  };

  const loadDraft = () => {
    const saved = localStorage.getItem('gstr3b_draft');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        setDraftData(parsedData);
        setShowDraftPreview(true);
      } catch {
        alert('Error loading draft: Invalid data format');
      }
    } else {
      alert('No saved draft found');
    }
  };

  const confirmLoadDraft = () => {
    if (draftData) {
      setGstr3bData(draftData);
      setShowDraftPreview(false);
      setDraftData(null);
      alert('Draft loaded successfully!');
    }
  };

  const cancelLoadDraft = () => {
    setShowDraftPreview(false);
    setDraftData(null);
  };

  // Reusable Number Input Component
  const NumberInput: React.FC<{
    value: number;
    onChange: (value: number) => void;
    placeholder?: string;
    className?: string;
  }> = ({ value, onChange, placeholder, className = '' }) => (
    <input
      type="number"
      step="0.01"
      value={value || ''}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
      className={`w-full p-2 text-right font-mono rounded border ${
        theme === 'dark' 
          ? 'bg-gray-700 border-gray-600 text-white' 
          : 'bg-white border-gray-300'
      } ${className}`}
    />
  );

  // Reusable Table Row Component
  const TaxTableRow: React.FC<{
    label: string;
    data: TaxableSupplyEntry;
    onUpdate: (field: string, value: number) => void;
    showTaxableValue?: boolean;
  }> = ({ label, data, onUpdate, showTaxableValue = true }) => (
    <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
      <td className="px-4 py-3">{label}</td>
      {showTaxableValue && (
        <td className="px-4 py-3">
          <NumberInput
            value={data.taxableValue}
            onChange={(value) => onUpdate('taxableValue', value)}
          />
        </td>
      )}
      <td className="px-4 py-3">
        <NumberInput
          value={data.igst}
          onChange={(value) => onUpdate('igst', value)}
        />
      </td>
      <td className="px-4 py-3">
        <NumberInput
          value={data.cgst}
          onChange={(value) => onUpdate('cgst', value)}
        />
      </td>
      <td className="px-4 py-3">
        <NumberInput
          value={data.sgst}
          onChange={(value) => onUpdate('sgst', value)}
        />
      </td>
      <td className="px-4 py-3">
        <NumberInput
          value={data.cess}
          onChange={(value) => onUpdate('cess', value)}
        />
      </td>
    </tr>
  );

  const totals = calculateTotals();

  return (
    <div className='pt-[56px] px-4'>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          title='Back to Reports'
          type='button'
          onClick={() => navigate('/app/gst')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">GSTR-3B Return</h1>
        <div className="ml-auto flex space-x-2">
          <button title='Load Draft' onClick={loadDraft} className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <FileText size={18} />
          </button>
          <button title='Save Draft' type='button' onClick={saveDraft} className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Save size={18} />
          </button>
          <button title='Calculate'  className={`p-2 rounded-md ${isCalculating ? 'animate-pulse' : ''} ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Calculator size={18} />
          </button>
          <button title='Toggle Filters' type='button' onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Filter size={18} />
          </button>
          <button title='Upload Report' type='button' className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Upload size={18} />
          </button>
          <button title='Print Report' type='button' className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Printer size={18} />
          </button>
          <button title='Download Report' type='button' className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Download size={18} />
          </button>
        </div>
      </div>
      
      {/* Filter Panel */}
      {showFilterPanel && (
        <div className={`p-4 mb-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="font-semibold mb-4">Return Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                title='Select Month'
                value={gstr3bData.returnPeriod.month}
                onChange={(e) => updateReturnPeriod('month', e.target.value)}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={(i + 1).toString().padStart(2, '0')}>
                    {getMonthName((i + 1).toString().padStart(2, '0'))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                title='Select Year'
                value={gstr3bData.returnPeriod.year}
                onChange={(e) => updateReturnPeriod('year', e.target.value)}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                  <option key={year} value={year.toString()}>{year}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  const currentMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
                  const currentYear = new Date().getFullYear().toString();
                  updateReturnPeriod('month', currentMonth);
                  updateReturnPeriod('year', currentYear);
                }}
                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                Current Period
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Basic Information Section */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">GSTIN of Supplier *</label>
              <input
              title='Enter GSTIN'
                type="text"
                value={gstr3bData.basicInfo.gstin}
                onChange={(e) => updateBasicInfo('gstin', e.target.value.toUpperCase())}
                placeholder="Enter GSTIN"
                maxLength={15}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Legal Name of Registered Person *</label>
              <input
              title='Enter Legal Name'
                type="text"
                value={gstr3bData.basicInfo.legalName}
                onChange={(e) => updateBasicInfo('legalName', e.target.value)}
                placeholder="Enter Legal Name"
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Trade Name (if any)</label>
              <input
              title='Enter Trade Name'
                type="text"
                value={gstr3bData.basicInfo.tradeName}
                onChange={(e) => updateBasicInfo('tradeName', e.target.value)}
                placeholder="Enter Trade Name"
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ARN</label>
              <input
                type="text"
                value={gstr3bData.basicInfo.arn}
                readOnly
                placeholder="Auto-generated after submission"
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-600 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Date of ARN</label>
              <input
                title='Date of ARN'
                type="date"
                value={gstr3bData.basicInfo.dateOfArn}
                readOnly
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-600 border-gray-600 text-gray-400' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
              />
            </div>
          </div>
        </div>

        {/* Section 3.1 - Outward Supplies */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">3.1 Details of Outward Supplies and inward supplies liable to reverse charge</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'}`}>
                  <th className="px-4 py-3 text-left">Nature of Supply</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>
              <tbody>
                <TaxTableRow
                  label="(a) Outward taxable supplies (other than zero rated, nil rated and exempted)"
                  data={gstr3bData.outwardSupplies.taxableOutward}
                  onUpdate={(field, value) => updateField('outwardSupplies', 'taxableOutward', field, value)}
                />
                <TaxTableRow
                  label="(b) Outward taxable supplies (zero rated)"
                  data={gstr3bData.outwardSupplies.zeroRated}
                  onUpdate={(field, value) => updateField('outwardSupplies', 'zeroRated', field, value)}
                />
                <TaxTableRow
                  label="(c) Other outward supplies (Nil rated, exempted)"
                  data={gstr3bData.outwardSupplies.nilRatedExempted}
                  onUpdate={(field, value) => updateField('outwardSupplies', 'nilRatedExempted', field, value)}
                />
                <TaxTableRow
                  label="(d) Inward supplies (liable to reverse charge)"
                  data={gstr3bData.inwardSupplies.reverseCharge}
                  onUpdate={(field, value) => updateField('inwardSupplies', 'reverseCharge', field, value)}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3.1.1 - Amendment to outward supplies */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">3.1.1 Amendment to outward supplies reported in returns of earlier tax periods</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'}`}>
                  <th className="px-4 py-3 text-left">Particulars</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>
              <tbody>
                <TaxTableRow
                  label="Amendment to outward supplies"
                  data={gstr3bData.amendmentOutwardSupplies}
                  onUpdate={(field, value) => updateField('amendmentOutwardSupplies', '', field, value)}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3.2 - Of the supplies shown in 3.1(a) above, details of inter-State supplies */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">3.2 Of the supplies shown in 3.1(a) above, details of inter-State supplies made to unregistered persons, composition taxable person and UIN holders</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'}`}>
                  <th className="px-4 py-3 text-left">Nature of Supply</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>
              <tbody>
                <TaxTableRow
                  label="Supplies made to Unregistered Persons"
                  data={gstr3bData.outwardSupplies.interStateSuppliesTo}
                  onUpdate={(field, value) => updateField('outwardSupplies', 'interStateSuppliesTo', field, value)}
                />
                <TaxTableRow
                  label="Supplies made to Composition Taxable Persons"
                  data={gstr3bData.outwardSupplies.intraStateSuppliesTo}
                  onUpdate={(field, value) => updateField('outwardSupplies', 'intraStateSuppliesTo', field, value)}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4 - Eligible ITC */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">4. Eligible ITC</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'}`}>
                  <th className="px-4 py-3 text-left">Details</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                  <td className="px-4 py-3 font-bold">(A) ITC Available (whether in full or part)</td>
                  <td className="px-4 py-3 text-center font-bold" colSpan={4}>-</td>
                </tr>
                <TaxTableRow
                  label="(1) Import of goods"
                  data={{ ...gstr3bData.eligibleItc.importGoods, taxableValue: 0 }}
                  onUpdate={(field, value) => updateField('eligibleItc', 'importGoods', field, value)}
                  showTaxableValue={false}
                />
                <TaxTableRow
                  label="(2) Import of services"
                  data={{ ...gstr3bData.eligibleItc.importServices, taxableValue: 0 }}
                  onUpdate={(field, value) => updateField('eligibleItc', 'importServices', field, value)}
                  showTaxableValue={false}
                />
                <TaxTableRow
                  label="(3) Inward supplies liable to reverse charge (other than 1 & 2 above)"
                  data={{ ...gstr3bData.eligibleItc.inwardSuppliesReverseCharge, taxableValue: 0 }}
                  onUpdate={(field, value) => updateField('eligibleItc', 'inwardSuppliesReverseCharge', field, value)}
                  showTaxableValue={false}
                />
                <TaxTableRow
                  label="(4) Inward supplies from ISD"
                  data={{ ...gstr3bData.eligibleItc.inwardSupplies, taxableValue: 0 }}
                  onUpdate={(field, value) => updateField('eligibleItc', 'inwardSupplies', field, value)}
                  showTaxableValue={false}
                />
                <TaxTableRow
                  label="(5) All other ITC"
                  data={{ ...gstr3bData.eligibleItc.others, taxableValue: 0 }}
                  onUpdate={(field, value) => updateField('eligibleItc', 'others', field, value)}
                  showTaxableValue={false}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4.1 - ITC Reversed (Option B) */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">4.1 ITC Reversed</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'}`}>
                  <th className="px-4 py-3 text-left">Details</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                  <td className="px-4 py-3 font-bold">(B) ITC Reversed</td>
                  <td className="px-4 py-3 text-center font-bold" colSpan={4}>-</td>
                </tr>
                <TaxTableRow
                  label="(1) As per Rule 42 & 43 of CGST Rules"
                  data={{ ...gstr3bData.itcReversed.asPerRule42And43, taxableValue: 0 }}
                  onUpdate={(field, value) => updateField('itcReversed', 'asPerRule42And43', field, value)}
                  showTaxableValue={false}
                />
                <TaxTableRow
                  label="(2) Others"
                  data={{ ...gstr3bData.itcReversed.others, taxableValue: 0 }}
                  onUpdate={(field, value) => updateField('itcReversed', 'others', field, value)}
                  showTaxableValue={false}
                />
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5 - Values of exempt, nil-rated and non-GST inward supplies */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">5. Values of exempt, nil-rated and non-GST inward supplies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                From a supplier under composition scheme, Exempt and Nil rated supply
              </label>
              <NumberInput
                value={gstr3bData.exemptNilNonGst.intraStateSupplies}
                onChange={(value) => updateField('exemptNilNonGst', '', 'intraStateSupplies', value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Non GST supply
              </label>
              <NumberInput
                value={gstr3bData.exemptNilNonGst.interStateSupplies}
                onChange={(value) => updateField('exemptNilNonGst', '', 'interStateSupplies', value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Section 6.1 - Interest & Late Fee */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">6.1 Interest & Late fee for previous tax period</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Integrated Tax</label>
              <NumberInput
                value={gstr3bData.interestLateFee.igst}
                onChange={(value) => updateField('interestLateFee', '', 'igst', value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Central Tax</label>
              <NumberInput
                value={gstr3bData.interestLateFee.cgst}
                onChange={(value) => updateField('interestLateFee', '', 'cgst', value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">State/UT Tax</label>
              <NumberInput
                value={gstr3bData.interestLateFee.sgst}
                onChange={(value) => updateField('interestLateFee', '', 'sgst', value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Cess</label>
              <NumberInput
                value={gstr3bData.interestLateFee.cess}
                onChange={(value) => updateField('interestLateFee', '', 'cess', value)}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Section 6.2 - Payment of Tax */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">6.2 Payment of Tax</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'}`}>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Tax</th>
                  <th className="px-4 py-3 text-right">Interest</th>
                  <th className="px-4 py-3 text-right">Penalty</th>
                  <th className="px-4 py-3 text-right">Fees</th>
                  <th className="px-4 py-3 text-right">Others</th>
                </tr>
              </thead>
              <tbody>
                {(['igst', 'cgst', 'sgst', 'cess'] as const).map((taxType) => (
                  <tr key={taxType} className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                    <td className="px-4 py-3 capitalize">{taxType.toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <NumberInput
                        value={gstr3bData.taxPaid[taxType].tax}
                        onChange={(value) => updateField('taxPaid', taxType, 'tax', value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <NumberInput
                        value={gstr3bData.taxPaid[taxType].interest}
                        onChange={(value) => updateField('taxPaid', taxType, 'interest', value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <NumberInput
                        value={gstr3bData.taxPaid[taxType].penalty}
                        onChange={(value) => updateField('taxPaid', taxType, 'penalty', value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <NumberInput
                        value={gstr3bData.taxPaid[taxType].fees}
                        onChange={(value) => updateField('taxPaid', taxType, 'fees', value)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <NumberInput
                        value={gstr3bData.taxPaid[taxType].others}
                        onChange={(value) => updateField('taxPaid', taxType, 'others', value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Tax Liability Calculation */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">Tax Liability Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-4">Net Tax Liability</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Outward Tax</span>
                  <span className="font-mono text-lg">₹ {totals.totalOutwardTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Inward Tax</span>
                  <span className="font-mono text-lg">₹ {totals.totalInwardTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total Eligible ITC</span>
                  <span className="font-mono text-lg text-green-600">- ₹ {totals.totalEligibleItc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Total ITC Reversed</span>
                  <span className="font-mono text-lg text-red-600">+ ₹ {totals.totalItcReversed.toFixed(2)}</span>
                </div>
                <hr className={`my-3 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`} />
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Net Tax Liability</span>
                  <span className="font-mono text-blue-600">₹ {totals.netTaxLiability.toFixed(2)}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Tax Backup & Liability</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Tax Backup Available</span>
                  <span className="font-mono text-lg">₹ {totals.totalEligibleItc.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Current Liability</span>
                  <span className="font-mono text-lg">₹ {totals.netTaxLiability.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Interest & Penalty</span>
                  <span className="font-mono text-lg">
                    ₹ {(gstr3bData.interestLateFee.igst + gstr3bData.interestLateFee.cgst + gstr3bData.interestLateFee.sgst + gstr3bData.interestLateFee.cess).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-bold mb-4">Verification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <input
                type="date"
                title="Select verification date"
                value={gstr3bData.verification.date}
                onChange={(e) => updateVerification('date', e.target.value)}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Name of Authorized Signatory *</label>
              <input
                type="text"
                value={gstr3bData.verification.authorizedSignatoryName}
                onChange={(e) => updateVerification('authorizedSignatoryName', e.target.value)}
                placeholder="Enter signatory name"
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Designation/Status *</label>
              <select
                value={gstr3bData.verification.designation}
                onChange={(e) => updateVerification('designation', e.target.value)}
                title="Select designation or status"
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              >
                <option value="">Select Designation</option>
                <option value="Proprietor">Proprietor</option>
                <option value="Partner">Partner</option>
                <option value="Director">Director</option>
                <option value="Company Secretary">Company Secretary</option>
                <option value="Chartered Accountant">Chartered Accountant</option>
                <option value="Authorized Signatory">Authorized Signatory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Place</label>
              <input
                type="text"
                value={gstr3bData.verification.place}
                onChange={(e) => updateVerification('place', e.target.value)}
                placeholder="Enter place"
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-8 justify-center">
        <button
          onClick={saveDraft}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
        >
          <Save size={20} />
          Save Draft
        </button>
        <button
          onClick={loadDraft}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}`}
        >
          <FileText size={20} />
          Load Draft
        </button>
        <button
          onClick={handleValidateAndPreview}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${theme === 'dark' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
        >
          <Calculator size={20} />
          Validate & Preview
        </button>
        <button
          onClick={handleSubmitReturn}
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${theme === 'dark' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
        >
          <Upload size={20} />
          Submit Return
        </button>
      </div>
      
      <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-orange-50'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm">
              <span className="font-semibold">GST Filing:</span> GSTR-3B is a monthly summary return that must be filed by the 20th of the following month.
            </p>
          </div>
          <div>
            <p className="text-sm">
              <span className="font-semibold">Current Period:</span> {getMonthName(gstr3bData.returnPeriod.month)} {gstr3bData.returnPeriod.year}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Net Tax Liability:</span> ₹ {totals.netTaxLiability.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* Draft Preview Modal */}
      {showDraftPreview && draftData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`sticky top-0 px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <h3 className="text-lg font-semibold">Draft Preview</h3>
              <p className="text-sm text-gray-500">Review the draft before loading</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <p><span className="font-medium">GSTIN:</span> {draftData.basicInfo.gstin || 'Not provided'}</p>
                  <p><span className="font-medium">Legal Name:</span> {draftData.basicInfo.legalName || 'Not provided'}</p>
                  <p><span className="font-medium">Return Period:</span> {getMonthName(draftData.returnPeriod.month)} {draftData.returnPeriod.year}</p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tax Summary</h4>
                  {(() => {
                    const draftTotals = {
                      totalTaxable: Object.values(draftData.outwardSupplies).reduce((sum, entry) => sum + (entry.taxableValue || 0), 0) +
                                   Object.values(draftData.inwardSupplies).reduce((sum, entry) => sum + (entry.taxableValue || 0), 0),
                      totalTax: Object.values(draftData.outwardSupplies).reduce((sum, entry) => sum + (entry.igst || 0) + (entry.cgst || 0) + (entry.sgst || 0) + (entry.cess || 0), 0)
                    };
                    return (
                      <>
                        <p><span className="font-medium">Total Taxable Value:</span> ₹{draftTotals.totalTaxable.toFixed(2)}</p>
                        <p><span className="font-medium">Total Tax:</span> ₹{draftTotals.totalTax.toFixed(2)}</p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            <div className={`sticky bottom-0 px-6 py-4 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={cancelLoadDraft}
                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}
              >
                Cancel
              </button>
              <button
                onClick={confirmLoadDraft}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Load Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Mode Modal */}
      {showPreviewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`sticky top-0 px-6 py-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <div>
                <h3 className="text-lg font-semibold">GSTR-3B Preview</h3>
                <p className="text-sm text-gray-500">{getMonthName(gstr3bData.returnPeriod.month)} {gstr3bData.returnPeriod.year}</p>
              </div>
              <button
                title="Close Preview"
                onClick={() => setShowPreviewMode(false)}
                className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info Preview */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><span className="font-medium">GSTIN:</span> {gstr3bData.basicInfo.gstin}</p>
                  <p><span className="font-medium">Legal Name:</span> {gstr3bData.basicInfo.legalName}</p>
                  <p><span className="font-medium">Trade Name:</span> {gstr3bData.basicInfo.tradeName}</p>
                  <p><span className="font-medium">Return Period:</span> {getMonthName(gstr3bData.returnPeriod.month)} {gstr3bData.returnPeriod.year}</p>
                </div>
              </div>

              {/* Tax Summary Preview */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-3">Tax Liability Summary</h4>
                {(() => {
                  const totals = calculateTotals();
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <p><span className="font-medium">IGST:</span> ₹{totals.totalIgst.toFixed(2)}</p>
                      <p><span className="font-medium">CGST:</span> ₹{totals.totalCgst.toFixed(2)}</p>
                      <p><span className="font-medium">SGST:</span> ₹{totals.totalSgst.toFixed(2)}</p>
                      <p><span className="font-medium">CESS:</span> ₹{totals.totalCess.toFixed(2)}</p>
                      <p className="font-bold text-lg col-span-full"><span className="font-medium">Net Tax Liability:</span> ₹{totals.netTaxLiability.toFixed(2)}</p>
                    </div>
                  );
                })()}
              </div>

              {/* Verification Preview */}
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="font-semibold mb-3">Verification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p><span className="font-medium">Date:</span> {gstr3bData.verification.date}</p>
                  <p><span className="font-medium">Authorized Signatory:</span> {gstr3bData.verification.authorizedSignatoryName}</p>
                  <p><span className="font-medium">Designation:</span> {gstr3bData.verification.designation}</p>
                  <p><span className="font-medium">Place:</span> {gstr3bData.verification.place}</p>
                </div>
              </div>
            </div>
            <div className={`sticky bottom-0 px-6 py-4 border-t flex justify-end gap-3 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
              <button
                onClick={() => setShowPreviewMode(false)}
                className={`px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-gray-600 hover:bg-gray-700' : 'bg-gray-300 hover:bg-gray-400'}`}
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmitReturn}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARN Display Modal */}
      {showArnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-md w-full mx-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className="text-lg font-semibold text-green-600">GSTR-3B Submitted Successfully!</h3>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <svg className="w-16 h-16 text-green-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">Return Filed Successfully</h4>
                <p className="text-sm text-gray-600 mb-4">Your GSTR-3B return has been submitted to the GST portal.</p>
                
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'} mb-4`}>
                  <p className="text-sm font-medium mb-2">Acknowledgement Reference Number (ARN)</p>
                  <p className="text-xl font-mono font-bold text-blue-600">{generatedArn}</p>
                </div>
                
                <div className="text-sm text-gray-600 space-y-1">
                  <p><span className="font-medium">Return Period:</span> {getMonthName(gstr3bData.returnPeriod.month)} {gstr3bData.returnPeriod.year}</p>
                  <p><span className="font-medium">Filed Date:</span> {new Date().toLocaleDateString('en-IN')}</p>
                  <p><span className="font-medium">Filed Time:</span> {new Date().toLocaleTimeString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className={`px-6 py-4 border-t flex justify-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={() => {
                  setShowArnModal(false);
                  setGeneratedArn('');
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTR3B;
