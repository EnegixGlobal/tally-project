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

const TrialBalance: React.FC = () => {
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [taxData, setTaxData] = useState<Record<number, { debit: number; credit: number }>>({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"consolidated" | "monthly">(
    "consolidated"
  );
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  // Base groups as per original logic
  const baseGroups = [
    { id: -1, name: "Bank Accounts", nature: "Assets" },
    { id: -2, name: "Bank OD A/c", nature: "Assets" },
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
    { id: -18, name: "Profit/Loss", nature: "Liabilities" },
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
          throw new Error("Failed to load ledgers data");
        }

        const data = await res.json();
        setResolvedGroupName("Trial Balance");
        setLedgers(data || []);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Unexpected error");
        setLedgers([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGroupSummary();
  }, [companyId, ownerType, ownerId]);



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
        setTaxData(normalizedData);

      } catch (err) {

        console.error("API Error:", err);

      }
    };

    fetchTaxData();

  }, [companyId, ownerType, ownerId, ledgers]);

  // Calculate Group Summaries for Level 1
  const groupSummaries = React.useMemo(() => {
    const summary: Record<number, { name: string; debit: number; credit: number; ledgers: Ledger[] }> = {};

    ledgers.forEach((ledger) => {
      const gid = Number(ledger.groupId || ledger.group_id);
      if (!summary[gid]) {
        const groupObj = groups.find((g) => Number(g.id) === gid) || baseGroups.find(g => g.id === gid);
        summary[gid] = {
          name: groupObj?.name || "Ungrouped",
          debit: 0,
          credit: 0,
          ledgers: []
        };
      }
      const balance = taxData[ledger.id] || { debit: 0, credit: 0 };
      summary[gid].debit += balance.debit;
      summary[gid].credit += balance.credit;
      summary[gid].ledgers.push(ledger);
    });

    return summary;
  }, [ledgers, taxData, groups]);

  // Total Calculation
  const totalDebit = Object.values(taxData).reduce(
    (sum: number, t: any) => sum + (t.debit || 0),
    0
  );

  const totalCredit = Object.values(taxData).reduce(
    (sum: number, t: any) => sum + (t.credit || 0),
    0
  );

  const [theme] = useState<"light" | "dark">("light");

  const toggleGroup = (groupId: number) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => {
            if (expandedGroupId) setExpandedGroupId(null);
            else navigate("/app/reports");
          }}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Trial Balance</h1>
        <div className="ml-auto flex space-x-2">
          <button title="Toggle Filters" type="button" onClick={() => setShowFilterPanel(!showFilterPanel)} className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}>
            <Filter size={18} />
          </button>
          <button title="Print Report" type="button" className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><Printer size={18} /></button>
          <button title="Download Report" type="button" className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><Download size={18} /></button>
        </div>
      </div>

      {showFilterPanel && (
        <div className={`p-4 mb-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">As on Date</label>
              <input title="Select Date" type="date" className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Period</label>
              <select title="Select Period" className={`w-full p-2 rounded border ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}>
                <option value="current-year">Current Financial Year</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Group Summary Table */}
      <div className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-2">Detailed Trial Balance</h2>
          <p className="text-sm opacity-75">As of {new Date().toLocaleDateString()}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === "dark" ? "border-b border-gray-700" : "border-b-2 border-gray-300"}`}>
                <th className="px-4 py-3 text-left">Particulars</th>
                <th className="px-4 py-3 text-right">Debit</th>
                <th className="px-4 py-3 text-right">Credit</th>
                <th className="px-4 py-3 text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupSummaries).map(([groupIdStr, summary]) => {
                const groupId = Number(groupIdStr);
                const isExpanded = expandedGroupId === groupId;
                const closingGroup = Math.abs(summary.debit - summary.credit);

                return (
                  <React.Fragment key={groupId}>
                    {/* Group Header Row */}
                    <tr
                      onClick={() => toggleGroup(groupId)}
                      className={`cursor-pointer transition-colors ${theme === "dark" ? "bg-gray-700 hover:bg-gray-600" : "bg-blue-50 hover:bg-blue-100"
                        } font-bold`}
                    >
                      <td className="px-4 py-3">
                        {isExpanded ? "▼ " : "► "}
                        {summary.name}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        ₹ {summary.debit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        ₹ {summary.credit.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        ₹ {closingGroup.toLocaleString()} {summary.debit >= summary.credit ? "Dr" : "Cr"}
                      </td>
                    </tr>

                    {/* Drill-down Ledgers */}
                    {isExpanded && summary.ledgers.map((ledger) => {
                      const balance = taxData[ledger.id] || { debit: 0, credit: 0 };
                      const closing = Math.abs(balance.debit - balance.credit);
                      return (
                        <tr
                          key={ledger.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/reports/ledger/${ledger.id}`);
                          }}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                        >
                          <td className="px-12 py-2 text-sm italic text-gray-700">
                            {ledger.name}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-sm text-green-600">
                            ₹ {balance.debit.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-sm text-red-600">
                            ₹ {balance.credit.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-sm">
                            ₹ {closing.toLocaleString()} {balance.debit >= balance.credit ? "Dr" : "Cr"}
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>

            <tfoot>
              <tr className={`font-bold ${theme === "dark" ? "border-t-2 border-gray-600" : "border-t-2 border-gray-300"}`}>
                <td className="px-4 py-3">Grand Total</td>
                <td className="px-4 py-3 text-right font-mono">₹ {totalDebit.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono">₹ {totalCredit.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-mono font-bold">
                  ₹ {Math.abs(totalDebit - totalCredit).toLocaleString()} {totalDebit >= totalCredit ? "Dr" : "Cr"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Trial Balance Totals Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        <div className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white shadow"}`}>
          <p className="text-sm opacity-75">Total Debit</p>
          <p className="text-2xl font-bold text-green-600">₹ {totalDebit.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white shadow"}`}>
          <p className="text-sm opacity-75">Total Credit</p>
          <p className="text-2xl font-bold text-red-600">₹ {totalCredit.toLocaleString()}</p>
        </div>
        <div className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white shadow"}`}>
          <p className="text-sm opacity-75">Difference in Balance</p>
          <p className="text-2xl font-bold">₹ {Math.abs(totalDebit - totalCredit).toLocaleString()}</p>
        </div>
      </div>

      <div className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"}`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Click on a Group (e.g., Purchase Account) to see individual ledgers. Click on a Ledger to view its detailed report.
        </p>
      </div>
    </div>
  );
};

export default TrialBalance;
