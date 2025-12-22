import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";

interface GodownSummaryRow {
  godownId: number;
  godownName: string;
  itemId: number;
  itemName: string;
  unit: string;
  quantity: number; // decimal
  rate: number; // decimal
  value: number; // decimal
}

const GodownSummary: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Filters state - add godown filter and asOnDate if needed
  const [filters, setFilters] = useState({
    godownId: "",
    asOnDate: new Date().toISOString().slice(0, 10),
  });

  const [data, setData] = useState<GodownSummaryRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on filter change
  useEffect(() => {
    async function fetchGodownSummary() {
      setLoading(true);
      setError(null);
      const companyId = localStorage.getItem("company_id") || "";
      const ownerType = localStorage.getItem("supplier") || "";
      const ownerId =
        ownerType === "employee"
          ? localStorage.getItem("employee_id") || ""
          : localStorage.getItem("user_id") || "";

      try {
        const params = new URLSearchParams();
        if (filters.godownId) params.append("godownId", filters.godownId);
        params.append("company_id", companyId);
        params.append("owner_type", ownerType);
        params.append("owner_id", ownerId);

        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/godown-summary?${params.toString()}`
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Error: ${res.status}`);
        }

        const json: GodownSummaryRow[] = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || "Failed to load");
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchGodownSummary();
  }, [filters]);

  // Memoize total calculation
  // const totals = useMemo(() => {
  //   const totalQty = data.reduce((sum, row) => sum + row.quantity, 0);
  //   const totalValue = data.reduce((sum, row) => sum + row.value, 0);
  //   return { totalQty, totalValue };
  // }, [data]);

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          title="Back to Reports"
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Godown Summary</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Toggle Filters"
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print Report"
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Download Report"
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Godown</label>
              <select
                title="Select Godown"
                value={filters.godownId}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, godownId: e.target.value }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="">All Godowns</option>
                {/* 
                  You can fetch godowns list from backend or context and map options here.
                  Example:
                  godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)
                */}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                As on Date
              </label>
              <input
                title="Select Date"
                type="date"
                value={filters.asOnDate}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, asOnDate: e.target.value }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Table */}
      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold">Godown-wise Stock Summary</h2>
          <p className="text-sm opacity-75">{filters.asOnDate}</p>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr
                className={`${
                  theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-100"
                }`}
              >
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Godown
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Stock Item
                </th>
                <th className="border border-gray-300 px-4 py-3 text-left">
                  Unit
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right">
                  Quantity
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right">
                  Rate
                </th>
                <th className="border border-gray-300 px-4 py-3 text-right">
                  Value
                </th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center opacity-70">
                    No stock found in godowns
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      {row.godownName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.itemName}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {row.unit}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      {row.quantity.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      ₹{row.rate.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right">
                      ₹{row.value.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {data.length > 0 && (
              <tfoot>
                <tr
                  className={`${
                    theme === "dark"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-200 font-bold"
                  }`}
                >
                  <td
                    colSpan={3}
                    className="border border-gray-300 px-4 py-2 text-right"
                  >
                    Total:
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    {data
                      .reduce((sum, r) => sum + r.quantity, 0)
                      .toLocaleString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2" />
                  <td className="border border-gray-300 px-4 py-2 text-right">
                    ₹
                    {data.reduce((sum, r) => sum + r.value, 0).toLocaleString()}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press F5 to refresh,
          F12 to configure display options.
        </p>
      </div>
    </div>
  );
};

export default GodownSummary;
