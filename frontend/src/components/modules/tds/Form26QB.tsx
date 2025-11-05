import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Download, Calculator } from 'lucide-react';

interface Form26QBData {
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

const Form26QB: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Form26QBData>({
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

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleInputChange = (field: keyof Form26QBData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate tax amount when consideration amount or rate changes
    if (field === 'totalValueOfConsideration' || field === 'rateOfDeduction') {
      const consideration = Number(field === 'totalValueOfConsideration' ? value : formData.totalValueOfConsideration);
      const rate = Number(field === 'rateOfDeduction' ? value : formData.rateOfDeduction);
      const taxAmount = (consideration * rate) / 100;
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        amountOfTaxDeducted: taxAmount,
        tdsIncomeTax: taxAmount,
        totalPayment: taxAmount + prev.interest + prev.fee
      }));
    }
    
    // Auto-calculate total payment when tax components change
    if (field === 'tdsIncomeTax' || field === 'interest' || field === 'fee') {
      const tds = Number(field === 'tdsIncomeTax' ? value : formData.tdsIncomeTax);
      const int = Number(field === 'interest' ? value : formData.interest);
      const feeAmt = Number(field === 'fee' ? value : formData.fee);
      
      setFormData(prev => ({
        ...prev,
        [field]: value,
        totalPayment: tds + int + feeAmt
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleWordsChange = (wordField: keyof Form26QBData['totalPaymentWords'], value: string) => {
    setFormData(prev => ({
      ...prev,
      totalPaymentWords: {
        ...prev.totalPaymentWords,
        [wordField]: value
      }
    }));
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    
    // Required field validations
    if (!formData.transfereePAN) newErrors.transfereePAN = 'Transferee PAN is required';
    if (!formData.transfereeFullName) newErrors.transfereeFullName = 'Transferee name is required';
    if (!formData.transferorPAN) newErrors.transferorPAN = 'Transferor PAN is required';
    if (!formData.transferorFullName) newErrors.transferorFullName = 'Transferor name is required';
    if (!formData.totalValueOfConsideration) newErrors.totalValueOfConsideration = 'Total value is required';
    if (!formData.dateOfAgreement) newErrors.dateOfAgreement = 'Date of agreement is required';
    
    // PAN format validation
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (formData.transfereePAN && !panRegex.test(formData.transfereePAN)) {
      newErrors.transfereePAN = 'Invalid PAN format';
    }
    if (formData.transferorPAN && !panRegex.test(formData.transferorPAN)) {
      newErrors.transferorPAN = 'Invalid PAN format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      alert('Form 26QB saved successfully!');
      console.log('Form 26QB Data:', formData);
    }
  };

  const handleDownload = () => {
    // Create HTML content for the form
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Form 26QB - Challan-cum-statement of deduction of tax under section 194-IA</title>
        <style>
          * { box-sizing: border-box; }
          body { 
            font-family: 'Times New Roman', serif; 
            margin: 0; 
            padding: 20px; 
            line-height: 1.4; 
            color: #000; 
            background: #fff;
          }
          
          .form-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            padding: 20px;
          }
          
          .government-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
          }
          
          .government-header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .government-header h2 {
            font-size: 18px;
            font-weight: bold;
            margin: 0 0 10px 0;
            color: #333;
          }
          
          .government-header p {
            font-size: 14px;
            margin: 5px 0;
            color: #666;
          }
          
          .form-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            padding: 10px;
            background: #f8f9fa;
            border: 1px solid #ddd;
          }
          
          .section {
            margin-bottom: 25px;
            border: 2px solid #000;
            page-break-inside: avoid;
          }
          
          .section-header {
            background: #e9ecef;
            padding: 10px 15px;
            border-bottom: 1px solid #000;
            font-weight: bold;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .section-content {
            padding: 15px;
          }
          
          .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .form-field {
            margin-bottom: 12px;
          }
          
          .field-label {
            font-weight: bold;
            font-size: 11px;
            color: #333;
            text-transform: uppercase;
            margin-bottom: 3px;
            display: block;
          }
          
          .field-value {
            font-size: 14px;
            color: #000;
            border-bottom: 1px solid #000;
            padding: 3px 5px;
            min-height: 20px;
            display: block;
          }
          
          .full-width {
            grid-column: 1 / -1;
          }
          
          .official-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            border: 2px solid #000;
          }
          
          .official-table th {
            background: #f8f9fa;
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
          }
          
          .official-table td {
            border: 1px solid #000;
            padding: 10px 8px;
            text-align: center;
            font-size: 13px;
          }
          
          .amount-cell {
            text-align: right;
            font-weight: bold;
          }
          
          .pan-section {
            display: grid;
            grid-template-columns: 1fr 1fr 2fr;
            gap: 10px;
            align-items: end;
          }
          
          .words-section {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 10px;
            margin-top: 15px;
          }
          
          .signature-section {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 50px;
          }
          
          .signature-box {
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 10px;
            margin-top: 50px;
          }
          
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
          }
          
          .important-note {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            margin: 15px 0;
            font-size: 12px;
            border-left: 4px solid #f39c12;
          }
          
          @media print {
            body { margin: 0; padding: 10px; }
            .form-container { box-shadow: none; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="form-container">
          <!-- Government Header -->
          <div class="government-header">
            <h1>FORM NO. 26QB</h1>
            <h2>Challan-cum-statement of deduction of tax under section 194-IA</h2>
            <p><strong>[See section 194-IA, rule 30 and rule 31A]</strong></p>
            
            <div class="form-info">
              <div><strong>Financial Year:</strong> ${formData.financialYear}</div>
              <div><strong>Quarter:</strong> ${formData.quarterPeriod}</div>
              <div><strong>Form Generated:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
            </div>
          </div>

          <!-- Basic Information Section -->
          <div class="section">
            <div class="section-header">Basic Information</div>
            <div class="section-content">
              <div class="form-grid">
                <div class="form-field">
                  <span class="field-label">Major Head Code</span>
                  <span class="field-value">0021</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Minor Head Code</span>
                  <span class="field-value">00400</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Section</span>
                  <span class="field-value">194-IA</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Transferee Information Section -->
          <div class="section">
            <div class="section-header">Permanent Account Number (PAN) of Transferee/Payer/Buyer</div>
            <div class="section-content">
              <div class="pan-section">
                <div class="form-field">
                  <span class="field-label">PAN</span>
                  <span class="field-value">${formData.transfereePAN || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Category</span>
                  <span class="field-value">${formData.transfereeCategory || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Status</span>
                  <span class="field-value">${formData.transfereeStatus || '&nbsp;'}</span>
                </div>
              </div>
              
              <div class="form-field full-width">
                <span class="field-label">Full Name of Transferee/Payer/Buyer</span>
                <span class="field-value">${formData.transfereeFullName || '&nbsp;'}</span>
              </div>
              
              <div class="form-field full-width">
                <span class="field-label">Complete Address</span>
                <span class="field-value">${formData.transfereeAddress || '&nbsp;'}</span>
              </div>
              
              <div class="form-grid">
                <div class="form-field">
                  <span class="field-label">Mobile No.</span>
                  <span class="field-value">${formData.transfereeMobile || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Email ID</span>
                  <span class="field-value">${formData.transfereeEmail || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">PIN Code</span>
                  <span class="field-value">${formData.transfereePIN || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Multiple Transferee</span>
                  <span class="field-value">${formData.multipleTransferee}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Transferor Information Section -->
          <div class="section">
            <div class="section-header">Permanent Account Number (PAN) of Transferor/Payee/Seller</div>
            <div class="section-content">
              <div class="pan-section">
                <div class="form-field">
                  <span class="field-label">PAN</span>
                  <span class="field-value">${formData.transferorPAN || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Category</span>
                  <span class="field-value">${formData.transferorCategory || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Status</span>
                  <span class="field-value">${formData.transferorStatus || '&nbsp;'}</span>
                </div>
              </div>
              
              <div class="form-field full-width">
                <span class="field-label">Full Name of Transferor/Payee/Seller</span>
                <span class="field-value">${formData.transferorFullName || '&nbsp;'}</span>
              </div>
              
              <div class="form-field full-width">
                <span class="field-label">Complete Address</span>
                <span class="field-value">${formData.transferorAddress || '&nbsp;'}</span>
              </div>
              
              <div class="form-grid">
                <div class="form-field">
                  <span class="field-label">Mobile No.</span>
                  <span class="field-value">${formData.transferorMobile || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Email ID</span>
                  <span class="field-value">${formData.transferorEmail || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">PIN Code</span>
                  <span class="field-value">${formData.transferorPIN || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Multiple Transferor</span>
                  <span class="field-value">${formData.multipleTransferor}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Property Information Section -->
          <div class="section">
            <div class="section-header">Complete Address of Property Transferred</div>
            <div class="section-content">
              <div class="form-field full-width">
                <span class="field-label">Property Address</span>
                <span class="field-value">${formData.propertyAddress || '&nbsp;'}</span>
              </div>
              <div class="form-field">
                <span class="field-label">PIN Code</span>
                <span class="field-value">${formData.propertyPIN || '&nbsp;'}</span>
              </div>
            </div>
          </div>

          <!-- Agreement and Payment Details Section -->
          <div class="section">
            <div class="section-header">Agreement and Payment Details</div>
            <div class="section-content">
              <table class="official-table">
                <thead>
                  <tr>
                    <th>Date of Agreement/Booking</th>
                    <th>Total Value of Consideration (Rs.)</th>
                    <th>Payment Type</th>
                    <th>Amount Paid/Credited (Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${formData.dateOfAgreement || '___________'}</td>
                    <td class="amount-cell">${formData.totalValueOfConsideration ? formData.totalValueOfConsideration.toLocaleString('en-IN') : '___________'}</td>
                    <td>${formData.paymentInInstallment === 'Yes' ? 'Installment' : 'Lump-sum'}</td>
                    <td class="amount-cell">${formData.amountPaidCredited ? formData.amountPaidCredited.toLocaleString('en-IN') : '___________'}</td>
                  </tr>
                </tbody>
              </table>
              
              <table class="official-table">
                <thead>
                  <tr>
                    <th>Date of Payment/Credit</th>
                    <th>Rate of Deduction (%)</th>
                    <th>Amount of Tax Deducted (Rs.)</th>
                    <th>Date of Deduction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${formData.dateOfPaymentCredit || '___________'}</td>
                    <td class="amount-cell">${formData.rateOfDeduction}%</td>
                    <td class="amount-cell">${formData.amountOfTaxDeducted ? formData.amountOfTaxDeducted.toLocaleString('en-IN') : '___________'}</td>
                    <td>${formData.dateOfDeduction || '___________'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Deposit Information Section -->
          <div class="section">
            <div class="section-header">Deposit Information</div>
            <div class="section-content">
              <div class="form-grid">
                <div class="form-field">
                  <span class="field-label">Date of Deposit</span>
                  <span class="field-value">${formData.dateOfDeposit || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Mode of Payment</span>
                  <span class="field-value">${formData.modeOfPayment || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Simultaneous e-tax payment</span>
                  <span class="field-value">${formData.simultaneousTaxPayment}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">e-tax payment on subsequent date</span>
                  <span class="field-value">${formData.taxPaymentOnSubsequentDate}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tax Payment Details Section -->
          <div class="section">
            <div class="section-header">Details of Payment of Tax Deducted at Source (Amount in Rs.)</div>
            <div class="section-content">
              <table class="official-table">
                <thead>
                  <tr>
                    <th>TDS Income Tax<br><small>(Credit of tax to the deductee shall be given for this amount)</small></th>
                    <th>Interest</th>
                    <th>Fee</th>
                    <th>Total Payment</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="amount-cell">${formData.tdsIncomeTax ? formData.tdsIncomeTax.toLocaleString('en-IN') : '0'}</td>
                    <td class="amount-cell">${formData.interest ? formData.interest.toLocaleString('en-IN') : '0'}</td>
                    <td class="amount-cell">${formData.fee ? formData.fee.toLocaleString('en-IN') : '0'}</td>
                    <td class="amount-cell"><strong>${formData.totalPayment ? formData.totalPayment.toLocaleString('en-IN') : '0'}</strong></td>
                  </tr>
                </tbody>
              </table>
              
              <div class="important-note">
                <strong>Note:</strong> Credit of tax deducted will be given to the deductee only for the amount shown in column "TDS Income Tax".
              </div>
            </div>
          </div>

          <!-- Total Payment in Words Section -->
          <div class="section">
            <div class="section-header">Total Payment in Words (Rupees)</div>
            <div class="section-content">
              <div class="words-section">
                <div class="form-field">
                  <span class="field-label">Crores</span>
                  <span class="field-value">${formData.totalPaymentWords.crores || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Lakhs</span>
                  <span class="field-value">${formData.totalPaymentWords.lakhs || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Thousands</span>
                  <span class="field-value">${formData.totalPaymentWords.thousands || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Hundreds</span>
                  <span class="field-value">${formData.totalPaymentWords.hundreds || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Tens</span>
                  <span class="field-value">${formData.totalPaymentWords.tens || '&nbsp;'}</span>
                </div>
                <div class="form-field">
                  <span class="field-label">Units</span>
                  <span class="field-value">${formData.totalPaymentWords.units || '&nbsp;'}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Acknowledgement Section -->
          <div class="section">
            <div class="section-header">Acknowledgement</div>
            <div class="section-content">
              <div class="form-field">
                <span class="field-label">Unique Acknowledgement Number (generated by TIN-NSDL)</span>
                <span class="field-value">${formData.uniqueAcknowledgementNo || 'To be generated after submission'}</span>
              </div>
              
              <div class="signature-section">
                <div class="signature-box">
                  <strong>Signature of the Deductor</strong>
                </div>
                <div class="signature-box">
                  <strong>Date & Stamp</strong>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p><strong>Important:</strong> This is a computer-generated form. Please verify all details before submission.</p>
            <p>Generated on: ${new Date().toLocaleDateString('en-IN')} at ${new Date().toLocaleTimeString('en-IN')}</p>
            <p>© Income Tax Department, Government of India</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a blob with the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `Form26QB_${formData.transfereePAN || 'draft'}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL
    URL.revokeObjectURL(url);
    
    // Show success message
    alert('Form 26QB downloaded successfully as HTML file!');
  };

  const inputClass = (hasError: boolean = false) => `
    w-full px-3 py-2 border rounded-md text-sm
    ${hasError ? 'border-red-500' : theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300'}
    ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
    focus:outline-none focus:ring-2 focus:ring-blue-500
  `;

  const selectClass = (hasError: boolean = false) => `
    w-full px-3 py-2 border rounded-md text-sm
    ${hasError ? 'border-red-500' : theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-300'}
    ${theme === 'dark' ? 'text-white' : 'text-gray-900'}
    focus:outline-none focus:ring-2 focus:ring-blue-500
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
            <h1 className="text-2xl font-bold">Form 26QB</h1>
            <p className="text-sm text-gray-500">
              Challan-cum-statement of deduction of tax under section 194-IA
            </p>
            <p className="text-xs text-gray-400">
              [See section 194-IA, rule 30 and rule 31A]
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
            <Download size={18} />
            Download
          </button>
        </div>
      </div>

      <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Header Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 p-4 border rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-1">Financial Year</label>
                <select
                  title='Financial Year'
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
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                Permanent Account Number (PAN) of Transferee/Payer/Buyer
              </h3>
              
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
                    <option value="C">Company</option>
                    <option value="F">Firm</option>
                    <option value="H">HUF</option>
                    <option value="A">AOP</option>
                    <option value="B">BOI</option>
                    <option value="G">Government</option>
                    <option value="L">Local Authority</option>
                    <option value="J">Artificial Juridical Person</option>
                  </select>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium mb-1">Status of PAN</label>
                  <select
                    title='Status of PAN'
                    value={formData.transfereeStatus}
                    onChange={(e) => handleInputChange('transfereeStatus', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select Status</option>
                    <option value="01">Resident</option>
                    <option value="02">Non-Resident</option>
                    <option value="03">Not Ordinarily Resident</option>
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
                  onChange={(e) => handleInputChange('multipleTransferee', e.target.value)}
                  className={selectClass()}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Transferor/Payee/Seller Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                Permanent Account Number (PAN) of Transferor/Payee/Seller
              </h3>
              
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
                    <option value="C">Company</option>
                    <option value="F">Firm</option>
                    <option value="H">HUF</option>
                    <option value="A">AOP</option>
                    <option value="B">BOI</option>
                    <option value="G">Government</option>
                    <option value="L">Local Authority</option>
                    <option value="J">Artificial Juridical Person</option>
                  </select>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-sm font-medium mb-1">Status of PAN</label>
                  <select
                    title='Status of PAN'
                    value={formData.transferorStatus}
                    onChange={(e) => handleInputChange('transferorStatus', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select Status</option>
                    <option value="01">Resident</option>
                    <option value="02">Non-Resident</option>
                    <option value="03">Not Ordinarily Resident</option>
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
                  onChange={(e) => handleInputChange('multipleTransferor', e.target.value)}
                  className={selectClass()}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            {/* Property Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText size={20} />
                Complete Address of Property transferred
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Property Address</label>
                <textarea
                  title='Complete Address of Property Transferred '
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
                  <label className="block text-sm font-medium mb-1">Payment in installment or lump-sum</label>
                  <select
                  title='Payment in Installment or Lump-sum'
                    value={formData.paymentInInstallment}
                    onChange={(e) => handleInputChange('paymentInInstallment', e.target.value)}
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
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount of tax deducted at source</label>
                  <input
                    title='Amount of Tax Deducted at Source'
                    type="number"
                    value={formData.amountOfTaxDeducted}
                    onChange={(e) => handleInputChange('amountOfTaxDeducted', parseFloat(e.target.value) || 0)}
                    className={inputClass()}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Date of Deduction</label>
                <input
                title='Date of Deduction'
                  type="date"
                  value={formData.dateOfDeduction}
                  onChange={(e) => handleInputChange('dateOfDeduction', e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>

            {/* Deposit Information */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Deposit Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
                    title='Mode of Payment'
                    value={formData.modeOfPayment}
                    onChange={(e) => handleInputChange('modeOfPayment', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="">Select Mode</option>
                    <option value="Internet Banking">Internet Banking</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="RTGS/NEFT">RTGS/NEFT</option>
                    <option value="Over the Counter">Over the Counter</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Simultaneous e-tax payment</label>
                  <select
                   title='Simultaneous e-tax Payment'
                    value={formData.simultaneousTaxPayment}
                    onChange={(e) => handleInputChange('simultaneousTaxPayment', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">e-tax payment on subsequent date</label>
                  <select
                   title='e-tax Payment on Subsequent Date'
                    value={formData.taxPaymentOnSubsequentDate}
                    onChange={(e) => handleInputChange('taxPaymentOnSubsequentDate', e.target.value)}
                    className={selectClass()}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Tax Payment Details */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Details of Payment of Tax Deducted at Source (Amount in Rs.)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">TDS Income Tax (Credit of tax to the deductee shall be given for this amount)</label>
                  <input
                   title='TDS Income Tax'
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
                    title='Total Payment'
                    type="number"
                    value={formData.totalPayment}
                    disabled
                    className={`${inputClass()} opacity-60`}
                  />
                </div>
              </div>
            </div>

            {/* Total Payment in Words */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Total Payment in Words (in Rs.)</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Crores</label>
                  <input
                    title='Crores in Total Payment in Words'
                    type="text"
                    value={formData.totalPaymentWords.crores}
                    onChange={(e) => handleWordsChange('crores', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Lakhs</label>
                  <input
                    title='Lakhs in Total Payment in Words'
                    type="text"
                    value={formData.totalPaymentWords.lakhs}
                    onChange={(e) => handleWordsChange('lakhs', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Thousands</label>
                  <input
                    title='Thousands in Total Payment in Words'
                    type="text"
                    value={formData.totalPaymentWords.thousands}
                    onChange={(e) => handleWordsChange('thousands', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hundreds</label>
                  <input
                    title='Hundreds in Total Payment in Words'
                    type="text"
                    value={formData.totalPaymentWords.hundreds}
                    onChange={(e) => handleWordsChange('hundreds', e.target.value)}
                    className={inputClass()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tens</label>
                  <input
                    title='Tens in Total Payment in Words'
                    type="text"
                    value={formData.totalPaymentWords.tens}
                    onChange={(e) => handleWordsChange('tens', e.target.value)}
                    className={inputClass()}
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Units</label>
                <input
                  title='Units in Total Payment in Words'
                  type="text"
                  value={formData.totalPaymentWords.units}
                  onChange={(e) => handleWordsChange('units', e.target.value)}
                  className={inputClass()}
                />
              </div>
            </div>

            {/* Acknowledgement */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4">Acknowledgement</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Unique Acknowledgement no. (generated by TIN)</label>
                <input
                  type="text"
                  value={formData.uniqueAcknowledgementNo}
                  onChange={(e) => handleInputChange('uniqueAcknowledgementNo', e.target.value)}
                  className={inputClass()}
                  placeholder="Will be generated after submission"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/app/tds')}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Save size={18} />
                Save Form 26QB
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Form26QB;