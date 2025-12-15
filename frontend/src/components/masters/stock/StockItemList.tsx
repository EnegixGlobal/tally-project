import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Package, Upload } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import Barcode from "react-barcode";
import Swal from "sweetalert2";

interface StockItem {
  id: string;
  name: string;
  stockGroupId: string;
  unit: string;
  openingBalance: number;
  hsnCode?: string;
  gstRate?: number;
  taxType?: string;
  barcode: string;
}
const StockItemList = () => {
  const { theme, stockGroups = [], units = [] } = useAppContext();
  const navigate = useNavigate();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  //   const [barcodeValue] = useState('');
  // const [, setItemDetails] = useState<StockItem | null>(null);
  //   const [, setError] = useState<string | null>(null);

  // fetch units from database
  const [unitsData, setUnitsData] = useState([]);

  useEffect(() => {
    const fetchUnits = async () => {
      if (!companyId || !ownerType || !ownerId) return;

      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/stock-units?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const data = await res.json();

        console.log("this is unit", data);

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
    if (!companyId || !ownerType || !ownerId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const json = await res.json();
        console.log("jsondata", json);
        if (json.success) {
          setStockItems(json.data);
        } else {
          console.error("API returned failure:", json.message);
        }
      } catch (err) {
        console.error("❌ Failed to fetch stock items:", err);
      }
    };

    fetchData();
  }, [companyId, ownerType, ownerId]);

  // const handleSearch = async () => {
  //     setError(null);
  //     setItemDetails(null);
  //     // API call to backend
  //     try {
  //       const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-items/barcode/${barcodeValue}`);
  //       const json = await res.json();
  //       if (json.success) {
  //         setItemDetails(json.data);
  //       } else {
  //         setError(json.message || 'Item not found');
  //       }
  //     } catch (err) {
  //       setError('Failed to fetch item details');
  //     }
  //   };

  const handleDelete = async (id: string) => {
    const itemToDelete = stockItems.find((item) => item.id === id);

    if (!itemToDelete) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Stock item not found.",
      });
      return;
    }

    const result = await Swal.fire({
      title: `Are you sure?`,
      text: `Do you really want to delete "${itemToDelete.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("supplier");
    const ownerId = localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    );

    const params = new URLSearchParams({
      company_id: companyId!,
      owner_type: ownerType!,
      owner_id: ownerId!,
    });

    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/stock-items/${id}?${params.toString()}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const json = await res.json();

      if (json.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Stock item deleted successfully.",
        });

        setStockItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: json.message || "Failed to delete stock item.",
        });
      }
    } catch (err) {
      console.error("❌ Error deleting stock item:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while deleting the stock item.",
      });
    }
  };

  const handleEdit = (id: string) => {
    const itemToEdit = stockItems.find((item) => item.id === id);
    if (!itemToEdit) {
      alert("Stock item not found.");
      return;
    }
    navigate(`/app/masters/stock-item/edit/${id}`);
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Stock Items</h1>
        <div className="flex gap-3">
          <Link
            to="/app/masters/stock-item/batches"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            <Package size={18} />
            <span>Batch Management</span>
          </Link>
          <Link
            to="/app/masters/stock-item/bulk-create"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            <Upload size={18} />
            <span>Bulk Creation</span>
          </Link>
          <Link
            to="/app/masters/stock-item/create"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Plus size={18} />
            <span>New Stock Item</span>
          </Link>
        </div>
      </div>

      <div
        className={`rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="flex flex-col">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Name
                    </th>
                    
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Unit
                    </th>

                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      HSN/SAC
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      GST Rate
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Tax Type
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Barcode
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        theme === "dark" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    theme === "dark"
                      ? "bg-gray-800 divide-gray-600"
                      : "bg-white divide-gray-200"
                  }`}
                >
                  {stockItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-center ${
                          theme === "dark" ? "text-gray-400" : "text-gray-500"
                        }`}
                      >
                        No stock items found
                      </td>
                    </tr>
                  ) : (
                    stockItems
                      .filter((item) => item.id)
                      .map((item) => (
                        <tr
                          key={item.id}
                          className={`${
                            theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              theme === "dark"
                                ? "text-gray-300"
                                : "text-gray-900"
                            }`}
                          >
                            {item.name}
                          </td>
                          
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {unitsData.find(
                              (u: any) => String(u.id) === String(item.unit)
                            )?.name || "N/A"}
                          </td>

                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {item.hsnCode || "N/A"}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {item.gstRate ? `${item.gstRate}%` : "N/A"}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${
                              theme === "dark"
                                ? "text-gray-400"
                                : "text-gray-500"
                            }`}
                          >
                            {item.taxType || "N/A"}
                          </td>

                          <td>
                            {item.barcode ? (
                              <Barcode
                                value={item.barcode}
                                width={1}
                                height={20}
                                fontSize={14}
                              />
                            ) : (
                              "N/A"
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              title="Edit Stock Item"
                              onClick={() => handleEdit(item.id)}
                              className={`mr-2 p-1 rounded ${
                                theme === "dark"
                                  ? "text-blue-400 hover:text-blue-300 hover:bg-gray-600"
                                  : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              }`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              title="Delete Stock Item"
                              onClick={() => handleDelete(item.id)}
                              className={`p-1 rounded ${
                                theme === "dark"
                                  ? "text-red-400 hover:text-red-300 hover:bg-gray-600"
                                  : "text-red-600 hover:text-red-700 hover:bg-red-50"
                              }`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockItemList;
