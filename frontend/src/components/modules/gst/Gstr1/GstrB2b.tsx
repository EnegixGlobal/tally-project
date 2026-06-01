import { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../../../context/AppContext";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Filter, Download, Printer } from "lucide-react";
import * as XLSX from "xlsx";

const Gstr2B2b = () => {
  const { theme, companyInfo } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [saleData, setSaleData] = useState<any[]>([]);
  const [allSales, setAllSales] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [matchedSales, setMatchedSales] = useState<any[]>([]);
  const [companyDetails, setCompanyDetails] = useState<any>(null);

  useEffect(() => {
    if (!companyId) return;
    const fetchCompanyDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/company/company/${companyId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data) {
          setCompanyDetails(data);
        }
      } catch (err) {
        console.error("Failed to fetch company details:", err);
      }
    };
    fetchCompanyDetails();
  }, [companyId]);

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
    if (!companyId || !ownerType || !ownerId) return;

    const loadSalesVouchers = async () => {
      setLoading(true);
      try {
        const url = `${import.meta.env.VITE_API_URL
          }/api/sales-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

        const res = await fetch(url);
        const json = await res.json();
        console.log("salesvoucher", json);
        const vouchers = json?.data || json || [];
        setAllSales(vouchers);

        // Filter by date range if provided
        let filteredVouchers = vouchers;
        if (filters.fromDate && filters.toDate) {
          filteredVouchers = vouchers.filter((v: any) => {
            if (!v.date) return false;
            const d = new Date(v.date);
            if (isNaN(d.getTime())) return false;
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const voucherDateStr = `${year}-${month}-${day}`;
            return (
              voucherDateStr >= filters.fromDate && voucherDateStr <= filters.toDate
            );
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
          `${import.meta.env.VITE_API_URL
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
    if (!ledger.length) return;
    if (!saleData.length) {
      setMatchedSales([]);
      return;
    }

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
      }),
      {
        taxableValue: 0,
        igstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
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
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    XLSX.writeFile(
      wb,
      `B2B_${filters.fromDate}_to_${filters.toDate}.xlsx`
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

  const generateFullJSON = (dataToExport?: any[], fromDate?: string, toDate?: string) => {
    const list = dataToExport || matchedSales;
    if (list.length === 0) return;

    const fDate = fromDate || filters.fromDate;
    const tDate = toDate || filters.toDate;

    // Retrieve taxpayer GSTIN
    const companyInfoStr = localStorage.getItem("companyInfo");
    const companyInfoObj = companyInfoStr ? JSON.parse(companyInfoStr) : null;
    const taxpayerGstin =
      companyDetails?.gstNumber ||
      companyDetails?.gst_number ||
      companyInfo?.gstNumber ||
      companyInfo?.gst_number ||
      companyInfoObj?.gstNumber ||
      companyInfoObj?.gst_number ||
      "";

    // Format FP (Financial Period MMYYYY)
    let fp = "";
    if (fDate && fDate !== "2000-01-01") {
      const d = new Date(fDate);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = String(d.getFullYear());
      fp = `${mm}${yyyy}`;
    } else {
      const dates = list.map(item => item.date).filter(Boolean);
      const latestDateStr = dates.length > 0 ? dates.reduce((max, d) => d > max ? d : max) : null;
      const fpDate = latestDateStr ? new Date(latestDateStr) : new Date();
      const mm = String(fpDate.getMonth() + 1).padStart(2, "0");
      const yyyy = String(fpDate.getFullYear());
      fp = `${mm}${yyyy}`;
    }

    // Helper to format date to DD-MM-YYYY
    const formatInvoiceDate = (dateStr: string) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}-${mm}-${yyyy}`;
    };

    // Helper to parse State Code from Place of Supply string (e.g. "Jharkhand(20)" -> "20")
    const parsePos = (posStr: string) => {
      if (!posStr) return "";
      const match = posStr.match(/\((\d+)\)/);
      if (match) return match[1];
      const matchDigits = posStr.match(/\b\d{2}\b/);
      if (matchDigits) return matchDigits[0];
      const match2 = posStr.match(/(\d+)/);
      if (match2) return match2[1];
      return posStr;
    };

    // Group by CTIN (Customer GSTIN)
    const groupedB2bMap: { [ctin: string]: any[] } = {};
    list.forEach((row: any) => {
      const ledger = row.ledger;
      const ctin = (ledger?.gstNumber || "").trim();
      if (!ctin) return;

      if (!groupedB2bMap[ctin]) {
        groupedB2bMap[ctin] = [];
      }
      groupedB2bMap[ctin].push(row);
    });

    const b2bList = Object.keys(groupedB2bMap).map((ctin) => {
      const rows = groupedB2bMap[ctin];
      const invList = rows.map((row) => {
        const rt = getTaxRate(
          Number(row.igstTotal || 0) + Number(row.cgstTotal || 0) + Number(row.sgstTotal || 0),
          row.subtotal
        );
        const numValue = Math.round(rt * 100) + 1;

        const itm_det: any = {
          txval: Number(row.subtotal || 0),
          rt: rt
        };

        const igstVal = Number(row.igstTotal || 0);
        const cgstVal = Number(row.cgstTotal || 0);
        const sgstVal = Number(row.sgstTotal || 0);

        if (igstVal > 0) {
          itm_det.iamt = igstVal;
        }
        if (cgstVal > 0 || igstVal === 0) {
          itm_det.camt = cgstVal;
        }
        if (sgstVal > 0 || igstVal === 0) {
          itm_det.samt = sgstVal;
        }
        itm_det.csamt = 0;

        return {
          inum: String(row.number || ""),
          idt: formatInvoiceDate(row.date),
          val: Number(row.total || 0),
          pos: parsePos(row.ledger?.state || ""),
          rchrg: "N",
          inv_typ: "R",
          itms: [
            {
              num: numValue,
              itm_det: itm_det
            }
          ]
        };
      });

      return {
        ctin: ctin,
        inv: invList
      };
    });

    const payload = {
      gstin: taxpayerGstin,
      fp: fp,
      version: "GST3.2.4",
      hash: "hash",
      b2b: b2bList
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    setPreviewJson(jsonStr);
    setPendingFilename(`B2B_Report_${fDate}_to_${tDate}.json`);
  };

  const handleMonthDownload = (monthIndex: number) => {
    // Current FY start year
    const startYear = new Date(filters.fromDate).getFullYear();
    const isNextYear = monthIndex < 3; // Jan, Feb, Mar are index 0, 1, 2
    const actualYear = isNextYear ? startYear + 1 : startYear;

    // Adjust monthIndex for FY: April is 3, Jan is 0
    // FY Months sequence: April(3), May(4)... Dec(11), Jan(0), Feb(1), Mar(2)
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const startDate = new Date(actualYear, monthIndex, 1);
    const endDate = new Date(actualYear, monthIndex + 1, 0);

    const fromStr = `${actualYear}-${String(monthIndex + 1).padStart(2, "0")}-01`;
    const toStr = `${actualYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

    // Filter allSales for this month and only GST-enabled ledgers
    const monthSales = allSales.filter((s: any) => {
      if (!s.date) return false;
      const d = new Date(s.date);
      if (isNaN(d.getTime())) return false;
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const voucherDateStr = `${year}-${month}-${day}`;
      return voucherDateStr >= fromStr && voucherDateStr <= toStr;
    });

    const monthB2B = monthSales.map((s) => {
      const l = ledger.find((gl) => gl.id === s.partyId && gl.gstNumber);
      return l ? { ...s, ledger: l } : null;
    }).filter(Boolean);

    if (monthB2B.length === 0) {
      alert(`No B2B data found for ${monthNames[monthIndex]} ${actualYear}`);
      return;
    }

    generateFullJSON(monthB2B, fromStr, toStr);
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
        <h1 className="text-2xl font-bold">4A - B2B Supplies</h1>
        <div className="ml-auto flex space-x-2">
          <div className="flex items-center no-print mr-2">
            <select
              title="Download JSON by Month"
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
            onClick={generateFullJSON}
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
                    className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
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
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Application of Tax Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Invoice Type
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      E-Commerce GSTIN
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
                  </tr>
                </thead>
                <tbody>
                  {matchedSales.map((row: any, index: number) => {
                    const ledger = row.ledger;
                    const taxRate = getTaxRate(Number(row.igstTotal || 0) + Number(row.cgstTotal || 0) + Number(row.sgstTotal || 0), row.subtotal);
                    return (
                      <tr
                        key={index}
                        className={`${theme === "dark"
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
                        <td className="border border-gray-300 p-2 text-xs text-center">
                          {/* {taxRate}% */}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs">
                          Regular
                        </td>
                        <td className="border border-gray-300 p-2 text-xs font-mono">
                          {/* - */}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-center">
                          {taxRate}%
                        </td>
                        <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                          ₹{Number(row.subtotal || 0).toLocaleString()}
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
                      className={`font-bold ${theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                        }`}
                    >
                      <td
                        colSpan={11}
                        className="border border-gray-300 p-2 text-xs text-right"
                      >
                        Total:
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹{totals.taxableValue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        ₹0
                      </td>
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
                Review the generated GSTR-1 B2B Supplies JSON before downloading. Click "Download" to save the file.
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

export default Gstr2B2b;
