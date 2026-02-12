import React, { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Printer, Download, Filter, Settings } from "lucide-react";

const ProfitLoss: React.FC = () => {
  const { theme, ledgers, ledgerGroups } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showFullData, setShowFullData] = useState(false);
  const [showInventoryBreakup, setShowInventoryBreakup] = useState(false);
  const [showDetailed, setShowDetailed] = useState(false);
  const [ledgerBalances, setLedgerBalances] = useState<Record<number, { debit: number; credit: number }>>({});

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
  const [stockItems, setStockItems] = useState<any[]>([]);

  useEffect(() => {
    const stockBatch = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch stock items");
        }

        const data = await res.json();

        // Store full stock items for inventory breakup
        setStockItems(data.data || []);

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

  type SimpleLedger = {
    id: number;
    name: string;
    opening_balance: number | string;
  };

  //get purchase Data
  const [purchaseData, setPurchaseData] = useState<any[]>([]);

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/purchase-vouchers/purchase-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const result = await res.json();
        console.log('purchase history', result.data)

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
          `${import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const result = await res.json();
        console.log('sales', result.data)

        setSalesData(result.data);
      } catch (error) {
        console.log("SalesData fatch error", error);
      }
    };

    fatchSalesData();
  }, [companyId, ownerType, ownerId]);

  //get purchase ledger or Sales Ladger
  const [purchaseLedgers, setPurchaseLedgers] = useState<SimpleLedger[]>([]);
  const [salesLedgers, setSalesLedgers] = useState<SimpleLedger[]>([]);
  const [directexpense, setDirectexpense] = useState<SimpleLedger[]>([]);
  const [indirectExpenses, setIndirectExpenses] = useState<SimpleLedger[]>([]);
  const [indirectIncome, setIndirectIncome] = useState<SimpleLedger[]>([]);
  const [stockLedgers, setStockLedgers] = useState<any[]>([]);

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL
      }/api/group-summary?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((res) => res.json())
      .then((data) => {
        const ledgers = data.ledgers || [];

        // Purchase → group_id = -15
        const purchases: SimpleLedger[] = ledgers
          .filter((l: any) => String(l.group_id) === "-15")
          .map((l: any) => ({
            id: Number(l.id),
            name: l.name,
            opening_balance: l.opening_balance,
          }));

        // Sales → group_id = -16
        const sales: SimpleLedger[] = ledgers
          .filter((l: any) => String(l.group_id) === "-16")
          .map((l: any) => ({
            id: Number(l.id),
            name: l.name,
            opening_balance: l.opening_balance,
          }));

        // direct-expense
        const directExpense: SimpleLedger[] = ledgers
          .filter((l: any) => {
            const gid = String(l.group_id);
            if (gid === "-7") return true;
            const group = (ledgerGroups || []).find(g => String(g.id) === gid);
            return group?.type === "direct-expenses";
          })
          .map((l: any) => ({
            id: Number(l.id),
            name: l.name,
            opening_balance: l.opening_balance,
          }));

        // indirect-expenses
        const indExpenses: SimpleLedger[] = ledgers
          .filter((l: any) => {
            const gid = String(l.group_id);
            if (gid === "-10") return true;
            const group = (ledgerGroups || []).find(g => String(g.id) === gid);
            return group?.type === "indirect-expenses";
          })
          .map((l: any) => ({
            id: Number(l.id),
            name: l.name,
            opening_balance: l.opening_balance,
          }));

        // indirect-income
        const indIncome: SimpleLedger[] = ledgers
          .filter((l: any) => {
            const gid = String(l.group_id);
            if (gid === "-11") return true;
            const group = (ledgerGroups || []).find(g => String(g.id) === gid);
            return group?.type === "indirect-income";
          })
          .map((l: any) => ({
            id: Number(l.id),
            name: l.name,
            opening_balance: l.opening_balance,
          }));

        // Robust Stock-in-hand group identification
        const normalizeStr = (s: string) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, '');

        const stockInHandGroup = (ledgerGroups || []).find(g => {
          const name = normalizeStr(g.name || "");
          const type = normalizeStr(g.type || "");
          return name.includes("stock") || type.includes("stock");
        });

        const stockInHandGroupId = stockInHandGroup ? String(stockInHandGroup.id) : null;

        const stockItems = ledgers.filter((l: any) => {
          const gid = String(l.group_id || l.groupId || "");
          const gname = normalizeStr(l.groupName || l.group_name || "");
          const gtype = normalizeStr(l.groupType || l.group_type || l.type || "");

          return (stockInHandGroupId && gid === stockInHandGroupId) ||
            gname.includes("stock") ||
            gtype.includes("stock");
        });

        setPurchaseLedgers(purchases);
        setSalesLedgers(sales);
        setDirectexpense(directExpense);
        setIndirectExpenses(indExpenses);
        setIndirectIncome(indIncome);
        setStockLedgers(stockItems);

        // Fetch balances for all returned ledgers to show transactions
        const ledgerIds = ledgers.map((l: any) => l.id).join(',');
        if (ledgerIds) {
          fetch(`${import.meta.env.VITE_API_URL}/api/group?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&ledgerIds=${ledgerIds}`)
            .then((res) => res.json())
            .then((balanceData) => {
              if (balanceData.success) {
                setLedgerBalances(balanceData.data);
              }
            })
            .catch((err) => console.error("Failed to fetch ledger balances:", err));
        }
      })
      .catch((err) => {
        console.error("Failed to fetch ledgers:", err);
        setPurchaseLedgers([]);
        setSalesLedgers([]);
        setStockLedgers([]);
      });
  }, [companyId, ownerId, ownerType, ledgerGroups]);

  console.log('stock', stockLedgers)
  // Calculate opening stock from Stock-in-hand ledgers
  const getOpeningStock = () => {
    return stockLedgers.reduce((sum, l) => {
      const balance = Number(l.opening_balance || 0);
      return sum + balance;
    }, 0);
  };



  // Income calculations
  const getSalesTotal = () => {
    return salesData.reduce((sum, p) => {
      const qty = Math.abs(Number(p.qtyChange || 0));
      const rate = Number(p.rate || 0);
      return sum + qty * rate;
    }, 0);
  };

  // Sales + Closing Stock (Final Sales)
  const getFinalSalesTotal = () => {
    return getSalesTotal()
  };


  const getIndirectIncomeTotal = () => {
    return indirectIncome.reduce(
      (sum, item) => sum + (ledgerBalances[item.id]?.credit || 0),
      0
    );
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
    return directexpense.reduce(
      (sum, item) => sum + (ledgerBalances[item.id]?.debit || 0),
      0
    );
  };

  const getIndirectExpensesTotal = () => {
    return indirectExpenses.reduce(
      (sum, item) => sum + (ledgerBalances[item.id]?.debit || 0),
      0
    );
  };

  // Calculate closing stock: 0 if Opening, Purchase, and Sales are all 0
  const getClosingStock = () => {
    const opening = getOpeningStock();
    const purchase = getPurchaseTotal();
    const sales = getSalesTotal();

    if (opening === 0 && purchase === 0 && sales === 0) {
      return 0;
    }

    return stockLedgers.reduce((sum, l) => {
      const balance = Number(l.closing_balance || 0);
      return sum + balance;
    }, 0);
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

  // Helper functions for inventory breakup
  const getOpeningStockByItems = () => {
    return stockItems
      .filter((item: any) => item.batches && item.batches.length > 0)
      .map((item: any) => ({
        id: item.id,
        name: item.name,
        batches: item.batches.filter((b: any) => b.openingRate),
        totalValue: item.batches
          .filter((b: any) => b.openingRate)
          .reduce((sum: number, b: any) => {
            const qty = Number(b.batchQuantity || 0);
            const rate = Number(b.openingRate || 0);
            return sum + qty * rate;
          }, 0),
      }))
      .filter((item) => item.totalValue > 0);
  };

  const getPurchaseByItems = () => {
    // Create a map to store item IDs by name
    const itemIdMap = new Map<string, string | number>();
    stockItems.forEach((item: any) => {
      itemIdMap.set(item.name, item.id);
    });

    const itemMap = new Map<string, { id: string | number; name: string; qty: number; rate: number; value: number }>();

    purchaseData.forEach((p: any) => {
      const itemName = p.itemName || "Unknown Item";
      const qty = Number(p.purchaseQuantity || 0);
      const rate = Number(p.rate || 0);
      const value = qty * rate;

      if (itemMap.has(itemName)) {
        const existing = itemMap.get(itemName)!;
        existing.qty += qty;
        existing.value += value;
        existing.rate = existing.value / existing.qty || 0;
      } else {
        itemMap.set(itemName, {
          id: itemIdMap.get(itemName) || itemName,
          name: itemName,
          qty,
          rate,
          value
        });
      }
    });

    return Array.from(itemMap.values()).filter((item) => item.value > 0);
  };

  const getSalesByItems = () => {
    // Create a map to store item IDs by name
    const itemIdMap = new Map<string, string | number>();
    stockItems.forEach((item: any) => {
      itemIdMap.set(item.name, item.id);
    });

    const itemMap = new Map<string, { id: string | number; name: string; qty: number; rate: number; value: number }>();

    salesData.forEach((s: any) => {
      const itemName = s.itemName || "Unknown Item";
      const qty = Math.abs(Number(s.qtyChange || 0));
      const rate = Number(s.rate || 0);
      const value = qty * rate;

      if (itemMap.has(itemName)) {
        const existing = itemMap.get(itemName)!;
        existing.qty += qty;
        existing.value += value;
        existing.rate = existing.value / existing.qty || 0;
      } else {
        itemMap.set(itemName, {
          id: itemIdMap.get(itemName) || itemName,
          name: itemName,
          qty,
          rate,
          value
        });
      }
    });

    return Array.from(itemMap.values()).filter((item) => item.value > 0);
  };

  const getClosingStockByItems = () => {
    const openingItems = getOpeningStockByItems();
    const purchaseItems = getPurchaseByItems();
    const salesItems = getSalesByItems();

    // Create a map to store item IDs by name
    const itemIdMap = new Map<string, string | number>();
    openingItems.forEach((item) => {
      itemIdMap.set(item.name, item.id);
    });
    // Also check stockItems for items that might not be in opening stock
    stockItems.forEach((item: any) => {
      if (!itemIdMap.has(item.name)) {
        itemIdMap.set(item.name, item.id);
      }
    });

    const itemMap = new Map<string, { id: string | number; name: string; opening: number; purchase: number; sales: number; closing: number }>();

    // Add opening stock
    openingItems.forEach((item) => {
      itemMap.set(item.name, {
        id: item.id,
        name: item.name,
        opening: item.totalValue,
        purchase: 0,
        sales: 0,
        closing: item.totalValue,
      });
    });

    // Add purchases
    purchaseItems.forEach((item) => {
      if (itemMap.has(item.name)) {
        const existing = itemMap.get(item.name)!;
        existing.purchase = item.value;
        existing.closing = existing.opening + existing.purchase - existing.sales;
      } else {
        itemMap.set(item.name, {
          id: itemIdMap.get(item.name) || item.name,
          name: item.name,
          opening: 0,
          purchase: item.value,
          sales: 0,
          closing: item.value,
        });
      }
    });

    // Subtract sales
    salesItems.forEach((item) => {
      if (itemMap.has(item.name)) {
        const existing = itemMap.get(item.name)!;
        existing.sales = item.value;
        existing.closing = existing.opening + existing.purchase - existing.sales;
      } else {
        itemMap.set(item.name, {
          id: itemIdMap.get(item.name) || item.name,
          name: item.name,
          opening: 0,
          purchase: 0,
          sales: item.value,
          closing: -item.value,
        });
      }
    });

    return Array.from(itemMap.values())
      .map((item) => ({
        ...item,
        closing: Math.max(0, item.closing),
      }))
      .filter((item) => item.closing > 0);
  };

  const getIndirectIncomeLedgers = () => {
    return ledgers.filter(
      (l) =>
        ledgerGroups.find((g) => g.id === l.groupId)?.type ===
        "indirect-income"
    );
  };

  const getIndirectExpensesLedgers = () => {
    return ledgers.filter(
      (l) =>
        ledgerGroups.find((g) => g.id === l.groupId)?.type ===
        "indirect-expenses"
    );
  };

  // Drilldown handlers for GST breakup rows
  const handlePurchaseLedgerClick = (ledgerName: string, ledgerId: number) => {
    navigate(
      `/app/reports/profit-loss/purchase/alldetails?ledger=${encodeURIComponent(
        ledgerName
      )}&groupId=${ledgerId}`
    );
  };

  const handleSalesLedgerClick = (ledgerName: string, ledgerId: number) => {
    navigate(
      `/app/reports/profit-loss/sales/alldetails?ledger=${encodeURIComponent(
        ledgerName
      )}&groupId=${ledgerId}`
    );
  };

  const handleOpeningStockItemClick = (itemName: string, itemId: string | number) => {
    navigate(
      `/app/reports/profit-loss/opening-stock/alldetails?item=${encodeURIComponent(
        itemName
      )}&itemId=${itemId}`
    );
  };

  const handlePurchaseItemClick = (itemName: string, itemId: string | number) => {
    navigate(
      `/app/reports/profit-loss/purchase-item/alldetails?item=${encodeURIComponent(
        itemName
      )}&itemId=${itemId}`
    );
  };

  const handleSalesItemClick = (itemName: string, itemId: string | number) => {
    navigate(
      `/app/reports/profit-loss/sales-item/alldetails?item=${encodeURIComponent(
        itemName
      )}&itemId=${itemId}`
    );
  };

  const handleDirectExpenseClick = (ledgerName: string, ledgerId: number) => {
    navigate(
      `/app/reports/profit-loss/direct-expense/alldetails?ledger=${encodeURIComponent(
        ledgerName
      )}&groupId=${ledgerId}`
    );
  };

  const handleIndirectExpenseClick = (ledgerName: string, ledgerId: number) => {
    navigate(
      `/app/reports/profit-loss/indirect-expense/alldetails?ledger=${encodeURIComponent(
        ledgerName
      )}&groupId=${ledgerId}`
    );
  };

  const handleIndirectIncomeClick = (ledgerName: string, ledgerId: number) => {
    navigate(
      `/app/reports/profit-loss/indirect-income/alldetails?ledger=${encodeURIComponent(
        ledgerName
      )}&groupId=${ledgerId}`
    );
  };


  // Save Net Profit/Loss for Balance Sheet
  useEffect(() => {
    const netAmount = getNetProfit();

    if (companyId) {
      if (netAmount > 0) {
        // It's a profit
        localStorage.setItem(`NET_PROFIT_${companyId}`, netAmount.toString());
        localStorage.setItem(`NET_LOSS_${companyId}`, "0");
      } else if (netAmount < 0) {
        // It's a loss
        localStorage.setItem(`NET_PROFIT_${companyId}`, "0");
        localStorage.setItem(`NET_LOSS_${companyId}`, Math.abs(netAmount).toString());
      } else {
        // Zero
        localStorage.setItem(`NET_PROFIT_${companyId}`, "0");
        localStorage.setItem(`NET_LOSS_${companyId}`, "0");
      }
    }

  }, [getNetProfit, companyId]);


  return (
    <div className="pt-[56px] px-4 ">
      <div className="flex items-center mb-6 relative">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
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
              className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
            >
              <Settings size={18} />
            </button>

            {/* 🔽 Settings Dropdown */}
            {showFullData && (
              <div
                className="absolute right-0 mt-2 w-52 rounded-md shadow-lg z-50 bg-white border border-gray-300"
              >
                {/* Detailed */}
                <label
                  htmlFor="detailedView"
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100"
                >
                  <input
                    type="checkbox"
                    id="detailedView"
                    checked={showDetailed}
                    onChange={(e) => setShowDetailed(e.target.checked)}
                  />
                  Detailed
                </label>

                {/* Inventory */}
                <label
                  htmlFor="inventoryBreakup"
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 border-t border-gray-200"
                >
                  <input
                    type="checkbox"
                    id="inventoryBreakup"
                    checked={showInventoryBreakup}
                    onChange={(e) => setShowInventoryBreakup(e.target.checked)}
                    disabled={!showDetailed}
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
            className={`p-2 rounded-md  ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Filter size={18} />
          </button>

          {/* Print Button */}
          <button
            title="Print Report"
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Printer size={18} />
          </button>

          {/* Download Button */}
          <button
            title="Download Report"
            type="button"
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
        >
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Period</label>
              <select
                title="Select Period"
                className={`w-full p-2 rounded border ${theme === "dark"
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
        className={`mb-6 p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                <div
                  className={`flex justify-between cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  onClick={handleStockClick}
                  title="Click to view Stock Summary"
                >
                  <span className="text-blue-600 dark:text-blue-400 underline font-semibold">
                    To Opening Stock
                  </span>
                  <span className="font-mono font-semibold">
                    {getOpeningStock().toLocaleString()}
                  </span>
                </div>

                {/* Inventory Breakup - Opening Stock */}
                {showInventoryBreakup && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {getOpeningStockByItems().map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleOpeningStockItemClick(item.name, item.id)}
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">
                          {item.name}
                        </span>
                        <span className="font-mono">
                          {item.totalValue.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {getOpeningStockByItems().length === 0 && (
                      <div className={`text-xs italic ${theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}>No opening stock items</div>
                    )}
                  </div>
                )}
              </div>

              {/* purchase */}
              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                <div className="flex justify-between font-semibold cursor-pointer">
                  <Link to="purchase">
                    <span className="text-blue-600 dark:text-blue-400 underline font-semibold">To Purchases</span>
                  </Link>
                  <span className="font-mono">
                    {showDetailed
                      ? purchaseLedgers.reduce((sum, item) => sum + (ledgerBalances[item.id]?.debit || 0), 0).toLocaleString()
                      : getPurchaseTotal().toLocaleString()
                    }
                  </span>
                </div>

                {/* GST Breakup - Ledgers */}
                {showDetailed && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {purchaseLedgers.map((item, index) => (
                      <div
                        key={index}
                        onClick={() =>
                          handlePurchaseLedgerClick(item.name, item.id)
                        }
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">
                          {item.name}
                        </span>
                        <span className="font-mono">
                          {(ledgerBalances[item.id]?.debit || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {/* Inventory Breakup - Purchase Items */}
                    {showInventoryBreakup && (
                      <>
                        {getPurchaseByItems().map((item, index) => (
                          <div
                            key={`item-${index}`}
                            onClick={() => handlePurchaseItemClick(item.name, item.id)}
                            className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                              }`}
                          >
                            <span className="text-blue-600 underline">
                              {item.name}
                            </span>
                            <span className="font-mono">
                              {item.value.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Inventory Breakup - Purchase Items (when detailed is off but inventory is on) */}
                {!showDetailed && showInventoryBreakup && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {getPurchaseByItems().map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handlePurchaseItemClick(item.name, item.id)}
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">
                          {item.name}
                        </span>
                        <span className="font-mono">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {getPurchaseByItems().length === 0 && (
                      <div className={`text-xs italic ${theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}>No purchase items</div>
                    )}
                  </div>
                )}
              </div>

              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                {/* Header – Always visible */}
                <div className="flex justify-between font-semibold cursor-pointer">
                  <Link to="/app/reports/group-summary/-7">
                    <span className="text-blue-600 dark:text-blue-400 underline font-semibold">
                      To Direct Expenses
                    </span>
                  </Link>
                  <span className="font-mono">
                    {getDirectExpensesTotal().toLocaleString()}
                  </span>
                </div>

                {/* Detailed Breakup - Direct Expenses */}
                {showDetailed && directexpense.length > 0 && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {directexpense.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleDirectExpenseClick(item.name, item.id)}
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">
                          {item.name}
                        </span>
                        <span className="font-mono">
                          {(ledgerBalances[item.id]?.debit || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inventory Breakup - Direct Expenses Fallback */}
                {!showDetailed && showInventoryBreakup && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {directexpense.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleDirectExpenseClick(item.name, item.id)}
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">
                          {item.name}
                        </span>
                        <span className="font-mono">
                          {(ledgerBalances[item.id]?.debit || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
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

              {/* Total Row */}
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
                <div className="flex justify-between font-semibold cursor-pointer">
                  <Link to="sales">
                    <span className="text-blue-600 dark:text-blue-400 underline font-semibold">By Sales</span>
                  </Link>
                  <span className="font-mono">
                    {showDetailed
                      ? salesLedgers.reduce((sum, item) => sum + (ledgerBalances[item.id]?.credit || 0), 0).toLocaleString()
                      : getFinalSalesTotal().toLocaleString()
                    }
                  </span>
                </div>

                {/* GST Breakup - Ledgers */}
                {showDetailed && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {salesLedgers.map((item, index) => (
                      <div
                        key={index}
                        onClick={() =>
                          handleSalesLedgerClick(item.name, item.id)
                        }
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">
                          {item.name}
                        </span>
                        <span className="font-mono">
                          {(ledgerBalances[item.id]?.credit || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}

                    {/* Inventory Breakup - Sales Items */}
                    {showInventoryBreakup && (
                      <>
                        {getSalesByItems().map((item, index) => (
                          <div
                            key={`item-${index}`}
                            onClick={() => handleSalesItemClick(item.name, item.id)}
                            className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                              }`}
                          >
                            <span className="text-blue-600 underline">
                              {item.name}
                            </span>
                            <span className="font-mono">
                              {item.value.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}

                {/* Inventory Breakup - Sales Items (when detailed is off but inventory is on) */}
                {!showDetailed && showInventoryBreakup && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {getSalesByItems().map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleSalesItemClick(item.name, item.id)}
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">
                          {item.name}
                        </span>
                        <span className="font-mono">
                          {item.value.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {getSalesByItems().length === 0 && (
                      <div className={`text-xs italic ${theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}>No sales items</div>
                    )}
                  </div>
                )}
              </div>

              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                <div
                  className={`flex justify-between cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  onClick={handleStockClick}
                  title="Click to view Stock Summary"
                >
                  <span className="text-blue-600 dark:text-blue-400 underline font-semibold">
                    By Closing Stock
                  </span>
                  <span className="font-mono font-semibold">
                    {getClosingStock().toLocaleString()}
                  </span>
                </div>

                {/* Inventory Breakup - Closing Stock */}
                {showInventoryBreakup && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {getClosingStockByItems().map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleOpeningStockItemClick(item.name, item.id)}
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">
                          {item.name}
                        </span>
                        <span className="font-mono">
                          {item.closing.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {getClosingStockByItems().length === 0 && (
                      <div className={`text-xs italic ${theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}>No closing stock items</div>
                    )}
                  </div>
                )}
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
        className={`mb-6 p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                <div className="flex justify-between font-semibold cursor-pointer">
                  <Link to="/app/reports/group-summary/-10">
                    <span className="text-blue-600 dark:text-blue-400 underline font-semibold">
                      To Indirect Expenses
                    </span>
                  </Link>
                  <span className="font-mono">
                    {getIndirectExpensesTotal().toLocaleString()}
                  </span>
                </div>

                {/* Detailed Breakup - Indirect Expenses */}
                {showDetailed && indirectExpenses.length > 0 && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {indirectExpenses.map((ledger, index) => (
                      <div
                        key={index}
                        onClick={() => handleIndirectExpenseClick(ledger.name, ledger.id)}
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">{ledger.name}</span>
                        <span className="font-mono">
                          {(ledgerBalances[Number(ledger.id)]?.debit || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {indirectExpenses.length === 0 && (
                      <div className={`text-xs italic ${theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}>No indirect expenses</div>
                    )}
                  </div>
                )}

                {/* Inventory Breakup - Indirect Expenses (Fallback or additional if needed) */}
                {!showDetailed && showInventoryBreakup && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {getIndirectExpensesLedgers().map((ledger, index) => (
                      <div
                        key={index}
                        className={`flex justify-between ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                      >
                        <span>{ledger.name}</span>
                        <span className="font-mono">
                          {(ledgerBalances[Number(ledger.id)]?.debit || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="py-2 border-b border-gray-300 dark:border-gray-600">
                <div className="flex justify-between font-semibold cursor-pointer">
                  <Link to="/app/reports/group-summary/-11">
                    <span className="text-blue-600 dark:text-blue-400 underline font-semibold">
                      By Indirect Income
                    </span>
                  </Link>
                  <span className="font-mono">
                    {getIndirectIncomeTotal().toLocaleString()}
                  </span>
                </div>

                {/* Detailed Breakup - Indirect Income */}
                {showDetailed && indirectIncome.length > 0 && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {indirectIncome.map((ledger, index) => (
                      <div
                        key={index}
                        onClick={() => handleIndirectIncomeClick(ledger.name, ledger.id)}
                        className={`flex justify-between cursor-pointer hover:bg-gray-100 ${theme === "dark" ? "text-gray-300 hover:bg-gray-700" : "text-gray-700"
                          }`}
                      >
                        <span className="text-blue-600 underline">{ledger.name}</span>
                        <span className="font-mono">
                          {(ledgerBalances[Number(ledger.id)]?.credit || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {indirectIncome.length === 0 && (
                      <div className={`text-xs italic ${theme === "dark" ? "text-gray-500" : "text-gray-500"
                        }`}>No indirect income</div>
                    )}
                  </div>
                )}

                {/* Inventory Breakup - Indirect Income (Fallback or additional if needed) */}
                {!showDetailed && showInventoryBreakup && (
                  <div className="mt-2 space-y-1 pl-4 text-sm">
                    {getIndirectIncomeLedgers().map((ledger, index) => (
                      <div
                        key={index}
                        className={`flex justify-between ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                      >
                        <span>{ledger.name}</span>
                        <span className="font-mono">
                          {(ledgerBalances[Number(ledger.id)]?.credit || 0).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm opacity-75">Gross Profit/Loss</p>
              <p
                className={`text-xl font-bold ${getGrossProfit() >= 0 ? "text-green-600" : "text-red-600"
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
                className={`text-xl font-bold ${getNetProfit() >= 0 ? "text-green-600" : "text-red-600"
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
        className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
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
