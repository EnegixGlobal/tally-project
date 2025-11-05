import React from 'react';
import { FileSpreadsheet, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const VoucherTemplateGenerator: React.FC = () => {
  
  const generateSalesTemplate = () => {
    const sampleData = [
      {
        'Date': '15/01/2024',
        'Voucher No': 'SAL001',
        'Party Name': 'ABC Electronics Ltd',
        'Item Name': 'Laptop HP Pavilion',
        'Quantity': 2,
        'Rate': 45000,
        'Amount': 90000,
        'HSN Code': '8471',
        'GST Rate': 18,
        'Narration': 'Sales to ABC Electronics for Q1 order'
      },
      {
        'Date': '16/01/2024',
        'Voucher No': 'SAL002',
        'Party Name': 'XYZ Computers',
        'Item Name': 'Mobile Samsung Galaxy',
        'Quantity': 5,
        'Rate': 25000,
        'Amount': 125000,
        'HSN Code': '8517',
        'GST Rate': 18,
        'Narration': 'Bulk sale to XYZ Computers'
      },
      {
        'Date': '17/01/2024',
        'Voucher No': 'SAL003',
        'Party Name': 'Tech Solutions Pvt Ltd',
        'Item Name': 'Printer Canon LaserJet',
        'Quantity': 3,
        'Rate': 15000,
        'Amount': 45000,
        'HSN Code': '8443',
        'GST Rate': 18,
        'Narration': 'Office equipment sale'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales_Vouchers');
    XLSX.writeFile(wb, 'Sales_Voucher_Template.xlsx');
  };

  const generatePurchaseTemplate = () => {
    const sampleData = [
      {
        'Date': '15/01/2024',
        'Voucher No': 'PUR001',
        'Supplier Name': 'Tech Suppliers Ltd',
        'Item Name': 'Laptop HP',
        'Quantity': 10,
        'Rate': 42000,
        'Amount': 420000,
        'HSN Code': '8471',
        'GST Rate': 18,
        'Narration': 'Purchase for inventory stock'
      },
      {
        'Date': '16/01/2024',
        'Voucher No': 'PUR002',
        'Supplier Name': 'Mobile World Distributors',
        'Item Name': 'Mobile Samsung',
        'Quantity': 20,
        'Rate': 22000,
        'Amount': 440000,
        'HSN Code': '8517',
        'GST Rate': 18,
        'Narration': 'Monthly mobile stock purchase'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase_Vouchers');
    XLSX.writeFile(wb, 'Purchase_Voucher_Template.xlsx');
  };

  const generatePaymentTemplate = () => {
    const sampleData = [
      {
        'Date': '15/01/2024',
        'Voucher No': 'PAY001',
        'Paid To': 'Office Rent',
        'Amount': 25000,
        'Payment Mode': 'Cash',
        'Narration': 'Monthly office rent payment for January'
      },
      {
        'Date': '16/01/2024',
        'Voucher No': 'PAY002',
        'Paid To': 'Electricity Bill',
        'Amount': 8500,
        'Payment Mode': 'Bank',
        'Narration': 'Monthly electricity bill payment'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payment_Vouchers');
    XLSX.writeFile(wb, 'Payment_Voucher_Template.xlsx');
  };

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FileSpreadsheet className="h-5 w-5 mr-2 text-green-600" />
        Download Sample Templates
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={generateSalesTemplate}
          className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
        >
          <Download className="h-5 w-5 text-blue-600" />
          <span className="text-blue-700 font-medium">Sales Template</span>
        </button>
        
        <button
          onClick={generatePurchaseTemplate}
          className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-green-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
        >
          <Download className="h-5 w-5 text-green-600" />
          <span className="text-green-700 font-medium">Purchase Template</span>
        </button>
        
        <button
          onClick={generatePaymentTemplate}
          className="flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
        >
          <Download className="h-5 w-5 text-purple-600" />
          <span className="text-purple-700 font-medium">Payment Template</span>
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">How to use these templates:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>1. Download the template for your voucher type</li>
          <li>2. Fill in your data following the sample format</li>
          <li>3. Save the file and upload it using the Import feature</li>
          <li>4. Review the imported data and save to your accounts</li>
        </ul>
      </div>
    </div>
  );
};

export default VoucherTemplateGenerator;
