import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Filter, Building2 } from "lucide-react";
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
  | "dashboard"
  | "transactions"
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
  const [selectedView, setSelectedView] = useState<ViewType>("dashboard");
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
    return view !== "dashboard";
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
        const url = `${
          import.meta.env.VITE_API_URL
        }/api/sales-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

        const res = await fetch(url);
        const json = await res.json();

        const vouchers = json?.data || json || [];

        const allPartyIds = vouchers
          .map((v: any) => v.partyId)
          .filter((id: any) => id !== null && id !== undefined);

        setSaleData(vouchers);
        setPartyIds(allPartyIds);
      } catch (err) {
        console.error("Failed to fetch sales vouchers:", err);
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
          `${
            import.meta.env.VITE_API_URL
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
        partyIdSet.has(l.id) && l.gstNumber && String(l.gstNumber).trim() !== ""
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


  // 🔹 Ledger quick lookup (id → ledger)
  const ledgerMap = useMemo(() => {
    const map = new Map<number, any>();
    ledger.forEach((l: any) => {
      map.set(l.id, l);
    });
    return map;
  }, [ledger]);

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/app/reports")}
            title="Back to Reports"
            className={`p-2 rounded-lg mr-3 ${
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold flex items-center">
              <Building2 className="mr-2 text-blue-600" size={28} />
              B2B Management
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
            className={`p-2 rounded-lg ${
              showFilterPanel
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
            className={`p-2 rounded-lg ${
              theme === "dark"
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
          className={`p-4 rounded-lg mb-6 ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-50"
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
                className={`w-full p-2 rounded border ${
                  theme === "dark"
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
                className={`w-full p-2 rounded border ${
                  theme === "dark"
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
                className={`w-full p-2 rounded border ${
                  theme === "dark"
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
                className={`w-full p-2 rounded border ${
                  theme === "dark"
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
            "dashboard",
            "transactions",
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
                if (!disabled) setSelectedView(view);
              }}
              className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap
          ${
            selectedView === view
              ? theme === "dark"
                ? "bg-blue-600 text-white"
                : "bg-blue-500 text-white"
              : theme === "dark"
              ? "bg-gray-700"
              : "bg-gray-200"
          }
          ${
            disabled
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
        {/* Dashboard View */}
        {selectedView === "dashboard" && (
          <>
            <div
              className={`p-6 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <tr>
                      <th className="text-left p-3">Voucher No</th>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">GST No</th>

                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchedSales
                      .slice(0, 5)
                      .map((sale: any, index: number) => {
                        const partyLedger = ledgerMap.get(sale.partyId);

                        return (
                          <tr
                            key={sale.id || `order-${index}`}
                            className={`border-b ${
                              theme === "dark"
                                ? "border-gray-700"
                                : "border-gray-200"
                            }`}
                          >
                            {/* Voucher No */}
                            <td className="p-3">
                              <div className="font-medium">{sale.number}</div>
                            </td>

                            {/* Customer */}
                            <td className="p-3">
                              <div className="font-medium">
                                {partyLedger?.name || "Unknown Party"}
                              </div>
                            </td>

                            {/* GST No */}
                            <td className="p-3">
                              {partyLedger?.gstNumber || "-"}
                            </td>

                            {/* Amount */}
                            <td className="p-3 font-medium">
                              ₹{Number(sale.total || 0).toFixed(2)}
                            </td>

                            {/* Status */}
                            <td className="p-3">
                              <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                Completed
                              </span>
                            </td>

                            {/* Date */}
                            <td className="p-3">
                              {new Date(sale.date).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Transactions View */}
        {selectedView === "transactions" && <></>}

        {/* Partners View */}
        {selectedView === "partners" && <></>}

        {/* Analytics View */}
        {selectedView === "analytics" && <></>}

        {/* Contracts View */}
        {selectedView === "contracts" && <></>}
      </div>

      {/* Pro Tip */}
      <div
        className={`mt-6 p-4 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
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
