import React, { useState, useMemo, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Search, Download, Eye } from "lucide-react";

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

const OutstandingReceivables: React.FC = () => {
  const { theme } = useAppContext();

  // Filters & search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedRisk, setSelectedRisk] = useState("");
  const [groups, setGroups] = useState<any[]>([]);
  const [expandedLedgerId, setExpandedLedgerId] = useState<number | null>(null);
  const [ledgerVouchers, setLedgerVouchers] = useState<
    Record<
      number,
      {
        purchase: any[];
        sales: any[];
      }
    >
  >({});

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
          `${
            import.meta.env.VITE_API_URL
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

          return normalizedName === "sundrydebtors";
        });

        // ✅ ONLY Sundry Debtors saved
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

  console.log("groups", groups);

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

        const url = `${
          import.meta.env.VITE_API_URL
        }/api/outstanding-receivables?${params.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Error: ${response.status}`);
        }

        const data: CustomerOutstanding[] = await response.json();

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

  console.log("customerdata", customersData);

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

    const purchaseTotal = vouchers.reduce((sum, v) => sum + Number(v.total), 0);

    const outstanding =
      ledger.balance_type === "debit"
        ? Number(ledger.opening_balance) - purchaseTotal
        : purchaseTotal - Number(ledger.opening_balance);

    return { purchaseTotal, outstanding };
  };

  // get purchse ledger vouche data

  const handleViewClick = async (ledgerId: number) => {
    // toggle close
    if (expandedLedgerId === ledgerId) {
      setExpandedLedgerId(null);
      return;
    }

    setExpandedLedgerId(ledgerId);

    // 🛡️ ensure default structure immediately (prevents undefined.length error)
    if (!ledgerVouchers[ledgerId]) {
      setLedgerVouchers((prev) => ({
        ...prev,
        [ledgerId]: {
          purchase: [],
          sales: [],
        },
      }));
    } else {
      // cache hit → no API call
      return;
    }

    try {
      const company_id = localStorage.getItem("company_id") || "";
      const owner_type = localStorage.getItem("supplier") || "";
      const owner_id =
        localStorage.getItem(
          owner_type === "employee" ? "employee_id" : "user_id"
        ) || "";

      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/outstanding-receivables/${ledgerId}` +
          `?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
      );

      if (!res.ok) throw new Error("Failed to fetch vouchers");

      const data = await res.json();
      console.log("voucher api data", data);

      setLedgerVouchers((prev) => ({
        ...prev,
        [ledgerId]: {
          purchase: Array.isArray(data.purchase) ? data.purchase : [],
          sales: Array.isArray(data.sales) ? data.sales : [],
        },
      }));
    } catch (err) {
      console.error("Voucher fetch error", err);

      // 🛡️ fallback safe state (never undefined)
      setLedgerVouchers((prev) => ({
        ...prev,
        [ledgerId]: {
          purchase: [],
          sales: [],
        },
      }));
    }
  };

  console.log("ledgerVoucher", ledgerVouchers);

  //get all total
  const getPurchaseTotals = (ledgerId: number) => {
    const list = ledgerVouchers[ledgerId]?.purchase || [];
    return {
      subtotal: list.reduce((s, x) => s + Number(x.subtotal || 0), 0),
      total: list.reduce((s, x) => s + Number(x.total || 0), 0),
    };
  };

  const getSalesTotals = (ledgerId: number) => {
    const list = ledgerVouchers[ledgerId]?.sales || [];
    return {
      subtotal: list.reduce((s, x) => s + Number(x.subtotal || 0), 0),
      total: list.reduce((s, x) => s + Number(x.total || 0), 0),
    };
  };

  return (
    <div className="space-y-6">
            {/* Header */}     
      <div
        className={`rounded-xl border p-6 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
               
        <div className="flex items-center justify-between mb-6">
                   
          <div>
                       
            <h2
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}
            >
                            Receivables Outstanding            
            </h2>
                       
            <p
              className={`mt-1 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              Party-wise outstanding receivables summary - Tally Style          
               
            </p>
                     
          </div>
                           
        </div>
        {loading && (
          <div className="mt-4 p-3 text-center text-sm text-gray-500">
            Loading outstanding receivables...
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
        className={`rounded-xl border p-6 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
               
        <h3
          className={`text-lg font-semibold mb-4 ${
            theme === "dark" ? "text-white" : "text-gray-900"
          }`}
        >
                    Filters & Search        
        </h3>
                       
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                   
          <div className="relative">
                       
            <Search
              className={`absolute left-3 top-2.5 w-4 h-4 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
                       
            <input
              type="text"
              placeholder="Search customers, GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full ${
                theme === "dark"
                  ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400"
                  : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
              }`}
            />
                     
          </div>
                             
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            aria-label="Filter by customer group"
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              theme === "dark"
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300 bg-white text-gray-900"
            }`}
          >
            <option value="">All Groups</option>

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
        className={`rounded-xl border ${
          theme === "dark"
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
        }`}
      >
               
        <div
          className={`px-6 py-4 border-b ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          }`}
        >
                   
          <h3
            className={`text-lg font-semibold ${
              theme === "dark" ? "text-white" : "text-gray-900"
            }`}
          >
                        Customer-wise Outstanding Details          
          </h3>
                 
        </div>
               
        <div className="overflow-x-auto rounded-xl border dark:border-gray-700 border-gray-200">
          <table className="min-w-[1200px] w-full border-collapse">
            {/* ================= THEAD ================= */}
            <thead className={theme === "dark" ? "bg-gray-800" : "bg-gray-100"}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[26%]">
                  Customer
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider w-[18%]">
                  Outstanding
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[22%]">
                  Ageing
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider w-[18%]">
                  Credit
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider w-[16%]">
                  Actions
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
                const { purchaseTotal, outstanding } = calculateTotals(ledger);

                return (
                  <React.Fragment key={ledger.ledger_id}>
                    {/* ================= MAIN ROW ================= */}
                    <tr
                      className={
                        theme === "dark"
                          ? "hover:bg-gray-800"
                          : "hover:bg-gray-50"
                      }
                    >
                      {/* LEDGER */}
                      <td className="px-4 py-4 align-top">
                        <div className="font-medium text-sm">
                          {ledger.ledger_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {ledger.ledger_group_name}
                        </div>
                      </td>

                      {/* OUTSTANDING */}
                      <td className="px-4 py-4 text-right">
                        <div className="font-semibold">
                          {formatCurrency(outstanding)}
                        </div>
                      </td>

                      {/* AGEING */}
                      <td className="px-4 py-4 text-sm text-gray-400">
                        Ageing not available
                      </td>

                      {/* CREDIT / OPENING */}
                      <td className="px-4 py-4 text-xs text-gray-500">
                        <div>
                          Opening:{" "}
                          {formatCurrency(Number(ledger.opening_balance))}
                        </div>
                        <div>Type: {ledger.balance_type}</div>
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-4 text-center">
                        <div className="flex items-center">
                          <button
                            onClick={() => handleViewClick(ledger.ledger_id)}
                            className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* {expandedLedgerId === ledger.ledger_id && (
                            <span className="ml-2 text-xs text-blue-600 font-medium">
                              Expanded: {ledger.ledger_id}
                            </span>
                          )} */}
                        </div>
                      </td>
                    </tr>

                    {/* ================= EXPANDED ROW ================= */}
                    {expandedLedgerId === ledger.ledger_id && (
                      <tr>
                        <td colSpan={5} className="bg-gray-50 px-6 py-4">
                          {(() => {
                            const purchaseTotals = getPurchaseTotals(
                              ledger.ledger_id
                            );
                            const salesTotals = getSalesTotals(
                              ledger.ledger_id
                            );

                            const hasPurchase =
                              ledgerVouchers[ledger.ledger_id]?.purchase
                                ?.length > 0;
                            const hasSales =
                              ledgerVouchers[ledger.ledger_id]?.sales?.length >
                              0;

                            if (!hasPurchase && !hasSales) {
                              return (
                                <div className="text-sm text-gray-400">
                                  No transactions available
                                </div>
                              );
                            }

                            return (
                              <table className="w-full text-sm border">
                                <thead className="bg-gray-200">
                                  <tr>
                                    <th className="px-3 py-2 text-left">
                                      Date
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                      Voucher Type
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                      Voucher No
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                      Party
                                    </th>
                                    <th className="px-3 py-2 text-left">
                                      Reference No
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                      Subtotal
                                    </th>
                                    <th className="px-3 py-2 text-right">
                                      Total
                                    </th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {/* ================= PURCHASE ================= */}
                                  {ledgerVouchers[
                                    ledger.ledger_id
                                  ].purchase.map((tx, idx) => (
                                    <tr
                                      key={`purchase-${idx}`}
                                      className="border-t"
                                    >
                                      <td className="px-3 py-2">
                                        {tx.date
                                          ? new Date(
                                              tx.date
                                            ).toLocaleDateString("en-IN")
                                          : "-"}
                                      </td>
                                      <td className="px-3 py-2 text-blue-600 font-medium">
                                        purchase
                                      </td>
                                      <td className="px-3 py-2">
                                        {tx.number || "-"}
                                      </td>
                                      <td className="px-3 py-2">
                                        {ledger.ledger_name}
                                      </td>

                                      <td className="px-3 py-2">
                                        {tx.referenceNo || "-"}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {formatCurrency(
                                          Number(tx.subtotal || 0)
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold">
                                        {formatCurrency(Number(tx.total || 0))}
                                      </td>
                                    </tr>
                                  ))}

                                  {hasPurchase && (
                                    <tr className="bg-blue-50 font-semibold border-t">
                                      <td
                                        colSpan={5}
                                        className="px-3 py-2 text-right"
                                      >
                                        TOTAL (Purchase)
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {formatCurrency(
                                          purchaseTotals.subtotal
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {formatCurrency(purchaseTotals.total)}
                                      </td>
                                    </tr>
                                  )}

                                  {/* ================= SALES ================= */}
                                  {ledgerVouchers[ledger.ledger_id].sales.map(
                                    (tx, idx) => (
                                      <tr
                                        key={`sales-${idx}`}
                                        className="border-t"
                                      >
                                        <td className="px-3 py-2">
                                          {tx.date
                                            ? new Date(
                                                tx.date
                                              ).toLocaleDateString("en-IN")
                                            : "-"}
                                        </td>
                                        <td className="px-3 py-2 text-green-600 font-medium">
                                          sales
                                        </td>
                                        <td className="px-3 py-2">
                                          {tx.number || "-"}
                                        </td>
                                        <td className="px-3 py-2">
                                          {ledger.ledger_name}
                                        </td>

                                        <td className="px-3 py-2">
                                          {tx.referenceNo || "-"}
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                          {formatCurrency(
                                            Number(tx.subtotal || 0)
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-right font-semibold">
                                          {formatCurrency(
                                            Number(tx.total || 0)
                                          )}
                                        </td>
                                      </tr>
                                    )
                                  )}

                                  {hasSales && (
                                    <tr className="bg-green-50 font-semibold border-t">
                                      <td
                                        colSpan={5}
                                        className="px-3 py-2 text-right"
                                      >
                                        TOTAL (Sales)
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {formatCurrency(salesTotals.subtotal)}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        {formatCurrency(salesTotals.total)}
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            );
                          })()}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
             
      </div>
         
    </div>
  );
};

export default OutstandingReceivables;
