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
  Star,
  ListFilter
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

type ViewType = 'dashboard' | 'transactions' | 'columnar' | 'segments' | 'analytics';

const B2C: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  // For display (similar to B2CHsn)
  const [selectedView, setSelectedView] = useState<ViewType>('dashboard');
  const [saleData, setSaleData] = useState<any[]>([]);
  const [partyIds, setPartyIds] = useState<number[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [matchedSales, setMatchedSales] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  // Get auth parameters from localStorage
  // Try multiple keys as different parts of the app may use different keys
  const company_id = localStorage.getItem('company_id') || '';
  const owner_type = localStorage.getItem('userType') || localStorage.getItem('supplier') || localStorage.getItem('owner_type') || '';
  const owner_id = localStorage.getItem('employee_id') || localStorage.getItem('user_id') || '';

  const [showFilterPanel, setShowFilterPanel] = useState(false);
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

  // 🔹 Fetch sales vouchers for B2C (similar to B2CHsn)
  useEffect(() => {
    if (!company_id || !owner_type || !owner_id) return;

    const loadSalesVouchers = async () => {
      try {
        // Use sales-report endpoint to get items and ledger details
        const url = `${import.meta.env.VITE_API_URL
          }/api/sales-report?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`;

        const res = await fetch(url);
        const json = await res.json();

        let vouchers = [];
        if (Array.isArray(json)) {
          vouchers = json;
        } else if (Array.isArray(json?.data)) {
          vouchers = json.data;
        }

        // Map to expected structure and filter for items
        const mappedVouchers = vouchers.map((v: any) => ({
          ...v,
          id: v.id,
          partyId: v.ledgerId || v.partyId, // Ensure partyId is present
          number: v.voucherNo || v.number, // Map voucherNo from report to number
          subtotal: v.taxableAmount || v.subtotal,
          total: v.netAmount || v.total,
          cgstTotal: v.cgstAmount || v.cgstTotal,
          sgstTotal: v.sgstAmount || v.sgstTotal,
          igstTotal: v.igstAmount || v.igstTotal,
        }));

        const allPartyIds = mappedVouchers
          .map((v: any) => v.partyId)
          .filter((id: any) => id !== null && id !== undefined);

        setSaleData(mappedVouchers);
        setPartyIds(allPartyIds);
      } catch (err) {
        console.error("Failed to fetch sales vouchers:", err);
        setSaleData([]);
        setPartyIds([]);
      }
    };

    loadSalesVouchers();
  }, [company_id, owner_type, owner_id]);

  // 🔹 Fetch ledger data
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const ledgerRes = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
        );
        const ledgerData = await ledgerRes.json();
        setLedger(ledgerData || []);
      } catch (err) {
        console.error("Ledger fetch failed:", err);
        setLedger([]);
      }
    };

    if (company_id && owner_type && owner_id) {
      fetchLedger();
    }
  }, [company_id, owner_type, owner_id]);

  // 🔹 Match B2C sales (ledgers WITHOUT GST numbers)
  useEffect(() => {
    if (!partyIds.length || !ledger.length || !saleData.length) return;

    // 🔹 partyIds → Set (fast lookup)
    const partyIdSet = new Set(partyIds);

    // Filter ledgers to only those WITHOUT GST numbers (B2C)
    const filteredLedgers = ledger.filter((l: any) => {
      // Basic check: Party is used in fetched vouchers AND has no valid GST number
      return (
        partyIdSet.has(l.id) &&
        (!l.gstNumber || String(l.gstNumber).trim() === "" || String(l.gstNumber).length < 5)
      );
    });

    // Get matched ledger ids
    const matchedLedgerIdSet = new Set(filteredLedgers.map((l: any) => l.id));

    // Filter sales to only those with matched ledgers (B2C)
    const filteredSales = saleData.filter((s: any) =>
      matchedLedgerIdSet.has(s.partyId)
    );

    console.log("B2C filteredSales", filteredSales);
    setMatchedSales(filteredSales);
  }, [partyIds, ledger, saleData]);

  // 🔹 Ledger quick lookup (id → ledger)
  const ledgerMap = useMemo(() => {
    const map = new Map<number, any>();
    ledger.forEach((l: any) => {
      map.set(l.id, l);
    });
    return map;
  }, [ledger]);

  // 🔹 COLUMNAR DATA LOGIC
  const columnarData = useMemo(() => {
    if (!matchedSales.length) return { headers: [], rows: [] };

    const salesColumns = new Set<string>();
    const taxColumns = new Set<string>();

    // 1. Collect Columns
    matchedSales.forEach((voucher: any) => {
      if (voucher.items) {
        voucher.items.forEach((item: any) => {
          if (item.salesLedgerName) salesColumns.add(item.salesLedgerName);
          if (item.cgstLedgerName) taxColumns.add(item.cgstLedgerName);
          if (item.sgstLedgerName) taxColumns.add(item.sgstLedgerName);
          if (item.igstLedgerName) taxColumns.add(item.igstLedgerName);
        });
      }
    });

    const sortedSalesCols = Array.from(salesColumns).sort();
    const sortedTaxCols = Array.from(taxColumns).sort();
    const allDynamicCols = [...sortedSalesCols, ...sortedTaxCols];

    // 2. Prepare Rows
    const rows = matchedSales.map((voucher: any) => {
      const row: any = {
        id: voucher.id,
        date: voucher.date,
        partyName: voucher.partyName || ledgerMap.get(voucher.partyId)?.name,
        voucherNo: voucher.number,
        total: Number(voucher.total || 0),
        quantity: 0,
        rate: 0,
      };

      let totalQty = 0;
      let consistentRate = -1;
      let isMixedRate = false;

      if (voucher.items) {
        voucher.items.forEach((i: any) => {
          const qty = Number(i.quantity || 0);
          const rate = Number(i.rate || 0);
          totalQty += qty;

          if (consistentRate === -1) {
            consistentRate = rate;
          } else if (consistentRate !== rate) {
            isMixedRate = true;
          }

          // Sales Ledger Amount
          if (i.salesLedgerName) {
            row[i.salesLedgerName] =
              (row[i.salesLedgerName] || 0) + Number(i.amount || 0);
          }
        });

        // Taxes
        const vCgstLedgers = new Set<string>();
        const vSgstLedgers = new Set<string>();
        const vIgstLedgers = new Set<string>();

        voucher.items.forEach((item: any) => {
          if (item.cgstLedgerName) vCgstLedgers.add(item.cgstLedgerName);
          if (item.sgstLedgerName) vSgstLedgers.add(item.sgstLedgerName);
          if (item.igstLedgerName) vIgstLedgers.add(item.igstLedgerName);
        });

        if (vCgstLedgers.size > 0) {
          const first = Array.from(vCgstLedgers)[0];
          row[first] = (row[first] || 0) + Number(voucher.cgstTotal || 0);
        }
        if (vSgstLedgers.size > 0) {
          const first = Array.from(vSgstLedgers)[0];
          row[first] = (row[first] || 0) + Number(voucher.sgstTotal || 0);
        }
        if (vIgstLedgers.size > 0) {
          const first = Array.from(vIgstLedgers)[0];
          row[first] = (row[first] || 0) + Number(voucher.igstTotal || 0);
        }
      }

      row.quantity = totalQty;
      row.rate = isMixedRate ? 0 : consistentRate === -1 ? 0 : consistentRate;

      return row;
    });

    return { headers: allDynamicCols, rows };
  }, [matchedSales, ledgerMap]);

  // 🔹 Fetch sales history for HSN codes (for QTY and Rate)
  useEffect(() => {
    const fetchSalesHistory = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
        );
        const resJson = await res.json();
        const rows = Array.isArray(resJson?.data)
          ? resJson.data
          : Array.isArray(resJson)
            ? resJson
            : [];

        setSalesHistory(rows);
      } catch (err) {
        console.error("Sales history fetch failed", err);
        setSalesHistory([]);
      }
    };

    if (company_id && owner_type && owner_id) {
      fetchSalesHistory();
    }
  }, [company_id, owner_type, owner_id]);

  const salesHistoryMap = useMemo(() => {
    return new Map(salesHistory.map((h: any) => [h.voucherNumber, h]));
  }, [salesHistory]);

  const getQtyByVoucher = (voucherNo: string) => {
    const qty = salesHistoryMap.get(voucherNo)?.qtyChange;
    return qty ? Math.abs(qty) : "";
  };

  const getRateByVoucher = (voucherNo: string) => {
    return salesHistoryMap.get(voucherNo)?.rate || "";
  };

  const filteredTransactions = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [];
    }

    return orders.filter(transaction => {
      // Safety filter: Ensure no GST numbers (backend already filters, but double-check)
      const noGstNumber = !transaction.gstNumber || String(transaction.gstNumber).trim() === '';
      if (!noGstNumber) return false;

      // Date filter - data is already filtered by API, but verify for safety
      const transactionDate = new Date(transaction.orderDate);
      const fromDate = new Date(filters.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      const toDate = new Date(filters.toDate);
      toDate.setHours(23, 59, 59, 999);

      const dateInRange = transactionDate >= fromDate && transactionDate <= toDate;
      if (!dateInRange) return false;

      // Customer name filter (case-insensitive search)
      const customerMatch = !filters.customerFilter ||
        transaction.customerName?.toLowerCase().includes(filters.customerFilter.toLowerCase().trim());
      if (!customerMatch) return false;

      // Payment method filter
      const paymentMatch = !filters.paymentMethod ||
        transaction.paymentMethod?.toLowerCase() === filters.paymentMethod.toLowerCase();
      if (!paymentMatch) return false;

      // Order status filter (note: orderStatus is hardcoded as 'delivered' in current implementation)
      const statusMatch = !filters.orderStatus ||
        transaction.orderStatus?.toLowerCase() === filters.orderStatus.toLowerCase();
      if (!statusMatch) return false;

      // Source filter (note: source is hardcoded as '' in current implementation)
      const sourceMatch = !filters.source ||
        transaction.source?.toLowerCase() === filters.source.toLowerCase();
      if (!sourceMatch) return false;

      // Amount range filter
      const amountMatch = (!filters.amountRangeMin || transaction.netAmount >= Number(filters.amountRangeMin)) &&
        (!filters.amountRangeMax || transaction.netAmount <= Number(filters.amountRangeMax));
      if (!amountMatch) return false;

      return true;
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

  const handleClearFilters = () => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setFilters({
      dateRange: 'this-month',
      fromDate: firstDayOfMonth.toISOString().split('T')[0],
      toDate: today.toISOString().split('T')[0],
      customerFilter: '',
      paymentMethod: '',
      orderStatus: '',
      customerSegment: '',
      source: '',
      amountRangeMin: '',
      amountRangeMax: ''
    });
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

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app/reports')}
            title="Back to Reports"
            className={`p-2 rounded-lg mr-3 ${theme === 'dark'
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <User className="mr-2 text-purple-600" size={28} />
              B2C Sales Management
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
            className={`p-2 rounded-lg ${showFilterPanel
              ? (theme === 'dark' ? 'bg-purple-600' : 'bg-purple-500 text-white')
              : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
              }`}
          >
            <Filter size={16} />
          </button>
          <button
            onClick={handleExport}
            title="Export to Excel"
            className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mb-4 p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-50 text-red-800'
          }`}>
          <p className="font-semibold">Error:</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Loading Message */}
      {loading && (
        <div className={`mb-4 p-4 rounded-lg text-center ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
          <p>Loading B2C orders...</p>
        </div>
      )}

      {/* No Data Message */}
      {/* {!loading && !error && orders.length === 0 && (
        <div className={`mb-4 p-4 rounded-lg text-center ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <p>No B2C orders found for the selected date range.</p>
          <p className="text-sm mt-2 opacity-75">B2C orders are sales transactions from customers without GST numbers.</p>
        </div>
      )} */}

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={handleClearFilters}
              className={`px-3 py-1 text-sm rounded ${theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
            >
              Clear All
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                title="Select date range"
                className={`w-full p-2 rounded border ${theme === 'dark'
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

            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">From Date</label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                    className={`w-full p-2 rounded border ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-black'
                      } outline-none`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">To Date</label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                    className={`w-full p-2 rounded border ${theme === 'dark'
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-black'
                      } outline-none`}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <input
                type="text"
                placeholder="Search customer..."
                value={filters.customerFilter}
                onChange={(e) => handleFilterChange('customerFilter', e.target.value)}
                className={`w-full p-2 rounded border ${theme === 'dark'
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
                className={`w-full p-2 rounded border ${theme === 'dark'
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
                className={`w-full p-2 rounded border ${theme === 'dark'
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

            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                title="Select source"
                className={`w-full p-2 rounded border ${theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-black'
                  } outline-none`}
              >
                <option value="">All Sources</option>
                <option value="website">Website</option>
                <option value="mobile_app">Mobile App</option>
                <option value="marketplace">Marketplace</option>
                <option value="social">Social Media</option>
                <option value="referral">Referral</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Min Amount (₹)</label>
              <input
                type="number"
                placeholder="0"
                value={filters.amountRangeMin}
                onChange={(e) => handleFilterChange('amountRangeMin', e.target.value)}
                min="0"
                step="0.01"
                className={`w-full p-2 rounded border ${theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-black'
                  } outline-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Amount (₹)</label>
              <input
                type="number"
                placeholder="No limit"
                value={filters.amountRangeMax}
                onChange={(e) => handleFilterChange('amountRangeMax', e.target.value)}
                min="0"
                step="0.01"
                className={`w-full p-2 rounded border ${theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-black'
                  } outline-none`}
              />
            </div>
          </div>
          <div className="mt-4 text-sm opacity-75">
            Showing {filteredTransactions.length} of {orders.length} orders
          </div>
        </div>
      )}

      <div ref={printRef}>

        {/* View Selector */}
        <div className="flex space-x-2 mb-6 overflow-x-auto">
          {(['dashboard', 'columnar', 'transactions', 'segments', 'analytics'] as ViewType[]).map((view) => (
            <button
              key={view}
              onClick={() => setSelectedView(view)}
              className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${selectedView === view
                ? (theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white')
                : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300')
                }`}
            >
              {view}
            </button>
          ))}
        </div>

        {/* Columnar View */}
        {selectedView === "columnar" && (
          <div
            className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
          >
            <h3 className="text-lg font-semibold mb-4">Columnar Report</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                >
                  <tr>
                    <th className="px-2 py-3 text-left font-medium min-w-[100px]">
                      Date
                    </th>
                    <th className="px-2 py-3 text-left font-medium min-w-[200px]">
                      Particulars
                    </th>
                    <th className="px-2 py-3 text-left font-medium">Vch No.</th>
                    <th className="px-2 py-3 text-right font-medium">
                      Quantity
                    </th>
                    <th className="px-2 py-3 text-right font-medium">Rate</th>
                    <th className="px-2 py-3 text-right font-medium">Total</th>
                    {columnarData.headers.map((col) => (
                      <th
                        key={col}
                        className="px-2 py-3 text-right font-medium whitespace-nowrap"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {columnarData.rows.map((row, index) => (
                    <tr
                      key={row.id || index}
                      className={`hover:bg-opacity-50 ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                        }`}
                    >
                      <td className="px-2 py-2">
                        {new Date(row.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-2 py-2 font-medium">{row.partyName}</td>
                      <td className="px-2 py-2">{row.voucherNo}</td>
                      <td className="px-2 py-2 text-right">{row.quantity}</td>
                      <td className="px-2 py-2 text-right">
                        {row.rate > 0
                          ? row.rate.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })
                          : "-"}
                      </td>
                      <td className="px-2 py-2 text-right font-semibold">
                        {row.total?.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      {columnarData.headers.map((col) => (
                        <td key={col} className="px-2 py-2 text-right text-xs">
                          {row[col]
                            ? Number(row[col]).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })
                            : "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {columnarData.rows.length === 0 && (
                    <tr>
                      <td
                        colSpan={6 + columnarData.headers.length}
                        className="px-4 py-8 text-center opacity-50"
                      >
                        No transactions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dashboard View */}
        {selectedView === 'dashboard' && (
          <div>
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-75">Total Orders</p>
                      <p className="text-2xl font-bold">{analytics.totalOrders}</p>
                    </div>
                    <ShoppingBag className="text-purple-500" size={24} />
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-75">Revenue</p>
                      <p className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</p>
                    </div>
                    <DollarSign className="text-green-500" size={24} />
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm opacity-75">Avg Order Value</p>
                      <p className="text-2xl font-bold">{formatCurrency(analytics.avgOrderValue)}</p>
                    </div>
                    <TrendingUp className="text-blue-500" size={24} />
                  </div>
                </div>

                <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
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
              <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
                }`}>
                <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                      }`}>
                      <tr>
                        <th className="text-left p-3">Customer</th>
                        <th className="text-left p-3">Voucher No</th>
                        <th className="text-left p-3">QTY</th>
                        <th className="text-left p-3">Rate</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Tax Value</th>
                        <th className="text-left p-3">IGST</th>
                        <th className="text-left p-3">CGST</th>
                        <th className="text-left p-3">SGST</th>
                        <th className="text-left p-3">Total Amount</th>
                        <th className="text-left p-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matchedSales.slice(0, 5).map((sale, index) => {
                        const partyLedger = ledgerMap.get(sale.partyId);

                        return (
                          <tr key={sale.id || index} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                            {/* Customer */}
                            <td className="p-3">
                              <div className="font-medium">{partyLedger?.name || "Unknown Party"}</div>
                            </td>

                            {/* Voucher No */}
                            <td className="p-3 font-mono">{sale.number}</td>

                            {/* QTY */}
                            <td className="p-3">{getQtyByVoucher(sale.number)}</td>

                            {/* Rate */}
                            <td className="p-3">{getRateByVoucher(sale.number)}</td>

                            {/* Amount (Taxable) */}
                            <td className="p-3">₹{Number(sale.subtotal || 0).toFixed(2)}</td>

                            {/* Tax Value */}
                            <td className="p-3">
                              ₹{(
                                Number(sale.igstTotal || 0) +
                                Number(sale.cgstTotal || 0) +
                                Number(sale.sgstTotal || 0)
                              ).toFixed(2)}
                            </td>

                            {/* IGST */}
                            <td className="p-3">{sale.igstTotal || 0}%</td>

                            {/* CGST */}
                            <td className="p-3">{sale.cgstTotal || 0}%</td>

                            {/* SGST */}
                            <td className="p-3">{sale.sgstTotal || 0}%</td>

                            {/* Total Amount */}
                            <td className="p-3 font-semibold">₹{Number(sale.total || 0).toFixed(2)}</td>

                            {/* Date */}
                            <td className="p-3">{new Date(sale.date).toLocaleDateString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Top Customers */}
              {/* <div className={`p-6 rounded-lg ${
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
            </div> */}
            </div>
          </div>
        )}
      </div>

      {/* Pro Tip */}
      <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'
        }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Use the B2C module to track customer behavior,
          analyze purchase patterns, and create targeted marketing campaigns. Leverage loyalty programs to increase retention.
        </p>
      </div>
    </div>
  );
};

export default B2C;
