import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
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

  // Old single values from DB
  batchNumber?: string;
  batchExpiryDate?: string;
  batchManufacturingDate?: string;

  // New parsed multiple batches
  batches?: Array<{
    batchName: string;
    batchExpiryDate: string;
    batchManufacturingDate: string;
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
  const [openFormItemId, setOpenFormItemId] = useState<string | null>(null);

  const [batchForm, setBatchForm] = useState({
    batchName: "",
    batchQuantity: "",
    batchRate: "",
    batchManufacturingDate: "",
    batchExpiryDate: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBatchForm({
      ...batchForm,
      [e.target.name]: e.target.value,
    });
  };

  console.log('batch number', batchForm)

  const handleSaveBatch = async (itemId: string) => {
    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    );

    const payload = {
      itemId,
      ...batchForm,
      company_id,
      owner_type,
      owner_id,
    };

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/stock-items/purchase-batch`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (data.success) {
      alert("Batch Added Successfully!");

      // Reset
      setBatchForm({
        batchName: "",
        batchQuantity: "",
        batchRate: "",
        batchManufacturingDate: "",
        batchExpiryDate: "",
      });

      // Close form
      setOpenFormItemId(null);
    }
  };

  // get purchase history

  const [data, setData] = useState<any[]>([]);
  

  useEffect(() => {
  const loadPurchaseData = async () => {
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

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/purchase-vouchers/purchase-history?${params.toString()}`
    );

    const json = await response.json();

    const formatted = Array.isArray(json.data)
      ? json.data.map((v: any) => ({
          id: v.id,
          itemName: v.itemName,
          hsnCode: v.hsnCode,
          batchNumber: v.batchNumber,
          qty: v.purchaseQuantity,
          date: v.purchaseDate,
        }))
      : [];

    setData(formatted);
  };

  loadPurchaseData();
}, []);



  // Fetch stock items on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    );

    if (!company_id || !owner_type || !owner_id) {
      console.log("Missing auth params");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({ company_id, owner_type, owner_id });

    const fetchData = async () => {
      try {
        const [res1, res2] = await Promise.all([
          fetch(
            `${
              import.meta.env.VITE_API_URL
            }/api/stock-items/purchase-batch?${params.toString()}`
          ),
          fetch(
            `${
              import.meta.env.VITE_API_URL
            }/api/stock-items?${params.toString()}`
          ),
        ]);

        const data1 = await res1.json();
        const data2 = await res2.json();

        if (isMounted) {
          const mergedData = [
            ...(data1.success ? data1.data : []),
            ...(data2.success ? data2.data : []),
          ];
          setStockItems(mergedData);
        }
      } catch (error) {
        if (isMounted) setStockItems([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  // NEW: overall status calculator
  const getOverallStatus = (batches: any[]) => {
    if (!batches || batches.length === 0) return "active";

    let status: "active" | "expiring" | "expired" = "active";

    for (let b of batches) {
      const days = Math.ceil(
        (new Date(b.batchExpiryDate).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      );

      if (days < 0) return "expired";
      if (days <= 30) status = "expiring";
    }

    return status;
  };

  // NEW: filtered stock items (1 row per item)
  const filteredStockItems = useMemo(() => {
    return stockItems.filter((item) => {
      const q = searchTerm.toLowerCase();

      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        (item.batches &&
          item.batches.some((b) => b.batchName.toLowerCase().includes(q)));

      const overallStatus = getOverallStatus(item.batches || []);
      const matchesStatus =
        filterStatus === "all" || filterStatus === overallStatus;

      const matchesStockItem = !filterStockItem || filterStockItem === item.id;

      return matchesSearch && matchesStatus && matchesStockItem;
    });
  }, [stockItems, searchTerm, filterStatus, filterStockItem]);

  // NEW: Stats based on filtered items
  const stats = useMemo(() => {
    let total = 0;
    let active = 0;
    let expiring = 0;
    let expired = 0;

    stockItems.forEach((item) => {
      total++;
      const status = getOverallStatus(item.batches || []);

      if (status === "active") active++;
      else if (status === "expiring") expiring++;
      else if (status === "expired") expired++;
    });

    return { total, active, expiring, expired };
  }, [stockItems]);

  // Utility functions for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expiring":
        return "bg-yellow-100 text-yellow-800";
      case "expired":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Package size={16} className="text-green-600" />;
      case "expiring":
        return <AlertTriangle size={16} className="text-yellow-600" />;
      case "expired":
        return <AlertTriangle size={16} className="text-red-600" />;
      default:
        return <Package size={16} className="text-gray-600" />;
    }
  };

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
        <button
          onClick={() => navigate("/app/masters/stock-item/purchase/create")}
          className={`px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700`}
        >
          Add Purchase Batch
        </button>
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
              {stockItems.map((item) => (
                <option key={item.id} value={item.id}>
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
              Showing {filteredStockItems.length} of {stockItems.length} batches
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead
              className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}
            >
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Type
                </th>

                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Stock Item
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
              {filteredStockItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No batches found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredStockItems.map((item) => {
                  const batches = item.batches || [];

                  return (
                    <React.Fragment key={item.id}>
                      {/* ================= MAIN ROW ================= */}
                      <tr
                        className={`${
                          theme === "dark"
                            ? "hover:bg-gray-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {/* STATUS */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {(() => {
                            const status = getOverallStatus(batches);
                            return (
                              <div className="flex items-center">
                                {getStatusIcon(status)}
                                <span
                                  className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                                    status
                                  )}`}
                                >
                                  {status.toUpperCase()}
                                </span>
                              </div>
                            );
                          })()}
                        </td>

                        {/* TYPE */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium">
                            {item.type ? (
                              <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                {item.type}
                              </span>
                            ) : (
                              "—"
                            )}
                          </div>
                        </td>

                        {/* ITEM NAME */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Unit: {item.unit}
                          </div>
                        </td>

                        {/* HSN */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          {item.hsnCode || "—"}
                        </td>

                        {/* BATCH NAME LIST */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="max-h-20 overflow-y-auto space-y-1">
                            {batches.map((b: any, i: number) => (
                              <div key={i} className="font-medium">
                                {b.batchName}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* QTY LIST */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="max-h-20 overflow-y-auto space-y-1">
                            {batches.map((b: any, i: number) => (
                              <div key={i}>{b.batchQuantity}</div>
                            ))}
                          </div>
                        </td>

                        {/* RATE LIST */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="max-h-20 overflow-y-auto space-y-1">
                            {batches.map((b: any, i: number) => (
                              <div key={i}>{b.batchRate || b.openingRate}</div>
                            ))}
                          </div>
                        </td>

                        {/* MFG DATE LIST */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="max-h-20 overflow-y-auto space-y-1">
                            {batches.map((b: any, i: number) => (
                              <div key={i} className="flex items-center">
                                <Calendar
                                  size={14}
                                  className="mr-1 text-gray-400"
                                />
                                {b.batchManufacturingDate
                                  ? new Date(
                                      b.batchManufacturingDate
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* EXP DATE LIST */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="max-h-20 overflow-y-auto space-y-1">
                            {batches.map((b: any, i: number) => (
                              <div key={i} className="flex items-center">
                                <Calendar
                                  size={14}
                                  className="mr-1 text-gray-400"
                                />
                                {b.batchExpiryDate
                                  ? new Date(
                                      b.batchExpiryDate
                                    ).toLocaleDateString()
                                  : "—"}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* DAYS LEFT */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="max-h-20 overflow-y-auto space-y-1">
                            {batches.map((b: any, i: number) => {
                              if (!b.batchExpiryDate)
                                return (
                                  <div key={i} className="text-gray-500">
                                    —
                                  </div>
                                );

                              const days = Math.ceil(
                                (new Date(b.batchExpiryDate).getTime() -
                                  Date.now()) /
                                  (1000 * 60 * 60 * 24)
                              );

                              return (
                                <div
                                  key={i}
                                  className={`font-medium ${
                                    days < 0
                                      ? "text-red-600"
                                      : days <= 30
                                      ? "text-yellow-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  {days < 0
                                    ? `Expired ${Math.abs(days)} days ago`
                                    : `${days} days`}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* ACTION BUTTON */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            onClick={() =>
                              setOpenFormItemId(
                                openFormItemId === item.id ? null : item.id
                              )
                            }
                            className="px-3 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700 text-sm"
                          >
                            {openFormItemId === item.id
                              ? "Close"
                              : "Add Purchase"}
                          </button>
                        </td>
                      </tr>

                      {/* ================= FORM ROW (ONLY ONE PER ITEM) ================= */}
                      {openFormItemId === item.id && (
                        <tr>
                          <td colSpan={11} className="bg-gray-100 p-4">
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

                            <div className="text-right mt-4">
                              <button
                                onClick={() => handleSaveBatch(item.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded"
                              >
                                Save Batch
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
