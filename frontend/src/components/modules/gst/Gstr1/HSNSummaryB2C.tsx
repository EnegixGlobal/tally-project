import { useEffect, useState } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

const HSNSummaryB2C = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
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
        type: 'b2c' // Explicitly fetch B2C data
      });

      const url = `${import.meta.env.VITE_API_URL
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
    XLSX.utils.book_append_sheet(wb, ws, "HSN Summary B2C");

    XLSX.writeFile(wb, `HSN_Summary_B2C_${filters.fromDate}_to_${filters.toDate}.xlsx`);
  };

  const generateFullJSON = (dataToExport?: any[], fromDate?: string, toDate?: string) => {
    const list = dataToExport || hsnData;
    if (list.length === 0) return;

    const fDate = fromDate || filters.fromDate;
    const tDate = toDate || filters.toDate;

    const payload = {
      type: "GSTR-1",
      section: "HSN Summary B2C Cumulative",
      period: {
        from: fDate,
        to: tDate,
      },
      data: list.map((row) => {
        const taxableValue = Number(row.taxableValue) || 0;
        const rate = Number(row.taxRate || 0);

        return {
          hsn: row.hsn || "NA",
          description: row.label || "-",
          uqc: row.uqc || "NA",
          totalQuantity: Number(row.count) || 0,
          totalValue: Number(row.totalValue) || 0,
          rate: rate,
          taxableValue: taxableValue,
          integratedTaxAmount: Number(row.igstAmount) || 0,
          centralTaxAmount: Number(row.cgstAmount) || 0,
          stateUtTaxAmount: Number(row.sgstAmount) || 0,
          cessAmount: Number(row.cessAmount) || 0,
        };
      }),
      generatedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `HSN_Summary_B2C_${fDate}_to_${tDate}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleMonthDownload = async (monthIndex: number) => {
    setDownloadLoading(true);
    try {
      const startYear = new Date(filters.fromDate).getFullYear();
      const isNextYear = monthIndex < 3;
      const actualYear = isNextYear ? startYear + 1 : startYear;

      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      const startDate = new Date(actualYear, monthIndex, 1);
      const endDate = new Date(actualYear, monthIndex + 1, 0);

      const fromStr = startDate.toISOString().split("T")[0];
      const toStr = endDate.toISOString().split("T")[0];

      const params = new URLSearchParams({
        company_id: companyId,
        owner_type: ownerType,
        owner_id: ownerId,
        fromDate: fromStr,
        toDate: toStr,
        type: 'b2c'
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/b2c/hsn-summary?${params}`
      );

      if (!response.ok) throw new Error("Failed to fetch data");
      const json = await response.json();
      const data = json.data || [];

      if (!data || data.length === 0) {
        alert(`No HSN data found for ${monthNames[monthIndex]} ${actualYear}`);
        return;
      }

      generateFullJSON(data, fromStr, toStr);
    } catch (err) {
      console.error(err);
      alert("Failed to download month report");
    } finally {
      setDownloadLoading(false);
    }
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
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">10 - HSN Summary (B2C)</h1>
        <div className="ml-auto flex space-x-2">
          {downloadLoading && <span className="text-xs text-blue-600 animate-pulse self-center">Downloading...</span>}
          <div className="flex items-center no-print mr-1">
            <select
              title="Download JSON by Month"
              disabled={downloadLoading}
              onChange={(e) => {
                if (e.target.value) {
                  handleMonthDownload(Number(e.target.value));
                  e.target.value = ""; // Reset
                }
              }}
              className={`text-xs p-1 rounded border outline-none ${theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-700"
                }`}
            >
              <option value="">Download JSON (Month)</option>
              {/* Fiscal Year April to March */}
              {[3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2].map((m) => {
                const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                return <option key={m} value={m}>{monthNames[m]}</option>;
              })}
            </select>
          </div>
          <button
            type="button"
            title="Filter"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print Report"
            type="button"
            onClick={handlePrint}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Export to JSON"
            type="button"
            onClick={() => generateFullJSON()}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <span className="text-xs font-bold px-1">JSON</span>
          </button>
          <button
            title="Export to Excel"
            type="button"
            onClick={exportToExcel}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg no-print ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
                  }`}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={loadHSNSummary}
                className={`px-4 py-2 rounded ${theme === "dark"
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
        className={`mb-6 rounded-lg border-2 ${theme === "dark"
          ? "bg-gray-800 border-gray-600"
          : "bg-white border-gray-300"
          }`}
      >
        <div
          className={`p-3 border-b-2 ${theme === "dark"
            ? "bg-blue-900 border-gray-600 text-white"
            : "bg-blue-800 border-gray-300 text-white"
            }`}
        >
          <h3 className="text-lg font-bold">HSN-wise Summary of Outward Supplies (B2C)</h3>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : hsnData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No HSN data available for B2C</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      HSN
                    </th>
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
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Taxable Value
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Integrated Tax Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Central Tax Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      State/UT Tax Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Cess Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {hsnData.map((row, index) => {
                    const rate = Number(row.taxRate || 0);

                    return (
                      <tr
                        key={index}
                        className={row.label === 'Total' ? `font-bold ${theme === "dark" ? "bg-gray-600" : "bg-gray-200"}` : ''}
                      >
                        <td className="border border-gray-300 p-2 text-xs font-mono">
                          {row.hsn || "NA"}
                        </td>
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
                        <td className="border border-gray-300 p-2 text-xs text-center">{rate}%</td>
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HSNSummaryB2C;



