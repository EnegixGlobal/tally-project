import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save } from "lucide-react";
import type { UnitOfMeasurement } from "../../../types";
import Swal from "sweetalert2";

const UnitForm: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const ownerType = localStorage.getItem("userType");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  const [formData, setFormData] = useState<Omit<UnitOfMeasurement, "id">>({
    name: "",
    symbol: "",
    type: "Simple", // Add type field
    formalName: "", // For Simple units
    decimalPlaces: 2, // For Simple units
    firstUnit: "", // For Compound units
    conversionFactor: 1, // For Compound units
    secondUnit: "", // For Compound units
  });

  // Keyboard shortcuts - Tally style
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "F9") {
        e.preventDefault();
        const form = document.querySelector("form") as HTMLFormElement;
        if (form) form.requestSubmit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        navigate("/app/masters/units");
      } else if (e.altKey && e.key.toLowerCase() === "t") {
        e.preventDefault();
        setFormData((prev) => ({
          ...prev,
          type: prev.type === "Simple" ? "Compound" : "Simple",
        }));
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [navigate]);

  useEffect(() => {
    if (isEditMode && id) {
      const fetchUnit = async () => {
        try {
          const res = await fetch(
            `${import.meta.env.VITE_API_URL}/api/stock-units/${id}?owner_type=${ownerType}&owner_id=${ownerId}`
          );
          if (!res.ok) throw new Error("Unit not found");
          const unit = await res.json();

          setFormData({
            name: unit.name,
            symbol: unit.symbol,
            type: unit.type || "Simple",
            formalName: unit.formalName || "",
            decimalPlaces: unit.decimalPlaces || 2,
            firstUnit: unit.firstUnit || "",
            conversionFactor: unit.conversionFactor || 1,
            secondUnit: unit.secondUnit || "",
          });
        } catch (err) {
          console.error("Error fetching unit:", err);
        }
      };

      fetchUnit();
    }
  }, [id, isEditMode, ownerType, ownerId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "decimalPlaces" || name === "conversionFactor"
          ? Number(value)
          : value,
    }));
  };

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const payload = { ...formData }; // only formData
  const queryParams = `owner_type=${ownerType}&owner_id=${ownerId}`;
  const apiUrl = `${import.meta.env.VITE_API_URL}/api/stock-units`;
  const url = isEditMode ? `${apiUrl}/${id}?${queryParams}` : `${apiUrl}?${queryParams}`;
  const method = isEditMode ? "PUT" : "POST";

  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      Swal.fire("Error", result.message || "Something went wrong", "error");
      return;
    }

    Swal.fire({
      icon: "success",
      title: isEditMode ? "Updated Successfully" : "Unit Created",
      text: result.message,
    }).then(() => {
      navigate("/app/masters/units");
    });
  } catch (error) {
    console.error("Unit form error:", error);
    Swal.fire("Error", "Server error. Please try again later.", "error");
  }
};


  return (
    <div className="pt-[56px] px-4 ">
      <div className="flex items-center mb-6">
        <button
          title="Back to Units"
          onClick={() => navigate("/app/masters/units")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">
          {isEditMode ? "Edit" : "Create"} Unit
        </h1>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <form onSubmit={handleSubmit}>
          {/* Unit Name - Always visible */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="name">
              Unit Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Kilogram, Pieces, Meters"
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-white"
                  : "bg-white border-gray-300 focus:border-blue-500"
              } outline-none transition-colors`}
            />
          </div>

          {/* Type Selection - Like Tally */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="type">
              Type *
            </label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-white"
                  : "bg-white border-gray-300 focus:border-blue-500"
              } outline-none transition-colors`}
            >
              <option value="Simple">Simple</option>
              <option value="Compound">Compound</option>
            </select>
          </div>

          {/* Simple Unit Fields */}
          {formData.type === "Simple" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="symbol"
                  >
                    Symbol *
                  </label>
                  <input
                    type="text"
                    id="symbol"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Kg, Pcs, Mtr"
                    className={`w-full p-2 rounded border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-white"
                        : "bg-white border-gray-300 focus:border-blue-500"
                    } outline-none transition-colors`}
                  />
                </div>

                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="decimalPlaces"
                  >
                    Number of Decimal Places
                  </label>
                  <input
                    type="number"
                    id="decimalPlaces"
                    name="decimalPlaces"
                    value={formData.decimalPlaces}
                    onChange={handleChange}
                    min="0"
                    max="6"
                    placeholder="2"
                    className={`w-full p-2 rounded border ${
                      theme === "dark"
                        ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-white"
                        : "bg-white border-gray-300 focus:border-blue-500"
                    } outline-none transition-colors`}
                  />
                </div>
              </div>

              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  htmlFor="formalName"
                >
                  Formal Name
                </label>
                <input
                  type="text"
                  id="formalName"
                  name="formalName"
                  value={formData.formalName}
                  onChange={handleChange}
                  placeholder="e.g., Kilograms, Pieces, Meters"
                  className={`w-full p-2 rounded border ${
                    theme === "dark"
                      ? "bg-gray-700 border-gray-600 focus:border-blue-500 text-white"
                      : "bg-white border-gray-300 focus:border-blue-500"
                  } outline-none transition-colors`}
                />
              </div>
            </div>
          )}

          {/* Compound Unit Fields */}
          {formData.type === "Compound" && (
            <div className="space-y-6">
              <div
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-blue-50"
                }`}
              >
                <h4 className="font-medium mb-3">Unit Conversion</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="firstUnit"
                    >
                      First Unit *
                    </label>
                    <input
                      type="text"
                      id="firstUnit"
                      name="firstUnit"
                      value={formData.firstUnit}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Kg"
                      className={`w-full p-2 rounded border ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 focus:border-blue-500 text-white"
                          : "bg-white border-gray-300 focus:border-blue-500"
                      } outline-none transition-colors`}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="conversionFactor"
                    >
                      Conversion Factor *
                    </label>
                    <input
                      type="number"
                      id="conversionFactor"
                      name="conversionFactor"
                      value={formData.conversionFactor}
                      onChange={handleChange}
                      required
                      min="0.001"
                      step="0.001"
                      placeholder="1000"
                      className={`w-full p-2 rounded border ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 focus:border-blue-500 text-white"
                          : "bg-white border-gray-300 focus:border-blue-500"
                      } outline-none transition-colors`}
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      htmlFor="secondUnit"
                    >
                      Second Unit *
                    </label>
                    <input
                      type="text"
                      id="secondUnit"
                      name="secondUnit"
                      value={formData.secondUnit}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Gms"
                      className={`w-full p-2 rounded border ${
                        theme === "dark"
                          ? "bg-gray-800 border-gray-600 focus:border-blue-500 text-white"
                          : "bg-white border-gray-300 focus:border-blue-500"
                      } outline-none transition-colors`}
                    />
                  </div>
                </div>

                {/* Conversion Preview */}
                {formData.firstUnit &&
                  formData.conversionFactor &&
                  formData.secondUnit && (
                    <div
                      className={`mt-3 p-3 rounded ${
                        theme === "dark" ? "bg-gray-800" : "bg-white"
                      }`}
                    >
                      <p className="text-sm font-medium">
                        Conversion: 1 {formData.firstUnit} ={" "}
                        {formData.conversionFactor} {formData.secondUnit}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4 mt-8">
            <button
              type="button"
              onClick={() => navigate("/app/masters/units")}
              className={`px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              } transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              } transition-colors`}
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
        <p className="text-sm mb-2">
          <span className="font-semibold">Unit Types:</span>
        </p>
        <ul className="text-xs space-y-1 mb-3">
          <li>
            • <strong>Simple:</strong> Basic units like Kg, Pcs, Mtr with symbol
            and decimal places
          </li>
          <li>
            • <strong>Compound:</strong> Units with conversion like 1 Kg = 1000
            Gms
          </li>
        </ul>
        <p className="text-sm">
          <span className="font-semibold">Shortcuts:</span> F9 to save, Esc to
          cancel, Alt+T to change type.
        </p>
      </div>
    </div>
  );
};

export default UnitForm;
