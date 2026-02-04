import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Package, Upload, X } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import Barcode from "react-barcode";
import Swal from "sweetalert2";

interface StockItem {
  id: string;
  name: string;
  stockGroupId: string;
  unit: string;
  openingBalance: number;
  gstLedgerId?: string | number;
  cgstLedgerId?: string | number;
  sgstLedgerId?: string | number;
  hsnCode?: string;
  gstRate?: number;
  taxType?: string;
  barcode: string;
  image?: string;
}
const StockItemList = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );





  // fetch units from database
  const [unitsData, setUnitsData] = useState<any[]>([]);

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
    if (!companyId || !ownerType || !ownerId) return;

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const json = await res.json();
        console.log('josn', json.data)

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

  // get ledger
  const [ledgersData, setLedgersData] = useState<any[]>([]);

  useEffect(() => {

    const fetchLedgers = async () => {

      if (!companyId || !ownerType || !ownerId) {
        console.error("Missing identifiers for ledger fetch");
        setLedgersData([]);
        return;
      }

      try {

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const data = await res.json();

        if (res.ok) {
          setLedgersData(Array.isArray(data) ? data : []);
        } else {
          console.error(data.message || "Failed to fetch ledgers");
          setLedgersData([]);
        }

      } catch (error) {
        console.error("Failed to fetch ledgers:", error);
        setLedgersData([]);
      }
    };

    fetchLedgers();

  }, [companyId, ownerType, ownerId]);


  console.log('ledger', ledgersData)

  // get igst sgst cgst ledger name
  const getLedgerName = (ledgerId: any) => {
    if (!ledgerId) return "N/A";

    const ledger = ledgersData.find(
      (l) => String(l.id) === String(ledgerId)
    );

    return ledger ? ledger.name : "N/A";
  };


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
        `${import.meta.env.VITE_API_URL
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === "dark"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
              }`}
          >
            <Package size={18} />
            <span>Batch Management</span>
          </Link>
          <Link
            to="/app/masters/stock-item/bulk-create"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === "dark"
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
              }`}
          >
            <Upload size={18} />
            <span>Bulk Creation</span>
          </Link>
          <Link
            to="/app/masters/stock-item/create"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === "dark"
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
        className={`rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
      >
        <div className="flex flex-col">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead
                  className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                >
                  <tr>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      Image
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      Name
                    </th>

                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      Unit
                    </th>

                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      HSN/SAC
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      IGST (%)
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      CGST (%)
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      SGST (%)
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      Tax Type
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      Barcode
                    </th>
                    <th
                      scope="col"
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"
                        }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${theme === "dark"
                    ? "bg-gray-800 divide-gray-600"
                    : "bg-white divide-gray-200"
                    }`}
                >
                  {stockItems.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        className={`px-6 py-4 whitespace-nowrap text-sm text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"
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
                          className={`${theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-50"
                            }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div
                              className="flex-shrink-0 h-16 w-16 cursor-zoom-in"
                              onClick={() => setSelectedImage(item.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&color=fff`)}
                            >
                              <img
                                className={`h-16 w-16 rounded-lg object-cover border-2 shadow-sm ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}
                                src={item.image ? item.image : `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&color=fff`}
                                alt={item.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=random&color=fff`;
                                }}
                              />
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${theme === "dark"
                              ? "text-gray-200"
                              : "text-gray-900"
                              }`}
                          >
                            {item.name}
                          </td>

                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark"
                              ? "text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {unitsData.find(
                              (u: any) => String(u.id) === String(item.unit)
                            )?.name || "N/A"}
                          </td>

                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark"
                              ? "text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {item.hsnCode || "N/A"}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark"
                              ? "text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {getLedgerName(item.gstLedgerId)}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark"
                              ? "text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {getLedgerName(item.cgstLedgerId)}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark"
                              ? "text-gray-400"
                              : "text-gray-500"
                              }`}
                          >
                            {getLedgerName(item.sgstLedgerId)}
                          </td>
                          <td
                            className={`px-6 py-4 whitespace-nowrap text-sm ${theme === "dark"
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
                              className={`mr-2 p-1 rounded ${theme === "dark"
                                ? "text-blue-400 hover:text-blue-300 hover:bg-gray-600"
                                : "text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                }`}
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              title="Delete Stock Item"
                              onClick={() => handleDelete(item.id)}
                              className={`p-1 rounded ${theme === "dark"
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

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors bg-white/10 p-2 rounded-full backdrop-blur-md"
            >
              <X size={24} />
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border-4 border-white/20"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default StockItemList;
