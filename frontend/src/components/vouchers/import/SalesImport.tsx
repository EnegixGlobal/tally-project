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
    _isDiscount?: boolean;
    _isParty?: boolean;
}

interface AccSummaryRow {
    taxableValue: number;
    igst: number;
    cgst: number;
    sgst: number;
    gstRate: number;
    salesLedger: string;
    discount: number;
    rowTotal: number;
    calculationWarning?: string;
}

interface GroupedVoucher {
    id: string;
    "GSTIN of Customer": string;
    "Trade/Legal name of the Customer": string;
    "Invoice number": string;
    "Invoice Date": string;
    "Invoice Value (₹)": number;
    "Place of supply": string;
    "Sales Ledger": string;
    status: "pending" | "importing" | "imported" | "error";
    errorMessage?: string;
    partyId?: string | number;
    partyMatch: boolean;
    _matchedLedgerId?: string | number;
    _matchedSalesLedgerId?: string | number;
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

const SalesImport: React.FC = () => {
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
                const invoiceNo = String(row["Invoice number"] || row["Invoice No"] || row["Voucher No"] || row["Reference No"] || row["Ref No"] || row["invoice_no"] || row["bill_no"] || (lastHeader ? lastHeader["Invoice number"] : "")).trim();
                const invoiceDate = formatDate(row["Invoice Date"] || row["Date"] || row["Invoice date"] || row["date"] || row["invoice_date"] || (lastHeader ? lastHeader["Invoice Date"] : ""));
                let rawGstin = String(row["GSTIN of Customer"] || row["GSTIN of customer"] || row["GSTIN of supplier"] || row["GSTIN"] || row["gstin"] || (lastHeader ? lastHeader["GSTIN of Customer"] : ""));
                if (rawGstin === "undefined" || rawGstin === "null") {
                    rawGstin = "";
                }
                
                let rawPartyName = String(row["Trade/Legal name of the Customer"] || row["Customer Name"] || row["Party Name"] || row["party_name"] || (lastHeader ? lastHeader["Trade/Legal name of the Customer"] : ""));
                if (rawPartyName === "undefined" || rawPartyName === "null") {
                    rawPartyName = "";
                }
                
                const rawPlaceOfSupply = String(row["Place of supply"] || row["POS"] || row["Place Of Supply"] || row["pos"] || (lastHeader ? lastHeader["Place of supply"] : ""));
                const rawSalesLedger = String(row["Sales Ledger"] || row["sales_ledger"] || row["Purchase Ledger"] || (lastHeader ? lastHeader["Sales Ledger"] : ""));
                const rawInvoiceValue = row["Invoice Value (₹)"] !== undefined ? row["Invoice Value (₹)"] : (row["Invoice Value"] || row["Total Amount"] || (lastHeader ? lastHeader["Invoice Value (₹)"] : 0));

                const gstin = rawGstin.toUpperCase().replace(/\s+/g, "").trim();
                let partyName = rawPartyName.replace(/\s+/g, " ").trim();
                let placeOfSupply = rawPlaceOfSupply.toLowerCase().replace(/\s+/g, " ").trim();

                const groupKey = `${gstin}-${invoiceNo}-${invoiceDate}`;

                lastHeader = {
                    "GSTIN of Customer": rawGstin,
                    "Trade/Legal name of the Customer": rawPartyName,
                    "Invoice number": invoiceNo,
                    "Invoice Date": invoiceDate,
                    "Place of supply": rawPlaceOfSupply,
                    "Sales Ledger": rawSalesLedger,
                    "Invoice Value (₹)": rawInvoiceValue
                };

                if (!voucherGroups[groupKey]) {
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
                            errorMessage = "Customer Name not found in ledgers";
                            // Autofix logic: find by GSTIN
                            const gstinMatch = gstin ? ledgers.find(l => {
                                const lGst = (l.gst_number || l.gstNumber) ? String(l.gst_number || l.gstNumber).toUpperCase().replace(/\s+/g, "").trim() : "";
                                return lGst === gstin;
                            }) : null;

                            if (gstinMatch) {
                                suggestedLedger = gstinMatch;
                            } else {
                                // Neither name nor GSTIN matched
                                errorMessage = "Customer Ledger does not exist";
                            }
                        }
                    } else if (!matchedLedgerByName && partyName === gstin) {
                        // Fresh GSTIN ledger case
                        errorMessage = "Customer Ledger does not exist";
                    } else if (!partyName && currentImportMode === "item") {
                        errorMessage = "Customer Name/GSTIN is required for item-wise import";
                    }

                    const excelSalesLedger = rawSalesLedger ? String(rawSalesLedger).trim().toLowerCase() : "";
                    const matchedSalesLedger = excelSalesLedger
                        ? ledgers.find(l => l.name && String(l.name).toLowerCase().replace(/\s+/g, " ").trim().includes(excelSalesLedger))
                        : null;

                    voucherGroups[groupKey] = {
                        id: `v-${index}`,
                        "GSTIN of Customer": gstin,
                        "Trade/Legal name of the Customer": partyName,
                        "Invoice number": invoiceNo,
                        "Invoice Date": invoiceDate,
                        "Invoice Value (₹)": Number(rawInvoiceValue),
                        "Place of supply": matchedLedgerByName?.state || String(rawPlaceOfSupply).trim(),
                        "Sales Ledger": String(rawSalesLedger).trim(),
                        status: errorMessage ? "error" : "pending",
                        errorMessage,
                        partyMatch: !!(matchedLedgerByName || currentImportMode === "accounting"),
                        _matchedLedgerId: matchedLedgerByName?.id || null,
                        _matchedSalesLedgerId: matchedSalesLedger?.id || null,
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
                    const customerGstin = String(row["GSTIN of Customer"] || gstin || "").trim();
                    const customerStateCode = customerGstin.slice(0, 2) || extractStateCode(placeOfSupply);
                    const isIntra = (companyStateCode && customerStateCode && companyStateCode === customerStateCode);

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

                    // Calculation Discrepancy checks
                    let calculationWarning = "";
                    const expectedTaxable = qty * rate;
                    if (qty > 0 && rate > 0 && Math.abs(expectedTaxable - taxableVal) > 0.1) {
                        calculationWarning = `Calculation Error: Qty (${qty}) * Rate (${rate}) should be ${expectedTaxable}. Found ${taxableVal}.`;
                    }
                    if (totalRate > 0) {
                        const expectedTax = (taxableVal * totalRate) / 100;
                        const foundTax = igst + cgst + sgst;
                        if (Math.abs(expectedTax - foundTax) > 0.5) {
                            calculationWarning += (calculationWarning ? " | " : "") + `Tax Discrepancy: Expected total tax ${expectedTax}, found ${foundTax}.`;
                        }
                    }

                    if (excelItemName || taxableVal > 0) {
                        const suggestedSLName = `${totalRate}% ${isIntra ? 'intra' : 'inter'} state sales`;
                        const fallbackSLName = `${totalRate}% ${isIntra ? 'local' : 'igst'} sales`;

                        if (!voucherGroups[groupKey]["Sales Ledger"] || voucherGroups[groupKey]["Sales Ledger"].toLowerCase().includes("sales account") || voucherGroups[groupKey]["Sales Ledger"] === suggestedSLName) {
                            const matchedSL = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase();
                                return lName === suggestedSLName.toLowerCase() ||
                                    lName === fallbackSLName.toLowerCase() ||
                                    (lName.includes(`${totalRate}%`) && lName.includes(isIntra ? 'intra' : 'inter')) ||
                                    (lName.includes(`${totalRate}%`) && !isIntra && lName.includes('igst'));
                            });

                            voucherGroups[groupKey]["Sales Ledger"] = matchedSL?.name || suggestedSLName;
                            voucherGroups[groupKey]._matchedSalesLedgerId = matchedSL?.id || null;
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
                            calculationWarning
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
                        const taxableVal = Number(row["Taxable Value (₹)"] || 0);
                        const gstRate = Number(row["GST Rate (%)"] || 0);
                        const salesLedger = String(row["Sales Ledger"] || row["Purchase Ledger"] || "").trim();
                        const discount = Number(row["Discount (₹)"] || 0);

                        const customerStateCode = gstin.slice(0, 2) || extractStateCode(placeOfSupply);
                        const isIntra = (companyStateCode && customerStateCode && companyStateCode === customerStateCode);

                        let igst = 0, cgst = 0, sgst = 0;
                        if (isIntra) {
                            cgst = (taxableVal * (gstRate / 2)) / 100;
                            sgst = (taxableVal * (gstRate / 2)) / 100;
                        } else {
                            igst = (taxableVal * gstRate) / 100;
                        }

                        const suggestedSLName = `${gstRate}% ${isIntra ? 'intra' : 'inter'} state sales`;
                        const fallbackSLName = `${gstRate}% ${isIntra ? 'local' : 'igst'} sales`;

                        let currentSL = (salesLedger && !salesLedger.toLowerCase().includes("sales account")) ? salesLedger : "";
                        let matchedSL = null;

                        if (currentSL) {
                            matchedSL = ledgers.find(l => String(l.name).toLowerCase().trim() === currentSL.toLowerCase().trim());
                        } else {
                            matchedSL = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase();
                                return lName === suggestedSLName.toLowerCase() ||
                                    lName === fallbackSLName.toLowerCase() ||
                                    (lName.includes(`${gstRate}%`) && lName.includes(isIntra ? 'intra' : 'inter')) ||
                                    (lName.includes(`${gstRate}%`) && !isIntra && lName.includes('igst'));
                            });
                            currentSL = matchedSL?.name || suggestedSLName;
                        }

                        const totalTax = igst + cgst + sgst;
                        const rowTotal = taxableVal + totalTax - discount;

                        if (!voucherGroups[groupKey].accSummaryRows) {
                            voucherGroups[groupKey].accSummaryRows = [];
                            voucherGroups[groupKey]["Invoice Value (₹)"] = 0;
                            voucherGroups[groupKey].accountingEntries = [];
                        }

                        voucherGroups[groupKey]["Invoice Value (₹)"] += rowTotal;

                        let calculationWarning = "";
                        const expectedTotalTax = (taxableVal * gstRate) / 100;
                        if (Math.abs(totalTax - expectedTotalTax) > 1) {
                            calculationWarning = "Tax Discrepancy (Calculated " + expectedTotalTax.toFixed(2) + ")";
                        }

                        voucherGroups[groupKey].accSummaryRows.push({
                            taxableValue: taxableVal,
                            igst, cgst, sgst, gstRate,
                            salesLedger: currentSL,
                            discount,
                            rowTotal,
                            calculationWarning
                        });

                        // 1. --- Credit: Sales Ledger ---
                        voucherGroups[groupKey].accountingEntries!.push({
                            "Particulars (Ledger Name)": currentSL,
                            "Amount (₹)": taxableVal,
                            "Type": "credit",
                            "Rate (%)": gstRate,
                            "Integrated Tax (₹)": 0,
                            "Central Tax (₹)": 0,
                            "State/UT tax (₹)": 0,
                            calculationWarning: "",
                            _matchedLedgerId: matchedSL?.id || null
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
                                "Type": discount > 0 ? "debit" : "credit",
                                "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: discountLedger?.id,
                                _isDiscount: true
                            });
                        }

                        // 2. --- Credit: Tax Ledgers ---
                        if (igst > 0) {
                            const igstLedger = ledgers.find(l => {
                                const lName = String(l.name).toLowerCase();
                                return (lName.includes("igst") || lName.includes("integrated")) && !lName.includes("purchase") && !lName.includes("sale");
                            });
                            voucherGroups[groupKey].accountingEntries!.push({
                                "Particulars (Ledger Name)": igstLedger?.name || "IGST",
                                "Amount (₹)": igst,
                                "Type": "credit",
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
                                "Type": "credit",
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
                                "Type": "credit",
                                "Rate (%)": 0,
                                "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: sgstLedger?.id
                            });
                        }

                        // 3. --- Debit: Customer (Party) ---
                        let debitEntry = voucherGroups[groupKey].accountingEntries!.find(ae => ae.Type === 'debit' && !ae._isDiscount);
                        if (!debitEntry) {
                            const debitLedger = ledgers.find(l => String(l.name).toLowerCase().trim() === partyName.toLowerCase().trim());
                            debitEntry = {
                                "Particulars (Ledger Name)": partyName || "Customer",
                                "Amount (₹)": 0,
                                "Type": "debit",
                                "Rate (%)": 0,
                                "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0,
                                calculationWarning: "",
                                _matchedLedgerId: debitLedger?.id,
                                _isParty: true
                            };
                            voucherGroups[groupKey].accountingEntries!.push(debitEntry);
                        }
                        debitEntry["Amount (₹)"] = voucherGroups[groupKey]["Invoice Value (₹)"];

                    } else {
                        const particulars = String(row["Particulars (Ledger Name)"] || row["Particulars"] || "").trim();
                        if (!particulars) return;

                        const amount = Number(row["Amount (₹)"] || row["Debit Amount (₹)"] || 0);
                        const type = String(row["Type"] || "credit").toLowerCase().trim() as "credit" | "debit";
                        const gstRate = Number(row["Rate (%)"] || 0);
                        let igst = Number(row["Integrated Tax (₹)"] || 0);
                        let cgst = Number(row["Central Tax (₹)"] || 0);
                        let sgst = Number(row["State/UT tax (₹)"] || 0);

                        let calculationWarning = "";

                        if (gstRate > 0) {
                            const customerStateCode = gstin.slice(0, 2) || extractStateCode(placeOfSupply);
                            const isIntra = companyStateCode && customerStateCode && companyStateCode === customerStateCode;
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

                        const totalDebit = voucherGroups[groupKey].accountingEntries!.reduce((sum, ae) => ae.Type === 'debit' ? sum + ae["Amount (₹)"] : sum, 0);
                        if (voucherGroups[groupKey]["Invoice Value (₹)"] === 0 || Math.abs(voucherGroups[groupKey]["Invoice Value (₹)"] - totalDebit) > 1) {
                            voucherGroups[groupKey]["Invoice Value (₹)"] = totalDebit;
                        }
                    }
                }
            });

            // Post-process accounting vouchers to identify customer
            if (currentImportMode === "accounting") {
                Object.values(voucherGroups).forEach(voucher => {
                    if (!voucher["Trade/Legal name of the Customer"]) {
                        const debitEntry = voucher.accountingEntries?.find(ae => ae.Type === 'debit');
                        if (debitEntry) {
                            const customerName = debitEntry["Particulars (Ledger Name)"];
                            voucher["Trade/Legal name of the Customer"] = customerName;

                            const matchedLedger = ledgers.find(l => String(l.name).toLowerCase().trim() === String(customerName || "").toLowerCase().trim());
                            if (matchedLedger) {
                                voucher._matchedLedgerId = matchedLedger.id;
                                voucher.partyMatch = true;
                                voucher.status = "pending";
                                voucher.errorMessage = "";

                                voucher["GSTIN of Customer"] = matchedLedger.gst_number || "";
                                voucher["Place of supply"] = matchedLedger.state || "";
                                voucher._matchedGstinId = matchedLedger.id;
                                voucher._matchedStateId = matchedLedger.id;
                            } else {
                                voucher.status = "error";
                                voucher.errorMessage = `Customer ledger '${customerName}' not found`;
                                voucher._missingLedger = true;
                            }
                        } else {
                            voucher.status = "error";
                            voucher.errorMessage = "No debit entry (customer) found in voucher";
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
                    // Map keys to match expected backend route properties:
                    // Trade/Legal name of the Supplier -> Trade/Legal name of the Customer
                    // GSTIN of supplier -> GSTIN of Customer
                    // Purchase Ledger -> Sales Ledger
                    const mappedVoucher = {
                        ...updatedVouchers[i],
                        "Trade/Legal name of the Supplier": updatedVouchers[i]["Trade/Legal name of the Customer"],
                        "GSTIN of supplier": updatedVouchers[i]["GSTIN of Customer"],
                        "Purchase Ledger": updatedVouchers[i]["Sales Ledger"]
                    };

                    const response = await axios.post<{ success: boolean; errors?: string[] }>(`${import.meta.env.VITE_API_URL}/api/sales_summary_import`, {
                        voucher: mappedVoucher,
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

        // Get unique customer ledgers to create
        const toCreateMap = new Map();
        missingVouchers.forEach(v => {
            const gstin = v["GSTIN of Customer"] ? String(v["GSTIN of Customer"]).toUpperCase().replace(/\s+/g, "").trim() : "";
            const name = v["Trade/Legal name of the Customer"] ? String(v["Trade/Legal name of the Customer"]).trim() : "";

            const key = gstin ? `GSTIN-${gstin}` : `NAME-${name.toLowerCase()}`;

            if (!toCreateMap.has(key)) {
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
                        const excelCode = extractStateCode(v["Place of supply"]);
                        if (excelCode) detectedState = codeToStateName[excelCode] || v["Place of supply"];
                        else detectedState = v["Place of supply"];
                    }

                    toCreateMap.set(key, {
                        name: name,
                        gstNumber: gstin,
                        state: detectedState,
                        groupId: -110, // Sundry Debtors
                        balanceType: "debit",
                        openingBalance: 0
                    });
                }
            }
        });
        const toCreate = Array.from(toCreateMap.values());

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
                    <p>The following customers will be created under <b>Sundry Debtors</b>:</p>
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

            try {
                const ledgerRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/ledger`, {
                    params: { company_id: companyId, owner_type: ownerType, owner_id: ownerId }
                });
                const updatedLedgers = Array.isArray(ledgerRes.data) ? ledgerRes.data : [];
                setLedgers(updatedLedgers);

                // Re-match current vouchers
                setGroupedVouchers(prev => prev.map(v => {
                    if (!v._missingLedger) return v;

                    const excelName = String(v["Trade/Legal name of the Customer"] || "").toLowerCase();
                    const excelGst = v["GSTIN of Customer"].toUpperCase().replace(/\s+/g, "").trim();

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

                        let updatedEntries = v.accountingEntries ? [...v.accountingEntries] : [];
                        if (updatedEntries.length > 0) {
                            updatedEntries = updatedEntries.map(ae => {
                                if (ae["Particulars (Ledger Name)"].toLowerCase().trim() === String(v["Trade/Legal name of the Customer"] || "").toLowerCase().trim() || (v.accSummaryRows && ae.Type === 'debit')) {
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

            Swal.fire('Success', `Successfully created ${created} customer ledgers and matched them with your vouchers.`, 'success');
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
                        if (ae["Particulars (Ledger Name)"] === v["Trade/Legal name of the Customer"] || (v.accSummaryRows && ae.Type === 'debit')) {
                            return { ...ae, "Particulars (Ledger Name)": newPartyName, _matchedLedgerId: newPartyId };
                        }
                        return ae;
                    });
                }

                return {
                    ...v,
                    "Trade/Legal name of the Customer": newPartyName,
                    _matchedLedgerId: newPartyId,
                    "GSTIN of Customer": sl.gst_number || sl.gstNumber || "",
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

                let updatedEntries = v.accountingEntries ? [...v.accountingEntries] : [];
                if (updatedEntries.length > 0) {
                    updatedEntries = updatedEntries.map(ae => {
                        if (ae["Particulars (Ledger Name)"] === v["Trade/Legal name of the Customer"] ||
                            (v.accSummaryRows && ae.Type === 'debit')) {
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
                    "Trade/Legal name of the Customer": newPartyName,
                    _matchedLedgerId: newPartyId,
                    "GSTIN of Customer": newGstin,
                    "Place of supply": newState,
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
        Swal.fire({
            icon: 'success',
            title: 'Party Name Fixed',
            text: 'The customer name has been updated to match your ledger records.',
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

                    const newTaxable = qty * rate;

                    const customerStateCode = (String(voucher["GSTIN of Customer"] || "").slice(0, 2)) || extractStateCode(voucher["Place of supply"]);
                    const isIntra = (companyStateCode && customerStateCode && companyStateCode === customerStateCode);

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
                    voucher.accSummaryRows = voucher.accSummaryRows.map(row => {
                        const amount = row.taxableValue;
                        const rate = row.gstRate;

                        const customerStateCode = (String(voucher["GSTIN of Customer"] || "").slice(0, 2)) || extractStateCode(voucher["Place of supply"]);
                        const isIntra = (companyStateCode && customerStateCode && companyStateCode === customerStateCode);

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

                    // Rebuild entries
                    const newEntries: AccountingEntry[] = [];
                    voucher.accSummaryRows.forEach(row => {
                        const matchedSL = row.salesLedger ? ledgers.find(l => String(l.name).toLowerCase().trim() === row.salesLedger.toLowerCase().trim()) : null;
                        newEntries.push({
                            "Particulars (Ledger Name)": row.salesLedger || "Sales Account",
                            "Amount (₹)": row.taxableValue - row.discount,
                            "Type": "credit", "Rate (%)": row.gstRate, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: matchedSL?.id
                        });
                        if (row.igst > 0) newEntries.push({ "Particulars (Ledger Name)": ledgers.find(l => /igst/i.test(l.name))?.name || "IGST", "Amount (₹)": row.igst, "Type": "credit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: ledgers.find(l => /igst/i.test(l.name))?.id });
                        if (row.cgst > 0) newEntries.push({ "Particulars (Ledger Name)": ledgers.find(l => /cgst/i.test(l.name))?.name || "CGST", "Amount (₹)": row.cgst, "Type": "credit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: ledgers.find(l => /cgst/i.test(l.name))?.id });
                        if (row.sgst > 0) newEntries.push({ "Particulars (Ledger Name)": ledgers.find(l => /sgst|utgst/i.test(l.name))?.name || "SGST/UTGST", "Amount (₹)": row.sgst, "Type": "credit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: ledgers.find(l => /sgst|utgst/i.test(l.name))?.id });
                    });

                    const totalInvoiceValue = voucher.accSummaryRows.reduce((s, r) => s + r.rowTotal, 0);
                    const partyLedgerMatch = ledgers.find(l => String(l.name).toLowerCase().trim() === String(voucher["Trade/Legal name of the Customer"] || "").toLowerCase().trim());
                    newEntries.push({
                        "Particulars (Ledger Name)": voucher["Trade/Legal name of the Customer"] || "Customer",
                        "Amount (₹)": totalInvoiceValue,
                        "Type": "debit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: partyLedgerMatch?.id
                    });

                    return { ...voucher, accSummaryRows: voucher.accSummaryRows, accountingEntries: newEntries, "Invoice Value (₹)": totalInvoiceValue };

                } else {
                    const updatedAccountingEntries = voucher.accountingEntries?.map(ae => {
                        const amount = ae["Amount (₹)"];
                        const gstRate = ae["Rate (%)"];

                        const customerStateCode = (String(voucher["GSTIN of Customer"] || "").slice(0, 2)) || extractStateCode(voucher["Place of supply"]);
                        const isIntra = (companyStateCode && customerStateCode && companyStateCode === customerStateCode);

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

                    const totalDebit = updatedAccountingEntries?.reduce((sum, ae) => ae.Type === 'debit' ? sum + ae["Amount (₹)"] : sum, 0) || 0;

                    return {
                        ...voucher,
                        accountingEntries: updatedAccountingEntries,
                        "Invoice Value (₹)": totalDebit
                    };
                }
            }
        });

        setGroupedVouchers(fixedVouchers);
        Swal.fire({ icon: "success", title: "Calculations Fixed", text: "All taxable values and taxes have been recalculated based on Qty and Rate." });
    };

    const downloadTemplate = (mode: 'item' | 'accounting') => {
        const itemH = ["GSTIN of Customer", "Trade/Legal name of the Customer", "Invoice number", "Invoice Date", "Invoice Value (₹)", "Place of supply", "Sales Ledger", "Item Name", "HSN Code", "Batch No", "Quantity", "Item Rate (₹)", "Rate (%)", "Taxable Value (₹)"];
        const accH = ["GSTIN of Customer", "Trade/Legal name of the Customer", "Invoice number", "Invoice Date", "Invoice Value (₹)", "Place of supply", "Taxable Value (₹)", "GST Rate (%)", "Sales Ledger", "Discount (₹)"];

        const itemData = [
            ["20AAAAA0000A1Z5", "ABC CUSTOMER CORP", "INV/25-26/101", "16-02-2026", 118000, "Jharkhand(20)", "18% Inter State Sales", "Biscute", "5555", "B-001", 100, 1000, 18, 100000],
        ];
        const accData = [
            ["20AAAAA0000A1Z5", "ABC CUSTOMER CORP", "INV/25-26/102", "30/03/2026", 11800, "jharkhand", 10000, 18, "18% intra state", 0],
        ];

        const worksheet = XLSX.utils.aoa_to_sheet([mode === 'item' ? itemH : accH, ...(mode === 'item' ? itemData : accData)]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales_Import");
        XLSX.writeFile(workbook, `Sales_Import_Template_${mode}.xlsx`);
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
                            Sales Summary Import
                        </h2>
                    </div>
                    <p className="text-sm text-gray-600 ml-12">
                        Import sales invoices using GST summary layout. Group items by invoice automatically.
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
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Sales Excel File</h3>
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
                                                        <p className="text-xs font-bold text-gray-400 uppercase">Customer {voucher._matchedLedgerId && `(ID: ${voucher._matchedLedgerId})`}</p>
                                                        <p className={`font-bold text-sm flex items-center gap-1 ${!voucher.partyMatch ? "text-red-500" : "text-gray-900"}`}>
                                                            {voucher["Trade/Legal name of the Customer"]}
                                                            {voucher._matchedLedgerId && <CheckCircle size={14} className="text-green-500" />}
                                                        </p>
                                                        <div className="flex flex-col gap-0.5 mt-1">
                                                            <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                                GST: {voucher["GSTIN of Customer"]}
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
                                                {voucher.errorMessage && (
                                                    <div className="flex flex-col items-end">
                                                        <p className="text-[10px] text-red-500 mt-1 max-w-[200px] text-right">{voucher.errorMessage}</p>
                                                        {voucher._suggestedLedger && (
                                                            <button
                                                                onClick={() => fixVoucherParty(voucher.id)}
                                                                className="mt-1 px-2 py-1 bg-blue-100 text-blue-700 text-[9px] font-bold rounded border border-blue-200 hover:bg-blue-200 transition-colors flex items-center gap-1 shadow-sm"
                                                            >
                                                                <RefreshCw size={10} className="text-blue-600" />
                                                                Autofix: Use "{voucher._suggestedLedger.name}"
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
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
                                                            {voucher.accSummaryRows.some(r => r.igst > 0) && <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">IGST (₹)</th>}
                                                            {voucher.accSummaryRows.some(r => r.cgst > 0) && <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">CGST (₹)</th>}
                                                            {voucher.accSummaryRows.some(r => r.sgst > 0) && <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">SGST (₹)</th>}
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-center">GST Rate</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sales Ledger</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Discount (₹)</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Invoice Total</th>
                                                        </>
                                                    ) : importMode === 'item' ? (
                                                        <>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-16">No</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Item Name</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">HSN</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Batch</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Qty</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Rate</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Taxable</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">GST %</th>
                                                            {voucher.items.some(it => it["Integrated Tax (₹)"] > 0) && <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">IGST</th>}
                                                            {voucher.items.some(it => it["Central Tax (₹)"] > 0) && <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">CGST</th>}
                                                            {voucher.items.some(it => it["State/UT tax (₹)"] > 0) && <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">SGST</th>}
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Tax Amt</th>
                                                            <th className="px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sales Ledger</th>
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
                                                    voucher.items.map((item, ii) => {
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
                                                                {voucher.items.some(it => it["Integrated Tax (₹)"] > 0) && <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["Integrated Tax (₹)"].toLocaleString()}</td>}
                                                                {voucher.items.some(it => it["Central Tax (₹)"] > 0) && <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["Central Tax (₹)"].toLocaleString()}</td>}
                                                                {voucher.items.some(it => it["State/UT tax (₹)"] > 0) && <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["State/UT tax (₹)"].toLocaleString()}</td>}
                                                                <td className="px-6 py-3 text-sm text-blue-600 text-right font-bold relative">
                                                                    ₹{taxAmt.toLocaleString()}
                                                                    {item.calculationWarning?.includes("Tax Discrepancy") && <AlertTriangle size={12} className="text-amber-500 absolute -top-1 right-1" />}
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <div className="flex flex-col">
                                                                        <div className="flex items-center gap-1">
                                                                            <span className="text-xs text-gray-700">{voucher["Sales Ledger"]}</span>
                                                                            {voucher._matchedSalesLedgerId && <CheckCircle size={10} className="text-green-500" />}
                                                                        </div>
                                                                        {voucher._matchedSalesLedgerId && <span className="text-[9px] text-gray-400">ID: {voucher._matchedSalesLedgerId}</span>}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : voucher.accSummaryRows ? (
                                                    voucher.accSummaryRows.map((row, ri) => (
                                                        <tr key={ri} className="hover:bg-blue-50/30 transition-colors">
                                                            <td className="px-6 py-3 text-sm text-gray-400 font-medium">{ri + 1}</td>
                                                            <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold">₹{row.taxableValue.toLocaleString()}</td>
                                                            {voucher.accSummaryRows.some(r => r.igst > 0) && <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{row.igst.toLocaleString()}</td>}
                                                            {voucher.accSummaryRows.some(r => r.cgst > 0) && <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{row.cgst.toLocaleString()}</td>}
                                                            {voucher.accSummaryRows.some(r => r.sgst > 0) && <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{row.sgst.toLocaleString()}</td>}
                                                            <td className="px-6 py-3 text-sm text-gray-600 text-center">{row.gstRate}%</td>
                                                            <td className="px-6 py-3">
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-gray-700">{row.salesLedger}</span>
                                                                    {ledgers.some(l => String(l.name).toLowerCase().trim() === row.salesLedger.toLowerCase().trim())
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

export default SalesImport;
