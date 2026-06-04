import React, { useState } from 'react';
import { Save, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import type { DeducteeDetails } from './types';

const sectionCodes = [
  { value: '193', label: '193 - Interest on Securities' },
  { value: '194', label: '194 - Dividend' },
  { value: '194A', label: '194A - Interest other than on Securities' },
  { value: '194B', label: '194B - Winnings from Lottery/Crossword' },
  { value: '194BB', label: '194BB - Winnings from Horse Race' },
  { value: '194C', label: '194C - Contractors/Sub-contractors' },
  { value: '194D', label: '194D - Insurance Commission' },
  { value: '194EE', label: '194EE - Payments under NSS' },
  { value: '194F', label: '194F - Repurchase of Units by Mutual Fund' },
  { value: '194G', label: '194G - Commission on lottery tickets' },
  { value: '194H', label: '194H - Commission/Brokerage' },
  { value: '194I', label: '194I - Rent' },
  { value: '194IA', label: '194IA - Transfer of immovable property' },
  { value: '194IB', label: '194IB - Rent paid by individual/HUF' },
  { value: '194IC', label: '194IC - Payment under joint dev agreement' },
  { value: '194J', label: '194J - Fees for Professional/Technical' },
  { value: '194LA', label: '194LA - Compensation on acquisition of property' },
  { value: '194M', label: '194M - Payment of certain sums by Ind/HUF' },
  { value: '194N', label: '194N - Cash withdrawal exceeding limits' },
  { value: '194O', label: '194O - Payment by e-commerce operators' }
];

export const Form26QAnnexure: React.FC = () => {
  const [deductees, setDeductees] = useState<DeducteeDetails[]>([
    {
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
      amountPaidCredited: 0,
      gstIdentificationNo: '',
      remarkCode: ''
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const addDeductee = () => {
    setDeductees(prev => [
      ...prev,
      {
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
        amountPaidCredited: 0,
        gstIdentificationNo: '',
        remarkCode: ''
      }
    ]);
  };

  const removeDeductee = (index: number) => {
    if (deductees.length <= 1) return;
    const updated = deductees.filter((_, i) => i !== index).map((d, i) => ({ ...d, serialNo: i + 1 }));
    setDeductees(updated);
  };

  const handleDeducteeChange = (index: number, field: keyof DeducteeDetails, value: string | number) => {
    const updated = [...deductees];
    const item = { ...updated[index] };

    if (
      field === 'panOfDeductee' || 
      field === 'nameOfDeductee' || 
      field === 'dateOfPayment' || 
      field === 'natureOfPayment' || 
      field === 'sectionUnderDeducted' || 
      field === 'certSerialNo' || 
      field === 'gstIdentificationNo' || 
      field === 'remarkCode'
    ) {
      (item[field] as any) = value;
    } else {
      (item[field] as any) = Number(value) || 0;
    }

    // Auto-calculate Tax if rate is edited, or rate if tax is edited
    if (field === 'amountPaid' || field === 'rateOfDeduction') {
      const rate = Number(item.rateOfDeduction || 0);
      const paid = Number(item.amountPaid || 0);
      item.amountOfTax = Number(((paid * rate) / 100).toFixed(2));
      item.taxDeposited = item.amountOfTax;
    }

    updated[index] = item;
    setDeductees(updated);

    // Clear error
    const errorKey = `deductee_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[errorKey];
        return copy;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    deductees.forEach((d, index) => {
      if (!d.panOfDeductee) {
        newErrors[`deductee_${index}_panOfDeductee`] = 'PAN is required';
      } else if (d.panOfDeductee.length !== 10) {
        newErrors[`deductee_${index}_panOfDeductee`] = 'PAN must be 10 characters';
      }
      if (!d.nameOfDeductee) newErrors[`deductee_${index}_nameOfDeductee`] = 'Name is required';
      if (!d.dateOfPayment) newErrors[`deductee_${index}_dateOfPayment`] = 'Payment date is required';
      if (!d.amountPaid || d.amountPaid <= 0) newErrors[`deductee_${index}_amountPaid`] = 'Amount must be greater than 0';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log('Saving Annexure / Deductee Details:', deductees);
    setSuccessMsg('Annexure (Deducted details) saved successfully!');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const inputClass = "w-full p-2 border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-xs font-semibold";
  const selectClass = "w-full p-2 border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-xs font-semibold";

  return (
    <div className="space-y-6 animate-fadeIn text-black font-arial">
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-black dark:bg-green-900/30 text-green-900 dark:text-green-300 p-4 rounded-lg dark:border-green-800">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-black flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-black">Part C - Annexure (Deducted details)</h3>
            <p className="text-xs text-gray-600 mt-0.5 font-semibold">Details of amount paid/credited and tax deducted at source</p>
          </div>
          <button
            type="button"
            onClick={addDeductee}
            className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-950 text-white font-bold px-3 py-1.5 rounded-lg text-sm border border-black transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Add Deductee
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] border border-black text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-black font-bold border-b border-black">
                  <th className="p-3 w-12 text-center border-r border-black text-xs">S.No.</th>
                  <th className="p-3 w-36 border-r border-black text-xs">PAN of Deductee *</th>
                  <th className="p-3 w-48 border-r border-black text-xs">Name of Deductee *</th>
                  <th className="p-3 w-28 border-r border-black text-xs">Section</th>
                  <th className="p-3 w-32 border-r border-black text-xs">Date of Payment *</th>
                  <th className="p-3 w-32 border-r border-black text-xs">Amount Paid *</th>
                  <th className="p-3 w-24 border-r border-black text-xs">Rate %</th>
                  <th className="p-3 w-32 border-r border-black text-xs">Tax Deducted</th>
                  <th className="p-3 w-32 border-r border-black text-xs">Tax Deposited</th>
                  <th className="p-3 w-36 border-r border-black text-xs">Nature of Payment</th>
                  <th className="p-3 w-32 border-r border-black text-xs">Certificate No.</th>
                  <th className="p-3 w-36 border-r border-black text-xs">GSTIN</th>
                  <th className="p-3 w-16 text-center text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {deductees.map((deductee, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-center font-bold text-black border-r border-black">{deductee.serialNo}</td>
                    
                    <td className="p-2 border-r border-black">
                      <input
                        type="text"
                        value={deductee.panOfDeductee}
                        onChange={(e) => handleDeducteeChange(index, 'panOfDeductee', e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className={`${inputClass} uppercase font-mono ${errors[`deductee_${index}_panOfDeductee`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="text"
                        value={deductee.nameOfDeductee}
                        onChange={(e) => handleDeducteeChange(index, 'nameOfDeductee', e.target.value)}
                        placeholder="Name of Deductee"
                        className={`${inputClass} ${errors[`deductee_${index}_nameOfDeductee`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <select
                        value={deductee.sectionUnderDeducted}
                        onChange={(e) => handleDeducteeChange(index, 'sectionUnderDeducted', e.target.value)}
                        className={selectClass}
                      >
                        {sectionCodes.map(section => (
                          <option key={section.value} value={section.value}>{section.value}</option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="date"
                        value={deductee.dateOfPayment}
                        onChange={(e) => handleDeducteeChange(index, 'dateOfPayment', e.target.value)}
                        className={`${inputClass} ${errors[`deductee_${index}_dateOfPayment`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={deductee.amountPaid || ''}
                        onChange={(e) => handleDeducteeChange(index, 'amountPaid', e.target.value)}
                        placeholder="0.00"
                        className={`${inputClass} ${errors[`deductee_${index}_amountPaid`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={deductee.rateOfDeduction || ''}
                        onChange={(e) => handleDeducteeChange(index, 'rateOfDeduction', e.target.value)}
                        placeholder="%"
                        max={100}
                        step="0.01"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={deductee.amountOfTax || ''}
                        onChange={(e) => handleDeducteeChange(index, 'amountOfTax', e.target.value)}
                        placeholder="Tax"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={deductee.taxDeposited || ''}
                        onChange={(e) => handleDeducteeChange(index, 'taxDeposited', e.target.value)}
                        placeholder="Deposited"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="text"
                        value={deductee.natureOfPayment}
                        onChange={(e) => handleDeducteeChange(index, 'natureOfPayment', e.target.value)}
                        placeholder="e.g. Contract Payment"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="text"
                        value={deductee.certSerialNo || ''}
                        onChange={(e) => handleDeducteeChange(index, 'certSerialNo', e.target.value)}
                        placeholder="Cert No."
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="text"
                        value={deductee.gstIdentificationNo || ''}
                        onChange={(e) => handleDeducteeChange(index, 'gstIdentificationNo', e.target.value.toUpperCase())}
                        placeholder="GSTIN"
                        maxLength={15}
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeDeductee(index)}
                        disabled={deductees.length <= 1}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove Deductee"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Validation Alert */}
          {Object.keys(errors).length > 0 && (
            <div className="mt-4 flex items-start gap-2 text-red-755 bg-white border border-red-600 p-3 rounded-lg text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Please correct the following errors:</span>
                <ul className="list-disc ml-4 mt-1">
                  {Object.entries(errors).map(([key, val]) => (
                    <li key={key}>{val}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-905 text-white font-bold px-6 py-3 rounded-lg border border-black shadow-sm transition-colors cursor-pointer dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-100"
        >
          <Save size={18} />
          Save Deductees / Annexure
        </button>
      </div>
    </div>
  );
};
