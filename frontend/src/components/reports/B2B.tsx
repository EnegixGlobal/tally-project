import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Eye,
  Building2,
  DollarSign,
  FileText,
  AlertTriangle,
  Handshake
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './reports.css';
interface B2BTransactionLine {
  totalAmount: any;
  taxAmount: any;
  priority: any;
  outstanding: any;
  contractDetails?: {
    contractId: string;
    startDate: string;
    endDate: string;
    renewalTerms: string;
    volumeCommitments: number;
  };
  contactPerson: any;
  businessGSTIN: any;
  id: any;
  dueDate: any;
  netAmount: number;
  businessType: string;
  status: string;
  transactionType: string;
  businessName: any;
  voucherId: number;
  voucherNo: string;
  date: string;
  narration: string | null;
  referenceNo: string | null;
  subtotal: string;
  cgstTotal: string;
  sgstTotal: string;
  igstTotal: string;
  discountTotal: string;
  total: string;
  createdAt: string;
  partyId: number;
  partyName: string;
  partyGSTIN: string | null;
  itemId: number;
  itemName: string;
  hsnCode: string | null;
  quantity: string;
  unit: string | null;
  rate: string;
  amount: string;
  cgstRate: string;
  sgstRate: string;
  igstRate: string;
}

// interface B2BTransaction {
//   id: string;
//   transactionType: 'sale' | 'purchase' | 'quote' | 'order';
//   businessId: string;
//   businessName: string;
//   businessGSTIN: string;
//   businessType: 'manufacturer' | 'wholesaler' | 'distributor' | 'retailer' | 'service_provider';
//   contactPerson: string;
//   email: string;
//   phone: string;
//   voucherNo: string;
//   date: string;
//   dueDate?: string;
//   items: {
//     itemId: string;
//     itemName: string;
//     hsnCode: string;
//     quantity: number;
//     unitPrice: number;
//     discount: number;
//     taxRate: number;
//     amount: number;
//   }[];
//   totalAmount: number;
//   taxAmount: number;
//   netAmount: number;
//   paymentTerms: string;
//   deliveryTerms: string;
//   status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'paid' | 'cancelled';
//   priority: 'low' | 'medium' | 'high' | 'urgent';
//   creditLimit: number;
//   outstanding: number;
//   lastInteraction: string;
//   contractDetails?: {
//     contractId: string;
//     startDate: string;
//     endDate: string;
//     renewalTerms: string;
//     volumeCommitments: number;
//   };
//   compliance: {
//     gstCompliant: boolean;
//     documentStatus: 'complete' | 'partial' | 'missing';
//     certifications: string[];
//   };
// }

interface B2BPartner {
  id: string;
  name: string;
  gstin: string;
  businessType: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalTransactions: number;
  totalValue: number;
  outstanding: number;
  creditLimit: number;
  paymentTerms: string;
  relationship: 'supplier' | 'customer' | 'both';
  status: 'active' | 'inactive' | 'suspended';
  riskRating: 'low' | 'medium' | 'high';
  lastTransaction: string;
  contractValue: number;
  loyalty: {
    score: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    benefits: string[];
  };
}

interface FilterState {
  dateRange: string;
  fromDate: string;
  toDate: string;
  businessFilter: string;
  transactionType: string;
  statusFilter: string;
  businessTypeFilter: string;
  priorityFilter: string;
  amountRangeMin: string;
  amountRangeMax: string;
}

type ViewType = 'dashboard' | 'transactions' | 'partners' | 'analytics' | 'contracts';

const B2B: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [partners, setPartners] = useState<B2BPartner[]>([]);

  const [transactions, setTransactions] = useState<B2BTransactionLine[]>([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Example filters — can be moved to state and UI controlled
  const company_id = localStorage.getItem('company_id') || '';
  const owner_type = localStorage.getItem('userType') || '';
  const owner_id = localStorage.getItem('employee_id') || '';


  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<ViewType>('dashboard');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'this-month',
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    businessFilter: '',
    transactionType: '',
    statusFilter: '',
    businessTypeFilter: '',
    priorityFilter: '',
    amountRangeMin: '',
    amountRangeMax: ''
  });

  // Mock B2B transaction data
  // const b2bTransactions = useMemo((): B2BTransaction[] => [
  //   {
  //     id: 'B2B001',
  //     transactionType: 'sale',
  //     businessId: 'BUS001',
  //     businessName: 'TechCorp Solutions Pvt Ltd',
  //     businessGSTIN: '29AABCT1332L1Z4',
  //     businessType: 'service_provider',
  //     contactPerson: 'Rajesh Kumar',
  //     email: 'rajesh@techcorp.com',
  //     phone: '+91 9876543210',
  //     voucherNo: 'SALE/B2B/001',
  //     date: '2025-07-01',
  //     dueDate: '2025-07-31',
  //     items: [
  //       {
  //         itemId: 'ITM001',
  //         itemName: 'Enterprise Software License',
  //         hsnCode: '9983',
  //         quantity: 5,
  //         unitPrice: 50000,
  //         discount: 5000,
  //         taxRate: 18,
  //         amount: 245000
  //       },
  //       {
  //         itemId: 'ITM002',
  //         itemName: 'Technical Support Package',
  //         hsnCode: '9984',
  //         quantity: 1,
  //         unitPrice: 100000,
  //         discount: 0,
  //         taxRate: 18,
  //         amount: 100000
  //       }
  //     ],
  //     totalAmount: 345000,
  //     taxAmount: 62100,
  //     netAmount: 407100,
  //     paymentTerms: '30 Days Net',
  //     deliveryTerms: 'Digital Delivery',
  //     status: 'confirmed',
  //     priority: 'high',
  //     creditLimit: 1000000,
  //     outstanding: 407100,
  //     lastInteraction: '2025-07-15',
  //     contractDetails: {
  //       contractId: 'CNT001',
  //       startDate: '2025-01-01',
  //       endDate: '2025-12-31',
  //       renewalTerms: 'Auto-renewal',
  //       volumeCommitments: 20
  //     },
  //     compliance: {
  //       gstCompliant: true,
  //       documentStatus: 'complete',
  //       certifications: ['ISO 27001', 'CMMI Level 5']
  //     }
  //   },
  //   {
  //     id: 'B2B002',
  //     transactionType: 'purchase',
  //     businessId: 'BUS002',
  //     businessName: 'Global Manufacturing Co',
  //     businessGSTIN: '27AABCT2456L1Z8',
  //     businessType: 'manufacturer',
  //     contactPerson: 'Priya Sharma',
  //     email: 'priya@globalmanuf.com',
  //     phone: '+91 8765432109',
  //     voucherNo: 'PUR/B2B/002',
  //     date: '2025-07-05',
  //     dueDate: '2025-08-04',
  //     items: [
  //       {
  //         itemId: 'ITM003',
  //         itemName: 'Raw Materials - Steel',
  //         hsnCode: '7214',
  //         quantity: 1000,
  //         unitPrice: 60,
  //         discount: 2000,
  //         taxRate: 18,
  //         amount: 58000
  //       }
  //     ],
  //     totalAmount: 58000,
  //     taxAmount: 10440,
  //     netAmount: 68440,
  //     paymentTerms: '45 Days Net',
  //     deliveryTerms: 'FOB Destination',
  //     status: 'delivered',
  //     priority: 'medium',
  //     creditLimit: 500000,
  //     outstanding: 0,
  //     lastInteraction: '2025-07-20',
  //     compliance: {
  //       gstCompliant: true,
  //       documentStatus: 'complete',
  //       certifications: ['ISO 9001', 'ISO 14001']
  //     }
  //   },
  //   {
  //     id: 'B2B003',
  //     transactionType: 'quote',
  //     businessId: 'BUS003',
  //     businessName: 'Digital Marketing Agency',
  //     businessGSTIN: '36AABCT3789L1Z2',
  //     businessType: 'service_provider',
  //     contactPerson: 'Amit Patel',
  //     email: 'amit@digitalagency.com',
  //     phone: '+91 7654321098',
  //     voucherNo: 'QUO/B2B/003',
  //     date: '2025-07-10',
  //     items: [
  //       {
  //         itemId: 'ITM004',
  //         itemName: 'Digital Marketing Campaign',
  //         hsnCode: '9983',
  //         quantity: 1,
  //         unitPrice: 200000,
  //         discount: 10000,
  //         taxRate: 18,
  //         amount: 190000
  //       }
  //     ],
  //     totalAmount: 190000,
  //     taxAmount: 34200,
  //     netAmount: 224200,
  //     paymentTerms: '50% Advance, 50% on completion',
  //     deliveryTerms: '90 Days Campaign',
  //     status: 'pending',
  //     priority: 'high',
  //     creditLimit: 300000,
  //     outstanding: 0,
  //     lastInteraction: '2025-07-25',
  //     compliance: {
  //       gstCompliant: true,
  //       documentStatus: 'partial',
  //       certifications: ['Google Partner', 'Facebook Blueprint']
  //     }
  //   }
  // ], []);

  useEffect(() => {
    async function fetchPartners() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ company_id, owner_type, owner_id });
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/b2b-partners?${params.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const sanitized = (data as any[]).map((partner) => ({
          ...partner,
          totalValue: Number(partner.totalValue) || 0,
          outstanding: Number(partner.outstanding) || 0,
          name: partner.name ?? "N/A",
          businessType: partner.businessType ?? "N/A",
          loyalty: partner.loyalty ?? { tier: "N/A" },
          status: partner.status ?? "Unknown",
        }));

        setPartners(sanitized);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to fetch partners');
      } finally {
        setLoading(false);
      }
    }
    if(company_id && owner_type && owner_id) fetchPartners();
  }, [company_id, owner_type, owner_id]);

  
  // Mock B2B partners data
  // const b2bPartners = useMemo((): B2BPartner[] => [
  //   {
  //     id: 'BUS001',
  //     name: 'TechCorp Solutions Pvt Ltd',
  //     gstin: '29AABCT1332L1Z4',
  //     businessType: 'Technology Services',
  //     contactPerson: 'Rajesh Kumar',
  //     email: 'rajesh@techcorp.com',
  //     phone: '+91 9876543210',
  //     address: '123 Tech Park, Electronic City',
  //     city: 'Bangalore',
  //     state: 'Karnataka',
  //     pincode: '560100',
  //     totalTransactions: 15,
  //     totalValue: 2500000,
  //     outstanding: 407100,
  //     creditLimit: 1000000,
  //     paymentTerms: '30 Days Net',
  //     relationship: 'customer',
  //     status: 'active',
  //     riskRating: 'low',
  //     lastTransaction: '2025-07-01',
  //     contractValue: 5000000,
  //     loyalty: {
  //       score: 85,
  //       tier: 'gold',
  //       benefits: ['Volume Discount', 'Priority Support', 'Extended Warranty']
  //     }
  //   },
  //   {
  //     id: 'BUS002',
  //     name: 'Global Manufacturing Co',
  //     gstin: '27AABCT2456L1Z8',
  //     businessType: 'Manufacturing',
  //     contactPerson: 'Priya Sharma',
  //     email: 'priya@globalmanuf.com',
  //     phone: '+91 8765432109',
  //     address: '456 Industrial Area, Sector 5',
  //     city: 'Gurgaon',
  //     state: 'Haryana',
  //     pincode: '122001',
  //     totalTransactions: 25,
  //     totalValue: 1800000,
  //     outstanding: 0,
  //     creditLimit: 500000,
  //     paymentTerms: '45 Days Net',
  //     relationship: 'supplier',
  //     status: 'active',
  //     riskRating: 'low',
  //     lastTransaction: '2025-07-05',
  //     contractValue: 3000000,
  //     loyalty: {
  //       score: 92,
  //       tier: 'platinum',
  //       benefits: ['Preferred Pricing', 'Dedicated Account Manager', 'Quality Assurance']
  //     }
  //   }
  // ], []);
useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          company_id,
          owner_type,
          owner_id,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        });
        const resp = await fetch(`${import.meta.env.VITE_API_URL}/api/b2b-transactions?${params.toString()}`);
        if (!resp.ok) {
          const errText = await resp.text();
          throw new Error(errText);
        }
        const data = await resp.json();
        const sanitized = (data as any[]).map((txn) => ({
          ...txn,
          netAmount: Number(txn.netAmount) || 0,
          totalAmount: Number(txn.totalAmount) || 0,
          taxAmount: Number(txn.taxAmount) || 0,
          outstanding: Number(txn.outstanding) || 0,
          businessName: txn.businessName ?? "N/A",
          contactPerson: txn.contactPerson ?? "N/A",
          status: txn.status ?? "Unknown",
          priority: txn.priority ?? "N/A",
        }));

        setTransactions(sanitized);

        // After fetching transactions:


      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    if(company_id && owner_type && owner_id) fetchTransactions();
  }, [company_id, owner_type, owner_id, filters.fromDate, filters.toDate]);


  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      const dateInRange = transactionDate >= fromDate && transactionDate <= toDate;
      const businessMatch = !filters.businessFilter || 
        transaction.businessName.toLowerCase().includes(filters.businessFilter.toLowerCase());
      const typeMatch = !filters.transactionType || transaction.transactionType === filters.transactionType;
      const statusMatch = !filters.statusFilter || transaction.status === filters.statusFilter;
      const businessTypeMatch = !filters.businessTypeFilter || 
        transaction.businessType === filters.businessTypeFilter;
      // Implement amountRange filter if needed (parsing)
      if (filters.amountRangeMin && transaction.netAmount < parseFloat(filters.amountRangeMin)) return false;
      if (filters.amountRangeMax && transaction.netAmount > parseFloat(filters.amountRangeMax)) return false;

      return dateInRange && businessMatch && typeMatch && statusMatch && businessTypeMatch;
    });
  }, [transactions, filters]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalTransactions = filteredTransactions.length;
const totalValue = filteredTransactions.reduce((sum, t) => sum + (t.netAmount || 0), 0);
const totalOutstanding = partners.reduce((sum, p) => sum + (p.outstanding || 0), 0);
  const avgTransactionValue = totalTransactions > 0 ? totalValue / totalTransactions : 0;
    const pendingTransactions = filteredTransactions.filter(t => t.status === 'pending').length;
    const overdueTransactions = filteredTransactions.filter(t => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date() && t.status !== 'paid';
    }).length;

    return {
      totalTransactions,
      totalValue,
      avgTransactionValue,
      pendingTransactions,
      overdueTransactions,
      totalOutstanding,
      activePartners: partners.filter(p => p.status === 'active').length,
      topPartners: partners.sort((a, b) => b.totalValue - a.totalValue).slice(0, 5)
    };
  }, [filteredTransactions, partners]);

  const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(value);
};


  // Update progress bar widths after render
  useEffect(() => {
    const progressBars = document.querySelectorAll('.progress-bar[data-percentage]');
    progressBars.forEach((bar) => {
      const percentage = bar.getAttribute('data-percentage');
      if (percentage && bar instanceof HTMLElement) {
        bar.style.width = `${percentage}%`;
      }
    });
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();

    switch (range) {
      case 'today':
        fromDate = toDate = today;
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

  const handleExport = () => {
    const exportData = filteredTransactions.map(transaction => ({
      'Transaction ID': transaction.id,
      'Type': transaction.transactionType,
      'Business Name': transaction.businessName,
      'GSTIN': transaction.businessGSTIN,
      'Contact Person': transaction.contactPerson,
      'Date': transaction.date,
      'Total Amount': transaction.totalAmount,
      'Tax Amount': transaction.taxAmount,
      'Net Amount': transaction.netAmount,
      'Status': transaction.status,
      'Priority': transaction.priority,
      'Outstanding': transaction.outstanding
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'B2B Transactions');
    XLSX.writeFile(wb, `B2B_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'delivered':
      case 'paid':
        return 'text-green-800 bg-green-100';
      case 'pending':
        return 'text-yellow-800 bg-yellow-100';
      case 'cancelled':
      case 'overdue':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
      case 'high':
        return 'text-red-800 bg-red-100';
      case 'medium':
        return 'text-yellow-800 bg-yellow-100';
      case 'low':
        return 'text-green-800 bg-green-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app/reports')}
            title="Back to Reports"
            className={`p-2 rounded-lg mr-3 ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Building2 className="mr-2 text-blue-600" size={28} />
              B2B Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">Business-to-Business transactions and partnerships</p>
            <p className="text-xs text-blue-600 mt-1">
              📊 <strong>Auto-populated from Ledgers with GSTIN/UIN numbers</strong> | 
              <span className="ml-2">B2C transactions come from ledgers without GSTIN/UIN</span>
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title="Toggle Filters"
            className={`p-2 rounded-lg ${
              showFilterPanel
                ? (theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500 text-white')
                : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
            }`}
          >
            <Filter size={16} />
          </button>
          <button
            onClick={handleExport}
            title="Export to Excel"
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className={`p-4 rounded-lg mb-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                title="Select date range"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
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

            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <input
                type="text"
                placeholder="Search business..."
                value={filters.businessFilter}
                onChange={(e) => handleFilterChange('businessFilter', e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                } outline-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Transaction Type</label>
              <select
                value={filters.transactionType}
                onChange={(e) => handleFilterChange('transactionType', e.target.value)}
                title="Select transaction type"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                } outline-none`}
              >
                <option value="">All Types</option>
                <option value="sale">Sales</option>
                <option value="purchase">Purchases</option>
                <option value="quote">Quotes</option>
                <option value="order">Orders</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.statusFilter}
                onChange={(e) => handleFilterChange('statusFilter', e.target.value)}
                title="Select status filter"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                } outline-none`}
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* View Selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {['dashboard', 'transactions', 'partners', 'analytics', 'contracts'].map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view as ViewType)}
            className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${
              selectedView === view
                ? (theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      <div ref={printRef}>
        {/* Dashboard View */}
        {selectedView === 'dashboard' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-75">Total Transactions</p>
                    <p className="text-2xl font-bold">{analytics.totalTransactions}</p>
                  </div>
                  <FileText className="text-blue-500" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-75">Total Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalValue)}</p>
                  </div>
                  <DollarSign className="text-green-500" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-75">Active Partners</p>
                    <p className="text-2xl font-bold">{analytics.activePartners}</p>
                  </div>
                  <Handshake className="text-purple-500" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-75">Outstanding</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalOutstanding)}</p>
                  </div>
                  <AlertTriangle className="text-orange-500" size={24} />
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Recent B2B Transactions</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <tr>
                      <th className="text-left p-3">Business</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 5).map((transaction) => (
                      <tr key={transaction.id} className={`border-b ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{transaction.businessName}</div>
                            <div className="text-sm opacity-75">{transaction.contactPerson}</div>
                          </div>
                        </td>
                        <td className="p-3 capitalize">{transaction.transactionType}</td>
                        <td className="p-3 font-medium">{formatCurrency(Number(transaction.netAmount || transaction.amount) || 0)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td className="p-3">{new Date(transaction.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Partners */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Top B2B Partners</h3>
              <div className="space-y-3">
                {analytics.topPartners.map((partner, index) => (
                  <div key={partner.id} className={`flex items-center justify-between p-3 rounded ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{partner.name}</div>
                        <div className="text-sm opacity-75"><span className={`badge ${
  partner.loyalty?.tier === 'platinum' ? 'badge-platinum' :
  partner.loyalty?.tier === 'gold' ? 'badge-gold' :
  partner.loyalty?.tier === 'silver' ? 'badge-silver' :
  'badge-bronze'
}`}>
  {partner.loyalty?.tier ?? 'N/A'}
</span> tier</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(partner.totalValue)}</div>
                      <div className="text-sm opacity-75">{partner.totalTransactions} transactions</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transactions View */}
        {selectedView === 'transactions' && (
          <div className={`rounded-lg overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
          }`}>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">B2B Transactions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className="text-left p-3">Transaction ID</th>
                    <th className="text-left p-3">Business</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Priority</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction) => (
                    <tr key={transaction.id} className={`border-b ${
                      theme === 'dark' ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <td className="p-3 font-medium">{transaction.id}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{transaction.businessName}</div>
                          <div className="text-sm opacity-75">{transaction.businessGSTIN}</div>
                        </div>
                      </td>
                      <td className="p-3 capitalize">{transaction.transactionType}</td>
                      <td className="p-3 font-medium">{formatCurrency(transaction.netAmount)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(transaction.priority)}`}>
                          {transaction.priority}
                        </span>
                      </td>
                      <td className="p-3">{new Date(transaction.date).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <button
                          title="View Details"
                          className={`p-1 rounded ${
                            theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Partners View */}
        {selectedView === 'partners' && (
          <div className={`rounded-lg overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
          }`}>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">B2B Partners</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className="text-left p-3">Partner</th>
                    <th className="text-left p-3">Type</th>
                    <th className="text-left p-3">Total Value</th>
                    <th className="text-left p-3">Outstanding</th>
                    <th className="text-left p-3">Loyalty Tier</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
               <tbody>
  {partners.map(partner => (
    <tr key={partner.id ?? partner.gstin ?? Math.random()}>
      <td>{partner.name}</td>
      <td>{partner.businessType}</td>
      <td>{formatCurrency(partner.totalValue ?? 0)}</td>
      <td>{formatCurrency(partner.outstanding ?? 0)}</td>
      <td>
        <span className={`badge ${
  partner.loyalty?.tier === 'platinum' ? 'badge-platinum' :
  partner.loyalty?.tier === 'gold' ? 'badge-gold' :
  partner.loyalty?.tier === 'silver' ? 'badge-silver' :
  'badge-bronze'
}`}>
  {partner.loyalty?.tier ?? 'N/A'}
</span>

      </td>
      <td>
        <span className={`badge ${
          partner.status === 'active' ? 'badge-active' :
          partner.status === 'inactive' ? 'badge-inactive' :
          'badge-suspended'
        }`}>
          {partner.status ?? 'Unknown'}
        </span>
      </td>
      <td>
        <button title="View Details" className="p-1 rounded hover:bg-gray-200">
          <Eye size={16} />
        </button>
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
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Transaction Type Distribution */}
              <div className={`p-6 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <h3 className="text-lg font-semibold mb-4">Transaction Distribution</h3>
                <div className="space-y-3">
                  {['sale', 'purchase', 'quote', 'order'].map(type => {
                    const count = filteredTransactions.filter(t => t.transactionType === type).length;
                    const percentage = analytics.totalTransactions > 0 ? (count / analytics.totalTransactions) * 100 : 0;
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize">{type}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2 relative">
                            <div 
                              className={`h-2 rounded-full absolute left-0 top-0 progress-bar ${
                                type === 'sale' ? 'bg-blue-500' : 'bg-green-500'
                              }`}
                              data-percentage={percentage}
                            />
                          </div>
                          <span className="text-sm">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Distribution */}
              <div className={`p-6 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <h3 className="text-lg font-semibold mb-4">Status Distribution</h3>
                <div className="space-y-3">
                  {['pending', 'confirmed', 'delivered', 'paid', 'cancelled'].map(status => {
                    const count = filteredTransactions.filter(t => t.status === status).length;
                    const percentage = analytics.totalTransactions > 0 ? (count / analytics.totalTransactions) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2 relative">
                            <div 
                              className={`h-2 rounded-full absolute left-0 top-0 progress-bar ${
                                status === 'paid' || status === 'delivered' ? 'bg-green-500' :
                                status === 'pending' ? 'bg-yellow-500' :
                                status === 'cancelled' ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                              data-percentage={percentage}
                            />
                          </div>
                          <span className="text-sm">{count}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(analytics.avgTransactionValue)}</div>
                  <div className="text-sm opacity-75">Average Transaction Value</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{analytics.pendingTransactions}</div>
                  <div className="text-sm opacity-75">Pending Approvals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{analytics.overdueTransactions}</div>
                  <div className="text-sm opacity-75">Overdue Payments</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contracts View */}
        {selectedView === 'contracts' && (
          <div className={`p-6 rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
          }`}>
            <h3 className="text-lg font-semibold mb-4">Active B2B Contracts</h3>
            <div className="space-y-4">
              {filteredTransactions
                .filter(t => t.contractDetails)
                .map((transaction) => (
                  <div key={transaction.id} className={`p-4 rounded-lg border ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{transaction.businessName}</h4>
                        <p className="text-sm opacity-75">Contract ID: {transaction.contractDetails?.contractId}</p>
                      </div>
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Duration:</span>
                        <div>{new Date(transaction.contractDetails?.startDate || '').toLocaleDateString()} - {new Date(transaction.contractDetails?.endDate || '').toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="font-medium">Volume Commitment:</span>
                        <div>{transaction.contractDetails?.volumeCommitments} units</div>
                      </div>
                      <div>
                        <span className="font-medium">Renewal Terms:</span>
                        <div>{transaction.contractDetails?.renewalTerms}</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Pro Tip */}
      <div className={`mt-6 p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Use the B2B module to manage large-scale business relationships, 
          track contract performance, and analyze partnership profitability. Set up automated workflows for better efficiency.
        </p>
      </div>
    </div>
  );
};

export default B2B;
