import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, X, Trash2, ArrowLeft, Plus } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import type {
  GodownAllocation,
  Godown,
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
        className={`w-full p-2 rounded border ${error
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
        className={`w-full p-2 rounded border ${error
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



const StockItemForm = () => {
  const { theme } = useAppContext();

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

  const [gstLedgers, setGstLedgers] = useState<{
    gst: any[];
    cgst: any[];
    sgst: any[];
    igst: any[];
  }>({
    gst: [],
    cgst: [],
    sgst: [],
    igst: [],
  });



  //get ledgers
  useEffect(() => {
    async function fetchGstLedgers() {
      if (!companyId || !ownerType || !ownerId) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items/ledger` +
          `?company_id=${companyId}` +
          `&owner_type=${ownerType}` +
          `&owner_id=${ownerId}`
        );


        const data = await res.json();

        if (data.success) {
          setGstLedgers(data.data);
        } else {
          console.error("Ledger API error:", data.message);
        }
      } catch (err) {
        console.error("Failed to fetch GST ledgers", err);
      }
    }

    fetchGstLedgers();
  }, [companyId, ownerType, ownerId]);



  const gstOptions = [
    ...gstLedgers.gst,
    ...gstLedgers.igst,
  ].map((l) => ({
    value: l.id.toString(),
    label: l.name,
  }));

  const cgstOptions = gstLedgers.cgst.map((l) => ({
    value: l.id.toString(),
    label: l.name,
  }));

  const sgstOptions = gstLedgers.sgst.map((l) => ({
    value: l.id.toString(),
    label: l.name,
  }));





  // fetch units from database
  const [unitsData, setUnitsData] = useState([]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!companyId || !ownerType || !ownerId) return;

      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/stock-units?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
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
          `${import.meta.env.VITE_API_URL
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
          `${import.meta.env.VITE_API_URL}/api/stock-items/${id}` +
          `?company_id=${companyId}` +
          `&owner_type=${ownerType}` +
          `&owner_id=${ownerId}` +
          `&mode=opening`
        );

        const data = await res.json();

        if (res.ok && data.success) {
          const item = data.data;

          // --- Set main form data ---
          setFormData({
            name: item.name || "",
            stockGroupId: item.stockGroupId?.toString() || "",
            categoryId: item.categoryId?.toString() || "",
            unit: item.unit?.toString() || "",
            openingBalance: Number(item.openingBalance) || 0,
            openingValue: Number(item.openingValue) || 0,
            hsnSacOption: "specify-details",
            hsnCode: item.hsnCode || "",
            gstRateOption: "specify-details",
            gstRate: item.gstRate?.toString() || "",
            gstClassification: "",
            taxType: item.taxType || "Taxable",
            gstLedgerId: item.gstLedgerId?.toString() || "",
            cgstLedgerId: item.cgstLedgerId?.toString() || "",
            sgstLedgerId: item.sgstLedgerId?.toString() || "",

            standardPurchaseRate: Number(item.standardPurchaseRate) || 0,
            standardSaleRate: Number(item.standardSaleRate) || 0,
            enableBatchTracking: !!item.enableBatchTracking,
            batchName: item.batchNumber || "",
            batchExpiryDate: item.batchExpiryDate || "",
            batchManufacturingDate: item.batchManufacturingDate || "",
            allowNegativeStock: !!item.allowNegativeStock,
            maintainInPieces: !!item.maintainInPieces,
            secondaryUnit: item.secondaryUnit || "",
            image: item.image || "",
          });

          if (item.image) {
            setPreview(item.image);
          }

          // --- Set godown allocations ---
          setGodownAllocations(item.godownAllocations || []);

          // --- Set barcode ---
          setBarcode(item.barcode || "");

          // --- Set batch rows safely ---
          if (Array.isArray(item.batches) && item.batches.length > 0) {
            setBatchRows(
              item.batches.map((b: any) => {
                const rate = Number(b.batchRate ?? b.openingRate) || 0;
                const qty = Number(b.batchQuantity) || 0;

                return {
                  batchName: b.batchName || "",
                  batchQuantity: qty,
                  batchRate: rate, // Always filled
                  openingRate: Number(b.openingRate) || rate, // Fallback to rate
                  batchExpiryDate: b.batchExpiryDate || "",
                  batchManufacturingDate: b.batchManufacturingDate || "",
                  openingValue: Number(b.openingValue) || rate * qty, // Always calculated
                  mode: b.mode,
                };
              })
            );
          } else {
            setBatchRows([]);
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

    hsnCode: string;


    gstLedgerId: string;
    cgstLedgerId: string;
    sgstLedgerId: string;



    taxType: "Taxable" | "Exempt" | "Nil-rated";

    enableBatchTracking: boolean;
    batchName: string;
    batchExpiryDate: string;
    batchManufacturingDate: string;
    allowNegativeStock: boolean;
    maintainInPieces: boolean;
    secondaryUnit: string;
    image: string;
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

    hsnCode: "",


    taxType: "Taxable",
    gstLedgerId: "",
    cgstLedgerId: "",
    sgstLedgerId: "",



    enableBatchTracking: false,
    batchName: "",
    batchExpiryDate: "",
    batchManufacturingDate: "",
    allowNegativeStock: true,
    maintainInPieces: false,
    secondaryUnit: "",
    image: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const [godownAllocations, setGodownAllocations] = useState<
    GodownAllocation[]
  >([]);
  const [batchRows, setBatchRows] = useState([
    {
      id: nanoid(),
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
        id: nanoid(),
        batchName: "",
        batchExpiryDate: "",
        batchManufacturingDate: "",
        batchQuantity: "",
        batchRate: "",
        openingRate: 0,
      },
    ]);
  };
  const removeBatchRow = async (index: number) => {
    const batchToDelete = batchRows[index];

    // UI optimistic update
    setBatchRows((prev) => prev.filter((_, i) => i !== index));

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL
        }/api/stock-items/${id}/batch?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            batchName: batchToDelete.batchName,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete batch");
      }

      console.log("✅ Batch deleted:", data);
    } catch (err) {
      console.error("❌ Delete batch error:", err);
      Swal.fire("Error", "Failed to delete batch", "error");
    }
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
    if (!formData.categoryId)
      newErrors.categoryId = "Category is required";
    if (!formData.unit) newErrors.unit = "Unit is required";

    // ---- HSN ----
    if (!formData.hsnCode) {
      newErrors.hsnCode = "HSN / SAC Code is required";
    }



    // ---- Batch duplicate validation ----
    if (formData.enableBatchTracking) {
      const batchMap: Record<string, number[]> = {};

      batchRows.forEach((b, index) => {
        const key = (b.batchName || "").trim().toUpperCase();
        if (!key) return;

        if (!batchMap[key]) batchMap[key] = [];
        batchMap[key].push(index);
      });

      Object.values(batchMap).forEach((indexes) => {
        if (indexes.length > 1) {
          indexes.forEach((i) => {
            newErrors[`batchName-${i}`] =
              "Batch number already exists";
          });
        }
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
    const stockItem: any = {
      name: formData.name,
      stockGroupId: formData.stockGroupId,
      categoryId: formData.categoryId,
      unit: formData.unit,
      openingBalance: formData.openingBalance,
      openingValue: formData.openingValue,

      hsnCode: formData.hsnCode,
      gstRate: Number(formData.gstRate),
      taxType: formData.taxType,

      gstLedgerId: formData.gstLedgerId,
      cgstLedgerId: formData.cgstLedgerId,
      sgstLedgerId: formData.sgstLedgerId,

      enableBatchTracking: formData.enableBatchTracking,
      allowNegativeStock: formData.allowNegativeStock,
      maintainInPieces: formData.maintainInPieces,
      secondaryUnit: formData.secondaryUnit,

      batches: batchRows.map((b) => ({
        ...b,
        mode: "opening",
        batchQuantity: Number(b.batchQuantity) || 0,
        batchRate: Number(b.batchRate) || 0,
        openingRate: Number(b.batchRate || 0) * Number(b.batchQuantity || 0),
      })),
      godownAllocations,
      barcode,
      company_id: companyId,
      owner_type: ownerType,
      owner_id: ownerId,
    };

    // Use FormData for file upload
    const submitData = new FormData();
    Object.entries(stockItem).forEach(([key, value]) => {
      if (key === "batches" || key === "godownAllocations") {
        submitData.append(key, JSON.stringify(value));
      } else {
        submitData.append(key, value as string);
      }
    });

    if (imageFile) {
      submitData.append("image", imageFile);
    } else if (formData.image) {
      submitData.append("image", formData.image);
    }

    // Determine if we're updating or creating a new record
    const method = id ? "PUT" : "POST"; // Use PUT for update, POST for new
    const url = id
      ? `${import.meta.env.VITE_API_URL}/api/stock-items/${id}` // URL with ID for update
      : `${import.meta.env.VITE_API_URL}/api/stock-items`; // URL for new record creation

    try {
      const res = await fetch(url, {
        method: method,
        body: submitData, // Send FormData instead of JSON
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



  return (
    <div className="pt-[56px] px-4 ">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/app/masters/stock-item")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">New Stock Item</h1>
      </div>

      <div
        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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

            <InputField
              id="hsnCode"
              name="hsnCode"
              label="HSN / SAC Code"
              value={formData.hsnCode}
              onChange={handleChange}
              required
              error={errors.hsnCode}
            />

            <SelectField
              id="gstLedgerId"
              name="gstLedgerId"
              label="IGST"
              value={formData.gstLedgerId}
              onChange={handleChange}
              options={gstOptions}
            />


            <SelectField
              id="cgstLedgerId"
              name="cgstLedgerId"
              label="CGST"
              value={formData.cgstLedgerId}
              onChange={handleChange}
              options={cgstOptions}
            />

            <SelectField
              id="sgstLedgerId"
              name="sgstLedgerId"
              label="SGST"
              value={formData.sgstLedgerId}
              onChange={handleChange}
              options={sgstOptions}
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Product Image</label>
              <div className="flex items-center space-x-4">
                <div
                  className={`relative w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center overflow-hidden ${theme === "dark" ? "border-gray-600 bg-gray-700" : "border-gray-300 bg-gray-50"
                    }`}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setPreview("");
                          setImageFile(null);
                          setFormData(prev => ({ ...prev, image: "" }));
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </>
                  ) : (
                    <Plus className="text-gray-400" size={32} />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors inline-block text-sm font-medium"
                  >
                    {preview ? "Change Image" : "Upload Image"}
                  </label>
                  <p className="text-xs text-gray-500 mt-2">Max size: 5MB (PNG, JPG, JPEG)</p>
                </div>
              </div>
            </div>




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

            <div className="flex flex-col gap-4 mt-4 col-span-2 border border-gray-400 rounded-lg p-3">
              {batchRows.map((row, index) => (
                <div
                  key={row.id}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 items-end w-full"
                >
                  {formData.enableBatchTracking && (
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
                  )}

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
                      value={Number(row.batchRate) * Number(row.batchQuantity)}
                      onChange={() => { }}
                      error={errors[`openingRate-${index}`]}
                      disabled
                    />
                  </div>

                  {formData.enableBatchTracking && (
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
                  )}

                  {formData.enableBatchTracking && (
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
                  )}

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
              className={`px-4 py-2 rounded ${theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600"
                : "bg-gray-200 hover:bg-gray-300"
                }`}
            >
              <Trash2 className="w-4 h-4 inline mr-1" />
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center px-4 py-2 rounded ${theme === "dark"
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
