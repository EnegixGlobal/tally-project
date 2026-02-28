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
  nature: "Assets" | "Liabilities" | "Income" | "Expenses" | "";
}

const baseGroups = [
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
  { id: -18, name: "Profit/Loss", nature: "Liabilities" },
  { id: -19, name: "TDS Payables", nature: "Liabilities" },
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

  const [formData, setFormData] = useState<FormData>({
    name: "",
    alias: "",
    under: "",
    nature: "",
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
          `${import.meta.env.VITE_API_URL
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
            `${import.meta.env.VITE_API_URL
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
              nature: inferredNature ?? "",
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

  const validateForm = () => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name) newErrors.name = "Group Name is required";
    if (!formData.under) newErrors.under = "Under Group is required";
    if (!formData.nature) newErrors.nature = "Nature is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "under") {
      const id = Number(value);

      // Base group
      if (id < 0) {
        const base = baseGroups.find((b) => b.id === id);
        setFormData((prev) => ({
          ...prev,
          under: value,
          nature: base?.nature ?? "",
        }));
        return;
      }

      // DB group
      if (id > 0) {
        const group = ledgerGroups.find((g) => g.id === id);
        setFormData((prev) => ({
          ...prev,
          under: value,
          nature: group?.nature ?? "",
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    const payload = {
      name: formData.name,
      alias: formData.alias,
      under: Number(formData.under),
      nature: formData.nature,
      companyId: Number(companyId),
      ownerType,
      ownerId: Number(ownerId),
    };

    const url = isEditMode
      ? `${import.meta.env.VITE_API_URL}/api/ledger-groups/${id}`
      : `${import.meta.env.VITE_API_URL}/api/ledger-groups`;

    const res = await fetch(url, {
      method: isEditMode ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire("Success", "Group saved successfully", "success");
      navigate("/app/masters/group");
    } else {
      Swal.fire("Error", data.message || "Failed", "error");
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
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1
          className={`text-2xl font-bold ${theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
        >
          {isEditMode ? "Edit" : "Create"} Group
        </h1>
      </div>

      <div
        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                className={`w-full p-2 rounded border ${errors.name
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
                className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                  : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                  } outline-none transition-colors`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                className={`w-full p-2 rounded border ${theme === "dark"
                  ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-gray-100"
                  : "bg-white border-gray-300 focus:border-blue-500 text-gray-900"
                  } ${formData.under && Number(formData.under) < 0
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

            {isPurchaseRelated && (
              <div>
                <label
                  className={`block text-sm font-medium mb-1 ${theme === "dark" ? "text-gray-300" : "text-gray-700"
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
                  className={`w-full p-2 rounded border ${errors.under
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
          </div>

          <div className="flex justify-end space-x-4">
            <button
              title="Cancel Group Creation"
              type="button"
              onClick={() => navigate("/app/masters/group")}
              className={`px-4 py-2 rounded text-sm font-medium ${theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                : "bg-gray-200 hover:bg-gray-300 text-gray-700"
                }`}
            >
              Cancel
            </button>
            <button
              title="Save Group"
              type="submit"
              className={`flex items-center px-4 py-2 rounded text-sm font-medium ${theme === "dark"
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
        className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
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
