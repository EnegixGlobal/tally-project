import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Download, Printer, FileJson } from "lucide-react";
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
  const [downloadLoading, setDownloadLoading] = useState(false);
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

  const generateFullJSON = (dataToExport?: B2CSSupply[], fromDate?: string, toDate?: string) => {
    const list = dataToExport || b2csData;
    if (list.length === 0) return;

    const fDate = fromDate || filters.fromDate;
    const tDate = toDate || filters.toDate;

    const payload = {
      type: "GSTR-1",
      section: "B2C Small Cumulative",
      period: {
        from: fDate,
        to: tDate,
      },
      data: list.map((supply) => {
        const totalTax = Number(supply.igstAmount || 0) + Number(supply.cgstAmount || 0) + Number(supply.sgstAmount || 0);
        const taxRate = supply.taxableValue ? Math.round((totalTax / supply.taxableValue) * 100) : 0;
        return {
          type: "OE",
          placeOfSupply: supply.placeOfSupply,
          taxRate: taxRate,
          rate: taxRate,
          taxableValue: supply.taxableValue,
          cessAmount: supply.cessAmount,
          ecommerceGstin: "-",
        };
      }),
      totals: {
        taxableValue: list.reduce((acc, row) => acc + (Number(row.taxableValue) || 0), 0),
        igst: list.reduce((acc, row) => acc + (Number(row.igstAmount) || 0), 0),
        cgst: list.reduce((acc, row) => acc + (Number(row.cgstAmount) || 0), 0),
        sgst: list.reduce((acc, row) => acc + (Number(row.sgstAmount) || 0), 0),
        cess: list.reduce((acc, row) => acc + (Number(row.cessAmount) || 0), 0),
      },
      generatedAt: new Date().toISOString(),
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `B2CS_Report_${fDate}_to_${tDate}.json`;

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
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/b2c-small?${params}`
      );

      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();

      if (!data || data.length === 0) {
        alert(`No B2C Small data found for ${monthNames[monthIndex]} ${actualYear}`);
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
        <h1 className="text-2xl font-bold">5B - B2C Small Supplies</h1>
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
                onClick={fetchB2CSData}
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
        {/* Section Header */}
        <div
          className={`p-3 border-b-2 ${theme === "dark"
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
                    className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Type
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Place of Supply
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Tax Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Taxable Value
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Cess Amount
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      E-Commerce GSTIN
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {b2csData.map((supply, index) => {
                    const totalTax = Number(supply.igstAmount || 0) + Number(supply.cgstAmount || 0) + Number(supply.sgstAmount || 0);
                    const taxRate = supply.taxableValue ? Math.round((totalTax / supply.taxableValue) * 100) : 0;
                    return (
                      <tr
                        key={supply.voucherId || index}
                        className={`${theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50"
                          }`}
                      >
                        <td className="border border-gray-300 p-2 text-xs">OE</td>
                        <td className="border border-gray-300 p-2 text-xs">
                          {formatPlaceOfSupply(supply.placeOfSupply)}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-center"></td>
                        <td className="border border-gray-300 p-2 text-xs text-center">{taxRate}%</td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹{supply.taxableValue?.toLocaleString() || "0"}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹{supply.cessAmount?.toLocaleString() || "0"}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs font-mono"></td>
                      </tr>
                    );
                  })}
                  {b2csData.length > 0 && (
                    <tr
                      className={`font-bold ${theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                        }`}
                    >
                      <td
                        colSpan={4}
                        className="border border-gray-300 p-2 text-xs text-right"
                      >
                        Total:
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{totals.taxableValue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{totals.cessAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs"></td>
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


