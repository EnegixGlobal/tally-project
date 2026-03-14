import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft, Printer, Download, Settings, ChevronDown, ChevronRight } from "lucide-react";

interface Company {
  id: number;
  name: string;
}

interface Ledger {
  id: number;
  name: string;
  groupId: number;
  openingBalance: number;
  balanceType: "debit" | "credit";
  groupName: string;
  groupType: string | null;
  companyId: number;
  companyName: string;
}

interface LedgerGroup {
  id: number;
  name: string;
  type: string | null;
  parent: number | null;
  companyId: number;
}

const formatINR = (value: number) => {
  if (value === undefined || value === null || isNaN(value)) return "₹0.00";
  return "₹" + Math.abs(value).toLocaleString("en-IN", { minimumFractionDigits: 2 });
};

const ConsolidatedFinancialReport: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const employeeId = localStorage.getItem("employee_id") || "";

  const [companies, setCompanies] = useState<Company[]>([]);
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetailedView, setIsDetailedView] = useState(false);

  const [salesData, setSalesData] = useState<Record<number, number>>({});
  const [purchaseData, setPurchaseData] = useState<Record<number, number>>({});

  const [debitCreditData, setDebitCreditData] = useState<
    Record<string, { debit: number; credit: number }>
  >({});

  const [profitLossData, setProfitLossData] = useState<
    Record<number, { netProfit: number; netLoss: number; transferredProfit: number; transferredLoss: number }>
  >({});

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    liabilities: true,
    assets: true,
    trading: true,
    profitLoss: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!employeeId) return;
      setLoading(true);
      setError(null);
      try {
        const url = `${import.meta.env.VITE_API_URL}/api/consolidated-balance-sheet?employee_id=${employeeId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load consolidated data");
        const data = await res.json();

        setCompanies(data.companies || []);
        setLedgers(data.ledgers || []);
        setLedgerGroups(data.ledgerGroups || []);
        setDebitCreditData(data.debitCreditData || {});
        setProfitLossData(data.profitLossData || {});
        setSalesData(data.salesData || {});
        setPurchaseData(data.purchaseData || {});
      } catch (err: any) {
        setError(err.message || "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [employeeId]);

  const calculateClosingBalance = (ledger: Ledger): number => {
    const opening = Number(ledger.openingBalance) || 0;
    const key = `${ledger.companyId}_${ledger.id}`;
    const debit = debitCreditData[key]?.debit || 0;
    const credit = debitCreditData[key]?.credit || 0;
    return ledger.balanceType === "debit" ? (opening + debit - credit) : (opening + credit - debit);
  };

  const calculateGroupTotalByCompany = (groupId: number, companyId: number): number => {
    const findSubGroups = (id: number): number[] => {
      let results = [id];
      ledgerGroups.filter(g => g.parent === id).forEach(c => {
        results = [...results, ...findSubGroups(c.id)];
      });
      return results;
    };
    const allGroupIds = findSubGroups(groupId);
    const companyLedgers = ledgers.filter(l => allGroupIds.includes(Number(l.groupId)) && l.companyId === companyId);
    return companyLedgers.reduce((sum, ledger) => sum + Math.abs(calculateClosingBalance(ledger)), 0);
  };

  const getCompanyProfitLoss = (companyId: number) => {
    const data = profitLossData[companyId];
    if (!data) return 0;
    return data.netProfit - data.netLoss - data.transferredProfit + data.transferredLoss;
  };

  const getTotalForGroup = (groupId: number) => {
    return companies.reduce((sum, c) => sum + calculateGroupTotalByCompany(groupId, c.id), 0);
  };

  const getSalesForCompany = (companyId: number) => {
    return salesData[companyId] || 0;
  };

  const getPurchaseForCompany = (companyId: number) => {
    return purchaseData[companyId] || 0;
  };

  const getTotalSales = () => companies.reduce((sum, c) => sum + getSalesForCompany(c.id), 0);
  const getTotalPurchase = () => companies.reduce((sum, c) => sum + getPurchaseForCompany(c.id), 0);
  const getTotalPL = () => companies.reduce((sum, c) => sum + getCompanyProfitLoss(c.id), 0);

  const getDirectExpenseForCompany = (companyId: number) => calculateGroupTotalByCompany(-7, companyId);
  const getDirectIncomeForCompany = (companyId: number) => calculateGroupTotalByCompany(-8, companyId);
  const getIndirectIncomeForCompany = (companyId: number) => calculateGroupTotalByCompany(-11, companyId);

  const getTotalDirectExpense = () => companies.reduce((sum, c) => sum + getDirectExpenseForCompany(c.id), 0);
  const getTotalDirectIncome = () => companies.reduce((sum, c) => sum + getDirectIncomeForCompany(c.id), 0);
  const getTotalIndirectIncome = () => companies.reduce((sum, c) => sum + getIndirectIncomeForCompany(c.id), 0);

  const getCompanyGrossProfit = (companyId: number) => {
    const sale = getSalesForCompany(companyId);
    const purchase = getPurchaseForCompany(companyId);
    const directExp = getDirectExpenseForCompany(companyId);
    const directInc = getDirectIncomeForCompany(companyId);
    return (sale + directInc) - (purchase + directExp);
  };

  const getTotalGrossProfit = () => {
    return companies.reduce((sum, c) => sum + getCompanyGrossProfit(c.id), 0);
  };

  // Get ledgers for a group by company
  const getLedgersForGroup = (groupId: number, companyId: number) => {
    const findSubGroups = (id: number): number[] => {
      let results = [id];
      ledgerGroups.filter(g => g.parent === id).forEach(c => {
        results = [...results, ...findSubGroups(c.id)];
      });
      return results;
    };
    const allGroupIds = findSubGroups(groupId);
    return ledgers.filter(l => allGroupIds.includes(Number(l.groupId)) && l.companyId === companyId);
  };

  const liabilityGroups = [
    { id: -4, name: "Capital Account" },
    { id: -13, name: "Loans (Liability)" },
    { id: -6, name: "Current Liabilities" },
    { id: -19, name: "TDS Payable" },
  ];

  const assetGroups = [
    { id: -9, name: "Fixed Assets" },
    { id: -5, name: "Current Assets" },
  ];

  if (loading) return <div className="pt-[56px] px-4 text-center py-10">Loading consolidated report...</div>;
  if (!employeeId) return <div className="pt-[56px] px-4 text-center py-10">No employee ID found.</div>;
  if (error) return <div className="pt-[56px] px-4 text-center py-10 text-red-600">{error}</div>;
  if (companies.length === 0) return <div className="pt-[56px] px-4 text-center py-10">No companies assigned.</div>;

  const isDark = theme === "dark";
  const tableClass = `w-full text-sm border-collapse`;
  const thClass = `px-3 py-2 text-left font-semibold border border-gray-300 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100'}`;
  const thRightClass = `px-3 py-2 text-right font-semibold border border-gray-300 ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100'}`;
  const tdClass = `px-3 py-2 border border-gray-300 ${isDark ? 'border-gray-600' : ''}`;
  const tdRightClass = `px-3 py-2 text-right font-mono border border-gray-300 ${isDark ? 'border-gray-600' : ''}`;
  const totalRowClass = `font-bold ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`;

  return (
    <div className={`pt-[56px] px-4 pb-8 min-h-screen ${isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <div className="flex items-center mb-6 flex-wrap gap-2">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => navigate("/app/reports")}
          className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Consolidated Financial Report</h1>
          <p className="text-xs text-gray-500">{companies.length} {companies.length === 1 ? 'Company' : 'Companies'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button
            title="Toggle Detailed View"
            onClick={() => setIsDetailedView(!isDetailedView)}
            className={`p-2 rounded-md transition-all ${isDetailedView ? 'bg-blue-600 text-white' : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Settings size={18} />
          </button>
          <button title="Print" className={`p-2 rounded-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`} onClick={() => window.print()}><Printer size={18} /></button>
          <button title="Download" className={`p-2 rounded-md ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}><Download size={18} /></button>
        </div>
      </div>

      {isDetailedView && (
        <div className={`mb-4 p-3 rounded border text-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'}`}>
          <strong>Detailed Mode:</strong> Showing ledger-wise breakdown for each group
        </div>
      )}

      {/* Individual Company Reports in Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {companies.map(c => {
          const companySales = getSalesForCompany(c.id);
          const companyPurchase = getPurchaseForCompany(c.id);
          const companyDirectExp = getDirectExpenseForCompany(c.id);
          const companyDirectInc = getDirectIncomeForCompany(c.id);
          const companyGrossPL = getCompanyGrossProfit(c.id);

          const pl = profitLossData[c.id] || { netProfit: 0, netLoss: 0, transferredProfit: 0, transferredLoss: 0 };
          const companyNetPL = getCompanyProfitLoss(c.id);

          const totalAsset = assetGroups.reduce((sum, g) => sum + calculateGroupTotalByCompany(g.id, c.id), 0);
          const totalLiab = liabilityGroups.reduce((sum, g) => sum + calculateGroupTotalByCompany(g.id, c.id), 0) + companyNetPL;

          return (
            <div key={c.id} className={`rounded border overflow-hidden shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
              <div className={`px-4 py-3 border-b pb-2 flex items-center justify-between ${isDark ? 'border-gray-700 bg-gray-750' : 'bg-gray-50 border-gray-200'}`}>
                <h2 className="text-lg font-bold truncate pr-4 text-indigo-600">{c.name}</h2>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-800 shrink-0">
                  {formatINR(companyNetPL)} N/P
                </span>
              </div>

              <div className="p-3">
                {/* Trading Account Segment */}
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Trading Account</h3>
                <div className="mb-4">
                  <table className={tableClass}>
                    <tbody>
                      <React.Fragment>
                        <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={tdClass}>Purchase</td>
                          <td className={`${tdRightClass}`}>{formatINR(companyPurchase)}</td>
                        </tr>
                        {isDetailedView && getLedgersForGroup(-15, c.id).filter(ledger => calculateClosingBalance(ledger) !== 0).map(ledger => (
                          <tr key={ledger.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                            <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {ledger.name}</td>
                            <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(ledger))}</td>
                          </tr>
                        ))}
                      </React.Fragment>

                      <React.Fragment>
                        <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={tdClass}>To Direct Expense</td>
                          <td className={`${tdRightClass}`}>{formatINR(companyDirectExp)}</td>
                        </tr>
                        {isDetailedView && getLedgersForGroup(-7, c.id).filter(ledger => calculateClosingBalance(ledger) !== 0).map(ledger => (
                          <tr key={ledger.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                            <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {ledger.name}</td>
                            <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(ledger))}</td>
                          </tr>
                        ))}
                      </React.Fragment>

                      <React.Fragment>
                        <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={tdClass}>By Sale</td>
                          <td className={`${tdRightClass}`}>{formatINR(companySales)}</td>
                        </tr>
                        {isDetailedView && getLedgersForGroup(-16, c.id).filter(ledger => calculateClosingBalance(ledger) !== 0).map(ledger => (
                          <tr key={ledger.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                            <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {ledger.name}</td>
                            <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(ledger))}</td>
                          </tr>
                        ))}
                      </React.Fragment>

                      <React.Fragment>
                        <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                          <td className={tdClass}>By Direct Income</td>
                          <td className={`${tdRightClass}`}>{formatINR(companyDirectInc)}</td>
                        </tr>
                        {isDetailedView && getLedgersForGroup(-8, c.id).filter(ledger => calculateClosingBalance(ledger) !== 0).map(ledger => (
                          <tr key={ledger.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                            <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {ledger.name}</td>
                            <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(ledger))}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                      <tr className={totalRowClass}>
                        <td className={tdClass}>Gross Profit/Loss</td>
                        <td className={`${tdRightClass} font-bold`}>{formatINR(companyGrossPL)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* P&L Segment */}
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Profit & Loss</h3>
                <div className="mb-4">
                  <table className={tableClass}>
                    <tbody>
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Net Profit</td>
                        <td className={tdRightClass}>{formatINR(pl.netProfit)}</td>
                      </tr>
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Net Loss</td>
                        <td className={tdRightClass}>{formatINR(pl.netLoss)}</td>
                      </tr>
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Transferred</td>
                        <td className={tdRightClass}>{formatINR(pl.transferredProfit - pl.transferredLoss)}</td>
                      </tr>
                      <tr className={totalRowClass}>
                        <td className={tdClass}>Net P&L</td>
                        <td className={`${tdRightClass} font-bold`}>{formatINR(companyNetPL)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Liabilities Segment */}
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Liabilities</h3>
                <div className="mb-4">
                  <table className={tableClass}>
                    <tbody>
                      {liabilityGroups.map(group => (
                        <React.Fragment key={group.id}>
                          <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                            <td className={`${tdClass} font-medium`}>{group.name}</td>
                            <td className={`${tdRightClass}`}>{formatINR(calculateGroupTotalByCompany(group.id, c.id))}</td>
                          </tr>
                          {isDetailedView && getLedgersForGroup(group.id, c.id).filter(ledger => calculateClosingBalance(ledger) !== 0).map(ledger => (
                            <tr key={ledger.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {ledger.name}</td>
                              <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(ledger))}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`${tdClass} font-medium`}>Profit & Loss A/c</td>
                        <td className={`${tdRightClass}`}>{formatINR(companyNetPL)}</td>
                      </tr>
                      <tr className={totalRowClass}>
                        <td className={tdClass}>Total Liabilities</td>
                        <td className={`${tdRightClass} font-bold`}>{formatINR(totalLiab)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Assets Segment */}
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Assets</h3>
                <div className="mb-2">
                  <table className={tableClass}>
                    <tbody>
                      {assetGroups.map(group => (
                        <React.Fragment key={group.id}>
                          <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                            <td className={`${tdClass} font-medium`}>{group.name}</td>
                            <td className={`${tdRightClass}`}>{formatINR(calculateGroupTotalByCompany(group.id, c.id))}</td>
                          </tr>
                          {isDetailedView && getLedgersForGroup(group.id, c.id).filter(ledger => calculateClosingBalance(ledger) !== 0).map(ledger => (
                            <tr key={ledger.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                              <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {ledger.name}</td>
                              <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(ledger))}</td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                      <tr className={totalRowClass}>
                        <td className={tdClass}>Total Assets</td>
                        <td className={`${tdRightClass} font-bold`}>{formatINR(totalAsset)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Diff Segment */}
                {totalAsset - totalLiab !== 0 && (
                  <div className={`mt-2 p-2 rounded text-xm text-center ${isDark ? 'bg-red-900/40 text-red-200' : 'bg-red-50 text-red-600'}`}>
                    Difference: {formatINR(totalAsset - totalLiab)}
                  </div>
                )}

              </div>
            </div>
          );
        })}
      </div>

      {/* OVERALL SUMMARY TABLE */}
      <div className={`rounded border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
        <div className={`px-4 py-3 flex items-center justify-between ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h2 className="text-md font-bold">Consolidated Summary {companies.length > 0 && `(All ${companies.length} Companies)`}</h2>
          <span className="text-sm font-bold text-indigo-600">Total Net P/L: {formatINR(getTotalPL())}</span>
        </div>

        <div className="overflow-x-auto p-2">
          <table className={tableClass}>
            <thead>
              <tr>
                <th className={thClass}>Company</th>
                <th className={thRightClass}>Sales</th>
                <th className={thRightClass}>Purchase</th>
                <th className={thRightClass}>Gross P/L</th>
                <th className={thRightClass}>Net P/L</th>
                <th className={thRightClass}>Liabilities</th>
                <th className={thRightClass}>Assets</th>
                <th className={thRightClass}>Diff</th>
              </tr>
            </thead>
            <tbody>
              {companies.map(c => {
                const sales = getSalesForCompany(c.id);
                const purchase = getPurchaseForCompany(c.id);
                const grossPL = getCompanyGrossProfit(c.id);
                const netPL = getCompanyProfitLoss(c.id);
                const totalLiab = liabilityGroups.reduce((sum, g) => sum + calculateGroupTotalByCompany(g.id, c.id), 0) + netPL;
                const totalAssets = assetGroups.reduce((sum, g) => sum + calculateGroupTotalByCompany(g.id, c.id), 0);
                const diff = totalAssets - totalLiab;

                return (
                  <tr key={c.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`${tdClass} font-medium`}>{c.name}</td>
                    <td className={tdRightClass}>{formatINR(sales)}</td>
                    <td className={tdRightClass}>{formatINR(purchase)}</td>
                    <td className={tdRightClass}>{formatINR(grossPL)}</td>
                    <td className={`${tdRightClass} font-semibold`}>{formatINR(netPL)}</td>
                    <td className={tdRightClass}>{formatINR(totalLiab)}</td>
                    <td className={tdRightClass}>{formatINR(totalAssets)}</td>
                    <td className={`${tdRightClass} font-semibold`}>{formatINR(diff)}</td>
                  </tr>
                );
              })}
              <tr className={totalRowClass}>
                <td className={tdClass}>Total</td>
                <td className={tdRightClass}>{formatINR(getTotalSales())}</td>
                <td className={tdRightClass}>{formatINR(getTotalPurchase())}</td>
                <td className={tdRightClass}>{formatINR(getTotalGrossProfit())}</td>
                <td className={`${tdRightClass} font-bold`}>{formatINR(getTotalPL())}</td>
                <td className={`${tdRightClass} font-bold`}>{formatINR(liabilityGroups.reduce((sum, g) => sum + getTotalForGroup(g.id), 0) + getTotalPL())}</td>
                <td className={`${tdRightClass} font-bold`}>{formatINR(assetGroups.reduce((sum, g) => sum + getTotalForGroup(g.id), 0))}</td>
                <td className={`${tdRightClass} font-bold`}>
                  {formatINR(assetGroups.reduce((sum, g) => sum + getTotalForGroup(g.id), 0) - (liabilityGroups.reduce((sum, g) => sum + getTotalForGroup(g.id), 0) + getTotalPL()))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div >
  );
};

export default ConsolidatedFinancialReport;
