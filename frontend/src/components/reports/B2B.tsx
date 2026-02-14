import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Filter, Building2, ListFilter } from "lucide-react";
import * as XLSX from "xlsx";
import "./reports.css";
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

type ViewType =
  | "summary"
  | "detailed"
  | "columnar"
  | "extract"
  | "partners"
  | "analytics"
  | "contracts";

const B2B: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement | null>(null);

  const [transactions, setTransactions] = useState<B2BTransactionLine[]>([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  // Example filters — can be moved to state and UI controlled
  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<ViewType>("summary");
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "this-month",
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    businessFilter: "",
    transactionType: "",
    statusFilter: "",
    businessTypeFilter: "",
    priorityFilter: "",
    amountRangeMin: "",
    amountRangeMax: "",
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      // Safety filter: Ensure GST number exists (backend already filters, but double-check)
      const hasGstNumber =
        transaction.businessGSTIN &&
        String(transaction.businessGSTIN).trim() !== "";

      const transactionDate = new Date(transaction.date);
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);
      const dateInRange =
        transactionDate >= fromDate && transactionDate <= toDate;
      const businessMatch =
        !filters.businessFilter ||
        transaction.businessName
          .toLowerCase()
          .includes(filters.businessFilter.toLowerCase());
      const typeMatch =
        !filters.transactionType ||
        transaction.transactionType === filters.transactionType;
      const statusMatch =
        !filters.statusFilter || transaction.status === filters.statusFilter;
      const businessTypeMatch =
        !filters.businessTypeFilter ||
        transaction.businessType === filters.businessTypeFilter;
      // Implement amountRange filter if needed (parsing)
      if (
        filters.amountRangeMin &&
        transaction.netAmount < parseFloat(filters.amountRangeMin)
      )
        return false;
      if (
        filters.amountRangeMax &&
        transaction.netAmount > parseFloat(filters.amountRangeMax)
      )
        return false;

      return (
        hasGstNumber &&
        dateInRange &&
        businessMatch &&
        typeMatch &&
        statusMatch &&
        businessTypeMatch
      );
    });
  }, [transactions, filters]);

  // Update progress bar widths after render
  useEffect(() => {
    const progressBars = document.querySelectorAll(
      ".progress-bar[data-percentage]"
    );
    progressBars.forEach((bar) => {
      const percentage = bar.getAttribute("data-percentage");
      if (percentage && bar instanceof HTMLElement) {
        bar.style.width = `${percentage}%`;
      }
    });
  });

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let fromDate = new Date();
    let toDate = new Date();

    switch (range) {
      case "today":
        fromDate = toDate = today;
        break;
      case "this-week":
        fromDate = new Date(
          today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
        );
        break;
      case "this-month":
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "this-quarter": {
        const quarterStart = Math.floor(today.getMonth() / 3) * 3;
        fromDate = new Date(today.getFullYear(), quarterStart, 1);
        break;
      }
      case "this-year":
        fromDate = new Date(today.getFullYear(), 0, 1);
        break;
    }

    setFilters((prev) => ({
      ...prev,
      dateRange: range,
      fromDate: fromDate.toISOString().split("T")[0],
      toDate: toDate.toISOString().split("T")[0],
    }));
  };

  const handleExport = () => {
    const exportData = filteredTransactions.map((transaction) => ({
      "Transaction ID": transaction.id,
      Type: transaction.transactionType,
      "Business Name": transaction.businessName,
      GSTIN: transaction.businessGSTIN,
      "Contact Person": transaction.contactPerson,
      Date: transaction.date,
      "Total Amount": transaction.totalAmount,
      "Tax Amount": transaction.taxAmount,
      "Net Amount": transaction.netAmount,
      Status: transaction.status,
      Priority: transaction.priority,
      Outstanding: transaction.outstanding,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "B2B Transactions");
    XLSX.writeFile(
      wb,
      `B2B_Report_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  //disabled block
  const isTabDisabled = (view: ViewType) => {
    return view !== "columnar" && view !== "extract" && view !== "summary" && view !== "detailed";
  };

  const [saleData, setSaleData] = useState<any[]>([]);
  const [partyIds, setPartyIds] = useState<number[]>([]);

  const [ledger, setLedger] = useState<any[]>([]);
  const [matchedLedgers, setMatchedLedgers] = useState<any[]>([]);

  const [matchedSales, setMatchedSales] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const loadSalesVouchers = async () => {
      try {
        // Use sales-report endpoint to get items and ledger details
        const url = `${import.meta.env.VITE_API_URL
          }/api/sales-report?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

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
        console.error("Failed to fetch sales report data:", err);
        setSaleData([]);
        setPartyIds([]);
      }
    };

    loadSalesVouchers();
  }, [companyId, ownerType, ownerId]);

  // ledger get

  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const ledgerRes = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const ledgerData = await ledgerRes.json();
        setLedger(ledgerData || []);
      } catch (err) {
        console.error("Ledger fetch failed:", err);
        setLedger([]);
      }
    };

    fetchLedger();
  }, [companyId, ownerType, ownerId]);

  useEffect(() => {
    if (!partyIds.length || !ledger.length || !saleData.length) return;

    // 🔹 partyIds → Set (fast lookup)
    const partyIdSet = new Set(partyIds);

    const filteredLedgers = ledger.filter((l: any) => {
      return (
        partyIdSet.has(l.id) &&
        l.gstNumber &&
        String(l.gstNumber).trim() !== "" &&
        // Basic check to ensure valid format (simple length check or alphanumeric)
        String(l.gstNumber).length >= 15
      );
    });

    setMatchedLedgers(filteredLedgers);

    // 🔹 matched ledger ids ka Set
    const matchedLedgerIdSet = new Set(filteredLedgers.map((l: any) => l.id));

    const filteredSales = saleData.filter((s: any) =>
      matchedLedgerIdSet.has(s.partyId)
    );

    setMatchedSales(filteredSales);

  }, [partyIds, ledger, saleData]);

  // 🔹 Fetch sales history for QTY and Rate
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchSalesHistory = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
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

    fetchSalesHistory();
  }, [companyId, ownerType, ownerId]);

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

  // 🔹 MONTHLY DATA LOGIC
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

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const filteredDetailedData = useMemo(() => {
    let data = [...matchedSales];

    if (selectedMonth) {
      data = data.filter((item) => {
        if (!item.date) return false;
        const d = new Date(item.date);
        const monthName = monthIndexToName[d.getMonth()];
        return monthName === selectedMonth;
      });
    }

    return data;
  }, [matchedSales, selectedMonth]);

  const summaryData = useMemo(() => {
    const map: Record<string, { debit: number; closingBalance: number }> = {};
    MONTHS.forEach((m) => {
      map[m] = { debit: 0, closingBalance: 0 };
    });

    matchedSales.forEach((row) => {
      if (!row.date || !row.total) return;

      const d = new Date(row.date);
      const monthName = monthIndexToName[d.getMonth()];
      const amount = Number(row.total) || 0;

      if (map[monthName]) {
        map[monthName].debit += amount;
      }
    });

    let runningTotal = 0;
    MONTHS.forEach((m) => {
      runningTotal += map[m].debit;
      map[m].closingBalance = runningTotal;
    });

    return map;
  }, [matchedSales]);

  const totalSalesValue = useMemo(() => {
    return matchedSales.reduce((sum, row) => sum + (Number(row.total) || 0), 0);
  }, [matchedSales]);

  // 🔹 EXTRACT LOGIC (Group by Ledger Groups like 'Sales Accounts', 'Duties & Taxes')
  const extractData = useMemo(() => {
    const groups: Record<
      string,
      {
        totalDebit: number;
        totalCredit: number;
        transactions: {
          name: string;
          debit: number;
          credit: number;
        }[];
      }
    > = {};

    matchedSales.forEach((voucher: any) => {
      // 1️⃣ PARTY SIDE (Debit / Asset - Sundry Debtors)
      // Check if groupName exists, otherwise default to Sundry Debtors. 
      // Note: B2B might not have groupName populated on voucher, so default is important.
      const groupName = voucher.groupName || "Sundry Debtors";
      const partyAmount = Number(voucher.netAmount || voucher.total || 0);

      if (!groups[groupName]) {
        groups[groupName] = {
          totalDebit: 0,
          totalCredit: 0,
          transactions: [],
        };
      }

      groups[groupName].totalDebit += partyAmount;
      groups[groupName].transactions.push({
        name: voucher.partyName || "Unknown Party",
        debit: partyAmount,
        credit: 0,
      });

      // 2️⃣ SALES SIDE (Credit / Income) via Items
      if (voucher.items && voucher.items.length > 0) {
        voucher.items.forEach((item: any) => {
          const itemGroupName = "Sales Account";

          if (!groups[itemGroupName]) {
            groups[itemGroupName] = {
              totalDebit: 0,
              totalCredit: 0,
              transactions: [],
            };
          }

          const itemAmount = Number(item.amount || 0);

          groups[itemGroupName].totalCredit += itemAmount;
          groups[itemGroupName].transactions.push({
            name: item.salesLedgerName || "Unknown Sales Ledger",
            debit: 0,
            credit: itemAmount,
          });
        });
      }

      // 3️⃣ DUTIES & TAXES (Credit / Liability - Output Tax)
      const taxGroupName = "Duties & Taxes";

      // Extract Unique Tax Ledger Names from Items
      const cgstLedgers = new Set<string>();
      const sgstLedgers = new Set<string>();
      const igstLedgers = new Set<string>();

      if (voucher.items) {
        voucher.items.forEach((i: any) => {
          if (i.cgstLedgerName) cgstLedgers.add(i.cgstLedgerName);
          if (i.sgstLedgerName) sgstLedgers.add(i.sgstLedgerName);
          if (i.igstLedgerName) igstLedgers.add(i.igstLedgerName);
        });
      }

      // In B2B, voucher has cgstTotal etc. mapped from cgstAmount. 
      // Use the mapped fields if consistent, or check item sums? 
      // SalesReport checks voucher.cgstAmount. 
      // In B2B loadSalesVouchers: cgstTotal: v.cgstAmount || v.cgstTotal
      // So use voucher.cgstTotal
      const cgst = Number(voucher.cgstTotal || 0);
      const sgst = Number(voucher.sgstTotal || 0);
      const igst = Number(voucher.igstTotal || 0);

      if (cgst > 0 || sgst > 0 || igst > 0) {
        if (!groups[taxGroupName]) {
          groups[taxGroupName] = {
            totalDebit: 0,
            totalCredit: 0,
            transactions: [],
          };
        }

        if (cgst > 0) {
          groups[taxGroupName].totalCredit += cgst;
          groups[taxGroupName].transactions.push({
            name: Array.from(cgstLedgers).join(", ") || "Output CGST",
            debit: 0,
            credit: cgst,
          });
        }
        if (sgst > 0) {
          groups[taxGroupName].totalCredit += sgst;
          groups[taxGroupName].transactions.push({
            name: Array.from(sgstLedgers).join(", ") || "Output SGST",
            debit: 0,
            credit: sgst,
          });
        }
        if (igst > 0) {
          groups[taxGroupName].totalCredit += igst;
          groups[taxGroupName].transactions.push({
            name: Array.from(igstLedgers).join(", ") || "Output IGST",
            debit: 0,
            credit: igst,
          });
        }
      }
    });

    return groups;
  }, [matchedSales]);

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/app/reports")}
            title="Back to Reports"
            className={`p-2 rounded-lg mr-3 ${theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
              }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Building2 className="mr-2 text-blue-600" size={28} />
              B2B Sales Management
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Business-to-Business transactions and partnerships
            </p>
            <p className="text-xs text-blue-600 mt-1">
              📊{" "}
              <strong>
                Auto-populated from Ledgers with GSTIN/UIN numbers
              </strong>{" "}
              |
              <span className="ml-2">
                B2C transactions come from ledgers without GSTIN/UIN
              </span>
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            title="Toggle Filters"
            className={`p-2 rounded-lg ${showFilterPanel
              ? theme === "dark"
                ? "bg-blue-600"
                : "bg-blue-500 text-white"
              : theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-100 hover:bg-gray-200"
              }`}
          >
            <Filter size={16} />
          </button>
          <button
            onClick={handleExport}
            title="Export to Excel"
            className={`p-2 rounded-lg ${theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-gray-100 hover:bg-gray-200"
              }`}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div
          className={`p-4 rounded-lg mb-6 ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"
            }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                title="Select date range"
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
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
              <label className="block text-sm font-medium mb-1">
                Business Name
              </label>
              <input
                type="text"
                placeholder="Search business..."
                value={filters.businessFilter}
                onChange={(e) =>
                  handleFilterChange("businessFilter", e.target.value)
                }
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
                  } outline-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Transaction Type
              </label>
              <select
                value={filters.transactionType}
                onChange={(e) =>
                  handleFilterChange("transactionType", e.target.value)
                }
                title="Select transaction type"
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
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
                onChange={(e) =>
                  handleFilterChange("statusFilter", e.target.value)
                }
                title="Select status filter"
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-300 text-black"
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
        {(
          [
            "summary",
            "detailed",
            "extract",
            "columnar",
            "partners",
            "analytics",
            "contracts",
          ] as ViewType[]
        ).map((view) => {
          const disabled = isTabDisabled(view);

          return (
            <button
              key={view}
              disabled={disabled}
              onClick={() => {
                if (!disabled) {
                  setSelectedView(view);
                  if (view !== 'detailed') setSelectedMonth(null);
                }
              }}
              className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap
          ${selectedView === view
                  ? theme === "dark"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : theme === "dark"
                    ? "bg-gray-700"
                    : "bg-gray-200"
                }
          ${disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-400 hover:text-white"
                }
        `}
              title={disabled ? "Coming soon" : view}
            >
              {view}
            </button>
          );
        })}
      </div>

      <div ref={printRef}>

        {/* Summary View */}
        {selectedView === "summary" && (
          <div
            className={`rounded-lg overflow-hidden mb-6 ${theme === "dark"
              ? "bg-gray-800 text-white"
              : "bg-white text-black"
              }`}
          >
            {/* 🔹 TOP BORDER */}
            <div className="border-t border-b border-gray-400">
              {/* Header */}
              <div className="grid grid-cols-4 px-4 py-2 font-semibold border-b border-gray-400">
                <div>Particulars</div>
                <div className="text-right">Debit</div>
                <div className="text-right">Credit</div>
                <div className="text-right">Closing</div>
              </div>

              {/* Month Rows */}
              {MONTHS.map((month) => {
                const row = summaryData[month] || {
                  debit: 0,
                  closingBalance: 0,
                };

                return (
                  <div
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setSelectedView("detailed");
                    }}
                    className={`grid grid-cols-4 px-4 py-2 text-sm cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                  >
                    <div className="font-medium">{month}</div>

                    {/* Debit (Sales Value) */}
                    <div className="text-right font-mono">
                      {row.debit ? row.debit.toLocaleString("en-IN", { minimumFractionDigits: 2 }) : ""}
                    </div>

                    {/* Credit (Empty) */}
                    <div className="text-right opacity-40"></div>

                    {/* Closing */}
                    <div className="text-right font-mono">
                      {row.closingBalance
                        ? row.closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })
                        : ""}
                    </div>
                  </div>
                );
              })}

              {/* 🔹 BOTTOM BORDER + GRAND TOTAL */}
              <div className="border-t border-gray-400">
                <div className="grid grid-cols-4 px-4 py-3 font-bold">
                  <div>Grand Total</div>
                  <div className="text-right font-mono">
                    {totalSalesValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-right opacity-40">—</div>
                  <div className="text-right font-mono">
                    {totalSalesValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Detailed (Transactions) View */}
        {selectedView === 'detailed' && (
          <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
            }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Detailed Transactions {selectedMonth ? `(${selectedMonth})` : ''}</h3>
              {selectedMonth && (
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="text-sm text-blue-500 hover:text-blue-700 underline"
                >
                  Clear Filter
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                  <tr>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Voucher No</th>
                    <th className="text-left p-3">GST No</th>
                    <th className="text-left p-3">QTY</th>
                    <th className="text-left p-3">Rate</th>
                    <th className="text-left p-3">Amount</th>
                    <th className="text-left p-3">IGST</th>
                    <th className="text-left p-3">CGST</th>
                    <th className="text-left p-3">SGST</th>
                    <th className="text-left p-3">Total Amount</th>
                    <th className="text-left p-3">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDetailedData.map((sale: any, index: number) => {
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

                        {/* GST No */}
                        <td className="p-3">
                          {partyLedger?.gstNumber || "-"}
                        </td>

                        {/* QTY */}
                        <td className="p-3">{getQtyByVoucher(sale.number)}</td>

                        {/* Rate */}
                        <td className="p-3">{getRateByVoucher(sale.number)}</td>

                        {/* Amount (Taxable) */}
                        <td className="p-3">₹{Number(sale.subtotal || 0).toFixed(2)}</td>

                        {/* IGST */}
                        <td className="p-3">{sale.igstTotal || 0}</td>

                        {/* CGST */}
                        <td className="p-3">{sale.cgstTotal || 0}</td>

                        {/* SGST */}
                        <td className="p-3">{sale.sgstTotal || 0}</td>

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
        )}


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

        {/* Extract View */}
        {selectedView === "extract" && (
          <div
            className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
          >
            <h3 className="text-lg font-semibold mb-4">Account Head-wise Extract</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead
                  className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                >
                  <tr>
                    <th className="px-4 py-3 text-left font-medium w-1/2">
                      Particulars
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Debit
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Credit
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(extractData).map(
                    ([groupName, group]) => (
                      <React.Fragment key={groupName}>
                        {/* 🔹 Group Header */}
                        <tr
                          className={`${theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"
                            } font-bold`}
                        >
                          <td className="px-4 py-3 text-left text-blue-600">
                            {groupName}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {group.totalDebit > 0
                              ? group.totalDebit.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })
                              : "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {group.totalCredit > 0
                              ? group.totalCredit.toLocaleString("en-IN", {
                                minimumFractionDigits: 2,
                              })
                              : "-"}
                          </td>
                        </tr>

                        {/* 🔹 Transactions Under Group */}
                        {group.transactions.map((txn, index) => (
                          <tr
                            key={`${groupName}-${index}`}
                            className={`hover:bg-opacity-50 ${theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-50"
                              }`}
                          >
                            <td className="px-4 py-2 pl-8 text-sm italic">
                              {txn.name}
                            </td>

                            <td className="px-4 py-2 text-right text-sm font-mono">
                              {txn.debit > 0
                                ? txn.debit.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })
                                : "-"}
                            </td>

                            <td className="px-4 py-2 text-right text-sm font-mono">
                              {txn.credit > 0
                                ? txn.credit.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })
                                : "-"}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    )
                  )}

                  {/* No Data */}
                  {Object.keys(extractData).length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-4 py-8 text-center opacity-50"
                      >
                        No extraction data available.
                      </td>
                    </tr>
                  )}
                </tbody>
                {/* 🔹 Grand Total */}
                <tfoot
                  className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    }`}
                >
                  <tr className="font-semibold">
                    <td className="px-4 py-3">Grand Total</td>

                    <td className="px-4 py-3 text-right font-mono">
                      {Object.values(extractData)
                        .reduce((sum, group) => sum + group.totalDebit, 0)
                        .toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                    </td>

                    <td className="px-4 py-3 text-right font-mono">
                      {Object.values(extractData)
                        .reduce((sum, group) => sum + group.totalCredit, 0)
                        .toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}


        {/* Partners View */}
        {selectedView === "partners" && <></>}

        {/* Analytics View */}
        {selectedView === "analytics" && <></>}

        {/* Contracts View */}
        {selectedView === "contracts" && <></>}
      </div>

      {/* Pro Tip */}
      <div
        className={`mt-6 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
          }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Use the B2B module to
          manage large-scale business relationships, track contract performance,
          and analyze partnership profitability. Set up automated workflows for
          better efficiency.
        </p>
      </div>
    </div>
  );
};

export default B2B;
