import React, { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import type {
  VoucherEntry,
  Ledger,
  Godown,
  LedgerWithGroup,
} from "../../../types";
import { Save, Plus, Trash2, ArrowLeft, Printer } from "lucide-react";
import Swal from "sweetalert2";
import EWayBillGeneration from "./EWayBillGeneration";
import InvoicePrint from "./InvoicePrint";
import PrintOptions from "./PrintOptions";
import type { StockItem } from "../../../types";

// DRY Constants for Tailwind Classes
const FORM_STYLES = {
  input: (theme: string, hasError?: boolean) =>
    `w-full p-2 rounded border ${
      theme === "dark"
        ? "bg-gray-700 border-gray-600 focus:border-blue-500"
        : "bg-white border-gray-300 focus:border-blue-500"
    } outline-none transition-colors ${hasError ? "border-red-500" : ""}`,
  select: (theme: string, hasError?: boolean) =>
    `w-full p-2 rounded border cursor-pointer ${
      theme === "dark"
        ? "bg-gray-700 border-gray-600 focus:border-blue-500"
        : "bg-white border-gray-300 focus:border-blue-500"
    } outline-none transition-colors ${hasError ? "border-red-500" : ""}`,
  tableInput: (theme: string) =>
    `w-full p-1 rounded border ${
      theme === "dark"
        ? "bg-gray-700 border-gray-600 focus:border-blue-500"
        : "bg-white border-gray-300 focus:border-blue-500"
    } outline-none transition-colors`,
  tableSelect: (theme: string) =>
    `w-full p-1 rounded border cursor-pointer ${
      theme === "dark"
        ? "bg-gray-700 border-gray-600 focus:border-blue-500"
        : "bg-white border-gray-300 focus:border-blue-500"
    } outline-none transition-colors`,
};

const SalesVoucher: React.FC = () => {
  const {
    theme,
    godowns = [],
    vouchers = [],
    companyInfo,
    addVoucher,
    updateVoucher,
  } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  console.log('this is id', id)
  const [searchParams] = useSearchParams();
  const isEditMode = !!id;
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("userType");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );
  const [ledgers, setLedgers] = useState<LedgerWithGroup[]>([]);
  const partyLedgers = ledgers.filter(
    (l) => l.groupName === "Sundry Debtors" || l.groupName === "Cash"
  );
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // Check if quotation mode is requested via URL
  const isQuotationMode = searchParams.get("mode") === "quotation";

  // Safe fallbacks for context data - Remove demo data and use only from context
  const safeStockItems = stockItems || [];
  const safeLedgers = ledgers || [];
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

  // Generate voucher number (e.g., ABCDEF0001 or QT0001)
  const generateVoucherNumber = useCallback(() => {
    const salesVouchers = vouchers.filter((v) => v.type === "sales");
    const prefix = isQuotation ? "QT" : "SLSV";
    const lastNumber =
      salesVouchers.length > 0
        ? parseInt(
            salesVouchers[salesVouchers.length - 1].number.replace(
              /^(XYZ|QT)/,
              ""
            )
          ) || 0
        : 0;
    return `${prefix}${(lastNumber + 1).toString().padStart(4, "0")}`;
  }, [vouchers, isQuotation]);

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
      type: isQuotation ? "quotation" : "sales",
      number: `${isQuotation ? "QT" : "XYZ"}0001`, // Will be updated by useEffect
      narration: "",
      referenceNo: "",
      partyId: "",
      mode: "item-invoice",
      dispatchDetails: { docNo: "", through: "", destination: "" },
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
          discount: 0,
          hsnCode: "",
        },
      ],
    };
  };

  const [formData, setFormData] = useState<Omit<VoucherEntry, "id">>(
    getInitialFormData()
  );
  const [godownEnabled, setGodownEnabled] = useState<"yes" | "no">("yes"); // Add state for godown selection visibility
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showPrintOptions, setShowPrintOptions] = useState(false); // Print options popup state
  const [showEWayBill, setShowEWayBill] = useState(false); // E-way Bill modal state
  const [showInvoicePrint, setShowInvoicePrint] = useState(false); // Invoice print modal state

  // Regenerate voucher number when quotation mode changes
  useEffect(() => {
    if (!isEditMode) {
      setFormData((prev) => ({
        ...prev,
        number: generateVoucherNumber(),
        type: isQuotation ? "quotation" : "sales",
      }));
    }
  }, [isQuotation, isEditMode, generateVoucherNumber]);
  const [showConfig, setShowConfig] = useState(false);

  // Load voucher in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;

    const loadSingleVoucher = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/sales-vouchers/${id}`
        );
        const data = await res.json();

        if (!data.success) {
          console.error("Failed to load voucher");
          return;
        }

        const v = data.voucher;

        // Prepare entries for frontend
        const itemEntries = data.items.map((item) => ({
          id: "e" + Math.random().toString(36).substr(2, 9),
          itemId: item.itemId,
          quantity: item.quantity,
          rate: item.rate,
          amount: item.amount,
          cgstRate: item.cgstRate,
          sgstRate: item.sgstRate,
          igstRate: item.igstRate,
          discount: item.discount,
          hsnCode: item.hsnCode,
          batchNumber: item.batchNumber,
          godownId: item.godownId,
          type: "debit",
        }));

        const ledgerEntries = data.ledgerEntries.map((l) => ({
          id: "e" + Math.random().toString(36).substr(2, 9),
          ledgerId: l.ledger_id,
          amount: l.amount,
          type: l.entry_type,
        }));

        const mergedEntries =
          itemEntries.length > 0 ? itemEntries : ledgerEntries;

        setFormData({
          date: v.date.split("T")[0],
          number: v.number,
          referenceNo: v.referenceNo,
          partyId: v.partyId?.toString(),
          mode: "item-invoice",
          isQuotation: v.isQuotation === 1,
          salesLedgerId: v.salesLedgerId?.toString(),
          dispatchDetails: {
            docNo: v.dispatchDocNo,
            through: v.dispatchThrough,
            destination: v.destination,
          },
          narration: v.narration,
          entries: mergedEntries,
          type: "sales",
        });

        setIsQuotation(v.isQuotation === 1);
      } catch (err) {
        console.error("Single voucher load error:", err);
      }
    };

    loadSingleVoucher();
  }, [isEditMode, id]);

  // Keyboard shortcuts
  useEffect(() => {
    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("userType");
    const ownerId = localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    );
    if (!companyId || !ownerType || !ownerId) return;

    const params = new URLSearchParams({
      company_id: companyId,
      owner_type: ownerType,
      owner_id: ownerId,
    });

    fetch(`http://localhost:5000/api/stock-items?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStockItems(data.data);
          console.log("stock data", data.data);
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
      const field = name.split(".")[1] as keyof typeof formData.dispatchDetails;
      setFormData((prev) => ({
        ...prev,
        dispatchDetails: {
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
    if (e.target.value === "add-new") {
      navigate("/app/masters/ledger/create");
      return;
    }
  };
  const handleEntryChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const updatedEntries = [...formData.entries];
    const entry = updatedEntries[index];
    const partyLedger = safeLedgers.find((l) => l.id === formData.partyId);
    const isIntrastate =
      partyLedger?.state && safeCompanyInfo.state
        ? partyLedger.state === safeCompanyInfo.state
        : true;
    if (formData.mode === "item-invoice") {
      if (name === "itemId") {
        const details = getItemDetails(value);

        const gst = details.gstRate || 0;
        const isIntrastate = partyLedger?.state === safeCompanyInfo.state;

        updatedEntries[index] = {
          ...entry,
          itemId: value,
          hsnCode: details.hsnCode,
          rate: details.rate,
          quantity: entry.quantity || 1,
          unit: details.unit,
          batches: details.batches,
          batchNumber: "",
          gstRate: details.gstRate || 0,
          cgstRate: isIntrastate ? gst / 2 : 0,
          sgstRate: isIntrastate ? gst / 2 : 0,
          igstRate: isIntrastate ? 0 : gst,
        };
      } else if (
        name === "quantity" ||
        name === "rate" ||
        name === "discount"
      ) {
        const quantity =
          name === "quantity" ? parseFloat(value) || 0 : entry.quantity ?? 0;
        const rate = name === "rate" ? parseFloat(value) || 0 : entry.rate ?? 0;
        const discount =
          name === "discount" ? parseFloat(value) || 0 : entry.discount ?? 0;
        const baseAmount = quantity * rate;
        const gstRate =
          (entry.cgstRate ?? 0) + (entry.sgstRate ?? 0) + (entry.igstRate ?? 0);
        const gstAmount = (baseAmount * gstRate) / 100;
        updatedEntries[index] = {
          ...entry,
          [name]: parseFloat(value) || 0,
          amount: baseAmount + gstAmount - discount,
        };
      } else {
        updatedEntries[index] = {
          ...entry,
          [name]: type === "number" ? parseFloat(value) || 0 : value,
        };
      }
    } else {
      if (name === "ledgerId") {
        updatedEntries[index] = {
          ...entry,
          ledgerId: value,
          itemId: undefined,
          quantity: undefined,
          rate: undefined,
          cgstRate: undefined,
          sgstRate: undefined,
          igstRate: undefined,
          godownId: undefined,
          discount: undefined,
        };
      } else if (name === "amount") {
        updatedEntries[index] = {
          ...entry,
          amount: parseFloat(value) || 0,
        };
      } else {
        updatedEntries[index] = {
          ...entry,
          [name]: value,
        };
      }
    }

    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
    setErrors((prev) => ({ ...prev, [`entry${index}.${name}`]: "" }));
    if (e.target.value === "add-new") {
      navigate("/app/masters/ledger/create"); // Redirect to ledger creation page
    } else {
      handleChange(e); // normal update
    }
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
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.partyId) newErrors.partyId = "Party is required";
    if (!formData.number) newErrors.number = "Voucher number is required";

    if (formData.mode === "item-invoice") {
      if (!formData.salesLedgerId)
        newErrors.salesLedgerId = "Sales Ledger is required";

      formData.entries.forEach((entry, index) => {
        if (!entry.itemId)
          newErrors[`entry${index}.itemId`] = "Item is required";
        if ((entry.quantity ?? 0) <= 0)
          newErrors[`entry${index}.quantity`] =
            "Quantity must be greater than 0";
        if (godownEnabled === "yes" && godowns.length > 0 && !entry.godownId)
          newErrors[`entry${index}.godownId`] = "Godown is required";

        if (entry.itemId) {
          const stockItem = safeStockItems.find(
            (item) => item.id === entry.itemId
          );
          if (stockItem && (entry.quantity ?? 0) > stockItem.openingBalance) {
            newErrors[
              `entry${index}.quantity`
            ] = `Quantity exceeds available stock (${stockItem.openingBalance})`;
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
    return Object.keys(newErrors).length === 0;
  };

  const calculateTotals = () => {
    if (formData.mode === "item-invoice") {
      const subtotal = formData.entries.reduce(
        (sum, e) => sum + (e.quantity ?? 0) * (e.rate ?? 0),
        0
      );
      const cgstTotal = formData.entries.reduce(
        (sum, e) =>
          sum + ((e.quantity ?? 0) * (e.rate ?? 0) * (e.cgstRate ?? 0)) / 100,
        0
      );
      const sgstTotal = formData.entries.reduce(
        (sum, e) =>
          sum + ((e.quantity ?? 0) * (e.rate ?? 0) * (e.sgstRate ?? 0)) / 100,
        0
      );
      const igstTotal = formData.entries.reduce(
        (sum, e) =>
          sum + ((e.quantity ?? 0) * (e.rate ?? 0) * (e.igstRate ?? 0)) / 100,
        0
      );
      const discountTotal = formData.entries.reduce(
        (sum, e) => sum + (e.discount ?? 0),
        0
      );
      const total =
        subtotal + cgstTotal + sgstTotal + igstTotal - discountTotal;
      return {
        subtotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        discountTotal,
        total,
        debitTotal: 0,
        creditTotal: 0,
      };
    } else {
      const debitTotal = formData.entries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const creditTotal = formData.entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);
      return {
        debitTotal,
        creditTotal,
        total: debitTotal,
        subtotal: 0,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        discountTotal: 0,
      };
    }
  };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!validateForm()) {
  //     alert('Please fix the errors before submitting');
  //     return;
  //   }

  //   const newVoucher: VoucherEntry = {
  //     id: Math.random().toString(36).substring(2, 9),
  //     ...formData
  //   };

  //   console.log('=== SAVING VOUCHER ===');
  //   console.log('Voucher Data:', newVoucher);    console.log('Selected Party:', formData.partyId, formData.partyId ? getPartyName(formData.partyId) : 'No Party');
  //   console.log('Entries Count:', formData.entries.length);
  //   console.log('Totals:', calculateTotals());

  //   addVoucher(newVoucher);
  //   alert(`Voucher ${newVoucher.number} saved successfully! Party: ${formData.partyId ? getPartyName(formData.partyId) : 'No Party'}`);

  //   if (formData.mode === 'item-invoice') {
  //     // Update stock quantities (decrease for sales)
  //     formData.entries.forEach(entry => {
  //       if (entry.itemId && entry.quantity) {
  //         const stockItem = safeStockItems.find(item => item.id === entry.itemId);
  //         if (stockItem) {
  //           updateStockItem(entry.itemId, { openingBalance: stockItem.openingBalance - (entry.quantity ?? 0) });
  //         }
  //       }
  //     });
  //   }    navigate('/vouchers');
  // };

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        console.log("this is data", data);
        setLedgers(data);
      } catch (error) {
        console.error("Failed to fetch ledgers:", error);
      }
    };

    fetchLedgers();
  }, [companyId, ownerType, ownerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert("Please fix the errors before submitting");
      return;
    }

    const totals = calculateTotals();

   const payload = {
  date: formData.date,
  number: formData.number,
  referenceNo: formData.referenceNo,
  partyId: formData.partyId,
  salesLedgerId: formData.salesLedgerId,
  orderRef: formData.orderRef || "",
  termsOfDelivery: formData.termsOfDelivery || "",
  narration: formData.narration,

  // IMPORTANT multi-tenant fields
  companyId,
  ownerType,
  ownerId,

  // Dispatch fields (backend naming required)
  dispatchDocNo: formData.dispatchDetails.docNo,
  dispatchThrough: formData.dispatchDetails.through,
  destination: formData.dispatchDetails.destination,

  expectedDeliveryDate: formData.expectedDeliveryDate || null,
  status: "pending",

  items: formData.entries.map(e => ({
    itemId: e.itemId,
    hsnCode: e.hsnCode,
    quantity: e.quantity,
    rate: e.rate,
    amount: e.amount,
    discount: e.discount,
    cgstRate: e.cgstRate,
    sgstRate: e.sgstRate,
    igstRate: e.igstRate,
    godownId: e.godownId,
  })),

  ...totals,
};


    try {
      // -------------------------
      // EDIT MODE → SEND PUT CALL
      // -------------------------
      if (id) {
        const res = await fetch(
          `http://localhost:5000/api/sales-vouchers/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const data = await res.json();

        if (data.success) {
          Swal.fire("Success", "Voucher updated successfully!", "success");
          navigate("/app/vouchers");
        } else {
          Swal.fire("Error", data.message, "error");
        }

        return;
      }

      // -------------------------
      // CREATE MODE → POST REQUEST
      // -------------------------
      const res = await fetch("http://localhost:5000/api/sales-vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.id) {
        Swal.fire("Success", "Voucher saved successfully!", "success");
        navigate("/app/vouchers");
      } else {
        Swal.fire("Error", "Save failed", "error");
      }
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
    total = 0,
    debitTotal = 0,
    creditTotal = 0,
  } = calculateTotals();

  // Helper functions for print layout
  const getItemDetails = (itemId: string) => {
    const item = safeStockItems.find((i) => String(i.id) === String(itemId));
    if (!item)
      return {
        name: "-",
        hsnCode: "",
        unit: "-",
        gstRate: 0,
        rate: 0,
        batches: [],
      };

    return {
      name: item.name,
      hsnCode: item.hsnCode || "",
      unit: item.unitName || "", // Auto fill unit
      gstRate: parseFloat(item.gstRate) || 0,
      rate: parseFloat(item.standardSaleRate) || 0,
      batches: item.batches ? JSON.parse(item.batches) : [],
    };
  };

  const getPartyName = (partyId: string) => {
    if (!safeLedgers || safeLedgers.length === 0) return "Unknown Party";

    const party = safeLedgers.find((ledger) => ledger.id === partyId);

    return party ? party.name : "Unknown Party";
  };
  const getLedgerName = (ledgerId: string) => {
    if (!ledgerId) return "-";

    const ledger = safeLedgers.find((l) => String(l.id) === String(ledgerId));
    console.log("ledger", ledger);
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

  return (
    <React.Fragment>
      <div className="pt-[56px] px-4">
        <div className="flex items-center mb-6">
          <button
            title="Back to Vouchers"
            onClick={() => navigate("/app/vouchers")}
            className={`mr-4 p-2 rounded-full ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">
            {isQuotation ? "📋 Sales Quotation" : "📝 Sales Voucher"}
          </h1>
        </div>

        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="date"
                >
                  Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  title="Sale Date"
                  className={FORM_STYLES.input(theme, !!errors.date)}
                />
                {errors.date && (
                  <p className="text-red-500 text-xs mt-1">{errors.date}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="number"
                >
                  Voucher No.
                </label>
                <input
                  type="text"
                  id="number"
                  name="number"
                  value={formData.number}
                  readOnly
                  title="Voucher Number"
                  className={`${FORM_STYLES.input(theme, !!errors.number)} ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  }`}
                />
                {errors.number && (
                  <p className="text-red-500 text-xs mt-1">{errors.number}</p>
                )}
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="partyId"
                >
                  Party Name
                </label>
                <select
                  name="partyId"
                  value={formData.partyId}
                  onChange={handleChange}
                  required
                  className={`min-h-10 text-14 ${FORM_STYLES.select(
                    theme,
                    !!errors.partyId
                  )}`}
                >
                  <option value="" disabled>
                    -- Select Party --
                  </option>
                  {partyLedgers.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name}
                    </option>
                  ))}
                  <option
                    value="add-new"
                    className={`flex items-center px-4 py-2 rounded ${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-green-700"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    + Add New Ledger
                  </option>
                </select>
                {errors.partyId && (
                  <p className="text-red-500 text-xs mt-1">{errors.partyId}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="referenceNo"
                >
                  Reference No.
                </label>
                <input
                  type="text"
                  id="referenceNo"
                  name="referenceNo"
                  value={formData.referenceNo}
                  onChange={handleChange}
                  title="Reference Number"
                  placeholder="Enter reference number"
                  className={FORM_STYLES.input(theme)}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="dispatchDetails.docNo"
                >
                  Dispatch Doc No.
                </label>
                <input
                  type="text"
                  id="dispatchDetails.docNo"
                  name="dispatchDetails.docNo"
                  value={formData.dispatchDetails?.docNo ?? ""}
                  onChange={handleChange}
                  title="Dispatch Document Number"
                  placeholder="Enter dispatch document number"
                  className={FORM_STYLES.input(theme)}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="dispatchDetails.through"
                >
                  Dispatch Through
                </label>
                <input
                  type="text"
                  id="dispatchDetails.through"
                  name="dispatchDetails.through"
                  value={formData.dispatchDetails?.through ?? ""}
                  onChange={handleChange}
                  title="Dispatch Through"
                  placeholder="Enter dispatch method"
                  className={FORM_STYLES.input(theme)}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="dispatchDetails.destination"
                >
                  Destination
                </label>
                <input
                  type="text"
                  id="dispatchDetails.destination"
                  name="dispatchDetails.destination"
                  value={formData.dispatchDetails?.destination ?? ""}
                  onChange={handleChange}
                  title="Destination"
                  placeholder="Enter destination"
                  className={FORM_STYLES.input(theme)}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="mode"
                >
                  Voucher Mode
                </label>
                <select
                  id="mode"
                  name="mode"
                  value={formData.mode}
                  onChange={handleChange}
                  title="Voucher Mode"
                  className={FORM_STYLES.select(theme)}
                >
                  <option value="item-invoice">Item Invoice</option>
                  <option value="accounting-invoice">Accounting Invoice</option>
                  <option value="as-voucher">As Voucher</option>
                </select>
              </div>
            </div>
            {/* Quotation Mode Checkbox - Similar to Tally Prime */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="quotationMode"
                  checked={isQuotation}
                  onChange={(e) => setIsQuotation(e.target.checked)}
                  title="Convert to Quotation Voucher"
                  className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600"
                      : "bg-white border-gray-300"
                  }`}
                />
                <label
                  htmlFor="quotationMode"
                  className="text-sm font-medium cursor-pointer"
                >
                  {isQuotation ? "📋 Quotation Mode" : "📝 Sales Mode"}
                </label>
                <span className="text-xs text-gray-500">
                  {isQuotation
                    ? "(This will be treated as a quotation)"
                    : "(Check to convert to quotation)"}
                </span>
              </div>
            </div>
            {/* Sales Ledger selection for item-invoice mode */}
            {formData.mode === "item-invoice" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="salesLedgerId"
                  >
                    Sales Ledger <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="salesLedgerId"
                    value={formData.salesLedgerId || ""}
                    onChange={handleChange}
                    required
                    className={FORM_STYLES.select(
                      theme,
                      !!errors.salesLedgerId
                    )}
                  >
                    <option value="">-- Select Sales Ledger --</option>
                    {ledgers
                      .filter(
                        (l) =>
                          l.type === "sales" ||
                          l.name.toLowerCase().includes("sales")
                      )
                      .map((ledger) => (
                        <option key={ledger.id} value={ledger.id}>
                          {ledger.name}
                        </option>
                      ))}
                    <option
                      value="add-new"
                      className={`flex items-center px-4 py-2 rounded ${
                        theme === "dark"
                          ? "bg-blue-600 hover:bg-green-700"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                    >
                      + Add New Ledger
                    </option>
                  </select>

                  {errors.salesLedgerId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.salesLedgerId}
                    </p>
                  )}
                </div>

                {/* Godown Enable/Disable toggle */}
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="godownEnabled"
                  >
                    Enable Godown Selection
                  </label>
                  <select
                    id="godownEnabled"
                    value={godownEnabled}
                    onChange={(e) =>
                      setGodownEnabled(e.target.value as "yes" | "no")
                    }
                    className={FORM_STYLES.select(theme)}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            )}
            <div
              className={`p-4 mb-6 rounded ${
                theme === "dark" ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">
                  {formData.mode === "item-invoice"
                    ? "Items"
                    : "Ledger Entries"}
                </h3>
                <button
                  title="Add Entry"
                  type="button"
                  onClick={addEntry}
                  className={`flex items-center text-sm px-2 py-1 rounded ${
                    theme === "dark"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <Plus size={16} className="mr-1" />
                  Add {formData.mode === "item-invoice" ? "Item" : "Ledger"}
                </button>
              </div>
              <div className="overflow-x-auto">
                {formData.mode === "item-invoice" ? (
                  <table className="w-full mb-4">
                    <thead>
                      <tr
                        className={`${
                          theme === "dark"
                            ? "border-b border-gray-600"
                            : "border-b border-gray-300"
                        }`}
                      >
                        <th className="px-4 py-2 text-left">S.No</th>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-left">HSN/SAC</th>
                        <th className="px-4 py-2 text-left">Batch</th>
                        <th className="px-4 py-2 text-right">Quantity</th>
                        <th className="px-4 py-2 text-left">Unit</th>
                        <th className="px-4 py-2 text-right">Rate</th>
                        <th className="px-4 py-2 text-right">Gst%</th>
                        <th className="px-4 py-2 text-right">Discount</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        {godownEnabled === "yes" && (
                          <th className="px-4 py-2 text-left">Godown</th>
                        )}
                        <th className="px-4 py-2 text-center">Action</th>
                      </tr>
                    </thead>{" "}
                    <tbody>
                      {formData.entries.map((entry, index) => {
                        const itemDetails = getItemDetails(entry.itemId || "");
                        return (
                          <tr
                            key={entry.id}
                            className={`${
                              theme === "dark"
                                ? "border-b border-gray-600"
                                : "border-b border-gray-300"
                            }`}
                          >
                            <td className="px-4 py-2">{index + 1}</td>
                            <td className="px-4 py-2">
                              <select
                                title="Select Item"
                                name="itemId"
                                value={entry.itemId}
                                onChange={(e) => handleEntryChange(index, e)}
                                required
                                className={FORM_STYLES.tableSelect(theme)}
                              >
                                <option value="" disabled>
                                  -- Select Item --
                                </option>
                                {stockItems.length === 0 ? (
                                  <option value="" disabled>
                                    No items available
                                  </option>
                                ) : (
                                  stockItems.map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.name}
                                    </option>
                                  ))
                                )}
                              </select>

                              {errors[`entry${index}.itemId`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`entry${index}.itemId`]}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <input
                                title="Enter HSN/SAC Code"
                                type="text"
                                name="hsnCode"
                                value={entry.hsnCode || ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                placeholder="HSN/SAC"
                                className={FORM_STYLES.tableInput(theme)}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <select
                                title="Select Batch"
                                name="batchNumber"
                                value={entry.batchNumber || ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={`${FORM_STYLES.tableSelect(
                                  theme
                                )} max-h-32 overflow-y-auto`}
                              >
                                <option value="">-- Select Batch --</option>

                                {entry.batches && entry.batches.length > 0 ? (
                                  entry.batches.map((b, i) => (
                                    <option key={i} value={b.batchName}>
                                      {b.batchName}{" "}
                                      {/* ONLY batch name shown */}
                                    </option>
                                  ))
                                ) : (
                                  <option disabled>No Batch Available</option>
                                )}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                title="Enter Quantity"
                                type="number"
                                name="quantity"
                                value={entry.quantity ?? ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                required
                                min="0"
                                step="0.01"
                                className={`${FORM_STYLES.tableInput(
                                  theme
                                )} text-right ${
                                  errors[`entry${index}.quantity`]
                                    ? "border-red-500"
                                    : ""
                                }`}
                              />
                              {errors[`entry${index}.quantity`] && (
                                <p className="text-red-500 text-xs mt-1">
                                  {errors[`entry${index}.quantity`]}
                                </p>
                              )}
                            </td>
                            <td className="px-4 py-2">{itemDetails.unit}</td>
                            <td className="px-4 py-2">
                              <input
                                title="Enter Rate"
                                type="number"
                                name="rate"
                                value={entry.rate ?? ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                min="0"
                                step="0.01"
                                className={`${FORM_STYLES.tableInput(
                                  theme
                                )} text-right`}
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                type="number"
                                name="gstRate"
                                value={entry.gstRate || ""}
                                readOnly
                                className={`${FORM_STYLES.tableInput(
                                  theme
                                )} text-right bg-gray-100`}
                                title="GST rate auto-filled from item master"
                              />
                            </td>
                            <td className="px-4 py-2">
                              <input
                                title="Enter Discount"
                                type="number"
                                name="discount"
                                value={entry.discount ?? ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                min="0"
                                step="0.01"
                                className={`${FORM_STYLES.tableInput(
                                  theme
                                )} text-right`}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              {Number(entry.amount ?? 0).toLocaleString()}
                            </td>

                            {godownEnabled === "yes" && (
                              <td className="px-4 py-2">
                                <select
                                  title="Select Godown"
                                  name="godownId"
                                  value={entry.godownId}
                                  onChange={(e) => handleEntryChange(index, e)}
                                  required={godowns.length > 0}
                                  className={`${FORM_STYLES.tableSelect(
                                    theme
                                  )} ${
                                    errors[`entry${index}.godownId`]
                                      ? "border-red-500"
                                      : ""
                                  }`}
                                >
                                  <option value="">Select Godown</option>
                                  {godowns.length > 0 ? (
                                    godowns.map((godown: Godown) => (
                                      <option key={godown.id} value={godown.id}>
                                        {godown.name}
                                      </option>
                                    ))
                                  ) : (
                                    <option value="" disabled>
                                      No godowns available
                                    </option>
                                  )}
                                </select>
                                {errors[`entry${index}.godownId`] && (
                                  <p className="text-red-500 text-xs mt-1">
                                    {errors[`entry${index}.godownId`]}
                                  </p>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-2 text-center">
                              <button
                                title="Remove Item"
                                type="button"
                                onClick={() => removeEntry(index)}
                                disabled={formData.entries.length <= 1}
                                className={`p-1 rounded ${
                                  formData.entries.length <= 1
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
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr
                        className={`font-semibold ${
                          theme === "dark"
                            ? "border-t border-gray-600"
                            : "border-t border-gray-300"
                        }`}
                      >
                        <td className="px-4 py-2 text-right" colSpan={8}>
                          Subtotal:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {subtotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      <tr
                        className={`font-semibold ${
                          theme === "dark"
                            ? "border-t border-gray-600"
                            : "border-t border-gray-300"
                        }`}
                      >
                        <td className="px-4 py-2 text-right" colSpan={8}>
                          CGST Total:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {cgstTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      <tr
                        className={`font-semibold ${
                          theme === "dark"
                            ? "border-t border-gray-600"
                            : "border-t border-gray-300"
                        }`}
                      >
                        <td className="px-4 py-2 text-right" colSpan={8}>
                          SGST Total:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {sgstTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      <tr
                        className={`font-semibold ${
                          theme === "dark"
                            ? "border-t border-gray-600"
                            : "border-t border-gray-300"
                        }`}
                      >
                        <td className="px-4 py-2 text-right" colSpan={8}>
                          IGST Total:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {igstTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      <tr
                        className={`font-semibold ${
                          theme === "dark"
                            ? "border-t border-gray-600"
                            : "border-t border-gray-300"
                        }`}
                      >
                        <td className="px-4 py-2 text-right" colSpan={8}>
                          Discount Total:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {discountTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      <tr
                        className={`font-semibold ${
                          theme === "dark"
                            ? "border-t border-gray-600"
                            : "border-t border-gray-300"
                        }`}
                      >
                        <td className="px-4 py-2 text-right" colSpan={7}>
                          Grand Total:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {total.toLocaleString()}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <table className="w-full mb-4">
                    <thead>
                      <tr
                        className={`${
                          theme === "dark"
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
                          className={`${
                            theme === "dark"
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
                              className={`${FORM_STYLES.tableSelect(theme)} ${
                                errors[`entry${index}.ledgerId`]
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
                                className={`flex items-center px-4 py-2 rounded ${
                                  theme === "dark"
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
                              )} text-right ${
                                errors[`entry${index}.amount`]
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
                              className={`p-1 rounded ${
                                formData.entries.length <= 1
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
                    </tbody>{" "}
                    <tfoot>
                      <tr
                        className={`font-semibold ${
                          theme === "dark"
                            ? "border-t border-gray-600"
                            : "border-t border-gray-300"
                        }`}
                      >
                        <td className="px-4 py-2 text-right" colSpan={2}>
                          Debit Total:
                        </td>
                        <td className="px-4 py-2 text-right">
                          {debitTotal.toLocaleString()}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      <tr
                        className={`font-semibold ${
                          theme === "dark"
                            ? "border-t border-gray-600"
                            : "border-t border-gray-300"
                        }`}
                      >
                        <td className="px-4 py-2 text-right" colSpan={2}>
                          Credit Total:
                        </td>
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
            </div>{" "}
            <div className="flex justify-end space-x-4">
              <button
                title="Cancel (Esc)"
                type="button"
                onClick={() => navigate("/app/vouchers")}
                className={`px-4 py-2 rounded ${
                  theme === "dark"
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
                className={`flex items-center px-4 py-2 rounded ${
                  theme === "dark"
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
                className={`flex items-center px-4 py-2 rounded ${
                  theme === "dark"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div
              className={`p-6 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <h2 className="text-xl font-bold mb-4">
                Configure Sales Voucher
              </h2>
              <p className="mb-4">
                Configure GST settings, invoice format, etc.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setShowConfig(false)}
                  title="Close Configuration"
                  className={`px-4 py-2 rounded ${
                    theme === "dark"
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
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
            getPartyName={getPartyName}
            getItemDetails={getItemDetails}
            calculateTotals={calculateTotals}
            getGstRateInfo={getGstRateInfo}
            companyInfo={safeCompanyInfo}
            ledgers={safeLedgers}
            getLedgerName={getLedgerName}
          />
        )}

        <div
          className={`mt-6 p-4 rounded ${
            theme === "dark" ? "bg-gray-800" : "bg-blue-50"
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
