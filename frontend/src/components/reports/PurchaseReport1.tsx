import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Filter,
  FileText,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  User,
  Grid3X3,
  ListFilter,
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

//base group

const baseGroups = [
  { id: -15, name: "Purchase Accounts", nature: "Expenses" },
  { id: -6, name: "Current Liabilities", nature: "Liabilities" },
  { id: -11, name: "Indirect Income", nature: "Income" },
];

const GROUP_NAMES: Record<number, string> = {
  [-16]: "Purchase Account",
  [-6]: "Current Liability",
  [-11]: "Indirect Income",
};

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

const PurchaseReport1: React.FC = () => {
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
    | "extract"
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

  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [salesVouchers, setSalesVouchers] = useState<any[]>([]);
  const [ledgerReportData, setLedgerReportData] = useState<any>(null);

  const [sortConfig, setSortConfig] = useState<{
    key: keyof SalesData;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });

  const filteredVouchers = useMemo(() => {
    let data = [...salesVouchers];

    // Filter by Selected Month
    if (selectedMonth) {
      data = data.filter((item) => {
        if (!item.date) return false;
        const d = new Date(item.date);
        const monthName = monthIndexToName[d.getMonth()];
        return monthName === selectedMonth;
      });
    }

    // Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key] ?? "";
        const bValue = b[sortConfig.key] ?? "";
        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return data;
  }, [salesVouchers, selectedMonth, sortConfig]);

  const detailedTotals = useMemo(() => {
    return filteredVouchers.reduce(
      (acc, row) => ({
        taxable: acc.taxable + (Number(row.taxableAmount) || 0),
        cgst: acc.cgst + (Number(row.cgstAmount) || 0),
        sgst: acc.sgst + (Number(row.sgstAmount) || 0),
        igst: acc.igst + (Number(row.igstAmount) || 0),
        net: acc.net + (Number(row.netAmount) || 0),
      }),
      { taxable: 0, cgst: 0, sgst: 0, igst: 0, net: 0 }
    );
  }, [filteredVouchers]);

  const groupedExtractData = useMemo(() => {
    const groups: Record<
      string,
      {
        debit: number;
        credit: number;
        ledgers: Record<string, { debit: number; credit: number }>;
      }
    > = {};

    filteredVouchers.forEach((voucher) => {
      const groupId = voucher.group_id;
      const groupName = GROUP_NAMES[groupId] || `Group ${groupId}`;
      const ledgerName = voucher.partyName || "Unknown Ledger";
      const amount = Number(voucher.netAmount) || 0;

      if (!groups[groupName]) {
        groups[groupName] = {
          debit: 0,
          credit: 0,
          ledgers: {},
        };
      }

      // Purchase voucher → Party credited
      groups[groupName].credit += amount;

      if (!groups[groupName].ledgers[ledgerName]) {
        groups[groupName].ledgers[ledgerName] = {
          debit: 0,
          credit: 0,
        };
      }

      groups[groupName].ledgers[ledgerName].credit += amount;
    });

    return groups;
  }, [filteredVouchers]);




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




  const monthDataMap = useMemo(() => {
    // 1️⃣ initialize all months with 0
    const map: Record<string, { debit: number; credit: number; closingBalance: number }> = {};
    MONTHS.forEach((m) => {
      map[m] = { debit: 0, credit: 0, closingBalance: 0 };
    });

    // 2️⃣ aggregate API sales data
    salesVouchers.forEach((row) => {
      if (!row.date || !row.total) return;

      const d = new Date(row.date);
      const monthName = monthIndexToName[d.getMonth()];
      const amount = Number(row.total) || 0;

      if (map[monthName]) {
        map[monthName].debit += amount;
      }
    });

    // 3️⃣ calculate cumulative closing balance
    let runningTotal = 0;
    MONTHS.forEach((m) => {
      runningTotal += map[m].debit - map[m].credit;
      map[m].closingBalance = runningTotal;
    });

    return map;
  }, [salesVouchers]);

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const url = `${import.meta.env.VITE_API_URL
      }/api/purchase-report?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

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

  useEffect(() => {
    if (selectedView === "extract" && !ledgerReportData && companyId && ownerType && ownerId) {
      const url = `${import.meta.env.VITE_API_URL
        }/api/purchase-report/ledger-report?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

      fetch(url)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setLedgerReportData(data.data);
          }
        })
        .catch((err) => {
          console.error("Ledger report fetch error:", err);
        });
    }
  }, [selectedView, companyId, ownerType, ownerId, ledgerReportData]);

  // calculate total sales
  const totalSales = useMemo(() => {
    return salesVouchers.reduce((sum, row) => {
      return sum + (Number(row.total) || 0);
    }, 0);
  }, [salesVouchers]);

  return (
    <div
      className={`min-h-screen pt-[56px] ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${theme === "dark"
          ? "border-gray-700 bg-gray-800"
          : "border-gray-200 bg-white"
          }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/app/reports")}
              className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
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
              className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              title="Filters"
            >
              <Filter size={18} />
            </button>
            <button
              className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              title="Export to Excel"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
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
              key: "extract",
              label: "Extract",
              icon: <ListFilter size={16} />,
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
              onClick={() => {
                setSelectedView(
                  view.key as
                  | "summary"
                  | "detailed"
                  | "extract"
                  | "itemwise"
                  | "partywise"
                  | "billwise"
                  | "billwiseprofit"
                );
                if (view.key !== "detailed" && view.key !== "extract") setSelectedMonth(null);
              }}
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${selectedView === view.key
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
          className={`p-4 border-b ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
          <div
            className={`rounded-lg overflow-hidden ${theme === "dark"
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
                const row = monthDataMap[month] || {
                  debit: 0,
                  credit: 0,
                  closingBalance: 0,
                };

                return (
                  <div
                    key={month}
                    onClick={() => {
                      setSelectedMonth(month);
                      setSelectedView("detailed");
                    }}
                    className="grid grid-cols-4 px-4 py-2 text-sm cursor-pointer hover:bg-gray-100"
                  >
                    <div className="font-medium">{month}</div>

                    {/* Debit */}
                    <div className="text-right font-mono">
                      {row.debit ? row.debit.toLocaleString("en-IN") : ""}
                    </div>

                    {/* Credit */}
                    <div className="text-right font-mono">
                      {row.credit ? row.credit.toLocaleString("en-IN") : ""}
                    </div>

                    {/* Closing */}
                    <div className="text-right font-mono">
                      {row.closingBalance
                        ? row.closingBalance.toLocaleString("en-IN")
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
                    {totalSales.toLocaleString("en-IN")}
                  </div>
                  <div className="text-right opacity-40">—</div>
                  <div className="text-right font-mono">
                    {totalSales.toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div
          className={`rounded-lg overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
        >
          <div className="overflow-x-auto">
            {selectedView === "detailed" && (
              <div className="p-2 flex justify-between items-center bg-blue-50 dark:bg-blue-900/20 mb-2 rounded">
                <div className="flex items-center space-x-2">
                  <span className="font-medium px-2">Showing transactions for:</span>
                  <select
                    value={selectedMonth || ""}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className={`cursor-pointer p-1 pr-8 rounded border outline-none ${theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                      }`}
                  >
                    <option value="" disabled>Select Month</option>
                    {MONTHS.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={() => setSelectedMonth(null)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 px-3 py-1 border border-blue-200 rounded hover:bg-blue-100 transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            )}

            {selectedView === "detailed" && (
              <table className="w-full">
                <thead className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                  <tr>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      Date{" "}
                      {sortConfig.key === "date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Particular
                    </th>

                    <th className="px-4 py-3 text-left font-medium">
                      Voucher Type
                    </th>

                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer"
                      onClick={() => handleSort("voucherNo")}
                    >
                      Voucher Number{" "}
                      {sortConfig.key === "voucherNo" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
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
                  {filteredVouchers.length > 0 ? (
                    filteredVouchers.map((voucher, index) => (
                      <tr
                        key={voucher.id || index}
                        className={`hover:bg-opacity-50 ${theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50"
                          }`}
                      >
                        {/* Date */}
                        <td className="px-4 py-3 text-sm">
                          {new Date(voucher.date).toLocaleDateString("en-IN")}
                        </td>

                        {/* Particular */}
                        <td className="px-4 py-3 text-sm font-medium">
                          {voucher.partyName}
                        </td>

                        {/* Voucher Type */}
                        <td className="px-4 py-3 text-sm">
                          Purchase
                        </td>

                        {/* Voucher Number */}
                        <td className="px-4 py-3 text-sm">
                          {voucher.voucherNo}
                        </td>

                        {/* Debit */}
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          -
                        </td>

                        {/* Credit */}
                        <td className="px-4 py-3 text-sm text-right font-mono">
                          {voucher.netAmount?.toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center opacity-50">
                        No transactions found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>

                {/* Footer Totals */}
                <tfoot className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                  <tr className="font-semibold">
                    <td colSpan={4} className="px-4 py-3">
                      Total
                    </td>

                    <td className="px-4 py-3 text-right font-mono">
                      {/* Debit Total Empty */}
                    </td>

                    <td className="px-4 py-3 text-right font-mono">
                      {filteredVouchers
                        .reduce((sum, v) => sum + (Number(v.netAmount) || 0), 0)
                        .toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}


            {/* Extract View */}
            {/* Extract View */}
{selectedView === "extract" && ledgerReportData && (
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
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

        {Object.entries(ledgerReportData).map(
          ([groupId, group]: [string, any]) => {

            const ledgerArray = group?.ledgers || [];
            const subGroups = group?.subGroups || {};

            const groupTotalDebit = ledgerArray.reduce(
              (sum: number, l: any) =>
                sum +
                (l.balance_type === "Dr"
                  ? Number(l.closing_balance) || 0
                  : 0),
              0
            );

            const groupTotalCredit = ledgerArray.reduce(
              (sum: number, l: any) =>
                sum +
                (l.balance_type === "Cr"
                  ? Number(l.closing_balance) || 0
                  : 0),
              0
            );

            return (
              <React.Fragment key={groupId}>
                {/* 🔹 Group Header */}
                <tr className={`${theme === "dark" ? "bg-gray-800" : "bg-gray-50"} font-bold`}>
                  <td className="px-4 py-3 text-left text-blue-600">
                    {group.name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {groupTotalDebit > 0
                      ? groupTotalDebit.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {groupTotalCredit > 0
                      ? groupTotalCredit.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })
                      : "-"}
                  </td>
                </tr>

                {/* 🔹 Ledgers Under Group */}
                {ledgerArray.map((ledger: any) => (
                  <tr
                    key={ledger.id}
                    className={`hover:bg-opacity-50 ${
                      theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <td className="px-4 py-2 pl-8 text-sm italic">
                      {ledger.name}
                    </td>

                    <td className="px-4 py-2 text-right text-sm font-mono">
                      {ledger.balance_type === "Dr"
                        ? Number(ledger.closing_balance).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )
                        : ""}
                    </td>

                    <td className="px-4 py-2 text-right text-sm font-mono">
                      {ledger.balance_type === "Cr"
                        ? Number(ledger.closing_balance).toLocaleString(
                            "en-IN",
                            { minimumFractionDigits: 2 }
                          )
                        : ""}
                    </td>
                  </tr>
                ))}

                {/* 🔹 SubGroups (Duties & Taxes etc.) */}
                {Object.entries(subGroups).map(
                  ([subName, subLedgers]: [string, any]) => {

                    const subArray = subLedgers || [];

                    const subDebit = subArray.reduce(
                      (sum: number, l: any) =>
                        sum +
                        (l.balance_type === "Dr"
                          ? Number(l.closing_balance) || 0
                          : 0),
                      0
                    );

                    const subCredit = subArray.reduce(
                      (sum: number, l: any) =>
                        sum +
                        (l.balance_type === "Cr"
                          ? Number(l.closing_balance) || 0
                          : 0),
                      0
                    );

                    return (
                      <React.Fragment key={subName}>
                        {/* SubGroup Header */}
                        <tr className="font-semibold bg-yellow-50">
                          <td className="px-4 py-2 pl-12">
                            {subName}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {subDebit > 0
                              ? subDebit.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })
                              : "-"}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">
                            {subCredit > 0
                              ? subCredit.toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })
                              : "-"}
                          </td>
                        </tr>

                        {/* SubGroup Ledgers */}
                        {subArray.map((ledger: any) => (
                          <tr key={ledger.id}>
                            <td className="px-4 py-2 pl-16 text-sm">
                              {ledger.name}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-sm">
                              {ledger.balance_type === "Dr"
                                ? Number(
                                    ledger.closing_balance
                                  ).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })
                                : ""}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-sm">
                              {ledger.balance_type === "Cr"
                                ? Number(
                                    ledger.closing_balance
                                  ).toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                  })
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  }
                )}
              </React.Fragment>
            );
          }
        )}

        {/* No Data */}
        {Object.keys(ledgerReportData).length === 0 && (
          <tr>
            <td colSpan={3} className="px-4 py-8 text-center opacity-50">
              No transactions found.
            </td>
          </tr>
        )}
      </tbody>

      {/* 🔹 Grand Total */}
      <tfoot className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
        <tr className="font-semibold">
          <td className="px-4 py-3">Grand Total</td>

          <td className="px-4 py-3 text-right font-mono">
            {Object.values(ledgerReportData)
              .flatMap((group: any) => [
                ...(group.ledgers || []),
                ...Object.values(group.subGroups || {}).flat(),
              ])
              .reduce(
                (sum: number, l: any) =>
                  sum +
                  (l.balance_type === "Dr"
                    ? Number(l.closing_balance) || 0
                    : 0),
                0
              )
              .toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
          </td>

          <td className="px-4 py-3 text-right font-mono">
            {Object.values(ledgerReportData)
              .flatMap((group: any) => [
                ...(group.ledgers || []),
                ...Object.values(group.subGroups || {}).flat(),
              ])
              .reduce(
                (sum: number, l: any) =>
                  sum +
                  (l.balance_type === "Cr"
                    ? Number(l.closing_balance) || 0
                    : 0),
                0
              )
              .toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
)}


            {selectedView === "partywise" && (
              <table className="w-full">
                <thead
                  className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
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
                  className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
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
                  className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-blue-50"
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
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-white shadow"
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
                        className={`p-3 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-blue-100"
                          }`}
                      >
                        <FileText size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-white shadow"
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
                        className={`p-3 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-green-100"
                          }`}
                      >
                        <TrendingUp size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-white shadow"
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
                        className={`p-3 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-green-100"
                          }`}
                      >
                        <DollarSign size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-white shadow"
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
                        className={`p-3 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-red-100"
                          }`}
                      >
                        <FileText size={24} className="text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <table className="w-full">
                  <thead
                    className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
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
                  className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-blue-50"
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
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-white shadow"
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
                        className={`p-3 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-blue-100"
                          }`}
                      >
                        <DollarSign size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-white shadow"
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
                        className={`p-3 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-red-100"
                          }`}
                      >
                        <Package size={24} className="text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-white shadow"
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
                        className={`p-3 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-green-100"
                          }`}
                      >
                        <TrendingUp size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-white shadow"
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
                        className={`p-3 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-green-100"
                          }`}
                      >
                        <BarChart3 size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <table className="w-full">
                  <thead
                    className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
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
          className={`mt-4 p-3 rounded ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"
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

export default PurchaseReport1;
