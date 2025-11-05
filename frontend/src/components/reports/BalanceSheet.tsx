import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Printer, Download, Filter } from 'lucide-react';

// Interfaces copied from your structure
interface Ledger {
  id: number;
  name: string;
  groupId: number;
  openingBalance: number;
  balanceType: 'debit' | 'credit';
  groupName: string;
  groupType: string | null;
}

interface LedgerGroup {
  id: number;
  name: string;
  type: string | null;
}

const BalanceSheet: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const companyId = localStorage.getItem("company_id") || '';
const ownerType = localStorage.getItem("userType") || '';
const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || '';

useEffect(() => {
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `http://localhost:5000/api/balance-sheet?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load balance sheet data');
      const data = await res.json();
      // ... rest remains unchanged
      const normalizedLedgers = data.ledgers.map((l: any) => ({
        id: l.id,
        name: l.name,
        groupId: l.group_id,
        openingBalance: parseFloat(l.opening_balance) || 0,
        balanceType: l.balance_type,
        groupName: l.group_name,
        groupType: l.group_type
      }));
      setLedgers(normalizedLedgers);
      setLedgerGroups(data.ledgerGroups);
    } catch (err: any) {
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };
  fetchData();
}, [companyId, ownerType, ownerId]);

  // Navigation handlers
  const handleGroupClick = (groupType: string) => {
    navigate(`/app/reports/group-summary/${groupType}`);
  };

  const handleProfitLossClick = () => {
    navigate('/app/reports/profit-loss');
  };

  // const handleStockClick = () => {
  //   navigate('/app/reports/stock-summary');
  // };

  // Helper: Calculate total for given groupType using ledgers and ledgerGroups
  const getGroupTotal = (groupType: string) => {
    return ledgers
      .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === groupType)
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  // Calculate Profit & Loss same as original logic
  const getProfitLoss = () => {
    const getOpeningStock = () =>
      ledgers
        .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'opening-stock')
        .reduce((sum, l) => sum + l.openingBalance, 0);

    const getClosingStock = () =>
      ledgers
        .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'closing-stock')
        .reduce((sum, l) => sum + l.openingBalance, 0);

    const getSalesTotal = () =>
      ledgers
        .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'sales')
        .reduce((sum, l) => sum + l.openingBalance, 0);

    const getIndirectIncomeTotal = () =>
      ledgers
        .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'indirect-income')
        .reduce((sum, l) => sum + l.openingBalance, 0);

    const getPurchaseTotal = () =>
      ledgers
        .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'purchase')
        .reduce((sum, l) => sum + l.openingBalance, 0);

    const getDirectExpensesTotal = () =>
      ledgers
        .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'direct-expenses')
        .reduce((sum, l) => sum + l.openingBalance, 0);

    const getIndirectExpensesTotal = () =>
      ledgers
        .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'indirect-expenses')
        .reduce((sum, l) => sum + l.openingBalance, 0);

    const getTradingDebitTotal = () =>
      getOpeningStock() + getPurchaseTotal() + getDirectExpensesTotal();

    const getTradingCreditTotal = () =>
      getSalesTotal() + getClosingStock();

    const getGrossProfit = () => getTradingCreditTotal() - getTradingDebitTotal();

    const getProfitLossDebitTotal = () => {
      const grossLoss = getGrossProfit() < 0 ? Math.abs(getGrossProfit()) : 0;
      return grossLoss + getIndirectExpensesTotal();
    };

    const getProfitLossCreditTotal = () => {
      const grossProfit = getGrossProfit() > 0 ? getGrossProfit() : 0;
      return grossProfit + getIndirectIncomeTotal();
    };

    return getProfitLossCreditTotal() - getProfitLossDebitTotal();
  };

  // Total Assets calculation
  const getAssetTotal = () => {
    return ledgers
      .filter(ledger => {
        const group = ledgerGroups.find(g => g.id === ledger.groupId);
        return group?.type === 'fixed-assets' || group?.type === 'current-assets';
      })
      .reduce((sum, ledger) => sum + ledger.openingBalance, 0);
  };

  // Total Liabilities calculation
  const getLiabilityTotal = () => {
    const capital = getGroupTotal('capital');
    const loans = getGroupTotal('loans');
    const currentLiabilities = getGroupTotal('current-liabilities');
    const profitLoss = getProfitLoss();
    return capital + loans + currentLiabilities + profitLoss;
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => navigate('/app/reports')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          disabled={loading}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Balance Sheet</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Toggle Filters"
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            disabled={loading}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print Report"
            type="button"
            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Download Report"
            type="button"
            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div className={`p-4 mb-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="filter-date">
                As on Date
              </label>
              <input
                id="filter-date"
                title="Select Date"
                type="date"
                defaultValue={new Date().toISOString().split('T')[0]}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          {/* Liabilities Section */}
          <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h2 className="mb-4 text-xl font-bold text-center">Liabilities</h2>

            <div className="grid grid-cols-4 gap-2 pb-2 border-b-2 border-gray-400 dark:border-gray-500 font-semibold text-sm">
              <div>Particulars</div>
              <div className="text-right">Opening</div>
              <div className="text-right">Current</div>
              <div className="text-right">Closing</div>
            </div>

            <div className="space-y-1 mt-2">
              <div
                className={`grid grid-cols-4 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleGroupClick('capital')}
                title="Click to view Capital Account details"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">Capital Account</span>
                <span className="text-right font-mono">{getGroupTotal('capital').toLocaleString()}</span>
                <span className="text-right font-mono">0</span>
                <span className="text-right font-mono">{getGroupTotal('capital').toLocaleString()}</span>
              </div>

              <div
                className={`grid grid-cols-4 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleGroupClick('loans')}
                title="Click to view Loans details"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">Loans (Liability)</span>
                <span className="text-right font-mono">{getGroupTotal('loans').toLocaleString()}</span>
                <span className="text-right font-mono">0</span>
                <span className="text-right font-mono">{getGroupTotal('loans').toLocaleString()}</span>
              </div>

              <div
                className={`grid grid-cols-4 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleGroupClick('current-liabilities')}
                title="Click to view Current Liabilities details"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">Current Liabilities</span>
                <span className="text-right font-mono">{getGroupTotal('current-liabilities').toLocaleString()}</span>
                <span className="text-right font-mono">0</span>
                <span className="text-right font-mono">{getGroupTotal('current-liabilities').toLocaleString()}</span>
              </div>

              <div
                className={`grid grid-cols-4 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={handleProfitLossClick}
                title="Click to view Profit & Loss Account"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">Profit & Loss A/c</span>
                <span className="text-right font-mono">{getProfitLoss().toLocaleString()}</span>
                <span className="text-right font-mono">0</span>
                <span className="text-right font-mono">{getProfitLoss().toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500 mt-2">
                <span>Total Liabilities</span>
                <span className="text-right font-mono">{getLiabilityTotal().toLocaleString()}</span>
                <span className="text-right font-mono">0</span>
                <span className="text-right font-mono">{getLiabilityTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Assets Section */}
          <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h2 className="mb-4 text-xl font-bold text-center">Assets</h2>

            <div className="grid grid-cols-4 gap-2 pb-2 border-b-2 border-gray-400 dark:border-gray-500 font-semibold text-sm">
              <div>Particulars</div>
              <div className="text-right">Opening</div>
              <div className="text-right">Current</div>
              <div className="text-right">Closing</div>
            </div>

            <div className="space-y-1 mt-2">
              <div
                className={`grid grid-cols-4 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleGroupClick('fixed-assets')}
                title="Click to view Fixed Assets details"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">Fixed Assets</span>
                <span className="text-right font-mono">{getGroupTotal('fixed-assets').toLocaleString()}</span>
                <span className="text-right font-mono">0</span>
                <span className="text-right font-mono">{getGroupTotal('fixed-assets').toLocaleString()}</span>
              </div>
              <div
                className={`grid grid-cols-4 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleGroupClick('current-assets')}
                title="Click to view Current Assets details"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">Current Assets</span>
                <span className="text-right font-mono">{getGroupTotal('current-assets').toLocaleString()}</span>
                <span className="text-right font-mono">0</span>
                <span className="text-right font-mono">{getGroupTotal('current-assets').toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-4 gap-2 py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500 mt-2">
                <span>Total Assets</span>
                <span className="text-right font-mono">{getAssetTotal().toLocaleString()}</span>
                <span className="text-right font-mono">0</span>
                <span className="text-right font-mono">{getAssetTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Balance Verification Section */}
          <div className={`mt-6 p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <div className="text-center">
              <h2 className="mb-4 text-xl font-bold">Balance Verification</h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="col-span-2">
                  <p className="text-sm opacity-75">Total Assets (Opening)</p>
                  <p className="text-xl font-bold">₹ {getAssetTotal().toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm opacity-75">Total Assets (Current)</p>
                  <p className="text-xl font-bold">₹ 0</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm opacity-75">Total Assets (Closing)</p>
                  <p className="text-xl font-bold">₹ {getAssetTotal().toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm opacity-75">Total Liabilities (Opening)</p>
                  <p className="text-xl font-bold">₹ {getLiabilityTotal().toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm opacity-75">Total Liabilities (Current)</p>
                  <p className="text-xl font-bold">₹ 0</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm opacity-75">Total Liabilities (Closing)</p>
                  <p className="text-xl font-bold">₹ {getLiabilityTotal().toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-4">
                {getAssetTotal() === getLiabilityTotal() ? (
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                    }`}
                  >
                    Balance Sheet is balanced ✓
                  </span>
                ) : (
                  <span
                    className={`px-3 py-1 rounded text-sm ${
                      theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    Balance Sheet is not balanced (Difference: ₹ {Math.abs(getAssetTotal() - getLiabilityTotal()).toLocaleString()})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer / Pro Tips */}
          <div className={`mt-6 p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <p className="text-sm">
              <span className="font-semibold">Navigation:</span> Click on Loans, Current Liabilities, or Current Assets to view group details. Click on Profit & Loss A/c to view P&L statement.
            </p>
            <p className="text-sm mt-1">
              <span className="font-semibold">Pro Tip:</span> Press F5 to refresh, F12 to configure display options.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BalanceSheet;
