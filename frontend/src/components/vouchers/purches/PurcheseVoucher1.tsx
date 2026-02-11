import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useReactToPrint } from "react-to-print";

import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import type { LedgerWithGroup, VoucherEntry } from "../../../types";
import { Save, Plus, Trash2, ArrowLeft, Printer, Settings } from "lucide-react";
import Swal from "sweetalert2";
import type { StockItem } from "../../../types";

// DRY Principle - Reusable constants and styles
const TABLE_STYLES = {
  header: "px-4 py-2 text-left",
  headerCenter: "px-4 py-2 text-center",
  headerRight: "px-4 py-2 text-right",
  cell: "px-4 py-2",
  cellCenter: "px-4 py-2 text-center",
  cellRight: "px-4 py-2 text-right",
  input: "w-full p-2 rounded border text-right",
  select: "w-full p-2 rounded border cursor-pointer min-h-[35px] text-xs",
};

const PRINT_STYLES = {
  table: "w-full border-collapse mb-5 border border-black",
  headerCell: "border border-black p-2 text-[10pt] font-bold",
  cell: "border border-black p-2 text-[10pt]",
  cellCenter: "border border-black p-2 text-[10pt] text-center",
  cellRight: "border border-black p-2 text-[10pt] text-right",
};

// DRY Principle - Colspan values for table consistency
const COLSPAN_VALUES = {
  ITEM_TABLE_TOTAL: 9, // Sr No + Item + HSN + Batch + Qty + Unit + Rate + GST + Discount = 9 columns before Amount
  PRINT_TABLE_NO_ITEMS: 7, // All columns in print table
  PRINT_TABLE_TERMS: 5, // Columns for terms and conditions
};

// Reusable function to get themed input classes
const getInputClasses = (theme: string, hasError: boolean = false) => {
  const baseClasses =
    "w-full p-2 rounded border outline-none transition-colors";
  const themeClasses =
    theme === "dark"
      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
      : "bg-white border-gray-300 focus:border-blue-500";
  const errorClasses = hasError ? "border-red-500" : "";
  return `${baseClasses} ${themeClasses} ${errorClasses}`;
};

// Reusable function to get themed select classes
const getSelectClasses = (theme: string, hasError: boolean = false) => {
  const baseClasses =
    "w-full p-2 rounded border cursor-pointer min-h-[40px] text-sm outline-none transition-colors";
  const themeClasses =
    theme === "dark"
      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
      : "bg-white border-gray-300 focus:border-blue-500";
  const errorClasses = hasError ? "border-red-500" : "";
  return `${baseClasses} ${themeClasses} ${errorClasses}`;
};

// 🔹 Remove (20) from state name
const cleanState = (state: string = "") =>
  state.replace(/\(.*?\)/g, "").trim().toLowerCase();

const resolvePurchaseGst = (
  gstRate: number,
  companyState: string,
  supplierState: string
) => {


  const isIntra =
    companyState &&
    supplierState &&
    cleanState(companyState) === cleanState(supplierState);

  if (isIntra) {
    return {
      cgstRate: gstRate / 2,
      sgstRate: gstRate / 2,
      igstRate: 0,
      isIntra: true,
    };
  }

  return {
    cgstRate: 0,
    sgstRate: 0,
    igstRate: gstRate,
    isIntra: false,
  };
};

const normalizeGstForSave = (
  entries: any[],
  companyState: string,
  supplierState: string
) => {
  const isIntra =
    cleanState(companyState) &&
    cleanState(supplierState) &&
    cleanState(companyState) === cleanState(supplierState);

  return entries.map((e) => {
    if (!e.itemId) return e;

    const gst = Number(e.gstRate || 0);

    if (isIntra) {
      // ✅ Same State → CGST + SGST only
      return {
        ...e,

        igstRate: 0,
        gstLedgerId: "",

        cgstRate: gst / 2,
        sgstRate: gst / 2,
      };
    } else {
      // ✅ Other State → IGST only
      return {
        ...e,

        cgstRate: 0,
        sgstRate: 0,
        cgstLedgerId: "",
        sgstLedgerId: "",

        igstRate: gst,
      };
    }
  });
};


const calculateEntryValues = (
  quantity: number,
  rate: number,
  discount: number,
  gstRate: number,
  companyState: string,
  supplierState: string
) => {

  console.log("CALC ENTRY =>", {
    quantity,
    rate,
    discount,
    gstRate,
    companyState,
    supplierState,
  });
  const qty = Number(quantity || 0);
  const r = Number(rate || 0);
  const disc = Number(discount || 0);

  const baseAmount = qty * r;

  const { cgstRate, sgstRate, igstRate, isIntra } = resolvePurchaseGst(
    gstRate,
    companyState,
    supplierState
  );

  const totalTaxRate = cgstRate + sgstRate + igstRate;
  const gstAmount = (baseAmount * totalTaxRate) / 100;


  const totalAmount = baseAmount + gstAmount - disc;

  return {
    quantity: qty,
    rate: r,
    discount: disc,
    amount: totalAmount,
    baseAmount,
    gstAmount,
    cgstRate,
    sgstRate,
    igstRate,
  };
};

const PurchaseVoucher: React.FC = () => {
  const { theme, godowns = [], companyInfo, units = [] } = useAppContext();

  //get companyInfo
  // 🔹 Get Company State from localStorage
  const companyInfoLS = localStorage.getItem("companyInfo");

  const companyState = companyInfoLS
    ? JSON.parse(companyInfoLS)?.state || ""
    : "";

  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  // Prefer `userType` (set at login) but fall back to legacy `supplier` key
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  const [ledgers, setLedgers] = useState<LedgerWithGroup[]>([]);
  const partyLedgers = ledgers;

  const purchaseLedgers = ledgers.filter((l) =>
    String(l.name).toLowerCase().includes("purchase") ||
    String(l.groupName).toLowerCase().includes("purchase accounts")
  );

  const tdsLedgers = useMemo(() => ledgers.filter((l) =>
    String(l.name).toUpperCase().includes("TDS")
  ), [ledgers]);

  // Auto-select TDS Ledger if only one exists
  useEffect(() => {
    if (tdsLedgers.length === 1 && !formData.tdsLedgerId) {
      setFormData((prev) => ({ ...prev, tdsLedgerId: String(tdsLedgers[0].id) }));
    }
  }, [tdsLedgers]);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [showTableConfig, setShowTableConfig] = useState(false);
  const [supplierState, setSupplierState] = useState("");


  const [visibleColumns, setVisibleColumns] = useState(
    {
      hsn: true,
      gst: true,
      batch: true,
      godown: true,
      showReceiptDetails: true,
      tds: true,
      enableTdsCredit: false,
    }
  );

  const [isReadyToSave, setIsReadyToSave] = useState(false);

  // Barcode State
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isBarcodeError, setIsBarcodeError] = useState(false);

  // Helper to find stock item details
  const resolveStockItemDetails = (itemId: string) => {
    const item = stockItems.find((i) => String(i.id) === String(itemId));
    if (!item) return {};

    return {
      name: item.name,
      hsnCode: item.hsnCode,
      unit: item.unit,
      gstRate: Number(item.gstRate || 0),
      // For Purchase, we usually use standardPurchaseRate, but fallback to rate/mrp if needed
      standardPurchaseRate: Number(item.standardPurchaseRate || item.purchaseRate || item.rate || 0),
      batches: item.batches,
      gstLedgerId: item.gstLedgerId,
      sgstLedgerId: item.sgstLedgerId,
      cgstLedgerId: item.cgstLedgerId,
      igstLedgerId: item.igstLedgerId,
    };
  };

  const performBarcodeLookup = async (code: string) => {
    if (!code.trim()) return;

    try {
      // Using sales-vouchers endpoint as requested by user ("ke jaisa") which implies same logic
      // Assuming backend endpoint is generic enough or we use the sales one for item lookup
      const url = `${import.meta.env.VITE_API_URL}/api/sales-vouchers/item-by-barcode?barcode=${code}&company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.data) {
        setIsBarcodeError(false);
        const item = json.data;
        const details = resolveStockItemDetails(item.id);

        setFormData((prev) => {
          const updatedEntries = [...prev.entries];

          const gst = Number(details.gstRate || 0);

          // Calculate amounts using existing helper
          const calculated = calculateEntryValues(
            1, // quantity 1 by default
            Number(details.standardPurchaseRate || 0),
            0, // discount
            gst,
            companyState,
            supplierState
          );

          const { cgstRate, sgstRate, igstRate, isIntra } = resolvePurchaseGst(
            gst,
            companyState,
            supplierState
          );

          // 🔍 Find Purchase Ledger
          let gstToMatch = gst;
          // If GST is 0, try to deduce from GST ledger name (similar to manual entry logic)
          if (gstToMatch === 0 && details.gstLedgerId) {
            const ledger = ledgers.find((l) => String(l.id) === String(details.gstLedgerId));
            if (ledger) {
              const match = ledger.name.match(/(\d+(\.\d+)?)/);
              gstToMatch = match ? Number(match[1]) : 0;
            }
          }

          const matchingPurchaseLedger = purchaseLedgers.find((l) => {
            const name = String(l.name).toLowerCase();
            const gstMatch =
              name.includes(`${gstToMatch}%`) ||
              name.includes(`${gstToMatch} %`) ||
              name.includes(`purchase ${gstToMatch}`) ||
              name.includes(`@${gstToMatch}%`) ||
              name.includes(`@ ${gstToMatch}%`);

            if (!gstMatch) return false;

            if (isIntra) {
              return name.includes("intra");
            } else {
              return name.includes("inter");
            }
          });

          // ⚠️ Warning if not found
          if (!matchingPurchaseLedger && gstToMatch > 0) {
            Swal.fire({
              title: "Purchase Ledger Missing",
              text: `Purchase ${gstToMatch}% Ledger not found. Please create it first.`,
              icon: "warning",
              confirmButtonColor: "#3085d6",
            });
          }

          const newEntry = {
            id: `e${Date.now()}`,
            itemId: String(item.id),
            hsnCode: details.hsnCode || "",
            unitName: details.unit || "",

            quantity: 1,
            rate: calculated.rate,
            amount: calculated.amount,

            gstRate: gst,
            cgstRate: cgstRate,
            sgstRate: sgstRate,
            igstRate: igstRate,

            // Prioritize item master tax ledgers
            gstLedgerId: details.gstLedgerId || "",
            sgstLedgerId: details.sgstLedgerId || "",
            cgstLedgerId: details.cgstLedgerId || "",
            igstLedgerId: details.igstLedgerId || "",

            batches: details.batches || [],
            batchNumber: "",
            godownId: "",
            discount: 0,
            purchaseLedgerId: matchingPurchaseLedger?.id || prev.purchaseLedgerId || "",

            // Fill other required fields based on Type
            type: "debit",
          };

          const lastIndex = updatedEntries.length - 1;
          // If last row is empty (no item selected), replace it; otherwise add new
          if (lastIndex >= 0 && !updatedEntries[lastIndex].itemId) {
            updatedEntries[lastIndex] = newEntry as any;
          } else {
            updatedEntries.push(newEntry as any);
          }

          return { ...prev, entries: updatedEntries };
        });

        const Toast = Swal.mixin({
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 1500,
          timerProgressBar: true,
        });
        Toast.fire({
          icon: 'success',
          title: `Item added: ${item.name}`
        });
      } else {
        if (code) {
          setIsBarcodeError(true);
        }
      }
    } catch (err) {
      console.error("Barcode Fetch Error:", err);
      setIsBarcodeError(true);
    }
  };

  // POS Barcode Scanner Logic (Global Listener)
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if source is common inputs (unless it's barcode specific)
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // If it's the barcode input itself, let the default handle it or we still buffer? 
        // Most scanners "type" into the focused field.
        // We only want to "auto-detect" if NOT in a critical field or specially handled.
      }

      const currentTime = Date.now();
      const diff = currentTime - lastKeyTime.current;
      lastKeyTime.current = currentTime;

      // Professional scanners usually type very fast (< 50ms per char)
      if (diff < 50) {
        if (e.key === "Enter") {
          if (barcodeBuffer.current.length >= 3) {
            const code = barcodeBuffer.current;
            setBarcodeInput(code);
            performBarcodeLookup(code);
            barcodeBuffer.current = "";
          }
        } else if (e.key.length === 1) {
          barcodeBuffer.current += e.key;
        }
      } else {
        // Reset buffer if delay is too long
        if (e.key.length === 1) {
          barcodeBuffer.current = e.key;
        } else {
          barcodeBuffer.current = "";
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [barcodeInput]); // Dependency on barcodeInput to stay updated or performBarcodeLookup

  // Debounced Barcode Lookup (for manual typing)
  useEffect(() => {
    if (!barcodeInput || barcodeInput.length < 3) return;

    const timer = setTimeout(() => {
      performBarcodeLookup(barcodeInput);
    }, 600);

    return () => clearTimeout(timer);
  }, [barcodeInput]);

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    performBarcodeLookup(barcodeInput);
  };

  useEffect(() => {
    if (!isEditMode || !id) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/purchase-vouchers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setFormData((prev) => ({
          ...prev,

          // MAIN FIELDS
          date: data.date ? data.date.split("T")[0] : "",
          supplierInvoiceDate: data.supplierInvoiceDate
            ? data.supplierInvoiceDate.split("T")[0]
            : "",
          referenceNo: data.referenceNo || "",
          partyId: data.partyId || "",
          purchaseLedgerId: data.purchaseLedgerId || "",
          tdsLedgerId: data.tdsLedgerId || "",
          tdsAmount: data.tdsAmount || 0,
          narration: data.narration || "",
          number: data.number || prev.number,

          dispatchDetails: {
            docNo: data.dispatchDocNo || "",
            through: data.dispatchThrough || "",
            destination: data.destination || "",
            approxDistance: data.approxDistance || "",
          },

          entries:
            data.entries?.map((e: any, idx: number) => {
              const stockItem = stockItems.find(
                (item) => String(item.id) === String(e.itemId)
              );

              // Calculate total saved GST rate to populate the dropdown/display if needed
              const savedGstRate = (Number(e.cgstRate) || 0) + (Number(e.sgstRate) || 0) + (Number(e.igstRate) || 0);

              return {
                id: "e" + (idx + 1),

                itemId: e.itemId || "",
                quantity: e.quantity || 0,
                rate: e.rate || 0,
                amount: e.amount || 0,

                // AUTO FILL: Prioritize saved data, fallback to Item Master if missing
                hsnCode: e.hsnCode || stockItem?.hsnCode || "",
                unitName: stockItem?.unit || "",

                // Use saved GST Rate logic
                gstRate: savedGstRate || stockItem?.gstRate || 0,
                cgstRate: e.cgstRate || 0,
                sgstRate: e.sgstRate || 0,
                igstRate: e.igstRate || 0,

                // BATCH Auto Fill from Saved Data
                batches: stockItem?.batches || [],
                batchNumber: e.batchNumber || "",
                batchExpiryDate: e.batchExpiryDate || "",
                batchManufacturingDate: e.batchManufacturingDate || "",

                // TAX LEDGERS (Critical for Totals Calculation)
                gstLedgerId: e.gstLedgerId || stockItem?.gstLedgerId || "",
                sgstLedgerId: e.sgstLedgerId || stockItem?.sgstLedgerId || "",
                cgstLedgerId: e.cgstLedgerId || stockItem?.cgstLedgerId || "",

                // Godown
                godownId: e.godownId || "",

                // Discount
                discount: e.discount || 0,

                // Ledger Mode Support
                ledgerId: e.ledgerId || "",
                purchaseLedgerId: e.purchaseLedgerId || data.purchaseLedgerId || "",
                type: e.type || "debit",
              };
            }) || [],
        }));

        // 🔹 Auto-detect if TDS was Credit (subtracted) or Debit (added)
        // Re-calculate totals from raw data to check
        let calcSubtotal = 0;
        let calcGst = 0;
        let calcDiscount = 0;

        (data.entries || []).forEach((e: any) => {
          const qty = Number(e.quantity || 0);
          const rate = Number(e.rate || 0);
          const discount = Number(e.discount || 0);
          const base = qty * rate;

          // GST
          const cgst = Number(e.cgstRate || 0);
          const sgst = Number(e.sgstRate || 0);
          const igst = Number(e.igstRate || 0);
          const totalTax = cgst + sgst + igst; // assuming simple sum for estimation

          const gstAmt = (base * totalTax) / 100;

          calcSubtotal += base;
          calcGst += gstAmt;
          calcDiscount += discount;
        });

        // Backend might have saved totals, let's use them if available for better accuracy
        const sTotal = Number(data.subtotal || calcSubtotal);
        const gTotal = Number(data.cgstTotal || 0) + Number(data.sgstTotal || 0) + Number(data.igstTotal || 0); // or use calculated
        const dTotal = Number(data.discountTotal || calcDiscount);

        // This is the TDS amount saved
        const tTotal = Number(data.tdsTotal || 0);

        // Calculate expected Grand Total if Credit (Subtracted)
        const expectedTotalIfCredit = sTotal + gTotal - dTotal - tTotal;

        // actual saved total
        const actualTotal = Number(data.total || 0);

        // Check matching (allow small float diff)
        if (Math.abs(actualTotal - expectedTotalIfCredit) < 1.0) {
          setVisibleColumns(prev => ({ ...prev, enableTdsCredit: true }));
        } else {
          setVisibleColumns(prev => ({ ...prev, enableTdsCredit: false }));
        }

      })
      .catch((err) => console.error("Single voucher fetch error:", err));
  }, [id, isEditMode, stockItems]);

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        if (!companyId || !ownerType || !ownerId) {
          console.error("Missing auth params for stock-items", {
            companyId,
            ownerType,
            ownerId,
          });
          setStockItems([]);
          return;
        }

        const params = new URLSearchParams({
          company_id: companyId,
          owner_type: ownerType,
          owner_id: ownerId,
        });

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items?${params.toString()}`
        );
        const data = await res.json();

        console.log('this is data', data)

        // Accept multiple response shapes: array, { success, data }, or nested
        let items: any[] = [];
        if (Array.isArray(data)) items = data;
        else if (data && Array.isArray((data as any).data))
          items = (data as any).data;
        else {
          const arr = Object.values(data || {}).find((v) => Array.isArray(v));
          if (Array.isArray(arr)) items = arr as any[];
        }

        const formatted = (items || []).map((item: any) => ({
          ...item,
          // Normalize batches: accept stringified JSON, array of strings or objects
          batches: (() => {
            try {
              if (!item || item.batches === undefined || item.batches === null)
                return [];
              const raw =
                typeof item.batches === "string"
                  ? JSON.parse(item.batches)
                  : item.batches;
              const arr = Array.isArray(raw) ? raw : [];
              return arr.map((b: any) => {
                if (!b) return { batchName: "" };
                if (typeof b === "string") return { batchName: b };
                return {
                  ...b,
                  batchName:
                    b.batchName ??
                    b.name ??
                    b.batch_name ??
                    b.batch_no ??
                    b.batchNo ??
                    String(b.id ?? ""),
                };
              });
            } catch (e) {
              return [];
            }
          })(),
        }));

        setStockItems(formatted);
      } catch (err) {
        console.error("Stock fetch error:", err);
        setStockItems([]);
      }
    };

    fetchStockItems();
  }, []);

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        console.log('led', data)
        setLedgers(data);
      } catch (err) {
        console.error("Failed to fetch ledgers:", err);
      }
    };
    fetchLedgers();
  }, [companyId, ownerType, ownerId]);

  // Safe fallbacks for context data
  const safeStockItems = stockItems;
  // Purchase-specific suppliers (sundry-creditors)
  const safeLedgers = ledgers;

  // 🟢 Backend se aaye final formatted godown list

  const [godowndata, setGodownData] = useState([]);

  // Add Batch modal state
  const [addBatchModal, setAddBatchModal] = useState<{
    visible: boolean;
    index: number | null;
    itemId: string | null;
    fields: {
      batchName: string;
      batchQuantity: number;
      batchRate: number;
      batchExpiryDate: string;
      batchManufacturingDate: string;
    };
  }>({
    visible: false,
    index: null,
    itemId: null,
    fields: {
      batchName: "",
      batchQuantity: 0,
      batchRate: 0,
      batchExpiryDate: "",
      batchManufacturingDate: "",
    },
  });

  // pending batches per entry index — saved when main Save is clicked
  const [pendingBatches, setPendingBatches] = useState<Record<number, any>>({});

  useEffect(() => {
    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("supplier");
    const ownerId = localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    );

    if (!companyId || !ownerType || !ownerId) return;

    fetch(
      `${import.meta.env.VITE_API_URL
      }/api/godowns?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((res) => res.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setGodownData(result.data);
        } else {
          setGodownData([]);
        }
      })
      .catch(() => setGodownData([]));
  }, []);

  const safeCompanyInfo = companyInfo || {
    name: "Your Company Name",
    address: "Your Company Address",
    gstNumber: "N/A",
    phoneNumber: "N/A",
    state: "Default State",
    panNumber: "N/A",
  };

  const [formData, setFormData] = useState<Omit<VoucherEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    type: "purchase",
    number: "",
    narration: "",
    referenceNo: "", // This will be used for Supplier Invoice Number
    supplierInvoiceDate: new Date().toISOString().split("T")[0], // New field for supplier invoice date
    purchaseLedgerId: "", // New field for purchase ledger
    partyId: "",
    mode: "item-invoice",
    tdsLedgerId: "",
    tdsRate: 0,
    tdsAmount: 0,
    dispatchDetails: { docNo: "", through: "", destination: "", approxDistance: "" },
    entries: [
      {
        id: "e1",
        itemId: "",
        quantity: 0,
        rate: 0,
        amount: 0,
        type: "debit",
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
        gstLedgerId: "",
        sgstLedgerId: "",
        cgstLedgerId: "",

        godownId: "",
        discount: 0,
        batchNumber: "",
        batchExpiryDate: "",
        batchManufacturingDate: "",
        batches: [],
        purchaseLedgerId: "",
      },
    ],
  });

  // Draft Persistence Logic
  const DRAFT_KEY = "PURCHASE_VOUCHER_CREATE_DRAFT";

  // 1. RESTORE DRAFT ON MOUNT (First Priority)
  useEffect(() => {
    if (isEditMode) {
      setIsReadyToSave(true);
      return;
    }

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        // Only restore if the draft has some data
        if (parsed.partyId || (parsed.entries && parsed.entries.some((e: any) => e.itemId))) {
          setFormData(parsed);

          const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
          });
          Toast.fire({
            icon: 'info',
            title: 'Draft restored'
          });
        }
      } catch (e) {
        console.error("Failed to restore purchase voucher draft:", e);
      }
    }
    // Delay setting ready to true to allow setFormData to settle
    setIsReadyToSave(true);
  }, [isEditMode]);

  // 2. SAVE DRAFT (Only after restore attempt)
  useEffect(() => {
    if (!isEditMode && isReadyToSave && formData) {
      // Check if there's actual data to save to avoid saving empty defaults
      const hasData = formData.partyId || formData.entries.some(e => e.itemId || e.quantity > 0);
      if (hasData) {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      }
    }
  }, [formData, isEditMode, isReadyToSave]);

  // 3. SYNC SUPPLIER STATE (For restored drafts or party changes)
  useEffect(() => {
    if (formData.partyId && safeLedgers.length > 0) {
      const selected = safeLedgers.find(l => String(l.id) === String(formData.partyId));
      if (selected) {
        const pState = selected.state || selected.state_name || selected.State || "";
        setSupplierState(pState);
      }
    }
  }, [formData.partyId, safeLedgers]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);

    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: "purchase",
      number: formData.number, // Preserve the number
      narration: "",
      referenceNo: "",
      supplierInvoiceDate: new Date().toISOString().split("T")[0],
      purchaseLedgerId: "",
      partyId: "",
      mode: "item-invoice",
      tdsLedgerId: "",
      tdsRate: 0,
      tdsAmount: 0,
      dispatchDetails: { docNo: "", through: "", destination: "", approxDistance: "" },
      entries: [
        {
          id: "e1",
          itemId: "",
          quantity: 0,
          rate: 0,
          amount: 0,
          type: "debit",
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
          gstLedgerId: "",
          sgstLedgerId: "",
          cgstLedgerId: "",

          godownId: "",
          discount: 0,
          batchNumber: "",
          batchExpiryDate: "",
          batchManufacturingDate: "",
          batches: [],
          purchaseLedgerId: "",
          entryDate: undefined, // ensure no stale data
          ledgerId: "",
        },
      ],
    });

    setSupplierState("");
    setIsReadyToSave(true);
    setShowTableConfig(false);

    const Toast = Swal.mixin({
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
    Toast.fire({
      icon: 'success',
      title: 'Draft Cleared'
    });
  };

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfig, setShowConfig] = useState(false);
  const [godownEnabled, setGodownEnabled] = useState<"yes" | "no">("yes");
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      switch (e.key) {
        case "F9":
          e.preventDefault();
          // Form submission handled by form onSubmit
          break;
        case "F12":
          e.preventDefault();
          setShowConfig(true);
          break;
        case "Escape":
          e.preventDefault();
          navigate("/app/vouchers");
          break;
      }
    },
    [navigate]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
  // Printing
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Purchase_Voucher_${formData.number}`,
    pageStyle: `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body { font-size: 12pt; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 5px; }
        .no-print { display: none; }
      }
    `,
  });
  if (!safeStockItems || !safeLedgers) {
    console.warn("Stock items or ledgers are undefined in AppContext");
    return (
      <div
        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <h1 className="text-2xl font-bold mb-4">Purchase Voucher</h1>
        <p className="text-red-500">
          Error: Stock items or ledgers are not available. Please configure them
          in the application.
        </p>
      </div>
    );
  }
  const handlePartyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "add-new") {
      navigate("/app/masters/ledger/create"); // Redirect to ledger creation page
    } else {
      handleChange(e); // normal update
    }
  };

  const handlePurchaseLedgerChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (e.target.value === "add-new") {
      navigate("/app/masters/ledger/create"); // Redirect to ledger creation page
    } else {
      handleChange(e);
    }
  };
  // Debug: Check what's in the filtered ledgers for party dropdown
  // const partyLedgers = safeLedgers.filter(l => l.type && ['sundry-creditors', 'cash', 'current-assets'].includes(l.type));
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Debug: Log form changes

    if (name.startsWith("dispatchDetails.")) {
      const field = name.split(".")[1] as keyof typeof formData.dispatchDetails;
      setFormData((prev) => ({
        ...prev,
        dispatchDetails: {
          ...prev.dispatchDetails,
          docNo: prev.dispatchDetails?.docNo || "",
          through: prev.dispatchDetails?.through || "",
          destination: prev.dispatchDetails?.destination || "",
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (name === "mode") {
        setFormData((prev) => ({
          ...prev,
          entries: [
            {
              id: "e1",
              itemId: "",
              ledgerId: "",
              quantity: 0,
              rate: 0,
              amount: 0,
              type: value === "item-invoice" ? "debit" : "debit",
              cgstRate: 0,
              sgstRate: 0,
              igstRate: 0,
              godownId: "",
              discount: 0,
            },
          ],
        }));
      }
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEntryChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const updatedEntries = [...formData.entries];
    const entry = updatedEntries[index];


    // ⭐ ITEM INVOICE MODE
    if (formData.mode === "item-invoice") {


      // 1️⃣ ITEM CHANGE → auto fill + GST resolve
      if (name === "itemId") {
        const selected = stockItems.find(
          (item) => String(item.id) === String(value)
        );

        const gst = Number(selected?.gstRate || selected?._doc?.gstRate || 0);

        const calculated = calculateEntryValues(
          0, // quantity
          Number(selected?.standardPurchaseRate ?? selected?.rate ?? 0),
          0, // discount
          gst,
          companyState || "",
          supplierState
        );

        // Auto selection of Purchase Ledger based on GST rate
        // Improved matching: Case-insensitive, handles various formats like "18%", "18 %", "@18%"
        let gstToMatch = gst;
        if (gstToMatch === 0 && selected?.gstLedgerId) {
          const taxLedgerName = getLedgerNameById(selected.gstLedgerId);
          gstToMatch = extractGstPercent(taxLedgerName);
        }

        const isIntra =
          cleanState(companyState) &&
          cleanState(supplierState) &&
          cleanState(companyState) === cleanState(supplierState);

        const matchingPurchaseLedger = purchaseLedgers.find((l) => {
          const name = String(l.name).toLowerCase();
          const gstMatch =
            name.includes(`${gstToMatch}%`) ||
            name.includes(`${gstToMatch} %`) ||
            name.includes(`purchase ${gstToMatch}`) ||
            name.includes(`@${gstToMatch}%`) ||
            name.includes(`@ ${gstToMatch}%`);

          if (!gstMatch) return false;

          if (isIntra) {
            return name.includes("intra");
          } else {
            return name.includes("inter");
          }
        });

        if (!matchingPurchaseLedger && gstToMatch > 0) {
          Swal.fire({
            title: "Purchase Ledger Missing",
            text: `Purchase ${gstToMatch}% Ledger not found. Please create it first.`,
            icon: "warning",
            confirmButtonColor: "#3085d6",
          });
        }

        updatedEntries[index] = {
          ...entry,
          itemId: value,
          hsnCode: selected?.hsnCode || "",
          unitName: selected?.unit || "",
          gstRate: gst,

          rate: calculated.rate,
          amount: calculated.amount,
          cgstRate: calculated.cgstRate,
          sgstRate: calculated.sgstRate,
          igstRate: calculated.igstRate,

          purchaseLedgerId: matchingPurchaseLedger?.id || entry.purchaseLedgerId || "",

          // ✅ GST LEDGER IDS
          gstLedgerId: selected?.gstLedgerId || "",
          sgstLedgerId: selected?.sgstLedgerId || "",
          cgstLedgerId: selected?.cgstLedgerId || "",
          // ... rest
          batches: selected?.batches || [],
          batchNumber: "",
          batchExpiryDate: "",
          batchManufacturingDate: "",
          quantity: 0,
          discount: 0,
        };

        setFormData(prev => ({ ...prev, entries: updatedEntries }));
        return;
      }

      // 2️⃣ BATCH CHANGE 
      if (name === "batchNumber") {
        const selectedBatch = (entry.batches || []).find(
          (b: any) =>
            b &&
            String(
              b.batchName ??
              b.name ??
              b.batch_no ??
              b.batchNo ??
              b.id
            ) === String(value)
        );
        // Batch select generally only sets meta info, not rate/qty unless needed.
        // Keeping as is, but we ensure amounts are consistent if anything else changed? 
        // No, batch change doesn't usually change price unless batch specific price exists.
        // Assuming batch select logic is just meta for now.

        const availableQty = Number(
          selectedBatch?.batchQuantity ?? selectedBatch?.quantity ?? 0
        );

        updatedEntries[index] = {
          ...entry,
          batchNumber: value,
          batchBaseQuantity: availableQty,
          batchExpiryDate: selectedBatch?.expiryDate ?? selectedBatch?.batchExpiryDate ?? "",
          batchManufacturingDate: selectedBatch?.manufacturingDate ?? selectedBatch?.batchManufacturingDate ?? "",
        };
        setFormData((prev) => ({ ...prev, entries: updatedEntries }));
        return;
      }

      // 3️⃣ QUANTITY / RATE / DISCOUNT CHANGE
      if (["quantity", "rate", "discount"].includes(name)) {
        const newVal = Number(value || 0);

        // Prepare inputs for calc
        let newQty = name === "quantity" ? newVal : Number(entry.quantity || 0);
        let newRate = name === "rate" ? newVal : Number(entry.rate || 0);
        let newDisc = name === "discount" ? newVal : Number(entry.discount || 0);

        const gst = Number(entry.gstRate || 0);

        const calculated = calculateEntryValues(
          newQty,
          newRate,
          newDisc,
          gst,
          companyState || "",
          supplierState
        );

        updatedEntries[index] = {
          ...entry,
          [name]: newVal,
          amount: calculated.amount,
        };

        setFormData((prev) => ({ ...prev, entries: updatedEntries }));

        // 🔥 batch quantity sync (keep existing logic)
        if (name === "quantity") {
          const oldQty = Number(entry.quantity || 0);
          const baseQty = Number(entry.batchBaseQuantity ?? 0);
          const diffQty = newVal - oldQty;
          const finalBatchQty = baseQty + newVal;

          const itemId = entry.itemId;
          const batchName = entry.batchNumber;
          if (itemId && diffQty !== 0 && batchName) {
            fetch(
              `${import.meta.env.VITE_API_URL}/api/stock-items/${itemId}/batches?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ batchName, quantity: finalBatchQty }),
              }
            ).catch(console.error);
          }
        }
        return;
      }

      // 4️⃣ DEFAULT
      updatedEntries[index] = {
        ...entry,
        [name]: type === "number" ? Number(value) || 0 : value,
      };

      setFormData((prev) => ({ ...prev, entries: updatedEntries }));
      return;
    }


    // ⭐ ACCOUNTING / AS-VOUCHER MODES
    if (name === "ledgerId") {
      updatedEntries[index] = {
        ...entry,
        ledgerId: value,
        itemId: undefined,
        unitName: undefined,
        quantity: undefined,
        rate: undefined,
        cgstRate: undefined,
        sgstRate: undefined,
        igstRate: undefined,
        discount: undefined,
      };
    } else if (name === "amount") {
      updatedEntries[index] = {
        ...entry,
        amount: Number(value) || 0,
      };
    } else {
      updatedEntries[index] = {
        ...entry,
        [name]: value,
      };
    }

    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
  };


  useEffect(() => {
    if (!supplierState) return;

    setFormData((prev) => ({
      ...prev,
      entries: prev.entries.map((e) => {
        if (!e.itemId) return e;

        const item = safeStockItems.find(
          (i) => String(i.id) === String(e.itemId)
        );

        const gst = Number(item?.gstRate) || 0;

        return {
          ...e,
          ...resolvePurchaseGst(
            gst,
            safeCompanyInfo.state || "",
            supplierState
          ),
          amount: (() => {
            const calculated = calculateEntryValues(
              Number(e.quantity || 0),
              Number(e.rate || 0),
              Number(e.discount || 0),
              gst,
              companyState || "",
              supplierState
            );
            return calculated.amount;
          })()
        };
      }),
    }));
  }, [supplierState, safeStockItems, companyState]);


  const addEntry = () => {
    setFormData((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: `e${prev.entries.length + 1}`,
          itemId: "",
          ledgerId: "",
          quantity: 0,
          rate: 0,
          amount: 0,
          type: "debit",
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
          godownId: "",
          discount: 0,
          batchNumber: "",
          batchExpiryDate: "",
          batchManufacturingDate: "",
          batches: [],
          purchaseLedgerId: "",
        },
      ],
    }));
  };

  useEffect(() => {
    if (isEditMode) return;

    const fetchNextVoucherNumber = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/purchase-vouchers/next-number` +
          `?company_id=${companyId}` +
          `&owner_type=${ownerType}` +
          `&owner_id=${ownerId}` +
          `&voucherType=PRV` +
          `&date=${formData.date}`
        );

        const data = await res.json();

        if (data.success && data.voucherNumber) {
          setFormData((prev) => ({
            ...prev,
            number: data.voucherNumber,
          }));
        }
      } catch (err) {
        console.error("Next voucher number error:", err);
      }
    };

    fetchNextVoucherNumber();
  }, [formData.date]);

  const removeEntry = (index: number) => {
    if (formData.entries.length <= 1) return;
    const updatedEntries = [...formData.entries];
    updatedEntries.splice(index, 1);
    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
  };
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.number) newErrors.number = "Voucher number is required";

    // Only validate item-invoice specific fields when mode is item-invoice
    if (formData.mode === "item-invoice") {
      if (!formData.partyId) newErrors.partyId = "Party is required";
      if (!formData.referenceNo)
        newErrors.referenceNo = "Supplier Invoice number is required";
      if (!formData.supplierInvoiceDate)
        newErrors.supplierInvoiceDate = "Supplier Invoice date is required";
    }

    if (formData.mode === "item-invoice") {
      formData.entries.forEach((entry, index) => {
        if (!entry.itemId)
          newErrors[`entry${index}.itemId`] = "Item is required";

        if (!entry.purchaseLedgerId)
          newErrors[`entry${index}.purchaseLedgerId`] = "Purchase Ledger is required";

        if ((entry.quantity ?? 0) <= 0)
          newErrors[`entry${index}.quantity`] =
            "Quantity must be greater than 0";

        if (godownEnabled === "yes" && visibleColumns.godown) {
          if (!entry.godownId || String(entry.godownId).trim() === "") {
            newErrors[`entry${index}.godownId`] = "Godown is required";
          }
        }
      });
    } else {
      formData.entries.forEach((entry, index) => {
        if (!entry.ledgerId)
          newErrors[`entry${index}.ledgerId`] = "Ledger is required";
        if ((entry.amount ?? 0) <= 0)
          newErrors[`entry${index}.amount`] = "Amount must be greater than 0";
      });

      const debitTotal = formData.entries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);

      const creditTotal = formData.entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);

      if (Math.abs(debitTotal - creditTotal) > 0.01) {
        newErrors.entries = "Debit and credit amounts must balance";
      }
    }

    if (!formData.entries.length) {
      newErrors.entries = "At least one entry is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).filter((k) => newErrors[k]).length === 0;
  };

  // get ledget it to name like sgst, cgst,igst
  // 🔹 Get Ledger Name by ID
  const getLedgerNameById = (id: any) => {
    if (!id) return "-";

    const ledger = safeLedgers.find(
      (l) => String(l.id) === String(id)
    );

    return ledger?.name || "-";
  };
  // ✅ Extract GST % from Ledger Name (like "SGST@9%" → 9)
  const extractGstPercent = (name = "") => {
    if (!name) return 0;

    const match = name.match(/(\d+(\.\d+)?)/); // number find karega

    return match ? Number(match[1]) : 0;
  };

  // 🔹 Intra / Inter State Check
  const isIntraState =
    cleanState(companyState) &&
    cleanState(supplierState) && // Changed from partyState to supplierState
    cleanState(companyState) === cleanState(supplierState); // Changed from partyState to supplierState

  const calculateTotals = () => {
    if (formData.mode === "item-invoice") {
      const totals = formData.entries.reduce(
        (acc, entry) => {
          const qty = Number(entry.quantity || 0);
          const rate = Number(entry.rate || 0);
          const discount = Number(entry.discount || 0);

          // ✅ GST % from Ledger Names
          const sgst = extractGstPercent(
            getLedgerNameById(entry.sgstLedgerId)
          );

          const cgst = extractGstPercent(
            getLedgerNameById(entry.cgstLedgerId)
          );

          const igst = extractGstPercent(
            getLedgerNameById(entry.gstLedgerId)
          );

          // ✅ Total GST Rate (respecting Intra/Inter state)
          const totalGstRate = isIntraState ? (sgst + cgst) : igst;

          const baseAmount = qty * rate;
          const gstAmount = (baseAmount * totalGstRate) / 100;
          const totalAmount = baseAmount + gstAmount - discount;

          return {
            subtotal: acc.subtotal + baseAmount,

            cgstTotal: acc.cgstTotal + (isIntraState ? (baseAmount * cgst) / 100 : 0),
            sgstTotal: acc.sgstTotal + (isIntraState ? (baseAmount * sgst) / 100 : 0),
            igstTotal: acc.igstTotal + (!isIntraState ? (baseAmount * igst) / 100 : 0),

            discountTotal: acc.discountTotal + discount,
            total: acc.total + totalAmount,
          };
        },
        {
          subtotal: 0,
          cgstTotal: 0,
          sgstTotal: 0,
          igstTotal: 0,
          discountTotal: 0,
          total: 0,
        }
      );

      const tdsRatePercent = extractGstPercent(
        getLedgerNameById(formData.tdsLedgerId)
      );

      const tdsAmount = (totals.subtotal * tdsRatePercent) / 100;

      return {
        ...totals,
        gstTotal: totals.cgstTotal + totals.sgstTotal + totals.igstTotal,
        tdsAmount,
        tdsTotal: tdsAmount, // ✅ Added for backend
        tdsRate: tdsRatePercent, // Keep percentage for UI if needed
        total: visibleColumns.enableTdsCredit
          ? totals.total - tdsAmount // ✅ Subtracted (Credit behavior)
          : totals.total + tdsAmount, // ✅ Added to total (Debit behavior)
      };
    }
    else {
      const debitTotal = formData.entries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);

      const creditTotal = formData.entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);

      return { debitTotal, creditTotal, total: debitTotal };
    }
  };

  // Update entries GST based on state
  const fixedEntries = formData.entries.map((entry) => {
    if (!entry.itemId) return entry;

    if (isIntraState) {
      // Same State → SGST + CGST only
      return {
        ...entry,
        igstRate: 0,
        gstLedgerId: "",

        // keep SGST + CGST
        sgstRate: entry.sgstRate || 0,
        cgstRate: entry.cgstRate || 0,
      };
    } else {
      // Other State → IGST only
      return {
        ...entry,
        sgstRate: 0,
        cgstRate: 0,
        sgstLedgerId: "",
        cgstLedgerId: "",

        // keep IGST
        igstRate: entry.igstRate || entry.gstRate || 0,
      };
    }
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReadyToSave(false); // Stop draft saving immediately when starting submission

    if (!validateForm()) {
      Swal.fire({
        icon: "warning",
        title: "Godown not selected",
        text: "Please select godown for all items before submitting.",
      });
      return;
    }

    try {
      const totals = calculateTotals();

      // Extract partyId from first ledger entry when in accounting mode
      let finalPartyId = formData.partyId;
      if (
        (formData.mode === "accounting-invoice" ||
          formData.mode === "as-voucher") &&
        formData.entries.length > 0
      ) {
        // Use first debit entry's ledgerId as partyId, or first entry if no debit found
        const firstDebitEntry = formData.entries.find(
          (e) => e.type === "debit" && e.ledgerId
        );
        finalPartyId =
          firstDebitEntry?.ledgerId || formData.entries[0]?.ledgerId || "";
      }

      // 🔥 1. Voucher payload
      const payload = {
        ...formData,
        partyId: finalPartyId,
        ...totals,
        // ✅ Map entries to include TDS Ledger ID as tdsRate (as requested by user)
        entries: formData.entries.map(e => ({
          ...e,
          tdsRate: formData.tdsLedgerId || 0
        })),
        companyId,
        ownerType,
        ownerId,
      };

      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL
        }/api/purchase-vouchers/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        : `${import.meta.env.VITE_API_URL
        }/api/purchase-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

      const method = isEditMode ? "PUT" : "POST";

      // 🔥 2. SAVE VOUCHER FIRST
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.voucherNumber) {
        setFormData((prev) => ({
          ...prev,
          number: data.voucherNumber,
        }));
      }
      if (!res.ok) {
        Swal.fire("Error", data.message || "Voucher save failed", "error");
        return;
      }

      // ✅ CLEAR DRAFT ON SUCCESS
      if (!isEditMode) {
        localStorage.removeItem(DRAFT_KEY);
      }

      // 🔥 3. NOW save ONLY NEW batches
      for (const entry of formData.entries) {
        if (!entry.batchMeta?.isNew) continue;

        await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items/${entry.itemId
          }/batches`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              batchName: entry.batchMeta.batchName,
              batchQuantity: entry.batchMeta.quantity,
              batchRate: entry.batchMeta.rate,
              batchExpiryDate: entry.batchMeta.expDate || null,
              batchManufacturingDate: entry.batchMeta.mfgDate || null,
              mode: "purchase",
              company_id: companyId,
              owner_type: ownerType,
              owner_id: ownerId,
            }),
          }
        );
      }

      // 🔥 4. Purchase history (unchanged)
      const finalVoucherNumber = data.voucherNumber || formData.number;
      if (formData.mode === "item-invoice") {
        const historyData = formData.entries
          .filter((e) => e.itemId && e.quantity > 0)
          .map((e) => ({
            itemName:
              stockItems.find((i) => String(i.id) === String(e.itemId))?.name ||
              "",
            hsnCode: e.hsnCode || "",
            batchNumber: e.batchNumber || null,
            purchaseQuantity: Number(e.quantity),
            rate: Number(e.rate),
            purchaseDate: formData.date,

            voucherNumber: finalVoucherNumber,

            godownId: e.godownId ? Number(e.godownId) : null,
            companyId,
            ownerType,
            ownerId,
          }));

        await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/purchase-vouchers/purchase-history`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(historyData),
          }
        );
      }

      if (!isEditMode) {
        localStorage.removeItem(DRAFT_KEY);
      }

      await Swal.fire(
        "Success",
        isEditMode
          ? "Voucher updated successfully!"
          : "Voucher saved successfully!",
        "success"
      );

      navigate("/app/vouchers");
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire("Error", "Network or server issue", "error");
    }
  };

  const {
    subtotal = 0,
    cgstTotal = 0,
    sgstTotal = 0,
    igstTotal = 0,
    gstTotal = 0,
    discountTotal = 0,
    tdsAmount = 0,
    tdsRate = 0,
    total = 0,
    debitTotal = 0,
    creditTotal = 0,
  } = calculateTotals();

  // Helper functions for print layout
  const getItemDetails = (itemId: string) => {
    const item = safeStockItems.find((item) => String(item.id) === String(itemId));
    return item || { name: "-", hsnCode: "-", unit: "-", gstRate: 0, rate: 0 };
  };

  const getPartyName = (partyId: string) => {
    const party = safeLedgers.find((l) => String(l.id) === String(partyId));
    return party?.name || "Unknown Party";
  };

  const getPurchaseLedgerName = (purchaseLedgerId: string) => {
    const ledger = safeLedgers.find((l) => String(l.id) === String(purchaseLedgerId));
    return ledger?.name || "Unknown Purchase Ledger";
  };

  // Function to get GST rate breakdown and count for invoice
  const getGstRateInfo = () => {
    const selectedItems = formData.entries.filter(
      (entry) =>
        entry.itemId && entry.itemId !== "" && entry.itemId !== "select"
    );
    const gstRates = new Set<number>();
    const gstBreakdown: {
      [key: number]: {
        count: number;
        totalAmount: number;
        gstAmount: number;
        items: string[];
      };
    } = {};

    selectedItems.forEach((entry) => {
      const itemDetails = getItemDetails(entry.itemId || "");
      const gstRate = itemDetails.gstRate || 0;
      const baseAmount = (entry.quantity || 0) * (entry.rate || 0);
      const gstAmount = (baseAmount * gstRate) / 100;

      gstRates.add(gstRate);

      if (!gstBreakdown[gstRate]) {
        gstBreakdown[gstRate] = {
          count: 0,
          totalAmount: 0,
          gstAmount: 0,
          items: [],
        };
      }

      gstBreakdown[gstRate].count += 1;
      gstBreakdown[gstRate].totalAmount += baseAmount;
      gstBreakdown[gstRate].gstAmount += gstAmount;
      gstBreakdown[gstRate].items.push(itemDetails.name);
    });

    return {
      uniqueGstRatesCount: gstRates.size,
      gstRatesUsed: Array.from(gstRates).sort((a, b) => a - b),
      totalItems: selectedItems.length,
      breakdown: gstBreakdown,
    };
  };

  // Add Batch inline helpers
  const handleAddBatchFieldChange = (
    index: number,
    field: string,
    value: any
  ) => {
    setPendingBatches((prev) => ({
      ...prev,
      [index]: {
        ...(prev[index] || {}),
        [field]: value,
      },
    }));
  };

  const handleSaveBatch = async () => {
    const index = addBatchModal.index!;
    const entry = formData.entries[index];
    const pb = pendingBatches[index];

    if (!entry || !entry.itemId) {
      Swal.fire("Error", "Select item for the batch", "error");
      return;
    }

    if (!pb || !pb.batchName || String(pb.batchName).trim() === "") {
      Swal.fire("Error", "Batch name is required", "error");
      return;
    }

    // Validate required fields
    if (!formData.referenceNo && !formData.supplierInvoiceDate) {
      Swal.fire("Error", "Supplier invoice is required", "error");
      return;
    }

    if (!formData.partyId) {
      Swal.fire("Error", "Party name is required", "error");
      return;
    }

    if (!entry.purchaseLedgerId) {
      Swal.fire("Error", "Purchase ledger is required", "error");
      return;
    }

    if (!entry.quantity || entry.quantity <= 0) {
      Swal.fire("Error", "Quantity must be greater than 0", "error");
      return;
    }

    if (!entry.rate || entry.rate <= 0) {
      Swal.fire("Error", "Rate must be greater than 0", "error");
      return;
    }

    // Save the batch
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/stock-items/${entry.itemId
        }/batches`;
      const resBatch = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchName: pb.batchName,
          batchQuantity: pb.batchQuantity ?? 0,
          batchRate: pb.batchRate ?? 0,
          batchExpiryDate: pb.batchExpiryDate || null,
          batchManufacturingDate: pb.batchManufacturingDate || null,
          company_id: companyId,
          owner_type: ownerType,
          owner_id: ownerId,
        }),
      });

      const batchData = await resBatch.json();
      if (!resBatch.ok) {
        Swal.fire(
          "Error",
          batchData.message || "Failed to save batch",
          "error"
        );
        return;
      }

      // Append returned batch to stockItems
      setStockItems((prev) =>
        prev.map((it) => {
          if (String(it.id) === String(entry.itemId)) {
            const newBatches = Array.isArray(it.batches)
              ? [...it.batches, batchData.batch]
              : [batchData.batch];
            return { ...it, batches: newBatches } as any;
          }
          return it;
        })
      );

      // Update form entry to select new batch and set meta
      setFormData((prev) => {
        const updated: any = { ...prev };
        const entries = [...updated.entries];
        const ent = { ...entries[index] } as any;
        ent.batches = ent.batches
          ? [...ent.batches, batchData.batch]
          : [batchData.batch];
        ent.batchNumber = batchData.batch.batchName;
        ent.batchExpiryDate = batchData.batch.batchExpiryDate || "";
        ent.batchManufacturingDate =
          batchData.batch.batchManufacturingDate || "";
        ent.rate =
          ent.rate || Number(batchData.batch.batchRate ?? pb.batchRate ?? 0);
        entries[index] = ent;
        updated.entries = entries;
        return updated;
      });

      // Clear pending batch and close modal
      setPendingBatches((prev) => {
        const newPending = { ...prev };
        delete newPending[index];
        return newPending;
      });

      setAddBatchModal({
        visible: false,
        index: null,
        itemId: null,
        fields: {
          batchName: "",
          batchQuantity: 0,
          batchRate: 0,
          batchExpiryDate: "",
          batchManufacturingDate: "",
        },
      });

      Swal.fire("Success", "Batch saved successfully", "success");
    } catch (error) {
      console.error("Save batch error:", error);
      Swal.fire("Error", "Failed to save batch", "error");
    }
  };

  const applyNewBatchToRow = (index: number) => {
    const pb = pendingBatches[index];

    if (!pb || !pb.batchName || pb.batchName.trim() === "") {
      Swal.fire("Error", "Batch name is required", "error");
      return;
    }

    setFormData((prev) => {
      const entries = [...prev.entries];
      const entry = entries[index];
      if (!entry) return prev;

      const qty = pb.batchQuantity ?? entry.quantity ?? 0;
      const rate = pb.batchRate ?? entry.rate ?? 0;

      // 🔒 prevent duplicate batch name in same row
      const alreadyExists = (entry.batches || []).some(
        (b: any) => b.batchName === pb.batchName
      );

      const tempBatch = {
        batchName: pb.batchName,
        batchQuantity: qty,
        batchRate: rate,
        batchManufacturingDate: pb.batchManufacturingDate || null,
        batchExpiryDate: pb.batchExpiryDate || null,
        mode: "purchase", // ✅ HARD CODED
      };

      entries[index] = {
        ...entry,

        // ✅ select batch in dropdown
        batchNumber: pb.batchName,

        // ✅ autofill row fields
        quantity: qty,
        rate: rate,

        // ✅ dropdown options (TEMP – UI only)
        batches: alreadyExists
          ? entry.batches
          : [...(entry.batches || []), tempBatch],

        // ✅ hidden meta (FINAL SAVE pe kaam aayega)
        batchMeta: {
          batchName: pb.batchName,
          quantity: qty,
          rate: rate,
          mfgDate: pb.batchManufacturingDate || null,
          expDate: pb.batchExpiryDate || null,
          mode: "purchase", // ✅ HARD CODED
          isNew: true, // 🔥 IMPORTANT FLAG
        },
      };

      return { ...prev, entries };
    });

    // ✅ close modal
    setAddBatchModal({
      visible: false,
      index: null,
      itemId: null,
      fields: {
        batchName: "",
        batchQuantity: 0,
        batchRate: 0,
        batchExpiryDate: "",
        batchManufacturingDate: "",
        mode: "purchase", // ✅ HARD CODED
      },
    });

    setPendingBatches((prev) => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  // 🔹 Fetch units from backend
  const [unitss, setUnits] = useState([]);
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/stock-units?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setUnits(data);
      } catch (error) {
        console.error("Failed to fetch units:", error);
      }
    };

    fetchUnits();
  }, []);

  //get Unit Name
  const getUnitName = (unitId: any) => {
    if (!unitId) return "-";

    const unit = unitss.find((u: any) => String(u.id) === String(unitId));

    return unit?.name || "-";
  };

  // 🔹 Selected Party Ledger (Party Name ke liye)
  const selectedPartyLedger = safeLedgers.find(
    (l) => String(l.id) === String(formData.partyId)
  );

  // 🔹 Party State
  const partyState = selectedPartyLedger?.state || selectedPartyLedger?.state_name || selectedPartyLedger?.State || "";

  useEffect(() => {
    if (!formData.partyId) {
      setSupplierState("");
      return;
    }

    const supplier = safeLedgers.find(
      (l) => String(l.id) === String(formData.partyId)
    );

    const state =
      supplier?.state ||
      supplier?.state_name ||
      supplier?.State ||
      "";

    setSupplierState(state);
  }, [formData.partyId, safeLedgers]);






  // 🔹 GST Charge Type
  const isRegularCharge =
    selectedPartyLedger?.gstNumber &&
    String(selectedPartyLedger.gstNumber).trim() !== "";





  // 🔹 Intra / Inter State Check
  // Note: isIntraState is now defined above calculateTotals to avoid ReferenceError

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/app/vouchers")}
          className="mr-4 p-2 rounded-full"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">Purchase Voucher</h1>

        {/* ⚙ SETTINGS BUTTON */}
        <button
          type="button"
          onClick={() => setShowTableConfig(!showTableConfig)}
          className="ml-auto p-2 rounded-full hover:bg-gray-200"
          title="Table Settings"
        >
          <Settings size={20} />
        </button>
      </div>
      {showTableConfig && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-[200]"
          onClick={() => setShowTableConfig(false)} // outside click close
        >
          <div
            className={`p-6 rounded-lg w-[350px] ${theme === "dark" ? "bg-gray-800 text-white" : "bg-white"
              } shadow-xl`}
            onClick={(e) => e.stopPropagation()} // stop outside close
          >
            <h3 className="text-lg font-semibold mb-4">Table Settings</h3>

            {[
              { key: "hsn", label: "Show HSN Column" },
              { key: "batch", label: "Show Batch Column" },
              { key: "gst", label: "Show GST Column" },
              { key: "godown", label: "Show Godown Column" },
              { key: "tds", label: "Show TDS Row" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex justify-between items-center mb-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors"
              >
                <span className="text-sm font-medium">{label}</span>
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  checked={visibleColumns[key]}
                  onChange={() =>
                    setVisibleColumns((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                />
              </label>
            ))}

            <label className="flex justify-between items-center mb-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors border-t border-gray-200 dark:border-gray-600 mt-2 pt-4">
              <span className="text-sm font-semibold">Enable Receipt & Shipping Details</span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                checked={visibleColumns.showReceiptDetails}
                onChange={() =>
                  setVisibleColumns((prev) => ({
                    ...prev,
                    showReceiptDetails: !prev.showReceiptDetails,
                  }))
                }
              />
            </label>

            <label className="flex justify-between items-center mb-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors">
              <span className="text-sm font-semibold">Enable TDS Credit</span>
              <input
                type="checkbox"
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                checked={visibleColumns.enableTdsCredit}
                onChange={() =>
                  setVisibleColumns((prev) => ({
                    ...prev,
                    enableTdsCredit: !prev.enableTdsCredit,
                  }))
                }
              />
            </label>

            {localStorage.getItem(DRAFT_KEY) && (
              <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
                <button
                  type="button"
                  onClick={clearDraft}
                  className="w-full flex items-center justify-between p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                >
                  <span className="text-sm font-semibold">Clear Saved Draft</span>
                  <Trash2 size={16} />
                </button>
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={() => setShowTableConfig(false)}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold shadow-lg transition-all"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
      <div
        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <form onSubmit={handleSubmit}>
          {/* Header Form Fields - Properly Organized in 4-Column Grid */}
          <div className={`p-5 mb-8 rounded-xl border ${theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-gray-50/50 border-gray-200"} space-y-6 shadow-sm`}>
            {/* Row 1: Primary Details */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60" htmlFor="date">
                  Voucher Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className={getInputClasses(theme, !!errors.date)}
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60" htmlFor="number">
                  Voucher No.
                </label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  value={formData.number}
                  readOnly
                  className={`${getInputClasses(theme, !!errors.number)} bg-opacity-60 cursor-not-allowed font-mono`}
                />
                {errors.number && (
                  <p className="text-red-500 text-xs mt-1">{errors.number}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60" htmlFor="referenceNo">
                  Supplier Invoice #
                </label>
                <input
                  type="text"
                  id="referenceNo"
                  name="referenceNo"
                  value={formData.referenceNo}
                  onChange={handleChange}
                  required
                  placeholder="Invoice Number"
                  className={getInputClasses(theme, !!errors.referenceNo)}
                />
                {errors.referenceNo && (
                  <p className="text-red-500 text-xs mt-1">{errors.referenceNo}</p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60" htmlFor="supplierInvoiceDate">
                  Invoice Date
                </label>
                <input
                  type="date"
                  id="supplierInvoiceDate"
                  name="supplierInvoiceDate"
                  value={formData.supplierInvoiceDate}
                  onChange={handleChange}
                  required
                  className={getInputClasses(theme, !!errors.supplierInvoiceDate)}
                />
                {errors.supplierInvoiceDate && (
                  <p className="text-red-500 text-xs mt-1">{errors.supplierInvoiceDate}</p>
                )}
              </div>
            </div>

            {/* Row 2: Party & Selection */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60" htmlFor="partyId">
                  Party / Supplier Name
                </label>
                <select
                  id="partyId"
                  name="partyId"
                  value={formData.partyId}
                  onChange={handlePartyChange}
                  className={`${getSelectClasses(theme, !!errors.partyId)} font-semibold`}
                >
                  <option value="">-- Select Party --</option>
                  {partyLedgers.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>{ledger.name}</option>
                  ))}
                  <option value="add-new" className="text-blue-600 font-bold">+ Create New Ledger</option>
                </select>
                {selectedPartyLedger && (() => {
                  const partyState = selectedPartyLedger.state || selectedPartyLedger.state_name || selectedPartyLedger.State || "N/A";
                  return (
                    <div className={`mt-1.5 text-[10px] font-bold flex items-center gap-1.5 px-2 py-0.5 rounded-full w-fit ${isRegularCharge ? "bg-green-100 text-green-700 dark:bg-green-900/30" : "bg-orange-100 text-orange-700 dark:bg-orange-900/30"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${isRegularCharge ? "bg-green-600" : "bg-orange-600 animate-pulse"}`}></span>
                      {isRegularCharge ? `REGULAR | GSTIN: ${selectedPartyLedger.gstNumber || "N/A"} | ${partyState}` : `REVERSE CHARGE | ${partyState}`}
                    </div>
                  );
                })()}
                {errors.partyId && <p className="text-red-500 text-xs mt-1">{errors.partyId}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60">
                  Transaction Mode
                </label>
                <select
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  className={getSelectClasses(theme)}
                >
                  <option value="item-invoice">Item Invoice</option>
                  <option value="accounting-invoice">Accounting Invoice</option>
                  <option value="as-voucher">As Voucher</option>
                </select>
              </div>

              {formData.mode === "item-invoice" && visibleColumns.godown && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60">
                    Godown Tracking
                  </label>
                  <select
                    value={godownEnabled}
                    onChange={(e) => setGodownEnabled(e.target.value as "yes" | "no")}
                    className={getSelectClasses(theme)}
                  >
                    <option value="yes">Enabled (Yes)</option>
                    <option value="no">Disabled (No)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Row 3: Receipt Details (Conditional with animation) */}
            {visibleColumns.showReceiptDetails && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-dashed border-gray-300 dark:border-gray-700 animate-in fade-in slide-in-from-top-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60">
                    Receipt Doc No.
                  </label>
                  <input
                    type="text"
                    name="dispatchDetails.docNo"
                    value={formData.dispatchDetails?.docNo ?? ""}
                    onChange={handleChange}
                    placeholder="Doc Reference"
                    className={getInputClasses(theme)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60">
                    Receipt Through
                  </label>
                  <input
                    type="text"
                    name="dispatchDetails.through"
                    value={formData.dispatchDetails?.through ?? ""}
                    onChange={handleChange}
                    placeholder="E.g. Transport Name"
                    className={getInputClasses(theme)}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 opacity-60">
                    Origin / Source
                  </label>
                  <input
                    type="text"
                    name="dispatchDetails.destination"
                    value={formData.dispatchDetails?.destination ?? ""}
                    onChange={handleChange}
                    placeholder="Place of Origin"
                    className={getInputClasses(theme)}
                  />
                </div>
              </div>
            )}
          </div>

          <div
            className={`p-4 mb-6 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
              }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">
                {formData.mode === "item-invoice" ? "Items" : "Ledger Entries"}
              </h3>
              <button
                title="Add Entry"
                type="button"
                onClick={addEntry}
                className={`flex items-center text-sm px-2 py-1 rounded ${theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
              >
                <Plus size={16} className="mr-1" />
                Add {formData.mode === "item-invoice" ? "Item" : "Ledger"}
              </button>
            </div>

            {/* Barcode Input Section */}
            {formData.mode === "item-invoice" && (
              <div className="mb-4">
                <form onSubmit={handleBarcodeSubmit} className="relative group max-w-md">
                  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2z"></path><path d="M7 7h1v10H7z"></path><path d="M10 7h2v10h-2z"></path><path d="M15 7h1v10h-1z"></path><path d="M18 7h1v10h-1z"></path></svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Scan Barcode or Type & Press Enter..."
                    value={barcodeInput}
                    onChange={(e) => {
                      setBarcodeInput(e.target.value);
                      setIsBarcodeError(false);
                    }}
                    className={`w-full pl-10 pr-4 py-2 rounded-lg border-2 transition-all outline-none ${isBarcodeError
                      ? "border-red-500 bg-red-50"
                      : theme === "dark"
                        ? "bg-gray-800 border-gray-700 focus:border-blue-500 text-white"
                        : "bg-white border-gray-200 focus:border-blue-500"
                      }`}
                  />
                </form>
              </div>
            )}

            <div className="overflow-x-auto">
              {" "}
              {formData.mode === "item-invoice" ? (
                <table className="w-full mb-4">
                  <thead>
                    <tr
                      className={`${theme === "dark"
                        ? "border-b border-gray-600"
                        : "border-b border-gray-300"
                        }`}
                    >
                      <th className={TABLE_STYLES.headerCenter}>Sr No</th>
                      <th className={TABLE_STYLES.header}>Item</th>
                      {visibleColumns.hsn && <th>HSN/SAC</th>}

                      {visibleColumns.batch && (
                        <th className={TABLE_STYLES.header}>Batch</th>
                      )}

                      <th className={TABLE_STYLES.headerRight}>Quantity</th>

                      <th className={TABLE_STYLES.header}>Unit</th>
                      <th className={TABLE_STYLES.headerRight}>Rate</th>

                      {/* GST Header */}
                      {visibleColumns.gst && isIntraState && (
                        <>
                          <th className={TABLE_STYLES.headerRight}>SGST</th>
                          <th className={TABLE_STYLES.headerRight}>CGST</th>
                        </>
                      )}

                      {visibleColumns.gst && !isIntraState && (
                        <th className={TABLE_STYLES.headerRight}>IGST</th>
                      )}

                      <th className={TABLE_STYLES.headerRight}>Discount</th>
                      <th className={TABLE_STYLES.headerRight}>Amount</th>
                      {godownEnabled === "yes" && visibleColumns.godown && (
                        <th className={TABLE_STYLES.header}>Godown</th>
                      )}
                      <th className={TABLE_STYLES.header}>Purchase Ledger</th>
                      <th className={TABLE_STYLES.headerCenter}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entries.map((entry, index) => {
                      const itemDetails = getItemDetails(entry.itemId || "");
                      const isAddingBatch =
                        addBatchModal.visible && addBatchModal.index === index;

                      return (
                        <tr
                          key={entry.id}
                          className={`${theme === "dark"
                            ? "border-b border-gray-600"
                            : "border-b border-gray-300"
                            }`}
                        >
                          {/* SR */}
                          <td className="px-1 py-2 text-center min-w-[28px] text-xs font-semibold">
                            {index + 1}
                          </td>

                          {/* ITEM */}
                          <td className="px-1 py-2 min-w-[110px]">
                            <select
                              name="itemId"
                              value={entry.itemId}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={`${TABLE_STYLES.select} min-w-[110px] text-xs`}
                            >
                              <option value="">Item</option>
                              {stockItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* HSN */}
                          {visibleColumns.hsn && (
                            <td className="px-1 py-2 min-w-[55px] text-center text-xs">
                              <input
                                type="text"
                                name="hsnCode"
                                value={entry.hsnCode || ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${TABLE_STYLES.input} text-center text-xs`}
                                placeholder="HSN"
                              />
                            </td>
                          )}

                          {visibleColumns.batch && (
                            // BATCH with Add button
                            <td className="px-1 py-2 min-w-[140px] flex items-center gap-2">
                              <select
                                name="batchNumber"
                                value={entry.batchNumber || ""}
                                onChange={(e) => {
                                  if (e.target.value === "__add_new__") {
                                    if (!entry.itemId) {
                                      Swal.fire(
                                        "Select item",
                                        "Please select an item before adding a batch",
                                        "warning"
                                      );
                                      return;
                                    }

                                    setAddBatchModal({
                                      visible: true,
                                      index,
                                      itemId: entry.itemId,
                                      fields: {
                                        batchName: "",
                                        batchQuantity: 0,
                                        batchRate: entry.rate ?? 0,
                                        batchExpiryDate: "",
                                        batchManufacturingDate: "",
                                      },
                                    });

                                    setPendingBatches((prev) => ({
                                      ...prev,
                                      [index]: {
                                        batchName: "",
                                        batchQuantity: 0,
                                        batchRate: entry.rate ?? 0,
                                        batchExpiryDate: "",
                                        batchManufacturingDate: "",
                                      },
                                    }));

                                    return;
                                  }

                                  handleEntryChange(index, e);
                                }}
                                className={`${TABLE_STYLES.select} min-w-[120px] text-xs`}
                              >
                                <option value="">Batch</option>

                                {/* 👇 Existing batches (agar ho to) */}
                                {(entry.batches || []).map((batch, i) => {
                                  const qty = Number(
                                    batch.batchQuantity ?? batch.quantity ?? 0
                                  );

                                  return (
                                    <option key={i} value={batch.batchName}>
                                      {`${batch.batchName} — Qty: ${qty}`}
                                    </option>
                                  );
                                })}

                                {/* 👇 ALWAYS SHOW ADD BUTTON */}
                                <option
                                  value="__add_new__"
                                  className="font-semibold bg-blue-300"
                                >
                                  + Add New Batch
                                </option>
                              </select>

                              {addBatchModal.visible && (
                                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[300]">
                                  <div className="w-[420px] rounded-lg bg-white shadow-xl p-5">
                                    <h3 className="text-lg font-semibold mb-4">
                                      Add New Batch
                                    </h3>

                                    <div className="space-y-3 text-sm">
                                      <div>
                                        <label className="block font-medium">
                                          Batch Name
                                        </label>
                                        <input
                                          className="w-full border rounded p-2"
                                          value={
                                            pendingBatches[addBatchModal.index!]
                                              ?.batchName || ""
                                          }
                                          onChange={(e) =>
                                            handleAddBatchFieldChange(
                                              addBatchModal.index!,
                                              "batchName",
                                              e.target.value
                                            )
                                          }
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block font-medium">
                                            Quantity
                                          </label>
                                          <input
                                            type="number"
                                            className="w-full border rounded p-2"
                                            value={
                                              pendingBatches[
                                                addBatchModal.index!
                                              ]?.batchQuantity || 0
                                            }
                                            onChange={(e) =>
                                              handleAddBatchFieldChange(
                                                addBatchModal.index!,
                                                "batchQuantity",
                                                Number(e.target.value)
                                              )
                                            }
                                          />
                                        </div>

                                        <div>
                                          <label className="block font-medium">
                                            Rate
                                          </label>
                                          <input
                                            type="number"
                                            className="w-full border rounded p-2"
                                            value={
                                              pendingBatches[
                                                addBatchModal.index!
                                              ]?.batchRate || 0
                                            }
                                            onChange={(e) =>
                                              handleAddBatchFieldChange(
                                                addBatchModal.index!,
                                                "batchRate",
                                                Number(e.target.value)
                                              )
                                            }
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="block font-medium">
                                            MFG Date
                                          </label>
                                          <input
                                            type="date"
                                            className="w-full border rounded p-2"
                                            value={
                                              pendingBatches[
                                                addBatchModal.index!
                                              ]?.batchManufacturingDate || ""
                                            }
                                            onChange={(e) =>
                                              handleAddBatchFieldChange(
                                                addBatchModal.index!,
                                                "batchManufacturingDate",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>

                                        <div>
                                          <label className="block font-medium">
                                            Expiry Date
                                          </label>
                                          <input
                                            type="date"
                                            className="w-full border rounded p-2"
                                            value={
                                              pendingBatches[
                                                addBatchModal.index!
                                              ]?.batchExpiryDate || ""
                                            }
                                            onChange={(e) =>
                                              handleAddBatchFieldChange(
                                                addBatchModal.index!,
                                                "batchExpiryDate",
                                                e.target.value
                                              )
                                            }
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-5">
                                      <button
                                        onClick={() => {
                                          setAddBatchModal({
                                            visible: false,
                                            index: null,
                                            itemId: null,
                                            fields: {
                                              batchName: "",
                                              batchQuantity: 0,
                                              batchRate: 0,
                                              batchExpiryDate: "",
                                              batchManufacturingDate: "",
                                            },
                                          });
                                          setPendingBatches((prev) => {
                                            const newPending = { ...prev };
                                            delete newPending[
                                              addBatchModal.index!
                                            ];
                                            return newPending;
                                          });
                                        }}
                                        className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                      >
                                        Cancel
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          applyNewBatchToRow(
                                            addBatchModal.index!
                                          )
                                        }
                                        className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                      >
                                        Add Batch
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </td>
                          )}

                          {/* QUANTITY */}
                          <td className="px-1 py-2 min-w-[55px]">
                            {!isAddingBatch && (
                              <input
                                type="number"
                                name="quantity"
                                value={entry.quantity ?? ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${TABLE_STYLES.input} text-right text-xs`}
                              />
                            )}
                          </td>

                          {/* UNIT */}
                          <td className="px-1 py-2 min-w-[45px] text-center text-xs">
                            {getUnitName(entry.unitName)}
                          </td>

                          {/* RATE */}
                          <td className="px-1 py-2 min-w-[70px]">
                            {!isAddingBatch && (
                              <input
                                type="number"
                                name="rate"
                                value={entry.rate ?? ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${TABLE_STYLES.input} text-right text-xs`}
                              />
                            )}
                          </td>


                          {/* GST TOTAL */}

                          {/* GST Columns */}

                          {/* Intra State */}
                          {visibleColumns.gst && isIntraState && (
                            <>
                              <td className="px-1 py-2 text-xs text-center">
                                {extractGstPercent(getLedgerNameById(entry.sgstLedgerId))}%
                              </td>

                              <td className="px-1 py-2 text-xs text-center">
                                {extractGstPercent(getLedgerNameById(entry.cgstLedgerId))}%
                              </td>
                            </>
                          )}

                          {/* Inter State */}
                          {visibleColumns.gst && !isIntraState && (
                            <td className="px-1 py-2 text-xs text-center">
                              {extractGstPercent(getLedgerNameById(entry.gstLedgerId))}%
                            </td>
                          )}





                          {/* DISCOUNT */}
                          <td className="px-1 py-2 min-w-[70px]">
                            <input
                              type="number"
                              name="discount"
                              value={entry.discount ?? ""}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={`${TABLE_STYLES.input} text-right text-xs`}
                            />
                          </td>

                          {/* AMOUNT */}
                          <td className="px-1 py-2 min-w-[75px] text-right text-xs font-medium">
                            {Number(entry.amount ?? 0).toLocaleString()}
                          </td>

                          {/* GODOWN (Show only if Enabled) */}
                          {godownEnabled === "yes" && visibleColumns.godown && (
                            <td className="px-1 py-2 min-w-[95px]">
                              <select
                                name="godownId"
                                value={entry.godownId || ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${TABLE_STYLES.select
                                  } min-w-[95px] text-xs ${errors[`entry${index}.godownId`]
                                    ? "border-red-500"
                                    : ""
                                  }`}
                              >
                                <option value="">Select Godown</option>
                                {godowndata.map((godown: any) => (
                                  <option key={godown.id} value={godown.id}>
                                    {godown.name}
                                  </option>
                                ))}
                              </select>
                              {errors[`entry${index}.godownId`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`entry${index}.godownId`]}
                                </p>
                              )}
                            </td>
                          )}

                          {/* Purchase Ledger */}
                          <td className="px-1 py-2 min-w-[120px]">
                            <select
                              name="purchaseLedgerId"
                              value={entry.purchaseLedgerId || ""}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={`${TABLE_STYLES.select} min-w-[120px] text-xs ${errors[`entry${index}.purchaseLedgerId`]
                                ? "border-red-500"
                                : ""
                                }`}
                            >
                              <option value="">Select Ledger</option>
                              {purchaseLedgers.map((ledger) => (
                                <option key={ledger.id} value={ledger.id}>
                                  {ledger.name}
                                </option>
                              ))}
                            </select>
                            {errors[`entry${index}.purchaseLedgerId`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`entry${index}.purchaseLedgerId`]}
                              </p>
                            )}
                          </td>

                          {/* ACTION */}
                          <td className="px-1 py-2 text-center min-w-[40px]">
                            <button
                              onClick={() => removeEntry(index)}
                              className="p-1 rounded hover:bg-gray-200"
                              disabled={formData.entries.length <= 1}
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>

                  <tfoot>
                    {/* Calculate dynamic colspan based on visible columns */}
                    {(() => {
                      const colSpanBeforeAmount =
                        6 + // Sr(1) + Item(1) + Qty(1) + Unit(1) + Rate(1) + Discount(1)
                        (visibleColumns.hsn ? 1 : 0) +
                        (visibleColumns.batch ? 1 : 0) +
                        (visibleColumns.gst ? (isIntraState ? 2 : 1) : 0);

                      const colSpanAfterAmount =
                        2 + // Purchase Ledger(1) + Action(1)
                        ((godownEnabled === "yes" && visibleColumns.godown) ? 1 : 0);

                      return (
                        <>
                          {/* Subtotal */}
                          <tr
                            className={`font-semibold ${theme === "dark"
                              ? "border-t border-gray-600"
                              : "border-t border-gray-300"
                              }`}
                          >
                            <td colSpan={colSpanBeforeAmount} className="px-4 py-2 text-right">
                              Subtotal:
                            </td>

                            <td className="px-4 py-2 text-right">
                              {subtotal.toLocaleString()}
                            </td>

                            <td colSpan={colSpanAfterAmount}></td>
                          </tr>

                          {/* TDS (FIXED WIDTH) */}
                          {/* TDS Row */}
                          {visibleColumns.tds && (
                            <tr
                              className={`font-semibold ${theme === "dark"
                                ? "border-t border-gray-600"
                                : "border-t border-gray-300"
                                }`}
                            >
                              {/* Label + Dropdown */}
                              <td colSpan={colSpanBeforeAmount} className="px-4 py-2 text-right">
                                <div className="flex items-center justify-end gap-3 pr-6">

                                  <span className="whitespace-nowrap">
                                    TDS:
                                  </span>

                                  <select
                                    name="tdsLedgerId"
                                    value={formData.tdsLedgerId}
                                    onChange={handleChange}
                                    className={`${TABLE_STYLES.select} !w-32 text-[11px] h-8 inline-block`}
                                  >
                                    <option value="">Select TDS</option>

                                    {tdsLedgers.map((l) => (
                                      <option key={l.id} value={l.id}>
                                        {l.name}
                                      </option>
                                    ))}
                                  </select>

                                </div>
                              </td>

                              {/* Amount */}
                              <td className="px-4 py-2 text-right font-bold">
                                {tdsAmount.toLocaleString()}
                              </td>

                              {/* Empty Space */}
                              <td colSpan={colSpanAfterAmount} className="px-4 py-2">
                                &nbsp;
                              </td>
                            </tr>
                          )}


                          {/* IGST / SGST */}
                          {isIntraState ? (
                            <>
                              <tr
                                className={`font-semibold ${theme === "dark"
                                  ? "border-t border-gray-600"
                                  : "border-t border-gray-300"
                                  }`}
                              >
                                <td colSpan={colSpanBeforeAmount} className="px-4 py-2 text-right">
                                  SGST Total:
                                </td>

                                <td className="px-4 py-2 text-right">
                                  {sgstTotal.toLocaleString()}
                                </td>

                                <td colSpan={colSpanAfterAmount}></td>
                              </tr>

                              <tr
                                className={`font-semibold ${theme === "dark"
                                  ? "border-t border-gray-600"
                                  : "border-t border-gray-300"
                                  }`}
                              >
                                <td colSpan={colSpanBeforeAmount} className="px-4 py-2 text-right">
                                  CGST Total:
                                </td>

                                <td className="px-4 py-2 text-right">
                                  {cgstTotal.toLocaleString()}
                                </td>

                                <td colSpan={colSpanAfterAmount}></td>
                              </tr>
                            </>
                          ) : (
                            <tr
                              className={`font-semibold ${theme === "dark"
                                ? "border-t border-gray-600"
                                : "border-t border-gray-300"
                                }`}
                            >
                              <td colSpan={colSpanBeforeAmount} className="px-4 py-2 text-right">
                                IGST Total:
                              </td>

                              <td className="px-4 py-2 text-right">
                                {igstTotal.toLocaleString()}
                              </td>

                              <td colSpan={colSpanAfterAmount}></td>
                            </tr>
                          )}

                          {/* Discount */}
                          <tr
                            className={`font-semibold ${theme === "dark"
                              ? "border-t border-gray-600"
                              : "border-t border-gray-300"
                              }`}
                          >
                            <td colSpan={colSpanBeforeAmount} className="px-4 py-2 text-right">
                              Discount Total:
                            </td>

                            <td className="px-4 py-2 text-right">
                              {discountTotal.toLocaleString()}
                            </td>

                            <td colSpan={colSpanAfterAmount}></td>
                          </tr>

                          {/* Grand Total */}
                          <tr
                            className={`font-semibold text-lg ${theme === "dark"
                              ? "bg-gray-700/50 border-t-2 border-blue-500"
                              : "bg-blue-50 border-t-2 border-blue-600 text-blue-900"
                              }`}
                          >
                            <td colSpan={colSpanBeforeAmount} className="px-4 py-2 text-right">
                              Grand Total:
                            </td>

                            <td className="px-4 py-2 text-right font-bold text-green-600">
                              {total.toLocaleString()}
                            </td>

                            <td colSpan={colSpanAfterAmount}></td>
                          </tr>
                        </>


                      );
                    })()}
                  </tfoot>
                </table>
              ) : (
                <table className="w-full mb-4">
                  <thead>
                    <tr
                      className={`${theme === "dark"
                        ? "border-b border-gray-600"
                        : "border-b border-gray-300"
                        }`}
                    >
                      <th className="px-4 py-2 text-left">Ledger</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-left">Type</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entries.map((entry) => (
                      <tr
                        key={entry.id}
                        className={`${theme === "dark"
                          ? "border-b border-gray-600"
                          : "border-b border-gray-300"
                          }`}
                      >
                        <td className="px-4 py-2">
                          {" "}
                          <select
                            title="Select Ledger"
                            name="ledgerId"
                            value={entry.ledgerId || ""}
                            onChange={(e) =>
                              handleEntryChange(
                                formData.entries.indexOf(entry),
                                e
                              )
                            }
                            required
                            className={getSelectClasses(
                              theme,
                              !!errors[
                              `entry${formData.entries.indexOf(
                                entry
                              )}.ledgerId`
                              ]
                            )}
                          >
                            {" "}
                            <option value="">Select Ledger</option>
                            {safeLedgers.map((ledger) => (
                              <option key={ledger.id} value={ledger.id}>
                                {ledger.name}
                              </option>
                            ))}
                          </select>
                          {errors[
                            `entry${formData.entries.indexOf(entry)}.ledgerId`
                          ] && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors[
                                  `entry${formData.entries.indexOf(
                                    entry
                                  )}.ledgerId`
                                  ]
                                }
                              </p>
                            )}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            title="Enter Amount"
                            type="number"
                            name="amount"
                            value={entry.amount ?? ""}
                            onChange={(e) =>
                              handleEntryChange(
                                formData.entries.indexOf(entry),
                                e
                              )
                            }
                            required
                            min="0"
                            step="0.01"
                            className={getInputClasses(
                              theme,
                              !!errors[
                              `entry${formData.entries.indexOf(entry)}.amount`
                              ]
                            )}
                          />
                          {errors[
                            `entry${formData.entries.indexOf(entry)}.amount`
                          ] && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors[
                                  `entry${formData.entries.indexOf(
                                    entry
                                  )}.amount`
                                  ]
                                }
                              </p>
                            )}
                        </td>
                        <td className="px-4 py-2">
                          {" "}
                          <select
                            title="Select Type"
                            name="type"
                            value={entry.type}
                            onChange={(e) =>
                              handleEntryChange(
                                formData.entries.indexOf(entry),
                                e
                              )
                            }
                            className={getSelectClasses(theme)}
                          >
                            <option value="debit">Debit</option>
                            <option value="credit">Credit</option>
                          </select>
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            title="Remove Ledger"
                            type="button"
                            onClick={() =>
                              removeEntry(formData.entries.indexOf(entry))
                            }
                            disabled={formData.entries.length <= 1}
                            className={`p-1 rounded ${formData.entries.length <= 1
                              ? "opacity-50 cursor-not-allowed"
                              : theme === "dark"
                                ? "hover:bg-gray-600"
                                : "hover:bg-gray-300"
                              }`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr
                      className={`font-semibold ${theme === "dark"
                        ? "border-t border-gray-600"
                        : "border-t border-gray-300"
                        }`}
                    >
                      <td className="px-4 py-2 text-right">Debit Total:</td>
                      <td className="px-4 py-2 text-right">
                        {debitTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                    </tr>
                    <tr
                      className={`font-semibold ${theme === "dark"
                        ? "border-t border-gray-600"
                        : "border-t border-gray-300"
                        }`}
                    >
                      <td className="px-4 py-2 text-right">Credit Total:</td>
                      <td className="px-4 py-2 text-right">
                        {creditTotal.toLocaleString()}
                      </td>
                      <td className="px-4 py-2"></td>
                      <td className="px-4 py-2"></td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
            {errors.entries && (
              <p className="text-red-500 text-xs mt-1">{errors.entries}</p>
            )}
          </div>

          <div className="mb-6">
            <label
              className="block text-sm font-medium mb-1"
              htmlFor="narration"
            >
              Narration
            </label>{" "}
            <textarea
              id="narration"
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              rows={3}
              className={getInputClasses(theme)}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              title="Cancel (Esc)"
              type="button"
              onClick={() => navigate("/app/vouchers")}
              className={`px-4 py-2 rounded ${theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              Cancel
            </button>
            <button
              title="Print"
              type="button"
              onClick={handlePrint}
              className={`flex items-center px-4 py-2 rounded ${theme === "dark"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-green-600 hover:bg-green-700 text-white"
                }`}
            >
              <Printer size={18} className="mr-1" />
              Print
            </button>
            <button
              title="Save Voucher (F9)"
              type="submit"
              className={`flex items-center px-4 py-2 rounded ${theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
            >
              <Save size={18} className="mr-1" />
              Save
            </button>
          </div>
        </form>
      </div >
      {/* Inline Add-Batch now rendered per-entry inside table; no global modal */}
      {/* Configuration Modal (F12) */}
      {
        showConfig && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div
              className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                }`}
            >
              <h2 className="text-xl font-bold mb-4">
                Configure Purchase Voucher
              </h2>
              <p className="mb-4">Configure GST settings, invoice format, etc.</p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfig(false)}
                  className={`px-4 py-2 rounded ${theme === "dark"
                    ? "bg-gray-700 hover:bg-gray-600"
                    : "bg-gray-200 hover:bg-gray-300"
                    }`}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      } {" "}
      {/* Print Layout */} {" "}
      <div className="absolute -left-[9999px] -top-[9999px] w-[210mm] min-h-[297mm]">
        <div
          ref={printRef}
          className="p-[15mm] font-sans text-[11pt] w-full bg-white text-black leading-relaxed"
        >
          {/* Header Section */}
          <div className="border-2 border-black mb-2.5">
            {/* Top Header with TAX INVOICE */}
            <div className="bg-gray-100 py-2 px-2 text-center border-b border-black">
              <h1 className="text-[18pt] font-bold m-0 tracking-[2px]">
                TAX INVOICE
              </h1>
            </div>

            {/* Invoice Details Row */}
            <div className="flex justify-between py-1.5 px-2.5 border-b border-black text-[10pt]">
              <span>
                <strong>INVOICE NO:</strong> {formData.number}
              </span>
              <span>
                <strong>DATE:</strong>{" "}
                {new Date(formData.date).toLocaleDateString("en-GB")}
              </span>
            </div>

            {/* Supplier Invoice and Receipt Details Row */}
            <div className="flex justify-between py-1.5 px-2.5 border-b border-black text-[10pt]">
              <div className="flex gap-5">
                {formData.referenceNo && (
                  <span>
                    <strong>SUPPLIER INVOICE:</strong> {formData.referenceNo}
                  </span>
                )}
                {formData.supplierInvoiceDate && (
                  <span>
                    <strong>SUPPLIER DATE:</strong>{" "}
                    {new Date(formData.supplierInvoiceDate).toLocaleDateString(
                      "en-GB"
                    )}
                  </span>
                )}
              </div>
              <div className="flex gap-5">
                {formData.dispatchDetails?.docNo && (
                  <span>
                    <strong>RECEIPT DOC NO:</strong>{" "}
                    {formData.dispatchDetails.docNo}
                  </span>
                )}
                {formData.dispatchDetails?.through && (
                  <span>
                    <strong>RECEIPT THROUGH:</strong>{" "}
                    {formData.dispatchDetails.through}
                  </span>
                )}
              </div>
            </div>

            {/* Company Details Section */}
            <div className="p-2.5 border-b border-black">
              <div className="flex items-center mb-2">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white text-[16pt] font-bold">
                    {safeCompanyInfo.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-[16pt] font-bold m-0 uppercase">
                    {safeCompanyInfo.name}
                  </h2>
                  <p className="my-0.5 text-[10pt]">
                    {safeCompanyInfo.address}
                  </p>
                </div>
              </div>
              <div className="text-[10pt] flex gap-5">
                <span>
                  <strong>GSTIN:</strong> {safeCompanyInfo.gstNumber}
                </span>
                <span>
                  <strong>PAN NO:</strong> {safeCompanyInfo.panNumber}
                </span>
              </div>
            </div>

            {/* Customer Details Section */}
            <div className="p-2.5">
              <div className="mb-1.5">
                <strong className="text-[11pt]">PARTY'S NAME:</strong>
              </div>
              <div className="text-[10pt] leading-relaxed">
                <div>
                  <strong>
                    {formData.partyId
                      ? getPartyName(formData.partyId)
                      : "No Party Selected"}
                  </strong>
                </div>
                {formData.partyId && (
                  <>
                    <div>
                      GSTIN:{" "}
                      {safeLedgers.find((l) => l.id === formData.partyId)
                        ?.gstNumber || "N/A"}
                    </div>
                    <div>
                      Address:{" "}
                      {safeLedgers.find((l) => l.id === formData.partyId)
                        ?.address || "N/A"}
                    </div>
                    <div>
                      State:{" "}
                      {safeLedgers.find((l) => l.id === formData.partyId)
                        ?.state || "N/A"}
                    </div>
                  </>
                )}
                {formData.purchaseLedgerId && (
                  <div className="mt-1.5">
                    <strong>Purchase Ledger:</strong>
                    {getPurchaseLedgerName(formData.purchaseLedgerId)}
                  </div>
                )}
                {formData.dispatchDetails?.destination && (
                  <div>
                    <strong>Origin:</strong>
                    {formData.dispatchDetails.destination}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Particulars Table */}
          {formData.mode === "item-invoice" ? (
            <table className={PRINT_STYLES.table}>
              <thead>
                <tr className="bg-gray-100">
                  <th className={`${PRINT_STYLES.headerCell} w-12 text-center`}>
                    Sr No
                  </th>
                  <th className={PRINT_STYLES.headerCell}>
                    Particulars (Description & Specifications)
                  </th>
                  <th className={`${PRINT_STYLES.headerCell} w-16 text-center`}>
                    HSN Code
                  </th>
                  <th className={`${PRINT_STYLES.headerCell} w-16 text-center`}>
                    Qty
                  </th>
                  <th className={`${PRINT_STYLES.headerCell} w-20 text-right`}>
                    Rate
                  </th>
                  <th className={`${PRINT_STYLES.headerCell} w-16 text-center`}>
                    GST %
                  </th>
                  <th className={`${PRINT_STYLES.headerCell} w-24 text-right`}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {formData.entries
                  .filter(
                    (entry) =>
                      entry.itemId &&
                      entry.itemId !== "" &&
                      entry.itemId !== "select"
                  )
                  .map((entry, index) => {
                    const itemDetails = getItemDetails(entry.itemId || "");
                    const baseAmount =
                      (entry.quantity || 0) * (entry.rate || 0);
                    const gstRate = itemDetails.gstRate || 0;

                    return (
                      <tr key={entry.id}>
                        <td className={`${PRINT_STYLES.cellCenter} font-bold`}>
                          {index + 1}
                        </td>
                        <td className={PRINT_STYLES.cell}>
                          <strong>{itemDetails.name}</strong>
                        </td>
                        <td className={PRINT_STYLES.cellCenter}>
                          {itemDetails.hsnCode}
                        </td>
                        <td className={PRINT_STYLES.cellCenter}>
                          {entry.quantity?.toLocaleString() || "0"}{" "}
                          {itemDetails.unit}
                        </td>
                        <td className={PRINT_STYLES.cellRight}>
                          ₹{entry.rate?.toLocaleString() || "0"}
                        </td>
                        <td className={PRINT_STYLES.cellCenter}>{gstRate}%</td>
                        <td className={PRINT_STYLES.cellRight}>
                          ₹{baseAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                {/* Add empty rows for spacing if no items */}
                {formData.entries.filter(
                  (entry) =>
                    entry.itemId &&
                    entry.itemId !== "" &&
                    entry.itemId !== "select"
                ).length === 0 && (
                    <>
                      <tr>
                        <td
                          className="border border-black p-5 text-[10pt] text-center"
                          colSpan={COLSPAN_VALUES.PRINT_TABLE_NO_ITEMS}
                        >
                          No items selected
                        </td>
                      </tr>
                      {Array(3)
                        .fill(0)
                        .map((_, index) => (
                          <tr key={`empty-${index}`}>
                            <td className="border border-black p-5 text-[10pt]">
                              &nbsp;
                            </td>
                            <td className="border border-black p-5 text-[10pt]">
                              &nbsp;
                            </td>
                            <td className="border border-black p-5 text-[10pt]">
                              &nbsp;
                            </td>
                            <td className="border border-black p-5 text-[10pt]">
                              &nbsp;
                            </td>
                            <td className="border border-black p-5 text-[10pt]">
                              &nbsp;
                            </td>
                            <td className="border border-black p-5 text-[10pt]">
                              &nbsp;
                            </td>
                            <td className="border border-black p-5 text-[10pt]">
                              &nbsp;
                            </td>
                          </tr>
                        ))}
                    </>
                  )}

                {/* Add empty rows for spacing when items exist */}
                {formData.entries.filter(
                  (entry) =>
                    entry.itemId &&
                    entry.itemId !== "" &&
                    entry.itemId !== "select"
                ).length > 0 &&
                  formData.entries.filter(
                    (entry) =>
                      entry.itemId &&
                      entry.itemId !== "" &&
                      entry.itemId !== "select"
                  ).length < 4 &&
                  Array(
                    Math.max(
                      0,
                      4 -
                      formData.entries.filter(
                        (entry) =>
                          entry.itemId &&
                          entry.itemId !== "" &&
                          entry.itemId !== "select"
                      ).length
                    )
                  )
                    .fill(0)
                    .map((_, index) => (
                      <tr key={`empty-${index}`}>
                        <td className="border border-black p-5 text-[10pt]">
                          &nbsp;
                        </td>
                        <td className="border border-black p-5 text-[10pt]">
                          &nbsp;
                        </td>
                        <td className="border border-black p-5 text-[10pt]">
                          &nbsp;
                        </td>
                        <td className="border border-black p-5 text-[10pt]">
                          &nbsp;
                        </td>
                        <td className="border border-black p-5 text-[10pt]">
                          &nbsp;
                        </td>
                        <td className="border border-black p-5 text-[10pt]">
                          &nbsp;
                        </td>
                        <td className="border border-black p-5 text-[10pt]">
                          &nbsp;
                        </td>
                      </tr>
                    ))}
              </tbody>
              {/* Tax Summary */}
              <tfoot>
                <tr>
                  <td
                    colSpan={5}
                    className="border border-black p-1.5 text-[9pt]"
                  >
                    <strong>Terms & Conditions:</strong>
                    <br />
                    <span className="text-[8pt]">
                      • Goods once received will not be returned without proper
                      cause.
                      <br />
                      • Interest @ 18% p.a. will be charged on delayed payments.
                      <br />• Subject to {safeCompanyInfo.address} Jurisdiction
                      only.
                      <br />
                      • Our responsibility ceases as soon as goods are
                      delivered.
                      <br />• Quality check to be done on receipt of goods.
                    </span>
                  </td>
                  <td className="border border-black p-1.5 text-[10pt] text-right font-bold">
                    <div className="mb-1.5">Subtotal</div>
                    {cgstTotal > 0 && <div className="mb-1.5">Add: CGST</div>}
                    {sgstTotal > 0 && <div className="mb-1.5">Add: SGST</div>}
                    {igstTotal > 0 && <div className="mb-1.5">Add: IGST</div>}
                    {discountTotal > 0 && (
                      <div className="mb-1.5">Less: Discount</div>
                    )}
                    <div className="font-bold text-[11pt]">Grand Total</div>
                  </td>
                  <td className="border border-black p-1.5 text-[10pt] text-right">
                    <div className="mb-1.5">₹{subtotal.toLocaleString()}</div>
                    {cgstTotal > 0 && (
                      <div className="mb-1.5">
                        ₹{cgstTotal.toLocaleString()}
                      </div>
                    )}
                    {sgstTotal > 0 && (
                      <div className="mb-1.5">
                        ₹{sgstTotal.toLocaleString()}
                      </div>
                    )}
                    {igstTotal > 0 && (
                      <div className="mb-1.5">
                        ₹{igstTotal.toLocaleString()}
                      </div>
                    )}
                    {discountTotal > 0 && (
                      <div className="mb-1.5">
                        ₹{discountTotal.toLocaleString()}
                      </div>
                    )}
                    <div className="font-bold text-[11pt]">
                      ₹{total.toLocaleString()}
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full border-collapse mb-5">
              <thead>
                <tr>
                  <th className="border border-black p-1.5">Ledger</th>
                  <th className="border border-black p-1.5 text-right">
                    Amount
                  </th>
                  <th className="border border-black p-1.5">Type</th>
                </tr>
              </thead>
              <tbody>
                {formData.entries.map((entry) => {
                  const selectedLedger = safeLedgers.find(
                    (l) => l.id === entry.ledgerId
                  );
                  return (
                    <tr key={entry.id}>
                      <td className="border border-black p-1.5">
                        {selectedLedger?.name || "-"}
                      </td>
                      <td className="border border-black p-1.5 text-right">
                        {entry.amount.toLocaleString()}
                      </td>
                      <td className="border border-black p-1.5">
                        {entry.type}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td className="border border-black p-1.5 text-right font-bold">
                    Debit Total:
                  </td>
                  <td className="border border-black p-1.5 text-right">
                    {debitTotal.toLocaleString()}
                  </td>
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-right font-bold">
                    Credit Total:
                  </td>
                  <td className="border border-black p-1.5 text-right">
                    {creditTotal.toLocaleString()}
                  </td>
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5"></td>
                </tr>
              </tfoot>
            </table>
          )}
          {/* Amount in Words */}
          <div className="border border-black p-2.5 mb-4">
            <strong className="text-[11pt]">
              Total Amount (Rs. in Words):
            </strong>
            <div className="text-[10pt] mt-1.5 min-h-[20px]">
              Rupees {total > 0 ? total.toLocaleString() : "Zero"} Only
              {total > 0 && ` (₹${total.toLocaleString()})`}
            </div>
          </div>
          {/* GST Calculation Summary */}
          {formData.entries.filter(
            (entry) =>
              entry.itemId && entry.itemId !== "" && entry.itemId !== "select"
          ).length > 0 && (
              <div className="border border-black p-2.5 mb-4">
                <strong className="text-[11pt] mb-2 block">
                  GST Calculation Summary:
                </strong>
                <div className="text-[10pt]">
                  {(() => {
                    const gstInfo = getGstRateInfo();
                    return (
                      <div>
                        <div className="flex justify-between mb-2 font-bold">
                          <span>Total Items: {gstInfo.totalItems}</span>
                          <span>
                            GST Rates Applied: {gstInfo.uniqueGstRatesCount}
                          </span>
                        </div>
                        <div className="text-[9pt] mb-2">
                          <strong>GST Rates Used:</strong>
                          {gstInfo.gstRatesUsed.join("%, ")}%
                        </div>
                        {Object.entries(gstInfo.breakdown).map(([rate, data]) => (
                          <div
                            key={rate}
                            className="flex justify-between mb-1 border-b border-dotted border-gray-300 pb-0.5"
                          >
                            <span>
                              GST {rate}%: {data.count} item
                              {data.count > 1 ? "s" : ""}
                            </span>
                            <span>₹{data.gstAmount.toLocaleString()} GST</span>
                          </div>
                        ))}
                        <div className="mt-2 text-center text-[9pt] italic text-gray-600">
                          This invoice includes {gstInfo.uniqueGstRatesCount}
                          different GST rate
                          {gstInfo.uniqueGstRatesCount > 1 ? "s" : ""} as per item
                          specifications
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          {/* Footer Section */}
          <div className="flex justify-between mt-12 pt-4 border-t border-gray-300">
            <div className="flex-1">
              <div className="text-[11pt] font-bold mb-8">
                For {safeCompanyInfo.name.toUpperCase()}
              </div>
              <div className="mt-12">
                <div className="border-t border-black w-32 pt-1 text-[10pt] text-center">
                  Authorised Signatory
                </div>
              </div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-[11pt] font-bold mb-8">
                Supplier's Signature
              </div>
              <div className="mt-12 flex justify-end">
                <div className="border-t border-black w-32 pt-1 text-[10pt] text-center">
                  Supplier's Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
          }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Note:</span> Use Purchase Voucher for
          recording purchases. Press F8 to create, F9 to save, F12 to configure,
          Esc to cancel.
        </p>
      </div>
    </div >
  );
};

export default PurchaseVoucher;
