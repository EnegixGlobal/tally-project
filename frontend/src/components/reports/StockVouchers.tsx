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
      fetch(
        `${import.meta.env.VITE_API_URL
        }/api/purchase-vouchers/purchase-history?${params}`
      ),
      fetch(
        `${import.meta.env.VITE_API_URL
        }/api/sales-vouchers/sale-history?${params}`
      ),
      fetch(`${import.meta.env.VITE_API_URL}/api/stock-items?${params}`),
    ]);

    const purchases = (await purchaseRes.json()).data || [];
    console.log('pur', purchases)
    const sales = (await salesRes.json()).data || [];
    const stockItemsData = (await stockItemRes.json()).data || [];

    // ✅ Calculate Correct Opening Balance (Back-Calc)
    const itemData = stockItemsData.find((i: any) => i.name === itemName);

    let batchCurrentQty = 0;
    let batchOpeningRate = 0;

    if (itemData && itemData.batches) {
      const batch = itemData.batches.find((b: any) => b.batchName === batchName);
      if (batch) {
        batchCurrentQty = Number(batch.batchQuantity || 0);
        batchOpeningRate = Number(batch.openingRate || 0);
      }
    }

    const totalInward = purchases.reduce((sum: number, p: any) =>
      (p.itemName === itemName && p.batchNumber === batchName) ? sum + Number(p.purchaseQuantity || 0) : sum, 0);

    const totalOutward = sales.reduce((sum: number, s: any) =>
      (s.itemName === itemName && s.batchNumber === batchName) ? sum + Math.abs(Number(s.qtyChange || 0)) : sum, 0);

    let openingQty = batchCurrentQty - totalInward + totalOutward;
    let openingValue = openingQty * batchOpeningRate;

    if (Math.abs(openingQty) < 0.001) openingQty = 0;
    if (Math.abs(openingValue) < 0.01) openingValue = 0;

    const tempRows: any[] = [];

    /* 🔹 Purchases */
    purchases.forEach((p: any) => {
      const d = new Date(p.purchaseDate);
      if (
        p.itemName === itemName &&
        p.batchNumber === batchName &&
        d >= start &&
        d <= end
      ) {
        tempRows.push({
          date: d,
          party: p.partyName || p.ledgerName || p.ledger || "-",
          type: "Purchase",
          vchNo: p.voucherNumber,
          inQty: Number(p.purchaseQuantity || 0),
          inValue: Number(p.purchaseQuantity || 0) * Number(p.rate || 0),
          outQty: 0,
          outValue: 0,
        });
      }
    });

    /* 🔹 Sales */
    sales.forEach((s: any) => {
      const d = new Date(s.movementDate || s.date);
      if (
        s.itemName === itemName &&
        s.batchNumber === batchName &&
        d >= start &&
        d <= end
      ) {
        const qty = Math.abs(Number(s.qtyChange || 0));
        tempRows.push({
          date: d,
          party: s.partyName || s.ledgerName || s.ledger || "-",
          type: "Sales",
          vchNo: s.voucherNumber, // ✅ Correctly mapped
          inQty: 0,
          inValue: 0,
          outQty: qty,
          outValue: qty * Number(s.rate || 0),
        });
      }
    });

    /* 🔹 Sort by date */
    tempRows.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate accumulation of ALL transactions BEFORE the start date
    let accumulatedQty = openingQty;
    let accumulatedValue = openingValue;

    purchases.forEach((p: any) => {
      const d = new Date(p.purchaseDate);
      if (p.itemName === itemName && p.batchNumber === batchName && d < start) {
        accumulatedQty += Number(p.purchaseQuantity || 0);
        accumulatedValue += Number(p.purchaseQuantity || 0) * Number(p.rate || 0);
      }
    });

    sales.forEach((s: any) => {
      const d = new Date(s.movementDate || s.date);
      if (s.itemName === itemName && s.batchNumber === batchName && d < start) {
        const qty = Math.abs(Number(s.qtyChange || 0));
        accumulatedQty -= qty;
        accumulatedValue -= qty * Number(s.rate || 0);
      }
    });

    const openingRow = {
      date: start, // Start of the month
      party: "Opening Balance",
      type: "",
      vchNo: "",
      inQty: 0,
      inValue: 0,
      outQty: 0,
      outValue: 0,
      closingQty: accumulatedQty,
      closingValue: accumulatedValue,
      isOpening: true
    };

    // Recalculate running totals starting from the accumulated opening
    let currentQty = accumulatedQty;
    let currentValue = accumulatedValue;

    tempRows.forEach((r) => {
      currentQty += r.inQty - r.outQty;
      currentValue += r.inValue - r.outValue;
      r.closingQty = currentQty;
      r.closingValue = currentValue;
    });

    // ✅ Check if batch is explicitly an "Opening" batch from Item Master
    let isOpeningBatch = false;
    if (itemData && itemData.batches) {
      const batch = itemData.batches.find((b: any) => b.batchName === batchName);
      if (batch && batch.mode === "opening") {
        isOpeningBatch = true;
      }
    }

    // ✅ Display "Opening Balance" row ONLY if:
    // 1. It is an "Opening" batch (mode="opening")
    // 2. It is April (Start of Financial Year)
    if (isOpeningBatch && monthLabel?.startsWith("April")) {
      setRows([openingRow, ...tempRows]);
    } else {
      setRows(tempRows);
    }
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
                  <tr key={i} className={r.isOpening ? "bg-gray-100 font-bold" : "hover:bg-yellow-100"}>
                    {r.isOpening ? (
                      <>
                        <td className="border p-2 text-center text-sm">{r.date.toLocaleDateString("en-GB")}</td>
                        <td className="border p-2 font-bold text-sm text-gray-800" colSpan={3}>Opening Balance</td>
                        <td className="border p-2 text-right text-sm font-bold">{r.closingQty || ""}</td>
                        <td className="border p-2 text-right text-sm font-bold">{r.closingValue ? r.closingValue.toFixed(2) : ""}</td>
                        <td className="border p-2 text-right text-sm"></td>
                        <td className="border p-2 text-right text-sm"></td>
                        <td className="border p-2 text-right font-bold text-sm">{r.closingQty || ""}</td>
                        <td className="border p-2 text-right font-bold text-sm">{r.closingValue ? r.closingValue.toFixed(2) : ""}</td>
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
                        <td className="border p-2 text-center font-semibold text-sm">{r.vchNo}</td>

                        <td className="border p-2 text-right text-sm">{r.inQty || ""}</td>
                        <td className="border p-2 text-right text-sm">
                          {r.inValue ? r.inValue.toFixed(2) : ""}
                        </td>

                        <td className="border p-2 text-right text-sm">{r.outQty || ""}</td>
                        <td className="border p-2 text-right text-sm">
                          {r.outValue ? r.outValue.toFixed(2) : ""}
                        </td>

                        <td className="border p-2 text-right font-bold text-sm">{r.closingQty || ""}</td>
                        <td className="border p-2 text-right font-bold text-sm">
                          {r.closingValue ? r.closingValue.toFixed(2) : ""}
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
