import React, { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import type {
  VoucherEntry,
  Ledger,
  VoucherEntryLine,
  LedgerWithGroup,
} from "../../../types";
import { Save, Plus, Trash2, ArrowLeft, Printer } from "lucide-react";
import PrintOptions from "../sales/PrintOptions";
import EWayBillGeneration from "../sales/EWayBillGeneration";
import InvoicePrint from "../sales/InvoicePrint";
import Swal from "sweetalert2";

const DebitNoteVoucher: React.FC = () => {
  const { theme, stockItems } = useAppContext();
  const navigate = useNavigate();
  const [ledgers, setLedgers] = useState<LedgerWithGroup[]>([]);
  const companyId = localStorage.getItem("company_id");
  console.log("compandyid", companyId);
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );
  // Purchase Ledger dropdown should show ledgers with group indicating purchase ledgers or expense ledgers
  const partyLedgers = ledgers.filter(
    (l) =>
      l.groupName === "Sundry Creditors" || l.groupName === "Sundry Debtors"
  );
  const salesLedgers = ledgers.filter((l) => l.groupName === "Sales");
  const generateVoucherNumber = () => {
    const prefix = "DNV";
    const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit
    return `${prefix}${randomNumber}`;
  };
  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setLedgers(data);
      } catch (err) {
        console.error("Failed to fetch ledgers:", err);
      }
    };
    fetchLedgers();
  }, [companyId, ownerType, ownerId]);

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

  const [formData, setFormData] = useState<Omit<VoucherEntry, "id">>({
    date: new Date().toISOString().split("T")[0],
    type: "debit-note",
    number: generateVoucherNumber(),
    narration: "",
    mode: "accounting-invoice", // Default to accounting mode
    partyId: "",
    salesLedgerId: "", // For item-invoice mode
    entries: [
      { id: "1", ledgerId: "", amount: 0, type: "debit" },
      { id: "2", ledgerId: "", amount: 0, type: "credit" },
    ],
  });

  // Print-related state
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [showEWayBill, setShowEWayBill] = useState(false);
  const [showInvoicePrint, setShowInvoicePrint] = useState(false);

  // Safe fallbacks for context data
  const safeStockItems = stockItems || [];
  const safeLedgers = ledgers || [];

  // Helper functions
  const getPartyBalance = (partyId: string) => {
    const party = safeLedgers.find((l) => l.id === partyId);
    return party ? party.openingBalance || 0 : 0;
  };

  const getItemDetails = (itemId: string) => {
    const item = safeStockItems.find((i) => i.id === itemId);
    return item
      ? {
          name: item.name,
          unit: item.unit,
          rate: item.standardSaleRate || 0,
          hsnCode: item.hsnCode || "",
          gstRate: item.gstRate || 0,
        }
      : {
          name: "",
          unit: "",
          rate: 0,
          hsnCode: "",
          gstRate: 0,
        };
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle mode change - reset entries when mode changes
    if (name === "mode") {
      const newMode = value as
        | "item-invoice"
        | "accounting-invoice"
        | "as-voucher";
      setFormData((prev) => ({
        ...prev,
        mode: newMode,
        entries:
          newMode === "item-invoice"
            ? [
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
              ]
            : [
                { id: "1", ledgerId: "", amount: 0, type: "debit" },
                { id: "2", ledgerId: "", amount: 0, type: "credit" },
              ],
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEntryChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const updatedEntries = [...formData.entries];
    const entry = updatedEntries[index];

    if (formData.mode === "item-invoice") {
      if (name === "itemId") {
        const itemDetails = getItemDetails(value);
        const gstRate = itemDetails.gstRate;
        const cgstRate = gstRate / 2; // Assuming intrastate for simplicity
        const sgstRate = gstRate / 2;

        updatedEntries[index] = {
          ...entry,
          itemId: value,
          ledgerId: undefined,
          rate: itemDetails.rate,
          hsnCode: itemDetails.hsnCode || "",
          cgstRate,
          sgstRate,
          igstRate: 0,
          amount:
            (entry.quantity ?? 0) * itemDetails.rate * (1 + gstRate / 100) -
            (entry.discount ?? 0),
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
      // Accounting/As Voucher mode
      updatedEntries[index] = {
        ...entry,
        [name]: type === "number" ? parseFloat(value) || 0 : value,
      };
    }

    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
  };

  const addEntry = () => {
    setFormData((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        formData.mode === "item-invoice"
          ? {
              id: `e${prev.entries.length + 1}`,
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
            }
          : {
              id: (prev.entries.length + 1).toString(),
              ledgerId: "",
              amount: 0,
              type: "credit",
            },
      ],
    }));
  };

  const removeEntry = (index: number) => {
    if (formData.entries.length <= (formData.mode === "item-invoice" ? 1 : 2))
      return;

    const updatedEntries = [...formData.entries];
    updatedEntries.splice(index, 1);

    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
  };

  // Calculate totals based on mode
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
      };
    } else {
      const total = formData.entries.reduce(
        (sum, e) => sum + (e.amount ?? 0),
        0
      );
      return {
        subtotal: total,
        cgstTotal: 0,
        sgstTotal: 0,
        igstTotal: 0,
        discountTotal: 0,
        total,
      };
    }
  };

  // Get balance info for traditional calculation
  const getBalanceInfo = () => {
    if (formData.mode === "item-invoice") {
      return { totalDebit: 0, totalCredit: 0, isBalanced: true };
    } else {
      const totalDebit = formData.entries
        .filter((entry: VoucherEntryLine) => entry.type === "debit")
        .reduce(
          (sum: number, entry: VoucherEntryLine) => sum + entry.amount,
          0
        );

      const totalCredit = formData.entries
        .filter((entry: VoucherEntryLine) => entry.type === "credit")
        .reduce(
          (sum: number, entry: VoucherEntryLine) => sum + entry.amount,
          0
        );

      const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;
      return { totalDebit, totalCredit, isBalanced };
    }
  };

  const { totalDebit, totalCredit, isBalanced } = getBalanceInfo();

  // Print Options Handlers
  const handlePrintClick = () => {
    console.log("Print button clicked");

    if (!formData.partyId) {
      alert("Please select a party before printing the debit note.");
      return;
    }

    // Show print options popup instead of direct print
    setShowPrintOptions(true);
  };

  const handleGenerateInvoice = () => {
    console.log("Generating Debit Note Invoice...");
    setShowPrintOptions(false);
    setShowInvoicePrint(true); // Show invoice print modal
  };

  const handleGenerateEWayBill = () => {
    console.log("Generating E-way Bill...");
    setShowPrintOptions(false);
    setShowEWayBill(true); // Show E-way Bill generation modal
  };

  const handleGenerateEInvoice = () => {
    console.log("Generating E-Invoice...");
    setShowPrintOptions(false);
    // TODO: Implement E-Invoice generation for debit note
    alert("E-Invoice generation feature will be implemented soon!");
  };

  const handleSendToEmail = () => {
    console.log("Sending to Email...");
    setShowPrintOptions(false);
    // TODO: Implement email functionality for debit note
    alert("Email sending feature will be implemented soon!");
  };

  const handleSendToWhatsApp = () => {
    console.log("Sending to WhatsApp...");
    setShowPrintOptions(false);
    // TODO: Implement WhatsApp sharing for debit note
    alert("WhatsApp sharing feature will be implemented soon!");
  };

  // Helper function to get party name
  const getPartyName = (partyId: string) => {
    if (!safeLedgers || safeLedgers.length === 0) return "Unknown Party";

    const party = safeLedgers.find((ledger) => ledger.id === partyId);
    return party ? party.name : "Unknown Party";
  };

  // Company info for invoice printing
  const { companyInfo } = useAppContext();
  const safeCompanyInfo = companyInfo || {
    name: "Your Company Name",
    address: "Your Company Address",
    gstNumber: "N/A",
    phoneNumber: "N/A",
    state: "Default State",
    panNumber: "N/A",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validation based on mode
    if (formData.mode === "item-invoice") {
      if (!formData.partyId) {
        alert("Please select a party");
        return;
      }
      if (!formData.salesLedgerId) {
        alert("Please select a sales ledger");
        return;
      }
      if (!formData.entries.some((entry: VoucherEntryLine) => entry.itemId)) {
        alert("Please add at least one item");
        return;
      }
    } else {
      if (!isBalanced) {
        alert("Total debit must equal total credit");
        return;
      }
    }

    try {
      if (!ownerId) {
        alert("Owner ID not found. Please login again.");
        return;
      }

      // ✅ Prepare payload for API
      const payload = {
        companyId: Number(companyId),
        ownerType,
        ownerId: Number(ownerId),
        date: formData.date,
        number: formData.number || "",
        mode: formData.mode,
        partyId: formData.partyId ? Number(formData.partyId) : null,
        salesLedgerId: formData.salesLedgerId
          ? Number(formData.salesLedgerId)
          : null,
        narration: formData.narration || "",

        entries:
          formData.mode === "item-invoice"
            ? formData.entries.map((entry) => ({
                itemId: Number(entry.itemId),
                hsnCode: entry.hsnCode || "",
                quantity: Number(entry.quantity || 0),
                rate: Number(entry.rate || 0),
                discount: Number(entry.discount || 0),
                amount: Number(entry.amount || 0),
              }))
            : formData.entries.map((entry) => ({
                ledgerId: Number(entry.ledgerId),
                amount: Number(entry.amount || 0),
                type: entry.type,
              })),
      };

      console.log("Payload:", payload);

      // ✅ Send to backend
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/DebitNoteVoucher`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Debit Note saved successfully",
        }).then(() => {
          navigate("/app/vouchers"); // or your route to go back
        });
      } else {
        Swal.fire("Error", result.message || "Something went wrong", "error");
      }
    } catch (error) {
      console.error("Error saving debit note:", error);
      Swal.fire(
        "Error",
        "Error saving debit note. Check console for details.",
        "error"
      );
    }
  };

  return (
    <div className="pt-[56px] px-4 ">
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
        <h1 className="text-2xl font-bold">Debit Note Voucher</h1>
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
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none transition-colors`}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="number"
              >
                Debit Note No.
              </label>
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="Auto"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none transition-colors`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="mode">
                Voucher Mode
              </label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                title="Voucher Mode"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none transition-colors`}
              >
                <option value="item-invoice">Item Invoice</option>
                <option value="accounting-invoice">Accounting Invoice</option>
                <option value="as-voucher">As Voucher</option>
              </select>
            </div>
          </div>

          {/* Party and Sales Ledger selection for item-invoice mode */}
          {formData.mode === "item-invoice" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="partyId"
                >
                  Party Name <span className="text-red-500">*</span>
                </label>
                <select
                  id="partyId"
                  name="partyId"
                  value={formData.partyId || ""}
                  onChange={handlePartyChange}
                  title="Select Party"
                  required
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                      : "bg-white border-gray-300 focus:border-blue-500"
                  } outline-none transition-colors`}
                >
                  <option value="">-- Select Party --</option>
                  {partyLedgers.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name} (Bal: ₹
                      {getPartyBalance(ledger.id).toLocaleString()})
                    </option>
                  ))}
                  <option
                    value="add-new"
                    className={`flex items-center px-4 py-2 rounded ${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-g]reen-700"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    + Add New Ledger
                  </option>
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="salesLedgerId"
                >
                  Sales Ledger <span className="text-red-500">*</span>
                </label>
                <select
                  id="salesLedgerId"
                  name="salesLedgerId"
                  value={formData.salesLedgerId || ""}
                  onChange={handlePurchaseLedgerChange}
                  title="Select Sales Ledger"
                  required
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                      : "bg-white border-gray-300 focus:border-blue-500"
                  } outline-none transition-colors`}
                >
                  <option value="">-- Select Sales Ledger --</option>

                  {salesLedgers.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name}
                    </option>
                  ))}
                  <option
                    value="add-new"
                    className={`flex items-center px-4 py-2 rounded ${
                      theme === "dark"
                        ? "bg-blue-600 hover:bg-g]reen-700"
                        : "bg-green-600 hover:bg-green-700 text-white"
                    }`}
                  >
                    + Add New Ledger
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Party selection for accounting mode */}
          {(formData.mode === "accounting-invoice" ||
            formData.mode === "as-voucher") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
                  value={formData.partyId || ""}
                  onChange={handleChange}
                  title="Select Party"
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                      : "bg-white border-gray-300 focus:border-blue-500"
                  } outline-none transition-colors`}
                >
                  <option value="">-- Select Party (Optional) --</option>
                  {safeLedgers.map((ledger) => (
                    <option key={ledger.id} value={ledger.id}>
                      {ledger.name} (Bal: ₹
                      {getPartyBalance(ledger.id).toLocaleString()})
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
                {formData.mode === "item-invoice" ? "Items" : "Entries"}
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
                Add {formData.mode === "item-invoice" ? "Item" : "Line"}
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
                      <th className="px-4 py-2 text-right">Quantity</th>
                      <th className="px-4 py-2 text-left">Unit</th>
                      <th className="px-4 py-2 text-right">Rate</th>
                      <th className="px-4 py-2 text-right">Discount</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entries.map(
                      (entry: VoucherEntryLine, index: number) => {
                        const itemDetails = getItemDetails(entry.itemId || "");
                        return (
                          <tr
                            key={index}
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
                                value={entry.itemId || ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                required
                                className={`w-full p-1 rounded border ${
                                  theme === "dark"
                                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                    : "bg-white border-gray-300 focus:border-blue-500"
                                } outline-none transition-colors`}
                              >
                                <option value="">-- Select Item --</option>
                                {safeStockItems.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-2">
                              <input
                                title="Enter HSN/SAC Code"
                                type="text"
                                name="hsnCode"
                                value={entry.hsnCode || ""}
                                onChange={(e) => handleEntryChange(index, e)}
                                placeholder="HSN/SAC"
                                className={`w-full p-1 rounded border ${
                                  theme === "dark"
                                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                    : "bg-white border-gray-300 focus:border-blue-500"
                                } outline-none transition-colors`}
                              />
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
                                className={`w-full p-1 rounded border text-right ${
                                  theme === "dark"
                                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                    : "bg-white border-gray-300 focus:border-blue-500"
                                } outline-none transition-colors`}
                              />
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
                                className={`w-full p-1 rounded border text-right ${
                                  theme === "dark"
                                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                    : "bg-white border-gray-300 focus:border-blue-500"
                                } outline-none transition-colors`}
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
                                className={`w-full p-1 rounded border text-right ${
                                  theme === "dark"
                                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                    : "bg-white border-gray-300 focus:border-blue-500"
                                } outline-none transition-colors`}
                              />
                            </td>
                            <td className="px-4 py-2 text-right">
                              ₹{(entry.amount || 0).toLocaleString()}
                            </td>
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
                      }
                    )}
                  </tbody>
                  <tfoot>
                    <tr
                      className={`font-semibold ${
                        theme === "dark"
                          ? "border-t border-gray-600"
                          : "border-t border-gray-300"
                      }`}
                    >
                      <td className="px-4 py-2 text-right" colSpan={7}>
                        Total:
                      </td>
                      <td className="px-4 py-2 text-right">
                        ₹
                        {formData.entries
                          .reduce(
                            (sum: number, entry: VoucherEntryLine) =>
                              sum + (entry.amount || 0),
                            0
                          )
                          .toLocaleString()}
                      </td>
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
                      <th className="px-4 py-2 text-left">Ledger Account</th>
                      <th className="px-4 py-2 text-left">Particulars</th>
                      <th className="px-4 py-2 text-left">Dr/Cr</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entries.map(
                      (entry: VoucherEntryLine, index: number) => (
                        <tr
                          key={index}
                          className={`${
                            theme === "dark"
                              ? "border-b border-gray-600"
                              : "border-b border-gray-300"
                          }`}
                        >
                          <td className="px-4 py-2">
                            <select
                              title="Ledger Account"
                              name="ledgerId"
                              value={entry.ledgerId}
                              onChange={(e) => handleEntryChange(index, e)}
                              required
                              className={`w-full p-2 rounded border ${
                                theme === "dark"
                                  ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                  : "bg-white border-gray-300 focus:border-blue-500"
                              } outline-none transition-colors`}
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
                          </td>
                          <td className="px-4 py-2">
                            <input
                              title="Particulars"
                              type="text"
                              name="narration"
                              value={entry.narration || ""}
                              onChange={(e) => handleEntryChange(index, e)}
                              placeholder="Enter particulars"
                              className={`w-full p-2 rounded border ${
                                theme === "dark"
                                  ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                  : "bg-white border-gray-300 focus:border-blue-500"
                              } outline-none transition-colors`}
                            />
                          </td>
                          <td className="px-4 py-2">
                            <select
                              title="Dr/Cr"
                              name="type"
                              value={entry.type}
                              onChange={(e) => handleEntryChange(index, e)}
                              required
                              className={`w-full p-2 rounded border ${
                                theme === "dark"
                                  ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                  : "bg-white border-gray-300 focus:border-blue-500"
                              } outline-none transition-colors`}
                            >
                              <option value="debit">Dr</option>
                              <option value="credit">Cr</option>
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <input
                              title="Amount"
                              type="number"
                              name="amount"
                              value={entry.amount}
                              onChange={(e) => handleEntryChange(index, e)}
                              required
                              min="0"
                              step="0.01"
                              className={`w-full p-2 rounded border text-right ${
                                theme === "dark"
                                  ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                                  : "bg-white border-gray-300 focus:border-blue-500"
                              } outline-none transition-colors`}
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <button
                              title="Remove Entry"
                              type="button"
                              onClick={() => removeEntry(index)}
                              disabled={formData.entries.length <= 2}
                              className={`p-1 rounded ${
                                formData.entries.length <= 2
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
                      )
                    )}
                  </tbody>
                  <tfoot>
                    <tr
                      className={`font-semibold ${
                        theme === "dark"
                          ? "border-t border-gray-600"
                          : "border-t border-gray-300"
                      }`}
                    >
                      <td className="px-4 py-2 text-right" colSpan={3}>
                        Totals:
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col">
                          <span>Dr: ₹{(totalDebit || 0).toLocaleString()}</span>
                          <span>
                            Cr: ₹{(totalCredit || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        {isBalanced ? (
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              theme === "dark"
                                ? "bg-green-900 text-green-200"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            Balanced
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              theme === "dark"
                                ? "bg-red-900 text-red-200"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            Unbalanced
                          </span>
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
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
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500"
              } outline-none transition-colors`}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
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
              type="submit"
              disabled={formData.mode !== "item-invoice" && !isBalanced}
              className={`flex items-center px-4 py-2 rounded ${
                formData.mode !== "item-invoice" && !isBalanced
                  ? "opacity-50 cursor-not-allowed bg-blue-600"
                  : theme === "dark"
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

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Note:</span> Debit notes are issued to
          increase the amount due from a customer or to a supplier.
        </p>
      </div>

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
          isQuotation={false}
          onClose={() => setShowInvoicePrint(false)}
          getPartyName={getPartyName}
          getItemDetails={getItemDetails}
          calculateTotals={calculateTotals}
          getGstRateInfo={() => ({
            uniqueGstRatesCount: 1,
            gstRatesUsed: [18],
            totalItems: formData.entries.length,
            breakdown: {},
          })}
          companyInfo={safeCompanyInfo}
          ledgers={safeLedgers}
        />
      )}
    </div>
  );
};

export default DebitNoteVoucher;
