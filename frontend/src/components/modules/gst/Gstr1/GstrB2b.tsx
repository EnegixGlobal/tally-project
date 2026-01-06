import { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Filter, Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

const Gstr2B2b = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [saleData, setSaleData] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [matchedSales, setMatchedSales] = useState<any[]>([]);

  const [filters, setFilters] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const loadSalesVouchers = async () => {
      setLoading(true);
      try {
        const url = `${
          import.meta.env.VITE_API_URL
        }/api/sales-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

        const res = await fetch(url);
        const json = await res.json();
        console.log("salesvoucher", json);
        const vouchers = json?.data || json || [];

        // Filter by date range if provided
        let filteredVouchers = vouchers;
        if (filters.fromDate && filters.toDate) {
          filteredVouchers = vouchers.filter((v: any) => {
            const voucherDate = new Date(v.date);
            const fromDate = new Date(filters.fromDate);
            const toDate = new Date(filters.toDate);
            return voucherDate >= fromDate && voucherDate <= toDate;
          });
        }

        setSaleData(filteredVouchers);
      } catch (err) {
        console.error("Failed to fetch sales vouchers:", err);
        setSaleData([]);
      } finally {
        setLoading(false);
      }
    };

    loadSalesVouchers();
  }, [companyId, ownerType, ownerId, filters.fromDate, filters.toDate]);

  // ledger get
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const ledgerRes = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const ledgerData = await ledgerRes.json();
        console.log("ledgerdata", ledgerData);
        setLedger(ledgerData || []);
      } catch (err) {
        console.error("Ledger fetch failed:", err);
        setLedger([]);
      }
    };

    fetchLedger();
  }, [companyId, ownerType, ownerId]);

  useEffect(() => {
    if (!ledger.length || !saleData.length) return;

    // sirf GST wale ledgers
    const gstLedgers = ledger.filter(
      (l) => l.gstNumber && String(l.gstNumber).trim() !== ""
    );

    // UI ke liye sales ko ledger se attach kar rahe
    const uiSales = saleData
      .map((s) => {
        const l = gstLedgers.find((gl) => gl.id === s.partyId);
        if (!l) return null;

        return {
          ...s,
          ledger: l,
        };
      })
      .filter(Boolean);

    setMatchedSales(uiSales);
  }, [ledger, saleData]);

  //gst rate calculate function
  const getTaxRate = (taxAmount: any, taxableAmount: any) => {
    const tax = Number(taxAmount || 0);
    const base = Number(taxableAmount || 0);

    if (!base || !tax) return 0;

    const rate = (tax / base) * 100;
    return Math.round(rate);
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

  const totals = useMemo(() => {
    return matchedSales.reduce(
      (acc, item) => ({
        taxableValue: acc.taxableValue + (Number(item.subtotal) || 0),
        igstAmount: acc.igstAmount + (Number(item.igstTotal) || 0),
        cgstAmount: acc.cgstAmount + (Number(item.cgstTotal) || 0),
        sgstAmount: acc.sgstAmount + (Number(item.sgstTotal) || 0),
        cessAmount: 0,
      }),
      {
        taxableValue: 0,
        igstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        cessAmount: 0,
      }
    );
  }, [matchedSales]);

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    const b2bDataForExcel = matchedSales.map((row: any) => {
      const ledger = row.ledger;
      return {
        "GSTIN of Recipient": ledger?.gstNumber || "-",
        "Receiver Name": ledger?.name || "-",
        "Invoice Number": row.number,
        "Invoice Date": formatDate(row.date),
        "Invoice Value": Number(row.total) || 0,
        "Place of Supply": ledger?.state || "-",
        "Reverse Charge": "N",
        "Invoice Type": "Regular",
        "E-Commerce GSTIN": "",
        "Taxable Value": Number(row.subtotal) || 0,
        "IGST Rate": `${getTaxRate(row.igstTotal, row.subtotal)}%`,
        "IGST Amount": Number(row.igstTotal) || 0,
        "CGST Rate": `${getTaxRate(row.cgstTotal, row.subtotal)}%`,
        "CGST Amount": Number(row.cgstTotal) || 0,
        "SGST Rate": `${getTaxRate(row.sgstTotal, row.subtotal)}%`,
        "SGST Amount": Number(row.sgstTotal) || 0,
        "Cess Rate": "0%",
        "Cess Amount": 0,
      };
    });

    const ws = XLSX.utils.json_to_sheet(b2bDataForExcel);
    XLSX.utils.book_append_sheet(wb, ws, "B2B Supplies");

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
      `B2B_${filters.fromDate}_to_${filters.toDate}.xlsx`
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
        <h1 className="text-2xl font-bold">4A - B2B Supplies</h1>
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
                onClick={() => {
                  // Data will reload automatically via useEffect
                }}
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
          <h3 className="text-lg font-bold">4A - B2B Supplies</h3>
          <p className="text-sm opacity-90">
            Details of Outward Supplies made to Registered Persons
          </p>
        </div>

        {/* B2B Table */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : matchedSales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No B2B Supplies data available</p>
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
                      GSTIN of Recipient
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Receiver Name
                    </th>
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
                      Reverse Charge
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Invoice Type
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      E-Commerce GSTIN
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
                  {matchedSales.map((row: any, index: number) => {
                    const ledger = row.ledger;

                    return (
                      <tr
                        key={index}
                        className={`${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <td className="border border-gray-300 p-2 text-xs font-mono">
                          {ledger?.gstNumber || "-"}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs">
                          {ledger?.name || "-"}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs font-mono">
                          {row.number}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs">
                          {formatDate(row.date)}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹{Number(row.total || 0).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs">
                          {ledger?.state || "-"}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-center">
                          N
                        </td>
                        <td className="border border-gray-300 p-2 text-xs">
                          Regular
                        </td>
                        <td className="border border-gray-300 p-2 text-xs font-mono">
                          -
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹{Number(row.subtotal || 0).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-center">
                          {getTaxRate(row.igstTotal, row.subtotal)}%
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹{Number(row.igstTotal || 0).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-center">
                          {getTaxRate(row.cgstTotal, row.subtotal)}%
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹{Number(row.cgstTotal || 0).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-center">
                          {getTaxRate(row.sgstTotal, row.subtotal)}%
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹{Number(row.sgstTotal || 0).toLocaleString()}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-center">
                          0%
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹0
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total Row */}
                  {matchedSales.length > 0 && (
                    <tr
                      className={`font-bold ${
                        theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                      }`}
                    >
                      <td
                        colSpan={9}
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

export default Gstr2B2b;
