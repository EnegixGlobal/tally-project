import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Filter,
  Calendar,
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
  runningBalance?: number;
  narration?: string;
  reference?: string;
  isOpening?: boolean;
  isClosing?: boolean;
  isQuotation?: boolean;
}
interface LedgerApiResponse {
  success: boolean;
  ledger: Ledger;
  message?: string;
  transactions: LedgerTransaction[];
  summary: {
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    transactionCount: number;
  };
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
  const { id } = useParams();
  const [searchParams] = useSearchParams();

  // Financial Year Months (April → March)
  const financialMonths = [
    { key: "04", name: "April" },
    { key: "05", name: "May" },
    { key: "06", name: "June" },
    { key: "07", name: "July" },
    { key: "08", name: "August" },
    { key: "09", name: "September" },
    { key: "10", name: "October" },
    { key: "11", name: "November" },
    { key: "12", name: "December" },
    { key: "01", name: "January" },
    { key: "02", name: "February" },
    { key: "03", name: "March" },
  ];

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [viewMode, setViewMode] = useState<"detailed" | "monthly" | "daily">(
    "detailed"
  );
  // Calculate Default Date (Current Month)
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).toISOString().split("T")[0];
  const lastDayOfMonth = new Date(year, month + 1, 0).toISOString().split("T")[0];

  const [selectedDateRange, setSelectedDateRange] = useState(searchParams.get("fromDate") ? "custom" : "current-year");
  const [fromDate, setFromDate] = useState(searchParams.get("fromDate") || firstDayOfMonth);
  const [toDate, setToDate] = useState(searchParams.get("toDate") || lastDayOfMonth);
  const [showClosingBalances, setShowClosingBalances] = useState(true);
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherDetail | null>(
    null
  );
  const [includeOpening] = useState(true);
  const [includeClosing] = useState(true);
  // To drive output
  const [, setLoading] = useState<boolean>(false);
  const [ledgerData, setLedgerData] = useState<LedgerApiResponse | null>(null);
  const [, setError] = useState<string | null>(null);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerId, setLedgerId] = useState(id || ""); // default
  const [dailyBreakupMonth, setDailyBreakupMonth] = useState<string>(
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [dailyBreakupYear, setDailyBreakupYear] = useState<number>(
    new Date().getFullYear()
  );
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  // Initialize from URL params
  useEffect(() => {
    if (id) {
      setLedgerId(id);
    }
  }, [id]);

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

  const handleMonthClick = (monthKey: string) => {
    // Determine the year based on the current fromDate
    const currentFromDate = new Date(fromDate);
    const startYear = currentFromDate.getFullYear();
    const startMonth = currentFromDate.getMonth() + 1;

    let year = startYear;
    // If the selected month (e.g., Jan=1) is less than the start month (e.g., Apr=4),
    // it belongs to the next calendar year in the financial period.
    if (parseInt(monthKey) < startMonth) {
      year++;
    }

    const firstDay = `${year}-${monthKey.padStart(2, "0")}-01`;
    const lastDayDate = new Date(year, parseInt(monthKey), 0);
    const lastDay = `${year}-${monthKey.padStart(2, "0")}-${String(
      lastDayDate.getDate()
    ).padStart(2, "0")}`;

    setDailyBreakupMonth(monthKey);
    setDailyBreakupYear(year);
    setViewMode("daily");
  };

  const handleDayClick = (dateStr: string) => {
    setFromDate(dateStr);
    setToDate(dateStr);
    setSelectedDateRange("custom");
    setViewMode("detailed");
  };

  useEffect(() => {
    if (viewMode === "daily") {
      const firstDay = `${dailyBreakupYear}-${dailyBreakupMonth}-01`;
      const lastDayDate = new Date(dailyBreakupYear, parseInt(dailyBreakupMonth), 0);
      const lastDay = `${dailyBreakupYear}-${dailyBreakupMonth}-${String(
        lastDayDate.getDate()
      ).padStart(2, "0")}`;
      setFromDate(firstDay);
      setToDate(lastDay);
    }
  }, [dailyBreakupMonth, dailyBreakupYear, viewMode]);


  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data: Ledger[] = await res.json();

        setLedgers(data);
      } catch (err) {
        console.error("Failed to load ledgers", err);
      }
    };

    fetchLedgers();
  }, []);
  // Fetch when ledger or date range changes
  const ledgerIdNameMap = useMemo<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    ledgers.forEach((l) => {
      map[String(l.id)] = l.name;
    });
    return map;
  }, [ledgers]);



  // Derive selectedLedgerData from ledgerId, NOT selectedLedger
  const selectedLedgerData = ledgers.find(
    (l) => Number(l.id) === Number(ledgerId)
  );
  const selectedLedgerGroup = selectedLedgerData
    ? ledgerGroups.find((g) => g.id === selectedLedgerData.groupId)
    : null;

  const isDebitLedger = ledgerData?.ledger?.balance_type === "debit";

  // ledger transactions from API response remain the same
  const ledgerTransactions = useMemo(() => {
    if (!ledgerData) return [];

    let balance = ledgerData.summary.openingBalance || 0;
    const isDebitLedger = ledgerData.ledger?.balance_type === "debit";

    return ledgerData.transactions.map((txn) => {
      // Logic:
      // If Debit Ledger: (Balance + Debit) - Credit
      // If Credit Ledger: (Balance + Credit) - Debit
      if (isDebitLedger) {
        balance += (txn.debit - txn.credit);
      } else {
        balance += (txn.credit - txn.debit);
      }

      return {
        ...txn,
        runningBalance: balance,
      };
    });
  }, [ledgerData]);

  // filtring and show only one time
  const groupedByVoucher = useMemo<LedgerTransaction[][]>(() => {
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
      `${import.meta.env.VITE_API_URL
      }/api/ledger-report/report?ledgerId=${ledgerId}&fromDate=${fromDate}&toDate=${toDate}&includeOpening=${includeOpening}&includeClosing=${includeClosing}`
    )
      .then((res) => res.json())
      .then((data: LedgerApiResponse) => {
        if (data.success) {
          setLedgerData(data);
        } else {
          setError(data.message || "Error loading ledger data");
        }
      })
      .catch((err) => setError(err.message || "Network error"))
      .finally(() => setLoading(false));
  }, [ledgerId, fromDate, toDate, includeOpening, includeClosing]);

  interface MonthlyEntry {
    debit: number;
    credit: number;
    closing: number;
  }

  type MonthlySummary = Record<string, MonthlyEntry>;

  // Group transactions by month for monthly view
  const getMonthlySummary = (transactions: LedgerTransaction[]): MonthlySummary => {
    const monthly: MonthlySummary = {};

    let runningBalance = ledgerData?.summary.openingBalance || 0;
    const isDebitLedger = ledgerData?.ledger?.balance_type === "debit";

    // Date wise sort
    const sorted = [...transactions].sort(
      (a, b) =>
        new Date(a.date).getTime() -
        new Date(b.date).getTime()
    );

    sorted.forEach((txn) => {
      if (txn.isOpening || txn.isClosing) return;

      const month = txn.date.split("-")[1]; // MM

      if (!monthly[month]) {
        monthly[month] = {
          debit: 0,
          credit: 0,
          closing: 0,
        };
      }

      monthly[month].debit += txn.debit;
      monthly[month].credit += txn.credit;

      if (isDebitLedger) {
        runningBalance += (txn.debit - txn.credit);
      } else {
        runningBalance += (txn.credit - txn.debit);
      }

      monthly[month].closing = runningBalance;
    });

    return monthly;
  };



  const monthlySummary = useMemo(() => {
    return getMonthlySummary(ledgerTransactions);
  }, [ledgerTransactions]);
  const summaryTotals = useMemo<{
    openingBalance: number;
    totalDebit: number;
    totalCredit: number;
    closingBalance: number;
    transactionCount: number;
  }>(
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

  const grandTotal = useMemo<{ debit: number; credit: number; closing: number }>(() => {
    let debit = 0;
    let credit = 0;
    let closing = 0;

    Object.values(monthlySummary).forEach((m) => {
      debit += m.debit;
      credit += m.credit;
      closing = m.closing;
    });

    return { debit, credit, closing };
  }, [monthlySummary]);

  const dailySummary = useMemo(() => {
    if (!ledgerData) return [];

    const daysInMonth = new Date(
      dailyBreakupYear,
      parseInt(dailyBreakupMonth),
      0
    ).getDate();

    const daily: { date: string; debit: number; credit: number; balance: number }[] = [];

    // We need the balance up to the beginning of the selected month
    let runningBalance = ledgerData.summary.openingBalance || 0;
    const isDebitLedger = ledgerData.ledger?.balance_type === "debit";

    // Use transactions from ledgerData
    const transactions = ledgerData.transactions || [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${dailyBreakupYear}-${dailyBreakupMonth}-${String(day).padStart(2, "0")}`;

      const dayTxns = transactions.filter((txn) => {
        if (!txn.date) return false;
        // Robust date extraction to YYYY-MM-DD
        const d = new Date(txn.date);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dayNum = String(d.getDate()).padStart(2, "0");
        const tDate = `${y}-${m}-${dayNum}`;
        return tDate === dateStr;
      });

      let dayDebit = 0;
      let dayCredit = 0;

      dayTxns.forEach((txn) => {
        dayDebit += txn.debit;
        dayCredit += txn.credit;
      });

      if (isDebitLedger) {
        runningBalance += dayDebit - dayCredit;
      } else {
        runningBalance += dayCredit - dayDebit;
      }

      daily.push({
        date: dateStr,
        debit: dayDebit,
        credit: dayCredit,
        balance: runningBalance,
      });
    }

    return daily;
  }, [ledgerData, dailyBreakupMonth, dailyBreakupYear]);

  return (
    <div className="pt-[56px] px-4 ">
      <div className="flex items-center mb-6">
        <button
          type="button"
          title="Back to Reports"
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
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
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              } ${showFilterPanel ? "bg-blue-100 dark:bg-blue-900" : ""}`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print Report"
            type="button"
            onClick={handlePrint}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Printer size={18} />
          </button>
          <button
            type="button"
            title="Download Report"
            onClick={handleDownload}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
                onChange={(e) => {
                  const id = e.target.value;

                  setLedgerId(id);

                  // URL me bhi bhejo
                  navigate(`/app/reports/ledger/${id}`);
                }}
                className={`w-full p-2 rounded border ${theme === "dark"
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
                    e.target.value as "detailed" | "monthly"
                  )
                }
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
                  }`}
              >
                <option value="detailed">Detailed View</option>
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                  className={`w-full p-2 rounded border ${theme === "dark"
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
                  className={`w-full p-2 rounded border ${theme === "dark"
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
          className={`p-8 text-center rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
            className={`p-4 mb-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
                  className={`text-lg font-bold ${summaryTotals.openingBalance >= 0
                    ? "text-green-600"
                    : "text-red-600"
                    }`}
                >
                  {formatCurrency(Math.abs(summaryTotals.openingBalance))}
                  {summaryTotals.openingBalance > 0
                    ? isDebitLedger ? " Dr" : " Cr"
                    : summaryTotals.openingBalance < 0
                      ? isDebitLedger ? " Cr" : " Dr"
                      : ""}
                </div>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                }`}
            >
              <div className="text-sm text-gray-500">Total Debit</div>
              <div className="text-xl font-bold text-blue-600">
                {formatCurrency(summaryTotals.totalDebit)}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                }`}
            >
              <div className="text-sm text-gray-500">Total Credit</div>
              <div className="text-xl font-bold text-purple-600">
                {formatCurrency(summaryTotals.totalCredit)}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                }`}
            >
              <div className="text-sm text-gray-500">Net Balance</div>
              <div
                className={`text-xl font-bold ${summaryTotals.closingBalance >= 0
                  ? "text-green-600"
                  : "text-red-600"
                  }`}
              >
                {formatCurrency(Math.abs(summaryTotals.closingBalance))}
                {summaryTotals.closingBalance > 0
                  ? isDebitLedger ? " Dr" : " Cr"
                  : summaryTotals.closingBalance < 0
                    ? isDebitLedger ? " Cr" : " Dr"
                    : ""}
              </div>
            </div>
            <div
              className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
            {["detailed", "monthly", "daily"].map((mode) => (
              <button
                key={mode}
                onClick={() =>
                  setViewMode(mode as "detailed" | "monthly" | "daily")
                }
                className={`px-4 py-2 rounded-t-lg text-sm font-medium ${viewMode === mode
                  ? theme === "dark"
                    ? "bg-gray-800 text-white"
                    : "bg-white text-blue-600 shadow"
                  : theme === "dark"
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {mode === "daily" ? "Daily Breakup" : mode.charAt(0).toUpperCase() + mode.slice(1) + " View"}
              </button>
            ))}
          </div>

          {viewMode === "daily" && (
            <div className={`p-4 mb-4 rounded-lg flex items-center space-x-4 ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Month:</label>
                <select
                  value={dailyBreakupMonth}
                  onChange={(e) => setDailyBreakupMonth(e.target.value)}
                  className={`p-2 rounded border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                >
                  {financialMonths.map((m) => (
                    <option key={m.key} value={m.key}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium">Year:</label>
                <select
                  value={dailyBreakupYear}
                  onChange={(e) => setDailyBreakupYear(parseInt(e.target.value))}
                  className={`p-2 rounded border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
                >
                  {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Transaction Table */}
          <div
            className={`rounded-lg overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
          >
            {viewMode === "detailed" && (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">

                  {/* Header */}
                  <thead
                    className={`${theme === "dark"
                      ? "bg-gray-700 text-gray-200"
                      : "bg-gray-50 text-gray-700"
                      }`}
                  >
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Date
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Particulars
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Voucher Type
                      </th>

                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                        Voucher No
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                        Debit
                      </th>

                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                        Credit
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider">
                        Closing Balance
                      </th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {groupedByVoucher.map((voucherGroup: LedgerTransaction[]) => {
                      const first = voucherGroup[0];

                      const voucherKey = `${first.date}_${first.voucherNo}_${first.voucherType}`;

                      return (
                        <React.Fragment key={voucherKey}>
                          {voucherGroup.map((txn, i) => (
                            <tr
                              key={txn.id}
                              className={`${theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-50"
                                } transition`}
                            >
                              {/* Date */}
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
                                {txn.debit > 0
                                  ? formatCurrency(txn.debit)
                                  : ""}
                              </td>

                              {/* Credit */}
                              <td className="px-4 py-3 text-sm text-right font-mono">
                                {txn.credit > 0
                                  ? formatCurrency(txn.credit)
                                  : ""}
                              </td>

                              {/* Closing Balance */}
                              <td className="px-4 py-3 text-sm text-right font-mono font-medium">
                                {formatCurrency(Math.abs(txn.runningBalance || 0))}
                                {(txn.runningBalance || 0) > 0
                                  ? isDebitLedger ? " Dr" : " Cr"
                                  : (txn.runningBalance || 0) < 0
                                    ? isDebitLedger ? " Cr" : " Dr"
                                    : ""}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      );
                    })}

                    {/* ================= Grand Total ================= */}
                    <tr
                      className={`border-t font-semibold ${theme === "dark"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-100 text-gray-800"
                        }`}
                    >
                      <td className="px-4 py-4" colSpan={4}>
                        Grand Total
                      </td>

                      <td className="px-4 py-4 text-right font-mono">
                        {formatCurrency(summaryTotals.totalDebit)}
                      </td>

                      <td className="px-4 py-4 text-right font-mono">
                        {formatCurrency(summaryTotals.totalCredit)}
                      </td>

                      <td className="px-4 py-4 text-right font-mono">
                        {formatCurrency(Math.abs(summaryTotals.closingBalance))}
                        {summaryTotals.closingBalance > 0
                          ? isDebitLedger ? " Dr" : " Cr"
                          : summaryTotals.closingBalance < 0
                            ? isDebitLedger ? " Cr" : " Dr"
                            : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}


            {viewMode === "monthly" && (
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full border-collapse">

                  {/* Header */}
                  <thead
                    className={`${theme === "dark"
                      ? "bg-gray-800 text-gray-200"
                      : "bg-gray-100 text-gray-700"
                      }`}
                  >
                    <tr>
                      <th className="px-4 py-4 text-left text-base font-semibold">
                        Month
                      </th>
                      <th className="px-4 py-4 text-right text-base font-semibold">
                        Debit
                      </th>
                      <th className="px-4 py-4 text-right text-base font-semibold">
                        Credit
                      </th>
                      <th className="px-4 py-4 text-right text-base font-semibold">
                        Closing Balance
                      </th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {financialMonths.map((m: { key: string; name: string }) => {
                      const data = monthlySummary[m.key];

                      const hasData =
                        data &&
                        (data.debit !== 0 ||
                          data.credit !== 0 ||
                          data.closing !== 0);

                      return (
                        <tr
                          key={m.key}
                          onClick={() => handleMonthClick(m.key)}
                          className={`cursor-pointer ${theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-50"
                            } transition`}
                        >
                          {/* Month */}
                          <td className="px-4 py-3 font-medium text-sm">
                            {m.name}
                          </td>

                          {/* Debit */}
                          <td className="px-4 py-3 text-right text-sm">
                            {hasData && data?.debit
                              ? formatCurrency(data.debit)
                              : ""}
                          </td>

                          {/* Credit */}
                          <td className="px-4 py-3 text-right text-sm">
                            {hasData && data?.credit
                              ? formatCurrency(data.credit)
                              : ""}
                          </td>

                          {/* Closing */}
                          <td
                            className={`px-4 py-3 text-right text-sm font-medium ${hasData && data?.closing >= 0
                              ? "text-green-600"
                              : hasData && data?.closing < 0
                                ? "text-red-600"
                                : ""
                              }`}
                          >
                            {hasData ? (
                              <>
                                {formatCurrency(Math.abs(data.closing))}
                                {data.closing > 0
                                  ? isDebitLedger ? " Dr" : " Cr"
                                  : data.closing < 0
                                    ? isDebitLedger ? " Cr" : " Dr"
                                    : ""}
                              </>
                            ) : ""}
                          </td>
                        </tr>
                      );
                    })}

                    {/* Grand Total */}
                    <tr
                      className={`${theme === "dark"
                        ? "bg-gray-700 text-white"
                        : "bg-gray-200 text-gray-800"
                        } font-semibold`}
                    >
                      <td className="px-4 py-4">
                        Grand Total
                      </td>

                      <td className="px-4 py-4 text-right">
                        {grandTotal.debit
                          ? formatCurrency(grandTotal.debit)
                          : ""}
                      </td>

                      <td className="px-4 py-4 text-right">
                        {grandTotal.credit
                          ? formatCurrency(grandTotal.credit)
                          : ""}
                      </td>

                      <td
                        className={`px-4 py-4 text-right ${grandTotal.closing >= 0
                          ? "text-green-600"
                          : "text-red-600"
                          }`}
                      >
                        {grandTotal.closing !== 0 ? (
                          <>
                            {formatCurrency(Math.abs(grandTotal.closing))}
                            {grandTotal.closing > 0
                              ? isDebitLedger ? " Dr" : " Cr"
                              : grandTotal.closing < 0
                                ? isDebitLedger ? " Cr" : " Dr"
                                : ""}
                          </>
                        ) : formatCurrency(0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === "daily" && (
              <div className="overflow-x-auto rounded-lg shadow-sm">
                <table className="w-full border-collapse">
                  <thead className={`${theme === "dark" ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
                    <tr>
                      <th className="px-4 py-4 text-left text-base font-semibold">Date</th>
                      <th className="px-4 py-4 text-right text-base font-semibold">Debit</th>
                      <th className="px-4 py-4 text-right text-base font-semibold">Credit</th>
                      <th className="px-4 py-4 text-right text-base font-semibold">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailySummary.map((day, idx) => (
                      <tr
                        key={idx}
                        onClick={() => handleDayClick(day.date)}
                        className={`cursor-pointer ${theme === "dark" ? "hover:bg-gray-700 border-b border-gray-700" : "hover:bg-gray-50 border-b border-gray-100"} transition`}
                      >
                        <td className="px-4 py-3 font-medium text-sm">{formatDate(day.date)}</td>
                        <td className="px-4 py-3 text-right text-sm font-mono">{day.debit > 0 ? formatCurrency(day.debit) : ""}</td>
                        <td className="px-4 py-3 text-right text-sm font-mono">{day.credit > 0 ? formatCurrency(day.credit) : ""}</td>
                        <td className={`px-4 py-3 text-right text-sm font-medium font-mono ${day.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {formatCurrency(Math.abs(day.balance))}
                          {day.balance > 0
                            ? isDebitLedger ? " Dr" : " Cr"
                            : day.balance < 0
                              ? isDebitLedger ? " Cr" : " Dr"
                              : ""}
                        </td>
                      </tr>
                    ))}
                    {/* Daily Breakup Total */}
                    <tr className={`${theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"} font-semibold`}>
                      <td className="px-4 py-4">Total for Month</td>
                      <td className="px-4 py-4 text-right font-mono">
                        {formatCurrency(dailySummary.reduce((sum, day) => sum + day.debit, 0))}
                      </td>
                      <td className="px-4 py-4 text-right font-mono">
                        {formatCurrency(dailySummary.reduce((sum, day) => sum + day.credit, 0))}
                      </td>
                      <td className={`px-4 py-4 text-right font-mono ${dailySummary.length > 0 && dailySummary[dailySummary.length - 1].balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {dailySummary.length > 0 && dailySummary[dailySummary.length - 1].balance !== 0 ? (
                          <>
                            {formatCurrency(Math.abs(dailySummary[dailySummary.length - 1].balance))}
                            {dailySummary[dailySummary.length - 1].balance > 0
                              ? isDebitLedger ? " Dr" : " Cr"
                              : dailySummary[dailySummary.length - 1].balance < 0
                                ? isDebitLedger ? " Cr" : " Dr"
                                : ""}
                          </>
                        ) : formatCurrency(0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </>
      )}

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`w-full max-w-2xl mx-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Voucher Details</h3>
                <button
                  onClick={() => setSelectedVoucher(null)}
                  className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
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
                  className={`px-4 py-2 rounded ${theme === "dark"
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
                      navigate(
                        `/app/vouchers/sales/edit/${selectedVoucher.id}`
                      );
                    } else {
                      navigate(
                        `/app/vouchers/${selectedVoucher.voucherType.toLowerCase()}/${selectedVoucher.id
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
        className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
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
