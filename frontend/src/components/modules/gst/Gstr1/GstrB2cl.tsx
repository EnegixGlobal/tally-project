import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Filter, Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

interface B2CLSupply {
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

const GstrB2cl = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [b2clData, setB2clData] = useState<B2CLSupply[]>([]);
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [filters, setFilters] = useState(() => {
    if (location.state?.fromDate && location.state?.toDate) {
      return {
        fromDate: location.state.fromDate,
        toDate: location.state.toDate,
      };
    }
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const mm = String(m + 1).padStart(2, "0");
    return {
      fromDate: `${y}-${mm}-01`,
      toDate: `${y}-${mm}-${String(lastDay).padStart(2, "0")}`,
    };
  });

  useEffect(() => {
    if (companyId && ownerType && ownerId) {
      fetchB2CLData();
    }
  }, [companyId, ownerType, ownerId, filters.fromDate, filters.toDate]);

  const fetchB2CLData = async () => {
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
        `${import.meta.env.VITE_API_URL}/api/b2cl?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch B2CL data");
      }

      const data = await response.json();
      console.log(data);
      setB2clData(data || []);
    } catch (error) {
      console.error("Error fetching B2CL data:", error);
      setB2clData([]);
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
    // If it's already in format "27-Maharashtra", return as is
    if (pos.includes("-")) return pos;
    // Otherwise, try to format it
    return pos;
  };

  const totals = useMemo(() => {
    return b2clData.reduce(
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
  }, [b2clData]);

  const exportToExcel = () => {

    const wb = XLSX.utils.book_new();

    const b2clDataForExcel = b2clData.map((supply) => ({
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

    const ws = XLSX.utils.json_to_sheet(b2clDataForExcel);
    XLSX.utils.book_append_sheet(wb, ws, "B2C Large Supplies");

    // Summary sheet
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
      `B2CL_${filters.fromDate}_to_${filters.toDate}.xlsx`
    );
  };

  const downloadJsonFile = (jsonContent: string, filename: string) => {
    const blob = new Blob([jsonContent], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateFullJSON = (dataToExport?: B2CLSupply[], fromDate?: string, toDate?: string) => {
    const list = dataToExport || b2clData;
    if (list.length === 0) return;

    const fDate = fromDate || filters.fromDate;
    const tDate = toDate || filters.toDate;

    const payload = {
      type: "GSTR-1",
      section: "B2C Large Cumulative",
      period: {
        from: fDate,
        to: tDate,
      },
      data: list.map((supply) => {
        const totalTax = Number(supply.igstAmount || 0) + Number(supply.cgstAmount || 0) + Number(supply.sgstAmount || 0);
        const taxRate = supply.taxableValue ? Math.round((totalTax / supply.taxableValue) * 100) : 0;
        return {
          invoiceNumber: supply.invoiceNumber,
          invoiceDate: supply.invoiceDate,
          invoiceValue: supply.invoiceValue,
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
    setPreviewJson(jsonStr);
    setPendingFilename(`B2CL_Report_${fDate}_to_${tDate}.json`);
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

      const fromStr = `${actualYear}-${String(monthIndex + 1).padStart(2, "0")}-01`;
      const toStr = `${actualYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

      const params = new URLSearchParams({
        company_id: companyId,
        owner_type: ownerType,
        owner_id: ownerId,
        fromDate: fromStr,
        toDate: toStr,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/b2cl?${params}`
      );

      if (!response.ok) throw new Error("Failed to fetch data");
      const data = await response.json();

      if (!data || data.length === 0) {
        alert(`No B2C Large data found for ${monthNames[monthIndex]} ${actualYear}`);
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

  const getActivePeriodLabel = () => {
    if (filters.fromDate === "2000-01-01" && filters.toDate === "2099-12-31") {
      return "All Months (Cumulative Total)";
    }
    if (!filters.fromDate) return "-";
    const parts = filters.fromDate.split("-");
    if (parts.length === 3) {
      return `Selected Month: ${parts[1]}/${parts[0]}`;
    }
    const d = new Date(filters.fromDate);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `Selected Month: ${mm}/${d.getFullYear()}`;
  };

  const getActiveYear = () => {
    if (filters.fromDate && filters.fromDate !== "2000-01-01") {
      const parts = filters.fromDate.split("-");
      if (parts.length === 3) return parts[0];
    }
    return String(new Date().getFullYear());
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
        <h1 className="text-2xl font-bold">5A - B2C Large Supplies</h1>
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

      {/* Quick Filter Bar */}
      <div
        className={`p-4 mb-6 rounded-lg flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 no-print ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-700 text-white"
            : "bg-white shadow border border-gray-200 text-gray-800"
        }`}
      >
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Active Return Period Filter
          </span>
          <span className="text-lg font-bold">
            {getActivePeriodLabel()}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFilters({
                fromDate: "2000-01-01",
                toDate: "2099-12-31"
              });
            }}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${
              filters.fromDate === "2000-01-01" && filters.toDate === "2099-12-31"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            All Months (Total)
          </button>
          
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />

          {[
            { label: "Jan", val: "01" },
            { label: "Feb", val: "02" },
            { label: "Mar", val: "03" },
            { label: "Apr", val: "04" },
            { label: "May", val: "05" },
            { label: "Jun", val: "06" },
            { label: "Jul", val: "07" },
            { label: "Aug", val: "08" },
            { label: "Sep", val: "09" },
            { label: "Oct", val: "10" },
            { label: "Nov", val: "11" },
            { label: "Dec", val: "12" },
          ].map((m) => {
            const yearStr = getActiveYear();
            const startStr = `${yearStr}-${m.val}-01`;
            const lastDay = new Date(parseInt(yearStr, 10), parseInt(m.val, 10), 0).getDate();
            const endStr = `${yearStr}-${m.val}-${String(lastDay).padStart(2, "0")}`;
            const isActive = filters.fromDate === startStr && filters.toDate === endStr;

            return (
              <button
                key={m.val}
                type="button"
                onClick={() => {
                  setFilters({
                    fromDate: startStr,
                    toDate: endStr,
                  });
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                }`}
              >
                {m.label}
              </button>
            );
          })}
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
                onClick={() => {
                  fetchB2CLData();
                  setShowFilterPanel(false);
                }}
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
          <h3 className="text-lg font-bold">5A - B2C Large Supplies</h3>
          <p className="text-sm opacity-90">
            Details of Outward Supplies made to Unregistered Persons (Invoice
            value &gt; ₹2.5 lakh)
          </p>
        </div>

        {/* B2C Large Table */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : b2clData.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No B2C Large Supplies data available</p>
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
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Application of Tax Rate
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
                  {b2clData.map((supply, index) => {
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
                  {/* Total Row */}
                  {b2clData.length > 0 && (
                    <tr
                      className={`font-bold ${theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                        }`}
                    >
                      <td
                        colSpan={6}
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

      {previewJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print animate-fadeIn">
          <div
            className={`w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden border transition-all transform scale-100 ${
              theme === "dark"
                ? "bg-gray-800 border-gray-700 text-white"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-blue-600 text-white">
              <span className="font-bold text-lg">JSON Preview ({pendingFilename})</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(previewJson);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 2000);
                }}
                className="text-xs px-2.5 py-1.5 bg-white/20 hover:bg-white/30 rounded font-medium transition-all"
              >
                {copySuccess ? "Copied!" : "Copy to Clipboard"}
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Review the generated GSTR-1 B2C Large Supplies JSON before downloading. Click "Download" to save the file.
              </p>
              <div className="relative">
                <pre
                  className="max-h-[50vh] overflow-auto font-mono text-[11px] p-4 bg-gray-900 text-green-400 rounded-lg border border-gray-700 leading-relaxed tab-size-2 scrollbar-thin scrollbar-thumb-gray-700"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}
                >
                  {previewJson}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button
                type="button"
                onClick={() => {
                  setPreviewJson(null);
                  setPendingFilename("");
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  theme === "dark"
                    ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-100"
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  downloadJsonFile(previewJson, pendingFilename);
                  setPreviewJson(null);
                  setPendingFilename("");
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all"
              >
                Download JSON
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GstrB2cl;
