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

// const PurchaseReport1: React.FC = () => {
//   const { theme } = useAppContext();
//   const navigate = useNavigate();
//   const printRef = useRef<HTMLDivElement>(null);

//   const [showFilterPanel, setShowFilterPanel] = useState(false);
//   const [selectedView, setSelectedView] = useState<'summary' | 'detailed' | 'itemwise' | 'supplierwise' | 'invoicewise'>('summary');
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
//     // Enhanced Mock purchase data with comprehensive dummy data
//     const mockPurchaseData: PurchaseData[] = [
//       {
//         id: '1',
//         voucherNo: 'PUR/001',
//         voucherType: 'Purchase',
//         date: '2025-07-01',
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
//         dueDate: '2025-07-31',
//         status: 'Unpaid',
//         supplierInvoiceNo: 'INV-2025-001',
//         supplierInvoiceDate: '2025-06-30'
//       },
//       {
//         id: '2',
//         voucherNo: 'PUR/002',
//         voucherType: 'Purchase',
//         date: '2025-07-02',
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
//         dueDate: '2025-07-17',
//         status: 'Paid',
//         supplierInvoiceNo: 'INV-XYZ-045',
//         supplierInvoiceDate: '2025-07-01'
//       },
//       {
//         id: '3',
//         voucherNo: 'PUR/003',
//         voucherType: 'Purchase',
//         date: '2025-07-03',
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
//         dueDate: '2025-08-17',
//         status: 'Partially Paid',
//         supplierInvoiceNo: 'PQR-2025-789',
//         supplierInvoiceDate: '2025-07-02'
//       },
//       {
//         id: '4',
//         voucherNo: 'PUR/004',
//         voucherType: 'Purchase',
//         date: '2025-07-04',
//         supplierName: 'Global Import Solutions',
//         supplierGSTIN: '24DDDDD0000D1Z8',
//         billAmount: 354000,
//         taxableAmount: 300000,
//         cgstAmount: 0,
//         sgstAmount: 0,
//         igstAmount: 54000,
//         cessAmount: 0,
//         totalTaxAmount: 54000,
//         netAmount: 354000,
//         itemDetails: [
//           { itemName: 'Imported Equipment', hsnCode: '8537', quantity: 5, rate: 60000, amount: 300000 }
//         ],
//         paymentTerms: '60 Days',
//         dueDate: '2025-09-02',
//         status: 'Unpaid',
//         supplierInvoiceNo: 'GIS-2025-456',
//         supplierInvoiceDate: '2025-07-03'
//       },
//       {
//         id: '5',
//         voucherNo: 'PUR/005',
//         voucherType: 'Purchase',
//         date: '2025-07-05',
//         supplierName: 'Tech Solutions SEZ',
//         supplierGSTIN: '33EEEEE0000E1Z9',
//         billAmount: 177000,
//         taxableAmount: 150000,
//         cgstAmount: 0,
//         sgstAmount: 0,
//         igstAmount: 27000,
//         cessAmount: 0,
//         totalTaxAmount: 27000,
//         netAmount: 177000,
//         itemDetails: [
//           { itemName: 'Software Services', hsnCode: '9983', quantity: 1, rate: 150000, amount: 150000 }
//         ],
//         paymentTerms: '30 Days',
//         dueDate: '2025-08-04',
//         status: 'Paid',
//         supplierInvoiceNo: 'TS-SEZ-789',
//         supplierInvoiceDate: '2025-07-04'
//       },
//       {
//         id: '6',
//         voucherNo: 'PUR/006',
//         voucherType: 'Purchase',
//         date: '2025-07-06',
//         supplierName: 'Chemicals & More Ltd',
//         supplierGSTIN: '36FFFFF0000F1ZA',
//         billAmount: 94400,
//         taxableAmount: 80000,
//         cgstAmount: 7200,
//         sgstAmount: 7200,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 14400,
//         netAmount: 94400,
//         itemDetails: [
//           { itemName: 'Industrial Chemicals', hsnCode: '2818', quantity: 200, rate: 400, amount: 80000 }
//         ],
//         paymentTerms: '45 Days',
//         dueDate: '2025-08-20',
//         status: 'Unpaid',
//         supplierInvoiceNo: 'CAM-2025-321',
//         supplierInvoiceDate: '2025-07-05'
//       },
//       {
//         id: '7',
//         voucherNo: 'PUR/007',
//         voucherType: 'Purchase',
//         date: '2025-07-07',
//         supplierName: 'Steel Works Corporation',
//         supplierGSTIN: '09GGGGG0000G1ZB',
//         billAmount: 472000,
//         taxableAmount: 400000,
//         cgstAmount: 36000,
//         sgstAmount: 36000,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 72000,
//         netAmount: 472000,
//         itemDetails: [
//           { itemName: 'Steel Bars', hsnCode: '7214', quantity: 1000, rate: 300, amount: 300000 },
//           { itemName: 'Steel Sheets', hsnCode: '7208', quantity: 50, rate: 2000, amount: 100000 }
//         ],
//         paymentTerms: '90 Days',
//         dueDate: '2025-10-05',
//         status: 'Partially Paid',
//         supplierInvoiceNo: 'SWC-2025-654',
//         supplierInvoiceDate: '2025-07-06'
//       },
//       {
//         id: '8',
//         voucherNo: 'PUR/008',
//         voucherType: 'Purchase',
//         date: '2025-07-08',
//         supplierName: 'Electrical Components Hub',
//         supplierGSTIN: '12HHHHH0000H1ZC',
//         billAmount: 141600,
//         taxableAmount: 120000,
//         cgstAmount: 10800,
//         sgstAmount: 10800,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 21600,
//         netAmount: 141600,
//         itemDetails: [
//           { itemName: 'Electrical Cables', hsnCode: '8544', quantity: 500, rate: 150, amount: 75000 },
//           { itemName: 'Circuit Breakers', hsnCode: '8536', quantity: 30, rate: 1500, amount: 45000 }
//         ],
//         paymentTerms: '30 Days',
//         dueDate: '2025-08-07',
//         status: 'Paid',
//         supplierInvoiceNo: 'ECH-2025-987',
//         supplierInvoiceDate: '2025-07-07'
//       },
//       {
//         id: '9',
//         voucherNo: 'PUR/009',
//         voucherType: 'Purchase Return',
//         date: '2025-07-09',
//         supplierName: 'Faulty Goods Supplier',
//         supplierGSTIN: '19IIIII0000I1ZD',
//         billAmount: -29500,
//         taxableAmount: -25000,
//         cgstAmount: -2250,
//         sgstAmount: -2250,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: -4500,
//         netAmount: -29500,
//         itemDetails: [
//           { itemName: 'Defective Parts', hsnCode: '8708', quantity: -25, rate: 1000, amount: -25000 }
//         ],
//         paymentTerms: 'Immediate',
//         dueDate: '2025-07-09',
//         status: 'Paid',
//         supplierInvoiceNo: 'FGS-RET-111',
//         supplierInvoiceDate: '2025-07-08'
//       },
//       {
//         id: '10',
//         voucherNo: 'PUR/010',
//         voucherType: 'Purchase',
//         date: '2025-07-10',
//         supplierName: 'Premium Textiles Inc',
//         supplierGSTIN: '22JJJJJ0000J1ZE',
//         billAmount: 84240,
//         taxableAmount: 71400,
//         cgstAmount: 6426,
//         sgstAmount: 6414, // Slight difference for testing
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 12840,
//         netAmount: 84240,
//         itemDetails: [
//           { itemName: 'Cotton Fabric', hsnCode: '5208', quantity: 300, rate: 180, amount: 54000 },
//           { itemName: 'Silk Fabric', hsnCode: '5007', quantity: 30, rate: 580, amount: 17400 }
//         ],
//         paymentTerms: '45 Days',
//         dueDate: '2025-08-24',
//         status: 'Overdue',
//         supplierInvoiceNo: 'PTI-2025-135',
//         supplierInvoiceDate: '2025-07-09'
//       },
//       {
//         id: '11',
//         voucherNo: 'PUR/011',
//         voucherType: 'Purchase',
//         date: '2025-07-11',
//         supplierName: 'International Trading Corp',
//         supplierGSTIN: '04KKKKK0000K1ZF',
//         billAmount: 590000,
//         taxableAmount: 500000,
//         cgstAmount: 0,
//         sgstAmount: 0,
//         igstAmount: 90000,
//         cessAmount: 0,
//         totalTaxAmount: 90000,
//         netAmount: 590000,
//         itemDetails: [
//           { itemName: 'Imported Machinery', hsnCode: '8479', quantity: 2, rate: 250000, amount: 500000 }
//         ],
//         paymentTerms: '120 Days',
//         dueDate: '2025-11-08',
//         status: 'Unpaid',
//         supplierInvoiceNo: 'ITC-2025-999',
//         supplierInvoiceDate: '2025-07-10'
//       },
//       {
//         id: '12',
//         voucherNo: 'PUR/012',
//         voucherType: 'Purchase',
//         date: '2025-07-12',
//         supplierName: 'Local Hardware Store',
//         supplierGSTIN: '14LLLLL0000L1ZG',
//         billAmount: 23600,
//         taxableAmount: 20000,
//         cgstAmount: 1800,
//         sgstAmount: 1800,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 3600,
//         netAmount: 23600,
//         itemDetails: [
//           { itemName: 'Hand Tools', hsnCode: '8205', quantity: 40, rate: 300, amount: 12000 },
//           { itemName: 'Power Tools', hsnCode: '8467', quantity: 4, rate: 2000, amount: 8000 }
//         ],
//         paymentTerms: '15 Days',
//         dueDate: '2025-07-27',
//         status: 'Paid',
//         supplierInvoiceNo: 'LHS-2025-777',
//         supplierInvoiceDate: '2025-07-11'
//       },
//       {
//         id: '13',
//         voucherNo: 'PUR/013',
//         voucherType: 'Purchase',
//         date: '2025-07-13',
//         supplierName: 'Green Energy Solutions',
//         supplierGSTIN: '14MMMMM0000M1ZH',
//         billAmount: 265500,
//         taxableAmount: 225000,
//         cgstAmount: 20250,
//         sgstAmount: 20250,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 40500,
//         netAmount: 265500,
//         itemDetails: [
//           { itemName: 'Solar Panels', hsnCode: '8541', quantity: 15, rate: 12000, amount: 180000 },
//           { itemName: 'Inverters', hsnCode: '8504', quantity: 3, rate: 15000, amount: 45000 }
//         ],
//         paymentTerms: '60 Days',
//         dueDate: '2025-09-11',
//         status: 'Unpaid',
//         supplierInvoiceNo: 'GES-2025-445',
//         supplierInvoiceDate: '2025-07-12'
//       },
//       {
//         id: '14',
//         voucherNo: 'PUR/014',
//         voucherType: 'Purchase',
//         date: '2025-07-14',
//         supplierName: 'Automotive Parts Supplier',
//         supplierGSTIN: '16NNNNN0000N1ZI',
//         billAmount: 188800,
//         taxableAmount: 160000,
//         cgstAmount: 14400,
//         sgstAmount: 14400,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 28800,
//         netAmount: 188800,
//         itemDetails: [
//           { itemName: 'Engine Oil Filters', hsnCode: '8421', quantity: 100, rate: 500, amount: 50000 },
//           { itemName: 'Brake Pads', hsnCode: '8708', quantity: 50, rate: 1200, amount: 60000 },
//           { itemName: 'Brake Discs', hsnCode: '8708', quantity: 25, rate: 2000, amount: 50000 }
//         ],
//         paymentTerms: '30 Days',
//         dueDate: '2025-08-13',
//         status: 'Paid',
//         supplierInvoiceNo: 'APS-2025-556',
//         supplierInvoiceDate: '2025-07-13'
//       },
//       {
//         id: '15',
//         voucherNo: 'PUR/015',
//         voucherType: 'Purchase',
//         date: '2025-07-15',
//         supplierName: 'Construction Materials Ltd',
//         supplierGSTIN: '35OOOOO0000O1ZJ',
//         billAmount: 354000,
//         taxableAmount: 300000,
//         cgstAmount: 27000,
//         sgstAmount: 27000,
//         igstAmount: 0,
//         cessAmount: 0,
//         totalTaxAmount: 54000,
//         netAmount: 354000,
//         itemDetails: [
//           { itemName: 'Cement', hsnCode: '2523', quantity: 1000, rate: 150, amount: 150000 },
//           { itemName: 'Steel Rods', hsnCode: '7214', quantity: 500, rate: 300, amount: 150000 }
//         ],
//         paymentTerms: '90 Days',
//         dueDate: '2025-10-13',
//         status: 'Partially Paid',
//         supplierInvoiceNo: 'CML-2025-888',
//         supplierInvoiceDate: '2025-07-14'
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
//     <div className="pt-[56px]  px-4">
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
//         {['summary', 'detailed', 'invoicewise', 'supplierwise', 'itemwise'].map((view) => (
//           <button
//             key={view}
//             onClick={() => setSelectedView(view as 'summary' | 'detailed' | 'supplierwise' | 'itemwise' | 'invoicewise')}
//             className={`px-4 py-2 rounded-lg capitalize ${
//               selectedView === view
//                 ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
//                 : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
//             }`}
//           >
//             {view === 'invoicewise' ? 'Invoice-wise' : view}
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

//         {/* Invoice-wise Purchase View */}
//         {selectedView === 'invoicewise' && (
//           <div className="space-y-4">
//             <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-blue-50'}`}>
//               <h3 className="text-lg font-semibold mb-2 flex items-center">
//                 <Package size={20} className="mr-2" />
//                 Invoice-wise Purchase Summary
//               </h3>
//               <p className="text-sm opacity-75">
//                 Comprehensive view of all purchase invoices with individual invoice analysis
//               </p>
//             </div>

//             {/* Invoice-wise Summary Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//               <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white shadow'}`}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium opacity-75">Total Invoices</p>
//                     <p className="text-2xl font-bold">{filteredData.length}</p>
//                   </div>
//                   <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-blue-100'}`}>
//                     <Package size={24} className="text-blue-600" />
//                   </div>
//                 </div>
//               </div>

//               <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white shadow'}`}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium opacity-75">Avg Invoice Value</p>
//                     <p className="text-2xl font-bold">
//                       {formatCurrency(
//                         filteredData.length > 0
//                           ? filteredData.reduce((sum: number, purchase: PurchaseData) => sum + purchase.netAmount, 0) / filteredData.length
//                           : 0
//                       )}
//                     </p>
//                   </div>
//                   <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-green-100'}`}>
//                     <TrendingDown size={24} className="text-green-600" />
//                   </div>
//                 </div>
//               </div>

//               <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white shadow'}`}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium opacity-75">Paid Invoices</p>
//                     <p className="text-2xl font-bold text-green-600">
//                       {filteredData.filter((purchase: PurchaseData) => purchase.status === 'Paid').length}
//                     </p>
//                   </div>
//                   <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-green-100'}`}>
//                     <DollarSign size={24} className="text-green-600" />
//                   </div>
//                 </div>
//               </div>

//               <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-white shadow'}`}>
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <p className="text-sm font-medium opacity-75">Pending Invoices</p>
//                     <p className="text-2xl font-bold text-red-600">
//                       {filteredData.filter((purchase: PurchaseData) => purchase.status === 'Unpaid' || purchase.status === 'Overdue').length}
//                     </p>
//                   </div>
//                   <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-gray-600' : 'bg-red-100'}`}>
//                     <Package size={24} className="text-red-600" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <table className="w-full">
//               <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
//                 <tr>
//                   <th className="px-4 py-3 text-left font-medium">Invoice No.</th>
//                   <th className="px-4 py-3 text-left font-medium">Date</th>
//                   <th className="px-4 py-3 text-left font-medium">Supplier Name</th>
//                   <th className="px-4 py-3 text-center font-medium">Items</th>
//                   <th className="px-4 py-3 text-right font-medium">Taxable Amount</th>
//                   <th className="px-4 py-3 text-right font-medium">GST Amount</th>
//                   <th className="px-4 py-3 text-right font-medium">Net Amount</th>
//                   <th className="px-4 py-3 text-center font-medium">Status</th>
//                   <th className="px-4 py-3 text-center font-medium">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {filteredData.map((purchase: PurchaseData) => (
//                   <tr
//                     key={purchase.id}
//                     className={`border-t ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}
//                   >
//                     <td className="px-4 py-3">
//                       <div className="font-mono font-medium text-blue-600">
//                         {purchase.supplierInvoiceNo || purchase.voucherNo}
//                       </div>
//                       <div className="text-xs opacity-60">
//                         {purchase.voucherType}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="font-medium">
//                         {new Date(purchase.supplierInvoiceDate || purchase.date).toLocaleDateString('en-IN')}
//                       </div>
//                       <div className="text-xs opacity-60">
//                         {new Date(purchase.supplierInvoiceDate || purchase.date).toLocaleDateString('en-IN', { weekday: 'short' })}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3">
//                       <div className="font-medium">{purchase.supplierName}</div>
//                       {purchase.supplierGSTIN && (
//                         <div className="text-xs font-mono opacity-60">
//                           {purchase.supplierGSTIN}
//                         </div>
//                       )}
//                     </td>
//                     <td className="px-4 py-3 text-center">
//                       <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
//                         {purchase.itemDetails.length} items
//                       </div>
//                       <div className="text-xs opacity-60 mt-1">
//                         {purchase.itemDetails.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0)} qty
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-right">
//                       <div className="font-mono font-medium">
//                         {formatCurrency(purchase.taxableAmount)}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-right">
//                       <div className="font-mono">
//                         {formatCurrency(purchase.totalTaxAmount)}
//                       </div>
//                       <div className="text-xs opacity-60">
//                         {((purchase.totalTaxAmount / purchase.taxableAmount) * 100).toFixed(1)}%
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-right">
//                       <div className="font-mono font-bold text-lg">
//                         {formatCurrency(purchase.netAmount)}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-center">
//                       <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
//                         purchase.status === 'Paid'
//                           ? 'bg-green-100 text-green-800'
//                           : purchase.status === 'Overdue'
//                           ? 'bg-red-100 text-red-800'
//                           : purchase.status === 'Partially Paid'
//                           ? 'bg-yellow-100 text-yellow-800'
//                           : 'bg-gray-100 text-gray-800'
//                       }`}>
//                         {purchase.status}
//                       </span>
//                     </td>
//                     <td className="px-4 py-3 text-center">
//                       <div className="flex items-center justify-center space-x-2">
//                         <button
//                           onClick={() => console.log('View details for:', purchase.voucherNo)}
//                           className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
//                           title="View Invoice Details"
//                         >
//                           <Eye size={16} />
//                         </button>
//                         <button
//                           onClick={() => console.log('Print invoice:', purchase.voucherNo)}
//                           className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
//                           title="Print Invoice"
//                         >
//                           <Printer size={16} />
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
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

// export default PurchaseReport1;

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Filter,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  User,
  Grid3X3,
} from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

interface SalesData {
  id: string;
  voucherNo: string;
  voucherType: string;
  date: string;
  partyName: string;
  partyGSTIN?: string;
  billAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  netAmount: number;
  itemDetails: {
    itemName: string;
    hsnCode: string;
    quantity: number;
    rate: number;
    amount: number;
    discount?: number;
  }[];
  paymentTerms?: string;
  dueDate?: string;
  status: "Paid" | "Unpaid" | "Partially Paid" | "Overdue";
  reference?: string;
  narration?: string;
}

interface FilterState {
  dateRange: string;
  fromDate: string;
  toDate: string;
  partyFilter: string;
  itemFilter: string;
  voucherTypeFilter: string;
  statusFilter: string;
  amountRangeMin: string;
  amountRangeMax: string;
}

const PruchaseReport1: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<
    | "summary"
    | "detailed"
    | "itemwise"
    | "partywise"
    | "billwise"
    | "billwiseprofit"
  >("summary");
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "this-month",
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), -100)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    partyFilter: "",
    itemFilter: "",
    voucherTypeFilter: "",
    statusFilter: "",
    amountRangeMin: "",
    amountRangeMax: "",
  });

  const [sortConfig, setSortConfig] = useState<{
    key: keyof SalesData;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });

  const handleSort = (key: keyof SalesData) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let fromDate = "";
    let toDate = today.toISOString().split("T")[0];

    switch (range) {
      case "today":
        fromDate = toDate;
        break;
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        fromDate = toDate = yesterday.toISOString().split("T")[0];
        break;
      }
      case "this-week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        fromDate = weekStart.toISOString().split("T")[0];
        break;
      }
      case "this-month": {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        break;
      }
      case "this-quarter": {
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        fromDate = new Date(today.getFullYear(), quarterStartMonth, 1)
          .toISOString()
          .split("T")[0];
        break;
      }
      case "this-year": {
        fromDate = new Date(today.getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0];
        break;
      }
      default:
        return;
    }

    setFilters((prev) => ({
      ...prev,
      dateRange: range,
      fromDate,
      toDate,
    }));
  };

  //sales repost month wise

  const [salesVouchers, setSalesVouchers] = useState<any[]>([]);
  const MONTHS = [
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
  ];

  const monthIndexToName: Record<number, string> = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
  };

  const monthDataMap = useMemo(() => {
    // 1️⃣ initialize all months with 0
    const map: Record<string, { credit: number; closingBalance: number }> = {};
    MONTHS.forEach((m) => {
      map[m] = { credit: 0, closingBalance: 0 };
    });

    // 2️⃣ aggregate API sales data

    salesVouchers.forEach((row) => {
      if (!row.date || !row.total) return;

      const d = new Date(row.date);
      const monthName = monthIndexToName[d.getMonth()];
      const amount = Number(row.total) || 0;

      if (map[monthName]) {
        map[monthName].credit += amount;
      }
    });

    return map;
  }, [salesVouchers]);

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const url = `${
      import.meta.env.VITE_API_URL
    }/api/purchase-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // safe handling
        if (Array.isArray(data)) {
          console.log("data", data);
          setSalesVouchers(data);
        } else if (Array.isArray(data?.data)) {
          setSalesVouchers(data.data);
        } else {
          setSalesVouchers([]);
        }
      })
      .catch((err) => {
        console.error("Sales voucher fetch error:", err);
        setSalesVouchers([]);
      });
  }, [companyId, ownerType, ownerId]);

  // calculate total sales
  const totalSales = useMemo(() => {
    return salesVouchers.reduce((sum, row) => {
      return sum + (Number(row.total) || 0);
    }, 0);
  }, [salesVouchers]);

  return (
    <div
      className={`min-h-screen pt-[56px] ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          theme === "dark"
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/app/reports")}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Go back to reports"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Purchase Report</h1>
              <p className="text-sm opacity-70">
                Comprehensive purchase analysis and reporting
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Filters"
            >
              <Filter size={18} />
            </button>
            <button
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Export to Excel"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Print"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: "summary", label: "Summary", icon: <BarChart3 size={16} /> },
            {
              key: "detailed",
              label: "Detailed",
              icon: <FileText size={16} />,
            },
            {
              key: "billwise",
              label: "Bill-wise",
              icon: <Grid3X3 size={16} />,
            },
            {
              key: "billwiseprofit",
              label: "Bill Wise Profit",
              icon: <TrendingUp size={16} />,
            },
            {
              key: "itemwise",
              label: "Item-wise",
              icon: <Package size={16} />,
            },
            { key: "partywise", label: "Party-wise", icon: <User size={16} /> },
          ].map((view) => (
            <button
              key={view.key}
              onClick={() =>
                setSelectedView(
                  view.key as
                    | "summary"
                    | "detailed"
                    | "itemwise"
                    | "partywise"
                    | "billwise"
                    | "billwiseprofit"
                )
              }
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                selectedView === view.key
                  ? theme === "dark"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div
          className={`p-4 border-b ${
            theme === "dark"
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Range
              </label>
              <select
                title="Select Date Range"
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="this-quarter">This Quarter</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                From Date
              </label>
              <input
                type="date"
                title="Select From Date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                title="Select To Date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* Party Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Party</label>
              <input
                type="text"
                placeholder="Search party..."
                value={filters.partyFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    partyFilter: e.target.value,
                  }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                title="Select Status Filter"
                value={filters.statusFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    statusFilter: e.target.value,
                  }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Amount
              </label>
              <input
                type="number"
                placeholder="Min amount..."
                value={filters.amountRangeMin}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    amountRangeMin: e.target.value,
                  }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Max Amount
              </label>
              <input
                type="number"
                placeholder="Max amount..."
                value={filters.amountRangeMax}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    amountRangeMax: e.target.value,
                  }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    dateRange: "this-month",
                    fromDate: new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1
                    )
                      .toISOString()
                      .split("T")[0],
                    toDate: new Date().toISOString().split("T")[0],
                    partyFilter: "",
                    itemFilter: "",
                    voucherTypeFilter: "",
                    statusFilter: "",
                    amountRangeMin: "",
                    amountRangeMax: "",
                  })
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-500 border-gray-600"
                    : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                } transition-colors`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4" ref={printRef}>
        {/* Summary Statistics */}
        {selectedView === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{totalSales.toLocaleString("en-IN")}
                  </p>
                </div>
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Total Transactions</p>
                </div>
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Average Sale</p>
                  <p className="text-2xl font-bold text-purple-600"></p>
                </div>
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Total Tax</p>
                </div>
                <Grid3X3 className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Status Distribution for Summary */}
        {selectedView === "summary" && (
          <div className="rounded-lg border">
            {/* Header */}
            <div className="grid grid-cols-3 bg-gray-100 font-semibold text-sm px-4 py-2">
              <div>Particulars</div>
              <div className="text-right">Credit</div>
              <div className="text-right">Closing Balance</div>
            </div>

            {[
              "April",
              "May",
              "June",
              "July",
              "August",
              "September",
              "October",
              "November",
              "December",
              "January",
              "February",
              "March",
            ].map((month) => {
              const row = monthDataMap[month] || {};

              return (
                <div
                  key={month}
                  onClick={() =>
                    navigate(`/app/voucher-register/purchase/detail/${month}`)
                  }
                  className="grid grid-cols-3 px-4 py-2 border-t text-sm cursor-pointer hover:bg-gray-100"
                >
                  <div className="font-medium text-blue-600">{month}</div>
                  <div className="text-right">
                    ₹{(row.credit ?? 0).toLocaleString()}
                  </div>
                  <div className="text-right">
                    ₹{(row.closingBalance ?? 0).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Data Table */}
        <div
          className={`rounded-lg overflow-hidden ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <div className="overflow-x-auto">
            {selectedView === "detailed" && (
              <table className="w-full">
                <thead
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <tr>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("voucherNo")}
                    >
                      Voucher No{" "}
                      {sortConfig.key === "voucherNo" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("date")}
                    >
                      Date{" "}
                      {sortConfig.key === "date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("partyName")}
                    >
                      Party Name{" "}
                      {sortConfig.key === "partyName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Party GSTIN
                    </th>
                    <th
                      className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("taxableAmount")}
                    >
                      Taxable Amount{" "}
                      {sortConfig.key === "taxableAmount" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">CGST</th>
                    <th className="px-4 py-3 text-right font-medium">SGST</th>
                    <th className="px-4 py-3 text-right font-medium">IGST</th>
                    <th
                      className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("netAmount")}
                    >
                      Net Amount{" "}
                      {sortConfig.key === "netAmount" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tfoot
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <tr className="font-semibold">
                    <td colSpan={4} className="px-4 py-3">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right font-mono"></td>
                    <td className="px-4 py-3 text-right font-mono"></td>
                    <td className="px-4 py-3 text-right font-mono"></td>
                    <td className="px-4 py-3 text-right font-mono"></td>
                    <td className="px-4 py-3 text-right font-mono font-bold"></td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}

            {selectedView === "partywise" && (
              <table className="w-full">
                <thead
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Party Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium">GSTIN</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Total Tax
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Transactions
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            )}

            {selectedView === "itemwise" && (
              <table className="w-full">
                <thead
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      HSN Code
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Total Quantity
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Average Rate
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody></tbody>
              </table>
            )}

            {/* Bill-wise Sales View */}
            {selectedView === "billwise" && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-blue-50"
                  }`}
                >
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Grid3X3 size={20} className="mr-2" />
                    Bill-wise Sales Summary
                  </h3>
                  <p className="text-sm opacity-75">
                    Comprehensive view of all sales bills with individual bill
                    analysis
                  </p>
                </div>

                {/* Bill-wise Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Total Bills
                        </p>
                        <p className="text-2xl font-bold"></p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-blue-100"
                        }`}
                      >
                        <FileText size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Avg Bill Value
                        </p>
                        <p className="text-2xl font-bold"></p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-green-100"
                        }`}
                      >
                        <TrendingUp size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Paid Bills
                        </p>
                        <p className="text-2xl font-bold text-green-600"></p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-green-100"
                        }`}
                      >
                        <DollarSign size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Pending Bills
                        </p>
                        <p className="text-2xl font-bold text-red-600"></p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-red-100"
                        }`}
                      >
                        <FileText size={24} className="text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <table className="w-full">
                  <thead
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Bill No.
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Party Name
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Items
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Taxable Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        GST Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Net Amount
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            )}

            {/* Bill Wise Profit View */}
            {selectedView === "billwiseprofit" && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-blue-50"
                  }`}
                >
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <TrendingUp size={20} className="mr-2" />
                    Bill Wise Profit Analysis
                  </h3>
                  <p className="text-sm opacity-75">
                    Detailed profit analysis for each sales bill including cost
                    analysis and margin calculations
                  </p>
                </div>

                {/* Profit Analysis Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Total Sales
                        </p>
                        <p className="text-2xl font-bold"></p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-blue-100"
                        }`}
                      >
                        <DollarSign size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Total Cost
                        </p>
                        <p className="text-2xl font-bold text-red-600"></p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-red-100"
                        }`}
                      >
                        <Package size={24} className="text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Gross Profit
                        </p>
                        <p className="text-2xl font-bold text-green-600"></p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-green-100"
                        }`}
                      >
                        <TrendingUp size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Avg Profit %
                        </p>
                        <p className="text-2xl font-bold text-green-600"></p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-green-100"
                        }`}
                      >
                        <BarChart3 size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <table className="w-full">
                  <thead
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Bill No.
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Party Name
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Sales Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Cost Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Gross Profit
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Profit %
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div
          className={`mt-4 p-3 rounded ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <p className="text-sm text-center opacity-70">
            Showing sales transactions
            {filters.dateRange !== "custom" &&
              ` for ${filters.dateRange.replace("-", " ")}`}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PruchaseReport1;
