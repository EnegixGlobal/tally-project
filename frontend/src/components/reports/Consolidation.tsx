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

  const [showItemWise, setShowItemWise] = useState(false);
  const [stockItemsMap, setStockItemsMap] = useState<Record<number, any[]>>({});
  const [purchaseHistoryMap, setPurchaseHistoryMap] = useState<Record<number, any[]>>({});
  const [salesHistoryMap, setSalesHistoryMap] = useState<Record<number, any[]>>({});

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

        // Load Item-wise setting
        const storedItemWise = localStorage.getItem("PL_SHOW_ITEM_WISE");
        if (storedItemWise !== null) {
          setShowItemWise(storedItemWise === "true");
        }

        // Fetch Inventory Data for all companies
        if (data.companies && data.companies.length > 0) {
          data.companies.forEach(async (c: Company) => {
            // Stock Items
            try {
              const stockRes = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-items?company_id=${c.id}&owner_type=employee&owner_id=${employeeId}`);
              const stockData = await stockRes.json();
              setStockItemsMap(prev => ({ ...prev, [c.id]: stockData.data || [] }));
            } catch (err) { console.error(`Stock fetch error for ${c.id}`, err); }

            // Purchase History
            try {
              const purRes = await fetch(`${import.meta.env.VITE_API_URL}/api/purchase-vouchers/purchase-history?company_id=${c.id}&owner_type=employee&owner_id=${employeeId}`);
              const purData = await purRes.json();
              setPurchaseHistoryMap(prev => ({ ...prev, [c.id]: purData.data || [] }));
            } catch (err) { console.error(`Purchase fetch error for ${c.id}`, err); }

            // Sales History
            try {
              const saleRes = await fetch(`${import.meta.env.VITE_API_URL}/api/sales-vouchers/sale-history?company_id=${c.id}&owner_type=employee&owner_id=${employeeId}`);
              const saleData = await saleRes.json();
              setSalesHistoryMap(prev => ({ ...prev, [c.id]: saleData.data || [] }));
            } catch (err) { console.error(`Sales fetch error for ${c.id}`, err); }
          });
        }
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

  const getIndirectExpenseForCompany = (companyId: number) => calculateGroupTotalByCompany(-10, companyId);
  const getIndirectIncomeForCompany = (companyId: number) => calculateGroupTotalByCompany(-11, companyId);

  const getInventoryCalculations = (companyId: number) => {
    const stockItems = stockItemsMap[companyId] || [];
    const pHistory = purchaseHistoryMap[companyId] || [];
    const sHistory = salesHistoryMap[companyId] || [];

    const itemMap: Record<string, any> = {};

    stockItems.forEach((item: any) => {
      const itemName = item.name;
      if (!itemMap[itemName]) {
        itemMap[itemName] = {
          name: itemName,
          openingQty: 0,
          openingValue: 0,
          inwardQty: 0,
          inwardValue: 0,
          outwardQty: 0,
          outwardValue: 0,
          closingQty: 0,
          closingValue: 0,
          avgRate: 0
        };
      }
      let batchesProcessed = false;
      const batches = typeof item.batches === 'string' ? JSON.parse(item.batches) : (item.batches || []);
      if (batches.length > 0) {
        batches.forEach((b: any) => {
          const q = Number(b.batchQuantity || 0);
          const r = Number(b.openingRate || 0);
          itemMap[itemName].openingQty += q;
          itemMap[itemName].openingValue += q * r;
          batchesProcessed = true;
        });
      }
      if (!batchesProcessed && (Number(item.openingBalance || 0) > 0)) {
        const q = Number(item.openingBalance || 0);
        const r = Number(item.openingRate || item.rate || 0);
        itemMap[itemName].openingQty += q;
        itemMap[itemName].openingValue += q * r;
      }
    });

    pHistory.forEach((p: any) => {
      const itemName = p.itemName;
      if (!itemMap[itemName]) {
        itemMap[itemName] = { name: itemName, openingQty: 0, openingValue: 0, inwardQty: 0, inwardValue: 0, outwardQty: 0, outwardValue: 0, closingQty: 0, closingValue: 0, avgRate: 0 };
      }
      const q = Number(p.purchaseQuantity || 0);
      const v = q * Number(p.rate || p.purchaseRate || 0);
      itemMap[itemName].inwardQty += q;
      itemMap[itemName].inwardValue += v;
    });

    sHistory.forEach((s: any) => {
      const itemName = s.itemName;
      if (!itemMap[itemName]) return;
      const q = Math.abs(Number(s.qtyChange || s.quantity || 0));
      itemMap[itemName].outwardQty += q;
    });

    let totalOpeningValue = 0;
    let totalClosingValue = 0;

    Object.values(itemMap).forEach((item: any) => {
      const totalInQty = item.openingQty + item.inwardQty;
      const totalInValue = item.openingValue + item.inwardValue;
      item.avgRate = totalInQty > 0 ? totalInValue / totalInQty : 0;
      item.closingQty = totalInQty - item.outwardQty;
      item.closingValue = item.closingQty * item.avgRate;
      if (Math.abs(item.closingQty) < 0.001) item.closingQty = 0;
      if (Math.abs(item.closingValue) < 0.01) item.closingValue = 0;
      totalOpeningValue += item.openingValue;
      totalClosingValue += Math.max(0, item.closingValue);
    });

    return { totalOpeningValue, totalClosingValue };
  };

  const getCompanyOpeningStock = (companyId: number) => {
    if (showItemWise) {
      return getInventoryCalculations(companyId).totalOpeningValue;
    }
    const stockLedgers = ledgers.filter(l => {
      const gname = (l.groupName || "").toLowerCase();
      const gtype = (l.groupType || "").toLowerCase();
      return (gname.includes("stock") || gtype.includes("stock")) && l.companyId === companyId;
    });
    return stockLedgers.reduce((sum, l) => sum + (Number(l.openingBalance) || 0), 0);
  };

  const getCompanyClosingStock = (companyId: number) => {
    if (showItemWise) {
      return getInventoryCalculations(companyId).totalClosingValue;
    }
    const stockLedgers = ledgers.filter(l => {
      const gname = (l.groupName || "").toLowerCase();
      const gtype = (l.groupType || "").toLowerCase();
      return (gname.includes("stock") || gtype.includes("stock")) && l.companyId === companyId;
    });
    return stockLedgers.reduce((sum, l) => sum + Math.abs(calculateClosingBalance(l)), 0);
  };

  const getCompanyGrossProfit = (companyId: number) => {
    const sale = getSalesForCompany(companyId);
    const directInc = getDirectIncomeForCompany(companyId);
    const closingStock = getCompanyClosingStock(companyId);
    const purchase = getPurchaseForCompany(companyId);
    const openingStock = getCompanyOpeningStock(companyId);
    const directExp = getDirectExpenseForCompany(companyId);
    return (sale + directInc + closingStock) - (purchase + openingStock + directExp);
  };

  const getStockLedgersForCompany = (companyId: number) => {
    return ledgers.filter(l => {
      const gname = (l.groupName || "").toLowerCase();
      const gtype = (l.groupType || "").toLowerCase();
      return (gname.includes("stock") || gtype.includes("stock")) && l.companyId === companyId;
    });
  };

  const getCompanyProfitLoss = (companyId: number) => {
    const grossProfit = getCompanyGrossProfit(companyId);
    const indirectInc = getIndirectIncomeForCompany(companyId);
    const indirectExp = getIndirectExpenseForCompany(companyId);
    return (grossProfit + indirectInc) - indirectExp;
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

  const getTotalDirectExpense = () => companies.reduce((sum, c) => sum + getDirectExpenseForCompany(c.id), 0);
  const getTotalDirectIncome = () => companies.reduce((sum, c) => sum + getDirectIncomeForCompany(c.id), 0);
  const getTotalIndirectIncome = () => companies.reduce((sum, c) => sum + getIndirectIncomeForCompany(c.id), 0);

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
        <div className="flex items-center gap-2">
          <button
            title="Toggle Item-wise Mode"
            onClick={() => {
              const newVal = !showItemWise;
              setShowItemWise(newVal);
              localStorage.setItem("PL_SHOW_ITEM_WISE", String(newVal));
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-medium border ${showItemWise
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : isDark ? 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
          >
            <div className={`w-3 h-3 rounded-full ${showItemWise ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-gray-400'}`}></div>
            Item-wise
          </button>
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
              <div className={`px-4 py-3 border-b flex flex-col items-end ${isDark ? 'border-gray-700 bg-gray-750' : 'bg-gray-50 border-gray-200'}`}>
                <h2 className="text-lg font-bold text-indigo-600 mb-1">{c.name}</h2>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-indigo-100 text-indigo-800">
                  {formatINR(companyNetPL)} N/P
                </span>
              </div>

              <div className="p-3">
                {/* Trading Account Segment */}
                <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-gray-500">Trading Account</h3>
                <div className="mb-4">
                  <table className={tableClass}>
                    <tbody>
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Sales</td>
                        <td className={tdRightClass}>{formatINR(companySales)}</td>
                      </tr>
                      {isDetailedView && getLedgersForGroup(-16, c.id).filter(l => calculateClosingBalance(l) !== 0).map(l => (
                        <tr key={l.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {l.name}</td>
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(l))}</td>
                        </tr>
                      ))}
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Direct Income</td>
                        <td className={tdRightClass}>{formatINR(companyDirectInc)}</td>
                      </tr>
                      {isDetailedView && getLedgersForGroup(-8, c.id).filter(l => calculateClosingBalance(l) !== 0).map(l => (
                        <tr key={l.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {l.name}</td>
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(l))}</td>
                        </tr>
                      ))}
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Closing Stock</td>
                        <td className={tdRightClass}>{formatINR(getCompanyClosingStock(c.id))}</td>
                      </tr>
                      {isDetailedView && getStockLedgersForCompany(c.id).filter(l => calculateClosingBalance(l) !== 0).map(l => (
                        <tr key={l.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {l.name}</td>
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(l))}</td>
                        </tr>
                      ))}
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Purchase</td>
                        <td className={tdRightClass}>{formatINR(companyPurchase)}</td>
                      </tr>
                      {isDetailedView && getLedgersForGroup(-15, c.id).filter(l => calculateClosingBalance(l) !== 0).map(l => (
                        <tr key={l.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {l.name}</td>
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(l))}</td>
                        </tr>
                      ))}
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Opening Stock</td>
                        <td className={tdRightClass}>{formatINR(getCompanyOpeningStock(c.id))}</td>
                      </tr>
                      {isDetailedView && getStockLedgersForCompany(c.id).filter(l => (Number(l.openingBalance) || 0) !== 0).map(l => (
                        <tr key={l.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {l.name}</td>
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(Number(l.openingBalance) || 0)}</td>
                        </tr>
                      ))}
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Direct Expense</td>
                        <td className={tdRightClass}>{formatINR(companyDirectExp)}</td>
                      </tr>
                      {isDetailedView && getLedgersForGroup(-7, c.id).filter(l => calculateClosingBalance(l) !== 0).map(l => (
                        <tr key={l.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {l.name}</td>
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(l))}</td>
                        </tr>
                      ))}

                      <tr className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-blue-50'}`}>
                        <td className={tdClass}>Total of Credit side</td>
                        <td className={tdRightClass}>{formatINR(companySales + companyDirectInc + getCompanyClosingStock(c.id))}</td>
                      </tr>
                      <tr className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-red-50'}`}>
                        <td className={tdClass}>Total of Debit side</td>
                        <td className={tdRightClass}>{formatINR(companyPurchase + getCompanyOpeningStock(c.id) + companyDirectExp)}</td>
                      </tr>

                      <tr className={totalRowClass}>
                        <td className={tdClass}>{companyGrossPL >= 0 ? 'Gross Profit' : 'Gross Loss'}</td>
                        <td className={`${tdRightClass} font-bold ${companyGrossPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatINR(companyGrossPL)}</td>
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
                        <td className={tdClass}>Indirect Income</td>
                        <td className={tdRightClass}>{formatINR(getIndirectIncomeForCompany(c.id))}</td>
                      </tr>
                      {isDetailedView && getLedgersForGroup(-11, c.id).filter(l => calculateClosingBalance(l) !== 0).map(l => (
                        <tr key={l.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {l.name}</td>
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(l))}</td>
                        </tr>
                      ))}
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Indirect Expense</td>
                        <td className={tdRightClass}>{formatINR(getIndirectExpenseForCompany(c.id))}</td>
                      </tr>
                      {isDetailedView && getLedgersForGroup(-10, c.id).filter(l => calculateClosingBalance(l) !== 0).map(l => (
                        <tr key={l.id} className={`text-xs ${isDark ? 'bg-gray-750' : 'bg-gray-50'}`}>
                          <td className={`${tdClass} pl-6 italic text-gray-500`}>↳ {l.name}</td>
                          <td className={`${tdRightClass} text-gray-500`}>{formatINR(calculateClosingBalance(l))}</td>
                        </tr>
                      ))}
                      <tr className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={tdClass}>Gross Profit (b/f)</td>
                        <td className={`${tdRightClass} ${companyGrossPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatINR(companyGrossPL)}</td>
                      </tr>
                      <tr className={totalRowClass}>
                        <td className={tdClass}>{companyNetPL >= 0 ? 'Net Profit' : 'Net Loss'}</td>
                        <td className={`${tdRightClass} font-bold ${companyNetPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatINR(companyNetPL)}</td>
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
