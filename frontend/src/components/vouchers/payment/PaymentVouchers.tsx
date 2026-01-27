import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import { Save, Plus, Trash2, ArrowLeft, Printer, Settings } from "lucide-react";
import type { VoucherEntry, Ledger } from "../../../types";
import Swal from "sweetalert2";
interface Ledgers {
  id: number;
  name: string;
  groupName: string;
}
const PaymentVoucher: React.FC = () => {
  const { theme, vouchers, companyInfo } = useAppContext();

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = !!id;
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [_originalEntries, setOriginalEntries] = useState<any[]>([]);

  const [cashBankLedgers, setCashBankLedgers] = useState<Ledgers[]>([]);
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  const initialFormData: Omit<VoucherEntry, "id"> = {
    date: new Date().toISOString().split("T")[0],
    type: "payment",
    number: "",
    narration: "",
    entries: [
      { id: "1", ledgerId: "", amount: 0, type: "debit", narration: "" },
      { id: "2", ledgerId: "", amount: 0, type: "credit", narration: "" },
    ],
    mode: "double-entry",
    referenceNo: "",
    supplierInvoiceDate: "",
  };

  const [formData, setFormData] = useState<Omit<VoucherEntry, "id">>(
    isEditMode
      ? vouchers.find((v) => v.id === id) || initialFormData
      : initialFormData
  );

  //auto voucher number fill

  useEffect(() => {
    if (isEditMode) return;
    if (!companyId || !ownerType || !ownerId) return;

    const fetchNextNumber = async () => {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/vouchers/next-number` +
        `?company_id=${companyId}` +
        `&owner_type=${ownerType}` +
        `&owner_id=${ownerId}` +
        `&voucherType=payment` +
        `&date=${formData.date}`
      );

      const data = await res.json();

      if (data.success) {
        setFormData((prev) =>
          prev.number ? prev : { ...prev, number: data.voucherNumber }
        );
      }
    };

    fetchNextNumber();
  }, [formData.date, companyId, ownerType, ownerId]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [config, setConfig] = useState({
    autoNumbering: true,
    showReference: true,
    showBankDetails: true,
    showCostCentre: false,
    showEntryNarration: false,
  });

  // Mock cost centres
  const costCentres = useMemo(
    () => [
      { id: "CC1", name: "Washing Department" },
      { id: "CC2", name: "Polishing Department" },
    ],
    []
  );

  //get single Data
  // =====================
  // FETCH SINGLE VOUCHER
  // =====================
  useEffect(() => {
    if (!id) return;

    const fetchVoucher = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/vouchers/${id}`
        );
        const json = await res.json();

        // Backend returns { data: {...} }
        const v = json.data;

        if (!v) {
          console.error("Invalid response format", json);
          return;
        }

        // -----------------------------
        // FIX: Convert backend entries
        // -----------------------------
        const mappedEntries = (v.entries || []).map((e: any) => ({
          id: e.id?.toString() || "",
          ledgerId: e.ledger_id?.toString() || "",
          amount: Number(e.amount) || 0,
          type: e.type,
          narration: e.narration || "",
          bankName: e.bank_name || "",
          chequeNumber: e.cheque_number || "",
          costCentreId: e.cost_centre_id?.toString() || "",
        }));

        // -----------------------------
        // FIX: Convert supplier date to YYYY-MM-DD
        // -----------------------------
        const formattedSupplierInvoiceDate = v.supplier_invoice_date
          ? v.supplier_invoice_date.substring(0, 10)
          : "";

        // -----------------------------
        // SET FORM DATA
        // -----------------------------
        setFormData((prev) => ({
          ...prev,
          number: v.number || "",
          type: v.type || "payment",
          date: v.date ? v.date.substring(0, 10) : "",
          narration: v.narration || "",
          referenceNo: v.reference_no || "",
          supplierInvoiceDate: formattedSupplierInvoiceDate,
          ownerType: v.owner_type || "",
          ownerId: v.owner_id || "",

          // auto-fill entries
          entries: mappedEntries,
        }));

        // Save for edit comparison
        setOriginalEntries(mappedEntries);
      } catch (err) {
        console.error("Error fetching voucher:", err);
      }
    };

    fetchVoucher();
  }, [id]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const messages: string[] = [];

    const addError = (key: string, msg: string) => {
      if (!newErrors[key]) {
        newErrors[key] = msg;
        messages.push(msg);
      }
    };

    // ===== HEADER LEVEL =====
    if (!formData.date) addError("date", "Voucher Date is required");
    // if (!formData.number) addError("number", "Voucher Number is required");

    // ===== SUPPLIER INVOICE DATE (MANDATORY) =====
    if (!formData.supplierInvoiceDate) {
      addError("supplierInvoiceDate", "Supplier Invoice Date is required");
    }

    // ===== ENTRY EXISTENCE =====
    if (!formData.entries || formData.entries.length === 0) {
      addError("entries", "At least one entry is required");
    }

    // ===== ENTRY LEVEL VALIDATION =====
    formData.entries.forEach((entry, index) => {
      const row = index + 1;

      if (!entry.ledgerId) {
        addError(`ledgerId${index}`, `Row ${row}: Ledger is required`);
      }

      if (!entry.amount || Number(entry.amount) <= 0) {
        addError(`amount${index}`, `Row ${row}: Amount must be greater than 0`);
      }
    });

    // ===== MODE-SPECIFIC RULES =====
    if (formData.mode === "single-entry") {
      if (formData.entries.length < 2) {
        addError(
          "entries",
          "Single-entry mode requires at least one party entry"
        );
      }
    }

    // ===== BALANCE CHECK (DOUBLE ENTRY) =====
    const totalDebit = formData.entries
      .filter((e) => e.type === "debit")
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    const totalCredit = formData.entries
      .filter((e) => e.type === "credit")
      .reduce((s, e) => s + Number(e.amount || 0), 0);

    if (formData.mode === "double-entry" && totalDebit !== totalCredit) {
      addError(
        "balance",
        `Debit (${totalDebit}) and Credit (${totalCredit}) are not balanced`
      );
    }

    setErrors(newErrors);

    return {
      isValid: messages.length === 0,
      messages,
    };
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleEntryChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const updatedEntries = [...formData.entries];

    updatedEntries[index] = {
      ...updatedEntries[index],
      [name]:
        type === "number" ? (value === "" ? "" : parseFloat(value)) : value,
    };

    // SINGLE ENTRY FIXED LOGIC
    if (formData.mode === "single-entry") {
      // Entry[0] → Credit (Cash/Bank)
      updatedEntries[0].type = "credit";

      // Ensure Entry[1] always exists
      if (!updatedEntries[1]) {
        updatedEntries.push({
          id: "2",
          ledgerId: "",
          amount: 0,
          type: "debit",
          narration: "",
        });
      }

      // Entry[1] → Debit (Party Ledger)
      updatedEntries[1].type = "debit";

      // Auto balance
      updatedEntries[0].amount = Number(updatedEntries[1].amount) || 0;
    }

    setFormData((prev) => ({ ...prev, entries: updatedEntries }));
    setErrors((prev) => ({ ...prev, [`${name}${index}`]: "" }));

    if (e.target.value === "add-new") {
      navigate("/app/masters/ledger/create");
    }
  };

  const addEntry = () => {
    setFormData((prev) => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: (prev.entries.length + 1).toString(),
          ledgerId: "",
          amount: 0,
          type: "credit",
          narration: "",
        },
      ],
    }));
  };

  const removeEntry = (index: number) => {
    const updatedEntries = [...formData.entries];

    // 🟢 Single-entry → kam se kam 1 entry rehni chahiye
    if (formData.mode === "single-entry") {
      if (updatedEntries.length <= 1) return; // stop if only one left
      updatedEntries.splice(index, 1);
    }

    // 🔵 Double-entry → kam se kam 2 entry rehni chahiye
    else if (formData.mode === "double-entry") {
      if (updatedEntries.length <= 2) return; // stop if only two left
      updatedEntries.splice(index, 1);
    }

    setFormData((prev) => ({
      ...prev,
      entries: updatedEntries,
    }));

    setErrors((prev) => ({
      ...prev,
      [`ledgerId${index}`]: "",
      [`amount${index}`]: "",
    }));
  };

  useEffect(() => {
    fetch(
      `${import.meta.env.VITE_API_URL
      }/api/ledger/cash-bank?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((res) => res.json())
      .then((data) => {
        setCashBankLedgers(data);
      })
      .catch((err) => console.error("Ledger fetch error:", err));
  }, []);

  useEffect(() => {
    const fetchLedgers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setLedgers(data);
      } catch (err) {
        console.error("Failed to load ledgers", err);
      }
    };

    fetchLedgers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { isValid, messages } = validateForm();

    if (!isValid) {
      Swal.fire({
        icon: "warning",
        title: "Please fix the following errors",
        html: `
        <ul style="text-align:left; margin-left:16px">
          ${messages.map((m) => `<li>• ${m}</li>`).join("")}
        </ul>
      `,
        confirmButtonText: "OK",
      });
      return;
    }

    const payload = {
      type: formData.type,
      mode: formData.mode,
      date: formData.date,
      number: formData.number,
      narration: formData.narration,
      referenceNo: formData.referenceNo,
      supplierInvoiceDate: formData.supplierInvoiceDate || null,
      entries: formData.entries,
      owner_type: ownerType,
      owner_id: ownerId,
      companyId: companyId,
    };

    try {
      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/api/vouchers/${id}`
        : `${import.meta.env.VITE_API_URL}/api/vouchers`;

      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: data.message || "Voucher saved successfully!",
      }).then(() => navigate("/app/voucher-register/payment"));
    } catch (error: any) {
      console.error("Error submitting voucher:", error);
      Swal.fire("Error", error.message || "Failed to save voucher.", "error");
    }
  };

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Payment Voucher</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            </style>
          </head>
          <body>
            <h1>${companyInfo?.name || "Hanuman Car Wash"
        } - Payment Voucher</h1>
            <table>
              <tr><th>Voucher No.</th><td>${formData.number}</td></tr>
              <tr><th>Date</th><td>${formData.date}</td></tr>
              <tr><th>Mode</th><td>${formData.mode === "double-entry"
          ? "Double Entry"
          : "Single Entry"
        }</td></tr>
              ${formData.referenceNo
          ? `<tr><th>Reference No.</th><td>${formData.referenceNo}</td></tr>`
          : ""
        }
              ${formData.supplierInvoiceDate
          ? `<tr><th>Supplier Invoice Date</th><td>${formData.supplierInvoiceDate}</td></tr>`
          : ""
        }
              <tr><th>Narration</th><td>${formData.narration || "N/A"}</td></tr>
            </table>
            <h2>Entries</h2>
            <table>
              <thead>
                <tr>
                  <th>Ledger</th>
                  <th>Type</th>
                  <th>Amount</th>
                  ${config.showEntryNarration ? "<th>Narration</th>" : ""}
                  ${config.showCostCentre ? "<th>Cost Centre</th>" : ""}
                </tr>
              </thead>
              <tbody>
                ${formData.entries
          .map(
            (entry) => `
                  <tr>
                    <td>${ledgers.find((l) => l.id === entry.ledgerId)?.name ||
              "N/A"
              }</td>
                    <td>${entry.type === "debit" ? "Dr" : "Cr"}</td>
                    <td>${entry.amount.toLocaleString()}</td>
                    ${config.showEntryNarration
                ? `<td>${entry.narration || "N/A"}</td>`
                : ""
              }
                    ${config.showCostCentre
                ? `<td>${entry.costCentreId
                  ? costCentres.find(
                    (c) => c.id === entry.costCentreId
                  )?.name || "N/A"
                  : "N/A"
                }</td>`
                : ""
              }
                  </tr>
                `
          )
          .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td>Totals</td>
                  <td></td>
                  <td>Dr: ${formData.entries
          .filter((e) => e.type === "debit")
          .reduce((sum, e) => sum + e.amount, 0)
          .toLocaleString()}<br/>
                      Cr: ${formData.entries
          .filter((e) => e.type === "credit")
          .reduce((sum, e) => sum + e.amount, 0)
          .toLocaleString()}</td>
                  ${config.showEntryNarration ? "<td></td>" : ""}
                  ${config.showCostCentre ? "<td></td>" : ""}
                </tr>
              </tfoot>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [formData, config, companyInfo, ledgers, costCentres]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSubmit({ preventDefault: () => { } } as React.FormEvent);
      } else if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "F12") {
        e.preventDefault();
        setShowConfigPanel(!showConfigPanel);
      } else if (e.key === "Escape") {
        navigate("/app/vouchers");
      }
    },
    [showConfigPanel, navigate, handleSubmit, handlePrint]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const totalDebit = formData.entries
    .filter((entry) => entry.type === "debit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const totalCredit = formData.entries
    .filter((entry) => entry.type === "credit")
    .reduce((sum, entry) => sum + entry.amount, 0);
  const isBalanced = totalDebit === totalCredit;

  return (
    <div
      className={`pt-[56px] px-4 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"
        }`}
    >
      <div className="flex items-center mb-6">
        <button
          title="Back to Vouchers"
          onClick={() => navigate("/app/vouchers")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className={`text-2xl font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
        >
          {isEditMode ? "Edit Payment Voucher" : "New Payment Voucher"}
        </h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Save Voucher"
            onClick={handleSubmit}
            className={`p-2 rounded-md ${theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
              } text-white flex items-center`}
          >
            <Save size={18} className="mr-2" /> Save
          </button>
          <button
            title="Print Voucher"
            onClick={handlePrint}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Configure"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      <div
        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                title="Select voucher date"
                className={`w-full p-2 rounded border ${theme === "dark"
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
                className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                Voucher No.
              </label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder={
                  config.autoNumbering ? "Auto" : "Enter voucher number"
                }
                readOnly={config.autoNumbering}
                required
                className={`w-full p-2 rounded border ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                  } focus:border-blue-500 focus:ring-blue-500 ${config.autoNumbering ? "opacity-50" : ""
                  }`}
              />
              {errors.number && (
                <p className="text-red-500 text-sm mt-1">{errors.number}</p>
              )}
            </div>
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
              >
                Mode
              </label>
              <select
                name="mode"
                value={formData.mode}
                title="Select voucher mode "
                onChange={(e) => {
                  const mode = e.target.value as
                    | "double-entry"
                    | "single-entry";

                  setFormData((prev) => ({
                    ...prev,
                    mode,
                    entries:
                      mode === "single-entry"
                        ? [
                          {
                            id: "1",
                            ledgerId: "", // CASH/BANK Ledger
                            amount: 0,
                            type: "credit",
                            narration: "",
                          },
                          {
                            id: "2",
                            ledgerId: "", // Party Ledger
                            amount: 0,
                            type: "debit",
                            narration: "",
                          },
                        ]
                        : [
                          {
                            id: "1",
                            ledgerId: "",
                            amount: 0,
                            type: "debit",
                            narration: "",
                          },
                          {
                            id: "2",
                            ledgerId: "",
                            amount: 0,
                            type: "credit",
                            narration: "",
                          },
                        ],
                  }));
                }}
                className={`w-full p-2 rounded border ${theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                  } focus:border-blue-500 focus:ring-blue-500`}
              >
                <option value="double-entry">Double Entry</option>
                <option value="single-entry">Single Entry</option>
              </select>
            </div>
            {config.showReference && (
              <>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    Reference No.
                  </label>
                  <input
                    type="text"
                    name="referenceNo"
                    value={formData.referenceNo}
                    onChange={handleChange}
                    className={`w-full p-2 rounded border ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-white border-gray-300 text-gray-900"
                      } focus:border-blue-500 focus:ring-blue-500`}
                    placeholder="Enter reference number"
                  />
                </div>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    Supplier Invoice Date
                  </label>
                  <input
                    type="date"
                    name="supplierInvoiceDate"
                    value={formData.supplierInvoiceDate}
                    onChange={handleChange}
                    title="Select supplier invoice date"
                    placeholder="Select supplier invoice date"
                    className={`w-full p-2 rounded border ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-white border-gray-300 text-gray-900"
                      } focus:border-blue-500 focus:ring-blue-500`}
                  />
                </div>
              </>
            )}
          </div>
          {formData.mode === "single-entry" && (
            <div
              className={`p-4 mb-6 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}
            >
              {/* Payment Ledger (Credit) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                      }`}
                  >
                    Payment Ledger (Cash/Bank)
                    <span className="text-green-500 italic">(Credit)</span>
                  </label>

                  <select
                    name="ledgerId"
                    value={formData.entries[0]?.ledgerId || ""}
                    onChange={(e) => handleEntryChange(0, e)}
                    required
                    className={`w-full p-2 rounded border ${theme === "dark"
                        ? "bg-gray-700 border-gray-600 text-gray-100"
                        : "bg-white border-gray-300 text-gray-900"
                      } focus:border-blue-500 focus:ring-blue-500`}
                  >
                    <option value="">Select Cash/Bank Ledger</option>

                    {/* 💥 Hardcoded Cash/Bank List inside map */}
                    {ledgers.map((ledger) => (
                      <option key={ledger.id} value={ledger.id}>
                        {ledger.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ---------------- Entries Table ---------------- */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Entries</h3>
                <button
                  type="button"
                  onClick={addEntry}
                  className={`flex items-center text-sm px-2 py-1 rounded ${theme === "dark"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  <Plus size={16} className="mr-1" /> Add Line
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full mb-4">
                  <thead>
                    <tr
                      className={`${theme === "dark"
                          ? "border-b border-gray-600"
                          : "border-b border-gray-300"
                        }`}
                    >
                      <th className="px-4 py-2 text-left">
                        Party Ledger{" "}
                        <span className="text-red-400 italic">(Debit)</span>
                      </th>

                      {/* ❌ DR/CR COLUMN REMOVED */}

                      <th className="px-4 py-2 text-right">Amount</th>
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {/* 👉 Entry[0] = Cash/Bank (Credit) — UI me show nahi karenge */}
                    {formData.entries.slice(1).map((entry, i) => {
                      const index = i + 1; // Actual index in full entries array

                      return (
                        <tr
                          key={index}
                          className={`${theme === "dark"
                              ? "border-b border-gray-600"
                              : "border-b border-gray-300"
                            }`}
                        >
                          <td className="px-4 py-2">
                            <select
                              name="ledgerId"
                              value={entry.ledgerId}
                              onChange={(e) => handleEntryChange(index, e)}
                              required
                              className={`w-full p-2 rounded border ${theme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-gray-100"
                                  : "bg-white border-gray-300 text-gray-900"
                                } focus:border-blue-500 focus:ring-blue-500`}
                            >
                              <option value="">Select Party Ledger</option>
                              {ledgers.map((ledger) => (
                                <option key={ledger.id} value={ledger.id}>
                                  {ledger.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="px-4 py-2">
                            <input
                              type="number"
                              name="amount"
                              value={entry.amount}
                              onChange={(e) => handleEntryChange(index, e)}
                              required
                              min="0"
                              step="0.01"
                              placeholder="0.00"
                              className={`w-full p-2 rounded border text-right ${theme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-gray-100"
                                  : "bg-white border-gray-300 text-gray-900"
                                } focus:border-blue-500 focus:ring-blue-500`}
                            />
                          </td>

                          <td className="px-4 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeEntry(index)}
                              disabled={formData.entries.length <= 2}
                              className={`p-1 rounded ${formData.entries.length <= 2
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
                      className={`font-semibold ${theme === "dark"
                          ? "border-t border-gray-600"
                          : "border-t border-gray-300"
                        }`}
                    >
                      <td className="px-4 py-2 text-right">Totals:</td>

                      <td className="px-4 py-2 text-right">
                        {totalDebit.toLocaleString()}
                      </td>

                      <td className="px-4 py-2 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs ${theme === "dark"
                              ? isBalanced
                                ? "bg-green-900 text-green-200"
                                : "bg-red-900 text-red-200"
                              : isBalanced
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                        >
                          {isBalanced ? "Balanced" : "Unbalanced"}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {formData.mode === "double-entry" && (
            <div
              className={`p-4 mb-6 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Entries</h3>
                <button
                  type="button"
                  onClick={addEntry}
                  className={`flex items-center text-sm px-2 py-1 rounded ${theme === "dark"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                    }`}
                >
                  <Plus size={16} className="mr-1" /> Add Line
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full mb-4">
                  <thead>
                    <tr
                      className={`${theme === "dark"
                          ? "border-b border-gray-600"
                          : "border-b border-gray-300"
                        }`}
                    >
                      <th className="px-4 py-2 text-left">Ledger Account</th>
                      <th className="px-4 py-2 text-left">Dr/Cr</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                      {config.showCostCentre && (
                        <th className="px-4 py-2 text-left">Cost Centre</th>
                      )}
                      {config.showEntryNarration && (
                        <th className="px-4 py-2 text-left">Narration</th>
                      )}
                      <th className="px-4 py-2 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.entries.map((entry, index) => (
                      <tr
                        key={index}
                        className={`${theme === "dark"
                            ? "border-b border-gray-600"
                            : "border-b border-gray-300"
                          }`}
                      >
                        <td className="px-4 py-2">
                          <select
                            name="ledgerId"
                            value={entry.ledgerId}
                            onChange={(e) => handleEntryChange(index, e)}
                            required
                            title="Select ledger account"
                            className={`w-full p-2 rounded border ${theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                              } focus:border-blue-500 focus:ring-blue-500`}
                          >
                            <option value="">Select Ledger</option>
                            {ledgers.map((ledger: Ledger) => (
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
                          {errors[`ledgerId${index}`] && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors[`ledgerId${index}`]}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            name="type"
                            value={entry.type}
                            onChange={(e) => handleEntryChange(index, e)}
                            required
                            disabled={index === 0} // First entry always Dr
                            title={
                              index === 0
                                ? "Debit is fixed for first entry"
                                : "Select debit or credit"
                            }
                            className={`w-full p-2 rounded border ${theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                              } ${index === 0 ? "opacity-60 cursor-not-allowed" : ""
                              } focus:border-blue-500 focus:ring-blue-500`}
                          >
                            <option value="debit">Dr</option>
                            {index !== 0 && <option value="credit">Cr</option>}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            name="amount"
                            value={entry.amount}
                            onChange={(e) => handleEntryChange(index, e)}
                            required
                            min="0"
                            step="0.01"
                            title="Enter amount"
                            placeholder="0.00"
                            className={`w-full p-2 rounded border text-right ${theme === "dark"
                                ? "bg-gray-700 border-gray-600 text-gray-100"
                                : "bg-white border-gray-300 text-gray-900"
                              } focus:border-blue-500 focus:ring-blue-500`}
                          />
                          {errors[`amount${index}`] && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors[`amount${index}`]}
                            </p>
                          )}
                        </td>
                        {config.showCostCentre && (
                          <td className="px-4 py-2">
                            <select
                              name="costCentreId"
                              value={entry.costCentreId || ""}
                              onChange={(e) => handleEntryChange(index, e)}
                              title="Select cost centre"
                              className={`w-full p-2 rounded border ${theme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-gray-100"
                                  : "bg-white border-gray-300 text-gray-900"
                                } focus:border-blue-500 focus:ring-blue-500`}
                            >
                              <option value="">None</option>
                              {costCentres.map((cc) => (
                                <option key={cc.id} value={cc.id}>
                                  {cc.name}
                                </option>
                              ))}
                            </select>
                          </td>
                        )}
                        {config.showEntryNarration && (
                          <td className="px-4 py-2">
                            <input
                              type="text"
                              name="narration"
                              value={entry.narration || ""}
                              onChange={(e) => handleEntryChange(index, e)}
                              className={`w-full p-2 rounded border ${theme === "dark"
                                  ? "bg-gray-700 border-gray-600 text-gray-100"
                                  : "bg-white border-gray-300 text-gray-900"
                                } focus:border-blue-500 focus:ring-blue-500`}
                              placeholder="Entry narration"
                            />
                          </td>
                        )}
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => removeEntry(index)}
                            disabled={formData.entries.length <= 2}
                            title="Remove entry"
                            className={`p-1 rounded ${formData.entries.length <= 2
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
                      <td className="px-4 py-2 text-right" colSpan={2}>
                        Totals:
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex flex-col">
                          <span>Dr: {totalDebit.toLocaleString()}</span>
                          <span>Cr: {totalCredit.toLocaleString()}</span>
                        </div>
                      </td>
                      <td
                        className="px-4 py-2 text-center"
                        colSpan={
                          config.showCostCentre && config.showEntryNarration
                            ? 3
                            : config.showCostCentre || config.showEntryNarration
                              ? 2
                              : 1
                        }
                      >
                        {isBalanced ? (
                          <span
                            className={`px-2 py-1 rounded text-xs ${theme === "dark"
                                ? "bg-green-900 text-green-200"
                                : "bg-green-100 text-green-800"
                              }`}
                          >
                            Balanced
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-1 rounded text-xs ${theme === "dark"
                                ? "bg-red-900 text-red-200"
                                : "bg-red-100 text-red-800"
                              }`}
                          >
                            Unbalanced
                          </span>
                        )}
                      </td>
                    </tr>
                    {errors.balance && (
                      <tr>
                        <td
                          colSpan={
                            config.showCostCentre && config.showEntryNarration
                              ? 5
                              : config.showCostCentre ||
                                config.showEntryNarration
                                ? 4
                                : 3
                          }
                        >
                          <p className="text-red-500 text-sm mt-1">
                            {errors.balance}
                          </p>
                        </td>
                      </tr>
                    )}
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label
              className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
            >
              Narration
            </label>
            <textarea
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              rows={3}
              title="Enter narration details"
              placeholder="Enter any additional notes or description for this voucher"
              className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
                } focus:border-blue-500 focus:ring-blue-500`}
            />
          </div>

          {showConfigPanel && (
            <div
              className={`p-4 mb-6 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}
            >
              <h3 className="font-semibold mb-4">Configuration (F12)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`mr-2 ${theme === "dark" ? "bg-gray-600" : "bg-white"
                      }`}
                  />
                  Auto Numbering
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showReference}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showReference: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${theme === "dark" ? "bg-gray-600" : "bg-white"
                      }`}
                  />
                  Show Reference Fields
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showBankDetails}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showBankDetails: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${theme === "dark" ? "bg-gray-600" : "bg-white"
                      }`}
                  />
                  Show Bank Details
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showCostCentre}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showCostCentre: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${theme === "dark" ? "bg-gray-600" : "bg-white"
                      }`}
                  />
                  Show Cost Centre
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={config.showEntryNarration}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        showEntryNarration: e.target.checked,
                      }))
                    }
                    className={`mr-2 ${theme === "dark" ? "bg-gray-600" : "bg-white"
                      }`}
                  />
                  Show Narration per Entry
                </label>
              </div>
            </div>
          )}
        </form>
      </div>

      <div
        className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
          }`}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Keyboard Shortcuts:</span> Ctrl+S to
          save, Ctrl+P to print, F12 to configure, Esc to cancel.
        </p>
      </div>
    </div>
  );
};

export default PaymentVoucher;
