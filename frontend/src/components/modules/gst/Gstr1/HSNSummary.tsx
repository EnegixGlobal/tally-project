import { useEffect, useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

const HSNSummary = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hsnData, setHsnData] = useState<any[]>([]);

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (companyId && ownerType && ownerId) {
      loadHSNSummary();
    }
  }, [companyId, ownerType, ownerId, filters.fromDate, filters.toDate]);

  const loadHSNSummary = async () => {
    if (!companyId || !ownerType || !ownerId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        company_id: companyId,
        owner_type: ownerType,
        owner_id: ownerId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });

      const url = `${
        import.meta.env.VITE_API_URL
      }/api/b2c/hsn-summary?${params}`;

      const res = await fetch(url);
      const json = await res.json();
      console.log("Data", json);
      
      if (json.success) {
        setHsnData(json.data || []);
      } else {
        console.error("Failed to fetch HSN summary:", json);
        setHsnData([]);
      }
    } catch (err) {
      console.error("Failed to fetch HSN summary:", err);
      setHsnData([]);
    } finally {
      setLoading(false);
    }
  };

  // No need for totals calculation as data already comes as Total, B2B Total, B2C Total

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-IN").format(num);
  };

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const hsnDataForExcel = hsnData.map((row: any) => ({
      Label: row.label || "-",
      HSN: row.hsn || "NA",
      UQC: row.uqc || "NA",
      Count: Number(row.count) || 0,
      "Total Value": Number(row.totalValue) || 0,
      "Taxable Value": Number(row.taxableValue) || 0,
      "IGST Amount": Number(row.igstAmount) || 0,
      "CGST Amount": Number(row.cgstAmount) || 0,
      "SGST Amount": Number(row.sgstAmount) || 0,
      "Cess Amount": Number(row.cessAmount) || 0,
    }));

    const ws = XLSX.utils.json_to_sheet(hsnDataForExcel);
    XLSX.utils.book_append_sheet(wb, ws, "HSN Summary");

    XLSX.writeFile(wb, `HSN_Summary_${filters.fromDate}_to_${filters.toDate}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pt-[56px] px-4 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center mb-6 no-print">
        <button
          title="Back to GSTR-1"
          type="button"
          onClick={() => navigate("/app/gst/gstr-1")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">10 - HSN Summary</h1>
        <div className="ml-auto flex space-x-2">
          <button
            type="button"
            title="Filter"
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
            onClick={handlePrint}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Export"
            type="button"
            onClick={exportToExcel}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg no-print ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h3 className="font-semibold mb-4">Date Range Filter</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters({ ...filters, fromDate: e.target.value })
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters({ ...filters, toDate: e.target.value })
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={loadHSNSummary}
                className={`px-4 py-2 rounded ${
                  theme === "dark"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Apply Filter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div
        className={`mb-6 rounded-lg border-2 ${
          theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
        }`}
      >
        <div
          className={`p-3 border-b-2 ${
            theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
          }`}
        >
          <h3 className="text-lg font-bold">HSN-wise Summary of Outward Supplies</h3>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : hsnData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No HSN data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    {/* <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      HSN
                    </th> */}
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Description
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      UQC
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Total Quantity
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Total Value
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Taxable Value
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      IGST Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      CGST Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      SGST Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Cess Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hsnData.map((row, index) => (
                    <tr 
                      key={index}
                      className={row.label === 'Total' ? `font-bold ${theme === "dark" ? "bg-gray-600" : "bg-gray-200"}` : ''}
                    >
                      {/* <td className="border border-gray-300 p-2 text-xs font-mono">
                        {row.hsn || "NA"}
                      </td> */}
                      <td className="border border-gray-300 p-2 text-xs font-semibold">
                        {row.label || "-"}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {row.uqc || "NA"}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {formatNumber(Number(row.count) || 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{formatNumber(Number(row.totalValue) || 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{formatNumber(Number(row.taxableValue) || 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{formatNumber(Number(row.igstAmount) || 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{formatNumber(Number(row.cgstAmount) || 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{formatNumber(Number(row.sgstAmount) || 0)}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{formatNumber(Number(row.cessAmount) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HSNSummary;

