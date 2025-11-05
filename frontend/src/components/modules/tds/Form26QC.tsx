import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Download, Calculator } from 'lucide-react';

interface Form26QCData {
  // Basic Information
  financialYear: string;
  quarterPeriod: string;
  
  // Transferee/Payer/Buyer Information
  transfereePAN: string;
  transfereeCategory: string;
  transfereeStatus: string;
  transfereeFullName: string;
  transfereeAddress: string;
  transfereeMobile: string;
  transfereeEmail: string;
  transfereePIN: string;
  multipleTransferee: 'Yes' | 'No';
  
  // Transferor/Payee/Seller Information
  transferorPAN: string;
  transferorCategory: string;
  transferorStatus: string;
  transferorFullName: string;
  transferorAddress: string;
  transferorMobile: string;
  transferorEmail: string;
  transferorPIN: string;
  multipleTransferor: 'Yes' | 'No';
  
  // Property Information
  propertyAddress: string;
  propertyPIN: string;
  
  // Agreement & Payment Details
  dateOfAgreement: string;
  totalValueOfConsideration: number;
  paymentInInstallment: 'Yes' | 'No';
  amountPaidCredited: number;
  dateOfPaymentCredit: string;
  rateOfDeduction: number;
  amountOfTaxDeducted: number;
  dateOfDeduction: string;
  
  // Deposit Information
  dateOfDeposit: string;
  modeOfPayment: string;
  simultaneousTaxPayment: 'Yes' | 'No';
  taxPaymentOnSubsequentDate: 'Yes' | 'No';
  
  // Tax Details
  tdsIncomeTax: number;
  interest: number;
  fee: number;
  totalPayment: number;
  
  // Amount in Words
  totalPaymentWords: {
    crores: string;
    lakhs: string;
    thousands: string;
    hundreds: string;
    tens: string;
    units: string;
  };
  
  // Acknowledgement
  uniqueAcknowledgementNo: string;
}

const Form26QC: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Form26QCData>({
    // Basic Information
    financialYear: '2024-25',
    quarterPeriod: 'Q4',
    
    // Transferee/Payer/Buyer Information
    transfereePAN: '',
    transfereeCategory: '',
    transfereeStatus: '',
    transfereeFullName: '',
    transfereeAddress: '',
    transfereeMobile: '',
    transfereeEmail: '',
    transfereePIN: '',
    multipleTransferee: 'No',
    
    // Transferor/Payee/Seller Information
    transferorPAN: '',
    transferorCategory: '',
    transferorStatus: '',
    transferorFullName: '',
    transferorAddress: '',
    transferorMobile: '',
    transferorEmail: '',
    transferorPIN: '',
    multipleTransferor: 'No',
    
    // Property Information
    propertyAddress: '',
    propertyPIN: '',
    
    // Agreement & Payment Details
    dateOfAgreement: '',
    totalValueOfConsideration: 0,
    paymentInInstallment: 'No',
    amountPaidCredited: 0,
    dateOfPaymentCredit: '',
    rateOfDeduction: 1.0,
    amountOfTaxDeducted: 0,
    dateOfDeduction: '',
    
    // Deposit Information
    dateOfDeposit: '',
    modeOfPayment: '',
    simultaneousTaxPayment: 'No',
    taxPaymentOnSubsequentDate: 'No',
    
    // Tax Details
    tdsIncomeTax: 0,
    interest: 0,
    fee: 0,
    totalPayment: 0,
    
    // Amount in Words
    totalPaymentWords: {
      crores: '',
      lakhs: '',
      thousands: '',
      hundreds: '',
      tens: '',
      units: ''
    },
    
    // Acknowledgement
    uniqueAcknowledgementNo: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const handleInputChange = (field: string, value: string | number | { crores: string; lakhs: string; thousands: string; hundreds: string; tens: string; units: string }) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Auto-calculate tax deducted amount
    if (field === 'amountPaidCredited' || field === 'rateOfDeduction') {
      const amount = field === 'amountPaidCredited' ? (value as number) : formData.amountPaidCredited;
      const rate = field === 'rateOfDeduction' ? (value as number) : formData.rateOfDeduction;
      const taxDeducted = (amount * rate) / 100;
      setFormData(prev => ({ ...prev, amountOfTaxDeducted: taxDeducted }));
    }

    // Auto-calculate total payment
    if (['tdsIncomeTax', 'interest', 'fee'].includes(field)) {
      const updatedFormData = { ...formData, [field]: value as number };
      const total = updatedFormData.tdsIncomeTax + updatedFormData.interest + updatedFormData.fee;
      setFormData(prev => ({ ...prev, totalPayment: total }));
    }
  };

  const generateHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Form 26QC - Challan-cum-statement of tax deducted under section 194 IA</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; font-weight: bold; margin-bottom: 20px; }
          .form-title { font-size: 16px; font-weight: bold; text-align: center; margin: 20px 0; }
          .section { margin: 15px 0; border: 1px solid #000; padding: 10px; }
          .field { margin: 5px 0; }
          .label { font-weight: bold; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
          .grid-4 { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; }
          .full-width { grid-column: 1 / -1; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #000; padding: 5px; text-align: left; }
          .center { text-align: center; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>FORM NO. 26QC</h2>
          <p>[See section 194 IA, rule 30(2B) and rule 31A(4)]</p>
          <p><strong>Challan-cum-statement of deduction of tax under section 194 IA</strong></p>
        </div>

        <div class="section">
          <h3>Basic Information</h3>
          <div class="grid">
            <div class="field">
              <span class="label">Financial Year:</span> ${formData.financialYear}
            </div>
            <div class="field">
              <span class="label">Quarter Period:</span> ${formData.quarterPeriod}
            </div>
          </div>
          <div class="grid">
            <div class="field">
              <span class="label">Major Head Code:</span> 0021
            </div>
            <div class="field">
              <span class="label">Minor Head Code:</span> 00400
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Transferee/Payer/Buyer Information</h3>
          <div class="grid-3">
            <div class="field">
              <span class="label">PAN:</span> ${formData.transfereePAN}
            </div>
            <div class="field">
              <span class="label">Category:</span> ${formData.transfereeCategory}
            </div>
            <div class="field">
              <span class="label">Status:</span> ${formData.transfereeStatus}
            </div>
          </div>
          <div class="field full-width">
            <span class="label">Full Name:</span> ${formData.transfereeFullName}
          </div>
          <div class="field full-width">
            <span class="label">Address:</span> ${formData.transfereeAddress}
          </div>
          <div class="grid-3">
            <div class="field">
              <span class="label">Mobile:</span> ${formData.transfereeMobile}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${formData.transfereeEmail}
            </div>
            <div class="field">
              <span class="label">PIN:</span> ${formData.transfereePIN}
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Transferor/Payee/Seller Information</h3>
          <div class="grid-3">
            <div class="field">
              <span class="label">PAN:</span> ${formData.transferorPAN}
            </div>
            <div class="field">
              <span class="label">Category:</span> ${formData.transferorCategory}
            </div>
            <div class="field">
              <span class="label">Status:</span> ${formData.transferorStatus}
            </div>
          </div>
          <div class="field full-width">
            <span class="label">Full Name:</span> ${formData.transferorFullName}
          </div>
          <div class="field full-width">
            <span class="label">Address:</span> ${formData.transferorAddress}
          </div>
          <div class="grid-3">
            <div class="field">
              <span class="label">Mobile:</span> ${formData.transferorMobile}
            </div>
            <div class="field">
              <span class="label">Email:</span> ${formData.transferorEmail}
            </div>
            <div class="field">
              <span class="label">PIN:</span> ${formData.transferorPIN}
            </div>
          </div>
        </div>

        <div class="section">
          <h3>Property Information</h3>
          <div class="field">
            <span class="label">Complete Address of Property being transferred:</span> ${formData.propertyAddress}
          </div>
          <div class="field">
            <span class="label">PIN:</span> ${formData.propertyPIN}
          </div>
        </div>

        <div class="section">
          <h3>Agreement and Payment Details</h3>
          <div class="grid-3">
            <div class="field">
              <span class="label">Date of Agreement:</span> ${formData.dateOfAgreement}
            </div>
            <div class="field">
              <span class="label">Total Value of Consideration:</span> ₹${formData.totalValueOfConsideration.toLocaleString()}
            </div>
            <div class="field">
              <span class="label">Payment in Installment:</span> ${formData.paymentInInstallment}
            </div>
          </div>
          
          <table>
            <tr>
              <th>Amount Paid/Credited (Rs.)</th>
              <th>Date of Payment/Credit</th>
              <th>Rate of Deduction</th>
              <th>Amount of Tax Deducted (Rs.)</th>
              <th>Date of Deduction</th>
            </tr>
            <tr>
              <td>₹${formData.amountPaidCredited.toLocaleString()}</td>
              <td>${formData.dateOfPaymentCredit}</td>
              <td>${formData.rateOfDeduction}%</td>
              <td>₹${formData.amountOfTaxDeducted.toLocaleString()}</td>
              <td>${formData.dateOfDeduction}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>Details of Payment of Tax Deducted at Source</h3>
          <div class="grid">
            <div class="field">
              <span class="label">Date of Deposit:</span> ${formData.dateOfDeposit}
            </div>
            <div class="field">
              <span class="label">Mode of Payment:</span> ${formData.modeOfPayment}
            </div>
          </div>
          
          <table>
            <tr>
              <th>TDS (Income Tax)</th>
              <th>Interest</th>
              <th>Fee</th>
              <th>Total Payment</th>
            </tr>
            <tr>
              <td>₹${formData.tdsIncomeTax.toLocaleString()}</td>
              <td>₹${formData.interest.toLocaleString()}</td>
              <td>₹${formData.fee.toLocaleString()}</td>
              <td>₹${formData.totalPayment.toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <h3>Total Payment in words (in Rs.)</h3>
          <table>
            <tr>
              <th>Crores</th>
              <th>Lakhs</th>
              <th>Thousands</th>
              <th>Hundreds</th>
              <th>Tens</th>
              <th>Units</th>
            </tr>
            <tr>
              <td>${formData.totalPaymentWords.crores}</td>
              <td>${formData.totalPaymentWords.lakhs}</td>
              <td>${formData.totalPaymentWords.thousands}</td>
              <td>${formData.totalPaymentWords.hundreds}</td>
              <td>${formData.totalPaymentWords.tens}</td>
              <td>${formData.totalPaymentWords.units}</td>
            </tr>
          </table>
        </div>

        <div class="section">
          <div class="field">
            <span class="label">Unique Acknowledgement Number:</span> ${formData.uniqueAcknowledgementNo}
          </div>
        </div>

        <div style="margin-top: 30px;">
          <p><strong>*To be uploaded automatically</strong></p>
          <p><strong>**In dd/mm/yyyy format</strong></p>
          <p><strong>***Against Period of tenancy, the number of months the property is rented for the financial year may be mentioned.</strong></p>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownload = () => {
    const htmlContent = generateHTML();
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Form_26QC_${formData.financialYear}_${formData.quarterPeriod}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const inputClass = (hasError = false) => `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500
    ${hasError ? 'border-red-500' : 'border-gray-300'}
    ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900'}
  `;

  const selectClass = () => `
    w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500
    ${theme === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900'}
  `;

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            type="button"
            onClick={() => navigate('/app/tds')}
            className={`mr-4 p-2 rounded-full transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Back to TDS Module"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Form 26QC</h1>
            <p className="text-sm text-gray-500">
              Challan-cum-statement of deduction of tax under section 194 IA
            </p>
            <p className="text-xs text-gray-400">
              [See section 194 IA, rule 30(2B) and rule 31A(4)]
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Download size={20} />
            Download Form
          </button>
        </div>
      </div>

      <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="p-6">
          {/* Form Header */}
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold">FORM NO. 26QC</h2>
            <p className="text-sm mt-1">[See section 194 IA, rule 30(2B) and rule 31A(4)]</p>
            <p className="font-semibold mt-2">Challan-cum-statement of deduction of tax under section 194 IA</p>
          </div>            {/* Basic Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Financial Year</label>
                  <select
                    title="Financial Year"
                    value={formData.financialYear}
                    onChange={(e) => handleInputChange('financialYear', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="2024-25">2024-25</option>
                    <option value="2023-24">2023-24</option>
                    <option value="2022-23">2022-23</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Quarter Period</label>
                  <select
                    title="Quarter Period"
                    value={formData.quarterPeriod}
                    onChange={(e) => handleInputChange('quarterPeriod', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="Q1">Q1 (Apr-Jun)</option>
                    <option value="Q2">Q2 (Jul-Sep)</option>
                    <option value="Q3">Q3 (Oct-Dec)</option>
                    <option value="Q4">Q4 (Jan-Mar)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Major Head Code</label>
                <input
                  title='Major Head Code'
                  type="text"
                  value="0021"
                  disabled
                  className={`${inputClass()} opacity-60`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Minor Head Code</label>
                <input
                  title='Minor Head Code'
                  type="text"
                  value="00400"
                  disabled
                  className={`${inputClass()} opacity-60`}
                />
              </div>
            </div>

            {/* Transferee/Payer/Buyer Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Transferee/Payer/Buyer Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">PAN *</label>
                  <input
                    title='PAN of Transferee/Payer/Buyer'
                    type="text"
                    value={formData.transfereePAN}
                    onChange={(e) => handleInputChange('transfereePAN', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className={inputClass(!!errors.transfereePAN)}
                  />
                  {errors.transfereePAN && <p className="text-red-500 text-xs mt-1">{errors.transfereePAN}</p>}
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Category of PAN</label>
                  <select
                    title='Category of PAN'
                    value={formData.transfereeCategory}
                    onChange={(e) => handleInputChange('transfereeCategory', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select Category</option>
                    <option value="I">Individual</option>
                    <option value="HUF">HUF</option>
                    <option value="C">Company</option>
                    <option value="F">Firm</option>
                    <option value="AOP">AOP</option>
                    <option value="BOI">BOI</option>
                    <option value="G">Government</option>
                    <option value="L">Local Authority</option>
                    <option value="T">Trust</option>
                    <option value="A">Association of Persons</option>
                    <option value="J">Artificial Juridical Person</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    title='Status of PAN'
                    value={formData.transfereeStatus}
                    onChange={(e) => handleInputChange('transfereeStatus', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select Status</option>
                    <option value="R">Resident</option>
                    <option value="NR">Non-Resident</option>
                    <option value="RNO">Resident but Not Ordinarily Resident</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Full Name of Transferee/Payer/Buyer *</label>
                <input
                  title='Full Name of Transferee/Payer/Buyer'
                  type="text"
                  value={formData.transfereeFullName}
                  onChange={(e) => handleInputChange('transfereeFullName', e.target.value)}
                  className={inputClass(!!errors.transfereeFullName)}
                />
                {errors.transfereeFullName && <p className="text-red-500 text-xs mt-1">{errors.transfereeFullName}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Complete Address of Transferee/Payer/Buyer</label>
                <textarea
                  title='Complete Address of Transferee/Payer/Buyer'
                  value={formData.transfereeAddress}
                  onChange={(e) => handleInputChange('transfereeAddress', e.target.value)}
                  rows={3}
                  className={inputClass()}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile No.</label>
                  <input
                    title="Mobile Number of Transferee/Payer/Buyer"
                    type="tel"
                    value={formData.transfereeMobile}
                    onChange={(e) => handleInputChange('transfereeMobile', e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email ID</label>
                  <input
                    title='Email ID of Transferee/Payer/Buyer'
                    type="email"
                    value={formData.transfereeEmail}
                    onChange={(e) => handleInputChange('transfereeEmail', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PIN</label>
                  <input
                    title="PIN Code of Transferee/Payer/Buyer"
                    type="text"
                    value={formData.transfereePIN}
                    onChange={(e) => handleInputChange('transfereePIN', e.target.value)}
                    maxLength={6}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Whether more than one transferee/payer/buyer (Yes/No)</label>
                <select
                  title='Multiple Transferee/Payer/Buyer'
                  value={formData.multipleTransferee}
                  onChange={(e) => handleInputChange('multipleTransferee', e.target.value as 'Yes' | 'No')}
                  className={selectClass()}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Transferor/Payee/Seller Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Transferor/Payee/Seller Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">PAN *</label>
                  <input
                    title="PAN of Transferor/Seller"
                    type="text"
                    value={formData.transferorPAN}
                    onChange={(e) => handleInputChange('transferorPAN', e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    maxLength={10}
                    className={inputClass(!!errors.transferorPAN)}
                  />
                  {errors.transferorPAN && <p className="text-red-500 text-xs mt-1">{errors.transferorPAN}</p>}
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Category of PAN</label>
                  <select
                    title='Category of PAN'
                    value={formData.transferorCategory}
                    onChange={(e) => handleInputChange('transferorCategory', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select Category</option>
                    <option value="I">Individual</option>
                    <option value="HUF">HUF</option>
                    <option value="C">Company</option>
                    <option value="F">Firm</option>
                    <option value="AOP">AOP</option>
                    <option value="BOI">BOI</option>
                    <option value="G">Government</option>
                    <option value="L">Local Authority</option>
                    <option value="T">Trust</option>
                    <option value="A">Association of Persons</option>
                    <option value="J">Artificial Juridical Person</option>
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    title='Status of PAN'
                    value={formData.transferorStatus}
                    onChange={(e) => handleInputChange('transferorStatus', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select Status</option>
                    <option value="R">Resident</option>
                    <option value="NR">Non-Resident</option>
                    <option value="RNO">Resident but Not Ordinarily Resident</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Full Name of Transferor/Payee/Seller *</label>
                <input
                  title='Full Name of Transferor/Payee/Seller'
                  type="text"
                  value={formData.transferorFullName}
                  onChange={(e) => handleInputChange('transferorFullName', e.target.value)}
                  className={inputClass(!!errors.transferorFullName)}
                />
                {errors.transferorFullName && <p className="text-red-500 text-xs mt-1">{errors.transferorFullName}</p>}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Complete Address of Transferor/Payee/Seller</label>
                <textarea
                  title='Complete Address of Transferor/Payee/Seller'
                  value={formData.transferorAddress}
                  onChange={(e) => handleInputChange('transferorAddress', e.target.value)}
                  rows={3}
                  className={inputClass()}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile No.</label>
                  <input
                    title="Mobile Number of Transferor/Payee/Seller"
                    type="tel"
                    value={formData.transferorMobile}
                    onChange={(e) => handleInputChange('transferorMobile', e.target.value)}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email ID</label>
                  <input
                    title='Email ID of Transferor/Payee/Seller'
                    type="email"
                    value={formData.transferorEmail}
                    onChange={(e) => handleInputChange('transferorEmail', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PIN</label>
                  <input
                    title="PIN Code of Transferor/Payee/Seller"
                    type="text"
                    value={formData.transferorPIN}
                    onChange={(e) => handleInputChange('transferorPIN', e.target.value)}
                    maxLength={6}
                    className={inputClass()}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Whether more than one transferor/payee/seller (Yes/No)</label>
                <select
                  title='Multiple Transferor/Payee/Seller'
                  value={formData.multipleTransferor}
                  onChange={(e) => handleInputChange('multipleTransferor', e.target.value as 'Yes' | 'No')}
                  className={selectClass()}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Property Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Property Information</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Complete Address of Property being transferred</label>
                <textarea
                  title='Complete Address of Property being transferred'
                  value={formData.propertyAddress}
                  onChange={(e) => handleInputChange('propertyAddress', e.target.value)}
                  rows={3}
                  className={inputClass()}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">PIN</label>
                <input
                  title="PIN Code of Property Location"
                  type="text"
                  value={formData.propertyPIN}
                  onChange={(e) => handleInputChange('propertyPIN', e.target.value)}
                  maxLength={6}
                  className={inputClass()}
                />
              </div>
            </div>

            {/* Agreement and Payment Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator size={20} />
                Agreement and Payment Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Agreement/Booking *</label>
                  <input
                    title='Date of Agreement/Booking'
                    type="date"
                    value={formData.dateOfAgreement}
                    onChange={(e) => handleInputChange('dateOfAgreement', e.target.value)}
                    className={inputClass(!!errors.dateOfAgreement)}
                  />
                  {errors.dateOfAgreement && <p className="text-red-500 text-xs mt-1">{errors.dateOfAgreement}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Value of Consideration (Amount in Rs.) *</label>
                  <input
                    title='Total Value of Consideration'
                    type="number"
                    value={formData.totalValueOfConsideration}
                    onChange={(e) => handleInputChange('totalValueOfConsideration', parseFloat(e.target.value) || 0)}
                    className={inputClass(!!errors.totalValueOfConsideration)}
                    min="0"
                    step="0.01"
                  />
                  {errors.totalValueOfConsideration && <p className="text-red-500 text-xs mt-1">{errors.totalValueOfConsideration}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment in Installment</label>
                  <select
                    title='Payment in Installment'
                    value={formData.paymentInInstallment}
                    onChange={(e) => handleInputChange('paymentInInstallment', e.target.value as 'Yes' | 'No')}
                    className={selectClass()}
                  >
                    <option value="No">Lump-sum</option>
                    <option value="Yes">Installment</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount Paid/Credited (in Rs.)</label>
                  <input
                    title='Amount Paid/Credited'
                    type="number"
                    value={formData.amountPaidCredited}
                    onChange={(e) => handleInputChange('amountPaidCredited', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of payment/credit</label>
                  <input
                    title='Date of Payment/Credit'
                    type="date"
                    value={formData.dateOfPaymentCredit}
                    onChange={(e) => handleInputChange('dateOfPaymentCredit', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate at which deducted</label>
                  <input
                    title='Rate at which deducted'
                    type="number"
                    value={formData.rateOfDeduction}
                    onChange={(e) => handleInputChange('rateOfDeduction', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount of tax deducted at source</label>
                  <input
                    title='Amount of tax deducted at source'
                    type="number"
                    value={formData.amountOfTaxDeducted}
                    onChange={(e) => handleInputChange('amountOfTaxDeducted', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Deduction</label>
                  <input
                    title='Date of Deduction'
                    type="date"
                    value={formData.dateOfDeduction}
                    onChange={(e) => handleInputChange('dateOfDeduction', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Deposit</label>
                  <input
                    title='Date of Deposit'
                    type="date"
                    value={formData.dateOfDeposit}
                    onChange={(e) => handleInputChange('dateOfDeposit', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mode of payment</label>
                  <select
                    title='Mode of payment'
                    value={formData.modeOfPayment}
                    onChange={(e) => handleInputChange('modeOfPayment', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select Mode</option>
                    <option value="Internet Banking">Internet Banking</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="RTGS/NEFT">RTGS/NEFT</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Demand Draft">Demand Draft</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Simultaneous e-tax payment</label>
                  <select
                    title='Simultaneous e-tax payment'
                    value={formData.simultaneousTaxPayment}
                    onChange={(e) => handleInputChange('simultaneousTaxPayment', e.target.value as 'Yes' | 'No')}
                    className={selectClass()}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">e-tax payment on subsequent date</label>
                <select
                  title='e-tax payment on subsequent date'
                  value={formData.taxPaymentOnSubsequentDate}
                  onChange={(e) => handleInputChange('taxPaymentOnSubsequentDate', e.target.value as 'Yes' | 'No')}
                  className={selectClass()}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Details of Payment of Tax Deducted at Source */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Details of Payment of Tax Deducted at Source (Amount in Rs.)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">TDS (Income Tax)</label>
                  <input
                    title='TDS (Income Tax)'
                    type="number"
                    value={formData.tdsIncomeTax}
                    onChange={(e) => handleInputChange('tdsIncomeTax', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interest</label>
                  <input
                    title='Interest'
                    type="number"
                    value={formData.interest}
                    onChange={(e) => handleInputChange('interest', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Fee</label>
                  <input
                    title='Fee'
                    type="number"
                    value={formData.fee}
                    onChange={(e) => handleInputChange('fee', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total payment</label>
                  <input
                    title='Total payment'
                    type="number"
                    value={formData.totalPayment}
                    onChange={(e) => handleInputChange('totalPayment', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Total Payment in words */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Total Payment in words (in Rs.)</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Crores</label>
                  <input
                    title='Crores'
                    type="text"
                    value={formData.totalPaymentWords.crores}
                    onChange={(e) => handleInputChange('totalPaymentWords', {
                      ...formData.totalPaymentWords,
                      crores: e.target.value
                    })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lakhs</label>
                  <input
                    title='Lakhs'
                    type="text"
                    value={formData.totalPaymentWords.lakhs}
                    onChange={(e) => handleInputChange('totalPaymentWords', {
                      ...formData.totalPaymentWords,
                      lakhs: e.target.value
                    })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thousands</label>
                  <input
                    title='Thousands'
                    type="text"
                    value={formData.totalPaymentWords.thousands}
                    onChange={(e) => handleInputChange('totalPaymentWords', {
                      ...formData.totalPaymentWords,
                      thousands: e.target.value
                    })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hundreds</label>
                  <input
                    title='Hundreds'
                    type="text"
                    value={formData.totalPaymentWords.hundreds}
                    onChange={(e) => handleInputChange('totalPaymentWords', {
                      ...formData.totalPaymentWords,
                      hundreds: e.target.value
                    })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tens</label>
                  <input
                    title='Tens'
                    type="text"
                    value={formData.totalPaymentWords.tens}
                    onChange={(e) => handleInputChange('totalPaymentWords', {
                      ...formData.totalPaymentWords,
                      tens: e.target.value
                    })}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Units</label>
                  <input
                    title='Units'
                    type="text"
                    value={formData.totalPaymentWords.units}
                    onChange={(e) => handleInputChange('totalPaymentWords', {
                      ...formData.totalPaymentWords,
                      units: e.target.value
                    })}
                    className={inputClass()}
                  />
                </div>
              </div>

              <p className="text-xs text-gray-500 mt-2">
                *To be uploaded automatically
              </p>
            </div>

            {/* Acknowledgement */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Acknowledgement</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Unique Acknowledgement Number</label>
                <input
                  title='Unique Acknowledgement Number'
                  type="text"
                  value={formData.uniqueAcknowledgementNo}
                  onChange={(e) => handleInputChange('uniqueAcknowledgementNo', e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>

            {/* Footer Notes */}
            <div className="mt-8 pt-6 border-t border-gray-300">
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>*To be uploaded automatically</strong></p>
                <p><strong>**In dd/mm/yyyy format</strong></p>
                <p><strong>***Against Period of tenancy, the number of months the property is rented for the financial year may be mentioned.</strong></p>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default Form26QC;
