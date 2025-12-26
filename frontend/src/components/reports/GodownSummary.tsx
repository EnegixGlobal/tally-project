import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import Swal from "sweetalert2";

interface MovementRow {
  itemName: string;
  batch: string;
  date: string;
  type: "Inward" | "Outward";
  qty: number;
  rate: number;
  godownId: number;
}

const GodownMovementRegister: React.FC = () => {
  const navigate = useNavigate();

  const [purchaseHistory, setPurchaseHistory] = useState<any[]>([]);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);

  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [godowns, setGodowns] = useState<
    { id: string; name: string; address: string }[]
  >([]);
  const [selectedGodownId, setSelectedGodownId] = useState<string>("");

  useEffect(() => {
    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/godowns?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setGodowns(data.data);
        else Swal.fire("Error", "Failed to load godowns", "error");
      })
      .catch(() => {
        Swal.fire("Error", "Something went wrong", "error");
      });
  }, []);

  /* ================= LOAD PURCHASE ================= */
  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/purchase-vouchers/purchase-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPurchaseHistory(res.data || []);
        else Swal.fire("Error", "Failed to load purchase history", "error");
      });
  }, [companyId, ownerType, ownerId]);

  /* ================= LOAD SALES ================= */
  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/sales-vouchers/sale-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSalesHistory(res.data || []);
        else Swal.fire("Error", "Failed to load sales history", "error");
      });
  }, [companyId, ownerType, ownerId]);

  /* ================= MERGE MOVEMENTS ================= */
  const movements: MovementRow[] = useMemo(() => {
    const inward = purchaseHistory.map((p) => ({
      itemName: p.itemName,
      batch: p.batchNumber || "Default",
      date: p.purchaseDate,
      type: "Inward" as const,
      qty: Number(p.purchaseQuantity || 0),
      rate: Number(p.rate || 0),
      godownId: p.godownId,
    }));

    const outward = salesHistory.map((s) => ({
      itemName: s.itemName,
      batch: s.batchNumber || "Default",
      date: s.movementDate,
      type: "Outward" as const,
      qty: Math.abs(Number(s.qtyChange || 0)),
      rate: Number(s.rate || 0),
      godownId: s.godownId,
    }));

    return [...inward, ...outward];
  }, [purchaseHistory, salesHistory]);

  /* ================= GROUP BY GODOWN, THEN BY ITEM ================= */
  const godownGrouped = useMemo(() => {
    // First group by godownId
    const godownMap: Record<string | number, Record<string, MovementRow[]>> = {};

    movements.forEach((m) => {
      const godownKey = m.godownId;
      if (!godownMap[godownKey]) {
        godownMap[godownKey] = {};
      }
      if (!godownMap[godownKey][m.itemName]) {
        godownMap[godownKey][m.itemName] = [];
      }
      godownMap[godownKey][m.itemName].push(m);
    });

    return godownMap;
  }, [movements]);

  /* ================= FILTER BY SELECTED GODOWN ================= */
  const filteredGodownGrouped = useMemo(() => {
    if (!selectedGodownId) {
      return godownGrouped;
    }
    return {
      [selectedGodownId]: godownGrouped[selectedGodownId] || {},
    };
  }, [godownGrouped, selectedGodownId]);

  // get godown name with id
  const godownName = (id: number | string) => {
    const godown = godowns.find((g) => String(g.id) === String(id));
    return godown?.name || "-";
  };

  return (
    <div className="pt-[56px] px-4">
      {/* HEADER */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/app/reports")}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">
          Stock Movement Register (Godown Wise)
        </h1>

        <div className="ml-auto flex items-center gap-4">
          {/* GODOWN SELECT DROPDOWN */}
          <div className="flex items-center gap-2">
            <label htmlFor="godownSelect" className="text-sm font-medium">
              Select Godown:
            </label>
            <select
              id="godownSelect"
              value={selectedGodownId}
              onChange={(e) => setSelectedGodownId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Godowns</option>
              {godowns.map((godown) => (
                <option key={godown.id} value={godown.id}>
                  {godown.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={() => window.print()} className="p-2">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-8 text-sm">
        {Object.keys(filteredGodownGrouped).length === 0 && (
          <p className="text-gray-500 text-center py-8">
            {selectedGodownId
              ? "No stock movement data available for selected godown"
              : "No stock movement data available"}
          </p>
        )}

        {Object.entries(filteredGodownGrouped).map(([godownId, itemMap]) => {
          const godownNameValue = godownName(godownId);
          return (
            <div key={godownId} className="border rounded-md p-4">
              {/* GODOWN NAME */}
              <h3 className="font-bold text-lg mb-4">{godownNameValue}</h3>

              {/* ITEMS UNDER THIS GODOWN */}
              {Object.entries(itemMap).map(([itemName, rows]) => (
                <div key={itemName} className="mb-6 last:mb-0">
                  {/* ITEM NAME */}
                  <h4 className="font-semibold text-md mb-2 text-gray-700">
                    {itemName}
                  </h4>

                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border px-2 py-1 text-center">Type</th>
                        <th className="border px-2 py-1 text-center">Item</th>
                        <th className="border px-2 py-1 text-center">Batch</th>
                        <th className="border px-2 py-1 text-center">Date</th>
                        <th className="border px-2 py-1 text-center">Qty</th>
                        <th className="border px-2 py-1 text-center">Rate</th>
                        <th className="border px-2 py-1 text-center">Total Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {rows.map((r, i) => (
                        <tr key={i}>
                          <td
                            className={`border px-2 py-1 text-center font-semibold ${
                              r.type === "Inward"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {r.type}
                          </td>
                          <td className="border text-center px-2 py-1">
                            {r.itemName}
                          </td>

                          <td className="border text-center px-2 py-1">
                            {r.batch}
                          </td>

                          <td className="border px-2 py-1 text-center">
                            {r.date
                              ? new Date(r.date).toLocaleDateString()
                              : "-"}
                          </td>

                          <td className="border px-2 py-1 text-center">
                            {r.qty}
                          </td>

                          <td className="border px-2 py-1 text-center">
                            {r.rate.toFixed(2)}
                          </td>

                          <td className="border px-2 py-1 text-center font-semibold">
                            {(r.qty * r.rate).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GodownMovementRegister;
