import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Search, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LedgerOutstanding {
  ledger_id: number;
  ledger_name: string;
  ledger_group_name: string;
  opening_balance: string;
  balance_type: "debit" | "credit";

  vouchers: {
    source: "sales" | "purchase";
    voucher_id: number;
    date: string;
    total: number;
  }[];
}

const OutstandingPayables: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  // Filters & search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchLedgerGroups = async () => {
      const companyId = localStorage.getItem("company_id");
      const ownerType = localStorage.getItem("supplier");
      const ownerId = localStorage.getItem(
        ownerType === "employee" ? "employee_id" : "user_id"
      );

      if (!companyId || !ownerType || !ownerId) {
        setGroups([]);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger-groups?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch ledger groups");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          setGroups([]);
          return;
        }

        const sundryDebtorsGroup = data.filter((g) => {
          if (!g?.name) return false;

          const normalizedName = g.name.toLowerCase().replace(/\s+/g, ""); // remove spaces

          return normalizedName === "sundrycreditors";
        });

        // ✅ ONLY Sundry creditors saved
        setGroups(sundryDebtorsGroup);
        if (sundryDebtorsGroup.length > 0) {
          setSelectedGroup(String(sundryDebtorsGroup[0].id));
        }
      } catch (err) {
        console.error("Failed to load ledger groups", err);
        setGroups([]);
      }
    };

    fetchLedgerGroups();
  }, []);

  // Data, loading, error states
  const [customersData, setCustomersData] = useState<LedgerOutstanding[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend API whenever dependencies change
  useEffect(() => {
    async function fetchOutstandingData() {
      setLoading(true);
      setError(null);

      const company_id = localStorage.getItem("company_id") || "";
      const owner_type = localStorage.getItem("supplier") || "";
      const owner_id =
        localStorage.getItem(
          owner_type === "employee" ? "employee_id" : "user_id"
        ) || "";

      if (!company_id || !owner_type || !owner_id) {
        setError("Missing tenant information.");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append("company_id", company_id);
        params.append("owner_type", owner_type);
        params.append("owner_id", owner_id);

        if (searchTerm) params.append("searchTerm", searchTerm);
        if (selectedGroup) params.append("customerGroup", selectedGroup);
        if (selectedRisk) params.append("riskCategory", selectedRisk);

        const url = `${import.meta.env.VITE_API_URL
          }/api/outstanding-receivables?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Error: ${response.status}`);
        }

        const data: LedgerOutstanding[] = await response.json();

        setCustomersData(data);
      } catch (e: any) {
        setError(e.message || "Failed to load data");
        setCustomersData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOutstandingData();
  }, [searchTerm, selectedGroup, selectedRisk]);

  // Filter & sort data client-side
  const filteredData = useMemo(() => {
    let filtered = customersData;

    if (searchTerm) {
      const lc = searchTerm.toLowerCase();
      filtered = filtered.filter((c) =>
        c.ledger_name.toLowerCase().includes(lc)
      );
    }

    return filtered;
  }, [customersData, searchTerm]);

  // Formatter for currency
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  const calculateTotals = (ledger: LedgerOutstanding) => {
    const vouchers = Array.isArray(ledger.vouchers) ? ledger.vouchers : [];

    const totalVoucherAmount = vouchers.reduce((sum, v) => sum + Number(v.total), 0);

    // For Sundry Creditors (Payables):
    // Normally Credit Balance.
    // Purchases increase the balance (Credit).

    // Assuming 'vouchers' here are credits (Purchases).
    // If the API allows, we should ensure we are adding credits.

    // Closing Balance logic:
    let closingBalance = 0;

    if (ledger.balance_type === "credit") {
      // Normal case for creditors: Opening Credit + New Purchase Credit
      closingBalance = Number(ledger.opening_balance) + totalVoucherAmount;
    } else {
      // Rare case: Debit opening (advance) -> Purchase reduces the debit or flips to credit?
      // Let's stick to the arithmetic: Opening(Dr) is treated as negative in credit world? 
      // Simpler: Just standard subtraction if it's debit balance.
      closingBalance = Number(ledger.opening_balance) - totalVoucherAmount;
      // Note: This logic depends heavily on how 'opening_balance' is stored (unsigned vs signed).
      // Assuming unsigned + 'balance_type'.
    }

    return { closingBalance };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className={`rounded-xl border p-6 ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"
                }`}
            >
              Payables Outstanding
            </h2>
            <p
              className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
            >
              Party-wise outstanding payables summary - Tally Style
            </p>

          </div>
        </div>
        {loading && (
          <div className="mt-4 p-3 text-center text-sm text-gray-500">
            Loading outstanding payables...
          </div>
        )}
        {error && (
          <div className="mt-4 p-3 text-center text-sm text-red-500">
            {error}
          </div>
        )}{" "}
      </div>
      {/* Filters */}
      <div
        className={`rounded-xl border p-6 ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}
      >
        <h3
          className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"
            }`}
        >
          Filters & Search
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search
              className={`absolute left-3 top-2.5 w-4 h-4 ${theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}
            />
            <input
              type="text"
              placeholder="Search customers, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full ${theme === "dark"
                ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                }`}
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            aria-label="Filter by customer group"
            disabled={groups.length === 1}
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${theme === "dark"
              ? "border-gray-600 bg-gray-700 text-white"
              : "border-gray-300 bg-white text-gray-900"
              }`}
          >
            {/* Removed All Groups option */}

            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {/* Customer-wise Data Table */}
      <div
        className={`rounded-xl border ${theme === "dark"
          ? "bg-gray-800 border-gray-700"
          : "bg-white border-gray-200"
          }`}
      >
        <div
          className={`px-6 py-4 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}
        >
          <h3
            className={`text-lg font-semibold ${theme === "dark" ? "text-white" : "text-gray-900"
              }`}
          >
            Supplier-wise Outstanding Details
          </h3>
        </div>
        <div className="overflow-x-auto rounded-xl border dark:border-gray-700 border-gray-200">
          <table className="min-w-[800px] w-full border-collapse">
            {/* ================= THEAD ================= */}
            <thead className={theme === "dark" ? "bg-gray-800" : "bg-gray-100"}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[70%]">
                  Supplier
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider w-[30%]">
                  Closing Balance
                </th>
              </tr>
            </thead>

            {/* ================= TBODY ================= */}
            <tbody
              className={
                theme === "dark"
                  ? "divide-y divide-gray-700"
                  : "divide-y divide-gray-200"
              }
            >
              {filteredData.map((ledger) => {
                const { closingBalance } = calculateTotals(ledger);

                return (
                  <tr
                    key={ledger.ledger_id}
                    className={`cursor-pointer ${theme === "dark"
                      ? "hover:bg-gray-800"
                      : "hover:bg-gray-50"
                      }`}
                    onClick={() =>
                      navigate(
                        `/app/reports/ledger/${ledger.ledger_id}`
                      )
                    }
                  >
                    {/* CUSTOMER NAME */}
                    <td className="px-4 py-4 align-top">
                      <div className="font-medium text-sm text-blue-600 dark:text-blue-400 hover:underline">
                        {ledger.ledger_name}
                      </div>
                    </td>

                    {/* CLOSING BALANCE */}
                    <td className="px-4 py-4 text-right">
                      <div className="font-semibold">
                        {formatCurrency(closingBalance)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OutstandingPayables;
