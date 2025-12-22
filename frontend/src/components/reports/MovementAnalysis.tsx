import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";

interface MovementEntry {
  date: string;
  stockItemName: string;
  voucherType: string;
  voucherNumber: string;

  batches: {
    batchName: string;
    quantity: number;
    rate: number;
    manufacturingDate?: string;
    expiryDate?: string;
  }[];
}

const MovementAnalysis: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [fromDate, setFromDate] = useState(() => {
    const fd = new Date();
    fd.setMonth(fd.getMonth() - 6);
    return fd.toISOString().slice(0, 10);
  });

  const [toDate, setToDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    ownerType === "employee"
      ? localStorage.getItem("employee_id") || ""
      : localStorage.getItem("user_id") || "";

  const [data, setData] = useState<MovementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stockItemId, setStockItemId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const itemId = searchParams.get("itemId");

    if (itemId) setStockItemId(itemId);
  }, [location.search]);

  useEffect(() => {
    const fetchMovementData = async () => {
      if (!stockItemId) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/stock-movements?itemId=${stockItemId}&fromDate=${fromDate}&toDate=${toDate}&company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        if (!response.ok) {
          throw new Error("Failed to load item details");
        }

        const json = await response.json();

        console.log('json', json)

        setData([json.data]);
      } catch (e: any) {
        setError(e.message || "Unknown error");
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovementData();
  }, [stockItemId]);

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          onClick={() => navigate("/app/reports/stock-summary")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">Movement Analysis</h1>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
          </button>

          <button
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>

          <button
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">From Date</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className={`w-full p-2 rounded border ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600"
                : "border-gray-300"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">To Date</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className={`w-full p-2 rounded border ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600"
                : "border-gray-300"
            }`}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stock Item</label>
          <input
            type="text"
            placeholder="Enter Stock Item ID"
            value={stockItemId ?? ""}
            onChange={(e) => setStockItemId(e.target.value)}
            className={`w-full p-2 rounded border ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600"
                : "border-gray-300"
            }`}
          />
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <p>Loading movement data...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr
              className={`${
                theme === "dark"
                  ? "bg-gray-700 text-white"
                  : "bg-gray-200 text-black"
              }`}
            >
              <th className="p-2 border border-gray-400">Date</th>
              <th className="p-2 border border-gray-400">Stock Item</th>
              <th className="p-2 border border-gray-400">Batch Number</th>
              <th className="p-2 border border-gray-400">Batch Quantity</th>
              <th className="p-2 border border-gray-400 text-right">
                Batch Rate
              </th>
              <th className="p-2 border border-gray-400 text-right">
                Batch Manufactring
              </th>
              <th className="p-2 border border-gray-400 text-right">
                Batch Expire
              </th>
            </tr>
          </thead>

          <tbody>
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="p-4 text-center opacity-70">
                  No movement data found
                </td>
              </tr>
            )}

            {data.map((entry, idx) =>
              entry.batches.map((batch, bIdx) => (
                <tr
                  key={`${idx}-${bIdx}`}
                  className="hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  {/* Date */}
                  <td className="p-2 border">
                    {new Date(entry.date).toLocaleDateString("en-GB")}
                  </td>

                  {/* Item */}
                  <td className="p-2 border">{entry.stockItemName}</td>

                  {/* Batch */}
                  <td className="p-2 border">{batch.batchName}</td>

                  {/* Qty */}
                  <td className="p-2 border text-right">{batch.quantity}</td>

                  {/* Rate */}
                  <td className="p-2 border text-right">₹{batch.rate}</td>

                  {/* MFG */}
                  <td className="p-2 border">
                    {batch.manufacturingDate
                      ? new Date(batch.manufacturingDate).toLocaleDateString(
                          "en-GB"
                        )
                      : "-"}
                  </td>

                  {/* EXP */}
                  <td className="p-2 border">
                    {batch.expiryDate
                      ? new Date(batch.expiryDate).toLocaleDateString("en-GB")
                      : "-"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 px-2 text-sm text-center text-gray-500">
        Use filters above to change report range or item.
      </div>
    </div>
  );
};

export default MovementAnalysis;
