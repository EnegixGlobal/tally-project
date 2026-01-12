import React, { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus, Search, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";
import type { SalesType } from "../../../types";

// 🔒 System defined sales types (negative id)

const baseSalesTypes = [
  {
    id: -1,
    sales_type: "Sales",
    type: "Sales",
    prefix: "",
    suffix: "",
    current_no: null,
    isSystem: true,
  },
];

const SalesTypeList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [salesTypes, setSalesTypes] = useState<SalesType[]>([]);

  const fetchSalesTypes = async () => {
    try {
      const companyId = localStorage.getItem("company_id");
      const ownerType = localStorage.getItem("supplier");
      const ownerId = localStorage.getItem(
        ownerType === "employee" ? "employee_id" : "user_id"
      );

      let url = `${import.meta.env.VITE_API_URL}/api/sales-types`;

      if (companyId && ownerType && ownerId) {
        url += `?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      const apiData = Array.isArray(json?.data) ? json.data : [];
      setSalesTypes(apiData); // ✅ ONLY DB DATA
    } catch (error) {
      console.error("Failed to fetch sales types:", error);
      setSalesTypes([]);
    }
  };

  const handleDelete = async (id: string | number) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the sales type.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/sales-types/${id}`,
        { method: "DELETE" }
      );
      const result = await res.json();

      if (!res.ok || !result?.success) {
        Swal.fire("Error", result?.message || "Failed to delete", "error");
        return;
      }

      Swal.fire(
        "Deleted!",
        result?.message || "Deleted successfully",
        "success"
      );
      fetchSalesTypes();
    } catch (error) {
      console.error("Delete sales type failed:", error);
      Swal.fire("Error", "Server error. Please try again later.", "error");
    }
  };

  useEffect(() => {
    fetchSalesTypes();
  }, []);

  const filtered = salesTypes.filter((s) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;

    return (
      (s.sales_type || "").toLowerCase().includes(q) ||
      (s.type || "").toLowerCase().includes(q) ||
      (s.prefix || "").toLowerCase().includes(q) ||
      (s.suffix || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="pt-[56px] px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center mb-6">
          <button
            title="Back to Masters"
            onClick={() => navigate("/app/masters")}
            className={`mr-4 p-2 rounded-full ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Sales Voucher Types</h1>
        </div>

        <button
          title="Create Sales Type"
          onClick={() => navigate("/app/masters/sales-types/create")}
          className={`flex items-center px-4 py-2 rounded ${
            theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Plus size={18} className="mr-1" />
          Create
        </button>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="flex items-center mb-4">
          <div
            className={`flex items-center w-full max-w-md px-3 py-2 rounded-md ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <Search size={18} className="mr-2 opacity-70" />
            <input
              type="text"
              placeholder="Search sales types..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-transparent border-none outline-none ${
                theme === "dark"
                  ? "placeholder-gray-500"
                  : "placeholder-gray-400"
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`${
                  theme === "dark"
                    ? "border-b border-gray-700"
                    : "border-b border-gray-200"
                }`}
              >
                <th className="px-4 py-3 text-left">Sales Type</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Prefix</th>
                <th className="px-4 py-3 text-left">Suffix</th>
                <th className="px-4 py-3 text-right">Current No</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* 🔒 STATIC SYSTEM ROW */}
              <tr
                className={`${
                  theme === "dark"
                    ? "border-b border-gray-700"
                    : "border-b border-gray-200"
                } `}
              >
                <td className="px-4 py-3 font-medium">Sales</td>
                <td className="px-4 py-3">Sales</td>
                <td className="px-4 py-3 font-mono">—</td>
                <td className="px-4 py-3 font-mono">—</td>
                <td className="px-4 py-3 text-right font-mono">—</td>
                <td className="px-4 py-3 text-center opacity-50">
                  {/* ❌ No Actions */}
                </td>
              </tr>

              {/* 🔓 DB DATA ROWS */}
              {filtered.map((s) => (
                <tr
                  key={String(s.id)}
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  } hover:bg-opacity-10 hover:bg-blue-500`}
                >
                  <td className="px-4 py-3">{s.sales_type}</td>
                  <td className="px-4 py-3">{s.type}</td>
                  <td className="px-4 py-3 font-mono">{s.prefix || "—"}</td>
                  <td className="px-4 py-3 font-mono">{s.suffix || "—"}</td>
                  <td className="px-4 py-3 text-right font-mono">
                    {Number(s.current_no ?? 0)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        title="Edit"
                        onClick={() =>
                          navigate(`/app/masters/sales-types/edit/${s.id}`)
                        }
                        className={`p-1 rounded ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        title="Delete"
                        onClick={() => handleDelete(s.id)}
                        className={`p-1 rounded ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="opacity-70">No sales types found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SalesTypeList;
