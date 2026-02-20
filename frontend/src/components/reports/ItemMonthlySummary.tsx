import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ItemMonthlySummary = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const itemName = params.get("item");
  const rawBatch = params.get("batch");
  // Handle cases where batch is string "null" or "undefined" from URL
  const batchName = (rawBatch === "null" || rawBatch === "undefined" || !rawBatch) ? "Default" : rawBatch;

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const company_id = localStorage.getItem("company_id") || "";
  const owner_type = localStorage.getItem("owner_type") || "employee";
  const owner_id =
    localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    ) || "";

  useEffect(() => {
    if (!itemName || !batchName) return;
    loadMonthlySummary();
  }, [itemName, batchName]);

  const getFinancialMonths = () => {
    return [
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
      "January",
      "February",
      "March",
    ];
  };


  const loadMonthlySummary = async () => {
    setLoading(true);

    const params = new URLSearchParams({
      company_id,
      owner_type,
      owner_id,
    });

    const [purchaseRes, salesRes, stockItemRes] = await Promise.all([
      fetch(
        `${import.meta.env.VITE_API_URL
        }/api/purchase-vouchers/purchase-history?${params}`
      ),
      fetch(
        `${import.meta.env.VITE_API_URL
        }/api/sales-vouchers/sale-history?${params}`
      ),
      fetch(
        `${import.meta.env.VITE_API_URL
        }/api/stock-items?${params}`
      ),
    ]);

    const purchaseData = (await purchaseRes.json()).data || [];
    const salesData = (await salesRes.json()).data || [];
    const stockItemsData = (await stockItemRes.json()).data || [];

    // ✅ Get Opening Balance (Forward Calculation)
    const itemData = stockItemsData.find((i: any) => i.name === itemName);
    const isDefaultBatch = batchName === "Default";

    let openingQty = 0;
    let openingRate = 0;

    if (itemData) {
      if (isDefaultBatch) {
        // 1. Default to Item Level Opening Balance
        openingQty = Number(itemData.openingBalance || 0);
        openingRate = Number(itemData.openingRate || 0);
      }

      // 2. Check Batches (Validation/Override)
      if (itemData.batches && Array.isArray(itemData.batches)) {
        const batch = itemData.batches.find((b: any) =>
          b.batchName === batchName ||
          (isDefaultBatch && (!b.batchName || b.batchName === "Default"))
        );

        // If we found a specific Opening Batch, it supercedes/defines the opening
        if (batch && batch.mode === 'opening') {
          openingQty = Number(batch.batchQuantity || 0);
          openingRate = Number(batch.openingRate || 0);
        }
      }
    }

    // ✅ Calculate Opening Value
    let openingValue = openingQty * openingRate;

    // Handle small precision errors
    if (Math.abs(openingQty) < 0.001) openingQty = 0;
    if (Math.abs(openingValue) < 0.01) openingValue = 0;

    // ✅ Filter Transactions
    const purchases = purchaseData.filter((p: any) => {
      if (p.itemName !== itemName) return false;
      if (p.batchNumber === batchName) return true;
      if (isDefaultBatch && (!p.batchNumber || p.batchNumber === "default")) return true;
      return false;
    });

    const sales = salesData.filter((s: any) => {
      if (s.itemName !== itemName) return false;
      if (s.batchNumber === batchName) return true;
      if (isDefaultBatch && (!s.batchNumber || s.batchNumber === "default")) return true;
      return false;
    });

    // ✅ Group by Month
    const monthMap: Record<string, any> = {};
    const months = getFinancialMonths();

    // pick year dynamically from data
    const baseYear =
      purchases[0]?.purchaseDate ||
      sales[0]?.movementDate ||
      new Date().toISOString();

    const fyStartYear =
      new Date(baseYear).getMonth() >= 3
        ? new Date(baseYear).getFullYear()
        : new Date(baseYear).getFullYear() - 1;

    // Initialize all months with zero
    months.forEach((m, index) => {
      const year = index <= 8 ? fyStartYear : fyStartYear + 1;
      const key = `${m} ${year}`;
      monthMap[key] = { inQty: 0, inValue: 0, outQty: 0, outValue: 0 };
    });

    const getMonthKey = (date: string) => {
      const d = new Date(date);
      const month = d.toLocaleString("en-IN", { month: "long" });
      const year = d.getFullYear();
      return `${month} ${year}`;
    };

    purchases.forEach((p: any) => {
      const key = getMonthKey(p.purchaseDate);
      if (!monthMap[key]) return;

      monthMap[key].inQty += Number(p.purchaseQuantity || 0);
      monthMap[key].inValue +=
        Number(p.purchaseQuantity || 0) * Number(p.rate || 0);
    });

    sales.forEach((s: any) => {
      const key = getMonthKey(s.movementDate);
      if (!monthMap[key]) return;

      const qty = Math.abs(Number(s.qtyChange || 0));
      monthMap[key].outQty += qty;
      monthMap[key].outValue += qty * Number(s.rate || 0);
    });


    // ✅ Running closing (Tally logic)
    let runningQty = openingQty;
    let runningValue = openingValue;

    // Find the first month with any activity (Opening > 0, Inward > 0, Outward > 0)
    // Actually, Tally shows all months but values appear starting from when?
    // User wants: "jis month me entry ho usi month se valu show kare baki upar walle month me khul vallu show na ho"
    // Meaning: Hide Closing Qty/Value for months BEFORE the first meaningful transaction or opening balance usage?

    // But wait, if there is Opening Balance (from batch), it applies from April usually. 
    // If the user says "Opening Value ... 10", and then April... 10, May... 10.
    // If the batch starts in April, then April should show 10.
    // Maybe the user means if a batch was purchased in July, April-June should be blank?

    // Let's determine the "Start Month" for this batch.
    // If batch mode is Opening -> Start is Start of Year (April).
    // If batch is Purchase/Manufacture -> Start is Purchase Date.

    let startMonthIndex = 0; // Default to April
    // Find the earliest date in purchases or sales for this batch if NOT opening mode

    let isOpeningMode = false;
    if (itemData && itemData.batches) {
      const batch = itemData.batches.find((b: any) =>
        b.batchName === batchName || (isDefaultBatch && !b.batchName)
      );
      if (batch && batch.mode === 'opening') {
        isOpeningMode = true;
      }
    }

    if (!isOpeningMode) {
      // Reset opening values for non-opening batches
      openingQty = 0;
      openingValue = 0;

      // Find earliest transaction date
      let earliestDate: Date | null = null;

      purchases.forEach((p: any) => {
        const d = new Date(p.purchaseDate);
        if (!earliestDate || d < earliestDate) earliestDate = d;
      });

      // Sales usually happen after purchase, but check just in case
      sales.forEach((s: any) => {
        const d = new Date(s.movementDate || s.date);
        if (!earliestDate || d < earliestDate) earliestDate = d;
      });

      if (earliestDate) {
        // Calculate month index relative to Financial Year start (April)
        // FY Start Year is calculated above as 'fyStartYear'
        // format: April msg = index 0.

        const ed = earliestDate as Date;
        const month = ed.getMonth(); // 0-11
        const year = ed.getFullYear();

        // Convert to financial month index (0 = April, 11 = March)
        // April (3) -> 0. March (2) -> 11.
        // If year == fyStartYear
        // month >= 3 (April) -> index = month - 3
        // If year == fyStartYear + 1
        // month < 3 (Jan-Mar) -> index = month + 9

        let fIndex = 0;
        if (year === fyStartYear) {
          if (month >= 3) fIndex = month - 3;
          else {
            // Should not happen if fyStartYear is correct for the data
            // If data is earlier than fyStartYear, default to 0
            fIndex = 0;
          }
        } else if (year > fyStartYear) {
          // Assume next year Jan-Mar
          fIndex = month + 9;
        }

        startMonthIndex = fIndex;
      }
    }


    const finalRows = Object.entries(monthMap).map(([month, v]: any, index) => {
      // Calculate running total regardless of display
      runningQty = runningQty + v.inQty - v.outQty;
      runningValue = runningValue + v.inValue - v.outValue;

      // Determine if we should SHOW the closing balance
      // Show only if index >= startMonthIndex
      const showValues = index >= startMonthIndex;

      return {
        month,
        ...v,
        closingQty: showValues ? runningQty : "",
        closingValue: showValues ? runningValue : "",
        openingQty,
        openingValue
      };
    });

    setRows(finalRows);
    setLoading(false);
  };

  return (
    <div className="pt-[56px] px-4">
      {/* <div className="flex items-center mb-4">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h2 className="mx-auto font-bold">Item Monthly Summary</h2>
      </div> */}

      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Item Monthly Summary</h1>

        <div className="ml-auto flex space-x-2 relative">
          {/* <button
            onClick={() => setShowSettings((p) => !p)}
            className="p-2 rounded-md hover:bg-gray-200"
            title="Settings"
          > */}
          {/* <Settings size={18} />
          </button> */}

          {/* <button onClick={() => window.print()} className="p-2 rounded-md">
            <Printer size={18} />
          </button> */}

          {/* <button onClick={handleExport} className="p-2 rounded-md">
            <Download size={18} />
          </button> */}

          {/* 🔽 Dropdown */}
          {/* {showSettings && (
            <div className="absolute right-0 top-10 w-64 bg-white border shadow rounded z-50">
              <div className="p-3 border-b font-semibold text-sm">
                Inventory Settings
              </div>

              <div className="p-3 space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={integrate === "integrated"}
                    onChange={() => {
                      setIntegrate("integrated");
                      setShowSettings(false);
                    }}
                  />
                  Integrated account with inventory
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={integrate === "new"}
                    onChange={() => {
                      setIntegrate("new");
                      setShowSettings(false);
                    }}
                  />
                  Create new
                </label>
              </div>
            </div>
          )} */}
        </div>
      </div>

      <div className="p-6 rounded bg-white shadow">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Item Monthly Summary</h2>

          <p className="text-center mb-4 font-semibold">
            {itemName} — {batchName}
          </p>

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-1">Month</th>
                  <th colSpan={2} className="border p-1">
                    Inwards
                  </th>
                  <th colSpan={2} className="border p-1">
                    Outwards
                  </th>
                  <th colSpan={2} className="border p-1">
                    Closing
                  </th>
                </tr>
                <tr>
                  <th></th>
                  <th className="border p-1">Qty</th>
                  <th className="border p-1">Value</th>
                  <th className="border p-1">Qty</th>
                  <th className="border p-1">Value</th>
                  <th className="border p-1">Qty</th>
                  <th className="border p-1">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-semibold bg-gray-50">
                  <td className="border p-1">Opening Value</td>
                  <td className="border p-1 text-right"></td>
                  <td className="border p-1 text-right"></td>
                  <td className="border p-1 text-right"></td>
                  <td className="border p-1 text-right"></td>
                  <td className="border p-1 text-right">{rows.length > 0 ? rows[0].openingQty || "" : ""}</td>
                  <td className="border p-1 text-right">{rows.length > 0 ? (rows[0].openingValue ? rows[0].openingValue.toFixed(2) : "") : ""}</td>
                </tr>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className="cursor-pointer hover:bg-yellow-100"
                    onClick={() => {
                      navigate(
                        `/app/reports/stock-vouchers?item=${itemName}&batch=${batchName}&month=${r.month}`
                      );
                    }}
                  >
                    <td className="border p-1">{r.month}</td>

                    <td className="border p-1 text-right">
                      {r.inQty || ""}
                    </td>

                    <td className="border p-1 text-right">
                      {r.inValue ? r.inValue.toFixed(2) : ""}
                    </td>

                    <td className="border p-1 text-right">
                      {r.outQty || ""}
                    </td>

                    <td className="border p-1 text-right">
                      {r.outValue ? r.outValue.toFixed(2) : ""}
                    </td>

                    <td className="border p-1 text-right">
                      {r.closingQty !== "" ? Math.abs(r.closingQty) : ""}
                    </td>

                    <td className="border p-1 text-right">
                      {r.closingValue !== ""
                        ? Math.abs(r.closingValue).toFixed(2)
                        : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemMonthlySummary;
