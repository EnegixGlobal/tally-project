import React, { useState, useRef, useEffect } from "react";
import {
    Upload,
    FileText,
    Download,
    ArrowLeft,
    CheckCircle,
    AlertTriangle,
    RefreshCw,
    FileSpreadsheet,
    ShoppingCart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";

interface ImportedRow {
    [key: string]: any;
    "GSTIN of supplier": string;
    "Trade/Legal name of the Supplier": string;
    "Invoice number": string;
    "Invoice Date": string;
    "Invoice Value (₹)": number;
    "Place of supply": string;
    "Purchase Ledger": string;
    "Rate (%)": number;
    "Taxable Value (₹)": number;
    "Integrated Tax (₹)": number;
    "Central Tax (₹)": number;
    "State/UT tax (₹)": number;
    status: "pending" | "importing" | "imported" | "error";
    errorMessage?: string;
    partyId?: string | number;
    partyMatch: boolean;
}

const PurchaseImport: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [ledgers, setLedgers] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importedRows, setImportedRows] = useState<ImportedRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState<"import" | "preview" | "templates">("import");
    const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });
    const [excelHeaders, setExcelHeaders] = useState<string[]>([]);

    const companyId = localStorage.getItem("company_id") || "";
    const ownerType = localStorage.getItem("supplier") || "";
    const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || "";

    const fetchLedgersAndItems = async () => {
        if (!companyId || !ownerId || !ownerType) return;
        try {
            const [ledgerRes, itemRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/api/ledger`, {
                    params: { company_id: companyId, owner_type: ownerType, owner_id: ownerId }
                }),
                axios.get(`${import.meta.env.VITE_API_URL}/api/stock-items`, {
                    params: { company_id: companyId, owner_type: ownerType, owner_id: ownerId }
                })
            ]);
            setLedgers(Array.isArray(ledgerRes.data) ? ledgerRes.data : []);

            const fetchedItems = itemRes.data?.data || itemRes.data;
            setItems(Array.isArray(fetchedItems) ? fetchedItems : []);
        } catch (err) {
            console.error("Error fetching masters:", err);
        }
    };

    useEffect(() => {
        fetchLedgersAndItems();
    }, [companyId, ownerType, ownerId]);

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

    const formatDate = (dateValue: any): string => {
        if (!dateValue) return "";
        try {
            if (typeof dateValue === "number") {
                const date = new Date((dateValue - 25569) * 86400 * 1000);
                return date.toISOString().split("T")[0];
            }
            if (typeof dateValue === "string") {
                if (dateValue.includes("-")) {
                    const parts = dateValue.split("-");
                    if (parts[0].length === 2) {
                        return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return dateValue;
                }
                if (dateValue.includes("/")) {
                    const parts = dateValue.split("/");
                    if (parts[0].length === 2) {
                        return `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    return dateValue.replace(/\//g, "-");
                }
            }
            return new Date(dateValue).toISOString().split("T")[0];
        } catch {
            return String(dateValue);
        }
    };

    const processFile = async (file: File) => {
        setIsProcessing(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];

            if (!jsonData.length) {
                alert("The Excel file is empty!");
                setIsProcessing(false);
                return;
            }

            const headers = jsonData.length > 0 ? Object.keys(jsonData[0]) : [];
            setExcelHeaders(headers);

            const processedRows: ImportedRow[] = jsonData.map((row) => {
                const rawGstin = String(row["GSTIN of supplier"] || "");
                const rawPartyName = String(row["Trade/Legal name of the Supplier"] || "");
                const rawPlaceOfSupply = String(row["Place of supply"] || "");

                const gstin = rawGstin.toUpperCase().replace(/\s+/g, "").trim();
                const partyName = rawPartyName.replace(/\s+/g, " ").trim();
                const placeOfSupply = rawPlaceOfSupply.toLowerCase().replace(/\s+/g, " ").trim();

                // Strict Matching logic: 1. Name 2. GSTIN 3. State
                const excelName = partyName.toLowerCase();
                const matchedLedgerByName = ledgers.find(l => {
                    const lName = l.name ? String(l.name).toLowerCase().replace(/\s+/g, " ").trim() : "";
                    return lName === excelName;
                });

                let stateMatch = false;
                let gstMatch = false;
                let errorMessage = "";

                if (matchedLedgerByName) {
                    const lGst = matchedLedgerByName.gstNumber ? String(matchedLedgerByName.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                    const lState = matchedLedgerByName.state ? String(matchedLedgerByName.state).toLowerCase().replace(/\s+/g, " ").trim() : "";

                    gstMatch = lGst === gstin;

                    // Specific fix for state matching (e.g. handle "20-Jharkhand" vs "Jharkhand")
                    // Instead of dangerous .includes(), strip leading numbers and hyphens
                    const cleanExcelState = placeOfSupply.replace(/^[0-9]+[\-\s]*/, '').trim();
                    stateMatch = lState === cleanExcelState || lState === placeOfSupply;

                    if (!gstMatch && !stateMatch) {
                        errorMessage = "GSTIN and State mismatch";
                    } else if (!gstMatch) {
                        errorMessage = `GSTIN mismatch (Ledger has: ${lGst || 'Empty'})`;
                    } else if (!stateMatch) {
                        errorMessage = `State mismatch (Ledger has: ${lState || 'Empty'})`;
                    }
                } else {
                    errorMessage = "Supplier Name not found in ledgers";
                }

                let itemMatch = true;
                let matchedItem: any = null;
                const excelItemName = row["Item Name"] ? String(row["Item Name"]).trim().toLowerCase() : "";

                if (excelItemName) {
                    matchedItem = items.find(it => it.name && String(it.name).toLowerCase().trim() === excelItemName);
                    if (!matchedItem) {
                        itemMatch = false;
                        if (!errorMessage) {
                            errorMessage = `Item Name not found in stock items`;
                        } else {
                            errorMessage += ` | Item not found`;
                        }
                    }
                }

                const isFullyMatched = !!(matchedLedgerByName && gstMatch && stateMatch && itemMatch);

                // Match Purchase Ledger column
                const excelPurchaseLedger = row["Purchase Ledger"] ? String(row["Purchase Ledger"]).trim().toLowerCase() : "";
                const matchedPurchaseLedger = excelPurchaseLedger
                    ? ledgers.find(l => l.name && String(l.name).toLowerCase().replace(/\s+/g, " ").trim().includes(excelPurchaseLedger))
                    : null;

                // GSTIN match ID — reuse supplier ledger id when GSTIN matches
                const matchedGstinId = gstMatch ? (matchedLedgerByName?.id || null) : null;
                // Place of supply match ID — reuse supplier ledger id when state matches
                const matchedStateId = stateMatch ? (matchedLedgerByName?.id || null) : null;

                // HSN Code match — uses item's own hsnCode when item is matched
                const excelHsn = row["HSN Code"] ? String(row["HSN Code"]).trim() : "";
                const matchedHsnId = (matchedItem && excelHsn && String(matchedItem.hsnCode || "").trim() === excelHsn)
                    ? matchedItem.id
                    : null;

                return {
                    ...row,
                    _matchedLedgerId: matchedLedgerByName?.id || null,
                    _matchedItemId: (excelItemName && itemMatch) ? matchedItem?.id : null,
                    _matchedPurchaseLedgerId: matchedPurchaseLedger?.id || null,
                    _matchedGstinId: matchedGstinId,
                    _matchedHsnId: matchedHsnId,
                    _matchedStateId: matchedStateId,
                    "GSTIN of supplier": gstin,
                    "Trade/Legal name of the Supplier": partyName,
                    "Invoice number": String(row["Invoice number"] || "").trim(),
                    "Invoice Date": formatDate(row["Invoice Date"]),
                    "Invoice Value (₹)": Number(row["Invoice Value (₹)"] || 0),
                    "Place of supply": String(row["Place of supply"] || "").trim(),
                    "Purchase Ledger": String(row["Purchase Ledger"] || "").trim(),
                    "Rate (%)": Number(row["Rate (%)"] || 0),
                    "Taxable Value (₹)": Number(row["Taxable Value (₹)"] || 0),
                    "Integrated Tax (₹)": Number(row["Integrated Tax (₹)"] || 0),
                    "Central Tax (₹)": Number(row["Central Tax (₹)"] || 0),
                    "State/UT tax (₹)": Number(row["State/UT tax (₹)"] || 0),
                    status: isFullyMatched ? "pending" : "error",
                    errorMessage: isFullyMatched ? undefined : errorMessage,
                    partyId: isFullyMatched ? matchedLedgerByName.id : undefined,
                    partyMatch: isFullyMatched
                };
            });

            setImportedRows(processedRows);
            setActiveTab("preview");
        } catch (err) {
            console.error("File Read Error:", err);
            alert("Invalid Excel file!");
        } finally {
            setIsProcessing(false);
        }
    };

    const saveImportedVouchers = async () => {
        setIsProcessing(true);
        const pendingRows = importedRows.filter(r => r.status === "pending");
        setSaveProgress({ done: 0, total: pendingRows.length });

        const updatedRows = [...importedRows];
        let done = 0;

        try {
            // We'll process rows in small batches or one by one for better UI feedback
            for (let i = 0; i < updatedRows.length; i++) {
                if (updatedRows[i].status !== "pending") continue;

                updatedRows[i].status = "importing";
                setImportedRows([...updatedRows]);

                try {
                    const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/purchase_summary_import`, {
                        rows: [updatedRows[i]],
                        companyId,
                        ownerType,
                        ownerId
                    });

                    if (response.data.success) {
                        updatedRows[i].status = "imported";
                    } else {
                        updatedRows[i].status = "error";
                        updatedRows[i].errorMessage = response.data.errors?.[0] || "Import failed";
                    }
                } catch (error: any) {
                    updatedRows[i].status = "error";
                    updatedRows[i].errorMessage = error.response?.data?.message || error.message || "Failed to save";
                }

                done++;
                setSaveProgress({ done, total: pendingRows.length });
                setImportedRows([...updatedRows]);
            }

            const savedCount = updatedRows.filter(r => r.status === "imported").length;
            const errorRows = updatedRows.filter(r => r.status === "error");

            if (savedCount > 0 && errorRows.length === 0) {
                // ✅ All success
                Swal.fire({
                    icon: "success",
                    title: "All Vouchers Imported!",
                    html: `<b>${savedCount}</b> vouchers saved successfully.`,
                });

            } else if (savedCount > 0 && errorRows.length > 0) {
                Swal.fire({
                    icon: "warning",
                    title: "Partial Import Completed",
                    html: `
            <p><b>${savedCount}</b> vouchers saved successfully.</p>
            <p style="color:red;"><b>${errorRows.length}</b> failed.</p>
            <div style="max-height:150px;overflow:auto;text-align:left;">
                ${errorRows.map((r, i) => `<p>Row ${i + 1}: ${r.errorMessage}</p>`).join("")}
            </div>
        `,
                    width: 600
                });

            } else {
                Swal.fire({
                    icon: "error",
                    title: "Import Failed",
                    html: `
            <p>All rows failed to import.</p>
            <div style="max-height:150px;overflow:auto;text-align:left;">
                ${errorRows.map((r, i) => `<p>Row ${i + 1}: ${r.errorMessage}</p>`).join("")}
            </div>
        `,
                    width: 600
                });
            }
        } catch (err) {
            console.error("Save Error:", err);
            Swal.fire({ icon: "error", title: "Error", text: "Something went wrong while saving." });
        } finally {
            setIsProcessing(false);
        }
    };

    const downloadTemplate = () => {
        const headers = [
            "GSTIN of supplier",
            "Trade/Legal name of the Supplier",
            "Invoice number",
            "Invoice Date",
            "Invoice Value (₹)",
            "Place of supply",
            "Purchase Ledger",
            "Item Name",
            "HSN Code",
            "Batch No",
            "Quantity",
            "Item Rate (₹)",
            "Rate (%)",
            "Taxable Value (₹)",
            "Integrated Tax (₹)",
            "Central Tax (₹)",
            "State/UT tax (₹)"
        ];

        const dummyData = [
            ["20AABCM4621M1ZR", "MONGIA STEEL LIMITED", "MSL/25-26/14420", "16-02-2026", 938100, "Jharkhand", "18% Inter State", "Biscute", "5555", "B-001", 100, 7950, "18", 795000, 0, 71550, 71550]
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([headers, ...dummyData]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase_Import");
        XLSX.writeFile(workbook, "Purchase_Import_Template.xlsx");
    };

    return (
        <div className="pt-[56px] px-4 min-h-screen bg-gray-50 pb-10">
            <div className="w-full xl:w-[98%] mx-auto">
                <div className="mb-8">
                    <div className="flex items-center mb-4">
                        <button
                            onClick={() => navigate("/app/vouchers")}
                            className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <ShoppingCart className="mr-3 text-blue-600" />
                            Purchase Summary Import
                        </h2>
                    </div>
                    <p className="text-sm text-gray-600 ml-12">
                        Import purchase invoices using GST summary layout. Match suppliers automatically by GSTIN or Name.
                    </p>
                </div>

                <div className="border-b border-gray-200 mb-8">
                    <nav className="flex space-x-8">
                        {[
                            { id: "import", label: "Upload File", icon: <Upload size={18} /> },
                            { id: "preview", label: "Preview & Match", icon: <FileText size={18} /> },
                            { id: "templates", label: "Template", icon: <Download size={18} /> },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${activeTab === tab.id
                                    ? "border-blue-600 text-blue-600"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {activeTab === "import" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            className={`border-3 border-dashed rounded-2xl p-16 transition-all duration-300 ${dragActive
                                ? "border-blue-500 bg-blue-50 scale-[1.01]"
                                : "border-gray-200 hover:border-blue-300 hover:bg-gray-50"
                                }`}
                        >
                            <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileSpreadsheet className="h-10 w-10 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Upload Purchase Excel File
                            </h3>
                            <p className="text-gray-500 mb-8 max-w-md mx-auto">
                                Drag and drop your file here, or click the button below to browse your computer.
                            </p>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg font-semibold"
                            >
                                Select File
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                className="hidden"
                            />
                        </div>
                    </div>
                )}

                {activeTab === "preview" && (
                    <div className="space-y-6">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm w-1/4">
                            <p className="font-bold text-red-800 mb-2">
                                Note: Please verify that all the fields below are marked with a green check.
                            </p>

                            <ul className="space-y-1">
                                <li className="flex items-center gap-2">
                                    <span>Supplier Matching</span>
                                    <CheckCircle size={16} className="text-green-600" />
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>GSTIN of supplier</span>
                                    <CheckCircle size={16} className="text-green-600" />
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>Trade/Legal name of the Supplier</span>
                                    <CheckCircle size={16} className="text-green-600" />
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>Place of supply</span>
                                    <CheckCircle size={16} className="text-green-600" />
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>Item Name</span>
                                    <CheckCircle size={16} className="text-green-600" />
                                </li>
                                <li className="flex items-center gap-2">
                                    <span>HSN Code</span>
                                    <CheckCircle size={16} className="text-green-600" />
                                </li>
                            </ul>
                        </div>


                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Import Preview</h3>
                                <p className="text-sm text-gray-500">
                                    Found <span className="font-semibold text-blue-600">{importedRows.length}</span> rows in the file.
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {isProcessing && saveProgress.total > 0 && (
                                    <div className="text-sm font-medium text-blue-600 flex items-center mr-4">
                                        <RefreshCw size={16} className="animate-spin mr-2" />
                                        Saving: {saveProgress.done}/{saveProgress.total}
                                    </div>
                                )}
                                <button
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setImportedRows([]);
                                        setActiveTab("import");
                                    }}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveImportedVouchers}
                                    disabled={isProcessing || !importedRows.some(r => r.status === "pending")}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 shadow-md transition-all flex items-center"
                                >
                                    {isProcessing ? <RefreshCw size={18} className="animate-spin mr-2" /> : <CheckCircle size={18} className="mr-2" />}
                                    Save Vouchers
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="w-full">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Supplier Matching</th>
                                            {excelHeaders.map((header, idx) => (
                                                <th key={idx} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {importedRows.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    {row.status === "imported" ? (
                                                        <span className="flex items-center text-green-600 font-bold text-xs bg-green-50 px-3 py-1 rounded-full w-fit">
                                                            <CheckCircle size={12} className="mr-1" /> Success
                                                        </span>
                                                    ) : row.status === "error" ? (
                                                        <span className="flex items-center text-red-600 font-bold text-xs bg-red-50 px-3 py-1 rounded-full w-fit" title={row.errorMessage}>
                                                            <AlertTriangle size={12} className="mr-1" /> Error
                                                        </span>
                                                    ) : row.status === "importing" ? (
                                                        <span className="flex items-center text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1 rounded-full w-fit">
                                                            <RefreshCw size={12} className="mr-1 animate-spin" /> Saving...
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center text-gray-600 font-bold text-xs bg-gray-100 px-3 py-1 rounded-full w-fit">
                                                            Ready
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className={`font-semibold flex items-center gap-1 ${!row.partyMatch ? "text-red-600" : "text-gray-900"}`}>
                                                            {row["Trade/Legal name of the Supplier"] || "-"}
                                                            {row._matchedLedgerId && (
                                                                <>
                                                                    <span className="text-gray-400 text-xs">({row._matchedLedgerId})</span>
                                                                    <CheckCircle size={13} className="text-green-500 shrink-0" />
                                                                </>
                                                            )}
                                                        </span>
                                                        {!row.partyMatch && <span className="text-[10px] text-red-500">{row.errorMessage}</span>}
                                                    </div>
                                                </td>
                                                {excelHeaders.map((header, idx) => {
                                                    const rawValue = row[header] !== undefined && row[header] !== null ? String(row[header]) : "-";
                                                    const isSupplier = header === "Trade/Legal name of the Supplier";
                                                    const isItem = header === "Item Name";
                                                    const isPurchaseLedger = header === "Purchase Ledger";
                                                    const isGstin = header === "GSTIN of supplier";
                                                    const isHsn = header === "HSN Code";
                                                    const isState = header === "Place of supply";
                                                    const matchedId = isSupplier
                                                        ? row._matchedLedgerId
                                                        : isItem
                                                            ? row._matchedItemId
                                                            : isPurchaseLedger
                                                                ? row._matchedPurchaseLedgerId
                                                                : isGstin
                                                                    ? row._matchedGstinId
                                                                    : isHsn
                                                                        ? row._matchedHsnId
                                                                        : isState
                                                                            ? row._matchedStateId
                                                                            : null;

                                                    return (
                                                        <td key={idx} className="px-6 py-4 text-sm text-gray-700">
                                                            {matchedId ? (
                                                                <span className="flex items-center gap-1 font-medium text-gray-900 bg-green-50/50 px-2 py-1 rounded border border-green-100 w-fit">
                                                                    {rawValue}
                                                                    <span className="text-gray-400 text-[10px] ml-1">({matchedId})</span>
                                                                    <CheckCircle size={13} className="text-green-500 shrink-0" />
                                                                </span>
                                                            ) : (rawValue !== "-" && matchedId === null && (isSupplier || isItem || isPurchaseLedger || isGstin || isHsn || isState)) ? (
                                                                <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded border border-red-100 w-fit" title="Not found in database">
                                                                    {rawValue}
                                                                    <AlertTriangle size={13} className="text-red-500 shrink-0" />
                                                                </span>
                                                            ) : (
                                                                rawValue
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "templates" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 mb-4">GST Purchase Template</h4>
                            <p className="text-gray-600 mb-6">
                                Use this template to import purchase data with full GST details. All highlighted columns are required for a successful import.
                            </p>
                            <ul className="space-y-3 mb-8 text-sm text-gray-600">
                                <li className="flex items-start">
                                    <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5"><CheckCircle size={10} className="text-blue-600" /></div>
                                    <span>Supports <strong>Item Name, Batch, and HSN</strong> details</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5"><CheckCircle size={10} className="text-blue-600" /></div>
                                    <span>Supports <strong>Integrated, Central, and State Tax</strong> columns</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5"><CheckCircle size={10} className="text-blue-600" /></div>
                                    <span>Matches suppliers by <strong>GSTIN</strong> automatically</span>
                                </li>
                                <li className="flex items-start">
                                    <div className="bg-blue-100 p-1 rounded-full mr-2 mt-0.5"><CheckCircle size={10} className="text-blue-600" /></div>
                                    <span>Includes dummy data for testing</span>
                                </li>
                            </ul>
                            <button
                                onClick={downloadTemplate}
                                className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md active:scale-95"
                            >
                                <Download size={20} />
                                <span>Download Template (.xlsx)</span>
                            </button>
                        </div>

                        <div className="bg-blue-600 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="text-xl font-bold mb-4">Tips for Success</h4>
                                <div className="space-y-4">
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                        <p className="text-sm font-bold mb-1">Ledger Matching</p>
                                        <p className="text-xs text-blue-100 opacity-90">
                                            Make sure your Supplier names in Excel match exactly with your Ledger names if GSTIN is not provided.
                                        </p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                        <p className="text-sm font-bold mb-1">Date Format</p>
                                        <p className="text-xs text-blue-100 opacity-90">
                                            Dates should be in DD-MM-YYYY or YYYY-MM-DD format for best compatibility.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute -bottom-10 -right-10 opacity-10">
                                <FileSpreadsheet size={200} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseImport;
