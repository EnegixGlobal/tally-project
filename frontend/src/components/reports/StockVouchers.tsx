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

    const [purchaseRes, salesRes] = await Promise.all([
      fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/purchase-vouchers/purchase-history?${params}`
      ),
      fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/sales-vouchers/sale-history?${params}`
      ),
    ]);

    const purchases = (await purchaseRes.json()).data || [];
    const sales = (await salesRes.json()).data || [];

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
          party: p.partyName || p.ledgerName || "-",
          type: "Purchase",
          vchNo: getVoucherNumber(p),
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
          party: s.partyName || s.ledgerName || "-",
          type: "Sales",
          vchNo: getVoucherNumber(s),
          inQty: 0,
          inValue: 0,
          outQty: qty,
          outValue: qty * Number(s.rate || 0),
        });
      }
    });

    /* 🔹 Sort by date */
    tempRows.sort((a, b) => a.date.getTime() - b.date.getTime());

    /* 🔹 Running closing (Tally logic) */
    let runningQty = 0;
    let runningValue = 0;

    tempRows.forEach((r) => {
      runningQty += r.inQty - r.outQty;
      runningValue += r.inValue - r.outValue;
      r.closingQty = runningQty;
      r.closingValue = runningValue;
    });

    setRows(tempRows);
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
                  <tr key={i} className="hover:bg-yellow-100">
                    <td className="border p-1">
                      {r.date.toLocaleDateString("en-GB")}
                    </td>
                    <td className="border p-1">{r.party}</td>
                    <td className="border p-1">{r.type}</td>
                    <td className="border p-1 font-semibold">{r.vchNo}</td>

                    <td className="border p-1 text-right">{r.inQty || ""}</td>
                    <td className="border p-1 text-right">
                      {r.inValue ? r.inValue.toFixed(2) : ""}
                    </td>

                    <td className="border p-1 text-right">{r.outQty || ""}</td>
                    <td className="border p-1 text-right">
                      {r.outValue ? r.outValue.toFixed(2) : ""}
                    </td>

                    <td className="border p-1 text-right">{r.closingQty}</td>
                    <td className="border p-1 text-right">
                      {r.closingValue.toFixed(2)}
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

export default StockVouchers;
