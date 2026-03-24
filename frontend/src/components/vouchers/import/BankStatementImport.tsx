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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";

interface ImportedRow {
    Date: string;
    Particulars: string;
    Narration: string;
    Debit: number;
    Credit: number;
    Balance: number | string;
    "Reference number": string;
    SimulatedVoucherNumber?: string;
    VoucherTargetType: "payment" | "receipt" | "contra" | "journal" | "error";
    particularsMatch: boolean;
    status: "pending" | "importing" | "imported" | "error";
    errorMessage?: string;
    particularsId?: string | number;
}

const BankStatementImport: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [ledgers, setLedgers] = useState<any[]>([]);
    const [excelBankName, setExcelBankName] = useState<string>("");
    const [excelBankMatch, setExcelBankMatch] = useState<boolean>(false);
    const [excelBankId, setExcelBankId] = useState<string | number | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [importedRows, setImportedRows] = useState<ImportedRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState<"import" | "preview" | "templates">("import");
    const [isMatchingDB, setIsMatchingDB] = useState(false);
    const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });

    const companyId = localStorage.getItem("company_id") || "";
    const ownerType = localStorage.getItem("supplier") || "";
    const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || "";

    useEffect(() => {
        fetchLedgers();
    }, [companyId, ownerType, ownerId]);

    const fetchLedgers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/ledger`, {
                params: {
                    company_id: companyId,
                    owner_type: ownerType,
                    owner_id: ownerId
                },
            });
            setLedgers(response.data);
        } catch (error) {
            console.error("Error fetching ledgers:", error);
        }
    };



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

    const formatDate = (dateValue: unknown): string => {
        if (!dateValue) return "";
        try {
            if (typeof dateValue === "number") {
                const date = new Date((dateValue - 25569) * 86400 * 1000);
                return date.toISOString().split("T")[0];
            }
            if (typeof dateValue === "string") {
                const parts = dateValue.split("/");
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, "0");
                    const month = parts[1].padStart(2, "0");
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                }
            }
            return new Date(dateValue as string).toISOString().split("T")[0];
        } catch {
            return "";
        }
    };

    const processFile = async (file: File) => {
        setIsProcessing(true);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

            let headerRowIndex = -1;
            let extractedBankName = "";

            for (let i = 0; i < Math.min(20, rawData.length); i++) {
                const row = rawData[i];
                if (!row) continue;

                // Check for bank
                for (let j = 0; j < row.length; j++) {
                    const cell = String(row[j] || "").trim();
                    const lowerCell = cell.toLowerCase();
                    if (lowerCell === "bank :-" || lowerCell === "bank:-" || lowerCell === "bank:") {
                        if (row[j + 1]) extractedBankName = String(row[j + 1]).trim();
                    } else if (lowerCell.startsWith("bank :-")) {
                        extractedBankName = cell.substring(7).trim();
                    } else if (lowerCell.startsWith("bank:")) {
                        extractedBankName = cell.substring(5).trim();
                    }
                }

                // Check for header row
                const rowString = row.filter(Boolean).map(String).join(" ").toLowerCase();
                if (rowString.includes("date") && rowString.includes("particular") && (rowString.includes("debit") || rowString.includes("credit"))) {
                    headerRowIndex = i;
                }
            }

            if (!extractedBankName) {
                alert("Bank name not found at the top of the Excel (format: 'Bank :- Your Bank Name')");
                setIsProcessing(false);
                return;
            }

            if (headerRowIndex === -1) {
                alert("Could not find table headers (Date, Particulars, Debit, Credit)");
                setIsProcessing(false);
                return;
            }

            setExcelBankName(extractedBankName);
            const matchedBankLedger = ledgers.find((l) => l.name.toLowerCase() === extractedBankName.toLowerCase());
            setExcelBankMatch(!!matchedBankLedger);
            setExcelBankId(matchedBankLedger ? matchedBankLedger.id : null);

            const headers = rawData[headerRowIndex] as string[];
            const dataRows = rawData.slice(headerRowIndex + 1);

            const jsonData: any[] = dataRows.map(row => {
                let obj: any = {};
                headers.forEach((h, i) => {
                    if (h) obj[h.trim()] = row[i];
                });
                return obj;
            });

            const processedRows: ImportedRow[] = jsonData
                .filter((row) => Number(row.Debit || 0) > 0 || Number(row.Credit || 0) > 0)
                .map((row) => {
                    const debit = Number(row.Debit || 0);
                    const credit = Number(row.Credit || 0);
                    let voucherCol = String(row.Voucher || "").toLowerCase().trim();
                    let targetType: ImportedRow["VoucherTargetType"] = "error";

                    if (debit > 0) {
                        targetType = voucherCol === "contra" ? "contra" : "payment";
                    } else if (credit > 0) {
                        targetType = voucherCol === "journal" ? "journal" : "receipt";
                    }

                    const particularsName = String(row.Particulars || row.Particular || "").trim();
                    const matchedParticulars = ledgers.find(
                        (l) => l.name.toLowerCase() === particularsName.toLowerCase()
                    );
                    const isParticularsMatch = !!matchedParticulars;

                    let initialStatus: "pending" | "error" = "pending";
                    let initialError = "";

                    if (!isParticularsMatch) {
                        initialStatus = "error";
                        initialError = `Ledger '${particularsName}' not found.`;
                    }
                    if (!matchedBankLedger) {
                        initialStatus = "error";
                        initialError += (initialError ? " " : "") + `Bank '${extractedBankName}' not found.`;
                    }

                    return {
                        Date: formatDate(row.Date),
                        Particulars: particularsName,
                        Narration: String(row.Narration || "").trim(),
                        Debit: debit,
                        Credit: credit,
                        Balance: row.Balance || row.balance || "",
                        "Reference number": String(row["Reference number"] || row["Reference No"] || row["Reference Number"] || row["Refrance number"] || "").trim(),
                        VoucherTargetType: targetType,
                        particularsMatch: isParticularsMatch,
                        particularsId: matchedParticulars ? matchedParticulars.id : undefined,
                        status: initialStatus,
                        errorMessage: initialError,
                    };
                });

            setIsMatchingDB(true);

            try {
                const types = ["payment", "receipt", "contra", "journal"];
                const nextDocs: Record<string, string> = {};

                // Use first date for FY prefix calculation
                const firstDate = processedRows[0]?.Date || new Date().toISOString().split('T')[0];

                await Promise.all(types.map(async (type) => {
                    try {
                        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/vouchers/next-number`, {
                            params: {
                                company_id: companyId,
                                owner_type: ownerType,
                                owner_id: ownerId,
                                voucherType: type,
                                date: firstDate
                            }
                        });
                        if (res.data.success) {
                            nextDocs[type] = res.data.voucherNumber;
                        }
                    } catch (e) {
                        console.error(`Failed to fetch next number for ${type}`);
                    }
                }));

                const trackers = { ...nextDocs };

                const finalRows = processedRows.map(row => {
                    if (row.VoucherTargetType === "error") return row;

                    const currentNum = trackers[row.VoucherTargetType];

                    if (currentNum) {
                        row.SimulatedVoucherNumber = currentNum;

                        const parts = currentNum.split("/");
                        if (parts.length === 3) {
                            const seq = parseInt(parts[2], 10);
                            if (!isNaN(seq)) {
                                parts[2] = String(seq + 1).padStart(6, "0");
                                trackers[row.VoucherTargetType] = parts.join("/");
                            }
                        }
                    }
                    return row;
                });

                setImportedRows(finalRows);
            } catch (err) {
                console.error("Failed to sequence voucher numbers", err);
                setImportedRows(processedRows);
            }

            setActiveTab("preview");
            setTimeout(() => {
                setIsMatchingDB(false);
            }, 1500);
        } catch (err) {
            console.error("File Read Error:", err);
            alert("Invalid Excel file!");
        } finally {
            setIsProcessing(false);
        }
    };

    const saveImportedVouchers = async () => {
        setIsProcessing(true);
        const bankLedgerName = ledgers.find(l => l.name.toLowerCase() === excelBankName.toLowerCase())?.name || excelBankName;
        const pendingRows = importedRows.filter(r => r.status === "pending");
        setSaveProgress({ done: 0, total: pendingRows.length });

        const updatedRows = [...importedRows];

        // Mark all pending as "importing" to show spinner per row
        updatedRows.forEach((r, i) => {
            if (r.status === "pending") updatedRows[i] = { ...r, status: "importing" };
        });
        setImportedRows([...updatedRows]);

        let done = 0;

        for (let i = 0; i < importedRows.length; i++) {
            const row = importedRows[i];
            if (row.status !== "pending") continue;

            let endpoint = "";
            let payload: any = {};

            if (row.VoucherTargetType === "payment") {
                endpoint = "/api/payment_import";
                payload = { rows: [{ Date: row.Date, "Paid To": row.Particulars, "Payment Mode": bankLedgerName, Amount: row.Debit, Narration: row.Narration, "Reference No": row["Reference number"] }], companyId, ownerType, ownerId };
            } else if (row.VoucherTargetType === "receipt") {
                endpoint = "/api/receipt_import";
                payload = { rows: [{ Date: row.Date, "Paid To": row.Particulars, "Payment Mode": bankLedgerName, Amount: row.Credit, Narration: row.Narration, "Reference No": row["Reference number"] }], companyId, ownerType, ownerId };
            } else if (row.VoucherTargetType === "contra") {
                endpoint = "/api/contra_import";
                payload = { rows: [{ Date: row.Date, "Debit Ledger": row.Particulars, "Credit Ledger": bankLedgerName, Amount: row.Debit, Narration: row.Narration, "Reference No": row["Reference number"] }], companyId, ownerType, ownerId };
            } else if (row.VoucherTargetType === "journal") {
                endpoint = "/api/journal_import";
                payload = { rows: [{ Date: row.Date, "Debit Ledger": bankLedgerName, "Credit Ledger": row.Particulars, Amount: row.Credit, Narration: row.Narration, "Reference No": row["Reference number"] }], companyId, ownerType, ownerId };
            } else {
                continue;
            }

            try {
                const res = await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, payload);
                updatedRows[i] = { ...updatedRows[i], status: res.data.success ? "imported" : "error", errorMessage: res.data.success ? undefined : "Backend error" };
            } catch (err: any) {
                updatedRows[i] = { ...updatedRows[i], status: "error", errorMessage: err.response?.data?.message || err.message || "Failed" };
            }

            done++;
            setSaveProgress({ done, total: pendingRows.length });
            setImportedRows([...updatedRows]);
        }

        setIsProcessing(false);

        const savedCount = updatedRows.filter(r => r.status === "imported").length;
        const errorCount = updatedRows.filter(r => r.status === "error").length;

        if (savedCount > 0) {
            Swal.fire({
                icon: "success",
                title: "Import Successful!",
                html: `<b>${savedCount}</b> voucher${savedCount > 1 ? "s" : ""} saved successfully!${errorCount > 0 ? `<br/><span style="color:#e53e3e">${errorCount} rows had errors.</span>` : ""
                    }`,
                showConfirmButton: true,
                confirmButtonText: "Great!",
                confirmButtonColor: "#2563eb",
                timer: 4000,
                timerProgressBar: true,
            });
        } else if (errorCount > 0) {
            Swal.fire({ icon: "error", title: "Import Failed", text: `${errorCount} rows had errors. Please check and try again.` });
        }
    };

    const downloadTemplate = () => {
        const aoa = [
            ["Bank :-", "Enter Your Bank Name Here"],
            [],
            ["Date", "Particulars", "Narration", "Debit", "Credit", "Balance", "Voucher", "Reference number"],
            ["15/01/2024", "Office Expenses", "Paid for stationery", 5000, 0, 45000, "Payment", "CHQ12345"],
            ["16/01/2024", "Customer A", "Received payment", 0, 10000, 55000, "Receipt", "NEFT6789"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(aoa);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "Bank_Statement_Template.xlsx");
    };

    const resetImport = () => {
        setSelectedFile(null);
        setImportedRows([]);
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
                        Intelligent Bank Statement Import
                    </h2>
                </div>
                <p className="text-sm text-gray-600">
                    Upload bank statements in Excel format and auto-route to Payment, Receipt, Contra, and Journal vouchers.
                </p>
            </div>

            <div className="border-b border-gray-200 mb-6">
                <nav className="flex space-x-8">
                    {[
                        { id: "import", label: "Import Data", icon: <Upload className="h-4 w-4" /> },
                        { id: "preview", label: "Preview & Save", icon: <FileText className="h-4 w-4" /> },
                        { id: "templates", label: "Download Templates", icon: <Download className="h-4 w-4" /> },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as "import" | "preview" | "templates")}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeTab === tab.id
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

            {activeTab === "import" && (
                <div className="space-y-6">
                    <div className="bg-white p-6 border rounded-lg shadow-sm">
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mt-2 ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Drop your Bank Statement Excel/CSV here
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Format: Bank name must be at the top prefixed by "Bank :-"
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
                                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                                className="hidden"
                                title="Select file for import"
                            />
                        </div>
                    </div>
                    {isProcessing && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
                            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                            <span className="text-blue-700">Processing file...</span>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "preview" && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                Preview Bank Statement Rows
                            </h3>
                            <p className="text-sm text-gray-600">
                                Review data before saving. Vouchers will be routed automatically.
                            </p>
                            {excelBankName && (
                                <div className={`mt-3 px-4 py-3 rounded-xl border-2 flex items-center space-x-3 ${excelBankMatch ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}`}>
                                    <div className={`p-2 rounded-full ${excelBankMatch ? "bg-green-100" : "bg-red-100"}`}>
                                        {excelBankMatch ? <CheckCircle className="h-6 w-6 text-green-600" /> : <AlertTriangle className="h-6 w-6 text-red-600" />}
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Bank Ledger Extracted</p>
                                        <p className={`text-lg font-bold ${excelBankMatch ? "text-green-800" : "text-red-700"}`}>
                                            {excelBankName}
                                            {excelBankId && <span className="text-sm font-normal ml-2 opacity-70">(ID: {excelBankId})</span>}
                                        </p>
                                        <p className={`text-xs mt-0.5 ${excelBankMatch ? "text-green-600" : "text-red-600"}`}>
                                            {excelBankMatch ? "✓ Matched in your ledgers" : "✗ Not found in ledgers"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col space-y-3">
                            {isProcessing && saveProgress.total > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-blue-800 flex items-center space-x-2">
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            <span>Saving vouchers... {saveProgress.done} / {saveProgress.total}</span>
                                        </span>
                                        <span className="text-xs text-blue-600">{Math.round((saveProgress.done / saveProgress.total) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(saveProgress.done / saveProgress.total) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="flex space-x-3">
                                <button
                                    onClick={resetImport}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Start Over
                                </button>
                                <button
                                    onClick={saveImportedVouchers}
                                    disabled={isProcessing || importedRows.filter(r => r.status === "pending").length === 0}
                                    className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors font-medium"
                                >
                                    {isProcessing ? (
                                        <><RefreshCw className="h-4 w-4 animate-spin" /><span>Saving...</span></>
                                    ) : (
                                        <><CheckCircle className="h-4 w-4" /><span>Save All Vouchers ({importedRows.filter(r => r.status === "pending").length} ready)</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {isMatchingDB ? (
                        <div className="bg-white border border-gray-200 rounded-lg p-16 flex flex-col items-center justify-center space-y-4 shadow-sm">
                            <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />
                            <h3 className="text-xl font-semibold text-gray-900">Verifying Ledgers...</h3>
                            <p className="text-gray-500 text-center max-w-sm">
                                Securely scanning your Excel file and matching ledgers against your live database.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-5 w-5 text-blue-600" />
                                        <span className="font-medium text-blue-900">Ready</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-600 mt-2">
                                        {importedRows.filter((v) => v.status === "pending").length}
                                    </div>
                                </div>
                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        <span className="font-medium text-red-900">Errors</span>
                                    </div>
                                    <div className="text-2xl font-bold text-red-600 mt-2">
                                        {importedRows.filter((v) => v.status === "error").length}
                                    </div>
                                </div>
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <div className="flex items-center space-x-2">
                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                        <span className="font-medium text-green-900">Imported</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-600 mt-2">
                                        {importedRows.filter((v) => v.status === "imported").length}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route To</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vch No.</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Particulars</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Narration</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase text-right">Debit</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase text-right">Credit</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase text-right">Balance</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ref No</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {importedRows.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm">
                                                        {row.status === "error" ? (
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Error</span>
                                                        ) : row.status === "imported" ? (
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Done</span>
                                                        ) : row.status === "importing" ? (
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center space-x-1"><RefreshCw className="h-3 w-3 animate-spin" /><span>Saving...</span></span>
                                                        ) : (
                                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Ready</span>
                                                        )}
                                                        {row.errorMessage && <div className="text-xs text-red-600 mt-1">{row.errorMessage}</div>}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-semibold capitalize text-blue-700">
                                                        {row.VoucherTargetType}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 font-mono font-medium">
                                                        {row.SimulatedVoucherNumber || "-"}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{row.Date}</td>
                                                    <td className="px-4 py-3 text-sm font-medium">
                                                        <div className="flex items-center space-x-2">
                                                            <span className={row.particularsMatch ? "text-gray-900 font-medium" : "text-red-500 font-bold"}>
                                                                {row.Particulars} {row.particularsId && <span className="text-gray-500 ml-1">({row.particularsId})</span>}
                                                            </span>
                                                            {row.particularsMatch ? (
                                                                <CheckCircle className="h-4 w-4 text-green-500" title="Ledger Matched" />
                                                            ) : (
                                                                <AlertTriangle className="h-4 w-4 text-red-500" title="Ledger Not Found" />
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 truncate max-w-xs">{row.Narration}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">{row.Debit > 0 ? row.Debit : "-"}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{row.Credit > 0 ? row.Credit : "-"}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-800 font-medium">{row.Balance ? row.Balance : "-"}</td>
                                                    <td className="px-4 py-3 text-sm">{row["Reference number"]}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {activeTab === "templates" && (
                <div className="space-y-6">
                    <div className="border border-gray-200 rounded-lg p-6 max-w-lg">
                        <h4 className="font-semibold text-gray-900 mb-2">Bank Statement Template</h4>
                        <div className="text-sm text-gray-600 mb-4 space-y-2">
                            <p><strong>Top of file:</strong> Put <code className="bg-gray-100 p-1">Bank :- Your Bank Name</code> at the very top.</p>
                            <p><strong>Required Columns:</strong> Date, Particulars, Narration, Debit, Credit, Balance, Voucher, Reference number</p>
                        </div>
                        <button
                            onClick={downloadTemplate}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" />
                            <span>Download Template</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankStatementImport;
