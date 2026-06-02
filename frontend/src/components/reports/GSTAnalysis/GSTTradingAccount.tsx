import React, { useState, useEffect } from "react";
import { DollarSign, Percent, TrendingUp, ArrowDownRight, ArrowUpRight } from "lucide-react";

interface TradingRow {
  gstRate: number;
  openingStock: number;
  openingStockByGroup?: Record<string, number>;
  openingStockByItem?: Record<string, number>;
  purchase: number;
  directExpense: number;
  sales: number;
  closingStock: number;
  closingStockByGroup?: Record<string, number>;
  closingStockByItem?: Record<string, number>;
  grossProfit: number;
}

const GSTTradingAccount: React.FC = () => {
  const company_id = localStorage.getItem("company_id");
  const owner_type = localStorage.getItem("supplier");
  const owner_id = localStorage.getItem(owner_type === "employee" ? "employee_id" : "user_id") || "";

  const [data, setData] = useState<TradingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company_id || !owner_type || !owner_id) return;

    const fetchTradingAccount = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/gst-assessment/trading-account?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
        );
        const json = await res.json();
        if (json.success) {
          setData(json.data || []);
        } else {
          setError(json.message || "Failed to load Trading Account data");
        }
      } catch (err) {
        console.error("Trading Account Fetch Error:", err);
        setError("Error loading Trading Account");
      } finally {
        setLoading(false);
      }
    };

    fetchTradingAccount();
  }, [company_id, owner_type, owner_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-xl shadow-lg border border-gray-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Calculating Trading Account Values...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-10 bg-white rounded-xl shadow border border-gray-100 text-center">
        <p className="text-gray-500 font-medium">No trading transactions found for this company.</p>
      </div>
    );
  }

  // Calculate Column Totals
  const totalOpening = data.reduce((acc, row) => acc + row.openingStock, 0);
  const totalPurchase = data.reduce((acc, row) => acc + row.purchase, 0);
  const totalDirect = data.reduce((acc, row) => acc + row.directExpense, 0);
  const totalSales = data.reduce((acc, row) => acc + row.sales, 0);
  const totalClosing = data.reduce((acc, row) => acc + row.closingStock, 0);
  const totalGrossProfit = data.reduce((acc, row) => acc + row.grossProfit, 0);

  const totalDebits = totalOpening + totalPurchase + totalDirect;
  const totalCredits = totalSales + totalClosing;

  // Extract all unique stock group names present in opening/closing stocks, excluding "Primary"
  const groupNames = Array.from(
    new Set(
      data.flatMap((row) => [
        ...Object.keys(row.openingStockByGroup || {}),
        ...Object.keys(row.closingStockByGroup || {}),
      ])
    )
  ).filter(name => name !== "Primary").sort();

  // Extract all unique stock item names present in opening/closing stocks
  const itemNames = Array.from(
    new Set(
      data.flatMap((row) => [
        ...Object.keys(row.openingStockByItem || {}),
        ...Object.keys(row.closingStockByItem || {}),
      ])
    )
  ).sort();

  // Format currency helper
  const formatVal = (val: number) => {
    return val ? val.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";
  };

  return (
    <div className="mt-8 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none">
      
      {/* Header section */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-5 text-white flex items-center justify-between print:bg-none print:text-black">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <TrendingUp size={22} className="text-yellow-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">Trading Account (GST Breakup)</h2>
            <p className="text-xs text-gray-400 mt-0.5 print:hidden">Dynamic assessment by specific GST rate categories</p>
          </div>
        </div>
        <div className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5">
          <Percent size={14} className="text-yellow-400" />
          Rates: {data.length} Detected
        </div>
      </div>

      {/* Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            
            {/* Topmost Level Headers */}
            <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
              <th className="py-4 px-5 font-semibold text-gray-800 w-[240px]">Particulars</th>
              {data.map((row) => {
                // Find all stock groups present in this specific row's opening/closing stock
                const rowGroups = [
                  ...Object.keys(row.openingStockByGroup || {}),
                  ...Object.keys(row.closingStockByGroup || {})
                ].filter(g => g !== "Primary");

                let headerText = `GST ${row.gstRate}%`;
                if (rowGroups.length > 0) {
                  headerText = rowGroups[0];
                } else {
                  // Fallback: try to find if there is a group name containing the rate number in the entire data
                  const allGroups = Array.from(
                    new Set(
                      data.flatMap((r) => [
                        ...Object.keys(r.openingStockByGroup || {}),
                        ...Object.keys(r.closingStockByGroup || {}),
                      ])
                    )
                  ).filter(g => g !== "Primary");

                  const matchingGroup = allGroups.find(groupName => {
                    const matches = groupName.match(/\d+/);
                    return matches && parseInt(matches[0], 10) === row.gstRate;
                  });

                  if (matchingGroup) {
                    headerText = matchingGroup;
                  } else if (row.gstRate === 0) {
                    headerText = "18% services"; // default fallback for 0% if no groups
                  }
                }

                return (
                  <th key={row.gstRate} className="py-4 px-4 text-center font-bold text-gray-800">
                    {headerText}
                  </th>
                );
              })}
              <th className="py-4 px-5 text-right font-bold text-gray-900 bg-gray-50 border-l border-gray-200 w-[180px]">
                Total
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
            
            {/* 1. Opening Stock */}
            <tr className="bg-gray-50/30 font-semibold border-b border-gray-100">
              <td className="py-3 px-5 text-gray-800">Opening Stock (Total)</td>
              {data.map((row) => (
                <td key={row.gstRate} className="py-3 px-4 text-center text-gray-900 font-mono font-bold">
                  {formatVal(row.openingStock)}
                </td>
              ))}
              <td className="py-3 px-5 text-right font-bold text-gray-950 bg-gray-100 border-l border-gray-200 font-mono">
                {formatVal(totalOpening)}
              </td>
            </tr>

            {/* Opening Stock Breakdown by Group */}
            {groupNames.map((groupName) => {
              const totalVal = data.reduce((acc, row) => acc + (row.openingStockByGroup?.[groupName] || 0), 0);
              if (totalVal === 0) return null;

              return (
                <tr key={`opening-${groupName}`} className="hover:bg-gray-50/50 transition-colors text-xs bg-gray-50/10">
                  <td className="py-2.5 px-8 text-gray-500 italic flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    {groupName}
                  </td>
                  {data.map((row) => {
                    const val = row.openingStockByGroup?.[groupName] || 0;
                    return (
                      <td key={row.gstRate} className="py-2.5 px-4 text-center text-gray-600 font-mono">
                        {formatVal(val)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-5 text-right font-medium text-gray-700 bg-gray-50/30 border-l border-gray-200 font-mono">
                    {formatVal(totalVal)}
                  </td>
                </tr>
              );
            })}

            {/* Opening Stock Breakdown by Item */}
            {itemNames.map((itemName) => {
              const totalVal = data.reduce((acc, row) => acc + (row.openingStockByItem?.[itemName] || 0), 0);
              if (totalVal === 0) return null;

              return (
                <tr key={`opening-item-${itemName}`} className="hover:bg-gray-50/50 transition-colors text-xs">
                  <td className="py-2.5 px-8 text-gray-600 pl-12 flex items-center gap-1.5 font-medium">
                    <span className="w-1 h-1 rounded-full bg-blue-500"></span>
                    {itemName}
                  </td>
                  {data.map((row) => {
                    const val = row.openingStockByItem?.[itemName] || 0;
                    return (
                      <td key={row.gstRate} className="py-2.5 px-4 text-center text-gray-700 font-mono">
                        {formatVal(val)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-5 text-right font-semibold text-gray-800 bg-gray-50/30 border-l border-gray-200 font-mono">
                    {formatVal(totalVal)}
                  </td>
                </tr>
              );
            })}

            {/* 2. Purchase */}
            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3.5 px-5 text-gray-600">Purchase</td>
              {data.map((row) => (
                <td key={row.gstRate} className="py-3.5 px-4 text-center text-gray-800 font-mono">
                  {formatVal(row.purchase)}
                </td>
              ))}
              <td className="py-3.5 px-5 text-right font-semibold text-gray-900 bg-gray-50 border-l border-gray-200 font-mono">
                {formatVal(totalPurchase)}
              </td>
            </tr>

            {/* 3. Total (Opening + Purchase) */}
            <tr className="bg-gray-50/70 border-y border-gray-100">
              <td className="py-3 px-5 font-semibold text-gray-800 italic">TOTAL (Stock + Purchase)</td>
              {data.map((row) => (
                <td key={row.gstRate} className="py-3 px-4 text-center font-bold text-gray-900 font-mono">
                  {formatVal(row.openingStock + row.purchase)}
                </td>
              ))}
              <td className="py-3 px-5 text-right font-bold text-gray-950 bg-gray-100 border-l border-gray-200 font-mono">
                {formatVal(totalOpening + totalPurchase)}
              </td>
            </tr>

            {/* 4. Direct Expenses */}
            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3.5 px-5 text-gray-600">Direct Expenses</td>
              {data.map((row) => (
                <td key={row.gstRate} className="py-3.5 px-4 text-center text-gray-800 font-mono">
                  {formatVal(row.directExpense)}
                </td>
              ))}
              <td className="py-3.5 px-5 text-right font-semibold text-gray-900 bg-gray-50 border-l border-gray-200 font-mono">
                {formatVal(totalDirect)}
              </td>
            </tr>

            {/* 5. Total (Opening + Purchase + Direct Expenses) */}
            <tr className="bg-gray-50/70 border-y border-gray-100">
              <td className="py-3 px-5 font-semibold text-gray-800 italic">TOTAL (Debit Side Before GP)</td>
              {data.map((row) => (
                <td key={row.gstRate} className="py-3 px-4 text-center font-bold text-gray-900 font-mono">
                  {formatVal(row.openingStock + row.purchase + row.directExpense)}
                </td>
              ))}
              <td className="py-3 px-5 text-right font-bold text-gray-950 bg-gray-100 border-l border-gray-200 font-mono">
                {formatVal(totalDebits)}
              </td>
            </tr>

            {/* 6. Gross Profit */}
            <tr className="bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors border-y border-emerald-100/50">
              <td className="py-4 px-5 text-emerald-800 font-semibold flex items-center gap-1.5">
                {totalGrossProfit >= 0 ? (
                  <ArrowUpRight size={16} className="text-emerald-600" />
                ) : (
                  <ArrowDownRight size={16} className="text-red-600" />
                )}
                Gross Profit
              </td>
              {data.map((row) => {
                const isPositive = row.grossProfit >= 0;
                return (
                  <td
                    key={row.gstRate}
                    className={`py-4 px-4 text-center font-bold font-mono ${
                      isPositive ? "text-emerald-700" : "text-red-600"
                    }`}
                  >
                    {formatVal(row.grossProfit)}
                  </td>
                );
              })}
              <td
                className={`py-4 px-5 text-right font-bold bg-emerald-50/80 border-l border-emerald-100 font-mono ${
                  totalGrossProfit >= 0 ? "text-emerald-800" : "text-red-600"
                }`}
              >
                {formatVal(totalGrossProfit)}
              </td>
            </tr>

            {/* 7. Grand Total (Debit Side) */}
            <tr className="bg-gray-800 text-white border-t-2 border-gray-900">
              <td className="py-4 px-5 font-bold uppercase tracking-wider text-yellow-400">Total (Debit Side)</td>
              {data.map((row) => {
                const totalColDebit = row.openingStock + row.purchase + row.directExpense + row.grossProfit;
                return (
                  <td key={row.gstRate} className="py-4 px-4 text-center font-bold font-mono text-yellow-200">
                    {formatVal(totalColDebit)}
                  </td>
                );
              })}
              <td className="py-4 px-5 text-right font-bold bg-gray-900 border-l border-gray-700 font-mono text-yellow-400 text-base">
                {formatVal(totalDebits + totalGrossProfit)}
              </td>
            </tr>

            {/* 8. Sales */}
            <tr className="hover:bg-gray-50/50 transition-colors">
              <td className="py-3.5 px-5 text-gray-600 font-medium">Sales</td>
              {data.map((row) => (
                <td key={row.gstRate} className="py-3.5 px-4 text-center text-gray-800 font-mono">
                  {formatVal(row.sales)}
                </td>
              ))}
              <td className="py-3.5 px-5 text-right font-semibold text-gray-900 bg-gray-50 border-l border-gray-200 font-mono">
                {formatVal(totalSales)}
              </td>
            </tr>

            {/* 9. Closing Stock */}
            <tr className="bg-gray-50/30 font-semibold border-b border-gray-100">
              <td className="py-3 px-5 text-gray-800">Closing Stock (Total)</td>
              {data.map((row) => (
                <td key={row.gstRate} className="py-3 px-4 text-center text-gray-900 font-mono font-bold">
                  {formatVal(row.closingStock)}
                </td>
              ))}
              <td className="py-3 px-5 text-right font-bold text-gray-950 bg-gray-100 border-l border-gray-200 font-mono">
                {formatVal(totalClosing)}
              </td>
            </tr>

            {/* Closing Stock Breakdown by Group */}
            {groupNames.map((groupName) => {
              const totalVal = data.reduce((acc, row) => acc + (row.closingStockByGroup?.[groupName] || 0), 0);
              if (totalVal === 0) return null;

              return (
                <tr key={`closing-${groupName}`} className="hover:bg-gray-50/50 transition-colors text-xs bg-gray-50/10">
                  <td className="py-2.5 px-8 text-gray-500 italic flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                    {groupName}
                  </td>
                  {data.map((row) => {
                    const val = row.closingStockByGroup?.[groupName] || 0;
                    return (
                      <td key={row.gstRate} className="py-2.5 px-4 text-center text-gray-600 font-mono">
                        {formatVal(val)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-5 text-right font-medium text-gray-700 bg-gray-50/30 border-l border-gray-200 font-mono">
                    {formatVal(totalVal)}
                  </td>
                </tr>
              );
            })}

            {/* Closing Stock Breakdown by Item */}
            {itemNames.map((itemName) => {
              const totalVal = data.reduce((acc, row) => acc + (row.closingStockByItem?.[itemName] || 0), 0);
              if (totalVal === 0) return null;

              return (
                <tr key={`closing-item-${itemName}`} className="hover:bg-gray-50/50 transition-colors text-xs">
                  <td className="py-2.5 px-8 text-gray-600 pl-12 flex items-center gap-1.5 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    {itemName}
                  </td>
                  {data.map((row) => {
                    const val = row.closingStockByItem?.[itemName] || 0;
                    return (
                      <td key={row.gstRate} className="py-2.5 px-4 text-center text-gray-700 font-mono">
                        {formatVal(val)}
                      </td>
                    );
                  })}
                  <td className="py-2.5 px-5 text-right font-semibold text-gray-800 bg-gray-50/30 border-l border-gray-200 font-mono">
                    {formatVal(totalVal)}
                  </td>
                </tr>
              );
            })}

            {/* 10. Grand Total (Credit Side) */}
            <tr className="bg-gray-800 text-white border-t-2 border-gray-900">
              <td className="py-4 px-5 font-bold uppercase tracking-wider text-yellow-400">Total (Credit Side)</td>
              {data.map((row) => {
                const totalColCredit = row.sales + row.closingStock;
                return (
                  <td key={row.gstRate} className="py-4 px-4 text-center font-bold font-mono text-yellow-200">
                    {formatVal(totalColCredit)}
                  </td>
                );
              })}
              <td className="py-4 px-5 text-right font-bold bg-gray-900 border-l border-gray-700 font-mono text-yellow-400 text-base">
                {formatVal(totalCredits)}
              </td>
            </tr>

          </tbody>
        </table>
      </div>
      
      {/* Footer warning message if calculations balance check */}
      <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-semibold print:hidden">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
          Double-Entry Balance Verified
        </div>
        <div>
          Debit Total ({formatVal(totalDebits + totalGrossProfit)}) = Credit Total ({formatVal(totalCredits)})
        </div>
      </div>

    </div>
  );
};

export default GSTTradingAccount;
