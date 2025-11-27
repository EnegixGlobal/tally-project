import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Download, Filter, FileText,
  CheckCircle, XCircle, AlertTriangle, Eye, Zap, Settings,
  BarChart3, TrendingUp, AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SalesInvoiceMatch {
  id: string;
  voucherNo: string;
  voucherDate: Date;
  partyName: string;
  partyGSTIN?: string;
  invoiceAmount: number;
  taxableAmount: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  invoiceType: 'B2B' | 'B2C' | 'Export' | 'SEZ' | string;
  placeOfSupply: string;
  eWayBillNo?: string;
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  gstr1Status: 'Filed' | 'Not Filed' | 'Pending' | 'Error' | string;
  gstr2Status: 'Matched' | 'Unmatched' | 'Disputed' | 'Accepted' | 'Rejected' | string;
  eInvoiceStatus: 'Generated' | 'Not Generated' | 'Cancelled' | 'Error' | string;
  eWayBillStatus: 'Generated' | 'Not Generated' | 'Cancelled' | 'Expired' | string;
  matchingStatus: 'Fully Matched' | 'Partially Matched' | 'Unmatched' | 'Disputed' | string;
  discrepancies: string[];
  remarks?: string;
  lastUpdated: string;
  itemDetails: {
    itemName: string;
    hsnCode: string;
    quantity: number;
    unit: string;
    rate: number;
    amount: number;
    taxRate: number;
  }[];
}

interface MatchingFilter {
  maxAmount: string;
  minAmount: string;
  partyId: string;
  owner_id: string;
  owner_type: string;
  company_id: string;
  dateRange: string;
  fromDate: string;
  toDate: string;
  partyFilter: string;
  matchingStatus: string;
  gstr1Status: string;
  gstr2Status: string;
  eInvoiceStatus: string;
  eWayBillStatus: string;
  invoiceType: string;
  amountRange: string;
  hasDiscrepancies: boolean;
}

interface MatchingSummary {
  totalInvoices: number;
  fullyMatched: number;
  partiallyMatched: number;
  unmatched: number;
  disputed: number;
  totalAmount: number;
  matchedAmount: number;
  unmatchedAmount: number;
  disputedAmount: number;
  gstr1Filed: number;
  gstr2Matched: number;
  eInvoicesGenerated: number;
  eWayBillsGenerated: number;
}

const SalesInvoiceMatching: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);


  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'discrepancies' | 'analytics'>('overview');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const [showMatchingModal, setShowMatchingModal] = useState(false);
  const [matchingInProgress, setMatchingInProgress] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<SalesInvoiceMatch | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const companyId = localStorage.getItem('company_id') || '';
  const ownerType = localStorage.getItem('userType') || '';
  const ownerId =
    ownerType === 'employee'
      ? (localStorage.getItem('employee_id') || '')
      : (localStorage.getItem('user_id') || '');


  const [filters, setFilters] = useState<MatchingFilter>({
    dateRange: 'this-month',
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    partyFilter: '',
    matchingStatus: '',
    gstr1Status: '',
    gstr2Status: '',
    eInvoiceStatus: '',
    eWayBillStatus: '',
    invoiceType: '',
    amountRange: '',
    hasDiscrepancies: false,
    company_id: companyId,
    owner_type: ownerType,
    owner_id: ownerId,
    partyId: '',
    minAmount: '',
    maxAmount: '',
  });

  const [invoices, setInvoices] = useState<SalesInvoiceMatch[]>([]);
  const [, setLoading] = useState<boolean>(false);
  const [, setError] = useState<string | null>(null);

  // Utility to normalize raw backend data: convert string numbers to numbers, string date to Date
  function normalizeBackendData(data: any[]): SalesInvoiceMatch[] {
    return data.map(item => ({
      ...item,
      voucherDate: new Date(item.date),
      invoiceAmount: Number(item.total) || 0,
      taxableAmount: Number(item.subtotal) || 0,
      cgstAmount: Number(item.cgstTotal) || 0,
      sgstAmount: Number(item.sgstTotal) || 0,
      igstAmount: Number(item.igstTotal) || 0,
      totalTaxAmount: (Number(item.cgstTotal) + Number(item.sgstTotal) + Number(item.igstTotal)) || 0,
      itemDetails: [{
        itemName: item.itemName || '',
        hsnCode: item.hsnCode || '',
        quantity: Number(item.quantity) || 0,
        unit: item.unit || '',
        rate: Number(item.rate) || 0,
        amount: Number(item.amount) || 0,
        taxRate: Number(item.cgstRate) + Number(item.sgstRate) + Number(item.igstRate) || 0,
      }],
      // Fill other fields if available or default
      partyName: item.partyName || '',
      partyGSTIN: item.partyGSTIN || '',
      invoiceType: item.invoiceType || 'B2B',
      placeOfSupply: item.placeOfSupply || '',
      eWayBillNo: item.eWayBillNo || '',
      irn: item.irn || '',
      ackNo: item.ackNo || '',
      ackDate: item.ackDate || '',
      gstr1Status: item.gstr1Status || 'Not Filed',
      gstr2Status: item.gstr2Status || 'Unmatched',
      eInvoiceStatus: item.eInvoiceStatus || 'Not Generated',
      eWayBillStatus: item.eWayBillStatus || 'Not Generated',
      matchingStatus: item.matchingStatus || 'Unmatched',
      discrepancies: item.discrepancies || [],
      remarks: item.remarks || '',
      lastUpdated: item.lastUpdated || new Date().toISOString(),
      id: String(item.voucherId),
      voucherNo: item.voucherNo || 'N/A'
    }));
  }

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          company_id: filters.company_id,
          owner_type: filters.owner_type,
          owner_id: filters.owner_id,
        });
        if (filters.partyId) params.append('partyId', filters.partyId);
        if (filters.minAmount) params.append('minAmount', filters.minAmount);
        if (filters.maxAmount) params.append('maxAmount', filters.maxAmount);

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-invoice-matching?${params.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const normalizedData = normalizeBackendData(data);
        setInvoices(normalizedData);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch invoices');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    if (filters.company_id && filters.owner_type && filters.owner_id && filters.fromDate && filters.toDate) {
      fetchInvoices();
    }
  }, [filters]);

  const filteredData = useMemo(() => {
    return invoices.filter(invoice => {
      if (!invoice.voucherDate || isNaN(invoice.voucherDate.getTime())) return false;

      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      if (invoice.voucherDate < fromDate || invoice.voucherDate > toDate) return false;

      if (filters.partyFilter && !invoice.partyName.toLowerCase().includes(filters.partyFilter.toLowerCase())) return false;
    
      if (filters.matchingStatus && invoice.matchingStatus !== filters.matchingStatus) return false;
      if (filters.gstr1Status && invoice.gstr1Status !== filters.gstr1Status) return false;
      if (filters.gstr2Status && invoice.gstr2Status !== filters.gstr2Status) return false;
      if (filters.eInvoiceStatus && invoice.eInvoiceStatus !== filters.eInvoiceStatus) return false;
      if (filters.eWayBillStatus && invoice.eWayBillStatus !== filters.eWayBillStatus) return false;
      if (filters.invoiceType && invoice.invoiceType !== filters.invoiceType) return false;

      if (filters.hasDiscrepancies && invoice.discrepancies.length === 0) return false;

      // Implement amountRange filter if needed (parsing)
      if (filters.minAmount && invoice.invoiceAmount < parseFloat(filters.minAmount)) return false;
      if (filters.maxAmount && invoice.invoiceAmount > parseFloat(filters.maxAmount)) return false;

      return true;
    });
  }, [invoices, filters]);

  const summary = useMemo((): MatchingSummary => {
    const totalInvoices = filteredData.length;
    const fullyMatched = filteredData.filter(inv => inv.matchingStatus === 'Fully Matched').length;
    const partiallyMatched = filteredData.filter(inv => inv.matchingStatus === 'Partially Matched').length;
    const unmatched = filteredData.filter(inv => inv.matchingStatus === 'Unmatched').length;
    const disputed = filteredData.filter(inv => inv.matchingStatus === 'Disputed').length;

    const totalAmount = filteredData.reduce((sum, inv) => sum + inv.invoiceAmount, 0);
    const matchedAmount = filteredData.filter(inv => inv.matchingStatus === 'Fully Matched').reduce((sum, inv) => sum + inv.invoiceAmount, 0);
    const unmatchedAmount = filteredData.filter(inv => inv.matchingStatus === 'Unmatched').reduce((sum, inv) => sum + inv.invoiceAmount, 0);
    const disputedAmount = filteredData.filter(inv => inv.matchingStatus === 'Disputed').reduce((sum, inv) => sum + inv.invoiceAmount, 0);

    const gstr1Filed = filteredData.filter(inv => inv.gstr1Status === 'Filed').length;
    const gstr2Matched = filteredData.filter(inv => inv.gstr2Status === 'Matched' || inv.gstr2Status === 'Accepted').length;
    const eInvoicesGenerated = filteredData.filter(inv => inv.eInvoiceStatus === 'Generated').length;
    const eWayBillsGenerated = filteredData.filter(inv => inv.eWayBillStatus === 'Generated').length;

    return {
      totalInvoices,
      fullyMatched,
      partiallyMatched,
      unmatched,
      disputed,
      totalAmount,
      matchedAmount,
      unmatchedAmount,
      disputedAmount,
      gstr1Filed,
      gstr2Matched,
      eInvoicesGenerated,
      eWayBillsGenerated
    };
  }, [filteredData]);

  // Your formatting, getStatusColor and getStatusIcon functions unchanged; only add a safe check in getStatusIcon here:
  function getStatusIcon(status: string | undefined) {
    if (!status) return null;
    if (status.includes('Matched') || status === 'Filed' || status === 'Generated' || status === 'Accepted') {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    }
    if (status.includes('Unmatched') || status === 'Not Filed' || status === 'Not Generated' || status === 'Rejected') {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
    if (status.includes('Disputed') || status === 'Error' || status === 'Cancelled') {
      return <AlertTriangle className="w-4 h-4 text-purple-600" />;
    }
    return <AlertCircle className="w-4 h-4 text-yellow-600" />;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // The rest of your component return (UI JSX) remains unchanged.
  // Replace any usage of `voucherDate` string with `new Date(invoice.voucherDate).toLocaleDateString('en-IN')` or simply `invoice.voucherDate.toLocaleDateString('en-IN')`
  // Use `formatCurrency(invoice.invoiceAmount)` and other formatted numeric displays.

  // For example, in your invoice table:
  // <td>{invoice.voucherNo}</td>
  // <td>{invoice.voucherDate instanceof Date && !isNaN(invoice.voucherDate.getTime()) ? invoice.voucherDate.toLocaleDateString('en-IN') : 'Invalid Date'}</td>
  // <td>{invoice.partyName}</td>
  // <td>{formatCurrency(invoice.invoiceAmount)}</td>

  // This addresses your NaN and Invalid Date issues, and ensures backend data is used properly.
  const getStatusColor = (status: string, type: 'matching' | 'gstr1' | 'gstr2' | 'einvoice' | 'eway') => {
    const colorMap = {
      matching: {
        'Fully Matched': 'bg-green-100 text-green-800',
        'Partially Matched': 'bg-yellow-100 text-yellow-800',
        'Unmatched': 'bg-red-100 text-red-800',
        'Disputed': 'bg-purple-100 text-purple-800'
      },
      gstr1: {
        'Filed': 'bg-green-100 text-green-800',
        'Not Filed': 'bg-red-100 text-red-800',
        'Pending': 'bg-yellow-100 text-yellow-800',
        'Error': 'bg-red-100 text-red-800'
      },
      gstr2: {
        'Matched': 'bg-green-100 text-green-800',
        'Accepted': 'bg-green-100 text-green-800',
        'Unmatched': 'bg-red-100 text-red-800',
        'Disputed': 'bg-purple-100 text-purple-800',
        'Rejected': 'bg-red-100 text-red-800'
      },
      einvoice: {
        'Generated': 'bg-green-100 text-green-800',
        'Not Generated': 'bg-gray-100 text-gray-800',
        'Cancelled': 'bg-red-100 text-red-800',
        'Error': 'bg-red-100 text-red-800'
      },
      eway: {
        'Generated': 'bg-green-100 text-green-800',
        'Not Generated': 'bg-gray-100 text-gray-800',
        'Cancelled': 'bg-red-100 text-red-800',
        'Expired': 'bg-orange-100 text-orange-800'
      }
    };
    
    return (colorMap[type] as Record<string, string>)?.[status] || 'bg-gray-100 text-gray-800';
  };

    //   function getStatusIcon(status: string | undefined) {
    //   if (!status) return null; // or return a default icon if you want

    //   if (status.includes('Matched') || status === 'Filed' || status === 'Generated' || status === 'Accepted') {
    //     return <CheckCircle className="w-4 h-4 text-green-600" />;
    //   }
    //   if (status.includes('Unmatched') || status === 'Not Filed' || status === 'Not Generated' || status === 'Rejected') {
    //     return <XCircle className="w-4 h-4 text-red-600" />;
    //   }
    //   if (status.includes('Disputed') || status === 'Error' || status === 'Cancelled') {
    //     return <AlertTriangle className="w-4 h-4 text-purple-600" />;
    //   }
    //   return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    // }


  const handleBulkAction = async (action: 'match' | 'dispute' | 'accept' | 'export') => {
    if (selectedInvoices.length === 0) {
      alert('Please select at least one invoice');
      return;
    }

    setMatchingInProgress(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setMatchingInProgress(false);
    setSelectedInvoices([]);
    
    // Show success message
    const actionMessages = {
      match: 'Invoices matched successfully',
      dispute: 'Invoices marked as disputed',
      accept: 'Invoices accepted successfully',
      export: 'Data exported successfully'
    };
    
    alert(actionMessages[action]);
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(invoice => ({
      'Voucher No': invoice.voucherNo,
      'Date': invoice.voucherDate,
      'Party Name': invoice.partyName,
      'Party GSTIN': invoice.partyGSTIN || '',
      'Invoice Amount': invoice.invoiceAmount,
      'Taxable Amount': invoice.taxableAmount,
      'Total Tax': invoice.totalTaxAmount,
      'Invoice Type': invoice.invoiceType,
      'Place of Supply': invoice.placeOfSupply,
      'Matching Status': invoice.matchingStatus,
      'GSTR-1 Status': invoice.gstr1Status,
      'GSTR-2 Status': invoice.gstr2Status,
      'E-Invoice Status': invoice.eInvoiceStatus,
      'E-Way Bill Status': invoice.eWayBillStatus,
      'IRN': invoice.irn || '',
      'E-Way Bill No': invoice.eWayBillNo || '',
      'Discrepancies': invoice.discrepancies.join('; '),
      'Remarks': invoice.remarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales Invoice Matching');
    XLSX.writeFile(wb, `Sales_Invoice_Matching_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let fromDate = '';
    const toDate = today.toISOString().split('T')[0];

    switch (range) {
      case 'today': {
        fromDate = toDate;
        break;
      }
      case 'this-week': {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        fromDate = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'this-month': {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      }
      case 'this-quarter': {
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        fromDate = new Date(today.getFullYear(), quarterStartMonth, 1).toISOString().split('T')[0];
        break;
      }
      case 'this-year': {
        fromDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      }
      default:
        return;
    }

    setFilters(prev => ({
      ...prev,
      dateRange: range,
      fromDate,
      toDate
    }));
  };

  const handleViewDetails = (invoice: SalesInvoiceMatch) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedInvoice(null);
  };

  return (
    <div className={`min-h-screen pt-[56px] ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/app/reports')}
              className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Go back to reports"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Sales Invoice Matching</h1>
              <p className="text-sm opacity-70">GST Return Reconciliation & E-Invoice Compliance</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Filters"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={exportToExcel}
              className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Export"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
              title="Print"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => setShowMatchingModal(true)}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2`}
              title="Auto Match"
            >
              <Zap size={16} />
              <span>Auto Match</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
            { key: 'detailed', label: 'Detailed View', icon: <FileText size={16} /> },
            { key: 'discrepancies', label: 'Discrepancies', icon: <AlertTriangle size={16} /> },
            { key: 'analytics', label: 'Analytics', icon: <TrendingUp size={16} /> }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setSelectedView(view.key as 'overview' | 'detailed' | 'discrepancies' | 'analytics')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                selectedView === view.key
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
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
        <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <select
                title="Select Date Range"
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none`}
              >
                <option value="today">Today</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="this-quarter">This Quarter</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Party Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Party</label>
              <input
                type="text"
                placeholder="Search party..."
                value={filters.partyFilter}
                onChange={(e) => setFilters(prev => ({ ...prev, partyFilter: e.target.value }))}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none`}
              />
            </div>

            {/* Matching Status */}
            <div>
              <label className="block text-sm font-medium mb-1">Matching Status</label>
              <select
                title="Select Matching Status Filter"
                value={filters.matchingStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, matchingStatus: e.target.value }))}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none`}
              >
                <option value="">All Status</option>
                <option value="Fully Matched">Fully Matched</option>
                <option value="Partially Matched">Partially Matched</option>
                <option value="Unmatched">Unmatched</option>
                <option value="Disputed">Disputed</option>
              </select>
            </div>

            {/* GSTR-1 Status */}
            <div>
              <label className="block text-sm font-medium mb-1">GSTR-1 Status</label>
              <select
                title="Select GSTR-1 Status Filter"
                value={filters.gstr1Status}
                onChange={(e) => setFilters(prev => ({ ...prev, gstr1Status: e.target.value }))}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none`}
              >
                <option value="">All Status</option>
                <option value="Filed">Filed</option>
                <option value="Not Filed">Not Filed</option>
                <option value="Pending">Pending</option>
                <option value="Error">Error</option>
              </select>
            </div>

            {/* GSTR-2 Status */}
            <div>
              <label className="block text-sm font-medium mb-1">GSTR-2 Status</label>
              <select
                title="Select GSTR-2 Status Filter"
                value={filters.gstr2Status}
                onChange={(e) => setFilters(prev => ({ ...prev, gstr2Status: e.target.value }))}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none`}
              >
                <option value="">All Status</option>
                <option value="Matched">Matched</option>
                <option value="Unmatched">Unmatched</option>
                <option value="Disputed">Disputed</option>
                <option value="Accepted">Accepted</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {/* E-Invoice Status */}
            <div>
              <label className="block text-sm font-medium mb-1">E-Invoice Status</label>
              <select
                title="Select E-Invoice Status Filter"
                value={filters.eInvoiceStatus}
                onChange={(e) => setFilters(prev => ({ ...prev, eInvoiceStatus: e.target.value }))}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none`}
              >
                <option value="">All Status</option>
                <option value="Generated">Generated</option>
                <option value="Not Generated">Not Generated</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Error">Error</option>
              </select>
            </div>

            {/* Has Discrepancies */}
            <div>
              <label className="block text-sm font-medium mb-1">Show Only</label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasDiscrepancies}
                  onChange={(e) => setFilters(prev => ({ ...prev, hasDiscrepancies: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm">With Discrepancies</span>
              </label>
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() => setFilters({
                  dateRange: 'this-month',
                  fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
                  toDate: new Date().toISOString().split('T')[0],
                  partyFilter: '',
                  matchingStatus: '',
                  gstr1Status: '',
                  gstr2Status: '',
                  eInvoiceStatus: '',
                  eWayBillStatus: '',
                  invoiceType: '',
                  amountRange: '',
                  hasDiscrepancies: false,
                  company_id: companyId,
                  owner_type: ownerType,
                  owner_id: ownerId,
                  partyId: '',
                  minAmount: '',
                  maxAmount: ''

                })}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-600 hover:bg-gray-500 border-gray-600' 
                    : 'bg-gray-100 hover:bg-gray-200 border-gray-300'
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
        {/* Overview Dashboard */}
        {selectedView === 'overview' && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70">Total Invoices</p>
                    <p className="text-2xl font-bold">{summary.totalInvoices}</p>
                    <p className="text-sm text-green-600">{formatCurrency(summary.totalAmount)}</p>
                  </div>
                  <FileText className="text-blue-600" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70">Fully Matched</p>
                    <p className="text-2xl font-bold text-green-600">{summary.fullyMatched}</p>
                    <p className="text-sm text-green-600">{formatCurrency(summary.matchedAmount)}</p>
                  </div>
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70">Unmatched</p>
                    <p className="text-2xl font-bold text-red-600">{summary.unmatched}</p>
                    <p className="text-sm text-red-600">{formatCurrency(summary.unmatchedAmount)}</p>
                  </div>
                  <XCircle className="text-red-600" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-70">Disputed</p>
                    <p className="text-2xl font-bold text-purple-600">{summary.disputed}</p>
                    <p className="text-sm text-purple-600">{formatCurrency(summary.disputedAmount)}</p>
                  </div>
                  <AlertTriangle className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            {/* Compliance Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
                <div className="text-center">
                  <p className="text-sm opacity-70">GSTR-1 Filed</p>
                  <p className="text-xl font-bold">{summary.gstr1Filed}/{summary.totalInvoices}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-blue-600 h-2 rounded-full w-3/4 transition-all duration-300"></div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
                <div className="text-center">
                  <p className="text-sm opacity-70">GSTR-2 Matched</p>
                  <p className="text-xl font-bold">{summary.gstr2Matched}/{summary.totalInvoices}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-green-600 h-2 rounded-full w-4/5 transition-all duration-300"></div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
                <div className="text-center">
                  <p className="text-sm opacity-70">E-Invoices Generated</p>
                  <p className="text-xl font-bold">{summary.eInvoicesGenerated}/{summary.totalInvoices}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-purple-600 h-2 rounded-full w-1/2 transition-all duration-300"></div>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
                <div className="text-center">
                  <p className="text-sm opacity-70">E-Way Bills Generated</p>
                  <p className="text-xl font-bold">{summary.eWayBillsGenerated}/{summary.totalInvoices}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div className="bg-orange-600 h-2 rounded-full w-2/3 transition-all duration-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Detailed View Table */}
        {(selectedView === 'detailed' || selectedView === 'discrepancies') && (
          <div className={`rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            {/* Bulk Actions */}
            {selectedInvoices.length > 0 && (
              <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{selectedInvoices.length} selected</span>
                    <button
                      onClick={() => setSelectedInvoices([])}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      Clear selection
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleBulkAction('match')}
                      disabled={matchingInProgress}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                    >
                      {matchingInProgress ? 'Processing...' : 'Mark as Matched'}
                    </button>
                    <button
                      onClick={() => handleBulkAction('dispute')}
                      disabled={matchingInProgress}
                      className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                    >
                      Mark as Disputed
                    </button>
                    <button
                      onClick={() => handleBulkAction('export')}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Export Selected
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        title="Select all invoices"
                        checked={selectedInvoices.length === filteredData.length && filteredData.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedInvoices(filteredData.map(inv => inv.id));
                          } else {
                            setSelectedInvoices([]);
                          }
                        }}
                        className="rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left font-medium">Voucher No</th>
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Party Name</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 text-center font-medium">Matching Status</th>
                    <th className="px-4 py-3 text-center font-medium">GSTR-1</th>
                    <th className="px-4 py-3 text-center font-medium">GSTR-2</th>
                    <th className="px-4 py-3 text-center font-medium">E-Invoice</th>
                    <th className="px-4 py-3 text-center font-medium">E-Way Bill</th>
                    {selectedView === 'discrepancies' && <th className="px-4 py-3 text-left font-medium">Discrepancies</th>}
                    <th className="px-4 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData
                    .filter(invoice => selectedView === 'discrepancies' ? (invoice.discrepancies ?? []).length > 0 : true)
                    .map((invoice) => (
                    <tr key={invoice.id} className={`border-t ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          title={`Select invoice ${invoice.voucherNo}`}
                          checked={selectedInvoices.includes(invoice.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedInvoices(prev => [...prev, invoice.id]);
                            } else {
                              setSelectedInvoices(prev => prev.filter(id => id !== invoice.id));
                            }
                          }}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">{invoice.voucherNo}</td>
                      <td className="px-4 py-3 text-sm">{new Date(invoice.voucherDate).toLocaleDateString('en-IN')}</td>
                      <td className="px-4 py-3 text-sm">
                        <div>
                          <div className="font-medium">{invoice.partyName}</div>
                          {invoice.partyGSTIN && <div className="text-xs opacity-70 font-mono">{invoice.partyGSTIN}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">{formatCurrency(invoice.invoiceAmount)}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {getStatusIcon(invoice.matchingStatus || '')}

                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.matchingStatus, 'matching')}`}>
                            {invoice.matchingStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {getStatusIcon(invoice.gstr1Status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.gstr1Status, 'gstr1')}`}>
                            {invoice.gstr1Status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {getStatusIcon(invoice.gstr2Status)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.gstr2Status, 'gstr2')}`}>
                            {invoice.gstr2Status}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {getStatusIcon(invoice.eInvoiceStatus)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.eInvoiceStatus, 'einvoice')}`}>
                            {invoice.eInvoiceStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          {getStatusIcon(invoice.eWayBillStatus)}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.eWayBillStatus, 'eway')}`}>
                            {invoice.eWayBillStatus}
                          </span>
                        </div>
                      </td>
                      {selectedView === 'discrepancies' && (
                        <td className="px-4 py-3 text-sm">
                          <div className="space-y-1">
                            {invoice.discrepancies.map((disc, idx) => (
                              <div key={idx} className="flex items-center space-x-1">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span className="text-xs">{disc}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <button 
                            onClick={() => handleViewDetails(invoice)}
                            className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </button>
                          
                         {(invoice.discrepancies ?? []).length > 0 && (
                            <button 
                              className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                              title="Resolve Discrepancies"
                            >
                              <Settings size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {selectedView === 'analytics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Matching Status Chart */}
            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <h3 className="text-lg font-semibold mb-4">Matching Status Distribution</h3>
              <div className="space-y-4">
                {[
                  { label: 'Fully Matched', count: summary.fullyMatched, color: 'bg-green-500' },
                  { label: 'Partially Matched', count: summary.partiallyMatched, color: 'bg-yellow-500' },
                  { label: 'Unmatched', count: summary.unmatched, color: 'bg-red-500' },
                  { label: 'Disputed', count: summary.disputed, color: 'bg-purple-500' }
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded ${item.color}`}></div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">{item.count}</span>
                      <span className="text-xs opacity-70">
                        ({summary.totalInvoices > 0 ? ((item.count / summary.totalInvoices) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Overview */}
            <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <h3 className="text-lg font-semibold mb-4">Compliance Overview</h3>
              <div className="space-y-4">
                {[
                  { label: 'GSTR-1 Filed', count: summary.gstr1Filed, total: summary.totalInvoices, color: 'bg-blue-500' },
                  { label: 'GSTR-2 Matched', count: summary.gstr2Matched, total: summary.totalInvoices, color: 'bg-green-500' },
                  { label: 'E-Invoices Generated', count: summary.eInvoicesGenerated, total: summary.totalInvoices, color: 'bg-purple-500' },
                  { label: 'E-Way Bills Generated', count: summary.eWayBillsGenerated, total: summary.totalInvoices, color: 'bg-orange-500' }
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">{item.label}</span>
                      <span className="text-sm font-medium">{item.count}/{item.total}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full w-3/4 transition-all duration-300 ${item.color}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Analysis */}
            <div className={`p-6 rounded-lg col-span-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <h3 className="text-lg font-semibold mb-4">Amount Analysis</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-sm opacity-70">Total Amount</p>
                  <p className="text-xl font-bold">{formatCurrency(summary.totalAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-70">Matched Amount</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(summary.matchedAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-70">Unmatched Amount</p>
                  <p className="text-xl font-bold text-red-600">{formatCurrency(summary.unmatchedAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm opacity-70">Disputed Amount</p>
                  <p className="text-xl font-bold text-purple-600">{formatCurrency(summary.disputedAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className={`mt-4 p-3 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className="text-sm text-center opacity-70">
            Showing {filteredData.length} of {invoices.length} sales invoices
            {filters.dateRange !== 'custom' && ` for ${filters.dateRange.replace('-', ' ')}`}
          </p>
        </div>
      </div>

      {/* Auto Matching Modal */}
      {showMatchingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-6 rounded-lg max-w-md w-full mx-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className="text-lg font-semibold mb-4">Auto Match Invoices</h3>
            <p className="text-sm opacity-70 mb-4">
              This will automatically match invoices with GSTR-2A data based on:
            </p>
            <ul className="text-sm space-y-1 mb-4">
              <li>• Invoice number and date</li>
              <li>• Party GSTIN</li>
              <li>• Invoice amount (±5% tolerance)</li>
              <li>• Tax amounts</li>
            </ul>
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setShowMatchingModal(false);
                  handleBulkAction('match');
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Start Auto Match
              </button>
              <button
                onClick={() => setShowMatchingModal(false)}
                className={`flex-1 px-4 py-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {showDetailModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Invoice Details</h2>
                <button
                  onClick={closeModal}
                  className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Invoice Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Invoice No:</span>
                      <span className="font-mono">{selectedInvoice.voucherNo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Date:</span>
                      <span>{new Date(selectedInvoice.voucherDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Party:</span>
                      <span>{selectedInvoice.partyName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">GSTIN:</span>
                      <span className="font-mono">{selectedInvoice.partyGSTIN}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Invoice Amount:</span>
                      <span className="font-mono">{selectedInvoice.invoiceAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Matching Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">GSTR-2A Matching:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.matchingStatus, 'matching')}`}>
                        {selectedInvoice.matchingStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">GSTR-1 Status:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.gstr1Status, 'gstr1')}`}>
                        {selectedInvoice.gstr1Status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">E-Invoice:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.eInvoiceStatus, 'einvoice')}`}>
                        {selectedInvoice.eInvoiceStatus}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">E-Way Bill:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedInvoice.eWayBillStatus, 'eway')}`}>
                        {selectedInvoice.eWayBillStatus}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tax Breakdown */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Tax Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="text-sm opacity-70">Taxable Amount</div>
                    <div className="font-mono font-semibold">{selectedInvoice.taxableAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
                  </div>
                  <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="text-sm opacity-70">CGST</div>
                    <div className="font-mono font-semibold">{selectedInvoice.cgstAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
                  </div>
                  <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="text-sm opacity-70">SGST</div>
                    <div className="font-mono font-semibold">{selectedInvoice.sgstAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
                  </div>
                  <div className={`p-3 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="text-sm opacity-70">IGST</div>
                    <div className="font-mono font-semibold">{selectedInvoice.igstAmount.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
                  </div>
                </div>
              </div>

              {/* Discrepancies */}
              {selectedInvoice.discrepancies.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Discrepancies Found</h3>
                  <div className="space-y-2">
                    {selectedInvoice.discrepancies.map((discrepancy, index) => (
                      <div key={index} className={`p-3 rounded border-l-4 ${theme === 'dark' ? 'bg-red-900/20 border-red-500' : 'bg-red-50 border-red-400'}`}>
                        <div className="font-medium text-red-600">{discrepancy}</div>
                        <div className="text-sm opacity-80">Please review and resolve this discrepancy</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Item Details */}
              {selectedInvoice.itemDetails && selectedInvoice.itemDetails.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Item Details</h3>
                  <div className="overflow-x-auto">
                    <table className={`w-full border rounded ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                      <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <tr>
                          <th className="px-3 py-2 text-left">Item</th>
                          <th className="px-3 py-2 text-left">HSN</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Rate</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                          <th className="px-3 py-2 text-right">Tax Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInvoice.itemDetails.map((item, index) => (
                          <tr key={index} className={`border-t ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                            <td className="px-3 py-2">{item.itemName}</td>
                            <td className="px-3 py-2 font-mono text-sm">{item.hsnCode}</td>
                            <td className="px-3 py-2 text-right font-mono">{item.quantity} {item.unit}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.rate)}</td>
                            <td className="px-3 py-2 text-right font-mono">{formatCurrency(item.amount)}</td>
                            <td className="px-3 py-2 text-right font-mono">{item.taxRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Additional Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Compliance Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>IRN Number:</span>
                      <span className="font-mono">{'Not Generated'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>E-Way Bill No:</span>
                      <span className="font-mono">{'Not Generated'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Filing Date:</span>
                      <span>{'Not Filed'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Return Period:</span>
                      <span>{'Current Period'}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">System Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Created Date:</span>
                      <span>{new Date(selectedInvoice.voucherDate).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span>{new Date().toLocaleDateString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Matched Amount:</span>
                      <span className="font-mono">{formatCurrency(selectedInvoice.invoiceAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Amount:</span>
                      <span className="font-mono">{'₹0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesInvoiceMatching;



