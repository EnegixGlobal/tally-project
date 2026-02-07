import React, { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";


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

interface BaseGroup {
  id: number;
  name: string;
  nature: string;
}



// group name
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
  { id: -19, name: "TDS Payables", nature: "Liabilities" },
];

const SubGroupSummary: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { groupId } = useParams<{ groupId: string }>();
  console.log('groupid', groupId)
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
          const url = `${import.meta.env.VITE_API_URL
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


  //group name 
  useEffect(() => {
    if (!groupId) return;

    // 1️⃣ Agar navigation se name aaya hai
    if (location.state?.groupName) {
      setGroupName(location.state.groupName);
      return;
    }

    // 2️⃣ baseGroups se match karo
    const baseGroup = baseGroups.find(
      (g) => g.id === Number(groupId)
    );

    if (baseGroup) {
      setGroupName(baseGroup.name);
    } else {
      setGroupName(`Group ${groupId}`);
    }
  }, [groupId, location.state]);


  // 1. Data Processing & Scoping
  // Group ledgers by group_id
  const ledgersByGroup: { [key: number]: Ledger[] } = {};
  ledgers.forEach((ledger) => {
    if (!ledgersByGroup[ledger.group_id]) {
      ledgersByGroup[ledger.group_id] = [];
    }
    ledgersByGroup[ledger.group_id].push(ledger);
  });

  // Get direct ledgers (ledgers directly under any of the parent groups)
  const directLedgers = ledgers.filter((l) =>
    groupIds.includes(Number(l.group_id))
  );

  // 2. Calculation Functions
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

  const calculateGrandTotal = () => {
    let opening = 0;
    let debit = 0;
    let credit = 0;
    let closing = 0;

    directLedgers.forEach((ledger) => {
      const o = Number(ledger.openingBalance) || 0;
      const d = debitCreditData[ledger.id]?.debit || 0;
      const c = debitCreditData[ledger.id]?.credit || 0;
      const cl = calculateClosingBalance(ledger);

      opening += o;
      debit += d;
      credit += c;
      closing += cl;
    });

    return { opening, debit, credit, closing };
  };

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

  // 3. Handlers
  const [transferLoading, setTransferLoading] = useState(false);

  const handleTransferNow = async () => {
    if (Number(groupId) !== -4) return;
    if (transferLoading) return;

    setTransferLoading(true);

    try {
      const confirm = await Swal.fire({
        icon: "question",
        title: "Confirm Transfer",
        text: "Do you want to transfer/update Profit / Loss to Capital Account?",
        showCancelButton: true,
        confirmButtonText: "Yes, Transfer",
        cancelButtonText: "Cancel",
      });

      if (!confirm.isConfirmed) {
        setTransferLoading(false);
        return;
      }

      const profit = Number(localStorage.getItem(`NET_PROFIT_${companyId}`) || 0);
      const loss = Number(localStorage.getItem(`NET_LOSS_${companyId}`) || 0);

      if (profit === 0 && loss === 0) {
        Swal.fire({
          icon: "warning",
          title: "Nothing to Transfer",
          text: "Profit / Loss amount is zero.",
        });
        setTransferLoading(false);
        return;
      }

      const capitalAccountLedger = directLedgers.find(
        (l) => l.name.toLowerCase().includes("capital") || l.group_id === -4
      );
      const profitLedger = directLedgers.find((l) => l.name.toLowerCase().includes("profit"));
      const lossLedger = directLedgers.find((l) => l.name.toLowerCase().includes("loss"));

      if (!capitalAccountLedger && loss > 0) {
        Swal.fire({
          icon: "warning",
          title: "Capital Ledger Missing",
          text: "Capital Account ledger not found. Please create one for loss distribution.",
        });
        setTransferLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/profit`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profit,
          loss,
          company_id: companyId,
          owner_type: ownerType,
          owner_id: ownerId,
          capitalAccountId: capitalAccountLedger?.id || null,
          profitId: profitLedger?.id || null,
          lossId: lossLedger?.id || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Transfer Successful",
          text: "Profit / Loss has been updated in Capital Account",
          timer: 2000,
          showConfirmButton: false,
        });

        if (ledgers.length > 0) {
          const ledgerIds = ledgers.map((l) => l.id).join(",");
          const url = `${import.meta.env.VITE_API_URL}/api/group?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&ledgerIds=${ledgerIds}`;
          const res = await fetch(url);
          if (res.ok) {
            const d = await res.json();
            if (d.success && d.data) setDebitCreditData(d.data);
          }
        }
      } else {
        Swal.fire({ icon: "warning", title: "Transfer Failed", text: data.error || "Unable to complete transfer" });
      }
    } catch (error) {
      console.error("Error during transfer:", error);
      Swal.fire({ icon: "error", title: "Something went wrong", text: "An unexpected error occurred during transfer" });
    } finally {
      setTransferLoading(false);
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/app/reports/balance-sheet")}
            className={`p-2 rounded-full ${theme === "dark"
              ? "hover:bg-gray-700"
              : "hover:bg-gray-200"
              }`}
            title="Back to Balance Sheet"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-2xl font-bold">{groupName}</h1>
        </div>

        {Number(groupId) === -4 && (
          <button
            onClick={handleTransferNow}
            disabled={transferLoading}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {transferLoading ? "Transferring..." : "Transfer now"}
          </button>
        )}

      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && (
        <>
          {/* Direct Ledgers Section */}
          {/* Direct Ledgers Section */}
          {directLedgers.length > 0 && (
            <div
              className={`mb-8 p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
                    {/* Group ledgers by group_id first */}
                    {Object.entries(ledgersByGroup)
                      .filter(([id]) => groupIds.includes(Number(id))) // only direct groups
                      .map(([grpId, groupLedgers], idx, arr) => (
                        <React.Fragment key={grpId}>
                          {groupLedgers.map((ledger) => {
                            const closing = calculateClosingBalance(ledger);
                            const debit = debitCreditData[ledger.id]?.debit || 0;
                            const credit = debitCreditData[ledger.id]?.credit || 0;

                            return (
                              <tr
                                key={ledger.id}
                                onClick={() =>
                                  navigate(`/app/reports/ledger/${ledger.id}`)
                                }
                                className={`border-b cursor-pointer transition-colors ${theme === "dark"
                                  ? "border-gray-700 hover:bg-gray-700"
                                  : "border-gray-200 hover:bg-gray-50"
                                  }`}
                              >
                                <td className="py-3 px-4 text-blue-600 font-medium ">
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

                          {/* Add a blank row for spacing between different group_ids */}
                          {idx < arr.length - 1 && (
                            <tr className="h-4"><td colSpan={5}></td></tr>
                          )}
                        </React.Fragment>
                      ))}
                  </tbody>

                  {/* Grand Total Row */}
                  {(() => {
                    const total = calculateGrandTotal();

                    return (
                      <tr
                        className={`font-bold border-t-2 ${theme === "dark"
                          ? "border-gray-600 bg-gray-700"
                          : "border-gray-300 bg-gray-100"
                          }`}
                      >
                        <td className="py-3 px-4 text-right">Grand Total</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {total.opening.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {total.debit.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {total.credit.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {total.closing.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })()}
                </table>
              </div>
            </div>
          )}


          {/* Subgroups Section - Summary View */}
          {subGroups.length > 0 && (
            <div
              className={`mb-8 p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
                          className={`border-b cursor-pointer transition-colors ${theme === "dark"
                            ? "border-gray-700 hover:bg-gray-700"
                            : "border-gray-200 hover:bg-gray-50"
                            }`}
                        >
                          <td className="py-3 px-4 text-blue-600 font-medium ">
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
                  {/* Grand Total Row */}
                </table>
              </div>
            </div>
          )}

          {subGroups.length === 0 && directLedgers.length === 0 && (
            <div
              className={`p-6 rounded-lg text-center ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
