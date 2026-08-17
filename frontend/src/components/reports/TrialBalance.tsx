import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, Settings, X } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { useProfitLossSync } from "../../hooks/useProfitLossSync";
import { systemPrimaryGroups as trialGroups, allSystemGroups } from "../../constants/ledgerGroups";

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

  // Sync Profit & Loss Data headlessly in background
  const { closingStock } = useProfitLossSync();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDetailedView, setIsDetailedView] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [unbalancedVouchers, setUnbalancedVouchers] = useState<any[]>([]);
  const [problematicLedgers, setProblematicLedgers] = useState<any[]>([]);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [showOpening, setShowOpening] = useState(false);
  const [showDebit, setShowDebit] = useState(false);
  const [showCredit, setShowCredit] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          groupId: Number(l.group_id || l.groupId),
          group_id: Number(l.group_id || l.groupId),
          openingBalance: parseFloat(l.opening_balance || l.openingBalance) || 0,
          balanceType: l.balance_type || l.balanceType,
          groupName: l.group_name || l.groupName,
          groupType: l.group_type || l.groupType,
        }));
        setLedgers(normalizedLedgers);

        const normalizedGroups = data.ledgerGroups.map((g: any) => ({
          ...g,
          parent: g.parent ? Number(g.parent) : null
        }));

        const systemGroupsMapped = allSystemGroups.map(g => ({
          id: g.id,
          name: g.name,
          parent: g.parent || null,
          type: g.nature?.toLowerCase().replace(' ', '-') || null
        }));

        const combinedGroups = [...systemGroupsMapped, ...normalizedGroups];
        const uniqueGroups = combinedGroups.reduce((acc: LedgerGroup[], current) => {
          if (!acc.find(g => g.id === current.id)) {
            acc.push(current);
          }
          return acc;
        }, []);

        setLedgerGroups(uniqueGroups);
      } catch (err: any) {
        setError(err.message || "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId, ownerType, ownerId]);



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



  const calculateGroupTotals = (groupId: number) => {
    const findSubGroups = (id: number): number[] => {
      let results = [id];
      ledgerGroups.filter(g => Number(g.parent) === Number(id)).forEach(c => {
        results = [...results, ...findSubGroups(Number(c.id))];
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
    let netClosing = (totalOpDr + totalTransDr) - (totalOpCr + totalTransCr);

    // Sync stock-in-hand
    if (ledgerGroups.find(g => g.id === groupId)?.name?.toLowerCase() === "stock-in-hand") {
      netClosing = closingStock; // +ve is Dr
    }

    return {
      opening: netOpening, // +ve is Dr
      debit: totalTransDr,
      credit: totalTransCr,
      closing: netClosing // +ve is Dr
    };
  };



  const renderGroupRows = (groupId: number, level: number = 0) => {
    const subGroups = ledgerGroups.filter(g => Number(g.parent) === Number(groupId));
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
                className={`cursor-pointer text-sm transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                onClick={() => navigate(`/app/reports/sub-group-summary/${group.id}`)}
              >
                <td className="py-2 px-4" style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                  <span className="italic font-semibold text-blue-500">{group.name}</span>
                </td>
                {showOpening && (
                  <td className="py-2 px-4 text-right font-mono text-xs">
                    {totals.opening !== 0 ? `${Math.abs(totals.opening).toLocaleString()} ${totals.opening > 0 ? "Dr" : "Cr"}` : ""}
                  </td>
                )}
                {showDebit && (
                  <td className="py-2 px-4 text-right font-mono text-xs">{totals.debit > 0 ? totals.debit.toLocaleString() : ""}</td>
                )}
                {showCredit && (
                  <td className="py-2 px-4 text-right font-mono text-xs">{totals.credit > 0 ? totals.credit.toLocaleString() : ""}</td>
                )}
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
              className={`cursor-pointer text-xs text-gray-600 font-semibold transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              onClick={() => navigate(`/app/reports/ledger/${ledger.id}`)}
            >
              <td className="py-1 px-4" style={{ paddingLeft: `${(level + 1) * 1.5}rem` }}>
                {ledger.name}
              </td>
              {showOpening && (
                <td className="py-1 px-4 text-right font-mono">
                  {netOp !== 0 ? `${Math.abs(netOp).toLocaleString()} ${netOp > 0 ? "Dr" : "Cr"}` : ""}
                </td>
              )}
              {showDebit && (
                <td className="py-1 px-4 text-right font-mono">{d > 0 ? d.toLocaleString() : ""}</td>
              )}
              {showCredit && (
                <td className="py-1 px-4 text-right font-mono">{c > 0 ? c.toLocaleString() : ""}</td>
              )}
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
    let opDr = 0;
    let opCr = 0;
    let clDr = 0;
    let clCr = 0;

    trialGroups.forEach((tg) => {
      const totals = calculateGroupTotals(tg.id);
      d += totals.debit;
      c += totals.credit;
      if (totals.opening > 0) opDr += totals.opening; else opCr += Math.abs(totals.opening);
      if (totals.closing > 0) clDr += totals.closing; else clCr += Math.abs(totals.closing);
    });
    return { debit: d, credit: c, openingDr: opDr, openingCr: opCr, closingDr: clDr, closingCr: clCr };
  }, [ledgers, debitCreditData, trialGroups, closingStock]);

  useEffect(() => {
    if (showDiffModal && Math.abs(grandTotals.debit - grandTotals.credit) !== 0 && unbalancedVouchers.length === 0 && problematicLedgers.length === 0) {
      setLoadingVouchers(true);
      fetch(`${import.meta.env.VITE_API_URL}/api/daybookTable2?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`)
        .then(res => res.json())
        .then(data => {
          // 1. Unbalanced Vouchers
          const unbalanced = data.filter((v: any) => {
            let dr = 0; let cr = 0;
            v.entries.forEach((entry: any) => {
              const amount = parseFloat(entry.amount || 0);
              if (entry.entry_type === "debit") dr += amount;
              if (entry.entry_type === "credit") cr += amount;
            });
            return Math.abs(dr - cr) > 0.01;
          }).map((v: any) => {
            let dr = 0; let cr = 0;
            v.entries.forEach((entry: any) => {
              const amount = parseFloat(entry.amount || 0);
              if (entry.entry_type === "debit") dr += amount;
              if (entry.entry_type === "credit") cr += amount;
            });
            return {
              id: v.id,
              date: v.date,
              voucherNo: v.voucher_number,
              voucherType: v.voucher_type,
              debit: dr,
              credit: cr,
              diff: Math.abs(dr - cr)
            };
          });
          setUnbalancedVouchers(unbalanced);

          // 2. Problematic / Ignored Ledgers
          // Find all ledgers that are actually included in the Trial Balance calculations
          const allTrialGroupsIds = new Set<number>();
          trialGroups.forEach(tg => {
            const getSubs = (id: number): number[] => {
              let res = [id];
              ledgerGroups.filter(g => Number(g.parent) === Number(id)).forEach(c => {
                res = [...res, ...getSubs(Number(c.id))];
              });
              return res;
            };
            getSubs(tg.id).forEach(id => allTrialGroupsIds.add(id));
          });

          const problems: any[] = [];
          
          // 1. Calculate sums from actual VOUCHERS
          const voucherLedgerSums: Record<string, { dr: number; cr: number; vouchers: Set<string>; name: string }> = {};
          data.forEach((v: any) => {
            v.entries.forEach((entry: any) => {
              const amount = parseFloat(entry.amount || 0);
              let lid = entry.ledger_id || entry.ledgerId;
              const name = entry.ledger_name || entry.ledgerName || entry.narration || "Unknown";
              
              if (!lid) {
                const matched = ledgers.find(l => l.name === name);
                if (matched) lid = matched.id;
              }

              const key = lid ? lid.toString() : name;
              
              if (!voucherLedgerSums[key]) voucherLedgerSums[key] = { dr: 0, cr: 0, vouchers: new Set(), name };
              if (entry.entry_type === "debit") voucherLedgerSums[key].dr += amount;
              if (entry.entry_type === "credit") voucherLedgerSums[key].cr += amount;
              
              const vNo = v.voucher_number || v.voucherNo || v.id || "Unknown";
              if (amount > 0) voucherLedgerSums[key].vouchers.add(vNo);
            });
          });

          // 2. Compare EVERY ledger's API sum with VOUCHER sum
          ledgers.forEach(l => {
            const drApi = Number(debitCreditData[l.id]?.debit) || 0;
            const crApi = Number(debitCreditData[l.id]?.credit) || 0;
            
            const vSum = voucherLedgerSums[l.id.toString()] || voucherLedgerSums[l.name] || { dr: 0, cr: 0, vouchers: new Set() };
            const vDr = vSum.dr;
            const vCr = vSum.cr;
            const vouchersList = Array.from(vSum.vouchers).join(', ');

            const isMissingFromTrial = !allTrialGroupsIds.has(Number(l.groupId));

            if (isMissingFromTrial && (drApi > 0 || crApi > 0)) {
              problems.push({
                id: l.id,
                name: l.name,
                dr: drApi,
                cr: crApi,
                reason: "Ledger missing from Trial Balance Groups",
                diff: Math.abs(drApi - crApi),
                vouchers: vouchersList || "None"
              });
            } else if (Math.abs(drApi - vDr) > 0.01 || Math.abs(crApi - vCr) > 0.01) {
              problems.push({
                id: l.id,
                name: l.name,
                dr: drApi,
                cr: crApi,
                reason: `Mismatch: API shows ${drApi} Dr / ${crApi} Cr, but vouchers show ${vDr} Dr / ${vCr} Cr`,
                diff: Math.abs((drApi - crApi) - (vDr - vCr)),
                vouchers: vouchersList || "None"
              });
            }
          });

          // 3. Find phantom ledgers (in vouchers but not in ledger master)
          Object.keys(voucherLedgerSums).forEach(lid => {
            if (!ledgers.find(l => l.id.toString() === lid)) {
               let phantomName = "Unknown Deleted Ledger";
               data.forEach((v: any) => v.entries.forEach((e: any) => {
                 if ((e.ledger_id || e.ledgerId)?.toString() === lid) {
                   phantomName = e.ledger_name || e.ledgerName || e.narration || phantomName;
                 }
               }));
               problems.push({
                 id: lid,
                 name: phantomName + " (Deleted/Phantom)",
                 dr: voucherLedgerSums[lid].dr,
                 cr: voucherLedgerSums[lid].cr,
                 reason: "Voucher uses a ledger that does not exist in master list",
                 diff: Math.abs(voucherLedgerSums[lid].dr - voucherLedgerSums[lid].cr),
                 vouchers: Array.from(voucherLedgerSums[lid].vouchers).join(', ')
               });
            }
          });

          setProblematicLedgers(problems);
        })
        .catch(err => console.error("Error fetching daybook for difference analysis", err))
        .finally(() => setLoadingVouchers(false));
    }
  }, [showDiffModal, grandTotals, companyId, ownerType, ownerId, ledgerGroups, ledgers, debitCreditData]);

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
        <div className="ml-auto relative">
          <div className="flex space-x-2">
            <button
              onClick={() => setIsDetailedView(!isDetailedView)}
              className={`p-2 rounded-md transition-all ${isDetailedView ? "bg-indigo-600 text-white shadow-lg" : theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
            >
              <Settings size={18} className={isDetailedView ? "animate-spin-slow" : ""} />
            </button>
            <button className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-200" : "hover:bg-gray-200"}`}><Printer size={18} /></button>
            <button className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-200" : "hover:bg-gray-200"}`}><Download size={18} /></button>
          </div>

          {isDetailedView && (
            <div className={`absolute right-0 mt-2 w-48 p-3 rounded bg-white shadow-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : ''}`}>
              <div className="text-sm font-semibold mb-2">Show Columns</div>
              <label className="flex items-center justify-between mb-2">
                <span>Opening</span>
                <input type="checkbox" checked={showOpening} onChange={(e) => setShowOpening(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between mb-2">
                <span>Debit</span>
                <input type="checkbox" checked={showDebit} onChange={(e) => setShowDebit(e.target.checked)} />
              </label>
              <label className="flex items-center justify-between mb-2">
                <span>Credit</span>
                <input type="checkbox" checked={showCredit} onChange={(e) => setShowCredit(e.target.checked)} />
              </label>
              <hr className="my-2 border-t" />
              <label className="flex items-center justify-between">
                <span>Show Details</span>
                <input type="checkbox" checked={isDetailedView} onChange={(e) => setIsDetailedView(e.target.checked)} />
              </label>
            </div>
          )}
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
                {showOpening && <th className="py-3 px-4 text-right">Opening Balance</th>}
                {showDebit && <th className="py-3 px-4 text-right">Debit</th>}
                {showCredit && <th className="py-3 px-4 text-right">Credit</th>}
                <th className="py-3 px-4 text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody>
              {trialGroups.map(tg => {
                const alwaysShowGroups = [
                  "Capital Account",
                  "Loan(Liability)",
                  "Current Liabilities",
                  "Current Assets",
                  "Sales Accounts",
                  "Purchase Accounts",
                  "Indirect Income",
                  "Indirect Expenses"
                ];
                const isAlwaysShow = alwaysShowGroups.includes(tg.name);
                
                const totals = calculateGroupTotals(tg.id);
                if (totals.opening === 0 && totals.debit === 0 && totals.credit === 0 && totals.closing === 0 && !isDetailedView && !isAlwaysShow) return null;

                return (
                  <React.Fragment key={tg.id}>
                    <tr
                      className={`border-b border-gray-300 font-semibold cursor-pointer transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-indigo-50'}`}
                      onClick={() => navigate(`/app/reports/sub-group-summary/${tg.id}`)}
                    >
                      <td className="py-3 px-4 text-blue-600">{tg.name}</td>
                      {showOpening && (
                        <td className="py-3 px-4 text-right font-mono">
                          {totals.opening !== 0 ? `${Math.abs(totals.opening).toLocaleString()} ${totals.opening > 0 ? "Dr" : "Cr"}` : (isAlwaysShow ? "0" : "")}
                        </td>
                      )}
                      {showDebit && (
                        <td className="py-3 px-4 text-right font-mono">{totals.debit > 0 ? totals.debit.toLocaleString() : (isAlwaysShow ? "0" : "")}</td>
                      )}
                      {showCredit && (
                        <td className="py-3 px-4 text-right font-mono">{totals.credit > 0 ? totals.credit.toLocaleString() : (isAlwaysShow ? "0" : "")}</td>
                      )}
                      <td className="py-3 px-4 text-right font-mono">
                        {totals.closing !== 0 ? `${Math.abs(totals.closing).toLocaleString()} ${totals.closing > 0 ? "Dr" : "Cr"}` : (isAlwaysShow ? "0" : "")}
                      </td>
                    </tr>
                    {isDetailedView && renderGroupRows(tg.id)}
                  </React.Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="font-bold text-lg border-t-2 border-gray-400 cursor-pointer" onClick={() => setIsDetailedView(true)}>
                <td className="py-3 px-4 font-bold">Grand Total</td>
                {showOpening && (
                  <td className="py-3 px-4 text-right text-indigo-600 font-mono text-sm">
                    {grandTotals.openingDr > 0 || grandTotals.openingCr > 0 ? (
                      <>
                        {grandTotals.openingDr > grandTotals.openingCr
                          ? `${(grandTotals.openingDr - grandTotals.openingCr).toLocaleString()} Dr`
                          : `${(grandTotals.openingCr - grandTotals.openingDr).toLocaleString()} Cr`}
                      </>
                    ) : "-"}
                  </td>
                )}
                {showDebit && (
                  <td className="py-3 px-4 text-right text-indigo-600 font-mono">{grandTotals.debit.toLocaleString()}</td>
                )}
                {showCredit && (
                  <td className="py-3 px-4 text-right text-indigo-600 font-mono">{grandTotals.credit.toLocaleString()}</td>
                )}
                <td className="py-3 px-4 text-right text-indigo-600 font-mono text-sm">
                  {grandTotals.closingDr > 0 || grandTotals.closingCr > 0 ? (
                    <>
                      {grandTotals.closingDr > grandTotals.closingCr
                        ? `${(grandTotals.closingDr - grandTotals.closingCr).toLocaleString()} Dr`
                        : `${(grandTotals.closingCr - grandTotals.closingDr).toLocaleString()} Cr`}
                    </>
                  ) : "-"}
                </td>
              </tr>
              <tr 
                className={`font-bold border-t-2 border-red-300 cursor-pointer transition-opacity hover:opacity-80 ${theme === 'dark' ? 'bg-red-900/20 text-red-400' : 'bg-red-50 text-red-600'}`}
                onClick={() => setShowDiffModal(true)}
              >
                <td className="py-4 px-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] uppercase tracking-wide">Difference</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${theme === 'dark' ? 'bg-red-800/50 text-red-200' : 'bg-red-200/60 text-red-800'}`}>
                      Total Dr: {grandTotals.closingDr.toLocaleString()} &nbsp;|&nbsp; Total Cr: {grandTotals.closingCr.toLocaleString()}
                    </span>
                  </div>
                </td>
                {showOpening && (
                  <td className="py-4 px-4 text-right font-mono text-sm">
                    {Math.abs(grandTotals.openingDr - grandTotals.openingCr).toLocaleString()} {grandTotals.openingDr > grandTotals.openingCr ? "Dr" : grandTotals.openingDr < grandTotals.openingCr ? "Cr" : ""}
                  </td>
                )}
                {showDebit && (
                  <td className="py-4 px-4 text-right font-mono">
                    {Math.abs(grandTotals.debit - grandTotals.credit).toLocaleString()}
                  </td>
                )}
                {showCredit && (
                  <td className="py-4 px-4 text-right font-mono">
                    {Math.abs(grandTotals.debit - grandTotals.credit).toLocaleString()}
                  </td>
                )}
                <td className="py-4 px-4 text-right font-mono text-[15px]">
                  {Math.abs(grandTotals.closingDr - grandTotals.closingCr).toLocaleString()} {grandTotals.closingDr > grandTotals.closingCr ? "Dr" : grandTotals.closingDr < grandTotals.closingCr ? "Cr" : ""}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Difference Analysis Modal */}
      {showDiffModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl rounded-lg shadow-xl p-6 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-red-500 flex items-center gap-2">
                ⚠️ Difference Analysis
              </h2>
              <button onClick={() => setShowDiffModal(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
              {/* Opening Balance Analysis */}
              <div className={`p-4 border rounded-lg ${Math.abs(grandTotals.openingDr - grandTotals.openingCr) !== 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-green-300 bg-green-50 dark:bg-green-900/10'}`}>
                <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
                  1. Opening Balance Difference
                  <span className={`font-mono ${Math.abs(grandTotals.openingDr - grandTotals.openingCr) !== 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {Math.abs(grandTotals.openingDr - grandTotals.openingCr).toLocaleString()} {grandTotals.openingDr > grandTotals.openingCr ? "Dr" : grandTotals.openingDr < grandTotals.openingCr ? "Cr" : ""}
                  </span>
                </h3>
                {Math.abs(grandTotals.openingDr - grandTotals.openingCr) === 0 ? (
                  <p className="text-sm text-green-700 dark:text-green-400">✅ Opening balances are perfectly balanced (Total Dr = Total Cr).</p>
                ) : (
                  <>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                      The sum of all ledger opening balances does not match. Please review the opening balances of the following ledgers to find the missing amount.
                    </p>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="py-2 px-3">Ledger Name</th>
                            <th className="py-2 px-3 text-right">Opening Debit (Dr)</th>
                            <th className="py-2 px-3 text-right">Opening Credit (Cr)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ledgers.filter(l => Number(l.openingBalance) > 0).map(l => (
                            <tr key={l.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="py-2 px-3 text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => { setShowDiffModal(false); navigate(`/app/reports/ledger/${l.id}`); }}>{l.name}</td>
                              <td className="py-2 px-3 text-right font-mono text-red-500">{l.balanceType === 'debit' ? Number(l.openingBalance).toLocaleString() : '-'}</td>
                              <td className="py-2 px-3 text-right font-mono text-green-600">{l.balanceType === 'credit' ? Number(l.openingBalance).toLocaleString() : '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50 dark:bg-gray-700 font-bold sticky bottom-0 border-t border-gray-300 dark:border-gray-600">
                          <tr>
                            <td className="py-2 px-3 text-right">Totals:</td>
                            <td className="py-2 px-3 text-right font-mono text-red-600">{grandTotals.openingDr.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right font-mono text-green-600">{grandTotals.openingCr.toLocaleString()}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Transactions Analysis */}
              <div className={`p-4 border rounded-lg ${Math.abs(grandTotals.debit - grandTotals.credit) !== 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/10' : 'border-green-300 bg-green-50 dark:bg-green-900/10'}`}>
                <h3 className="font-bold text-lg mb-2 flex items-center justify-between">
                  2. Current Transactions Difference
                  <span className={`font-mono ${Math.abs(grandTotals.debit - grandTotals.credit) !== 0 ? 'text-red-500' : 'text-green-600'}`}>
                    {Math.abs(grandTotals.debit - grandTotals.credit).toLocaleString()}
                  </span>
                </h3>
                {Math.abs(grandTotals.debit - grandTotals.credit) === 0 ? (
                  <p className="text-sm text-green-700 dark:text-green-400">✅ All transactions during this period are perfectly balanced (Total Dr = Total Cr).</p>
                ) : (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <p className="mb-2">⚠️ There is a mismatch in your voucher entries.</p>
                    <p className="mb-4">This happens if a voucher was saved with unequal debit and credit amounts. Please review the following unbalanced vouchers:</p>

                    {loadingVouchers ? (
                      <div className="text-gray-600 dark:text-gray-300">Loading unbalanced vouchers...</div>
                    ) : unbalancedVouchers.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto border border-red-200 dark:border-red-800 rounded bg-white dark:bg-gray-800">
                        <table className="w-full text-sm text-left">
                          <thead className="bg-red-50 dark:bg-red-900/30 sticky top-0">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Voucher No</th>
                              <th className="py-2 px-3">Type</th>
                              <th className="py-2 px-3 text-right">Debit Sum</th>
                              <th className="py-2 px-3 text-right">Credit Sum</th>
                              <th className="py-2 px-3 text-right">Difference</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unbalancedVouchers.map(v => (
                              <tr key={v.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="py-2 px-3">{new Date(v.date).toLocaleDateString('en-GB')}</td>
                                <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => { setShowDiffModal(false); navigate(`/app/vouchers/${v.voucherType.toLowerCase()}/${v.id}`); }}>{v.voucherNo}</td>
                                <td className="py-2 px-3 capitalize">{v.voucherType}</td>
                                <td className="py-2 px-3 text-right font-mono text-red-500">{v.debit.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-mono text-green-600">{v.credit.toLocaleString()}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-red-600">{v.diff.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : problematicLedgers.length > 0 ? (
                      <div className="mt-4 border-t border-red-200 dark:border-red-800 pt-4">
                        <p className="text-gray-700 dark:text-gray-300 mb-2 font-semibold">We found missing or problematic ledgers:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">These ledgers have balances but are NOT included in your Trial Balance groups. Check their Primary Group settings.</p>
                        <div className="max-h-60 overflow-y-auto border border-red-200 dark:border-red-800 rounded bg-white dark:bg-gray-800">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-red-50 dark:bg-red-900/30 sticky top-0">
                              <tr>
                                <th className="py-2 px-3">Ledger Name</th>
                                <th className="py-2 px-3">Associated Vouchers</th>
                                <th className="py-2 px-3">Reason</th>
                                <th className="py-2 px-3 text-right">Debit Sum</th>
                                <th className="py-2 px-3 text-right">Credit Sum</th>
                                <th className="py-2 px-3 text-right">Difference</th>
                              </tr>
                            </thead>
                            <tbody>
                              {problematicLedgers.map((l: any) => (
                                <tr key={l.id} className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                  <td className="py-2 px-3 font-semibold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:underline" onClick={() => { setShowDiffModal(false); navigate(`/app/reports/ledger/${l.id}`); }}>{l.name}</td>
                                  <td className="py-2 px-3 text-xs text-gray-500 break-words max-w-[150px]">{l.vouchers}</td>
                                  <td className="py-2 px-3 text-xs text-red-500">{l.reason}</td>
                                  <td className="py-2 px-3 text-right font-mono text-red-500">{l.dr?.toLocaleString() || '0'}</td>
                                  <td className="py-2 px-3 text-right font-mono text-green-600">{l.cr?.toLocaleString() || '0'}</td>
                                  <td className="py-2 px-3 text-right font-mono font-bold text-red-600">{l.diff?.toLocaleString() || '0'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-600 dark:text-gray-300">No specific unbalanced vouchers found. The difference may be coming from stock calculations or other system entries.</div>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowDiffModal(false)} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold shadow">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrialBalance;
