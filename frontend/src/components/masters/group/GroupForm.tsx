import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../home/context/AuthContext";
import { ArrowLeft, Save } from "lucide-react";
import type {
  LedgerGroup,
  GstClassification,
  LedgerType,
} from "../../../types";
import Swal from "sweetalert2";

interface FormData {
  name: string;
  alias: string;
  under: string;
  type: LedgerType | "";
  nature: "Assets" | "Liabilities" | "Income" | "Expenses" | "";
  behavesLikeSubLedger: string;
  nettBalancesForReporting: string;
  usedForCalculation: string;
  allocationMethod:
    | "Appropriate by Qty"
    | "Appropriate by Value"
    | "No Appropriation"
    | "";
  setAlterHSNSAC: string;
  hsnSacClassificationId: string;
  hsnCode: string;
  hsnSacDescription: string;
  setAlterGST: string;
  gstClassificationId: string;
  typeOfSupply: string;
  taxability: "Taxable" | "Exempt" | "Nil-rated" | "";
  integratedTaxRate: string;
  cess: string;
}

// const baseGroups = [
//   { name: "Branch Accounts", nature: "Assets" },
//   { name: "Branch OD A/c", nature: "Assets" },
//   { name: "Branch/Division", nature: "Assets" },
//   { name: "Capital Account", nature: "Liabilities" },
//   { name: "Current Assets", nature: "Assets" },
//   { name: "Current Liabilities", nature: "Liabilities" },
//   { name: "Direct Expenses", nature: "Expenses" },
//   { name: "Direct Income", nature: "Income" },
//   { name: "Fixed Assets", nature: "Assets" },
//   { name: "Indirect Expenses", nature: "Expenses" },
//   { name: "Indirect Income", nature: "Income" },
//   { name: "Investments", nature: "Assets" },
//   { name: "Loan(Liability)", nature: "Liabilities" },
//   { name: "Misc expenses (Assets)", nature: "Assets" },
//   { name: "Purchase Accounts", nature: "Expenses" },
//   { name: "Sales Accounts", nature: "Income" },
//   { name: "Suspense A/C", nature: "Assets" },
// ];

const baseGroups = [
  { id: -1, name: "Branch Accounts", nature: "Assets" },
  { id: -2, name: "Branch OD A/c", nature: "Assets" },
  { id: -3, name: "Branch/Division", nature: "Assets" },
  { id: -4, name: "Capital Account", nature: "Liabilities" },
  { id: -5, name: "Current Assets", nature: "Assets" },
  { id: -6, name: "Current Liabilities", nature: "Liabilities" },
  { id: -7, name: "Direct Expenses", nature: "Expenses" },
  { id: -8, name: "Direct Income", nature: "Income" },
  { id: -9, name: "Fixed Assets", nature: "Assets" },
  { id: -10, name: "Indirect Expenses", nature: "Expenses" },
  { id: -11, name: "Indirect Income", nature: "Income" },
  { id: -12, name: "Investments", nature: "Assets" },
  { id: -13, name: "Loan(Liability)", nature: "Liabilities" },
  { id: -14, name: "Misc expenses (Assets)", nature: "Assets" },
  { id: -15, name: "Purchase Accounts", nature: "Expenses" },
  { id: -16, name: "Sales Accounts", nature: "Income" },
  { id: -17, name: "Suspense A/C", nature: "Assets" },
];

const GroupForm: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);

  const [gstClassifications] = useState<GstClassification[]>([]);
  const { user, companyId: authCompanyId } = useAuth();

  // Prefer values from AuthContext, fall back to localStorage for backward compatibility
  const companyId = authCompanyId ?? localStorage.getItem("company_id");
  let ownerType = localStorage.getItem("supplier"); // 'employee' or 'user'
  // If userType not present, infer from presence of employee_id in localStorage
  if (!ownerType) {
    ownerType = localStorage.getItem("employee_id") ? "employee" : "user";
  }

  const ownerIdRaw = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );
  // Prefer explicit owner id from localStorage, fall back to authenticated user's id
  const ownerId = ownerIdRaw ?? user?.id ?? null;
  

  const [formData, setFormData] = useState({
    name: "",
    alias: "",
    under: "", // parent id
    type: "",
    nature: "",
    behavesLikeSubLedger: "no",
    nettBalancesForReporting: "no",
    usedForCalculation: "no",
    allocationMethod: "No Appropriation",
    setAlterHSNSAC: "no",
    hsnSacClassificationId: "",
    hsnCode: "",
    hsnSacDescription: "",
    setAlterGST: "no",
    gstClassificationId: "",
    typeOfSupply: "",
    taxability: "",
    integratedTaxRate: "",
    cess: "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  //get all group-list
  useEffect(() => {
    const fetchLedgerGroups = async () => {
      if (!companyId || !ownerType || !ownerId) {
        setLedgerGroups([]);
        return;
      }

      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger-groups?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          setLedgerGroups(data);
        } else {
          setLedgerGroups([]);
        }
      } catch (err) {
        console.error("Failed to load ledger groups", err);
        setLedgerGroups([]);
      }
    };

    fetchLedgerGroups();
  }, [companyId, ownerType, ownerId]);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchGroup = async () => {
        try {
          const res = await fetch(
            `${
              import.meta.env.VITE_API_URL
            }/api/ledger-groups/${id}?ownerType=${ownerType}&ownerId=${ownerId}`
          );
          const data = await res.json();

          if (res.ok) {
            // prefer numeric parent id returned from backend; if parent is negative
            // map to baseGroups to infer nature
            const parentId =
              data.parent !== undefined && data.parent !== null
                ? data.parent
                : null;
            let inferredNature = data.nature ?? "";
            if (parentId !== null && Number(parentId) < 0) {
              const base = baseGroups.find((b) => b.id === Number(parentId));
              if (base) inferredNature = base.nature;
            }

            setFormData({
              name: data.name ?? "",
              alias: data.alias ?? "",
              under: parentId !== null ? String(parentId) : "",

              type: data.type ?? "",
              nature: inferredNature ?? "",

              behavesLikeSubLedger:
                data.behavesLikeSubLedger == 1 ? "yes" : "no",
              nettBalancesForReporting:
                data.nettBalancesForReporting == 1 ? "yes" : "no",
              usedForCalculation: data.usedForCalculation == 1 ? "yes" : "no",

              allocationMethod: data.allocationMethod ?? "No Appropriation",

              setAlterHSNSAC: data.setAlterHSNSAC == 1 ? "yes" : "no",
              hsnSacClassificationId: data.hsnSacClassificationId ?? "",
              hsnCode: data.hsnCode ?? "",
              hsnSacDescription: data.hsnSacDescription ?? "",

              setAlterGST: data.setAlterGST == 1 ? "yes" : "no",
              gstClassificationId: data.gstClassificationId ?? "",

              typeOfSupply: data.typeOfSupply ?? "",
              taxability: data.taxability ?? "",

              integratedTaxRate: data.integratedTaxRate?.toString() ?? "",
              cess: data.cess?.toString() ?? "",
            });
          } else {
            Swal.fire(
              "Error",
              data.message || "Failed to fetch group details",
              "error"
            );
          }
        } catch (err) {
          console.error("Error fetching group:", err);
          Swal.fire(
            "Error",
            "Something went wrong while loading data!",
            "error"
          );
        }
      };

      fetchGroup();
    }
  }, [id, isEditMode]);


  useEffect(() => {
    if (formData.setAlterHSNSAC === "yes" && formData.hsnSacClassificationId) {
      const classification = gstClassifications.find(
        (c) => c.id === formData.hsnSacClassificationId
      );
      if (classification) {
        setFormData((prev) => ({
          ...prev,
          hsnCode: classification.hsnCode || prev.hsnCode,
          hsnSacDescription: classification.name || prev.hsnSacDescription,
        }));
      }
    }
    if (formData.setAlterGST === "yes" && formData.gstClassificationId) {
      const classification = gstClassifications.find(
        (c) => c.id === formData.gstClassificationId
      );
      if (classification) {
        setFormData((prev) => ({
          ...prev,
          integratedTaxRate:
            classification.gstRate?.toString() || prev.integratedTaxRate,
          cess: classification.cess?.toString() || prev.cess,
        }));
      }
    }
  }, [
    formData.hsnSacClassificationId,
    formData.gstClassificationId,
    formData.setAlterHSNSAC,
    formData.setAlterGST,
    gstClassifications,
  ]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    if (!formData.name) newErrors.name = "Group Name is required";
    if (!formData.under) newErrors.under = "Under Group is required";
    if (formData.under === "Primary" && !formData.nature)
      newErrors.nature = "Nature of Group is required for Primary groups";
    if (formData.setAlterHSNSAC === "yes" && !formData.hsnSacClassificationId)
      newErrors.hsnSacClassificationId = "HSN/SAC Classification is required";
    if (formData.setAlterGST === "yes" && !formData.gstClassificationId)
      newErrors.gstClassificationId = "GST Classification is required";
    if (formData.setAlterGST === "yes" && !formData.typeOfSupply)
      newErrors.typeOfSupply = "Type of Supply is required";
    if (formData.setAlterGST === "yes" && !formData.taxability)
      newErrors.taxability = "Taxability is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  if (name === "under") {
    const parsed = Number(value);

    // 🔹 Case 1: Base Group (negative id)
    if (!isNaN(parsed) && parsed < 0) {
      const base = baseGroups.find((b) => b.id === parsed);

      setFormData((prev) => ({
        ...prev,
        under: value,
        nature: base?.nature ?? "",
        behavesLikeSubLedger: "no",
      }));
      return;
    }

    // 🔹 Case 2: Custom Group (DB group, positive id)
    if (!isNaN(parsed) && parsed > 0) {
      const group = ledgerGroups.find((g) => g.id === parsed);

      setFormData((prev) => ({
        ...prev,
        under: value,
        nature: group?.nature ?? "", // ⭐ FIX HERE
        behavesLikeSubLedger: "no",
      }));
      return;
    }

    // 🔹 Fallback (should not normally hit)
    setFormData((prev) => ({
      ...prev,
      under: value,
      nature: "",
      behavesLikeSubLedger: "no",
    }));
    return;
  }

  setFormData((prev) => ({ ...prev, [name]: value }));
};


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      Swal.fire("Error", "Please fix the errors before submitting.", "error");
      return;
    }

    try {
      const payload = {
        ...formData,
        companyId: Number(companyId),
        ownerType,
        ownerId: Number(ownerId),
      };

      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/api/ledger-groups/${id}`
        : `${import.meta.env.VITE_API_URL}/api/ledger-groups`;

      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire(
          "Success",
          data.message ||
            `Group ${isEditMode ? "updated" : "created"} successfully!`,
          "success"
        );
        navigate("/app/masters/group");
      } else {
        Swal.fire(
          "Error",
          data.message || `Failed to ${isEditMode ? "update" : "create"} group`,
          "error"
        );
      }
    } catch (err) {
      console.error("Error saving group:", err);
      Swal.fire(
        "Error",
        `Something went wrong while ${isEditMode ? "updating" : "creating"}!`,
        "error"
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      navigate("/app/masters/group");
    } else if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === "F12") {
      e.preventDefault();
      alert("Configuration options not implemented yet.");
    }
  };

  const yesNoOptions = [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  const allocationOptions = [
    { value: "Appropriate by Qty", label: "Appropriate by Qty" },
    { value: "Appropriate by Value", label: "Appropriate by Value" },
    { value: "No Appropriation", label: "No Appropriation" },
  ];

  const typeOfSupplyOptions = [
    { value: "Goods", label: "Goods" },
    { value: "Services", label: "Services" },
  ];

  const taxabilityOptions = [
    { value: "Taxable", label: "Taxable" },
    { value: "Exempt", label: "Exempt" },
    { value: "Nil-rated", label: "Nil-rated" },
  ];

  const gstRateOptions = [
    "0",
    "0.1",
    "0.25",
    "1",
    "1.5",
    "3",
    "5",
    "6",
    "7.5",
    "12",
    "18",
    "28",
  ];

  const isPurchaseRelated = (() => {
    const underId = formData.under ? Number(formData.under) : NaN;
    if (!isNaN(underId)) {
      if (underId < 0) {
        const base = baseGroups.find((b) => b.id === underId);
        if (base)
          return (
            /purchase|expense/i.test(base.name) || base.nature === "Expenses"
          );
      } else {
        const group = ledgerGroups.find((g) => g.id === underId);
        if (group)
          return (
            /purchase|expense/i.test(group.name) || group.nature === "Expenses"
          );
      }
    }
    return formData.nature === "Expenses";
  })();

  return (
    <div className="pt-[56px] px-4" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex items-center mb-6">
        <button
          title="Back to Group List"
          onClick={() => navigate("/app/masters/group")}
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
          {isEditMode ? "Edit" : "Create"} Group
        </h1>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="name"
              >
                Group Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${
                  errors.name
                    ? "border-red-500"
                    : theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                } outline-none transition-colors`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="alias"
              >
                Alias
              </label>
              <input
                type="text"
                id="alias"
                name="alias"
                value={formData.alias}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                } outline-none transition-colors`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="under"
              >
                Under *
              </label>
              <select
                id="under"
                name="under"
                value={formData.under}
                
                onChange={handleChange}
                required
                className="w-full p-2 rounded border"
              >
                <option value="">Select Group</option>

                {/* 🔹 Base Groups (hard coded) */}
                {baseGroups.map((g) => (
                  <option key={`base-${g.id}`} value={g.id}>
                    {g.name}
                  </option>
                ))}

                {/* 🔹 Custom Groups (from DB) */}
                {ledgerGroups.map((group) => (
                  <option key={`db-${group.id}`} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>

              {errors.under && (
                <p className="text-red-500 text-xs mt-1">{errors.under}</p>
              )}
            </div>

            {/* 🔹 Nature of Group field always visible */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="nature"
              >
                Nature of Group *
              </label>

              <select
                id="nature"
                name="nature"
                value={formData.nature}
                onChange={handleChange}
                required
                disabled={!!formData.under}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                } ${
                  formData.under && Number(formData.under) < 0
                    ? "cursor-not-allowed text-gray-400"
                    : ""
                }`}
              >
                <option value="">Select Nature</option>
                <option value="Assets">Assets</option>
                <option value="Liabilities">Liabilities</option>
                <option value="Income">Income</option>
                <option value="Expenses">Expenses</option>
              </select>

              {errors.nature && (
                <p className="text-red-500 text-xs mt-1">{errors.nature}</p>
              )}
            </div>

            {/* 🔹 Base Group Selected — Auto Behavior */}
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="behavesLikeSubLedger"
              >
                Group Behaves Like a Sub-Ledger
              </label>

              <select
                id="behavesLikeSubLedger"
                name="behavesLikeSubLedger"
                value={formData.behavesLikeSubLedger}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                } outline-none transition-colors`}
              >
                {yesNoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 🔹 Custom Group — Normal Editable Option */}

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="nettBalancesForReporting"
              >
                Nett Debit/Credit Balances for Reporting
              </label>
              <select
                id="nettBalancesForReporting"
                name="nettBalancesForReporting"
                value={formData.nettBalancesForReporting}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  errors.under
                    ? "border-red-500"
                    : theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                } outline-none transition-colors`}
              >
                {yesNoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="usedForCalculation"
              >
                Used for Calculation (e.g., Taxes, Discounts)
              </label>
              <select
                id="usedForCalculation"
                name="usedForCalculation"
                value={formData.usedForCalculation}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  errors.under
                    ? "border-red-500"
                    : theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                } outline-none transition-colors`}
              >
                {yesNoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {isPurchaseRelated && (
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                  htmlFor="allocationMethod"
                >
                  Method to Allocate when Used in Purchase Ledger
                </label>
                <select
                  id="allocationMethod"
                  name="allocationMethod"
                  value={formData.allocationMethod}
                  onChange={handleChange}
                  className={`w-full p-2 rounded border ${
                    errors.under
                      ? "border-red-500"
                      : theme === "dark"
                      ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                      : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                  } outline-none transition-colors`}
                >
                  {allocationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="setAlterHSNSAC"
              >
                Set/Alter HSN/SAC Details
              </label>
              <select
                id="setAlterHSNSAC"
                name="setAlterHSNSAC"
                value={formData.setAlterHSNSAC}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  errors.under
                    ? "border-red-500"
                    : theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                } outline-none transition-colors`}
              >
                {yesNoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.setAlterHSNSAC === "yes" && (
              <>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                    htmlFor="hsnSacClassificationId"
                  >
                    HSN/SAC Classification *
                  </label>
                  <select
                    id="hsnSacClassificationId"
                    name="hsnSacClassificationId"
                    value={formData.hsnSacClassificationId}
                    onChange={handleChange}
                    required
                    className={`w-full p-2 rounded border ${
                      errors.under
                        ? "border-red-500"
                        : theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                        : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                    } outline-none transition-colors`}
                  >
                    <option value="">Select Classification</option>
                    {allocationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.hsnSacClassificationId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.hsnSacClassificationId}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                    htmlFor="hsnCode"
                  >
                    HSN/SAC Code *
                  </label>
                  <input
                    type="text"
                    id="hsnCode"
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleChange}
                    required
                    className={`w-full p-2 rounded border ${
                      errors.under
                        ? "border-red-500"
                        : theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                        : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                    } outline-none transition-colors`}
                  />
                  {errors.hsnCode && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.hsnCode}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                    htmlFor="hsnSacDescription"
                  >
                    HSN/SAC Description
                  </label>
                  <input
                    type="text"
                    id="hsnSacDescription"
                    name="hsnSacDescription"
                    value={formData.hsnSacDescription}
                    onChange={handleChange}
                    className={`w-full p-2 rounded border ${
                      errors.under
                        ? "border-red-500"
                        : theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                        : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                    } outline-none transition-colors`}
                  />
                </div>
              </>
            )}

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
                htmlFor="setAlterGST"
              >
                Set/Alter GST Details
              </label>
              <select
                id="setAlterGST"
                name="setAlterGST"
                value={formData.setAlterGST}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${
                  errors.under
                    ? "border-red-500"
                    : theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                    : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                } outline-none transition-colors`}
              >
                {yesNoOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.setAlterGST === "yes" && (
              <>
                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                    htmlFor="gstClassificationId"
                  >
                    GST Classification *
                  </label>
                  <select
                    id="gstClassificationId"
                    name="gstClassificationId"
                    value={formData.gstClassificationId}
                    onChange={handleChange}
                    required
                    className={`w-full p-2 rounded border ${
                      errors.under
                        ? "border-red-500"
                        : theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                        : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                    } outline-none transition-colors`}
                  >
                    <option value="">Select Classification</option>
                    {allocationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.gstClassificationId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.gstClassificationId}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                    htmlFor="typeOfSupply"
                  >
                    Type of Supply *
                  </label>
                  <select
                    id="typeOfSupply"
                    name="typeOfSupply"
                    value={formData.typeOfSupply}
                    onChange={handleChange}
                    required
                    className={`w-full p-2 rounded border ${
                      errors.under
                        ? "border-red-500"
                        : theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                        : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                    } outline-none transition-colors`}
                  >
                    <option value="">Select Type</option>
                    {typeOfSupplyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.typeOfSupply && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.typeOfSupply}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                    htmlFor="taxability"
                  >
                    Taxability *
                  </label>
                  <select
                    id="taxability"
                    name="taxability"
                    value={formData.taxability}
                    onChange={handleChange}
                    required
                    className={`w-full p-2 rounded border ${
                      errors.under
                        ? "border-red-500"
                        : theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                        : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                    } outline-none transition-colors`}
                  >
                    <option value="">Select Taxability</option>
                    {taxabilityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.taxability && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.taxability}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                    htmlFor="integratedTaxRate"
                  >
                    Integrated Tax Rate (%) *
                  </label>
                  <select
                    id="integratedTaxRate"
                    name="integratedTaxRate"
                    value={formData.integratedTaxRate}
                    onChange={handleChange}
                    required={formData.taxability === "Taxable"}
                    className={`w-full p-2 rounded border ${
                      errors.under
                        ? "border-red-500"
                        : theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                        : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                    } outline-none transition-colors`}
                  >
                    <option value="">Select Rate</option>
                    {gstRateOptions.map((rate) => (
                      <option key={rate} value={rate}>
                        {rate}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    className={`block text-sm font-medium mb-1 ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}
                    htmlFor="cess"
                  >
                    Cess (%)
                  </label>
                  <input
                    type="number"
                    id="cess"
                    name="cess"
                    value={formData.cess}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={`w-full p-2 rounded border ${
                      errors.under
                        ? "border-red-500"
                        : theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                        : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                    } outline-none transition-colors`}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              title="Cancel Group Creation"
              type="button"
              onClick={() => navigate("/app/masters/group")}
              className={`px-4 py-2 rounded text-sm font-medium ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}
            >
              Cancel
            </button>
            <button
              title="Save Group"
              type="submit"
              className={`flex items-center px-4 py-2 rounded text-sm font-medium ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Save size={18} className="mr-1" />
              {isEditMode ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Keyboard Shortcuts:</span> Ctrl+A to
          save, Esc to cancel, F12 to configure.
        </p>
      </div>
    </div>
  );
};

export default GroupForm;
