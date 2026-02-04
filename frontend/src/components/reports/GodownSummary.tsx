import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import Swal from "sweetalert2";

interface BatchMovement {
  batch: string;
  inwardDate: string;
  inwardQty: number;
  outwardDate: string;
  outwardQty: number;
  closingQty: number;
}

interface ItemRow {
  itemName: string;
  batches: BatchMovement[];
}

interface GodownData {
  [itemName: string]: BatchMovement[];
}

interface Transaction {
  itemName: string;
  batch: string;
  date: string;
  type: "Inward" | "Outward";
  qty: number;
  rate: number;
  amount: number;
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
  const [viewMode, setViewMode] = useState<"summary" | "detail">("summary");

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL
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
      `${import.meta.env.VITE_API_URL
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
      `${import.meta.env.VITE_API_URL
      }/api/sales-vouchers/sale-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSalesHistory(res.data || []);
        else Swal.fire("Error", "Failed to load sales history", "error");
      });
  }, [companyId, ownerType, ownerId]);

  /* ================= BUILD BATCH-WISE SUMMARY ================= */
  const godownGroupedByItem = useMemo(() => {
    const godownMap: Record<string | number, GodownData> = {};

    // First, organize purchase by godown and item-batch
    purchaseHistory.forEach((p) => {
      const godownId = p.godownId;
      const itemName = p.itemName;
      const batchKey = `${itemName}|${p.batchNumber || "Default"}`;

      if (!godownMap[godownId]) {
        godownMap[godownId] = {};
      }
      if (!godownMap[godownId][itemName]) {
        godownMap[godownId][itemName] = [];
      }

      // Find or create batch entry
      let batchEntry = godownMap[godownId][itemName].find(
        (b) => b.batch === (p.batchNumber || "Default")
      );

      if (!batchEntry) {
        batchEntry = {
          batch: p.batchNumber || "Default",
          inwardDate: p.purchaseDate,
          inwardQty: Number(p.purchaseQuantity || 0),
          outwardDate: "",
          outwardQty: 0,
          closingQty: Number(p.purchaseQuantity || 0),
        };
        godownMap[godownId][itemName].push(batchEntry);
      } else {
        batchEntry.inwardQty += Number(p.purchaseQuantity || 0);
        batchEntry.closingQty = batchEntry.inwardQty - batchEntry.outwardQty;
        if (!batchEntry.inwardDate || new Date(p.purchaseDate) < new Date(batchEntry.inwardDate)) {
          batchEntry.inwardDate = p.purchaseDate;
        }
      }
    });

    // Then, update with sales data
    salesHistory.forEach((s) => {
      const godownId = s.godownId;
      const itemName = s.itemName;

      if (godownMap[godownId] && godownMap[godownId][itemName]) {
        godownMap[godownId][itemName].forEach((batch) => {
          if (batch.batch === (s.batchNumber || "Default")) {
            const outwardQty = Math.abs(Number(s.qtyChange || 0));
            batch.outwardQty += outwardQty;
            batch.outwardDate = s.movementDate;
            batch.closingQty = batch.inwardQty - batch.outwardQty;
          }
        });
      }
    });

    return godownMap;
  }, [purchaseHistory, salesHistory]);

  /* ================= BUILD TRANSACTION-WISE DETAIL VIEW ================= */
  const godownTransactionDetail = useMemo(() => {
    const godownMap: Record<string | number, Transaction[]> = {};

    // Add all inward transactions
    purchaseHistory.forEach((p) => {
      const godownId = p.godownId;
      if (!godownMap[godownId]) {
        godownMap[godownId] = [];
      }
      const rate = Number(p.rate || 0);
      const qty = Number(p.purchaseQuantity || 0);
      godownMap[godownId].push({
        itemName: p.itemName,
        batch: p.batchNumber || "Default",
        date: p.purchaseDate,
        type: "Inward",
        qty: qty,
        rate: rate,
        amount: qty * rate,
      });
    });

    // Add all outward transactions
    salesHistory.forEach((s) => {
      const godownId = s.godownId;
      if (!godownMap[godownId]) {
        godownMap[godownId] = [];
      }
      const rate = Number(s.rate || 0);
      const qty = Math.abs(Number(s.qtyChange || 0));
      godownMap[godownId].push({
        itemName: s.itemName,
        batch: s.batchNumber || "Default",
        date: s.movementDate,
        type: "Outward",
        qty: qty,
        rate: rate,
        amount: qty * rate,
      });
    });

    // Sort transactions by date for each godown
    Object.keys(godownMap).forEach((godownId) => {
      godownMap[godownId].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    });

    return godownMap;
  }, [purchaseHistory, salesHistory]);

  /* ================= FILTER BY SELECTED GODOWN ================= */
  const filteredGodownGrouped = useMemo(() => {
    if (!selectedGodownId) {
      return godownGroupedByItem;
    }
    return {
      [selectedGodownId]: godownGroupedByItem[selectedGodownId] || {},
    };
  }, [godownGroupedByItem, selectedGodownId]);

  const filteredGodownTransactions = useMemo(() => {
    if (!selectedGodownId) {
      return godownTransactionDetail;
    }
    return {
      [selectedGodownId]: godownTransactionDetail[selectedGodownId] || [],
    };
  }, [godownTransactionDetail, selectedGodownId]);

  // get godown name with id
  const godownName = (id: number | string) => {
    const godown = godowns.find((g) => String(g.id) === String(id));
    return godown?.name || "-";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-IN");
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
          {/* VIEW MODE TOGGLE */}
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
            <button
              onClick={() => setViewMode("summary")}
              className={`px-4 py-2 rounded font-medium transition-all ${viewMode === "summary"
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
            >
              Summary View
            </button>
            <button
              onClick={() => setViewMode("detail")}
              className={`px-4 py-2 rounded font-medium transition-all ${viewMode === "detail"
                  ? "bg-blue-500 text-white"
                  : "bg-transparent text-gray-700 hover:bg-gray-200"
                }`}
            >
              Detail View
            </button>
          </div>

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
        {viewMode === "summary" ? (
          <>
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
                <div key={godownId} className="border rounded-md p-6 bg-white shadow-md">
                  {/* GODOWN NAME */}
                  <h3 className="font-bold text-lg mb-6 text-gray-800">
                    {godownNameValue}
                  </h3>

                  {/* ITEMS UNDER THIS GODOWN */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-blue-100 border-b-2 border-blue-300">
                          <th className="border px-4 py-3 text-left font-semibold text-gray-700">
                            Item
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-gray-700">
                            Batch
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-green-700">
                            Inward (Date)
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-green-700">
                            Inward Qty
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-red-700">
                            Outward (Date)
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-red-700">
                            Outward Qty
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-blue-700">
                            Closing Balance
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {Object.entries(itemMap).map(([itemName, batches]) => (
                          batches.map((batch, batchIndex) => (
                            <tr
                              key={`${itemName}-${batchIndex}`}
                              className="hover:bg-gray-50 border-b"
                            >
                              {/* Item Name - Show only on first batch */}
                              {batchIndex === 0 ? (
                                <td
                                  className="border px-4 py-3 font-semibold text-gray-800 bg-gray-50"
                                  rowSpan={batches.length}
                                >
                                  {itemName}
                                </td>
                              ) : null}

                              {/* Batch */}
                              <td className="border px-4 py-3 text-center">
                                {batch.batch}
                              </td>

                              {/* Inward Date */}
                              <td className="border px-4 py-3 text-center text-green-700 font-medium">
                                {formatDate(batch.inwardDate)}
                              </td>

                              {/* Inward Qty */}
                              <td className="border px-4 py-3 text-center text-green-700 font-semibold">
                                {batch.inwardQty}
                              </td>

                              {/* Outward Date */}
                              <td className="border px-4 py-3 text-center text-red-700 font-medium">
                                {formatDate(batch.outwardDate)}
                              </td>

                              {/* Outward Qty */}
                              <td className="border px-4 py-3 text-center text-red-700 font-semibold">
                                {batch.outwardQty > 0 ? batch.outwardQty : "-"}
                              </td>

                              {/* Closing Balance */}
                              <td className="border px-4 py-3 text-center font-bold text-blue-700 bg-blue-50">
                                {batch.closingQty}
                              </td>
                            </tr>
                          ))
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            {Object.keys(filteredGodownTransactions).length === 0 && (
              <p className="text-gray-500 text-center py-8">
                {selectedGodownId
                  ? "No transaction data available for selected godown"
                  : "No transaction data available"}
              </p>
            )}

            {Object.entries(filteredGodownTransactions).map(([godownId, transactions]) => {
              const godownNameValue = godownName(godownId);

              // Group transactions by item and batch for calculation
              const groupedTransactions: Record<string, Transaction[]> = {};
              transactions.forEach(t => {
                const key = `${t.itemName}|${t.batch}`;
                if (!groupedTransactions[key]) groupedTransactions[key] = [];
                groupedTransactions[key].push(t);
              });

              return (
                <div key={godownId} className="border rounded-md p-6 bg-white shadow-md">
                  {/* GODOWN NAME */}
                  <h3 className="font-bold text-lg mb-6 text-gray-800">
                    {godownNameValue}
                  </h3>

                  {/* TRANSACTIONS TABLE */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-purple-100 border-b-2 border-purple-300">
                          <th className="border px-4 py-3 text-left font-semibold text-gray-700">
                            Item
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-gray-700">
                            Batch
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-gray-700">
                            Date
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-green-700">
                            Inward
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-red-700">
                            Outward
                          </th>
                          <th className="border px-4 py-3 text-center font-semibold text-blue-700">
                            Closing
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {Object.entries(groupedTransactions).map(([key, itemTransactions]) => {
                          const [itemName, batch] = key.split('|');
                          let currentClosing = 0;

                          return itemTransactions.map((transaction, idx) => {
                            if (transaction.type === "Inward") {
                              currentClosing += transaction.qty;
                            } else {
                              currentClosing -= transaction.qty;
                            }

                            return (
                              <tr key={`${key}-${idx}`} className="hover:bg-gray-50 border-b">
                                {idx === 0 ? (
                                  <>
                                    <td className="border px-4 py-3 font-semibold text-gray-800 bg-gray-50" rowSpan={itemTransactions.length}>
                                      {itemName}
                                    </td>
                                    <td className="border px-4 py-3 text-center bg-gray-50" rowSpan={itemTransactions.length}>
                                      {batch}
                                    </td>
                                  </>
                                ) : null}
                                <td className="border px-4 py-3 text-center text-gray-600">
                                  {formatDate(transaction.date)}
                                </td>
                                <td className="border px-4 py-3 text-center font-semibold text-green-700">
                                  {transaction.type === "Inward" ? transaction.qty : "-"}
                                </td>
                                <td className="border px-4 py-3 text-center font-semibold text-red-700">
                                  {transaction.type === "Outward" ? transaction.qty : "-"}
                                </td>
                                <td className="border px-4 py-3 text-center font-bold text-blue-700 bg-blue-50">
                                  {currentClosing}
                                </td>
                              </tr>
                            );
                          });
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default GodownMovementRegister;
