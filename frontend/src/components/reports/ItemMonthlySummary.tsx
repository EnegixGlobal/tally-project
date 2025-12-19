import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ItemMonthlySummary = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const itemName = params.get("item");
  const batchName = params.get("batch");

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

    const purchaseData = (await purchaseRes.json()).data || [];
    const salesData = (await salesRes.json()).data || [];

    // ✅ Filter by item + batch
    const purchases = purchaseData.filter(
      (p: any) => p.itemName === itemName && p.batchNumber === batchName
    );

    const sales = salesData.filter(
      (s: any) => s.itemName === itemName && s.batchNumber === batchName
    );

    // ✅ Group by Month
      // const monthMap: any = {};
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


    // const addMonth = (date: string) => {
    //   const d = new Date(date);
    //   return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
    // };
const getMonthKey = (date: string) => {
  const d = new Date(date);
  const month = d.toLocaleString("en-IN", { month: "long" });
  const year = d.getFullYear();
  return `${month} ${year}`;
};

    // purchases.forEach((p: any) => {
    //   const m = addMonth(p.purchaseDate);
    //   if (!monthMap[m])
    //     monthMap[m] = { inQty: 0, inValue: 0, outQty: 0, outValue: 0 };
    //   monthMap[m].inQty += Number(p.purchaseQuantity || 0);
    //   monthMap[m].inValue +=
    //     Number(p.purchaseQuantity || 0) * Number(p.rate || 0);
      // });
      purchases.forEach((p: any) => {
        const key = getMonthKey(p.purchaseDate);
        if (!monthMap[key]) return;

        monthMap[key].inQty += Number(p.purchaseQuantity || 0);
        monthMap[key].inValue +=
          Number(p.purchaseQuantity || 0) * Number(p.rate || 0);
      });


    // sales.forEach((s: any) => {
    //   const m = addMonth(s.movementDate);
    //   if (!monthMap[m])
    //     monthMap[m] = { inQty: 0, inValue: 0, outQty: 0, outValue: 0 };
    //   const qty = Math.abs(Number(s.qtyChange || 0));
    //   monthMap[m].outQty += qty;
    //   monthMap[m].outValue += qty * Number(s.rate || 0);
      // });
      
      sales.forEach((s: any) => {
        const key = getMonthKey(s.movementDate);
        if (!monthMap[key]) return;

        const qty = Math.abs(Number(s.qtyChange || 0));
        monthMap[key].outQty += qty;
        monthMap[key].outValue += qty * Number(s.rate || 0);
      });


    // ✅ Running closing (Tally logic)
    let runningQty = 0;
    let runningValue = 0;

    const finalRows = Object.entries(monthMap).map(([month, v]: any) => {
      runningQty = runningQty + v.inQty - v.outQty;
      runningValue = runningValue + v.inValue - v.outValue;

      return {
        month,
        ...v,
        closingQty: runningQty,
        closingValue: runningValue,
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
                    <td className="border p-1 text-right">{r.inQty}</td>
                    <td className="border p-1 text-right">
                      {r.inValue.toFixed(2)}
                    </td>
                    <td className="border p-1 text-right">{r.outQty}</td>
                    <td className="border p-1 text-right">
                      {r.outValue.toFixed(2)}
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

export default ItemMonthlySummary;
