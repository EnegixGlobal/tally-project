
import React, { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Download,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

interface ImportedVoucher {
  id: string;
  date: string;
  voucherType: string;
  voucherNumber: string;
  partyName: string;
  amount: number;
  narration: string;
  items?: ImportedItem[];
  status: "pending" | "imported" | "error";
  errorMessage?: string;
}

interface ImportedItem {
  itemName: string;
  quantity: number;
  rate: number;
  amount: number;
  hsnCode?: string;
  gstRate?: number;
}

interface VoucherTemplate {
  name: string;
  type: string;
  description: string;
  fields: string[];
  sampleData: Record<string, string | number>[];
}

const VoucherImport: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importedVouchers, setImportedVouchers] = useState<ImportedVoucher[]>(
    []
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("sales");
  const [activeTab, setActiveTab] = useState<
    "import" | "preview" | "templates"
  >("import");

  const voucherTemplates: VoucherTemplate[] = [
    {
      name: "Sales Voucher Template",
      type: "sales",
      description: "Import sales invoices with item details",
      fields: [
        "Date",
        "Voucher No",
        "Party Name",
        "Item Name",
        "Quantity",
        "Rate",
        "Amount",
        "HSN Code",
        "GST Rate",
        "Narration",
      ],
      sampleData: [
        {
          Date: "15/01/2024",
          "Voucher No": "SAL001",
          "Party Name": "ABC Electronics",
          "Item Name": "Laptop HP",
          Quantity: 2,
          Rate: 45000,
          Amount: 90000,
          "HSN Code": "8471",
          "GST Rate": 18,
          Narration: "Sales to ABC Electronics",
        },
      ],
    },
    {
      name: "Purchase Voucher Template",
      type: "purchase",
      description: "Import purchase invoices with supplier details",
      fields: [
        "Date",
        "Voucher No",
        "Supplier Name",
        "Item Name",
        "Quantity",
        "Rate",
        "Amount",
        "HSN Code",
        "GST Rate",
        "Narration",
      ],
      sampleData: [
        {
          Date: "15/01/2024",
          "Voucher No": "PUR001",
          "Supplier Name": "Tech Suppliers Ltd",
          "Item Name": "Mobile Phone",
          Quantity: 5,
          Rate: 25000,
          Amount: 125000,
          "HSN Code": "8517",
          "GST Rate": 18,
          Narration: "Purchase from Tech Suppliers",
        },
      ],
    },
    {
      name: "Payment Voucher Template",
      type: "payment",
      description: "Import payment vouchers",
      fields: [
        "Date",
        "Voucher No",
        "Paid To",
        "Amount",
        "Payment Mode",
        "Narration",
      ],
      sampleData: [
        {
          Date: "15/01/2024",
          "Voucher No": "PAY001",
          "Paid To": "Office Rent",
          Amount: 25000,
          "Payment Mode": "Cash",
          Narration: "Monthly office rent payment",
        },
      ],
    },
    {
      name: "Receipt Voucher Template",
      type: "receipt",
      description: "Import receipt vouchers",
      fields: [
        "Date",
        "Voucher No",
        "Received From",
        "Amount",
        "Receipt Mode",
        "Narration",
      ],
      sampleData: [
        {
          Date: "15/01/2024",
          "Voucher No": "REC001",
          "Received From": "Customer Payment",
          Amount: 50000,
          "Receipt Mode": "Bank",
          Narration: "Payment received from customer",
        },
      ],
    },
    
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;

    const validTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!validTypes.includes(file.type)) {
      alert("Please select a valid Excel (.xlsx, .xls) or CSV file");
      return;
    }

    setSelectedFile(file);
    processFile(file);
  };

const processFile = async (file: File) => {
  setIsProcessing(true);

  console.log("📌 Selected Voucher Type :", selectedTemplate);

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    console.log("📌 Uploaded Excel Data:", jsonData);

    const processedVouchers: ImportedVoucher[] = (
      jsonData as Record<string, unknown>[]
    ).map((row: Record<string, unknown>, index: number) => {
      try {
        const getString = (key: string): string => String(row[key] || "");
        const getNumber = (key: string): number =>
          typeof row[key] === "number"
            ? (row[key] as number)
            : parseFloat(String(row[key] || 0)) || 0;

        return {
          id: `import_${index + 1}`,
          date: formatDate(row["Date"] || row["date"]),
          voucherType: selectedTemplate, // 👈 Dropdown wale type se set
          voucherNumber:
            getString("Voucher No") ||
            getString("voucher_no") ||
            `AUTO${index + 1}`,
          partyName:
            getString("Party Name") ||
            getString("Supplier Name") ||
            getString("Paid To") ||
            getString("Received From") ||
            "Unknown",
          amount: getNumber("Amount") || getNumber("amount"),
          narration: getString("Narration") || "",

          items:
            selectedTemplate === "sales" ||
            selectedTemplate === "purchase"
              ? [
                  {
                    itemName: getString("Item Name"),
                    quantity: getNumber("Quantity"),
                    rate: getNumber("Rate"),
                    amount: getNumber("Amount"),
                    hsnCode: getString("HSN Code"),
                    gstRate: getNumber("GST Rate"),
                  },
                ]
              : undefined,

          status: "pending",
        };
      } catch (err) {
        console.error("❌ Row Parse Failed", err);
        return {
          id: `import_${index + 1}`,
          date: "",
          voucherType: selectedTemplate,
          voucherNumber: `ERROR${index + 1}`,
          partyName: "Error",
          amount: 0,
          narration: "",
          status: "error",
        };
      }
    });

    setImportedVouchers(processedVouchers);
    setActiveTab("preview");
  } catch (err) {
    console.error("❌ File Processing Failed:", err);
    alert("Invalid Excel Format!");
  } finally {
    setIsProcessing(false);
  }
};



  const formatDate = (dateValue: unknown): string => {
    if (!dateValue) return "";

    try {
      // Handle Excel date numbers
      if (typeof dateValue === "number") {
        const date = new Date((dateValue - 25569) * 86400 * 1000);
        return date.toISOString().split("T")[0];
      }

      // Handle string dates
      if (typeof dateValue === "string") {
        const parts = dateValue.split("/");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }

      return new Date(dateValue as string | number | Date)
        .toISOString()
        .split("T")[0];
    } catch {
      return "";
    }
  };


const saveImportedVouchers = async () => {
  setIsProcessing(true);

  try {
    const validVouchers = importedVouchers.filter(v => v.status !== "error");

    const userType = localStorage.getItem("userType") || "employee";
    const userId = Number(localStorage.getItem("user_id")) || 1;
    const companyId = Number(localStorage.getItem("company_id")) || 1;

    for (const voucher of validVouchers) {
      console.log("▶ Saving Voucher:", voucher);

      let apiUrl = "";
      const payload: any = {
        number: voucher.voucherNumber,
        date: voucher.date,
        narration: voucher.narration,
        subtotal: voucher.amount,
        total: voucher.amount,
        type: voucher.voucherType,

        // 🔹 Auto Assign user details
        companyId,
        ownerType: userType,
        ownerId: userId,
      };

      // 🔹 Items Mapping for Sales / Purchase Only
      if (voucher.items && (voucher.voucherType === "sales" || voucher.voucherType === "purchase")) {
        payload.entries = voucher.items.map(item => ({
          itemId: 1, // TODO → Auto Item Mapping Later
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          cgstRate: item.gstRate ? item.gstRate / 2 : 0,
          sgstRate: item.gstRate ? item.gstRate / 2 : 0,
          igstRate: 0,
          hsnCode: item.hsnCode || "",
          discount: 0,
        }));

        payload.mode = "item-invoice";
      }

      // 🔹 API URL Detection
      switch (voucher.voucherType) {
        case "sales":
          apiUrl = "http://localhost:5000/api/sales-vouchers";
          break;
        case "purchase":
          apiUrl = "http://localhost:5000/api/purchase-vouchers";
          break;
        case "payment":
          apiUrl = "http://localhost:5000/api/vouchers";
          break;
        case "receipt":
          apiUrl = "http://localhost:5000/api/receipt-vouchers";
          break;
        case "bank":
          apiUrl = "http://localhost:5000/api/bank-vouchers";
          break;
        default:
          console.warn("❓ Unknown type:", voucher.voucherType);
          continue;
      }

      console.log("📤 Sending →", apiUrl);
      console.log("📦 Payload:", payload);

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      console.log("📥 Response:", result);

      if (result.success) {
        voucher.status = "imported";
      } else {
        voucher.status = "error";
        voucher.errorMessage = result.message;
      }
    }

    setImportedVouchers([...importedVouchers]);
    alert("✨ All vouchers saved successfully!");
  } catch (error) {
    console.error("❌ Save failed:", error);
    alert("Error occurred while saving vouchers!");
  } finally {
    setIsProcessing(false);
  }
};



  const downloadTemplate = (template: VoucherTemplate) => {
    const ws = XLSX.utils.json_to_sheet(template.sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `${template.name.replace(" ", "_")}.xlsx`);
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportedVouchers([]);
    setActiveTab("import");
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            title="Back to Vouchers"
            type="button"
            onClick={() => navigate("/app/vouchers")}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">
            Import Vouchers
          </h2>
        </div>
        <p className="text-sm text-gray-600">
          Import vouchers from Excel or CSV files - data will auto-fill like
          Tally
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            {
              id: "import",
              label: "Import Data",
              icon: <Upload className="h-4 w-4" />,
            },
            {
              id: "preview",
              label: "Preview & Save",
              icon: <FileText className="h-4 w-4" />,
            },
            {
              id: "templates",
              label: "Download Templates",
              icon: <Download className="h-4 w-4" />,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setActiveTab(tab.id as "import" | "preview" | "templates")
              }
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Import Tab */}
      {activeTab === "import" && (
        <div className="space-y-6">
          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Voucher Type
            </label>
            <select
              title="Select Voucher Type"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="sales">Sales Voucher</option>
              <option value="purchase">Purchase Voucher</option>
              <option value="payment">Payment Voucher</option>
              <option value="receipt">Receipt Voucher</option>
              <option value="journal">Journal Voucher</option>
            </select>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Drop your Excel/CSV file here, or click to browse
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Supports .xlsx, .xls, and .csv files up to 10MB
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Choose File
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={(e) =>
                e.target.files?.[0] && handleFileSelect(e.target.files[0])
              }
              className="hidden"
              title="Select file for import"
            />
          </div>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="bg-gray-50 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileSpreadsheet className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {selectedFile.name}
                    </div>
                    <div className="text-sm text-gray-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-blue-700">Processing file...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Tab */}
      {activeTab === "preview" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Preview Imported Vouchers
              </h3>
              <p className="text-sm text-gray-600">
                Review the data before saving to your accounts
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={resetImport}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Start Over
              </button>
              <button
                onClick={saveImportedVouchers}
                disabled={isProcessing || importedVouchers.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                {isProcessing ? "Saving..." : "Save All Vouchers"}
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Ready to Import
                </span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-2">
                {importedVouchers.filter((v) => v.status === "pending").length}
              </div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-900">Errors</span>
              </div>
              <div className="text-2xl font-bold text-red-600 mt-2">
                {importedVouchers.filter((v) => v.status === "error").length}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-900">Imported</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-2">
                {importedVouchers.filter((v) => v.status === "imported").length}
              </div>
            </div>
          </div>

          {/* Vouchers Table */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Voucher No
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Party
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Narration
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {importedVouchers.map((voucher) => (
                    <tr key={voucher.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            voucher.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : voucher.status === "imported"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {voucher.status === "pending"
                            ? "Ready"
                            : voucher.status === "imported"
                            ? "Imported"
                            : "Error"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {voucher.date}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {voucher.voucherNumber}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 capitalize">
                        {voucher.voucherType}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {voucher.partyName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        ₹{voucher.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {voucher.narration}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Download Import Templates
            </h3>
            <p className="text-sm text-gray-600">
              Use these templates to format your data for import
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {voucherTemplates.map((template) => (
              <div
                key={template.type}
                className="border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {template.name}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {template.description}
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Excel
                  </span>
                </div>

                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-900 mb-2">
                    Required Fields:
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {template.fields.map((field, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-800"
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => downloadTemplate(template)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full justify-center"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Template</span>
                </button>
              </div>
            ))}
          </div>

          {/* Import Guidelines */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="font-medium text-gray-900 mb-3">
              Import Guidelines
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Use the exact column headers as shown in templates</li>
              <li>• Dates should be in DD/MM/YYYY format</li>
              <li>• Amount fields should contain only numeric values</li>
              <li>
                • Party names should match existing ledger names for
                auto-mapping
              </li>
              <li>
                • Item names should match existing stock items for auto-mapping
              </li>
              <li>• GST rates should be in percentage (e.g., 18 for 18%)</li>
              <li>• Remove any extra columns not mentioned in the template</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoucherImport;
