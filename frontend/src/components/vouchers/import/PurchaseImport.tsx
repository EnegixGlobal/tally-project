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

interface ImportedItem {
    "Item Name": string;
    "HSN Code": string;
    "Batch No": string;
    "Quantity": number;
    "Item Rate (₹)": number;
    "Rate (%)": number;
    "Taxable Value (₹)": number;
    "Integrated Tax (₹)": number;
    "Central Tax (₹)": number;
    "State/UT tax (₹)": number;
    _matchedItemId?: string | number;
    _matchedHsnId?: string | number;
    _matchedBatchFound?: boolean;
    calculationWarning?: string;
}

interface GroupedVoucher {
    id: string;
    "GSTIN of supplier": string;
    "Trade/Legal name of the Supplier": string;
    "Invoice number": string;
    "Invoice Date": string;
    "Invoice Value (₹)": number;
    "Place of supply": string;
    "Purchase Ledger": string;
    status: "pending" | "importing" | "imported" | "error";
    errorMessage?: string;
    partyId?: string | number;
    partyMatch: boolean;
    _matchedLedgerId?: string | number;
    _matchedPurchaseLedgerId?: string | number;
    _matchedGstinId?: string | number;
    _matchedStateId?: string | number;
    items: ImportedItem[];
}

const PurchaseImport: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [ledgers, setLedgers] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);
    const [groupedVouchers, setGroupedVouchers] = useState<GroupedVoucher[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [activeTab, setActiveTab] = useState<"import" | "preview" | "templates">("import");
    const [saveProgress, setSaveProgress] = useState({ done: 0, total: 0 });

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

            const fetchedItems = (itemRes.data as any)?.data || itemRes.data;
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

            const voucherGroups: { [key: string]: GroupedVoucher } = {};
            let lastHeader: any = null;

            jsonData.forEach((row, index) => {
                // Forward-filling logic: if header is missing, use last known header
                const invoiceNo = String(row["Invoice number"] || (lastHeader ? lastHeader["Invoice number"] : "")).trim();
                const invoiceDate = formatDate(row["Invoice Date"] || (lastHeader ? lastHeader["Invoice Date"] : ""));
                const rawGstin = String(row["GSTIN of supplier"] || (lastHeader ? lastHeader["GSTIN of supplier"] : ""));
                const rawPartyName = String(row["Trade/Legal name of the Supplier"] || (lastHeader ? lastHeader["Trade/Legal name of the Supplier"] : ""));
                const rawPlaceOfSupply = String(row["Place of supply"] || (lastHeader ? lastHeader["Place of supply"] : ""));
                const rawPurchaseLedger = String(row["Purchase Ledger"] || (lastHeader ? lastHeader["Purchase Ledger"] : ""));
                const rawInvoiceValue = row["Invoice Value (₹)"] !== undefined ? row["Invoice Value (₹)"] : (lastHeader ? lastHeader["Invoice Value (₹)"] : 0);

                const gstin = rawGstin.toUpperCase().replace(/\s+/g, "").trim();
                const partyName = rawPartyName.replace(/\s+/g, " ").trim();
                const placeOfSupply = rawPlaceOfSupply.toLowerCase().replace(/\s+/g, " ").trim();

                const groupKey = `${gstin}-${invoiceNo}-${invoiceDate}`;

                // Update lastHeader for the next row
                lastHeader = {
                    "GSTIN of supplier": rawGstin,
                    "Trade/Legal name of the Supplier": rawPartyName,
                    "Invoice number": invoiceNo,
                    "Invoice Date": invoiceDate,
                    "Place of supply": rawPlaceOfSupply,
                    "Purchase Ledger": rawPurchaseLedger,
                    "Invoice Value (₹)": rawInvoiceValue
                };

                if (!voucherGroups[groupKey]) {
                    // Match Header context
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
                        const cleanExcelState = placeOfSupply.replace(/^[0-9]+[\-\s]*/, '').trim();
                        stateMatch = lState === cleanExcelState || lState === placeOfSupply;

                        if (!gstMatch && !stateMatch) errorMessage = "GSTIN and State mismatch";
                        else if (!gstMatch) errorMessage = `GSTIN mismatch (Ledger has: ${lGst || 'Empty'})`;
                        else if (!stateMatch) errorMessage = `State mismatch (Ledger has: ${lState || 'Empty'})`;
                    } else {
                        errorMessage = "Supplier Name not found in ledgers";
                    }

                    const excelPurchaseLedger = rawPurchaseLedger ? String(rawPurchaseLedger).trim().toLowerCase() : "";
                    const matchedPurchaseLedger = excelPurchaseLedger
                        ? ledgers.find(l => l.name && String(l.name).toLowerCase().replace(/\s+/g, " ").trim().includes(excelPurchaseLedger))
                        : null;

                    voucherGroups[groupKey] = {
                        id: `v-${index}`,
                        "GSTIN of supplier": gstin,
                        "Trade/Legal name of the Supplier": partyName,
                        "Invoice number": invoiceNo,
                        "Invoice Date": invoiceDate,
                        "Invoice Value (₹)": Number(rawInvoiceValue),
                        "Place of supply": String(rawPlaceOfSupply).trim(),
                        "Purchase Ledger": String(rawPurchaseLedger).trim(),
                        status: errorMessage ? "error" : "pending",
                        errorMessage,
                        partyMatch: !errorMessage,
                        _matchedLedgerId: matchedLedgerByName?.id || null,
                        _matchedPurchaseLedgerId: matchedPurchaseLedger?.id || null,
                        _matchedGstinId: gstMatch ? (matchedLedgerByName?.id || null) : null,
                        _matchedStateId: stateMatch ? (matchedLedgerByName?.id || null) : null,
                        items: []
                    };
                }

                // Process Item Level
                let matchedItem: any = null;
                const excelItemName = row["Item Name"] ? String(row["Item Name"]).trim().toLowerCase() : "";
                if (excelItemName) {
                    matchedItem = items.find(it => it.name && String(it.name).toLowerCase().trim() === excelItemName);
                }

                const excelHsn = row["HSN Code"] ? String(row["HSN Code"]).trim() : "";
                const matchedHsnId = (matchedItem && excelHsn && String(matchedItem.hsnCode || "").trim() === excelHsn)
                    ? matchedItem.id
                    : null;

                const excelBatch = row["Batch No"] ? String(row["Batch No"]).trim().toLowerCase() : "";
                const matchedBatchFound = matchedItem && Array.isArray(matchedItem.batches) && matchedItem.batches.some((b: any) => (b.batchName || "").trim().toLowerCase() === excelBatch);

                if (!matchedItem && excelItemName) {
                    voucherGroups[groupKey].status = "error";
                    voucherGroups[groupKey].errorMessage = (voucherGroups[groupKey].errorMessage || "") + (voucherGroups[groupKey].errorMessage ? " | " : "") + `Item '${row["Item Name"]}' not found`;
                }

                const qty = Number(row["Quantity"] || 0);
                const rate = Number(row["Item Rate (₹)"] || 0);
                const taxableVal = Number(row["Taxable Value (₹)"] || 0) || (qty * rate);
                const totalRate = Number(row["Rate (%)"] || 0);

                let igst = Number(row["Integrated Tax (₹)"] || 0);
                let cgst = Number(row["Central Tax (₹)"] || 0);
                let sgst = Number(row["State/UT tax (₹)"] || 0);

                let calculationWarning = "";
                const expectedTaxable = qty * rate;
                if (qty > 0 && rate > 0 && Math.abs(expectedTaxable - taxableVal) > 0.1) {
                    calculationWarning = `Calculation Error: Qty (${qty}) * Rate (${rate}) should be ${expectedTaxable}. Found ${taxableVal}.`;
                }

                // Auto-calculate taxes if they are zero or missing, or if rate is provided
                if (totalRate > 0 && igst === 0 && cgst === 0 && sgst === 0) {
                    const excelPos = placeOfSupply.toLowerCase().trim();
                    const excelPosCode = excelPos.match(/^[0-9]+/)?.[0] || excelPos.match(/\(([0-9]+)\)/)?.[1] || "";
                    const excelPosName = excelPos.replace(/[0-9\(\)\-]+/g, "").trim();

                    const supplierGstin = String(row["GSTIN of supplier"] || "").trim();
                    const supplierGstinCode = supplierGstin.slice(0, 2);

                    const matchedLedger = ledgers.find(l => l.id === voucherGroups[groupKey]._matchedLedgerId);
                    const ledgerState = matchedLedger?.state ? String(matchedLedger.state).toLowerCase().trim() : "";

                    const isIntra = (supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode) ||
                        (ledgerState && (excelPosName.includes(ledgerState) || ledgerState.includes(excelPosName)));

                    if (isIntra) {
                        cgst = (taxableVal * (totalRate / 2)) / 100;
                        sgst = (taxableVal * (totalRate / 2)) / 100;
                        igst = 0;
                    } else {
                        igst = (taxableVal * totalRate) / 100;
                        cgst = 0;
                        sgst = 0;
                    }
                } else if (totalRate > 0) {
                    // Check for discrepancy if tax IS provided
                    const expectedTax = (taxableVal * totalRate) / 100;
                    const foundTax = igst + cgst + sgst;
                    if (Math.abs(expectedTax - foundTax) > 0.5) {
                        calculationWarning += (calculationWarning ? " | " : "") + `Tax Discrepancy: Expected total tax ${expectedTax}, found ${foundTax}.`;
                    }
                }

                if (excelItemName || taxableVal > 0) {
                    voucherGroups[groupKey].items.push({
                        "Item Name": String(row["Item Name"] || "").trim(),
                        "HSN Code": excelHsn,
                        "Batch No": String(row["Batch No"] || "").trim(),
                        "Quantity": qty,
                        "Item Rate (₹)": rate,
                        "Rate (%)": totalRate,
                        "Taxable Value (₹)": taxableVal,
                        "Integrated Tax (₹)": igst,
                        "Central Tax (₹)": cgst,
                        "State/UT tax (₹)": sgst,
                        _matchedItemId: matchedItem?.id || null,
                        _matchedHsnId: matchedHsnId,
                        _matchedBatchFound: matchedBatchFound,
                        calculationWarning
                    });

                    // Update parent voucher totals to be consistent with items
                    const currentItems = voucherGroups[groupKey].items;
                    const newSubtotal = currentItems.reduce((sum, it) => sum + it["Taxable Value (₹)"], 0);
                    const newTax = currentItems.reduce((sum, it) => sum + it["Integrated Tax (₹)"] + it["Central Tax (₹)"] + it["State/UT tax (₹)"], 0);

                    // Only update if the sum of items' taxable + tax differs from provided invoice value or if it's 0
                    const calcInvoiceVal = newSubtotal + newTax;
                    if (Math.abs(voucherGroups[groupKey]["Invoice Value (₹)"] - calcInvoiceVal) > 1 || voucherGroups[groupKey]["Invoice Value (₹)"] === 0) {
                        voucherGroups[groupKey]["Invoice Value (₹)"] = calcInvoiceVal;
                    }
                }
            });

            setGroupedVouchers(Object.values(voucherGroups));
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
        const pendingVouchers = groupedVouchers.filter(v => v.status === "pending");
        setSaveProgress({ done: 0, total: pendingVouchers.length });

        const updatedVouchers = [...groupedVouchers];
        let done = 0;

        try {
            for (let i = 0; i < updatedVouchers.length; i++) {
                if (updatedVouchers[i].status !== "pending") continue;

                updatedVouchers[i].status = "importing";
                setGroupedVouchers([...updatedVouchers]);

                try {
                    const response = await axios.post<{ success: boolean; errors?: string[] }>(`${import.meta.env.VITE_API_URL}/api/purchase_summary_import`, {
                        voucher: updatedVouchers[i],
                        companyId,
                        ownerType,
                        ownerId
                    });

                    if (response.data.success) {
                        updatedVouchers[i].status = "imported";
                    } else {
                        updatedVouchers[i].status = "error";
                        updatedVouchers[i].errorMessage = response.data.errors?.[0] || "Import failed";
                    }
                } catch (error: any) {
                    updatedVouchers[i].status = "error";
                    updatedVouchers[i].errorMessage = error.response?.data?.message || error.message || "Failed to save";
                }

                done++;
                setSaveProgress({ done, total: pendingVouchers.length });
                setGroupedVouchers([...updatedVouchers]);
            }

            const savedCount = updatedVouchers.filter(v => v.status === "imported").length;
            const errorCount = updatedVouchers.filter(v => v.status === "error").length;

            if (savedCount > 0 && errorCount === 0) {
                Swal.fire({ icon: "success", title: "All Vouchers Imported!", html: `<b>${savedCount}</b> vouchers saved successfully.` });
            } else if (savedCount > 0 || errorCount > 0) {
                Swal.fire({
                    icon: savedCount > 0 ? "warning" : "error",
                    title: savedCount > 0 ? "Partial Import Completed" : "Import Failed",
                    html: `<p><b>${savedCount}</b> saved, <b>${errorCount}</b> failed.</p>`,
                });
            }
        } catch (err) {
            console.error("Save Error:", err);
            Swal.fire({ icon: "error", title: "Error", text: "Something went wrong while saving." });
        } finally {
            setIsProcessing(false);
        }
    };

    const fixAllCalculations = () => {
        const fixedVouchers = groupedVouchers.map(voucher => {
            const updatedItems = voucher.items.map(item => {
                const qty = item["Quantity"];
                const rate = item["Item Rate (₹)"];
                const totalRate = item["Rate (%)"];

                // Fix Taxable Value
                const newTaxable = qty * rate;

                // Determine Intra/Inter
                const excelPos = voucher["Place of supply"].toLowerCase().trim();
                const excelPosCode = excelPos.match(/^[0-9]+/)?.[0] || excelPos.match(/\(([0-9]+)\)/)?.[1] || "";
                const excelPosName = excelPos.replace(/[0-9\(\)\-]+/g, "").trim();

                const supplierGstin = String(voucher["GSTIN of supplier"] || "").trim();
                const supplierGstinCode = supplierGstin.slice(0, 2);

                const matchedLedger = ledgers.find(l => l.id === voucher._matchedLedgerId);
                const ledgerState = matchedLedger?.state ? String(matchedLedger.state).toLowerCase().trim() : "";

                const isIntra = (supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode) ||
                    (ledgerState && (excelPosName.includes(ledgerState) || ledgerState.includes(excelPosName)));

                let newIgst = 0, newCgst = 0, newSgst = 0;
                if (isIntra) {
                    newCgst = (newTaxable * (totalRate / 2)) / 100;
                    newSgst = (newTaxable * (totalRate / 2)) / 100;
                    newIgst = 0;
                } else {
                    newIgst = (newTaxable * totalRate) / 100;
                    newCgst = 0;
                    newSgst = 0;
                }

                return {
                    ...item,
                    "Taxable Value (₹)": newTaxable,
                    "Integrated Tax (₹)": newIgst,
                    "Central Tax (₹)": newCgst,
                    "State/UT tax (₹)": newSgst,
                    calculationWarning: ""
                };
            });

            const newSubtotal = updatedItems.reduce((sum, it) => sum + it["Taxable Value (₹)"], 0);
            const newTax = updatedItems.reduce((sum, it) => sum + it["Integrated Tax (₹)"] + it["Central Tax (₹)"] + it["State/UT tax (₹)"], 0);

            return {
                ...voucher,
                items: updatedItems,
                "Invoice Value (₹)": newSubtotal + newTax
            };
        });

        setGroupedVouchers(fixedVouchers);
        Swal.fire({ icon: "success", title: "Calculations Fixed", text: "All taxable values and taxes have been recalculated based on Qty and Rate." });
    };

    const downloadTemplate = () => {
        const headers = [
            "GSTIN of supplier", "Trade/Legal name of the Supplier", "Invoice number", "Invoice Date",
            "Invoice Value (₹)", "Place of supply", "Purchase Ledger", "Item Name", "HSN Code",
            "Batch No", "Quantity", "Item Rate (₹)", "Rate (%)", "Taxable Value (₹)",
            "Integrated Tax (₹)", "Central Tax (₹)", "State/UT tax (₹)"
        ];
        const dummyData = [
            ["20AABCM4621M1ZR", "MONGIA STEEL LIMITED", "MSL/25-26/14420", "16-02-2026", 938100, "Jharkhand", "18% Inter State", "Biscute", "5555", "B-001", 100, 4000, "18", 400000, 0, 36000, 36000],
            ["", "", "", "", "", "", "", "Tea Powder", "5555", "B-002", 50, 7900, "18", 395000, 0, 35550, 35550]
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
                        <button onClick={() => navigate("/app/vouchers")} className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                            <ShoppingCart className="mr-3 text-blue-600" />
                            Purchase Summary Import
                        </h2>
                    </div>
                    <p className="text-sm text-gray-600 ml-12">
                        Import purchase invoices using GST summary layout. Group items by invoice automatically.
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Purchase Excel File</h3>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-md font-semibold"
                            >
                                Select File
                            </button>
                            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
                        </div>
                    </div>
                )}

                {activeTab === "preview" && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Import Preview</h3>
                                <p className="text-sm text-gray-500">
                                    Found <span className="font-semibold text-blue-600">{groupedVouchers.length}</span> vouchers in the file.
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {isProcessing && saveProgress.total > 0 && (
                                    <div className="text-sm font-medium text-blue-600 flex items-center mr-4">
                                        <RefreshCw size={16} className="animate-spin mr-2" />
                                        Saving: {saveProgress.done}/{saveProgress.total}
                                    </div>
                                )}
                                {groupedVouchers.some(v => v.items.some(it => it.calculationWarning)) && (
                                    <button
                                        onClick={fixAllCalculations}
                                        className="px-4 py-2 bg-amber-100 text-amber-700 font-bold rounded-lg hover:bg-amber-200 transition-colors flex items-center border border-amber-200"
                                    >
                                        <RefreshCw size={18} className="mr-2" />
                                        Auto-Fix Errors
                                    </button>
                                )}
                                <button
                                    onClick={() => { setGroupedVouchers([]); setActiveTab("import"); }}
                                    className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveImportedVouchers}
                                    disabled={isProcessing || !groupedVouchers.some(v => v.status === "pending")}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 shadow-md transition-all flex items-center"
                                >
                                    {isProcessing ? <RefreshCw size={18} className="animate-spin mr-2" /> : <CheckCircle size={18} className="mr-2" />}
                                    Save Vouchers
                                </button>
                            </div>
                        </div>

                        {groupedVouchers.some(v => v.items.some(it => it.calculationWarning)) && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center justify-between">
                                <div className="flex items-center">
                                    <AlertTriangle className="text-red-500 mr-3" size={24} />
                                    <div>
                                        <h4 className="text-red-800 font-bold text-sm">Calculation Mismatches Detected</h4>
                                        <p className="text-red-700 text-xs">Some items have discrepancies between Qty/Rate and Taxable/Tax values. Click "Auto-Fix Errors" to correct them.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {groupedVouchers.map((voucher, vi) => (
                                <div key={vi} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                    {/* Voucher Header Row */}
                                    <div className="bg-gray-50 p-4 border-b border-gray-200">
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                                    {vi + 1}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-400 uppercase">Supplier {voucher._matchedLedgerId && `(ID: ${voucher._matchedLedgerId})`}</p>
                                                    <p className={`font-bold text-sm flex items-center gap-1 ${!voucher.partyMatch ? "text-red-500" : "text-gray-900"}`}>
                                                        {voucher["Trade/Legal name of the Supplier"]}
                                                        {voucher._matchedLedgerId && <CheckCircle size={14} className="text-green-500" />}
                                                    </p>
                                                    <div className="flex flex-col gap-0.5 mt-1">
                                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                            GST: {voucher["GSTIN of supplier"]}
                                                            {voucher._matchedGstinId ? <CheckCircle size={10} className="text-green-500" /> : <AlertTriangle size={10} className="text-amber-400" />}
                                                        </p>
                                                        <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                            POS: {voucher["Place of supply"]}
                                                            {voucher._matchedStateId ? <CheckCircle size={10} className="text-green-500" /> : <AlertTriangle size={10} className="text-amber-400" />}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">Invoice Details</p>
                                                <p className="text-sm font-bold text-gray-900">No: {voucher["Invoice number"]}</p>
                                                <p className="text-xs text-gray-600">Date: {voucher["Invoice Date"]}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">Totals</p>
                                                <p className="text-sm font-bold text-blue-600">₹{voucher["Invoice Value (₹)"].toLocaleString()}</p>
                                            </div>
                                            <div className="flex flex-col items-end justify-center">
                                                {voucher.status === "imported" ? (
                                                    <span className="flex items-center text-green-600 font-bold text-xs bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                                        <CheckCircle size={12} className="mr-1" /> Success
                                                    </span>
                                                ) : voucher.status === "error" ? (
                                                    <span className="flex items-center text-red-600 font-bold text-xs bg-red-50 px-3 py-1 rounded-full border border-red-200" title={voucher.errorMessage}>
                                                        <AlertTriangle size={12} className="mr-1" /> Error
                                                    </span>
                                                ) : voucher.status === "importing" ? (
                                                    <span className="flex items-center text-blue-600 font-bold text-xs bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                                        <RefreshCw size={12} className="mr-1 animate-spin" /> Saving...
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-gray-600 font-bold text-xs bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                                        Ready
                                                    </span>
                                                )}
                                                {voucher.errorMessage && <p className="text-[10px] text-red-500 mt-1 max-w-[200px] text-right">{voucher.errorMessage}</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Table */}
                                    <div className="p-0 overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white border-b border-gray-100">
                                                <tr>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">No</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Item Name</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">HSN</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Batch No</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Qty</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Rate</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Taxable</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">GST %</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">IGST</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">CGST</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">SGST</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Tax Amt</th>
                                                    <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchase Ledger</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {voucher.items.map((item, ii) => {
                                                    const taxAmt = (item["Integrated Tax (₹)"] || 0) + (item["Central Tax (₹)"] || 0) + (item["State/UT tax (₹)"] || 0);
                                                    return (
                                                        <tr key={ii} className="hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-6 py-3 text-sm text-gray-400 font-medium">{ii}</td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-sm font-semibold text-gray-700">{item["Item Name"]}</span>
                                                                        {item._matchedItemId ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-amber-400" />}
                                                                    </div>
                                                                    {item._matchedItemId && <span className="text-[10px] text-gray-400">ID: {item._matchedItemId}</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-gray-500">{item["HSN Code"]}</span>
                                                                    {item._matchedHsnId && <CheckCircle size={10} className="text-green-500" />}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-xs text-gray-500 uppercase">{item["Batch No"] || "-"}</span>
                                                                        {item._matchedBatchFound && <CheckCircle size={10} className="text-green-500" />}
                                                                    </div>
                                                                    {item._matchedBatchFound && <span className="text-[9px] text-gray-400">Match Found</span>}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-gray-700 text-right font-medium">{item["Quantity"]}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{item["Item Rate (₹)"].toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold relative">
                                                                ₹{item["Taxable Value (₹)"].toLocaleString()}
                                                                {item.calculationWarning?.includes("Qty") && <AlertTriangle size={12} className="text-red-500 absolute -top-1 right-1" />}
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">{item["Rate (%)"]}%</td>
                                                            <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["Integrated Tax (₹)"].toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["Central Tax (₹)"].toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["State/UT tax (₹)"].toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-blue-600 text-right font-bold relative">
                                                                ₹{taxAmt.toLocaleString()}
                                                                {item.calculationWarning?.includes("Tax Discrepancy") && <AlertTriangle size={12} className="text-amber-500 absolute -top-1 right-1" />}
                                                            </td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-xs text-gray-700">{voucher["Purchase Ledger"]}</span>
                                                                        {voucher._matchedPurchaseLedgerId && <CheckCircle size={10} className="text-green-500" />}
                                                                    </div>
                                                                    {voucher._matchedPurchaseLedgerId && <span className="text-[9px] text-gray-400">ID: {voucher._matchedPurchaseLedgerId}</span>}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-gray-50/50 border-t border-gray-100">
                                                <tr className="font-bold">
                                                    <td colSpan={6} className="px-6 py-2 text-[10px] text-gray-500 uppercase text-right">Totals</td>
                                                    <td className="px-4 py-2 text-[11px] text-gray-900 text-right">₹{voucher.items.reduce((s, it) => s + it["Taxable Value (₹)"], 0).toLocaleString()}</td>
                                                    <td className="px-6 py-2"></td>
                                                    <td className="px-6 py-2 text-[10px] text-gray-700 text-right">₹{voucher.items.reduce((s, it) => s + it["Integrated Tax (₹)"], 0).toLocaleString()}</td>
                                                    <td className="px-6 py-2 text-[10px] text-gray-700 text-right">₹{voucher.items.reduce((s, it) => s + it["Central Tax (₹)"], 0).toLocaleString()}</td>
                                                    <td className="px-6 py-2 text-[10px] text-gray-700 text-right">₹{voucher.items.reduce((s, it) => s + it["State/UT tax (₹)"], 0).toLocaleString()}</td>
                                                    <td className="px-6 py-2 text-sm text-blue-700 text-right">
                                                        ₹{voucher.items.reduce((s, it) => s + (it["Integrated Tax (₹)"] + it["Central Tax (₹)"] + it["State/UT tax (₹)"]), 0).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-2"></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "templates" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                            <h4 className="text-xl font-bold text-gray-900 mb-4">GST Purchase Template</h4>
                            <p className="text-gray-600 mb-6 font-medium">Use this template for perfect grouping. Ensure same Invoice No and GSTIN for items of the same bill.</p>
                            <button onClick={downloadTemplate} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md active:scale-95">
                                <Download size={20} />
                                <span>Download Template (.xlsx)</span>
                            </button>
                        </div>
                        <div className="bg-blue-600 p-8 rounded-2xl shadow-xl text-white relative overflow-hidden">
                            <div className="relative z-10">
                                <h4 className="text-xl font-bold mb-4">How Grouping Works</h4>
                                <div className="space-y-4">
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                        <p className="text-sm font-bold mb-1">Same Invoice Number</p>
                                        <p className="text-xs text-blue-100 opacity-90">Items with the same Invoice Number, Date, and GSTIN will be merged into one single voucher automatically.</p>
                                    </div>
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm">
                                        <p className="text-sm font-bold mb-1">Serial Numbers</p>
                                        <p className="text-xs text-blue-100 opacity-90">Preview shows items with Sr No 0, 1, 2... exactly like the purchase voucher entry screen.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseImport;
