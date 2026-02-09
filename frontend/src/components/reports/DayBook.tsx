import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Filter,
  Calendar,
  Eye,
} from "lucide-react";

interface DayBookEntry {
  id: string;
  date: string;
  voucherType: string;
  voucherNo: string;
  particulars: string;
  ledgerName: string;
  debit: number;
  credit: number;
  voucherId: string;
  narration?: string;
  // Item fields
  itemId?: string;
  quantity?: number;
  rate?: number;
  hsnCode?: string;
}

interface VoucherGroup {
  voucherId: string;
  voucherNo: string;
  voucherType: string;
  date: string;
  totalDebit: number;
  totalCredit: number;
  entries: DayBookEntry[];
  narration?: string;
  entriesCount: number;
  supplier_invoice_date: Date;
}

const DayBook: React.FC = () => {
  const { theme, stockItems } = useAppContext();
  const navigate = useNavigate();

  const getItemName = (itemId: string | undefined) => {
    if (!itemId) return "";
    return stockItems.find((item) => item.id === itemId)?.name || "";
  };

  const getItemHSN = (itemId: string | undefined) => {
    if (!itemId) return "";
    return stockItems.find((item) => item.id === itemId)?.hsnCode || "";
  };
  const [totals, setTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
    netDifference: 0,
    vouchersCount: 0,
  });

  const [, setDaybookTotals] = useState({
    totalDebit: 0,
    totalCredit: 0,
    netDifference: 0,
    vouchersCount: 0,
    supplier_invoice_date: 0,
  });
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedDateRange, setSelectedDateRange] = useState("today");
  const [selectedVoucherType, setSelectedVoucherType] = useState("");
  const [viewMode, setViewMode] = useState<"detailed" | "grouped">("grouped");
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherGroup | null>(
    null
  );

  const [groupedVouchers, setGroupedVouchers] = useState<VoucherGroup[]>([]);
  const [processedEntries, setProcessedEntries] = useState<DayBookEntry[]>([]);
  const [allGroupedVouchers, setAllGroupedVouchers] = useState<VoucherGroup[]>(
    []
  );
  const [allProcessedEntries, setAllProcessedEntries] = useState<
    DayBookEntry[]
  >([]);

  //  const [entries, setEntries] = useState([]);
  //  const [entries, setEntries] = useState<DayBookEntry[]>([]);

  const allowEntryByVoucherType = (
    voucherType: string,
    entryType: "debit" | "credit"
  ) => {
    if (voucherType === "payment") return entryType === "debit";
    if (voucherType === "receipt") return entryType === "credit";
    if (voucherType === "contra") return entryType === "debit";
    if (voucherType === "journal") return entryType === "debit";
    return true; // sales, purchase etc
  };

  const [rawVoucherEntries, setRawVoucherEntries] = useState<
    Record<string, DayBookEntry[]>
  >({});

  useEffect(() => {
    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem("employee_id");

    if (!company_id || !owner_type || !owner_id) return;

    fetch(
      `${import.meta.env.VITE_API_URL
      }/api/daybookTable2?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
    )
      .then((res) => res.json())
      .then((data) => {
        const grouped: Record<string, VoucherGroup> = {};
        console.log("this is data", data);
        // 🔹 RAW entries for Detailed view
        const allDetailedEntriesRaw: DayBookEntry[] = [];

        // 🔹 RAW entries voucher-wise (for modal)
        const voucherWiseRawEntries: Record<string, DayBookEntry[]> = {};

        data.forEach((voucher: any) => {
          const id = voucher.id;

          if (!grouped[id]) {
            grouped[id] = {
              voucherId: id,
              voucherNo: voucher.voucher_number,
              voucherType: voucher.voucher_type,
              date: voucher.date,
              totalDebit: 0,
              totalCredit: 0,
              entries: [],
              narration: voucher.narration,
              entriesCount: 0,
              supplier_invoice_date: voucher.supplier_invoice_date,
            };
          }

          voucher.entries.forEach((entry: any) => {
            const amount = parseFloat(entry.amount || 0);
            const isDebit = entry.entry_type === "debit";
            const isCredit = entry.entry_type === "credit";

            /* ==========================
             🔹 RAW DATA (NO FILTER)
          ========================== */

            const rawEntry: DayBookEntry = {
              id: entry.id,
              date: voucher.date,
              voucherType: voucher.voucher_type,
              voucherNo: voucher.voucher_number,
              particulars: voucher.reference_no || "—",

              // ✅ GST / SUBTOTAL NAME FIX
              ledgerName:
                entry.ledger_name ||
                entry.ledgerName ||
                entry.narration ||
                "",

              debit: isDebit ? amount : 0,
              credit: isCredit ? amount : 0,

              voucherId: id,
              narration: entry.entry_narration,
              itemId: entry.item_id,
            };

            allDetailedEntriesRaw.push(rawEntry);

            if (!voucherWiseRawEntries[id]) {
              voucherWiseRawEntries[id] = [];
            }
            voucherWiseRawEntries[id].push(rawEntry);

            /* ==========================
             🔹 GROUPED DATA (FILTERED)
          ========================== */

            if (
              isDebit &&
              allowEntryByVoucherType(voucher.voucher_type, "debit")
            ) {
              grouped[id].totalDebit += amount;
            }

            if (
              isCredit &&
              allowEntryByVoucherType(voucher.voucher_type, "credit")
            ) {
              grouped[id].totalCredit += amount;
            }

            grouped[id].entries.push({
              ...rawEntry,
              debit:
                isDebit &&
                  allowEntryByVoucherType(voucher.voucher_type, "debit")
                  ? amount
                  : 0,
              credit:
                isCredit &&
                  allowEntryByVoucherType(voucher.voucher_type, "credit")
                  ? amount
                  : 0,
            });

            if (
              allowEntryByVoucherType(voucher.voucher_type, entry.entry_type)
            ) {
              grouped[id].entriesCount++;
            }
          });
        });

        /* ==========================
         🔹 GROUPED STATE
      ========================== */
        const groupedArray = Object.values(grouped).sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return b.voucherNo.localeCompare(a.voucherNo);
        });
        setGroupedVouchers(groupedArray);
        setAllGroupedVouchers(groupedArray);

        /* ==========================
         🔹 DETAILED VIEW (ROWSPAN)
      ========================== */
        const entryGroups: DayBookEntry[][] = [];
        const groupMap = new Map<string, number>();

        // Sort RAW entries by date descending before grouping
        allDetailedEntriesRaw.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          if (dateB !== dateA) return dateB - dateA;
          return b.voucherNo.localeCompare(a.voucherNo);
        });

        allDetailedEntriesRaw.forEach((entry) => {
          const key = `${entry.date}|${entry.voucherType}|${entry.voucherNo}|${entry.particulars}`;
          if (!groupMap.has(key)) {
            groupMap.set(key, entryGroups.length);
            entryGroups.push([]);
          }
          entryGroups[groupMap.get(key)!].push(entry);
        });

        const processedWithRowspan: (DayBookEntry & {
          rowspan?: number;
          isFirstInGroup?: boolean;
        })[] = [];

        entryGroups.forEach((group) => {
          group.forEach((entry, index) => {
            processedWithRowspan.push({
              ...entry,
              rowspan: index === 0 ? group.length : 0,
              isFirstInGroup: index === 0,
            });
          });
        });

        setProcessedEntries(processedWithRowspan);
        setAllProcessedEntries(processedWithRowspan);

        /* ==========================
         🔹 MODAL RAW DATA
      ========================== */
        setRawVoucherEntries(voucherWiseRawEntries);

        /* ==========================
         🔹 TOTALS
      ========================== */
        const totalDebit = groupedArray.reduce(
          (sum, v) => sum + v.totalDebit,
          0
        );
        const totalCredit = groupedArray.reduce(
          (sum, v) => sum + v.totalCredit,
          0
        );

        setTotals({
          totalDebit,
          totalCredit,
          netDifference: totalDebit - totalCredit,
          vouchersCount: groupedArray.length,
        });
      })
      .catch((err) => console.error("DayBook Error:", err));
  }, []);

  const getLocalDate = (dateStr: string) => {
    const d = new Date(dateStr);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`; // yyyy-mm-dd
  };

  useEffect(() => {
    /* ===== CLEAR DATE → SHOW ALL ===== */
    if (!selectedDate) {
      setGroupedVouchers(allGroupedVouchers);
      setProcessedEntries(allProcessedEntries);

      const totalDebit = allGroupedVouchers.reduce(
        (sum, v) => sum + v.totalDebit,
        0
      );

      const totalCredit = allGroupedVouchers.reduce(
        (sum, v) => sum + v.totalCredit,
        0
      );

      setTotals({
        totalDebit,
        totalCredit,
        netDifference: totalDebit - totalCredit,
        vouchersCount: allGroupedVouchers.length,
      });

      return;
    }

    /* ===== FILTER BY DATE ===== */
    const filteredGrouped = allGroupedVouchers.filter(
      (voucher) => getLocalDate(voucher.date) === selectedDate
    );

    const filteredEntries = allProcessedEntries.filter(
      (entry) => getLocalDate(entry.date) === selectedDate
    );

    setGroupedVouchers(filteredGrouped);
    setProcessedEntries(filteredEntries);

    const totalDebit = filteredGrouped.reduce(
      (sum, v) => sum + v.totalDebit,
      0
    );

    const totalCredit = filteredGrouped.reduce(
      (sum, v) => sum + v.totalCredit,
      0
    );

    setTotals({
      totalDebit,
      totalCredit,
      netDifference: totalDebit - totalCredit,
      vouchersCount: filteredGrouped.length,
    });
  }, [selectedDate]);

  const getGroupedAmounts = (voucher: VoucherGroup) => {
    const type = voucher.voucherType.toLowerCase();

    // 🟡 PURCHASE → ONLY CREDIT (NO ADDING)
    if (type.includes("purchase")) {
      return {
        debit: 0,
        credit: voucher.totalCredit, // ✅ ONLY CREDIT
      };
    }

    // 🟢 SALES → ONLY DEBIT
    if (type.includes("sales")) {
      return {
        debit: voucher.totalDebit,
        credit: 0,
      };
    }

    // 🔵 DEBIT NOTE
    if (type.includes("debit")) {
      return {
        debit: voucher.totalDebit,
        credit: 0,
      };
    }

    // 🟣 CREDIT NOTE
    if (type.includes("credit")) {
      return {
        debit: 0,
        credit: voucher.totalCredit,
      };
    }

    // ⚪ DEFAULT
    return {
      debit: voucher.totalDebit,
      credit: voucher.totalCredit,
    };
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

  const handleVoucherClick = (voucher: VoucherGroup) => {
    setSelectedVoucher(voucher);
  };

  const handleDateRangeChange = (range: string) => {
    setSelectedDateRange(range);
    if (range === "custom") {
      // Custom date will be handled by the date input
    }
  };

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
        <h1 className="text-2xl font-bold">Day Book</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Toggle Filters"
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print Report"
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Download Report"
            type="button"
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
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Voucher Type
              </label>
              <select
                title="Select Voucher Type"
                value={selectedVoucherType}
                onChange={(e) => setSelectedVoucherType(e.target.value)}
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
                  }`}
              >
                <option value="">All Types</option>
                <option value="payment">Payment</option>
                <option value="receipt">Receipt</option>
                <option value="journal">Journal</option>
                <option value="sales">Sales</option>
                <option value="purchase">Purchase</option>
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
                  setViewMode(e.target.value as "detailed" | "grouped")
                }
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
                  }`}
              >
                <option value="grouped">Grouped by Voucher</option>
                <option value="detailed">Detailed Entries</option>
              </select>
            </div>
            {selectedDateRange === "custom" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Select Date
                </label>
                <input
                  type="date"
                  title="Select Date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`w-full p-2 rounded border ${theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                    }`}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
        >
          <div className="text-sm text-gray-500">Total Debit</div>
          <div className="text-xl font-bold text-blue-600">
            {formatCurrency(totals.totalDebit)}
          </div>
        </div>
        <div
          className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
        >
          <div className="text-sm text-gray-500">Total Credit</div>
          <div className="text-xl font-bold text-purple-600">
            {formatCurrency(totals.totalCredit)}
          </div>
        </div>
        <div
          className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
        >
          <div className="text-sm text-gray-500">Net Difference</div>
          <div
            className={`text-xl font-bold ${totals.totalDebit - totals.totalCredit >= 0
              ? "text-green-600"
              : "text-red-600"
              }`}
          >
            {formatCurrency(Math.abs(totals.totalDebit - totals.totalCredit))}
          </div>
        </div>
        <div
          className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
        >
          <div className="text-sm text-gray-500">Vouchers</div>
          <div className="text-xl font-bold text-gray-600">
            {totals.vouchersCount}
            {/* {viewMode === 'grouped' ? groupedVouchers.length : processedEntries.length} */}
          </div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="flex space-x-1 mb-4">
        {["grouped", "detailed"].map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode as "detailed" | "grouped")}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${viewMode === mode
              ? theme === "dark"
                ? "bg-gray-800 text-white"
                : "bg-white text-blue-600 shadow"
              : theme === "dark"
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {mode === "grouped" ? "Grouped by Voucher" : "Detailed Entries"}
          </button>
        ))}
      </div>

      <div
        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <div className="mb-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Day Book</h2>
            <p className="text-sm opacity-75">
              {selectedDateRange === "custom"
                ? `For ${formatDate(selectedDate)}`
                : selectedDateRange === "today"
                  ? `For ${formatDate(new Date().toISOString().split("T")[0])}`
                  : `For ${selectedDateRange.replace("-", " ")}`}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar size={16} className="text-gray-500" />

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedDateRange("custom");
              }}
              className={`text-sm px-2 py-1 rounded border outline-none ${theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-700"
                }`}
            />

            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate("");
                  setSelectedDateRange("today");
                }}
                className="text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {viewMode === "grouped" ? (
            <table className="w-full">
              <thead>
                <tr
                  className={`${theme === "dark"
                    ? "border-b border-gray-700"
                    : "border-b-2 border-gray-300"
                    }`}
                >
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Particulars</th>
                  <th className="px-4 py-3 text-left">Voucher Type</th>
                  <th className="px-4 py-3 text-left">Voucher No.</th>
                  <th className="px-4 py-3 text-left">Entries</th>
                  <th className="px-4 py-3 text-right">Total Debit</th>
                  <th className="px-4 py-3 text-right">Total Credit</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {!Array.isArray(groupedVouchers) ||
                  groupedVouchers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center opacity-70"
                    >
                      No vouchers found for the selected criteria
                    </td>
                  </tr>
                ) : (
                  groupedVouchers.map((voucher) => (
                    <tr
                      key={voucher.voucherId}
                      className={`${theme === "dark"
                        ? "border-b border-gray-700 hover:bg-gray-700"
                        : "border-b border-gray-200 hover:bg-gray-50"
                        } cursor-pointer`}
                      onClick={() => handleVoucherClick(voucher)}
                    >
                      <td className="px-4 py-3">
                        {voucher.date ? formatDate(String(voucher.date)) : "—"}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {voucher.entries?.[0]?.itemId
                            ? getItemName(voucher.entries[0].itemId)
                            : voucher.entries?.[0]?.ledgerName || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${voucher.voucherType === "sales"
                            ? "bg-green-100 text-green-800"
                            : voucher.voucherType === "purchase"
                              ? "bg-blue-100 text-blue-800"
                              : voucher.voucherType === "receipt"
                                ? "bg-purple-100 text-purple-800"
                                : voucher.voucherType === "payment"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {voucher.voucherType.charAt(0).toUpperCase() +
                            voucher.voucherType.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono">
                        {voucher.voucherNo}
                      </td>
                      <td className="px-4 py-3">
                        {voucher.entriesCount} entries
                      </td>
                      {(() => {
                        const amt = getGroupedAmounts(voucher);
                        return (
                          <>
                            <td className="px-4 py-3 text-right font-mono">
                              {amt.debit > 0 ? formatCurrency(amt.debit) : "-"}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {amt.credit > 0
                                ? formatCurrency(amt.credit)
                                : "-"}
                            </td>
                          </>
                        );
                      })()}

                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVoucherClick(voucher);
                          }}
                          className={`p-1 rounded ${theme === "dark"
                            ? "hover:bg-gray-600"
                            : "hover:bg-gray-200"
                            }`}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {groupedVouchers?.length > 0 && (
                <tfoot>
                  <tr
                    className={`${theme === "dark"
                      ? "border-t-2 border-gray-600 bg-gray-700"
                      : "border-t-2 border-gray-400 bg-gray-50"
                      }`}
                  >
                    <td colSpan={4} className="px-4 py-3 font-bold">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right font-bold font-mono">
                      {formatCurrency(totals.totalDebit)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold font-mono">
                      {formatCurrency(totals.totalCredit)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr
                  className={`${theme === "dark"
                    ? "border-b border-gray-700"
                    : "border-b-2 border-gray-300"
                    }`}
                >
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Particulars</th>
                  <th className="px-4 py-3 text-left">Voucher Type</th>
                  <th className="px-4 py-3 text-left">Voucher No.</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                </tr>
              </thead>
              <tbody>
                {processedEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center opacity-70"
                    >
                      No entries found
                    </td>
                  </tr>
                ) : (
                  processedEntries.map((entry, index) => {
                    const entryWithRowspan = entry as DayBookEntry & {
                      rowspan?: number;
                      isFirstInGroup?: boolean;
                    };

                    const showCommon = entryWithRowspan.isFirstInGroup;
                    const rowspan =
                      entryWithRowspan.rowspan && entryWithRowspan.rowspan > 1
                        ? entryWithRowspan.rowspan
                        : undefined;

                    return (
                      <tr
                        key={`${entry.id}-${index}`}
                        className={`${theme === "dark"
                          ? "border-b border-gray-700"
                          : "border-b border-gray-200"
                          }`}
                      >
                        {/* DATE */}
                        {showCommon && (
                          <td rowSpan={rowspan} className="px-4 py-3">
                            {formatDate(entry.date)}
                          </td>
                        )}

                        {/* PARTICULARS (LEDGER / ITEM NAME) */}
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {entry.ledgerName}
                          </div>

                          {entry.narration && (
                            <div className="text-xs text-gray-400 mt-1">
                              {entry.narration}
                            </div>
                          )}
                        </td>

                        {/* VOUCHER TYPE */}
                        {showCommon && (
                          <td
                            rowSpan={rowspan}
                            className="px-4 py-3 capitalize"
                          >
                            {entry.voucherType}
                          </td>
                        )}

                        {/* VOUCHER NO */}
                        {showCommon && (
                          <td rowSpan={rowspan} className="px-4 py-3 font-mono">
                            {entry.voucherNo}
                          </td>
                        )}

                        {/* DEBIT */}
                        <td className="px-4 py-3 text-right font-mono">
                          {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                        </td>

                        {/* CREDIT */}
                        <td className="px-4 py-3 text-right font-mono">
                          {entry.credit > 0
                            ? formatCurrency(entry.credit)
                            : "-"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              {processedEntries.length > 0 && (
                <tfoot>
                  <tr
                    className={`font-bold ${theme === "dark"
                      ? "border-t-2 border-gray-600 bg-gray-700"
                      : "border-t-2 border-gray-400 bg-gray-50"
                      }`}
                  >
                    <td colSpan={4} className="px-4 py-3">
                      Total:
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(
                        processedEntries.reduce((sum, e) => sum + e.debit, 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(
                        processedEntries.reduce((sum, e) => sum + e.credit, 0)
                      )}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          )}
        </div>
      </div>

      {/* Voucher Detail Modal */}
      {selectedVoucher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`w-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden flex flex-col ${theme === "dark" ? "bg-gray-800" : "bg-white"
              }`}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">
                  Voucher Details - {selectedVoucher.voucherNo}
                </h3>

                <button
                  onClick={() => setSelectedVoucher(null)}
                  className={`p-2 rounded-full ${theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-100"
                    }`}
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Voucher No
                  </label>
                  <div className="font-mono">
                    {selectedVoucher.voucherNo}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Voucher Type
                  </label>
                  <div className="capitalize">
                    {selectedVoucher.voucherType}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Date
                  </label>
                  <div>{formatDate(selectedVoucher.date)}</div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Entries
                  </label>
                  <div>
                    {selectedVoucher.entries?.length || 0} entries
                  </div>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Voucher Entries
                </label>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead
                      className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                        }`}
                    >
                      <tr>
                        <th className="px-3 py-2 text-left">
                          Item / Ledger
                        </th>
                        <th className="px-3 py-2 text-right">
                          Voucher No.
                        </th>
                        <th className="px-3 py-2 text-right">
                          Voucher Type
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
                      {(() => {
                        const entries =
                          rawVoucherEntries[selectedVoucher.voucherId] ??
                          [];

                        const partyEntry = entries.find(
                          (e) => e.isParty
                        );

                        const otherEntries = entries.filter(
                          (e) => !e.isParty
                        );

                        return (
                          <>
                            {/* PARTY ROW */}
                            {partyEntry && (
                              <tr className="font-semibold bg-gray-100 dark:bg-gray-700">
                                <td className="px-3 py-2">
                                  {partyEntry.ledgerName}
                                </td>

                                <td className="px-3 py-2 text-right font-mono">
                                  {selectedVoucher.voucherNo}
                                </td>

                                <td className="px-3 py-2 text-right capitalize">
                                  {selectedVoucher.voucherType}
                                </td>

                                <td className="px-3 py-2 text-right font-mono">
                                  -
                                </td>

                                <td className="px-3 py-2 text-right font-mono">
                                  {formatCurrency(partyEntry.amount)}
                                </td>
                              </tr>
                            )}

                            {/* SUBTOTAL + GST ROWS */}
                            {otherEntries.map((entry, index) => (
                              <tr
                                key={index}
                                className="border-t border-gray-200 dark:border-gray-600"
                              >
                                {/* Particulars */}
                                <td
                                  className={`px-3 py-2 ${entry.isChild
                                    ? "pl-10 text-gray-600"
                                    : ""
                                    }`}
                                >
                                  {entry.ledgerName}
                                </td>

                                <td></td>
                                <td></td>

                                {/* Debit */}
                                <td
                                  className={`px-3 py-2 text-right font-mono ${entry.isChild
                                    ? "text-sm text-gray-600"
                                    : ""
                                    }`}
                                >
                                  {entry.debit > 0
                                    ? formatCurrency(entry.debit)
                                    : "-"}
                                </td>

                                {/* Credit */}
                                <td
                                  className={`px-3 py-2 text-right font-mono ${entry.isChild
                                    ? "text-sm text-gray-600"
                                    : ""
                                    }`}
                                >
                                  {entry.credit > 0
                                    ? formatCurrency(entry.credit)
                                    : "-"}
                                </td>
                              </tr>
                            ))}
                          </>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Narration */}
              {selectedVoucher.narration && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">
                    Narration
                  </label>

                  <div className="text-gray-600 dark:text-gray-400">
                    {selectedVoucher.narration}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
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
                    try {
                      navigate(
                        `/app/vouchers/${selectedVoucher.voucherType}/edit/${selectedVoucher.voucherId}`
                      );
                    } catch (error) {
                      navigate(
                        `/app/vouchers/${selectedVoucher.voucherType}/create`
                      );
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  Edit Voucher
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
          <span className="font-semibold">Pro Tip:</span> Press F5 to refresh,
          F12 to configure display options.
        </p>
      </div>
    </div>
  );
};

export default DayBook;
