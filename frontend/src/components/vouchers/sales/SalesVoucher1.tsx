import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type {
  VoucherEntry,
  Ledger,
  Godown,
  LedgerWithGroup,
  SalesType,
} from "../../../types";
import { Save, Plus, Trash2, ArrowLeft, Printer, Settings } from "lucide-react";

import Swal from "sweetalert2";
import EWayBillGeneration from "./EWayBillGeneration";
import InvoicePrint from "./InvoicePrint";
import PrintOptions from "./PrintOptions";
import type { StockItem } from "../../../types";

// DRY Constants for Tailwind Classes
const FORM_STYLES = {
  input: (theme: string, hasError?: boolean) =>
    `w-full p-2 rounded border ${theme === "dark"
      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
      : "bg-white border-gray-300 focus:border-blue-500"
    } outline-none transition-colors ${hasError ? "border-red-500" : ""}`,
  select: (theme: string, hasError?: boolean) =>
    `w-full p-2 rounded border cursor-pointer ${theme === "dark"
      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
      : "bg-white border-gray-300 focus:border-blue-500"
    } outline-none transition-colors ${hasError ? "border-red-500" : ""}`,
  tableInput: (theme: string) =>
    `w-full p-1 rounded border ${theme === "dark"
      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
      : "bg-white border-gray-300 focus:border-blue-500"
    } outline-none transition-colors`,
  tableSelect: (theme: string) =>
    `w-full p-1 rounded border cursor-pointer ${theme === "dark"
      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
      : "bg-white border-gray-300 focus:border-blue-500"
    } outline-none transition-colors`,
};

const SalesVoucher: React.FC = () => {
  const {
    theme,
    godowns = [],
    vouchers = [],
    units = [],
    companyInfo,
    setCompanyInfo,
    addVoucher,
    updateVoucher,
  } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  const [ledgers, setLedgers] = useState<LedgerWithGroup[]>([]);
  const [selectedPartyState, setSelectedPartyState] = useState<string>(""); // Store selected party's state
  const [selectedPartyGst, setSelectedPartyGst] = useState<string>(""); // Store selected party's GST number
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([]);
  const [selectedSalesTypeId, setSelectedSalesTypeId] = useState<string>("");
  const [isReadyToSave, setIsReadyToSave] = useState(false);
  const DRAFT_KEY = "SALES_VOUCHER_CREATE_DRAFT";

  // Robust detection for party ledgers — backend may return different field names

  const isPartyLedger = (l: any) => {
    const groupName =
      l.groupName || l.group_name || (l.group && l.group.name) || "";
    const groupId = l.groupId ?? l.group_id ?? (l.group && l.group.id);

    if (!groupName && !groupId && !l.type) {
      const lower = (l.name || "").toLowerCase();
      return (
        lower.includes("cash") ||
        lower.includes("debtor") ||
        lower.includes("customer") ||
        lower.includes("party")
      );
    }

    if (groupName) {
      const gn = groupName.toString().toLowerCase();
      if (
        gn.includes("sundry") ||
        gn.includes("debtor") ||
        gn.includes("cash") ||
        gn.includes("customer")
      )
        return true;
    }

    if (groupId === 7 || groupId === "7" || groupId === 8 || groupId === "8")
      return true;

    if (
      l.type &&
      (l.type === "customer" || l.type === "cash" || l.type === "party")
    )
      return true;

    return false;
  };

  const partyLedgers = ledgers;
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [unitss, setUnits] = useState<any[]>([]);

  // 🔹 Fetch units from backend
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-units?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setUnits(data);
      } catch (error) {
        console.error("Failed to fetch units:", error);
      }
    };
    if (companyId) fetchUnits();
  }, [companyId, ownerType, ownerId]);

  // Unified Item Details Helper
  const getItemDetails = (itemId: string) => {
    const item = (stockItems || []).find((i) => String(i.id) === String(itemId));
    if (!item)
      return {
        name: "-",
        hsnCode: "",
        unit: "-",
        unitId: "",
        unitLabel: "",
        gstRate: 0,
        rate: 0,
        batches: [],
      };

    const rawUnit = item.unitId ?? item.unit_id ?? item.unit ?? item.unitName ?? null;

    // Look in context units OR local unitss
    const allUnits = [...(units || []), ...(unitss || [])];
    const matchedUnit = allUnits.find((u) => String(u.id) === String(rawUnit)) ||
      allUnits.find((u) => u.name?.toLowerCase() === String(rawUnit).toLowerCase() || u.symbol?.toLowerCase() === String(rawUnit).toLowerCase());

    const unitIdResult = matchedUnit?.id ?? rawUnit ?? "";
    const unitLabelResult = matchedUnit?.symbol || matchedUnit?.name || String(rawUnit || "");

    return {
      name: item.name,
      hsnCode: item.hsnCode || "",
      unit: unitLabelResult,
      unitId: unitIdResult,
      unitLabel: unitLabelResult,
      gstRate: Number(item.gstRate) || 0,
      gstLedgerId: (item as any).gstLedgerId || "",
      cgstLedgerId: (item as any).cgstLedgerId || "",
      sgstLedgerId: (item as any).sgstLedgerId || "",
      igstLedgerId: (item as any).igstLedgerId || "",
      rate: Number(item.standardSaleRate || item.sellingRate || item.sellingPrice || item.saleRate || item.rate || item.mrp || 0),
      mrp: Number(item.mrp || item.MRP || item.sellingPrice || 0),
      batches: (() => {
        if (!item.batches) return [];
        try { return typeof item.batches === "string" ? JSON.parse(item.batches) : item.batches; } catch { return []; }
      })(),
    };
  };

  const getUnitName = (unitId: any) => {
    if (!unitId) return "-";
    const unit = unitss.find((u: any) => String(u.id) === String(unitId));
    return unit?.name || unit?.symbol || "-";
  };

  // Check if quotation mode is requested via URL

  const isQuotationMode = searchParams.get("mode") === "quotation";

  // Safe fallbacks for context data - Remove demo data and use only from context
  const safeStockItems = stockItems || [];
  const safeLedgers = ledgers || [];

  // Fetch company info if not available in context
  useEffect(() => {
    if (!companyInfo && companyId && setCompanyInfo) {
      const fetchCompanyInfo = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/company/company/${companyId}`
          );
          if (!res.ok) {
            console.error("Failed to fetch company info:", res.status);
            return;
          }
          const data = await res.json();
          // Update context with fetched company info
          if (data) {
            setCompanyInfo(data);
          }
        } catch (err) {
          console.error("Error fetching company info:", err);
        }
      };
      fetchCompanyInfo();
    }
  }, [companyId, companyInfo, setCompanyInfo]);

  // Fetch Sales Types for voucher type dropdown
  useEffect(() => {
    const fetchSalesTypes = async () => {
      try {
        let url = `${import.meta.env.VITE_API_URL}/api/sales-types`;

        // Add tenant filters if available
        if (companyId && ownerType && ownerId) {
          url += `?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
        }

        const res = await fetch(url);
        const json = await res.json();
        if (json?.success) {
          setSalesTypes(json?.data || []);
          // Auto-select default Sales type (id=1) if not in edit mode
          if (!isEditMode && !selectedSalesTypeId) {
            setSelectedSalesTypeId("1");
          }
        } else {
          setSalesTypes([]);
        }
      } catch (err) {
        console.error("Error fetching sales types:", err);
        setSalesTypes([]);
      }
    };
    fetchSalesTypes();
  }, []);

  // Bill No. preview based on selected sales type (prefix + (current_no+1) + suffix)
  const selectedSalesType = useMemo(() => {
    if (!selectedSalesTypeId) return null;
    return (
      salesTypes.find((st) => String(st.id) === String(selectedSalesTypeId)) ||
      null
    );
  }, [salesTypes, selectedSalesTypeId]);

  const billNoPreview = useMemo(() => {
    if (!selectedSalesType) return "";

    const prefix = (selectedSalesType.prefix || "").trim();
    const suffix = (selectedSalesType.suffix || "").trim();
    const nextNo = Number(selectedSalesType.current_no || 0) + 1;

    // If both prefix and suffix are empty -> show only next number
    if (!prefix && !suffix) return String(nextNo);
    // If one side missing, it will just concatenate the available parts
    return `${prefix}${nextNo}${suffix}`;
  }, [selectedSalesType]);

  // Check localStorage for companyInfo as fallback
  useEffect(() => {
    if (!companyInfo) {
      try {
        const storedCompanyInfo = localStorage.getItem("companyInfo");
        if (storedCompanyInfo) {
          const parsed = JSON.parse(storedCompanyInfo);
          if (setCompanyInfo && parsed) {
            setCompanyInfo(parsed);
          }
        }
      } catch (err) {
        console.error("Error parsing companyInfo from localStorage:", err);
      }
    }
  }, [companyInfo, setCompanyInfo]);

  const safeCompanyInfo = companyInfo || {
    name: "Your Company Name",
    address: "Your Company Address",
    gstNumber: "N/A",
    phoneNumber: "N/A",
    state: "Default State",
    panNumber: "N/A",
  };

  // State initialization first
  const [isQuotation, setIsQuotation] = useState(isQuotationMode); // Initialize with URL parameter
  const [godownList, setGodownList] = useState<Godown[]>([]);

  // 🔹 PROFIT / PRICING RULE STATE
  const [pricingRule, setPricingRule] = useState<{
    customerType: "wholesale" | "retailer" | "";
    method: "profit_percentage" | "on_mrp" | "";
    value: number; // % value (2, 5, etc.)
  }>({
    customerType: "",
    method: "",
    value: 0,
  });

  const getInitialFormData = (): Omit<VoucherEntry, "id"> => {
    if (isEditMode && id) {
      const existingVoucher = vouchers.find((v) => v.id === id);
      if (existingVoucher) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _, ...voucherData } = existingVoucher;
        return voucherData;
      }
    }
    return {
      date: new Date().toISOString().split("T")[0],
      type: isQuotationMode ? "quotation" : "sales",
      // number: `${isQuotation ? "QT" : "XYZ"}0001`, // Will be updated by useEffect
      number: "",
      narration: "",
      referenceNo: "",
      partyId: "",
      mode: "item-invoice",
      dispatchDetails: { docNo: "", through: "", destination: "", approxDistance: "", },
      salesLedgerId: "", // Add sales ledger field
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
          godownId: "",
          salesLedgerId: "",
          discount: 0,
          hsnCode: "",
        },
      ],
    };
  };

  const [formData, setFormData] = useState<Omit<VoucherEntry, "id">>(() =>
    getInitialFormData()
  );

  // --- DRAFT PERSISTENCE (RESTORE) ---
  useEffect(() => {
    if (isEditMode) {
      setIsReadyToSave(true);
      return;
    }

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed && (parsed.partyId || (parsed.entries && parsed.entries.some((e: any) => e.itemId)))) {
          setFormData(parsed);

          if (parsed.sales_type_id) {
            setSelectedSalesTypeId(parsed.sales_type_id);
          }

          if (parsed.profitConfig) {
            setProfitConfig(parsed.profitConfig);
          }

          Swal.fire({
            toast: true,
            position: "top-end",
            icon: "info",
            title: "Draft restored",
            showConfirmButton: false,
            timer: 2000,
          });
        }
      } catch (e) {
        console.error("Failed to restore Sales Voucher draft", e);
      }
    }
    setIsReadyToSave(true);
  }, [isEditMode]);

  // --- DRAFT PERSISTENCE (SAVE) ---
  useEffect(() => {
    if (!isEditMode && isReadyToSave && formData) {
      const hasData = formData.partyId || formData.entries.some(e => e.itemId || e.quantity > 0);
      if (hasData) {
        // Include additional states in the draft
        const draftData = {
          ...formData,
          sales_type_id: selectedSalesTypeId,
          profitConfig: profitConfig
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      }
    }
  }, [formData, isEditMode, isReadyToSave, selectedSalesTypeId]);

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);

    setFormData({
      date: new Date().toISOString().split("T")[0],
      type: isQuotationMode ? "quotation" : "sales",
      number: formData.number, // Keep the number
      narration: "",
      referenceNo: "",
      partyId: "",
      mode: "item-invoice",
      dispatchDetails: { docNo: "", through: "", destination: "", approxDistance: "", },
      salesLedgerId: "",
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
          godownId: "",
          salesLedgerId: "",
          discount: 0,
          hsnCode: "",
        },
      ],
    });

    setSelectedPartyState("");
    setSelectedPartyGst("");
    setProfitConfig({ customerType: "", method: "", value: "" });
    setIsReadyToSave(true);
    setShowConfig(false);

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

  const [godownEnabled, setGodownEnabled] = useState<"yes" | "no">("yes"); // Add state for godown selection visibility
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPrintOptions, setShowPrintOptions] = useState(false); // Print options popup state
  const [showEWayBill, setShowEWayBill] = useState(false); // E-way Bill modal state
  const [showInvoicePrint, setShowInvoicePrint] = useState(false); // Invoice print modal state
  const [showConfig, setShowConfig] = useState(false);
  const [columnSettings, setColumnSettings] = useState({
    showGodown: true,
    showBatch: true,
    showDiscount: true,
    showGST: true,

    // NEW HEADER FIELD CONTROLS
    showDestination: true,
    showDispatchThrough: true,
    showDispatchDocNo: true,
    showDispatchDetails: true,
  });

  //wholsell or retailer
  const [profitConfig, setProfitConfig] = useState({
    customerType: "",
    method: "",
    value: "",
  });

  // Add these states at top of your component:
  const [statusMsg, setStatusMsg] = useState("");
  const [statusColor, setStatusColor] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isBarcodeError, setIsBarcodeError] = useState(false);

  // timers for debouncing rate input per entry
  // POS Barcode Scanner Logic (Global Listener)
  const barcodeBuffer = useRef("");
  const lastKeyTime = useRef(0);
  const rateDebounceTimers = useRef<{ [entryId: string]: number | null }>({});

  // Add this useEffect() in component (below states)
  useEffect(() => {
    const ownerId = localStorage.getItem("employee_id") || 1;
    const ownerType = localStorage.getItem("supplier") || "admin";

    if (!profitConfig.customerType || !profitConfig.method) {
      setStatusMsg("");
      return;
    }

    fetch(
      `${import.meta.env.VITE_API_URL}/api/set-profit/${ownerId}/${ownerType}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.success || !data.data) {
          setStatusMsg("Not Set");
          setStatusColor("text-red-600 font-semibold");
          return;
        }

        const saved = data.data;

        let savedMethod = "";
        let savedValue = "";

        // 🔥 IMPORTANT MAPPING
        if (profitConfig.customerType === "wholesale") {
          savedMethod = saved.wholesale_method;
          savedValue = saved.wholesale_value;
        } else if (profitConfig.customerType === "retailer") {
          savedMethod = saved.retailer_method;
          savedValue = saved.retailer_value;
        }

        if (savedMethod === profitConfig.method && Number(savedValue) > 0) {
          setPricingRule({
            customerType: profitConfig.customerType as any,
            method: savedMethod as any,
            value: Number(savedValue),
          });

          setStatusMsg(
            `Value: ${profitConfig.customerType} Profit Percentage ${savedValue}%`
          );
          setStatusColor("text-green-600 font-semibold");
        } else {
          setStatusMsg("Not Set");
          setStatusColor("text-red-600 font-semibold");
        }
      })
      .catch(() => {
        setStatusMsg("Not Set");
        setStatusColor("text-red-600 font-semibold");
      });
  }, [profitConfig.customerType, profitConfig.method]);

  // Regenerate voucher number when quotation mode changes
  useEffect(() => {
    if (!isEditMode) {
      setFormData((prev) => ({
        ...prev,
        number: "",
        type: isQuotation ? "quotation" : "sales",
      }));
    }
  }, [isQuotation, isEditMode]);

  // Load voucher in edit mode
  // ================= EDIT MODE LOAD (BACKEND DRIVEN) =================

  useEffect(() => {
    if (!isEditMode || !id) return;

    const loadSingleVoucher = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales-vouchers/${id}`
        );

        const data = await res.json();

        if (!data.success) {
          console.error("Failed to load voucher");
          return;
        }

        // 🔥 DIRECT FROM BACKEND
        setFormData({
          date: data.date?.split("T")[0] || "",

          number: data.number || "",

          referenceNo: data.referenceNo || "",

          partyId: data.partyId?.toString() || "",

          mode: "item-invoice",

          isQuotation: data.isQuotation === 1,

          salesLedgerId: data.salesLedgerId?.toString() || "",

          dispatchDetails: {
            docNo: data.dispatchDocNo || "",
            through: data.dispatchThrough || "",
            destination: data.destination || "",
            approxDistance: data.approxDistance || "",
          },

          narration: data.narration || "",

          // ⭐ MAIN FIX: Map IDs correctly (Backend stores IDs in Rate columns)
          entries: data.entries.map((e: any, i: any) => ({
            id: "e" + i + Date.now(),

            itemId: e.itemId,

            quantity: Number(e.quantity || 0),

            rate: Number(e.rate || 0),

            discount: Number(e.discount || 0),

            amount: Number(e.amount || 0),

            // Map Backend IDs to LedgerId fields (Convert float string "115.00" to int 115)
            cgstLedgerId: e.cgstRate ? String(Math.round(Number(e.cgstRate))) : "",
            sgstLedgerId: e.sgstRate ? String(Math.round(Number(e.sgstRate))) : "",
            igstLedgerId: e.igstRate ? String(Math.round(Number(e.igstRate))) : "",

            // Initialise Rates to 0 (will be hydrated by useEffect)
            cgstRate: 0,
            sgstRate: 0,
            igstRate: 0,

            godownId: e.godownId || "",

            salesLedgerId: e.salesLedgerId?.toString() || "",

            // 🔥 AUTO FROM HISTORY
            hsnCode: e.hsnCode || "",

            batchNumber: e.batchNumber || "",

            type: "debit",
          })),

          type: "sales",
        });

        setIsQuotation(data.isQuotation === 1);
        setSelectedSalesTypeId(data.sales_type_id?.toString() || "");

      } catch (err) {
        console.error("Single voucher load error:", err);
      }
    };

    loadSingleVoucher();
  }, [isEditMode, id]);

  // 🔥 HYDRATE GST RATES FROM LEDGER IDs (Fix for Edit Mode)
  useEffect(() => {
    // Wait until dependencies are loaded
    const ledgersLoaded = ledgers.length > 0;
    const itemsLoaded = stockItems.length > 0;

    if (formData.entries.length === 0) return;

    setFormData((prev) => {
      let hasChanges = false;

      const newEntries = prev.entries.map((entry) => {
        let updatedEntry = { ...entry };
        let entryChanged = false;

        // --- 1. Hydrate Item Details (Batches, Unit, HSN) ---
        if (itemsLoaded && entry.itemId) {
          const details = getItemDetails(entry.itemId);
          if (details.name !== "-") {
            // Batches (only if missing)
            if ((!updatedEntry.batches || updatedEntry.batches.length === 0) && details.batches && details.batches.length > 0) {
              updatedEntry.batches = details.batches;
              entryChanged = true;
            }

            // HSN (if missing)
            if (!updatedEntry.hsnCode && details.hsnCode) {
              updatedEntry.hsnCode = details.hsnCode;
              entryChanged = true;
            }

            // Unit (if missing)
            if (!updatedEntry.unitId && details.unitId) {
              updatedEntry.unitId = details.unitId;
              updatedEntry.unitLabel = details.unitLabel;
              entryChanged = true;
            }
          }
        }

        // --- 2. Hydrate GST Rates from Ledger IDs ---
        if (ledgersLoaded) {
          const extract = (ledgerId: any) => {
            if (!ledgerId) return 0;
            const l = ledgers.find((x) => String(x.id) === String(ledgerId));
            if (l && l.name) {
              const m = l.name.match(/(\d+(\.\d+)?)/);
              return m ? Number(m[1]) : 0;
            }
            return 0;
          };

          if (entry.cgstLedgerId) {
            const r = extract(entry.cgstLedgerId);
            if (r !== updatedEntry.cgstRate) { updatedEntry.cgstRate = r; entryChanged = true; }
          }
          if (entry.sgstLedgerId) {
            const r = extract(entry.sgstLedgerId);
            if (r !== updatedEntry.sgstRate) { updatedEntry.sgstRate = r; entryChanged = true; }
          }
          if (entry.igstLedgerId) {
            const r = extract(entry.igstLedgerId);
            if (r !== updatedEntry.igstRate) { updatedEntry.igstRate = r; entryChanged = true; }
          }
        }

        if (entryChanged) {
          hasChanges = true;
          return updatedEntry;
        }
        return entry;
      });

      if (hasChanges) {
        return { ...prev, entries: newEntries };
      }
      return prev;
    });
  }, [ledgers, stockItems, units, unitss, formData.entries]);


  // voucher no logic
  useEffect(() => {
    if (!selectedSalesType || isEditMode) return;

    const prefix = (selectedSalesType.prefix || "").trim();
    const suffix = (selectedSalesType.suffix || "").trim();
    const nextNo = Number(selectedSalesType.current_no || 0) + 1;

    let voucherNo = "";

    if (!prefix && !suffix) {
      voucherNo = String(nextNo);
    } else {
      voucherNo = `${prefix}${nextNo}${suffix}`;
    }

    setFormData((prev) => ({
      ...prev,
      number: voucherNo,
    }));
  }, [selectedSalesType]);

  // Set party state when ledgers are loaded and party is selected
  useEffect(() => {
    if (formData.partyId && ledgers.length > 0) {
      const party = ledgers.find(
        (l) => String(l.id) === String(formData.partyId)
      );

      // Try multiple possible field names for state
      const partyAny = party as any;
      const partyState =
        partyAny?.state || partyAny?.state_name || partyAny?.State || "";
      setSelectedPartyState(partyState);

      const partyGst =
        partyAny?.gstNumber || partyAny?.gst_number || partyAny?.gstin || "";
      setSelectedPartyGst(partyGst);

      // Debug logging for state matching
      const companyState = safeCompanyInfo?.state || "";
      const statesMatch =
        companyState &&
        partyState &&
        companyState.toLowerCase().trim() === partyState.toLowerCase().trim();
    } else {
      setSelectedPartyState("");
      setSelectedPartyGst("");
    }
  }, [formData.partyId, ledgers, safeCompanyInfo?.state]);

  //godown fatch
  useEffect(() => {
    const fetchGodowns = async () => {
      try {
        const companyId = localStorage.getItem("company_id");
        const ownerType = localStorage.getItem("supplier");
        const ownerId = localStorage.getItem(
          ownerType === "employee" ? "employee_id" : "user_id"
        );

        if (!companyId || !ownerType || !ownerId) {
          console.error("Missing auth params");
          return;
        }

        const url = `${import.meta.env.VITE_API_URL
          }/api/godowns?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

        const res = await fetch(url);
        const data = await res.json();
        setGodownList(data.data);
      } catch (err) {
        console.error("Error loading godowns:", err);
      }
    };

    fetchGodowns();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("supplier");
    const ownerId = localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    );
    if (!companyId || !ownerType || !ownerId) return;

    const params = new URLSearchParams({
      company_id: companyId,
      owner_type: ownerType,
      owner_id: ownerId,
    });

    fetch(
      `${import.meta.env.VITE_API_URL}/api/stock-items?${params.toString()}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log('stockitem', data.data)
          setStockItems(data.data);
        } else setStockItems([]);
      })
      .catch(() => setStockItems([]));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.startsWith("dispatchDetails.")) {
      const field = name.split(".")[1];

      setFormData((prev) => ({
        ...prev,
        dispatchDetails: {
          docNo: prev.dispatchDetails?.docNo || "",
          through: prev.dispatchDetails?.through || "",
          destination: prev.dispatchDetails?.destination || "",
          approxDistance: prev.dispatchDetails?.approxDistance || "",
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      // When party is selected, store the party's state
      if (name === "partyId" && value) {
        const selectedParty = ledgers.find(
          (l) => String(l.id) === String(value)
        );
        const selectedAny = selectedParty as any;
        const partyState =
          selectedAny?.state ||
          selectedAny?.state_name ||
          selectedAny?.State ||
          "";
        setSelectedPartyState(partyState);

        const partyGst =
          selectedAny?.gstNumber ||
          selectedAny?.gst_number ||
          selectedAny?.gstin ||
          "";
        setSelectedPartyGst(partyGst);

        // Update GST rates for all existing entries when party changes
        if (formData.mode === "item-invoice") {
          setFormData((prev) => {
            const companyState = safeCompanyInfo?.state || "";
            const statesMatch =
              Boolean(companyState &&
              partyState &&
              companyState.toLowerCase().trim() ===
              partyState.toLowerCase().trim());

            // ✅ Extract GST % from ledger names
            const extractGstPercent = (ledgerId: any) => {
              if (!ledgerId) return 0;
              const ledger = safeLedgers.find((l) => String(l.id) === String(ledgerId));
              if (!ledger?.name) return 0;
              const match = ledger.name.match(/(\d+(\.\d+)?)/);
              return match ? Number(match[1]) : 0;
            };

            return {
              ...prev,
              entries: prev.entries.map((entry) => {
                if (!entry.itemId) return entry;

                const itemDetails = getItemDetails(entry.itemId);

                if (statesMatch) {
                  // Same state: CGST + SGST (extract from ledger names)
                  return {
                    ...entry,
                    cgstRate: extractGstPercent(itemDetails.cgstLedgerId),
                    sgstRate: extractGstPercent(itemDetails.sgstLedgerId),
                    igstRate: 0,
                    // ✅ Update ledger IDs for intra-state
                    cgstLedgerId: itemDetails.cgstLedgerId || "",
                    sgstLedgerId: itemDetails.sgstLedgerId || "",
                    gstLedgerId: "",
                    igstLedgerId: "",
                  };
                } else {
                  // Different state: IGST (extract from ledger name)
                  return {
                    ...entry,
                    cgstRate: 0,
                    sgstRate: 0,
                    igstRate: extractGstPercent(itemDetails.gstLedgerId || itemDetails.igstLedgerId),
                    // ✅ Update ledger IDs for inter-state
                    gstLedgerId: itemDetails.gstLedgerId || itemDetails.igstLedgerId || "",
                    igstLedgerId: itemDetails.igstLedgerId || itemDetails.gstLedgerId || "",
                    cgstLedgerId: "",
                    sgstLedgerId: "",
                  };
                }
              }),
            };
          });
        }
      }

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
    if (e.target.value === "add-new") {
      navigate("/app/masters/ledger/create");
      return;
    }
  };

  const applyProfit = (baseRate: number) => {
    if (
      pricingRule.method === "profit_percentage" &&
      Number(pricingRule.value) > 0
    ) {
      return Number(
        (baseRate + (baseRate * Number(pricingRule.value)) / 100).toFixed(2)
      );
    }

    return baseRate;
  };

  useEffect(() => {
    // ❌ agar profit rule hi select nahi hai → kuch mat karo
    if (
      pricingRule.method !== "profit_percentage" ||
      Number(pricingRule.value) <= 0
    ) {
      return;
    }

    setFormData((prev) => {
      const updatedEntries = prev.entries.map((entry) => {
        // ❌ empty rows skip
        if (!entry.rate || entry.rate <= 0) return entry;

        // 🟢 original/base rate nikalo
        // NOTE: assume current rate is base if profit pehle applied nahi hua
        const baseRate = Number(entry.rate);

        const newRate = applyProfit(baseRate);

        // ❌ agar same hai to re-render avoid karo
        if (newRate === entry.rate) return entry;

        return {
          ...entry,
          rate: newRate,
          amount: (entry.quantity || 0) * newRate - (entry.discount || 0),

        };
      });

      return { ...prev, entries: updatedEntries };
    });
  }, [pricingRule.method, pricingRule.value]);

  const handleEntryChange = async (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const updatedEntries = [...formData.entries];
    const entry = updatedEntries[index];

    const recalcAmount = (ent: any) => {
      const qty = Number(ent.quantity || 0);
      const rate = Number(ent.rate || 0);
      const discount = Number(ent.discount || 0);

      // ✅ Only base amount (NO GST here)
      return qty * rate - discount;
    };


    if (formData.mode === "item-invoice") {
      // 1️⃣ ITEM SELECT
      if (name === "itemId") {
        const details = getItemDetails(value);
        const gst = details.gstRate || 0;

        // Compare company state with party state
        const companyState = safeCompanyInfo?.state || "";
        const partyState = selectedPartyState || "";
        const statesMatch =
          Boolean(companyState &&
            partyState &&
            companyState.toLowerCase().trim() === partyState.toLowerCase().trim());

        // ✅ Extract GST % from ledger names (do this once)
        const extractGstPercent = (ledgerId: any) => {
          if (!ledgerId) return 0;
          const ledger = safeLedgers.find((l) => String(l.id) === String(ledgerId));
          if (!ledger?.name) return 0;
          const match = ledger.name.match(/(\d+(\.\d+)?)/);
          return match ? Number(match[1]) : 0;
        };

        // Extract rates once
        const extractedCgst = extractGstPercent(details.cgstLedgerId);
        const extractedSgst = extractGstPercent(details.sgstLedgerId);
        const extractedIgst = extractGstPercent(details.gstLedgerId || details.igstLedgerId);

        // Set GST rates based on state matching
        let cgstRate = 0;
        let sgstRate = 0;
        let igstRate = 0;

        if (statesMatch) {
          // Same state: CGST + SGST
          cgstRate = extractedCgst;
          sgstRate = extractedSgst;
          igstRate = 0;
        } else {
          // Different state: IGST
          cgstRate = 0;
          sgstRate = 0;
          igstRate = extractedIgst;
        }

        updatedEntries[index] = {
          ...entry,
          itemId: value,
          hsnCode: details.hsnCode || "",
          unitId: details.unitId || "",
          unitLabel: details.unitLabel || "",
          batches: details.batches || [],
          batchNumber: "",
          rate: details.rate || 0,
          quantity: 0,
          gstRate: gst,
          cgstRate: cgstRate,
          sgstRate: sgstRate,
          igstRate: igstRate,
          gstLedgerId: details.gstLedgerId || "",
          cgstLedgerId: details.cgstLedgerId || "",
          sgstLedgerId: details.sgstLedgerId || "",
          igstLedgerId: details.igstLedgerId || "",
        };


        // ================= AUTO SALES LEDGER (DYNAMIC) =================

        // Total GST calculate
        let totalGst = 0;

        if (statesMatch) {
          totalGst = Number(extractedCgst || 0) + Number(extractedSgst || 0);
        } else {
          totalGst = Number(extractedIgst || 0);
        }

        // Round (2.5+2.5=5, 9+9=18 etc.)
        totalGst = Math.round(totalGst);

        // Find Sales Ledger
        const salesLedger = getSalesLedgerByGst(totalGst, statesMatch); // Pass statesMatch (isIntra)

        if (salesLedger) {
          updatedEntries[index].salesLedgerId = String(salesLedger.id);
        } else if (totalGst > 0) {
          Swal.fire({
            icon: "warning",
            title: "Sales Ledger Missing",
            text: `Sales ${totalGst}% ${statesMatch ? 'Intra' : 'Inter'} Ledger not found. Please create it first.`,
          });
        }

        updatedEntries[index].amount = recalcAmount(updatedEntries[index]);
        setFormData((p) => ({ ...p, entries: updatedEntries }));
        return;
      }

      // 2️⃣ BATCH SELECT

      if (name === "batchNumber") {
        const selected = entry.batches?.find(
          (b: any) => String(b.batchName) === String(value)
        );

        if (!selected) return;

        const autoQty = Number(
          selected.batchQuantity ?? selected.quantity ?? 0
        );

        // ✅ base rate nikalo
        const baseRate = Number(
          selected.rate ?? selected.openingRate ?? entry.rate ?? 0
        );

        // ✅ profit apply karo
        const finalRate = applyProfit(baseRate);

        updatedEntries[index] = {
          ...entry,
          batchNumber: value,
          quantity: autoQty,
          rate: finalRate, // ✅ FIXED
          availableQty: autoQty,
        };

        // ✅ amount recalculation
        updatedEntries[index].amount = recalcAmount(updatedEntries[index]);

        setFormData((p) => ({ ...p, entries: updatedEntries }));
        return;
      }

      // 3️⃣ QUANTITY UPDATE
      if (name === "quantity") {
        const oldQty = Number(entry.quantity || 0);
        const newQty = Number(value || 0);

        // 🟢 If NO batch system → allow free quantity, NO stock error
        if (!entry.batches || entry.batches.length === 0) {
          updatedEntries[index].quantity = newQty;
          updatedEntries[index].amount = recalcAmount(updatedEntries[index]);
          setFormData((p) => ({ ...p, entries: updatedEntries }));
          return;
        }

        // 🟡 If batch exists but no batch selected
        if (!entry.batchNumber) {
          // update UI first
          updatedEntries[index].quantity = newQty;
          updatedEntries[index].amount = recalcAmount(updatedEntries[index]);
          setFormData((p) => ({ ...p, entries: updatedEntries }));

          // Try to find a candidate batch with empty name but quantity/meta present
          const candidateBatch = (entry.batches || []).find((b: any) => {
            const nameEmpty =
              !b?.batchName || String(b.batchName).trim() === "";
            const hasQtyMeta =
              (b?.batchQuantity && Number(b.batchQuantity) !== 0) ||
              (b?.openingRate && Number(b.openingRate) !== 0) ||
              (b?.openingValue && Number(b.openingValue) !== 0);
            return nameEmpty && hasQtyMeta;
          });

          // Stock diff: positive = add to stock, negative = reduce stock
          const stockDiff = Number(oldQty) - Number(newQty);

          const itemId = entry.itemId;

          // If candidate batch found, enforce available qty and sync to backend
          if (itemId && candidateBatch && stockDiff !== 0) {
            const availableQty = Number(
              candidateBatch.batchQuantity ?? candidateBatch.quantity ?? 0
            );

            // If trying to reduce more than available -> cap and warn
            if (stockDiff < 0 && Math.abs(stockDiff) > availableQty) {
              Swal.fire({
                icon: "warning",
                title: "Stock Not Available",
                text: `Only ${availableQty} available in batch`,
              });

              // adjust to max available reduction
              const allowedReduction = availableQty;
              const adjustedNewQty = Number(oldQty) - allowedReduction;
              updatedEntries[index].quantity = adjustedNewQty;
              updatedEntries[index].amount = recalcAmount(
                updatedEntries[index]
              );
              setFormData((p) => ({ ...p, entries: updatedEntries }));

              // recalc stockDiff to send
              const adjustedStockDiff = oldQty - adjustedNewQty;

              fetch(
                `${import.meta.env.VITE_API_URL
                }/api/stock-items/${itemId}/batches?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
                {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    batchName: candidateBatch.batchName ?? "",
                    quantity: adjustedStockDiff,
                    mode: "add",
                  }),
                }
              )
                .then((res) => res.json())
                .then((d) => console.log("Batch qty synced (adjusted):", d))
                .catch((err) => console.error("Batch qty sync error:", err));

              return;
            }

            // Send the actual stock diff (negative for sale)
            fetch(
              `${import.meta.env.VITE_API_URL
              }/api/stock-items/${itemId}/batches?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
              {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  batchName: candidateBatch.batchName ?? "",
                  quantity: stockDiff,
                  mode: "add", // ✅ Incremental update
                }),
              }
            )
              .then((res) => res.json())
              .then((d) => console.log("Batch qty synced:", d))
              .catch((err) => console.error("Batch qty sync error:", err));
          }

          return;
        }

        const selectedBatch = entry.batches.find(
          (b) => String(b.batchName) === String(entry.batchNumber)
        );

        const availableQty = Number(
          selectedBatch?.batchQuantity ?? selectedBatch?.quantity ?? 0
        );

        // 🔴 If batch selected but NO STOCK
        if (availableQty <= 0) {
          Swal.fire({
            icon: "warning",
            title: "Stock Not Available in the Selected Batch",
          });

          updatedEntries[index].quantity = 0;
          updatedEntries[index].amount = recalcAmount(updatedEntries[index]);
          setFormData((p) => ({ ...p, entries: updatedEntries }));
          return;
        }

        let finalQty = newQty;

        // 🔴 User entered more quantity than available
        if (newQty > availableQty) {
          Swal.fire({
            icon: "warning",
            title: "Stock Not Available",
            text: `Only ${availableQty} available`,
          });
          finalQty = availableQty;
        }

        updatedEntries[index].quantity = finalQty;
        updatedEntries[index].amount = recalcAmount(updatedEntries[index]);
        setFormData((p) => ({ ...p, entries: updatedEntries }));

        return;
      }

      // 4️⃣ Rate / Discount
      if (["rate", "discount"].includes(name)) {
        // Discount: apply immediately
        if (name === "discount") {
          updatedEntries[index][name] = Number(value) || 0;
          updatedEntries[index].amount = recalcAmount(updatedEntries[index]);
          setFormData((p) => ({ ...p, entries: updatedEntries }));
          return;
        }

        // Rate: update shown value immediately, then debounce applying profit percentage
        const rawRate = Number(value) || 0;
        updatedEntries[index].rate = rawRate;
        updatedEntries[index].amount = recalcAmount(updatedEntries[index]);
        setFormData((p) => ({ ...p, entries: updatedEntries }));

        const entryId = updatedEntries[index].id || `idx-${index}`;

        // clear existing timer
        const existing = rateDebounceTimers.current[entryId];
        if (existing) clearTimeout(existing);

        // set new debounce timer (2.5s)
        rateDebounceTimers.current[entryId] = window.setTimeout(() => {
          setFormData((prev) => {
            const newEntries = prev.entries.map((e) => ({ ...e }));
            const targetIndex = newEntries.findIndex((e) => e.id === entryId);
            const target =
              (targetIndex !== -1 && newEntries[targetIndex]) ||
              newEntries[index];

            if (!target) return prev;

            const rateToUse = rawRate;

            if (
              pricingRule.method === "profit_percentage" &&
              Number(pricingRule.value) > 0
            ) {
              const adjusted = Number(
                (
                  rateToUse +
                  (rateToUse * Number(pricingRule.value)) / 100
                ).toFixed(2)
              );
              target.rate = adjusted;
            } else {
              target.rate = rateToUse;
            }

            target.amount = recalcAmount(target);

            // clear stored timer
            rateDebounceTimers.current[entryId] = null;

            return { ...prev, entries: newEntries };
          });
        }, 1000);

        return;
      }
    }

    updatedEntries[index][name] =
      type === "number" ? Number(value) || 0 : value;
    setFormData((p) => ({ ...p, entries: updatedEntries }));
  };

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
          type: formData.mode === "item-invoice" ? "debit" : "debit",
          cgstRate: 0,
          sgstRate: 0,
          igstRate: 0,
          godownId: "",
          salesLedgerId: "",
          discount: 0,
          hsnCode: "", // Add HSN code for manual editing
        },
      ],
    }));
  };

  const removeEntry = (index: number) => {
    if (formData.entries.length <= 1) return;
    const updatedEntries = [...formData.entries];
    updatedEntries.splice(index, 1);
    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
  };

  const performBarcodeLookup = async (code: string) => {
    if (!code.trim()) return;

    try {
      const url = `${import.meta.env.VITE_API_URL}/api/sales-vouchers/item-by-barcode?barcode=${code}&company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
      const res = await fetch(url);
      const json = await res.json();

      if (json.success && json.data) {
        setIsBarcodeError(false); // Reset error state on success
        const item = json.data;
        const details = getItemDetails(item.id);

        setFormData((prev) => {
          const updatedEntries = [...prev.entries];

          const extractGstPercent = (ledgerId: any) => {
            if (!ledgerId) return 0;
            const ledger = safeLedgers.find((l) => String(l.id) === String(ledgerId));
            if (!ledger?.name) return 0;
            const match = ledger.name.match(/(\d+(\.\d+)?)/);
            return match ? Number(match[1]) : 0;
          };

          const companyState = safeCompanyInfo?.state || "";
          const partyState = selectedPartyState || "";
          const statesMatch =
            Boolean(companyState &&
              partyState &&
              companyState.toLowerCase().trim() === partyState.toLowerCase().trim());

          const extractedCgst = extractGstPercent(details.cgstLedgerId);
          const extractedSgst = extractGstPercent(details.sgstLedgerId);
          const extractedIgst = extractGstPercent(details.gstLedgerId || details.igstLedgerId);

          let cgstRate = 0, sgstRate = 0, igstRate = 0;
          if (statesMatch) {
            cgstRate = extractedCgst;
            sgstRate = extractedSgst;
          } else {
            igstRate = extractedIgst;
          }

          const totalGst = statesMatch ? (extractedCgst + extractedSgst) : extractedIgst;
          const gstToMatch = Math.round(totalGst);

          // Find matching Sales Ledger with robust logic
          const salesLedgers = ledgers.filter(l => String(l.name).toLowerCase().includes("sales"));

          const matchingSalesLedger = salesLedgers.find((l) => {
            const name = String(l.name).toLowerCase();

            // Check for Inter/Intra
            if (statesMatch) {
              if (!name.includes("intra")) return false;
            } else {
              if (!name.includes("inter")) return false;
            }

            return (
              name.includes(`${gstToMatch}%`) ||
              name.includes(`${gstToMatch} %`) ||
              name.includes(`sales ${gstToMatch}`) ||
              name.includes(`@${gstToMatch}%`) ||
              name.includes(`@ ${gstToMatch}%`)
            );
          });

          // ⚠️ Warning if not found
          if (!matchingSalesLedger && gstToMatch > 0) {
            Swal.fire({
              title: "Sales Ledger Missing",
              text: `Sales ${gstToMatch}% Ledger not found. Please create it first.`,
              icon: "warning",
              confirmButtonColor: "#3085d6",
            });
          }

          const newEntry = {
            id: `e${Date.now()}`,
            itemId: String(item.id),
            hsnCode: details.hsnCode || "",
            unitId: details.unitId || "",
            unitLabel: details.unitLabel || "",
            batches: details.batches || [],
            batchNumber: "",
            quantity: 1,
            rate: details.rate || 0,
            amount: details.rate || 0,
            type: "debit",
            cgstRate: cgstRate,
            sgstRate: sgstRate,
            igstRate: igstRate,
            gstLedgerId: details.gstLedgerId || "",
            cgstLedgerId: details.cgstLedgerId || "",
            sgstLedgerId: details.sgstLedgerId || "",
            igstLedgerId: details.igstLedgerId || "",
            salesLedgerId: matchingSalesLedger ? String(matchingSalesLedger.id) : "",
            godownId: "",
            discount: 0,
          };

          const lastIndex = updatedEntries.length - 1;
          if (lastIndex >= 0 && !updatedEntries[lastIndex].itemId) {
            updatedEntries[lastIndex] = newEntry as any;
          } else {
            updatedEntries.push(newEntry as any);
          }

          return { ...prev, entries: updatedEntries };
        });

        // NOT clearing the input anymore as requested: "barcode number wahi rahe hate nii"
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
          setIsBarcodeError(true); // Set error state to true for visual feedback
        }
      }
    } catch (err) {
      console.error("Barcode Fetch Error:", err);
      setIsBarcodeError(true);
    }
  };

  // POS Barcode Scanner Logic (Global Listener)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if source is common inputs (unless it's barcode specific)
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Option: allow barcode scanning even if inside an input, 
        // but typically we let the standard field typing happen.
        // For auto POS we buffer everything.
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
        // Reset buffer if delay is too long (human typing)
        if (e.key.length === 1) {
          barcodeBuffer.current = e.key;
        } else {
          barcodeBuffer.current = "";
        }
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []); // Run once on mount

  // 🔹 AUTOMATIC BARCODE LOOKUP ON TYPING (Debounced)
  useEffect(() => {
    if (!barcodeInput || barcodeInput.length < 3) return;

    const timer = setTimeout(() => {
      performBarcodeLookup(barcodeInput);
    }, 600); // Wait for 600ms of inactivity before calling API

    return () => clearTimeout(timer);
  }, [barcodeInput]);

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    performBarcodeLookup(barcodeInput);
  };
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const messages: string[] = [];

    const pushError = (key: string, msg: string) => {
      if (!newErrors[key]) {
        newErrors[key] = msg;
        messages.push(msg);
      }
    };

    // ===== HEADER LEVEL VALIDATION =====
    if (!formData.date) pushError("date", "Voucher Date is required");
    if (!formData.number) pushError("number", "Voucher Number is required");

    // Only validate item-invoice specific fields when mode is item-invoice
    if (formData.mode === "item-invoice") {
      if (!formData.partyId) pushError("partyId", "Party is required");
    }

    // ===== ENTRY LEVEL VALIDATION =====
    if (!formData.entries.length) {
      pushError("entries", "At least one entry is required");
    }

    formData.entries.forEach((entry, index) => {
      const row = index + 1;

      if (formData.mode === "item-invoice") {
        if (!entry.itemId)
          pushError(`entry.${index}.itemId`, `Row ${row}: Item is required`);

        if (!entry.salesLedgerId)
          pushError(`entry.${index}.salesLedgerId`, `Row ${row}: Sales Ledger is required`);

        if ((entry.quantity ?? 0) <= 0)
          pushError(
            `entry.${index}.quantity`,
            `Row ${row}: Quantity must be greater than 0`
          );

        if (
          columnSettings.showBatch &&
          entry.batches?.length &&
          !entry.batchNumber
        ) {
          pushError(
            `entry.${index}.batchNumber`,
            `Row ${row}: Batch selection is required`
          );
        }

        if (
          godownEnabled === "yes" &&
          columnSettings.showGodown &&
          !entry.godownId
        )
          pushError(
            `entry.${index}.godownId`,
            `Row ${row}: Godown is required`
          );
      } else {
        if (!entry.ledgerId)
          pushError(
            `entry.${index}.ledgerId`,
            `Row ${row}: Ledger is required`
          );

        if ((entry.amount ?? 0) <= 0)
          pushError(
            `entry.${index}.amount`,
            `Row ${row}: Amount must be greater than 0`
          );
      }
    });

    setErrors(newErrors);

    return {
      isValid: messages.length === 0,
      messages,
    };
  };

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        console.log('ye hai ledger', data)
        setLedgers(data);
      } catch (error) {
        console.error("Failed to fetch ledgers:", error);
      }
    };

    fetchLedgers();
  }, [companyId, ownerType, ownerId]);

  const calculateTotals = () => {
    let subtotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let discountTotal = 0;

    formData.entries.forEach((entry) => {
      const qty = entry.quantity || 0;
      const rate = entry.rate || 0;
      const discount = entry.discount || 0;

      const baseAmount = qty * rate;
      const gstRate =
        (entry.cgstRate || 0) + (entry.sgstRate || 0) + (entry.igstRate || 0);
      const gstAmount = (baseAmount * gstRate) / 100;

      subtotal += baseAmount;
      discountTotal += discount;
      cgstTotal += (baseAmount * (entry.cgstRate || 0)) / 100;
      sgstTotal += (baseAmount * (entry.sgstRate || 0)) / 100;
      igstTotal += (baseAmount * (entry.igstRate || 0)) / 100;
    });

    const total = subtotal + cgstTotal + sgstTotal + igstTotal - discountTotal;

    return {
      subtotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      discountTotal,
      total,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReadyToSave(false); // Stop draft saving immediately when starting submission

    const { isValid, messages } = validateForm();

    if (!isValid) {
      Swal.fire({
        icon: "warning",
        title: "Please fix the following",
        html: `
        <ul style="text-align:left; margin-left:16px">
          ${messages.map((m) => `<li>• ${m}</li>`).join("")}
        </ul>
      `,
        confirmButtonText: "OK",
      });
      return;
    }

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

    // Ensure entries have CGST, SGST, IGST rates properly formatted
    const entriesWithGST = formData.entries.map((entry) => ({
      ...entry,
      // Ensure GST rates are numbers and properly set
      cgstRate: Number(entry.cgstRate || 0),
      sgstRate: Number(entry.sgstRate || 0),
      igstRate: Number(entry.igstRate || 0),
      // Ensure all numeric fields are properly formatted
      quantity: Number(entry.quantity || 0),
      rate: Number(entry.rate || 0),
      amount: Number(entry.amount || 0),
      discount: Number(entry.discount || 0),
    }));

    const payload = {
      date: formData.date,
      number: formData.number,
      referenceNo: formData.referenceNo,
      partyId: finalPartyId,
      salesLedgerId: formData.salesLedgerId,
      narration: formData.narration,
      type: isQuotation ? "quotation" : "sales",
      isQuotation: isQuotation,

      companyId,
      ownerType,
      ownerId,

      dispatchDetails: {
        docNo: formData.dispatchDetails?.docNo || "",
        through: formData.dispatchDetails?.through || "",
        destination: formData.dispatchDetails?.destination || "",
        approxDistance: formData.dispatchDetails?.approxDistance || "",
      },

      entries: entriesWithGST,

      // Sales Type and Bill No.
      sales_type_id: selectedSalesTypeId ? Number(selectedSalesTypeId) : null,
      bill_no: billNoPreview || null,

      // Ensure totals are properly formatted as numbers with 2 decimal places
      subtotal: Number(totals.subtotal.toFixed(2)),
      cgstTotal: Number(totals.cgstTotal.toFixed(2)),
      sgstTotal: Number(totals.sgstTotal.toFixed(2)),
      igstTotal: Number(totals.igstTotal.toFixed(2)),
      discountTotal: Number(totals.discountTotal.toFixed(2)),
      total: Number(grandTotal.toFixed(2)),
    };

    try {
      let voucherSaved = false;

      // ================= UPDATE MODE =================
      if (id) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales-vouchers/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        voucherSaved = data.success;
      }

      // ================= CREATE MODE =================
      if (!id) {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales-vouchers`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        const data = await res.json();
        voucherSaved = !!data.id;
      }

      // ❌ Stop if voucher not saved
      if (!voucherSaved) {
        Swal.fire("Error", "Save failed", "error");
        return;
      }

      // ================= STOCK DEDUCTION (FINAL & IMPORTANT) =================
      await Promise.all(
        formData.entries.map((entry) => {
          if (!entry.itemId || !entry.batchNumber) return;

          return fetch(
            `${import.meta.env.VITE_API_URL}/api/stock-items/${entry.itemId
            }/batches?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
            {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                batchName: entry.batchNumber,
                quantity: -Number(entry.quantity || 0), // 🔴 subtract stock
                mode: "add", // ✅ Incremental update
              }),
            }
          );
        })
      );

      // ================= SALE HISTORY SAVE =================
      const historyPayload = formData.entries.map((entry) => {
        const item = getItemDetails(entry.itemId || "");

        return {
          itemName: item.name,
          hsnCode: entry.hsnCode || item.hsnCode || "",
          batchNumber: entry.batchNumber || null,

          qtyChange: -Number(entry.quantity || 0),
          rate: Number(entry.rate || 0),

          movementDate: formData.date,
          voucherNumber: formData.number,
          godownId: entry.godownId ? Number(entry.godownId) : null,
          companyId,
          ownerType,
          ownerId,
        };
      });

      await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales-vouchers/sale-history`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(historyPayload),
        }
      );

      if (!isEditMode) {
        localStorage.removeItem(DRAFT_KEY);
      }
      Swal.fire("Success", "Voucher saved successfully!", "success");
      navigate("/app/vouchers");
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire("Error", "Server or network error", "error");
    }
  };

  // Print Options Handlers
  const handlePrintClick = () => {
    const selectedItems = formData.entries.filter(
      (entry) =>
        entry.itemId && entry.itemId !== "" && entry.itemId !== "select"
    );

    if (selectedItems.length === 0) {
      alert("Please select at least one item before printing the invoice.");
      return;
    }
    if (!formData.partyId) {
      alert("Please select a party before printing the invoice.");
      return;
    }

    // Show print options popup instead of direct print
    setShowPrintOptions(true);
  };

  const handleGenerateInvoice = () => {
    console.log("Generating Invoice...");
    setShowPrintOptions(false);
    setShowInvoicePrint(true); // Show separate invoice print modal
  };

  const handleGenerateEWayBill = () => {
    console.log("Generating E-way Bill...");
    setShowPrintOptions(false);
    setShowEWayBill(true); // Show E-way Bill generation modal
  };

  const handleGenerateEInvoice = () => {
    console.log("Generating E-Invoice...");
    // TODO: Implement E-Invoice generation using existing format
    alert("E-Invoice generation feature will be implemented soon!");
    setShowPrintOptions(false);
  };

  const handleSendToEmail = () => {
    console.log("Sending to Email...");
    // TODO: Implement email functionality
    alert("Email sending feature will be implemented soon!");
    setShowPrintOptions(false);
  };

  const handleSendToWhatsApp = () => {
    console.log("Sending to WhatsApp...");
    // TODO: Implement WhatsApp sharing
    alert("WhatsApp sharing feature will be implemented soon!");
    setShowPrintOptions(false);
  };

  const {
    subtotal = 0,
    cgstTotal = 0,
    sgstTotal = 0,
    igstTotal = 0,
    discountTotal = 0,
    total: grandTotal = 0,
  } = calculateTotals();


  // 🔥 Find Sales Ledger by GST % and Inter/Intra
  const getSalesLedgerByGst = (gstPercent: any, isIntra: boolean = false) => {
    if (!gstPercent || gstPercent <= 0) return null;

    const gstStr = String(Math.round(gstPercent));

    return safeLedgers.find((l) => {
      const name = (l.name || "").toLowerCase();
      if (!name.includes("sales")) return false;

      // Check for Inter/Intra
      if (isIntra) {
        if (!name.includes("intra")) return false;
      } else {
        if (!name.includes("inter")) return false;
      }

      // Check for rate (e.g. "18%", "18 %", "@18%")
      return (
        name.includes(`${gstStr}%`) ||
        name.includes(`${gstStr} %`) ||
        name.includes(`sales ${gstStr}`) ||
        name.includes(`@${gstStr}%`) ||
        name.match(new RegExp(`\\b${gstStr}\\b`))
      );
    });
  };


  // ✅ Get Ledger Name by ID and extract GST %
  const getLedgerNameById = (ledgerId: any) => {
    if (!ledgerId) return "-";
    const ledger = safeLedgers.find((l) => String(l.id) === String(ledgerId));
    if (!ledger?.name) return "-";

    // Extract number from ledger name (e.g., "IGST@12%" → "12")
    const match = ledger.name.match(/(\d+(\.\d+)?)/);
    return match ? `${Math.round(Number(match[1]))}%` : ledger.name;
  };

  const getPartyName = (partyId: string) => {
    if (!safeLedgers || safeLedgers.length === 0) return "Unknown Party";

    const party = safeLedgers.find((ledger) => ledger.id === partyId);

    return party ? party.name : "Unknown Party";
  };
  const getLedgerName = (ledgerId: string) => {
    if (!ledgerId) return "-";

    const ledger = safeLedgers.find((l) => String(l.id) === String(ledgerId));
    return ledger ? ledger.name : "-";
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

  const hasAnyBatch = formData.entries?.some((entry) =>
    entry?.batches?.some((b) => b?.batchName)
  );


  // 🔹 Resolve Party & Sales Ledger for Invoice Print
  const partyLedger = safeLedgers.find(
    (l) => String(l.id) === String(formData.partyId)
  );

  const salesLedger = safeLedgers.find(
    (l) => String(l.id) === String(formData.salesLedgerId)
  );

  return (
    <React.Fragment>
      <div className="pt-[56px] px-4">
        <div className="flex items-center mb-6 justify-between">
          {/* LEFT SIDE - Back Button + Page Title */}
          <div className="flex items-center">
            <button
              onClick={() => navigate("/app/vouchers")}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeft size={20} />
            </button>

            <h1 className="text-2xl font-bold">
              {isQuotation ? "📋 Sales Quotation" : "📝 Sales Voucher"}
            </h1>
          </div>

          {/* RIGHT SIDE - Sales Type + ⚙ SETTINGS ICON */}
          <div className="flex items-center gap-3">
            <select
              name="salesType"
              value={selectedSalesTypeId}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "add-new") {
                  navigate("/app/masters/sales-types");
                  return;
                }
                setSelectedSalesTypeId(v);
              }}
              className={`${FORM_STYLES.select(theme)} min-w-[120px] text-sm`}
              title="Sales Voucher Type"
            >
              <option value="">Select Sales Type</option>
              {salesTypes.map((s) => (
                <option key={String(s.id)} value={String(s.id)}>
                  {s.sales_type}
                </option>
              ))}
              <option value="add-new">+ Add Sales Voucher Type</option>
            </select>

            <button
              onClick={() => setShowConfig(true)}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
              title="Voucher Display Settings"
            >
              <Settings size={22} />
            </button>
          </div>
        </div>

        <div
          className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
        >
          <form onSubmit={handleSubmit}>
            {/* Header Form Fields - Properly Organized in 4-Column Grid */}
            <div className={`p-5 mb-8 rounded-xl border ${theme === "dark" ? "bg-gray-800/50 border-gray-700" : "bg-gray-50/50 border-gray-200"} space-y-6 shadow-sm`}>
              {/* Row 1: Primary Details */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 opacity-80" htmlFor="date">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className={FORM_STYLES.input(theme, !!errors.date)}
                  />
                  {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5 opacity-80" htmlFor="number">
                    Voucher No.
                  </label>
                  <input
                    type="text"
                    id="number"
                    name="number"
                    value={formData.number}
                    readOnly
                    className={`${FORM_STYLES.input(theme, !!errors.number)} ${theme === "dark" ? "bg-gray-700/50" : "bg-gray-100"}`}
                  />
                  {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-semibold mb-1.5 opacity-80" htmlFor="partyId">
                    Party Name
                  </label>
                  <select
                    name="partyId"
                    value={formData.partyId}
                    onChange={handleChange}
                    required
                    className={`${FORM_STYLES.select(theme, !!errors.partyId)} font-medium`}
                  >
                    <option value="" disabled>-- Select Party --</option>
                    {partyLedgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>{ledger.name}</option>
                    ))}
                    <option value="add-new" className="text-blue-600 font-bold">+ Add New Ledger</option>
                  </select>
                  {selectedPartyState && (
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-blue-600 font-bold flex items-center gap-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      State: {selectedPartyState}  | Gst: {selectedPartyGst || "N/A"}
                    </p>
                  )}
                  {errors.partyId && <p className="text-red-500 text-xs mt-1">{errors.partyId}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-1.5 opacity-80" htmlFor="referenceNo">
                    Reference No.
                  </label>
                  <input
                    type="text"
                    id="referenceNo"
                    name="referenceNo"
                    value={formData.referenceNo}
                    onChange={handleChange}
                    placeholder="Enter ref #"
                    className={FORM_STYLES.input(theme)}
                  />
                </div>
              </div>

              {/* Row 2: Dispatch Details */}
              {columnSettings.showDispatchDetails && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">
                      Dispatch Doc No.
                    </label>
                    <input
                      type="text"
                      name="dispatchDetails.docNo"
                      value={formData.dispatchDetails?.docNo ?? ""}
                      onChange={handleChange}
                      placeholder="Doc Number"
                      className={FORM_STYLES.input(theme)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">
                      Dispatch Through
                    </label>
                    <input
                      type="text"
                      name="dispatchDetails.through"
                      value={formData.dispatchDetails?.through ?? ""}
                      onChange={handleChange}
                      placeholder="Carrier Name"
                      className={FORM_STYLES.input(theme)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">
                      Destination
                    </label>
                    <input
                      type="text"
                      name="dispatchDetails.destination"
                      value={formData.dispatchDetails?.destination ?? ""}
                      onChange={handleChange}
                      placeholder="Delivery Place"
                      className={FORM_STYLES.input(theme)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-1.5 opacity-80">
                      Distance (KM)
                    </label>
                    <input
                      type="text"
                      name="dispatchDetails.approxDistance"
                      value={formData.dispatchDetails?.approxDistance ?? ""}
                      onChange={handleChange}
                      placeholder="e.g. 120"
                      className={FORM_STYLES.input(theme)}
                    />
                  </div>
                </div>
              )}

              {/* Row 3: Configuration & Mode */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                <div>
                  <label className="block text-sm font-semibold mb-1.5 opacity-80" htmlFor="mode">
                    Voucher Mode
                  </label>
                  <select
                    id="mode"
                    name="mode"
                    value={formData.mode}
                    onChange={handleChange}
                    className={FORM_STYLES.select(theme)}
                  >
                    <option value="item-invoice">Item Invoice</option>
                    <option value="accounting-invoice">Accounting Invoice</option>
                    <option value="as-voucher">As Voucher</option>
                  </select>
                </div>



                {(formData.mode !== "accounting-invoice" && formData.mode !== "as-voucher") && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold mb-2 opacity-80">Pricing Rule / Customer Type</label>
                    <div className="flex items-center gap-6 p-2 rounded-lg border border-dashed border-gray-400/50">
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="customerType"
                            value="wholesale"
                            checked={profitConfig.customerType === "wholesale"}
                            onChange={(e) => setProfitConfig({ customerType: e.target.value, method: "", value: "" })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium group-hover:text-blue-500 transition-colors">Wholesale</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="radio"
                            name="customerType"
                            value="retailer"
                            checked={profitConfig.customerType === "retailer"}
                            onChange={(e) => setProfitConfig({ customerType: e.target.value, method: "", value: "" })}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium group-hover:text-blue-500 transition-colors">Retailer</span>
                        </label>
                      </div>

                      {/* Pricing Strategy Selector */}
                      {(profitConfig.customerType === "wholesale" || profitConfig.customerType === "retailer") && (
                        <div className="flex items-center gap-3 pl-4 border-l border-gray-300 dark:border-gray-600">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="pricingMethod"
                              value="profit_percentage"
                              checked={profitConfig.method === "profit_percentage"}
                              onChange={(e) => setProfitConfig({ ...profitConfig, method: e.target.value })}
                              className="h-3 w-3"
                            />
                            <span className="text-xs">Profit %</span>
                          </label>

                          {profitConfig.customerType === "retailer" && (
                            <label className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name="pricingMethod"
                                value="on_mrp"
                                checked={profitConfig.method === "on_mrp"}
                                onChange={(e) => setProfitConfig({ ...profitConfig, method: e.target.value, value: "0" })}
                                className="h-3 w-3"
                              />
                              <span className="text-xs">On MRP</span>
                            </label>
                          )}
                        </div>
                      )}

                      {/* Status Msg */}
                      {statusMsg && (
                        <div className={`text-[10px] px-2 py-0.5 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-white"} shadow-sm ml-auto animate-pulse`}>
                          <span className={statusColor}>{statusMsg}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>


            <div
              className={`p-4 mb-6 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}
            >
              <div className="flex flex-col md:flex-row gap-4 items-center mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-600 rounded-full"></span>
                  {formData.mode === "item-invoice"
                    ? "Items & Particulars"
                    : "Ledger Entries"}
                </h3>

                {formData.mode === "item-invoice" && (
                  <div className="flex-1 max-w-md w-full ml-auto">
                    <form onSubmit={handleBarcodeSubmit} className="relative group">
                      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2z"></path><path d="M7 7h1v10H7z"></path><path d="M10 7h2v10h-2z"></path><path d="M15 7h1v10h-1z"></path><path d="M18 7h1v10h-1z"></path></svg>
                      </div>
                      <input
                        type="text"
                        placeholder="Scan Barcode or Type & Press Enter..."
                        value={barcodeInput}
                        onChange={(e) => {
                          setBarcodeInput(e.target.value);
                          setIsBarcodeError(false); // Reset error when typing
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

                <button
                  title="Add Entry"
                  type="button"
                  onClick={addEntry}
                  className={`flex items-center text-sm font-medium px-4 py-2 rounded-lg transition-all shadow-sm ${theme === "dark"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  <Plus size={18} className="mr-2" />
                  Add {formData.mode === "item-invoice" ? "Item Row" : "Ledger Row"}
                </button>
              </div>
              <div className="overflow-x-auto">
                {formData.mode === "item-invoice" ? (
                  <table className="w-full mb-4">
                    <thead>
                      <tr
                        className={`${theme === "dark"
                          ? "border-b border-gray-600"
                          : "border-b border-gray-300"
                          }`}
                      >
                        <th className="px-4 py-2 text-left">S.No</th>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-left">HSN/SAC</th>
                        {columnSettings.showBatch && hasAnyBatch && (
                          <th>Batch</th>
                        )}

                        <th className="px-4 py-2 text-right">Quantity</th>
                        <th className="px-4 py-2 text-left">Unit</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                        {columnSettings.showGST &&
                          (() => {
                            const hasParty = !!formData.partyId;
                            const companyState = safeCompanyInfo?.state || "";
                            const partyState = selectedPartyState || "";

                            const statesMatch =
                              hasParty &&
                              companyState &&
                              partyState &&
                              companyState.toLowerCase().trim() ===
                              partyState.toLowerCase().trim();

                            // ❌ No party selected → show nothing
                            if (!hasParty) {
                              return <th className="px-4 py-2 text-center">IGST%</th>;
                            }

                            // ✅ Same state → CGST + SGST
                            if (statesMatch) {
                              return (
                                <>
                                  <th className="px-4 py-2 text-center">CGST%</th>
                                  <th className="px-4 py-2 text-center">SGST%</th>
                                </>
                              );
                            }

                            // ✅ Different state → IGST
                            return <th className="px-4 py-2 text-center">IGST%</th>;
                          })()}


                        {columnSettings.showDiscount && <th>Discount</th>}

                        <th className="px-4 py-2 text-right">Amount</th>
                        {godownEnabled === "yes" && (
                          <th className="px-4 py-2 text-left">Godown</th>
                        )}
                        <th className="px-4 py-2 text-left">Sales Ledger</th>
                        <th className="px-4 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.entries.map((entry, index) => {
                        const itemDetails = getItemDetails(entry.itemId || "");

                        // ✅ SELECTED BATCH
                        const selectedBatch = entry.batches?.find(
                          (b) => b.batchName === entry.batchNumber
                        );

                        // Check if party is selected and states match for dynamic column display
                        const hasParty = !!formData.partyId;
                        const companyState = safeCompanyInfo?.state || "";
                        const partyState = selectedPartyState || "";
                        const statesMatch =
                          hasParty &&
                          companyState &&
                          partyState &&
                          companyState.toLowerCase().trim() ===
                          partyState.toLowerCase().trim();

                        return (
                          <tr
                            key={entry.id}
                            className={`${theme === "dark"
                              ? "border-b border-gray-600"
                              : "border-b border-gray-300"
                              }`}
                          >
                            {/* SR */}
                            <td className="px-1 py-2 text-center min-w-[28px] text-xs">
                              {index + 1}
                            </td>

                            {/* ITEM */}
                            <td className="px-1 py-2 min-w-[110px]">
                              <select
                                name="itemId"
                                value={entry.itemId}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${FORM_STYLES.tableSelect(
                                  theme
                                )} text-xs min-w-[110px]`}
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
                            <td className="px-1 py-2 text-center min-w-[55px] text-xs">
                              <input
                                type="text"
                                name="hsnCode"
                                value={entry.hsnCode || ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${FORM_STYLES.tableInput(
                                  theme
                                )} text-center text-xs`}
                                placeholder="HSN"
                              />
                            </td>

                            {/* BATCH */}
                            {columnSettings.showBatch &&
                              entry.batches?.some((b) => b.batchName) && (
                                <td className="px-1 py-2 min-w-[180px]">
                                  <select
                                    name="batchNumber"
                                    value={entry.batchNumber || ""}
                                    onChange={(e) =>
                                      handleEntryChange(index, e)
                                    }
                                    className={`${FORM_STYLES.tableSelect(
                                      theme
                                    )} 
          min-w-[180px] text-xs font-mono`}
                                  >
                                    <option value="">Batch</option>

                                    {entry.batches
                                      .filter((b) => b.batchName)
                                      .map((b, i) => {
                                        const qty = Number(
                                          b.batchQuantity ?? b.quantity ?? 0
                                        );

                                        // left-right spacing (safe way)
                                        const name = String(b.batchName).padEnd(
                                          12,
                                          " "
                                        );

                                        return (
                                          <option key={i} value={b.batchName}>
                                            {`${name} — Qty: ${qty}`}
                                          </option>
                                        );
                                      })}
                                  </select>
                                </td>
                              )}

                            {/* ✅ QTY (BATCH WISE) */}
                            <td className="px-1 py-2 min-w-[55px]">
                              <input
                                type="number"
                                name="quantity"
                                value={entry.quantity ?? ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${FORM_STYLES.tableInput(
                                  theme
                                )} text-right text-xs`}
                                min={0}
                              />
                            </td>

                            {/* UNIT */}
                            <td className="px-1 py-2 min-w-[45px] text-center text-xs">
                              {itemDetails.unit || getUnitName(entry.unitId)}
                            </td>

                            {/* RATE */}
                            <td className="px-1 py-2 min-w-[70px]">
                              <input
                                type="number"
                                name="rate"
                                value={entry.rate ?? ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${FORM_STYLES.tableInput(
                                  theme
                                )} text-right text-xs`}
                              />
                            </td>

                            {/* GST */}
                            {columnSettings.showGST &&
                              (() => {
                                if (!hasParty) {
                                  return (
                                    <td className="px-1 py-2 text-center min-w-[50px] text-xs">
                                      {getLedgerNameById(entry.gstLedgerId)}
                                    </td>
                                  );
                                } else if (statesMatch) {
                                  return (
                                    <>
                                      <td className="px-1 py-2 text-center min-w-[50px] text-xs">
                                        {getLedgerNameById(entry.cgstLedgerId)}
                                      </td>
                                      <td className="px-1 py-2 text-center min-w-[50px] text-xs">
                                        {getLedgerNameById(entry.sgstLedgerId)}
                                      </td>
                                    </>
                                  );
                                } else {
                                  return (
                                    <td className="px-1 py-2 text-center min-w-[50px] text-xs">
                                      {getLedgerNameById(entry.igstLedgerId)}
                                    </td>
                                  );
                                }
                              })()}


                            {/* DISCOUNT */}
                            <td className="px-1 py-2 min-w-[70px]">
                              <input
                                type="number"
                                name="discount"
                                value={entry.discount ?? ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${FORM_STYLES.tableInput(
                                  theme
                                )} text-right text-xs`}
                              />
                            </td>

                            {/* AMOUNT */}
                            <td className="px-1 py-2 text-right min-w-[75px] font-medium text-xs">
                              {Number(entry.amount ?? 0).toLocaleString()}
                            </td>

                            {/* GODOWN */}
                            {godownEnabled === "yes" && (
                              <td className="px-1 py-2 min-w-[95px]">
                                <select
                                  name="godownId"
                                  value={entry.godownId}
                                  onChange={(e) => handleEntryChange(index, e)}
                                  className={`${FORM_STYLES.tableSelect(
                                    theme
                                  )} min-w-[95px] text-xs`}
                                >
                                  <option value="">Select Godown</option>
                                  {godownList.map((g) => (
                                    <option key={g.id} value={g.id}>
                                      {g.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                            )}

                            {/* SALES LEDGER */}
                            <td className="px-1 py-2 min-w-[120px]">
                              <select
                                name="salesLedgerId"
                                value={entry.salesLedgerId || ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${FORM_STYLES.tableSelect(theme)} min-w-[120px] text-xs ${errors[`entry.${index}.salesLedgerId`] ? "border-red-500" : ""}`}
                              >
                                <option value="">Select Ledger</option>
                                {ledgers
                                  .filter((l) => l.name.toLowerCase().includes("sales"))
                                  .map((ledger) => (
                                    <option key={ledger.id} value={ledger.id}>
                                      {ledger.name}
                                    </option>
                                  ))}
                              </select>
                              {errors[`entry.${index}.salesLedgerId`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`entry.${index}.salesLedgerId`]}
                                </p>
                              )}
                            </td>

                            {/* DELETE */}
                            <td className="px-1 py-2 text-center min-w-[40px]">
                              <button
                                onClick={() => removeEntry(index)}
                                disabled={formData.entries.length <= 1}
                                className={`p-1 rounded ${formData.entries.length <= 1
                                  ? "opacity-50 cursor-not-allowed"
                                  : theme === "dark"
                                    ? "hover:bg-gray-600"
                                    : "hover:bg-gray-200"
                                  }`}
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      {(() => {
                        // Check if party is selected and states match for dynamic column calculation
                        const hasParty = !!formData.partyId;
                        const companyState = safeCompanyInfo?.state || "";
                        const partyState = selectedPartyState || "";
                        const statesMatch =
                          hasParty &&
                          companyState &&
                          partyState &&
                          companyState.toLowerCase().trim() ===
                          partyState.toLowerCase().trim();

                        // Calculate total columns dynamically
                        let totalCols = 7; // S.No, Item, HSN, Quantity, Unit, Rate, Amount
                        if (columnSettings.showBatch && hasAnyBatch)
                          totalCols += 1; // Batch
                        if (columnSettings.showGST) {
                          if (!hasParty) {
                            // No party: Only GST% column
                            totalCols += 1;
                          } else if (statesMatch) {
                            // States match: CGST%, SGST% (2 columns)
                            totalCols += 2;
                          } else {
                            // States don't match: IGST% (1 column)
                            totalCols += 1;
                          }
                        }
                        if (columnSettings.showDiscount) totalCols += 1; // Discount
                        if (godownEnabled === "yes") totalCols += 1; // Godown
                        totalCols += 1; // Sales Ledger
                        // Action column is separate, so colspan = totalCols - 1 (excluding Action)
                        const colspan = totalCols - 1;
                        return (
                          <>
                            {/* SUBTOTAL */}
                            <tr
                              className={`font-semibold ${theme === "dark"
                                ? "border-t border-gray-600"
                                : "border-t border-gray-300"
                                }`}
                            >
                              <td
                                className="px-4 py-2 text-left"
                                colSpan={colspan}
                              >
                                Subtotal:
                              </td>
                              <td className="px-4 py-2 text-right">
                                ₹{subtotal.toLocaleString()}
                              </td>
                            </tr>

                            {/* CGST TOTAL - Only show when party selected and states match */}
                            {columnSettings.showGST &&
                              hasParty &&
                              statesMatch &&
                              cgstTotal > 0 && (
                                <tr
                                  className={`font-semibold ${theme === "dark"
                                    ? "border-t border-gray-600"
                                    : "border-t border-gray-300"
                                    }`}
                                >
                                  <td
                                    className="px-4 py-2 text-left"
                                    colSpan={colspan}
                                  >
                                    CGST Total:
                                  </td>
                                  <td className="px-4 py-2 text-right text-blue-600 font-bold">
                                    ₹{cgstTotal.toFixed(2)}
                                  </td>
                                </tr>
                              )}

                            {/* SGST TOTAL - Only show when party selected and states match */}
                            {columnSettings.showGST &&
                              hasParty &&
                              statesMatch &&
                              sgstTotal > 0 && (
                                <tr
                                  className={`font-semibold ${theme === "dark"
                                    ? "border-t border-gray-600"
                                    : "border-t border-gray-300"
                                    }`}
                                >
                                  <td
                                    className="px-4 py-2 text-left"
                                    colSpan={colspan}
                                  >
                                    SGST Total:
                                  </td>
                                  <td className="px-4 py-2 text-right text-blue-600 font-bold">
                                    ₹{sgstTotal.toFixed(2)}
                                  </td>
                                </tr>
                              )}

                            {/* IGST TOTAL - Only show when party selected and states don't match */}
                            {columnSettings.showGST &&
                              hasParty &&
                              !statesMatch &&
                              igstTotal > 0 && (
                                <tr
                                  className={`font-semibold ${theme === "dark"
                                    ? "border-t border-gray-600"
                                    : "border-t border-gray-300"
                                    }`}
                                >
                                  <td
                                    className="px-4 py-2 text-left"
                                    colSpan={colspan}
                                  >
                                    IGST Total:
                                  </td>
                                  <td className="px-4 py-2 text-right text-blue-600 font-bold">
                                    ₹{igstTotal.toFixed(2)}
                                  </td>
                                </tr>
                              )}

                            {/* GST TOTAL - Always show when GST is enabled */}
                            {columnSettings.showGST && (
                              <tr
                                className={`font-semibold ${theme === "dark"
                                  ? "border-t border-gray-600"
                                  : "border-t border-gray-300"
                                  }`}
                              >
                                <td
                                  className="px-4 py-2 text-left"
                                  colSpan={colspan}
                                >
                                  GST Total:
                                </td>
                                <td className="px-4 py-2 text-right text-blue-600 font-bold">
                                  ₹
                                  {(cgstTotal + sgstTotal + igstTotal).toFixed(
                                    2
                                  )}
                                </td>
                              </tr>
                            )}

                            {/* DISCOUNT */}
                            {columnSettings.showDiscount && (
                              <tr
                                className={`font-semibold ${theme === "dark"
                                  ? "border-t border-gray-600"
                                  : "border-t border-gray-300"
                                  }`}
                              >
                                <td
                                  className="px-4 py-2 text-left"
                                  colSpan={colspan}
                                >
                                  Discount:
                                </td>
                                <td className="px-4 py-2 text-right text-red-600 font-bold">
                                  ₹{discountTotal}
                                </td>
                              </tr>
                            )}

                            {/* GRAND TOTAL */}
                            <tr
                              className={`font-bold ${theme === "dark"
                                ? "border-t-2 border-gray-500"
                                : "border-t-2 border-black"
                                }`}
                            >
                              <td
                                className="px-4 py-2 text-left text-lg"
                                colSpan={colspan}
                              >
                                Grand Total:
                              </td>
                              <td className="px-4 py-2 text-right text-lg text-green-600 font-bold">
                                ₹{grandTotal.toFixed(2)}
                              </td>
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
                        <th className="px-4 py-2 text-left">S.No</th>
                        <th className="px-4 py-2 text-left">Ledger</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.entries.map((entry, index) => (
                        <tr
                          key={entry.id}
                          className={`${theme === "dark"
                            ? "border-b border-gray-600"
                            : "border-b border-gray-300"
                            }`}
                        >
                          <td className="px-4 py-2">{index + 1}</td>
                          <td className="px-4 py-2">
                            <select
                              title="Select Ledger"
                              name="ledgerId"
                              value={entry.ledgerId ?? ""}
                              onChange={(e) => handleEntryChange(index, e)}
                              required
                              className={`${FORM_STYLES.tableSelect(theme)} ${errors[`entry${index}.ledgerId`]
                                ? "border-red-500"
                                : ""
                                }`}
                            >
                              <option value="">Select Ledger</option>
                              {safeLedgers.map((ledger: Ledger) => (
                                <option key={ledger.id} value={ledger.id}>
                                  {ledger.name}
                                </option>
                              ))}
                              <option
                                value="add-new"
                                className={`flex items-center px-4 py-2 rounded ${theme === "dark"
                                  ? "bg-blue-600 hover:bg-green-700"
                                  : "bg-green-600 hover:bg-green-700 text-white"
                                  }`}
                              >
                                + Add New Ledger
                              </option>
                            </select>
                            {errors[`entry${index}.ledgerId`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`entry${index}.ledgerId`]}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <input
                              title="Enter Amount"
                              type="number"
                              name="amount"
                              value={entry.amount ?? ""}
                              onChange={(e) => handleEntryChange(index, e)}
                              required
                              min="0"
                              step="0.01"
                              className={`${FORM_STYLES.tableInput(
                                theme
                              )} text-right ${errors[`entry${index}.amount`]
                                ? "border-red-500"
                                : ""
                                }`}
                            />
                            {errors[`entry${index}.amount`] && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors[`entry${index}.amount`]}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <select
                              title="Select Type"
                              name="type"
                              value={entry.type}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={FORM_STYLES.tableInput(theme)}
                            >
                              <option value="debit">Debit</option>
                              <option value="credit">Credit</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              title="Remove Ledger"
                              type="button"
                              onClick={() => removeEntry(index)}
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
                      {/* SUBTOTAL */}
                      <tr
                        className={`${theme === "dark"
                          ? "border-t border-gray-600"
                          : "border-t border-gray-300"
                          } font-semibold`}
                      >
                        <td colSpan={7}></td>
                        <td className="text-right py-2">Subtotal:</td>
                        <td className="text-right py-2 font-bold">
                          {subtotal.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>

                      {/* GST TOTAL */}
                      <tr
                        className={`${theme === "dark"
                          ? "border-t border-gray-600"
                          : "border-t border-gray-300"
                          } font-semibold`}
                      >
                        <td colSpan={7}></td>
                        <td className="text-right py-2">GST Total:</td>
                        <td className="text-right py-2 text-blue-600 font-bold">
                          {(cgstTotal + sgstTotal + igstTotal).toLocaleString()}
                        </td>
                        <td></td>
                      </tr>

                      {/* DISCOUNT */}
                      <tr
                        className={`${theme === "dark"
                          ? "border-t border-gray-600"
                          : "border-t border-gray-300"
                          } font-semibold`}
                      >
                        <td colSpan={7}></td>
                        <td className="text-right py-2">Discount:</td>
                        <td className="text-right py-2 text-red-600 font-bold">
                          {discountTotal.toLocaleString()}
                        </td>
                        <td></td>
                      </tr>

                      {/* GRAND TOTAL */}
                      <tr
                        className={`${theme === "dark"
                          ? "border-t-2 border-gray-500"
                          : "border-t-2 border-black"
                          } font-bold`}
                      >
                        <td colSpan={7}></td>
                        <td className="text-right py-3 text-lg">
                          Grand Total:
                        </td>

                        <td></td>
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
              </label>
              <textarea
                id="narration"
                name="narration"
                value={formData.narration}
                onChange={handleChange}
                rows={3}
                title="Voucher Narration"
                placeholder="Enter narration for this sales voucher"
                className={FORM_STYLES.input(theme)}
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
                onClick={handlePrintClick}
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
        </div>

        {/* Configuration Modal (F12) */}
        {showConfig && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white  p-6 rounded-lg w-96 shadow-xl">
              <h2 className="text-xl font-bold mb-4">
                Voucher Display Settings
              </h2>

              <div className="space-y-4">
                <label className="flex justify-between items-center">
                  <span>Enable Batch Column</span>
                  <input
                    type="checkbox"
                    checked={columnSettings.showBatch}
                    onChange={(e) =>
                      setColumnSettings((prev) => ({
                        ...prev,
                        showBatch: e.target.checked,
                      }))
                    }
                  />
                </label>

                <label className="flex justify-between items-center">
                  <span>Enable Discount Column</span>
                  <input
                    type="checkbox"
                    checked={columnSettings.showDiscount}
                    onChange={(e) =>
                      setColumnSettings((prev) => ({
                        ...prev,
                        showDiscount: e.target.checked,
                      }))
                    }
                  />
                </label>

                <label className="flex justify-between items-center">
                  <span>Enable GST Column</span>
                  <input
                    type="checkbox"
                    checked={columnSettings.showGST}
                    onChange={(e) =>
                      setColumnSettings((prev) => ({
                        ...prev,
                        showGST: e.target.checked,
                      }))
                    }
                  />
                </label>

                <label className="flex justify-between items-center p-2 rounded hover:bg-gray-100 transition-colors cursor-pointer">
                  <span className="font-medium">Enable Dispatch & Shipping Details</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={columnSettings.showDispatchDetails}
                    onChange={(e) =>
                      setColumnSettings((prev) => ({
                        ...prev,
                        showDispatchDetails: e.target.checked,
                        showDispatchDocNo: e.target.checked,
                        showDispatchThrough: e.target.checked,
                        showDestination: e.target.checked,
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
                      <span className="font-semibold text-sm">Clear Saved Draft</span>
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-3 mt-6">
                <button
                  className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold transition-all"
                  onClick={() => setShowConfig(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Print Options Component */}
        <PrintOptions
          theme={theme}
          showPrintOptions={showPrintOptions}
          onClose={() => setShowPrintOptions(false)}
          onGenerateInvoice={handleGenerateInvoice}
          onGenerateEWayBill={handleGenerateEWayBill}
          onGenerateEInvoice={handleGenerateEInvoice}
          onSendToEmail={handleSendToEmail}
          onSendToWhatsApp={handleSendToWhatsApp}
        />

        {/* E-way Bill Generation Modal */}
        {showEWayBill && (
          <EWayBillGeneration
            theme={theme}
            voucherData={formData}
            onClose={() => setShowEWayBill(false)}
            getPartyName={getPartyName}
            getItemDetails={getItemDetails}
            calculateTotals={calculateTotals}
          />
        )}

        {/* Invoice Print Modal */}
        {showInvoicePrint && (
          <InvoicePrint
            theme={theme}
            voucherData={formData}
            isQuotation={isQuotation}
            onClose={() => setShowInvoicePrint(false)}
            // 🔥 DIRECT DATA (IMPORTANT)
            partyLedger={partyLedger}
            salesLedger={salesLedger}
            getItemDetails={getItemDetails}
            calculateTotals={calculateTotals}
            getGstRateInfo={getGstRateInfo}
            companyInfo={safeCompanyInfo}
            ledgers={safeLedgers}
          />
        )}

        <div
          className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
            }`}
        >
          <p className="text-sm">
            <span className="font-semibold">Note:</span> Use Sales Voucher for
            recording sales. Press F8 to create, F9 to save, F12 to configure,
            Esc to cancel.
          </p>
        </div>
      </div>
    </React.Fragment>
  );
};

export default SalesVoucher;
