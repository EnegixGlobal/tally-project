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
import type { StockItem } from "../../../types";

// Types for Sales Order
interface SalesOrderItem {
  id: string;
  itemId: number | string;
  itemName?: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  discount: number;
  amount: number;
  unit?: string;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  
}

interface SalesOrderData {
  id?: string;
  date: string;
  number: string;
  partyId: string;
  salesLedgerId: string;
  referenceNo: string;
  narration: string;
  items: SalesOrderItem[];
  orderRef: string;
  termsOfDelivery: string;
  expectedDeliveryDate: string;
  status:
    | "pending"
    | "confirmed"
    | "partially_delivered"
    | "completed"
    | "cancelled";
  dispatchDetails: {
    destination: string;
    through: string;
    docNo: string;
  };
}

interface Ledger {
  id: string;
  name: string;
  type: string;
  currentBalance?: number;
  state?: string;
  gstNumber?: string;
}

// interface StockItem {
//   id: string;
//   name: string;
//   unit: string;
//   hsnCode?: string;
//   standardSaleRate?: number;
//   gstRate?: number;
// }

const SalesOrder: React.FC = () => {
  const { theme, companyInfo } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const [stockItems, setStockItems] = useState<StockItem[]>([]);


  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchOrder = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales-orders/${id}`
        );
        const data = await res.json();
        console.log("ye data hai single ka", data);

        if (data.success) {
          const order = data.data;

          setFormData({
            id: order.id,
            date: order.date?.split("T")[0] || "",
            number: order.number || "",
            partyId: order.partyId || "",
            salesLedgerId: order.salesLedgerId || "",
            referenceNo: order.referenceNo || "",
            narration: order.narration || "",
            orderRef: order.orderRef || "",
            termsOfDelivery: order.termsOfDelivery || "",
            expectedDeliveryDate:
              order.expectedDeliveryDate?.split("T")[0] || "",
            status: order.status || "pending",
            dispatchDetails: {
              destination: order.destination || "",
              through: order.through || "",
              docNo: order.docNo || "",
            },

            // IMPORTANT: Backend items → frontend items format conversion
            items: order.items.map((it: any, idx: number) => ({
              id: String(idx + 1),
              itemId: it.itemId,
              itemName: it.itemName,
              hsnCode: it.hsnCode || "",
              unit: it.unit || "",
              quantity: Number(it.quantity),
              rate: Number(it.rate),
              discount: Number(it.discount || 0),
              cgstRate: Number(it.cgstRate || 0),
              sgstRate: Number(it.sgstRate || 0),
              igstRate: Number(it.igstRate || 0),
              amount: Number(it.amount),
            })),
          });
        }
      } catch (err) {
        console.error("Error fetching sales order", err);
      }
    };

    fetchOrder();
  }, [id, isEditMode]);

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
          setStockItems(data.data);
        } else setStockItems([]);
      })
      .catch(() => setStockItems([]));
  }, []);
  // Sample data - replace with API calls
  const [parties] = useState<Ledger[]>([
    {
      id: "1",
      name: "ABC Electronics Pvt Ltd",
      type: "sundry-debtors",
      currentBalance: 50000,
      state: "Maharashtra",
      gstNumber: "27ABCDE1234F1Z5",
    },
    {
      id: "2",
      name: "XYZ Trading Co",
      type: "sundry-debtors",
      currentBalance: 25000,
      state: "Delhi",
      gstNumber: "07XYZAB5678G2H9",
    },
    {
      id: "3",
      name: "PQR Industries",
      type: "sundry-debtors",
      currentBalance: 75000,
      state: "Gujarat",
      gstNumber: "24PQRST9012I3J4",
    },
    {
      id: "4",
      name: "LMN Enterprises",
      type: "sundry-debtors",
      currentBalance: 30000,
      state: "Karnataka",
      gstNumber: "29LMNOP6789K4L5",
    },
  ]);

  const generateOrderNumber = () => {
    const prefix = "SO";
    const randomNumber = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}${randomNumber}`;
  };

  const initialFormData: SalesOrderData = {
    date: new Date().toISOString().split("T")[0],
    number: isEditMode ? "" : generateOrderNumber(),
    partyId: "",
    salesLedgerId: "",
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
        cgstRate: 0,
        sgstRate: 0,
        igstRate: 0,
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

  const [formData, setFormData] = useState<SalesOrderData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [config, setConfig] = useState({
    autoNumbering: true,
    showExpectedDate: true,
    showGodown: true,
    showHSN: true,
    showDiscount: true,
    showGST: true,
  });
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  // Get selected party details
  const selectedParty = useMemo(() => {
    return parties.find((p) => p.id === formData.partyId);
  }, [parties, formData.partyId]);

  // Check if transaction is intrastate or interstate
  const isIntrastate = useMemo(() => {
    if (!selectedParty || !companyInfo?.state) return true;
    return selectedParty.state === companyInfo.state;
  }, [selectedParty, companyInfo?.state]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };
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
 const handleItemChange = (
  index: number,
  field: keyof SalesOrderItem | "batchNumber",
  value: string | number
) => {
  const updatedItems = [...formData.items];
  let item = { ...updatedItems[index] };

  // ==============================
  // WHEN ITEM SELECTED → AUTO FILL
  // ==============================
  if (field === "itemId") {
    const selectedItem = stockItems.find(
      (itm) => String(itm.id) === String(value)
    );

    const rawGST = Number(selectedItem?.gstRate) || 0;

    updatedItems[index] = {
      ...item,
      itemId: value,
      itemName: selectedItem?.name || "",
      hsnCode: selectedItem?.hsnCode || "",
      unit: selectedItem?.unit || "",
      rate: Number(selectedItem?.standardSaleRate) || 0,
      discount: 0,

      cgstRate: isIntrastate ? rawGST / 2 : 0,
      sgstRate: isIntrastate ? rawGST / 2 : 0,
      igstRate: isIntrastate ? 0 : rawGST,

      batches: selectedItem?.batches || [],
      batchNumber: "",
      quantity: 0,
      amount: 0,
    };

    setFormData((p) => ({ ...p, items: updatedItems }));
    return;
  }

  // ==============================
  // WHEN BATCH SELECTED
  // ==============================
  if (field === "batchNumber") {
  const selectedBatch = item.batches?.find(
    (b: any) =>
      String(b.batchName || b.name) === String(value)
  );

  if (!selectedBatch) return;

  const availableQty =
    Number(selectedBatch.batchQuantity ?? selectedBatch.quantity ?? 0);

  const rate = Number(selectedBatch.batchRate ?? selectedBatch.rate ?? item.rate ?? 0);

  const saleQty =
    item.quantity && item.quantity > 0 ? item.quantity : availableQty;

  const gst =
    Number(item.cgstRate || 0) +
    Number(item.sgstRate || 0) +
    Number(item.igstRate || 0);

  const base = saleQty * rate;
  const gstAmt = (base * gst) / 100;

  updatedItems[index] = {
    ...item,
    batchNumber: value,
    quantity: saleQty, // ⭐ auto fill batch qty
    rate,
    amount: base + gstAmt - (item.discount || 0),
    availableQty: availableQty - saleQty
  };

  setFormData((p) => ({ ...p, items: updatedItems }));
  return;
}


  // ==============================
  // USER CHANGES QTY / RATE / DISCOUNT → AUTO UPDATE
  // ==============================
  if (
    ["quantity", "rate", "discount"].includes(field)
  ) {
    item[field] =
      typeof value === "number" ? value : parseFloat(value as string) || 0;

    const selectedBatch = item.batches?.find(
      (b: any) => String(b.batchName) === String(item.batchNumber)
    );

    const availableQty =
      Number(selectedBatch?.batchQuantity || 0);

    if (item.quantity > availableQty) {
      alert(
        `Stock not available! Only ${availableQty} Qty available in batch: ${item.batchNumber}`
      );
      return;
    }

    const gst =
      Number(item.cgstRate || 0) +
      Number(item.sgstRate || 0) +
      Number(item.igstRate || 0);

    const baseAmount = item.quantity * item.rate;
    const gstAmount = (baseAmount * gst) / 100;

    item.amount = baseAmount + gstAmount - (item.discount || 0);
  } else {
    item[field] = value;
  }

  updatedItems[index] = item;
  setFormData((prev) => ({ ...prev, items: updatedItems }));
};

  const [ledgers, setLedgers] = useState<LedgerWithGroup[]>([]);

  const partyLedgers = ledgers;

  const salesLedgers = ledgers;

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

  const addItem = () => {
    const newItem: SalesOrderItem = {
      id: (formData.items.length + 1).toString(),
      itemId: "",
      quantity: 0,
      rate: 0,
      discount: 0,
      amount: 0,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
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
    if (!formData.salesLedgerId)
      newErrors.salesLedgerId = "Sales ledger is required";

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
  }, [formData.date, formData.partyId, formData.salesLedgerId, formData.items]);

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
        const payload = {
          ...formData,
          companyId,
          ownerType,
          ownerId,
        };

        const url = isEditMode
          ? `${import.meta.env.VITE_API_URL}/api/sales-orders/${id}`
          : `${import.meta.env.VITE_API_URL}/api/sales-orders`;

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
            text: `Sales Order ${
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
      const subtotal = formData.items.reduce(
        (sum, item) => sum + item.quantity * item.rate,
        0
      );
      const totalGST =
        totalAmount -
        subtotal +
        formData.items.reduce((sum, item) => sum + item.discount, 0);

      printWindow.document.write(`
        <html>
          <head>
            <title>Sales Order - ${formData.number}</title>
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
              <h1>SALES ORDER</h1>
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
                <strong>Customer:</strong> ${selectedParty?.name || "N/A"}<br>
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
                  ${config.showGST ? "<th>GST %</th>" : ""}
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
                    ${
                      config.showGST
                        ? `<td>${
                            (item.cgstRate || 0) +
                            (item.sgstRate || 0) +
                            (item.igstRate || 0)
                          }%</td>`
                        : ""
                    }
                    <td class="amount">₹${item.amount.toLocaleString()}</td>
                  </tr>
                `
                  )
                  .join("")}
                <tr class="total-row">
                  <td colspan="${
                    config.showGST ? "8" : "7"
                  }"><strong>Subtotal</strong></td>
                  <td class="amount"><strong>₹${subtotal.toLocaleString()}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="${
                    config.showGST ? "8" : "7"
                  }"><strong>Total GST</strong></td>
                  <td class="amount"><strong>₹${totalGST.toLocaleString()}</strong></td>
                </tr>
                <tr class="total-row">
                  <td colspan="${
                    config.showGST ? "8" : "7"
                  }"><strong>Total Amount</strong></td>
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
  }, [formData, companyInfo, selectedParty, config.showGST]);

  // Calculate totals
  const subtotal = formData.items.reduce(
    (sum, item) => sum + item.quantity * item.rate,
    0
  );
  const totalDiscount = formData.items.reduce(
    (sum, item) => sum + item.discount,
    0
  );
  const totalGST = formData.items.reduce((sum, item) => {
    const baseAmount = item.quantity * item.rate;
    const gstRate =
      (item.cgstRate || 0) + (item.sgstRate || 0) + (item.igstRate || 0);
    return sum + (baseAmount * gstRate) / 100;
  }, 0);
  const totalAmount = subtotal + totalGST - totalDiscount;
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
          {isEditMode ? "Edit Sales Order" : "New Sales Order"}
        </h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Save Sales Order"
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
            title="Print Sales Order"
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
                title="Order Date"
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
                Sales Order No.
              </label>
              <input
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
                  type="date"
                  name="expectedDeliveryDate"
                  value={formData.expectedDeliveryDate}
                  onChange={handleChange}
                  title="Expected Delivery Date"
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 text-gray-100"
                      : "bg-white border-gray-300 text-gray-900"
                  } focus:border-blue-500 focus:ring-blue-500`}
                />
              </div>
            )}
          </div>

          {/* Party and Sales Ledger */}
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
                  <p>
                    <strong>GST Type:</strong>{" "}
                    {isIntrastate
                      ? "Intrastate (CGST + SGST)"
                      : "Interstate (IGST)"}
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
                Sales Ledger <span className="text-red-500">*</span>
              </label>
              <select
                name="salesLedgerId"
                value={formData.salesLedgerId}
                onChange={handlePurchaseLedgerChange}
                required
                title="Select Sales Ledger"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500`}
              >
                <option value="">Select Sales Ledger</option>

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
              {errors.salesLedgerId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.salesLedgerId}
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
                    <th className="px-2 py-2 text-left">Batch</th>

                    <th className="px-2 py-2 text-center">Quantity</th>
                    <th className="px-2 py-2 text-center">Rate per</th>
                    {config.showDiscount && (
                      <th className="px-2 py-2 text-center">Discount</th>
                    )}
                    {config.showGST && (
                      <th className="px-2 py-2 text-center">GST %</th>
                    )}
                    <th className="px-2 py-2 text-right">Amount</th>

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
                          value={item.itemId}
                          onChange={(e) =>
                            handleItemChange(index, "itemId", e.target.value)
                          }
                          title="Select Item"
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
                        <select
                          value={(item as any).batchNumber || ""}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "batchNumber",
                              e.target.value
                            )
                          }
                          className={`w-full p-1 rounded border text-sm ${
                            theme === "dark"
                              ? "bg-gray-700 border-gray-600 text-gray-100"
                              : "bg-white border-gray-300 text-gray-900"
                          } focus:border-blue-500`}
                        >
                          <option value="">Select Batch</option>
                          {(item as any).batches?.map((batch: any) => (
                            <option
                              key={batch.id}
                              value={batch.batchName || batch.name}
                            >
                              {batch.batchName || batch.name}
                            </option>
                          ))}
                        </select>
                      </td>

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

                      {config.showGST && (
                        <td className="px-2 py-2 text-center">
                          <span className="text-sm">
                            {(item.cgstRate || 0) +
                              (item.sgstRate || 0) +
                              (item.igstRate || 0)}
                            %
                          </span>
                        </td>
                      )}

                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.amount}
                          readOnly
                          title="Item Amount"
                          className={`w-full p-1 rounded border text-right text-sm ${
                            theme === "dark"
                              ? "bg-gray-600 border-gray-600 text-gray-100"
                              : "bg-gray-100 border-gray-300 text-gray-900"
                          } opacity-60`}
                        />
                      </td>

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
                    {config.showDiscount && (
                      <td className="px-2 py-2 text-right">
                        ₹{totalDiscount.toLocaleString()}
                      </td>
                    )}
                    {config.showGST && (
                      <td className="px-2 py-2 text-right">
                        ₹{totalGST.toLocaleString()}
                      </td>
                    )}
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
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showGST}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showGST: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${
                      theme === "dark" ? "bg-gray-600" : "bg-white"
                    }`}
                  />
                  Show GST
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
            <p className="text-sm">
              Subtotal: ₹{subtotal.toLocaleString()} | GST: ₹
              {totalGST.toLocaleString()} | Discount: ₹
              {totalDiscount.toLocaleString()}
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
            <strong>Note:</strong> Sales Orders are used to confirm orders from
            customers before actual sale.{" "}
            {isIntrastate
              ? "Intrastate transaction - CGST + SGST applicable"
              : "Interstate transaction - IGST applicable"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SalesOrder;
