import React, { useState, useMemo } from 'react';
import { Save, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import type { ChallanDetails } from './types';

export const Form26QChallan: React.FC = () => {
  const [challans, setChallans] = useState<ChallanDetails[]>([
    {
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
      status: 'Deposited'
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMsg, setSuccessMsg] = useState('');

  const addChallan = () => {
    setChallans(prev => [
      ...prev,
      {
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
        status: 'Deposited'
      }
    ]);
  };

  const removeChallan = (index: number) => {
    if (challans.length <= 1) return;
    const updated = challans.filter((_, i) => i !== index).map((c, i) => ({ ...c, serialNo: i + 1 }));
    setChallans(updated);
  };

  const handleChallanChange = (index: number, field: keyof ChallanDetails, value: string | number) => {
    const updated = [...challans];
    const item = { ...updated[index] };

    if (field === 'status' || field === 'bsrCode' || field === 'dateOfDeposit' || field === 'challanSerialNo') {
      (item[field] as any) = value;
    } else {
      (item[field] as any) = Number(value) || 0;
    }

    // Auto-calculate total
    item.total = Number(item.tax || 0) + 
                 Number(item.surcharge || 0) + 
                 Number(item.educationCess || 0) + 
                 Number(item.other || 0) + 
                 Number(item.interest || 0) + 
                 Number(item.penalty || 0) + 
                 Number(item.fee || 0);

    updated[index] = item;
    setChallans(updated);

    // Clear error
    const errorKey = `challan_${index}_${field}`;
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
    challans.forEach((c, index) => {
      if (!c.bsrCode) newErrors[`challan_${index}_bsrCode`] = 'BSR Code is required';
      if (!c.dateOfDeposit) newErrors[`challan_${index}_dateOfDeposit`] = 'Date is required';
      if (!c.challanSerialNo) newErrors[`challan_${index}_challanSerialNo`] = 'Serial No is required';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    console.log('Saving Challans:', challans);
    setSuccessMsg('Challan details saved successfully!');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const inputClass = "w-full p-2 border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-xs font-semibold";
  const selectClass = "w-full p-2 border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-xs font-semibold";

  return (
    <div className="space-y-6 animate-fadeIn text-black font-arial">
      {successMsg && (
        <div className="flex items-center gap-2 bg-green-50 border border-black text-green-900 p-4 rounded-lg">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-semibold">{successMsg}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-black flex justify-between items-center">
          <h3 className="text-lg font-bold text-black">Part B - Details of Tax Deposited</h3>
          <button
            type="button"
            onClick={addChallan}
            className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-900 text-white font-bold px-3 py-1.5 rounded-lg text-sm border border-black transition-colors cursor-pointer"
          >
            <Plus size={16} />
            Add Challan
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border border-black text-left text-sm">
              <thead>
                <tr className="bg-gray-50 text-black font-bold border-b border-black">
                  <th className="p-3 w-12 text-center border-r border-black text-xs">S.No.</th>
                  <th className="p-3 w-36 border-r border-black text-xs">BSR Code *</th>
                  <th className="p-3 w-36 border-r border-black text-xs">Date of Deposit *</th>
                  <th className="p-3 w-32 border-r border-black text-xs">Challan No. *</th>
                  <th className="p-3 w-24 border-r border-black text-xs">Tax</th>
                  <th className="p-3 w-24 border-r border-black text-xs">Surcharge</th>
                  <th className="p-3 w-24 border-r border-black text-xs">Cess</th>
                  <th className="p-3 w-24 border-r border-black text-xs">Interest</th>
                  <th className="p-3 w-24 border-r border-black text-xs">Penalty</th>
                  <th className="p-3 w-24 border-r border-black text-xs">Fee</th>
                  <th className="p-3 w-32 border-r border-black text-xs">Total</th>
                  <th className="p-3 w-36 border-r border-black text-xs">Status</th>
                  <th className="p-3 w-16 text-center text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {challans.map((challan, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3 text-center font-bold text-black border-r border-black">{challan.serialNo}</td>
                    
                    <td className="p-2 border-r border-black">
                      <input
                        type="text"
                        value={challan.bsrCode}
                        onChange={(e) => handleChallanChange(index, 'bsrCode', e.target.value)}
                        placeholder="7-digit BSR"
                        maxLength={7}
                        className={`${inputClass} ${errors[`challan_${index}_bsrCode`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="date"
                        value={challan.dateOfDeposit}
                        onChange={(e) => handleChallanChange(index, 'dateOfDeposit', e.target.value)}
                        className={`${inputClass} ${errors[`challan_${index}_dateOfDeposit`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="text"
                        value={challan.challanSerialNo}
                        onChange={(e) => handleChallanChange(index, 'challanSerialNo', e.target.value)}
                        placeholder="5-digit No"
                        maxLength={5}
                        className={`${inputClass} ${errors[`challan_${index}_challanSerialNo`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={challan.tax}
                        onChange={(e) => handleChallanChange(index, 'tax', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={challan.surcharge}
                        onChange={(e) => handleChallanChange(index, 'surcharge', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={challan.educationCess}
                        onChange={(e) => handleChallanChange(index, 'educationCess', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={challan.interest}
                        onChange={(e) => handleChallanChange(index, 'interest', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={challan.penalty}
                        onChange={(e) => handleChallanChange(index, 'penalty', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-2 border-r border-black">
                      <input
                        type="number"
                        value={challan.fee}
                        onChange={(e) => handleChallanChange(index, 'fee', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    <td className="p-3 font-bold text-black border-r border-black">
                      ₹{challan.total.toLocaleString()}
                    </td>

                    <td className="p-2 border-r border-black">
                      <select
                        value={challan.status}
                        onChange={(e) => handleChallanChange(index, 'status', e.target.value)}
                        className={selectClass}
                      >
                        <option value="Deposited">Deposited</option>
                        <option value="Book Adjustment">Book Adjustment</option>
                      </select>
                    </td>

                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeChallan(index)}
                        disabled={challans.length <= 1}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Remove Challan"
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
            <div className="mt-4 flex items-start gap-2 text-red-700 bg-white border border-red-600 p-3 rounded-lg text-xs font-semibold">
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
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-900 text-white font-bold px-6 py-3 rounded-lg border border-black shadow-sm transition-colors cursor-pointer dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-100"
        >
          <Save size={18} />
          Save Challan List
        </button>
      </div>
    </div>
  );
};
