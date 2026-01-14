import React, { useState, useRef, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import { Printer, X, MapPin } from "lucide-react";
import type { VoucherEntry } from "../../../types";

// Print styles for invoice layout
const PRINT_STYLES = {
  container:
    "fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4",
  modal: "w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-lg",
  printContainer: "w-[210mm] min-h-[297mm]",
  printArea: "font-arial text-xs leading-tight p-4 bg-white text-black",
  invoice: {
    border: "border-2 border-black mb-2.5",
    header: "bg-gray-100 p-2 text-center border-b border-black",
    title: "text-lg font-bold m-0 tracking-wider",
    infoRow: "flex justify-between px-2.5 py-1.5 border-b border-black text-xs",
    infoFlex: "flex gap-5",
    companySection: "p-2.5 border-b border-black",
    companyHeader: "flex items-center mb-2",
    companyLogo:
      "w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4",
    companyLogoText: "text-white text-base font-bold",
    companyName: "text-base font-bold m-0 uppercase",
    companyAddress: "my-0.5 text-xs",
    companyInfo: "text-xs flex gap-5",
    partySection: "p-2.5",
    partyHeader: "mb-1.5",
    partyLabel: "text-xs font-bold",
    partyDetails: "text-xs leading-relaxed",
  },
  table: {
    main: "w-full border-collapse mb-5 border border-black",
    headerRow: "bg-gray-50",
    headerCell: "border border-black p-2 text-xs font-bold",
    headerCellCenter: "border border-black p-2 text-xs font-bold text-center",
    headerCellRight: "border border-black p-2 text-xs font-bold text-right",
    dataCell: "border border-black p-2 text-xs",
    dataCellCenter: "border border-black p-2 text-xs text-center",
    dataCellRight: "border border-black p-2 text-xs text-right",
    emptyCell: "border border-black p-2 text-xs h-8",
    totalCell: "border border-black p-1_5 text-9pt text-right",
    totalValues: "border border-black p-1_5 text-9pt text-right",
  },
  totals: {
    amountWords: "mb-4 p-2 border border-black text-xs",
    amountWordsLabel: "text-xs font-bold",
    amountWordsText: "text-xs mt-1",
    gstSummary: "mb-4 p-2 border border-black text-xs",
    gstSummaryLabel: "text-xs font-bold",
    gstSummaryContent: "text-xs mt-1",
    gstRateHeader: "flex justify-between mb-1",
    gstRateDetails: "mb-1",
    gstRateRow: "flex justify-between",
    gstNote: "text-xs text-gray-600 mt-1 italic",
  },
  signatures: {
    container: "flex justify-between mt-8 pt-4",
    section: "w-1/2 pr-4",
    sectionRight: "w-1/2 pl-4",
    label: "text-xs font-bold mb-4",
    signatureArea: "mt-8",
    signatureLine: "border-t border-black pt-2 text-xs text-center",
  },
};

interface ItemDetails {
  name: string;
  hsnCode?: string;
  unit: string;
  gstRate: number | string;
}

interface TotalCalculation {
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  discountTotal: number;
  total: number;
}

interface CompanyInfo {
  name: string;
  address?: string;
  gstNumber?: string;
  panNumber?: string;
  state?: string;
}

interface Ledger {
  id: string;
  name: string;
  gstNumber?: string;
  address?: string;
  state?: string;
}

interface InvoicePrintProps {
  theme: "light" | "dark";
  voucherData: Omit<VoucherEntry, "id">;
  isQuotation: boolean;
  onClose: () => void;

  // 🔥 NEW DIRECT DATA
  partyLedger?: Ledger;
  salesLedger?: Ledger;

  getItemDetails: (itemId: string) => ItemDetails;
  calculateTotals: () => TotalCalculation;
  getGstRateInfo: () => {
    totalItems: number;
    uniqueGstRatesCount: number;
    gstRatesUsed: number[];
    breakdown: Record<string, { count: number; gstAmount: number }>;
  };
  companyInfo: CompanyInfo;
  ledgers: Ledger[];
}

const InvoicePrint: React.FC<InvoicePrintProps> = ({
  theme,
  voucherData,
  isQuotation,
  onClose,
  getItemDetails,
  calculateTotals,
  getGstRateInfo,
  companyInfo,
  ledgers,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Shipping address state
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    pinCode: "",
    gstin: "",
    phone: "",
  });

  // 🔹 Party Ledger (single source of truth)
  const partyLedger = React.useMemo(() => {
    if (!voucherData.partyId) return null;

    return ledgers.find((l) => String(l.id) === String(voucherData.partyId));
  }, [ledgers, voucherData.partyId]);

  useEffect(() => {
    if (partyLedger && !shippingAddress.name) {
      setShippingAddress({
        name: partyLedger.name,
        address: partyLedger.address || "",
        city: "",
        state: partyLedger.state || "",
        pinCode: "",
        gstin: partyLedger.gstNumber || "",
        phone: "",
      });
    }
  }, [partyLedger]);

  const [showShippingForm, setShowShippingForm] = useState(false);

  // 🔹 Decide IGST or CGST + SGST
  const isIgstInvoice =
    !!companyInfo?.state &&
    !!partyLedger?.state &&
    companyInfo.state.toLowerCase().trim() !==
      partyLedger.state.toLowerCase().trim();

  // Handle shipping address changes
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({ ...prev, [name]: value }));
  };

  // Auto-fill shipping address with billing address
  const fillBillingAddress = () => {
    if (!partyLedger) return;

    setShippingAddress({
      name: partyLedger.name,
      address: partyLedger.address || "",
      city: "Party City",
      state: partyLedger.state || "",
      pinCode: "Party PIN",
      gstin: partyLedger.gstNumber || "",
      phone: "Party Phone",
    });
  };

  // ================= GST SUMMARY CALCULATION =================

  const gstSummary = (() => {
    const map: Record<
      string,
      {
        hsn: string;
        taxableValue: number;

        cgstRate: number;
        cgstAmount: number;

        sgstRate: number;
        sgstAmount: number;

        igstRate: number;
        igstAmount: number;
      }
    > = {};

    voucherData.entries.forEach((entry) => {
      if (!entry.itemId) return;

      const item = getItemDetails(entry.itemId);
      const hsn = item.hsnCode || "N/A";

      const qty = Number(entry.quantity || 0);
      const rate = Number(entry.rate || 0);
      const taxable = qty * rate;

      const gstRate = Number(item.gstRate || 0);

      const cgstRate = !isIgstInvoice ? gstRate / 2 : 0;
      const sgstRate = !isIgstInvoice ? gstRate / 2 : 0;
      const igstRate = isIgstInvoice ? gstRate : 0;

      const cgstAmt = (taxable * cgstRate) / 100;
      const sgstAmt = (taxable * sgstRate) / 100;
      const igstAmt = (taxable * igstRate) / 100;

      if (!map[hsn]) {
        map[hsn] = {
          hsn,
          taxableValue: 0,

          cgstRate,
          cgstAmount: 0,

          sgstRate,
          sgstAmount: 0,

          igstRate,
          igstAmount: 0,
        };
      }

      map[hsn].taxableValue += taxable;
      map[hsn].cgstAmount += cgstAmt;
      map[hsn].sgstAmount += sgstAmt;
      map[hsn].igstAmount += igstAmt;
    });

    return Object.values(map);
  })();

  const totalTaxableValue = gstSummary.reduce((s, r) => s + r.taxableValue, 0);
  const totalCgstAmount = gstSummary.reduce((s, r) => s + r.cgstAmount, 0);
  const totalSgstAmount = gstSummary.reduce((s, r) => s + r.sgstAmount, 0);
  const totalIgstAmount = gstSummary.reduce((s, r) => s + r.igstAmount, 0);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${isQuotation ? "Sales_Quotation" : "Sales_Voucher"}_${
      voucherData.number
    }`,
    onBeforePrint: () => {
      console.log("Starting print process...");
      const selectedItems = voucherData.entries.filter(
        (entry) =>
          entry.itemId && entry.itemId !== "" && entry.itemId !== "select"
      );
      console.log("Selected items for print:", selectedItems.length);

      return Promise.resolve();
    },
    onAfterPrint: () => {
      console.log("Print completed successfully");
    },
    onPrintError: (errorLocation: string, error: Error) => {
      console.error("Print error at:", errorLocation, error);
      alert("Print failed. Please try your browser's print function (Ctrl+P).");
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body { 
          font-size: 12pt; 
          font-family: Arial, sans-serif;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          page-break-inside: avoid;
        }
        th, td { 
          border: 1px solid #000; 
          padding: 8px; 
          font-size: 10pt;
        }
        .no-print { display: none; }
      }
    `,
  });

  const totals = calculateTotals();
  const { subtotal, cgstTotal, sgstTotal, igstTotal, discountTotal, total } =
    totals;
  const grandTotal = total;
  const selectedItems = voucherData.entries.filter(
    (entry) => entry.itemId && entry.itemId !== "" && entry.itemId !== "select"
  );

  return (
    <div className={PRINT_STYLES.container}>
      <div
        className={`${PRINT_STYLES.modal} ${
          theme === "dark" ? "bg-gray-800 text-white" : "bg-white text-gray-900"
        }`}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            theme === "dark" ? "border-gray-700" : "border-gray-200"
          } no-print`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              🧾 {isQuotation ? "Quotation" : "Invoice"} Print Preview
            </h2>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowShippingForm(!showShippingForm)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center"
              >
                <MapPin size={16} className="mr-2" />
                {showShippingForm ? "Hide" : "Add"} Shipping Address
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
              >
                <Printer size={16} className="mr-2" />
                Print Invoice
              </button>
              <button
                title="Close Print Preview"
                onClick={onClose}
                className={`p-2 rounded-full transition-colors ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Shipping Address Form */}
        {showShippingForm && (
          <div
            className={`p-6 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            } no-print`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📦 Shipping Address</h3>
              <button
                onClick={fillBillingAddress}
                className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Same as Billing
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  name="name"
                  value={shippingAddress.name}
                  onChange={handleShippingChange}
                  placeholder="Enter shipping contact name"
                  className={`w-full p-2 border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={shippingAddress.phone}
                  onChange={handleShippingChange}
                  placeholder="Enter phone number"
                  className={`w-full p-2 border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={shippingAddress.address}
                  onChange={handleShippingChange}
                  placeholder="Enter complete shipping address"
                  className={`w-full p-2 border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={shippingAddress.city}
                  onChange={handleShippingChange}
                  placeholder="Enter city"
                  className={`w-full p-2 border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <input
                  type="text"
                  name="state"
                  value={shippingAddress.state}
                  onChange={handleShippingChange}
                  placeholder="Enter state"
                  className={`w-full p-2 border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  name="pinCode"
                  value={shippingAddress.pinCode}
                  onChange={handleShippingChange}
                  placeholder="Enter PIN code"
                  className={`w-full p-2 border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GSTIN</label>
                <input
                  type="text"
                  name="gstin"
                  value={shippingAddress.gstin}
                  onChange={handleShippingChange}
                  placeholder="Enter GSTIN (if different)"
                  className={`w-full p-2 border rounded ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Print Layout */}
        <div className="p-6">
          <div ref={printRef} className={PRINT_STYLES.printArea}>
            <style>
              {`
                @media print {
                  body { margin: 0; font-family: Arial, sans-serif; }
                  .no-print { display: none; }
                  .print-area { max-width: none; margin: 0; padding: 20px; }
                  table { border-collapse: collapse; width: 100%; }
                  th, td { border: 1px solid #000; padding: 8px; font-size: 11px; }
                  .header-title { font-size: 16px; font-weight: bold; text-align: center; }
                  .section-header { background-color: #f0f0f0; font-weight: bold; }
                }
              `}
            </style>

            {/* Header Section */}
            <div className={PRINT_STYLES.invoice.border}>
              {/* Top Header with TAX INVOICE */}
              <div className={PRINT_STYLES.invoice.header}>
                <h1 className={PRINT_STYLES.invoice.title}>
                  {isQuotation ? "SALES QUOTATION" : "TAX INVOICE"}
                </h1>
                {isQuotation && (
                  <div className="text-center text-sm text-gray-600 mt-1 font-medium">
                    📋 This is a Quotation - Not a Tax Invoice
                  </div>
                )}
              </div>

              {/* Invoice Details Row */}
              <div className={PRINT_STYLES.invoice.infoRow}>
                <span>
                  <strong>INVOICE NO:</strong> {voucherData.number}
                </span>
                <span>
                  <strong>DATE:</strong>{" "}
                  {new Date(voucherData.date).toLocaleDateString("en-GB")}
                </span>
              </div>

              {/* Reference and Dispatch Details Row */}
              <div className={PRINT_STYLES.invoice.infoRow}>
                <div className={PRINT_STYLES.invoice.infoFlex}>
                  {voucherData.referenceNo && (
                    <span>
                      <strong>REF NO:</strong> {voucherData.referenceNo}
                    </span>
                  )}
                  {voucherData.dispatchDetails?.docNo && (
                    <span>
                      <strong>DISPATCH DOC NO:</strong>{" "}
                      {voucherData.dispatchDetails.docNo}
                    </span>
                  )}
                </div>
                <div className={PRINT_STYLES.invoice.infoFlex}>
                  {voucherData.dispatchDetails?.through && (
                    <span>
                      <strong>DISPATCH THROUGH:</strong>{" "}
                      {voucherData.dispatchDetails.through}
                    </span>
                  )}
                  {voucherData.dispatchDetails?.destination && (
                    <span>
                      <strong>DESTINATION:</strong>{" "}
                      {voucherData.dispatchDetails.destination}
                    </span>
                  )}
                </div>
              </div>

              {/* Company Details Section */}
              <div className={PRINT_STYLES.invoice.companySection}>
                <div className={PRINT_STYLES.invoice.companyHeader}>
                  <div className={PRINT_STYLES.invoice.companyLogo}>
                    <span className={PRINT_STYLES.invoice.companyLogoText}>
                      {companyInfo.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h2 className={PRINT_STYLES.invoice.companyName}>
                      {companyInfo.name}
                    </h2>
                    <p className={PRINT_STYLES.invoice.companyAddress}>
                      {companyInfo.address || "Your Business Address"}
                    </p>
                  </div>
                </div>
                <div className={PRINT_STYLES.invoice.companyInfo}>
                  <span>
                    <strong>GSTIN:</strong> {companyInfo.gstNumber || "N/A"}
                  </span>
                  <span>
                    <strong>PAN NO:</strong> {companyInfo.panNumber || "N/A"}
                  </span>
                </div>
              </div>

              {/* Customer & Shipping Details Section - Side by Side Layout */}
              <div className="flex border-b border-black">
                {/* Party Details - Left Column */}
                <div className="w-1/2 p-2.5 border-r border-black">
                  <div className={PRINT_STYLES.invoice.partyHeader}>
                    <strong className={PRINT_STYLES.invoice.partyLabel}>
                      PARTY'S NAME & BILLING ADDRESS:
                    </strong>
                  </div>
                  <div className={PRINT_STYLES.invoice.partyDetails}>
                    <div>
                      <strong>
                        {partyLedger?.name || "Party Not Selected"}
                      </strong>
                    </div>
                    {partyLedger && (
                      <>
                        <div className="mt-1">
                          {partyLedger.address || "N/A"}
                        </div>
                        <div>State: {partyLedger.state || "N/A"}</div>
                        <div>GSTIN: {partyLedger.gstNumber || "N/A"}</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Shipping Address - Right Column */}
                <div className="w-1/2 p-2.5">
                  <div className={PRINT_STYLES.invoice.partyHeader}>
                    <strong className={PRINT_STYLES.invoice.partyLabel}>
                      {shippingAddress.name || shippingAddress.address
                        ? "SHIPPING ADDRESS:"
                        : "SHIPPING ADDRESS: (Same as Billing)"}
                    </strong>
                  </div>
                  <div className={PRINT_STYLES.invoice.partyDetails}>
                    {shippingAddress.name || shippingAddress.address ? (
                      <>
                        <div>
                          <strong>
                            {shippingAddress.name ||
                              partyLedger?.name ||
                              "Party Not Selected"}
                          </strong>
                        </div>
                        <div className="mt-1">
                          {shippingAddress.address || "Same as billing address"}
                        </div>
                        <div>
                          {shippingAddress.city && `${shippingAddress.city}, `}
                          {shippingAddress.state &&
                            `${shippingAddress.state} - `}
                          {shippingAddress.pinCode}
                        </div>
                        {shippingAddress.phone && (
                          <div>Phone: {shippingAddress.phone}</div>
                        )}
                        {shippingAddress.gstin && (
                          <div>GSTIN: {shippingAddress.gstin}</div>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          {/* <strong>
                            {voucherData.partyId
                              ? getPartyName(voucherData.partyId)
                              : "No Party Selected"}
                          </strong> */}
                        </div>
                        {voucherData.partyId && partyLedger && (
                          <>
                            <div className="mt-1">
                              {partyLedger.address || "N/A"}
                            </div>
                            <div>State: {partyLedger.state || "N/A"}</div>
                            <div>GSTIN: {partyLedger.gstNumber || "N/A"}</div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Particulars Table */}
            <table className={PRINT_STYLES.table.main}>
              <thead>
                <tr className={PRINT_STYLES.table.headerRow}>
                  <th className={`${PRINT_STYLES.table.headerCellCenter} w-12`}>
                    Sr No
                  </th>
                  <th className={PRINT_STYLES.table.headerCell}>
                    Particulars (Description & Specifications)
                  </th>
                  <th className={`${PRINT_STYLES.table.headerCell} w-20`}>
                    HSN Code
                  </th>
                  <th className={`${PRINT_STYLES.table.headerCellCenter} w-15`}>
                    Qty
                  </th>
                  <th className={`${PRINT_STYLES.table.headerCellRight} w-20`}>
                    Rate
                  </th>
                  <th className={`${PRINT_STYLES.table.headerCellCenter} w-15`}>
                    GST %
                  </th>
                  <th className={`${PRINT_STYLES.table.headerCellRight} w-25`}>
                    Amount
                  </th>
                </tr>
              </thead>

              <tbody>
                {selectedItems.map((entry, index) => {
                  const itemDetails = getItemDetails(entry.itemId || "");
                  const baseAmount = (entry.quantity || 0) * (entry.rate || 0);
                  const gstRate = itemDetails.gstRate || 0;

                  return (
                    <tr key={entry.id}>
                      <td className={PRINT_STYLES.table.dataCellCenter}>
                        {index + 1}
                      </td>
                      <td className={PRINT_STYLES.table.dataCell}>
                        <strong>{itemDetails.name}</strong>
                      </td>
                      <td className={PRINT_STYLES.table.dataCellCenter}>
                        {itemDetails.hsnCode}
                      </td>
                      <td className={PRINT_STYLES.table.dataCellCenter}>
                        {entry.quantity?.toLocaleString() || "0"}{" "}
                        {itemDetails.unit}
                      </td>
                      <td className={PRINT_STYLES.table.dataCellRight}>
                        ₹{entry.rate?.toLocaleString() || "0"}
                      </td>
                      <td className={PRINT_STYLES.table.dataCellCenter}>
                        {gstRate}%
                      </td>
                      <td className={PRINT_STYLES.table.dataCellRight}>
                        ₹{baseAmount.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}

                {/* Add empty rows for spacing if no items */}
                {selectedItems.length === 0 && (
                  <>
                    <tr>
                      <td
                        className={`${PRINT_STYLES.table.emptyCell} text-center`}
                        colSpan={7}
                      >
                        No items selected
                      </td>
                    </tr>
                    {Array(3)
                      .fill(0)
                      .map((_, index) => (
                        <tr key={`empty-${index}`}>
                          <td className={PRINT_STYLES.table.emptyCell}>
                            &nbsp;
                          </td>
                          <td className={PRINT_STYLES.table.emptyCell}>
                            &nbsp;
                          </td>
                          <td className={PRINT_STYLES.table.emptyCell}>
                            &nbsp;
                          </td>
                          <td className={PRINT_STYLES.table.emptyCell}>
                            &nbsp;
                          </td>
                          <td className={PRINT_STYLES.table.emptyCell}>
                            &nbsp;
                          </td>
                          <td className={PRINT_STYLES.table.emptyCell}>
                            &nbsp;
                          </td>
                          <td className={PRINT_STYLES.table.emptyCell}>
                            &nbsp;
                          </td>
                        </tr>
                      ))}
                  </>
                )}

                {/* Add empty rows for spacing when items exist */}
                {selectedItems.length > 0 &&
                  selectedItems.length < 4 &&
                  Array(Math.max(0, 4 - selectedItems.length))
                    .fill(0)
                    .map((_, index) => (
                      <tr key={`empty-${index}`}>
                        <td className={PRINT_STYLES.table.emptyCell}>&nbsp;</td>
                        <td className={PRINT_STYLES.table.emptyCell}>&nbsp;</td>
                        <td className={PRINT_STYLES.table.emptyCell}>&nbsp;</td>
                        <td className={PRINT_STYLES.table.emptyCell}>&nbsp;</td>
                        <td className={PRINT_STYLES.table.emptyCell}>&nbsp;</td>
                        <td className={PRINT_STYLES.table.emptyCell}>&nbsp;</td>
                        <td className={PRINT_STYLES.table.emptyCell}>&nbsp;</td>
                      </tr>
                    ))}
              </tbody>

              {/* Tax Summary */}
              <tfoot>
                <tr>
                  <td
                    colSpan={5}
                    className="border border-black p-1_5 text-9pt"
                  >
                    <strong>Terms & Conditions:</strong>
                    <br />
                    <span className="text-8pt">
                      • Goods once sold will not be taken back.
                      <br />
                      • Interest @ 18% p.a. will be charged on delayed payments.
                      <br />• Subject to {companyInfo.address || "Local"}{" "}
                      Jurisdiction only.
                      <br />
                      • Our responsibility ceases as soon as goods leave our
                      premises.
                      <br />• Delivery charges extra as applicable.
                    </span>
                  </td>
                  <td className={PRINT_STYLES.table.totalCell}>
                    <div className="mb-1_5">Subtotal</div>
                    {cgstTotal > 0 && <div className="mb-1_5"> CGST</div>}
                    {sgstTotal > 0 && <div className="mb-1_5"> SGST</div>}
                    {igstTotal > 0 && <div className="mb-1_5"> IGST</div>}
                    {discountTotal > 0 && (
                      <div className="mb-1_5">Less: Discount</div>
                    )}
                    <div className="font-bold text-11pt">Grand Total</div>
                  </td>
                  <td className={PRINT_STYLES.table.totalValues}>
                    <div className="mb-1_5">₹{subtotal.toLocaleString()}</div>
                    {cgstTotal > 0 && (
                      <div className="mb-1_5">
                        ₹{cgstTotal.toLocaleString()}
                      </div>
                    )}
                    {sgstTotal > 0 && (
                      <div className="mb-1_5">
                        ₹{sgstTotal.toLocaleString()}
                      </div>
                    )}
                    {igstTotal > 0 && (
                      <div className="mb-1_5">
                        ₹{igstTotal.toLocaleString()}
                      </div>
                    )}
                    {discountTotal > 0 && (
                      <div className="mb-1_5">
                        ₹{discountTotal.toLocaleString()}
                      </div>
                    )}
                    <div className="font-bold text-11pt">
                      ₹{total.toLocaleString()}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>

            {/* Amount in Words */}
            <div className="mt-6 border border-black text-[11px] w-full">
              {/* HEADER ROW 1 */}
              <div className="grid grid-cols-7 border-b border-black font-bold text-center">
                <div className="p-2 border-r border-black">HSN / SAC</div>
                <div className="p-2 border-r border-black">Taxable Value</div>

                <div className="p-2 border-r border-black col-span-2">CGST</div>

                <div className="p-2 border-r border-black col-span-2">SGST</div>

                <div className="p-2">Total Tax Amount</div>
              </div>

              {/* HEADER ROW 2 (SUB HEADINGS) */}
              <div className="grid grid-cols-7 border-b border-black font-bold text-center">
                <div className="p-1 border-r border-black"></div>
                <div className="p-1 border-r border-black"></div>

                <div className="p-1 border-r border-black">Rate</div>
                <div className="p-1 border-r border-black">Amount</div>

                <div className="p-1 border-r border-black">Rate</div>
                <div className="p-1 border-r border-black">Amount</div>

                <div className="p-1"></div>
              </div>

              {/* DATA */}
              {gstSummary.map((r, i) => {
                const totalTax = r.cgstAmount + r.sgstAmount;

                return (
                  <div
                    key={i}
                    className="grid grid-cols-7 border-b border-black text-right"
                  >
                    <div className="p-1 border-r border-black text-center">
                      {r.hsn}
                    </div>

                    <div className="p-1 border-r border-black">
                      {r.taxableValue.toFixed(2)}
                    </div>

                    <div className="p-1 border-r border-black text-center">
                      {r.cgstRate}%
                    </div>

                    <div className="p-1 border-r border-black">
                      ₹{r.cgstAmount.toFixed(2)}
                    </div>

                    <div className="p-1 border-r border-black text-center">
                      {r.sgstRate}%
                    </div>

                    <div className="p-1 border-r border-black">
                      ₹{r.sgstAmount.toFixed(2)}
                    </div>

                    <div className="p-1 font-semibold">
                      ₹{totalTax.toFixed(2)}
                    </div>
                  </div>
                );
              })}

              {/* TOTAL */}
              <div className="grid grid-cols-7 font-bold text-right">
                <div className="p-2 border-r border-black text-center">
                  Total
                </div>

                <div className="p-2 border-r border-black">
                  {totalTaxableValue.toFixed(2)}
                </div>

                <div className="p-2 border-r border-black"></div>

                <div className="p-2 border-r border-black">
                  ₹{totalCgstAmount.toFixed(2)}
                </div>

                <div className="p-2 border-r border-black"></div>

                <div className="p-2 border-r border-black">
                  ₹{totalSgstAmount.toFixed(2)}
                </div>

                <div className="p-2">
                  ₹{(totalCgstAmount + totalSgstAmount).toFixed(2)}
                </div>
              </div>
            </div>

            {/* ===== AMOUNT IN WORDS ===== */}
            <div className="mt-4 text-sm">
              <strong>Total Amount (Rs. in Words): </strong>
              Rupees {grandTotal > 0
                ? grandTotal.toLocaleString()
                : "Zero"}{" "}
              Only
              {grandTotal > 0 && ` (₹${grandTotal.toFixed(2)})`}
            </div>

            {/* GST Calculation Summary */}
            {selectedItems.length > 0 && (
              <div className={PRINT_STYLES.totals.gstSummary}>
                <strong className={PRINT_STYLES.totals.gstSummaryLabel}>
                  GST Calculation Summary:
                </strong>
                <div className={PRINT_STYLES.totals.gstSummaryContent}>
                  {(() => {
                    const gstInfo = getGstRateInfo();
                    return (
                      <div>
                        <div className={PRINT_STYLES.totals.gstRateHeader}>
                          <span>Total Items: {gstInfo.totalItems}</span>
                          <span>
                            GST Rates Applied: {gstInfo.uniqueGstRatesCount}
                          </span>
                        </div>
                        <div className={PRINT_STYLES.totals.gstRateDetails}>
                          <strong>GST Rates Used:</strong>{" "}
                          {gstInfo.gstRatesUsed.join("%, ")}%
                        </div>
                        {Object.entries(gstInfo.breakdown).map(
                          ([rate, data]) => (
                            <div
                              key={rate}
                              className={PRINT_STYLES.totals.gstRateRow}
                            >
                              <span>
                                GST {rate}%: {data.count} item
                                {data.count > 1 ? "s" : ""}
                              </span>
                              <span>
                                ₹{data.gstAmount.toLocaleString()} GST
                              </span>
                            </div>
                          )
                        )}
                        <div className={PRINT_STYLES.totals.gstNote}>
                          This invoice includes {gstInfo.uniqueGstRatesCount}{" "}
                          different GST rate
                          {gstInfo.uniqueGstRatesCount > 1 ? "s" : ""} as per
                          item specifications
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Footer Section */}
            <div className={PRINT_STYLES.signatures.container}>
              <div className={PRINT_STYLES.signatures.section}>
                <div className={PRINT_STYLES.signatures.label}>
                  For {companyInfo.name.toUpperCase()}
                </div>
                <div className={PRINT_STYLES.signatures.signatureArea}>
                  <div className={PRINT_STYLES.signatures.signatureLine}>
                    Authorised Signatory
                  </div>
                </div>
              </div>
              <div className={PRINT_STYLES.signatures.sectionRight}>
                <div className={PRINT_STYLES.signatures.label}>
                  Customer's Signature
                </div>
                <div className={PRINT_STYLES.signatures.signatureArea}>
                  <div className={PRINT_STYLES.signatures.signatureLine}>
                    Receiver's Signature
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
