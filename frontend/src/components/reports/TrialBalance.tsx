import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, Settings } from "lucide-react";
import { useAppContext } from "../../context/AppContext";

interface Ledger {
  id: number;
  name: string;
  groupId: number;
  group_id: number;
  openingBalance: number;
  balanceType: "debit" | "credit";
  groupName: string;
  groupType: string | null;
}

interface LedgerGroup {
  id: number;
  name: string;
  type: string | null;
  parent: number | null;
}

const TrialBalance: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailedView, setIsDetailedView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [netLoss, setNetLoss] = useState<number>(0);
  const [transferredProfit, setTransferredProfit] = useState<number>(0);
  const [transferredLoss, setTransferredLoss] = useState<number>(0);

  const [debitCreditData, setDebitCreditData] = useState<
    Record<number, { debit: number; credit: number }>
  >({});

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId) return;
      setLoading(true);
      setError(null);
      try {
        const url = `${import.meta.env.VITE_API_URL}/api/balance-sheet?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load data");
        const data = await res.json();

        const normalizedLedgers = data.ledgers.map((l: any) => ({
          id: l.id,
          name: l.name,
          groupId: l.group_id,
          group_id: l.group_id,
          openingBalance: parseFloat(l.opening_balance) || 0,
          balanceType: l.balance_type,
          groupName: l.group_name,
          groupType: l.group_type,
        }));
        setLedgers(normalizedLedgers);

        const normalizedGroups = data.ledgerGroups.map((g: any) => ({
          ...g,
          parent: g.parent ? Number(g.parent) : null
        }));
        setLedgerGroups(normalizedGroups);
        setTransferredProfit(data.transferredProfit || 0);
        setTransferredLoss(data.transferredLoss || 0);
      } catch (err: any) {
        setError(err.message || "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId, ownerType, ownerId]);

  useEffect(() => {
    if (companyId) {
      const profit = Number(
        localStorage.getItem(`NET_PROFIT_${companyId}`) || 0
      );
      const loss = Number(
        localStorage.getItem(`NET_LOSS_${companyId}`) || 0
      );
      setNetProfit(profit);
      setNetLoss(loss);
    }
  }, [companyId]);

  useEffect(() => {
    const fetchDebitCreditData = async () => {
      if (!companyId || !ownerType || !ownerId || ledgers.length === 0) return;

      try {
        const ledgerIds = ledgers.map((l) => l.id).join(",");
        const url = `${import.meta.env.VITE_API_URL}/api/group?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&ledgerIds=${ledgerIds}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load debit/credit data");
        const data = await res.json();
        if (data.success && data.data) setDebitCreditData(data.data);
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
    return ledger.balanceType === "debit" ? (opening + debit - credit) : (opening + credit - debit);
  };

  const calculateGroupTotals = (groupId: number) => {
    const findSubGroups = (id: number): number[] => {
      let results = [id];
      ledgerGroups.filter(g => g.parent === id).forEach(c => {
        results = [...results, ...findSubGroups(c.id)];
      });
      return results;
    };
    const allGroupIds = findSubGroups(groupId);
    const recursiveLedgers = ledgers.filter(l => allGroupIds.includes(Number(l.groupId)));

    let totalOpDr = 0;
    let totalOpCr = 0;
    let totalTransDr = 0;
    let totalTransCr = 0;

    recursiveLedgers.forEach(ledger => {
      // Opening
      const op = Number(ledger.openingBalance) || 0;
      if (ledger.balanceType === 'debit') totalOpDr += op;
      else totalOpCr += op;

      // Transactions
      totalTransDr += Number(debitCreditData[ledger.id]?.debit) || 0;
      totalTransCr += Number(debitCreditData[ledger.id]?.credit) || 0;
    });

    const netOpening = totalOpDr - totalOpCr;
    const netClosing = (totalOpDr + totalTransDr) - (totalOpCr + totalTransCr);

    return {
      opening: netOpening, // +ve is Dr
      debit: totalTransDr,
      credit: totalTransCr,
      closing: netClosing // +ve is Dr
    };
  };

  const trialGroups = [
    { id: -4, name: "Capital Account" },
    { id: -13, name: "Loans (Liability)" },
    { id: -6, name: "Current Liabilities" },
    { id: -5, name: "Current Assets" },
    { id: -9, name: "Fixed Assets" },
    { id: -19, name: "TDS Payable" },
    { id: -16, name: "Sales Accounts" },
    { id: -15, name: "Purchase Accounts" },
    { id: -11, name: "Indirect Income" },
    { id: -10, name: "Indirect Expenses" },
    { id: -18, name: "Profit & Loss A/c" },
    { id: -1, name: "Bank Accounts" },
    { id: -2, name: "Bank OD A/c" },
    { id: -3, name: "Branch/Division" },
    { id: -7, name: "Direct Expenses" },
    { id: -8, name: "Direct Income" },
    { id: -12, name: "Investments" },
    { id: -14, name: "Misc expenses (Assets)" },
    { id: -17, name: "Suspense A/C" },
  ];


  const renderGroupRows = (groupId: number, level: number = 0) => {
    const subGroups = ledgerGroups.filter(g => g.parent === groupId);
    const directLedgers = ledgers.filter(l => Number(l.groupId) === groupId);

    return (
      <>
        {subGroups.map(group => {
          const totals = calculateGroupTotals(group.id);
          const hasBalance = totals.opening !== 0 || totals.debit !== 0 || totals.credit !== 0 || totals.closing !== 0;
          if (!hasBalance && !isDetailedView) return null;

          return (
            <React.Fragment key={group.id}>
              <tr
                className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm"
                onClick={() => navigate(`/app/reports/sub-group-summary/${group.id}`)}
              >
                <td className="py-2 px-4" style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                  <span className="italic font-semibold text-blue-500">{group.name}</span>
                </td>
                <td className="py-2 px-4 text-right font-mono text-xs">
                  {totals.opening !== 0 ? `${Math.abs(totals.opening).toLocaleString()} ${totals.opening > 0 ? "Dr" : "Cr"}` : ""}
                </td>
                <td className="py-2 px-4 text-right font-mono text-xs">{totals.debit > 0 ? totals.debit.toLocaleString() : ""}</td>
                <td className="py-2 px-4 text-right font-mono text-xs">{totals.credit > 0 ? totals.credit.toLocaleString() : ""}</td>
                <td className="py-2 px-4 text-right font-mono text-xs">
                  {totals.closing !== 0 ? `${Math.abs(totals.closing).toLocaleString()} ${totals.closing > 0 ? "Dr" : "Cr"}` : ""}
                </td>
              </tr>
              {isDetailedView && renderGroupRows(group.id, level + 1)}
            </React.Fragment>
          );
        })}

        {directLedgers.map(ledger => {
          // Opening
          const op = Number(ledger.openingBalance) || 0;
          const opDr = ledger.balanceType === 'debit' ? op : 0;
          const opCr = ledger.balanceType === 'credit' ? op : 0;
          const netOp = opDr - opCr;

          // Trans
          const d = Number(debitCreditData[ledger.id]?.debit) || 0;
          const c = Number(debitCreditData[ledger.id]?.credit) || 0;

          // Closing
          const netClose = (opDr + d) - (opCr + c);

          if (netOp === 0 && d === 0 && c === 0 && netClose === 0 && !isDetailedView) return null;

          return (
            <tr
              key={ledger.id}
              className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-xs text-gray-600 font-semibold"
              onClick={() => navigate(`/app/reports/ledger/${ledger.id}`)}
            >
              <td className="py-1 px-4" style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                {ledger.name}
              </td>
              <td className="py-1 px-4 text-right font-mono">
                {netOp !== 0 ? `${Math.abs(netOp).toLocaleString()} ${netOp > 0 ? "Dr" : "Cr"}` : ""}
              </td>
              <td className="py-1 px-4 text-right font-mono">{d > 0 ? d.toLocaleString() : ""}</td>
              <td className="py-1 px-4 text-right font-mono">{c > 0 ? c.toLocaleString() : ""}</td>
              <td className="py-1 px-4 text-right font-mono">
                {netClose !== 0 ? `${Math.abs(netClose).toLocaleString()} ${netClose > 0 ? "Dr" : "Cr"}` : ""}
              </td>
            </tr>
          );
        })}
      </>
    );
  };

  const grandTotals = useMemo(() => {
    let d = 0;
    let c = 0;
    trialGroups.forEach(tg => {
      if (tg.id === -18) {
        const plVal = netProfit - netLoss - transferredProfit + transferredLoss;
        if (plVal > 0) c += plVal; else d += Math.abs(plVal);
      } else {
        const totals = calculateGroupTotals(tg.id);
        d += totals.debit;
        c += totals.credit;
      }
    });
    return { debit: d, credit: c };
  }, [ledgers, debitCreditData, netProfit, netLoss, transferredProfit, transferredLoss]);

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-200" : "hover:bg-gray-200"}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Trial Balance</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setIsDetailedView(!isDetailedView)}
            className={`p-2 rounded-md transition-all ${isDetailedView ? "bg-indigo-600 text-white shadow-lg" : theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <Settings size={18} className={isDetailedView ? "animate-spin-slow" : ""} />
          </button>
          <button className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-200" : "hover:bg-gray-200"}`}><Printer size={18} /></button>
          <button className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-200" : "hover:bg-gray-200"}`}><Download size={18} /></button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-400 font-bold text-sm">
                <th className="py-3 px-4">Particulars</th>
                <th className="py-3 px-4 text-right">Opening Balance</th>
                <th className="py-3 px-4 text-right">Debit</th>
                <th className="py-3 px-4 text-right">Credit</th>
                <th className="py-3 px-4 text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {trialGroups.map(tg => {
                const totals = calculateGroupTotals(tg.id);

                // Special handling for Profit & Loss (id -18)
                if (tg.id === -18) {
                  // Logic for P&L presentation in TB can be complex. 
                  // To keep it simple and consistent with user request:
                  // We will just show the calculated totals if they exist, 
                  // or the net profit/loss if handled externally.
                  // Previous code calculated it from netProfit/netLoss states.

                  const plVal = netProfit - netLoss - transferredProfit + transferredLoss;
                  let closingDr = 0, closingCr = 0;
                  if (plVal > 0) closingCr = plVal; else closingDr = Math.abs(plVal);

                  // P&L usually accumulated in closing, opening implies retained earnings? 
                  // For now, mirroring previous logic but fitting columns.
                  if (plVal === 0 && !isDetailedView) return null;

                  return (
                    <React.Fragment key={tg.id}>
                      <tr
                        className="border-b border-gray-300 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-200"
                        onClick={() => navigate("/app/reports/profit-loss")}
                      >
                        <td className="py-3 px-4 text-blue-600">{tg.name}</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-400">-</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-400">-</td>
                        <td className="py-3 px-4 text-right font-mono text-gray-400">-</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {closingDr > 0 ? `${closingDr.toLocaleString()} Dr` : ""}
                          {closingCr > 0 ? `${closingCr.toLocaleString()} Cr` : ""}
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                }

                if (totals.opening === 0 && totals.debit === 0 && totals.credit === 0 && totals.closing === 0 && !isDetailedView) return null;

                return (
                  <React.Fragment key={tg.id}>
                    <tr
                      className="border-b border-gray-300 font-semibold cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => navigate(`/app/reports/sub-group-summary/${tg.id}`)}
                    >
                      <td className="py-3 px-4 text-blue-600">{tg.name}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {totals.opening !== 0 ? `${Math.abs(totals.opening).toLocaleString()} ${totals.opening > 0 ? "Dr" : "Cr"}` : ""}
                      </td>
                      <td className="py-3 px-4 text-right font-mono">{totals.debit > 0 ? totals.debit.toLocaleString() : ""}</td>
                      <td className="py-3 px-4 text-right font-mono">{totals.credit > 0 ? totals.credit.toLocaleString() : ""}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {totals.closing !== 0 ? `${Math.abs(totals.closing).toLocaleString()} ${totals.closing > 0 ? "Dr" : "Cr"}` : ""}
                      </td>
                    </tr>
                    {isDetailedView && renderGroupRows(tg.id)}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold text-lg border-t-2 border-gray-400">
                <td className="py-3 px-4">Grand Total</td>
                <td className="py-3 px-4 text-right text-indigo-600 font-mono">
                  {/* Grand Total Opening is usually balanced to 0 in double entry, but might filter specific groups */}
                </td>
                <td className="py-3 px-4 text-right text-indigo-600 font-mono">{grandTotals.debit.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-indigo-600 font-mono">{grandTotals.credit.toLocaleString()}</td>
                <td className="py-3 px-4 text-right text-indigo-600 font-mono">
                  {/* Grand Total Closing is usually balanced */}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
};

export default TrialBalance;
