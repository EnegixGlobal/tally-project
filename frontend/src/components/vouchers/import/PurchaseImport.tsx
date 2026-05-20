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
import { useCompany } from "../../../context/CompanyContext";
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
    tdsAmount: number;
    tdsRate: string;
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
    _suggestedLedger?: any;
    _missingLedger?: boolean;
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

const codeToStateName: { [key: string]: string } = {
    "01": "Jammu and Kashmir(01)", "02": "Himachal Pradesh(02)", "03": "Punjab(03)", "04": "Chandigarh(04)",
    "05": "Uttarakhand(05)", "06": "Haryana(06)", "07": "Delhi(07)", "08": "Rajasthan(08)", "09": "Uttar Pradesh(09)",
    "10": "Bihar(10)", "11": "Sikkim(11)", "12": "Arunachal Pradesh(12)", "13": "Nagaland(13)", "14": "Manipur(14)",
    "15": "Mizoram(15)", "16": "Tripura(16)", "17": "Meghalaya(17)", "18": "Assam(18)", "19": "West Bengal(19)",
    "20": "Jharkhand(20)", "21": "Odisha(21)", "22": "Chhattisgarh(22)", "23": "Madhya Pradesh(23)", "24": "Gujarat(24)",
    "25": "Daman and Diu(25)", "26": "Dadra and Nagar Haveli(26)", "27": "Maharashtra(27)", "29": "Karnataka(29)",
    "30": "Goa(30)", "31": "Lakshadweep(31)", "32": "Kerala(32)", "33": "Tamil Nadu(33)", "34": "Puducherry(34)",
    "35": "Andaman and Nicobar Islands(35)", "36": "Telangana(36)", "37": "Andhra Pradesh(37)", "38": "Ladakh(38)"
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

interface FlatRow {
    voucher: GroupedVoucher;
    parentIndex: number;
    subIndex: number;
    isFirstInVoucher: boolean;
    rowCount: number;
    invoiceNo: string;
    invoiceDate: string;
    partyName: string;
    gstin: string;
    pos: string;
    ledgerName: string;
    particulars: string;
    qty: string | number;
    rate: string | number;
    taxableValue: number;
    gstRate: string | number;
    igst: number;
    cgst: number;
    sgst: number;
    discount: number;
    tdsAmount: number;
    tdsRate: string;
    rowTotal: number;
    isItemMode: boolean;
    isSummaryMode: boolean;
    isLegacyMode: boolean;
    itemRef?: ImportedItem;
    summaryRef?: AccSummaryRow;
    entryRef?: AccountingEntry;
    calculationWarning?: string;
}

const getFlatRows = (vouchers: GroupedVoucher[]): FlatRow[] => {
    const rows: FlatRow[] = [];
    vouchers.forEach((voucher, vi) => {
        const isItemMode = voucher.importMode === 'item';
        const isSummaryMode = !!voucher.accSummaryRows;
        const isLegacyMode = !isItemMode && !isSummaryMode;

        let subRowsCount = 0;
        if (isItemMode) {
            subRowsCount = voucher.items?.length || 1;
        } else if (isSummaryMode) {
            subRowsCount = voucher.accSummaryRows?.length || 1;
        } else {
            subRowsCount = voucher.accountingEntries?.length || 1;
        }

        for (let i = 0; i < subRowsCount; i++) {
            const isFirstInVoucher = i === 0;
            const invoiceNo = voucher["Invoice number"] || "";
            const invoiceDate = voucher["Invoice Date"] || "";
            const partyName = voucher["Trade/Legal name of the Supplier"] || "";
            const gstin = voucher["GSTIN of supplier"] || "";
            const pos = voucher["Place of supply"] || "";
            
            let ledgerName = "";
            let particulars = "";
            let qty: string | number = "";
            let rate: string | number = "";
            let taxableValue = 0;
            let gstRate: string | number = "";
            let igst = 0;
            let cgst = 0;
            let sgst = 0;
            let discount = 0;
            let tdsAmount = 0;
            let tdsRate = "";
            let rowTotal = 0;
            let calculationWarning = undefined;
            let itemRef: ImportedItem | undefined;
            let summaryRef: AccSummaryRow | undefined;
            let entryRef: AccountingEntry | undefined;

            if (isItemMode) {
                const item = voucher.items?.[i];
                if (item) {
                    itemRef = item;
                    particulars = item["Item Name"] || "";
                    qty = item["Quantity"] ?? "";
                    rate = item["Item Rate (₹)"] ?? 0;
                    taxableValue = item["Taxable Value (₹)"] ?? 0;
                    gstRate = item["Rate (%)"] ?? 0;
                    igst = item["Integrated Tax (₹)"] ?? 0;
                    cgst = item["Central Tax (₹)"] ?? 0;
                    sgst = item["State/UT tax (₹)"] ?? 0;
                    rowTotal = taxableValue + igst + cgst + sgst;
                    calculationWarning = item.calculationWarning;
                    ledgerName = voucher["Purchase Ledger"] || "";
                }
            } else if (isSummaryMode) {
                const row = voucher.accSummaryRows?.[i];
                if (row) {
                    summaryRef = row;
                    ledgerName = row.purchaseLedger || "";
                    particulars = row.purchaseLedger || "";
                    taxableValue = row.taxableValue ?? 0;
                    gstRate = row.gstRate ?? 0;
                    igst = row.igst ?? 0;
                    cgst = row.cgst ?? 0;
                    sgst = row.sgst ?? 0;
                    discount = row.discount ?? 0;
                    tdsAmount = row.tdsAmount ?? 0;
                    tdsRate = row.tdsRate || "";
                    rowTotal = row.rowTotal ?? 0;
                    calculationWarning = row.calculationWarning;
                }
            } else {
                const entry = voucher.accountingEntries?.[i];
                if (entry) {
                    entryRef = entry;
                    particulars = entry["Particulars (Ledger Name)"] || "";
                    rowTotal = entry["Amount (₹)"] ?? 0;
                    taxableValue = entry["Amount (₹)"] ?? 0;
                    gstRate = entry["Rate (%)"] ?? "";
                    igst = entry["Integrated Tax (₹)"] ?? 0;
                    cgst = entry["Central Tax (₹)"] ?? 0;
                    sgst = entry["State/UT tax (₹)"] ?? 0;
                    calculationWarning = entry.calculationWarning;
                    ledgerName = voucher["Purchase Ledger"] || "";
                }
            }

            rows.push({
                voucher,
                parentIndex: vi,
                subIndex: i,
                isFirstInVoucher,
                rowCount: subRowsCount,
                invoiceNo,
                invoiceDate,
                partyName,
                gstin,
                pos,
                ledgerName,
                particulars,
                qty,
                rate,
                taxableValue,
                gstRate,
                igst,
                cgst,
                sgst,
                discount,
                tdsAmount,
                tdsRate,
                rowTotal,
                isItemMode,
                isSummaryMode,
                isLegacyMode,
                itemRef,
                summaryRef,
                entryRef,
                calculationWarning
            });
        }
    });
    return rows;
};

const PurchaseImport: React.FC = () => {
    const navigate = useNavigate();
    const { companyInfo } = useCompany();
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

    const companyStateCode = companyInfo?.state ? extractStateCode(companyInfo.state) : "";

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
                
                let rawGstin = String(row["GSTIN of supplier"] || row["GSTIN"] || row["gstin"] || (lastHeader ? lastHeader["GSTIN of supplier"] : ""));
                if (rawGstin === "undefined" || rawGstin === "null") {
                    rawGstin = "";
                }
                
                let rawPartyName = String(row["Trade/Legal name of the Supplier"] || row["Supplier Name"] || row["Party Name"] || row["party_name"] || (lastHeader ? lastHeader["Trade/Legal name of the Supplier"] : ""));
                if (rawPartyName === "undefined" || rawPartyName === "null") {
                    rawPartyName = "";
                }
                
                const rawPlaceOfSupply = String(row["Place of supply"] || row["POS"] || row["Place Of Supply"] || row["pos"] || (lastHeader ? lastHeader["Place of supply"] : ""));
                const rawPurchaseLedger = String(row["Purchase Ledger"] || row["purchase_ledger"] || (lastHeader ? lastHeader["Purchase Ledger"] : ""));
                const rawInvoiceValue = row["Invoice Value (₹)"] !== undefined ? row["Invoice Value (₹)"] : (row["Invoice Value"] || row["Total Amount"] || (lastHeader ? lastHeader["Invoice Value (₹)"] : 0));

                const gstin = rawGstin.toUpperCase().replace(/\s+/g, "").trim();
                let partyName = rawPartyName.replace(/\s+/g, " ").trim();
                let placeOfSupply = rawPlaceOfSupply.toLowerCase().replace(/\s+/g, " ").trim();

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
                    let suggestedLedger = null;

                    // 1. First try matching by GST number if present in Excel
                    if (gstin) {
                        const matchedLedgerByGst = ledgers.find(l => {
                            const lGst = (l.gst_number || l.gstNumber) ? String(l.gst_number || l.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                            return lGst === gstin;
                        });

                        if (matchedLedgerByGst) {
                            // If GST matches, use name from database ("name get and show")
                            partyName = matchedLedgerByGst.name;
                            matchedLedgerByName = matchedLedgerByGst;
                            gstMatch = true;
                            stateMatch = true; // Trust database ledger's state
                            if (matchedLedgerByGst.state) {
                                placeOfSupply = matchedLedgerByGst.state;
                            }
                        } else {
                            // GST not found in database -> it's fresh!
                            // "name also save gst number" -> set partyName to gstin
                            partyName = gstin;
                        }
                    }

                    // 2. Fallback to name matching if no GSTIN was provided or if name is still not matched
                    if (!matchedLedgerByName && partyName && partyName !== gstin) {
                        const excelName = partyName.toLowerCase();
                        matchedLedgerByName = ledgers.find(l => {
                            const lName = l.name ? String(l.name).toLowerCase().replace(/\s+/g, " ").trim() : "";
                            return lName === excelName;
                        });

                        if (matchedLedgerByName) {
                            const lGst = (matchedLedgerByName.gst_number || matchedLedgerByName.gstNumber) ? String(matchedLedgerByName.gst_number || matchedLedgerByName.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                            const lState = matchedLedgerByName.state ? String(matchedLedgerByName.state).toLowerCase().replace(/\s+/g, " ").trim() : "";
                            gstMatch = lGst === gstin;

                            // If ledger is matched, we trust its state over Excel's POS
                            if (lState) {
                                stateMatch = true;
                                // Update the local variable so calculations use the ledger state
                                placeOfSupply = lState;
                            } else {
                                const excelStateCode = extractStateCode(placeOfSupply);
                                const ledgerStateCode = extractStateCode(lState);
                                stateMatch = (excelStateCode && ledgerStateCode && excelStateCode === ledgerStateCode) ||
                                    lState === placeOfSupply ||
                                    lState.includes(placeOfSupply) ||
                                    placeOfSupply.includes(lState);
                            }

                            if (!gstMatch && !stateMatch) errorMessage = "GSTIN and State mismatch";
                            else if (!gstMatch) errorMessage = `GSTIN mismatch (Ledger has: ${lGst || 'Empty'})`;
                            else if (!stateMatch) errorMessage = `State mismatch (Ledger has: ${lState || 'Empty'})`;
                        } else {
                            errorMessage = "Supplier Name not found in ledgers";
                            // Autofix logic: find by GSTIN
                            const gstinMatch = gstin ? ledgers.find(l => {
                                const lGst = (l.gst_number || l.gstNumber) ? String(l.gst_number || l.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                                return lGst === gstin;
                            }) : null;

                            if (gstinMatch) {
                                suggestedLedger = gstinMatch;
                            } else {
                                // Neither name nor GSTIN matched
                                errorMessage = "Supplier Ledger does not exist";
                            }
                        }
                    } else if (!matchedLedgerByName && partyName === gstin) {
                        // Fresh GSTIN ledger case
                        errorMessage = "Supplier Ledger does not exist";
                    } else if (!partyName && currentImportMode === "item") {
                        errorMessage = "Supplier Name/GSTIN is required for item-wise import";
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
                        "Place of supply": matchedLedgerByName?.state || String(rawPlaceOfSupply).trim(),
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
                        _suggestedLedger: suggestedLedger,
                        _missingLedger: !!(!matchedLedgerByName && !suggestedLedger && partyName),
                    };
                }

                if (currentImportMode === "item") {
                    let matchedItem: any = null;
                    const excelItemName = row["Item Name"] ? String(row["Item Name"]).trim().toLowerCase() : "";
                    if (excelItemName) {
                        matchedItem = items.find(it => it.name && String(it.name).toLowerCase().trim() === excelItemName);
                    }

                    const excelHsn = row["HSN Code"] ? String(row["HSN Code"]).trim() : "";
                    const matchedHsnId = (matchedItem && excelHsn && String(matchedItem.hsnCode || "").trim() === excelHsn) ? matchedItem.id : null;
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

                    let igst = 0, cgst = 0, sgst = 0;
                    const supplierGstin = String(row["GSTIN of supplier"] || gstin || "").trim();
                    const supplierStateCode = supplierGstin.slice(0, 2) || extractStateCode(placeOfSupply);
                    const isIntra = (companyStateCode && supplierStateCode && companyStateCode === supplierStateCode);

                    if (totalRate > 0) {
                        if (isIntra) {
                            cgst = (taxableVal * (totalRate / 2)) / 100;
                            sgst = (taxableVal * (totalRate / 2)) / 100;
                            igst = 0;
                        } else {
                            igst = (taxableVal * totalRate) / 100;
                            cgst = 0;
                            sgst = 0;
                        }
                    }

                    if (excelItemName || taxableVal > 0) {
                        const suggestedPLName = `${totalRate}% ${isIntra ? 'intra' : 'inter'} state purchase`;
                        const fallbackPLName = `${totalRate}% ${isIntra ? 'local' : 'igst'} purchase`;

                        if (!voucherGroups[groupKey]["Purchase Ledger"] || voucherGroups[groupKey]["Purchase Ledger"].toLowerCase().includes("purchase account") || voucherGroups[groupKey]["Purchase Ledger"] === suggestedPLName) {
                            // Try to find the best matching ledger
                            const matchedPL = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase();
                                return lName === suggestedPLName.toLowerCase() ||
                                    lName === fallbackPLName.toLowerCase() ||
                                    (lName.includes(`${totalRate}%`) && lName.includes(isIntra ? 'intra' : 'inter')) ||
                                    (lName.includes(`${totalRate}%`) && !isIntra && lName.includes('igst'));
                            });

                            voucherGroups[groupKey]["Purchase Ledger"] = matchedPL?.name || suggestedPLName;
                            voucherGroups[groupKey]._matchedPurchaseLedgerId = matchedPL?.id || null;
                        }

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
                            calculationWarning: ""
                        });

                        const currentItems = voucherGroups[groupKey].items;
                        const newSubtotal = currentItems.reduce((sum, it) => sum + it["Taxable Value (₹)"], 0);
                        const newTax = currentItems.reduce((sum, it) => sum + it["Integrated Tax (₹)"] + it["Central Tax (₹)"] + it["State/UT tax (₹)"], 0);
                        const calcInvoiceVal = newSubtotal + newTax;
                        if (Math.abs(voucherGroups[groupKey]["Invoice Value (₹)"] - calcInvoiceVal) > 1 || voucherGroups[groupKey]["Invoice Value (₹)"] === 0) {
                            voucherGroups[groupKey]["Invoice Value (₹)"] = calcInvoiceVal;
                        }
                    }
                } else if (currentImportMode === "accounting") {
                    if (isAccSummaryImport) {
                        // ── NEW ACCOUNTING SUMMARY FORMAT (Multi-Row Support) ──
                        const taxableVal = Number(row["Taxable Value (₹)"] || 0);
                        const gstRate = Number(row["GST Rate (%)"] || 0);
                        const purchaseLedger = String(row["Purchase Ledger"] || "").trim();
                        const discount = Number(row["Discount (₹)"] || 0);
                        const rawTds = row["TDS"];
                        let tdsRateNum = 0;
                        let tdsRateStr = "";

                        if (typeof rawTds === "number") {
                            // If it's a small decimal (like 0.01 for 1%), treat it as percentage
                            if (rawTds > 0 && rawTds < 1) {
                                tdsRateNum = rawTds * 100;
                                tdsRateStr = `${tdsRateNum}%`;
                            } else {
                                tdsRateNum = rawTds;
                                tdsRateStr = `${rawTds}%`;
                            }
                        } else {
                            tdsRateStr = String(rawTds || "").trim();
                            tdsRateNum = parseFloat(tdsRateStr.replace(/%/g, "")) || 0;
                            if (!tdsRateStr.includes("%") && tdsRateStr !== "") {
                                tdsRateStr = `${tdsRateStr}%`;
                            }
                        }

                        const tdsAmount = (taxableVal * tdsRateNum) / 100;

                        // --- Calculation Validation & Automation ---
                        let calculationWarning = "";
                        const supplierStateCode = gstin.slice(0, 2) || extractStateCode(placeOfSupply);
                        const isIntra = (companyStateCode && supplierStateCode && companyStateCode === supplierStateCode);

                        let igst = 0, cgst = 0, sgst = 0;
                        if (isIntra) {
                            cgst = (taxableVal * (gstRate / 2)) / 100;
                            sgst = (taxableVal * (gstRate / 2)) / 100;
                        } else {
                            igst = (taxableVal * gstRate) / 100;
                        }

                        // Automate Purchase Ledger name for summary row
                        const suggestedPLName = `${gstRate}% ${isIntra ? 'intra' : 'inter'} state purchase`;
                        const fallbackPLName = `${gstRate}% ${isIntra ? 'local' : 'igst'} purchase`;

                        let currentPL = (purchaseLedger && !purchaseLedger.toLowerCase().includes("purchase account")) ? purchaseLedger : "";
                        let matchedPL = null;

                        if (currentPL) {
                            matchedPL = ledgers.find(l => String(l.name).toLowerCase().trim() === currentPL.toLowerCase().trim());
                        } else {
                            // Try to find the best matching ledger
                            matchedPL = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase();
                                return lName === suggestedPLName.toLowerCase() ||
                                    lName === fallbackPLName.toLowerCase() ||
                                    (lName.includes(`${gstRate}%`) && lName.includes(isIntra ? 'intra' : 'inter')) ||
                                    (lName.includes(`${gstRate}%`) && !isIntra && lName.includes('igst'));
                            });
                            currentPL = matchedPL?.name || suggestedPLName;
                        }

                        const totalTax = igst + cgst + sgst;
                        const rowTotal = taxableVal + totalTax - discount + tdsAmount;

                        // Initialize if first row for this voucher group
                        if (!voucherGroups[groupKey].accSummaryRows) {
                            voucherGroups[groupKey].accSummaryRows = [];
                            voucherGroups[groupKey]["Invoice Value (₹)"] = 0;
                            voucherGroups[groupKey].accountingEntries = [];
                        }

                        // Accumulate overall invoice value
                        voucherGroups[groupKey]["Invoice Value (₹)"] += rowTotal;

                        // Track summary rows for preview
                        voucherGroups[groupKey].accSummaryRows.push({
                            taxableValue: taxableVal,
                            igst, cgst, sgst, gstRate,
                            purchaseLedger: currentPL,
                            discount,
                            tdsAmount,
                            tdsRate: tdsRateStr,
                            rowTotal,
                            calculationWarning
                        });

                        // 1. --- Debit: Purchase Ledger ---
                        voucherGroups[groupKey].accountingEntries!.push({
                            "Particulars (Ledger Name)": currentPL,
                            "Amount (₹)": taxableVal,
                            "Type": "debit",
                            "Rate (%)": gstRate,
                            "Integrated Tax (₹)": 0,
                            "Central Tax (₹)": 0,
                            "State/UT tax (₹)": 0,
                            calculationWarning: "",
                            _matchedLedgerId: matchedPL?.id || null
                        });

                        // 1.5 --- Credit/Debit: Discount Ledger (if any) ---
                        if (discount !== 0) {
                            const discountLedger = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase();
                                return lName === "rebate & discount" || (lName.includes("rebate") && lName.includes("discount"));
                            }) || ledgers.find(l => /discount/i.test(String(l.name)));

                            voucherGroups[groupKey].accountingEntries!.push({
                                "Particulars (Ledger Name)": discountLedger?.name || "Rebate & Discount",
                                "Amount (₹)": Math.abs(discount),
                                "Type": discount > 0 ? "credit" : "debit",
                                "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: discountLedger?.id,
                                _isDiscount: true // Flag to differentiate from party entry
                            });
                        }

                        // 2. --- Debit: Tax Ledgers ---
                        if (igst > 0) {
                            const igstLedger = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase();
                                return (lName.includes("igst") || lName.includes("integrated")) && !lName.includes("purchase") && !lName.includes("sale");
                            });
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

                        if (tdsAmount > 0) {
                            const tdsRateClean = tdsRateStr.replace(/%/g, "").trim();
                            const tdsLedger = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase().replace(/\s+/g, "");
                                return (lName.includes("tds") && lName.includes(tdsRateClean)) && !lName.includes("purchase") && !lName.includes("sale");
                            });
                            
                            const tdsLedgerName = tdsLedger?.name || `TDS ${tdsRateStr}`;
                            
                            voucherGroups[groupKey].accountingEntries!.push({
                                "Particulars (Ledger Name)": tdsLedgerName,
                                "Amount (₹)": tdsAmount,
                                "Type": "debit", // Changed to debit to match additive total
                                "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: tdsLedger?.id
                            });
                        }

                        // 3. --- Credit: Supplier (Party) ---
                        // Find or create the Credit entry for the party (identifiable by _isParty flag)
                        let creditEntry = voucherGroups[groupKey].accountingEntries!.find(ae => ae.Type === 'credit' && !ae._isDiscount);
                        if (!creditEntry) {
                            const creditLedger = ledgers.find(l => String(l.name).toLowerCase().trim() === partyName.toLowerCase().trim());
                            creditEntry = {
                                "Particulars (Ledger Name)": partyName || "Supplier",
                                "Amount (₹)": 0,
                                "Type": "credit",
                                "Rate (%)": 0,
                                "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: creditLedger?.id,
                                _isParty: true
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

                        if (gstRate > 0) {
                            const supplierStateCode = gstin.slice(0, 2) || extractStateCode(placeOfSupply);
                            const isIntra = companyStateCode && supplierStateCode && companyStateCode === supplierStateCode;
                            if (isIntra) {
                                cgst = (amount * (gstRate / 2)) / 100;
                                sgst = (amount * (gstRate / 2)) / 100;
                                igst = 0;
                            } else {
                                igst = (amount * gstRate) / 100;
                                cgst = 0;
                                sgst = 0;
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

    const createMissingLedgers = async () => {
        const missingVouchers = groupedVouchers.filter(v => v._missingLedger);
        if (missingVouchers.length === 0) return;

        // Get unique ledgers to create
        const toCreateMap = new Map();
        missingVouchers.forEach(v => {
            const gstin = v["GSTIN of supplier"] ? String(v["GSTIN of supplier"]).toUpperCase().replace(/\s+/g, "").trim() : "";
            const name = v["Trade/Legal name of the Supplier"] ? String(v["Trade/Legal name of the Supplier"]).trim() : "";

            // Use GSTIN as primary key to prevent duplicate GSTIN creation, fallback to Name
            const key = gstin ? `GSTIN-${gstin}` : `NAME-${name.toLowerCase()}`;

            if (!toCreateMap.has(key)) {
                // Double check against existing ledgers in DB (already fetched)
                const alreadyExists = gstin && ledgers.some(l => {
                    const lGst = (l.gst_number || l.gstNumber) ? String(l.gst_number || l.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                    return lGst === gstin;
                });

                if (!alreadyExists) {
                    let detectedState = "";
                    if (gstin && gstin.length >= 2) {
                        detectedState = codeToStateName[gstin.substring(0, 2)] || "";
                    }
                    if (!detectedState && v["Place of supply"]) {
                        // Try to normalize Excel state
                        const excelCode = extractStateCode(v["Place of supply"]);
                        if (excelCode) detectedState = codeToStateName[excelCode] || v["Place of supply"];
                        else detectedState = v["Place of supply"];
                    }

                    toCreateMap.set(key, {
                        name: name,
                        gstNumber: gstin,
                        state: detectedState,
                        groupId: -109, // Sundry Creditors
                        balanceType: "credit",
                        openingBalance: 0
                    });
                }
            }
        });
        const toCreate = Array.from(toCreateMap.values());

        // Warning for missing states
        const missingStateLedgers = toCreate.filter(l => !l.state);
        if (missingStateLedgers.length > 0) {
            const warnResult = await Swal.fire({
                title: 'Missing State Information',
                text: `${missingStateLedgers.length} ledgers don't have a detected state. This might cause issues with GST calculations. Do you want to continue?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Continue',
                cancelButtonText: 'Go Back'
            });
            if (!warnResult.isConfirmed) return;
        }

        const result = await Swal.fire({
            title: `${toCreate.length} Ledgers do not exist`,
            html: `<div style="text-align: left;">
                    <p>The following suppliers will be created under <b>Sundry Creditors</b>:</p>
                    <ul style="font-size: 0.85em; max-height: 200px; overflow-y: auto; background: #f9f9f9; padding: 10px 25px; border-radius: 8px; border: 1px solid #eee;">
                        ${toCreate.map(l => `
                            <li style="margin-bottom: 6px; border-bottom: 1px solid #eee; padding-bottom: 4px;">
                                <b>${l.name}</b><br/>
                                <span style="font-size: 0.9em; color: #666;">
                                    ${l.gstNumber ? `GST: ${l.gstNumber}` : '<i>No GST</i>'} | 
                                    State: <span style="color: #2563eb; font-weight: 500;">${l.state || 'Not Detected'}</span>
                                </span>
                            </li>
                        `).join('')}
                    </ul>
                   </div>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Create All',
            cancelButtonText: 'Cancel',
            confirmButtonColor: '#2563eb',
        });

        if (result.isConfirmed) {
            setIsProcessing(true);
            let created = 0;
            let failed = 0;

            for (const ledger of toCreate) {
                try {
                    await axios.post(`${import.meta.env.VITE_API_URL}/api/ledger`, {
                        ...ledger,
                        companyId,
                        ownerType,
                        ownerId
                    });
                    created++;
                } catch (err) {
                    console.error("Failed to create ledger", ledger.name, err);
                    failed++;
                }
            }

            // Important: Refetch ledgers from DB
            try {
                const ledgerRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/ledger`, {
                    params: { company_id: companyId, owner_type: ownerType, owner_id: ownerId }
                });
                const updatedLedgers = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
                setLedgers(updatedLedgers);

                // Re-match the current vouchers with the newly fetched ledgers
                setGroupedVouchers(prev => prev.map(v => {
                    if (!v._missingLedger) return v;

                    const excelName = v["Trade/Legal name of the Supplier"].toLowerCase();
                    const excelGst = v["GSTIN of supplier"].toUpperCase().replace(/\s+/g, "").trim();

                    const matchedLedger = updatedLedgers.find(l => {
                        const lName = l.name ? String(l.name).toLowerCase().replace(/\s+/g, " ").trim() : "";
                        const lGst = (l.gst_number || l.gstNumber) ? String(l.gst_number || l.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                        return lName === excelName || (excelGst && lGst === excelGst);
                    });

                    if (matchedLedger) {
                        const lGst = (matchedLedger.gst_number || matchedLedger.gstNumber) ? String(matchedLedger.gst_number || matchedLedger.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                        const lState = matchedLedger.state ? String(matchedLedger.state).toLowerCase().replace(/\s+/g, " ").trim() : "";

                        const gstMatch = lGst === excelGst;
                        const excelStateCode = extractStateCode(v["Place of supply"]);
                        const ledgerStateCode = extractStateCode(lState);
                        const stateMatch = (excelStateCode && ledgerStateCode && excelStateCode === ledgerStateCode) || lState === v["Place of supply"].toLowerCase();

                        // Update accounting entries if needed
                        let updatedEntries = v.accountingEntries ? [...v.accountingEntries] : [];
                        if (updatedEntries.length > 0) {
                            updatedEntries = updatedEntries.map(ae => {
                                if (ae["Particulars (Ledger Name)"].toLowerCase().trim() === v["Trade/Legal name of the Supplier"].toLowerCase().trim() || (v.accSummaryRows && ae.Type === 'credit')) {
                                    return { ...ae, "Particulars (Ledger Name)": matchedLedger.name, _matchedLedgerId: matchedLedger.id };
                                }
                                return ae;
                            });
                        }

                        return {
                            ...v,
                            _matchedLedgerId: matchedLedger.id,
                            _matchedGstinId: gstMatch ? matchedLedger.id : null,
                            _matchedStateId: stateMatch ? matchedLedger.id : null,
                            partyMatch: true,
                            errorMessage: "",
                            status: "pending",
                            accountingEntries: updatedEntries,
                            _missingLedger: false,
                            _suggestedLedger: undefined
                        };
                    }
                    return v;
                }));
            } catch (err) {
                console.error("Error refreshing ledgers:", err);
            }

            Swal.fire('Success', `Successfully created ${created} ledgers and matched them with your vouchers.`, 'success');
            setIsProcessing(false);
        }
    };

    const fixAllLedgerNames = () => {
        let count = 0;
        setGroupedVouchers(prev => prev.map(v => {
            if (v._suggestedLedger) {
                count++;
                const sl = v._suggestedLedger;
                const newPartyName = sl.name;
                const newPartyId = sl.id;

                let updatedEntries = v.accountingEntries ? [...v.accountingEntries] : [];
                if (updatedEntries.length > 0) {
                    updatedEntries = updatedEntries.map(ae => {
                        if (ae["Particulars (Ledger Name)"] === v["Trade/Legal name of the Supplier"] || (v.accSummaryRows && ae.Type === 'credit')) {
                            return { ...ae, "Particulars (Ledger Name)": newPartyName, _matchedLedgerId: newPartyId };
                        }
                        return ae;
                    });
                }

                return {
                    ...v,
                    "Trade/Legal name of the Supplier": newPartyName,
                    _matchedLedgerId: newPartyId,
                    "GSTIN of supplier": sl.gst_number || sl.gstNumber || "",
                    "Place of supply": sl.state || "",
                    partyMatch: true,
                    _matchedGstinId: newPartyId,
                    _matchedStateId: newPartyId,
                    errorMessage: "",
                    status: "pending",
                    accountingEntries: updatedEntries,
                    _suggestedLedger: undefined
                };
            }
            return v;
        }));

        if (count > 0) {
            Swal.fire({ icon: 'success', title: 'Party Names Fixed', text: `Successfully updated ${count} vouchers with correct ledger names from database.` });
        }
    };

    const fixVoucherParty = (voucherId: string) => {
        setGroupedVouchers(prev => prev.map(v => {
            if (v.id === voucherId && v._suggestedLedger) {
                const sl = v._suggestedLedger;
                const newPartyName = sl.name;
                const newPartyId = sl.id;
                const newGstin = sl.gst_number || sl.gstNumber || "";
                const newState = sl.state || "";

                // Update Accounting Entries if it's accounting mode or if we have matching party name in entries
                let updatedEntries = v.accountingEntries ? [...v.accountingEntries] : [];
                if (updatedEntries.length > 0) {
                    updatedEntries = updatedEntries.map(ae => {
                        // If this entry matches the old party name or is the credit entry in a summary import
                        if (ae["Particulars (Ledger Name)"] === v["Trade/Legal name of the Supplier"] ||
                            (v.accSummaryRows && ae.Type === 'credit')) {
                            return {
                                ...ae,
                                "Particulars (Ledger Name)": newPartyName,
                                _matchedLedgerId: newPartyId
                            };
                        }
                        return ae;
                    });
                }

                return {
                    ...v,
                    "Trade/Legal name of the Supplier": newPartyName,
                    _matchedLedgerId: newPartyId,
                    "GSTIN of supplier": newGstin,
                    "Place of supply": newState,
                    partyMatch: true,
                    _matchedGstinId: newPartyId,
                    _matchedStateId: newPartyId,
                    errorMessage: "",
                    status: "pending",
                    accountingEntries: updatedEntries,
                    _suggestedLedger: undefined // Clear it after fixing
                };
            }
            return v;
        }));
        Swal.fire({
            icon: 'success',
            title: 'Party Name Fixed',
            text: 'The supplier name has been updated to match your ledger records.',
            timer: 1500,
            showConfirmButton: false
        });
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

                    // Determine Intra/Inter based on Company State vs Supplier State
                    const supplierStateCode = (String(voucher["GSTIN of supplier"] || "").slice(0, 2)) || extractStateCode(voucher["Place of supply"]);
                    const isIntra = (companyStateCode && supplierStateCode && companyStateCode === supplierStateCode);

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

                        const supplierStateCode = (String(voucher["GSTIN of supplier"] || "").slice(0, 2)) || extractStateCode(voucher["Place of supply"]);
                        const isIntra = (companyStateCode && supplierStateCode && companyStateCode === supplierStateCode);

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

                        const rawTds = String(row.tdsRate || "").trim();
                        const tdsRateNum = parseFloat(rawTds.replace(/%/g, "")) || 0;
                        const newTdsAmount = (amount * tdsRateNum) / 100;

                        return {
                            ...row,
                            igst: newIgst,
                            cgst: newCgst,
                            sgst: newSgst,
                            tdsAmount: newTdsAmount,
                            calculationWarning: "",
                            rowTotal: amount + newIgst + newCgst + newSgst - row.discount + newTdsAmount
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
                        if (row.tdsAmount > 0) {
                            const tdsRateClean = String(row.tdsRate || "").replace(/%/g, "").trim();
                            const tdsL = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase().replace(/\s+/g, "");
                                return (lName.includes("tds") && lName.includes(tdsRateClean)) && !lName.includes("purchase") && !lName.includes("sale");
                            });
                            newEntries.push({ 
                                "Particulars (Ledger Name)": tdsL?.name || `TDS ${row.tdsRate}`, 
                                "Amount (₹)": row.tdsAmount, 
                                "Type": "debit", // Additive TDS
                                "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, 
                                calculationWarning: "", 
                                _matchedLedgerId: tdsL?.id
                            });
                        }
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

                        const supplierStateCode = (String(voucher["GSTIN of supplier"] || "").slice(0, 2)) || extractStateCode(voucher["Place of supply"]);
                        const isIntra = (companyStateCode && supplierStateCode && companyStateCode === supplierStateCode);

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
        const itemH = ["GSTIN of supplier", "Trade/Legal name of the Supplier", "Invoice number", "Invoice Date", "Invoice Value (₹)", "Place of supply", "Purchase Ledger", "Item Name", "HSN Code", "Batch No", "Quantity", "Item Rate (₹)", "Rate (%)", "Taxable Value (₹)"];
        const accH = ["GSTIN of supplier", "Trade/Legal name of the Supplier", "Invoice number", "Invoice Date", "Invoice Value (₹)", "Place of supply", "Taxable Value (₹)", "GST Rate (%)", "Purchase Ledger", "Discount (₹)", "TDS"];

        const itemData = [
            ["20AABCM4621M1ZR", "MONGIA STEEL LIMITED", "MSL/25-26/14420", "16-02-2026", 472000, "Jharkhand(20)", "18% Inter State Purchase", "Biscute", "5555", "B-001", 100, 4000, 18, 400000],
        ];
        const accData = [
            ["20BDAPP6208H2ZY", "nuvoico trader", "123", "30/03/2026", 11800, "jharkhand", 10000, 18, "18% intra state", 0, "1%"],
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
                        <style dangerouslySetInnerHTML={{__html: `
                          .custom-scroll::-webkit-scrollbar {
                            height: 6px;
                            width: 6px;
                          }
                          .custom-scroll::-webkit-scrollbar-track {
                            background: transparent;
                          }
                          .custom-scroll::-webkit-scrollbar-thumb {
                            background: rgba(156, 163, 175, 0.45);
                            border-radius: 4px;
                          }
                          .custom-scroll::-webkit-scrollbar-thumb:hover {
                            background: rgba(156, 163, 175, 0.7);
                          }
                        `}} />
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
                                {groupedVouchers.some(v => v._suggestedLedger) && (
                                    <button
                                        onClick={fixAllLedgerNames}
                                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 shadow-md transition-all flex items-center"
                                    >
                                        <RefreshCw size={18} className="mr-2" />
                                        Autofix Ledger Names
                                    </button>
                                )}
                                {groupedVouchers.some(v => v._missingLedger) && (
                                    <button
                                        onClick={createMissingLedgers}
                                        className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-all flex items-center"
                                    >
                                        <CheckCircle size={18} className="mr-2" />
                                        Create {groupedVouchers.filter(v => v._missingLedger).length} Missing Ledgers
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

                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto custom-scroll w-full">
                                <table className="w-full text-left border-collapse table-auto border-spacing-0">
                                    <thead className="bg-gray-100 sticky top-0 z-20 border-b border-gray-300 shadow-[0_1px_0_rgba(0,0,0,0.05)]">
                                        <tr className="">
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-12 text-center bg-gray-100">#</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center bg-gray-100 min-w-[80px]">Status</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[110px]">Invoice No</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[90px]">Invoice Date</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[180px]">Supplier Name</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[130px]">GSTIN</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[120px]">POS (State)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[150px]">Purchase Ledger</th>
                                            {importMode === "item" && (
                                                <>
                                                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[180px]">Particulars (Item Name)</th>
                                                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">Qty</th>
                                                    <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">Rate (₹)</th>
                                                </>
                                            )}
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">Taxable Value (₹)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center bg-gray-100">GST %</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">IGST (₹)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">CGST (₹)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">SGST (₹)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">Discount (₹)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">TDS (₹)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-right bg-gray-100">Total (₹)</th>
                                            <th className="px-3 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider bg-gray-100 min-w-[200px]">Remarks / Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {getFlatRows(groupedVouchers).map((row, index, arr) => {
                                            const isLastInVoucher = row.subIndex === row.rowCount - 1;
                                            const rowBg = row.parentIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40";
                                            const rowBorderBottom = isLastInVoucher ? "border-b-2 border-gray-300 shadow-[0_1px_0_rgba(0,0,0,0.05)]" : "border-b border-gray-200/60";

                                            return (
                                                <tr key={index} className={`${rowBg} ${rowBorderBottom} hover:bg-blue-50/20 transition-colors`}>
                                                    <td className="px-3 py-2.5 text-xs text-gray-400 font-medium text-center">{index + 1}</td>
                                                    
                                                    {row.isFirstInVoucher ? (
                                                        <td rowSpan={row.rowCount} className="px-3 py-2.5 text-center align-middle font-semibold bg-white/70">
                                                            {row.voucher.status === "imported" ? (
                                                                <span className="inline-flex items-center text-green-600 text-[10px] font-bold bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                                    <CheckCircle size={10} className="mr-1 shrink-0" /> Success
                                                                </span>
                                                            ) : row.voucher.status === "error" ? (
                                                                <span className="inline-flex items-center text-red-600 text-[10px] font-bold bg-red-50 px-2 py-0.5 rounded-full border border-red-200" title={row.voucher.errorMessage}>
                                                                    <AlertTriangle size={10} className="mr-1 shrink-0" /> Error
                                                                </span>
                                                            ) : row.voucher.status === "importing" ? (
                                                                <span className="inline-flex items-center text-blue-600 text-[10px] font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                                                                    <RefreshCw size={10} className="mr-1 shrink-0 animate-spin" /> Saving...
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center text-gray-600 text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                                                    Ready
                                                                </span>
                                                            )}
                                                        </td>
                                                    ) : null}

                                                    {row.isFirstInVoucher ? (
                                                        <td rowSpan={row.rowCount} className="px-3 py-2.5 text-xs font-bold text-gray-900 align-middle bg-white/70">
                                                            {row.invoiceNo}
                                                        </td>
                                                    ) : null}

                                                    {row.isFirstInVoucher ? (
                                                        <td rowSpan={row.rowCount} className="px-3 py-2.5 text-xs text-gray-600 align-middle bg-white/70">
                                                            {row.invoiceDate}
                                                        </td>
                                                    ) : null}

                                                    {row.isFirstInVoucher ? (
                                                        <td rowSpan={row.rowCount} className="px-3 py-2.5 align-middle bg-white/70">
                                                            <div className="flex flex-col">
                                                                <span className={`font-bold text-xs flex items-center gap-1 ${!row.voucher.partyMatch ? "text-red-500" : "text-gray-900"}`}>
                                                                    {row.partyName || "Unnamed Supplier"}
                                                                    {row.voucher._matchedLedgerId && <CheckCircle size={12} className="text-green-500 shrink-0" />}
                                                                </span>
                                                                {row.voucher._matchedLedgerId && <span className="text-[9px] text-gray-400">ID: {row.voucher._matchedLedgerId}</span>}
                                                            </div>
                                                        </td>
                                                    ) : null}

                                                    {row.isFirstInVoucher ? (
                                                        <td rowSpan={row.rowCount} className="px-3 py-2.5 align-middle bg-white/70">
                                                            {row.gstin ? (
                                                                <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                                                                    {row.gstin}
                                                                    {row.voucher._matchedGstinId ? <CheckCircle size={10} className="text-green-500 shrink-0" /> : <AlertTriangle size={10} className="text-amber-400 shrink-0" />}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">None</span>
                                                            )}
                                                        </td>
                                                    ) : null}

                                                    {row.isFirstInVoucher ? (
                                                        <td rowSpan={row.rowCount} className="px-3 py-2.5 align-middle bg-white/70">
                                                            {row.pos ? (
                                                                <span className="text-xs text-gray-700 flex items-center gap-1">
                                                                    {row.pos}
                                                                    {row.voucher._matchedStateId ? <CheckCircle size={10} className="text-green-500 shrink-0" /> : <AlertTriangle size={10} className="text-amber-400 shrink-0" />}
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 italic">None</span>
                                                            )}
                                                        </td>
                                                    ) : null}

                                                    {/* Purchase Ledger */}
                                                    <td className="px-3 py-2.5">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                                                {row.ledgerName || "-"}
                                                                {row.ledgerName && (row.isSummaryMode ? (
                                                                    ledgers.some(l => String(l.name).toLowerCase().trim() === row.ledgerName.toLowerCase().trim())
                                                                        ? <CheckCircle size={10} className="text-green-500 shrink-0" />
                                                                        : <AlertTriangle size={10} className="text-amber-400 shrink-0" />
                                                                ) : (
                                                                    row.voucher._matchedPurchaseLedgerId ? <CheckCircle size={10} className="text-green-500 shrink-0" /> : null
                                                                ))}
                                                            </span>
                                                            {!row.isSummaryMode && row.voucher._matchedPurchaseLedgerId && <span className="text-[9px] text-gray-400">ID: {row.voucher._matchedPurchaseLedgerId}</span>}
                                                        </div>
                                                    </td>

                                                    {importMode === "item" && (
                                                        <>
                                                            {/* Particulars */}
                                                            <td className="px-3 py-2.5">
                                                                <div className="flex flex-col">
                                                                    {row.isItemMode ? (
                                                                        <>
                                                                            <div className="flex items-center gap-1">
                                                                                <span className="text-xs font-semibold text-gray-700">{row.particulars || "-"}</span>
                                                                                {row.itemRef?._matchedItemId ? <CheckCircle size={11} className="text-green-500 shrink-0" /> : <AlertTriangle size={11} className="text-amber-400 shrink-0" />}
                                                                            </div>
                                                                            {row.itemRef?._matchedItemId && <span className="text-[9px] text-gray-400">ID: {row.itemRef._matchedItemId}</span>}
                                                                            {row.itemRef?.["HSN Code"] && (
                                                                                <span className="text-[9px] text-gray-500 flex items-center gap-1 mt-0.5">
                                                                                    HSN: {row.itemRef["HSN Code"]}
                                                                                    {row.itemRef._matchedHsnId && <CheckCircle size={9} className="text-green-500 shrink-0" />}
                                                                                </span>
                                                                            )}
                                                                            {row.itemRef?.["Batch No"] && (
                                                                                <span className="text-[9px] text-gray-500 flex items-center gap-1">
                                                                                    Batch: {row.itemRef["Batch No"]}
                                                                                    {row.itemRef._matchedBatchFound && <CheckCircle size={9} className="text-green-500 shrink-0" />}
                                                                                </span>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <span className="text-xs font-semibold text-gray-700">{row.particulars || "-"}</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            {/* Qty */}
                                                            <td className="px-3 py-2.5 text-xs text-gray-700 text-right font-medium">
                                                                {row.isItemMode && row.qty !== "" ? row.qty : "-"}
                                                            </td>
                                                            {/* Rate */}
                                                            <td className="px-3 py-2.5 text-xs text-gray-700 text-right">
                                                                {row.isItemMode && row.rate !== "" ? `₹${Number(row.rate).toLocaleString()}` : "-"}
                                                            </td>
                                                        </>
                                                    )}

                                                    {/* Taxable Value */}
                                                    <td className="px-3 py-2.5 text-xs text-gray-900 text-right font-bold relative">
                                                        {row.taxableValue ? `₹${row.taxableValue.toLocaleString()}` : "-"}
                                                        {row.calculationWarning?.includes("Qty") && (
                                                            <AlertTriangle size={10} className="text-red-500 absolute top-1 right-1" title={row.calculationWarning} />
                                                        )}
                                                    </td>

                                                    {/* GST % */}
                                                    <td className="px-3 py-2.5 text-xs text-gray-700 text-center font-medium">
                                                        {row.gstRate !== "" ? `${row.gstRate}%` : "-"}
                                                    </td>

                                                    {/* IGST */}
                                                    <td className="px-3 py-2.5 text-xs text-gray-600 text-right font-medium">
                                                        {row.igst ? `₹${row.igst.toLocaleString()}` : "-"}
                                                    </td>

                                                    {/* CGST */}
                                                    <td className="px-3 py-2.5 text-xs text-gray-600 text-right font-medium">
                                                        {row.cgst ? `₹${row.cgst.toLocaleString()}` : "-"}
                                                    </td>

                                                    {/* SGST */}
                                                    <td className="px-3 py-2.5 text-xs text-gray-600 text-right font-medium">
                                                        {row.sgst ? `₹${row.sgst.toLocaleString()}` : "-"}
                                                    </td>

                                                    {/* Discount */}
                                                    <td className="px-3 py-2.5 text-xs text-gray-700 text-right">
                                                        {row.discount ? `₹${row.discount.toLocaleString()}` : "-"}
                                                    </td>

                                                    {/* TDS */}
                                                    <td className="px-3 py-2.5 text-xs text-gray-600 text-right">
                                                        {row.tdsAmount ? (
                                                            <div className="flex flex-col items-end">
                                                                <span className="text-red-500 font-bold">₹{row.tdsAmount.toLocaleString()}</span>
                                                                {row.tdsRate && <span className="text-[8px] text-gray-400">({row.tdsRate})</span>}
                                                            </div>
                                                        ) : "-"}
                                                    </td>

                                                    {/* Total (₹) */}
                                                    <td className="px-3 py-2.5 text-xs text-blue-600 text-right font-bold relative">
                                                        {row.rowTotal ? `₹${row.rowTotal.toLocaleString()}` : "-"}
                                                        {row.calculationWarning?.includes("Tax Discrepancy") && (
                                                            <AlertTriangle size={10} className="text-amber-500 absolute top-1 right-1" title={row.calculationWarning} />
                                                        )}
                                                    </td>

                                                    {/* Remarks / Actions (Merged) */}
                                                    {row.isFirstInVoucher ? (
                                                        <td rowSpan={row.rowCount} className="px-3 py-2.5 align-middle bg-white/70">
                                                            <div className="flex flex-col gap-1.5">
                                                                {row.voucher.errorMessage ? (
                                                                    <p className="text-[10px] text-red-500 font-medium leading-relaxed max-w-[220px]">
                                                                        {row.voucher.errorMessage}
                                                                    </p>
                                                                ) : (
                                                                    <p className="text-[10px] text-green-600 font-medium">
                                                                        Voucher is ready for import
                                                                    </p>
                                                                )}
                                                                
                                                                {row.voucher._suggestedLedger && (
                                                                    <button
                                                                        onClick={() => fixVoucherParty(row.voucher.id)}
                                                                        className="w-fit px-2 py-1 bg-blue-50 text-blue-700 text-[9px] font-bold rounded border border-blue-200 hover:bg-blue-100 transition-colors flex items-center gap-1 shadow-sm"
                                                                    >
                                                                        <RefreshCw size={8} className="text-blue-600 animate-pulse" />
                                                                        Use: "{row.voucher._suggestedLedger.name}"
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    ) : null}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 sticky bottom-0 z-20 shadow-[0_-2px_5px_rgba(0,0,0,0.05)]">
                                        <tr className="">
                                            <td colSpan={7} className="px-3 py-3 text-[11px] text-slate-700 uppercase tracking-wider text-right bg-slate-100">
                                                Grand Totals ({groupedVouchers.length} Vouchers)
                                            </td>
                                            <td className="px-3 py-3 bg-slate-100"></td>
                                            {importMode === "item" && (
                                                <>
                                                    <td className="px-3 py-3 bg-slate-100"></td>
                                                    <td className="px-3 py-3 bg-slate-100"></td>
                                                    <td className="px-3 py-3 bg-slate-100"></td>
                                                </>
                                            )}
                                            
                                            <td className="px-3 py-3 text-xs text-slate-800 text-right bg-slate-100">
                                                ₹{groupedVouchers.reduce((s, v) => s + (v.importMode === 'item' ? v.items.reduce((s2, it) => s2 + (it["Taxable Value (₹)"] || 0), 0) : v.accSummaryRows ? v.accSummaryRows.reduce((s2, r) => s2 + (r.taxableValue || 0), 0) : v.accountingEntries?.reduce((s2, ae) => s2 + (ae["Amount (₹)"] || 0), 0) || 0), 0).toLocaleString()}
                                            </td>
                                            
                                            <td className="px-3 py-3 bg-slate-100"></td>
                                            
                                            <td className="px-3 py-3 text-xs text-slate-800 text-right bg-slate-100">
                                                ₹{groupedVouchers.reduce((s, v) => s + (v.importMode === 'item' ? v.items.reduce((s2, it) => s2 + (it["Integrated Tax (₹)"] || 0), 0) : v.accSummaryRows ? v.accSummaryRows.reduce((s2, r) => s2 + (r.igst || 0), 0) : v.accountingEntries?.reduce((s2, ae) => s2 + (ae["Integrated Tax (₹)"] || 0), 0) || 0), 0).toLocaleString()}
                                            </td>

                                            <td className="px-3 py-3 text-xs text-slate-800 text-right bg-slate-100">
                                                ₹{groupedVouchers.reduce((s, v) => s + (v.importMode === 'item' ? v.items.reduce((s2, it) => s2 + (it["Central Tax (₹)"] || 0), 0) : v.accSummaryRows ? v.accSummaryRows.reduce((s2, r) => s2 + (r.cgst || 0), 0) : v.accountingEntries?.reduce((s2, ae) => s2 + (ae["Central Tax (₹)"] || 0), 0) || 0), 0).toLocaleString()}
                                            </td>

                                            <td className="px-3 py-3 text-xs text-slate-800 text-right bg-slate-100">
                                                ₹{groupedVouchers.reduce((s, v) => s + (v.importMode === 'item' ? v.items.reduce((s2, it) => s2 + (it["State/UT tax (₹)"] || 0), 0) : v.accSummaryRows ? v.accSummaryRows.reduce((s2, r) => s2 + (r.sgst || 0), 0) : v.accountingEntries?.reduce((s2, ae) => s2 + (ae["State/UT tax (₹)"] || 0), 0) || 0), 0).toLocaleString()}
                                            </td>

                                            <td className="px-3 py-3 text-xs text-slate-800 text-right bg-slate-100">
                                                ₹{groupedVouchers.reduce((s, v) => s + (v.accSummaryRows ? v.accSummaryRows.reduce((s2, r) => s2 + (r.discount || 0), 0) : 0), 0).toLocaleString()}
                                            </td>

                                            <td className="px-3 py-3 text-xs text-red-600 text-right bg-slate-100">
                                                ₹{groupedVouchers.reduce((s, v) => s + (v.accSummaryRows ? v.accSummaryRows.reduce((s2, r) => s2 + (r.tdsAmount || 0), 0) : 0), 0).toLocaleString()}
                                            </td>

                                            <td className="px-3 py-3 text-xs text-blue-700 text-right bg-slate-100">
                                                ₹{groupedVouchers.reduce((s, v) => s + (v["Invoice Value (₹)"] || 0), 0).toLocaleString()}
                                            </td>
                                            
                                            <td className="px-3 py-3 bg-slate-100"></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
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
