import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Filter } from 'lucide-react';

const ProfitLoss: React.FC = () => {
  const { theme, ledgers, ledgerGroups } = useAppContext();

  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Navigation handlers
  const handleStockClick = () => {
    navigate('/app/reports/stock-summary');
  };

  //get ledger data 

  // useEffect(()=>{
  //  const fetchData = async 

  

  // },[])

  // Stock calculations
  const getOpeningStock = () => {
    return ledgers
      .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'opening-stock')
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  const getClosingStock = () => {
    return ledgers
      .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'closing-stock')
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  // Income calculations
  const getSalesTotal = () => {
    return ledgers
      .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'sales')
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  const getIndirectIncomeTotal = () => {
    return ledgers
      .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'indirect-income')
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  // Expense calculations
  const getPurchaseTotal = () => {
    return ledgers
      .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'purchase')
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  const getDirectExpensesTotal = () => {
    return ledgers
      .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'direct-expenses')
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  const getIndirectExpensesTotal = () => {
    return ledgers
      .filter(l => ledgerGroups.find(g => g.id === l.groupId)?.type === 'indirect-expenses')
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  // Trading Account calculations (Gross Profit/Loss)
  const getTradingDebitTotal = () => {
    return getOpeningStock() + getPurchaseTotal() + getDirectExpensesTotal();
  };

  const getTradingCreditTotal = () => {
    return getSalesTotal() + getClosingStock();
  };

  const getGrossProfit = () => {
    return getTradingCreditTotal() - getTradingDebitTotal();
  };

  // Profit & Loss Account calculations (Net Profit/Loss)
  const getProfitLossDebitTotal = () => {
    const grossLoss = getGrossProfit() < 0 ? Math.abs(getGrossProfit()) : 0;
    return grossLoss + getIndirectExpensesTotal();
  };

  const getProfitLossCreditTotal = () => {
    const grossProfit = getGrossProfit() > 0 ? getGrossProfit() : 0;
    return grossProfit + getIndirectIncomeTotal();
  };

  const getNetProfit = () => {
    return getProfitLossCreditTotal() - getProfitLossDebitTotal();
  };

  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button
        title='Back to Reports'
          type="button"
          onClick={() => navigate('/app/reports')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>
        <div className="ml-auto flex space-x-2">
          <button
          title='Toggle Filters'
            type='button'
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
          </button>
          <button
          title='Print Report'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Printer size={18} />
          </button>
          <button
          title='Download Report'
          type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      {showFilterPanel && (
        <div className={`p-4 mb-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
        }`}>
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Period
              </label>
              <select
              title='Select Period'
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="current-month">Current Month</option>
                <option value="current-quarter">Current Quarter</option>
                <option value="current-year">Current Financial Year</option>
                <option value="previous-year">Previous Financial Year</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Trading Account Section */}
      <div className={`mb-6 p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <h2 className="text-xl font-bold mb-4 text-center">Trading Account</h2>
        <p className="text-center text-sm opacity-75 mb-4">For the year ended {new Date().getFullYear()}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debit Side */}
          <div>
            <h3 className="font-semibold mb-3 text-center border-b pb-2">Dr.</h3>
            <div className="space-y-2">
              <div 
                className={`flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={handleStockClick}
                title="Click to view Stock Summary"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">To Opening Stock</span>
                <span className="font-mono">{getOpeningStock().toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
                <span>To Purchases</span>
                <span className="font-mono">{getPurchaseTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
                <span>To Direct Expenses</span>
                <span className="font-mono">{getDirectExpensesTotal().toLocaleString()}</span>
              </div>
              {getGrossProfit() > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-green-600">
                  <span>To Gross Profit c/o</span>
                  <span className="font-mono">{getGrossProfit().toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
                <span>Total</span>
                <span className="font-mono">{Math.max(getTradingDebitTotal(), getTradingCreditTotal()).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Credit Side */}
          <div>
            <h3 className="font-semibold mb-3 text-center border-b pb-2">Cr.</h3>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
                <span>By Sales</span>
                <span className="font-mono">{getSalesTotal().toLocaleString()}</span>
              </div>
              <div 
                className={`flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}
                onClick={handleStockClick}
                title="Click to view Stock Summary"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">By Closing Stock</span>
                <span className="font-mono">{getClosingStock().toLocaleString()}</span>
              </div>
              {getGrossProfit() < 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-red-600">
                  <span>By Gross Loss c/o</span>
                  <span className="font-mono">{Math.abs(getGrossProfit()).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
                <span>Total</span>
                <span className="font-mono">{Math.max(getTradingDebitTotal(), getTradingCreditTotal()).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit & Loss Account Section */}
      <div className={`mb-6 p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <h2 className="text-xl font-bold mb-4 text-center">Profit & Loss Account</h2>
        <p className="text-center text-sm opacity-75 mb-4">For the year ended {new Date().getFullYear()}</p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debit Side */}
          <div>
            <h3 className="font-semibold mb-3 text-center border-b pb-2">Dr.</h3>
            <div className="space-y-2">
              {getGrossProfit() < 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-red-600">
                  <span>To Gross Loss b/f</span>
                  <span className="font-mono">{Math.abs(getGrossProfit()).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
                <span>To Indirect Expenses</span>
                <span className="font-mono">{getIndirectExpensesTotal().toLocaleString()}</span>
              </div>
              {getNetProfit() > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-green-600">
                  <span>To Net Profit</span>
                  <span className="font-mono">{getNetProfit().toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
                <span>Total</span>
                <span className="font-mono">{Math.max(getProfitLossDebitTotal(), getProfitLossCreditTotal()).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Credit Side */}
          <div>
            <h3 className="font-semibold mb-3 text-center border-b pb-2">Cr.</h3>
            <div className="space-y-2">
              {getGrossProfit() > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-green-600">
                  <span>By Gross Profit b/f</span>
                  <span className="font-mono">{getGrossProfit().toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
                <span>By Indirect Income</span>
                <span className="font-mono">{getIndirectIncomeTotal().toLocaleString()}</span>
              </div>
              {getNetProfit() < 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-red-600">
                  <span>By Net Loss</span>
                  <span className="font-mono">{Math.abs(getNetProfit()).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
                <span>Total</span>
                <span className="font-mono">{Math.max(getProfitLossDebitTotal(), getProfitLossCreditTotal()).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm opacity-75">Gross Profit/Loss</p>
              <p className={`text-xl font-bold ${getGrossProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹ {Math.abs(getGrossProfit()).toLocaleString()}
                <span className="text-sm ml-2">({getGrossProfit() >= 0 ? 'Profit' : 'Loss'})</span>
              </p>
            </div>
            <div>
              <p className="text-sm opacity-75">Net Profit/Loss</p>
              <p className={`text-xl font-bold ${getNetProfit() >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹ {Math.abs(getNetProfit()).toLocaleString()}
                <span className="text-sm ml-2">({getNetProfit() >= 0 ? 'Profit' : 'Loss'})</span>
              </p>
            </div>
            <div>
              <p className="text-sm opacity-75">Gross Profit Margin</p>
              <p className="text-xl font-bold">
                {getSalesTotal() > 0 ? ((getGrossProfit() / getSalesTotal()) * 100).toFixed(2) : '0.00'}%
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Click on Opening Stock or Closing Stock to view Stock Summary. Press F5 to refresh, F12 to configure display options.
        </p>
      </div>
    </div>
  );
};

export default ProfitLoss;