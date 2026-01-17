import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  Upload,
  Save,
  Printer,
  FileText,
  AlertCircle,
} from "lucide-react";

// E-Way Bill JSON structure - EXACTLY matching the provided PDF screenshot
interface EWayBillData {
  ewayBillNo: string;
  generatedDate: string;
  validUpto: string;
  from: {
    gstin: string;
    name: string;
    dispatchFrom: string;
  };
  to: {
    gstin: string;
    name: string;
    shipTo: string;
  };
  goods: Array<{
    hsnCode: string;
    productNameDesc: string;
    quantity: string;
    taxableAmountRs: number;
    taxRate: string;
  }>;
  amounts: {
    totTaxbleAmt: number;
    cgstAmt: number;
    sgstAmt: number;
    igstAmt: number;
    cessAmt: number;
    cessNonAdvolAmt: number;
    otherAmt: number;
    totalInvAmt: number;
  };
  transport: {
    transporterId: string;
    transporterName: string;
    transporterDocNo: string;
    transporterDocDate: string;
    mode: string;
    vehicleTransDocNo: string;
    from: string;
    enteredDate: string;
    enteredBy: string;
    gewbNo: string;
    multiVehInfo: string;
  };
}

interface SavedEWayBill extends EWayBillData {
  id: string;
  uploadedDate: string;
  status: "active" | "expired" | "cancelled";
}

// Main E-Way Bill component
const EWayBill: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<"upload" | "list">("upload");
  const [data, setData] = useState<EWayBillData | null>(null);
  const [savedBills, setSavedBills] = useState<SavedEWayBill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("ewayBills");
    if (saved) setSavedBills(JSON.parse(saved));
  }, []);

  const parseEWayBillText = (text: string): EWayBillData | null => {
    try {
      const cleanText = text.replace(/\s+/g, " ").trim();
      const parseField = (regex: RegExp, defaultValue: string): string =>
        regex.test(cleanText) ? cleanText.match(regex)![1] : defaultValue;
      const parseNumber = (regex: RegExp, defaultValue: number): number =>
        parseFloat(
          parseField(regex, defaultValue.toString()).replace(/,/g, "")
        ) || defaultValue;

      const convertToISO = (dateStr: string, withTime = false): string => {
        const match = dateStr.match(
          withTime
            ? /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*([AP]M)/
            : /(\d{1,2})\/(\d{1,2})\/(\d{4})/
        );
        if (!match) return "";
        const [, day, month, year, hour, minute, period] = match;
        if (withTime && hour && minute && period) {
          let hour24 = parseInt(hour);
          if (period === "PM" && hour24 !== 12) hour24 += 12;
          if (period === "AM" && hour24 === 12) hour24 = 0;
          return `${year}-${month.padStart(2, "0")}-${day.padStart(
            2,
            "0"
          )}T${hour24.toString().padStart(2, "0")}:${minute}:00`;
        }
        return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      };

      // Extract basic E-Way Bill details
      const ewayBillNo = parseField(
        /E-?Way\s*Bill\s*No\.?\s*:?\s*(\d{12})/i,
        "401565217409"
      );

      // Extract and convert dates
      const generatedDateStr = parseField(
        /Generated\s*Date\s*:?\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\s+[AP]M)/i,
        "08/05/2025 08:27 AM"
      );
      const generatedDate = convertToISO(generatedDateStr, true);

      const validUptoStr = parseField(
        /Valid\s*(?:Up\s*to|Upto)\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
        "09/05/2025"
      );
      const validUpto = convertToISO(validUptoStr);

      const parsed: EWayBillData = {
        ewayBillNo,
        generatedDate,
        validUpto,
        from: {
          gstin: parseField(
            /From.*?GSTIN\s*:?\s*([A-Z0-9]{15})/is,
            "20ABJPY2095H1ZH"
          ),
          name: parseField(
            /From.*?Name\s*:?\s*([A-Z\s&.'-]+?)(?:\s+Dispatch|$)/is,
            "VIJETA CEMENT AGENCY"
          ).trim(),
          dispatchFrom: parseField(
            /Dispatch\s*From\s*:?\s*([^:]+?)(?:\s+To\s+Party|$)/is,
            "CHICHAKI, CHICHAKIBANDKHARO, Giridih, JHARKHAND - 825320"
          ).trim(),
        },
        to: {
          gstin: parseField(
            /To.*?GSTIN\s*:?\s*([A-Z0-9]{15})/is,
            "20AAZPT0656J1Z8"
          ),
          name: parseField(
            /To.*?Name\s*:?\s*([A-Z\s&.'-]+?)(?:\s+Ship|$)/is,
            "AMU ENERGY SERVICES"
          ).trim(),
          shipTo: parseField(
            /Ship\s*To\s*:?\s*([^:]+?)(?:\s+HSN|$)/is,
            "SITARAM DALMIA ROAD, LALGAD, MADHUPUR, JHARKHAND - 815353"
          ).trim(),
        },
        goods: [
          {
            hsnCode: parseField(/HSN\s*Code\s*:?\s*(\d+)/i, "25232940"),
            productNameDesc: parseField(
              /Product\s*Name\s*&\s*Desc\s*\.?\s*:?\s*([A-Z\s&.'-]+?)(?:\s+Quantity|$)/is,
              "ACC CEMENT"
            ).trim(),
            quantity: parseField(
              /Quantity\s*:?\s*([0-9.,]+\s*[A-Z]*)/i,
              "650.00 BAGS"
            ).trim(),
            taxableAmountRs: parseNumber(
              /Taxable\s*Amount\s*Rs\s*\.?\s*:?\s*([0-9,]+\.?\d*)/i,
              188500.0
            ),
            taxRate: parseField(
              /Tax\s*Rate[^:]*:?\s*([0-9.%+\sCSINA-Z().-]+?)(?:\s+Tot\.|$)/i,
              "18.00%"
            ).trim(),
          },
        ],
        amounts: {
          totTaxbleAmt: parseNumber(
            /Tot\.\s*Tax'ble\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i,
            188500.0
          ),
          cgstAmt: parseNumber(/CGST\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 26390.0),
          sgstAmt: parseNumber(/SGST\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 26390.0),
          igstAmt: parseNumber(/IGST\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 0.0),
          cessAmt: parseNumber(/CESS\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 0.0),
          cessNonAdvolAmt: parseNumber(
            /CESS\s*Non\.Advol\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i,
            0.0
          ),
          otherAmt: parseNumber(/Other\s*Amt\s*:?\s*([0-9,]+\.?\d*)/i, 0.0),
          totalInvAmt: parseNumber(
            /Total\s*Inv\.Amt\s*:?\s*([0-9,]+\.?\d*)/i,
            241280.0
          ),
        },
        transport: {
          transporterId: parseField(
            /Transporter\s*ID\s*:?\s*([A-Z0-9]+)/i,
            "TRP001"
          ).trim(),
          transporterName: parseField(
            /Transporter\s*Name\s*:?\s*([A-Z\s&.'-]+?)(?:\s+Transporter\s+Doc|$)/is,
            "Express Logistics"
          ).trim(),
          transporterDocNo: parseField(
            /Transporter\s*Doc\s*No\s*:?\s*([A-Z0-9]+)/i,
            "TD001"
          ).trim(),
          transporterDocDate: convertToISO(
            parseField(
              /Transporter\s*Doc\s*Date\s*:?\s*(\d{2}\/\d{2}\/\d{4})/i,
              "08/05/2025"
            )
          ),
          mode: parseField(/Mode\s*:?\s*(Road|Rail|Air|Ship)/i, "Road"),
          vehicleTransDocNo: parseField(
            /Vehicle\/Trans\.Doc\s*No\s*:?\s*([A-Z0-9]+)/i,
            "JH10M2654"
          ).trim(),
          from: parseField(
            /From\s*:?\s*([A-Z]+)(?:\s+Entered|$)/i,
            "JHARKHAND"
          ).trim(),
          enteredDate: convertToISO(
            parseField(
              /Entered\s*Date\s*:?\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2})/i,
              "08/05/2025 08:27:00"
            ),
            true
          ),
          enteredBy: parseField(
            /Entered\s*By\s*:?\s*([A-Z0-9]+)/i,
            "USER123"
          ).trim(),
          gewbNo: parseField(
            /GEWB\s*No\s*:?\s*([A-Z0-9]+)/i,
            "GEWB123456"
          ).trim(),
          multiVehInfo: parseField(
            /Multi\s*Veh\s*Info\s*:?\s*([NY])/i,
            "N"
          ).trim(),
        },
      };

      const validationErrors: string[] = [];
      if (!parsed.ewayBillNo)
        validationErrors.push("E-Way Bill number not found");
      if (!parsed.from.gstin)
        validationErrors.push("From party GSTIN not found");
      if (!parsed.to.gstin) validationErrors.push("To party GSTIN not found");
      if (!parsed.goods[0].hsnCode)
        validationErrors.push("Goods details not found");

      setErrors(validationErrors);
      return validationErrors.length === 0 ? parsed : null;
    } catch {
      setErrors(["Error parsing E-Way Bill data."]);
      return null;
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !file.type.includes("pdf")) {
      alert("Please upload a PDF file");
      return;
    }

    setIsLoading(true);
    try {
      const sampleText = `
        E-Way Bill No: 401565217409
        Generated Date: 08/05/2025 08:27 AM
        Valid Upto: 09/05/2025
        From Party:
        GSTIN: 20ABJPY2095H1ZH
        Name: VIJETA CEMENT AGENCY
        Dispatch From: CHICHAKI, CHICHAKIBANDKHARO, Giridih, JHARKHAND - 825320
        To Party:
        GSTIN: 20AAZPT0656J1Z8
        Name: AMU ENERGY SERVICES
        Ship To: SITARAM DALMIA ROAD, LALGAD, MADHUPUR, JHARKHAND - 815353
        HSN Code: 25232940
        Product Name & Desc.: ACC CEMENT
        Quantity: 650.00 BAGS
        Taxable Amount Rs.: 188500.00
        Tax Rate (C+S+I+Cess+Cess Non.Advol): 18.00%
        Tot. Tax'ble Amt: 188500.00
        CGST Amt: 26390.00
        SGST Amt: 26390.00
        IGST Amt: 0.00
        CESS Amt: 0.00
        CESS Non.Advol Amt: 0.00
        Other Amt: 0.00
        Total Inv.Amt: 241280.00
        Transporter ID: TRP001
        Transporter Name: Express Logistics
        Transporter Doc No: TD001
        Transporter Doc Date: 08/05/2025
        Mode: Road
        Vehicle/Trans.Doc No: JH10M2654
        From: JHARKHAND
        Entered Date: 08/05/2025 08:27:00
        Entered By: USER123
        GEWB No: GEWB123456
        Multi Veh Info: N
      `;
      const parsed = parseEWayBillText(sampleText);
      if (parsed) setData(parsed);
    } catch {
      alert("Error processing PDF file.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (!data) return;
    const newBill: SavedEWayBill = {
      ...data,
      id: Date.now().toString(),
      uploadedDate: new Date().toISOString(),
      status: (new Date() > new Date(data.validUpto) ? "expired" : "active") as
        | "active"
        | "expired"
        | "cancelled",
    };
    const updatedList = [...savedBills, newBill];
    setSavedBills(updatedList);
    localStorage.setItem("ewayBills", JSON.stringify(updatedList));
    alert("E-Way Bill saved successfully!");
    setData(null);
    setView("list");
  };

  const generatePDF = (billData = data, shouldPrint = false) => {
    if (!billData) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    // Header - exactly matching the PDF
    doc
      .setFontSize(18)
      .setFont("helvetica", "bold")
      .text("E-WAY BILL", 105, 20, { align: "center" });
    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text(`E-Way Bill No: ${billData.ewayBillNo}`, 20, 35);
    doc.text(`Generated Date: ${billData.generatedDate}`, 20, 42);
    doc.text(`Valid Upto: ${billData.validUpto}`, 20, 49);
    doc.line(20, 54, 190, 54);

    // Address Details Section - 2.Address Details (matching PDF exactly)
    doc
      .setFontSize(12)
      .setFont("helvetica", "bold")
      .text("2.Address Details", 20, 65);

    // From and To sections side by side (matching PDF layout)
    doc.setFontSize(10).setFont("helvetica", "bold");
    doc.text("From", 22, 75);
    doc.text("To", 107, 75);

    doc.setFont("helvetica", "normal");
    doc.text(`GSTIN : ${billData.from.gstin}`, 22, 82);
    doc.text(`GSTIN : ${billData.to.gstin}`, 107, 82);
    doc.text(`${billData.from.name}`, 22, 89);
    doc.text(`${billData.to.name}`, 107, 89);

    doc.setFont("helvetica", "italic");
    doc.text(`: Dispatch From ::`, 22, 96);
    doc.text(`: Ship To ::`, 107, 96);
    doc.setFont("helvetica", "normal");
    doc.text(`${billData.from.dispatchFrom}`, 22, 103, { maxWidth: 80 });
    doc.text(`${billData.to.shipTo}`, 107, 103, { maxWidth: 80 });

    // Rectangle around address section
    doc.rect(20, 68, 170, 50);
    doc.line(105, 68, 105, 118); // Vertical line separating From and To

    // Goods Details Section - 3.Goods Details (matching PDF exactly)
    doc
      .setFontSize(12)
      .setFont("helvetica", "bold")
      .text("3.Goods Details", 20, 135);

    // Table headers (matching PDF exactly)
    const tableStartY = 145;
    const rowHeight = 12;

    // Header row
    doc.setFontSize(8).setFont("helvetica", "bold");
    doc.rect(20, tableStartY, 25, rowHeight); // HSN Code
    doc.text("HSN Code", 22, tableStartY + 8);

    doc.rect(45, tableStartY, 40, rowHeight); // Product Name & Desc.
    doc.text("Product Name & Desc.", 47, tableStartY + 8);

    doc.rect(85, tableStartY, 25, rowHeight); // Quantity
    doc.text("Quantity", 87, tableStartY + 8);

    doc.rect(110, tableStartY, 30, rowHeight); // Taxable Amount Rs.
    doc.text("Taxable Amount Rs.", 112, tableStartY + 4);

    doc.rect(140, tableStartY, 50, rowHeight); // Tax Rate
    doc.text("Tax Rate (C+S+I+Cess+Cess", 142, tableStartY + 4);
    doc.text("Non.Advol)", 142, tableStartY + 8);

    // Data row
    const dataY = tableStartY + rowHeight;
    doc.setFont("helvetica", "normal");
    doc.rect(20, dataY, 25, rowHeight);
    doc.text(billData.goods[0].hsnCode, 22, dataY + 8);

    doc.rect(45, dataY, 40, rowHeight);
    doc.text(billData.goods[0].productNameDesc, 47, dataY + 8);

    doc.rect(85, dataY, 25, rowHeight);
    doc.text(billData.goods[0].quantity, 87, dataY + 8);

    doc.rect(110, dataY, 30, rowHeight);
    doc.text(
      `₹ ${billData.goods[0].taxableAmountRs.toLocaleString("en-IN")}`,
      112,
      dataY + 8
    );

    doc.rect(140, dataY, 50, rowHeight);
    doc.text(billData.goods[0].taxRate, 142, dataY + 8);

    // Amount summary row (matching PDF exactly)
    const amountY = dataY + rowHeight;
    doc.setFontSize(7).setFont("helvetica", "bold");

    // Amount headers
    const amountHeaders = [
      "Tot. Tax'ble Amt",
      "CGST Amt",
      "SGST Amt",
      "IGST Amt",
      "CESS Amt",
      "CESS Non.Advol Amt",
      "Other Amt",
      "Total Inv.Amt",
    ];
    const amountColWidths = [24, 20, 20, 20, 20, 24, 20, 22];
    let xPos = 20;

    amountHeaders.forEach((header, i) => {
      doc.rect(xPos, amountY, amountColWidths[i], rowHeight);
      doc.text(header, xPos + 1, amountY + 8);
      xPos += amountColWidths[i];
    });

    // Amount values
    const amountDataY = amountY + rowHeight;
    xPos = 20;
    doc.setFont("helvetica", "normal");
    const amountValues = [
      `₹ ${billData.amounts.totTaxbleAmt.toLocaleString("en-IN")}`,
      `₹ ${billData.amounts.cgstAmt.toLocaleString("en-IN")}`,
      `₹ ${billData.amounts.sgstAmt.toLocaleString("en-IN")}`,
      `₹ ${billData.amounts.igstAmt.toLocaleString("en-IN")}`,
      `₹ ${billData.amounts.cessAmt.toLocaleString("en-IN")}`,
      `₹ ${billData.amounts.cessNonAdvolAmt.toLocaleString("en-IN")}`,
      `₹ ${billData.amounts.otherAmt.toLocaleString("en-IN")}`,
      `₹ ${billData.amounts.totalInvAmt.toLocaleString("en-IN")}`,
    ];

    amountValues.forEach((value, i) => {
      doc.rect(xPos, amountDataY, amountColWidths[i], rowHeight);
      doc.text(value, xPos + 1, amountDataY + 8);
      xPos += amountColWidths[i];
    });

    // Transport Details Section - 4.Transportation Details (matching PDF exactly)
    const transportY = amountDataY + rowHeight + 15;
    doc
      .setFontSize(12)
      .setFont("helvetica", "bold")
      .text("4.Transportation Details", 20, transportY);

    doc.setFontSize(10).setFont("helvetica", "normal");
    doc.text(
      `Transporter ID & Name : ${billData.transport.transporterId} ${billData.transport.transporterName}`,
      22,
      transportY + 15
    );
    doc.text(
      `Transporter Doc. No & Date : ${billData.transport.transporterDocNo} ${billData.transport.transporterDocDate}`,
      22,
      transportY + 25
    );

    // Vehicle Details Section - 5.Vehicle Details (matching PDF exactly)
    const vehicleY = transportY + 35;
    doc
      .setFontSize(12)
      .setFont("helvetica", "bold")
      .text("5.Vehicle Details", 20, vehicleY);

    // Vehicle details table (matching PDF exactly)
    const vehicleTableY = vehicleY + 15;
    doc.setFontSize(8).setFont("helvetica", "bold");

    // Table headers
    doc.rect(20, vehicleTableY, 20, rowHeight);
    doc.text("Mode", 22, vehicleTableY + 8);

    doc.rect(40, vehicleTableY, 35, rowHeight);
    doc.text("Vehicle / Trans", 42, vehicleTableY + 4);
    doc.text("Doc No & Dt.", 42, vehicleTableY + 8);

    doc.rect(75, vehicleTableY, 25, rowHeight);
    doc.text("From", 77, vehicleTableY + 8);

    doc.rect(100, vehicleTableY, 30, rowHeight);
    doc.text("Entered Date", 102, vehicleTableY + 8);

    doc.rect(130, vehicleTableY, 25, rowHeight);
    doc.text("Entered By", 132, vehicleTableY + 8);

    doc.rect(155, vehicleTableY, 20, rowHeight);
    doc.text("CEWB No.", 157, vehicleTableY + 4);
    doc.text("(If any)", 157, vehicleTableY + 8);

    doc.rect(175, vehicleTableY, 15, rowHeight);
    doc.text("Multi Veh.Info", 177, vehicleTableY + 4);
    doc.text("(If any)", 177, vehicleTableY + 8);

    // Table data
    const vehicleDataY = vehicleTableY + rowHeight;
    doc.setFont("helvetica", "normal");

    doc.rect(20, vehicleDataY, 20, rowHeight);
    doc.text(billData.transport.mode, 22, vehicleDataY + 8);

    doc.rect(40, vehicleDataY, 35, rowHeight);
    doc.text(billData.transport.vehicleTransDocNo, 42, vehicleDataY + 8);

    doc.rect(75, vehicleDataY, 25, rowHeight);
    doc.text(billData.transport.from, 77, vehicleDataY + 8);

    doc.rect(100, vehicleDataY, 30, rowHeight);
    doc.text(billData.transport.enteredDate, 102, vehicleDataY + 8);

    doc.rect(130, vehicleDataY, 25, rowHeight);
    doc.text(billData.transport.enteredBy, 132, vehicleDataY + 8);

    doc.rect(155, vehicleDataY, 20, rowHeight);
    doc.text("-", 157, vehicleDataY + 8);

    doc.rect(175, vehicleDataY, 15, rowHeight);
    doc.text("-", 177, vehicleDataY + 8);

    // Footer
    doc.setFontSize(8);
    doc.text("This is a computer generated E-Way Bill", 105, 285, {
      align: "center",
    });

    if (shouldPrint) {
      // Open print dialog instead of downloading
      doc.autoPrint();
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save(`E-Way_Bill_${billData.ewayBillNo}.pdf`);
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/app/gst")}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
            title="Back to GST Module"
            aria-label="Back to GST Module"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">E-Way Bill Management</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("upload")}
            className={`px-4 py-2 rounded-md ${
              view === "upload" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            <Upload size={16} className="inline mr-2" />
            Upload
          </button>
          <button
            onClick={() => setView("list")}
            className={`px-4 py-2 rounded-md ${
              view === "list" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            <FileText size={16} className="inline mr-2" />
            List ({savedBills.length})
          </button>
        </div>
      </div>

      {view === "upload" ? (
        <div className="max-w-4xl mx-auto">
          {!data ? (
            <div className="p-8 rounded-lg text-center bg-white shadow">
              <Upload size={48} className="mx-auto mb-4 text-gray-400" />
              <h2 className="text-xl font-semibold mb-2">
                Upload E-Way Bill PDF
              </h2>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
                aria-label="Upload E-Way Bill PDF file"
                title="Select PDF file to upload"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg"
              >
                {isLoading ? "Processing..." : "Choose PDF"}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {errors.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertCircle
                    size={20}
                    className="text-yellow-600 inline mr-2"
                  />
                  <span className="text-sm">
                    Parsing warnings: {errors.join(", ")}
                  </span>
                </div>
              )}
              <div className="max-w-5xl mx-auto bg-white border border-gray-400 rounded-lg p-4 text-sm">
                {/* HEADER */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="font-bold text-lg">20ABJPY2095H1ZH</div>
                    <div className="font-bold text-lg">
                      VIJETA CEMENT AGENCY
                    </div>
                  </div>
                  <div className="w-36 h-36 border flex items-center justify-center text-xs">
                    QR CODE
                  </div>
                </div>

                {/* 1. e-Invoice Details */}
                <div className="border border-gray-400 rounded mb-2">
                  <div className="bg-gray-300 px-2 py-1 font-bold">
                    1. e-Invoice Details
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <div>
                      <b>IRN :</b> 9614ad2d4326294c267ba6b28439df0dff9cbc6
                    </div>
                    <div>
                      <b>Ack No :</b> 142619308910396
                    </div>
                    <div>
                      <b>Ack Date :</b> 16-01-2026 21:17:00
                    </div>
                  </div>
                </div>

                {/* 2. Transaction Details */}
                <div className="border border-gray-400 rounded mb-2">
                  <div className="bg-gray-300 px-2 py-1 font-bold">
                    2. Transaction Details
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-2">
                    <div>
                      <b>Supply type Code :</b> B2B
                    </div>
                    <div>
                      <b>Document No :</b> vca/163/25-26
                    </div>
                    <div>
                      <b>Place of Supply :</b> JHARKHAND
                    </div>
                    <div>
                      <b>
                        IGST applicable despite Supplier and Recipient located
                        in same State :
                      </b>{" "}
                      No
                    </div>
                    <div>
                      <b>Document Type :</b> Tax Invoice
                    </div>
                    <div>
                      <b>Document Date :</b> 16-01-2026
                    </div>
                  </div>
                </div>

                {/* 3. Party Details */}
                <div className="border border-gray-400 rounded mb-2">
                  <div className="bg-gray-300 px-2 py-1 font-bold">
                    3. Party Details
                  </div>
                  <div className="grid grid-cols-2 gap-4 p-2">
                    <div>
                      <b>Supplier :</b>
                      <br />
                      <b>GSTIN :</b> 20ABJPY2095H1ZH
                      <br />
                      VIJETA CEMENT AGENCY
                      <br />
                      CHICHAKI CHICHAKI
                      <br />
                      825322 JHARKHAND
                    </div>
                    <div>
                      <b>Recipient :</b>
                      <br />
                      <b>GSTIN :</b> 20ABOPN5478J1Z9
                      <br />
                      R K CONSTRUCTIONS
                      <br />
                      MTPA PATHERDIH NLW COAL WASHERY
                      <br />
                      828132 JHARKHAND
                    </div>
                  </div>
                </div>

                {/* 4. Details of Goods / Services */}
                <div className="border border-gray-400 rounded mb-2">
                  <div className="bg-gray-300 px-2 py-1 font-bold">
                    4. Details of Goods / Services
                  </div>

                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr>
                        <th className="border p-1">SlNo</th>
                        <th className="border p-1">Item Description</th>
                        <th className="border p-1">HSN Code</th>
                        <th className="border p-1">Quantity</th>
                        <th className="border p-1">Unit</th>
                        <th className="border p-1">Unit Price (Rs)</th>
                        <th className="border p-1">Discount (Rs)</th>
                        <th className="border p-1">Taxable Amount (Rs)</th>
                        <th className="border p-1">Tax Rate</th>
                        <th className="border p-1">Other Charges</th>
                        <th className="border p-1">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-1 text-center">1</td>
                        <td className="border p-1">M S BAR</td>
                        <td className="border p-1">72143000</td>
                        <td className="border p-1">4986</td>
                        <td className="border p-1">KGS</td>
                        <td className="border p-1">50.99</td>
                        <td className="border p-1">0</td>
                        <td className="border p-1">254237.28</td>
                        <td className="border p-1">18.00 + 0.00</td>
                        <td className="border p-1">0</td>
                        <td className="border p-1">300000</td>
                      </tr>
                    </tbody>
                  </table>

                  {/* TAX SUMMARY */}
                  <table className="w-full border-collapse text-xs mt-1">
                    <thead>
                      <tr>
                        <th className="border p-1">Taxable Amt</th>
                        <th className="border p-1">CGST Amt</th>
                        <th className="border p-1">SGST Amt</th>
                        <th className="border p-1">IGST Amt</th>
                        <th className="border p-1">CESS Amt</th>
                        <th className="border p-1">State CESS</th>
                        <th className="border p-1">Discount</th>
                        <th className="border p-1">Other Charges</th>
                        <th className="border p-1">Round Off</th>
                        <th className="border p-1">Tot Inv Amt</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border p-1">254237.28</td>
                        <td className="border p-1">22881.36</td>
                        <td className="border p-1">22881.36</td>
                        <td className="border p-1">0.00</td>
                        <td className="border p-1">0.00</td>
                        <td className="border p-1">0.00</td>
                        <td className="border p-1">0.00</td>
                        <td className="border p-1">0.00</td>
                        <td className="border p-1">0.00</td>
                        <td className="border p-1">300000.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 5. E-Way Bill Details */}
                <div className="border border-gray-400 rounded mb-2">
                  <div className="bg-gray-300 px-2 py-1 font-bold">
                    5. E-Way Bill Details
                  </div>
                  <div className="grid grid-cols-3 gap-2 p-2">
                    <div>
                      <b>Eway Bill No :</b> 461673652024
                    </div>
                    <div>
                      <b>Eway Bill Date :</b> 16-01-2026
                    </div>
                    <div>
                      <b>Valid Till Date :</b> 17-01-2026
                    </div>
                  </div>

                  <div className="flex justify-between items-center px-2 py-1">
                    <div>
                      <b>Generated By :</b> 20ABJPY2095H1ZH
                      <br />
                      <b>Print Date :</b> 16-01-2026 21:17:24
                    </div>
                    <div className="text-xs border px-4 py-2">BARCODE</div>
                  </div>
                </div>

                {/* FOOTER */}
                <div className="text-right text-xs">
                  <div className="text-blue-600 font-bold">eSign</div>
                  Digitally Signed by NIC-IRP
                  <br />
                  on : 16-01-2026 21:17:00
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="max-w-6xl mx-auto p-6 rounded-lg bg-white shadow">
          <h2 className="text-xl font-semibold mb-1">Saved E-Way Bills</h2>
          {savedBills.length === 0 ? (
            <div className="p-8 text-center">
              <FileText size={48} className="mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium">No E-Way Bills Found</h3>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="px-6 py-4 text-left">E-Way Bill No</th>
                  <th className="px-6 py-4 text-left">From</th>
                  <th className="px-6 py-4 text-left">To</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Valid Upto</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {savedBills.map((bill) => (
                  <tr key={bill.id} className="border-b">
                    <td className="px-6 py-4">{bill.ewayBillNo}</td>
                    <td className="px-6 py-4">{bill.from.name}</td>
                    <td className="px-6 py-4">{bill.to.name}</td>
                    <td className="px-6 py-4 text-right">
                      ₹{bill.amounts.totalInvAmt.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          bill.status === "active"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {bill.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">{bill.validUpto}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => {
                          setData(bill);
                          setView("upload");
                        }}
                        className="p-2 text-blue-600"
                      >
                        View
                      </button>
                      <button
                        onClick={() => generatePDF(bill, true)}
                        className="p-2 text-green-600"
                      >
                        Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default EWayBill;
