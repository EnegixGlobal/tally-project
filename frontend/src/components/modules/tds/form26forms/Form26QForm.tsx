import React, { useState, useEffect, useRef } from 'react';
import { Save, User, Shield, Phone, MapPin, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import type { DeductorDetails, Verification } from './types';
import { useCompany } from '../../../../context/CompanyContext';

const assessmentYears = [
  { value: '2026-27', label: 'AY 2026-27 (FY 2025-26)' },
  { value: '2025-26', label: 'AY 2025-26 (FY 2024-25)' },
  { value: '2024-25', label: 'AY 2024-25 (FY 2023-24)' }
];

const financialYears = [
  { value: '2025-26', label: 'FY 2025-26 (AY 2026-27)' },
  { value: '2024-25', label: 'FY 2024-25 (AY 2025-26)' },
  { value: '2023-24', label: 'FY 2023-24 (AY 2024-25)' }
];

const deductorCategories = [
  { value: 'Individual/HUF', label: 'Individual/HUF' },
  { value: 'Company', label: 'Company' },
  { value: 'Firm', label: 'Firm' },
  { value: 'AOP/BOI', label: 'AOP/BOI' },
  { value: 'Local Authority', label: 'Local Authority' },
  { value: 'Artificial Juridical Person', label: 'Artificial Juridical Person' },
  { value: 'Govt', label: 'Government' },
  { value: 'Others', label: 'Others' }
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

const ministryNames = [
  { value: 'Civil', label: 'Civil' },
  { value: 'Defense', label: 'Defense' },
  { value: 'Post & Telegraph', label: 'Post & Telegraph' },
  { value: 'Railways', label: 'Railways' },
  { value: 'Others', label: 'Others' }
];

const findStateCode = (stateStr: string): string => {
  if (!stateStr) return 'JH';
  const cleanState = stateStr.toLowerCase();
  
  const foundByLabel = states.find(s => 
    cleanState.includes(s.label.toLowerCase())
  );
  if (foundByLabel) return foundByLabel.value;

  const foundByCode = states.find(s => {
    const code = s.value.toLowerCase();
    return cleanState === code || new RegExp(`\\b${code}\\b`).test(cleanState);
  });
  if (foundByCode) return foundByCode.value;

  return 'JH';
};

export const Form26QForm: React.FC = () => {
  const { companyInfo } = useCompany();
  const formRef = useRef<HTMLFormElement>(null);

  const [deductor, setDeductor] = useState<DeductorDetails>({
    quarter: 'Q4',
    tan: '',
    financialYear: '2025-26',
    lastTan: '',
    assessmentYear: '2026-27',
    panOfDeductor: '',
    category: 'Individual/HUF',
    revisedReturn: 'No',
    lastDeductorType: '',
    updateDeductorDetails: '',
    receiptNoOriginal: '',
    receiptNoPrevious: '',

    deductorName: '',
    branchSrlNo: '',
    paoCode: '',
    paoRegistrationNo: '',
    gstn: '',
    ministryDeptName: '',
    ministryDeptOthers: '',
    ddoCode: '',
    ddoRegistrationNo: '',
    ain: '',
    hasAddressChanged: 'No',

    address: {
      flatNo: '',
      premisesName: '',
      roadStreet: '',
      area: '',
      town: '',
      state: 'JH',
      country: 'India',
      pinCode: ''
    },
    stdCodeNo: '',
    telephoneNo: '',
    stdCodeNoAlternate: '',
    telephoneNoAlternate: '',
    email: '',
    alternateEmail: '',

    responsiblePerson: {
      sameAsAbove: false,
      status: 'Deductor',
      designation: '',
      name: '',
      fatherName: '',
      pan: '',
      address: {
        flatNo: '',
        premisesName: '',
        roadStreet: '',
        area: '',
        town: '',
        state: 'JH',
        country: 'India',
        pinCode: ''
      },
      stdCodeNo: '',
      telephoneNo: '',
      email: ''
    }
  });

  const [verification, setVerification] = useState<Verification>({
    capacity: 'Deductor',
    declarationPlace: '',
    declarationDate: new Date().toISOString().split('T')[0],
    fullName: '',
    designation: '',
    signature: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (companyInfo) {
      const mappedState = findStateCode(companyInfo.state);
      
      let fy = '2025-26';
      let ay = '2026-27';
      if (companyInfo.financialYear) {
        if (companyInfo.financialYear.includes('2025-26')) {
          fy = '2025-26';
          ay = '2026-27';
        } else if (companyInfo.financialYear.includes('2024-25')) {
          fy = '2024-25';
          ay = '2025-26';
        } else if (companyInfo.financialYear.includes('2023-24')) {
          fy = '2023-24';
          ay = '2024-25';
        }
      }
      
      let std = '';
      let phone = companyInfo.phoneNumber || companyInfo.phone_number || '';
      if (phone.includes('-')) {
        const parts = phone.split('-');
        std = parts[0].trim();
        phone = parts.slice(1).join('-').trim();
      }

      setDeductor(prev => {
        const updated = {
          ...prev,
          tan: companyInfo.tanNumber || companyInfo.tan_number || prev.tan,
          financialYear: fy,
          assessmentYear: ay,
          panOfDeductor: companyInfo.panNumber || companyInfo.pan_number || prev.panOfDeductor,
          deductorName: companyInfo.name || prev.deductorName,
          gstn: companyInfo.gstNumber || companyInfo.gst_number || prev.gstn,
          email: companyInfo.email || prev.email,
          stdCodeNo: std || prev.stdCodeNo,
          telephoneNo: phone || prev.telephoneNo,
          address: {
            ...prev.address,
            flatNo: companyInfo.address || prev.address.flatNo,
            state: mappedState,
            pinCode: companyInfo.pin || prev.address.pinCode,
            country: companyInfo.country || prev.address.country
          }
        };

        if (updated.responsiblePerson.sameAsAbove) {
          updated.responsiblePerson = {
            ...updated.responsiblePerson,
            name: updated.deductorName,
            pan: updated.panOfDeductor,
            stdCodeNo: updated.stdCodeNo,
            telephoneNo: updated.telephoneNo,
            email: updated.email,
            address: { ...updated.address }
          };
        }

        return updated;
      });
    }
  }, [companyInfo]);

  useEffect(() => {
    if (!formRef.current) return;

    const elements = formRef.current.querySelectorAll('input, select, textarea');
    elements.forEach((el: any) => {
      if (el.type === 'checkbox' || el.type === 'submit' || el.type === 'button') return;

      const hasValue = el.value && el.value.trim() !== '';
      
      const name = el.getAttribute('name');
      let hasError = false;
      if (name) {
        if (errors[name]) hasError = true;
        const parts = name.split('.');
        const lastPart = parts[parts.length - 1];
        if (errors[lastPart]) hasError = true;
      }

      if (hasError) {
        el.style.borderColor = '';
        el.style.borderWidth = '';
        el.style.backgroundColor = '';
        el.classList.remove('border-green-600', 'focus:border-green-600', 'focus:ring-green-500', 'border-2');
      } else if (hasValue) {
        el.style.borderColor = '#16a34a';
        el.style.borderWidth = '2px';
        el.style.backgroundColor = '#f3f4f6';
        el.classList.remove('border-black', 'focus:border-blue-500', 'focus:ring-blue-500');
        el.classList.add('border-green-600', 'focus:border-green-600', 'focus:ring-green-500', 'border-2');
      } else {
        el.style.borderColor = '';
        el.style.borderWidth = '';
        el.style.backgroundColor = '';
        el.classList.remove('border-green-600', 'focus:border-green-600', 'focus:ring-green-500', 'border-2');
        el.classList.add('border-black');
      }
    });
  }, [deductor, verification, errors]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setDeductor(prev => {
      let updated = { ...prev };
      
      if (name.startsWith('address.')) {
        const field = name.split('.')[1];
        updated.address = { ...updated.address, [field]: value };
      } else if (name.startsWith('responsiblePerson.address.')) {
        const field = name.split('.')[2];
        updated.responsiblePerson = {
          ...updated.responsiblePerson,
          address: { ...updated.responsiblePerson.address, [field]: value }
        };
      } else if (name.startsWith('responsiblePerson.')) {
        const field = name.split('.')[1];
        updated.responsiblePerson = {
          ...updated.responsiblePerson,
          [field]: value
        };
      } else {
        (updated as any)[name] = value;
        // Auto sync assessment year when financial year changes
        if (name === 'financialYear') {
          if (value === '2025-26') updated.assessmentYear = '2026-27';
          if (value === '2024-25') updated.assessmentYear = '2025-26';
          if (value === '2023-24') updated.assessmentYear = '2024-25';
        }
      }

      // Handle "Same as Above" checkbox synchronisation
      if (updated.responsiblePerson.sameAsAbove) {
        updated.responsiblePerson = {
          ...updated.responsiblePerson,
          name: updated.deductorName,
          pan: updated.panOfDeductor,
          stdCodeNo: updated.stdCodeNo,
          telephoneNo: updated.telephoneNo,
          email: updated.email,
          address: { ...updated.address }
        };
      }

      return updated;
    });

    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const handleSameAsAboveToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setDeductor(prev => {
      const updated = { ...prev };
      updated.responsiblePerson = {
        ...updated.responsiblePerson,
        sameAsAbove: checked,
        name: checked ? prev.deductorName : '',
        pan: checked ? prev.panOfDeductor : '',
        stdCodeNo: checked ? prev.stdCodeNo : '',
        telephoneNo: checked ? prev.telephoneNo : '',
        email: checked ? prev.email : '',
        address: checked ? { ...prev.address } : {
          flatNo: '',
          premisesName: '',
          roadStreet: '',
          area: '',
          town: '',
          state: 'JH',
          country: 'India',
          pinCode: ''
        }
      };
      return updated;
    });
  };

  const handleVerificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setVerification(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!deductor.tan) newErrors.tan = 'TAN is required';
    if (!deductor.panOfDeductor) newErrors.panOfDeductor = 'PAN of deductor is required';
    if (!deductor.deductorName) newErrors.deductorName = 'Deductor Name is required';
    if (!deductor.address.flatNo) newErrors.flatNo = 'Flat No. is required';
    if (!deductor.address.pinCode) newErrors.pinCode = 'PIN Code is required';
    if (!deductor.responsiblePerson.name) newErrors['responsiblePerson.name'] = 'Responsible Person name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log('Saving comprehensive Form 26Q:', { deductor, verification });
    setSuccessMsg('Form 26Q particulars saved successfully!');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  // High-contrast input fields ALWAYS white background and black text/borders (in both light and dark modes)
  const inputClass = "w-full p-2.5 rounded-lg border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 font-semibold";
  const disabledInputClass = "w-full p-2.5 rounded-lg border bg-gray-100 text-gray-700 border-black cursor-not-allowed outline-none font-semibold";
  const cardBorderClass = "bg-white rounded-xl shadow-sm border border-black overflow-hidden";
  const headerBorderClass = "bg-gray-50 px-6 py-4 border-b border-black flex items-center gap-3";

  return (
    <form ref={formRef} onSubmit={handleSave} className="space-y-8 animate-fadeIn text-black">
      
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-black text-green-900 p-4 rounded-lg">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      {/* 1. Particulars of Statement */}
      <div className={cardBorderClass}>
        <div className={headerBorderClass}>
          <Shield className="text-black h-5 w-5" />
          <h3 className="text-lg font-bold text-black">1. Particulars of Statement</h3>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">For Quarter Ended *</label>
            <select
              name="quarter"
              value={deductor.quarter}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Q1">Q1 (Apr - Jun)</option>
              <option value="Q2">Q2 (Jul - Sep)</option>
              <option value="Q3">Q3 (Oct - Dec)</option>
              <option value="Q4">Q4 (Jan - Mar)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Tax Deduction and Collection Account No. (TAN) *</label>
            <input
              type="text"
              name="tan"
              value={deductor.tan}
              onChange={handleChange}
              placeholder="e.g. RCHP02179C"
              maxLength={10}
              className={`${inputClass} uppercase font-mono ${errors.tan ? 'border-red-650' : ''}`}
            />
            {errors.tan && <p className="text-red-600 font-semibold text-xs mt-1">{errors.tan}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Financial Year *</label>
            <select
              name="financialYear"
              value={deductor.financialYear}
              onChange={handleChange}
              className={inputClass}
            >
              {financialYears.map(fy => (
                <option key={fy.value} value={fy.value}>{fy.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Last Tax Deduction and Collection Account No.</label>
            <input
              type="text"
              name="lastTan"
              value={deductor.lastTan}
              onChange={handleChange}
              placeholder="Previous TAN if changed"
              maxLength={10}
              className={`${inputClass} uppercase font-mono`}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Assessment Year *</label>
            <input
              type="text"
              name="assessmentYear"
              value={deductor.assessmentYear}
              readOnly
              className="w-full p-2.5 rounded-lg border bg-gray-105 text-gray-700 border-black font-bold cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Permanent Account Number (PAN) *</label>
            <input
              type="text"
              name="panOfDeductor"
              value={deductor.panOfDeductor}
              onChange={handleChange}
              placeholder="e.g. AGUPJ4802D"
              maxLength={10}
              className={`${inputClass} uppercase font-mono ${errors.panOfDeductor ? 'border-red-650' : ''}`}
            />
            {errors.panOfDeductor && <p className="text-red-600 font-semibold text-xs mt-1">{errors.panOfDeductor}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Type of Deductor *</label>
            <select
              name="category"
              value={deductor.category}
              onChange={handleChange}
              className={inputClass}
            >
              {deductorCategories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Is this a Revised Return ( Yes / No )</label>
            <select
              name="revisedReturn"
              value={deductor.revisedReturn}
              onChange={handleChange}
              className={`${inputClass} font-semibold`}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Last Deductor Type</label>
            <input
              type="text"
              name="lastDeductorType"
              value={deductor.lastDeductorType}
              onChange={handleChange}
              placeholder="Previous Deductor Type if any"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Update Deductor Details</label>
            <select
              name="updateDeductorDetails"
              value={deductor.updateDeductorDetails}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">--Select--</option>
              <option value="Address">Change in Address</option>
              <option value="Name">Change in Name</option>
              <option value="Both">Both</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:col-span-2">
            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Receipt Number of Original Return</label>
              <input
                type="text"
                name="receiptNoOriginal"
                value={deductor.receiptNoOriginal}
                onChange={handleChange}
                placeholder="Receipt No. of original return"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Receipt Number of Previous Return</label>
              <input
                type="text"
                name="receiptNoPrevious"
                value={deductor.receiptNoPrevious}
                onChange={handleChange}
                placeholder="Receipt No. of previous return"
                className={inputClass}
              />
            </div>
          </div>

        </div>
      </div>

      {/* 2. Particulars of Deductor ( Employer ) */}
      <div className={cardBorderClass}>
        <div className={headerBorderClass}>
          <MapPin className="text-black h-5 w-5" />
          <h3 className="text-lg font-bold text-black">2. Particulars of Deductor ( Employer )</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Name *</label>
              <input
                type="text"
                name="deductorName"
                value={deductor.deductorName}
                onChange={handleChange}
                placeholder="Name of Deductor"
                className={`${inputClass} ${errors.deductorName ? 'border-red-650' : ''}`}
              />
              {errors.deductorName && <p className="text-red-600 font-semibold text-xs mt-1">{errors.deductorName}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Branch / Division (If any) *</label>
              <input
                type="text"
                name="branchSrlNo"
                value={deductor.branchSrlNo}
                onChange={handleChange}
                placeholder="e.g. Head Office / Branch Office"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Ministry / Dept. Name</label>
              <select
                name="ministryDeptName"
                value={deductor.ministryDeptName}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">--Select--</option>
                {ministryNames.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Ministry / Dept. Name ( Others )</label>
              <input
                type="text"
                name="ministryDeptOthers"
                value={deductor.ministryDeptOthers}
                onChange={handleChange}
                placeholder="If others, specify name"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">DDO Code</label>
              <input
                type="text"
                name="ddoCode"
                value={deductor.ddoCode}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">DDO Registration Number</label>
              <input
                type="text"
                name="ddoRegistrationNo"
                value={deductor.ddoRegistrationNo}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">PAO Code</label>
              <input
                type="text"
                name="paoCode"
                value={deductor.paoCode}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">PAO Registration Number</label>
              <input
                type="text"
                name="paoRegistrationNo"
                value={deductor.paoRegistrationNo}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Flat/Door/Block No. *</label>
              <input
                type="text"
                name="address.flatNo"
                value={deductor.address.flatNo}
                onChange={handleChange}
                className={`${inputClass} ${errors.flatNo ? 'border-red-650' : ''}`}
              />
              {errors.flatNo && <p className="text-red-600 font-semibold text-xs mt-1">{errors.flatNo}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Road / Street / Lane</label>
              <input
                type="text"
                name="address.roadStreet"
                value={deductor.address.roadStreet}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Name of Premises / Building</label>
              <input
                type="text"
                name="address.premisesName"
                value={deductor.address.premisesName}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Area / Location</label>
              <input
                type="text"
                name="address.area"
                value={deductor.address.area}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Town / City / District</label>
              <input
                type="text"
                name="address.town"
                value={deductor.address.town}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">State *</label>
              <select
                name="address.state"
                value={deductor.address.state}
                onChange={handleChange}
                className={inputClass}
              >
                {states.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">PIN Code *</label>
              <input
                type="text"
                name="address.pinCode"
                value={deductor.address.pinCode}
                onChange={handleChange}
                maxLength={6}
                placeholder="6-digit PIN"
                className={`${inputClass} ${errors.pinCode ? 'border-red-650' : ''}`}
              />
              {errors.pinCode && <p className="text-red-600 font-semibold text-xs mt-1">{errors.pinCode}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Goods and Services Tax Number (GSTN)</label>
              <input
                type="text"
                name="gstn"
                value={deductor.gstn}
                onChange={handleChange}
                placeholder="15-digit GSTIN"
                maxLength={15}
                className={`${inputClass} uppercase font-mono`}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Telephone No.</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="stdCodeNo"
                  value={deductor.stdCodeNo}
                  onChange={handleChange}
                  placeholder="STD"
                  className="w-24 p-2.5 rounded-lg border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 text-center outline-none font-medium"
                />
                <input
                  type="text"
                  name="telephoneNo"
                  value={deductor.telephoneNo}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="flex-1 p-2.5 rounded-lg border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Telephone No. ( Alternate )</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="stdCodeNoAlternate"
                  value={deductor.stdCodeNoAlternate}
                  onChange={handleChange}
                  placeholder="STD"
                  className="w-24 p-2.5 rounded-lg border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 text-center outline-none font-medium"
                />
                <input
                  type="text"
                  name="telephoneNoAlternate"
                  value={deductor.telephoneNoAlternate}
                  onChange={handleChange}
                  placeholder="Phone"
                  className="flex-1 p-2.5 rounded-lg border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">E-mail</label>
              <input
                type="email"
                name="email"
                value={deductor.email}
                onChange={handleChange}
                placeholder="Primary email"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">E-mail ( Alternate )</label>
              <input
                type="email"
                name="alternateEmail"
                value={deductor.alternateEmail}
                onChange={handleChange}
                placeholder="Alternate email"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Account Office Identification Number ( AIN ) of PAO/TO/CDDO</label>
              <input
                type="text"
                name="ain"
                value={deductor.ain}
                onChange={handleChange}
                className={`${inputClass} font-mono`}
              />
            </div>

            <div>
              <label className="block text-sm font-bold mb-1.5 text-black">Has Address Changed Since Last Return *</label>
              <select
                name="hasAddressChanged"
                value={deductor.hasAddressChanged}
                onChange={handleChange}
                className={`${inputClass} font-semibold`}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Particulars of the Person Responsible for Deduction of Tax */}
      <div className={cardBorderClass}>
        <div className="bg-gray-50 px-6 py-4 border-b border-black flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <User className="text-black h-5 w-5" />
            <h3 className="text-lg font-bold text-black">3. Particulars of the Person Responsible for Deduction of Tax</h3>
          </div>
          
          <label className="inline-flex items-center space-x-2 bg-white border border-black px-3 py-1.5 rounded-lg text-xs font-bold text-black select-none cursor-pointer">
            <input
              type="checkbox"
              name="responsiblePerson.sameAsAbove"
              checked={deductor.responsiblePerson.sameAsAbove}
              onChange={handleSameAsAboveToggle}
              className="rounded text-black border-black focus:ring-blue-500 cursor-pointer h-4 w-4"
            />
            <span className="flex items-center gap-1">
              <Copy size={12} />
              Same as above
            </span>
          </label>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Name *</label>
            <input
              type="text"
              name="responsiblePerson.name"
              value={deductor.responsiblePerson.name}
              onChange={handleChange}
              disabled={deductor.responsiblePerson.sameAsAbove}
              placeholder="Responsible Person Name"
              className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : `${inputClass} ${errors['responsiblePerson.name'] ? 'border-red-500' : ''}`}
            />
            {errors['responsiblePerson.name'] && <p className="text-red-600 font-semibold text-xs mt-1">{errors['responsiblePerson.name']}</p>}
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Father's Name</label>
            <input
              type="text"
              name="responsiblePerson.fatherName"
              value={deductor.responsiblePerson.fatherName}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">Designation</label>
            <input
              type="text"
              name="responsiblePerson.designation"
              value={deductor.responsiblePerson.designation}
              onChange={handleChange}
              placeholder="e.g. Managing Director / DDO / Partner"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-1.5 text-black">PAN of Responsible Person</label>
            <input
              type="text"
              name="responsiblePerson.pan"
              value={deductor.responsiblePerson.pan}
              onChange={handleChange}
              disabled={deductor.responsiblePerson.sameAsAbove}
              placeholder="10-digit PAN"
              maxLength={10}
              className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : `${inputClass} uppercase font-mono`}
            />
          </div>

          {/* Sub-address of responsible person */}
          <div className="md:col-span-2 border-t border-black pt-6 mt-2">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2 text-black">
              <MapPin size={16} className="text-black" />
              Address & Contact of Responsible Person
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">Flat/Door/Block No.</label>
                <input
                  type="text"
                  name="responsiblePerson.address.flatNo"
                  value={deductor.responsiblePerson.address.flatNo}
                  onChange={handleChange}
                  disabled={deductor.responsiblePerson.sameAsAbove}
                  className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">Premises / Building</label>
                <input
                  type="text"
                  name="responsiblePerson.address.premisesName"
                  value={deductor.responsiblePerson.address.premisesName}
                  onChange={handleChange}
                  disabled={deductor.responsiblePerson.sameAsAbove}
                  className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">Road / Street / Lane</label>
                <input
                  type="text"
                  name="responsiblePerson.address.roadStreet"
                  value={deductor.responsiblePerson.address.roadStreet}
                  onChange={handleChange}
                  disabled={deductor.responsiblePerson.sameAsAbove}
                  className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">Area / Location</label>
                <input
                  type="text"
                  name="responsiblePerson.address.area"
                  value={deductor.responsiblePerson.address.area}
                  onChange={handleChange}
                  disabled={deductor.responsiblePerson.sameAsAbove}
                  className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">Town / City / District</label>
                <input
                  type="text"
                  name="responsiblePerson.address.town"
                  value={deductor.responsiblePerson.address.town}
                  onChange={handleChange}
                  disabled={deductor.responsiblePerson.sameAsAbove}
                  className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">State</label>
                <select
                  name="responsiblePerson.address.state"
                  value={deductor.responsiblePerson.address.state}
                  onChange={handleChange}
                  disabled={deductor.responsiblePerson.sameAsAbove}
                  className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                >
                  {states.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">PIN Code</label>
                <input
                  type="text"
                  name="responsiblePerson.address.pinCode"
                  value={deductor.responsiblePerson.address.pinCode}
                  onChange={handleChange}
                  disabled={deductor.responsiblePerson.sameAsAbove}
                  maxLength={6}
                  className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">E-mail</label>
                <input
                  type="email"
                  name="responsiblePerson.email"
                  value={deductor.responsiblePerson.email}
                  onChange={handleChange}
                  disabled={deductor.responsiblePerson.sameAsAbove}
                  placeholder="Primary Email"
                  className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1.5 text-black">Telephone No.</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="responsiblePerson.stdCodeNo"
                    value={deductor.responsiblePerson.stdCodeNo}
                    onChange={handleChange}
                    disabled={deductor.responsiblePerson.sameAsAbove}
                    placeholder="STD"
                    className={deductor.responsiblePerson.sameAsAbove ? "w-24 p-2.5 rounded-lg border bg-gray-100 text-gray-500 border-gray-400 outline-none text-center font-medium" : "w-24 p-2.5 rounded-lg border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 text-center outline-none font-medium"}
                  />
                  <input
                    type="text"
                    name="responsiblePerson.telephoneNo"
                    value={deductor.responsiblePerson.telephoneNo}
                    onChange={handleChange}
                    disabled={deductor.responsiblePerson.sameAsAbove}
                    placeholder="Phone"
                    className={deductor.responsiblePerson.sameAsAbove ? disabledInputClass : inputClass}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>


      <div className="flex justify-end pt-4">
        <button
          type="submit"
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 text-white font-bold px-6 py-3 rounded-lg border border-black shadow-sm transition-colors cursor-pointer dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-100"
        >
          <Save size={18} />
          Save NSDL Form 26Q
        </button>
      </div>
    </form>
  );
};
