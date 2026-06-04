import React, { useState } from 'react';
import { Save, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import type { ChallanDetails } from './types';

export const Form26QChallan: React.FC = () => {
  const [challans, setChallans] = useState<ChallanDetails[]>([
    {
      serialNo: 1,
      updateMode: 'Add',
      sectionCode: '94C',
      tax: 0,
      surcharge: 0,
      educationCess: 0,
      interest: 0,
      fee: 0,
      penalty: 0,
      lastTotalTaxDeposited: 0,
      total: 0,
      chequeDDNo: '',
      lastBSRCode: '',
      bsrCode: '',
      lastDateOfDeposit: '',
      dateOfDeposit: '',
      lastChallanSerialNo: '',
      challanSerialNo: '',
      bookAdjustment: 'No',
      interestAllocated: 0,
      other: 0,
      minorHead: '200',
      challanBalance: 0,
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
        updateMode: 'Add',
        sectionCode: '94C',
        tax: 0,
        surcharge: 0,
        educationCess: 0,
        interest: 0,
        fee: 0,
        penalty: 0,
        lastTotalTaxDeposited: 0,
        total: 0,
        chequeDDNo: '',
        lastBSRCode: '',
        bsrCode: '',
        lastDateOfDeposit: '',
        dateOfDeposit: '',
        lastChallanSerialNo: '',
        challanSerialNo: '',
        bookAdjustment: 'No',
        interestAllocated: 0,
        other: 0,
        minorHead: '200',
        challanBalance: 0,
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

    const stringFields: (keyof ChallanDetails)[] = [
      'updateMode', 'sectionCode', 'chequeDDNo', 'lastBSRCode', 'bsrCode',
      'lastDateOfDeposit', 'dateOfDeposit', 'lastChallanSerialNo', 'challanSerialNo',
      'bookAdjustment', 'minorHead', 'status', 'transferVoucherNo'
    ];

    if (stringFields.includes(field)) {
      (item[field] as any) = value;
      if (field === 'bookAdjustment') {
        item.status = value === 'Yes' ? 'Book Adjustment' : 'Deposited';
      }
    } else {
      (item[field] as any) = Number(value) || 0;
    }

    // Auto-calculate total: TDS (4) + Surcharge (5) + Cess (6) + Interest (7) + Fee (8) + Penalty (9)
    item.total = Number(item.tax || 0) + 
                 Number(item.surcharge || 0) + 
                 Number(item.educationCess || 0) + 
                 Number(item.interest || 0) + 
                 Number(item.fee || 0) +
                 Number(item.penalty || 0);

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
      if (!c.bsrCode) newErrors[`challan_${index}_bsrCode`] = `Row ${index + 1}: BSR Code of Form 24G (Col 14) is required`;
      if (!c.dateOfDeposit) newErrors[`challan_${index}_dateOfDeposit`] = `Row ${index + 1}: Date of Deposit (Col 16) is required`;
      if (!c.challanSerialNo) newErrors[`challan_${index}_challanSerialNo`] = `Row ${index + 1}: Challan Serial No (Col 18) is required`;
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
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[3100px] border border-black text-left text-sm border-collapse">
              <thead>
                {/* Row 1: Column Numbers */}
                <tr className="bg-black text-white font-bold border-b border-black text-center">
                  <th className="p-2 w-12 border-r border-black text-center text-xs font-black">1</th>
                  <th className="p-2 w-36 border-r border-black text-center text-xs font-black">2</th>
                  <th className="p-2 w-36 border-r border-black text-center text-xs font-black">3</th>
                  <th className="p-2 w-36 border-r border-black text-center text-xs font-black">4</th>
                  <th className="p-2 w-36 border-r border-black text-center text-xs font-black">5</th>
                  <th className="p-2 w-36 border-r border-black text-center text-xs font-black">6</th>
                  <th className="p-2 w-36 border-r border-black text-center text-xs font-black">7</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">8</th>
                  <th className="p-2 w-32 border-r border-black text-center text-xs font-black">9</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">10</th>
                  <th className="p-2 w-44 border-r border-black text-center text-xs font-black">11</th>
                  <th className="p-2 w-36 border-r border-black text-center text-xs font-black">12</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">13</th>
                  <th className="p-2 w-32 border-r border-black text-center text-xs font-black">14</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">15</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">16</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">17</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">18</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">19</th>
                  <th className="p-2 w-28 border-r border-black text-center text-xs font-black">20</th>
                  <th className="p-2 w-36 border-r border-black text-center text-xs font-black">21</th>
                  <th className="p-2 w-32 border-r border-black text-center text-xs font-black">22</th>
                  <th className="p-2 w-32 border-r border-black text-center text-xs font-black">23</th>
                  <th className="p-2 w-16 text-center text-xs font-black">-</th>
                </tr>
                {/* Row 2: Field Names */}
                <tr className="bg-gray-100 text-black font-bold border-b border-black text-xs">
                  <th className="p-2 border-r border-black text-center">Sr. No.</th>
                  <th className="p-2 border-r border-black">Last BSR Code / 24G Receipt No.</th>
                  <th className="p-2 border-r border-black">BSR Code / Receipt No. of Form 24G</th>
                  <th className="p-2 border-r border-black">Last Date on which Tax Deposited</th>
                  <th className="p-2 border-r border-black">Date of Deposit (DD/MM/YYYY)</th>
                  <th className="p-2 border-r border-black">Last DDO/Voucher/Challan Serial No.</th>
                  <th className="p-2 border-r border-black">Challan Serial No. / DDO Serial No.</th>
                  <th className="p-2 border-r border-black">Mode of Deposit (Book Adj)</th>
                  <th className="p-2 border-r border-black">Interest Allocated/Apportioned</th>
                  <th className="p-2 border-r border-black">Others</th>
                  <th className="p-2 border-r border-black">Minor Head of Challan</th>
                  <th className="p-2 border-r border-black">Challan Balance</th>
                  <th className="p-2 border-r border-black">Update Mode For Challan</th>
                  <th className="p-2 border-r border-black">Section Code</th>
                  <th className="p-2 border-r border-black">TDS</th>
                  <th className="p-2 border-r border-black">Surcharge</th>
                  <th className="p-2 border-r border-black">Education Cess</th>
                  <th className="p-2 border-r border-black">Interest</th>
                  <th className="p-2 border-r border-black">Fee</th>
                  <th className="p-2 border-r border-black">Penalty/Others</th>
                  <th className="p-2 border-r border-black">Last Total Tax Deposited</th>
                  <th className="p-2 border-r border-black">Total Amount Deposited (4+5+6+7+8+9)</th>
                  <th className="p-2 border-r border-black">Cheque / DD No. (if any)</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {challans.map((challan, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    {/* 1. Sr. No. */}
                    <td className="p-2 text-center font-bold text-black border-r border-black">
                      {challan.serialNo}
                    </td>

                    {/* 13. Last BSR Code / 24G Receipt No. */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Last BSR Code / 24G Receipt No."
                        type="text"
                        value={challan.lastBSRCode}
                        onChange={(e) => handleChallanChange(index, 'lastBSRCode', e.target.value)}
                        placeholder="7-digit BSR"
                        maxLength={7}
                        className={inputClass}
                      />
                    </td>

                    {/* 14. BSR Code / Receipt Number of Form No. 24G */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="BSR Code / Receipt Number"
                        type="text"
                        value={challan.bsrCode}
                        onChange={(e) => handleChallanChange(index, 'bsrCode', e.target.value)}
                        placeholder="7-digit BSR"
                        maxLength={7}
                        className={`${inputClass} ${errors[`challan_${index}_bsrCode`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    {/* 15. Last Date on which Tax Deposited */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Last Date on which Tax Deposited"
                        type="date"
                        value={challan.lastDateOfDeposit}
                        onChange={(e) => handleChallanChange(index, 'lastDateOfDeposit', e.target.value)}
                        className={inputClass}
                      />
                    </td>

                    {/* 16. Date on which Amount Deposited through Challan */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Date on which Amount Deposited"
                        type="date"
                        value={challan.dateOfDeposit}
                        onChange={(e) => handleChallanChange(index, 'dateOfDeposit', e.target.value)}
                        className={`${inputClass} ${errors[`challan_${index}_dateOfDeposit`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    {/* 17. Last DDO / Transfer Voucher / Challan Serial No. */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Last DDO / Transfer Voucher / Challan Serial No."
                        type="text"
                        value={challan.lastChallanSerialNo}
                        onChange={(e) => handleChallanChange(index, 'lastChallanSerialNo', e.target.value)}
                        placeholder="5-digit No"
                        maxLength={5}
                        className={inputClass}
                      />
                    </td>

                    {/* 18. Challan Serial No. / DDO Serial No. of Form No. 24G */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Challan Serial No. / DDO Serial No."
                        type="text"
                        value={challan.challanSerialNo}
                        onChange={(e) => handleChallanChange(index, 'challanSerialNo', e.target.value)}
                        placeholder="5-digit No"
                        maxLength={5}
                        className={`${inputClass} ${errors[`challan_${index}_challanSerialNo`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    {/* 19. Mode of Deposit through Book Adjustment (Yes/No) */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Mode of Deposit through Book Adjustment (Yes/No)"
                        value={challan.bookAdjustment}
                        onChange={(e) => handleChallanChange(index, 'bookAdjustment', e.target.value)}
                        className={selectClass}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </td>

                    {/* 20. Interest to be allocated / apportioned */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Interest to be allocated / apportioned"
                        type="number"
                        value={challan.interestAllocated}
                        onChange={(e) => handleChallanChange(index, 'interestAllocated', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 21. Others */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Others"
                        type="number"
                        value={challan.other}
                        onChange={(e) => handleChallanChange(index, 'other', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 22. Minor Head of Challan */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Minor Head of Challan"
                        value={challan.minorHead}
                        onChange={(e) => handleChallanChange(index, 'minorHead', e.target.value)}
                        className={selectClass}
                      >
                        <option value="200">200 - TDS payable by taxpayer</option>
                        <option value="400">400 - TDS regular assessment</option>
                      </select>
                    </td>

                    {/* 23. Challan Balance as per consolidated file */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Challan Balance as per consolidated file"
                        type="number"
                        value={challan.challanBalance}
                        onChange={(e) => handleChallanChange(index, 'challanBalance', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 2. Update Mode For Challan */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Update Mode For Challan"
                        value={challan.updateMode}
                        onChange={(e) => handleChallanChange(index, 'updateMode', e.target.value)}
                        className={selectClass}
                      >
                        <option value="Add">Add</option>
                        <option value="Modify">Modify</option>
                      </select>
                    </td>

                    {/* 3. Section Code */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Section Code"
                        value={challan.sectionCode}
                        onChange={(e) => handleChallanChange(index, 'sectionCode', e.target.value)}
                        className={selectClass}
                      >
                        <option value="94C">94C - Contractors</option>
                        <option value="94J">94J - Professional/Technical</option>
                        <option value="94I">94I - Rent</option>
                        <option value="94H">94H - Commission/Brokerage</option>
                        <option value="94Q">94Q - Goods Purchase</option>
                        <option value="94A">94A - Interest (non-securities)</option>
                        <option value="193">193 - Securities Interest</option>
                        <option value="194">194 - Dividends</option>
                        <option value="194DA">194DA - Life Insurance</option>
                        <option value="194EE">194EE - NSS</option>
                        <option value="194F">194F - Mutual Funds</option>
                        <option value="194G">194G - Lottery Comm</option>
                        <option value="194IA">194IA - Immovable Prop</option>
                        <option value="194IB">194IB - Indiv Rent</option>
                        <option value="194M">194M - Indiv Comm/Contract</option>
                        <option value="194N">194N - Cash Withdrawals</option>
                        <option value="194O">194O - E-commerce</option>
                        <option value="194S">194S - VDA Transfer</option>
                        <option value="195">195 - Non-Residents</option>
                      </select>
                    </td>

                    {/* 4. TDS */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="TDS"
                        type="number"
                        value={challan.tax}
                        onChange={(e) => handleChallanChange(index, 'tax', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 5. Surcharge */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Surcharge"
                        type="number"
                        value={challan.surcharge}
                        onChange={(e) => handleChallanChange(index, 'surcharge', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 6. Education Cess */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Education Cess"
                        type="number"
                        value={challan.educationCess}
                        onChange={(e) => handleChallanChange(index, 'educationCess', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 7. Interest */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Interest"
                        type="number"
                        value={challan.interest}
                        onChange={(e) => handleChallanChange(index, 'interest', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 8. Fee */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Fee"
                        type="number"
                        value={challan.fee}
                        onChange={(e) => handleChallanChange(index, 'fee', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 9. Penalty/Others */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Penalty/Others"
                        type="number"
                        value={challan.penalty}
                        onChange={(e) => handleChallanChange(index, 'penalty', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 10. Last Total Tax Deposited */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Last Total Tax Deposited"
                        type="number"
                        value={challan.lastTotalTaxDeposited}
                        onChange={(e) => handleChallanChange(index, 'lastTotalTaxDeposited', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 11. Total Amount Deposited (4+5+6+7+8+9) */}
                    <td className="p-2 border-r border-black font-bold text-black text-center text-xs">
                      ₹{challan.total.toLocaleString()}
                    </td>

                    {/* 12. Cheque / DD No. (if any) */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Cheque / DD No. (if any)"
                        type="text"
                        value={challan.chequeDDNo}
                        onChange={(e) => handleChallanChange(index, 'chequeDDNo', e.target.value)}
                        placeholder="Cheque/DD"
                        className={inputClass}
                      />
                    </td>

                    {/* Action */}
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeChallan(index)}
                        disabled={challans.length <= 1}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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

