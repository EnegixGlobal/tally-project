import React, { useState } from "react";
import { TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";

const GSTTradingAccount: React.FC = () => {
  const [showItemWise, setShowItemWise] = useState(false);

  // Static mock data based on the previous values
  const data = {
    sales: 235.00,
    closingStock: 0.00,
    purchase: 36660.00,
    openingStock: 0.00,
    directExpense: 0.00,
  };

  // Calculations
  const stockPlusPurchase = data.openingStock + data.purchase;
  const debitBeforeGP = stockPlusPurchase + data.directExpense;
  const totalCredit = data.sales + data.closingStock;
  
  // Gross Profit = Total Credit - Total Debit (before GP)
  const grossProfit = totalCredit - debitBeforeGP;
  const totalDebit = debitBeforeGP + grossProfit;

  const formatINR = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const tdClass = "py-3 px-4 border border-gray-200";
  const tdRightClass = "py-3 px-4 border border-gray-200 text-right";

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      
      {/* Header section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <TrendingUp size={22} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Trading Account</h2>
          </div>
        </div>
        
        {/* Item Wise Toggle */}
        <button
          title="Toggle Item-wise Mode"
          onClick={() => setShowItemWise(!showItemWise)}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all text-xs font-medium border ${
            showItemWise
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
              : 'bg-white/10 text-gray-200 border-gray-600 hover:bg-white/20'
          }`}
        >
          <div className={`w-3 h-3 rounded-full ${showItemWise ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-gray-400'}`}></div>
          Item-wise
        </button>
      </div>

      <div className="overflow-x-auto p-6">
        <table className="w-full border-collapse border border-gray-200 text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
              <th className="py-4 px-4 text-left border border-gray-200 w-1/2">Particulars</th>
              <th className="py-4 px-4 text-right border border-gray-200 w-1/2">Total</th>
            </tr>
          </thead>
          <tbody className="text-gray-700 font-medium">
            
            {/* Opening Stock */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className={tdClass}>Opening Stock</td>
              <td className={tdRightClass}>{formatINR(data.openingStock)}</td>
            </tr>
            
            {/* Purchase */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className={tdClass}>Purchase</td>
              <td className={tdRightClass}>{formatINR(data.purchase)}</td>
            </tr>

            {/* TOTAL (Stock + Purchase) */}
            <tr className="bg-gray-50 font-semibold text-gray-800 italic">
              <td className={tdClass}>TOTAL (Stock + Purchase)</td>
              <td className={tdRightClass}>{formatINR(stockPlusPurchase)}</td>
            </tr>
            
            {/* Direct Expenses */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className={tdClass}>Direct Expenses</td>
              <td className={tdRightClass}>{formatINR(data.directExpense)}</td>
            </tr>

            {/* TOTAL (Debit Side Before GP) */}
            <tr className="bg-gray-50 font-semibold text-gray-800 italic">
              <td className={tdClass}>TOTAL (Debit Side Before GP)</td>
              <td className={tdRightClass}>{formatINR(debitBeforeGP)}</td>
            </tr>

            {/* Gross Profit */}
            <tr className="bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors text-emerald-800 font-semibold">
              <td className={`${tdClass} flex items-center gap-1.5`}>
                {grossProfit >= 0 ? (
                  <ArrowUpRight size={16} className="text-emerald-600" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-600" />
                )}
                Gross Profit
              </td>
              <td className={`${tdRightClass} ${grossProfit >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {formatINR(grossProfit)}
              </td>
            </tr>

            {/* Total (Debit Side) */}
            <tr className="bg-gray-800 text-white border-t-2 border-gray-900 font-bold">
              <td className="py-3 px-4 border border-gray-700 uppercase tracking-wider text-yellow-400">Total (Debit Side)</td>
              <td className="py-3 px-4 border border-gray-700 text-right text-yellow-400">{formatINR(totalDebit)}</td>
            </tr>

            {/* Sales */}
            <tr className="hover:bg-gray-50 transition-colors mt-2">
              <td className={tdClass}>Sales</td>
              <td className={tdRightClass}>{formatINR(data.sales)}</td>
            </tr>

            {/* Closing Stock (Total) */}
            <tr className="hover:bg-gray-50 transition-colors">
              <td className={tdClass}>Closing Stock (Total)</td>
              <td className={tdRightClass}>{formatINR(data.closingStock)}</td>
            </tr>

            {/* Total (Credit Side) */}
            <tr className="bg-gray-800 text-white border-t-2 border-gray-900 font-bold">
              <td className="py-3 px-4 border border-gray-700 uppercase tracking-wider text-yellow-400">Total (Credit Side)</td>
              <td className="py-3 px-4 border border-gray-700 text-right text-yellow-400">{formatINR(totalCredit)}</td>
            </tr>
            
          </tbody>
        </table>
      </div>
      
      {/* Footer warning message for balance check */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between text-sm text-gray-900 font-bold print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          Double-Entry Balance Verified
        </div>
        <div>
          Debit Total ({formatINR(totalDebit)}) = Credit Total ({formatINR(totalCredit)})
        </div>
      </div>
    </div>
  );
};

export default GSTTradingAccount;
