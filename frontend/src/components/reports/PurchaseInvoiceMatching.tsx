import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  Filter, 
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  BarChart3,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';

interface PurchaseInvoiceMatch {
  id: string;
  voucherNo: string;
  voucherDate: string;
  supplierName: string;
  supplierGSTIN?: string;
  invoiceAmount: number;
  taxableAmount: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  invoiceType: 'B2B' | 'Import' | 'SEZ' | 'Deemed Export';
  placeOfSupply: string;
  eWayBillNo?: string;
  billOfEntry?: string;
  billOfEntryDate?: string;
  gstr2aStatus: 'Available' | 'Not Available' | 'Pending' | 'Error';
  gstr2Status: 'Filed' | 'Not Filed' | 'Pending' | 'Error';
  isd?: string; // Input Service Distributor
  itcStatus: 'Claimed' | 'Not Claimed' | 'Restricted' | 'Blocked';
  matchingStatus: 'Fully Matched' | 'Partially Matched' | 'Unmatched' | 'Disputed';
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
  dateRange: string;
  fromDate: string;
  toDate: string;
  supplierFilter: string;
  matchingStatus: string;
  gstr2aStatus: string;
  gstr2Status: string;
  itcStatus: string;
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
  gstr2aAvailable: number;
  gstr2Filed: number;
  itcClaimed: number;
  totalItcAmount: number;
}

const PurchaseInvoiceMatching1: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed' | 'discrepancies' | 'analytics'>('overview');
  
  const [filters, setFilters] = useState<MatchingFilter>({
    dateRange: 'this-month',
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    supplierFilter: '',
    matchingStatus: '',
    gstr2aStatus: '',
    gstr2Status: '',
    itcStatus: '',
    invoiceType: '',
    amountRange: '',
    hasDiscrepancies: false
  });
const [data, setData] = useState<PurchaseInvoiceMatch[]>([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get('http://localhost:5000/api/purchase-invoice-matching', {
        params: {
          company_id: 38,
          owner_type: 'employee',
          owner_id: 10,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        },
      })
      .then(res => {
        setData(res.data as PurchaseInvoiceMatch[]);
        setLoading(false);
      })
      .catch(_err => {
        setError('Failed to load data');
        setLoading(false);
      });
  }, [filters]);


  // Mock purchase invoice data - Enhanced with more comprehensive dummy data
   

    const filteredData = useMemo(() => {
  return data.filter(invoice => {
    const invoiceDate = new Date(invoice.voucherDate);
    const fromDate = new Date(filters.fromDate);
    const toDate = new Date(filters.toDate);

    if (invoiceDate < fromDate || invoiceDate > toDate) return false;
    if (filters.supplierFilter && !invoice.supplierName.toLowerCase().includes(filters.supplierFilter.toLowerCase())) return false;
    if (filters.matchingStatus && invoice.matchingStatus !== filters.matchingStatus) return false;
    if (filters.gstr2aStatus && invoice.gstr2aStatus !== filters.gstr2aStatus) return false;
    if (filters.gstr2Status && invoice.gstr2Status !== filters.gstr2Status) return false;
    if (filters.itcStatus && invoice.itcStatus !== filters.itcStatus) return false;
    if (filters.invoiceType && invoice.invoiceType !== filters.invoiceType) return false;
    if (filters.hasDiscrepancies && (!invoice.discrepancies || invoice.discrepancies.length === 0)) return false;

    return true;
  });
}, [data, filters]);


  // Calculate summary
  const summary = useMemo((): MatchingSummary => {
    const total = filteredData.length;
    const fullyMatched = filteredData.filter(inv => inv.matchingStatus === 'Fully Matched').length;
    const partiallyMatched = filteredData.filter(inv => inv.matchingStatus === 'Partially Matched').length;
    const unmatched = filteredData.filter(inv => inv.matchingStatus === 'Unmatched').length;
    const disputed = filteredData.filter(inv => inv.matchingStatus === 'Disputed').length;
    
    const totalAmount = filteredData.reduce((sum, inv) => sum + inv.invoiceAmount, 0);
    const matchedAmount = filteredData.filter(inv => inv.matchingStatus === 'Fully Matched').reduce((sum, inv) => sum + inv.invoiceAmount, 0);
    const unmatchedAmount = filteredData.filter(inv => inv.matchingStatus === 'Unmatched').reduce((sum, inv) => sum + inv.invoiceAmount, 0);
    const disputedAmount = filteredData.filter(inv => inv.matchingStatus === 'Disputed').reduce((sum, inv) => sum + inv.invoiceAmount, 0);
    
    const gstr2aAvailable = filteredData.filter(inv => inv.gstr2aStatus === 'Available').length;
    const gstr2Filed = filteredData.filter(inv => inv.gstr2Status === 'Filed').length;
    const itcClaimed = filteredData.filter(inv => inv.itcStatus === 'Claimed').length;
    const totalItcAmount = filteredData.filter(inv => inv.itcStatus === 'Claimed').reduce((sum, inv) => sum + inv.totalTaxAmount, 0);

    return {
      totalInvoices: total,
      fullyMatched,
      partiallyMatched,
      unmatched,
      disputed,
      totalAmount,
      matchedAmount,
      unmatchedAmount,
      disputedAmount,
      gstr2aAvailable,
      gstr2Filed,
      itcClaimed,
      totalItcAmount
    };
  }, [filteredData]);

  const handleFilterChange = (key: keyof MatchingFilter, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let fromDate = new Date();
    let toDate = today;

    switch (range) {
      case 'today':
        fromDate = today;
        break;
      case 'yesterday':
        fromDate = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        toDate = fromDate;
        break;
      case 'this-week':
        fromDate = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
        break;
      case 'this-month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'this-quarter': {
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        fromDate = new Date(today.getFullYear(), quarterStart, 1);
        break;
      }
      case 'this-year':
        fromDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    setFilters(prev => ({
      ...prev,
      dateRange: range,
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0]
    }));
  };

  const exportToExcel = () => {
    const exportData = filteredData.map(invoice => ({
      'Voucher No': invoice.voucherNo,
      'Date': invoice.voucherDate,
      'Supplier Name': invoice.supplierName,
      'Supplier GSTIN': invoice.supplierGSTIN,
      'Invoice Amount': invoice.invoiceAmount,
      'Tax Amount': invoice.totalTaxAmount,
      'Invoice Type': invoice.invoiceType,
      'GSTR-2A Status': invoice.gstr2aStatus,
      'GSTR-2 Status': invoice.gstr2Status,
      'ITC Status': invoice.itcStatus,
      'Matching Status': invoice.matchingStatus,
      'Discrepancies': invoice.discrepancies.join(', ')
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Invoice Matching');
    XLSX.writeFile(wb, `purchase-invoice-matching-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const originalContent = document.body.innerHTML;
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContent;
      window.location.reload();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Fully Matched':
      case 'Available':
      case 'Filed':
      case 'Claimed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Unmatched':
      case 'Not Available':
      case 'Not Filed':
      case 'Not Claimed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'Partially Matched':
      case 'Pending':
      case 'Restricted':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'Disputed':
      case 'Error':
      case 'Blocked':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fully Matched':
      case 'Available':
      case 'Filed':
      case 'Claimed':
        return 'text-green-600 bg-green-100';
      case 'Unmatched':
      case 'Not Available':
      case 'Not Filed':
      case 'Not Claimed':
        return 'text-red-600 bg-red-100';
      case 'Partially Matched':
      case 'Pending':
      case 'Restricted':
        return 'text-yellow-600 bg-yellow-100';
      case 'Disputed':
      case 'Error':
      case 'Blocked':
        return 'text-red-700 bg-red-200';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className={`min-h-screen pt-[56px] ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app/reports')}
              title="Back to Reports"
              className={`p-2 rounded-md ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Purchase Invoice Matching</h1>
              <p className="text-sm opacity-70">Match purchase invoices with GSTR-2A and manage ITC claims</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-md ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
              title="Filters"
            >
              <Filter className="w-4 h-4" />
            </button>
            <button
              onClick={exportToExcel}
              className={`p-2 rounded-md ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
              title="Export"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className={`p-2 rounded-md ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
            { key: 'detailed', label: 'Detailed View', icon: <FileText size={16} /> },
            { key: 'discrepancies', label: 'Discrepancies', icon: <AlertTriangle size={16} /> },
            { key: 'analytics', label: 'Analytics', icon: <TrendingDown size={16} /> }
          ].map(view => (
            <button
              key={view.key}
              onClick={() => setSelectedView(view.key as 'overview' | 'detailed' | 'discrepancies' | 'analytics')}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                selectedView === view.key
                  ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                  : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700')
              }`}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>

        {/* Filters Panel */}
        {showFilterPanel && (
          <div className={`mt-4 p-4 rounded-lg border ${
            theme === 'dark' 
              ? 'bg-gray-700 border-gray-600' 
              : 'bg-gray-100 border-gray-300'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  aria-label="Date Range"
                  className={`w-full p-2 rounded border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-black focus:border-blue-500'
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

              <div>
                <label className="block text-sm font-medium mb-1">Supplier</label>
                <input
                  type="text"
                  placeholder="Search supplier..."
                  value={filters.supplierFilter}
                  onChange={(e) => handleFilterChange('supplierFilter', e.target.value)}
                  className={`w-full p-2 rounded border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-black placeholder-gray-500 focus:border-blue-500'
                  } outline-none`}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Matching Status</label>
                <select
                  value={filters.matchingStatus}
                  onChange={(e) => handleFilterChange('matchingStatus', e.target.value)}
                  aria-label="Matching Status"
                  className={`w-full p-2 rounded border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-black focus:border-blue-500'
                  } outline-none`}
                >
                  <option value="">All Statuses</option>
                  <option value="Fully Matched">Fully Matched</option>
                  <option value="Partially Matched">Partially Matched</option>
                  <option value="Unmatched">Unmatched</option>
                  <option value="Disputed">Disputed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">GSTR-2A Status</label>
                <select
                  value={filters.gstr2aStatus}
                  onChange={(e) => handleFilterChange('gstr2aStatus', e.target.value)}
                  aria-label="GSTR-2A Status"
                  className={`w-full p-2 rounded border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-black focus:border-blue-500'
                  } outline-none`}
                >
                  <option value="">All Statuses</option>
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                  <option value="Pending">Pending</option>
                  <option value="Error">Error</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ITC Status</label>
                <select
                  value={filters.itcStatus}
                  onChange={(e) => handleFilterChange('itcStatus', e.target.value)}
                  aria-label="ITC Status"
                  className={`w-full p-2 rounded border ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-black focus:border-blue-500'
                  } outline-none`}
                >
                  <option value="">All Statuses</option>
                  <option value="Claimed">Claimed</option>
                  <option value="Not Claimed">Not Claimed</option>
                  <option value="Restricted">Restricted</option>
                  <option value="Blocked">Blocked</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

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
                    <p className="text-sm text-blue-600">{formatCurrency(summary.totalAmount)}</p>
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
                    <p className="text-sm opacity-70">ITC Claimed</p>
                    <p className="text-2xl font-bold text-purple-600">{summary.itcClaimed}</p>
                    <p className="text-sm text-purple-600">{formatCurrency(summary.totalItcAmount)}</p>
                  </div>
                  <BarChart3 className="text-purple-600" size={24} />
                </div>
              </div>
            </div>

            {/* Overview Table */}
            <div className={`rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Invoice Matching Overview</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <th className="text-left p-3">Voucher No</th>
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Supplier</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">GSTR-2A</th>
                        <th className="text-left p-3">ITC Status</th>
                        <th className="text-left p-3">Matching Status</th>
                        <th className="text-left p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map((invoice) => (
                        <tr key={invoice.id} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                          <td className="p-3 font-medium">{invoice.voucherNo}</td>
                          <td className="p-3">{new Date(invoice.voucherDate).toLocaleDateString()}</td>
                          <td className="p-3">
                            <div>
                              <div className="font-medium">{invoice.supplierName}</div>
                              <div className="text-sm opacity-70">{invoice.supplierGSTIN}</div>
                            </div>
                          </td>
                          <td className="p-3 font-medium">{formatCurrency(invoice.invoiceAmount)}</td>
                          <td className="p-3">
                            <div className="flex items-center">
                              {getStatusIcon(invoice.gstr2aStatus)}
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(invoice.gstr2aStatus)}`}>
                                {invoice.gstr2aStatus}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center">
                              {getStatusIcon(invoice.itcStatus)}
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(invoice.itcStatus)}`}>
                                {invoice.itcStatus}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center">
                              {getStatusIcon(invoice.matchingStatus)}
                              <span className={`ml-2 px-2 py-1 rounded text-xs ${getStatusColor(invoice.matchingStatus)}`}>
                                {invoice.matchingStatus}
                              </span>
                            </div>
                          </td>
                          <td className="p-3">
                            <button 
                              title="View Details"
                              aria-label="View Details"
                              className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {selectedView === 'detailed' && (
          <div className={`rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Invoice View</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <th className="text-left p-3">Voucher No</th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Supplier</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Tax Amount</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((invoice) => (
                      <tr key={invoice.id} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                        <td className="p-3 font-medium">{invoice.voucherNo}</td>
                        <td className="p-3">{new Date(invoice.voucherDate).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{invoice.supplierName}</div>
                            <div className="text-sm opacity-70">{invoice.supplierGSTIN}</div>
                          </div>
                        </td>
                        <td className="p-3 font-medium">{formatCurrency(invoice.invoiceAmount)}</td>
                        <td className="p-3">{formatCurrency(invoice.totalTaxAmount)}</td>
                        <td className="p-3">{invoice.invoiceType}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${getStatusColor(invoice.matchingStatus)}`}>
                            {invoice.matchingStatus}
                          </span>
                        </td>
                        <td className="p-3">
                          <button 
                            title="View Details"
                            aria-label="View Details"
                            className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {selectedView === 'discrepancies' && (
          <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Discrepancies Summary</h3>
              <div className="space-y-4">
                {filteredData.filter(invoice => invoice.discrepancies.length > 0).map((invoice) => (
                  <div key={invoice.id} className={`p-4 rounded border ${
                    theme === 'dark' ? 'border-gray-600 bg-gray-750' : 'border-gray-300 bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-medium">{invoice.voucherNo} - {invoice.supplierName}</h4>
                        <p className="text-sm opacity-70">{formatCurrency(invoice.invoiceAmount)}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(invoice.matchingStatus)}`}>
                        {invoice.matchingStatus}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {invoice.discrepancies.map((discrepancy, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                          {discrepancy}
                        </div>
                      ))}
                    </div>
                    {invoice.remarks && (
                      <div className="mt-2 text-sm italic opacity-75">
                        Note: {invoice.remarks}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedView === 'analytics' && (
          <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Matching Analytics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`p-4 rounded border ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <h4 className="font-medium mb-3">Matching Status Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Fully Matched</span>
                      <span className="font-medium">{summary.fullyMatched} ({((summary.fullyMatched / summary.totalInvoices) * 100 || 0).toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Partially Matched</span>
                      <span className="font-medium">{summary.partiallyMatched} ({((summary.partiallyMatched / summary.totalInvoices) * 100 || 0).toFixed(1)}%)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unmatched</span>
                      <span className="font-medium">{summary.unmatched} ({((summary.unmatched / summary.totalInvoices) * 100 || 0).toFixed(1)}%)</span>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded border ${
                  theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
                }`}>
                  <h4 className="font-medium mb-3">ITC Status Summary</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total ITC Claimed</span>
                      <span className="font-medium">{formatCurrency(summary.totalItcAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Invoices with ITC</span>
                      <span className="font-medium">{summary.itcClaimed} / {summary.totalInvoices}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GSTR-2A Available</span>
                      <span className="font-medium">{summary.gstr2aAvailable} / {summary.totalInvoices}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseInvoiceMatching1;
