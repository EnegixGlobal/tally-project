import React, { useState, useRef } from "react";
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
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPeriod, setSelectedPeriod] = useState({
    month: "03",
    year: "2024",
  });

  // Form data state matching the screenshot structure
  const [formData, setFormData] = useState({
    gstin: "27AABCU9603R1ZX",
    legalName: "ABC COMPANY PRIVATE LIMITED",
    tradeName: "ABC COMPANY",
    returnPeriod: "March 2024",
    dateOfFiling: "",

    // B2B Supplies data
    b2bSupplies: [
      {
        gstin: "27AABCU9603R1ZX",
        receiverName: "XYZ PRIVATE LIMITED",
        invoiceNumber: "INV001",
        invoiceDate: "01/03/2024",
        invoiceValue: 118000,
        placeOfSupply: "27-Maharashtra",
        reverseCharge: "N",
        invoiceType: "Regular",
        ecommerceGstin: "",
        taxableValue: 100000,
        igstRate: 0,
        igstAmount: 0,
        cgstRate: 9,
        cgstAmount: 9000,
        sgstRate: 9,
        sgstAmount: 9000,
        cessRate: 0,
        cessAmount: 0,
      },
    ],

    // B2C Large Supplies data
    b2cLargeSupplies: [
      {
        invoiceNumber: "INV002",
        invoiceDate: "02/03/2024",
        invoiceValue: 265000,
        placeOfSupply: "29-Karnataka",
        taxableValue: 250000,
        igstRate: 6,
        igstAmount: 15000,
        cgstRate: 0,
        cgstAmount: 0,
        sgstRate: 0,
        sgstAmount: 0,
        cessRate: 0,
        cessAmount: 0,
      },
    ],
  });

  // Simple print functionality - no complex dependencies needed

  // DRY Utility Functions
  const calculateTotals = () => {
    const b2bTotals = formData.b2bSupplies.reduce(
      (acc, item) => ({
        taxableValue: acc.taxableValue + item.taxableValue,
        igstAmount: acc.igstAmount + item.igstAmount,
        cgstAmount: acc.cgstAmount + item.cgstAmount,
        sgstAmount: acc.sgstAmount + item.sgstAmount,
        cessAmount: acc.cessAmount + item.cessAmount,
      }),
      {
        taxableValue: 0,
        igstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        cessAmount: 0,
      }
    );

    const b2cTotals = formData.b2cLargeSupplies.reduce(
      (acc, item) => ({
        taxableValue: acc.taxableValue + item.taxableValue,
        igstAmount: acc.igstAmount + item.igstAmount,
        cgstAmount: acc.cgstAmount + item.cgstAmount,
        sgstAmount: acc.sgstAmount + item.sgstAmount,
        cessAmount: acc.cessAmount + item.cessAmount,
      }),
      {
        taxableValue: 0,
        igstAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        cessAmount: 0,
      }
    );

    return {
      totalTaxableValue: b2bTotals.taxableValue + b2cTotals.taxableValue,
      totalIgst: b2bTotals.igstAmount + b2cTotals.igstAmount,
      totalCgst: b2bTotals.cgstAmount + b2cTotals.cgstAmount,
      totalSgst: b2bTotals.sgstAmount + b2cTotals.sgstAmount,
      totalCess: b2bTotals.cessAmount + b2cTotals.cessAmount,
    };
  };

  const generateGSTR1JSON = () => {
    const gstr1Data = {
      gstin: formData.gstin,
      ret_period: selectedPeriod.month + selectedPeriod.year,
      b2b: formData.b2bSupplies.map((supply) => ({
        ctin: supply.gstin,
        inv: [
          {
            inum: supply.invoiceNumber,
            idt: supply.invoiceDate,
            val: supply.invoiceValue,
            pos: supply.placeOfSupply.split("-")[0],
            rchrg: supply.reverseCharge,
            inv_typ: supply.invoiceType === "Regular" ? "R" : "SEZWP",
            itms: [
              {
                num: 1,
                itm_det: {
                  txval: supply.taxableValue,
                  rt: supply.igstRate || supply.cgstRate + supply.sgstRate,
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
      b2cl: formData.b2cLargeSupplies.map((supply) => ({
        inv: [
          {
            inum: supply.invoiceNumber,
            idt: supply.invoiceDate,
            val: supply.invoiceValue,
            pos: supply.placeOfSupply.split("-")[0],
            itms: [
              {
                num: 1,
                itm_det: {
                  txval: supply.taxableValue,
                  rt: supply.igstRate || supply.cgstRate + supply.sgstRate,
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
        data: [
          {
            num: 1,
            hsn_sc: "8471",
            desc: "Automatic data processing machines",
            uqc: "NOS",
            qty: 1,
            val: 118000,
            txval: 100000,
            iamt: 0,
            camt: 9000,
            samt: 9000,
            csamt: 0,
          },
          {
            num: 2,
            hsn_sc: "8517",
            desc: "Telephone sets and other apparatus",
            uqc: "NOS",
            qty: 1,
            val: 265000,
            txval: 250000,
            iamt: 15000,
            camt: 0,
            samt: 0,
            csamt: 0,
          },
        ],
      },
      doc_issue: {
        doc_det: [
          {
            doc_num: 1,
            docs: [
              {
                num: 1,
                from: "INV001",
                to: "INV002",
                totnum: 2,
                cancel: 0,
                net_issue: 2,
              },
            ],
          },
        ],
      },
    };

    const jsonString = JSON.stringify(gstr1Data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `GSTR1_${formData.gstin}_${selectedPeriod.month}${selectedPeriod.year}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    const totals = calculateTotals();

    // Create workbook
    const wb = XLSX.utils.book_new();

    // B2B Supplies Sheet
    const b2bData = formData.b2bSupplies.map((supply) => ({
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
    const b2cData = formData.b2cLargeSupplies.map((supply) => ({
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
    const hsnData = [
      {
        HSN: "8471",
        Description: "Automatic data processing machines",
        UQC: "NOS",
        "Total Quantity": 1,
        "Total Value": 118000,
        "Taxable Value": 100000,
        "IGST Amount": 0,
        "CGST Amount": 9000,
        "SGST Amount": 9000,
        "Cess Amount": 0,
      },
      {
        HSN: "8517",
        Description: "Telephone sets and other apparatus",
        UQC: "NOS",
        "Total Quantity": 1,
        "Total Value": 265000,
        "Taxable Value": 250000,
        "IGST Amount": 15000,
        "CGST Amount": 0,
        "SGST Amount": 0,
        "Cess Amount": 0,
      },
    ];
    const hsnWs = XLSX.utils.json_to_sheet(hsnData);
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
      className={`flex items-center px-6 py-3 rounded-lg font-medium text-white ${colorClass} ${
        theme === "dark" ? colorClass : colorClass
      }`}
    >
      <Icon className="mr-2" size={18} />
      {text}
    </button>
  );

  // my logic

  return (
    <div className="pt-[56px] px-4 min-h-screen">
      {/* Header Section */}
      <div className="flex items-center mb-6 no-print">
        <button
          title="Back to GST Module"
          type="button"
          onClick={() => navigate("/app/gst")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
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
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Upload"
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Upload size={18} />
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
            title="Export"
            type="button"
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
                className={`w-full p-2 rounded border ${
                  theme === "dark"
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
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
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

      {/* Printable Content */}
      <div ref={printRef} id="gstr1-print-content">
        {/* GSTR-1 Form Header - Exact as per screenshot */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          {/* Form Title Header */}
          <div
            className={`p-4 text-center border-b-2 ${
              theme === "dark"
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
                  <span className="text-sm font-mono">{formData.gstin}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium">Legal Name:</span>
                  <span className="text-sm">{formData.legalName}</span>
                </div>
                <div className="flex">
                  <span className="w-32 text-sm font-medium">Trade Name:</span>
                  <span className="text-sm">{formData.tradeName}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex">
                  <span className="w-32 text-sm font-medium">
                    Return Period:
                  </span>
                  <span className="text-sm">{formData.returnPeriod}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* 4A - B2B Supplies Section */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          {/* Section Header */}
          <div
            className={`p-3 border-b-2 flex items-center justify-between ${
              theme === "dark"
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
              onClick={() => navigate("/app/gst/gstr-1/b2b")}
              className="text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100"
            >
              View More →
            </button>
          </div>

          {/* B2B Table */}
          <div className="p-4">
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
                  {formData.b2bSupplies.map((supply, index) => (
                    <tr
                      key={index}
                      className={`${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="border border-gray-300 p-2 text-xs font-mono">
                        {supply.gstin}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {supply.receiverName}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs font-mono">
                        {supply.invoiceNumber}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {supply.invoiceDate}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.invoiceValue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {supply.placeOfSupply}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.reverseCharge}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {supply.invoiceType}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs font-mono">
                        {supply.ecommerceGstin}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.taxableValue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.igstRate}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.igstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.cgstRate}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.cgstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.sgstRate}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.sgstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.cessRate}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.cessAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
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
                      {formData.b2bSupplies
                        .reduce((sum, item) => sum + item.taxableValue, 0)
                        .toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs"></td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {formData.b2bSupplies
                        .reduce((sum, item) => sum + item.igstAmount, 0)
                        .toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs"></td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {formData.b2bSupplies
                        .reduce((sum, item) => sum + item.cgstAmount, 0)
                        .toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs"></td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {formData.b2bSupplies
                        .reduce((sum, item) => sum + item.sgstAmount, 0)
                        .toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs"></td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {formData.b2bSupplies
                        .reduce((sum, item) => sum + item.cessAmount, 0)
                        .toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 5A - B2C Large Supplies Section */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          {/* Section Header */}
          <div
            className={`p-3 border-b-2 flex items-center justify-between ${
              theme === "dark"
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
              onClick={() => navigate("/app/gst/gstr-1/b2cl")}
              className="text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100"
            >
              View More →
            </button>
          </div>

          {/* B2C Large Table */}
          <div className="p-4">
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
                  {formData.b2cLargeSupplies.map((supply, index) => (
                    <tr
                      key={index}
                      className={`${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="border border-gray-300 p-2 text-xs font-mono">
                        {supply.invoiceNumber}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {supply.invoiceDate}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.invoiceValue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">
                        {supply.placeOfSupply}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs">-</td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.taxableValue.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.igstRate}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.igstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.cgstRate}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.cgstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.sgstRate}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.sgstAmount.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-center">
                        {supply.cessRate}%
                      </td>
                      <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                        {supply.cessAmount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {/* Total Row */}
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
                      {formData.b2cLargeSupplies
                        .reduce((sum, item) => sum + item.taxableValue, 0)
                        .toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs"></td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {formData.b2cLargeSupplies
                        .reduce((sum, item) => sum + item.igstAmount, 0)
                        .toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs"></td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {formData.b2cLargeSupplies
                        .reduce((sum, item) => sum + item.cgstAmount, 0)
                        .toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs"></td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {formData.b2cLargeSupplies
                        .reduce((sum, item) => sum + item.sgstAmount, 0)
                        .toLocaleString()}
                    </td>
                    <td className="border border-gray-300 p-2 text-xs"></td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      {formData.b2cLargeSupplies
                        .reduce((sum, item) => sum + item.cessAmount, 0)
                        .toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* 5B - B2C Small Supplies Section */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 flex items-center justify-between ${
              theme === "dark"
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
              onClick={() => navigate("/app/gst/gstr-1/b2c-small")}
              className="text-xs px-3 py-1 rounded bg-white text-blue-800 font-semibold hover:bg-gray-100"
            >
              View More →
            </button>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Type
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Place of Supply
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
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
                  <tr>
                    <td
                      colSpan={12}
                      className="border border-gray-300 p-4 text-center text-sm text-gray-500"
                    >
                      No B2C Small Supplies data available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 6A - Exports Section */}
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
            <h3 className="text-lg font-bold">6A - Exports</h3>
            <p className="text-sm opacity-90">
              Details of Outward Supplies made to SEZ/Exports
            </p>
          </div>
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Export Type
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
                      Port Code
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Shipping Bill Number
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Shipping Bill Date
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
                      Cess Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Cess Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      colSpan={12}
                      className="border border-gray-300 p-4 text-center text-sm text-gray-500"
                    >
                      No Export data available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 7 - Nil Rated, Exempted and Non GST Outward Supplies */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              theme === "dark"
                ? "bg-blue-900 border-gray-600 text-white"
                : "bg-blue-800 border-gray-300 text-white"
            }`}
          >
            {/* LEFT */}
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate">6A - Exports</h3>
              <p className="text-sm opacity-90 truncate">
                Details of Outward Supplies made to SEZ/Exports
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
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
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
                    <td className="border border-gray-300 p-2 text-xs">
                      Inter-State supplies to registered persons
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Intra-State supplies to registered persons
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Inter-State supplies to unregistered persons
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Intra-State supplies to unregistered persons
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0.00
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 8A - Tax Liability (Advances Received) */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              theme === "dark"
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

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Place of Supply
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Applicable % of Tax Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Gross Advance Received
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
                  <tr>
                    <td
                      colSpan={11}
                      className="border border-gray-300 p-4 text-center text-sm text-gray-500"
                    >
                      No Advance data available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 8B - Tax Liability (Advances Adjusted) */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              theme === "dark"
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

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Place of Supply
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Applicable % of Tax Rate
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Gross Advance Adjusted
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
                  <tr>
                    <td
                      colSpan={11}
                      className="border border-gray-300 p-4 text-center text-sm text-gray-500"
                    >
                      No Advance Adjusted data available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 9A - Credit/Debit Notes (Registered) */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              theme === "dark"
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

          <div className="p-4">
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
                      Note Number
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Note Date
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Note Value
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Note Type
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Place of Supply
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-center">
                      Reverse Charge
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Original Invoice Number
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Original Invoice Date
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
                  <tr>
                    <td
                      colSpan={19}
                      className="border border-gray-300 p-4 text-center text-sm text-gray-500"
                    >
                      No Credit/Debit Notes data available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>{" "}
        {/* 9
B - Credit/Debit Notes (Unregistered) */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              theme === "dark"
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

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                    }`}
                  >
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Note Number
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Note Date
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-right">
                      Note Value
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Note Type
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Place of Supply
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Original Invoice Number
                    </th>
                    <th className="border border-gray-300 p-2 text-xs font-bold text-left">
                      Original Invoice Date
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
                  <tr>
                    <td
                      colSpan={16}
                      className="border border-gray-300 p-4 text-center text-sm text-gray-500"
                    >
                      No Credit/Debit Notes data available
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {/* 10 - HSN Summary */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              theme === "dark"
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
            <button
              type="button"
              onClick={() => navigate("/app/gst/gstr-1/hsn-summary")}
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
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
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
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      8471
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">
                      Automatic data processing machines
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">NOS</td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      1
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      118,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      100,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      9,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      9,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      8517
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">
                      Telephone sets and other apparatus
                    </td>
                    <td className="border border-gray-300 p-2 text-xs">NOS</td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      1
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      265,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      250,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      15,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                  </tr>
                  {/* Total Row */}
                  <tr
                    className={`font-bold ${
                      theme === "dark" ? "bg-gray-600" : "bg-gray-200"
                    }`}
                  >
                    <td
                      colSpan={3}
                      className="border border-gray-300 p-2 text-xs text-right"
                    >
                      Total:
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      2
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      383,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      350,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      15,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      9,000
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      9,000
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
        {/* 11 - Documents Issued */}
        <div
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${
              theme === "dark"
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
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-100"
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
                      INV001
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      INV002
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      2
                    </td>
                    <td className="border border-gray-300 p-2 text-xs text-right font-mono">
                      0
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 text-xs">
                      Invoices for inward supply from unregistered person
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      -
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      -
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
                      -
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      -
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
                      -
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      -
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
                      -
                    </td>
                    <td className="border border-gray-300 p-2 text-xs font-mono">
                      -
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
          className={`mb-6 rounded-lg border-2 ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        >
          <div
            className={`p-3 border-b-2 ${
              theme === "dark"
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
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-blue-50"
                }`}
              >
                <h4 className="text-sm font-bold mb-2">Total Taxable Value</h4>
                <p className="text-2xl font-bold text-blue-600">
                  ₹ {calculateTotals().totalTaxableValue.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-green-50"
                }`}
              >
                <h4 className="text-sm font-bold mb-2">Total IGST</h4>
                <p className="text-2xl font-bold text-green-600">
                  ₹ {calculateTotals().totalIgst.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-yellow-50"
                }`}
              >
                <h4 className="text-sm font-bold mb-2">Total CGST</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  ₹ {calculateTotals().totalCgst.toLocaleString()}
                </p>
              </div>
              <div
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-purple-50"
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
                className={`p-3 rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-100"
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
                className={`p-3 rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-100"
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
                className={`p-3 rounded ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-100"
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
        className={`p-4 rounded-lg border-l-4 no-print ${
          theme === "dark"
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
    </div>
  );
};

export default GSTR1;
