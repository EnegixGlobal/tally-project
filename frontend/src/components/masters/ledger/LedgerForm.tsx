import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import type { Ledger } from "../../../types";
import type { LedgerGroup } from "../../../types";
import { ArrowLeft, Save } from "lucide-react";
import Swal from "sweetalert2";
import { validateGSTIN } from "../../../utils/ledgerUtils";

const LedgerForm: React.FC = () => {
  const { theme, ledgers } = useAppContext();
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [chekStock, setChekStock] = useState("");
  console.log('chekStock', chekStock)

  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isEditMode = Boolean(id);

  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  const [formData, setFormData] = useState<Omit<Ledger, "id">>({
    name: "",
    groupId: "",
    openingBalance: 0,
    closingBalance: 0,
    balanceType: "debit",
    address: "",
    email: "",
    phone: "",
    gstNumber: "",
    panNumber: "",
  });

  console.log("groupoid", formData.groupId);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Fetch ledger groups
  useEffect(() => {
    const fetchLedgerGroups = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger-groups?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setLedgerGroups(data);
      } catch (err) {
        console.error("Failed to load ledger groups", err);
      }
    };

    fetchLedgerGroups();
  }, []);

  // Fetch ledger when editing
  useEffect(() => {
    if (!isEditMode || !id) return;

    const fetchLedgerById = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();

        if (res.ok) {
          setFormData({
            name: data.name || "",
            groupId: data.groupId || "",
            openingBalance: data.opening_balance || 0,
            closingBalance: data.closing_balance || 0,
            balanceType: data.balance_type || "debit",
            address: data.address || "",
            email: data.email || "",
            phone: data.phone || "",
            gstNumber: data.gst_number || "",
            panNumber: data.pan_number || "",
          });

          if (data.groupName) {
            setChekStock(data.groupName);
          }
        } else {
          console.error("Failed to fetch ledger by ID:", data.message);
        }
      } catch (err) {
        console.error("Error fetching ledger by ID:", err);
      }
    };

    fetchLedgerById();
  }, [id, isEditMode, companyId, ownerType, ownerId]);

  // Prefill from context if available
  useEffect(() => {
    if (isEditMode && id) {
      const ledger = ledgers.find((l) => l.id === id);
      if (ledger) {
        setFormData({
          name: ledger.name,
          groupId: ledger.groupId,
          openingBalance: ledger.openingBalance,
          closingBalance: ledger.closingBalance,
          balanceType: ledger.balanceType,
          address: ledger.address || "",
          email: ledger.email || "",
          phone: ledger.phone || "",
          gstNumber: ledger.gstNumber || "",
          panNumber: ledger.panNumber || "",
        });
      }
    }
  }, [id, isEditMode, ledgers]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;

    let processedValue = value;
    if (name === "gstNumber") {
      processedValue = value.toUpperCase();
    }

    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : processedValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    if (name === "groupId") {
      const findGroup = ledgerGroups.find((g) => g.id.toString() === value);
      if (findGroup) {
        setChekStock(findGroup.name);
      }
    }
  };

  // Validate before submit
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Ledger name is required";
    if (!formData.groupId) newErrors.groupId = "Ledger group is required";
    if (formData.gstNumber && !validateGSTIN(formData.gstNumber)) {
      newErrors.gstNumber = "Invalid GSTIN/UIN format";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Create ledger
  const createLedger = async () => {
    try {
      const payload = { ...formData, companyId, ownerType, ownerId };

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ledger`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        Swal.fire(
          "Success",
          data.message || "Ledger created successfully!",
          "success"
        );
        navigate("/app/masters/ledger");
      } else {
        Swal.fire("Error", data.message || "Failed to create ledger", "error");
      }
    } catch (err) {
      console.error("Create error:", err);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  // Update ledger
  const updateLedger = async () => {
    try {
      const payload = { ...formData, companyId, ownerType, ownerId };

      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/ledger/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (res.ok) {
        Swal.fire(
          "Success",
          data.message || "Ledger updated successfully!",
          "success"
        );
        navigate("/app/masters/ledger");
      } else {
        Swal.fire("Error", data.message || "Failed to update ledger", "error");
      }
    } catch (err) {
      console.error("Update error:", err);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  // Submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (isEditMode) {
      updateLedger();
    } else {
      createLedger();
    }
  };

  return (
    <div className="pt-[56px] px-4 ">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/app/masters/ledger")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit" : "Create"} Ledger
        </h1>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <form onSubmit={handleSubmit}>
          {/* Ledger Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Ledger Name
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
                    ? "border-red-500 focus:border-red-500"
                    : theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none transition-colors`}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="groupId"
              >
                Under Group
              </label>
              <select
                id="groupId"
                name="groupId"
                value={formData.groupId}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${
                  errors.groupId
                    ? "border-red-500 focus:border-red-500"
                    : theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none transition-colors`}
              >
                <option value="">Select Group</option>
                {ledgerGroups.map((group: LedgerGroup) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
              {errors.groupId && (
                <p className="text-red-500 text-xs mt-1">{errors.groupId}</p>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="openingBalance"
              >
                Opening Stock
              </label>
              <input
                type="number"
                id="openingBalance"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                step="0.01"
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
                htmlFor="balanceType"
              >
                Balance Type
              </label>
              <div className="flex space-x-4 mt-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="balanceType"
                    value="debit"
                    checked={formData.balanceType === "debit"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Dr (Debit)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="balanceType"
                    value="credit"
                    checked={formData.balanceType === "credit"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <span>Cr (Credit)</span>
                </label>
              </div>
            </div>

           {["cash-in-hand"].includes(chekStock.toLowerCase()) && (
  <div>
    <label className="block text-sm font-medium mb-1">Closing Balance</label>
    <input
      type="number"
      name="closingBalance"
      value={formData.closingBalance}
      onChange={handleChange}
      step="0.01"
      className="w-full p-2 rounded border"
    />
  </div>
)}

          </div>

          {/* Additional Info */}
          <div
            className={`p-4 mb-6 rounded ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-50"
            }`}
          >
            <h3 className="font-semibold mb-4">Additional Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="address"
                >
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                      : "bg-white border-gray-300 focus:border-blue-500"
                  } outline-none transition-colors`}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="email"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
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
                    htmlFor="phone"
                  >
                    Phone
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full p-2 rounded border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                        : "bg-white border-gray-300 focus:border-blue-500"
                    } outline-none transition-colors`}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="gstNumber"
                >
                  GSTIN/UIN Number{" "}
                  <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="gstNumber"
                  name="gstNumber"
                  value={formData.gstNumber}
                  onChange={handleChange}
                  placeholder="22AAAAA0000A1Z5 or UIN Number"
                  maxLength={15}
                  className={`w-full p-2 rounded border ${
                    errors.gstNumber
                      ? "border-red-500 focus:border-red-500"
                      : theme === "dark"
                      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                      : "bg-white border-gray-300 focus:border-blue-500"
                  } outline-none transition-colors`}
                />
                {errors.gstNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.gstNumber}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  📊 <strong>B2B:</strong> Ledgers with GSTIN/UIN |{" "}
                  <strong>B2C:</strong> Ledgers without GSTIN/UIN
                </p>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="panNumber"
                >
                  PAN Number
                </label>
                <input
                  type="text"
                  id="panNumber"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                      : "bg-white border-gray-300 focus:border-blue-500"
                  } outline-none transition-colors`}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate("/app/masters/ledger")}
              className={`px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Save size={18} className="mr-1" />
              {isEditMode ? "Update" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LedgerForm;
