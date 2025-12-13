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

  // get purchase history
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  
  // Load purchase history data
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
    console.log("Json", json);

    const formatted = Array.isArray(json.data)
      ? json.data.map((v: any) => ({
          id: v.id,
          itemName: v.itemName,
          hsnCode: v.hsnCode,
          batchNumber: v.batchNumber,
          qty: v.purchaseQuantity,
          date: v.purchaseDate,
          type: v.type || "purchase",
          rate: v.rate || null,
        }))
      : [];

    setPurchaseData(formatted);
  };

  // Load purchase data on mount
  useEffect(() => {
    loadPurchaseData();
  }, []);

  const handleSaveBatch = async (itemId: string) => {
    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    );

    // Find the item to get its details from stockItems
    const item = stockItems.find((i) => String(i.id) === String(itemId));
    
    if (!item) {
      alert("Item not found");
      return;
    }

    // Structure batch data as an array (as expected by the API)
    const batches = [{
      batchName: batchForm.batchName || null,
      batchQuantity: Number(batchForm.batchQuantity) || 0,
      batchRate: Number(batchForm.batchRate) || 0,
      batchExpiryDate: batchForm.batchExpiryDate || null,
      batchManufacturingDate: batchForm.batchManufacturingDate || null,
    }];

    const payload = {
      itemId,
      name: item.name,
      unit: item.unit || "",
      taxType: (item as any).taxType || (item as any).gstClassification || "GST", // Try to get taxType from item
      hsnCode: item.hsnCode || null,
      batches: batches,
      company_id,
      owner_type,
      owner_id,
    };

    try {
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

        // Reset form
        setBatchForm({
          batchName: "",
          batchQuantity: "",
          batchRate: "",
          batchManufacturingDate: "",
          batchExpiryDate: "",
        });

        // Close form
        setOpenFormItemId(null);

        // Reload purchase data and stock items to show the new batch
        await loadPurchaseData();
        await loadStockItems();
      } else {
        alert(data.message || "Failed to add batch");
      }
    } catch (error) {
      console.error("Error saving batch:", error);
      alert("Error saving batch. Please try again.");
    }
  };



  // Load stock items
  const loadStockItems = async () => {
    const company_id = localStorage.getItem("company_id");
    const owner_type = localStorage.getItem("supplier");
    const owner_id = localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    );

    if (!company_id || !owner_type || !owner_id) {
      console.log("Missing auth params");
      return;
    }

    const params = new URLSearchParams({ company_id, owner_type, owner_id });

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

      // Mark items from purchase-batch endpoint with type "purchase"
      const purchaseItems = (data1.success ? data1.data : []).map((item: any) => ({
        ...item,
        type: item.type || "purchase", // Ensure purchase items have type "purchase"
      }));

      const regularItems = data2.success ? data2.data : [];

      const mergedData = [
        ...purchaseItems,
        ...regularItems,
      ];
      setStockItems(mergedData);
    } catch (error) {
      console.error("Error loading stock items:", error);
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
    if (days <= 30) return "expiring";
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
    // Create a map of items by name for quick lookup
    const itemsMap = new Map<string, StockItem>();
    
    // Add all stock items to the map
    stockItems.forEach((item) => {
      const itemName = item.name.toLowerCase();
      // Determine batch type: if item type is "purchase", mark batches as "purchase", otherwise "opening"
      const itemType = (item as any).type || "";
      const batchType = itemType.toLowerCase() === "purchase" ? "purchase" : "opening";
      
      // Add batchType to batches (only if not already set)
      const typedBatches = (item.batches || []).map((batch: any) => ({
        ...batch,
        batchType: batch.batchType || batchType, // Use existing batchType if available, otherwise use determined type
        // Add timestamp for purchase batches for sorting (newest at bottom)
        date: batch.date || (batchType === "purchase" ? ((item as any).createdAt ? new Date((item as any).createdAt).getTime() : Date.now()) : undefined),
        id: batch.id || (item as any).id,
      }));

      if (!itemsMap.has(itemName)) {
        itemsMap.set(itemName, {
          ...item,
          batches: typedBatches,
        });
      } else {
        // Merge batches if item already exists
        const existing = itemsMap.get(itemName)!;
        existing.batches = [
          ...(existing.batches || []),
          ...typedBatches,
        ];
      }
    });

    // Add purchase history batches to matching items
    purchaseData.forEach((purchase: any) => {
      const itemName = purchase.itemName.toLowerCase();
      const purchaseBatch = {
        batchName: purchase.batchNumber || "—",
        batchQuantity: purchase.qty || 0,
        batchRate: purchase.rate || null,
        batchManufacturingDate: null,
        batchExpiryDate: null,
        batchType: purchase.type || "purchase",
        date: purchase.date ? new Date(purchase.date).getTime() : Date.now(), // Add timestamp for sorting
        id: purchase.id, // Keep ID for sorting fallback
      };

      if (itemsMap.has(itemName)) {
        // Add to existing item - purchase batches go at the bottom
        const item = itemsMap.get(itemName)!;
        item.batches = [...(item.batches || []), purchaseBatch];
      } else {
        // Create new item for purchase-only items
        itemsMap.set(itemName, {
          id: `purchase-${purchase.id}`,
          name: purchase.itemName,
          unit: "",
          openingBalance: 0,
          hsnCode: purchase.hsnCode,
          enableBatchTracking: true,
          type: purchase.type || "purchase",
          batches: [purchaseBatch],
        });
      }
    });

    // Sort batches within each item: opening first, then purchase (newest at bottom)
    const sortedItems = Array.from(itemsMap.values()).map((item) => {
      const batches = item.batches || [];
      
      // Separate opening and purchase batches
      const openingBatches = batches.filter((b: any) => (b.batchType || "opening") === "opening");
      const purchaseBatches = batches.filter((b: any) => (b.batchType || "opening") === "purchase");
      
      // Sort purchase batches by date/id (newest at bottom)
      purchaseBatches.sort((a: any, b: any) => {
        // Use date timestamp if available, otherwise use ID, otherwise use 0
        const aDate = a.date || (a.id ? Number(a.id) : 0) || 0;
        const bDate = b.date || (b.id ? Number(b.id) : 0) || 0;
        return aDate - bDate; // Ascending: older first, newer at bottom
      });
      
      // Combine: opening first, then purchase (newest at bottom)
      const sortedBatches = [...openingBatches, ...purchaseBatches];
      
      return {
        ...item,
        batches: sortedBatches,
      };
    });

    return sortedItems;
  }, [stockItems, purchaseData]);

  // NEW: filtered stock items with filtered batches
  const filteredStockItems = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();

    return mergedStockItems
      .filter((item) => {
        // First filter by stock item if specified - this is the primary filter
        // Convert both to string for comparison to handle type mismatches
        if (filterStockItem && String(filterStockItem) !== String(item.id)) {
          return false;
        }
        return true;
      })
      .map((item) => {
        // Filter batches within each item
        const filteredBatches = (item.batches || []).filter((batch: any) => {
          // Search filter: check batch name or item name (only if search term is provided)
          const matchesSearch =
            !q || // If no search term, show all batches
            item.name.toLowerCase().includes(q) ||
            batch.batchName?.toLowerCase().includes(q);

          // Status filter: check individual batch status
          const batchStatus = getBatchStatus(batch);
          const matchesStatus =
            filterStatus === "all" || filterStatus === batchStatus;

          return matchesSearch && matchesStatus;
        });

        // If stock item is specifically selected, show it even if no batches match other filters
        // Otherwise, only show if there are matching batches
        if (filteredBatches.length === 0) {
          // If a specific stock item is selected, show it with empty batches list
          // so user can see the item exists but has no matching batches
          if (filterStockItem && String(filterStockItem) === String(item.id)) {
            return {
              ...item,
              batches: [],
            };
          }
          return null;
        }

        return {
          ...item,
          batches: filteredBatches,
        };
      })
      .filter((item) => item !== null) as StockItem[];
  }, [mergedStockItems, searchTerm, filterStatus, filterStockItem]);

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
              Showing {filteredStockItems.length} of {mergedStockItems.length} items
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

                        {/* ITEM NAME */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">
                            Unit: {item.unit}
                          </div>
                        </td>

                         {/* TYPE - Show batch type for each batch */}
                         <td className="px-4 py-4 whitespace-nowrap">
                          <div className="max-h-20 space-y-1">
                            {batches.map((b: any, i: number) => (
                              <div key={i} className="font-medium">
                                <span className="inline-block px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                                  {b.batchType || "opening"}
                                </span>
                              </div>
                            ))}
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
                              <div key={i}>
                                {b.batchRate !== null && b.batchRate !== undefined
                                  ? b.batchRate
                                  : b.openingRate !== null && b.openingRate !== undefined
                                  ? b.openingRate
                                  : "—"}
                              </div>
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
