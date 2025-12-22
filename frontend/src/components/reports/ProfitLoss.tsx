import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, Filter, Settings } from "lucide-react";

const ProfitLoss: React.FC = () => {
  const { theme, ledgers, ledgerGroups } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showFullData, setShowFullData] = useState(false);
  const [showInventoryBreakup, setShowInventoryBreakup] = useState(true);

  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  // Navigation handlers
  const handleStockClick = () => {
    navigate("/app/reports/stock-summary");
  };

  //get stock opening  data
  const [stockopening, setStockopening] = useState([]);

  useEffect(() => {
    const stockBatch = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch stock items");
        }

        const data = await res.json();

        const allBatches = data.data.flatMap((item: any) => item.batches || []);

        setStockopening(allBatches);
      } catch (error) {
        console.error("Stock batch fetch error:", error);
      }
    };

    if (companyId && ownerType && ownerId) {
      stockBatch();
    }
  }, [companyId, ownerType, ownerId]);

  //get purchase Data
  const [purchaseData, setPurchaseData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/purchase-vouchers/purchase-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const result = await res.json();

        setPurchaseData(result.data || []);
      } catch (error) {
        console.error("Purchase fetch error", error);
      }
    };

    fetchPurchaseData();
  }, [companyId, ownerType, ownerId]);

  //sales data
  const [salesData, setSalesData] = useState<any[]>([]);
  useEffect(() => {
    const fatchSalesData = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const result = await res.json();

        setSalesData(result.data);
      } catch (error) {
        console.log("SalesData fatch error", error);
      }
    };

    fatchSalesData();
  }, [companyId, ownerType, ownerId]);

  //get purchase ledger or Sales Ladger
  const [purchaseLedgers, setPurchaseLedgers] = useState([]);
  const [salesLedgers, setSalesLedgers] = useState([]);
  const [directexpense, setDirectexpense] = useState([]);

  useEffect(() => {
    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/group-summary?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((res) => res.json())
      .then((data) => {
        const ledgers = data.ledgers || [];

        // Purchase → group_id = -15
        const purchases = ledgers
          .filter((l) => String(l.group_id) === "-15")
          .map((l) => ({
            name: l.name,
            opening_balance: l.opening_balance,
          }));

        // Sales → group_id = -16
        const sales = ledgers
          .filter((l) => String(l.group_id) === "-16")
          .map((l) => ({
            name: l.name,
            opening_balance: l.opening_balance,
          }));

        //direct-expense
        const directExpense = ledgers
          .filter((l) => String(l.group_id) === "-7")
          .map((l) => ({
            name: l.name,
            opening_balance: l.opening_balance,
          }));

        setPurchaseLedgers(purchases);
        setSalesLedgers(sales);
        setDirectexpense(directExpense);
      })
      .catch((err) => {
        console.error("Failed to fetch ledgers:", err);
        setPurchaseLedgers([]);
        setSalesLedgers([]);
      });
  }, [companyId, ownerId, ownerType]);

  //calcultate opening stock
  const getOpeningStock = () => {
    return stockopening.reduce((sum, p: any) => {
      const qty = Number(p.batchQuantity || 0);
      const rate = Number(p.openingRate || 0);
      return sum + qty * rate;
    }, 0);
  };

  //get closingStock data
  // const getClosingStock = () => {
  //   return 0;
  // };
  const getClosingStock = () => {
    const openingValue = getOpeningStock();
    const purchaseValue = getPurchaseTotal();
    const salesValue = getSalesTotal();

    const closing = openingValue + purchaseValue - salesValue;

    return closing > 0 ? closing : 0;
  };

  // Income calculations
  const getSalesTotal = () => {
    return salesData.reduce((sum, p) => {
      const qty = Math.abs(Number(p.qtyChange || 0));
      const rate = Number(p.rate || 0);
      return sum + qty * rate;
    }, 0);
  };

  const getIndirectIncomeTotal = () => {
    return ledgers
      .filter(
        (l) =>
          ledgerGroups.find((g) => g.id === l.groupId)?.type ===
          "indirect-income"
      )
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  // Expense calculations
  const getPurchaseTotal = () => {
    return purchaseData.reduce((sum, p) => {
      const qty = Number(p.purchaseQuantity || 0);
      const rate = Number(p.rate || 0);
      return sum + qty * rate;
    }, 0);
  };

  const getDirectExpensesTotal = () => {
    return ledgers
      .filter(
        (l) =>
          ledgerGroups.find((g) => g.id === l.groupId)?.type ===
          "direct-expenses"
      )
      .reduce((sum, l) => sum + l.openingBalance, 0);
  };

  const getIndirectExpensesTotal = () => {
    return ledgers
      .filter(
        (l) =>
          ledgerGroups.find((g) => g.id === l.groupId)?.type ===
          "indirect-expenses"
      )
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
    <div className="pt-[56px] px-4 ">
      <div className="flex items-center mb-6 relative">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">Profit & Loss Statement</h1>

        <div className="ml-auto flex space-x-2 relative">
          {/* ⚙️ Settings Button */}
          <div className="relative">
            <button
              title="Settings"
              type="button"
              onClick={() => setShowFullData((prev) => !prev)}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            >
              <Settings size={18} />
            </button>

            {/* 🔽 Settings Dropdown */}
            {showFullData && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50
          bg-white 
          border border-gray-300 "
              >
                <label
                  htmlFor="inventoryBreakup"
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer
            hover:bg-gray-100 "
                >
                  <input
                    type="checkbox"
                    id="inventoryBreakup"
                    checked={showInventoryBreakup}
                    onChange={(e) => setShowInventoryBreakup(e.target.checked)}
                  />
                  Inventory
                </label>
              </div>
            )}
          </div>

          {/* Filter Button */}
          <button
            title="Toggle Filters"
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md  ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
          </button>

          {/* Print Button */}
          <button
            title="Print Report"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>

          {/* Download Button */}
          <button
            title="Download Report"
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Period</label>
              <select
                title="Select Period"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
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
      <div
        className={`mb-6 p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <h2 className="text-xl font-bold mb-4 text-center">Trading Account</h2>
        <p className="text-center text-sm opacity-75 mb-4">
          For the year ended {new Date().getFullYear()}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debit Side */}
          <div>
            <h3 className="font-semibold mb-3 text-center border-b pb-2">
              Dr.
            </h3>
            <div className="space-y-2">
              <div
                className={`flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                }`}
                onClick={handleStockClick}
                title="Click to view Stock Summary"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">
                  To Opening Stock
                </span>
                <span className="font-mono">
                  {getOpeningStock().toLocaleString()}
                </span>
              </div>

              {/* purchase */}
              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                <div className="flex justify-between font-semibold">
                  <span>To Purchases</span>
                  <span className="font-mono">
                    {getPurchaseTotal().toLocaleString()}
                  </span>
                </div>

                {/* GST Breakup */}
                {showInventoryBreakup && (
                  <>
                    <div className="mt-2 space-y-1 pl-4 text-sm">
                      {purchaseLedgers.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-gray-700"
                        >
                          <span>{item.name}</span>
                          <span className="font-mono">
                            {Number(item.opening_balance).toLocaleString()}
                          </span>
                        </div>
                      ))}

                      {/* Divider */}
                      <div className="border-t border-dashed border-gray-400 my-1" />

                      {/* TOTAL */}
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>Total GST Purchase</span>
                        <span className="font-mono">
                          {(
                            Number(getPurchaseTotal() || 0) +
                            purchaseLedgers.reduce(
                              (sum, item) =>
                                sum + Number(item.opening_balance || 0),
                              0
                            )
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                {/* Header – Always visible */}
                <div className="flex justify-between font-semibold">
                  <span>To Direct Expenses</span>
                  <span className="font-mono">
                    {getDirectExpensesTotal().toLocaleString()}
                  </span>
                </div>

                {/* Breakup – only if Inventory ON AND data exists */}
                {showInventoryBreakup && directexpense.length > 0 && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {directexpense.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between text-gray-700"
                      >
                        <span>{item.name}</span>
                        <span className="font-mono">
                          {Number(item.opening_balance).toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {/* Divider */}
                    <div className="border-t border-dashed border-gray-400 my-1" />

                    {/* TOTAL */}
                    <div className="flex justify-between font-semibold text-gray-900">
                      <span>Total Direct Expenses</span>
                      <span className="font-mono">
                        {(
                          Number(getDirectExpensesTotal() || 0) +
                          directexpense.reduce(
                            (sum, item) =>
                              sum + Number(item.opening_balance || 0),
                            0
                          )
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {getGrossProfit() > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-green-600">
                  <span>To Gross Profit c/o</span>
                  <span className="font-mono">
                    {getGrossProfit().toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
                <span>Total</span>
                <span className="font-mono">
                  {Math.max(
                    getTradingDebitTotal(),
                    getTradingCreditTotal()
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Credit Side */}
          <div>
            <h3 className="font-semibold mb-3 text-center border-b pb-2">
              Cr.
            </h3>
            <div className="space-y-2">
              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                {/* Sales Account */}
                <div className="flex justify-between font-semibold">
                  <span>By Sales</span>
                  <span className="font-mono">
                    {getSalesTotal().toLocaleString()}
                  </span>
                </div>

                {showInventoryBreakup && (
                  <>
                    <div className="mt-2 space-y-1 pl-4 text-sm">
                      {salesLedgers.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-gray-700"
                        >
                          <span>{item.name}</span>
                          <span className="font-mono">
                            {Number(item.opening_balance).toLocaleString()}
                          </span>
                        </div>
                      ))}

                      {/* Divider */}
                      <div className="border-t border-dashed border-gray-400 my-1" />

                      {/* TOTAL */}
                      <div className="flex justify-between font-semibold text-gray-900">
                        <span>Total GST Sales</span>
                        <span className="font-mono">
                          {(
                            Number(getSalesTotal() || 0) +
                            salesLedgers.reduce(
                              (sum, item) =>
                                sum + Number(item.opening_balance || 0),
                              0
                            )
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div
                className={`flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                }`}
                onClick={handleStockClick}
                title="Click to view Stock Summary"
              >
                <span className="text-blue-600 dark:text-blue-400 underline">
                  By Closing Stock
                </span>
                <span className="font-mono">
                  {getClosingStock().toLocaleString()}
                </span>
              </div>
              {getGrossProfit() < 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-red-600">
                  <span>By Gross Loss c/o</span>
                  <span className="font-mono">
                    {Math.abs(getGrossProfit()).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
                <span>Total</span>
                <span className="font-mono">
                  {Math.max(
                    getTradingDebitTotal(),
                    getTradingCreditTotal()
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profit & Loss Account Section */}
      <div
        className={`mb-6 p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <h2 className="text-xl font-bold mb-4 text-center">
          Profit & Loss Account
        </h2>
        <p className="text-center text-sm opacity-75 mb-4">
          For the year ended {new Date().getFullYear()}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Debit Side */}
          <div>
            <h3 className="font-semibold mb-3 text-center border-b pb-2">
              Dr.
            </h3>
            <div className="space-y-2">
              {getGrossProfit() < 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-red-600">
                  <span>To Gross Loss b/f</span>
                  <span className="font-mono">
                    {Math.abs(getGrossProfit()).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
                <span>To Indirect Expenses</span>
                <span className="font-mono">
                  {getIndirectExpensesTotal().toLocaleString()}
                </span>
              </div>
              {getNetProfit() > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-green-600">
                  <span>To Net Profit</span>
                  <span className="font-mono">
                    {getNetProfit().toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
                <span>Total</span>
                <span className="font-mono">
                  {Math.max(
                    getProfitLossDebitTotal(),
                    getProfitLossCreditTotal()
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Credit Side */}
          <div>
            <h3 className="font-semibold mb-3 text-center border-b pb-2">
              Cr.
            </h3>
            <div className="space-y-2">
              {getGrossProfit() > 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-green-600">
                  <span>By Gross Profit b/f</span>
                  <span className="font-mono">
                    {getGrossProfit().toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
                <span>By Indirect Income</span>
                <span className="font-mono">
                  {getIndirectIncomeTotal().toLocaleString()}
                </span>
              </div>
              {getNetProfit() < 0 && (
                <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600 font-semibold text-red-600">
                  <span>By Net Loss</span>
                  <span className="font-mono">
                    {Math.abs(getNetProfit()).toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
                <span>Total</span>
                <span className="font-mono">
                  {Math.max(
                    getProfitLossDebitTotal(),
                    getProfitLossCreditTotal()
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm opacity-75">Gross Profit/Loss</p>
              <p
                className={`text-xl font-bold ${
                  getGrossProfit() >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ₹ {Math.abs(getGrossProfit()).toLocaleString()}
                <span className="text-sm ml-2">
                  ({getGrossProfit() >= 0 ? "Profit" : "Loss"})
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm opacity-75">Net Profit/Loss</p>
              <p
                className={`text-xl font-bold ${
                  getNetProfit() >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ₹ {Math.abs(getNetProfit()).toLocaleString()}
                <span className="text-sm ml-2">
                  ({getNetProfit() >= 0 ? "Profit" : "Loss"})
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm opacity-75">Gross Profit Margin</p>
              <p className="text-xl font-bold">
                {getSalesTotal() > 0
                  ? ((getGrossProfit() / getSalesTotal()) * 100).toFixed(2)
                  : "0.00"}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Click on Opening Stock
          or Closing Stock to view Stock Summary. Press F5 to refresh, F12 to
          configure display options.
        </p>
      </div>
    </div>
  );
};

export default ProfitLoss;
