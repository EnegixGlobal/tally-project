import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Ledger } from "../../types";

interface LedgerTransaction {
  id: string;
  date: string;
  particulars: string;
  voucherType: string;
  voucherNo: string;
  debit: number;
  credit: number;
  balance: number;
  narration?: string;
  reference?: string;
  isOpening?: boolean;
  isClosing?: boolean;
  isQuotation?: boolean;
}
interface LedgerApiResponse {
  success: boolean;
  ledger: any; // or your Ledger type if you have it
  transactions: LedgerTransaction[];
  summary: {
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    transactionCount: number;
  };
}

interface MonthlyBalance {
  month: string;
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
  transactionCount: number;
}

interface VoucherDetail {
  id: string;
  voucherNo: string;
  voucherType: string;
  date: string;
  amount: number;
  particulars: string;
  narration: string;
  reference?: string;
}

const LedgerReport: React.FC = () => {
  const { theme, ledgerGroups } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // const [selectedLedger, setSelectedLedger] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(true);
  const [viewMode, setViewMode] = useState<"detailed" | "summary" | "monthly">(
    "detailed"
  );
  const [selectedDateRange, setSelectedDateRange] = useState("current-year");
  const [fromDate, setFromDate] = useState("2024-04-01");
  const [toDate, setToDate] = useState("2025-08-31");
  const [showClosingBalances, setShowClosingBalances] = useState(true);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherDetail | null>(
    null
  );
  const [includeOpening] = useState(true);
  const [includeClosing] = useState(true);
  // To drive output
  const [, setLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<LedgerApiResponse | null>(null);
  const [, setError] = useState(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerId, setLedgerId] = useState(""); // default
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  // Initialize from URL params
  useEffect(() => {
    const ledgerId = searchParams.get("ledgerId");
    const view = searchParams.get("view") as "detailed" | "summary" | "monthly";
    if (ledgerId) {
      setLedgerId(ledgerId);
    }
    if (view) {
      setViewMode(view);
    }
  }, [searchParams]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    console.log(
      "Download report for:",
      ledgerId,
      "date range:",
      selectedDateRange
    );
  };

  const toggleMonth = (monthKey: string) => {
    const newExpanded = new Set(expandedMonths);
    if (newExpanded.has(monthKey)) {
      newExpanded.delete(monthKey);
    } else {
      newExpanded.add(monthKey);
    }
    setExpandedMonths(newExpanded);
  };

  const handleVoucherClick = (transaction: LedgerTransaction) => {
    if (transaction.isOpening || transaction.isClosing) return;

    const voucherDetail: VoucherDetail = {
      id: transaction.id,
      voucherNo: transaction.voucherNo,
      voucherType: transaction.voucherType,
      date: transaction.date,
      amount: Math.max(transaction.debit, transaction.credit),
      particulars: transaction.particulars,
      narration: transaction.narration || "",
      reference: transaction.reference,
    };
    setSelectedVoucher(voucherDetail);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    const today = new Date();
    const currentYear = today.getFullYear();

    switch (range) {
      case "current-month": {
        setFromDate(
          `${currentYear}-${String(today.getMonth() + 1).padStart(2, "0")}-01`
        );
        setToDate(today.toISOString().split("T")[0]);
        break;
      }
      case "previous-month": {
        const prevMonth = today.getMonth() === 0 ? 11 : today.getMonth() - 1;
        const prevYear = today.getMonth() === 0 ? currentYear - 1 : currentYear;
        setFromDate(`${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-01`);
        setToDate(
          `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${new Date(
            prevYear,
            prevMonth + 1,
            0
          ).getDate()}`
        );
        break;
      }
      case "current-quarter": {
        const quarterStart = new Date(
          currentYear,
          Math.floor(today.getMonth() / 3) * 3,
          1
        );
        setFromDate(quarterStart.toISOString().split("T")[0]);
        setToDate(today.toISOString().split("T")[0]);
        break;
      }
      case "current-year": {
        setFromDate(`${currentYear}-04-01`);
        setToDate(`${currentYear + 1}-03-31`);
        break;
      }
      default:
        break;
    }
  };

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        console.log("this is ledger", data);

        setLedgers(data);
      } catch (err) {
        console.error("Failed to load ledgers", err);
      }
    };

    fetchLedgers();
  }, []);
  // Fetch when ledger or date range changes
  const ledgerIdNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    ledgers.forEach((l) => {
      map[l.id] = l.name;
    });
    return map;
  }, [ledgers]);

  // URL param init - update ledgerId, NOT selectedLedger
  useEffect(() => {
    const ledgerIdParam = searchParams.get("ledgerId");
    const view = searchParams.get("view") as "detailed" | "summary" | "monthly";
    if (ledgerIdParam) setLedgerId(ledgerIdParam);
    if (view) setViewMode(view);
  }, [searchParams]);

  // Derive selectedLedgerData from ledgerId, NOT selectedLedger
  const selectedLedgerData = ledgers.find((l) => l.id === ledgerId);
  const selectedLedgerGroup = selectedLedgerData
    ? ledgerGroups.find((g) => g.id === selectedLedgerData.groupId)
    : null;

  // ledger transactions from API response remain the same
  const ledgerTransactions = ledgerData ? ledgerData.transactions : [];

  // filtring and show only one time
  const groupedByVoucher = useMemo(() => {
    const map: Record<string, LedgerTransaction[]> = {};

    ledgerTransactions.forEach((txn) => {
      const key = `${txn.date}_${txn.voucherNo}_${txn.voucherType}`;
      if (!map[key]) map[key] = [];
      map[key].push(txn);
    });

    return Object.values(map);
  }, [ledgerTransactions]);

  // Use effect to fetch data on ledgerId or filters change
  useEffect(() => {
    if (!ledgerId) return;

    setLoading(true);
    setError(null);

    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/ledger-report/report?ledgerId=${ledgerId}&fromDate=${fromDate}&toDate=${toDate}&includeOpening=${includeOpening}&includeClosing=${includeClosing}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLedgerData(data);
        } else {
          setError(data.message || "Error loading ledger data");
        }
      })
      .catch((err) => setError(err.message || "Network error"))
      .finally(() => setLoading(false));
  }, [ledgerId, fromDate, toDate, includeOpening, includeClosing]);

  // Group transactions by month for monthly view
  const groupTransactionsByMonth = (transactions: LedgerTransaction[]) => {
    const grouped: { [key: string]: LedgerTransaction[] } = {};
    const monthlyBalances: { [key: string]: MonthlyBalance } = {};

    transactions.forEach((txn) => {
      if (txn.isOpening || txn.isClosing) return;

      const monthKey = txn.date.substring(0, 7); // YYYY-MM
      const monthName = new Date(txn.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      });

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
        monthlyBalances[monthKey] = {
          month: monthName,
          openingBalance: 0,
          totalDebit: 0,
          totalCredit: 0,
          closingBalance: 0,
          transactionCount: 0,
        };
      }

      grouped[monthKey].push(txn);
      monthlyBalances[monthKey].totalDebit += txn.debit;
      monthlyBalances[monthKey].totalCredit += txn.credit;
      monthlyBalances[monthKey].transactionCount++;
    });

    return { grouped, monthlyBalances };
  };

  const { grouped: monthlyGrouped, monthlyBalances } =
    groupTransactionsByMonth(ledgerTransactions);
  const summaryTotals = useMemo(
    () =>
      ledgerData
        ? ledgerData.summary
        : {
            openingBalance: 0,
            totalDebit: 0,
            totalCredit: 0,
            closingBalance: 0,
            transactionCount: 0,
          },
    [ledgerData]
  );

  return (
    <div className="pt-[56px] px-4 ">
      <div className="flex items-center mb-6">
        <button
          type="button"
          title="Back to Reports"
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Ledger Report</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Toggle Filters"
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            } ${showFilterPanel ? "bg-blue-100 dark:bg-blue-900" : ""}`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print Report"
            type="button"
            onClick={handlePrint}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            type="button"
            title="Download Report"
            onClick={handleDownload}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h3 className="font-semibold mb-4">Filters & Options</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Ledger
              </label>
              <select
                title="Select Ledger"
                value={ledgerId}
                onChange={(e) => setLedgerId(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="">Select Ledger</option>
                {ledgers.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              {/* <select className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
                 value={ledgerId} onChange={e => setLedgerId(e.target.value)}>
  {ledgers.map(l => <option value={l.id}>{l.name}</option>)}
</select> */}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                View Mode
              </label>
              <select
                title="Select View Mode"
                value={viewMode}
                onChange={(e) =>
                  setViewMode(
                    e.target.value as "detailed" | "summary" | "monthly"
                  )
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="detailed">Detailed View</option>
                <option value="summary">Summary View</option>
                <option value="monthly">Monthly View</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Range
              </label>
              <select
                title="Select Date Range"
                value={selectedDateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="current-month">Current Month</option>
                <option value="previous-month">Previous Month</option>
                <option value="current-quarter">Current Quarter</option>
                <option value="current-year">Current Financial Year</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showClosingBalances}
                  onChange={(e) => setShowClosingBalances(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Show Closing Balances</span>
              </label>
            </div>
          </div>

          {selectedDateRange === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  title="From Date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  title="To Date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!ledgerId ? (
        <div
          className={`p-8 text-center rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <Calendar size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Select a Ledger</h3>
          <p className="text-gray-500">
            Choose a ledger from the filter panel to view its report
          </p>
        </div>
      ) : (
        <>
          {/* Ledger Header */}
          <div
            className={`p-4 mb-4 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  {selectedLedgerData?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  Group: {selectedLedgerGroup?.name} | Period:{" "}
                  {formatDate(fromDate)} to {formatDate(toDate)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Opening Balance</div>
                <div
                  className={`text-lg font-bold ${
                    summaryTotals.openingBalance >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(Math.abs(summaryTotals.openingBalance))}
                  {summaryTotals.openingBalance >= 0 ? " Dr" : " Cr"}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="text-sm text-gray-500">Total Debit</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(summaryTotals.totalDebit)}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="text-sm text-gray-500">Total Credit</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(summaryTotals.totalCredit)}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="text-sm text-gray-500">Net Balance</div>
              <div
                className={`text-xl font-bold ${
                  summaryTotals.closingBalance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(Math.abs(summaryTotals.closingBalance))}
                {summaryTotals.closingBalance >= 0 ? " Dr" : " Cr"}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="text-sm text-gray-500">Transactions</div>
              <div className="text-xl font-bold text-gray-600">
                {summaryTotals.transactionCount}
              </div>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex space-x-1 mb-4">
            {["detailed", "summary", "monthly"].map((mode) => (
              <button
                key={mode}
                onClick={() =>
                  setViewMode(mode as "detailed" | "summary" | "monthly")
                }
                className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
                  viewMode === mode
                    ? theme === "dark"
                      ? "bg-gray-800 text-white"
                      : "bg-white text-blue-600 shadow"
                    : theme === "dark"
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)} View
              </button>
            ))}
          </div>

          {/* Transaction Table */}
          <div
            className={`rounded-lg overflow-hidden ${
              theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
          >
            {viewMode === "detailed" && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Particulars
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Voucher Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Voucher No
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className=" ">
                    {groupedByVoucher.map((voucherGroup) => {
                      const first = voucherGroup[0];
                      const voucherKey = `${first.date}_${first.voucherNo}_${first.voucherType}`;

                      return (
                        <React.Fragment key={voucherKey}>
                          {voucherGroup.map((txn, i) => (
                            <tr
                              key={txn.id}
                              className={`${
                                theme === "dark"
                                  ? "hover:bg-gray-700"
                                  : "hover:bg-gray-50"
                              }`}
                            >
                              {/* Date – only first row */}
                              <td className="px-4 py-3 text-sm">
                                {i === 0 ? formatDate(first.date) : ""}
                              </td>

                              {/* Particulars */}
                              <td className="px-4 py-3 text-sm">
                                {i === 0
                                  ? ledgerIdNameMap[first.particulars] ||
                                    first.particulars
                                  : ""}
                              </td>

                              {/* Voucher Type */}
                              <td className="px-4 py-3 text-sm">
                                {i === 0
                                  ? first.isQuotation
                                    ? "Quotation"
                                    : first.voucherType
                                  : ""}
                              </td>

                              {/* Voucher No */}
                              <td className="px-4 py-3 text-sm font-mono">
                                {i === 0 ? first.voucherNo : ""}
                              </td>

                              {/* Debit */}
                              <td className="px-4 py-3 text-sm text-right font-mono">
                                {txn.debit > 0 ? formatCurrency(txn.debit) : ""}
                              </td>

                              {/* Credit */}
                              <td className="px-4 py-3 text-sm text-right font-mono">
                                {txn.credit > 0
                                  ? formatCurrency(txn.credit)
                                  : ""}
                              </td>

                              {/* Balance */}
                              <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                                {/* {formatCurrency(Math.abs(txn.balance))}{" "}
                                {txn.balance >= 0 ? "Dr" : "Cr"} */}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === "summary" && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Account Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span>Opening Balance:</span>
                        <span
                          className={`font-medium ${
                            summaryTotals.openingBalance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            Math.abs(summaryTotals.openingBalance)
                          )}
                          {summaryTotals.openingBalance >= 0 ? " Dr" : " Cr"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span>Total Debits:</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(summaryTotals.totalDebit)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span>Total Credits:</span>
                        <span className="font-medium text-purple-600">
                          {formatCurrency(summaryTotals.totalCredit)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span>Net Effect:</span>
                        <span className="font-medium">
                          {formatCurrency(
                            Math.abs(
                              summaryTotals.totalDebit -
                                summaryTotals.totalCredit
                            )
                          )}
                          {summaryTotals.totalDebit >= summaryTotals.totalCredit
                            ? " Dr"
                            : " Cr"}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 font-bold text-lg">
                        <span>Closing Balance:</span>
                        <span
                          className={`${
                            summaryTotals.closingBalance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(
                            Math.abs(summaryTotals.closingBalance)
                          )}
                          {summaryTotals.closingBalance >= 0 ? " Dr" : " Cr"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4">
                      Transaction Analysis
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span>Total Transactions:</span>
                        <span className="font-medium">
                          {summaryTotals.transactionCount}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span>Period:</span>
                        <span className="font-medium">
                          {formatDate(fromDate)} to {formatDate(toDate)}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span>Ledger Group:</span>
                        <span className="font-medium">
                          {selectedLedgerGroup?.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span>Balance Type:</span>
                        <span className="font-medium capitalize">
                          {selectedLedgerData?.balanceType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {viewMode === "monthly" && (
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Monthly Breakdown
                </h3>
                {Object.entries(monthlyBalances).length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No transactions found for the selected period
                  </p>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(monthlyBalances).map(
                      ([monthKey, monthData]) => (
                        <div
                          key={monthKey}
                          className={`border rounded-lg ${
                            theme === "dark"
                              ? "border-gray-700"
                              : "border-gray-200"
                          }`}
                        >
                          <div
                            className={`p-4 cursor-pointer flex items-center justify-between ${
                              theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-50"
                            }`}
                            onClick={() => toggleMonth(monthKey)}
                          >
                            <div className="flex items-center">
                              {expandedMonths.has(monthKey) ? (
                                <ChevronDown size={16} className="mr-2" />
                              ) : (
                                <ChevronRight size={16} className="mr-2" />
                              )}
                              <span className="font-medium">
                                {monthData.month}
                              </span>
                              <span className="ml-2 text-sm text-gray-500">
                                ({monthData.transactionCount} transactions)
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                Net Effect
                              </div>
                              <div
                                className={`font-medium ${
                                  monthData.totalDebit -
                                    monthData.totalCredit >=
                                  0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {formatCurrency(
                                  Math.abs(
                                    monthData.totalDebit - monthData.totalCredit
                                  )
                                )}
                                {monthData.totalDebit - monthData.totalCredit >=
                                0
                                  ? " Dr"
                                  : " Cr"}
                              </div>
                            </div>
                          </div>

                          {expandedMonths.has(monthKey) && (
                            <div
                              className={`px-4 pb-4 ${
                                theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                              }`}
                            >
                              <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center">
                                  <div className="text-sm text-gray-500">
                                    Total Debit
                                  </div>
                                  <div className="text-blue-600 font-medium">
                                    {formatCurrency(monthData.totalDebit)}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-500">
                                    Total Credit
                                  </div>
                                  <div className="text-purple-600 font-medium">
                                    {formatCurrency(monthData.totalCredit)}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-sm text-gray-500">
                                    Transactions
                                  </div>
                                  <div className="font-medium">
                                    {monthData.transactionCount}
                                  </div>
                                </div>
                              </div>

                              <div className="max-h-60 overflow-y-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr
                                      className={`${
                                        theme === "dark"
                                          ? "bg-gray-700"
                                          : "bg-gray-100"
                                      }`}
                                    >
                                      <th className="px-3 py-2 text-left">
                                        Date
                                      </th>
                                      <th className="px-3 py-2 text-left">
                                        Particulars
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Debit
                                      </th>
                                      <th className="px-3 py-2 text-right">
                                        Credit
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {monthlyGrouped[monthKey]?.map((txn) => (
                                      <tr
                                        key={txn.id}
                                        className={`border-t ${
                                          theme === "dark"
                                            ? "border-gray-600 hover:bg-gray-700"
                                            : "border-gray-200 hover:bg-white"
                                        } cursor-pointer`}
                                        onClick={() => handleVoucherClick(txn)}
                                      >
                                        <td className="px-3 py-2">
                                          {formatDate(txn.date)}
                                        </td>
                                        <td className="px-3 py-2">
                                          {ledgerIdNameMap[txn.particulars] ||
                                            txn.particulars}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono">
                                          {txn.debit > 0
                                            ? formatCurrency(txn.debit)
                                            : "-"}
                                        </td>
                                        <td className="px-3 py-2 text-right font-mono">
                                          {txn.credit > 0
                                            ? formatCurrency(txn.credit)
                                            : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-2xl mx-4 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Voucher Details</h3>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className={`p-2 rounded-full ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                  }`}
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Voucher No
                  </label>
                  <div className="font-mono">{selectedVoucher.voucherNo}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Voucher Type
                  </label>
                  <div>{selectedVoucher.voucherType}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <div>{formatDate(selectedVoucher.date)}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Amount
                  </label>
                  <div className="font-medium">
                    {formatCurrency(selectedVoucher.amount)}
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Particulars
                </label>
                <div>{selectedVoucher.particulars}</div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Narration
                </label>
                <div className="text-gray-600 dark:text-gray-400">
                  {selectedVoucher.narration}
                </div>
              </div>

              {selectedVoucher.reference && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Reference
                  </label>
                  <div>{selectedVoucher.reference}</div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className={`px-4 py-2 rounded ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    // Navigate to voucher details page
                    // If it's a quotation, navigate to sales edit page
                    if (selectedVoucher.voucherType === "Quotation") {
                      navigate(`/app/vouchers/sales/edit/${selectedVoucher.id}`);
                    } else {
                      navigate(
                        `/app/vouchers/${selectedVoucher.voucherType.toLowerCase()}/${
                          selectedVoucher.id
                        }`
                      );
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  View Full Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Click on any
          transaction to view voucher details. Use F7 to quickly open ledger, F5
          to refresh.
        </p>
      </div>
    </div>
  );
};

export default LedgerReport;
