import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import Swal from "sweetalert2";
import { useAppContext } from "../../context/AppContext";

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
  const { theme } = useAppContext();
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

  /* ================= GROUP BY ITEM ================= */
  const itemGrouped = useMemo(() => {
    const map: Record<string, MovementRow[]> = {};

    movements.forEach((m) => {
      if (!map[m.itemName]) {
        map[m.itemName] = [];
      }
      map[m.itemName].push(m);
    });

    return map;
  }, [movements]);

  // get godown name with id

  const godownName = (id) => {
    return godowns.find((i) => i.id === id)?.name || "-";
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
          Stock Movement Register (Item Wise)
        </h1>

        <div className="ml-auto">
          <button onClick={() => window.print()} className="p-2">
            <Printer size={18} />
          </button>
        </div>
      </div>

      {/* CONTENT */}
      <div className="space-y-8 text-sm">
        {Object.keys(itemGrouped).length === 0 && (
          <p className="text-gray-500 text-center py-8">
            No stock movement data available
          </p>
        )}

        {Object.entries(itemGrouped).map(([itemName, rows]) => (
          <div key={itemName} className="border rounded-md p-4">
            {/* ITEM NAME */}
            <h3 className="font-bold text-lg mb-3">{itemName}</h3>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border px-2 py-1 text-center">Type</th>
                  <th className="border px-2 py-1 text-center">Godown</th>
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
                        r.type === "Inward" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {r.type}
                    </td>
                    <td className="border text-center px-2 py-1">
                      {godownName(r.godownId)}
                    </td>

                    <td className="border text-center px-2 py-1">{r.batch}</td>

                    <td className="border px-2 py-1 text-center">
                      {r.date ? new Date(r.date).toLocaleDateString() : "-"}
                    </td>

                    <td className="border px-2 py-1 text-center">{r.qty}</td>

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
    </div>
  );
};

export default GodownMovementRegister;
