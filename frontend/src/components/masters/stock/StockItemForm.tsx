import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, Trash2, ArrowLeft, Plus } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import type {
  GodownAllocation,
  Godown,
  UnitOfMeasurement,
  GstClassification,
} from "../../../types";
import Swal from "sweetalert2";
import Barcode from "react-barcode";
import { nanoid } from "nanoid";
import { useParams } from "react-router-dom";

// Interface for InputField props
interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}

// Interface for SelectField props
interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
}

// Interface for GodownAllocationField props
interface GodownAllocationFieldProps {
  allocations: GodownAllocation[];
  setAllocations: React.Dispatch<React.SetStateAction<GodownAllocation[]>>;
  godowns: Godown[];
  errors: Record<string, string>;
}

// Reusable Input component
const InputField: React.FC<InputFieldProps> = ({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  required = false,
  error = "",
}) => {
  const { theme } = useAppContext();

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-2 rounded border ${
          error
            ? "border-red-500"
            : theme === "dark"
            ? "bg-gray-700 border-gray-600 focus:border-blue-500"
            : "bg-white border-gray-300 focus:border-blue-500"
        } outline-none transition-colors`}
        required={required}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Reusable Select component
const SelectField: React.FC<SelectFieldProps> = ({
  id,
  name,
  label,
  value,
  onChange,
  options,
  required = false,
  error = "",
}) => {
  const { theme } = useAppContext();

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-2 rounded border ${
          error
            ? "border-red-500"
            : theme === "dark"
            ? "bg-gray-700 border-gray-600 focus:border-blue-500"
            : "bg-white border-gray-300 focus:border-blue-500"
        } outline-none transition-colors`}
        required={required}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Reusable Godown Allocation component
const GodownAllocationField: React.FC<GodownAllocationFieldProps> = ({
  allocations,
  setAllocations,
  godowns,
  errors,
}) => {
  const { theme } = useAppContext();

  const addAllocation = () => {
    setAllocations([...allocations, { godownId: "", quantity: 0, value: 0 }]);
  };

  const updateAllocation = (
    index: number,
    field: keyof GodownAllocation,
    value: string | number
  ) => {
    setAllocations((prev) =>
      prev.map((alloc, i) =>
        i === index
          ? { ...alloc, [field]: field === "godownId" ? value : Number(value) }
          : alloc
      )
    );
  };

  const removeAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="col-span-2">
      <label className="block text-sm font-medium mb-1">
        Godown Allocations
      </label>
      {allocations.map((alloc: GodownAllocation, index: number) => (
        <div key={index} className="flex gap-4 mt-2 items-center">
          <SelectField
            id={`godown-${index}`}
            name={`godown-${index}`}
            label="Godown"
            value={alloc.godownId}
            onChange={(e) =>
              updateAllocation(index, "godownId", e.target.value)
            }
            options={godowns.map((g) => ({ value: g.id, label: g.name }))}
            error={errors[`godown-${index}`]}
          />
          <InputField
            id={`quantity-${index}`}
            name={`quantity-${index}`}
            label="Quantity"
            type="number"
            value={alloc.quantity}
            onChange={(e) =>
              updateAllocation(index, "quantity", e.target.value)
            }
            error={errors[`quantity-${index}`]}
          />
          <InputField
            id={`value-${index}`}
            name={`value-${index}`}
            label="Value"
            type="number"
            value={alloc.value}
            onChange={(e) => updateAllocation(index, "value", e.target.value)}
            error={errors[`value-${index}`]}
          />
          <button
            title="Remove Godown Allocation"
            type="button"
            onClick={() => removeAllocation(index)}
            className={`p-1 rounded mt-6 ${
              theme === "dark"
                ? "hover:bg-gray-600 text-red-400 hover:text-red-300"
                : "hover:bg-gray-300 text-red-600 hover:text-red-700"
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addAllocation}
        className={`mt-2 flex items-center gap-2 px-4 py-2 rounded text-sm ${
          theme === "dark"
            ? "bg-blue-600 hover:bg-blue-700 text-white"
            : "bg-blue-600 hover:bg-blue-700 text-white"
        }`}
      >
        <Plus className="w-4 h-4" />
        Add Godown
      </button>
    </div>
  );
};

const StockItemForm = () => {
  const {
    theme,
    gstClassifications = [],
    units = [],
    godowns = [],
    companyInfo,
  } = useAppContext();

  const navigate = useNavigate();
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  const [barcode, setBarcode] = useState<string>("");
  const { id } = useParams<{ id?: string }>();

  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

 // fetch units from database
const [unitsData, setUnitsData] = useState([]);

useEffect(() => {
  const fetchUnits = async () => {
    if (!companyId || !ownerType || !ownerId) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stock-units?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
      );

      const data = await res.json();

      if (Array.isArray(data)) {
        setUnitsData(data);
      } else {
        setUnitsData([]);
        console.warn("Units data format incorrect:", data);
      }


    } catch (error) {
      console.error("Failed to fetch units:", error);
    }
  };

  fetchUnits();
}, [companyId, ownerType, ownerId]);


  useEffect(() => {
    async function fetchCategories() {
      if (!companyId || !ownerType || !ownerId) return;

      try {
        const params = new URLSearchParams({
          company_id: companyId,
          owner_type: ownerType,
          owner_id: ownerId,
        });
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/stock-categories?${params.toString()}`
        );
        const data = await res.json();

        if (Array.isArray(data) && data.length > 0) {
          setCategories(
            data.map((cat: any) => ({
              value: cat.id.toString(),
              label: cat.name,
            }))
          );
        } else {
          setCategories([{ value: "", label: "No categories available" }]);
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        setCategories([{ value: "", label: "Failed to load categories" }]);
      }
    }

    fetchCategories();
  }, [companyId, ownerType, ownerId]);

  useEffect(() => {
    async function fetchStockItem() {
      if (!id) return;

      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/stock-items/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const data = await res.json();

        if (res.ok && data.success) {
          const item = data.data;

          setFormData({
            name: item.name || "",
            stockGroupId: item.stockGroupId?.toString() || "",
            categoryId: item.categoryId?.toString() || "",
            unit: item.unit?.toString() || "",
            openingBalance: item.openingBalance || 0,
            openingValue: item.openingValue || 0,
            hsnSacOption: "specify-details",
            hsnCode: item.hsnCode || "",
            gstRateOption: "specify-details",
            gstRate: item.gstRate?.toString() || "",
            gstClassification: "",
            taxType: item.taxType || "Taxable",
            standardPurchaseRate: item.standardPurchaseRate || 0,
            standardSaleRate: item.standardSaleRate || 0,
            enableBatchTracking: !!item.enableBatchTracking,
            batchName: item.batchNumber || "",
            batchExpiryDate: item.batchExpiryDate || "",
            batchManufacturingDate: item.batchManufacturingDate || "",
            allowNegativeStock: !!item.allowNegativeStock,
            maintainInPieces: !!item.maintainInPieces,
            secondaryUnit: item.secondaryUnit || "",
          });

          setGodownAllocations(item.godownAllocations || []);
          setBarcode(item.barcode || "");

          if (Array.isArray(item.batches) && item.batches.length > 0) {
            setBatchRows(
              item.batches.map((b: any) => ({
                batchName: b.batchName || "",
                batchQuantity: Number(b.batchQuantity) || 0,
                batchRate: Number(b.openingRate) || 0, // correct mapping
                openingRate: Number(b.openingValue) || 0, // UI readonly
                batchExpiryDate: b.batchExpiryDate || "",
                batchManufacturingDate: b.batchManufacturingDate || "",
              }))
            );
          }
        } else {
          Swal.fire(
            "Error",
            data.message || "Failed to fetch stock item",
            "error"
          );
        }
      } catch (err) {
        console.error("🔥 Error fetching stock item:", err);
        Swal.fire("Error", "Unable to fetch stock item", "error");
      }
    }

    fetchStockItem();
  }, [id, companyId, ownerType, ownerId]);

  // Generate barcode on first load or on form reset
  useEffect(() => {
    setBarcode(nanoid(12));
  }, []);

  interface FormData {
    name: string;
    stockGroupId: string;
    categoryId: string;
    unit: string;
    openingBalance: number;
    openingValue: number;
    hsnSacOption: "as-per-company" | "specify-details" | "use-classification";
    hsnCode: string;
    gstRateOption: "as-per-company" | "specify-details" | "use-classification";
    gstRate: string;
    gstClassification: string;
    taxType: "Taxable" | "Exempt" | "Nil-rated";
    standardPurchaseRate: number;
    standardSaleRate: number;
    enableBatchTracking: boolean;
    batchName: string;
    batchExpiryDate: string;
    batchManufacturingDate: string;
    allowNegativeStock: boolean;
    maintainInPieces: boolean;
    secondaryUnit: string;
  }

  interface Errors {
    [key: string]: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    stockGroupId: "",
    categoryId: "",
    unit: "",
    openingBalance: 0,
    openingValue: 0,
    hsnSacOption: "as-per-company",
    hsnCode: "",
    gstRateOption: "as-per-company",
    gstRate: "",
    gstClassification: "",
    taxType: "Taxable",
    standardPurchaseRate: 0,
    standardSaleRate: 0,
    enableBatchTracking: false,
    batchName: "",
    batchExpiryDate: "",
    batchManufacturingDate: "",
    allowNegativeStock: true,
    maintainInPieces: false,
    secondaryUnit: "",
  });

  const [godownAllocations, setGodownAllocations] = useState<
    GodownAllocation[]
  >([]);
  const [batchRows, setBatchRows] = useState([
    {
      batchName: "",
      batchExpiryDate: "",
      batchManufacturingDate: "",
      batchQuantity: "",
      batchRate: "",
      openingRate: 0,
    },
  ]);
  const [errors, setErrors] = useState<Errors>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // --- Batch Rows handlers ---
  const addBatchRow = () => {
    setBatchRows([
      ...batchRows,
      {
        batchName: "",
        batchExpiryDate: "",
        batchManufacturingDate: "",
        batchQuantity: "",
        batchRate: "",
      },
    ]);
  };

  const removeBatchRow = (index: number) => {
    setBatchRows(batchRows.filter((_, i) => i !== index));
  };

  const updateBatchRow = (index: number, field: string, value: string) => {
    setBatchRows((prev) =>
      prev.map((row, i) => {
        if (i !== index) return row;

        const updated = {
          ...row,
          [field]:
            field === "batchQuantity" || field === "batchRate"
              ? Number(value)
              : value,
        };

        // Auto calculate Opening Rate
        const qty = Number(updated.batchQuantity) || 0;
        const rate = Number(updated.batchRate) || 0;
        updated.openingRate = qty * rate;

        return updated;
      })
    );
  };

  // --- End batch rows ---

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.name) newErrors.name = "Name is required";
    if (!formData.categoryId) newErrors.categoryId = "Category is required";
    if (!formData.unit) newErrors.unit = "Unit is required";
    if (!formData.taxType) newErrors.taxType = "Tax Type is required";

    if (formData.openingValue < 0)
      newErrors.openingValue = "Opening Value cannot be negative";
    if (formData.standardPurchaseRate < 0)
      newErrors.standardPurchaseRate = "Purchase Rate cannot be negative";
    if (formData.standardSaleRate < 0)
      newErrors.standardSaleRate = "Sale Rate cannot be negative";

    if (formData.hsnSacOption === "specify-details" && !formData.hsnCode) {
      newErrors.hsnCode = "HSN/SAC Code is required";
    } else if (formData.hsnSacOption === "specify-details") {
      const turnover = companyInfo?.turnover || 0;
      const hsnLength = (formData.hsnCode || "").toString().length;
      const requiredLength =
        turnover <= 50000000 ? 4 : turnover <= 150000000 ? 6 : 8;
      if (!/^\d{4,8}$/.test(formData.hsnCode) || hsnLength < requiredLength) {
        newErrors.hsnCode = `HSN/SAC must be at least ${requiredLength} digits for turnover ₹${(
          turnover / 10000000
        ).toFixed(1)} crore`;
      }
    }

    if (formData.gstRateOption === "specify-details" && !formData.gstRate) {
      newErrors.gstRate = "GST Rate is required";
    } else if (
      formData.gstRateOption === "specify-details" &&
      (Number(formData.gstRate) < 0 || Number(formData.gstRate) > 28)
    ) {
      newErrors.gstRate = "GST Rate must be between 0 and 28%";
    }

    godownAllocations.forEach((alloc: GodownAllocation, index: number) => {
      if (!alloc.godownId) newErrors[`godown-${index}`] = "Godown is required";
      if (alloc.quantity < 0)
        newErrors[`quantity-${index}`] = "Quantity cannot be negative";
      if (alloc.value < 0)
        newErrors[`value-${index}`] = "Value cannot be negative";
    });

    // --- Batch validation ---
    if (formData.enableBatchTracking) {
      batchRows.forEach((batch, index) => {
        if (!batch.batchName)
          newErrors[`batchName-${index}`] = "Batch Name is required";
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation check before proceeding
    if (!validateForm()) {
      Swal.fire(
        "Validation Error",
        "Please fix the errors before submitting.",
        "warning"
      );
      return;
    }

    // Construct stockItem object
    const stockItem = {
      ...formData,
      batches: batchRows,
      godownAllocations,
      company_id: companyId,
      owner_type: ownerType,
      owner_id: ownerId,
      barcode,
    };

    // Determine if we're updating or creating a new record
    const method = id ? "PUT" : "POST"; // Use PUT for update, POST for new
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/stock-items/${id}` // URL with ID for update
      : `${import.meta.env.VITE_API_URL}/api/stock-items`; // URL for new record creation

    try {
      const res = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(stockItem),
      });

      // Check if response status is ok (2xx status codes)
      if (!res.ok) {
        let data;
        try {
          // Attempt to parse JSON only if response is not ok
          data = await res.json();
        } catch (jsonError) {
          // Handle non-JSON responses if JSON parsing fails
          console.error("Error parsing JSON:", jsonError);
          const text = await res.text();
          console.error("Raw response:", text);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "The server returned an unexpected format. Please try again.",
          });
          return;
        }

        // Show error message from the server
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Failed to save stock item",
        });
        return;
      }

      // Parse JSON from response if status is ok
      const data = await res.json();

      // Success message after stock item is saved/updated
      Swal.fire({
        icon: "success",
        title: "Success",
        text:
          data.message ||
          (id
            ? "Stock item updated successfully!"
            : "Stock item saved successfully!"),
      }).then(() => {
        navigate("/app/masters/stock-item"); // Navigate to stock-item page
      });
    } catch (err) {
      console.error("🔥 Network/Error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "An error occurred while saving the stock item.",
      });
    }
  };

  const hsnSacOptions = [
    { value: "as-per-company", label: "As per Company/Group" },
    { value: "specify-details", label: "Specify Details Here" },
    { value: "use-classification", label: "Use GST Classification" },
  ];

  const gstRateOptions = [
    { value: "as-per-company", label: "As per Company/Group" },
    { value: "specify-details", label: "Specify Details Here" },
    { value: "use-classification", label: "Use GST Classification" },
  ];

  const taxTypeOptions = [
    { value: "Taxable", label: "Taxable" },
    { value: "Exempt", label: "Exempt" },
    { value: "Nil-rated", label: "Nil-rated" },
  ];

  const unitOptions =
  unitsData.length > 0
    ? unitsData.map((unit: any) => ({
        value: unit.id.toString(),
        label: unit.name,
      }))
    : [{ value: "", label: "No units available" }];


  const gstClassificationOptions =
    gstClassifications.length > 0
      ? gstClassifications.map((classification: GstClassification) => ({
          value: classification.id,
          label: `${classification.name} (HSN/SAC: ${classification.hsnCode}, GST: ${classification.gstRate}%)`,
        }))
      : [{ value: "", label: "No classifications available" }];

  return (
    <div className="pt-[56px] px-4 ">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/app/masters/stock-item")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">New Stock Item</h1>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              id="name"
              name="name"
              label="Name"
              value={formData.name}
              onChange={handleChange}
              required
              error={errors.name}
            />
            <SelectField
              id="categoryId"
              name="categoryId"
              label="Category"
              value={formData.categoryId}
              onChange={handleChange}
              options={categories}
              required
              error={errors.categoryId}
            />

            <SelectField
              id="unit"
              name="unit"
              label="Unit"
              value={formData.unit}
              onChange={handleChange}
              options={unitOptions}
              required
              error={errors.unit}
            />

            <SelectField
              id="taxType"
              name="taxType"
              label="Tax Type"
              value={formData.taxType}
              onChange={handleChange}
              options={taxTypeOptions}
              required
              error={errors.taxType}
            />
            <SelectField
              id="hsnSacOption"
              name="hsnSacOption"
              label="HSN/SAC Option"
              value={formData.hsnSacOption}
              onChange={handleChange}
              options={hsnSacOptions}
              required
              error={errors.hsnSacOption}
            />
            {formData.hsnSacOption === "specify-details" && (
              <InputField
                id="hsnCode"
                name="hsnCode"
                label="HSN/SAC Code"
                value={formData.hsnCode}
                onChange={handleChange}
                required
                error={errors.hsnCode}
                key="hsnCode"
              />
            )}
            {formData.hsnSacOption === "use-classification" && (
              <SelectField
                id="gstClassification"
                name="gstClassification"
                label="GST Classification"
                value={formData.gstClassification}
                onChange={handleChange}
                options={gstClassificationOptions}
                error={errors.gstClassification}
                key="gstClassification-hsn"
              />
            )}
            <SelectField
              id="gstRateOption"
              name="gstRateOption"
              label="GST Rate Option"
              value={formData.gstRateOption}
              onChange={handleChange}
              options={gstRateOptions}
              required
              error={errors.gstRateOption}
            />
            {formData.gstRateOption === "specify-details" && (
              <InputField
                id="gstRate"
                name="gstRate"
                label="GST Rate (%)"
                type="number"
                value={formData.gstRate}
                onChange={handleChange}
                required
                error={errors.gstRate}
                key="gstRate"
              />
            )}
            {formData.gstRateOption === "use-classification" && (
              <SelectField
                id="gstClassification"
                name="gstClassification"
                label="GST Classification"
                value={formData.gstClassification}
                onChange={handleChange}
                options={gstClassificationOptions}
                error={errors.gstClassification}
                key="gstClassification-rate"
              />
            )}
            <InputField
              id="standardPurchaseRate"
              name="standardPurchaseRate"
              label="Standard Purchase Rate"
              type="number"
              value={formData.standardPurchaseRate}
              onChange={handleChange}
              error={errors.standardPurchaseRate}
            />
            <InputField
              id="standardSaleRate"
              name="standardSaleRate"
              label="Standard Sale Rate"
              type="number"
              value={formData.standardSaleRate}
              onChange={handleChange}
              error={errors.standardSaleRate}
            />

            {/* ----------------- Batch Tracking Dynamic Rows ----------------- */}
            <div className="flex justify-between items-center mt-4">
              {/* Left: Checkbox */}
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="enableBatchTracking"
                  checked={formData.enableBatchTracking}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Enable Batch Tracking
              </label>

              {/* Right: Add Batch Button */}
              {formData.enableBatchTracking && (
                <button
                  type="button"
                  onClick={addBatchRow}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Plus size={16} /> Add Batch
                </button>
              )}
            </div>

            {formData.enableBatchTracking && (
              <div className="flex flex-col gap-4 mt-4 col-span-2 border border-gray-400 rounded-lg p-3">
                {batchRows.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end w-full"
                  >
                    <div className="flex-1 min-w-[120px]">
                      <InputField
                        id={`batchName-${index}`}
                        name={`batchName-${index}`}
                        label="Batch"
                        value={row.batchName}
                        onChange={(e) =>
                          updateBatchRow(index, "batchName", e.target.value)
                        }
                        error={errors[`batchName-${index}`]}
                      />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <InputField
                        id={`batchQuantity-${index}`}
                        name={`batchQuantity-${index}`}
                        label="Qty"
                        value={row.batchQuantity}
                        onChange={(e) =>
                          updateBatchRow(index, "batchQuantity", e.target.value)
                        }
                        error={errors[`batchQuantity-${index}`]}
                      />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <InputField
                        id={`batchRate-${index}`}
                        name={`batchRate-${index}`}
                        label="Rate"
                        value={row.batchRate}
                        onChange={(e) =>
                          updateBatchRow(index, "batchRate", e.target.value)
                        }
                        error={errors[`batchRate-${index}`]}
                      />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <InputField
                        id={`openingRate-${index}`}
                        name={`openingRate-${index}`}
                        label="Opening Rate"
                        type="number"
                        value={row.openingRate}
                        error={errors[`openingRate-${index}`]}
                      />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <InputField
                        id={`batchManufacturingDate-${index}`}
                        name={`batchManufacturingDate-${index}`}
                        type="date"
                        label="MFG"
                        value={row.batchManufacturingDate}
                        onChange={(e) =>
                          updateBatchRow(
                            index,
                            "batchManufacturingDate",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <div className="flex-1 min-w-[120px]">
                      <InputField
                        id={`batchExpiryDate-${index}`}
                        name={`batchExpiryDate-${index}`}
                        type="date"
                        label="Expiry"
                        value={row.batchExpiryDate}
                        onChange={(e) =>
                          updateBatchRow(
                            index,
                            "batchExpiryDate",
                            e.target.value
                          )
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeBatchRow(index)}
                      className="p-2 text-red-700 hover:text-red-900"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ---------------------------------------------------------------- */}

            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  name="allowNegativeStock"
                  checked={formData.allowNegativeStock}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                Allow Negative Stock
              </label>
            </div>
            <div></div>
            {barcode && (
              <div className="mb-4">
                <h3>Generated Barcode</h3>
                <Barcode value={barcode} width={1} height={40} fontSize={16} />
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate("/app/masters/stock-item")}
              className={`px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Save className="w-4 h-4 mr-1" />
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockItemForm;
