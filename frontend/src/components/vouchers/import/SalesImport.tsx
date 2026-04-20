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
    X,
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
    const matchParens = cleanPos.match(/\((\d{2})\)/);
    if (matchParens) return matchParens[1];
    const matchStart = cleanPos.match(/^(\d{2})/);
    if (matchStart) return matchStart[1];
    const matchEnd = cleanPos.match(/(\d{2})$/);
    if (matchEnd) return matchEnd[1];
    const nameOnly = cleanPos.replace(/[0-9\(\)\-]+/g, "").trim();
    if (stateNameToCode[nameOnly]) return stateNameToCode[nameOnly];
    for (const [name, code] of Object.entries(stateNameToCode)) {
        if (nameOnly.includes(name) || name.includes(nameOnly)) return code;
    }
    return "";
};

const isValidGSTIN = (gstin: string): boolean => {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
};

const SalesImport: React.FC = () => {
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
        if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
        else if (e.type === "dragleave") setDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleFileSelect = (file: File) => {
        if (!file) return;
        const validTypes = ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"];
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
                const cleanDate = dateValue.trim();
                const dmyMatch = cleanDate.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
                if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
                const ymdMatch = cleanDate.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
                if (ymdMatch) return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
            }
            const d = new Date(dateValue);
            return isNaN(d.getTime()) ? new Date().toISOString().split("T")[0] : d.toISOString().split("T")[0];
        } catch { return new Date().toISOString().split("T")[0]; }
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

            const firstRow = jsonData[0];
            const isItemImport = firstRow.hasOwnProperty("Item Name");
            const isAccountingImport = firstRow.hasOwnProperty("Particulars (Ledger Name)") || firstRow.hasOwnProperty("Particulars");
            const isAccSummaryImport = !isItemImport && !isAccountingImport && firstRow.hasOwnProperty("GST Rate (%)");
            const currentImportMode: "item" | "accounting" = isItemImport ? "item" : (isAccountingImport || isAccSummaryImport ? "accounting" : "item");
            setImportMode(currentImportMode);

            jsonData.forEach((row, index) => {
                const invoiceNo = String(row["Invoice number"] || row["Invoice No"] || row["Voucher No"] || row["Reference No"] || row["Ref No"] || row["invoice_no"] || row["bill_no"] || (lastHeader ? lastHeader["Invoice number"] : "")).trim();
                const invoiceDate = formatDate(row["Invoice Date"] || row["Date"] || row["Invoice date"] || row["date"] || row["invoice_date"] || (lastHeader ? lastHeader["Invoice Date"] : ""));
                const rawGstin = String(row["GSTIN of Customer"] || row["GSTIN of customer"] || row["GSTIN of supplier"] || row["GSTIN"] || row["gstin"] || (lastHeader ? lastHeader["GSTIN of Customer"] : ""));
                const rawPartyName = String(row["Trade/Legal name of the Customer"] || row["Trade/Legal name of the Customer"] || row["Trade/Legal name of the Supplier"] || row["Customer Name"] || row["Supplier Name"] || row["Party Name"] || row["party_name"] || (lastHeader ? lastHeader["Trade/Legal name of the Customer"] : ""));
                const rawPlaceOfSupply = String(row["Place of supply"] || row["POS"] || row["Place Of Supply"] || row["pos"] || (lastHeader ? lastHeader["Place of supply"] : ""));
                const rawSalesLedger = String(row["Sales Ledger"] || row["sales_ledger"] || row["Purchase Ledger"] || (lastHeader ? lastHeader["Sales Ledger"] : ""));
                const rawInvoiceValue = row["Invoice Value (₹)"] !== undefined ? row["Invoice Value (₹)"] : (row["Invoice Value"] || row["Total Amount"] || (lastHeader ? lastHeader["Invoice Value (₹)"] : 0));

                const gstin = rawGstin.toUpperCase().replace(/\s+/g, "").trim();
                const partyName = rawPartyName.replace(/\s+/g, " ").trim();
                const placeOfSupply = rawPlaceOfSupply.toLowerCase().replace(/\s+/g, " ").trim();

                const groupKey = `${gstin}-${invoiceNo}-${invoiceDate}`;
                lastHeader = { "GSTIN of Customer": rawGstin, "Trade/Legal name of the Customer": rawPartyName, "Invoice number": invoiceNo, "Invoice Date": invoiceDate, "Place of supply": rawPlaceOfSupply, "Sales Ledger": rawSalesLedger, "Invoice Value (₹)": rawInvoiceValue };

                if (!voucherGroups[groupKey]) {
                    let matchedLedgerByName = null;
                    let stateMatch = false, gstMatch = false, errorMessage = "";

                    if (partyName) {
                        const excelName = partyName.toLowerCase();
                        matchedLedgerByName = ledgers.find(l => (l.name ? String(l.name).toLowerCase().replace(/\s+/g, " ").trim() : "") === excelName);
                        if (matchedLedgerByName) {
                            const lGst = (matchedLedgerByName.gstNumber || matchedLedgerByName.gst_number) ? String(matchedLedgerByName.gstNumber || matchedLedgerByName.gst_number).toUpperCase().replace(/\s+/g, "").trim() : "";
                            const lState = matchedLedgerByName.state ? String(matchedLedgerByName.state).toLowerCase().replace(/\s+/g, " ").trim() : "";
                            gstMatch = lGst === gstin;
                            const excelStateCode = extractStateCode(placeOfSupply);
                            const ledgerStateCode = extractStateCode(lState);
                            stateMatch = (excelStateCode && ledgerStateCode && excelStateCode === ledgerStateCode) || lState === placeOfSupply || lState.includes(placeOfSupply) || placeOfSupply.includes(lState);
                            if (!gstMatch && !stateMatch) errorMessage = "GSTIN and State mismatch";
                            else if (!gstMatch && gstin) errorMessage = `GSTIN mismatch (Ledger has: ${lGst || 'Empty'})`;
                            else if (!stateMatch) errorMessage = `State mismatch (Ledger has: ${lState || 'Empty'})`;
                        } else errorMessage = "Customer Name not found in ledgers";
                    } else if (currentImportMode === "item") errorMessage = "Customer Name is required for item-wise import";

                    const excelSalesLedger = rawSalesLedger ? String(rawSalesLedger).trim().toLowerCase() : "";
                    const matchedSalesLedger = excelSalesLedger ? ledgers.find(l => l.name && String(l.name).toLowerCase().replace(/\s+/g, " ").trim().includes(excelSalesLedger)) : null;

                    voucherGroups[groupKey] = { id: `v-${index}`, "GSTIN of Customer": gstin, "Trade/Legal name of the Customer": partyName, "Invoice number": invoiceNo, "Invoice Date": invoiceDate, "Invoice Value (₹)": Number(rawInvoiceValue), "Place of supply": String(rawPlaceOfSupply).trim(), "Sales Ledger": String(rawSalesLedger).trim(), status: errorMessage ? "error" : "pending", errorMessage, partyMatch: !!(matchedLedgerByName || currentImportMode === "accounting"), _matchedLedgerId: matchedLedgerByName?.id || null, _matchedSalesLedgerId: matchedSalesLedger?.id || null, _matchedGstinId: gstMatch ? (matchedLedgerByName?.id || null) : null, _matchedStateId: stateMatch ? (matchedLedgerByName?.id || null) : null, items: [], accountingEntries: [], importMode: currentImportMode };
                }

                if (currentImportMode === "item") {
                    let matchedItem: any = null;
                    const excelItemName = row["Item Name"] ? String(row["Item Name"]).trim().toLowerCase() : "";
                    if (excelItemName) matchedItem = items.find(it => it.name && String(it.name).toLowerCase().trim() === excelItemName);
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
                    let igst = Number(row["Integrated Tax (₹)"] || 0), cgst = Number(row["Central Tax (₹)"] || 0), sgst = Number(row["State/UT tax (₹)"] || 0), calculationWarning = "";
                    const expectedTaxable = qty * rate;
                    if (qty > 0 && rate > 0 && Math.abs(expectedTaxable - taxableVal) > 0.1) calculationWarning = `Calculation Error: Qty (${qty}) * Rate (${rate}) should be ${expectedTaxable}. Found ${taxableVal}.`;
                    if (totalRate > 0 && igst === 0 && cgst === 0 && sgst === 0) {
                        const supplierGstin = String(row["GSTIN of Customer"] || "").trim();
                        const supplierGstinCode = supplierGstin.slice(0, 2);
                        const excelPosCode = extractStateCode(placeOfSupply);
                        if (supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode) { cgst = (taxableVal * (totalRate / 2)) / 100; sgst = (taxableVal * (totalRate / 2)) / 100; igst = 0; }
                        else { igst = (taxableVal * totalRate) / 100; cgst = 0; sgst = 0; }
                    } else if (totalRate > 0) {
                        const expectedTax = (taxableVal * totalRate) / 100, foundTax = igst + cgst + sgst;
                        if (Math.abs(expectedTax - foundTax) > 0.5) calculationWarning += (calculationWarning ? " | " : "") + `Tax Discrepancy: Expected total tax ${expectedTax}, found ${foundTax}.`;
                    }

                    if (excelItemName || taxableVal > 0) {
                        voucherGroups[groupKey].items.push({ "Item Name": String(row["Item Name"] || "").trim(), "HSN Code": excelHsn, "Batch No": String(row["Batch No"] || "").trim(), "Quantity": qty, "Item Rate (₹)": rate, "Rate (%)": totalRate, "Taxable Value (₹)": taxableVal, "Integrated Tax (₹)": igst, "Central Tax (₹)": cgst, "State/UT tax (₹)": sgst, _matchedItemId: matchedItem?.id || null, _matchedHsnId: matchedHsnId, _matchedBatchFound: matchedBatchFound, calculationWarning });
                        const currentItems = voucherGroups[groupKey].items, newSubtotal = currentItems.reduce((sum, it) => sum + it["Taxable Value (₹)"], 0), newTax = currentItems.reduce((sum, it) => sum + it["Integrated Tax (₹)"] + it["Central Tax (₹)"] + it["State/UT tax (₹)"], 0);
                        const calcInvoiceVal = newSubtotal + newTax;
                        if (Math.abs(voucherGroups[groupKey]["Invoice Value (₹)"] - calcInvoiceVal) > 1 || voucherGroups[groupKey]["Invoice Value (₹)"] === 0) voucherGroups[groupKey]["Invoice Value (₹)"] = calcInvoiceVal;
                    }
                } else if (currentImportMode === "accounting") {
                    if (isAccSummaryImport) {
                        const taxableVal = Number(row["Taxable Value (₹)"] || 0), igst = Number(row["Integrated Tax (₹)"] || 0), cgst = Number(row["Central Tax (₹)"] || 0), sgst = Number(row["State/UT tax (₹)"] || 0), gstRate = Number(row["GST Rate (%)"] || 0), salesLedger = String(row["Sales Ledger"] || row["Sales Account"] || row["Purchase Ledger"] || row["Purchase Account"] || "").trim(), discount = Number(row["Discount (₹)"] || 0), totalTax = igst + cgst + sgst, rowTotal = taxableVal + totalTax - discount;
                        if (!voucherGroups[groupKey].accSummaryRows) { voucherGroups[groupKey].accSummaryRows = []; voucherGroups[groupKey]["Invoice Value (₹)"] = 0; voucherGroups[groupKey].accountingEntries = []; }
                        voucherGroups[groupKey]["Invoice Value (₹)"] += rowTotal;
                        let calculationWarning = "";
                        const totalTaxRow = igst + cgst + sgst, expectedTotalTax = (taxableVal * gstRate) / 100;
                        if (Math.abs(totalTaxRow - expectedTotalTax) > 1) calculationWarning = "Tax Discrepancy (Calculated " + expectedTotalTax.toFixed(2) + ")";
                        voucherGroups[groupKey].accSummaryRows.push({ taxableValue: taxableVal, igst, cgst, sgst, gstRate, salesLedger, discount, rowTotal, calculationWarning });
                        voucherGroups[groupKey].accountingEntries!.push({ "Particulars (Ledger Name)": salesLedger || "Sales Account", "Amount (₹)": taxableVal, "Type": "credit", "Rate (%)": gstRate, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: salesLedger ? ledgers.find(l => String(l.name).toLowerCase().trim() === salesLedger.toLowerCase().trim())?.id : null });
                        if (discount !== 0) {
                            const discountLedger = ledgers.find(l => /discount/i.test(String(l.name)));
                            voucherGroups[groupKey].accountingEntries!.push({ "Particulars (Ledger Name)": discountLedger?.name || "Discount", "Amount (₹)": Math.abs(discount), "Type": discount > 0 ? "debit" : "credit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: discountLedger?.id });
                        }
                        if (igst > 0) { const igstLedger = ledgers.find(l => /igst/i.test(String(l.name))); voucherGroups[groupKey].accountingEntries!.push({ "Particulars (Ledger Name)": igstLedger?.name || "IGST", "Amount (₹)": igst, "Type": "credit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: igstLedger?.id }); }
                        if (cgst > 0) { const cgstLedger = ledgers.find(l => /cgst/i.test(String(l.name))); voucherGroups[groupKey].accountingEntries!.push({ "Particulars (Ledger Name)": cgstLedger?.name || "CGST", "Amount (₹)": cgst, "Type": "credit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: cgstLedger?.id }); }
                        if (sgst > 0) { const sgstLedger = ledgers.find(l => /sgst|utgst/i.test(String(l.name))); voucherGroups[groupKey].accountingEntries!.push({ "Particulars (Ledger Name)": sgstLedger?.name || "SGST/UTGST", "Amount (₹)": sgst, "Type": "credit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: sgstLedger?.id }); }
                        let debitEntry = voucherGroups[groupKey].accountingEntries!.find(ae => ae.Type === 'debit');
                        if (!debitEntry) {
                            const debitLedger = ledgers.find(l => String(l.name).toLowerCase().trim() === partyName.toLowerCase().trim());
                            debitEntry = { "Particulars (Ledger Name)": partyName || "Customer", "Amount (₹)": 0, "Type": "debit", "Rate (%)": 0, "Integrated Tax (₹)": 0, "Central Tax (₹)": 0, "State/UT tax (₹)": 0, calculationWarning: "", _matchedLedgerId: debitLedger?.id };
                            voucherGroups[groupKey].accountingEntries!.push(debitEntry);
                        }
                        debitEntry["Amount (₹)"] = voucherGroups[groupKey]["Invoice Value (₹)"];
                    } else {
                        const particulars = String(row["Particulars (Ledger Name)"] || row["Particulars"] || "").trim();
                        if (!particulars) return;
                        const amount = Number(row["Amount (₹)"] || row["Debit Amount (₹)"] || 0), type = String(row["Type"] || "credit").toLowerCase().trim() as "credit" | "debit", gstRate = Number(row["Rate (%)"] || 0);
                        let igst = Number(row["Integrated Tax (₹)"] || 0), cgst = Number(row["Central Tax (₹)"] || 0), sgst = Number(row["State/UT tax (₹)"] || 0), calculationWarning = "";
                        if (gstRate > 0 && igst === 0 && cgst === 0 && sgst === 0) {
                            const supplierGstinCode = gstin.slice(0, 2), excelPosCode = extractStateCode(placeOfSupply), isIntra = supplierGstinCode && excelPosCode && supplierGstinCode === excelPosCode;
                            if (isIntra) { cgst = (amount * (gstRate / 2)) / 100; sgst = (amount * (gstRate / 2)) / 100; } else igst = (amount * gstRate) / 100;
                        } else if (gstRate > 0) {
                            const expectedTax = (amount * gstRate) / 100, foundTax = igst + cgst + sgst;
                            if (Math.abs(expectedTax - foundTax) > 0.5) calculationWarning += `Tax Discrepancy: Expected ${expectedTax}, found ${foundTax}.`;
                        }
                        const matchedLedger = ledgers.find(l => l.name.toLowerCase().trim() === particulars.toLowerCase().trim());
                        voucherGroups[groupKey].accountingEntries!.push({ "Particulars (Ledger Name)": particulars, "Amount (₹)": amount, "Type": type, "Rate (%)": gstRate, "Integrated Tax (₹)": igst, "Central Tax (₹)": cgst, "State/UT tax (₹)": sgst, calculationWarning, _matchedLedgerId: matchedLedger?.id || undefined });
                        const totalDebit = voucherGroups[groupKey].accountingEntries!.reduce((sum, ae) => ae.Type === 'debit' ? sum + ae["Amount (₹)"] : sum, 0);
                        if (voucherGroups[groupKey]["Invoice Value (₹)"] === 0 || Math.abs(voucherGroups[groupKey]["Invoice Value (₹)"] - totalDebit) > 1) voucherGroups[groupKey]["Invoice Value (₹)"] = totalDebit;
                    }
                }
            });

            if (currentImportMode === "accounting") {
                Object.values(voucherGroups).forEach(voucher => {
                    if (!voucher["Trade/Legal name of the Customer"]) {
                        const debitEntry = voucher.accountingEntries?.find(ae => ae.Type === 'debit');
                        if (debitEntry) {
                            const customerName = debitEntry["Particulars (Ledger Name)"];
                            voucher["Trade/Legal name of the Customer"] = customerName;
                            const matchedLedger = ledgers.find(l => l.name.toLowerCase().trim() === customerName.toLowerCase().trim());
                            if (matchedLedger) { voucher._matchedLedgerId = matchedLedger.id; voucher.partyMatch = true; voucher.status = "pending"; voucher.errorMessage = ""; voucher["GSTIN of Customer"] = matchedLedger.gst_number || ""; voucher["Place of supply"] = matchedLedger.state || ""; voucher._matchedGstinId = matchedLedger.id; voucher._matchedStateId = matchedLedger.id; }
                            else { voucher.status = "error"; voucher.errorMessage = `Customer ledger '${customerName}' not found`; }
                        } else { voucher.status = "error"; voucher.errorMessage = "No debit entry (customer) found in voucher"; }
                    }
                });
            }
            setGroupedVouchers(Object.values(voucherGroups));
            setActiveTab("preview");
        } catch (err) { console.error("File Read Error:", err); alert("Invalid Excel file!"); } finally { setIsProcessing(false); }
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
                updatedVouchers[i].status = "importing"; setGroupedVouchers([...updatedVouchers]);
                try {
                    const response = await axios.post<{ success: boolean; errors?: string[] }>(`${import.meta.env.VITE_API_URL}/api/sales_summary_import`, { voucher: updatedVouchers[i], companyId, ownerType, ownerId });
                    if (response.data.success) updatedVouchers[i].status = "imported";
                    else { updatedVouchers[i].status = "error"; updatedVouchers[i].errorMessage = response.data.errors?.[0] || "Import failed"; }
                } catch (error: any) { updatedVouchers[i].status = "error"; updatedVouchers[i].errorMessage = error.response?.data?.message || error.message || "Failed to save"; }
                done++; setSaveProgress({ done, total: pendingVouchers.length }); setGroupedVouchers([...updatedVouchers]);
            }
            const savedCount = updatedVouchers.filter(v => v.status === "imported").length, errorCount = updatedVouchers.filter(v => v.status === "error").length;
            if (savedCount > 0 && errorCount === 0) Swal.fire({ icon: "success", title: "All Vouchers Imported!", html: `<b>${savedCount}</b> vouchers saved successfully.` });
            else if (savedCount > 0 || errorCount > 0) Swal.fire({ icon: savedCount > 0 ? "warning" : "error", title: savedCount > 0 ? "Partial Import Completed" : "Import Failed", html: `<p><b>${savedCount}</b> saved, <b>${errorCount}</b> failed.</p>`, });
        } catch (err) { console.error("Save Error:", err); Swal.fire({ icon: "error", title: "Error", text: "Something went wrong while saving." }); } finally { setIsProcessing(false); }
    };


    const downloadTemplate = (mode: "item" | "accounting") => {
        const data = mode === 'item' ? [{ "Invoice number": "INV-001", "Invoice Date": "01-04-2024", "GSTIN of Customer": "09AAAAA0000A1Z5", "Trade/Legal name of the Customer": "ABC Corp", "Place of supply": "Uttar Pradesh (09)", "Sales Ledger": "Sales A/c", "Item Name": "Laptop", "HSN Code": "8471", "Batch No": "B001", "Quantity": 10, "Item Rate (₹)": 50000, "Rate (%)": 18, "Taxable Value (₹)": 500000, "Integrated Tax (₹)": 0, "Central Tax (₹)": 45000, "State/UT tax (₹)": 45000, "Invoice Value (₹)": 590000 }] : [{ "Invoice number": "INV-002", "Invoice Date": "01-04-2024", "GSTIN of Customer": "09AAAAA0000A1Z5", "Trade/Legal name of the Customer": "XYZ Ltd", "Place of supply": "Uttar Pradesh (09)", "Particulars (Ledger Name)": "Sales Account", "Amount (₹)": 100000, "Type": "credit", "Rate (%)": 18, "Integrated Tax (₹)": 0, "Central Tax (₹)": 9000, "State/UT tax (₹)": 9000, "Invoice Value (₹)": 118000 }];
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, `SalesImport_${mode}_Template.xlsx`);
    };

    const pendingCount = groupedVouchers.filter(v => v.status === "pending").length, errorCount = groupedVouchers.filter(v => v.status === "error").length, importedCount = groupedVouchers.filter(v => v.status === "imported").length;

    return (
        <div className="pt-[68px] min-h-screen bg-gray-50/50 p-4 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate("/app/vouchers")} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm border border-gray-100 group">
                            <ArrowLeft className="text-gray-600 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Sales Import</h2>
                            <p className="text-gray-500 font-medium">Bulk import GST Sales Summary from Excel/CSV</p>
                        </div>
                    </div>

                    <div className="flex items-center bg-white p-1 rounded-2xl shadow-sm border border-gray-200">
                        <button onClick={() => setActiveTab("import")} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'import' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-800'}`}>Import</button>
                        <button onClick={() => setActiveTab("preview")} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'preview' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-800'}`}>Preview ({groupedVouchers.length})</button>
                        <button onClick={() => setActiveTab("templates")} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'templates' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-800'}`}>Templates</button>
                    </div>
                </div>

                {activeTab === "import" && (
                    <div className={`bg-white border-2 border-dashed rounded-[2rem] p-12 transition-all duration-300 flex flex-col items-center justify-center text-center ${dragActive ? 'border-blue-500 bg-blue-50/50 scale-[0.99]' : 'border-gray-200 hover:border-blue-400 bg-white shadow-xl shadow-blue-500/5'}`} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}>
                        <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-blue-50/50">
                            <Upload className="text-blue-600" size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Upload Sales Summary</h3>
                        <p className="text-gray-500 mb-8 max-w-sm font-medium">Drag and drop your Excel/CSV file here, or click to browse from your computer.</p>
                        <input ref={fileInputRef} type="file" className="hidden" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
                        <button onClick={() => fileInputRef.current?.click()} className="px-10 py-4 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 font-bold transition-all shadow-xl hover:shadow-2xl active:scale-95 flex items-center space-x-2">
                            <FileSpreadsheet size={20} />
                            <span>Select Excel File</span>
                        </button>
                        <div className="mt-8 flex items-center space-x-6 text-sm text-gray-400 font-bold uppercase tracking-wider">
                            <span>Supported: .XLSX</span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                            <span>.XLS</span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                            <span>.CSV</span>
                        </div>
                    </div>
                )}

                {activeTab === "preview" && (
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center space-x-8">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 font-bold uppercase mb-1">Total Found</span>
                                    <span className="text-2xl font-black text-gray-900">{groupedVouchers.length}</span>
                                </div>
                                <div className="w-px h-10 bg-gray-100"></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-green-500 font-bold uppercase mb-1">Ready</span>
                                    <span className="text-2xl font-black text-green-600">{pendingCount}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-red-400 font-bold uppercase mb-1">Errors</span>
                                    <span className="text-2xl font-black text-red-500">{errorCount}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-blue-400 font-bold uppercase mb-1">Imported</span>
                                    <span className="text-2xl font-black text-blue-500">{importedCount}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 ml-auto">
                                {errorCount > 0 && (
                                    <button 
                                        onClick={() => setGroupedVouchers(prev => prev.filter(v => v.status !== "error"))} 
                                        className="px-6 py-3 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-bold transition-all flex items-center space-x-2 border border-red-100"
                                    >
                                        <X size={18} />
                                        <span>Cancel All Errors</span>
                                    </button>
                                )}
                                <button disabled={pendingCount === 0 || isProcessing} onClick={saveImportedVouchers} className="px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-all shadow-lg shadow-blue-200 flex items-center space-x-2">
                                    {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                                    <span>{isProcessing ? `Importing... (${saveProgress.done}/${saveProgress.total})` : `Start Import (${pendingCount})`}</span>
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {groupedVouchers.map((voucher, vi) => (
                                <div key={vi} className={`bg-white rounded-[2rem] overflow-hidden border transition-all ${voucher.status === 'imported' ? 'border-green-200 opacity-75' : voucher.status === 'error' ? 'border-red-200 ring-4 ring-red-50' : 'border-gray-200 shadow-sm'}`}>
                                    <div className="px-8 py-5 flex items-center justify-between border-b border-gray-50">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Invoice No</span>
                                                <span className="text-sm font-black text-gray-900">{voucher["Invoice number"]}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Date</span>
                                                <span className="text-sm font-bold text-gray-700">{voucher["Invoice Date"]}</span>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">Customer</span>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-bold ${voucher.partyMatch ? 'text-gray-900' : 'text-amber-600'}`}>{voucher["Trade/Legal name of the Customer"]}</span>
                                                    {voucher.partyMatch ? <CheckCircle size={14} className="text-green-500" /> : <AlertTriangle size={14} className="text-amber-500" />}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase">GSTIN</span>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-sm text-gray-500 font-mono tracking-tighter">{voucher["GSTIN of Customer"]}</span>
                                                    {voucher["GSTIN of Customer"] && /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(voucher["GSTIN of Customer"]) && <CheckCircle size={12} className="text-green-500" title="Valid GSTIN Format" />}
                                                    {voucher._matchedGstinId && <CheckCircle size={12} className="text-blue-500" title="Matched with Ledger" />}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right mr-4">
                                                <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Value</span>
                                                <span className="text-lg font-black text-blue-600">₹{voucher["Invoice Value (₹)"].toLocaleString()}</span>
                                            </div>
                                            {voucher.status === 'error' ? (
                                                <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100 flex items-center gap-2">
                                                    <AlertTriangle size={14} />
                                                    {voucher.errorMessage}
                                                </div>
                                            ) : voucher.status === 'imported' ? (
                                                <div className="px-4 py-2 bg-green-50 text-green-600 rounded-xl text-xs font-bold border border-green-100 flex items-center gap-2">
                                                    <CheckCircle size={14} />
                                                    Saved
                                                </div>
                                            ) : (
                                                <div className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold border border-blue-100">Ready</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50/50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">#</th>
                                                    {importMode === 'item' ? (
                                                        <>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Item Name</th>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">HSN</th>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Batch</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Qty</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Rate</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Taxable</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">GST%</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">IGST</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">CGST</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">SGST</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Total</th>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Ledger Account</th>
                                                        </>
                                                    ) : voucher.accSummaryRows ? (
                                                        <>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Taxable Value</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">IGST</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">CGST</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">SGST</th>
                                                            <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase">GST %</th>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Ledger</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Discount</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Total</th>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Particulars</th>
                                                            <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase">Type</th>
                                                            <th className="px-6 py-3 text-right text-[10px] font-bold text-gray-400 uppercase">Amount</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {importMode === 'item' ? (
                                                    voucher.items.map((item, ii) => {
                                                        const taxAmt = item["Integrated Tax (₹)"] + item["Central Tax (₹)"] + item["State/UT tax (₹)"];
                                                        return (
                                                            <tr key={ii} className="hover:bg-blue-50/30 transition-colors">
                                                                <td className="px-6 py-3 text-sm text-gray-400 font-medium">{ii + 1}</td>
                                                                <td className="px-6 py-3"><div className="flex flex-col"><div className="flex items-center gap-1"><span className="text-sm font-semibold text-gray-700">{item["Item Name"]}</span>{item._matchedItemId ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-amber-400" />}</div>{item._matchedItemId && <span className="text-[10px] text-gray-400">ID: {item._matchedItemId}</span>}</div></td>
                                                                <td className="px-6 py-3"><div className="flex items-center gap-1"><span className="text-xs text-gray-500">{item["HSN Code"]}</span>{item._matchedHsnId && <CheckCircle size={10} className="text-green-500" />}</div></td>
                                                                <td className="px-6 py-3"><div className="flex flex-col"><div className="flex items-center gap-1"><span className="text-xs text-gray-500 uppercase">{item["Batch No"] || "-"}</span>{item._matchedBatchFound && <CheckCircle size={10} className="text-green-500" />}</div>{item._matchedBatchFound && <span className="text-[9px] text-gray-400">Match Found</span>}</div></td>
                                                                <td className="px-6 py-3 text-sm text-gray-700 text-right font-medium">{item["Quantity"]}</td>
                                                                <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{item["Item Rate (₹)"].toLocaleString()}</td>
                                                                <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold relative">₹{item["Taxable Value (₹)"].toLocaleString()}{item.calculationWarning?.includes("Qty") && <AlertTriangle size={12} className="text-red-500 absolute -top-1 right-1" />}</td>
                                                                <td className="px-6 py-3 text-sm text-gray-700 text-right">{item["Rate (%)"]}%</td>
                                                                <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["Integrated Tax (₹)"].toLocaleString()}</td>
                                                                <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["Central Tax (₹)"].toLocaleString()}</td>
                                                                <td className="px-6 py-3 text-sm text-gray-600 text-right">₹{item["State/UT tax (₹)"].toLocaleString()}</td>
                                                                <td className="px-6 py-3 text-sm text-blue-600 text-right font-bold relative">₹{taxAmt.toLocaleString()}{item.calculationWarning?.includes("Tax Discrepancy") && <AlertTriangle size={12} className="text-amber-500 absolute -top-1 right-1" />}</td>
                                                                <td className="px-6 py-3"><div className="flex flex-col"><div className="flex items-center gap-1"><span className="text-xs text-gray-700">{voucher["Sales Ledger"]}</span>{voucher._matchedSalesLedgerId && <CheckCircle size={10} className="text-green-500" />}</div>{voucher._matchedSalesLedgerId && <span className="text-[9px] text-gray-400">ID: {voucher._matchedSalesLedgerId}</span>}</div></td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : voucher.accSummaryRows ? (
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
                                                                    <span className="text-xs text-gray-700">{row.salesLedger}</span>
                                                                    {ledgers.some(l => String(l.name).toLowerCase().trim() === row.salesLedger.toLowerCase().trim()) ? <CheckCircle size={10} className="text-green-500" /> : <AlertTriangle size={10} className="text-amber-400" />}
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">₹{row.discount.toLocaleString()}</td>
                                                            <td className="px-6 py-3 text-sm text-blue-600 text-right font-bold relative">₹{row.rowTotal.toLocaleString()}{row.calculationWarning && <AlertTriangle size={12} className="text-amber-500 absolute -top-1 right-1" title={row.calculationWarning} />}</td>
                                                        </tr>
                                                    ))
                                                ) : (
                                                    voucher.accountingEntries?.map((ae, ai) => {
                                                        const isMatch = ledgers.some(l => l.name.toLowerCase().trim() === ae["Particulars (Ledger Name)"].toLowerCase().trim());
                                                        return (
                                                            <tr key={ai} className="hover:bg-blue-50/30 transition-colors">
                                                                <td className="px-6 py-3 text-sm text-gray-400 font-medium">{ai + 1}</td>
                                                                <td className="px-6 py-3"><div className="flex items-center gap-1"><span className="text-sm font-semibold text-gray-700">{ae["Particulars (Ledger Name)"]}{ae._matchedLedgerId && (<span className="text-gray-400 font-normal ml-1">({ae._matchedLedgerId})</span>)}</span>{isMatch ? <CheckCircle size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-amber-400" />}</div></td>
                                                                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ae.Type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{ae.Type}</span></td>
                                                                <td className="px-6 py-3 text-sm text-gray-900 text-right font-bold">₹{ae["Amount (₹)"].toLocaleString()}</td>
                                                            </tr>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                            <tfoot className="bg-gray-50/50 border-t border-gray-100">
                                                <tr className="font-bold">
                                                    <td colSpan={importMode === 'item' ? 6 : (voucher.accSummaryRows ? 1 : 3)} className="px-6 py-2 text-[10px] text-gray-500 uppercase text-right">Totals</td>
                                                    <td colSpan={importMode === 'item' ? 7 : (voucher.accSummaryRows ? 8 : 1)} className="px-4 py-2 text-[11px] text-gray-900 text-right">
                                                        {importMode === 'item' ? (`₹${voucher.items.reduce((s, it) => s + it["Taxable Value (₹)"], 0).toLocaleString()}`) : (
                                                            <div className="flex items-center justify-end gap-6 py-1">
                                                                <div className="flex items-center gap-1.5"><span className="text-[9px] text-gray-400 uppercase font-bold">Total Cr ({voucher.accountingEntries?.filter(ae => ae.Type === 'credit').length}):</span><span className="text-green-700">₹{voucher.accountingEntries?.reduce((s, ae) => ae.Type === 'credit' ? s + ae["Amount (₹)"] : s, 0).toLocaleString()}</span></div>
                                                                <div className="flex items-center gap-1.5"><span className="text-[9px] text-gray-400 uppercase font-bold">Total Dr ({voucher.accountingEntries?.filter(ae => ae.Type === 'debit').length}):</span><span className="text-red-700">₹{voucher.accountingEntries?.reduce((s, ae) => ae.Type === 'debit' ? s + ae["Amount (₹)"] : s, 0).toLocaleString()}</span></div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    {importMode === 'item' && (
                                                        <><td className="px-6 py-2"></td><td className="px-6 py-2 text-[10px] text-gray-700 text-right">₹{voucher.items.reduce((s, it) => s + it["Integrated Tax (₹)"], 0).toLocaleString()}</td><td className="px-6 py-2 text-[10px] text-gray-700 text-right">₹{voucher.items.reduce((s, it) => s + it["Central Tax (₹)"], 0).toLocaleString()}</td><td className="px-6 py-2 text-[10px] text-gray-700 text-right">₹{voucher.items.reduce((s, it) => s + it["State/UT tax (₹)"], 0).toLocaleString()}</td><td className="px-6 py-2 text-sm text-blue-700 text-right">₹{voucher.items.reduce((s, it) => s + (it["Integrated Tax (₹)"] + it["Central Tax (₹)"] + it["State/UT tax (₹)"]), 0).toLocaleString()}</td><td className="px-6 py-2"></td></>
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
                            <button onClick={() => downloadTemplate('item')} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold transition-all shadow-md active:scale-95"><Download size={20} /><span>Download Item Template (.xlsx)</span></button>
                        </div>
                        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <h4 className="text-xl font-bold text-gray-900 mb-4">Accounting Invoice</h4>
                            <p className="text-gray-600 mb-6 font-medium">Use this template for multi-ledger accounting entries with Credit/Debit support.</p>
                            <button onClick={() => downloadTemplate('accounting')} className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold transition-all shadow-md active:scale-95"><Download size={20} /><span>Download Accounting Template (.xlsx)</span></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SalesImport;
