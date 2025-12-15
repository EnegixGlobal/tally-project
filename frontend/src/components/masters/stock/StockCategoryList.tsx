import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import type { StockCategory } from "../../../types";
import { Edit, Trash2, Plus, Search, ArrowLeft } from "lucide-react";
import Swal from "sweetalert2";

const StockCategoryList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categories, setCategories] = useState<StockCategory[]>([]);
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );
  const queryParams = `company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

  // stockGroups get
  const [stockGroups, setStockGroupData] = useState<any[]>([]);
  useEffect(() => {
    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("supplier");
    const ownerId = localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    );

    if (!companyId || !ownerType || !ownerId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/stock-groups/list?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setStockGroupData(data);
      } catch (err) {
        console.error("Failed to fetch stock groups:", err);
      }
    };

    fetchData();
  }, []);

  // stock category list fatch
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-categories?${queryParams}`
        );
        const data = await res.json();
        console.log("dddd", data);

        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch stock categories:", err);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This category will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/stock-categories/${id}?${queryParams}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();

      if (res.ok) {
        setCategories((prev) => prev.filter((cat) => cat.id !== id));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: data.message || "Category deleted successfully!",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed!",
          text: data.message || "Failed to delete category",
        });
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire({
        icon: "error",
        title: "Error!",
        text: "Something went wrong!",
      });
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-[56px] px-4" tabIndex={0}>
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
          <h1
            className={`text-2xl font-bold ${
              theme === "dark" ? "text-gray-100" : "text-gray-900"
            }`}
          >
            Stock Categories
          </h1>
        </div>
        <button
          type="button"
          title="Create Category"
          onClick={() => navigate("/app/masters/stock-category/create")}
          className={`flex items-center px-4 py-2 rounded text-sm font-medium ${
            theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Plus size={18} className="mr-1" />
          New Category
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
            <Search
              size={18}
              className={`mr-2 opacity-70 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-transparent border-none outline-none ${
                theme === "dark"
                  ? "text-gray-100 placeholder-gray-500"
                  : "text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <th
                  className={`px-4 py-3 text-left ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Name
                </th>
                <th
                  className={`px-4 py-3 text-left ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Parent Category
                </th>
                <th
                  className={`px-4 py-3 text-left ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Description
                </th>
                <th
                  className={`px-4 py-3 text-center ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat: StockCategory) => (
                <tr
                  key={cat.id}
                  className={`border-b ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  } hover:bg-opacity-10 hover:bg-blue-500`}
                >
                  <td
                    className={`px-4 py-3 ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {cat.name}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {(() => {
                      const parentId = cat.parent_id ?? cat.parent;
                      if (!parentId) return "-";

                      const parentGroup = stockGroups.find(
                        (group) => Number(group.id) === Number(parentId)
                      );

                      return parentGroup ? parentGroup.name : parentId;
                    })()}
                  </td>

                  <td
                    className={`px-4 py-3 ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {cat.description || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        title="Edit Category"
                        onClick={() =>
                          navigate(`/app/masters/stock-category/edit/${cat.id}`)
                        }
                        className={`p-1 rounded ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <Edit
                          size={16}
                          className={`${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        />
                      </button>
                      <button
                        title="Delete Category"
                        onClick={() => handleDelete(cat.id)}
                        className={`p-1 rounded ${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        <Trash2
                          size={16}
                          className={`${
                            theme === "dark" ? "text-gray-300" : "text-gray-700"
                          }`}
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-8">
            <p
              className={`opacity-70 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No categories found matching your search.
            </p>
          </div>
        )}
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p
          className={`text-sm ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <span className="font-semibold">Keyboard Shortcuts:</span> Search to
          filter, edit or delete using actions.
        </p>
      </div>
    </div>
  );
};

export default StockCategoryList;
