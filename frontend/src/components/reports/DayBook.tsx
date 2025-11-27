import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Filter, Calendar, Eye } from 'lucide-react';

interface DayBookEntry {
  id: string;
  date: string;
  voucherType: string;
  voucherNo: string;
  particulars: string;
  ledgerName: string;
  debit: number;
  credit: number;
  voucherId: string;
  narration?: string;
  // Item fields
  itemId?: string;
  quantity?: number;
  rate?: number;
  hsnCode?: string;
}

interface VoucherGroup {
  voucherId: string;
  voucherNo: string;
  voucherType: string;
  date: string;
  totalDebit: number;
  totalCredit: number;
  entries: DayBookEntry[];
  narration?: string;
  entriesCount: number;
  supplier_invoice_date: Date
}
interface DaybookRow {
  id: number;
  date: string;
  voucherType: string;
  voucherNo: string;
  particulars: string;
  narration?: string;
  debit: number;
  credit: number;
}



const DayBook: React.FC = () => {
  const { theme, stockItems } = useAppContext();
  const navigate = useNavigate();
  
  const getItemName = (itemId: string | undefined) => {
    if (!itemId) return '';
    return stockItems.find(item => item.id === itemId)?.name || '';
  };

  const getItemHSN = (itemId: string | undefined) => {
    if (!itemId) return '';
    return stockItems.find(item => item.id === itemId)?.hsnCode || '';
  };
  const [totals, setTotals] = useState({
  totalDebit: 0,
  totalCredit: 0,
  netDifference: 0,
  vouchersCount: 0,
});


    const [, setDaybookTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
    netDifference:0,
    vouchersCount:0,
    supplier_invoice_date:0
});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDateRange, setSelectedDateRange] = useState('today');
  const [selectedVoucherType, setSelectedVoucherType] = useState('');
  const [viewMode, setViewMode] = useState<'detailed' | 'grouped'>('grouped');
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherGroup | null>(null);
 const [groupedVouchers, setGroupedVouchers] = useState<VoucherGroup[]>([]);
const [processedEntries, setProcessedEntries] = useState<DayBookEntry[]>([]);
  //  const [entries, setEntries] = useState([]);
//  const [entries, setEntries] = useState<DayBookEntry[]>([]);
useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/api/daybookTable2`)
    .then(res => res.json())
    .then((data) => {
      // 🔁 Map and normalize backend field names to match frontend expectation
      const normalized = data.map((entry: any): DaybookRow => ({
  id: entry.id,
  date: entry.date,
  voucherType: entry.voucher_type,
  voucherNo: entry.voucher_number,
  particulars: entry.reference_no || '—',
  narration: entry.narration,
  debit: parseFloat(entry.total_debit || '0'),
  credit: parseFloat(entry.total_credit || '0'),
}));


      setProcessedEntries(normalized);

      // Calculate totals
      let totalDebit = 0;
      let totalCredit = 0;

     normalized.forEach((entry: DaybookRow) => {
  totalDebit += entry.debit;
  totalCredit += entry.credit;
});

      setTotals({
        totalDebit,
        totalCredit,
        netDifference: totalDebit - totalCredit,
        vouchersCount: normalized.length,
      });
    })
    .catch((err) => {
      console.error('Error fetching daybook entries:', err);
    });
}, []);



  // Process vouchers into Day Book entries
  useEffect(() => {
    const employeeId = localStorage.getItem('employee_id');
    if (!employeeId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/DayBookCards`)
        .then(res => res.json())
        .then(data => {
            setTotals({
                totalDebit: data.totalDebit,
                totalCredit: data.totalCredit,
                netDifference: data.netDifference,
                vouchersCount: data.vouchersCount
            });
        })
        .catch(err => console.error('Failed to fetch totals', err));
}, []);

useEffect(() => {
  const fetchData = async () => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/daybookTable`);
    const data = await res.json();

    setGroupedVouchers(data.groupedVouchers  || []);
    setDaybookTotals({
      totalDebit: data.totalDebit,
      totalCredit: data.totalCredit,
      netDifference: data.netDifference,
      vouchersCount: data.vouchersCount,
      supplier_invoice_date:data.supplier_invoice_date
    });
  };
  fetchData();
},[]); // Whatever triggers your refetch.




  // const processedEntries = useMemo((): DayBookEntry[] => {



  //   if (!vouchers || vouchers.length === 0) return [];

  //   const entries: DayBookEntry[] = [];

  //   vouchers.forEach(voucher => {
  //     // Filter by date
  //     const voucherDate = voucher.date;
  //     const today = new Date().toISOString().split('T')[0];
      
  //     let includeVoucher = false;
  //     switch (selectedDateRange) {
  //       case 'today':
  //         includeVoucher = voucherDate === today;
  //         break;
  //       case 'yesterday': {
  //         const yesterday = new Date();
  //         yesterday.setDate(yesterday.getDate() - 1);
  //         includeVoucher = voucherDate === yesterday.toISOString().split('T')[0];
  //         break;
  //       }
  //       case 'this-week': {
  //         const weekStart = new Date();
  //         weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  //         includeVoucher = voucherDate >= weekStart.toISOString().split('T')[0] && voucherDate <= today;
  //         break;
  //       }
  //       case 'this-month': {
  //         const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  //         includeVoucher = voucherDate >= monthStart.toISOString().split('T')[0] && voucherDate <= today;
  //         break;
  //       }
  //       case 'custom':
  //         includeVoucher = voucherDate === selectedDate;
  //         break;
  //       default:
  //         includeVoucher = true;
  //     }

  //     // Filter by voucher type
  //     if (selectedVoucherType && voucher.type !== selectedVoucherType) {
  //       includeVoucher = false;
  //     }

  //     if (includeVoucher && voucher.entries) {
  //       voucher.entries.forEach((entry, index) => {
  //         const itemInfo = entry.itemId ? stockItems.find(item => item.id === entry.itemId) : null;
  //         const ledgerInfo = entry.ledgerId ? ledgers.find(ledger => ledger.id === entry.ledgerId) : null;
          
  //         // For item-invoice vouchers, we need to handle the structure differently
  //         if (voucher.mode === 'item-invoice' && voucher.type === 'sales') {
  //           // For item entries, show item details
  //           if (entry.itemId) {
  //             entries.push({
  //               id: `${voucher.id}-${index}`,
  //               date: voucher.date,
  //               voucherType: voucher.type || 'Journal',
  //               voucherNo: voucher.number || 'Auto',
  //               particulars: itemInfo ? itemInfo.name : 'Unknown Item',
  //               ledgerName: 'Sales Item', // This is an item line
  //               debit: 0, // Items don't directly debit/credit, they're the source
  //               credit: 0,
  //               voucherId: voucher.id,
  //               narration: voucher.narration || entry.narration,
  //               // Item fields
  //               itemId: entry.itemId,
  //               quantity: entry.quantity,
  //               rate: entry.rate,
  //               hsnCode: entry.hsnCode || (itemInfo ? itemInfo.hsnCode : undefined)
  //             });
  //           }
            
  //           // For sales ledger entry (this is usually derived, not explicitly in entries for item-invoice)
  //           if (voucher.salesLedgerId) {
  //             const salesLedger = ledgers.find(ledger => ledger.id === voucher.salesLedgerId);
  //             const itemAmount = (entry.quantity || 0) * (entry.rate || 0);
  //             if (salesLedger && itemAmount > 0) {
  //               entries.push({
  //                 id: `${voucher.id}-sales-${index}`,
  //                 date: voucher.date,
  //                 voucherType: voucher.type || 'Journal',
  //                 voucherNo: voucher.number || 'Auto',
  //                 particulars: salesLedger.name,
  //                 ledgerName: salesLedger.name,
  //                 debit: 0,
  //                 credit: itemAmount, // Sales is credited
  //                 voucherId: voucher.id,
  //                 narration: `Sales of ${itemInfo ? itemInfo.name : 'item'}`,
  //                 itemId: entry.itemId,
  //                 quantity: entry.quantity,
  //                 rate: entry.rate,
  //                 hsnCode: entry.hsnCode || (itemInfo ? itemInfo.hsnCode : undefined)
  //               });
  //             }
  //           }
            
  //           // For customer ledger entry (party ledger is debited)
  //           if (voucher.partyId) {
  //             const partyLedger = ledgers.find(ledger => ledger.id === voucher.partyId);
  //             const itemAmount = (entry.quantity || 0) * (entry.rate || 0);
  //             const gstRate = (entry.cgstRate || 0) + (entry.sgstRate || 0) + (entry.igstRate || 0);
  //             const gstAmount = itemAmount * gstRate / 100;
  //             const totalAmount = itemAmount + gstAmount - (entry.discount || 0);
              
  //             if (partyLedger && totalAmount > 0) {
  //               entries.push({
  //                 id: `${voucher.id}-party-${index}`,
  //                 date: voucher.date,
  //                 voucherType: voucher.type || 'Journal',
  //                 voucherNo: voucher.number || 'Auto',
  //                 particulars: partyLedger.name,
  //                 ledgerName: partyLedger.name,
  //                 debit: totalAmount, // Customer is debited
  //                 credit: 0,
  //                 voucherId: voucher.id,
  //                 narration: `Sale to ${partyLedger.name}`,
  //               });
  //             }
  //           }
  //         } else {
  //           // For non-item-invoice vouchers, use the original logic
  //           entries.push({
  //             id: `${voucher.id}-${index}`,
  //             date: voucher.date,
  //             voucherType: voucher.type || 'Journal',
  //             voucherNo: voucher.number || 'Auto',
  //             particulars: itemInfo ? itemInfo.name : (ledgerInfo ? ledgerInfo.name : ''),
  //             ledgerName: ledgerInfo ? ledgerInfo.name : '',
  //             debit: entry.type === 'debit' ? entry.amount : 0,
  //             credit: entry.type === 'credit' ? entry.amount : 0,
  //             voucherId: voucher.id,
  //             narration: voucher.narration || entry.narration,
  //             // Item fields
  //             itemId: entry.itemId,
  //             quantity: entry.quantity,
  //             rate: entry.rate,
  //             hsnCode: entry.hsnCode || (itemInfo ? itemInfo.hsnCode : undefined)
  //           });
  //         }
  //       });
  //     }
  //   });

  //   return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // }, [vouchers, ledgers, stockItems, selectedDateRange, selectedDate, selectedVoucherType]);

  // Group entries by voucher for grouped view
  // const groupedVouchers = useMemo((): VoucherGroup[] => {
  //   const groups: { [key: string]: VoucherGroup } = {};

  //   processedEntries.forEach(entry => {
  //     if (!groups[entry.voucherId]) {
  //       groups[entry.voucherId] = {
  //         voucherId: entry.voucherId,
  //         voucherNo: entry.voucherNo,
  //         voucherType: entry.voucherType,
  //         date: entry.date,
  //         totalDebit: 0,
  //         totalCredit: 0,
  //         entries: [],
  //         narration: entry.narration
  //       };
  //     }

  //     groups[entry.voucherId].entries.push(entry);
  //     groups[entry.voucherId].totalDebit += entry.debit;
  //     groups[entry.voucherId].totalCredit += entry.credit;
  //   });

  //   return Object.values(groups).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  // }, [processedEntries]);

  // Calculate totals
  // const totals = useMemo(() => {
  //   const totalDebit = processedEntries.reduce((sum, entry) => sum + entry.debit, 0);
  //   const totalCredit = processedEntries.reduce((sum, entry) => sum + entry.credit, 0);
  //   return { totalDebit, totalCredit };
  // }, [processedEntries]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleVoucherClick = (voucher: VoucherGroup) => {
    setSelectedVoucher(voucher);
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    if (range === 'custom') {
      // Custom date will be handled by the date input
    }
  };

  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button
        type='button'
          title='Back to Reports'
          onClick={() => navigate('/app/reports')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Day Book</h1>
        <div className="ml-auto flex space-x-2">
          <button
          title='Toggle Filters'
            type='button'
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
          </button>
          <button
          title='Print Report'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Printer size={18} />
          </button>
          <button
          title='Download Report'
          type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      {showFilterPanel && (
        <div className={`p-4 mb-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
        }`}>
          <h3 className="font-semibold mb-4">Filters & Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Range
              </label>
              <select
                title='Select Date Range'
                value={selectedDateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Voucher Type
              </label>
              <select
                title='Select Voucher Type'
                value={selectedVoucherType}
                onChange={(e) => setSelectedVoucherType(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Types</option>
                <option value="payment">Payment</option>
                <option value="receipt">Receipt</option>
                <option value="journal">Journal</option>
                <option value="sales">Sales</option>
                <option value="purchase">Purchase</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                View Mode
              </label>
              <select
                title='Select View Mode'
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'detailed' | 'grouped')}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="grouped">Grouped by Voucher</option>
                <option value="detailed">Detailed Entries</option>
              </select>
            </div>
            {selectedDateRange === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  title="Select Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`w-full p-2 rounded border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600' 
                      : 'bg-white border-gray-300'
                  }`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
        }`}>
          <div className="text-sm text-gray-500">Total Debit</div>
          <div className="text-xl font-bold text-blue-600">
            {formatCurrency(totals.totalDebit)}
          </div>
        </div>
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
        }`}>
          <div className="text-sm text-gray-500">Total Credit</div>
          <div className="text-xl font-bold text-purple-600">
            {formatCurrency(totals.totalCredit)}
          </div>
        </div>
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
        }`}>
          <div className="text-sm text-gray-500">Net Difference</div>
          <div className={`text-xl font-bold ${
            totals.totalDebit - totals.totalCredit >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(Math.abs(totals.totalDebit - totals.totalCredit))}
          </div>
        </div>
        <div className={`p-4 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
        }`}>
          <div className="text-sm text-gray-500">Vouchers</div>
          <div className="text-xl font-bold text-gray-600">
             {((totals.vouchersCount))}
            {/* {viewMode === 'grouped' ? groupedVouchers.length : processedEntries.length} */}
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex space-x-1 mb-4">
        {['grouped', 'detailed'].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as 'detailed' | 'grouped')}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              viewMode === mode
                ? theme === 'dark'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white text-blue-600 shadow'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {mode === 'grouped' ? 'Grouped by Voucher' : 'Detailed Entries'}
          </button>
        ))}
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Day Book</h2>
            <p className="text-sm opacity-75">
              {selectedDateRange === 'custom' ? `For ${formatDate(selectedDate)}` : 
               selectedDateRange === 'today' ? `For ${formatDate(new Date().toISOString().split('T')[0])}` :
               `For ${selectedDateRange.replace('-', ' ')}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-500" />
            <span className="text-sm text-gray-500">
              {/* {viewMode === 'grouped' ? `${groupedVouchers.length} vouchers` : `${processedEntries.length} entries`} */}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {viewMode === 'grouped' ? (
            <table className="w-full">
              <thead>
                <tr className={`${
                  theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'
                }`}>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Voucher Type</th>
                  <th className="px-4 py-3 text-left">Voucher No.</th>
                  <th className="px-4 py-3 text-left">Entries</th>
                  <th className="px-4 py-3 text-right">Total Debit</th>
                  <th className="px-4 py-3 text-right">Total Credit</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
{(!Array.isArray(groupedVouchers) || groupedVouchers.length === 0) ? (
                 <tr>
      <td colSpan={7} className="px-4 py-8 text-center opacity-70">
        No vouchers found for the selected criteria
      </td>
    </tr>
                ) : (
  groupedVouchers.map(voucher => (
                    <tr 
                      key={voucher.voucherId}
                      className={`${
                        theme === 'dark' ? 'border-b border-gray-700 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'
                      } cursor-pointer`}
                      onClick={() => handleVoucherClick(voucher)}
                    >
                      <td className="px-4 py-3">
  {voucher.supplier_invoice_date
    ? formatDate(
        typeof voucher.supplier_invoice_date === 'string'
          ? voucher.supplier_invoice_date
          : voucher.supplier_invoice_date.toISOString().slice(0, 10)
      )
    : '-'}
</td>

                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          voucher.voucherType === 'sales' ? 'bg-green-100 text-green-800' :
                          voucher.voucherType === 'purchase' ? 'bg-blue-100 text-blue-800' :
                          voucher.voucherType === 'receipt' ? 'bg-purple-100 text-purple-800' :
                          voucher.voucherType === 'payment' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {voucher.voucherType.charAt(0).toUpperCase() + voucher.voucherType.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{voucher.voucherNo}</td>
                      <td className="px-4 py-3">{voucher.entriesCount} entries</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(voucher.totalDebit)}</td>
                      <td className="px-4 py-3 text-right font-mono">{formatCurrency(voucher.totalCredit)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVoucherClick(voucher);
                          }}
                          className={`p-1 rounded ${
                            theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {groupedVouchers?.length > 0 && (
    <tfoot>
        <tr className={`${
            theme === 'dark' ? 'border-t-2 border-gray-600 bg-gray-700' : 'border-t-2 border-gray-400 bg-gray-50'
        }`}>
            <td colSpan={4} className="px-4 py-3 font-bold">Total:</td>
            <td className="px-4 py-3 text-right font-bold font-mono">{formatCurrency(totals.totalDebit)}</td>
            <td className="px-4 py-3 text-right font-bold font-mono">{formatCurrency(totals.totalCredit)}</td>
            <td></td>
        </tr>
    </tfoot>
)}
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className={`${
                  theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'
                }`}>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Voucher Type</th>
                  <th className="px-4 py-3 text-left">Voucher No.</th>
                  <th className="px-4 py-3 text-left">Particulars</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {processedEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center opacity-70">
                      No entries found for the selected criteria
                    </td>
                  </tr>
                ) : (
                  processedEntries.map((entry) => (
                    <tr 
                      key={entry.id}
                      className={`${
                        theme === 'dark' ? 'border-b border-gray-700 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <td className="px-4 py-3">{formatDate(entry.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.voucherType === 'sales' ? 'bg-green-100 text-green-800' :
                          entry.voucherType === 'purchase' ? 'bg-blue-100 text-blue-800' :
                          entry.voucherType === 'receipt' ? 'bg-purple-100 text-purple-800' :
                          entry.voucherType === 'payment' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {entry.voucherType.charAt(0).toUpperCase() + entry.voucherType.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">{entry.voucherNo}</td>
                      <td className="px-4 py-3">
                        {entry.particulars}
                        {entry.narration && (
                          <div className="text-xs text-gray-500 mt-1">{entry.narration}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {processedEntries.length > 0 && (
                <tfoot>
                  <tr className={`${
                    theme === 'dark' ? 'border-t-2 border-gray-600 bg-gray-700' : 'border-t-2 border-gray-400 bg-gray-50'
                  }`}>
                    <td colSpan={4} className="px-4 py-3 font-bold">Total:</td>
                    <td className="px-4 py-3 text-right font-bold font-mono">{formatCurrency(totals.totalDebit)}</td>
                    <td className="px-4 py-3 text-right font-bold font-mono">{formatCurrency(totals.totalCredit)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            {/* Header - Fixed */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Voucher Details - {selectedVoucher.voucherNo}
                </h3>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className={`p-2 rounded-full ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  ×
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Voucher No</label>
                  <div className="font-mono">{selectedVoucher.voucherNo}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Voucher Type</label>
                  <div className="capitalize">{selectedVoucher.voucherType}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <div>{formatDate(selectedVoucher.date)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Entries</label>
                  <div>{selectedVoucher && selectedVoucher.entries ? selectedVoucher.entries.length : 0} entries</div>

                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Voucher Entries</label>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className={`${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <tr>
                        <th className="px-3 py-2 text-left">Item/Ledger</th>
                        <th className="px-3 py-2 text-left">HSN/SAC</th>
                        <th className="px-3 py-2 text-right">Qty</th>
                        <th className="px-3 py-2 text-right">Rate</th>
                        <th className="px-3 py-2 text-right">Debit</th>
                        <th className="px-3 py-2 text-right">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
  {(selectedVoucher?.entries ?? []).map((entry, index) => (
                        <tr key={index} className={`border-t ${
                          theme === 'dark' ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          <td className="px-3 py-2">
                            {entry.itemId ? (
                              <div>
                                <div className="font-medium">{getItemName(entry.itemId)}</div>
                                <div className="text-xs text-gray-500">Item</div>
                              </div>
                            ) : (
                              <div>
                                <div className="font-medium">{entry.particulars}</div>
                                <div className="text-xs text-gray-500">Ledger</div>
                              </div>
                            )}
                            {entry.narration && (
                              <div className="text-xs text-gray-500 mt-1">{entry.narration}</div>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs">
                            {entry.hsnCode || (entry.itemId ? getItemHSN(entry.itemId) : '-')}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {entry.quantity && entry.quantity > 0 ? entry.quantity : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {entry.rate && entry.rate > 0 ? formatCurrency(entry.rate) : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {entry.debit > 0 ? formatCurrency(entry.debit) : '-'}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">
                            {entry.credit > 0 ? formatCurrency(entry.credit) : '-'}
                          </td>
                        </tr>
                      ))}
                      <tr className={`border-t-2 font-bold ${
                        theme === 'dark' ? 'border-gray-500' : 'border-gray-400'
                      }`}>
                        <td colSpan={4} className="px-3 py-2">Total:</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(selectedVoucher.totalDebit)}</td>
                        <td className="px-3 py-2 text-right font-mono">{formatCurrency(selectedVoucher.totalCredit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              {selectedVoucher.narration && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Narration</label>
                  <div className="text-gray-600 dark:text-gray-400">{selectedVoucher.narration}</div>
                </div>
              )}
            </div>
            
            {/* Footer - Fixed */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className={`px-4 py-2 rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Navigate to edit if the route exists, otherwise show create form
                    try {
                      navigate(`/app/vouchers/${selectedVoucher.voucherType}/edit/${selectedVoucher.voucherId}`);
                    } catch (error) {
                      // Fallback to create route if edit is not available
                      console.warn('Edit route not available, redirecting to create:', error);
                      navigate(`/app/vouchers/${selectedVoucher.voucherType}/create`);
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Edit Voucher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press F5 to refresh, F12 to configure display options.
        </p>
      </div>
    </div>
  );
};

export default DayBook;