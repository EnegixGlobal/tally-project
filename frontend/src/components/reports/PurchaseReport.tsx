// import React, { useState, useMemo, useRef } from 'react';
// import { useAppContext } from '../../context/AppContext';
// import { useNavigate } from 'react-router-dom';
// import { 
//   ArrowLeft, 
//   Printer, 
//   Download, 
//   Filter, 
//   Eye,
//   BarChart3,
//   TrendingDown,
//   DollarSign,
//   Package
// } from 'lucide-react';
// import * as XLSX from 'xlsx';

// interface PurchaseData {
//   id: string;
//   voucherNo: string;
//   voucherType: string;
//   date: string;
//   supplierName: string;
//   supplierGSTIN?: string;
//   billAmount: number;
//   taxableAmount: number;
//   cgstAmount: number;
//   sgstAmount: number;
//   igstAmount: number;
//   cessAmount: number;
//   totalTaxAmount: number;
//   netAmount: number;
//   itemDetails: {
//     itemName: string;
//     hsnCode: string;
//     quantity: number;
//     rate: number;
//     amount: number;
//     discount?: number;
//   }[];
//   paymentTerms?: string;
//   dueDate?: string;
//   status: 'Paid' | 'Unpaid' | 'Partially Paid' | 'Overdue';
//   reference?: string;
//   narration?: string;
//   supplierInvoiceNo?: string;
//   supplierInvoiceDate?: string;
// }

// interface FilterState {
//   dateRange: string;
//   fromDate: string;
//   toDate: string;
//   supplierFilter: string;
//   itemFilter: string;
//   voucherTypeFilter: string;
//   statusFilter: string;
//   amountRangeMin: string;
//   amountRangeMax: string;
// }

// interface SupplierGroup {
//   supplierName: string;
//   supplierGSTIN?: string;
//   totalAmount: number;
//   totalTax: number;
//   transactionCount: number;
//   transactions: PurchaseData[];
// }

// interface ItemGroup {
//   itemName: string;
//   hsnCode: string;
//   totalQuantity: number;
//   totalAmount: number;
//   transactionCount: number;
//   averageRate: number;
// }

// const PurchaseReportComponent: React.FC = () => {
//   const { theme } = useAppContext();
//   const navigate = useNavigate();
//   const printRef = useRef<HTMLDivElement>(null);

//   const [showFilterPanel, setShowFilterPanel] = useState(false);
//   const [selectedView, setSelectedView] = useState<'summary' | 'detailed' | 'itemwise' | 'supplierwise'>('summary');
//   const [filters, setFilters] = useState<FilterState>({
//     dateRange: 'this-month',
//     fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
//     toDate: new Date().toISOString().split('T')[0],
//     supplierFilter: '',
//     itemFilter: '',
//     voucherTypeFilter: '',
//     statusFilter: '',
//     amountRangeMin: '',
//     amountRangeMax: ''
//   });
  
//   const [sortConfig, setSortConfig] = useState<{
//     key: keyof PurchaseData;
//     direction: 'asc' | 'desc';
//   }>({ key: 'date', direction: 'desc' });

//   // Filter and sort purchase data
//   const filteredData = useMemo(() => {
//     // Mock purchase data - in real implementation, this would come from vouchers
//     const mockPurchaseData: PurchaseData[] = [
//       {
//         id: '1',
//         voucherNo: 'PUR/001',
//         voucherType: 'Purchase',
//         date: '2024-12-01',
//         supplierName: 'ABC Suppliers Ltd',
//         supplierGSTIN: '27AAAAA0000A1Z5',
//         billAmount: 118000,
//         taxableAmount: 100000,
//         cgstAmount: 9000,
//         sgstAmount: 9000,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 18000,
//         netAmount: 118000,
//         itemDetails: [
//           { itemName: 'Raw Materials', hsnCode: '3901', quantity: 100, rate: 1000, amount: 100000 }
//         ],
//         paymentTerms: '30 Days',
//         dueDate: '2024-12-31',
//         status: 'Unpaid',
//         supplierInvoiceNo: 'INV-2024-001',
//         supplierInvoiceDate: '2024-11-30'
//       },
//       {
//         id: '2',
//         voucherNo: 'PUR/002',
//         voucherType: 'Purchase',
//         date: '2024-12-02',
//         supplierName: 'XYZ Trading Co',
//         supplierGSTIN: '29BBBBB0000B1Z6',
//         billAmount: 59000,
//         taxableAmount: 50000,
//         cgstAmount: 4500,
//         sgstAmount: 4500,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 9000,
//         netAmount: 59000,
//         itemDetails: [
//           { itemName: 'Office Supplies', hsnCode: '4817', quantity: 50, rate: 1000, amount: 50000 }
//         ],
//         paymentTerms: '15 Days',
//         dueDate: '2024-12-17',
//         status: 'Paid',
//         supplierInvoiceNo: 'INV-XYZ-045',
//         supplierInvoiceDate: '2024-12-01'
//       },
//       {
//         id: '3',
//         voucherNo: 'PUR/003',
//         voucherType: 'Purchase',
//         date: '2024-12-03',
//         supplierName: 'PQR Industries',
//         supplierGSTIN: '07CCCCC0000C1Z7',
//         billAmount: 236000,
//         taxableAmount: 200000,
//         cgstAmount: 18000,
//         sgstAmount: 18000,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 36000,
//         netAmount: 236000,
//         itemDetails: [
//           { itemName: 'Machinery Parts', hsnCode: '8481', quantity: 20, rate: 10000, amount: 200000 }
//         ],
//         paymentTerms: '45 Days',
//         dueDate: '2025-01-17',
//         status: 'Partially Paid',
//         supplierInvoiceNo: 'PQR-2024-789',
//         supplierInvoiceDate: '2024-12-02'
//       }
//     ];
//     const filtered = mockPurchaseData.filter(purchase => {
//       const purchaseDate = new Date(purchase.date);
//       const fromDate = new Date(filters.fromDate);
//       const toDate = new Date(filters.toDate);
      
//       const dateInRange = purchaseDate >= fromDate && purchaseDate <= toDate;
//       const supplierMatch = !filters.supplierFilter || 
//         purchase.supplierName.toLowerCase().includes(filters.supplierFilter.toLowerCase());
//       const statusMatch = !filters.statusFilter || purchase.status === filters.statusFilter;
//       const voucherTypeMatch = !filters.voucherTypeFilter || purchase.voucherType === filters.voucherTypeFilter;
      
//       return dateInRange && supplierMatch && statusMatch && voucherTypeMatch;
//     });

//     // Sort data
//     filtered.sort((a, b) => {
//       const aValue = a[sortConfig.key];
//       const bValue = b[sortConfig.key];
      
//       if (aValue == null && bValue == null) return 0;
//       if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
//       if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
      
//       if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
//       if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
//       return 0;
//     });

//     return filtered;
//   }, [filters, sortConfig]);

//   // Group data by supplier
//   const supplierGroups = useMemo((): SupplierGroup[] => {
//     const groups = filteredData.reduce((acc, purchase) => {
//       const key = purchase.supplierName;
//       if (!acc[key]) {
//         acc[key] = {
//           supplierName: purchase.supplierName,
//           supplierGSTIN: purchase.supplierGSTIN,
//           totalAmount: 0,
//           totalTax: 0,
//           transactionCount: 0,
//           transactions: []
//         };
//       }
//       acc[key].totalAmount += purchase.netAmount;
//       acc[key].totalTax += purchase.totalTaxAmount;
//       acc[key].transactionCount++;
//       acc[key].transactions.push(purchase);
//       return acc;
//     }, {} as Record<string, SupplierGroup>);

//     return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
//   }, [filteredData]);

//   // Group data by item
//   const itemGroups = useMemo((): ItemGroup[] => {
//     const groups = filteredData.reduce((acc, purchase) => {
//       purchase.itemDetails.forEach(item => {
//         const key = `${item.itemName}-${item.hsnCode}`;
//         if (!acc[key]) {
//           acc[key] = {
//             itemName: item.itemName,
//             hsnCode: item.hsnCode,
//             totalQuantity: 0,
//             totalAmount: 0,
//             transactionCount: 0,
//             averageRate: 0
//           };
//         }
//         acc[key].totalQuantity += item.quantity;
//         acc[key].totalAmount += item.amount;
//         acc[key].transactionCount++;
//       });
//       return acc;
//     }, {} as Record<string, ItemGroup>);

//     // Calculate average rates
//     Object.values(groups).forEach(group => {
//       group.averageRate = group.totalAmount / group.totalQuantity;
//     });

//     return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
//   }, [filteredData]);

//   // Summary calculations
//   const summary = useMemo(() => {
//     const totalAmount = filteredData.reduce((sum, purchase) => sum + purchase.netAmount, 0);
//     const totalTax = filteredData.reduce((sum, purchase) => sum + purchase.totalTaxAmount, 0);
//     const totalTaxable = filteredData.reduce((sum, purchase) => sum + purchase.taxableAmount, 0);
//     const paidAmount = filteredData
//       .filter(p => p.status === 'Paid')
//       .reduce((sum, purchase) => sum + purchase.netAmount, 0);
//     const unpaidAmount = filteredData
//       .filter(p => p.status === 'Unpaid' || p.status === 'Overdue')
//       .reduce((sum, purchase) => sum + purchase.netAmount, 0);

//     return {
//       totalTransactions: filteredData.length,
//       totalAmount,
//       totalTax,
//       totalTaxable,
//       paidAmount,
//       unpaidAmount,
//       averageAmount: filteredData.length > 0 ? totalAmount / filteredData.length : 0
//     };
//   }, [filteredData]);

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 2
//     }).format(amount);
//   };

//   const handleSort = (key: keyof PurchaseData) => {
//     setSortConfig(prev => ({
//       key,
//       direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
//     }));
//   };

//   const handleFilterChange = (key: keyof FilterState, value: string) => {
//     setFilters(prev => ({ ...prev, [key]: value }));
//   };

//   const handleDateRangeChange = (range: string) => {
//     const today = new Date();
//     let fromDate = new Date();
//     let toDate = new Date();

//     switch (range) {
//       case 'today':
//         fromDate = toDate = today;
//         break;
//       case 'yesterday':
//         fromDate = toDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
//         break;
//       case 'this-week':
//         fromDate = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
//         break;
//       case 'this-month':
//         fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
//         break;
//       case 'this-quarter': {
//         const quarterStart = Math.floor(today.getMonth() / 3) * 3;
//         fromDate = new Date(today.getFullYear(), quarterStart, 1);
//         break;
//       }
//       case 'this-year':
//         fromDate = new Date(today.getFullYear(), 0, 1);
//         break;
//     }

//     setFilters(prev => ({
//       ...prev,
//       dateRange: range,
//       fromDate: fromDate.toISOString().split('T')[0],
//       toDate: toDate.toISOString().split('T')[0]
//     }));
//   };

//   const handlePrint = () => {
//     if (printRef.current) {
//       const printWindow = window.open('', '_blank');
//       if (printWindow) {
//         printWindow.document.write(`
//           <html>
//             <head>
//               <title>Purchase Report</title>
//               <style>
//                 body { font-family: Arial, sans-serif; margin: 20px; }
//                 table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//                 th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
//                 th { background-color: #f2f2f2; }
//                 .header { text-align: center; margin-bottom: 30px; }
//                 .summary { margin: 20px 0; }
//                 .currency { text-align: right; }
//                 @media print { .no-print { display: none; } }
//               </style>
//             </head>
//             <body>
//               ${printRef.current.innerHTML}
//             </body>
//           </html>
//         `);
//         printWindow.document.close();
//         printWindow.print();
//       }
//     }
//   };

//   const handleExport = () => {
//     const exportData = filteredData.map(purchase => ({
//       'Voucher No': purchase.voucherNo,
//       'Date': purchase.date,
//       'Supplier': purchase.supplierName,
//       'Supplier GSTIN': purchase.supplierGSTIN || '',
//       'Supplier Invoice No': purchase.supplierInvoiceNo || '',
//       'Taxable Amount': purchase.taxableAmount,
//       'CGST': purchase.cgstAmount,
//       'SGST': purchase.sgstAmount,
//       'IGST': purchase.igstAmount,
//       'Total Tax': purchase.totalTaxAmount,
//       'Net Amount': purchase.netAmount,
//       'Status': purchase.status,
//       'Due Date': purchase.dueDate || ''
//     }));

//     const ws = XLSX.utils.json_to_sheet(exportData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'Purchase Report');
//     XLSX.writeFile(wb, `Purchase_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
//   };

//   return (
//     <div className="pt-[56px] px-4">
//       {/* Header */}
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center">
//           <button
//             onClick={() => navigate('/app/reports')}
//             title="Back to Reports"
//             className={`p-2 rounded-lg mr-3 ${
//               theme === 'dark' 
//                 ? 'bg-gray-700 hover:bg-gray-600 text-white' 
//                 : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
//             }`}
//           >
//             <ArrowLeft size={20} />
//           </button>
//           <h1 className="text-2xl font-bold">Purchase Report</h1>
//         </div>
//         <div className="flex space-x-2">
//           <button
//             onClick={() => setShowFilterPanel(!showFilterPanel)}
//             title="Toggle Filters"
//             className={`p-2 rounded-lg ${
//               showFilterPanel
//                 ? (theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500 text-white')
//                 : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
//             }`}
//           >
//             <Filter size={16} />
//           </button>
//           <button
//             onClick={handlePrint}
//             title="Print Report"
//             className={`p-2 rounded-lg ${
//               theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
//             }`}
//           >
//             <Printer size={16} />
//           </button>
//           <button
//             onClick={handleExport}
//             title="Export to Excel"
//             className={`p-2 rounded-lg ${
//               theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
//             }`}
//           >
//             <Download size={16} />
//           </button>
//         </div>
//       </div>

//       {/* Filter Panel */}
//       {showFilterPanel && (
//         <div className={`p-4 rounded-lg mb-6 ${
//           theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
//         }`}>
//           <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Date Range</label>
//               <select
//                 title="Select Date Range"
//                 value={filters.dateRange}
//                 onChange={(e) => handleDateRangeChange(e.target.value)}
//                 className={`w-full p-2 rounded border ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 text-white' 
//                     : 'bg-white border-gray-300 text-black'
//                 } outline-none`}
//               >
//                 <option value="today">Today</option>
//                 <option value="yesterday">Yesterday</option>
//                 <option value="this-week">This Week</option>
//                 <option value="this-month">This Month</option>
//                 <option value="this-quarter">This Quarter</option>
//                 <option value="this-year">This Year</option>
//                 <option value="custom">Custom Range</option>
//               </select>
//             </div>

//             {filters.dateRange === 'custom' && (
//               <>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">From Date</label>
//                   <input
//                     type="date"
//                     value={filters.fromDate}
//                     onChange={(e) => handleFilterChange('fromDate', e.target.value)}
//                     aria-label="From Date"
//                     className={`w-full p-2 rounded border ${
//                       theme === 'dark' 
//                         ? 'bg-gray-700 border-gray-600 text-white' 
//                         : 'bg-white border-gray-300 text-black'
//                     } outline-none`}
//                   />
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1">To Date</label>
//                   <input
//                     type="date"
//                     value={filters.toDate}
//                     onChange={(e) => handleFilterChange('toDate', e.target.value)}
//                     aria-label="To Date"
//                     className={`w-full p-2 rounded border ${
//                       theme === 'dark' 
//                         ? 'bg-gray-700 border-gray-600 text-white' 
//                         : 'bg-white border-gray-300 text-black'
//                     } outline-none`}
//                   />
//                 </div>
//               </>
//             )}

//             <div>
//               <label className="block text-sm font-medium mb-1">Supplier</label>
//               <input
//                 type="text"
//                 placeholder="Search supplier..."
//                 value={filters.supplierFilter}
//                 onChange={(e) => handleFilterChange('supplierFilter', e.target.value)}
//                 className={`w-full p-2 rounded border ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 text-white' 
//                     : 'bg-white border-gray-300 text-black'
//                 } outline-none`}
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium mb-1">Status</label>
//               <select
//                 title="Select Status"
//                 value={filters.statusFilter}
//                 onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
//                 className={`w-full p-2 rounded border ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 text-white' 
//                     : 'bg-white border-gray-300 text-black'
//                 } outline-none`}
//               >
//                 <option value="">All Status</option>
//                 <option value="Paid">Paid</option>
//                 <option value="Unpaid">Unpaid</option>
//                 <option value="Partially Paid">Partially Paid</option>
//                 <option value="Overdue">Overdue</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* View Selector */}
//       <div className="flex space-x-2 mb-6">
//         {['summary', 'detailed', 'supplierwise', 'itemwise'].map((view) => (
//           <button
//             key={view}
//             onClick={() => setSelectedView(view as 'summary' | 'detailed' | 'supplierwise' | 'itemwise')}
//             className={`px-4 py-2 rounded-lg capitalize ${
//               selectedView === view
//                 ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
//                 : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
//             }`}
//           >
//             {view}
//           </button>
//         ))}
//       </div>

//       <div ref={printRef}>
//         {/* Summary Cards */}
//         {selectedView === 'summary' && (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//             <div className={`p-4 rounded-lg ${
//               theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//             }`}>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm opacity-75">Total Purchases</p>
//                   <p className="text-2xl font-bold">{summary.totalTransactions}</p>
//                 </div>
//                 <Package className="text-blue-500" size={24} />
//               </div>
//             </div>

//             <div className={`p-4 rounded-lg ${
//               theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//             }`}>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm opacity-75">Total Amount</p>
//                   <p className="text-2xl font-bold">{formatCurrency(summary.totalAmount)}</p>
//                 </div>
//                 <DollarSign className="text-green-500" size={24} />
//               </div>
//             </div>

//             <div className={`p-4 rounded-lg ${
//               theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//             }`}>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm opacity-75">Total Tax</p>
//                   <p className="text-2xl font-bold">{formatCurrency(summary.totalTax)}</p>
//                 </div>
//                 <BarChart3 className="text-orange-500" size={24} />
//               </div>
//             </div>

//             <div className={`p-4 rounded-lg ${
//               theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//             }`}>
//               <div className="flex items-center justify-between">
//                 <div>
//                   <p className="text-sm opacity-75">Pending Amount</p>
//                   <p className="text-2xl font-bold">{formatCurrency(summary.unpaidAmount)}</p>
//                 </div>
//                 <TrendingDown className="text-red-500" size={24} />
//               </div>
//             </div>
//           </div>
//         )}

//         {/* Detailed View */}
//         {selectedView === 'detailed' && (
//           <div className={`rounded-lg overflow-hidden ${
//             theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//           }`}>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className={`${
//                   theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
//                 }`}>
//                   <tr>
//                     <th 
//                       className="text-left p-3 cursor-pointer hover:bg-opacity-75"
//                       onClick={() => handleSort('date')}
//                     >
//                       Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
//                     </th>
//                     <th 
//                       className="text-left p-3 cursor-pointer hover:bg-opacity-75"
//                       onClick={() => handleSort('voucherNo')}
//                     >
//                       Voucher No {sortConfig.key === 'voucherNo' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
//                     </th>
//                     <th 
//                       className="text-left p-3 cursor-pointer hover:bg-opacity-75"
//                       onClick={() => handleSort('supplierName')}
//                     >
//                       Supplier {sortConfig.key === 'supplierName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
//                     </th>
//                     <th className="text-right p-3">Taxable Amount</th>
//                     <th className="text-right p-3">Tax Amount</th>
//                     <th className="text-right p-3">Net Amount</th>
//                     <th className="text-center p-3">Status</th>
//                     <th className="text-center p-3">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {filteredData.map((purchase) => (
//                     <tr key={purchase.id} className={`border-b ${
//                       theme === 'dark' ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
//                     }`}>
//                       <td className="p-3">{new Date(purchase.date).toLocaleDateString()}</td>
//                       <td className="p-3 font-medium">{purchase.voucherNo}</td>
//                       <td className="p-3">
//                         <div>
//                           <div className="font-medium">{purchase.supplierName}</div>
//                           {purchase.supplierGSTIN && (
//                             <div className="text-sm opacity-75">{purchase.supplierGSTIN}</div>
//                           )}
//                         </div>
//                       </td>
//                       <td className="p-3 text-right">{formatCurrency(purchase.taxableAmount)}</td>
//                       <td className="p-3 text-right">{formatCurrency(purchase.totalTaxAmount)}</td>
//                       <td className="p-3 text-right font-medium">{formatCurrency(purchase.netAmount)}</td>
//                       <td className="p-3 text-center">
//                         <span className={`px-2 py-1 rounded-full text-xs ${
//                           purchase.status === 'Paid' 
//                             ? 'bg-green-100 text-green-800' 
//                             : purchase.status === 'Unpaid' || purchase.status === 'Overdue'
//                             ? 'bg-red-100 text-red-800'
//                             : 'bg-yellow-100 text-yellow-800'
//                         }`}>
//                           {purchase.status}
//                         </span>
//                       </td>
//                       <td className="p-3 text-center">
//                         <button
//                           title="View Details"
//                           className={`p-1 rounded ${
//                             theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
//                           }`}
//                         >
//                           <Eye size={16} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Supplier-wise View */}
//         {selectedView === 'supplierwise' && (
//           <div className={`rounded-lg overflow-hidden ${
//             theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//           }`}>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className={`${
//                   theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
//                 }`}>
//                   <tr>
//                     <th className="text-left p-3">Supplier Name</th>
//                     <th className="text-left p-3">GSTIN</th>
//                     <th className="text-right p-3">Transactions</th>
//                     <th className="text-right p-3">Total Amount</th>
//                     <th className="text-right p-3">Total Tax</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {supplierGroups.map((group, index) => (
//                     <tr key={index} className={`border-b ${
//                       theme === 'dark' ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
//                     }`}>
//                       <td className="p-3 font-medium">{group.supplierName}</td>
//                       <td className="p-3">{group.supplierGSTIN || '-'}</td>
//                       <td className="p-3 text-right">{group.transactionCount}</td>
//                       <td className="p-3 text-right font-medium">{formatCurrency(group.totalAmount)}</td>
//                       <td className="p-3 text-right">{formatCurrency(group.totalTax)}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}

//         {/* Item-wise View */}
//         {selectedView === 'itemwise' && (
//           <div className={`rounded-lg overflow-hidden ${
//             theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//           }`}>
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead className={`${
//                   theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
//                 }`}>
//                   <tr>
//                     <th className="text-left p-3">Item Name</th>
//                     <th className="text-left p-3">HSN Code</th>
//                     <th className="text-right p-3">Total Quantity</th>
//                     <th className="text-right p-3">Average Rate</th>
//                     <th className="text-right p-3">Total Amount</th>
//                     <th className="text-right p-3">Transactions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {itemGroups.map((group, index) => (
//                     <tr key={index} className={`border-b ${
//                       theme === 'dark' ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
//                     }`}>
//                       <td className="p-3 font-medium">{group.itemName}</td>
//                       <td className="p-3">{group.hsnCode}</td>
//                       <td className="p-3 text-right">{group.totalQuantity.toLocaleString()}</td>
//                       <td className="p-3 text-right">{formatCurrency(group.averageRate)}</td>
//                       <td className="p-3 text-right font-medium">{formatCurrency(group.totalAmount)}</td>
//                       <td className="p-3 text-right">{group.transactionCount}</td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         )}
//       </div>

//       {/* Pro Tip */}
//       <div className={`mt-6 p-4 rounded-lg ${
//         theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
//       }`}>
//         <p className="text-sm">
//           <span className="font-semibold">Pro Tip:</span> Use filters to narrow down your purchase data. 
//           Click on column headers to sort the data. Export functionality helps in further analysis.
//         </p>
//       </div>
//     </div>
//   );
// };

// export default PurchaseReportComponent;