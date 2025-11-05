import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Eye, Edit, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import type { VoucherEntry, VoucherEntryLine } from '../../../types';

// Number to words conversion
const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertHundreds = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertHundreds(n % 100) : '');
  };

  if (num === 0) return 'Zero';
  
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const hundreds = num % 1000;

  let result = '';
  if (crores) result += convertHundreds(crores) + ' Crore ';
  if (lakhs) result += convertHundreds(lakhs) + ' Lakh ';
  if (thousands) result += convertHundreds(thousands) + ' Thousand ';
  if (hundreds) result += convertHundreds(hundreds);

  return result.trim();
};

const QuotationList: React.FC = () => {
  const { theme, vouchers, ledgers } = useAppContext();
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Safe fallbacks with proper typing
  const safeVouchers = vouchers || [];
  const safeLedgers = ledgers || [];

  // Filter only quotation vouchers
  const quotationVouchers = safeVouchers.filter(voucher => 
    voucher.type === 'quotation' || voucher.isQuotation === true
  );

  // Pagination calculations
  const totalPages = Math.ceil(quotationVouchers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentQuotations = quotationVouchers.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToPrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Print functionality
  const printQuotationList = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Quotations List</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              font-size: 11px;
              line-height: 1.3;
              margin: 0;
              padding: 20px;
              background: white;
              color: black;
            }
            
            .invoice-container {
              max-width: 210mm;
              margin: 0 auto;
              border: 2px solid #000;
              background: white;
            }
            
            .invoice-header {
              background-color: #f5f5f5;
              padding: 10px;
              text-align: center;
              border-bottom: 1px solid #000;
            }
            
            .invoice-title {
              font-size: 18px;
              font-weight: bold;
              margin: 0;
              letter-spacing: 2px;
            }
            
            .info-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 15px;
              border-bottom: 1px solid #000;
              font-size: 10px;
            }
            
            .company-section {
              padding: 15px;
              border-bottom: 1px solid #000;
            }
            
            .company-header {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
            }
            
            .company-logo {
              width: 40px;
              height: 40px;
              background-color: #3b82f6;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              margin-right: 15px;
              color: white;
              font-weight: bold;
              font-size: 16px;
            }
            
            .company-name {
              font-size: 16px;
              font-weight: bold;
              margin: 0;
              text-transform: uppercase;
            }
            
            .company-address {
              margin: 5px 0;
              font-size: 10px;
            }
            
            .company-info {
              font-size: 10px;
              display: flex;
              gap: 20px;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 0;
              font-size: 10px;
            }
            
            th, td { 
              border: 1px solid #000; 
              padding: 6px 8px; 
              text-align: left; 
              vertical-align: top;
            }
            
            th { 
              background-color: #f5f5f5; 
              font-weight: bold; 
              text-align: center;
              font-size: 9px;
            }
            
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            
            .total-amount { 
              font-weight: bold; 
              color: #16a34a; 
            }
            
            .summary-section { 
              margin-top: 20px; 
              padding: 15px; 
              background-color: #f8f9fa; 
              border: 1px solid #ddd;
              border-radius: 5px;
            }
            
            .summary-title { 
              margin: 0 0 10px 0; 
              font-size: 14px;
              font-weight: bold;
            }
            
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 11px;
            }
            
            .signatures-section {
              display: flex;
              justify-content: space-between;
              margin-top: 30px;
              padding: 20px 15px;
              border-top: 1px solid #000;
            }
            
            .signature-area {
              text-align: center;
              width: 45%;
            }
            
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 50px;
              padding-top: 5px;
              font-size: 10px;
            }
            
            @media print { 
              body { 
                margin: 0; 
                padding: 10px;
              }
              .no-print { 
                display: none; 
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
            <!-- Header Section -->
            <div class="invoice-header">
              <h1 class="invoice-title">📋 SALES QUOTATIONS LIST</h1>
              <div style="margin-top: 5px; font-size: 11px; color: #666;">
                Comprehensive List of All Quotations
              </div>
            </div>
            
            <!-- Info Row -->
            <div class="info-row">
              <span><strong>GENERATED ON:</strong> ${new Date().toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
              <span><strong>TOTAL QUOTATIONS:</strong> ${quotationVouchers.length}</span>
            </div>
            
            <!-- Company Section -->
            <div class="company-section">
              <div class="company-header">
                <div class="company-logo">
                  E
                </div>
                <div>
                  <h2 class="company-name">Your Company Name</h2>
                  <p class="company-address">Your Business Address</p>
                </div>
              </div>
              <div class="company-info">
                <span><strong>GSTIN:</strong> Your GST Number</span>
                <span><strong>PAN NO:</strong> Your PAN Number</span>
              </div>
            </div>
            
            <!-- Quotations Table -->
            <table>
              <thead>
                <tr>
                  <th style="width: 8%;">Sr No</th>
                  <th style="width: 15%;">Quotation No.</th>
                  <th style="width: 12%;">Date</th>
                  <th style="width: 25%;">Party Name</th>
                  <th style="width: 8%;">Items</th>
                  <th style="width: 15%;">Reference</th>
                  <th style="width: 17%;">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                ${quotationVouchers.map((quotation, index) => `
                  <tr>
                    <td class="text-center">${index + 1}</td>
                    <td class="font-bold">${quotation.number}</td>
                    <td class="text-center">${formatDate(quotation.date)}</td>
                    <td>${getPartyName(quotation.partyId)}</td>
                    <td class="text-center">${quotation.entries?.length || 0}</td>
                    <td>${quotation.referenceNo || '-'}</td>
                    <td class="text-right total-amount">₹${calculateQuotationTotal(quotation).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
                
                <!-- Summary Row -->
                <tr style="background-color: #f0f9ff; font-weight: bold;">
                  <td colspan="6" class="text-right" style="padding: 10px;"><strong>GRAND TOTAL:</strong></td>
                  <td class="text-right total-amount" style="font-size: 12px; padding: 10px;">
                    ₹${quotationVouchers.reduce((total, q) => total + calculateQuotationTotal(q), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Summary Section -->
            <div class="summary-section">
              <h3 class="summary-title">📊 Quotation Analysis Summary</h3>
              <div class="summary-row">
                <span><strong>Total Number of Quotations:</strong></span>
                <span>${quotationVouchers.length}</span>
              </div>
              <div class="summary-row">
                <span><strong>Total Quoted Value:</strong></span>
                <span>₹${quotationVouchers.reduce((total, q) => total + calculateQuotationTotal(q), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="summary-row">
                <span><strong>Average Quotation Value:</strong></span>
                <span>₹${quotationVouchers.length > 0 ? (quotationVouchers.reduce((total, q) => total + calculateQuotationTotal(q), 0) / quotationVouchers.length).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
              </div>
              <div class="summary-row">
                <span><strong>Report Generated By:</strong></span>
                <span>Quotation Management System</span>
              </div>
            </div>

            <!-- Signatures Section -->
            <div class="signatures-section">
              <div class="signature-area">
                <div style="font-weight: bold; margin-bottom: 10px;">
                  For Your Company Name
                </div>
                <div class="signature-line">
                  Authorised Signatory
                </div>
              </div>
              <div class="signature-area">
                <div style="font-weight: bold; margin-bottom: 10px;">
                  Prepared By
                </div>
                <div class="signature-line">
                  System Administrator
                </div>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // Helper function to get party name
  const getPartyName = (partyId: string | undefined): string => {
    if (!partyId) return 'No Party';
    const party = safeLedgers.find(l => l.id === partyId);
    return party?.name || 'Unknown Party';
  };

  // Helper function to format date
  const formatDate = (date: string | Date): string => {
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Calculate quotation total
  const calculateQuotationTotal = (voucher: VoucherEntry): number => {
    if (!voucher.entries || voucher.entries.length === 0) return 0;
    
    return voucher.entries.reduce((total: number, entry: VoucherEntryLine) => {
      const quantity = entry.quantity || 0;
      const rate = entry.rate || 0;
      const gstRate = (entry.cgstRate || 0) + (entry.sgstRate || 0) + (entry.igstRate || 0);
      const baseAmount = quantity * rate;
      const gstAmount = baseAmount * gstRate / 100;
      return total + baseAmount + gstAmount;
    }, 0);
  };

  return (
    <div className='pt-[56px] px-4'>
      {/* Header Section */}
      <div className="flex items-center mb-6">
        <button
          title='Back to Vouchers'
          onClick={() => navigate('/app/vouchers')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">📋 Sales Quotations</h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage all your sales quotations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {quotationVouchers.length > 0 && (
            <button
              onClick={printQuotationList}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                theme === 'dark' 
                  ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
              title="Print Quotation List"
            >
              <Printer size={20} />
              Print List
            </button>
          )}
          <button
            onClick={() => navigate('/app/vouchers/quotation/create')}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              theme === 'dark' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Plus size={20} />
            New Quotation
          </button>
        </div>
      </div>

      {/* Quotations List */}
      <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm border border-gray-200'}`}>
        {quotationVouchers && quotationVouchers.length > 0 ? (
          <div className="p-6">
            {/* Pagination Info */}
            <div className={`flex justify-between items-center mb-4 pb-4 border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}`}>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Showing {startIndex + 1} to {Math.min(endIndex, quotationVouchers.length)} of {quotationVouchers.length} quotations
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPrevious}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'cursor-not-allowed opacity-50'
                        : theme === 'dark'
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1 rounded transition-colors ${
                          currentPage === page
                            ? theme === 'dark'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-500 text-white'
                            : theme === 'dark'
                            ? 'bg-gray-600 hover:bg-gray-500 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  
                  <button
                    onClick={goToNext}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'cursor-not-allowed opacity-50'
                        : theme === 'dark'
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                    title="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {currentQuotations.map((quotation, index) => (
                <div
                  key={quotation.id || `quotation-${index}`}
                  className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                    theme === 'dark' 
                      ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500' 
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-violet-900/50' : 'bg-violet-100'}`}>
                          <FileText size={16} className={theme === 'dark' ? 'text-violet-300' : 'text-violet-600'} />
                        </div>
                        <div>
                          <span className="font-semibold text-lg">
                            {quotation.number}
                          </span>
                          <span className={`ml-3 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                            theme === 'dark' ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-700'
                          }`}>
                            Quotation
                          </span>
                        </div>
                      </div>
                      
                      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        <div>
                          <span className="font-medium">Date:</span>
                          <span className="ml-2">{formatDate(quotation.date)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Party:</span>
                          <span className="ml-2 truncate">{getPartyName(quotation.partyId)}</span>
                        </div>
                        <div>
                          <span className="font-medium">Items:</span>
                          <span className="ml-2">{quotation.entries?.length || 0}</span>
                        </div>
                      </div>

                      {quotation.referenceNo && (
                        <div className={`mt-2 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          <span className="font-medium">Reference:</span>
                          <span className="ml-2">{quotation.referenceNo}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className={`text-lg font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                        ₹{calculateQuotationTotal(quotation).toLocaleString('en-IN', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-3">
                        <button
                          onClick={() => {
                            // View quotation details
                            console.log('Viewing quotation:', quotation);
                            alert(`Quotation Details:\nNumber: ${quotation.number}\nParty: ${getPartyName(quotation.partyId)}\nTotal: ₹${calculateQuotationTotal(quotation).toFixed(2)}`);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'bg-gray-600 hover:bg-gray-500 text-gray-300' 
                              : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                          }`}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        
                        <button
                          onClick={() => {
                            // Print individual quotation
                            const printWindow = window.open('', '_blank');
                            if (!printWindow) return;

                            const grandTotal = calculateQuotationTotal(quotation);
                            const gstAmount = grandTotal * 0.18; // Assuming 18% GST
                            const baseAmount = grandTotal - gstAmount;
                            const cgst = gstAmount / 2;
                            const sgst = gstAmount / 2;

                            const printContent = `
                              <!DOCTYPE html>
                              <html>
                                <head>
                                  <title>Sales Quotation - ${quotation.number}</title>
                                  <style>
                                    * {
                                      margin: 0;
                                      padding: 0;
                                      box-sizing: border-box;
                                    }
                                    
                                    body { 
                                      font-family: Arial, sans-serif; 
                                      font-size: 12px;
                                      line-height: 1.4;
                                      margin: 0;
                                      padding: 20px;
                                      background: white;
                                      color: black;
                                    }
                                    
                                    .invoice-container {
                                      max-width: 210mm;
                                      margin: 0 auto;
                                      border: 2px solid #000;
                                      background: white;
                                    }
                                    
                                    .invoice-header {
                                      background-color: #f5f5f5;
                                      padding: 15px;
                                      text-align: center;
                                      border-bottom: 2px solid #000;
                                    }
                                    
                                    .invoice-title {
                                      font-size: 24px;
                                      font-weight: bold;
                                      margin: 0;
                                      letter-spacing: 3px;
                                      color: #2563eb;
                                    }
                                    
                                    .invoice-subtitle {
                                      font-size: 12px;
                                      color: #666;
                                      margin-top: 5px;
                                    }
                                    
                                    .info-row {
                                      display: flex;
                                      justify-content: space-between;
                                      padding: 8px 15px;
                                      border-bottom: 1px solid #000;
                                      font-size: 11px;
                                    }
                                    
                                    .company-section {
                                      padding: 20px;
                                      border-bottom: 2px solid #000;
                                    }
                                    
                                    .company-header {
                                      display: flex;
                                      align-items: center;
                                      margin-bottom: 15px;
                                    }
                                    
                                    .company-logo {
                                      width: 50px;
                                      height: 50px;
                                      background-color: #3b82f6;
                                      border-radius: 50%;
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                      margin-right: 20px;
                                      color: white;
                                      font-weight: bold;
                                      font-size: 20px;
                                    }
                                    
                                    .company-name {
                                      font-size: 20px;
                                      font-weight: bold;
                                      margin: 0;
                                      text-transform: uppercase;
                                      color: #1f2937;
                                    }
                                    
                                    .company-address {
                                      margin: 8px 0;
                                      font-size: 12px;
                                      color: #4b5563;
                                    }
                                    
                                    .company-info {
                                      font-size: 11px;
                                      display: flex;
                                      gap: 25px;
                                      color: #374151;
                                    }
                                    
                                    .party-section {
                                      display: flex;
                                      border-bottom: 1px solid #000;
                                    }
                                    
                                    .party-details {
                                      flex: 1;
                                      padding: 15px;
                                      border-right: 1px solid #000;
                                    }
                                    
                                    .quotation-details {
                                      flex: 1;
                                      padding: 15px;
                                    }
                                    
                                    .section-title {
                                      font-weight: bold;
                                      font-size: 13px;
                                      margin-bottom: 10px;
                                      color: #1f2937;
                                      border-bottom: 1px solid #e5e7eb;
                                      padding-bottom: 5px;
                                    }
                                    
                                    .detail-row {
                                      display: flex;
                                      justify-content: space-between;
                                      margin-bottom: 6px;
                                      font-size: 11px;
                                    }
                                    
                                    table { 
                                      width: 100%; 
                                      border-collapse: collapse; 
                                      margin: 0;
                                      font-size: 11px;
                                    }
                                    
                                    th, td { 
                                      border: 1px solid #000; 
                                      padding: 8px; 
                                      text-align: left; 
                                      vertical-align: top;
                                    }
                                    
                                    th { 
                                      background-color: #f5f5f5; 
                                      font-weight: bold; 
                                      text-align: center;
                                      font-size: 10px;
                                      color: #1f2937;
                                    }
                                    
                                    .text-center { text-align: center; }
                                    .text-right { text-align: right; }
                                    .font-bold { font-weight: bold; }
                                    
                                    .amount-cell { 
                                      text-align: right; 
                                      font-family: monospace;
                                      font-weight: bold;
                                    }
                                    
                                    .total-section {
                                      border-top: 2px solid #000;
                                    }
                                    
                                    .total-row {
                                      display: flex;
                                      justify-content: space-between;
                                      padding: 8px 15px;
                                      border-bottom: 1px solid #000;
                                      font-size: 12px;
                                    }
                                    
                                    .grand-total {
                                      background-color: #dcfce7;
                                      font-weight: bold;
                                      font-size: 14px;
                                      color: #166534;
                                    }
                                    
                                    .amount-in-words {
                                      padding: 15px;
                                      border-bottom: 1px solid #000;
                                      background-color: #f9fafb;
                                      font-size: 12px;
                                    }
                                    
                                    .terms-section {
                                      padding: 15px;
                                      border-bottom: 1px solid #000;
                                      font-size: 10px;
                                    }
                                    
                                    .terms-title {
                                      font-weight: bold;
                                      margin-bottom: 8px;
                                      font-size: 12px;
                                    }
                                    
                                    .terms-list {
                                      list-style: none;
                                      padding: 0;
                                    }
                                    
                                    .terms-list li {
                                      margin-bottom: 4px;
                                      padding-left: 15px;
                                      position: relative;
                                    }
                                    
                                    .terms-list li:before {
                                      content: "•";
                                      position: absolute;
                                      left: 0;
                                      color: #3b82f6;
                                      font-weight: bold;
                                    }
                                    
                                    .signatures-section {
                                      display: flex;
                                      justify-content: space-between;
                                      padding: 25px 15px;
                                    }
                                    
                                    .signature-area {
                                      text-align: center;
                                      width: 45%;
                                    }
                                    
                                    .signature-line {
                                      border-top: 2px solid #000;
                                      margin-top: 60px;
                                      padding-top: 8px;
                                      font-size: 11px;
                                      font-weight: bold;
                                    }
                                    
                                    .stamp-area {
                                      margin-top: 20px;
                                      border: 1px dashed #999;
                                      height: 60px;
                                      display: flex;
                                      align-items: center;
                                      justify-content: center;
                                      color: #999;
                                      font-size: 10px;
                                    }
                                    
                                    @media print { 
                                      body { 
                                        margin: 0; 
                                        padding: 10px;
                                      }
                                      .no-print { 
                                        display: none; 
                                      }
                                    }
                                  </style>
                                </head>
                                <body>
                                  <div class="invoice-container">
                                    <!-- Header Section -->
                                    <div class="invoice-header">
                                      <h1 class="invoice-title">📋 SALES QUOTATION</h1>
                                      <div class="invoice-subtitle">Professional Quotation Document</div>
                                    </div>
                                    
                                    <!-- Info Row -->
                                    <div class="info-row">
                                      <span><strong>📄 QUOTATION NO:</strong> ${quotation.number}</span>
                                      <span><strong>📅 DATE:</strong> ${formatDate(quotation.date)}</span>
                                    </div>
                                    
                                    <!-- Company Section -->
                                    <div class="company-section">
                                      <div class="company-header">
                                        <div class="company-logo">
                                          E
                                        </div>
                                        <div>
                                          <h2 class="company-name">Your Company Name</h2>
                                          <p class="company-address">Your Business Address Line 1<br>City, State - PIN CODE</p>
                                        </div>
                                      </div>
                                      <div class="company-info">
                                        <span><strong>GSTIN:</strong> Your GST Number</span>
                                        <span><strong>PAN NO:</strong> Your PAN Number</span>
                                        <span><strong>CIN:</strong> Your CIN Number</span>
                                        <span><strong>📞 PHONE:</strong> +91-XXXXXXXXXX</span>
                                      </div>
                                    </div>
                                    
                                    <!-- Party and Quotation Details -->
                                    <div class="party-section">
                                      <div class="party-details">
                                        <div class="section-title">🏢 PARTY DETAILS</div>
                                        <div class="detail-row">
                                          <span><strong>Party Name:</strong></span>
                                          <span>${getPartyName(quotation.partyId)}</span>
                                        </div>
                                        <div class="detail-row">
                                          <span><strong>Address:</strong></span>
                                          <span>Party Address</span>
                                        </div>
                                        <div class="detail-row">
                                          <span><strong>GSTIN:</strong></span>
                                          <span>Party GST Number</span>
                                        </div>
                                        <div class="detail-row">
                                          <span><strong>State:</strong></span>
                                          <span>Party State</span>
                                        </div>
                                      </div>
                                      
                                      <div class="quotation-details">
                                        <div class="section-title">📋 QUOTATION DETAILS</div>
                                        <div class="detail-row">
                                          <span><strong>Reference No:</strong></span>
                                          <span>${quotation.referenceNo || 'N/A'}</span>
                                        </div>
                                        <div class="detail-row">
                                          <span><strong>Valid Till:</strong></span>
                                          <span>${new Date(new Date(quotation.date).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</span>
                                        </div>
                                        <div class="detail-row">
                                          <span><strong>Sales Person:</strong></span>
                                          <span>Sales Representative</span>
                                        </div>
                                        <div class="detail-row">
                                          <span><strong>Payment Terms:</strong></span>
                                          <span>As per agreement</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <!-- Items Table -->
                                    <table>
                                      <thead>
                                        <tr>
                                          <th style="width: 5%;">Sr.</th>
                                          <th style="width: 30%;">Item Description</th>
                                          <th style="width: 8%;">HSN</th>
                                          <th style="width: 8%;">Qty</th>
                                          <th style="width: 8%;">Unit</th>
                                          <th style="width: 12%;">Rate</th>
                                          <th style="width: 8%;">Disc%</th>
                                          <th style="width: 8%;">GST%</th>
                                          <th style="width: 13%;">Amount</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${quotation.entries?.map((entry, index) => `
                                          <tr>
                                            <td class="text-center">${index + 1}</td>
                                            <td style="font-weight: 500;">${'-'}</td>
                                            <td class="text-center">${entry.hsnCode || '-'}</td>
                                            <td class="text-center">${entry.quantity || 0}</td>
                                            <td class="text-center">${'Nos'}</td>
                                            <td class="amount-cell">₹${(entry.rate || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                            <td class="text-center">${entry.discount || 0}%</td>
                                            <td class="text-center">18%</td>
                                            <td class="amount-cell">₹${((entry.quantity || 0) * (entry.rate || 0) * (1 - (entry.discount || 0) / 100)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                          </tr>
                                        `).join('')}
                                        
                                        <!-- Spacer rows for professional look -->
                                        ${Array(Math.max(0, 5 - (quotation.entries?.length || 0))).fill(0).map(() => `
                                          <tr style="height: 25px;">
                                            <td>&nbsp;</td>
                                            <td>&nbsp;</td>
                                            <td>&nbsp;</td>
                                            <td>&nbsp;</td>
                                            <td>&nbsp;</td>
                                            <td>&nbsp;</td>
                                            <td>&nbsp;</td>
                                            <td>&nbsp;</td>
                                            <td>&nbsp;</td>
                                          </tr>
                                        `).join('')}
                                      </tbody>
                                    </table>
                                    
                                    <!-- Total Section -->
                                    <div class="total-section">
                                      <div class="total-row">
                                        <span><strong>💰 Subtotal (Before Tax):</strong></span>
                                        <span><strong>₹${baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                                      </div>
                                      <div class="total-row">
                                        <span><strong>🏛️ CGST @ 9%:</strong></span>
                                        <span><strong>₹${cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                                      </div>
                                      <div class="total-row">
                                        <span><strong>🏛️ SGST @ 9%:</strong></span>
                                        <span><strong>₹${sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                                      </div>
                                      <div class="total-row grand-total">
                                        <span><strong>🎯 GRAND TOTAL:</strong></span>
                                        <span><strong>₹${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></span>
                                      </div>
                                    </div>
                                    
                                    <!-- Amount in Words -->
                                    <div class="amount-in-words">
                                      <strong>💬 Amount in Words:</strong> ${numberToWords(grandTotal)} Only
                                    </div>
                                    
                                    <!-- Terms and Conditions -->
                                    <div class="terms-section">
                                      <div class="terms-title">📋 Terms & Conditions:</div>
                                      <ul class="terms-list">
                                        <li>This quotation is valid for 30 days from the date of issue</li>
                                        <li>Prices quoted are subject to change without prior notice</li>
                                        <li>Payment terms as per mutual agreement</li>
                                        <li>Goods once sold will not be taken back or exchanged</li>
                                        <li>All disputes subject to local jurisdiction only</li>
                                        <li>Delivery charges extra if applicable</li>
                                      </ul>
                                    </div>
                                    
                                    <!-- Signatures Section -->
                                    <div class="signatures-section">
                                      <div class="signature-area">
                                        <div style="font-weight: bold; margin-bottom: 10px; color: #1f2937;">
                                          🏢 For Your Company Name
                                        </div>
                                        <div class="stamp-area">
                                          [ Company Seal & Stamp ]
                                        </div>
                                        <div class="signature-line">
                                          Authorised Signatory
                                        </div>
                                      </div>
                                      <div class="signature-area">
                                        <div style="font-weight: bold; margin-bottom: 10px; color: #1f2937;">
                                          👤 Customer Acceptance
                                        </div>
                                        <div style="margin-top: 20px; padding: 10px; border: 1px solid #e5e7eb; min-height: 60px; background-color: #f9fafb;">
                                          <div style="font-size: 10px; color: #6b7280;">Customer Signature & Date</div>
                                        </div>
                                        <div class="signature-line">
                                          Received & Accepted
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </body>
                              </html>
                            `;

                            printWindow.document.write(printContent);
                            printWindow.document.close();
                            printWindow.focus();
                            printWindow.print();
                            printWindow.close();
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'bg-green-600 hover:bg-green-500 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                          title="Print Quotation"
                        >
                          <Printer size={16} />
                        </button>
                        
                        <button
                          onClick={() => navigate(`/app/vouchers/sales/edit/${quotation.id}`)}
                          className={`p-2 rounded-lg transition-colors ${
                            theme === 'dark' 
                              ? 'bg-blue-600 hover:bg-blue-500 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                          title="Edit Quotation"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <FileText size={64} className="mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No Quotations Found</h3>
            <p className="text-sm mb-6">You haven't created any sales quotations yet.</p>
            <button
              onClick={() => navigate('/app/vouchers/quotation/create')}
              className={`px-6 py-3 rounded-lg flex items-center gap-2 mx-auto ${
                theme === 'dark' 
                  ? 'bg-violet-600 hover:bg-violet-700 text-white' 
                  : 'bg-violet-500 hover:bg-violet-600 text-white'
              }`}
            >
              <Plus size={20} />
              Create Your First Quotation
            </button>
          </div>
        )}
      </div>

      {/* Stats Section */}
      {quotationVouchers && quotationVouchers.length > 0 && (
        <div className={`mt-6 p-4 rounded-lg border-l-4 ${
          theme === 'dark' 
            ? 'bg-violet-900/20 border-violet-500 text-violet-200' 
            : 'bg-violet-50 border-violet-400 text-violet-700'
        }`}>
          <h3 className="font-semibold text-sm mb-2">📊 Quotation Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="font-medium">Total Quotations:</span>
              <span className="ml-2">{quotationVouchers.length}</span>
            </div>
            <div>
              <span className="font-medium">Total Value:</span>
              <span className="ml-2">₹{quotationVouchers.reduce((total, q) => total + calculateQuotationTotal(q), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div>
              <span className="font-medium">Avg. Value:</span>
              <span className="ml-2">₹{quotationVouchers.length > 0 ? (quotationVouchers.reduce((total, q) => total + calculateQuotationTotal(q), 0) / quotationVouchers.length).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationList;
