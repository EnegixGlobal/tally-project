import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft } from "lucide-react";

interface Ledger {
  id: number;
  name: string;
  group_id: number;
  openingBalance: number;
  balanceType: "debit" | "credit";
}

interface Group {
  id: number;
  name: string;
  parent: number | null;
}

interface DebitCreditData {
  [ledgerId: number]: { debit: number; credit: number };
}

interface GroupData {
  id: number;
  name: string;
}

const SubGroupSummary: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams<{ groupId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subGroups, setSubGroups] = useState<Group[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [debitCreditData, setDebitCreditData] = useState<DebitCreditData>({});
  const [groupName, setGroupName] = useState<string>(
    location.state?.groupName || `Group ${groupId}`
  );
  const [groupIds, setGroupIds] = useState<number[]>([Number(groupId)]);

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  useEffect(() => {
    // Reset groupIds when URL groupId changes
    if (groupId) {
      // If no groupIds in state, use just the current groupId
      if (location.state?.groupIds && Array.isArray(location.state.groupIds)) {
        setGroupIds(location.state.groupIds);
      } else {
        setGroupIds([Number(groupId)]);
      }
    }
  }, [groupId, location.state]);

  useEffect(() => {
    const fetchGroupData = async () => {
      setLoading(true);
      setError(null);
      try {
        let allSubGroups: Group[] = [];
        let allLedgers: Ledger[] = [];

        // Fetch data for each group ID
        for (const gId of groupIds) {
          const url = `${
            import.meta.env.VITE_API_URL
          }/api/balance-sheet/group?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&id=${gId}`;

          const res = await fetch(url);
          if (!res.ok) throw new Error("Failed to load group data");
          const data = await res.json();

          if (data.success) {
            allSubGroups = [...allSubGroups, ...(data.groups || [])];

            // Normalize ledgers
            const rawLedgers = data.ledgers || [];
            const normalizedLedgers = rawLedgers.map((l: any) => ({
              id: l.id,
              name: l.name,
              group_id: l.group_id,
              openingBalance: parseFloat(l.opening_balance) || 0,
              balanceType: l.balance_type,
            }));
            allLedgers = [...allLedgers, ...normalizedLedgers];
          }
        }

        setSubGroups(allSubGroups);
        setLedgers(allLedgers);
      } catch (err: any) {
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (groupIds.length > 0) {
      fetchGroupData();
    }
  }, [groupIds, companyId, ownerType, ownerId]);

  // Fetch debit/credit data for all ledgers
  useEffect(() => {
    const fetchDebitCreditData = async () => {
      if (!companyId || !ownerType || !ownerId || ledgers.length === 0) {
        return;
      }

      try {
        const ledgerIds = ledgers.map((l) => l.id).join(",");
        const url =
          `${import.meta.env.VITE_API_URL}/api/group` +
          `?company_id=${companyId}` +
          `&owner_type=${ownerType}` +
          `&owner_id=${ownerId}` +
          `&ledgerIds=${ledgerIds}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load debit/credit data");
        const data = await res.json();

        if (data.success && data.data) {
          setDebitCreditData(data.data);
        }
      } catch (err) {
        console.error("Error fetching debit/credit data:", err);
      }
    };

    fetchDebitCreditData();
  }, [ledgers, companyId, ownerType, ownerId]);

  const calculateClosingBalance = (ledger: Ledger): number => {
    const opening = Number(ledger.openingBalance) || 0;
    const debit = debitCreditData[ledger.id]?.debit || 0;
    const credit = debitCreditData[ledger.id]?.credit || 0;

    if (ledger.balanceType === "debit") {
      return opening + debit - credit;
    } else {
      return opening + credit - debit;
    }
  };

  // Group ledgers by group_id
  const ledgersByGroup: { [key: number]: Ledger[] } = {};
  ledgers.forEach((ledger) => {
    if (!ledgersByGroup[ledger.group_id]) {
      ledgersByGroup[ledger.group_id] = [];
    }
    ledgersByGroup[ledger.group_id].push(ledger);
  });

  // Get direct ledgers (ledgers directly under any of the parent groups)
  const directLedgers = ledgers.filter(
    (l) => groupIds.includes(Number(l.group_id))
  );

  // Calculate totals for each subgroup
  const getGroupTotals = (groupId: number) => {
    const groupLedgers = ledgersByGroup[groupId] || [];
    const totalDebit = groupLedgers.reduce((sum, ledger) => {
      return sum + (debitCreditData[ledger.id]?.debit || 0);
    }, 0);
    const totalCredit = groupLedgers.reduce((sum, ledger) => {
      return sum + (debitCreditData[ledger.id]?.credit || 0);
    }, 0);
    return { totalDebit, totalCredit };
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/app/reports/balance-sheet")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
          title="Back to Balance Sheet"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{groupName}</h1>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <>
          {/* Direct Ledgers Section */}
          {directLedgers.length > 0 && (
            <div
              className={`mb-8 p-6 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 text-blue-600">
                Ledgers
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="py-3 px-4 font-semibold">Ledger Name</th>
                      <th className="py-3 px-4 text-right">Opening Balance</th>
                      <th className="py-3 px-4 text-right">Debit</th>
                      <th className="py-3 px-4 text-right">Credit</th>
                      <th className="py-3 px-4 text-right">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {directLedgers.map((ledger) => {
                      const closing = calculateClosingBalance(ledger);
                      const debit = debitCreditData[ledger.id]?.debit || 0;
                      const credit = debitCreditData[ledger.id]?.credit || 0;

                      return (
                        <tr
                          key={ledger.id}
                          onClick={() =>
                            navigate(`/app/reports/ledger/${ledger.id}`)
                          }
                          className={`border-b cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <td className="py-3 px-4 text-blue-600 font-medium underline">
                            {ledger.name}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm">
                            {ledger.openingBalance.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm">
                            {debit.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm">
                            {credit.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-sm font-semibold">
                            {closing.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subgroups Section - Summary View */}
          {subGroups.length > 0 && (
            <div
              className={`mb-8 p-6 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 text-blue-600">
                Sub-Groups
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 dark:border-gray-700 border-gray-400">
                      <th className="py-3 px-4 font-semibold">Group Name</th>
                      <th className="py-3 px-4 text-right font-semibold">
                        Total Debit
                      </th>
                      <th className="py-3 px-4 text-right font-semibold">
                        Total Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {subGroups.map((group) => {
                      const { totalDebit, totalCredit } = getGroupTotals(
                        group.id
                      );
                      const groupLedgers = ledgersByGroup[group.id] || [];

                      return (
                        <tr
                          key={group.id}
                          onClick={() =>
                            navigate(
                              `/app/reports/sub-group-summary/${group.id}`,
                              { state: { groupName: group.name } }
                            )
                          }
                          className={`border-b cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <td className="py-3 px-4 text-blue-600 font-medium underline">
                            {group.name}
                            {groupLedgers.length === 0 && (
                              <span className="text-gray-500 text-xs ml-2">
                                (No ledgers)
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {totalDebit.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold">
                            {totalCredit.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {subGroups.length === 0 && directLedgers.length === 0 && (
            <div
              className={`p-6 rounded-lg text-center ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <p className="opacity-75 italic py-10">
                No subgroups or ledgers found in this group.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SubGroupSummary;
