import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

interface B2CSSupply {
  voucherId: number;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  taxableValue: number;
  igstRate: number;
  igstAmount: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  cessRate: number;
  cessAmount: number;
}

const GstrB2cs = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [b2csData, setB2csData] = useState<B2CSSupply[]>([]);

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
      fetchB2CSData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, ownerType, ownerId, filters.fromDate, filters.toDate]);

  const fetchB2CSData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        company_id: companyId,
        owner_type: ownerType,
        owner_id: ownerId,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/b2c-small?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch B2C Small data");
      }

      const data = await response.json();
      console.log("B2CS data", data);
      setB2csData(data || []);
    } catch (error) {
      console.error("Error fetching B2C Small data:", error);
      setB2csData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatPlaceOfSupply = (pos: string) => {
    if (!pos) return "-";
    if (pos.includes("-")) return pos;
    return pos;
  };

  const totals = useMemo(() => {
    return b2csData.reduce(
      (acc, item) => ({
        taxableValue: acc.taxableValue + (Number(item.taxableValue) || 0),
        igstAmount: acc.igstAmount + (Number(item.igstAmount) || 0),
        cgstAmount: acc.cgstAmount + (Number(item.cgstAmount) || 0),
        sgstAmount: acc.sgstAmount + (Number(item.sgstAmount) || 0),
        cessAmount: acc.cessAmount + (Number(item.cessAmount) || 0),
      }),
      {
        taxableValue: 0,
        igstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        cessAmount: 0,
      }
    );
  }, [b2csData]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const b2csDataForExcel = b2csData.map((supply) => ({
      "Invoice Number": supply.invoiceNumber,
      "Invoice Date": formatDate(supply.invoiceDate),
      "Invoice Value": supply.invoiceValue,
      "Place of Supply": formatPlaceOfSupply(supply.placeOfSupply),
      "Applicable % of Tax Rate": "-",
      "Taxable Value": supply.taxableValue,
      "IGST Rate": `${supply.igstRate}%`,
      "IGST Amount": supply.igstAmount,
      "CGST Rate": `${supply.cgstRate}%`,
      "CGST Amount": supply.cgstAmount,
      "SGST Rate": `${supply.sgstRate}%`,
      "SGST Amount": supply.sgstAmount,
      "Cess Rate": `${supply.cessRate}%`,
      "Cess Amount": supply.cessAmount,
    }));

    const ws = XLSX.utils.json_to_sheet(b2csDataForExcel);
    XLSX.utils.book_append_sheet(wb, ws, "B2C Small Supplies");

    const summaryData = [
      { Description: "Total Taxable Value", Amount: totals.taxableValue },
      { Description: "Total IGST", Amount: totals.igstAmount },
      { Description: "Total CGST", Amount: totals.cgstAmount },
      { Description: "Total SGST", Amount: totals.sgstAmount },
      { Description: "Total Cess", Amount: totals.cessAmount },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    XLSX.writeFile(
      wb,
      `B2CS_${filters.fromDate}_to_${filters.toDate}.xlsx`
    );
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
        <h1 className="text-2xl font-bold">5B - B2C Small Supplies</h1>
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
                onClick={fetchB2CSData}
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
        {/* Section Header */}
        <div
          className={`p-3 border-b-2 ${
            theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
          }`}
        >
          <h3 className="text-lg font-bold">5B - B2C Small Supplies</h3>
          <p className="text-sm opacity-90">
            Details of Outward Supplies made to Unregistered Persons (Invoice
            value ≤ ₹2.5 lakh)
          </p>
        </div>

        {/* B2C Small Table */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : b2csData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No B2C Small Supplies data available
              </p>
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
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Invoice Number
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Invoice Date
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Invoice Value
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Place of Supply
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Applicable % of Tax Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Taxable Value
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      IGST Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      IGST Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      CGST Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      CGST Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      SGST Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      SGST Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Cess Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Cess Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {b2csData.map((supply, index) => (
                    <tr
                      key={supply.voucherId || index}
                      className={`${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="border border-gray-300 p-2 text-xs font-mono">
                        {supply.invoiceNumber || "-"}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {formatDate(supply.invoiceDate)}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{supply.invoiceValue?.toLocaleString() || "0"}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {formatPlaceOfSupply(supply.placeOfSupply)}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">-</td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{supply.taxableValue?.toLocaleString() || "0"}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.igstRate || 0}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{supply.igstAmount?.toLocaleString() || "0"}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.cgstRate || 0}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{supply.cgstAmount?.toLocaleString() || "0"}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.sgstRate || 0}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{supply.sgstAmount?.toLocaleString() || "0"}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.cessRate || 0}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{supply.cessAmount?.toLocaleString() || "0"}
                      </td>
                    </tr>
                  ))}
                  {b2csData.length > 0 && (
                    <tr
                      className={`font-bold ${
                        theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                      }`}
                    >
                      <td
                        colSpan={5}
                        className="border border-gray-300 p-2 text-xs text-right"
                      >
                        Total:
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{totals.taxableValue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs"></td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{totals.igstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs"></td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{totals.cgstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs"></td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{totals.sgstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs"></td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{totals.cessAmount.toLocaleString()}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GstrB2cs;


