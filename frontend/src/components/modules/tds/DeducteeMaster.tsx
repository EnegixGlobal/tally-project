import React, { useEffect, useState, useCallback } from "react";
import {
  Users,
  Search,
  Plus,
  Edit,
  ArrowLeft,
  Trash2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Deductee {
  id: string;
  name: string;
  pan: string;
  category: "individual" | "company" | "huf" | "firm" | "aop" | "trust";
  address: string;
  email: string;
  phone: string;
  tdsSection: string;
  rate: number;
  threshold: number;
  totalDeducted: number;
  lastDeduction: string | null;
  status: "active" | "inactive";
}

const categories = [
  "all",
  "individual",
  "company",
  "huf",
  "firm",
  "aop",
  "trust",
] as const;

const DeducteeMaster: React.FC = () => {
  const [deductees, setDeductees] = useState<Deductee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDeductee, setEditDeductee] = useState<Deductee | null>(null);

  const navigate = useNavigate();

  // Fetch deductees from backend API with filters
  const fetchDeductees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory !== "all") params.append("category", selectedCategory);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deductees?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch deductees");
      const data: Deductee[] = await res.json();
      setDeductees(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error fetching deductees";
      setError(errorMessage);
      setDeductees([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedCategory]);

  useEffect(() => {
    fetchDeductees();
  }, [fetchDeductees]);

  // Helper: category color
  const getCategoryColor = (cat: Deductee["category"]) => {
    switch (cat) {
      case "individual":
        return "bg-blue-100 text-blue-800";
      case "company":
        return "bg-green-100 text-green-800";
      case "firm":
        return "bg-purple-100 text-purple-800";
      case "huf":
        return "bg-yellow-100 text-yellow-800";
      case "aop":
        return "bg-orange-100 text-orange-800";
      case "trust":
        return "bg-pink-100 text-pink-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Helper: status color
  const getStatusColor = (status: Deductee["status"]) => {
    return status === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  };

  // Form state for Add/Edit
  const initialFormState: Omit<Deductee, "id" | "totalDeducted" | "lastDeduction"> & {
    totalDeducted?: number;
    lastDeduction?: string | null;
  } = {
    name: "",
    pan: "",
    category: "individual",
    address: "",
    email: "",
    phone: "",
    tdsSection: "",
    rate: 0,
    threshold: 0,
    status: "active",
    totalDeducted: 0,
    lastDeduction: null,
  };

  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof typeof formData, string>>>(
    {}
  );

  // Open Add Modal
  const openAddModal = () => {
    setFormData(initialFormState);
    setFormErrors({});
    setShowAddModal(true);
  };

  // Open Edit Modal
  const openEditModal = (deductee: Deductee) => {
    setFormData({
      ...deductee,
      totalDeducted: deductee.totalDeducted,
      lastDeduction: deductee.lastDeduction,
    });
    setFormErrors({});
    setEditDeductee(deductee);
    setShowEditModal(true);
  };

  // Validate form data
  const validateForm = () => {
    const errors: Partial<Record<keyof typeof formData, string>> = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    if (!formData.pan.trim()) errors.pan = "PAN is required";
    else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.pan.toUpperCase()))
      errors.pan = "PAN format invalid";
    if (!formData.category) errors.category = "Category is required";
    if (!formData.tdsSection.trim()) errors.tdsSection = "TDS Section is required";
    if (formData.rate < 0) errors.rate = "Rate must be >= 0";
    if (formData.threshold < 0) errors.threshold = "Threshold must be >= 0";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle Add Deductee submit
  const handleAddSubmit = async () => {
    if (!validateForm()) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deductees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json();
        alert("Failed to add deductee: " + (errData.error || "Unknown error"));
        return;
      }

      alert("Deductee added successfully");
      setShowAddModal(false);
      fetchDeductees();
    } catch {
      alert("Error adding deductee");
    }
  };

  // Handle Edit Deductee submit
  const handleEditSubmit = async () => {
    if (!validateForm() || !editDeductee) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deductees/${editDeductee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const errData = await res.json();
        alert("Failed to update deductee: " + (errData.error || "Unknown error"));
        return;
      }
      alert("Deductee updated successfully");
      setShowEditModal(false);
      setEditDeductee(null);
      fetchDeductees();
    } catch {
      alert("Error updating deductee");
    }
  };

  // Handle Delete Deductee
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this deductee?")) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/deductees/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        alert("Failed to delete deductee");
        return;
      }
      alert("Deductee deleted successfully");
      fetchDeductees();
    } catch {
      alert("Error deleting deductee");
    }
  };

  return (
    <div className="min-h-screen pt-[56px] px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
          <button
            title="Back to Reports"
            type="button"
            onClick={() => navigate("/app/tds")}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Deductee Master</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Deductee List</h1>
            </div>
            <div className="flex gap-2">
              <button
                title="Add"
                onClick={openAddModal}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Deductee
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, PAN, or TDS section..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              title="All Categories"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            {loading && <p className="text-sm text-gray-600">Loading deductees...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && (
              <p className="text-sm text-gray-600">
                Showing {deductees.length} deductee{deductees.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          {/* Deductees Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Name</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">PAN</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Category</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">TDS Section</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Rate (%)</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Total Deducted</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Status</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deductees.map((deductee) => (
                  <tr key={deductee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b">
                      <div>
                        <div className="font-medium text-gray-900">{deductee.name}</div>
                        <div className="text-sm text-gray-600">{deductee.email}</div>
                      </div>
                    </td>
                    <td className="p-4 border-b">
                      <span className="font-mono text-sm text-gray-900">{deductee.pan}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(
                          deductee.category
                        )}`}
                      >
                        {deductee.category.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="font-mono text-sm text-gray-900">{deductee.tdsSection}</span>
                    </td>
                    <td className="p-4 border-b">{deductee.rate}%</td>
                    <td className="p-4 border-b">
  <span className="font-medium text-gray-900">
    ₹{(deductee.totalDeducted ?? 0).toLocaleString()}
  </span>
</td>

                    <td className="p-4 border-b">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          deductee.status
                        )}`}
                      >
                        {deductee.status}
                      </span>
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex gap-2">
                        <button
                          title="Edit Deductee"
                          onClick={() => openEditModal(deductee)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          title="Delete Deductee"
                          onClick={() => handleDelete(deductee.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {deductees.length === 0 && !loading && !error && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-500">
                      No deductees found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Deductee Modal */}
        {showAddModal && (
          <DeducteeFormModal
            title="Add New Deductee"
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            onClose={() => setShowAddModal(false)}
            onSubmit={handleAddSubmit}
          />
        )}

        {/* Edit Deductee Modal */}
        {showEditModal && editDeductee && (
          <DeducteeFormModal
            title="Edit Deductee"
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            onClose={() => {
              setShowEditModal(false);
              setEditDeductee(null);
            }}
            onSubmit={handleEditSubmit}
          />
        )}
      </div>
    </div>
  );
};
const initialFormState: Omit<Deductee, "id" | "totalDeducted" | "lastDeduction"> & {
  totalDeducted?: number;
  lastDeduction?: string | null;
} = {
  name: "",
  pan: "",
  category: "individual",
  address: "",
  email: "",
  phone: "",
  tdsSection: "",
  rate: 0,
  threshold: 0,
  status: "active",
  totalDeducted: 0,
  lastDeduction: null,
};

// Deductee Form Modal as separate component
interface DeducteeFormModalProps {
  title: string;
  formData: Omit<Deductee, "id" | "totalDeducted" | "lastDeduction"> & Partial<Pick<Deductee, "totalDeducted" | "lastDeduction">>;
  setFormData: React.Dispatch<
    React.SetStateAction<
      Omit<Deductee, "id" | "totalDeducted" | "lastDeduction"> & Partial<Pick<Deductee, "totalDeducted" | "lastDeduction">>
    >
  >;
  formErrors: Partial<Record<keyof (Omit<Deductee, "id" | "totalDeducted" | "lastDeduction"> & Partial<Pick<Deductee, "totalDeducted" | "lastDeduction">>), string>>;
  onClose: () => void;
  onSubmit: () => void;
}

const DeducteeFormModal: React.FC<DeducteeFormModalProps> = ({
  
  title,
 
  formErrors,
  onClose,
  onSubmit,
}) => {
  const categories = [
    "individual",
    "company",
    "huf",
    "firm",
    "aop",
    "trust",
  ] as const;
  const [formData, setFormData] = useState(initialFormState);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <label className="block mb-1 font-medium">Full Name<span className="text-red-500">*</span></label>
            <input
              type="text"
              title="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              autoFocus
            />
            {formErrors.name && <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>}
          </div>

          {/* PAN */}
          <div>
            <label className="block mb-1 font-medium">PAN Number<span className="text-red-500">*</span></label>
            <input
              type="text"
              title="PAN Number"
              value={formData.pan}
              onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
              maxLength={10}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.pan ? "border-red-500" : "border-gray-300"
              }`}
            />
            {formErrors.pan && <p className="text-red-500 text-xs mt-1">{formErrors.pan}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block mb-1 font-medium">Category<span className="text-red-500">*</span></label>
            <select
              title="Select Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as typeof categories[number] })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.category ? "border-red-500" : "border-gray-300"
              }`}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
            {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
          </div>

          {/* TDS Section */}
          <div>
            <label className="block mb-1 font-medium">TDS Section<span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.tdsSection}
              onChange={(e) => setFormData({ ...formData, tdsSection: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                formErrors.tdsSection ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="e.g. 194J"
            />
            {formErrors.tdsSection && <p className="text-red-500 text-xs mt-1">{formErrors.tdsSection}</p>}
          </div>

          {/* Rate */}
          <div>
            <label className="block mb-1 font-medium">Rate (%)</label>
            <input
              type="number"
              title="TDS Rate Percentage"
              value={formData.rate}
              onChange={(e) => setFormData({ ...formData, rate: Math.max(0, Number(e.target.value)) })}
              min={0}
              step={0.01}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Threshold */}
          <div>
            <label className="block mb-1 font-medium">Threshold (₹)</label>
            <input
              type="number"
              title="TDS Threshold Amount"
              value={formData.threshold}
              onChange={(e) => setFormData({ ...formData, threshold: Math.max(0, Number(e.target.value)) })}
              min={0}
              step={0.01}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-1 font-medium">Email Address</label>
            <input
              type="email"
              title="Email Address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-1 font-medium">Phone Number</label>
            <input
              type="tel"
              title="Phone Number"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className="block mb-1 font-medium">Address</label>
            <textarea
              rows={3}
              title="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block mb-1 font-medium">Status</label>
            <select
              title="Status"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as Deductee["status"] })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeducteeMaster;
