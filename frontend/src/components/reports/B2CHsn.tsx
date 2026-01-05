import React, { useState, useMemo, useRef, useEffect, type Key, type ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Eye,
  User,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Star
} from 'lucide-react';
import * as XLSX from 'xlsx';
import './reports.css';
interface Customer {
  totalSpent: number;
  id: Key | null | undefined;
  name: ReactNode;
  totalOrders: ReactNode;
  status: string;
  customerId: number;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  registrationDate: string;
  lastActivity: string;
  customerSegment: string;
  loyaltyPoints: number;
}

interface FilterState {
  dateRange: string;
  fromDate: string;
  toDate: string;
  customerFilter: string;
  paymentMethod: string;
  orderStatus: string;
  customerSegment: string;
  source: string;
  amountRangeMin: string;
  amountRangeMax: string;
}
interface Order {
  source: string;
  totalAmount: any;
  discount: any;
  taxAmount: any;
  paymentStatus: any;
  loyaltyPointsEarned: any;
  id: Key | null | undefined;
  items: any[];
  loyaltyPointsUsed: number;
  paymentMethod: string;
  orderId: number;
  orderNumber: string;
  orderDate: string;
  customerName: string;
  netAmount: number;
  orderStatus: string;
  gstNumber?: string | null; // For filtering - should always be null/empty for B2C
}
const B2CHsn: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get auth parameters from localStorage
  // Try multiple keys as different parts of the app may use different keys
  const company_id = localStorage.getItem('company_id') || '';
  const owner_type = localStorage.getItem('userType') || localStorage.getItem('supplier') || localStorage.getItem('owner_type') || '';
  const owner_id = localStorage.getItem('employee_id') || localStorage.getItem('user_id') || '';

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<'dashboard' | 'customers' | 'orders' | 'analytics' | 'marketing'>('dashboard');
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'this-month',
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    customerFilter: '',
    paymentMethod: '',
    orderStatus: '',
    customerSegment: '',
    source: '',
    amountRangeMin: '',
    amountRangeMax: ''
  });
  useEffect(() => {
    // Validate required parameters before making API calls
    if (!company_id) {
      setError('Company ID is missing. Please log in again.');
      setLoading(false);
      return;
    }
    
    if (!owner_type) {
      setError('User type is missing. Please log in again.');
      setLoading(false);
      return;
    }
    
    if (!owner_id) {
      setError('Owner ID is missing. Please log in again.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/b2c-customers`, {
        params: {
          company_id,
          owner_type,
          owner_id,
        }
      })
      .then(res => {
        setCustomers(res.data as Customer[]);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching B2C customers:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch B2C customers');
        setLoading(false);
      });
  }, [company_id, owner_type, owner_id]);
  
  useEffect(() => {
    if (!company_id || !owner_type || !owner_id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    // Fetch B2C orders (sales without GST numbers)
    // Backend filters: WHERE (l.gst_number IS NULL OR l.gst_number = '')
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/b2c-orders`, {
        params: {
          company_id,
          owner_type,
          owner_id,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        }
      })
      .then(res => {
        console.log('B2C Orders API Response:', res.data);
        
        // Backend returns item-level rows, need to group by order
        const rawData = res.data as any[];
        
        if (!Array.isArray(rawData)) {
          console.error('Expected array but got:', typeof rawData);
          setOrders([]);
          setLoading(false);
          return;
        }
        
        if (rawData.length === 0) {
          console.log('No B2C orders found for the selected date range');
          setOrders([]);
          setLoading(false);
          return;
        }
        
        // Group items by orderId to create order objects with items arrays
        const orderMap = new Map<number, Order>();
        
        rawData.forEach((row: any) => {
          const orderId = row.orderId;
          
          if (!orderId) {
            console.warn('Row missing orderId:', row);
            return;
          }
          
          if (!orderMap.has(orderId)) {
            // Create new order object
            orderMap.set(orderId, {
              id: orderId,
              orderId: row.orderId,
              orderNumber: row.orderNumber || '',
              orderDate: row.orderDate || '',
              customerName: row.customerName || '',
              totalAmount: Number(row.totalAmount) || 0,
              discount: Number(row.discount) || 0,
              taxAmount: Number(row.taxAmount) || 0,
              netAmount: Number(row.netAmount) || 0,
              paymentMethod: row.paymentMethod || '',
              paymentStatus: row.paymentStatus || 'paid',
              orderStatus: 'delivered', // Default status
              source: row.source || '',
              loyaltyPointsEarned: Number(row.loyaltyPointsEarned) || 0,
              loyaltyPointsUsed: Number(row.loyaltyPointsUsed) || 0,
              items: [],
              gstNumber: row.gstNumber || null, // Should be null/empty for B2C
            });
          }
          
          // Add item to order
          const order = orderMap.get(orderId)!;
          if (row.itemId && row.itemName) {
            order.items.push({
              itemId: row.itemId,
              itemName: row.itemName,
              quantity: Number(row.quantity) || 0,
              unitPrice: Number(row.unitPrice) || 0,
              discount: Number(row.discount) || 0,
              amount: Number(row.amount) || 0,
              unit: row.unit || '',
              cgstRate: Number(row.cgstRate) || 0,
              sgstRate: Number(row.sgstRate) || 0,
              igstRate: Number(row.igstRate) || 0,
            });
          }
        });
        
        // Convert map to array - Backend already filters by GST number
        // Only filter out if GST number exists and is not empty (safety check)
        const ordersArray = Array.from(orderMap.values()).filter(order => {
          // Keep orders that have no GST number or empty GST number
          return !order.gstNumber || String(order.gstNumber).trim() === '';
        });
        
        console.log(`Processed ${ordersArray.length} B2C orders from ${rawData.length} item rows`);
        setOrders(ordersArray);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching B2C orders:', err);
        setError(err.response?.data?.error || err.message || 'Failed to fetch B2C orders');
        setOrders([]);
        setLoading(false);
      });
  }, [company_id, owner_type, owner_id, filters.fromDate, filters.toDate]);

  const filteredTransactions = useMemo(() => {
    return orders.filter(transaction => {
      // Safety filter: Ensure no GST numbers (backend already filters, but double-check)
      const noGstNumber = !transaction.gstNumber || String(transaction.gstNumber).trim() === '';
      
      const transactionDate = new Date(transaction.orderDate);
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      
      const dateInRange = transactionDate >= fromDate && transactionDate <= toDate;
      const customerMatch = !filters.customerFilter || 
        transaction.customerName.toLowerCase().includes(filters.customerFilter.toLowerCase());
      const paymentMatch = !filters.paymentMethod || transaction.paymentMethod === filters.paymentMethod;
      const statusMatch = !filters.orderStatus || transaction.orderStatus === filters.orderStatus;
      const sourceMatch = !filters.source || transaction.source === filters.source;
      
      return noGstNumber && dateInRange && customerMatch && paymentMatch && statusMatch && sourceMatch;
    });
  }, [orders, filters]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalOrders = filteredTransactions.length;
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.netAmount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'active').length;
    const customerLifetimeValue = totalCustomers > 0 ? 
      customers.reduce((sum, c) => sum + c.totalSpent, 0) / totalCustomers : 0;
    
    const orderStatusCounts = {
      placed: filteredTransactions.filter(t => t.orderStatus === 'placed').length,
      confirmed: filteredTransactions.filter(t => t.orderStatus === 'confirmed').length,
      shipped: filteredTransactions.filter(t => t.orderStatus === 'shipped').length,
      delivered: filteredTransactions.filter(t => t.orderStatus === 'delivered').length,
      cancelled: filteredTransactions.filter(t => t.orderStatus === 'cancelled').length,
      returned: filteredTransactions.filter(t => t.orderStatus === 'returned').length
    };

    const paymentMethodCounts = {
      card: filteredTransactions.filter(t => t.paymentMethod === 'card').length,
      upi: filteredTransactions.filter(t => t.paymentMethod === 'upi').length,
      netbanking: filteredTransactions.filter(t => t.paymentMethod === 'netbanking').length,
      wallet: filteredTransactions.filter(t => t.paymentMethod === 'wallet').length,
      cod: filteredTransactions.filter(t => t.paymentMethod === 'cod').length,
      emi: filteredTransactions.filter(t => t.paymentMethod === 'emi').length
    };

    const sourceCounts = {
      website: filteredTransactions.filter(t => t.source === 'website').length,
      mobile_app: filteredTransactions.filter(t => t.source === 'mobile_app').length,
      marketplace: filteredTransactions.filter(t => t.source === 'marketplace').length,
      social: filteredTransactions.filter(t => t.source === 'social').length,
      referral: filteredTransactions.filter(t => t.source === 'referral').length
    };

    return {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      totalCustomers,
      activeCustomers,
      customerLifetimeValue,
      orderStatusCounts,
      paymentMethodCounts,
      sourceCounts,
      topCustomers: customers.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5)
    };
  }, [filteredTransactions, customers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
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
      'Order Number': transaction.orderNumber,
      'Customer': transaction.customerName,
      'Order Date': transaction.orderDate,
      'Total Amount': transaction.totalAmount,
      'Discount': transaction.discount,
      'Tax Amount': transaction.taxAmount,
      'Net Amount': transaction.netAmount,
      'Payment Method': transaction.paymentMethod,
      'Payment Status': transaction.paymentStatus,
      'Order Status': transaction.orderStatus,
      'Source': transaction.source,
      'Loyalty Points Earned': transaction.loyaltyPointsEarned
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'B2C Orders');
    XLSX.writeFile(wb, `B2C_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getStatusColor = (status: string) => {
    if (!status || status.trim() === '') {
      return 'text-gray-800 bg-gray-100';
    }
    switch (status.toLowerCase()) {
      case 'delivered':
      case 'paid':
        return 'text-green-800 bg-green-100';
      case 'shipped':
      case 'confirmed':
        return 'text-blue-800 bg-blue-100';
      case 'placed':
      case 'pending':
        return 'text-yellow-800 bg-yellow-100';
      case 'cancelled':
      case 'returned':
      case 'failed':
        return 'text-red-800 bg-red-100';
      default:
        return 'text-gray-800 bg-gray-100';
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'vip':
        return 'text-purple-800 bg-purple-100';
      case 'premium':
        return 'text-blue-800 bg-blue-100';
      case 'regular':
        return 'text-green-800 bg-green-100';
      case 'new':
        return 'text-orange-800 bg-orange-100';
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
              <User className="mr-2 text-purple-600" size={28} />
              B2C HSN Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">Business-to-Consumer sales and customer management</p>
            <p className="text-xs text-purple-600 mt-1">
              📊 <strong>Showing sales transactions from customers WITHOUT GST numbers</strong> | 
              <span className="ml-2">B2B transactions (with GST numbers) are shown in the B2B module</span>
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title="Toggle Filters"
            className={`p-2 rounded-lg ${
              showFilterPanel
                ? (theme === 'dark' ? 'bg-purple-600' : 'bg-purple-500 text-white')
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

      {/* Error Message */}
      {error && (
        <div className={`mb-4 p-4 rounded-lg ${
          theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-800'
        }`}>
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className={`mb-4 p-4 rounded-lg text-center ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <p>Loading B2C orders...</p>
        </div>
      )}

      {/* No Data Message */}
      {!loading && !error && orders.length === 0 && (
        <div className={`mb-4 p-4 rounded-lg text-center ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <p>No B2C orders found for the selected date range.</p>
          <p className="text-sm mt-2 opacity-75">B2C orders are sales transactions from customers without GST numbers.</p>
        </div>
      )}

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
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="Search customer..."
                value={filters.customerFilter}
                onChange={(e) => handleFilterChange('customerFilter', e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                } outline-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Payment Method</label>
              <select
                value={filters.paymentMethod}
                onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                title="Select payment method"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                } outline-none`}
              >
                <option value="">All Methods</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
                <option value="wallet">Wallet</option>
                <option value="cod">Cash on Delivery</option>
                <option value="emi">EMI</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Order Status</label>
              <select
                value={filters.orderStatus}
                onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
                title="Select order status"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                } outline-none`}
              >
                <option value="">All Status</option>
                <option value="placed">Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="packed">Packed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="returned">Returned</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* View Selector */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {(['dashboard', 'customers', 'orders', 'analytics', 'marketing'] as const).map((view) => (
          <button
            key={view}
            onClick={() => setSelectedView(view)}
            className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${
              selectedView === view
                ? (theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
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
                    <p className="text-sm opacity-75">Total Orders</p>
                    <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                  </div>
                  <ShoppingBag className="text-purple-500" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-75">Revenue</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                  </div>
                  <DollarSign className="text-green-500" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-75">Avg Order Value</p>
                    <p className="text-2xl font-bold">{formatCurrency(analytics.avgOrderValue)}</p>
                  </div>
                  <TrendingUp className="text-blue-500" size={24} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-75">Active Customers</p>
                    <p className="text-2xl font-bold">{analytics.activeCustomers}</p>
                  </div>
                  <User className="text-orange-500" size={24} />
                </div>
              </div>
            </div>

            {/* Recent Orders */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <tr>
                      <th className="text-left p-3">Order</th>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.slice(0, 5).map((transaction, index) => (
                      <tr key={transaction.id || transaction.orderId || `order-${index}`} className={`border-b ${
                        theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{transaction.orderNumber}</div>
                            <div className="text-sm opacity-75">{transaction.items.length} items</div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{transaction.customerName}</div>
                            <div className="text-sm opacity-75">{transaction.source}</div>
                          </div>
                        </td>
                        <td className="p-3 font-medium">{formatCurrency(transaction.netAmount)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.orderStatus)}`}>
                            {transaction.orderStatus || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">{new Date(transaction.orderDate).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Customers */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Top Customers</h3>
              <div className="space-y-3">
                {analytics.topCustomers.map((customer, index) => (
                  <div key={customer.id || customer.customerId || `customer-${index}`} className={`flex items-center justify-between p-3 rounded ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'
                      }`}>
                        <span className="text-white font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm opacity-75">{customer.customerSegment} customer</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(customer.totalSpent)}</div>
                      <div className="text-sm opacity-75">{customer.totalOrders} orders</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Customers View */}
        {selectedView === 'customers' && (
          <div className={`rounded-lg overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
          }`}>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Customer Database</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Segment</th>
                    <th className="text-left p-3">Total Spent</th>
                    <th className="text-left p-3">Orders</th>
                    <th className="text-left p-3">Loyalty Points</th>
                    <th className="text-left p-3">Last Activity</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* {customers.map((customer, index) => (
                    <tr key={customer.id || customer.customerId || `customer-${index}`} className={`border-b ${
                      theme === 'dark' ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm opacity-75">{customer.email}</div>
                          <div className="text-xs opacity-60">{customer.phone}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getSegmentColor(customer.customerSegment)}`}>
                          {customer.customerSegment}
                        </span>
                      </td>
                      <td className="p-3 font-medium">{formatCurrency(customer.totalSpent)}</td>
                      <td className="p-3">{customer.totalOrders}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <Star className="text-yellow-500 mr-1" size={14} />
                          {customer.loyaltyPoints}
                        </div>
                      </td>
                      <td className="p-3">{new Date(customer.lastActivity).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <button
                          title="View Profile"
                          className={`p-1 rounded ${
                            theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))} */}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders View */}
        {selectedView === 'orders' && (
          <div className={`rounded-lg overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
          }`}>
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Order Management</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th className="text-left p-3">Order Number</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Items</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">Payment</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-center p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <tr key={transaction.id || transaction.orderId || `order-${index}`} className={`border-b ${
                      theme === 'dark' ? 'border-gray-700 hover:bg-gray-750' : 'border-gray-200 hover:bg-gray-50'
                    }`}>
                      <td className="p-3 font-medium">{transaction.orderNumber}</td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{transaction.customerName}</div>
                          <div className="text-sm opacity-75">{transaction.source}</div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{transaction.items.length} items</div>
                          <div className="text-sm opacity-75">
                            {transaction.items.slice(0, 2).map((item: { itemName: any; }) => item.itemName).join(', ')}
                            {transaction.items.length > 2 && '...'}
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-medium">{formatCurrency(transaction.netAmount)}</td>
                      <td className="p-3">
                        <div>
                          <div className="capitalize">{transaction.paymentMethod}</div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(transaction.paymentStatus)}`}>
                            {transaction.paymentStatus || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(transaction.orderStatus)}`}>
                          {transaction.orderStatus}
                        </span>
                      </td>
                      <td className="p-3">{new Date(transaction.orderDate).toLocaleDateString()}</td>
                      <td className="p-3 text-center">
                        <button
                          title="View Order"
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

        {/* Analytics View */}
        {selectedView === 'analytics' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Order Status Distribution */}
              <div className={`p-6 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <h3 className="text-lg font-semibold mb-4">Order Status Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.orderStatusCounts).map(([status, count]) => {
                    const percentage = analytics.totalOrders > 0 ? (count / analytics.totalOrders) * 100 : 0;
                    return (
                      <div key={status} className="flex items-center justify-between">
                        <span className="capitalize">{status}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2 relative">
                            <div 
                              className={`h-2 rounded-full absolute left-0 top-0 progress-bar ${
                                status === 'delivered' ? 'bg-green-500' :
                                status === 'shipped' ? 'bg-blue-500' :
                                status === 'cancelled' || status === 'returned' ? 'bg-red-500' : 'bg-yellow-500'
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

              {/* Payment Method Distribution */}
              <div className={`p-6 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <h3 className="text-lg font-semibold mb-4">Payment Method Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.paymentMethodCounts).map(([method, count]) => {
                    const percentage = analytics.totalOrders > 0 ? (count / analytics.totalOrders) * 100 : 0;
                    return (
                      <div key={method} className="flex items-center justify-between">
                        <span className="capitalize">{method.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2 relative">
                            <div 
                              className="bg-purple-500 h-2 rounded-full absolute left-0 top-0 progress-bar"
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

              {/* Traffic Source Distribution */}
              <div className={`p-6 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <h3 className="text-lg font-semibold mb-4">Traffic Source Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(analytics.sourceCounts).map(([source, count]) => {
                    const percentage = analytics.totalOrders > 0 ? (count / analytics.totalOrders) * 100 : 0;
                    return (
                      <div key={source} className="flex items-center justify-between">
                        <span className="capitalize">{source.replace('_', ' ')}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2 relative">
                            <div 
                              className="bg-orange-500 h-2 rounded-full absolute left-0 top-0 progress-bar"
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

              {/* Customer Metrics */}
              <div className={`p-6 rounded-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
              }`}>
                <h3 className="text-lg font-semibold mb-4">Customer Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Customer Lifetime Value</span>
                    <span className="font-medium">{formatCurrency(analytics.customerLifetimeValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Customers</span>
                    <span className="font-medium">{analytics.totalCustomers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Customers</span>
                    <span className="font-medium">{analytics.activeCustomers}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Marketing View */}
        {selectedView === 'marketing' && (
          <div className="space-y-6">
            {/* Campaign Performance - Removed hardcoded data */}
            {/* Campaign performance data should be fetched from backend if needed */}

            {/* Customer Segments */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Customer Segments</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {['new', 'regular', 'premium', 'vip'].map(segment => {
                  const count = customers.filter(c => c.customerSegment === segment).length;
                  const totalValue = customers
                    .filter(c => c.customerSegment === segment)
                    .reduce((sum, c) => sum + c.totalSpent, 0);
                  
                  return (
                    <div key={segment} className={`p-4 rounded border text-center ${
                      theme === 'dark' ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                    }`}>
                      <h4 className={`font-medium mb-2 capitalize ${getSegmentColor(segment)}`}>
                        {segment} Customers
                      </h4>
                      <div className="text-2xl font-bold">{count}</div>
                      <div className="text-sm opacity-75">{formatCurrency(totalValue)}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Loyalty Program */}
            <div className={`p-6 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
            }`}>
              <h3 className="text-lg font-semibold mb-4">Loyalty Program Performance</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {customers.reduce((sum, c) => sum + c.loyaltyPoints, 0)}
                  </div>
                  <div className="text-sm opacity-75">Total Points Issued</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredTransactions.reduce((sum, t) => sum + t.loyaltyPointsUsed, 0)}
                  </div>
                  <div className="text-sm opacity-75">Points Redeemed</div>
                </div>
                {/* Customer Satisfaction - Removed hardcoded data */}
                {/* Customer satisfaction data should be calculated from backend if available */}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pro Tip */}
      <div className={`mt-6 p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Use the B2C module to track customer behavior, 
          analyze purchase patterns, and create targeted marketing campaigns. Leverage loyalty programs to increase retention.
        </p>
      </div>
    </div>
  );
};

export default B2CHsn;
