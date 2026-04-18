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

interface AccountingEntry {
    "Particulars (Ledger Name)": string;
    "Amount (₹)": number;
    "Type": "credit" | "debit";
    "Rate (%)": number;
    "Integrated Tax (₹)": number;
    "Central Tax (₹)": number;
    "State/UT tax (₹)": number;
    calculationWarning?: string;
    _matchedLedgerId?: string | number;
}

interface AccSummaryRow {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    gstRate: number;
    purchaseLedger: string;
    discount: number;
    rowTotal: number;
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
    accountingEntries?: AccountingEntry[];
    importMode: "item" | "accounting";
    accSummaryRows?: AccSummaryRow[];
}

const stateNameToCode: { [key: string]: string } = {
    'jammu & kashmir': '01', 'jammu and kashmir': '01',
    'himachal pradesh': '02',
    'punjab': '03',
    'chandigarh': '04',
    'uttarakhand': '05',
    'haryana': '06',
    'delhi': '07',
    'rajasthan': '08',
    'uttar pradesh': '09',
    'bihar': '10',
    'sikkim': '11',
    'arunachal pradesh': '12',
    'nagaland': '13',
    'manipur': '14',
    'mizoram': '15',
    'tripura': '16',
    'meghalaya': '17',
    'assam': '18',
    'west bengal': '19',
    'jharkhand': '20',
    'odisha': '21',
    'chhattisgarh': '22',
    'madhya pradesh': '23',
    'gujarat': '24',
    'daman and diu': '25',
    'dadra and nagar haveli': '26',
    'maharashtra': '27',
    'andhra pradesh': '28',
    'karnataka': '29',
    'goa': '30',
    'lakshadweep': '31',
    'kerala': '32',
    'tamil nadu': '33',
    'puducherry': '34',
    'andaman and nicobar islands': '35',
    'telangana': '36',
    'andhra pradesh (new)': '37',
    'ladakh': '38'
};

const extractStateCode = (pos: string): string => {
    if (!pos) return "";
    const cleanPos = pos.toLowerCase().trim();

    // 1. Try format like Jharkhand(20) or State (20)
    const matchParens = cleanPos.match(/\((\d{2})\)/);
    if (matchParens) return matchParens[1];

    // 2. Try digits at start like 20-Jharkhand or 20 Jharkhand
    const matchStart = cleanPos.match(/^(\d{2})/);
    if (matchStart) return matchStart[1];

    // 3. Try digits at end like Jharkhand 20
    const matchEnd = cleanPos.match(/(\d{2})$/);
    if (matchEnd) return matchEnd[1];

    // 4. Try name lookup
    const nameOnly = cleanPos.replace(/[0-9\(\)\-]+/g, "").trim();
    if (stateNameToCode[nameOnly]) return stateNameToCode[nameOnly];

    // 5. Try name lookup for sub-strings (e.g. "POS: Jharkhand")
    for (const [name, code] of Object.entries(stateNameToCode)) {
        if (nameOnly.includes(name) || name.includes(nameOnly)) return code;
    }

    return "";
};

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
    const [importMode, setImportMode] = useState<"item" | "accounting">("item");


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
            // 1. Handle Excel Serial Number
            if (typeof dateValue === "number") {
                const date = new Date((dateValue - 25569) * 86400 * 1000);
                return date.toISOString().split("T")[0];
            }

            if (typeof dateValue === "string") {
                const cleanDate = dateValue.trim();

                // 2. Handle DD-MM-YYYY or DD/MM/YYYY (with 1 or 2 digit day/month)
                const dmyMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                if (dmyMatch) {
                    const day = dmyMatch[1].padStart(2, '0');
                    const month = dmyMatch[2].padStart(2, '0');
                    const year = dmyMatch[3];
                    return `${year}-${month}-${day}`;
                }

                // 3. Handle YYYY-MM-DD or YYYY/MM/DD
                const ymdMatch = cleanDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                if (ymdMatch) {
                    const year = ymdMatch[1];
                    const month = ymdMatch[2].padStart(2, '0');
                    const day = ymdMatch[3].padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }
            }

            // 4. Default JS Date parsing fallback
            const d = new Date(dateValue);
            if (isNaN(d.getTime())) {
                // Return today's date in YYYY-MM-DD format as last resort
                return new Date().toISOString().split("T")[0];
            }
            return d.toISOString().split("T")[0];
        } catch {
            return new Date().toISOString().split("T")[0];
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

            // Determine import mode based on column headers
            const firstRow = jsonData[0];
            const isItemImport = firstRow.hasOwnProperty("Item Name");
            const isAccountingImport = firstRow.hasOwnProperty("Particulars (Ledger Name)") || firstRow.hasOwnProperty("Particulars");
            const isAccSummaryImport = !isItemImport && !isAccountingImport && firstRow.hasOwnProperty("GST Rate (%)");
            const currentImportMode: "item" | "accounting" = isItemImport ? "item" : (isAccountingImport || isAccSummaryImport ? "accounting" : "item");
            setImportMode(currentImportMode);

            jsonData.forEach((row, index) => {
                // Forward-filling logic: if header is missing, use last known header
                const invoiceNo = String(row["Invoice number"] || row["Invoice No"] || row["Voucher No"] || row["Reference No"] || row["Ref No"] || row["invoice_no"] || row["bill_no"] || (lastHeader ? lastHeader["Invoice number"] : "")).trim();
                const invoiceDate = formatDate(row["Invoice Date"] || row["Date"] || row["Invoice date"] || row["date"] || row["invoice_date"] || (lastHeader ? lastHeader["Invoice Date"] : ""));
                const rawGstin = String(row["GSTIN of supplier"] || row["GSTIN"] || row["gstin"] || (lastHeader ? lastHeader["GSTIN of supplier"] : ""));
                const rawPartyName = String(row["Trade/Legal name of the Supplier"] || row["Supplier Name"] || row["Party Name"] || row["party_name"] || (lastHeader ? lastHeader["Trade/Legal name of the Supplier"] : ""));
                const rawPlaceOfSupply = String(row["Place of supply"] || row["POS"] || row["Place Of Supply"] || row["pos"] || (lastHeader ? lastHeader["Place of supply"] : ""));
                const rawPurchaseLedger = String(row["Purchase Ledger"] || row["purchase_ledger"] || (lastHeader ? lastHeader["Purchase Ledger"] : ""));
                const rawInvoiceValue = row["Invoice Value (₹)"] !== undefined ? row["Invoice Value (₹)"] : (row["Invoice Value"] || row["Total Amount"] || (lastHeader ? lastHeader["Invoice Value (₹)"] : 0));

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
                    let matchedLedgerByName = null;
                    let stateMatch = false;
                    let gstMatch = false;
                    let errorMessage = "";

                    if (partyName) {
                        const excelName = partyName.toLowerCase();
                        matchedLedgerByName = ledgers.find(l => {
                            const lName = l.name ? String(l.name).toLowerCase().replace(/\s+/g, " ").trim() : "";
                            return lName === excelName;
                        });

                        if (matchedLedgerByName) {
                            const lGst = matchedLedgerByName.gstNumber ? String(matchedLedgerByName.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                            const lState = matchedLedgerByName.state ? String(matchedLedgerByName.state).toLowerCase().replace(/\s+/g, " ").trim() : "";
                            gstMatch = lGst === gstin;

                            const excelStateCode = extractStateCode(placeOfSupply);
                            const ledgerStateCode = extractStateCode(lState);
                            stateMatch = (excelStateCode && ledgerStateCode && excelStateCode === ledgerStateCode) ||
                                lState === placeOfSupply ||
                                lState.includes(placeOfSupply) ||
                                placeOfSupply.includes(lState);

                            if (!gstMatch && !stateMatch) errorMessage = "GSTIN and State mismatch";
                            else if (!gstMatch) errorMessage = `GSTIN mismatch (Ledger has: ${lGst || 'Empty'})`;
                            else if (!stateMatch) errorMessage = `State mismatch (Ledger has: ${lState || 'Empty'})`;
                        } else {
                            errorMessage = "Supplier Name not found in ledgers";
                        }
                    } else if (currentImportMode === "item") {
                        errorMessage = "Supplier Name is required for item-wise import";
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
                        partyMatch: !!(matchedLedgerByName || currentImportMode === "accounting"),
                        _matchedLedgerId: matchedLedgerByName?.id || null,
                        _matchedPurchaseLedgerId: matchedPurchaseLedger?.id || null,
                        _matchedGstinId: gstMatch ? (matchedLedgerByName?.id || null) : null,
                        _matchedStateId: stateMatch ? (matchedLedgerByName?.id || null) : null,
                        items: [],
                        accountingEntries: [],
                        importMode: currentImportMode,
                    };
                }

                if (currentImportMode === "item") {
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
                        const supplierGstin = String(row["GSTIN of supplier"] || "").trim();
                        const supplierGstinCode = supplierGstin.slice(0, 2);
                        const excelPosCode = extractStateCode(placeOfSupply);

                        const isIntra = (supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode);

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
                } else if (currentImportMode === "accounting") {
                    if (isAccSummaryImport) {
                        // ── NEW ACCOUNTING SUMMARY FORMAT (Multi-Row Support) ──
                        const taxableVal = Number(row["Taxable Value (₹)"] || 0);
                        const igst = Number(row["Integrated Tax (₹)"] || 0);
                        const cgst = Number(row["Central Tax (₹)"] || 0);
                        const sgst = Number(row["State/UT tax (₹)"] || 0);
                        const gstRate = Number(row["GST Rate (%)"] || 0);
                        const purchaseLedger = String(row["Purchase Ledger"] || "").trim();
                        const discount = Number(row["Discount (₹)"] || 0);
                        const totalTax = igst + cgst + sgst;
                        const rowTotal = taxableVal + totalTax - discount;

                        // Initialize if first row for this voucher group
                        if (!voucherGroups[groupKey].accSummaryRows) {
                            voucherGroups[groupKey].accSummaryRows = [];
                            voucherGroups[groupKey]["Invoice Value (₹)"] = 0;
                            voucherGroups[groupKey].accountingEntries = [];
                        }

                        // Accumulate overall invoice value
                        voucherGroups[groupKey]["Invoice Value (₹)"] += rowTotal;

                        // --- Calculation Validation ---
                        let calculationWarning = "";
                        const totalTaxRow = igst + cgst + sgst;
                        const expectedTotalTax = (taxableVal * gstRate) / 100;
                        if (Math.abs(totalTaxRow - expectedTotalTax) > 1) {
                            calculationWarning = "Tax Discrepancy (Calculated " + expectedTotalTax.toFixed(2) + ")";
                        }

                        // Track summary rows for preview
                        voucherGroups[groupKey].accSummaryRows.push({
                            taxableValue: taxableVal,
                            igst, cgst, sgst, gstRate,
                            purchaseLedger,
                            discount,
                            rowTotal,
                            calculationWarning
                        });

                        // 1. --- Debit: Purchase Ledger ---
                        voucherGroups[groupKey].accountingEntries!.push({
                            "Particulars (Ledger Name)": purchaseLedger || "Purchase Account",
                            "Amount (₹)": taxableVal,
                            "Type": "debit",
                            "Rate (%)": gstRate,
                            "Integrated Tax (₹)": 0,
                            "Central Tax (₹)": 0,
                            "State/UT tax (₹)": 0,
                            calculationWarning: "",
                            _matchedLedgerId: purchaseLedger ? ledgers.find(l => String(l.name).toLowerCase().trim() === purchaseLedger.toLowerCase().trim())?.id : null
                        });

                        // 1.5 --- Credit: Discount Ledger (if any) ---
                        if (discount !== 0) {
                            const discountLedger = ledgers.find(l => /discount/i.test(String(l.name)));
                            voucherGroups[groupKey].accountingEntries!.push({
                                "Particulars (Ledger Name)": discountLedger?.name || "Discount",
                                "Amount (₹)": Math.abs(discount),
                                "Type": discount > 0 ? "credit" : "debit",
                                "Rate (%)": 0,
                                "Integrated Tax (₹)": 0,
                                "Central Tax (₹)": 0,
                                "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: discountLedger?.id
                            });
                        }

                        // 2. --- Debit: Tax Ledgers ---
                        if (igst > 0) {
                            const igstLedger = ledgers.find(l => /igst/i.test(String(l.name)));
                            voucherGroups[groupKey].accountingEntries!.push({
                                "Particulars (Ledger Name)": igstLedger?.name || "IGST",
                                "Amount (₹)": igst,
                                "Type": "debit",
                                "Rate (%)": 0,
                                "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: igstLedger?.id
                            });
                        }
                        if (cgst > 0) {
                            const cgstLedger = ledgers.find(l => /cgst/i.test(String(l.name)));
                            voucherGroups[groupKey].accountingEntries!.push({
                                "Particulars (Ledger Name)": cgstLedger?.name || "CGST",
                                "Amount (₹)": cgst,
                                "Type": "debit",
                                "Rate (%)": 0,
                                "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: cgstLedger?.id
                            });
                        }
                        if (sgst > 0) {
                            const sgstLedger = ledgers.find(l => /sgst|utgst/i.test(String(l.name)));
                            voucherGroups[groupKey].accountingEntries!.push({
                                "Particulars (Ledger Name)": sgstLedger?.name || "SGST/UTGST",
                                "Amount (₹)": sgst,
                                "Type": "debit",
                                "Rate (%)": 0,
                                "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: sgstLedger?.id
                            });
                        }

                        // 3. --- Credit: Supplier (Party) ---
                        // Find or create the Credit entry for the party (only one per invoice)
                        let creditEntry = voucherGroups[groupKey].accountingEntries!.find(ae => ae.Type === 'credit');
                        if (!creditEntry) {
                            const creditLedger = ledgers.find(l => String(l.name).toLowerCase().trim() === partyName.toLowerCase().trim());
                            creditEntry = {
                                "Particulars (Ledger Name)": partyName || "Supplier",
                                "Amount (₹)": 0,
                                "Type": "credit",
                                "Rate (%)": 0,
                                "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: creditLedger?.id
                            };
                            voucherGroups[groupKey].accountingEntries!.push(creditEntry);
                        }
                        // Update credit amount to match total accumulated invoice value
                        creditEntry["Amount (₹)"] = voucherGroups[groupKey]["Invoice Value (₹)"];

                    } else {
                        // ── LEGACY MULTI-ROW ACCOUNTING FORMAT ──
                        const particulars = String(row["Particulars (Ledger Name)"] || row["Particulars"] || "").trim();
                        if (!particulars) return;

                        const amount = Number(row["Amount (₹)"] || row["Debit Amount (₹)"] || 0);
                        const type = String(row["Type"] || "debit").toLowerCase().trim() as "credit" | "debit";
                        const gstRate = Number(row["Rate (%)"] || 0);
                        let igst = Number(row["Integrated Tax (₹)"] || 0);
                        let cgst = Number(row["Central Tax (₹)"] || 0);
                        let sgst = Number(row["State/UT tax (₹)"] || 0);

                        let calculationWarning = "";

                        if (gstRate > 0 && igst === 0 && cgst === 0 && sgst === 0) {
                            const supplierGstinCode = gstin.slice(0, 2);
                            const excelPosCode = extractStateCode(placeOfSupply);
                            const isIntra = supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode;
                            if (isIntra) {
                                cgst = (amount * (gstRate / 2)) / 100;
                                sgst = (amount * (gstRate / 2)) / 100;
                            } else {
                                igst = (amount * gstRate) / 100;
                            }
                        } else if (gstRate > 0) {
                            const expectedTax = (amount * gstRate) / 100;
                            const foundTax = igst + cgst + sgst;
                            if (Math.abs(expectedTax - foundTax) > 0.5) {
                                calculationWarning += `Tax Discrepancy: Expected ${expectedTax}, found ${foundTax}.`;
                            }
                        }

                        const matchedLedger = ledgers.find(l => l.name.toLowerCase().trim() === particulars.toLowerCase().trim());
                        voucherGroups[groupKey].accountingEntries!.push({
                            "Particulars (Ledger Name)": particulars,
                            "Amount (₹)": amount,
                            "Type": type,
                            "Rate (%)": gstRate,
                            "Integrated Tax (₹)": igst,
                            "Central Tax (₹)": cgst,
                            "State/UT tax (₹)": sgst,
                            calculationWarning,
                            _matchedLedgerId: matchedLedger?.id || undefined
                        });

                        const totalCredit = voucherGroups[groupKey].accountingEntries!.reduce((sum, ae) => ae.Type === 'credit' ? sum + ae["Amount (₹)"] : sum, 0);
                        if (voucherGroups[groupKey]["Invoice Value (₹)"] === 0 || Math.abs(voucherGroups[groupKey]["Invoice Value (₹)"] - totalCredit) > 1) {
                            voucherGroups[groupKey]["Invoice Value (₹)"] = totalCredit;
                        }
                    }
                }
            });

            // Post-process accounting vouchers to identify the supplier (entry with type 'credit')
            if (currentImportMode === "accounting") {
                Object.values(voucherGroups).forEach(voucher => {
                    if (!voucher["Trade/Legal name of the Supplier"]) {
                        // For purchase vouchers in accounting mode, the supplier is usually the ledger credited
                        const creditEntry = voucher.accountingEntries?.find(ae => ae.Type === 'credit');
                        if (creditEntry) {
                            const supplierName = creditEntry["Particulars (Ledger Name)"];
                            voucher["Trade/Legal name of the Supplier"] = supplierName;

                            const matchedLedger = ledgers.find(l => l.name.toLowerCase().trim() === supplierName.toLowerCase().trim());
                            if (matchedLedger) {
                                voucher._matchedLedgerId = matchedLedger.id;
                                voucher.partyMatch = true;
                                voucher.status = "pending";
                                voucher.errorMessage = "";

                                // Also update GST and State from the matched ledger for display
                                voucher["GSTIN of supplier"] = matchedLedger.gst_number || "";
                                voucher["Place of supply"] = matchedLedger.state || "";
                                voucher._matchedGstinId = matchedLedger.id;
                                voucher._matchedStateId = matchedLedger.id;
                            } else {
                                voucher.status = "error";
                                voucher.errorMessage = `Supplier ledger '${supplierName}' not found`;
                            }
                        } else {
                            voucher.status = "error";
                            voucher.errorMessage = "No credit entry (supplier) found in voucher";
                        }
                    }
                });
            }

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
            if (voucher.importMode === "item") {
                const updatedItems = voucher.items.map(item => {
                    const qty = item["Quantity"];
                    const rate = item["Item Rate (₹)"];
                    const totalRate = item["Rate (%)"];

                    // Fix Taxable Value
                    const newTaxable = qty * rate;

                    // Determine Intra/Inter
                    const supplierGstin = String(voucher["GSTIN of supplier"] || "").trim();
                    const supplierGstinCode = supplierGstin.slice(0, 2);
                    const excelPosCode = extractStateCode(voucher["Place of supply"]);

                    const isIntra = (supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode);

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
            } else { // Accounting mode
                if (voucher.accSummaryRows) {
                    // Update rows directly if they exist
                    voucher.accSummaryRows = voucher.accSummaryRows.map(row => {
                        const amount = row.taxableValue;
                        const rate = row.gstRate;

                        const supplierGstin = String(voucher["GSTIN of supplier"] || "").trim();
                        const supplierGstinCode = supplierGstin.slice(0, 2);
                        const excelPosCode = extractStateCode(voucher["Place of supply"]);

                        const isIntra = (supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode);

                        let newIgst = 0, newCgst = 0, newSgst = 0;
                        if (isIntra) {
                            newCgst = (amount * (rate / 2)) / 100;
                            newSgst = (amount * (rate / 2)) / 100;
                            newIgst = 0;
                        } else {
                            newIgst = (amount * rate) / 100;
                            newCgst = 0;
                            newSgst = 0;
                        }

                        return {
                            ...row,
                            igst: newIgst,
                            cgst: newCgst,
                            sgst: newSgst,
                            calculationWarning: "",
                            rowTotal: amount + newIgst + newCgst + newSgst - row.discount
                        };
                    });

                    // Rebuild accounting entries from fixed rows
                    const newEntries: AccountingEntry[] = [];
                    voucher.accSummaryRows.forEach(row => {
                        // Debit Purchase
                        const matchedPL = row.purchaseLedger ? ledgers.find(l => String(l.name).toLowerCase().trim() === row.purchaseLedger.toLowerCase().trim()) : null;
                        newEntries.push({
                            "Particulars (Ledger Name)": row.purchaseLedger || "Purchase Account",
                            "Amount (₹)": row.taxableValue - row.discount,
                            "Type": "debit", "Rate (%)": row.gstRate, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: matchedPL?.id
                        });
                        // Debit Taxes
                        if (row.igst > 0) newEntries.push({ "Particulars (Ledger Name)": ledgers.find(l => /igst/i.test(l.name))?.name || "IGST", "Amount (₹)": row.igst, "Type": "debit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: ledgers.find(l => /igst/i.test(l.name))?.id });
                        if (row.cgst > 0) newEntries.push({ "Particulars (Ledger Name)": ledgers.find(l => /cgst/i.test(l.name))?.name || "CGST", "Amount (₹)": row.cgst, "Type": "debit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: ledgers.find(l => /cgst/i.test(l.name))?.id });
                        if (row.sgst > 0) newEntries.push({ "Particulars (Ledger Name)": ledgers.find(l => /sgst|utgst/i.test(l.name))?.name || "SGST/UTGST", "Amount (₹)": row.sgst, "Type": "debit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: ledgers.find(l => /sgst|utgst/i.test(l.name))?.id });
                    });

                    const totalInvoiceValue = voucher.accSummaryRows.reduce((s, r) => s + r.rowTotal, 0);
                    // Add Credit Entry
                    const partyLedgerMatch = ledgers.find(l => String(l.name).toLowerCase().trim() === voucher["Trade/Legal name of the Supplier"].toLowerCase().trim());
                    newEntries.push({
                        "Particulars (Ledger Name)": voucher["Trade/Legal name of the Supplier"] || "Supplier",
                        "Amount (₹)": totalInvoiceValue,
                        "Type": "credit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: partyLedgerMatch?.id
                    });

                    return { ...voucher, accSummaryRows: voucher.accSummaryRows, accountingEntries: newEntries, "Invoice Value (₹)": totalInvoiceValue };

                } else {
                    const updatedAccountingEntries = voucher.accountingEntries?.map(ae => {
                        const amount = ae["Amount (₹)"];
                        const gstRate = ae["Rate (%)"];

                        const supplierGstin = String(voucher["GSTIN of supplier"] || "").trim();
                        const supplierGstinCode = supplierGstin.slice(0, 2);
                        const excelPosCode = extractStateCode(voucher["Place of supply"]);

                        const isIntra = (supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode);

                        let newIgst = 0, newCgst = 0, newSgst = 0;
                        if (isIntra) {
                            newCgst = (amount * (gstRate / 2)) / 100;
                            newSgst = (amount * (gstRate / 2)) / 100;
                            newIgst = 0;
                        } else {
                            newIgst = (amount * gstRate) / 100;
                            newCgst = 0;
                            newSgst = 0;
                        }

                        return {
                            ...ae,
                            "Integrated Tax (₹)": newIgst,
                            "Central Tax (₹)": newCgst,
                            "State/UT tax (₹)": newSgst,
                            calculationWarning: ""
                        };
                    });

                    const totalCredit = updatedAccountingEntries?.reduce((sum, ae) => ae.Type === 'credit' ? sum + ae["Amount (₹)"] : sum, 0) || 0;

                    return {
                        ...voucher,
                        accountingEntries: updatedAccountingEntries,
                        "Invoice Value (₹)": totalCredit,
                        // If summary rows exist, we should ideally update them too, but 
                        // for now, we ensure the entries used for saving are correct.
                    };
                }
            }
        });

        setGroupedVouchers(fixedVouchers);
        Swal.fire({ icon: "success", title: "Calculations Fixed", text: "All taxable values and taxes have been recalculated based on Qty and Rate." });
    };

    const downloadTemplate = (mode: 'item' | 'accounting') => {
        const itemH = ["GSTIN of supplier", "Trade/Legal name of the Supplier", "Invoice number", "Invoice Date", "Invoice Value (₹)", "Place of supply", "Purchase Ledger", "Item Name", "HSN Code", "Batch No", "Quantity", "Item Rate (₹)", "Rate (%)", "Taxable Value (₹)", "Integrated Tax (₹)", "Central Tax (₹)", "State/UT tax (₹)"];
        const accH = ["GSTIN of supplier", "Trade/Legal name of the Supplier", "Invoice number", "Invoice Date", "Invoice Value (₹)", "Place of supply", "Taxable Value (₹)", "Integrated Tax (₹)", "Central Tax (₹)", "State/UT tax (₹)", "GST Rate (%)", "Purchase Ledger", "Discount (₹)"];

        const itemData = [
            ["20AABCM4621M1ZR", "MONGIA STEEL LIMITED", "MSL/25-26/14420", "16-02-2026", 938100, "Jharkhand(20)", "18% Inter State Purchase", "Biscute", "5555", "B-001", 100, 4000, 18, 400000, 0, 36000, 36000],
            ["", "", "", "", "", "", "", "Tea Powder", "5555", "B-002", 50, 7900, 18, 395000, 0, 35550, 35550]
        ];
        const accData = [
            ["20BDAPP6208H2ZY", "nuvoico trader", "123", "30/03/2026", 11180, "jharkhand", 10000, 0, 900, 900, 18, "18% intra state", 1000],
            ["", "", "", "", "", "", 1000, 0, 90, 90, 18, "18% intra state", 0]
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([mode === 'item' ? itemH : accH, ...(mode === 'item' ? itemData : accData)]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Purchase_Import");
        XLSX.writeFile(workbook, `Purchase_Import_Template_${mode}.xlsx`);
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
                                    Found <span className="font-semibold text-blue-600">{groupedVouchers.length}</span> vouchers in the file. (Mode: {importMode === 'item' ? 'Item-wise' : 'Accounting'})
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                {isProcessing && saveProgress.total > 0 && (
                                    <div className="text-sm font-medium text-blue-600 flex items-center mr-4">
                                        <RefreshCw size={16} className="animate-spin mr-2" />
                                        Saving: {saveProgress.done}/{saveProgress.total}
                                    </div>
                                )}
                                {groupedVouchers.some(v =>
                                    v.items.some(it => it.calculationWarning) ||
                                    v.accountingEntries?.some(ae => ae.calculationWarning) ||
                                    v.accSummaryRows?.some(r => r.calculationWarning)
                                ) && (
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

                        {groupedVouchers.some(v =>
                            v.items.some(it => it.calculationWarning) ||
                            v.accountingEntries?.some(ae => ae.calculationWarning) ||
                            v.accSummaryRows?.some(r => r.calculationWarning)
                        ) && (
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
                                                {(importMode === 'item' || importMode === 'accounting') && (
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
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase">Invoice Details</p>
                                                <p className="text-sm font-bold text-gray-900">No: {voucher["Invoice number"]}</p>
                                                <p className="text-xs text-gray-600">Date: {voucher["Invoice Date"]}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-gray-400 uppercase">
                                                    {(importMode === 'accounting' && !voucher.accSummaryRows)
                                                        ? `Totals (${voucher.accountingEntries?.filter(ae => ae.Type === 'credit').length} Cr / ${voucher.accountingEntries?.filter(ae => ae.Type === 'debit').length} Dr)`
                                                        : 'Invoice Value'
                                                    }
                                                </p>
                                                <p className="text-sm font-bold text-blue-600 flex items-center gap-3">
                                                    {(importMode === 'accounting' && !voucher.accSummaryRows)
                                                        ? <>
                                                            <span className="flex items-center gap-1">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Cr:</span>
                                                                <span className="text-green-600">₹{voucher.accountingEntries?.reduce((s, ae) => ae.Type === 'credit' ? s + ae["Amount (₹)"] : s, 0).toLocaleString()}</span>
                                                            </span>
                                                            <span className="text-gray-200">|</span>
                                                            <span className="flex items-center gap-1">
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Dr:</span>
                                                                <span className="text-red-600">₹{voucher.accountingEntries?.reduce((s, ae) => ae.Type === 'debit' ? s + ae["Amount (₹)"] : s, 0).toLocaleString()}</span>
                                                            </span>
                                                        </>
                                                        : `₹${voucher["Invoice Value (₹)"].toLocaleString()}`
                                                    }
                                                </p>
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

                                    {/* Items/Accounting Table */}
                                    <div className="p-0 overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-white border-b border-gray-100">
                                                <tr>
                                                    {voucher.accSummaryRows ? (
                                                        <>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">No</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Taxable Value</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">IGST (₹)</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">CGST (₹)</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">SGST (₹)</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">GST Rate</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Purchase Ledger</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Discount (₹)</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Invoice Total</th>
                                                        </>
                                                    ) : importMode === 'item' ? (
                                                        <>
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
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">No</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Particulars</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Type</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {importMode === 'item' ? (
                                                    voucher.items.map((item, ii) => { // item rows below
                                                        const taxAmt = (item["Integrated Tax (₹)"] || 0) + (item["Central Tax (₹)"] || 0) + (item["State/UT tax (₹)"] || 0);
                                                        return (
                                                            <tr key={ii} className="hover:bg-blue-50/30 transition-colors">
                                                                <td className="px-6 py-3 text-sm text-gray-400 font-medium">{ii + 1}</td>
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
                                                    })
                                                ) : voucher.accSummaryRows ? (
                                                    // ── NEW ACCOUNTING SUMMARY FORMAT: multi-row support ──
                                                    voucher.accSummaryRows.map((row, ri) => (
                                                        <tr key={ri} className="hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-6 py-3 text-sm text-gray-400 font-medium">{ri + 1}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold">₹{row.taxableValue.toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{row.igst.toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{row.cgst.toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{row.sgst.toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-600 text-center">{row.gstRate}%</td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-gray-700">{row.purchaseLedger}</span>
                                                                    {ledgers.some(l => String(l.name).toLowerCase().trim() === row.purchaseLedger.toLowerCase().trim())
                                                                        ? <CheckCircle size={10} className="text-green-500" />
                                                                        : <AlertTriangle size={10} className="text-amber-400" />}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{row.discount.toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-blue-600 text-right font-bold relative">
                                                                ₹{row.rowTotal.toLocaleString()}
                                                                {row.calculationWarning && <AlertTriangle size={12} className="text-amber-500 absolute -top-1 right-1" title={row.calculationWarning} />}
                                                            </td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    // ── LEGACY MULTI-ROW ACCOUNTING FORMAT ──
                                                    voucher.accountingEntries?.map((ae, ai) => {
                                                        const isMatch = ledgers.some(l => l.name.toLowerCase().trim() === ae["Particulars (Ledger Name)"].toLowerCase().trim());
                                                        return (
                                                            <tr key={ai} className="hover:bg-blue-50/30 transition-colors">
                                                                <td className="px-6 py-3 text-sm text-gray-400 font-medium">{ai + 1}</td>
                                                                <td className="px-6 py-3">
                                                                    <div className="flex items-center gap-1">
                                                                        <span className="text-sm font-semibold text-gray-700">
                                                                            {ae["Particulars (Ledger Name)"]}
                                                                            {ae._matchedLedgerId && (
                                                                                <span className="text-gray-400 font-normal ml-1">({ae._matchedLedgerId})</span>
                                                                            )}
                                                                        </span>
                                                                        {isMatch ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-amber-400" />}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ae.Type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                        {ae.Type}
                                                                    </span>
                                                                </td>
                                                                <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold">₹{ae["Amount (₹)"].toLocaleString()}</td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                            <tfoot className="bg-gray-50/50 border-t border-gray-100">
                                                <tr className="font-bold">
                                                    <td colSpan={importMode === 'item' ? 6 : 3} className="px-6 py-2 text-[10px] text-gray-500 uppercase text-right">Totals</td>
                                                    <td className="px-4 py-2 text-[11px] text-gray-900 text-right">
                                                        {importMode === 'item' ? (
                                                            `₹${voucher.items.reduce((s, it) => s + it["Taxable Value (₹)"], 0).toLocaleString()}`
                                                        ) : (
                                                            <div className="flex items-center justify-end gap-6 py-1">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[9px] text-gray-400 uppercase font-bold">Total Cr ({voucher.accountingEntries?.filter(ae => ae.Type === 'credit').length}):</span>
                                                                    <span className="text-green-700">₹{voucher.accountingEntries?.reduce((s, ae) => ae.Type === 'credit' ? s + ae["Amount (₹)"] : s, 0).toLocaleString()}</span>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="text-[9px] text-gray-400 uppercase font-bold">Total Dr ({voucher.accountingEntries?.filter(ae => ae.Type === 'debit').length}):</span>
                                                                    <span className="text-red-700">₹{voucher.accountingEntries?.reduce((s, ae) => ae.Type === 'debit' ? s + ae["Amount (₹)"] : s, 0).toLocaleString()}</span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    {importMode === 'item' && (
                                                        <>
                                                            <td className="px-6 py-2"></td>
                                                            <td className="px-6 py-2 text-[10px] text-gray-700 text-right">
                                                                ₹{voucher.items.reduce((s, it) => s + it["Integrated Tax (₹)"], 0).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-2 text-[10px] text-gray-700 text-right">
                                                                ₹{voucher.items.reduce((s, it) => s + it["Central Tax (₹)"], 0).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-2 text-[10px] text-gray-700 text-right">
                                                                ₹{voucher.items.reduce((s, it) => s + it["State/UT tax (₹)"], 0).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-2 text-sm text-blue-700 text-right">
                                                                ₹{voucher.items.reduce((s, it) => s + (it["Integrated Tax (₹)"] + it["Central Tax (₹)"] + it["State/UT tax (₹)"]), 0).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-2"></td>
                                                        </>
                                                    )}
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
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Inventory / Item Invoice</h4>
                            <p className="text-gray-600 mb-6 font-medium">Use this template for standard item-wise imports with quantities and rates.</p>
                            <button onClick={() => downloadTemplate('item')} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md active:scale-95">
                                <Download size={20} />
                                <span>Download Item Template (.xlsx)</span>
                            </button>
                        </div>

                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Accounting Invoice</h4>
                            <p className="text-gray-600 mb-6 font-medium">Use this template for multi-ledger accounting entries with Credit/Debit support.</p>
                            <button onClick={() => downloadTemplate('accounting')} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-md active:scale-95">
                                <Download size={20} />
                                <span>Download Accounting Template (.xlsx)</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseImport;
