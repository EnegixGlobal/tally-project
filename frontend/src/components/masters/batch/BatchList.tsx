import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import swl from "sweetalert2";
import {
  ArrowLeft,
  Calendar,
  AlertTriangle,
  Package,
  Search,
  Filter,
} from "lucide-react";

interface StockItem {
  id: string;
  name: string;
  unit: string;
  openingBalance: number;
  hsnCode?: string;
  enableBatchTracking: boolean;
  type?: string;

  // Old single values from DB
  batchNumber?: string;
  batchExpiryDate?: string;
  batchManufacturingDate?: string;

  // New parsed multiple batches
  batches?: Array<{
    batchName: string;
    batchExpiryDate: string | null;
    batchManufacturingDate: string | null;
    batchQuantity?: number;
    batchRate?: number | null;
    openingRate?: number | null;
    batchType?: string;
    mode?: string;
  }>;
}

const BatchList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "expiring" | "expired"
  >("all");
  const [filterStockItem, setFilterStockItem] = useState("");
  const [openFormRowIndex, setOpenFormRowIndex] = useState<number | null>(null);

  const [batchForm, setBatchForm] = useState({
    batchName: "",
    batchQuantity: "",
    batchRate: "",
    batchManufacturingDate: "",
    batchExpiryDate: "",
  });

  const [editingBatch, setEditingBatch] = useState<{
    itemId: string;
    batchName: string;
  } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchForm({
      ...batchForm,
      [e.target.name]: e.target.value,
    });
  };

  console.log("batch number", batchForm);

  const handleSaveBatch = async (itemId: string) => {
    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    );

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stock-items/${itemId}/batches`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchName: batchForm.batchName,
            batchQuantity: Number(batchForm.batchQuantity),
            batchRate: Number(batchForm.batchRate),
            batchExpiryDate: batchForm.batchExpiryDate || null,
            batchManufacturingDate: batchForm.batchManufacturingDate || null,
            mode: "purchase",
            company_id,
            owner_type,
            owner_id,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Batch Added Successfully ✅");

        setBatchForm({
          batchName: "",
          batchQuantity: "",
          batchRate: "",
          batchManufacturingDate: "",
          batchExpiryDate: "",
        });

        setOpenFormRowIndex(null);
        await loadStockItems();
      } else {
        alert(data.message || "Failed to add batch");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding batch");
    }
  };

  const handleDeleteBatch = async (itemId: string, batchName: string) => {
    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    );

    if (!company_id || !owner_type || !owner_id) {
      alert("Missing auth details");
      return;
    }

    if (!window.confirm(`Delete batch "${batchName}" ?`)) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stock-items/${itemId}/batch` +
          `?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ batchName }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Batch deleted successfully ✅");
        await loadStockItems(); // 🔥 refresh UI
      } else {
        alert(data.message || "Failed to delete batch");
      }
    } catch (err) {
      console.error("Delete batch error:", err);
      alert("Error deleting batch");
    }
  };

  const handleUpdateBatch = async () => {
    if (!editingBatch) return;

    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    );

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stock-items/${
          editingBatch.itemId
        }/batches` +
          `?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            batchName: editingBatch.batchName,
            quantity: Number(batchForm.batchQuantity),
            rate: Number(batchForm.batchRate),
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Batch updated successfully ✅");
        setEditingBatch(null);
        setEditingBatch(null);
        setOpenFormRowIndex(null);
        await loadStockItems();
      } else {
        alert(data.message || "Update failed");
      }
    } catch (err) {
      console.error("Update batch error:", err);
      alert("Error updating batch");
    }
  };

  // Load stock items
  const loadStockItems = async () => {
    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    );

    if (!company_id || !owner_type || !owner_id) return;

    const params = new URLSearchParams({
      company_id,
      owner_type,
      owner_id,
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stock-items?${params.toString()}`
      );

      const data = await res.json();
      setStockItems(data.success ? data.data : []);
    } catch (err) {
      console.error("Error loading stock items", err);
      setStockItems([]);
    }
  };

  // Fetch stock items on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const fetchData = async () => {
      await loadStockItems();
      if (isMounted) {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Helper function to get batch status
  const getBatchStatus = (batch: any): "active" | "expiring" | "expired" => {
    if (!batch.batchExpiryDate) return "active";

    const days = Math.ceil(
      (new Date(batch.batchExpiryDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24)
    );

    if (days < 0) return "expired";
    if (days <= 7) return "expiring";
    return "active";
  };

  // NEW: overall status calculator
  const getOverallStatus = (batches: any[]) => {
    if (!batches || batches.length === 0) return "active";

    let status: "active" | "expiring" | "expired" = "active";

    for (let b of batches) {
      const batchStatus = getBatchStatus(b);
      if (batchStatus === "expired") return "expired";
      if (batchStatus === "expiring") status = "expiring";
    }

    return status;
  };

  // Merge stock items with purchase history data
  const mergedStockItems = useMemo(() => {
    return stockItems.map((item) => {
      const batches = (item.batches || []).map((batch: any) => ({
        ...batch,
        batchType: batch.batchType || batch.mode || "opening",
      }));

      return {
        ...item,
        batches,
      };
    });
  }, [stockItems]);

  // NEW: filtered stock items with filtered batches
  const filteredStockItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return mergedStockItems
      .filter((item) => {
        // Filter by selected stock item (if any)
        if (filterStockItem && String(item.id) !== String(filterStockItem)) {
          return false;
        }
        return true;
      })
      .map((item) => {
        const batches = item.batches || [];

        // Filter batches of this item
        const filteredBatches = batches.filter((batch: any) => {
          // 🔍 Search filter (item name OR batch name)
          const matchesSearch =
            !q ||
            item.name.toLowerCase().includes(q) ||
            (batch.batchName || "").toLowerCase().includes(q);

          // 📦 Status filter
          const status = getBatchStatus(batch);
          const matchesStatus =
            filterStatus === "all" || filterStatus === status;

          return matchesSearch && matchesStatus;
        });

        // ❌ If no batches match & no specific item selected → hide item
        if (filteredBatches.length === 0 && !filterStockItem) {
          return null;
        }

        // ✅ Keep item with filtered batches
        return {
          ...item,
          batches: filteredBatches,
        };
      })
      .filter(Boolean) as StockItem[];
  }, [mergedStockItems, searchTerm, filterStatus, filterStockItem]);

  const batchRows = useMemo(() => {
    const rows: {
      item: StockItem;
      batch: any;
    }[] = [];

    filteredStockItems.forEach((item) => {
      (item.batches || []).forEach((batch) => {
        rows.push({ item, batch });
      });
    });

    return rows;
  }, [filteredStockItems]);

  // NEW: Stats based on merged items
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let expiring = 0;
    let expired = 0;

    mergedStockItems.forEach((item) => {
      total++;
      const status = getOverallStatus(item.batches || []);

      if (status === "active") active++;
      else if (status === "expiring") expiring++;
      else if (status === "expired") expired++;
    });

    return { total, active, expiring, expired };
  }, [mergedStockItems]);

  if (loading) {
    return <div className="pt-[56px] px-4">Loading...</div>;
  }

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center justify-between mb-6">
        {/* Left side: Back button and Heading */}
        <div className="flex items-center">
          <button
            onClick={() => navigate("/app/masters/stock-item")}
            className={`mr-4 p-2 rounded-full ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
            aria-label="Back"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Batch Management</h1>
        </div>

        {/* Right side: Add Batch button */}
        {/* <button
          onClick={() => navigate("/app/masters/stock-item/purchase/create")}
          className={`px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700`}
        >
          Add Purchase Batch
        </button> */}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div
          className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <div className="flex items-center">
            <Package size={24} className="text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total Batches</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <div className="flex items-center">
            <Package size={24} className="text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.active}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <div className="flex items-center">
            <AlertTriangle size={24} className="text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.expiring}
              </p>
            </div>
          </div>
        </div>
        <div
          className={`p-4 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <div className="flex items-center">
            <AlertTriangle size={24} className="text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Expired</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div
        className={`p-4 rounded-lg mb-6 ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              <Search size={16} className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search batch or item name..."
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500"
              } outline-none transition-colors`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <Filter size={16} className="inline mr-1" />
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(
                  e.target.value as "all" | "active" | "expiring" | "expired"
                )
              }
              title="Filter by Status"
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500"
              } outline-none transition-colors`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <Package size={16} className="inline mr-1" />
              Stock Item
            </label>
            <select
              value={filterStockItem}
              onChange={(e) => setFilterStockItem(e.target.value)}
              title="Filter by Stock Item"
              className={`w-full p-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                  : "bg-white border-gray-300 focus:border-blue-500"
              } outline-none transition-colors`}
            >
              <option value="">All Items</option>
              {mergedStockItems
                .filter((item) => item.batches && item.batches.length > 0)
                .map((item) => (
                  <option key={item.id} value={String(item.id)}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
                setFilterStockItem("");
              }}
              className={`w-full px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700 text-white"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Batch List */}
      <div
        className={`rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Batch Details</h2>
            <span className="text-sm text-gray-500">
              Showing {filteredStockItems.length} of {mergedStockItems.length}{" "}
              items
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead
              className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}
            >
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Stock Item
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Type
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  HSN Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Batch Number
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Manufacturing Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Days to Expiry
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actioin
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y ${
                theme === "dark" ? "divide-gray-700" : "divide-gray-200"
              }`}
            >
              {batchRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No batches found
                  </td>
                </tr>
              ) : (
                batchRows.map(({ item, batch }, index) => {
                  const status = getBatchStatus(batch);

                  const days = batch.batchExpiryDate
                    ? Math.ceil(
                        (new Date(batch.batchExpiryDate).getTime() -
                          Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  return (
                    <React.Fragment key={`${item.id}-${index}`}>
                      {/* ================= BATCH ROW ================= */}
                      <tr
                        className={`${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* STATUS */}
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              status === "active"
                                ? "bg-green-100 text-green-800"
                                : status === "expiring"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {status.toUpperCase()}
                          </span>
                        </td>

                        {/* STOCK ITEM */}
                        <td className="px-4 py-3 font-medium">
                          {item.name}
                          <div className="text-xs text-gray-500">
                            Unit: {item.unit}
                          </div>
                        </td>

                        {/* TYPE / MODE */}
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs rounded bg-blue-100 text-blue-800">
                            {batch.mode || batch.batchType || "opening"}
                          </span>
                        </td>

                        {/* HSN */}
                        <td className="px-4 py-3">{item.hsnCode || "—"}</td>

                        {/* BATCH NO */}
                        <td className="px-4 py-3">{batch.batchName}</td>

                        {/* QTY */}
                        <td className="px-4 py-3">{batch.batchQuantity}</td>

                        {/* RATE */}
                        <td className="px-4 py-3">
                          {batch.batchRate ?? batch.openingRate ?? "—"}
                        </td>

                        {/* MFG DATE */}
                        <td className="px-4 py-3">
                          {batch.batchManufacturingDate
                            ? new Date(
                                batch.batchManufacturingDate
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* EXP DATE */}
                        <td className="px-4 py-3">
                          {batch.batchExpiryDate
                            ? new Date(
                                batch.batchExpiryDate
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* DAYS TO EXPIRY */}
                        <td className="px-4 py-3">
                          {days === null
                            ? "—"
                            : days < 0
                            ? `Expired ${Math.abs(days)} days`
                            : `${days} days`}
                        </td>

                        {/* ACTIONS */}
                        <td className="px-4 py-3 space-x-2">
                          {/* ADD BATCH */}
                          <button
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded"
                            onClick={() => {
                              setOpenFormRowIndex(index);
                              setBatchForm({
                                batchName: "",
                                batchQuantity: "",
                                batchRate: "",
                                batchManufacturingDate: "",
                                batchExpiryDate: "",
                              });
                            }}
                          >
                            + Add Batch
                          </button>

                          {/* EDIT */}
                          <button
                            className="px-2 py-1 text-xs bg-yellow-500 text-white rounded"
                            onClick={() => {
                              setOpenFormRowIndex(index);

                              setEditingBatch({
                                itemId: item.id,
                                batchName: batch.batchName,
                              });

                              setBatchForm({
                                batchName: batch.batchName || "",
                                batchQuantity: String(
                                  batch.batchQuantity ?? ""
                                ),
                                batchRate: String(batch.batchRate ?? ""),
                                batchManufacturingDate:
                                  batch.batchManufacturingDate || "",
                                batchExpiryDate: batch.batchExpiryDate || "",
                              });
                            }}
                          >
                            Edit
                          </button>

                          {/* DELETE */}
                          <button
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded"
                            onClick={() =>
                              handleDeleteBatch(item.id, batch.batchName)
                            }
                          >
                            Delete
                          </button>
                        </td>
                      </tr>

                      {/* ================= ADD BATCH FORM ================= */}
                      {openFormRowIndex === index && (
                        <tr>
                          <td
                            colSpan={11}
                            className={`p-4 ${
                              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                            }`}
                          >
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                              <input
                                type="text"
                                name="batchName"
                                value={batchForm.batchName}
                                onChange={handleChange}
                                placeholder="Batch Number"
                                className="p-2 border rounded"
                              />

                              <input
                                type="number"
                                name="batchQuantity"
                                value={batchForm.batchQuantity}
                                onChange={handleChange}
                                placeholder="Quantity"
                                className="p-2 border rounded"
                              />

                              <input
                                type="number"
                                name="batchRate"
                                value={batchForm.batchRate}
                                onChange={handleChange}
                                placeholder="Rate"
                                className="p-2 border rounded"
                              />

                              <input
                                type="date"
                                name="batchManufacturingDate"
                                value={batchForm.batchManufacturingDate}
                                onChange={handleChange}
                                className="p-2 border rounded"
                              />

                              <input
                                type="date"
                                name="batchExpiryDate"
                                value={batchForm.batchExpiryDate}
                                onChange={handleChange}
                                className="p-2 border rounded"
                              />
                            </div>

                            <div className="mt-4 flex justify-end space-x-2">
                              <button
                                onClick={() => setOpenFormRowIndex(null)}
                                className="px-4 py-2 bg-gray-400 text-white rounded"
                              >
                                Cancel
                              </button>

                              <button
                                onClick={() => {
                                  if (editingBatch) {
                                    handleUpdateBatch();
                                  } else {
                                    handleSaveBatch(item.id);
                                  }
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded"
                              >
                                {editingBatch ? "Update Batch" : "Save Batch"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchList;
