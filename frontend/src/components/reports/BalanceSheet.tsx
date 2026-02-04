import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft, Printer, Download, Settings } from "lucide-react";

// Interfaces copied from your structure
interface Ledger {
  id: number;
  name: string;
  groupId: number;
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

const BalanceSheet: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailedView, setIsDetailedView] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [netLoss, setNetLoss] = useState<number>(0);

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
        if (!res.ok) throw new Error("Failed to load balance sheet data");
        const data = await res.json();

        const normalizedLedgers = data.ledgers.map((l: any) => ({
          id: l.id,
          name: l.name,
          groupId: l.group_id,
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

  const [calculatedTotal, setCalculatedTotal] = useState({
    CapitalAccount: 0,
    Loans: 0,
    CurrentLiabilities: 0,
    FixedAssets: 0,
    CurrentAssets: 0,
    LaiblityTotal: 0,
    AssetTotal: 0,
  });

  useEffect(() => {
    const capitalTotal = calculateGroupTotal(-4);
    const loanLability = calculateGroupTotal(-13);
    const currentLiability = calculateGroupTotal(-6);
    const fixedAssets = calculateGroupTotal(-9);
    const CurrentAssets = calculateGroupTotal(-5);

    setCalculatedTotal({
      CapitalAccount: capitalTotal,
      Loans: loanLability,
      CurrentLiabilities: currentLiability,
      FixedAssets: fixedAssets,
      CurrentAssets: CurrentAssets,
      LaiblityTotal: capitalTotal + loanLability + currentLiability + (netProfit - netLoss),
      AssetTotal: fixedAssets + CurrentAssets,
    });
  }, [ledgers, debitCreditData, ledgerGroups, netProfit, netLoss]);

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

  const calculateGroupTotal = (groupId: number): number => {
    const findSubGroups = (id: number): number[] => {
      let results = [id];
      ledgerGroups.filter(g => g.parent === id).forEach(c => {
        results = [...results, ...findSubGroups(c.id)];
      });
      return results;
    };
    const allGroupIds = findSubGroups(groupId);
    const recursiveLedgers = ledgers.filter(l => allGroupIds.includes(Number(l.groupId)));
    return recursiveLedgers.reduce((sum, ledger) => sum + Math.abs(calculateClosingBalance(ledger)), 0);
  };

  const handleGroupClick = (groupId: number, additionalGroupId?: number) => {
    const groupIds = additionalGroupId ? [groupId, additionalGroupId] : [groupId];
    navigate(`/app/reports/sub-group-summary/${groupId}`, { state: { groupIds } });
  };

  const renderDetailedGroupItems = (parentGroupId: number, level: number = 1) => {
    const subGroups = ledgerGroups.filter(g => g.parent === parentGroupId);
    const directLedgers = ledgers.filter(l => Number(l.groupId) === parentGroupId);

    return (
      <div className="mt-1 space-y-1">
        {subGroups.map(group => {
          const total = calculateGroupTotal(group.id);
          return (
            <div key={group.id}>
              <div
                className={`grid grid-cols-2 gap-2 py-1 text-sm cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-200 rounded px-2  `}
                style={{ paddingLeft: `${level * 1.5}rem` }}
                onClick={() => navigate(`/app/reports/sub-group-summary/${group.id}`)}
              >
                <span className="italic font-semibold text-blue-500">{group.name}</span>
                <span className="text-right font-mono text-xs">{total.toLocaleString()}</span>
              </div>
              {renderDetailedGroupItems(group.id, level + 1)}
            </div>
          );
        })}

        {directLedgers.map(ledger => {
          const closing = calculateClosingBalance(ledger);
          return (
            <div
              key={ledger.id}
              className="grid grid-cols-2 gap-2 py-1 text-xs text-gray-500 font-semibold dark:text-gray-600 cursor-pointer hover:text-blue-600 px-2"
              style={{ paddingLeft: `${level * 1.5}rem` }}
              onClick={() => navigate(`/app/reports/ledger/${ledger.id}`)}
            >
              <span>{ledger.name}</span>
              <span className="text-right font-mono">{closing.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          disabled={loading}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Balance Sheet</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Toggle Detailed Mode"
            type="button"
            onClick={() => setIsDetailedView(!isDetailedView)}
            className={`p-2 rounded-md transition-all ${isDetailedView ? "bg-indigo-600 text-white shadow-lg" : theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <Settings size={18} className={isDetailedView ? "animate-spin-slow text-white" : ""} />
          </button>
          <button title="Print" className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><Printer size={18} /></button>
          <button title="Download" className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><Download size={18} /></button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="flex flex-col gap-6">
          <div className="flex gap-5">
            {/* Liabilities */}
            <div className={`p-6 rounded-lg w-1/2 ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
              <h2 className="mb-4 text-xl font-bold text-center border-b pb-2">Liabilities</h2>
              <div className="grid grid-cols-2 gap-2 pb-2 border-b-2 border-gray-400 font-semibold text-sm">
                <div>Particulars</div>
                <div className="text-right">Amount</div>
              </div>

              <div className="space-y-2 mt-3">
                {/* Capital Account */}
                <div>
                  <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-300 cursor-pointer" onClick={() => handleGroupClick(-4, -18)}>
                    <span className="text-blue-600 font-semibold underline">Capital Account</span>
                    <span className="text-right font-mono font-bold">{calculatedTotal.CapitalAccount.toLocaleString()}</span>
                  </div>
                  {isDetailedView && renderDetailedGroupItems(-4)}
                </div>

                {/* Loans */}
                <div>
                  <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-300 cursor-pointer" onClick={() => handleGroupClick(-13)}>
                    <span className="text-blue-600 font-semibold underline">Loans (Liability)</span>
                    <span className="text-right font-mono font-bold">{calculatedTotal.Loans.toLocaleString()}</span>
                  </div>
                  {isDetailedView && renderDetailedGroupItems(-13)}
                </div>

                {/* Current Liabilities */}
                <div>
                  <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-300 cursor-pointer" onClick={() => handleGroupClick(-6)}>
                    <span className="text-blue-600 font-semibold underline">Current Liabilities</span>
                    <span className="text-right font-mono font-bold">{calculatedTotal.CurrentLiabilities.toLocaleString()}</span>
                  </div>
                  {isDetailedView && renderDetailedGroupItems(-6)}
                </div>

                {/* Profit & Loss A/c (Restored to standalone row) */}
                <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-300 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors" onClick={() => navigate("/app/reports/profit-loss")}>
                  <span className="text-blue-600 font-semibold underline">Profit & Loss A/c</span>
                  <span className="text-right font-mono font-bold">
                    {netProfit > 0 ? netProfit.toLocaleString() : netLoss > 0 ? `-${netLoss.toLocaleString()}` : "0"}
                  </span>
                </div>

                <div className="flex justify-between font-bold text-lg border-t-2 border-gray-400 mt-4 pt-2">
                  <span>Total Liabilities</span>
                  <span className="text-indigo-600">{calculatedTotal.LaiblityTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Assets */}
            <div className={`p-6 rounded-lg w-1/2 ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
              <h2 className="mb-4 text-xl font-bold text-center border-b pb-2">Assets</h2>
              <div className="grid grid-cols-2 gap-2 pb-2 border-b-2 border-gray-400 font-semibold text-sm">
                <div>Particulars</div>
                <div className="text-right">Amount</div>
              </div>

              <div className="space-y-2 mt-3">
                {/* Fixed Assets */}
                <div>
                  <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-300 cursor-pointer" onClick={() => handleGroupClick(-9)}>
                    <span className="text-blue-600 font-semibold underline">Fixed Assets</span>
                    <span className="text-right font-mono font-bold">{calculatedTotal.FixedAssets.toLocaleString()}</span>
                  </div>
                  {isDetailedView && renderDetailedGroupItems(-9)}
                </div>

                {/* Current Assets */}
                <div>
                  <div className="grid grid-cols-2 gap-2 py-2 border-b border-gray-300 cursor-pointer" onClick={() => handleGroupClick(-5)}>
                    <span className="text-blue-600 font-semibold underline">Current Assets</span>
                    <span className="text-right font-mono font-bold">{calculatedTotal.CurrentAssets.toLocaleString()}</span>
                  </div>
                  {isDetailedView && renderDetailedGroupItems(-5)}
                </div>

                <div className="flex justify-between font-bold text-lg border-t-2 border-gray-400 mt-4 pt-2">
                  <span>Total Assets</span>
                  <span className="text-indigo-600">{calculatedTotal.AssetTotal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification */}
          <div className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
            <h2 className="mb-4 text-xl font-bold text-center">Verification</h2>
            <div className="grid grid-cols-3 text-center gap-4">
              <div><p className="opacity-75">Assets</p><p className="text-xl font-bold">₹{calculatedTotal.AssetTotal.toLocaleString()}</p></div>
              <div><p className="opacity-75">Liabilities</p><p className="text-xl font-bold">₹{calculatedTotal.LaiblityTotal.toLocaleString()}</p></div>
              <div>
                <p className="opacity-75">Difference</p>
                <p className={`text-xl font-bold ${Math.abs(calculatedTotal.AssetTotal - calculatedTotal.LaiblityTotal) > 1 ? 'text-red-500' : 'text-green-500'}`}>
                  ₹{(calculatedTotal.AssetTotal - calculatedTotal.LaiblityTotal).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
