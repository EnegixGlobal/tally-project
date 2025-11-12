import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import { ArrowLeft, Save, Printer } from "lucide-react";
import type { Scenario, VoucherType } from "../../../types";
import Swal from "sweetalert2";

const ScenarioForm: React.FC = () => {
  const { theme, companyInfo } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("userType");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );
  // Mock scenarios data - in a real app, this would come from an API or context
  const [mockScenarios] = useState<Scenario[]>([
    {
      id: "SCN-001",
      name: "Budget Q1 2025",
      includeActuals: true,
      includedVoucherTypes: ["sales", "purchase"],
      excludedVoucherTypes: ["journal"],
      fromDate: "2025-04-01",
      toDate: "2025-06-30",
      createdAt: "2025-06-01T10:00:00Z",
    },
    {
      id: "SCN-002",
      name: "Forecast H2 2025",
      includeActuals: false,
      includedVoucherTypes: ["journal"],
      excludedVoucherTypes: ["sales", "purchase"],
      fromDate: "2025-07-01",
      toDate: "2025-12-31",
      createdAt: "2025-06-15T12:00:00Z",
      updatedAt: "2025-06-20T14:00:00Z",
    },
  ]);

  const initialFormData: Scenario = {
    id: "",
    name: "",
    includeActuals: false,
    includedVoucherTypes: [],
    excludedVoucherTypes: [],
    fromDate: companyInfo?.financialYear || "2025-04-01",
    toDate: new Date().toISOString().split("T")[0],
    createdAt: new Date().toISOString(),
  };

  const [formData, setFormData] = useState<Scenario>(initialFormData);

  useEffect(() => {
    if (!isEditMode) return; // create mode me skip karo

    const fetchScenario = async () => {
      try {
        const response = await fetch(
          `http://localhost:5000/api/scenario/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to fetch scenario");

        setFormData({
          ...data,
          includeActuals: data.include_actuals || false,
          includedVoucherTypes: data.included_voucher_types || [],
          excludedVoucherTypes: data.excluded_voucher_types || [],
        });
      } catch (err) {
        console.error("Error fetching scenario:", err);
        Swal.fire("Error", "Failed to load scenario data.", "error");
      }
    };

    fetchScenario();
  }, [isEditMode, id, companyId, ownerType, ownerId]);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const voucherTypes: VoucherType[] = [
    "payment",
    "receipt",
    "contra",
    "journal",
    "sales",
    "purchase",
    "debit-note",
    "credit-note",
    "stock-journal",
    "delivery-note",
  ];

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = "Scenario name is required";
    if (!formData.fromDate) newErrors.fromDate = "From date is required";
    if (!formData.toDate) newErrors.toDate = "To date is required";
    if (new Date(formData.toDate) < new Date(formData.fromDate)) {
      newErrors.toDate = "To date must be after from date";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev: Scenario) => ({ ...prev, [name]: value }));
    setErrors((prev: { [key: string]: string }) => ({ ...prev, [name]: "" }));
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "includedVoucherTypes" | "excludedVoucherTypes",
    voucherType: VoucherType
  ) => {
    const { checked } = e.target;
    setFormData((prev: Scenario) => {
      const otherField =
        field === "includedVoucherTypes"
          ? "excludedVoucherTypes"
          : "includedVoucherTypes";
      return {
        ...prev,
        [field]: checked
          ? [...prev[field], voucherType]
          : prev[field].filter((vt: VoucherType) => vt !== voucherType),
        [otherField]: prev[otherField].filter(
          (vt: VoucherType) => vt !== voucherType
        ),
      };
    });
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Step 1: Validate form fields
  if (!validateForm()) {
    Swal.fire(
      "Validation Error",
      "Please fix the errors before submitting.",
      "warning"
    );
    return;
  }

  // Step 2: Prepare data
  const scenarioId = isEditMode ? formData.id : `SCN-${Date.now()}`;

const payload = {
  ...formData,
  id: scenarioId,
  ownerType: ownerType,
  ownerId: ownerId,
};

  try {
    // Step 3: Decide endpoint & method based on mode
    const endpoint = isEditMode
      ? `http://localhost:5000/api/scenario/update/${scenarioId}`
      : `http://localhost:5000/api/scenario/create`;

    const method = isEditMode ? "PUT" : "POST";

    // Step 4: Send request
    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    // Step 5: Handle response
    if (response.ok) {
      Swal.fire({
        icon: "success",
        title: "Success",
        text: data.message || (isEditMode ? "Scenario updated!" : "Scenario created!"),
      }).then(() => {
        // ✅ redirect to correct list route
        navigate("/app/masters/scenarios");
      });
    } else {
      Swal.fire("Error", data.message || "Something went wrong", "error");
    }
  } catch (error) {
    console.error("❌ Error:", error);
    Swal.fire("Network Error", "Failed to connect to the server.", "error");
  }
};


  // const handleSubmit = useCallback(() => {
  //   if (validateForm()) {
  //     const scenarioData = {
  //       ...formData,
  //       id: isEditMode ? formData.id : `SCN-${Date.now()}`,
  //       updatedAt: isEditMode ? new Date().toISOString() : undefined,
  //     };
  //     // In a real app, this would save to an API or context
  //     console.log(isEditMode ? 'Updating scenario:' : 'Creating scenario:', scenarioData);
  //     alert(`Scenario ${isEditMode ? 'updated' : 'created'} successfully!`);
  //     navigate('/app/scenarios');
  //   }
  // }, [formData, isEditMode, navigate, validateForm]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Scenario Details</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }a
              h1 { font-size: 24px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            </style>
          </head>
          <body>
            <h1>${
              companyInfo?.name || "Hanuman Car Wash"
            } - Scenario Details</h1>
            <table>
              <tr><th>Name</th><td>${formData.name}</td></tr>
              <tr><th>Include Actuals</th><td>${
                formData.includeActuals ? "Yes" : "No"
              }</td></tr>
              <tr><th>Included Voucher Types</th><td>${
                formData.includedVoucherTypes.join(", ") || "None"
              }</td></tr>
              <tr><th>Excluded Voucher Types</th><td>${
                formData.excludedVoucherTypes.join(", ") || "None"
              }</td></tr>
              <tr><th>From Date</th><td>${formData.fromDate}</td></tr>
              <tr><th>To Date</th><td>${formData.toDate}</td></tr>
              <tr><th>Created At</th><td>${new Date(
                formData.createdAt
              ).toLocaleString()}</td></tr>
              ${
                formData.updatedAt
                  ? `<tr><th>Updated At</th><td>${new Date(
                      formData.updatedAt
                    ).toLocaleString()}</td></tr>`
                  : ""
              }
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [companyInfo?.name, formData]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      } else if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        handlePrint();
      } else if (e.key === "Escape") {
        navigate("/app/masters/scenarios");
      }
    },
    [handleSubmit, handlePrint, navigate]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Scenarios"
          onClick={() => navigate("/app/masters/scenarios")}
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
          {isEditMode ? "Edit Scenario" : "Create Scenario"}
        </h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Save Scenario"
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
            title="Print Scenario"
            onClick={handlePrint}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Scenario Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
              placeholder="Enter scenario name"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Include Actuals
            </label>
            <select
              title="Include Actuals"
              name="includeActuals"
              value={formData.includeActuals ? "Yes" : "No"}
              onChange={(e) =>
                setFormData((prev: Scenario) => ({
                  ...prev,
                  includeActuals: e.target.value === "Yes",
                }))
              }
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              From Date
            </label>
            <input
              title="From Date"
              type="date"
              name="fromDate"
              value={formData.fromDate}
              onChange={handleChange}
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
            {errors.fromDate && (
              <p className="text-red-500 text-sm mt-1">{errors.fromDate}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              To Date
            </label>
            <input
              title="To Date"
              type="date"
              name="toDate"
              value={formData.toDate}
              onChange={handleChange}
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-gray-100"
                  : "bg-white border-gray-300 text-gray-900"
              }`}
            />
            {errors.toDate && (
              <p className="text-red-500 text-sm mt-1">{errors.toDate}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Include Voucher Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {voucherTypes.map((vt) => (
                <div key={vt} className="flex items-center">
                  <input
                    title="Include Voucher Types"
                    type="checkbox"
                    checked={formData.includedVoucherTypes.includes(vt)}
                    onChange={(e) =>
                      handleCheckboxChange(e, "includedVoucherTypes", vt)
                    }
                    className={`mr-2 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    {vt}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <label
              className={`block text-sm font-medium mb-1 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Exclude Voucher Types
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {voucherTypes.map((vt) => (
                <div key={vt} className="flex items-center">
                  <input
                    title="Exclude Voucher Types"
                    type="checkbox"
                    checked={formData.excludedVoucherTypes.includes(vt)}
                    onChange={(e) =>
                      handleCheckboxChange(e, "excludedVoucherTypes", vt)
                    }
                    className={`mr-2 ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600"
                        : "bg-white border-gray-300"
                    }`}
                  />
                  <span
                    className={
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }
                  >
                    {vt}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Keyboard Shortcuts:</span> Ctrl+S to
          save, Ctrl+P to print, Esc to cancel.
        </p>
      </div>
    </div>
  );
};

export default ScenarioForm;
