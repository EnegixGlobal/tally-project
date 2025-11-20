import React, { useState, useEffect, useRef, useCallback } from "react";
import { useReactToPrint } from "react-to-print";

import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import type { LedgerWithGroup, VoucherEntry } from "../../../types";
import { Save, Plus, Trash2, ArrowLeft, Printer } from "lucide-react";
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

const PurchaseVoucher: React.FC = () => {
  const { theme, godowns = [], companyInfo } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("userType");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );
  const [ledgers, setLedgers] = useState<LedgerWithGroup[]>([]);
  const partyLedgers = ledgers.filter(
    (l) =>
      l.groupName === "Sundry Creditors" ||
      l.groupName === "Cash" ||
      l.groupName === "Current Assets"
  );
  const purchaseLedgers = ledgers.filter(
    (l) =>
      l.groupName === "Purchase" ||
      l.groupName === "Direct Expenses" ||
      l.groupName === "Expense"
  );
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const { id } = useParams();
  const isEditMode = Boolean(id);

  useEffect(() => {
    if (!isEditMode || !id) return;

    fetch(`http://localhost:5000/api/purchase-vouchers/${id}`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched Voucher For Edit:", data);

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
          narration: data.narration || "",
          number: data.number || prev.number,

          dispatchDetails: {
            docNo: data.dispatchDocNo || "",
            through: data.dispatchThrough || "",
            destination: data.destination || "",
          },

          // ⭐⭐⭐ ITEMS + BATCH + HSN + GST AUTO LOAD ⭐⭐⭐
          entries:
            data.entries?.map((e, idx) => {
              const stockItem = stockItems.find(
                (item) => String(item.id) === String(e.itemId)
              );

              return {
                id: "e" + (idx + 1),

                itemId: e.itemId || "",
                quantity: e.quantity || 0,
                rate: e.rate || 0,
                amount: e.amount || 0,

                // AUTO FILL FROM ITEM MASTER
                hsnCode: stockItem?.hsnCode || "",
                unitName: stockItem?.unit || "",
                gstRate: stockItem?.gstRate || 0,
                cgstRate: stockItem?.gstRate ? stockItem.gstRate / 2 : 0,
                sgstRate: stockItem?.gstRate ? stockItem.gstRate / 2 : 0,
                igstRate: 0,

                // BATCH Auto Fill
                batches: stockItem?.batches || [],
                batchNumber: e.batchNumber || "",
                batchExpiryDate: e.batchExpiryDate || "",
                batchManufacturingDate: e.batchManufacturingDate || "",

                // Godown
                godownId: e.godownId || "",

                // Discount
                discount: e.discount || 0,

                // Ledger Mode Support
                ledgerId: e.ledgerId || "",
                type: e.type || "debit",
              };
            }) || [],
        }));
      })
      .catch((err) => console.error("Single voucher fetch error:", err));
  }, [id, isEditMode, stockItems]);

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
          const formatted = data.data.map((item) => ({
            ...item,
            batches: item.batches ? JSON.parse(item.batches) : [],
          }));

          setStockItems(formatted);
        } else {
          setStockItems([]);
        }
      })
      .catch((err) => {
        console.error("Stock fetch error:", err);
        setStockItems([]);
      });
  }, []);

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const res = await fetch(
          `http://localhost:5000/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setLedgers(data);
      } catch (err) {
        console.error("Failed to fetch ledgers:", err);
      }
    };
    fetchLedgers();
  }, [companyId, ownerType, ownerId]);
  // Safe fallbacks for context data
  const safeStockItems = stockItems || [
    {
      id: "1",
      name: "Laptop HP Pavilion",
      hsnCode: "8471",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 50,
      rate: 45000,
    },
    {
      id: "2",
      name: "Mobile Phone Samsung",
      hsnCode: "8517",
      unit: "Piece",
      gstRate: 5,
      openingBalance: 100,
      rate: 25000,
    },
    {
      id: "3",
      name: "Printer Canon",
      hsnCode: "8443",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 30,
      rate: 15000,
    },
    {
      id: "4",
      name: "Office Chair",
      hsnCode: "9401",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 75,
      rate: 8000,
    },
    {
      id: "5",
      name: "LED Monitor",
      hsnCode: "8528",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 40,
      rate: 12000,
    },
    {
      id: "6",
      name: "Desktop Computer Dell",
      hsnCode: "8471",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 25,
      rate: 35000,
    },
    {
      id: "7",
      name: "Wireless Mouse Logitech",
      hsnCode: "8471",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 200,
      rate: 1500,
    },
    {
      id: "8",
      name: "Keyboard Mechanical",
      hsnCode: "8471",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 150,
      rate: 3500,
    },
    {
      id: "9",
      name: "Smartphone iPhone",
      hsnCode: "8517",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 60,
      rate: 80000,
    },
    {
      id: "10",
      name: "Tablet iPad",
      hsnCode: "8471",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 35,
      rate: 45000,
    },
    {
      id: "11",
      name: "Webcam HD Logitech",
      hsnCode: "8525",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 80,
      rate: 4500,
    },
    {
      id: "12",
      name: "Headphones Sony",
      hsnCode: "8518",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 120,
      rate: 6000,
    },
    {
      id: "13",
      name: "External Hard Drive 1TB",
      hsnCode: "8471",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 90,
      rate: 5500,
    },
    {
      id: "14",
      name: "Router WiFi TP-Link",
      hsnCode: "8517",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 70,
      rate: 3200,
    },
    {
      id: "15",
      name: "UPS 1000VA APC",
      hsnCode: "8504",
      unit: "Piece",
      gstRate: 18,
      openingBalance: 45,
      rate: 8500,
    },
  ];

  // Purchase-specific suppliers (sundry-creditors)
  const safeLedgers = ledgers || [
    // Suppliers (sundry-creditors)
    {
      id: "1",
      name: "TechSource Electronics Pvt Ltd",
      type: "sundry-creditors",
      address: "123 Supplier Street, Mumbai",
      gstNumber: "27TECH1234F1Z5",
      state: "Maharashtra",
    },
    {
      id: "2",
      name: "Global Hardware Suppliers",
      type: "sundry-creditors",
      address: "456 Wholesale Road, Delhi",
      gstNumber: "07GLOB5678G2H9",
      state: "Delhi",
    },
    {
      id: "3",
      name: "Prime Components Ltd",
      type: "sundry-creditors",
      address: "789 Industrial Area, Pune",
      gstNumber: "27PRIME9012I3J4",
      state: "Maharashtra",
    },
    {
      id: "4",
      name: "Digital Solutions Supply Co",
      type: "sundry-creditors",
      address: "321 Tech Zone, Bangalore",
      gstNumber: "29DIGI6789K4L5",
      state: "Karnataka",
    },
    {
      id: "5",
      name: "Metro Parts Distributors",
      type: "sundry-creditors",
      address: "88 Trading Park, Hyderabad",
      gstNumber: "36METRO8901M6N7",
      state: "Telangana",
    },
    {
      id: "6",
      name: "United Electronics Supply",
      type: "sundry-creditors",
      address: "45 Commerce City, Gurgaon",
      gstNumber: "06UNITE2345P8Q9",
      state: "Haryana",
    },
    {
      id: "7",
      name: "Apex Hardware Trading",
      type: "sundry-creditors",
      address: "12 Market Center, Chennai",
      gstNumber: "33APEX6789R0S1",
      state: "Tamil Nadu",
    },
    {
      id: "8",
      name: "Supreme Components Inc",
      type: "sundry-creditors",
      address: "67 Supply Road, Kolkata",
      gstNumber: "19SUPRE3456T2U3",
      state: "West Bengal",
    },
    {
      id: "9",
      name: "Elite Tech Suppliers",
      type: "sundry-creditors",
      address: "23 Vendor Tower, Kochi",
      gstNumber: "32ELITE789V4W5",
      state: "Kerala",
    },
    {
      id: "10",
      name: "Premier Parts Corporation",
      type: "sundry-creditors",
      address: "56 Wholesale Park, Jaipur",
      gstNumber: "08PREMI0123X6Y7",
      state: "Rajasthan",
    },
    // Purchase Ledgers
    {
      id: "11",
      name: "Purchase - Electronics",
      type: "purchase",
      address: "",
      gstNumber: "",
      state: "",
    },
    {
      id: "12",
      name: "Purchase - Computer Hardware",
      type: "purchase",
      address: "",
      gstNumber: "",
      state: "",
    },
    {
      id: "13",
      name: "Purchase - Office Equipment",
      type: "purchase",
      address: "",
      gstNumber: "",
      state: "",
    },
    {
      id: "14",
      name: "Purchase - Mobile Devices",
      type: "purchase",
      address: "",
      gstNumber: "",
      state: "",
    },
    {
      id: "15",
      name: "Purchase - Accessories",
      type: "purchase",
      address: "",
      gstNumber: "",
      state: "",
    },
    {
      id: "16",
      name: "Purchase - General",
      type: "purchase",
      address: "",
      gstNumber: "",
      state: "",
    },
    // Other ledgers
    {
      id: "17",
      name: "Cash",
      type: "cash",
      address: "",
      gstNumber: "",
      state: "",
    },
    {
      id: "18",
      name: "Freight Inward",
      type: "direct-expenses",
      address: "",
      gstNumber: "",
      state: "",
    },
    {
      id: "19",
      name: "Transportation Charges",
      type: "direct-expenses",
      address: "",
      gstNumber: "",
      state: "",
    },
    {
      id: "20",
      name: "Loading & Unloading",
      type: "direct-expenses",
      address: "",
      gstNumber: "",
      state: "",
    },
  ];

  const safeGodowns =
    godowns.length > 0
      ? godowns
      : [
          { id: "1", name: "Main Warehouse", location: "Ground Floor" },
          { id: "2", name: "Electronics Storage", location: "First Floor" },
          { id: "3", name: "Accessories Store", location: "Second Floor" },
          { id: "4", name: "Damaged Goods", location: "Basement" },
        ];

  const safeCompanyInfo = companyInfo || {
    name: "Your Company Name",
    address: "Your Company Address",
    gstNumber: "N/A",
    phoneNumber: "N/A",
    state: "Default State",
    panNumber: "N/A",
  };

  const generateVoucherNumber = () => {
    const prefix = "PRV";
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit
    return `${prefix}${randomNumber}`;
  };
  const [formData, setFormData] = useState<Omit<VoucherEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    type: "purchase",
    number: generateVoucherNumber(),
    narration: "",
    referenceNo: "", // This will be used for Supplier Invoice Number
    supplierInvoiceDate: new Date().toISOString().split("T")[0], // New field for supplier invoice date
    purchaseLedgerId: "", // New field for purchase ledger
    partyId: "",
    mode: "item-invoice",
    dispatchDetails: { docNo: "", through: "", destination: "" },
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
        batchNumber: "",
        batchExpiryDate: "",
        batchManufacturingDate: "",
        batches: [],
      },
    ],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfig, setShowConfig] = useState(false);
  const [godownEnabled, setGodownEnabled] = useState<"yes" | "no">("yes"); // Add state for godown selection visibility
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
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
  console.log("Purchase Voucher - Party ledgers:", partyLedgers);
  console.log("Purchase Voucher - All safeLedgers:", safeLedgers);
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Debug: Log form changes
    console.log("Purchase Voucher - Form change:", name, value);

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

    // ------------------------------------------
    // MODE: ITEM-INVOICE
    // ------------------------------------------
    if (formData.mode === "item-invoice") {
      // 1️⃣ WHEN ITEM IS SELECTED → AUTO FILL ALL
      if (name === "itemId") {
        const selectedItem = stockItems.find(
          (item) => String(item.id) === String(value)
        );

        updatedEntries[index] = {
          ...entry,
          itemId: value,

          // AUTO FILL
          hsnCode: selectedItem?.hsnCode || "",

          // ⭐ FIXED UNIT FIELD ⭐
          unitName: selectedItem?.unitName || selectedItem?.unit || "",

          rate: Number(selectedItem?.rate) || 0,

          gstRate: Number(selectedItem?.gstRate) || 0,
          cgstRate: Number(selectedItem?.gstRate) / 2 || 0,
          sgstRate: Number(selectedItem?.gstRate) / 2 || 0,
          igstRate: 0,

          // LOAD BATCHES
          batches: selectedItem?.batches || [],
          batchNumber: "",
          batchExpiryDate: "",
          batchManufacturingDate: "",
        };

        setFormData((prev) => ({ ...prev, entries: updatedEntries }));
        return;
      }

      // 2️⃣ BATCH FIELDS (DO NOT RESET)
      if (
        name === "batchNumber" ||
        name === "batchExpiryDate" ||
        name === "batchManufacturingDate"
      ) {
        updatedEntries[index] = {
          ...entry,
          [name]: value,
        };

        setFormData((prev) => ({ ...prev, entries: updatedEntries }));
        return;
      }

      // 3️⃣ QUANTITY / RATE / DISCOUNT → RECALCULATE
      if (name === "quantity" || name === "rate" || name === "discount") {
        const quantity =
          name === "quantity" ? parseFloat(value) || 0 : entry.quantity ?? 0;
        const rate = name === "rate" ? parseFloat(value) || 0 : entry.rate ?? 0;
        const discount =
          name === "discount" ? parseFloat(value) || 0 : entry.discount ?? 0;

        const baseAmount = quantity * rate;

        const gstRateTotal =
          (entry.cgstRate ?? 0) + (entry.sgstRate ?? 0) + (entry.igstRate ?? 0);

        const gstAmount = (baseAmount * gstRateTotal) / 100;

        updatedEntries[index] = {
          ...entry,
          [name]: parseFloat(value) || 0,
          amount: baseAmount + gstAmount - discount,
        };

        setFormData((prev) => ({ ...prev, entries: updatedEntries }));
        return;
      }

      // 4️⃣ ANY OTHER INPUT
      updatedEntries[index] = {
        ...entry,
        [name]: type === "number" ? parseFloat(value) || 0 : value,
      };

      setFormData((prev) => ({ ...prev, entries: updatedEntries }));
      return;
    }

    // ------------------------------------------
    // MODE: ACCOUNTING / VOUCHER
    // ------------------------------------------
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

    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
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
          batchNumber: "",
          batchExpiryDate: "",
          batchManufacturingDate: "",
          batches: [],
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
    if (!formData.referenceNo)
      newErrors.referenceNo = "Supplier Invoice number is required";
    if (!formData.supplierInvoiceDate)
      newErrors.supplierInvoiceDate = "Supplier Invoice date is required";
    if (!formData.purchaseLedgerId)
      newErrors.purchaseLedgerId = "Purchase Ledger is required";

    if (formData.mode === "item-invoice") {
      formData.entries.forEach((entry, index) => {
        if (!entry.itemId)
          newErrors[`entry${index}.itemId`] = "Item is required";
        if ((entry.quantity ?? 0) <= 0)
          newErrors[`entry${index}.quantity`] =
            "Quantity must be greater than 0";
        if (
          godownEnabled === "yes" &&
          safeGodowns.length > 0 &&
          !entry.godownId
        )
          newErrors[`entry${index}.godownId`] = "Godown is required";
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
      const cgstTotal = formData.entries.reduce((sum, e) => {
        const baseAmount = (e.quantity ?? 0) * (e.rate ?? 0);
        return sum + (baseAmount * (e.cgstRate ?? 0)) / 100;
      }, 0);
      const sgstTotal = formData.entries.reduce((sum, e) => {
        const baseAmount = (e.quantity ?? 0) * (e.rate ?? 0);
        return sum + (baseAmount * (e.sgstRate ?? 0)) / 100;
      }, 0);
      const igstTotal = formData.entries.reduce((sum, e) => {
        const baseAmount = (e.quantity ?? 0) * (e.rate ?? 0);
        return sum + (baseAmount * (e.igstRate ?? 0)) / 100;
      }, 0);
      const gstTotal = cgstTotal + sgstTotal + igstTotal;
      const discountTotal = formData.entries.reduce(
        (sum, e) => sum + (e.discount ?? 0),
        0
      );
      const total = subtotal + gstTotal - discountTotal;
      return {
        subtotal,
        cgstTotal,
        sgstTotal,
        igstTotal,
        gstTotal,
        discountTotal,
        total,
      };
    } else {
      const debitTotal = formData.entries
        .filter((e) => e.type === "debit")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);
      const creditTotal = formData.entries
        .filter((e) => e.type === "credit")
        .reduce((sum, e) => sum + (e.amount ?? 0), 0);
      return { debitTotal, creditTotal, total: debitTotal };
    }
  };
 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) {
    alert("Please fix the errors before submitting");
    return;
  }

  try {
    const totals = calculateTotals();

    const payload = {
      ...formData,
      ...totals,
      companyId,
      ownerType,
      ownerId,
    };

    // ⭐ Auto Detect Add or Update Mode
    const url = isEditMode
      ? `http://localhost:5000/api/purchase-vouchers/${id}`
      : "http://localhost:5000/api/purchase-vouchers";

    const method = isEditMode ? "PUT" : "POST";

    // ⭐ API Request
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    console.log("Server response:", data);

    if (res.ok) {
      // SUCCESS MODAL
      await Swal.fire({
        title: isEditMode ? "Updated!" : "Success",
        text: isEditMode
          ? "Voucher updated successfully!"
          : "Voucher saved successfully!",
        icon: "success",
        confirmButtonText: "OK",
      });

      navigate("/app/vouchers/purchase");
    } else {
      Swal.fire("Error", data.message || "Something went wrong", "error");
    }
  } catch (err) {
    console.error("Error:", err);
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
    total = 0,
    debitTotal = 0,
    creditTotal = 0,
  } = calculateTotals();

  // Helper functions for print layout
  const getItemDetails = (itemId: string) => {
    const item = safeStockItems.find((item) => item.id === itemId);
    return item || { name: "-", hsnCode: "-", unit: "-", gstRate: 0, rate: 0 };
  };

  const getPartyName = (partyId: string) => {
    const party = safeLedgers.find((l) => l.id === partyId);
    return party?.name || "Unknown Party";
  };

  const getPurchaseLedgerName = (purchaseLedgerId: string) => {
    const ledger = safeLedgers.find((l) => l.id === purchaseLedgerId);
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
  return (
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
        <h1 className="text-2xl font-bold">Purchase Voucher</h1>
      </div>
      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="date">
                Date
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
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="number"
              >
                Voucher No.
              </label>{" "}
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number}
                readOnly
                className={`${getInputClasses(
                  theme,
                  !!errors.number
                )} bg-opacity-60 cursor-not-allowed`}
              />
              {errors.number && (
                <p className="text-red-500 text-xs mt-1">{errors.number}</p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="referenceNo"
              >
                Supplier Invoice
              </label>
              <input
                type="text"
                id="referenceNo"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleChange}
                required
                placeholder="Enter supplier invoice number"
                className={getInputClasses(theme, !!errors.referenceNo)}
              />
              {errors.referenceNo && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.referenceNo}
                </p>
              )}
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="supplierInvoiceDate"
              >
                Supplier Invoice Date
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
                <p className="text-red-500 text-xs mt-1">
                  {errors.supplierInvoiceDate}
                </p>
              )}
            </div>{" "}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="partyId"
              >
                Party Name
              </label>
              <select
                id="partyId"
                name="partyId"
                value={formData.partyId}
                onChange={handlePartyChange}
                className={getSelectClasses(theme, !!errors.partyId)}
              >
                <option value="">-- Select Party --</option>
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
                htmlFor="purchaseLedgerId"
              >
                Purchase Ledger
              </label>
              <select
                id="purchaseLedgerId"
                name="purchaseLedgerId"
                value={formData.purchaseLedgerId}
                onChange={handlePurchaseLedgerChange}
                className={getSelectClasses(theme, !!errors.purchaseLedgerId)}
              >
                <option value="">-- Select Purchase Ledger --</option>

                {purchaseLedgers.map((ledger) => (
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
              {errors.purchaseLedgerId && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.purchaseLedgerId}
                </p>
              )}
            </div>

            {/* Godown Enable/Disable dropdown */}
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
                className={getSelectClasses(theme)}
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="dispatchDetails.docNo"
              >
                Receipt Doc No.
              </label>{" "}
              <input
                type="text"
                id="dispatchDetails.docNo"
                name="dispatchDetails.docNo"
                value={formData.dispatchDetails?.docNo ?? ""}
                onChange={handleChange}
                className={getInputClasses(theme)}
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="dispatchDetails.through"
              >
                Receipt Through
              </label>{" "}
              <input
                type="text"
                id="dispatchDetails.through"
                name="dispatchDetails.through"
                value={formData.dispatchDetails?.through ?? ""}
                onChange={handleChange}
                className={getInputClasses(theme)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="dispatchDetails.destination"
              >
                Origin
              </label>{" "}
              <input
                type="text"
                id="dispatchDetails.destination"
                name="dispatchDetails.destination"
                value={formData.dispatchDetails?.destination ?? ""}
                onChange={handleChange}
                className={getInputClasses(theme)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="mode">
                Voucher Mode
              </label>{" "}
              <select
                title="Select Voucher Mode"
                id="mode"
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
          </div>

          <div
            className={`p-4 mb-6 rounded ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
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
              {" "}
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
                      <th className={TABLE_STYLES.headerCenter}>Sr No</th>
                      <th className={TABLE_STYLES.header}>Item</th>
                      <th className={TABLE_STYLES.header}>HSN/SAC</th>
                      <th className={TABLE_STYLES.header}>Batch</th>
                      <th className={TABLE_STYLES.headerRight}>Quantity</th>
                      <th className={TABLE_STYLES.header}>Unit</th>
                      <th className={TABLE_STYLES.headerRight}>Rate</th>
                      <th className={TABLE_STYLES.headerRight}>GST (%)</th>
                      <th className={TABLE_STYLES.headerRight}>Discount</th>
                      <th className={TABLE_STYLES.headerRight}>Amount</th>
                      {godownEnabled === "yes" && (
                        <th className={TABLE_STYLES.header}>Godown</th>
                      )}
                      <th className={TABLE_STYLES.headerCenter}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entries.map((entry, index) => {
                      const selectedItem = stockItems.find(
                        (item) => item.id == entry.itemId
                      );

                      return (
                        <tr
                          key={entry.id}
                          className={`${
                            theme === "dark"
                              ? "border-b border-gray-600"
                              : "border-b border-gray-300"
                          }`}
                        >
                          {/* SR NO */}
                          <td className="px-4 py-2 text-center font-semibold">
                            {index + 1}
                          </td>

                          {/* ITEM DROPDOWN */}
                          <td className="px-4 py-2">
                            <select
                              name="itemId"
                              value={entry.itemId}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={TABLE_STYLES.select}
                            >
                              <option value="">-- Select Item --</option>
                              {stockItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* HSN */}
                          <td className="px-4 py-2">{entry.hsnCode || "-"}</td>

                          {/* BATCH SELECT */}
                          <td className="px-4 py-2">
                            <select
                              value={entry.batchNumber}
                              onChange={(e) => {
                                const selectedBatch = entry.batches?.find(
                                  (b) => b.batchName === e.target.value
                                );

                                const updatedEntries = [...formData.entries];
                                updatedEntries[index] = {
                                  ...entry,
                                  batchNumber: e.target.value,
                                  batchExpiryDate:
                                    selectedBatch?.batchExpiryDate || "",
                                  batchManufacturingDate:
                                    selectedBatch?.batchManufacturingDate || "",
                                };

                                setFormData((prev) => ({
                                  ...prev,
                                  entries: updatedEntries,
                                }));
                              }}
                              className="border p-1 rounded w-full"
                            >
                              <option value="">Select Batch</option>
                              {(entry.batches || []).map((b, idx) => (
                                <option key={idx} value={b.batchName}>
                                  {b.batchName}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* QUANTITY */}
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              name="quantity"
                              value={entry.quantity}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={TABLE_STYLES.input}
                            />
                          </td>

                          {/* UNIT (FIXED) */}
                          <td className="px-4 py-2">{entry.unitName || "-"}</td>

                          {/* RATE */}
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              name="rate"
                              value={entry.rate}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={TABLE_STYLES.input}
                            />
                          </td>

                          {/* GST RATE */}
                          <td className="px-4 py-2 text-right">
                            {(entry.cgstRate || 0) + (entry.sgstRate || 0)}%
                          </td>

                          {/* DISCOUNT */}
                          <td className="px-4 py-2">
                            <input
                              type="number"
                              name="discount"
                              value={entry.discount}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={TABLE_STYLES.input}
                            />
                          </td>

                          {/* AMOUNT */}
                          <td className="px-4 py-2 text-right">
                            {entry.amount?.toLocaleString()}
                          </td>

                          {/* GODOWN - OPTIONAL */}
                          {godownEnabled === "yes" && (
                            <td className="px-4 py-2">
                              <select
                                name="godownId"
                                value={entry.godownId}
                                onChange={(e) => handleEntryChange(index, e)}
                                className={TABLE_STYLES.select}
                              >
                                <option value="">Select Godown</option>
                                {safeGodowns.map((g) => (
                                  <option key={g.id} value={g.id}>
                                    {g.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                          )}

                          {/* REMOVE BUTTON */}
                          <td className="px-4 py-2 text-center">
                            <button
                              onClick={() => removeEntry(index)}
                              className="p-1 rounded hover:bg-gray-300"
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
                      <td
                        className="px-4 py-2 text-right"
                        colSpan={COLSPAN_VALUES.ITEM_TABLE_TOTAL}
                      >
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
                      <td
                        className="px-4 py-2 text-right"
                        colSpan={COLSPAN_VALUES.ITEM_TABLE_TOTAL}
                      >
                        GST Total:
                      </td>
                      <td className="px-4 py-2 text-right">
                        {cgstTotal.toLocaleString()} +{" "}
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
                      <td
                        className="px-4 py-2 text-right"
                        colSpan={COLSPAN_VALUES.ITEM_TABLE_TOTAL}
                      >
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
                      <td
                        className="px-4 py-2 text-right"
                        colSpan={COLSPAN_VALUES.ITEM_TABLE_TOTAL}
                      >
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
                        className={`${
                          theme === "dark"
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
                  </tbody>
                  <tfoot>
                    <tr
                      className={`font-semibold ${
                        theme === "dark"
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
                      className={`font-semibold ${
                        theme === "dark"
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
              onClick={handlePrint}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`p-6 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
          >
            <h2 className="text-xl font-bold mb-4">
              Configure Purchase Voucher
            </h2>
            <p className="mb-4">Configure GST settings, invoice format, etc.</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowConfig(false)}
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
      )}{" "}
      {/* Print Layout */}{" "}
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
                    <strong>Purchase Ledger:</strong>{" "}
                    {getPurchaseLedgerName(formData.purchaseLedgerId)}
                  </div>
                )}
                {formData.dispatchDetails?.destination && (
                  <div>
                    <strong>Origin:</strong>{" "}
                    {formData.dispatchDetails.destination}
                  </div>
                )}
              </div>
            </div>
          </div>{" "}
          {/* Particulars Table */}
          {formData.mode === "item-invoice" ? (
            <table className={PRINT_STYLES.table}>
              <thead>
                <tr className="bg-gray-100">
                  {" "}
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
                        {" "}
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
          )}{" "}
          {/* Amount in Words */}
          <div className="border border-black p-2.5 mb-4">
            <strong className="text-[11pt]">
              Total Amount (Rs. in Words):
            </strong>
            <div className="text-[10pt] mt-1.5 min-h-[20px]">
              Rupees {total > 0 ? total.toLocaleString() : "Zero"} Only
              {total > 0 && ` (₹${total.toLocaleString()})`}
            </div>
          </div>{" "}
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
                        <strong>GST Rates Used:</strong>{" "}
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
                        This invoice includes {gstInfo.uniqueGstRatesCount}{" "}
                        different GST rate
                        {gstInfo.uniqueGstRatesCount > 1 ? "s" : ""} as per item
                        specifications
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}{" "}
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
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Note:</span> Use Purchase Voucher for
          recording purchases. Press F8 to create, F9 to save, F12 to configure,
          Esc to cancel.
        </p>
      </div>
    </div>
  );
};

export default PurchaseVoucher;
