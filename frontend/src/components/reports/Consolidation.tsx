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

  const getTotalSales = () => companies.reduce((sum, c) => sum + (salesData[c.id] || 0), 0);
  const getTotalPurchase = () => companies.reduce((sum, c) => sum + (purchaseData[c.id] || 0), 0);
  const getTotalPL = () => companies.reduce((sum, c) => sum + getCompanyProfitLoss(c.id), 0);

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

      {/* TRADING ACCOUNT */}
      <div className={`mb-4 rounded border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
        <div
          className={`px-3 py-2 flex items-center justify-between cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
          onClick={() => toggleSection('trading')}
        >
          <h2 className="text-sm font-bold flex items-center gap-2">
            {expandedSections.trading ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Trading Account
          </h2>
        </div>

        {expandedSections.trading && (
          <div className="overflow-x-auto p-2">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass} style={{ minWidth: '150px' }}>Particulars</th>
                  {companies.map(c => (
                    <th key={c.id} className={thRightClass} style={{ minWidth: '120px' }}>{c.name}</th>
                  ))}
                  <th className={thRightClass} style={{ minWidth: '120px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={tdClass}>Sales</td>
                  {companies.map(c => (
                    <td key={c.id} className={tdRightClass}>{formatINR(salesData[c.id] || 0)}</td>
                  ))}
                  <td className={`${tdRightClass} font-bold`}>{formatINR(getTotalSales())}</td>
                </tr>
                <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={tdClass}>Purchase</td>
                  {companies.map(c => (
                    <td key={c.id} className={tdRightClass}>{formatINR(purchaseData[c.id] || 0)}</td>
                  ))}
                  <td className={`${tdRightClass} font-bold`}>{formatINR(getTotalPurchase())}</td>
                </tr>
                <tr className={totalRowClass}>
                  <td className={tdClass}>Gross Profit/Loss</td>
                  {companies.map(c => (
                    <td key={c.id} className={tdRightClass}>{formatINR((salesData[c.id] || 0) - (purchaseData[c.id] || 0))}</td>
                  ))}
                  <td className={`${tdRightClass} font-bold`}>{formatINR(getTotalSales() - getTotalPurchase())}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PROFIT & LOSS */}
      <div className={`mb-4 rounded border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
        <div
          className={`px-3 py-2 flex items-center justify-between cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
          onClick={() => toggleSection('profitLoss')}
        >
          <h2 className="text-sm font-bold flex items-center gap-2">
            {expandedSections.profitLoss ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Profit & Loss
          </h2>
        </div>

        {expandedSections.profitLoss && (
          <div className="overflow-x-auto p-2">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass}>Company</th>
                  <th className={thRightClass}>Net Profit</th>
                  <th className={thRightClass}>Net Loss</th>
                  <th className={thRightClass}>Transferred</th>
                  <th className={thRightClass}>Net P&L</th>
                </tr>
              </thead>
              <tbody>
                {companies.map(c => {
                  const pl = profitLossData[c.id] || { netProfit: 0, netLoss: 0, transferredProfit: 0, transferredLoss: 0 };
                  const netPL = getCompanyProfitLoss(c.id);
                  return (
                    <tr key={c.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={tdClass}>{c.name}</td>
                      <td className={tdRightClass}>{formatINR(pl.netProfit)}</td>
                      <td className={tdRightClass}>{formatINR(pl.netLoss)}</td>
                      <td className={tdRightClass}>{formatINR(pl.transferredProfit - pl.transferredLoss)}</td>
                      <td className={`${tdRightClass} font-bold`}>{formatINR(netPL)}</td>
                    </tr>
                  );
                })}
                <tr className={totalRowClass}>
                  <td className={tdClass}>Total</td>
                  <td className={tdRightClass}>{formatINR(companies.reduce((sum, c) => sum + (profitLossData[c.id]?.netProfit || 0), 0))}</td>
                  <td className={tdRightClass}>{formatINR(companies.reduce((sum, c) => sum + (profitLossData[c.id]?.netLoss || 0), 0))}</td>
                  <td className={tdRightClass}>{formatINR(companies.reduce((sum, c) => sum + ((profitLossData[c.id]?.transferredProfit || 0) - (profitLossData[c.id]?.transferredLoss || 0)), 0))}</td>
                  <td className={`${tdRightClass} font-bold`}>{formatINR(getTotalPL())}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LIABILITIES */}
      <div className={`mb-4 rounded border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
        <div
          className={`px-3 py-2 flex items-center justify-between cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
          onClick={() => toggleSection('liabilities')}
        >
          <h2 className="text-sm font-bold flex items-center gap-2">
            {expandedSections.liabilities ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Liabilities
          </h2>
          <span className="text-sm font-bold">{formatINR(liabilityGroups.reduce((sum, g) => sum + getTotalForGroup(g.id), 0) + getTotalPL())}</span>
        </div>

        {expandedSections.liabilities && (
          <div className="overflow-x-auto p-2">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass} style={{ minWidth: '180px' }}>Particulars</th>
                  {companies.map(c => (
                    <th key={c.id} className={thRightClass} style={{ minWidth: '120px' }}>{c.name}</th>
                  ))}
                  <th className={thRightClass} style={{ minWidth: '120px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {liabilityGroups.map(group => (
                  <React.Fragment key={group.id}>
                    <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`${tdClass} font-medium`}>{group.name}</td>
                      {companies.map(c => (
                        <td key={c.id} className={tdRightClass}>{formatINR(calculateGroupTotalByCompany(group.id, c.id))}</td>
                      ))}
                      <td className={`${tdRightClass} font-bold`}>{formatINR(getTotalForGroup(group.id))}</td>
                    </tr>
                    {/* Detailed View - Show ledgers */}
                    {isDetailedView && companies.map(c => {
                      const groupLedgers = getLedgersForGroup(group.id, c.id);
                      return groupLedgers.map(ledger => (
                        <tr key={`${c.id}-${ledger.id}`} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {ledger.name} ({c.name})</td>
                          {companies.map(cc => (
                            <td key={cc.id} className={`${tdRightClass} text-gray-500`}>
                              {cc.id === c.id ? formatINR(calculateClosingBalance(ledger)) : '-'}
                            </td>
                          ))}
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(ledger))}</td>
                        </tr>
                      ));
                    })}
                  </React.Fragment>
                ))}
                <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className={`${tdClass} font-medium`}>Profit & Loss A/c</td>
                  {companies.map(c => (
                    <td key={c.id} className={tdRightClass}>{formatINR(getCompanyProfitLoss(c.id))}</td>
                  ))}
                  <td className={`${tdRightClass} font-bold`}>{formatINR(getTotalPL())}</td>
                </tr>
                <tr className={totalRowClass}>
                  <td className={tdClass}>Total Liabilities</td>
                  {companies.map(c => {
                    const total = liabilityGroups.reduce((sum, g) => sum + calculateGroupTotalByCompany(g.id, c.id), 0) + getCompanyProfitLoss(c.id);
                    return <td key={c.id} className={`${tdRightClass} font-bold`}>{formatINR(total)}</td>;
                  })}
                  <td className={`${tdRightClass} font-bold`}>{formatINR(liabilityGroups.reduce((sum, g) => sum + getTotalForGroup(g.id), 0) + getTotalPL())}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ASSETS */}
      <div className={`mb-4 rounded border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
        <div
          className={`px-3 py-2 flex items-center justify-between cursor-pointer ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
          onClick={() => toggleSection('assets')}
        >
          <h2 className="text-sm font-bold flex items-center gap-2">
            {expandedSections.assets ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Assets
          </h2>
          <span className="text-sm font-bold">{formatINR(assetGroups.reduce((sum, g) => sum + getTotalForGroup(g.id), 0))}</span>
        </div>

        {expandedSections.assets && (
          <div className="overflow-x-auto p-2">
            <table className={tableClass}>
              <thead>
                <tr>
                  <th className={thClass} style={{ minWidth: '180px' }}>Particulars</th>
                  {companies.map(c => (
                    <th key={c.id} className={thRightClass} style={{ minWidth: '120px' }}>{c.name}</th>
                  ))}
                  <th className={thRightClass} style={{ minWidth: '120px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {assetGroups.map(group => (
                  <React.Fragment key={group.id}>
                    <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className={`${tdClass} font-medium`}>{group.name}</td>
                      {companies.map(c => (
                        <td key={c.id} className={tdRightClass}>{formatINR(calculateGroupTotalByCompany(group.id, c.id))}</td>
                      ))}
                      <td className={`${tdRightClass} font-bold`}>{formatINR(getTotalForGroup(group.id))}</td>
                    </tr>
                    {/* Detailed View - Show ledgers */}
                    {isDetailedView && companies.map(c => {
                      const groupLedgers = getLedgersForGroup(group.id, c.id);
                      return groupLedgers.map(ledger => (
                        <tr key={`${c.id}-${ledger.id}`} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {ledger.name} ({c.name})</td>
                          {companies.map(cc => (
                            <td key={cc.id} className={`${tdRightClass} text-gray-500`}>
                              {cc.id === c.id ? formatINR(calculateClosingBalance(ledger)) : '-'}
                            </td>
                          ))}
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(ledger))}</td>
                        </tr>
                      ));
                    })}
                  </React.Fragment>
                ))}
                <tr className={totalRowClass}>
                  <td className={tdClass}>Total Assets</td>
                  {companies.map(c => {
                    const total = assetGroups.reduce((sum, g) => sum + calculateGroupTotalByCompany(g.id, c.id), 0);
                    return <td key={c.id} className={`${tdRightClass} font-bold`}>{formatINR(total)}</td>;
                  })}
                  <td className={`${tdRightClass} font-bold`}>{formatINR(assetGroups.reduce((sum, g) => sum + getTotalForGroup(g.id), 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPANY SUMMARY */}
      <div className={`rounded border overflow-hidden ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
        <div className={`px-3 py-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <h2 className="text-sm font-bold">Company-wise Summary</h2>
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
                const sales = salesData[c.id] || 0;
                const purchase = purchaseData[c.id] || 0;
                const grossPL = sales - purchase;
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
                <td className={tdRightClass}>{formatINR(getTotalSales() - getTotalPurchase())}</td>
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
    </div>
  );
};

export default ConsolidatedFinancialReport;
