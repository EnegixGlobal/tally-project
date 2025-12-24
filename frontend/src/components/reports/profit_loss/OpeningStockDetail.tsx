import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";

const OpeningStockDetail: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const itemName = searchParams.get("item");
  const itemId = searchParams.get("itemId");

  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [stockItem, setStockItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const MONTHS = [
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

  /* ===================== FETCH STOCK ITEM ===================== */
  useEffect(() => {
    const fetchStockItem = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        if (!res.ok) {
          throw new Error("Failed to fetch stock items");
        }

        const data = await res.json();
        const items = data.data || [];

        // Find the specific item by ID or name
        const foundItem = items.find(
          (item: any) =>
            String(item.id) === String(itemId) || item.name === itemName
        );

        if (foundItem) {
          setStockItem(foundItem);
        }
        setLoading(false);
      } catch (err) {
        console.error("Stock item fetch error:", err);
        setLoading(false);
      }
    };

    if (companyId && ownerType && ownerId) {
      fetchStockItem();
    }
  }, [companyId, ownerType, ownerId, itemId, itemName]);

  // Filter batches that have opening rate
  const openingBatches = stockItem?.batches?.filter(
    (b: any) => b.openingRate
  ) || [];

  /* ===================== MONTH WISE VALUE ===================== */
  const getMonthWiseValue = () => {
    const totals: Record<string, number> = {};
    MONTHS.forEach((m) => (totals[m] = 0));

    openingBatches.forEach((batch: any) => {
      // Use manufacturing date if available, otherwise use current date or item creation date
      let dateToUse = new Date();
      
      if (batch.batchManufacturingDate) {
        dateToUse = new Date(batch.batchManufacturingDate);
      } else if (stockItem?.createdAt) {
        dateToUse = new Date(stockItem.createdAt);
      }

      const monthName = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ][dateToUse.getMonth()];

      if (totals[monthName] !== undefined) {
        const qty = Number(batch.batchQuantity || 0);
        const rate = Number(batch.openingRate || 0);
        totals[monthName] += qty * rate;
      }
    });

    return totals;
  };

  const monthWiseValue = getMonthWiseValue();

  /* ===================== MONTH FILTER ===================== */
  const monthIndexMap: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  const selectedMonthData = selectedMonth
    ? openingBatches.filter((batch: any) => {
        let dateToUse = new Date();
        
        if (batch.batchManufacturingDate) {
          dateToUse = new Date(batch.batchManufacturingDate);
        } else if (stockItem?.createdAt) {
          dateToUse = new Date(stockItem.createdAt);
        }

        return dateToUse.getMonth() === monthIndexMap[selectedMonth];
      })
    : [];

  const selectedMonthTotal = selectedMonthData.reduce((sum, batch) => {
    const qty = Number(batch.batchQuantity || 0);
    const rate = Number(batch.openingRate || 0);
    return sum + qty * rate;
  }, 0);

  // Calculate total value
  const totalValue = openingBatches.reduce((sum: number, b: any) => {
    const qty = Number(b.batchQuantity || 0);
    const rate = Number(b.openingRate || 0);
    return sum + qty * rate;
  }, 0);

  /* ===================== UI ===================== */
  if (loading) {
    return (
      <div className="pt-[56px] px-4">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (!stockItem) {
    return (
      <div className="pt-[56px] px-4">
        <div className="text-center py-8">Stock item not found</div>
      </div>
    );
  }

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">Opening Stock Detail</h1>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
          </button>
          <button
            className={`p-2 rounded ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            className={`p-2 rounded ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* ================= MONTH SUMMARY ================= */}
      {!selectedMonth && (
        <div>
          <div
            className={`border-b text-center py-3 ${
              theme === "dark" ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <div className="text-lg font-semibold">Opening Stock</div>
            <div className={`text-sm ${
              theme === "dark" ? "text-gray-400" : "text-gray-600"
            }`}>{itemName}</div>
          </div>

          <div
            className={`grid grid-cols-3 font-semibold border-b ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="px-3 py-2">Month</div>
            <div className="px-3 py-2 text-center">Value</div>
            <div className="px-3 py-2 text-center">Quantity</div>
          </div>

          {MONTHS.map((month) => {
            const monthBatches = openingBatches.filter((batch: any) => {
              let dateToUse = new Date();
              
              if (batch.batchManufacturingDate) {
                dateToUse = new Date(batch.batchManufacturingDate);
              } else if (stockItem?.createdAt) {
                dateToUse = new Date(stockItem.createdAt);
              }

              return dateToUse.getMonth() === monthIndexMap[month];
            });

            const monthQty = monthBatches.reduce((sum, b) => {
              return sum + Number(b.batchQuantity || 0);
            }, 0);

            return (
              <div
                key={month}
                onClick={() => setSelectedMonth(month)}
                className={`grid grid-cols-3 border-b cursor-pointer ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-blue-50"
                }`}
              >
                <div className="px-3 py-2">{month}</div>
                <div className="px-3 py-2 text-center font-mono">
                  {monthWiseValue[month]
                    ? monthWiseValue[month].toLocaleString()
                    : "0"}
                </div>
                <div className="px-3 py-2 text-center font-mono">
                  {monthQty.toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= MONTH DETAILS ================= */}
      {selectedMonth && (
        <div className="mt-4">
          <div
            className={`flex items-center p-3 border-b relative ${
              theme === "dark" ? "bg-gray-800" : "bg-gray-100"
            }`}
          >
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-lg font-semibold"
            >
              ← Back
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 font-semibold">
              Item: {itemName} | {selectedMonth}
            </div>
          </div>

          <div
            className={`grid grid-cols-6 font-semibold border-b ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="px-3 py-2">Batch Name</div>
            <div className="px-3 py-2 text-right">Quantity</div>
            <div className="px-3 py-2 text-right">Opening Rate</div>
            <div className="px-3 py-2 text-right">Value</div>
            <div className="px-3 py-2">Expiry Date</div>
            <div className="px-3 py-2">MFG Date</div>
          </div>

          {selectedMonthData.length === 0 ? (
            <div className="px-3 py-8 text-center text-gray-500">
              No batches found for {selectedMonth}
            </div>
          ) : (
            <>
              {selectedMonthData.map((batch: any, index: number) => {
                const qty = Number(batch.batchQuantity || 0);
                const rate = Number(batch.openingRate || 0);
                const value = qty * rate;

                return (
                  <div
                    key={index}
                    className={`grid grid-cols-6 border-b text-sm ${
                      theme === "dark" ? "border-gray-700" : ""
                    }`}
                  >
                    <div className="px-3 py-2">
                      {batch.batchName || "N/A"}
                    </div>
                    <div className="px-3 py-2 text-right font-mono">
                      {qty.toLocaleString()}
                    </div>
                    <div className="px-3 py-2 text-right font-mono">
                      {rate.toLocaleString()}
                    </div>
                    <div className="px-3 py-2 text-right font-mono">
                      {value.toLocaleString()}
                    </div>
                    <div className="px-3 py-2">
                      {batch.batchExpiryDate
                        ? new Date(batch.batchExpiryDate).toLocaleDateString()
                        : "N/A"}
                    </div>
                    <div className="px-3 py-2">
                      {batch.batchManufacturingDate
                        ? new Date(batch.batchManufacturingDate).toLocaleDateString()
                        : "N/A"}
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div
                className={`grid grid-cols-6 font-semibold ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <div className="col-span-3 px-3 py-2 text-right">Total :</div>
                <div className="px-3 py-2 text-right font-mono">
                  {selectedMonthTotal.toLocaleString()}
                </div>
                <div className="col-span-2"></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default OpeningStockDetail;

