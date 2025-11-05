import React, { useState } from 'react';
import { FileText, X, Save, MapPin, Calendar, CreditCard, Hash , ArrowLeft} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import type { CompanyInfo } from '../../../types';

interface FormData {
  state: string;
  registrationType: string;
  assesseeOfOtherTerritory: string;
  gstNumber: string;
  periodicityOfGstr1: string;
  gstApplicableFrom: string;
  eWayBillApplicable: string;
  eWayBillThresholdLimit: string;
  eWayBillIntrastate: string;
  provideLutBond: string;
  lutBondNumber: string;
  lutBondValidity: string;
  taxLiabilityOnAdvanceReceipts: string;
}

// Reusable Input Field Component
interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  theme: string;
  error?: string;
  title?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  placeholder,
  icon,
  theme,
  error,
  title
}) => (
  <div>
    <label htmlFor={id} className={`block text-sm font-medium mb-1 ${
      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
    }`}>
      {icon && <span className="inline-flex items-center mr-1">{icon}</span>}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <input
      type={type}
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      title={title}
      className={`w-full p-2 border rounded focus:outline-none focus:border-blue-500 transition-colors ${
        error 
          ? 'border-red-500' 
          : theme === 'dark' 
            ? 'border-gray-600 bg-gray-700 text-gray-100' 
            : 'border-gray-300 bg-white text-gray-900'
      }`}
    />
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

// Reusable Select Field Component
interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
  theme: string;
  error?: string;
  title?: string;
  placeholder?: string;
}

const SelectField: React.FC<SelectFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  options,
  icon,
  theme,
  error,
  title,
  placeholder = "Select option"
}) => (
  <div>
    <label htmlFor={id} className={`block text-sm font-medium mb-1 ${
      theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
    }`}>
      {icon && <span className="inline-flex items-center mr-1">{icon}</span>}
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    <select
      id={id}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      title={title}
      className={`w-full p-2 border rounded focus:outline-none focus:border-blue-500 transition-colors ${
        error 
          ? 'border-red-500' 
          : theme === 'dark' 
            ? 'border-gray-600 bg-gray-700 text-gray-100' 
            : 'border-gray-300 bg-white text-gray-900'
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
  </div>
);

const GSTRegistration: React.FC = () => {
  const { theme, setCompanyInfo, companyInfo } = useAppContext();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    state: companyInfo?.state || '',
    registrationType: companyInfo?.registrationType || '',
    assesseeOfOtherTerritory: companyInfo?.assesseeOfOtherTerritory ? 'yes' : 'no',
    gstNumber: companyInfo?.gstNumber || '',
    periodicityOfGstr1: companyInfo?.periodicityOfGstr1 || '',
    gstApplicableFrom: companyInfo?.gstApplicableFrom || '',
    eWayBillApplicable: companyInfo?.eWayBillApplicable ? 'yes' : 'no',
    eWayBillThresholdLimit: companyInfo?.eWayBillThresholdLimit || '',
    eWayBillIntrastate: companyInfo?.eWayBillIntrastate ? 'yes' : 'no',
    provideLutBond: companyInfo?.provideLutBond ? 'yes' : 'no',
    lutBondNumber: companyInfo?.lutBondNumber || '',
    lutBondValidity: companyInfo?.lutBondValidity || '',
    taxLiabilityOnAdvanceReceipts: companyInfo?.taxLiabilityOnAdvanceReceipts ? 'yes' : 'no',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const stateOptions = [
    { value: '01-jammu-and-kashmir', label: '01 - Jammu & Kashmir' },
    { value: '02-himachal-pradesh', label: '02 - Himachal Pradesh' },
    { value: '03-punjab', label: '03 - Punjab' },
    { value: '04-chandigarh', label: '04 - Chandigarh' },
    { value: '05-uttarakhand', label: '05 - Uttarakhand' },
    { value: '06-haryana', label: '06 - Haryana' },
    { value: '07-delhi', label: '07 - Delhi' },
    { value: '08-rajasthan', label: '08 - Rajasthan' },
    { value: '09-uttar-pradesh', label: '09 - Uttar Pradesh' },
    { value: '10-bihar', label: '10 - Bihar' },
    { value: '11-sikkim', label: '11 - Sikkim' },
    { value: '12-arunachal-pradesh', label: '12 - Arunachal Pradesh' },
    { value: '13-nagaland', label: '13 - Nagaland' },
    { value: '14-manipur', label: '14 - Manipur' },
    { value: '15-mizoram', label: '15 - Mizoram' },
    { value: '16-tripura', label: '16 - Tripura' },
    { value: '17-meghalaya', label: '17 - Meghalaya' },
    { value: '18-assam', label: '18 - Assam' },
    { value: '19-west-bengal', label: '19 - West Bengal' },
    { value: '20-jharkhand', label: '20 - Jharkhand' },
    { value: '21-odisha', label: '21 - Odisha' },
    { value: '22-chhattisgarh', label: '22 - Chhattisgarh' },
    { value: '23-madhya-pradesh', label: '23 - Madhya Pradesh' },
    { value: '24-gujarat', label: '24 - Gujarat' },
    { value: '25-daman-and-diu', label: '25 - Daman & Diu and Dadra & Nagar Haveli' },
    { value: '26-maharashtra', label: '26 - Maharashtra' },
    { value: '27-andhra-pradesh', label: '27 - Andhra Pradesh' },
    { value: '28-karnataka', label: '28 - Karnataka' },
    { value: '29-goa', label: '29 - Goa' },
    { value: '30-lakshadweep', label: '30 - Lakshadweep' },
    { value: '31-kerala', label: '31 - Kerala' },
    { value: '32-tamil-nadu', label: '32 - Tamil Nadu' },
    { value: '33-puducherry', label: '33 - Puducherry' },
    { value: '34-andaman-and-nicobar', label: '34 - Andaman & Nicobar Islands' },
    { value: '35-telangana', label: '35 - Telangana' },
    { value: '36-ladakh', label: '36 - Ladakh' },
  ];

  const registrationTypes = [
    'regular', 'composition', 'consumer', 'unregistered', 'sez',
    'input-service-distributor', 'tax-deductor',
  ].map((type) => ({ value: type, label: type.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));

  const yesNoOptions = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
  ];

  const periodicityOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
  ];

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.registrationType) newErrors.registrationType = 'Registration Type is required';
    if (!formData.gstApplicableFrom) newErrors.gstApplicableFrom = 'GST Applicable From Date is required';
    if (formData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3}$/.test(formData.gstNumber))
      newErrors.gstNumber = 'Valid GSTIN/UIN (15 digits) is required';
    if (formData.eWayBillApplicable === 'yes' && !formData.eWayBillThresholdLimit)
      newErrors.eWayBillThresholdLimit = 'Threshold Limit is required when e-Way Bill is applicable';
    if (formData.provideLutBond === 'yes' && !formData.lutBondNumber)
      newErrors.lutBondNumber = 'LUT/Bond Number is required';
    if (formData.provideLutBond === 'yes' && !formData.lutBondValidity)
      newErrors.lutBondValidity = 'LUT/Bond Validity Period is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fix the errors before submitting.');
      return;
    }
    const companyInfoData: CompanyInfo = {
      name: companyInfo?.name || '',
      financialYear: companyInfo?.financialYear || '',
      booksBeginningYear: companyInfo?.booksBeginningYear || '',
      address: companyInfo?.address || '',
      pin: companyInfo?.pin || '',
      phoneNumber: companyInfo?.phoneNumber || '',
      email: companyInfo?.email || '',
      panNumber: companyInfo?.panNumber || '',
      gstNumber: formData.gstNumber,
      vatNumber: companyInfo?.vatNumber || '',
      state: formData.state,
      country: companyInfo?.country || undefined,
      taxType: companyInfo?.taxType || undefined,
      employeeId: companyInfo?.employeeId || undefined,
      turnover: companyInfo?.turnover || undefined,
      registrationType: formData.registrationType,
      assesseeOfOtherTerritory: formData.assesseeOfOtherTerritory === 'yes',
      periodicityOfGstr1: formData.periodicityOfGstr1,
      gstApplicableFrom: formData.gstApplicableFrom,
      eWayBillApplicable: formData.eWayBillApplicable === 'yes',
      eWayBillThresholdLimit: formData.eWayBillThresholdLimit,
      eWayBillIntrastate: formData.eWayBillIntrastate === 'yes',
      provideLutBond: formData.provideLutBond === 'yes',
      lutBondNumber: formData.lutBondNumber,
      lutBondValidity: formData.lutBondValidity,
      taxLiabilityOnAdvanceReceipts: formData.taxLiabilityOnAdvanceReceipts === 'yes',
      cinNumber: ''
    };
    setCompanyInfo(companyInfoData);
    alert('GST Registration Details saved successfully!');
    navigate('/app/masters');
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="max-w-6xl mx-auto">
          <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/gst')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">GST Calculator</h1>
            </div>
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>GST Registration Details</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                id="state"
                name="state"
                label="State"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
                options={stateOptions}
                icon={<MapPin size={16} />}
                theme={theme}
                error={errors.state}
                title="Select State"
                placeholder="Select state"
              />

              <SelectField
                id="registrationType"
                name="registrationType"
                label="Registration Type"
                value={formData.registrationType}
                onChange={(e) => setFormData({ ...formData, registrationType: e.target.value })}
                required
                options={registrationTypes}
                icon={<CreditCard size={16} />}
                theme={theme}
                error={errors.registrationType}
                title="Select Registration Type"
                placeholder="Select registration type"
              />

              <SelectField
                id="assesseeOfOtherTerritory"
                name="assesseeOfOtherTerritory"
                label="Assessee of Other Territory"
                value={formData.assesseeOfOtherTerritory}
                onChange={(e) => setFormData({ ...formData, assesseeOfOtherTerritory: e.target.value })}
                options={yesNoOptions}
                theme={theme}
                title="Assessee of Other Territory"
              />

              <InputField
                id="gstNumber"
                name="gstNumber"
                label="GSTIN/UIN"
                value={formData.gstNumber}
                onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                icon={<Hash size={16} />}
                theme={theme}
                error={errors.gstNumber}
                title="GSTIN/UIN"
                placeholder="Enter GSTIN/UIN"
              />

              <SelectField
                id="periodicityOfGstr1"
                name="periodicityOfGstr1"
                label="Periodicity of GSTR-1"
                value={formData.periodicityOfGstr1}
                onChange={(e) => setFormData({ ...formData, periodicityOfGstr1: e.target.value })}
                options={periodicityOptions}
                theme={theme}
                error={errors.periodicityOfGstr1}
                title="Select Periodicity of GSTR-1"
                placeholder="Select periodicity"
              />

              <InputField
                id="gstApplicableFrom"
                name="gstApplicableFrom"
                label="GST Applicable From"
                type="date"
                value={formData.gstApplicableFrom}
                onChange={(e) => setFormData({ ...formData, gstApplicableFrom: e.target.value })}
                required
                icon={<Calendar size={16} />}
                theme={theme}
                error={errors.gstApplicableFrom}
                title="GST Applicable From"
              />

              <SelectField
                id="eWayBillApplicable"
                name="eWayBillApplicable"
                label="e-Way Bill Applicable"
                value={formData.eWayBillApplicable}
                onChange={(e) => setFormData({ ...formData, eWayBillApplicable: e.target.value })}
                options={yesNoOptions}
                theme={theme}
                title="e-Way Bill Applicable"
              />

              {formData.eWayBillApplicable === 'yes' && (
                <>
                  <InputField
                    id="eWayBillThresholdLimit"
                    name="eWayBillThresholdLimit"
                    label="e-Way Bill Threshold Limit"
                    type="number"
                    value={formData.eWayBillThresholdLimit}
                    onChange={(e) => setFormData({ ...formData, eWayBillThresholdLimit: e.target.value })}
                    required
                    theme={theme}
                    error={errors.eWayBillThresholdLimit}
                    title="e-Way Bill Threshold Limit"
                    placeholder="Enter threshold limit"
                  />

                  <SelectField
                    id="eWayBillIntrastate"
                    name="eWayBillIntrastate"
                    label="Applicable for Intrastate"
                    value={formData.eWayBillIntrastate}
                    onChange={(e) => setFormData({ ...formData, eWayBillIntrastate: e.target.value })}
                    options={yesNoOptions}
                    theme={theme}
                    title="Applicable for Intrastate"
                  />
                </>
              )}

              <SelectField
                id="provideLutBond"
                name="provideLutBond"
                label="Provide LUT/Bond Details"
                value={formData.provideLutBond}
                onChange={(e) => setFormData({ ...formData, provideLutBond: e.target.value })}
                options={yesNoOptions}
                theme={theme}
                title="Provide LUT/Bond Details"
              />

              {formData.provideLutBond === 'yes' && (
                <>
                  <InputField
                    id="lutBondNumber"
                    name="lutBondNumber"
                    label="LUT/Bond Number"
                    value={formData.lutBondNumber}
                    onChange={(e) => setFormData({ ...formData, lutBondNumber: e.target.value })}
                    required
                    theme={theme}
                    error={errors.lutBondNumber}
                    title="LUT/Bond Number"
                    placeholder="Enter LUT/Bond number"
                  />

                  <InputField
                    id="lutBondValidity"
                    name="lutBondValidity"
                    label="LUT/Bond Validity Period"
                    type="date"
                    value={formData.lutBondValidity}
                    onChange={(e) => setFormData({ ...formData, lutBondValidity: e.target.value })}
                    required
                    icon={<Calendar size={16} />}
                    theme={theme}
                    error={errors.lutBondValidity}
                    title="LUT/Bond Validity Period"
                  />
                </>
              )}

              <SelectField
                id="taxLiabilityOnAdvanceReceipts"
                name="taxLiabilityOnAdvanceReceipts"
                label="Tax Liability on Advance Receipts"
                value={formData.taxLiabilityOnAdvanceReceipts}
                onChange={(e) => setFormData({ ...formData, taxLiabilityOnAdvanceReceipts: e.target.value })}
                options={yesNoOptions}
                theme={theme}
                title="Tax Liability on Advance Receipts"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/app/masters')}
                className={`px-4 py-2 rounded text-sm font-medium flex items-center gap-2 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 text-gray-100 hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GSTRegistration;