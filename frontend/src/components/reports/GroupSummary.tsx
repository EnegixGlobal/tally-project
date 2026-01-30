import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";

interface Ledger {
  id: number;
  name: string;
  group_id: number;
  balanceType: "debit" | "credit";
  groupName: string | null;
  groupType: string | null;
  groupNature: string | null;
  createdAt?: string;
  closingBalance?: number;
  address?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  panNumber?: string;
  groupId?: number;
  debit?: number;
  credit?: number;

}

const GroupSummary: React.FC = () => {
  const navigate = useNavigate();
  const { groupType } = useParams<{ groupType: string }>();
  const groupIdFromUrl = Number(groupType);

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [taxData, setTaxData] = useState<Record<number, { debit: number; credit: number }>>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"consolidated" | "monthly" | "particular">(
    "consolidated"
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  // Base groups as per original logic
  const baseGroups = [
    { id: -1, name: "Branch Accounts", nature: "Assets" },
    { id: -2, name: "Branch OD A/c", nature: "Assets" },
    { id: -3, name: "Branch/Division", nature: "Assets" },
    { id: -4, name: "Capital Account", nature: "Liabilities" },
    { id: -5, name: "Current Assets", nature: "Assets" },
    { id: -6, name: "Current Liabilities", nature: "Liabilities" },
    { id: -7, name: "Direct Expenses", nature: "Expenses" },
    { id: -8, name: "Direct Income", nature: "Income" },
    { id: -9, name: "Fixed Assets", nature: "Assets" },
    { id: -10, name: "Indirect Expenses", nature: "Expenses" },
    { id: -11, name: "Indirect Income", nature: "Income" },
    { id: -12, name: "Investments", nature: "Assets" },
    { id: -13, name: "Loan(Liability)", nature: "Liabilities" },
    { id: -14, name: "Misc expenses (Assets)", nature: "Assets" },
    { id: -15, name: "Purchase Accounts", nature: "Expenses" },
    { id: -16, name: "Sales Accounts", nature: "Income" },
    { id: -17, name: "Suspense A/C", nature: "Assets" },
  ];

  // Fetch ledger groups and ledgers filtered by groupType (optional)
  const [resolvedGroupName, setResolvedGroupName] = useState<string>("");

  //get groupName
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchLedgerGroups = async () => {
      if (!companyId || !ownerType || !ownerId) {
        setGroups([]);
        return;
      }

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger-groups?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch ledger groups");
        }

        const data = await res.json();
        // console.log("this is ledger groups data", data);
        setGroups(data || []);
      } catch (err) {
        console.error("Failed to load ledger groups", err);
        setGroups([]);
      }
    };

    fetchLedgerGroups();
  }, [companyId, ownerType, ownerId]);

  //get all ledger
  useEffect(() => {
    async function fetchGroupSummary() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        if (!res.ok) {
          throw new Error("Failed to load group summary data");
        }

        const data = await res.json();
        // console.log('this is ledger', data)

        const groupIdFromUrl = Number(groupType);

        let resolvedName = "Unknown Group";

        /* ===============================
         BASE GROUPS (Negative ID)
      ================================ */
        if (groupIdFromUrl < 0) {
          const matchedBaseGroup = baseGroups.find(
            (g) => g.id === groupIdFromUrl
          );

          if (matchedBaseGroup) {
            resolvedName = matchedBaseGroup.name;
          }
        }

        /* ===============================
         LEDGER GROUPS (Positive ID)
      ================================ */
        if (groupIdFromUrl > 0) {
          const matchedLedgerGroup = groups.find(
            (g) => Number(g.id) === groupIdFromUrl
          );

          if (matchedLedgerGroup) {
            resolvedName = matchedLedgerGroup.name;
          }
        }

        setResolvedGroupName(resolvedName);

        const filteredLedgers = (data || []).filter(
          (item: any) => Number(item.groupId) === groupIdFromUrl
        );

        setLedgers(filteredLedgers);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unexpected error");
        setLedgers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGroupSummary();
  }, [groupType, companyId, ownerType, ownerId, groups]);



  useEffect(() => {

    const fetchTaxData = async () => {

      if (!companyId || !ownerType || !ownerId || !ledgers.length) {
        return;
      }

      try {

        // Ledger IDs
        const ledgerIds = ledgers.map(item => item.id).join(",");

        const url =
          `${import.meta.env.VITE_API_URL}/api/group` +
          `?company_id=${companyId}` +
          `&owner_type=${ownerType}` +
          `&owner_id=${ownerId}` +
          `&ledgerIds=${ledgerIds}`;

        const res = await fetch(url);

        if (!res.ok) {
          throw new Error("API Failed");
        }

        const data = await res.json();


        // ✅ Normalize keys (e.g., "113.00" -> 113)
        const normalizedData: Record<number, { debit: number; credit: number }> = {};
        if (data.data) {
          Object.keys(data.data).forEach((key) => {
            normalizedData[Number(key)] = data.data[key];
          });
        }
        // console.log('nor', normalizedData)
        setTaxData(normalizedData);

      } catch (err) {

        console.error("API Error:", err);

      }
    };

    fetchTaxData();

  }, [companyId, ownerType, ownerId, ledgers]);

  // Resolve `groupType` param to a numeric group id.
  const resolveGroupId = (param?: string | null): number | null => {
    if (!param) return null;
    const trimmed = param.trim();

    // If param is numeric (handles negative base ids)
    if (/^-?\d+$/.test(trimmed)) return Number(trimmed);

    // Try match with baseGroups by name (case-insensitive)
    const base = baseGroups.find(
      (b) => b.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (base) return base.id;

    // Try match with fetched ledgerGroups by name
    const found = groups.find(
      (g) => g.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (found) return found.id;

    return null;
  };

  const resolvedGroupId = resolveGroupId(groupType || null);

  // Filter ledgers belonging to the resolved group id
  const groupLedgers =
    resolvedGroupId !== null
      ? ledgers.filter(
        (ledger) => Number(ledger.groupId || ledger.group_id) === Number(resolvedGroupId)
      )
      : [];





  // Generate monthly-wise data based on creation date
  const generateMonthlyData = (ledger: any) => {
    const months = [
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Jan",
      "Feb",
      "Mar",
    ];

    const opening = Number(ledger.openingBalance || ledger.opening_balance) || 0;
    const ledgerTax = taxData[Number(ledger.id)] || { debit: 0, credit: 0 };
    let creationMonthIndex = 0;

    if (ledger.createdAt) {
      const createdDate = new Date(ledger.createdAt);
      const createdMonth = createdDate.getMonth(); // 0-11 (Jan-Dec)

      if (createdMonth >= 3) {
        creationMonthIndex = createdMonth - 3;
      } else {
        creationMonthIndex = createdMonth + 9;
      }
    }

    return months.map((month, index) => {
      // Heuristic: If we don't have real per-month data, show totals in the creation month
      // or Jan (index 9) for high-visibility during testing/selection.
      const isCreationMonth = index === creationMonthIndex;
      const isJanFallback = index === 9 && !ledger.createdAt; // Temporary visibility for demo

      const shouldShow = isCreationMonth || isJanFallback;

      const monthDebit = shouldShow ? ledgerTax.debit : 0;
      const monthCredit = shouldShow ? ledgerTax.credit : 0;
      const monthOpening = shouldShow ? opening : 0;

      // Net change for this ledger in this month
      const netChange = monthDebit - monthCredit;
      const monthClosing = isCreationMonth ? (monthOpening + netChange) : 0;

      return {
        month,
        opening: monthOpening,
        debit: monthDebit,
        credit: monthCredit,
        closing: monthClosing,
      };
    });
  };

  const totalDebit = Object.values(taxData).reduce(
    (sum: number, t: any) => sum + (t.debit || 0),
    0
  );


  const totalCredit = Object.values(taxData).reduce(
    (sum: number, t: any) => sum + (t.credit || 0),
    0
  );

  // You can replace this with your actual theme logic or context
  const [theme] = useState<"light" | "dark">("light");

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Group Summary"
          type="button"
          onClick={() => navigate("/app/reports/group-summary")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">
          {" "}
          {resolvedGroupName || `Group ${groupType}`} - Group Summary
        </h1>
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
            type="button"
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
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                As on Date
              </label>
              <input
                title="Select Date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
                  }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Period</label>
              <select
                title="Select Period"
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
                  }`}
              >
                <option value="current-year">Current Financial Year</option>
                <option value="previous-year">Previous Financial Year</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* View Mode Controls */}
      <div
        className={`mb-6 flex items-center justify-between p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <div className="flex items-center space-x-4">
          <span className="font-semibold">View Mode:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode("consolidated")}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === "consolidated"
                ? theme === "dark"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-600 text-white"
                : theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Without Monthly-wise
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === "monthly"
                ? theme === "dark"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-600 text-white"
                : theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Month-wise
            </button>
            <button
              onClick={() => {
                if (selectedMonth === null) setSelectedMonth(9); // Default to Jan if nothing selected
                setViewMode("particular");
              }}
              className={`px-4 py-2 rounded-md transition-colors ${viewMode === "particular"
                ? theme === "dark"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-600 text-white"
                : theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Particular
            </button>
          </div>
        </div>
        <div className="text-sm opacity-75">
          {viewMode === "consolidated"
            ? "Showing consolidated view"
            : viewMode === "monthly"
              ? "Showing monthly summary"
              : "Showing ledger breakdown for selected month"}
        </div>
      </div>

      {/* Group Summary Table */}
      <div
        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">
            {" "}
            {resolvedGroupName || `Group ${groupType}`}
          </h2>
          <p className="text-sm opacity-75">
            As of {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="overflow-x-auto">
          {viewMode === "consolidated" ? (
            // Consolidated View (existing table)
            <table className="w-full">
              <thead>
                <tr
                  className={`${theme === "dark"
                    ? "border-b border-gray-700"
                    : "border-b-2 border-gray-300"
                    }`}
                >
                  <th className="px-4 py-3 text-left">Ledger Name</th>
                  <th className="px-4 py-3 text-left">Group</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgers.map((ledger) => (
                  <tr
                    key={ledger.id}
                    onClick={() =>
                      navigate(`/app/reports/ledger/${ledger.id}`)
                    }
                    className="border-b border-gray-200 cursor-pointer hover:bg-gray-100"
                  >
                    {/* Ledger Name */}
                    <td className="px-4 py-3 font-medium">{ledger.name}</td>

                    {/* Group */}
                    <td className="px-4 py-3 font-medium">
                      {resolvedGroupName || `Group ${groupType}`}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-green-600">
                      ₹ {(taxData[Number(ledger.id)]?.debit || 0).toLocaleString()}
                    </td>

                    <td className="px-4 py-3 text-right font-mono text-red-600">
                      ₹ {(taxData[Number(ledger.id)]?.credit || 0).toLocaleString()}
                    </td>

                    {/* Closing */}
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      ₹ {Math.abs(
                        (taxData[Number(ledger.id)]?.debit || 0) -
                        (taxData[Number(ledger.id)]?.credit || 0)
                      ).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr
                  className={`font-bold ${theme === "dark"
                    ? "border-t-2 border-gray-600"
                    : "border-t-2 border-gray-300"
                    }`}
                >
                  <td className="px-4 py-3" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right font-mono">
                    ₹ {totalDebit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    ₹ {totalCredit.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold">
                    ₹ {Math.abs(totalDebit - totalCredit).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : viewMode === "monthly" ? (
            // Monthly View - Aggregated for the whole group
            <div className={`border rounded-lg p-4 w-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <h3 className="font-bold mb-3 text-blue-600 dark:text-blue-400 text-center">
                {resolvedGroupName || `Group ${groupType}`} Monthly Summary
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"}`}>
                      <th className="px-3 py-2 text-left">Month</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                      <th className="px-3 py-2 text-right">Closing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const months = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
                      const aggregatedData = months.map((month, idx) => {
                        let totalDebit = 0;
                        let totalCredit = 0;
                        let totalClosing = 0;
                        ledgers.forEach((ledger) => {
                          const monthlyData = generateMonthlyData(ledger);
                          const m = monthlyData[idx];
                          totalDebit += m.debit;
                          totalCredit += m.credit;
                          totalClosing += m.closing;
                        });
                        return { month, debit: totalDebit, credit: totalCredit, closing: totalClosing };
                      });

                      return aggregatedData.map((monthData, index) => (
                        <tr
                          key={index}
                          onClick={() => {
                            setSelectedMonth(index);
                            setViewMode("particular");
                          }}
                          className={`${theme === "dark"
                            ? "border-b border-gray-700 hover:bg-gray-800"
                            : "border-b border-gray-200 hover:bg-blue-50"
                            } cursor-pointer transition-colors`}
                        >
                          <td className="px-3 py-2 flex items-center font-medium">
                            <span className="mr-2 text-blue-500 text-[10px]">▶</span>
                            {monthData.month}
                          </td>
                          <td className="px-3 py-2 text-right font-mono">₹ {monthData.debit.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono">₹ {monthData.credit.toLocaleString()}</td>
                          <td className="px-3 py-2 text-right font-mono">₹ {Math.abs(monthData.closing).toLocaleString()}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // Particular View (Drill-down for a month)
            <div className="p-4 border rounded bg-white">

              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-lg">
                  Particulars - {[
                    "Apr", "May", "Jun", "Jul", "Aug", "Sep",
                    "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
                  ][selectedMonth ?? 0]}
                </h4>

                <div className="flex items-center gap-2">
                  <select
                    value={selectedMonth ?? 0}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="border px-2 py-1 text-sm rounded"
                  >
                    {[
                      "Apr", "May", "Jun", "Jul", "Aug", "Sep",
                      "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"
                    ].map((m, i) => (
                      <option key={m} value={i}>{m}</option>
                    ))}
                  </select>

                  <button
                    onClick={() => setViewMode("monthly")}
                    className="border px-3 py-1 text-sm rounded hover:bg-gray-100"
                  >
                    Back
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-300">

                  <thead className="bg-gray-100 border-b">
                    <tr>
                      <th className="px-3 py-2 text-left">Ledger</th>
                      <th className="px-3 py-2 text-left">Group</th>
                      <th className="px-3 py-2 text-right">Debit</th>
                      <th className="px-3 py-2 text-right">Credit</th>
                      <th className="px-3 py-2 text-right">Closing</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(() => {

                      const idx = selectedMonth ?? 0;

                      const activeLedgers = ledgers.filter((ledger) => {
                        const data = generateMonthlyData(ledger)[idx];
                        return data.debit !== 0 || data.credit !== 0;
                      });

                      if (activeLedgers.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-gray-500">
                              No data for this month
                            </td>
                          </tr>
                        );
                      }

                      return activeLedgers.map((ledger) => {

                        const mData = generateMonthlyData(ledger)[idx];

                        return (
                          <tr
                            key={ledger.id}
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() =>
                              navigate(`/app/reports/ledger/${ledger.id}`)
                            }
                          >
                            <td className="px-3 py-2">{ledger.name}</td>

                            <td className="px-3 py-2">
                              {resolvedGroupName}
                            </td>

                            <td className="px-3 py-2 text-right">
                              ₹ {mData.debit.toLocaleString()}
                            </td>

                            <td className="px-3 py-2 text-right">
                              ₹ {mData.credit.toLocaleString()}
                            </td>

                            <td className="px-3 py-2 text-right font-medium">
                              ₹ {Math.abs(mData.closing).toLocaleString()}
                            </td>
                          </tr>
                        );
                      });

                    })()}
                  </tbody>

                  {/* Footer */}
                  {(() => {

                    const idx = selectedMonth ?? 0;

                    const entries = ledgers.map(
                      (l) => generateMonthlyData(l)[idx]
                    );

                    const tDebit = entries.reduce((s, e) => s + e.debit, 0);
                    const tCredit = entries.reduce((s, e) => s + e.credit, 0);
                    const tClosing = entries.reduce((s, e) => s + e.closing, 0);

                    if (tDebit === 0 && tCredit === 0) return null;

                    return (
                      <tfoot className="bg-gray-100 border-t font-semibold">
                        <tr>
                          <td colSpan={2} className="px-3 py-2">
                            Total
                          </td>

                          <td className="px-3 py-2 text-right">
                            ₹ {tDebit.toLocaleString()}
                          </td>

                          <td className="px-3 py-2 text-right">
                            ₹ {tCredit.toLocaleString()}
                          </td>

                          <td className="px-3 py-2 text-right">
                            ₹ {Math.abs(tClosing).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    );
                  })()}

                </table>
              </div>

            </div>
          )}


        </div>
      </div>

      {/* Group Totals Summary */}
      <div
        className={`mt-6 p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <div className="flex justify-between">
          <h2 className="text-xl font-bold mb-4">Group Summary</h2>
          <div>
            <p className="text-sm opacity-75">Total Debit</p>
            <p className="text-xl font-bold">₹ {totalDebit.toLocaleString()}</p>
          </div>

          <div>
            <p className="text-sm opacity-75">Total Credit</p>
            <p className="text-xl font-bold">₹ {totalCredit.toLocaleString()}</p>
          </div>

          <div>
            <p className="text-sm opacity-75">Closing Balance</p>
            <p className="text-xl font-bold">
              ₹ {Math.abs(totalDebit - totalCredit).toLocaleString()}
            </p>
          </div>
          <div className="mt-4">
            <p className="text-sm opacity-75">
              Number of Ledgers: {ledgers.length}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
          }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Click on any ledger to
          view detailed ledger report. Use view mode buttons to switch between
          consolidated and monthly-wise views. Press F5 to refresh, F12 to
          configure display options.
        </p>
      </div>
    </div>
  );
};

export default GroupSummary;
