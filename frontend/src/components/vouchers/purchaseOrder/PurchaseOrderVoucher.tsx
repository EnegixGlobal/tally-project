import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { useAppContext } from "../../../context/AppContext";
import {
  Save,
  Plus,
  Trash2,
  ArrowLeft,
  Printer,
  Settings,
  Calculator,
} from "lucide-react";
import type { LedgerWithGroup } from "../../../types";

// Types for Purchase Order
interface PurchaseOrderItem {
  id: string;
  itemId: string;
  itemName?: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  discount: number;
  amount: number;
  godownId?: string;
  unit?: string;
}

interface PurchaseOrderData {
  id?: string;
  date: string;
  number: string;
  partyId: string;
  purchaseLedgerId: string;
  referenceNo: string;
  narration: string;
  items: PurchaseOrderItem[];
  orderRef: string;
  termsOfDelivery: string;
  expectedDeliveryDate: string;
  status:
    | "pending"
    | "confirmed"
    | "partially_received"
    | "completed"
    | "cancelled";
  dispatchDetails: {
    destination: string;
    through: string;
    docNo: string;
  };
}

// interface Ledger {
//   id: string;
//   name: string;
//   type: string;
//   currentBalance?: number;
//   state?: string;
//   gstNumber?: string;
// }

interface StockItem {
  id: string;
  name: string;
  unit: string;
  hsnCode?: string;
  standardPurchaseRate?: number;
}

interface Godown {
  id: string;
  name: string;
  location?: string;
}

const PurchaseOrderVoucher: React.FC = () => {
  const { theme, companyInfo } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  type PartyLedger = LedgerWithGroup & {
    currentBalance?: number;
    gstNumber?: string;
    state?: string;
  };

  const [loadedPO, setLoadedPO] = useState<any>(null);

  //get sinlge data
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchPurchaseOrder = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/purchase-orders/${id}`
        );
        const data = await res.json();
        setLoadedPO(data);
      } catch (err) {
        Swal.fire("Error", "Failed to load purchase order", "error");
      }
    };

    fetchPurchaseOrder();
  }, [id, isEditMode]);

  const [ledgers, setLedgers] = useState<PartyLedger[]>([]);

  useEffect(() => {
    if (!loadedPO) return;
    if (ledgers.length === 0) return;

    setFormData({
      id: String(loadedPO.id),
      date: loadedPO.date?.split("T")[0] || "",
      number: loadedPO.number || "",

      partyId: String(loadedPO.partyId),
      purchaseLedgerId: String(loadedPO.purchaseLedgerId),

      referenceNo: loadedPO.reference_no || "",
      narration: loadedPO.narration || "",
      orderRef: loadedPO.order_ref || "",
      termsOfDelivery: loadedPO.terms_of_delivery || "",

      expectedDeliveryDate: loadedPO.expectedDeliveryDate
        ? loadedPO.expectedDeliveryDate.split("T")[0]
        : "",

      status: loadedPO.status || "pending",

      dispatchDetails: {
        destination: loadedPO.dispatch_destination || "",
        through: loadedPO.dispatch_through || "",
        docNo: loadedPO.dispatch_doc_no || "",
      },

      items: (loadedPO.items || []).map((item: any, index: number) => ({
        id: String(index + 1),
        itemId: String(item.item_id),
        itemName: item.item_name,
        hsnCode: item.hsn_code || "",
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        discount: Number(item.discount || 0),
        amount: Number(item.amount),
        godownId: item.godown_id ? String(item.godown_id) : "",
        unit: item.unit || "",
      })),
    });
  }, [loadedPO, ledgers]);

  const [godowns, setGodowns] = useState<Godown[]>([]);
  useEffect(() => {
    const fetchGodowns = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/godowns?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();

        // ✅ CORRECT PARSING
        if (Array.isArray(data.data)) {
          setGodowns(data.data);
        } else {
          setGodowns([]);
        }
      } catch (err) {
        console.error("Failed to fetch godowns:", err);
        setGodowns([]);
      }
    };

    fetchGodowns();
  }, []);

  const partyLedgers = ledgers;
  const purchaseLedgers = ledgers;

  useEffect(() => {
    const fetchLedgers = async () => {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
      );
      const data = await res.json();
      setLedgers(data);
    };
    fetchLedgers();
  }, []);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  useEffect(() => {
    const fetchStockItems = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();

        if (Array.isArray(data.data)) {
          setStockItems(data.data); // ✔ Correct location
        } else {
          console.error("Stock items missing array!");
          setStockItems([]);
        }
      } catch (err) {
        console.error("Error loading stock items:", err);
        setStockItems([]);
      }
    };

    fetchStockItems();
  }, []);

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

  const initialFormData: PurchaseOrderData = {
    date: new Date().toISOString().split("T")[0],
    number: "",
    partyId: "",
    purchaseLedgerId: "",
    referenceNo: "",
    narration: "",
    items: [
      {
        id: "1",
        itemId: "",
        quantity: 0,
        rate: 0,
        discount: 0,
        amount: 0,
      },
    ],
    orderRef: "",
    termsOfDelivery: "",
    expectedDeliveryDate: "",
    status: "pending",
    dispatchDetails: {
      destination: "",
      through: "",
      docNo: "",
    },
  };

  const [formData, setFormData] = useState<PurchaseOrderData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [config, setConfig] = useState({
    autoNumbering: true,
    showExpectedDate: true,
    showGodown: true,
    showHSN: true,
    showDiscount: true,
  });

  // get voucher number get
  useEffect(() => {
    if (isEditMode) return;
    if (!companyId || !ownerType || !ownerId || !formData.date) return;

    const fetchNextPONumber = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/purchase-orders/next-number` +
            `?company_id=${companyId}` +
            `&owner_type=${ownerType}` +
            `&owner_id=${ownerId}` +
            `&date=${formData.date}`
        );

        const data = await res.json();

        if (data.success) {
          setFormData((prev) => ({
            ...prev,
            number: data.voucherNumber,
          }));
        }
      } catch (err) {
        console.error("PO number fetch failed", err);
      }
    };

    fetchNextPONumber();
  }, [formData.date, companyId, ownerType, ownerId, isEditMode]);

  // Get selected party details
  const selectedParty = useMemo(() => {
    return partyLedgers.find((p) => p.id === formData.partyId);
  }, [partyLedgers, formData.partyId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleItemChange = (
    index: number,
    field: keyof PurchaseOrderItem,
    value: string | number
  ) => {
    const updatedItems = [...formData.items];
    const item = { ...updatedItems[index] };

    // When user selects an item
    if (field === "itemId") {
      const selectedItem = stockItems.find(
        (si) => String(si.id) === String(value)
      );

      if (selectedItem) {
        // Auto-fill all stock item details
        item.itemId = selectedItem.id;
        item.itemName = selectedItem.name;
        item.hsnCode = selectedItem.hsnCode || "";
        item.rate = selectedItem.standardPurchaseRate || 0;
        item.unit = selectedItem.unit || "";
      }
    }

    // Normal updates
    if (field === "quantity") {
      item.quantity = Number(value) || 0;
    } else if (field === "rate") {
      item.rate = Number(value) || 0;
    } else if (field === "discount") {
      item.discount = Number(value) || 0;
    } else if (field === "godownId") {
      item.godownId = value as string;
    } else if (field === "hsnCode") {
      item.hsnCode = value as string;
    }

    // Auto-calculate amount
    item.amount = item.quantity * item.rate - item.discount;

    updatedItems[index] = item;

    setFormData((prev) => ({ ...prev, items: updatedItems }));
    setErrors((prev) => ({ ...prev, [`item${index}_${field}`]: "" }));
  };

  const addItem = () => {
    const newItem: PurchaseOrderItem = {
      id: (formData.items.length + 1).toString(),
      itemId: "",
      quantity: 0,
      rate: 0,
      discount: 0,
      amount: 0,
    };
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    const updatedItems = [...formData.items];
    updatedItems.splice(index, 1);
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.partyId) newErrors.partyId = "Party selection is required";
    if (!formData.purchaseLedgerId)
      newErrors.purchaseLedgerId = "Purchase ledger is required";

    // Validate items
    formData.items.forEach((item, index) => {
      if (!item.itemId)
        newErrors[`item${index}_itemId`] = "Item selection is required";
      if (item.quantity <= 0)
        newErrors[`item${index}_quantity`] = "Quantity must be greater than 0";
      if (item.rate <= 0)
        newErrors[`item${index}_rate`] = "Rate must be greater than 0";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        Swal.fire(
          "Validation Error",
          "Please fix the errors before submitting.",
          "warning"
        );
        return;
      }

      try {
        const cleanedItems = formData.items.map((item) => ({
          itemId: item.itemId,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          amount: item.amount,
          godownId: item.godownId,
        }));

        const payload = {
          ...formData,
          items: cleanedItems,
          companyId,
          ownerType,
          ownerId,
        };

        const url = isEditMode
          ? `${import.meta.env.VITE_API_URL}/api/purchase-orders/${id}`
          : `${import.meta.env.VITE_API_URL}/api/purchase-orders`;

        const response = await fetch(url, {
          method: isEditMode ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (response.ok) {
          Swal.fire({
            icon: "success",
            title: "Success",
            text: `Purchase Order ${
              isEditMode ? "updated" : "created"
            } successfully`,
          }).then(() => {
            navigate("/app/vouchers");
          });
        } else {
          Swal.fire("Error", data.message || "Something went wrong", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        Swal.fire("Network Error", "Failed to connect to the server.", "error");
      }
    },
    [formData, navigate, isEditMode, validateForm]
  );

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      const totalAmount = formData.items.reduce(
        (sum, item) => sum + item.amount,
        0
      );

      printWindow.document.write(`
        <html>
          <head>
            <title>Purchase Order - ${formData.number}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
              .company-info { margin-bottom: 20px; }
              .order-details { display: flex; justify-content: space-between; margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
              th { background-color: #f2f2f2; }
              .amount { text-align: right; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>PURCHASE ORDER</h1>
            </div>
            
            <div class="company-info">
              <h3>${companyInfo?.name || "Your Company Name"}</h3>
              <p>${companyInfo?.address || "Company Address"}</p>
              <p>GST No: ${companyInfo?.gstNumber || "N/A"}</p>
            </div>

            <div class="order-details">
              <div>
                <strong>Order No:</strong> ${formData.number}<br>
                <strong>Date:</strong> ${formData.date}<br>
                <strong>Expected Delivery:</strong> ${
                  formData.expectedDeliveryDate || "N/A"
                }
              </div>
              <div>
                <strong>Supplier:</strong> ${selectedParty?.name || "N/A"}<br>
                <strong>GST No:</strong> ${
                  selectedParty?.gstNumber || "N/A"
                }<br>
                <strong>Current Balance:</strong> ₹${
                  selectedParty?.currentBalance?.toLocaleString() || "0"
                }
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Sr.</th>
                  <th>Item Name</th>
                  <th>HSN Code</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Rate</th>
                  <th>Discount</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${formData.items
                  .map(
                    (item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.itemName || "N/A"}</td>
                    <td>${item.hsnCode || "N/A"}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unit || "Nos"}</td>
                    <td class="amount">₹${item.rate.toLocaleString()}</td>
                    <td class="amount">₹${item.discount.toLocaleString()}</td>
                    <td class="amount">₹${item.amount.toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="7"><strong>Total Amount</strong></td>
                  <td class="amount"><strong>₹${totalAmount.toLocaleString()}</strong></td>
                </tr>
              </tbody>
            </table>

            <div>
              <strong>Terms of Delivery:</strong> ${
                formData.termsOfDelivery || "N/A"
              }<br>
              <strong>Narration:</strong> ${formData.narration || "N/A"}
            </div>

            <div style="margin-top: 50px;">
              <div style="display: flex; justify-content: space-between;">
                <div>
                  <p>_________________</p>
                  <p>Prepared By</p>
                </div>
                <div>
                  <p>_________________</p>
                  <p>Authorized Signature</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [formData, companyInfo, selectedParty]);

  // Calculate totals
  const totalAmount = formData.items.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const totalQuantity = formData.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div
      className={`pt-[56px] px-4 ${
        theme === "dark" ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      <div className="flex items-center mb-6">
        <button
          title="Back to Vouchers"
          type="button"
          onClick={() => navigate("/app/vouchers")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className={`text-2xl font-bold ${
            theme === "dark" ? "text-gray-100" : "text-gray-900"
          }`}
        >
          {isEditMode ? "Edit Purchase Order" : "New Purchase Order"}
        </h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Save Purchase Order"
            onClick={handleSubmit}
            className={`p-2 rounded-md ${
              theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white flex items-center`}
          >
            <Save size={18} className="mr-2" /> Save
          </button>
          <button
            title="Print Purchase Order"
            onClick={handlePrint}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Configure"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <form onSubmit={handleSubmit}>
          {/* Header Information */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Date <span className="text-red-500">*</span>
              </label>
              <input
                title="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Purchase Order No.
              </label>
              <input
                title="number"
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                readOnly={config.autoNumbering}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500 ${
                  config.autoNumbering ? "opacity-50" : ""
                }`}
                placeholder={
                  config.autoNumbering ? "Auto" : "Enter order number"
                }
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Reference No.
              </label>
              <input
                title="referenceNo"
                type="text"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500`}
                placeholder="Enter reference number"
              />
            </div>

            {config.showExpectedDate && (
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Expected Delivery Date
                </label>
                <input
                  title="expectedDeliveryDate"
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleChange}
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            )}
          </div>

          {/* Party and Purchase Ledger */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Party's A/c Name <span className="text-red-500">*</span>
              </label>
              <select
                id="partyId"
                name="partyId"
                value={formData.partyId}
                onChange={handlePartyChange}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500`}
              >
                <option value="">-- Select Party Name --</option>

                {partyLedgers.map((ledger) => (
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
              {errors.partyId && (
                <p className="text-red-500 text-sm mt-1">{errors.partyId}</p>
              )}

              {selectedParty && (
                <div
                  className={`mt-2 p-2 rounded text-sm ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-300"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  <p>
                    <strong>Current Balance:</strong> ₹
                    {selectedParty.currentBalance?.toLocaleString() || "0"}
                  </p>
                  <p>
                    <strong>GST No:</strong> {selectedParty.gstNumber || "N/A"}
                  </p>
                  <p>
                    <strong>State:</strong> {selectedParty.state || "N/A"}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Purchase Ledger <span className="text-red-500">*</span>
              </label>
              <select
                name="purchaseLedgerId"
                value={formData.purchaseLedgerId}
                onChange={handlePurchaseLedgerChange}
                required
                title="Select Purchase Ledger"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500`}
              >
                <option value="">Select Purchase Ledger</option>

                {purchaseLedgers.map((ledger) => (
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

              {errors.purchaseLedgerId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.purchaseLedgerId}
                </p>
              )}
            </div>
          </div>

          {/* Items Section */}
          <div
            className={`p-4 mb-6 rounded ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Items</h3>
              <button
                type="button"
                onClick={addItem}
                className={`flex items-center text-sm px-3 py-2 rounded ${
                  theme === "dark"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                <Plus size={16} className="mr-1" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`${
                      theme === "dark"
                        ? "border-b border-gray-600"
                        : "border-b border-gray-300"
                    }`}
                  >
                    <th className="px-2 py-2 text-left">Name of Item</th>
                    {config.showHSN && (
                      <th className="px-2 py-2 text-left">HSN Code</th>
                    )}
                    <th className="px-2 py-2 text-center">Quantity</th>
                    <th className="px-2 py-2 text-center">Rate per</th>
                    {config.showDiscount && (
                      <th className="px-2 py-2 text-center">Discount</th>
                    )}
                    <th className="px-2 py-2 text-right">Amount</th>
                    {config.showGodown && (
                      <th className="px-2 py-2 text-left">Godown</th>
                    )}
                    <th className="px-2 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`${
                        theme === "dark"
                          ? "border-b border-gray-600"
                          : "border-b border-gray-300"
                      }`}
                    >
                      <td className="px-2 py-2">
                        <select
                          title="itemId"
                          value={item.itemId}
                          onChange={(e) =>
                            handleItemChange(index, "itemId", e.target.value)
                          }
                          className={`w-full p-1 rounded border text-sm ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:border-blue-500`}
                        >
                          <option value="">Select Item</option>
                          {stockItems.map((stockItem) => (
                            <option key={stockItem.id} value={stockItem.id}>
                              {stockItem.name}
                            </option>
                          ))}
                        </select>
                        {errors[`item${index}_itemId`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item${index}_itemId`]}
                          </p>
                        )}
                      </td>

                      {config.showHSN && (
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            value={item.hsnCode || ""}
                            onChange={(e) =>
                              handleItemChange(index, "hsnCode", e.target.value)
                            }
                            className={`w-full p-1 rounded border text-sm ${
                              theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:border-blue-500`}
                            placeholder="HSN"
                            title="HSN Code"
                            aria-label="HSN Code"
                          />
                        </td>
                      )}

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "quantity",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`w-full p-1 rounded border text-center text-sm ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:border-blue-500`}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        {errors[`item${index}_quantity`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item${index}_quantity`]}
                          </p>
                        )}
                      </td>

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "rate",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className={`w-full p-1 rounded border text-right text-sm ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:border-blue-500`}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                        {errors[`item${index}_rate`] && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors[`item${index}_rate`]}
                          </p>
                        )}
                      </td>

                      {config.showDiscount && (
                        <td className="px-2 py-2">
                          <input
                            title="discount"
                            type="number"
                            value={item.discount}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "discount",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className={`w-full p-1 rounded border text-right text-sm ${
                              theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:border-blue-500`}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                          />
                        </td>
                      )}

                      <td className="px-2 py-2">
                        <input
                          title="amount"
                          type="number"
                          value={item.amount}
                          readOnly
                          className={`w-full p-1 rounded border text-right text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-600 text-gray-100"
                              : "bg-gray-100 border-gray-300 text-gray-900"
                          } opacity-60`}
                        />
                      </td>

                      {config.showGodown && (
                        <td className="px-2 py-2">
                          <select
                            value={item.godownId || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "godownId",
                                e.target.value
                              )
                            }
                            className={`w-full p-1 rounded border text-sm ${
                              theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                            } focus:border-blue-500`}
                            title="Select Godown"
                            aria-label="Select Godown"
                          >
                            <option value="">Select Godown</option>
                            {godowns.map((godown) => (
                              <option key={godown.id} value={godown.id}>
                                {godown.name}
                              </option>
                            ))}
                          </select>
                        </td>
                      )}

                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length <= 1}
                          className={`p-1 rounded ${
                            formData.items.length <= 1
                              ? "opacity-50 cursor-not-allowed"
                              : theme === "dark"
                              ? "hover:bg-gray-600"
                              : "hover:bg-gray-300"
                          }`}
                          title="Remove Item"
                          aria-label="Remove Item"
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
                    <td className="px-2 py-2" colSpan={config.showHSN ? 2 : 1}>
                      Total
                    </td>
                    <td className="px-2 py-2 text-center">{totalQuantity}</td>
                    <td className="px-2 py-2"></td>
                    {config.showDiscount && <td className="px-2 py-2"></td>}
                    <td className="px-2 py-2 text-right">
                      ₹{totalAmount.toLocaleString()}
                    </td>
                    {config.showGodown && <td className="px-2 py-2"></td>}
                    <td className="px-2 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Additional Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Order Reference
              </label>
              <input
                type="text"
                name="orderRef"
                value={formData.orderRef}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500`}
                placeholder="Enter order reference"
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Terms of Delivery
              </label>
              <input
                type="text"
                name="termsOfDelivery"
                value={formData.termsOfDelivery}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500`}
                placeholder="Enter delivery terms"
              />
            </div>
          </div>

          {/* Narration */}
          <div className="mb-6">
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Narration
            </label>
            <textarea
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              rows={3}
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              } focus:border-blue-500 focus:ring-blue-500`}
              placeholder="Enter narration"
            />
          </div>

          {/* Configuration Panel */}
          {showConfigPanel && (
            <div
              className={`p-4 mb-6 rounded ${
                theme === "dark" ? "bg-gray-700" : "bg-gray-50"
              }`}
            >
              <h3 className="font-semibold mb-4">Configuration (F12)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.autoNumbering}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        autoNumbering: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${
                      theme === "dark" ? "bg-gray-600" : "bg-white"
                    }`}
                  />
                  Auto Numbering
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showExpectedDate}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showExpectedDate: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${
                      theme === "dark" ? "bg-gray-600" : "bg-white"
                    }`}
                  />
                  Show Expected Date
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showGodown}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showGodown: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${
                      theme === "dark" ? "bg-gray-600" : "bg-white"
                    }`}
                  />
                  Show Godown
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showHSN}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showHSN: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${
                      theme === "dark" ? "bg-gray-600" : "bg-white"
                    }`}
                  />
                  Show HSN Code
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showDiscount}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showDiscount: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${
                      theme === "dark" ? "bg-gray-600" : "bg-white"
                    }`}
                  />
                  Show Discount
                </label>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Summary Panel */}
      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">
              Total Items: {formData.items.length} | Total Quantity:{" "}
              {totalQuantity}
            </p>
            <p className="text-lg font-bold">
              Total Amount: ₹{totalAmount.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Calculator size={20} className="text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Calculator
            </span>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
          <p>
            <strong>Keyboard Shortcuts:</strong> Ctrl+S to save, Ctrl+P to
            print, F12 to configure, Esc to cancel
          </p>
          <p>
            <strong>Note:</strong> Purchase Orders are used to place orders with
            suppliers before actual purchase.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderVoucher;
