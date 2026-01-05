import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Filter,
  BarChart3,
  FileText,
} from "lucide-react";

const ExtractPurchase: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<"summary" | "extract">(
    "summary"
  );
  const [extractData, setExtractData] = useState<any>(null);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [selectedParty, setSelectedParty] = useState<{
    partyName: string;
    partyGSTIN?: string;
  } | null>(null);
  const [selectedPurchaseAccount, setSelectedPurchaseAccount] = useState<{
    ledgerName: string;
  } | null>(null);
  const [selectedTaxType, setSelectedTaxType] = useState<
    "cgst" | "sgst" | "igst" | null
  >(null);
  const [filters, setFilters] = useState({
    dateRange: "this-month",
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  const [purchaseVouchers, setPurchaseVouchers] = useState<any[]>([]);
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

  const monthDataMap = useMemo(() => {
    const map: Record<string, { debit: number; closingBalance: number }> = {};
    MONTHS.forEach((m) => {
      map[m] = { debit: 0, closingBalance: 0 };
    });

    purchaseVouchers.forEach((row) => {
      if (!row.date || !row.total) return;

      const d = new Date(row.date);
      const monthName = monthIndexToName[d.getMonth()];
      const amount = Number(row.total) || 0;

      if (map[monthName]) {
        map[monthName].debit += amount;
      }
    });

    return map;
  }, [purchaseVouchers]);

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const url = `${
      import.meta.env.VITE_API_URL
    }/api/purchase-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPurchaseVouchers(data);
        } else if (Array.isArray(data?.data)) {
          setPurchaseVouchers(data.data);
        } else {
          setPurchaseVouchers([]);
        }
      })
      .catch((err) => {
        console.error("Purchase voucher fetch error:", err);
        setPurchaseVouchers([]);
      });
  }, [companyId, ownerType, ownerId]);

  const fetchExtractData = async (
    month?: number,
    year?: number,
    fromDate?: string,
    toDate?: string
  ) => {
    if (!companyId || !ownerType || !ownerId) return;

    setLoadingExtract(true);
    try {
      const params = new URLSearchParams({
        company_id: companyId,
        owner_type: ownerType,
        owner_id: ownerId,
      });

      if (fromDate && toDate) {
        params.append("fromDate", fromDate);
        params.append("toDate", toDate);
      } else if (month && year) {
        params.append("month", month.toString());
        params.append("year", year.toString());
      } else {
        params.append("fromDate", filters.fromDate);
        params.append("toDate", filters.toDate);
      }

      const url = `${
        import.meta.env.VITE_API_URL
      }/api/extract-purchase?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log("Extract Purchase Data", data);

      if (data.success) {
        setExtractData(data.data);
      } else {
        console.error("Failed to fetch extract data:", data.message);
        setExtractData(null);
      }
    } catch (error) {
      console.error("Extract data fetch error:", error);
      setExtractData(null);
    } finally {
      setLoadingExtract(false);
    }
  };

  // Sync extract date filters with main filters when Extract view is selected
  useEffect(() => {
    if (selectedView === "extract") {
      // Auto-fetch with current filter dates
      fetchExtractData(undefined, undefined, filters.fromDate, filters.toDate);
    }
  }, [selectedView]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div
      className={`min-h-screen pt-[56px] ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          theme === "dark"
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/app/reports")}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Go back to reports"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Extract Purchase</h1>
              <p className="text-sm opacity-70">
                Extract purchase data in columnar format for reporting
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Filters"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
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
              key: "extract",
              label: "Extract",
              icon: <FileText size={16} />,
            },
          ].map((view) => (
            <button
              key={view.key}
              onClick={() =>
                setSelectedView(view.key as "summary" | "extract")
              }
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                selectedView === view.key
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
          className={`p-4 border-b ${
            theme === "dark"
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* Apply to Extract Button */}
            {selectedView === "extract" && (
              <div className="flex items-end">
                <button
                  onClick={() =>
                    fetchExtractData(
                      undefined,
                      undefined,
                      filters.fromDate,
                      filters.toDate
                    )
                  }
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-blue-600 hover:bg-blue-500 border-blue-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 border-blue-500 text-white"
                  } transition-colors font-medium`}
                >
                  Apply to Extract
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        {/* Summary View */}
        {selectedView === "summary" && (
          <div className="rounded-lg border-b">
            <div className="grid grid-cols-3 bg-gray-100 font-semibold text-sm px-4 py-2">
              <div>Particulars</div>
              <div className="text-right">Debit</div>
              <div className="text-right">Closing Balance</div>
            </div>

            {MONTHS.map((month) => {
              const row = monthDataMap[month] || {};
              const monthIndexMap: Record<string, number> = {
                January: 1,
                February: 2,
                March: 3,
                April: 4,
                May: 5,
                June: 6,
                July: 7,
                August: 8,
                September: 9,
                October: 10,
                November: 11,
                December: 12,
              };
              const currentYear = new Date().getFullYear();
              const financialYear =
                monthIndexMap[month] >= 4 ? currentYear : currentYear - 1;

              return (
                <div
                  key={month}
                  onClick={() => {
                    setSelectedView("extract");
                    fetchExtractData(monthIndexMap[month], financialYear);
                  }}
                  className={`grid grid-cols-3 px-4 py-2 text-sm cursor-pointer transition-colors ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                >
                  <div className="font-medium">{month}</div>
                  <div className="text-right">
                    {row.debit > 0 ? `₹${row.debit.toLocaleString()}` : ""}
                  </div>
                  <div className="text-right">
                    {row.closingBalance > 0
                      ? `₹${row.closingBalance.toLocaleString()}`
                      : ""}
                  </div>
                </div>
              );
            })}

            <div
              className={`grid grid-cols-3 px-4 py-2 text-sm font-semibold border-t ${
                theme === "dark" ? "bg-gray-800" : "bg-gray-50"
              }`}
            >
              <div>Total</div>
              <div className="text-right">
                {(() => {
                  const totalDebit = Object.values(monthDataMap).reduce(
                    (sum, m) => sum + (m?.debit || 0),
                    0
                  );
                  return totalDebit > 0 ? formatCurrency(totalDebit) : "-";
                })()}
              </div>
              <div className="text-right">
                {(() => {
                  const totalClosing = Object.values(monthDataMap).reduce(
                    (sum, m) => sum + (m?.closingBalance || 0),
                    0
                  );
                  return totalClosing > 0
                    ? formatCurrency(totalClosing)
                    : "-";
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Extract View */}
        {selectedView === "extract" && (
          <div
            className={`rounded-lg overflow-hidden ${
              theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
          >
            <div className="overflow-x-auto">
              <div
                className={`${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
              >
                <div
                  className={`p-4 border-b ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h2 className="text-lg font-bold">
                        Extract of All Purchase Vouchers
                      </h2>
                    </div>
                    {extractData && (
                      <div className="text-sm opacity-70">
                        {new Date(extractData.fromDate).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}{" "}
                        to{" "}
                        {new Date(extractData.toDate).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {loadingExtract ? (
                  <div className="p-8 text-center">
                    <p>Loading extract data...</p>
                  </div>
                ) : (selectedParty ||
                    selectedPurchaseAccount ||
                    selectedTaxType) &&
                  extractData ? (
                  <div>
                    <div
                      className={`p-4 border-b ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <button
                          onClick={() => {
                            setSelectedParty(null);
                            setSelectedPurchaseAccount(null);
                            setSelectedTaxType(null);
                          }}
                          className={`p-2 rounded-md ${
                            theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-200"
                          }`}
                          title="Back to Extract View"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="text-lg font-bold">
                            Select Ledger Vouchers
                          </h2>
                          <p className="text-sm opacity-70">
                            Ledger :{" "}
                            {selectedParty?.partyName ||
                              selectedPurchaseAccount?.ledgerName ||
                              (selectedTaxType === "cgst"
                                ? "14% Cgst"
                                : selectedTaxType === "sgst"
                                ? "14% Sgst"
                                : selectedTaxType === "igst"
                                ? "IGST"
                                : "")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <table className="w-full">
                      <thead
                        className={`${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Particulars
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Vch Type
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Vch No.
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Debit
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let filteredVouchers = extractData.vouchers;

                          if (selectedParty) {
                            filteredVouchers = filteredVouchers.filter(
                              (voucher: any) =>
                                voucher.partyName === selectedParty.partyName
                            );
                          } else if (selectedPurchaseAccount) {
                            filteredVouchers = filteredVouchers.filter(
                              (voucher: any) =>
                                voucher.purchaseLedgerName ===
                                selectedPurchaseAccount.ledgerName
                            );
                          } else if (selectedTaxType) {
                            filteredVouchers = extractData.vouchers;
                          }

                          return filteredVouchers
                            .map((voucher: any, index: number) => {
                              let creditAmount = 0;
                              let debitAmount = 0;
                              let particulars = "-";

                              if (selectedParty) {
                                creditAmount = parseFloat(voucher.total) || 0;
                                particulars = voucher.purchaseLedgerName || "-";
                              } else if (selectedPurchaseAccount) {
                                debitAmount =
                                  parseFloat(voucher.subtotal) || 0;
                                particulars = voucher.partyName || "-";
                              } else if (selectedTaxType) {
                                if (selectedTaxType === "cgst") {
                                  debitAmount =
                                    parseFloat(voucher.cgstTotal) || 0;
                                } else if (selectedTaxType === "sgst") {
                                  debitAmount =
                                    parseFloat(voucher.sgstTotal) || 0;
                                } else if (selectedTaxType === "igst") {
                                  debitAmount =
                                    parseFloat(voucher.igstTotal) || 0;
                                }
                                particulars = voucher.partyName || "-";
                              }

                              if (debitAmount === 0 && creditAmount === 0)
                                return null;

                              return (
                                <tr
                                  key={index}
                                  className={`border-t ${
                                    theme === "dark"
                                      ? "border-gray-700"
                                      : "border-gray-200"
                                  }`}
                                >
                                  <td className="px-4 py-2">
                                    {new Date(voucher.date).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "numeric",
                                        month: "numeric",
                                        year: "numeric",
                                      }
                                    )}
                                  </td>
                                  <td className="px-4 py-2">{particulars}</td>
                                  <td className="px-4 py-2">Purchase</td>
                                  <td className="px-4 py-2">
                                    {voucher.voucherNo}
                                  </td>
                                  <td className="px-4 py-2 text-right font-mono">
                                    {debitAmount > 0
                                      ? formatCurrency(debitAmount)
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 text-right font-mono">
                                    {creditAmount > 0
                                      ? formatCurrency(creditAmount)
                                      : "-"}
                                  </td>
                                </tr>
                              );
                            })
                            .filter((row: any) => row !== null);
                        })()}
                      </tbody>
                    </table>
                  </div>
                ) : extractData ? (
                  <table className="w-full">
                    <thead
                      className={`${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">
                          Particulars
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Debit Amt.
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Credit Amt.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Sundry Creditors Group */}
                      <tr
                        className={`${
                          theme === "dark" ? "bg-gray-800" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-2 font-semibold">
                          Sundry Creditors
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      {extractData.sundryCreditors.map(
                        (party: any, index: number) => (
                          <tr
                            key={index}
                            onClick={() =>
                              setSelectedParty({
                                partyName: party.partyName,
                                partyGSTIN: party.partyGSTIN,
                              })
                            }
                            className={`border-t cursor-pointer transition-colors ${
                              theme === "dark"
                                ? "border-gray-700 hover:bg-gray-700"
                                : "border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <td className="px-4 py-2 pl-8">
                              {party.partyName}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {formatCurrency(party.debit)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {formatCurrency(party.credit)}
                            </td>
                          </tr>
                        )
                      )}

                      {/* Purchase Accounts Group */}
                      <tr
                        className={`border-t-2 ${
                          theme === "dark"
                            ? "border-gray-600 bg-gray-800"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <td className="px-4 py-2 font-semibold">
                          Purchase Accounts
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      {extractData.purchaseAccounts.map(
                        (account: any, index: number) => (
                          <tr
                            key={index}
                            onClick={() =>
                              setSelectedPurchaseAccount({
                                ledgerName: account.ledgerName,
                              })
                            }
                            className={`border-t cursor-pointer transition-colors ${
                              theme === "dark"
                                ? "border-gray-700 hover:bg-gray-700"
                                : "border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <td className="px-4 py-2 pl-8">
                              {account.ledgerName}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {formatCurrency(account.debit)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              -
                            </td>
                          </tr>
                        )
                      )}

                      {/* Current Assets Group */}
                      <tr
                        className={`border-t-2 ${
                          theme === "dark"
                            ? "border-gray-600 bg-gray-800"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <td className="px-4 py-2 font-semibold">
                          Current Assets
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      <tr
                        className={`border-t ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        <td className="px-4 py-2 pl-8">Duties & Taxes</td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      {extractData.currentAssets.cgst > 0 && (
                        <tr
                          onClick={() => setSelectedTaxType("cgst")}
                          className={`border-t cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <td className="px-4 py-2 pl-12">14% Cgst</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatCurrency(extractData.currentAssets.cgst)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">-</td>
                        </tr>
                      )}
                      {extractData.currentAssets.sgst > 0 && (
                        <tr
                          onClick={() => setSelectedTaxType("sgst")}
                          className={`border-t cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <td className="px-4 py-2 pl-12">14% Sgst</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatCurrency(extractData.currentAssets.sgst)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">-</td>
                        </tr>
                      )}
                      {extractData.currentAssets.igst > 0 && (
                        <tr
                          onClick={() => setSelectedTaxType("igst")}
                          className={`border-t cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <td className="px-4 py-2 pl-12">IGST</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatCurrency(extractData.currentAssets.igst)}
                          </td>
                          <td className="px-4 py-2 text-right font-mono">-</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot
                      className={`border-t-2 ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-100 border-gray-300"
                      }`}
                    >
                      <tr className="font-bold">
                        <td className="px-4 py-3 text-right">Grand Total :</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(extractData.totals.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(extractData.totals.grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="p-8 text-center">
                    <p className="opacity-70">
                      Click on a month or use filters to view extract data
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExtractPurchase;

