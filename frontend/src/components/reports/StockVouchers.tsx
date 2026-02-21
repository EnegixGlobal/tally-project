import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const StockVouchers = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const itemName = params.get("item");
  const batchName = params.get("batch");
  const monthLabel = params.get("month");

  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const company_id = localStorage.getItem("company_id") || "";
  const owner_type = localStorage.getItem("owner_type") || "employee";
  const owner_id =
    localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    ) || "";

  useEffect(() => {
    if (!itemName || !batchName || !monthLabel) return;
    loadVouchers();
  }, [itemName, batchName, monthLabel]);

  /* 🔹 Month → date range */
  const getMonthRange = (label: string) => {
    const [monthName, year] = label.split(" ");
    const start = new Date(`${monthName} 1, ${year}`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    end.setDate(0);
    return { start, end };
  };

  /* ✅ SAFE Voucher Number Resolver */
  const getVoucherNumber = (v: any) => {
    return v.voucherNo || v.number || v.id;
  };

  /* 🔹 Load vouchers */
  const loadVouchers = async () => {
    setLoading(true);

    const { start, end } = getMonthRange(monthLabel!);

    const params = new URLSearchParams({
      company_id,
      owner_type,
      owner_id,
    });

    const [purchaseRes, salesRes, stockItemRes] = await Promise.all([
      fetch(`${import.meta.env.VITE_API_URL}/api/purchase-vouchers/purchase-history?${params}`),
      fetch(`${import.meta.env.VITE_API_URL}/api/sales-vouchers/sale-history?${params}`),
      fetch(`${import.meta.env.VITE_API_URL}/api/stock-items?${params}`),
    ]);

    const purchases = (await purchaseRes.json()).data || [];
    const sales = (await salesRes.json()).data || [];
    const stockItemsData = (await stockItemRes.json()).data || [];

    const itemData = stockItemsData.find((i: any) => i.name === itemName);
    const isDefaultBatch = batchName === "Default";

    // 🔹 Detect REAL opening batch
    // 🔹 Match Logic Helper (Consistent with ItemMonthlySummary)
    const isMatch = (itemBatch: string | null | undefined) => {
      if (itemBatch === batchName) return true;
      if (isDefaultBatch && (!itemBatch || itemBatch === "default")) return true;
      return false;
    };

    /* ------------------------------------------------------------------
     * 1. Calculate Opening Balance (Forward Calculation)
     *    Use Master Opening Balance as the true starting point.
     * ------------------------------------------------------------------ */

    let openingQty = 0;
    let openingValue = 0;

    if (itemData) {
      if (isDefaultBatch) {
        // 1. Default to Item Level Opening Balance
        openingQty = Number(itemData.openingBalance || 0);
        openingValue = openingQty * Number(itemData.openingRate || 0);
      }

      // 2. Check Batches (Validation/Override)
      if (itemData.batches && Array.isArray(itemData.batches)) {
        const batch = itemData.batches.find((b: any) =>
          b.batchName === batchName ||
          (isDefaultBatch && (!b.batchName || b.batchName === "Default"))
        );

        if (batch && batch.mode === 'opening') {
          openingQty = Number(batch.batchQuantity || 0);
          openingValue = openingQty * Number(batch.openingRate || 0);
        }
      }
    }

    // Handle small precision errors
    if (Math.abs(openingQty) < 0.001) openingQty = 0;
    if (Math.abs(openingValue) < 0.01) openingValue = 0;

    /* ------------------------------------------------------------------
     * 2. Build Voucher Rows (Current Month)
     * ------------------------------------------------------------------ */
    const tempRows: any[] = [];

    purchases.forEach((p: any) => {
      const d = new Date(p.purchaseDate);
      if (
        p.itemName === itemName &&
        isMatch(p.batchNumber) &&
        d >= start &&
        d <= end
      ) {
        tempRows.push({
          date: d,
          party: p.partyName || p.ledgerName || "-",
          type: "Purchase",
          vchNo: p.voucherNumber,
          inQty: Number(p.purchaseQuantity || 0),
          inValue: Number(p.purchaseQuantity || 0) * Number(p.rate || 0),
          outQty: 0,
          outValue: 0,
        });
      }
    });

    sales.forEach((s: any) => {
      const d = new Date(s.movementDate || s.date);
      if (
        s.itemName === itemName &&
        isMatch(s.batchNumber) &&
        d >= start &&
        d <= end
      ) {
        const qty = Math.abs(Number(s.qtyChange || 0));
        tempRows.push({
          date: d,
          party: s.partyName || s.ledgerName || "-",
          type: "Sales",
          vchNo: s.voucherNumber,
          inQty: 0,
          inValue: 0,
          outQty: qty,
          outValue: qty * Number(s.rate || 0),
        });
      }
    });

    tempRows.sort((a, b) => a.date.getTime() - b.date.getTime());

    // 🔹 Accumulated opening (before month)
    let accumulatedQty = openingQty;
    let accumulatedValue = openingValue;

    purchases.forEach((p: any) => {
      const d = new Date(p.purchaseDate);
      if (
        p.itemName === itemName &&
        isMatch(p.batchNumber) &&
        d < start
      ) {
        accumulatedQty += Number(p.purchaseQuantity || 0);
        accumulatedValue += Number(p.purchaseQuantity || 0) * Number(p.rate || 0);
      }
    });

    sales.forEach((s: any) => {
      const d = new Date(s.movementDate || s.date);
      if (
        s.itemName === itemName &&
        isMatch(s.batchNumber) &&
        d < start
      ) {
        const qty = Math.abs(Number(s.qtyChange || 0));
        accumulatedQty -= qty;
        accumulatedValue -= qty * Number(s.rate || 0);
      }
    });

    // 🔹 Running closing
    let currentQty = accumulatedQty;
    let currentValue = accumulatedValue;
    const finalRows: any[] = [];

    // Add Opening Row if there is a balance brought forward
    // OR if we want to show "Opening Balance" explicitly at the top of the vouchers list
    // usually Apna Book shows "Opening Balance" as the first line if it's non-zero
    if (Math.abs(accumulatedQty) > 0.001 || Math.abs(accumulatedValue) > 0.01) {
      finalRows.push({
        isOpening: true,
        date: start, // First day of month
        closingQty: accumulatedQty,
        closingValue: accumulatedValue,
        inQty: 0,
        outQty: 0,
        inValue: 0,
        outValue: 0
      });
    }

    tempRows.forEach((r) => {
      currentQty += r.inQty - r.outQty;
      currentValue += r.inValue - r.outValue;
      r.closingQty = currentQty;
      r.closingValue = currentValue;
      finalRows.push(r);
    });

    setRows(finalRows);
    setLoading(false);
  };

  /* ================= UI (UNCHANGED) ================= */

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Stock Vouchers</h1>
      </div>

      {/* Content Card */}
      <div className="p-6 rounded bg-white shadow">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Stock Vouchers</h2>

          <p className="text-center mb-4 font-semibold">
            {itemName} — {batchName} ({monthLabel})
          </p>

          {loading ? (
            <p className="text-center">Loading...</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border p-1">Date</th>
                  <th className="border p-1">Particulars</th>
                  <th className="border p-1">Vch Type</th>
                  <th className="border p-1">Vch No</th>
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
                  <th className="border p-1"></th>
                  <th className="border p-1"></th>
                  <th className="border p-1"></th>
                  <th className="border p-1"></th>
                  <th className="border p-1">Qty</th>
                  <th className="border p-1">Value</th>
                  <th className="border p-1">Qty</th>
                  <th className="border p-1">Value</th>
                  <th className="border p-1">Qty</th>
                  <th className="border p-1">Value</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r, i) => (
                  <tr
                    key={i}
                    className={r.isOpening ? "bg-gray-100 font-bold" : "hover:bg-yellow-100"}
                  >
                    {r.isOpening ? (
                      <>
                        <td className="border p-2 text-center text-sm">
                          {r.date.toLocaleDateString("en-GB")}
                        </td>

                        <td
                          className="border p-2 font-bold text-sm text-gray-800"
                          colSpan={3}
                        >
                          Opening Balance
                        </td>

                        {/* Opening Inward */}
                        <td className="border p-2 text-right text-sm font-bold">
                          {r.closingQty !== "" ? Math.abs(r.closingQty) : ""}
                        </td>
                        <td className="border p-2 text-right text-sm font-bold">
                          {r.closingValue !== ""
                            ? Math.abs(r.closingValue).toFixed(2)
                            : ""}
                        </td>

                        <td className="border p-2 text-right text-sm"></td>
                        <td className="border p-2 text-right text-sm"></td>

                        {/* Opening Closing */}
                        <td className="border p-2 text-right font-bold text-sm">
                          {r.closingQty !== "" ? Math.abs(r.closingQty) : ""}
                        </td>
                        <td className="border p-2 text-right font-bold text-sm">
                          {r.closingValue !== ""
                            ? Math.abs(r.closingValue).toFixed(2)
                            : ""}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border p-2 text-center text-sm">
                          {r.date.toLocaleDateString("en-GB")}
                        </td>

                        <td className="border p-2 font-medium text-sm text-gray-700">
                          {r.party || "Particulars"}
                        </td>

                        <td className="border p-2 text-center text-sm">{r.type}</td>

                        <td className="border p-2 text-center font-semibold text-sm">
                          {r.vchNo}
                        </td>

                        <td className="border p-2 text-right text-sm">{r.inQty || ""}</td>
                        <td className="border p-2 text-right text-sm">
                          {r.inValue ? r.inValue.toFixed(2) : ""}
                        </td>

                        <td className="border p-2 text-right text-sm">{r.outQty || ""}</td>
                        <td className="border p-2 text-right text-sm">
                          {r.outValue ? r.outValue.toFixed(2) : ""}
                        </td>

                        <td className="border p-2 text-right font-bold text-sm">
                          {r.closingQty !== "" ? Math.abs(r.closingQty) : ""}
                        </td>

                        <td className="border p-2 text-right font-bold text-sm">
                          {r.closingValue !== ""
                            ? Math.abs(r.closingValue).toFixed(2)
                            : ""}
                        </td>
                      </>
                    )}
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

export default StockVouchers;
