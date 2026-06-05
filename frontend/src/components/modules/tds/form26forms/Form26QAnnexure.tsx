import React, { useState } from 'react';
import { Save, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import type { DeducteeDetails } from './types';
import Swal from 'sweetalert2';
import axiosInstance from '../../../../api/axiosInstance';
import { useAuth } from '../../../../home/context/AuthContext';

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

const remarkCodes = [
  { value: '', label: 'Select Remarks' },
  { value: 'A', label: 'A - Lower deduction u/s 197' },
  { value: 'B', label: 'B - No deduction certificate u/s 197' },
  { value: 'C', label: 'C - Higher deduction due to non-furnishing of PAN' },
  { value: 'F', label: 'F - No deduction u/s 194A(3) (Form 15G/15H)' },
  { value: 'H', label: 'H - No deduction u/s 197A' },
  { value: 'Y', label: 'Y - No deduction due to threshold limit' },
  { value: 'Z', label: 'Z - Higher deduction u/s 206AB' }
];

export const Form26QAnnexure: React.FC<{ returnId: number | null }> = ({ returnId }) => {
  const { companyId } = useAuth();
  const [deductees, setDeductees] = useState<DeducteeDetails[]>([
    {
      rowNumber: 1,
      cashWithdrawal1cr: 0,
      cashWithdrawal20lto1crNonCoop: 0,
      cashWithdrawal1crNonCoop: 0,
      cashWithdrawal20lto1crCoop: 0,
      totalTaxDeducted: 0,
      lastTotalTaxDeducted: 0,
      taxDeposited: 0,
      lastTotalTaxDeposited: 0,
      dateOfDeduction: '',
      remarkCode: '',
      deducteeCode: '02',
      rateOfDeduction: 0,
      paidByBookEntry: 'No',
      certSerialNo: '',
      serialNo: 1,
      deducteeRefNo: '',
      lastPanOfDeductee: '',
      panOfDeductee: '',
      nameOfDeductee: '',
      dateOfPayment: '',
      amountPaid: 0,
      amountOfTax: 0,
      surcharge: 0,
      educationCess: 0,
      challanSerialNo: '',
      updateMode: 'Add',
      bsrCode: '',
      dateOfTaxDeposited: '',
      transferVoucherSerialNo: '',
      sectionUnderDeducted: '194C',
      totalTdsAllocated: 0,
      interest: 0,
      others: 0,
      totalTax: 0,
      cashWithdrawal3crCoop: 0,
      cashWithdrawal20lto3crCoop: 0,
      cashWithdrawal3crCoopProviso: 0
    }
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const addDeductee = async () => {
    try {
      const response = await axiosInstance.get(`/tds26q_challan?companyId=${companyId || ''}${returnId ? `&returnId=${returnId}` : ''}`);
      const challansData = response.data;
      
      if (!challansData || challansData.length === 0) {
        Swal.fire('No Challans Found', 'Please add and save Challans first before adding Deductees.', 'info');
        return;
      }

      const html = `
        <div class="text-left font-arial">
          <p class="mb-4 text-sm font-semibold text-gray-700">Enter the number of deductee rows to generate for each challan:</p>
          <div class="space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
            ${challansData.map((c: any, i: number) => `
              <div class="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <div class="font-bold text-black">Challan Sr: ${i + 1}</div>
                  <div class="text-xs text-gray-500">BSR Code: ${c.bsr_code || 'N/A'}</div>
                </div>
                <input type="number" id="challan_input_${i}" class="swal2-input !w-24 !m-0 !h-10 text-center !text-sm" placeholder="Rows" min="0" value="0" />
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const result = await Swal.fire({
        title: 'Generate Deductee Rows',
        html,
        showCancelButton: true,
        confirmButtonText: 'Generate Rows',
        confirmButtonColor: '#000000',
        cancelButtonColor: '#dc2626',
        width: '500px',
        preConfirm: () => {
          const counts = challansData.map((_: any, i: number) => {
            const val = (document.getElementById(`challan_input_${i}`) as HTMLInputElement).value;
            return parseInt(val, 10) || 0;
          });
          return counts;
        }
      });

      if (result.isConfirmed && result.value) {
        const counts = result.value as number[];
        const newDeductees: DeducteeDetails[] = [];
        
        let startSerial = deductees.length;
        
        counts.forEach((count: number, challanIndex: number) => {
          const c = challansData[challanIndex];
          for (let k = 0; k < count; k++) {
            startSerial++;
            newDeductees.push({
              rowNumber: startSerial,
              cashWithdrawal1cr: 0,
              cashWithdrawal20lto1crNonCoop: 0,
              cashWithdrawal1crNonCoop: 0,
              cashWithdrawal20lto1crCoop: 0,
              totalTaxDeducted: 0,
              lastTotalTaxDeducted: 0,
              taxDeposited: 0,
              lastTotalTaxDeposited: 0,
              dateOfDeduction: '',
              remarkCode: '',
              deducteeCode: '02',
              rateOfDeduction: 0,
              paidByBookEntry: 'No',
              certSerialNo: '',
              serialNo: startSerial,
              deducteeRefNo: '',
              lastPanOfDeductee: '',
              panOfDeductee: '',
              nameOfDeductee: '',
              dateOfPayment: '',
              amountPaid: 0,
              amountOfTax: 0,
              surcharge: 0,
              educationCess: 0,
              challanSerialNo: String(challanIndex + 1),
              updateMode: 'Add',
              bsrCode: '',
              dateOfTaxDeposited: '',
              transferVoucherSerialNo: '',
              sectionUnderDeducted: '194C',
              totalTdsAllocated: 0,
              interest: 0,
              others: 0,
              totalTax: 0,
              cashWithdrawal3crCoop: 0,
              cashWithdrawal20lto3crCoop: 0,
              cashWithdrawal3crCoopProviso: 0
            });
          }
        });

        if (newDeductees.length > 0) {
          const firstRow = deductees[0];
          const isInitialEmpty = deductees.length === 1 && !firstRow.panOfDeductee && !firstRow.nameOfDeductee && !firstRow.amountPaid;
          
          if (isInitialEmpty) {
            const fixed = newDeductees.map((d, i) => ({ ...d, serialNo: i + 1, rowNumber: i + 1 }));
            setDeductees(fixed);
          } else {
            setDeductees(prev => [...prev, ...newDeductees]);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching challans for deductees popup', err);
      Swal.fire('Error', 'Failed to fetch Challans data. Make sure Challans are saved first.', 'error');
    }
  };

  const removeDeductee = (index: number) => {
    if (deductees.length <= 1) return;
    const updated = deductees
      .filter((_, i) => i !== index)
      .map((d, i) => ({ ...d, serialNo: i + 1, rowNumber: i + 1 }));
    setDeductees(updated);
  };

  const handleDeducteeChange = (index: number, field: keyof DeducteeDetails, value: string | number) => {
    const updated = [...deductees];
    const item = { ...updated[index] };

    const stringFields: (keyof DeducteeDetails)[] = [
      'dateOfDeduction', 'remarkCode', 'deducteeCode', 'paidByBookEntry', 'certSerialNo',
      'deducteeRefNo', 'lastPanOfDeductee', 'panOfDeductee', 'nameOfDeductee',
      'dateOfPayment', 'challanSerialNo', 'updateMode', 'bsrCode', 'dateOfTaxDeposited',
      'transferVoucherSerialNo', 'sectionUnderDeducted', 'natureOfPayment',
      'dateOfTDSCertificate', 'gstIdentificationNo'
    ];

    if (stringFields.includes(field)) {
      (item[field] as any) = value;
    } else {
      (item[field] as any) = Number(value) || 0;
    }

    // Auto-calculate Tax if rate or paid is edited
    if (field === 'amountPaid' || field === 'rateOfDeduction') {
      const rate = Number(item.rateOfDeduction || 0);
      const paid = Number(item.amountPaid || 0);
      item.amountOfTax = Number(((paid * rate) / 100).toFixed(2));
      item.taxDeposited = item.amountOfTax;
    }

    // Column 6 (totalTaxDeducted) = 23 (TDS) + 24 (Surcharge) + 25 (Cess)
    item.totalTaxDeducted = Number(item.amountOfTax || 0) + 
                            Number(item.surcharge || 0) + 
                            Number(item.educationCess || 0);

    // Column 35 (totalTax) = 7 (Last Total Tax Deducted) + 8 (Total Tax Deposited) + 9 (Last Total Tax Deposited)
    item.totalTax = Number(item.lastTotalTaxDeducted || 0) + 
                    Number(item.taxDeposited || 0) + 
                    Number(item.lastTotalTaxDeposited || 0);

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
        newErrors[`deductee_${index}_panOfDeductee`] = `Row ${index + 1}: PAN (Col 19) is required`;
      } else if (d.panOfDeductee.length !== 10) {
        newErrors[`deductee_${index}_panOfDeductee`] = `Row ${index + 1}: PAN (Col 19) must be 10 characters`;
      }
      if (!d.nameOfDeductee) newErrors[`deductee_${index}_nameOfDeductee`] = `Row ${index + 1}: Name (Col 20) is required`;
      if (!d.dateOfPayment) newErrors[`deductee_${index}_dateOfPayment`] = `Row ${index + 1}: Payment date (Col 21) is required`;
      if (!d.amountPaid || d.amountPaid <= 0) newErrors[`deductee_${index}_amountPaid`] = `Row ${index + 1}: Amount (Col 22) must be greater than 0`;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnId) {
      Swal.fire({
        title: 'Missing Form 26Q Details',
        text: 'Please save the main Form 26Q Particulars first before saving Annexure.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
      return;
    }

    if (!validate()) {
      Swal.fire({
        title: 'Validation Error',
        text: 'Please correct the highlighted errors before saving.',
        icon: 'warning',
        confirmButtonColor: '#000000',
      });
      return;
    }

    try {
      const response = await axiosInstance.post('/tds26q_deductee', { returnId, deductees });
      if (response.data.success) {
        Swal.fire({
          title: 'Saved Successfully!',
          text: 'Annexure (Deducted details) have been saved.',
          icon: 'success',
          confirmButtonColor: '#16a34a',
        });
      } else {
        Swal.fire({
          title: 'Error!',
          text: 'Failed to save Annexure details.',
          icon: 'error',
          confirmButtonColor: '#dc2626',
        });
      }
    } catch (error: any) {
      console.error('Error saving Annexure:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.error || 'An error occurred while saving Annexure.',
        icon: 'error',
        confirmButtonColor: '#dc2626',
      });
    }
  };

  const getRowColor = (challanNo: string) => {
    const num = parseInt(challanNo, 10);
    if (isNaN(num) || !num) return 'bg-white hover:bg-gray-50';
    
    const colors = [
      'bg-red-50 hover:bg-red-100',
      'bg-blue-50 hover:bg-blue-100',
      'bg-green-50 hover:bg-green-100',
      'bg-yellow-50 hover:bg-yellow-100',
      'bg-purple-50 hover:bg-purple-100',
      'bg-pink-50 hover:bg-pink-100',
      'bg-indigo-50 hover:bg-indigo-100',
      'bg-teal-50 hover:bg-teal-100',
      'bg-orange-50 hover:bg-orange-100',
      'bg-cyan-50 hover:bg-cyan-100'
    ];
    
    // num - 1 so that Challan 1 gets the first color, Challan 2 gets second, etc.
    return colors[(num - 1) % colors.length];
  };

  const inputClass = "w-full p-2 border bg-transparent text-black border-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-xs font-semibold";
  const selectClass = "w-full p-2 border bg-transparent text-black border-black focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-xs font-semibold";

  return (
    <div className="space-y-6 animate-fadeIn text-black font-arial">

      <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-black">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-bold text-black">Part C - Annexure (Deducted details)</h3>
            <button
              type="button"
              onClick={addDeductee}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-900 text-white font-bold px-3 py-1.5 rounded-lg text-sm border border-black transition-colors cursor-pointer"
            >
              <Plus size={16} />
              Add Deductee
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-0.5 font-semibold">Details of amount paid/credited and tax deducted at source</p>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[5000px] border border-black text-left text-sm border-collapse">
              <thead>
                {/* Row 1: Column Numbers */}
                <tr className="bg-black text-white font-bold border-b border-black text-center">
                  {Array.from({ length: 38 }, (_, i) => (
                    <th key={i + 1} className="p-2 border-r border-black text-center text-xs font-black" style={{ width: i === 0 || i === 15 ? '60px' : '130px' }}>
                      {i + 1}
                    </th>
                  ))}
                  <th className="p-2 w-16 text-center text-xs font-black">-</th>
                </tr>
                {/* Row 2: Field Names */}
                <tr className="bg-gray-100 text-black font-bold border-b border-black text-xs">
                  <th className="p-2 border-r border-black text-center">Row Number</th>
                  <th className="p-2 border-r border-black">Challan Serial No.</th>
                  <th className="p-2 border-r border-black">Amt of cash withdrawal &gt; 1cr u/s 194N</th>
                  <th className="p-2 border-r border-black">Amt of cash withdrawal 20L-1cr (Non-coop proviso u/s 194N)</th>
                  <th className="p-2 border-r border-black">Amt of cash withdrawal &gt; 1cr (Non-coop proviso u/s 194N)</th>
                  <th className="p-2 border-r border-black">Amt of cash withdrawal 20L-1cr (Coop proviso u/s 194N)</th>
                  <th className="p-2 border-r border-black">Total Tax Deducted (23+24+25)</th>
                  <th className="p-2 border-r border-black">Last Total Tax Deducted</th>
                  <th className="p-2 border-r border-black">Total Tax Deposited</th>
                  <th className="p-2 border-r border-black">Last Total Tax Deposited</th>
                  <th className="p-2 border-r border-black">Date of Deduction (DD/MM/YYYY)</th>
                  <th className="p-2 border-r border-black">Remarks (Reason for non-deduction)</th>
                  <th className="p-2 border-r border-black">Deductee Code</th>
                  <th className="p-2 border-r border-black">Rate at which Tax Deducted</th>
                  <th className="p-2 border-r border-black">Paid by book entry or otherwise</th>
                  <th className="p-2 border-r border-black">Assessing Officer Cert No. (non/lower)</th>
                  <th className="p-2 border-r border-black text-center">Sr. No.</th>
                  <th className="p-2 border-r border-black">Deductee Ref No. (if available)</th>
                  <th className="p-2 border-r border-black">Last PAN of Deductee</th>
                  <th className="p-2 border-r border-black">PAN of Deductee *</th>
                  <th className="p-2 border-r border-black">Name of Deductee *</th>
                  <th className="p-2 border-r border-black">Date of Payment/Credit (DD/MM/YYYY) *</th>
                  <th className="p-2 border-r border-black">Amount Paid/Credited *</th>
                  <th className="p-2 border-r border-black">TDS</th>
                  <th className="p-2 border-r border-black">Surcharge</th>
                  <th className="p-2 border-r border-black">Health & Education Cess</th>
                  <th className="p-2 border-r border-black">Update Mode For Deductee</th>
                  <th className="p-2 border-r border-black">BSR Code of Branch</th>
                  <th className="p-2 border-r border-black">Date of Deposit (DD/MM/YYYY)</th>
                  <th className="p-2 border-r border-black">Voucher / Challan Serial No.</th>
                  <th className="p-2 border-r border-black">Section Under Which Payment Made</th>
                  <th className="p-2 border-r border-black">Total TDS to be allocated (Col 21 total)</th>
                  <th className="p-2 border-r border-black">Interest</th>
                  <th className="p-2 border-r border-black">Others</th>
                  <th className="p-2 border-r border-black">Total (7+8+9)</th>
                  <th className="p-2 border-r border-black">Amt of cash withdrawal &gt; 3cr (Coop 3rd proviso)</th>
                  <th className="p-2 border-r border-black">Amt of cash withdrawal 20L-3cr (Coop 1st/3rd proviso)</th>
                  <th className="p-2 border-r border-black">Amt of cash withdrawal &gt; 3cr (Coop 1st/3rd proviso)</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {deductees.map((deductee, index) => (
                  <tr key={index} className={`${getRowColor(deductee.challanSerialNo)} transition-colors`}>
                    {/* 1. Row Number */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Row Number"
                        type="number"
                        value={deductee.rowNumber}
                        onChange={(e) => handleDeducteeChange(index, 'rowNumber', e.target.value)}
                        className={inputClass}
                      />
                    </td>

                    {/* 2. Challan Serial No. */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Challan Serial No."
                        type="text"
                        value={deductee.challanSerialNo}
                        onChange={(e) => handleDeducteeChange(index, 'challanSerialNo', e.target.value)}
                        placeholder="Challan No."
                        className={inputClass}
                      />
                    </td>

                    {/* 3. Amount of cash withdrawal in excess of Rs. 1 crore */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Amt of cash withdrawal > 1cr"
                        type="number"
                        value={deductee.cashWithdrawal1cr}
                        onChange={(e) => handleDeducteeChange(index, 'cashWithdrawal1cr', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 3. Amount of cash withdrawal 20L to 1cr (Non-coop proviso) */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Amt of cash withdrawal 20L-1cr (Non-coop)"
                        type="number"
                        value={deductee.cashWithdrawal20lto1crNonCoop}
                        onChange={(e) => handleDeducteeChange(index, 'cashWithdrawal20lto1crNonCoop', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 4. Amount of cash withdrawal > 1cr (Non-coop proviso) */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Amt of cash withdrawal > 1cr (Non-coop)"
                        type="number"
                        value={deductee.cashWithdrawal1crNonCoop}
                        onChange={(e) => handleDeducteeChange(index, 'cashWithdrawal1crNonCoop', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 5. Amount of cash withdrawal 20L to 1cr (Coop proviso) */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Amt of cash withdrawal 20L-1cr (Coop)"
                        type="number"
                        value={deductee.cashWithdrawal20lto1crCoop}
                        onChange={(e) => handleDeducteeChange(index, 'cashWithdrawal20lto1crCoop', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 6. Total Tax Deducted (23+24+25) */}
                    <td className="p-2 border-r border-black font-bold text-black text-center text-xs">
                      ₹{deductee.totalTaxDeducted.toLocaleString()}
                    </td>

                    {/* 7. Last Total Tax Deducted */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Last Total Tax Deducted"
                        type="number"
                        value={deductee.lastTotalTaxDeducted}
                        onChange={(e) => handleDeducteeChange(index, 'lastTotalTaxDeducted', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 8. Total Tax Deposited */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Total Tax Deposited"
                        type="number"
                        value={deductee.taxDeposited}
                        onChange={(e) => handleDeducteeChange(index, 'taxDeposited', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 9. Last Total Tax Deposited */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Last Total Tax Deposited"
                        type="number"
                        value={deductee.lastTotalTaxDeposited}
                        onChange={(e) => handleDeducteeChange(index, 'lastTotalTaxDeposited', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 10. Date of Deduction (DD/MM/YYYY) */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Date of Deduction"
                        type="date"
                        value={deductee.dateOfDeduction}
                        onChange={(e) => handleDeducteeChange(index, 'dateOfDeduction', e.target.value)}
                        className={inputClass}
                      />
                    </td>

                    {/* 11. Remarks (Reason for non-deduction) */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Remarks"
                        value={deductee.remarkCode}
                        onChange={(e) => handleDeducteeChange(index, 'remarkCode', e.target.value)}
                        className={selectClass}
                      >
                        {remarkCodes.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>

                    {/* 12. Deductee Code */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Deductee Code"
                        value={deductee.deducteeCode}
                        onChange={(e) => handleDeducteeChange(index, 'deducteeCode', e.target.value)}
                        className={selectClass}
                      >
                        <option value="01">01 - Company</option>
                        <option value="02">02 - Other than Company</option>
                      </select>
                    </td>

                    {/* 13. Rate at which Tax Deducted */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Rate at which Tax Deducted"
                        type="number"
                        value={deductee.rateOfDeduction || ''}
                        onChange={(e) => handleDeducteeChange(index, 'rateOfDeduction', e.target.value)}
                        placeholder="%"
                        max={100}
                        step="0.01"
                        className={inputClass}
                      />
                    </td>

                    {/* 14. Paid by book entry or otherwise */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Paid by book entry"
                        value={deductee.paidByBookEntry}
                        onChange={(e) => handleDeducteeChange(index, 'paidByBookEntry', e.target.value)}
                        className={selectClass}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </td>

                    {/* 15. AO Certificate No. */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Assessing Officer Cert No."
                        type="text"
                        value={deductee.certSerialNo}
                        onChange={(e) => handleDeducteeChange(index, 'certSerialNo', e.target.value)}
                        placeholder="Cert No."
                        className={inputClass}
                      />
                    </td>

                    {/* 16. Sr. No. */}
                    <td className="p-2 text-center font-bold text-black border-r border-black">
                      {deductee.serialNo}
                    </td>

                    {/* 17. Deductee Ref No. */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Deductee Ref No."
                        type="text"
                        value={deductee.deducteeRefNo}
                        onChange={(e) => handleDeducteeChange(index, 'deducteeRefNo', e.target.value)}
                        placeholder="Ref No."
                        className={inputClass}
                      />
                    </td>

                    {/* 18. Last PAN of Deductee */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Last PAN of Deductee"
                        type="text"
                        value={deductee.lastPanOfDeductee}
                        onChange={(e) => handleDeducteeChange(index, 'lastPanOfDeductee', e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className={`${inputClass} uppercase font-mono`}
                      />
                    </td>

                    {/* 19. PAN of Deductee */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="PAN of Deductee"
                        type="text"
                        value={deductee.panOfDeductee}
                        onChange={(e) => handleDeducteeChange(index, 'panOfDeductee', e.target.value.toUpperCase())}
                        placeholder="ABCDE1234F"
                        maxLength={10}
                        className={`${inputClass} uppercase font-mono ${errors[`deductee_${index}_panOfDeductee`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    {/* 20. Name of Deductee */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Name of Deductee"
                        type="text"
                        value={deductee.nameOfDeductee}
                        onChange={(e) => handleDeducteeChange(index, 'nameOfDeductee', e.target.value)}
                        placeholder="Name of Deductee"
                        className={`${inputClass} ${errors[`deductee_${index}_nameOfDeductee`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    {/* 21. Date of Payment/Credit */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Date of Payment/Credit"
                        type="date"
                        value={deductee.dateOfPayment}
                        onChange={(e) => handleDeducteeChange(index, 'dateOfPayment', e.target.value)}
                        className={`${inputClass} ${errors[`deductee_${index}_dateOfPayment`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    {/* 22. Amount Paid/Credited */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Amount Paid/Credited"
                        type="number"
                        value={deductee.amountPaid || ''}
                        onChange={(e) => handleDeducteeChange(index, 'amountPaid', e.target.value)}
                        placeholder="0.00"
                        className={`${inputClass} ${errors[`deductee_${index}_amountPaid`] ? 'border-red-600' : ''}`}
                      />
                    </td>

                    {/* 23. TDS */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="TDS"
                        type="number"
                        value={deductee.amountOfTax || ''}
                        onChange={(e) => handleDeducteeChange(index, 'amountOfTax', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 24. Surcharge */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Surcharge"
                        type="number"
                        value={deductee.surcharge || ''}
                        onChange={(e) => handleDeducteeChange(index, 'surcharge', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 25. Health & Education Cess */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Health & Education Cess"
                        type="number"
                        value={deductee.educationCess || ''}
                        onChange={(e) => handleDeducteeChange(index, 'educationCess', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 27. Update Mode For Deductee */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Update Mode For Deductee"
                        value={deductee.updateMode}
                        onChange={(e) => handleDeducteeChange(index, 'updateMode', e.target.value)}
                        className={selectClass}
                      >
                        <option value="Add">Add</option>
                        <option value="Update">Update</option>
                        <option value="PAN Update">PAN Update</option>
                      </select>
                    </td>

                    {/* 28. BSR Code of Branch */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="BSR Code of Branch"
                        type="text"
                        value={deductee.bsrCode}
                        onChange={(e) => handleDeducteeChange(index, 'bsrCode', e.target.value)}
                        placeholder="7-digit BSR"
                        maxLength={7}
                        className={inputClass}
                      />
                    </td>

                    {/* 29. Date of Deposit */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Date of Deposit"
                        type="date"
                        value={deductee.dateOfTaxDeposited}
                        onChange={(e) => handleDeducteeChange(index, 'dateOfTaxDeposited', e.target.value)}
                        className={inputClass}
                      />
                    </td>

                    {/* 30. Voucher / Challan Serial No. */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Voucher / Challan Serial No."
                        type="text"
                        value={deductee.transferVoucherSerialNo}
                        onChange={(e) => handleDeducteeChange(index, 'transferVoucherSerialNo', e.target.value)}
                        placeholder="Serial No."
                        className={inputClass}
                      />
                    </td>

                    {/* 31. Section Under Which Payment Made */}
                    <td className="p-1.5 border-r border-black">
                      <select
                        title="Section Under Which Payment Made"
                        value={deductee.sectionUnderDeducted}
                        onChange={(e) => handleDeducteeChange(index, 'sectionUnderDeducted', e.target.value)}
                        className={selectClass}
                      >
                        {sectionCodes.map(section => (
                          <option key={section.value} value={section.value}>{section.value}</option>
                        ))}
                      </select>
                    </td>

                    {/* 32. Total TDS to be allocated */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Total TDS to be allocated"
                        type="number"
                        value={deductee.totalTdsAllocated}
                        onChange={(e) => handleDeducteeChange(index, 'totalTdsAllocated', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 33. Interest */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Interest"
                        type="number"
                        value={deductee.interest}
                        onChange={(e) => handleDeducteeChange(index, 'interest', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 34. Others */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Others"
                        type="number"
                        value={deductee.others}
                        onChange={(e) => handleDeducteeChange(index, 'others', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 35. Total (7+8+9) */}
                    <td className="p-2 border-r border-black font-bold text-black text-center text-xs bg-gray-50">
                      ₹{deductee.totalTax.toLocaleString()}
                    </td>

                    {/* 36. cashWithdrawal3crCoop */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Amt of cash withdrawal > 3cr (Coop)"
                        type="number"
                        value={deductee.cashWithdrawal3crCoop}
                        onChange={(e) => handleDeducteeChange(index, 'cashWithdrawal3crCoop', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 37. cashWithdrawal20lto3crCoop */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Amt of cash withdrawal 20L-3cr (Coop)"
                        type="number"
                        value={deductee.cashWithdrawal20lto3crCoop}
                        onChange={(e) => handleDeducteeChange(index, 'cashWithdrawal20lto3crCoop', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* 38. cashWithdrawal3crCoopProviso */}
                    <td className="p-1.5 border-r border-black">
                      <input
                        title="Amt of cash withdrawal > 3cr (Coop proviso)"
                        type="number"
                        value={deductee.cashWithdrawal3crCoopProviso}
                        onChange={(e) => handleDeducteeChange(index, 'cashWithdrawal3crCoopProviso', e.target.value)}
                        placeholder="0"
                        className={inputClass}
                      />
                    </td>

                    {/* Action */}
                    <td className="p-1.5 text-center">
                      <button
                        type="button"
                        onClick={() => removeDeductee(index)}
                        disabled={deductees.length <= 1}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed"
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
            <div className="mt-4 flex items-start gap-2 text-red-750 bg-white border border-red-600 p-3 rounded-lg text-xs font-semibold">
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
          className="inline-flex items-center gap-2 bg-black hover:bg-gray-950 text-white font-bold px-6 py-3 rounded-lg border border-black shadow-sm transition-colors cursor-pointer dark:bg-white dark:text-black dark:border-white dark:hover:bg-gray-100"
        >
          <Save size={18} />
          Save Deductees / Annexure
        </button>
      </div>
    </div>
  );
};
