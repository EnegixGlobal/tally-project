import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Filter,
  Upload,
  FileText,
} from "lucide-react";

import * as XLSX from "xlsx";

const GSTR1: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [previewJson, setPreviewJson] = useState<string | null>(null);
  const [pendingFilename, setPendingFilename] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const now = new Date();
    return {
      month: String(now.getMonth() + 1).padStart(2, "0"),
      year: String(now.getFullYear()),
    };
  });

  // get company infomatiion
  const companyDataStr = localStorage.getItem("companyInfo");

  const companyData = companyDataStr ? JSON.parse(companyDataStr) : null;

  // Form data state matching the screenshot structure
  // Form data state
  const [formData, setFormData] = useState({
    gstin: companyData?.gst_number || "",
    legalName: companyData?.name || "",
    tradeName: companyData?.name || "",
    returnPeriod: `${selectedPeriod.month}/${selectedPeriod.year}`,
    dateOfFiling: "",

    b2bSupplies: [],
    b2cLargeSupplies: [],
  });

  // Simple print functionality - no complex dependencies needed

  // DRY Utility Functions
  const calculateTotals = () => {
    const data = processedData;

    // Helper to sum a field across a supply list
    const sumField = (list: any[], field: string) =>
      list.reduce((acc, item) => acc + Number(item[field] || 0), 0);

    const b2b = {
      taxableValue: sumField(data.b2b, 'taxableValue'),
      igstAmount: sumField(data.b2b, 'igstAmount'),
      cgstAmount: sumField(data.b2b, 'cgstAmount'),
      sgstAmount: sumField(data.b2b, 'sgstAmount'),
      cessAmount: sumField(data.b2b, 'cessAmount'),
    };

    const b2cLarge = {
      taxableValue: sumField(data.b2cLarge, 'taxableValue'),
      igstAmount: sumField(data.b2cLarge, 'igstAmount'),
      cgstAmount: sumField(data.b2cLarge, 'cgstAmount'),
      sgstAmount: sumField(data.b2cLarge, 'sgstAmount'),
      cessAmount: sumField(data.b2cLarge, 'cessAmount'),
    };

    const b2cSmall = {
      taxableValue: sumField(data.b2cSmall, 'taxableValue'),
      igstAmount: sumField(data.b2cSmall, 'igstAmount'),
      cgstAmount: sumField(data.b2cSmall, 'cgstAmount'),
      sgstAmount: sumField(data.b2cSmall, 'sgstAmount'),
      cessAmount: sumField(data.b2cSmall, 'cessAmount'),
    };

    return {
      totalTaxableValue: b2b.taxableValue + b2cLarge.taxableValue + b2cSmall.taxableValue,
      totalIgst: b2b.igstAmount + b2cLarge.igstAmount + b2cSmall.igstAmount,
      totalCgst: b2b.cgstAmount + b2cLarge.cgstAmount + b2cSmall.cgstAmount,
      totalSgst: b2b.sgstAmount + b2cLarge.sgstAmount + b2cSmall.sgstAmount,
      totalCess: b2b.cessAmount + b2cLarge.cessAmount + b2cSmall.cessAmount,
    };
  };

  const generateGSTR1JSON = () => {
    const data = processedData;
    const totals = calculateTotals();

    const gstr1Data = {
      gstin: formData.gstin,
      ret_period: selectedPeriod.month + selectedPeriod.year,
      b2b: data.b2b.map((supply: any) => ({
        ctin: supply.gstin,
        inv: [
          {
            inum: supply.invoiceNumber,
            idt: supply.invoiceDate,
            val: supply.invoiceValue,
            pos: (supply.placeOfSupply || "").split("-")[0],
            rchrg: supply.reverseCharge,
            inv_typ: "R",
            itms: [
              {
                num: 1,
                itm_det: {
                  txval: supply.taxableValue,
                  rt: supply.igstRate || (supply.cgstRate + supply.sgstRate),
                  iamt: supply.igstAmount,
                  camt: supply.cgstAmount,
                  samt: supply.sgstAmount,
                  csamt: supply.cessAmount,
                },
              },
            ],
          },
        ],
      })),
      b2cl: data.b2cLarge.map((supply: any) => ({
        inv: [
          {
            inum: supply.invoiceNumber,
            idt: supply.invoiceDate,
            val: supply.invoiceValue,
            pos: (supply.placeOfSupply || "").split("-")[0],
            itms: [
              {
                num: 1,
                itm_det: {
                  txval: supply.taxableValue,
                  rt: supply.igstRate || (supply.cgstRate + supply.sgstRate),
                  iamt: supply.igstAmount,
                  camt: supply.cgstAmount,
                  samt: supply.sgstAmount,
                  csamt: supply.cessAmount,
                },
              },
            ],
          },
        ],
      })),
      hsn: {
        data: data.hsn.map((h: any, idx: number) => ({
          num: idx + 1,
          hsn_sc: h.hsn,
          desc: h.description,
          uqc: h.uqc,
          qty: h.qty,
          val: h.val,
          txval: h.txval,
          iamt: h.iamt,
          camt: h.camt,
          samt: h.samt,
          csamt: h.csamt,
        })),
      },
      doc_issue: {
        doc_det: [
          {
            doc_num: 1,
            docs: [
              {
                num: 1,
                from: data.docs.from,
                to: data.docs.to,
                totnum: data.docs.total,
                cancel: data.docs.cancel,
                net_issue: data.docs.total - data.docs.cancel,
              },
            ],
          },
        ],
      },
    };

    const jsonString = JSON.stringify(gstr1Data, null, 2);
    setPreviewJson(jsonString);
    setPendingFilename(`GSTR1_${formData.gstin}_${selectedPeriod.month}${selectedPeriod.year}.json`);
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

  const exportToExcel = () => {
    const data = processedData;
    const totals = calculateTotals();

    // Create workbook
    const wb = XLSX.utils.book_new();

    // B2B Supplies Sheet
    const b2bData = data.b2b.map((supply: any) => ({
      "GSTIN of Recipient": supply.gstin,
      "Receiver Name": supply.receiverName,
      "Invoice Number": supply.invoiceNumber,
      "Invoice Date": supply.invoiceDate,
      "Invoice Value": supply.invoiceValue,
      "Place of Supply": supply.placeOfSupply,
      "Reverse Charge": supply.reverseCharge,
      "Invoice Type": supply.invoiceType,
      "E-Commerce GSTIN": supply.ecommerceGstin,
      "Taxable Value": supply.taxableValue,
      "IGST Rate": supply.igstRate + "%",
      "IGST Amount": supply.igstAmount,
      "CGST Rate": supply.cgstRate + "%",
      "CGST Amount": supply.cgstAmount,
      "SGST Rate": supply.sgstRate + "%",
      "SGST Amount": supply.sgstAmount,
      "Cess Rate": supply.cessRate + "%",
      "Cess Amount": supply.cessAmount,
    }));
    const b2bWs = XLSX.utils.json_to_sheet(b2bData);
    XLSX.utils.book_append_sheet(wb, b2bWs, "B2B Supplies");

    // B2C Large Supplies Sheet
    const b2cData = data.b2cLarge.map((supply: any) => ({
      "Invoice Number": supply.invoiceNumber,
      "Invoice Date": supply.invoiceDate,
      "Invoice Value": supply.invoiceValue,
      "Place of Supply": supply.placeOfSupply,
      "Taxable Value": supply.taxableValue,
      "IGST Rate": supply.igstRate + "%",
      "IGST Amount": supply.igstAmount,
      "CGST Rate": supply.cgstRate + "%",
      "CGST Amount": supply.cgstAmount,
      "SGST Rate": supply.sgstRate + "%",
      "SGST Amount": supply.sgstAmount,
      "Cess Rate": supply.cessRate + "%",
      "Cess Amount": supply.cessAmount,
    }));
    const b2cWs = XLSX.utils.json_to_sheet(b2cData);
    XLSX.utils.book_append_sheet(wb, b2cWs, "B2C Large Supplies");

    // HSN Summary Sheet
    const hsnExcelData = data.hsn.map((h: any) => ({
      HSN: h.hsn,
      Description: h.description,
      UQC: h.uqc,
      "Total Quantity": h.qty,
      "Total Value": h.val,
      "Taxable Value": h.txval,
      "IGST Amount": h.iamt,
      "CGST Amount": h.camt,
      "SGST Amount": h.samt,
      "Cess Amount": h.csamt,
    }));
    const hsnWs = XLSX.utils.json_to_sheet(hsnExcelData);
    XLSX.utils.book_append_sheet(wb, hsnWs, "HSN Summary");

    // Summary Sheet
    const summaryData = [
      {
        Description: "Total Taxable Value",
        Amount: totals.totalTaxableValue,
      },
      {
        Description: "Total IGST",
        Amount: totals.totalIgst,
      },
      {
        Description: "Total CGST",
        Amount: totals.totalCgst,
      },
      {
        Description: "Total SGST",
        Amount: totals.totalSgst,
      },
      {
        Description: "Total Cess",
        Amount: totals.totalCess,
      },
      {
        Description: "Total Tax Amount",
        Amount:
          totals.totalIgst +
          totals.totalCgst +
          totals.totalSgst +
          totals.totalCess,
      },
      {
        Description: "Total Invoice Value",
        Amount:
          totals.totalTaxableValue +
          totals.totalIgst +
          totals.totalCgst +
          totals.totalSgst +
          totals.totalCess,
      },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    // Save file
    XLSX.writeFile(
      wb,
      `GSTR1_${formData.gstin}_${selectedPeriod.month}${selectedPeriod.year}.xlsx`
    );
  };

  // DRY Button Component
  const ActionButton = ({
    onClick,
    icon: Icon,
    text,
    colorClass = "bg-blue-600 hover:bg-blue-700",
  }: {
    onClick: () => void;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    text: string;
    colorClass?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center px-6 py-3 rounded-lg font-medium text-white ${colorClass} ${theme === "dark" ? colorClass : colorClass
        }`}
    >
      <Icon className="mr-2" size={18} />
      {text}
    </button>
  );

  // my logic
  // ================= COMPANY STATE =================
  const companyInfoStr = localStorage.getItem("companyInfo");
  const companyState = companyInfoStr ? JSON.parse(companyInfoStr).state : "";
  const companyStateCode = companyState.match(/\((\d+)\)/)?.[1] || "";

  // ================= AUTH =================
  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  // ================= STATE =================
  const [loading, setLoading] = useState(false);
  const [saleData, setSaleData] = useState<any[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);

  // ================= DATE FILTER =================
  const [filters, setFilters] = useState(() => {
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

  const handleApplyFilter = () => {
    const year = parseInt(selectedPeriod.year, 10);
    const month = parseInt(selectedPeriod.month, 10) - 1; // 0-indexed
    const toDate = new Date(year, month + 1, 0); // Last day of month
    
    const yStr = String(year);
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(toDate.getDate()).padStart(2, "0");

    setFilters({
      fromDate: `${yStr}-${mStr}-01`,
      toDate: `${yStr}-${mStr}-${dStr}`,
    });

    setFormData((prev) => ({
      ...prev,
      returnPeriod: `${selectedPeriod.month}/${selectedPeriod.year}`,
    }));

    setShowFilterPanel(false);
  };

  // ================= SALES FETCH =================
  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const loadSalesVouchers = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/sales-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const json = await res.json();
        const vouchers = json?.data || json || [];

        let filtered = vouchers;
        if (filters.fromDate && filters.toDate) {
          filtered = vouchers.filter((v: any) => {
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

        setSaleData(filtered);
      } catch (err) {
        console.error("Sales fetch failed:", err);
        setSaleData([]);
      } finally {
        setLoading(false);
      }
    };

    loadSalesVouchers();
  }, [companyId, ownerType, ownerId, filters.fromDate, filters.toDate]);

  // ================= LEDGER FETCH =================
  useEffect(() => {
    const fetchLedger = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setLedger(data || []);
      } catch (err) {
        console.error("Ledger fetch failed:", err);
        setLedger([]);
      }
    };

    fetchLedger();
  }, [companyId, ownerType, ownerId]);

  // ================= FINAL BUCKETS =================
  const [gstInterState, setGstInterState] = useState<any[]>([]);
  const [gstIntraState, setGstIntraState] = useState<any[]>([]);
  const [nonGstInterState, setNonGstInterState] = useState<any[]>([]);
  const [nonGstIntraState, setNonGstIntraState] = useState<any[]>([]);

  // ✅ Allowed ledger names only
  const allowedLedgerNames = ["Nil Rated", "Non-gst", "Exempted"];

  // ================= MAIN LOGIC =================
  useEffect(() => {
    if (!ledger.length || !companyStateCode) return;
    if (!saleData.length) {
      setGstInterState([]);
      setGstIntraState([]);
      setNonGstInterState([]);
      setNonGstIntraState([]);
      return;
    }

    const gstInter: any[] = [];
    const gstIntra: any[] = [];
    const nonGstInter: any[] = [];
    const nonGstIntra: any[] = [];

    saleData.forEach((sale) => {
      const l = ledger.find((lg) => lg.id === sale.partyId);
      if (!l) return;

      // ✅ only allowed ledgers
      if (!allowedLedgerNames.includes(String(l.name || "").trim())) return;

      // ✅ GST number check (ONLY THIS decides GST / Non-GST)
      const hasGst = Boolean(l.gstNumber && String(l.gstNumber).trim());

      // ✅ Ledger state code
      let ledgerStateCode = "";

      if (hasGst) {
        // GST present → GST number se state
        ledgerStateCode = l.gstNumber.substring(0, 2);
      } else {
        // GST absent → ledger.state se
        ledgerStateCode = l.state?.match(/\((\d+)\)/)?.[1] || "";
      }

      if (!ledgerStateCode) return;

      const isSameState = ledgerStateCode === companyStateCode;

      const finalObj = { ...sale, ledger: l };

      // 1️⃣ GST + Inter
      if (hasGst && !isSameState) {
        gstInter.push(finalObj);
      }

      // 2️⃣ GST + Intra
      else if (hasGst && isSameState) {
        gstIntra.push(finalObj);
      }

      // 3️⃣ Non-GST + Inter
      else if (!hasGst && !isSameState) {
        nonGstInter.push(finalObj);
      }

      // 4️⃣ Non-GST + Intra
      else if (!hasGst && isSameState) {
        nonGstIntra.push(finalObj);
      }
    });

    setGstInterState(gstInter);
    setGstIntraState(gstIntra);
    setNonGstInterState(nonGstInter);
    setNonGstIntraState(nonGstIntra);
  }, [ledger, saleData, companyStateCode]);




  // total logic no no 7 Coloum
  const toNumber = (v: any) => Number(v || 0);
  const sumTotal = (arr: any[]) =>
    arr.reduce((sum, r) => sum + toNumber(r.total), 0);

  // ===== INTER / INTRA REGISTERED (GST) =====
  const interRegisteredNil = sumTotal(
    gstInterState.filter((r) => r.ledger.name === "Nil Rated")
  );

  const interRegisteredExempted = sumTotal(
    gstInterState.filter((r) => r.ledger.name === "Exempted")
  );

  const interRegisteredNonGst = sumTotal(
    gstInterState.filter((r) => r.ledger.name === "Non-gst")
  );

  const intraRegisteredNil = sumTotal(
    gstIntraState.filter((r) => r.ledger.name === "Nil Rated")
  );

  const intraRegisteredExempted = sumTotal(
    gstIntraState.filter((r) => r.ledger.name === "Exempted")
  );

  const intraRegisteredNonGst = sumTotal(
    gstIntraState.filter((r) => r.ledger.name === "Non-gst")
  );

  // ===== INTER / INTRA UNREGISTERED (NON-GST) =====
  const interUnregisteredNil = sumTotal(
    nonGstInterState.filter((r) => r.ledger.name === "Nil Rated")
  );

  const interUnregisteredExempted = sumTotal(
    nonGstInterState.filter((r) => r.ledger.name === "Exempted")
  );

  const interUnregisteredNonGst = sumTotal(
    nonGstInterState.filter((r) => r.ledger.name === "Non-gst")
  );

  const intraUnregisteredNil = sumTotal(
    nonGstIntraState.filter((r) => r.ledger.name === "Nil Rated")
  );

  const intraUnregisteredExempted = sumTotal(
    nonGstIntraState.filter((r) => r.ledger.name === "Exempted")
  );

  const intraUnregisteredNonGst = sumTotal(
    nonGstIntraState.filter((r) => r.ledger.name === "Non-gst")
  );

  // ================= DYNAMIC DATA AGGREGATION =================
  const processedData = React.useMemo(() => {
    if (!saleData.length || !ledger.length) return {
      b2b: [],
      b2cLarge: [],
      b2cSmall: [],
      hsn: [],
      docs: { from: "-", to: "-", total: 0, cancel: 0 }
    };

    const b2b: any[] = [];
    const b2cLarge: any[] = [];
    const b2cSmall: any[] = [];
    const hsnMap: { [key: string]: any } = {};

    let minInv = "";
    let maxInv = "";

    saleData.forEach((sale) => {
      const party = ledger.find((l) => l.id === sale.partyId);
      const hasGst = Boolean(party?.gstNumber && String(party.gstNumber).trim());
      const gstin = hasGst ? party?.gstNumber : "";

      const invValue = Number(sale.total || 0);
      const taxValue = Number(sale.subtotal || 0);

      const flatEntry = {
        gstin: gstin,
        receiverName: party?.name || "Cash/Unknown",
        invoiceNumber: sale.number,
        invoiceDate: new Date(sale.date).toLocaleDateString('en-GB'),
        invoiceValue: invValue,
        placeOfSupply: party?.state || "",
        reverseCharge: "N",
        invoiceType: "Regular",
        ecommerceGstin: "",
        taxableValue: taxValue,
        igstRate: 0, // Simplified unless we explode items
        igstAmount: Number(sale.igstTotal || 0),
        cgstRate: 0,
        cgstAmount: Number(sale.cgstTotal || 0),
        sgstRate: 0,
        sgstAmount: Number(sale.sgstTotal || 0),
        cessRate: 0,
        cessAmount: 0
      };

      // Categorization
      if (hasGst) {
        b2b.push(flatEntry);
      } else if (invValue > 250000) {
        b2cLarge.push(flatEntry);
      } else {
        b2cSmall.push(flatEntry);
      }

      // HSN Aggregation
      const items = (typeof sale.items === 'string' ? JSON.parse(sale.items) : sale.items) || [];
      items.forEach((item: any) => {
        const hsn = item.hsnCode || "N/A";
        if (!hsnMap[hsn]) {
          hsnMap[hsn] = {
            hsn,
            description: item.itemName || "Goods/Services",
            uqc: "NOS",
            qty: 0,
            val: 0,
            txval: 0,
            iamt: 0,
            camt: 0,
            samt: 0,
            csamt: 0
          };
        }
        const qty = Number(item.quantity || 0);
        const rate = Number(item.rate || 0);
        const txval = qty * rate;

        hsnMap[hsn].qty += qty;
        hsnMap[hsn].txval += txval;
        hsnMap[hsn].val += (txval + Number(item.cgstAmount || 0) + Number(item.sgstAmount || 0) + Number(item.igstAmount || 0));
        hsnMap[hsn].iamt += Number(item.igstAmount || 0);
        hsnMap[hsn].camt += Number(item.cgstAmount || 0);
        hsnMap[hsn].samt += Number(item.sgstAmount || 0);
      });

      // Doc Issue Tracking
      const invNo = sale.number;
      if (!minInv || invNo < minInv) minInv = invNo;
      if (!maxInv || invNo > maxInv) maxInv = invNo;
    });

    return {
      b2b,
      b2cLarge,
      b2cSmall,
      hsn: Object.values(hsnMap),
      docs: {
        from: minInv || "-",
        to: maxInv || "-",
        total: saleData.length,
        cancel: 0
      }
    };
  }, [saleData, ledger]);

  return (
    <div className="pt-[56px] px-4 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center mb-6 no-print">
        <button
          title="Back to GST Module"
          type="button"
          onClick={() => navigate("/app/gst")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">GSTR-1 Return</h1>
        <div className="ml-auto flex space-x-2">
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
            title="Upload"
            type="button"
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Upload size={18} />
          </button>
          <button
            title="Print Report"
            type="button"
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Export"
            type="button"
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
            {filters.fromDate === "2000-01-01" && filters.toDate === "2099-12-31"
              ? "All Months (Cumulative Total)"
              : `Selected Month: ${selectedPeriod.month}/${selectedPeriod.year}`}
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
              setFormData((prev) => ({
                ...prev,
                returnPeriod: "All",
              }));
              setSelectedPeriod((prev) => ({
                ...prev,
                month: "All",
              }));
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
            const yearStr = selectedPeriod.year === "All" || !selectedPeriod.year ? String(new Date().getFullYear()) : selectedPeriod.year;
            const startStr = `${yearStr}-${m.val}-01`;
            const lastDay = new Date(parseInt(yearStr, 10), parseInt(m.val, 10), 0).getDate();
            const endStr = `${yearStr}-${m.val}-${String(lastDay).padStart(2, "0")}`;
            const isActive = filters.fromDate === startStr && filters.toDate === endStr;

            return (
              <button
                key={m.val}
                type="button"
                onClick={() => {
                  setSelectedPeriod({
                    month: m.val,
                    year: yearStr
                  });
                  setFilters({
                    fromDate: startStr,
                    toDate: endStr,
                  });
                  setFormData((prev) => ({
                    ...prev,
                    returnPeriod: `${m.val}/${yearStr}`,
                  }));
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
          <h3 className="font-semibold mb-4">Return Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                title="Select Month"
                value={selectedPeriod.month}
                onChange={(e) =>
                  setSelectedPeriod({
                    ...selectedPeriod,
                    month: e.target.value,
                  })
                }
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
                  }`}
              >
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              <select
                title="Select Year"
                value={selectedPeriod.year}
                onChange={(e) =>
                  setSelectedPeriod({ ...selectedPeriod, year: e.target.value })
                }
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600"
                  : "bg-white border-gray-300"
                  }`}
              >
                <option value="2030">2030</option>
                <option value="2029">2029</option>
                <option value="2028">2028</option>
                <option value="2027">2027</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleApplyFilter}
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

      {/* Printable Content */}
      <div ref={printRef} id="gstr1-print-content">
        {/* GSTR-1 Form Header - Exact as per screenshot */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          {/* Form Title Header */}
          <div
            className={`p-4 text-center border-b-2 ${theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-gray-100 border-gray-300"
              }`}
          >
            <h2 className="text-xl font-bold">GSTR-1</h2>
            <p className="text-sm">
              Details of Outward Supplies of Goods or Services
            </p>
          </div>

          {/* Form Details Section */}
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-32 text-sm font-medium">GSTIN:</span>
                  <span className="text-sm font-mono">
                    {companyData.gst_number}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium ">Legal Name:</span>
                  <span className="text-sm uppercase">
                    {companyData.name}
                  </span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium">Trade Name:</span>
                  <span className="text-sm uppercase">{companyData.name}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-32 text-sm font-medium">State:</span>
                  <span className="text-sm uppercase">{companyData.state}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium">Pan Number:</span>
                  <span className="text-sm">{companyData.pan_number}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium">Pin:</span>
                  <span className="text-sm">{companyData.pin}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 4A - B2B Supplies Section */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          {/* Section Header */}
          <div
            className={`p-3 border-b-2 flex items-center justify-between ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT SIDE */}
            <div>
              <h3 className="text-lg font-bold">4A - B2B Supplies</h3>
              <p className="text-sm opacity-90">
                Details of Outward Supplies made to Registered Persons
              </p>
            </div>

            {/* RIGHT SIDE – VIEW MORE */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr-1/b2b", { state: { fromDate: filters.fromDate, toDate: filters.toDate } })}
              className="text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100"
            >
              View More →
            </button>
          </div>


        </div>
        {/* 5A - B2C Large Supplies Section */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          {/* Section Header */}
          <div
            className={`p-3 border-b-2 flex items-center justify-between ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div>
              <h3 className="text-lg font-bold">5A - B2C Large Supplies</h3>
              <p className="text-sm opacity-90">
                Details of Outward Supplies made to Unregistered Persons
                (Invoice value &gt; ₹2.5 lakh)
              </p>
            </div>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr-1/b2cl", { state: { fromDate: filters.fromDate, toDate: filters.toDate } })}
              className="text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100"
            >
              View More →
            </button>
          </div>


        </div>
        {/* 5B - B2C Small Supplies Section */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 flex items-center justify-between ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div>
              <h3 className="text-lg font-bold">5B - B2C Small Supplies</h3>
              <p className="text-sm opacity-90">
                Details of Outward Supplies made to Unregistered Persons
                (Invoice value ≤ ₹2.5 lakh)
              </p>
            </div>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr-1/b2c-small", { state: { fromDate: filters.fromDate, toDate: filters.toDate } })}
              className="text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100"
            >
              View More →
            </button>
          </div>
        </div>
        {/* 6A - Exports Section */}
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
            <h3 className="text-lg font-bold">6A - Exports</h3>
            <p className="text-sm opacity-90">
              Details of Outward Supplies made to SEZ/Exports
            </p>
          </div>
        </div>
        {/* 7 - Nil Rated, Exempted and Non GST Outward Supplies */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">
                7 - Nil Rated, Exempted and Non GST Outward Supplies
              </h3>
              <p className="text-sm opacity-90 truncate">
                Details of Outward Supplies which are Nil Rated/Exempted/Non-GST
              </p>
            </div>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr1/exports")}
              className="self-start sm:self-auto text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100 transition whitespace-nowrap"
            >
              View More →
            </button>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Description
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Nil Rated Supplies
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Exempted (other than nil rated/non GST supply)
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Non-GST Supplies
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2 text-xs">
                      Inter-State supplies to registered persons
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {interRegisteredNil.toFixed(2)}
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {interRegisteredExempted.toFixed(2)}
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {interRegisteredNonGst.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-2 text-xs">
                      Intra-State supplies to registered persons
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {intraRegisteredNil.toFixed(2)}
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {intraRegisteredExempted.toFixed(2)}
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {intraRegisteredNonGst.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-2 text-xs">
                      Inter-State supplies to unregistered persons
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {interUnregisteredNil.toFixed(2)}
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {interUnregisteredExempted.toFixed(2)}
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {interUnregisteredNonGst.toFixed(2)}
                    </td>
                  </tr>

                  <tr>
                    <td className="border p-2 text-xs">
                      Intra-State supplies to unregistered persons
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {intraUnregisteredNil.toFixed(2)}
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {intraUnregisteredExempted.toFixed(2)}
                    </td>
                    <td className="border p-2 text-xs text-right font-mono">
                      {intraUnregisteredNonGst.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 8A - Tax Liability (Advances Received) */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">
                8A - Tax Liability (Advances Received)
              </h3>
              <p className="text-sm opacity-90 truncate">
                Details of Advances on which tax has been paid but invoice has
                not been issued
              </p>
            </div>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr1/advances-received")}
              className="self-start sm:self-auto text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100 transition whitespace-nowrap"
            >
              View More →
            </button>
          </div>

        </div>
        {/* 8B - Tax Liability (Advances Adjusted) */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">
                8B - Tax Liability (Advances Adjusted)
              </h3>
              <p className="text-sm opacity-90 truncate">
                Details of Advances on which tax has been paid and invoice has
                been issued
              </p>
            </div>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr1/advances-adjusted")}
              className="self-start sm:self-auto text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100 transition whitespace-nowrap"
            >
              View More →
            </button>
          </div>

        </div>
        {/* 9A - Credit/Debit Notes (Registered) */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">
                9A - Credit/Debit Notes (Registered)
              </h3>
              <p className="text-sm opacity-90 truncate">
                Details of Credit/Debit Notes issued to Registered Persons
              </p>
            </div>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr1/cdn-registered")}
              className="self-start sm:self-auto text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100 transition whitespace-nowrap"
            >
              View More →
            </button>
          </div>

        </div>
        {" "}
        {/* 9
B - Credit/Debit Notes (Unregistered) */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">
                9B - Credit/Debit Notes (Unregistered)
              </h3>
              <p className="text-sm opacity-90 truncate">
                Details of Credit/Debit Notes issued to Unregistered Persons
              </p>
            </div>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr1/cdn-unregistered")}
              className="self-start sm:self-auto text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100 transition whitespace-nowrap"
            >
              View More →
            </button>
          </div>

        </div>
        {/* 10 - HSN Summary */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">10 - HSN Summary</h3>
              <p className="text-sm opacity-90 truncate">
                HSN-wise Summary of Outward Supplies
              </p>
            </div>

            {/* RIGHT */}
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => navigate("/app/gst/gstr-1/hsn-summary", { state: { fromDate: filters.fromDate, toDate: filters.toDate } })}
                className="self-start sm:self-auto text-xs px-3 py-1 rounded bg-blue-700 text-white font-semibold hover:bg-blue-800 transition whitespace-nowrap"
              >
                B2B HSN Summary
              </button>
              <button
                type="button"
                onClick={() => navigate("/app/gst/gstr-1/hsn-summary-b2c", { state: { fromDate: filters.fromDate, toDate: filters.toDate } })}
                className="self-start sm:self-auto text-xs px-3 py-1 rounded bg-purple-700 text-white font-semibold hover:bg-purple-800 transition whitespace-nowrap"
              >
                B2C HSN Summary
              </button>
            </div>

          </div>

        </div>
        {/* 11 - Documents Issued */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${theme === "dark"
              ? "bg-blue-900 border-gray-600 text-white"
              : "bg-blue-800 border-gray-300 text-white"
              }`}
          >
            {/* LEFT */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">
                11 - Documents Issued
              </h3>
              <p className="text-sm opacity-90 truncate">
                Details of Documents Issued during the tax period
              </p>
            </div>

            {/* RIGHT */}
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr1/documents-issued")}
              className="self-start sm:self-auto text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100 transition whitespace-nowrap"
            >
              View More →
            </button>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Nature of Document
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Sr. No. From
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Sr. No. To
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Total Number
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Cancelled
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Invoices for outward supply
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      {processedData.docs.from}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      {processedData.docs.to}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {processedData.docs.total}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {processedData.docs.cancel}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Invoices for inward supply from unregistered person
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Revised Invoice
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Debit Note
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Credit Note
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* Summary Section */}
        <div
          className={`mb-6 rounded-lg border-2 ${theme === "dark"
            ? "bg-gray-800 border-gray-600"
            : "bg-white border-gray-300"
            }`}
        >
          <div
            className={`p-3 border-b-2 ${theme === "dark"
              ? "bg-green-900 border-gray-600 text-white"
              : "bg-green-800 border-gray-300 text-white"
              }`}
          >
            <h3 className="text-lg font-bold">GSTR-1 Summary</h3>
            <p className="text-sm opacity-90">
              Overall Summary of all Outward Supplies
            </p>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-blue-50"
                  }`}
              >
                <h4 className="text-sm font-bold mb-2">Total Taxable Value</h4>
                <p className="text-2xl font-bold text-blue-600">
                  ₹ {calculateTotals().totalTaxableValue.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-green-50"
                  }`}
              >
                <h4 className="text-sm font-bold mb-2">Total IGST</h4>
                <p className="text-2xl font-bold text-green-600">
                  ₹ {calculateTotals().totalIgst.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-yellow-50"
                  }`}
              >
                <h4 className="text-sm font-bold mb-2">Total CGST</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  ₹ {calculateTotals().totalCgst.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${theme === "dark" ? "bg-gray-700" : "bg-purple-50"
                  }`}
              >
                <h4 className="text-sm font-bold mb-2">Total SGST</h4>
                <p className="text-2xl font-bold text-purple-600">
                  ₹ {calculateTotals().totalSgst.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                className={`p-3 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`}
              >
                <div className="text-sm font-medium">Total Invoice Value</div>
                <div className="text-lg font-bold">
                  ₹{" "}
                  {(
                    calculateTotals().totalTaxableValue +
                    calculateTotals().totalIgst +
                    calculateTotals().totalCgst +
                    calculateTotals().totalSgst +
                    calculateTotals().totalCess
                  ).toLocaleString()}
                </div>
              </div>
              <div
                className={`p-3 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`}
              >
                <div className="text-sm font-medium">Total Tax Amount</div>
                <div className="text-lg font-bold">
                  ₹{" "}
                  {(
                    calculateTotals().totalIgst +
                    calculateTotals().totalCgst +
                    calculateTotals().totalSgst +
                    calculateTotals().totalCess
                  ).toLocaleString()}
                </div>
              </div>
              <div
                className={`p-3 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`}
              >
                <div className="text-sm font-medium">Total Cess</div>
                <div className="text-lg font-bold">
                  ₹ {calculateTotals().totalCess.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons - Fully Functional */}
      <div className="flex flex-wrap gap-4 justify-center mb-6 no-print">
        <ActionButton
          onClick={() => {
            // Simple and reliable print function
            const printContent = document.getElementById("gstr1-print-content");
            if (printContent) {
              const printableContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <title>GSTR-1 Return - ${formData.gstin}</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 20px; color: black; }
                    table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
                    th, td { border: 1px solid black; padding: 6px; text-align: left; font-size: 11px; }
                    th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
                    .text-center { text-align: center; }
                    .text-right { text-align: right; }
                    .font-bold { font-weight: bold; }
                    .mb-6 { margin-bottom: 20px; }
                    .p-4 { padding: 15px; }
                    .border-2 { border: 2px solid black; }
                    .grid { display: flex; flex-wrap: wrap; gap: 10px; }
                    .summary-card { border: 1px solid black; padding: 10px; margin: 5px; min-width: 200px; }
                    h1, h2, h3 { color: black; margin: 10px 0; }
                    .form-header { text-align: center; border: 2px solid black; padding: 15px; margin-bottom: 20px; }
                    .company-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
                    .company-details > div { width: 48%; }
                    @page { size: A4; margin: 0.5in; }
                    @media print { body { margin: 0; } }
                  </style>
                </head>
                <body>
                  ${printContent.innerHTML}
                </body>
                </html>
              `;

              const printWindow = window.open(
                "",
                "_blank",
                "width=800,height=600"
              );
              if (printWindow) {
                printWindow.document.write(printableContent);
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                  printWindow.print();
                  printWindow.close();
                }, 500);
              } else {
                alert("Please allow popups to print the GSTR-1 form");
              }
            } else {
              alert(
                "Print content not found. Please refresh the page and try again."
              );
            }
          }}
          icon={Printer}
          text="Print View"
          colorClass="bg-blue-600 hover:bg-blue-700"
        />

        <ActionButton
          onClick={generateGSTR1JSON}
          icon={FileText}
          text="Generate JSON"
          colorClass="bg-green-600 hover:bg-green-700"
        />

        <ActionButton
          onClick={exportToExcel}
          icon={Download}
          text="Export Excel"
          colorClass="bg-purple-600 hover:bg-purple-700"
        />

        <ActionButton
          onClick={() => navigate("/app/gst")}
          icon={ArrowLeft}
          text="Back to GST"
          colorClass="bg-gray-600 hover:bg-gray-700"
        />
      </div>

      {/* Footer Note */}
      <div
        className={`p-4 rounded-lg border-l-4 no-print ${theme === "dark"
          ? "bg-yellow-900/20 border-yellow-500 text-yellow-200"
          : "bg-yellow-50 border-yellow-400 text-yellow-700"
          }`}
      >
        <h4 className="font-semibold text-sm mb-2">📋 Important Notes:</h4>
        <ul className="text-sm space-y-1">
          <li>
            • Ensure all outward supplies are recorded before filing GSTR-1
          </li>
          <li>• Verify HSN codes and tax rates for all items</li>
          <li>• Cross-check invoice numbers and dates</li>
          <li>• File GSTR-1 by 11th of the following month</li>
          <li>• Keep backup of all supporting documents</li>
        </ul>
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
                Review the generated cumulative GSTR-1 JSON before downloading. Click "Download" to save the file.
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

export default GSTR1;
