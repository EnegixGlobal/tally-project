import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download, ChevronDown, ChevronRight } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import ReportTable from "./ReportTable";

const StockSummary: React.FC = () => {
  const { theme, units } = useAppContext();

  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const [integrate, setIntegrate] = useState<"integrated" | "new">("new");
  const [reportView, setReportView] = useState<
    "Opening" | "Purchase" | "Sales" | "Closing" | "All"
  >("Opening");

  const company_id = localStorage.getItem("company_id") || "";
  const owner_type = localStorage.getItem("owner_type") || "employee";
  const owner_id =
    localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    ) || "";

  // OPENING STOCK
  const loadOpeningStock = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ company_id, owner_type, owner_id });
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/stock-items?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to load opening stock");

      const json = await response.json();
      console.log('json', json.data);
      const formatted = Array.isArray(json.data)
        ? json.data.map((item: any) => ({
          item: {
            id: item.id,
            name: item.name,
            unitName: units.find(u => u.id === item.unit)?.name ?? "",
            openingBalance: Number(item.openingBalance || 0),
            hsnCode: item.hsnCode ?? "",
            gstRate: Number(item.gstRate || 0),
            taxType: item.taxType ?? "",
          },
        }))
        : [];

      setData(formatted);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // PURCHASE
  const loadPurchaseData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        company_id,
        owner_type,
        owner_id,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL
        }/api/purchase-vouchers/purchase-history?${params.toString()}`
      );

      if (!response.ok) throw new Error("Failed to load purchase vouchers");

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
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // SALES 📦
  const loadSalesData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        company_id,
        owner_type,
        owner_id,
      });

      const response = await fetch(
        `${import.meta.env.VITE_API_URL
        }/api/sales-vouchers/sale-history?${params.toString()}`
      );

      if (!response.ok) throw new Error("Failed to load sales history");

      const json = await response.json();

      const formatted = Array.isArray(json.data)
        ? json.data.map((v: any) => ({
          itemName: v.itemName,
          hsnCode: v.hsnCode,
          batchNumber: v.batchNumber,
          qty: Math.abs(v.qtyChange),
          date: v.movementDate,
        }))
        : [];

      setData(formatted);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // CLOSING STOCK (Only Purchase - Sales, excluding Opening)
  const loadClosingData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ company_id, owner_type, owner_id });

      const [stockItemsRes, purchaseRes, salesRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items?${params.toString()}`
        ),
        fetch(
          `${import.meta.env.VITE_API_URL
          }/api/purchase-vouchers/purchase-history?${params.toString()}`
        ),
        fetch(
          `${import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?${params.toString()}`
        ),
      ]);

      const stockItemsData = await stockItemsRes.json();
      const purchaseData = await purchaseRes.json();
      const salesData = await salesRes.json();

      // Create a map of item names to their unit info
      const itemUnitMap: Record<string, { hsnCode: string; unitName: string }> = {};
      if (Array.isArray(stockItemsData.data)) {
        stockItemsData.data.forEach((item: any) => {
          itemUnitMap[item.name] = {
            hsnCode: item.hsnCode || "",
            unitName: units.find((u) => u.id === item.unit)?.name ?? "",
          };
        });
      }

      // Track closing balance for each item and batch (only Purchase - Sales)
      const closingMap: Record<string, Record<string, number>> = {}; // itemName -> batchNumber -> qty
      const itemInfo: Record<string, { hsnCode: string; unitName: string }> = {}; // itemName -> info

      // Process Purchase (add to closing)
      if (Array.isArray(purchaseData.data)) {
        purchaseData.data.forEach((v: any) => {
          const itemName = v.itemName;
          const batchName = v.batchNumber || "";
          const purchaseQty = Number(v.purchaseQuantity || 0);

          if (!closingMap[itemName]) {
            closingMap[itemName] = {};
          }

          // Get item info from stock items or use purchase data
          if (!itemInfo[itemName]) {
            itemInfo[itemName] = itemUnitMap[itemName] || {
              hsnCode: v.hsnCode || "",
              unitName: "",
            };
          }

          closingMap[itemName][batchName] = (closingMap[itemName][batchName] || 0) + purchaseQty;
        });
      }

      // Process Sales (subtract from closing)
      if (Array.isArray(salesData.data)) {
        salesData.data.forEach((v: any) => {
          const itemName = v.itemName;
          const batchName = v.batchNumber || "";
          const salesQty = Math.abs(Number(v.qtyChange || 0));

          // Initialize item if it doesn't exist
          if (!closingMap[itemName]) {
            closingMap[itemName] = {};
          }

          // Get item info from stock items or use sales data
          if (!itemInfo[itemName]) {
            itemInfo[itemName] = itemUnitMap[itemName] || {
              hsnCode: v.hsnCode || "",
              unitName: "",
            };
          }

          // Subtract sales quantity (can go negative, but we filter out <= 0 later)
          closingMap[itemName][batchName] = (closingMap[itemName][batchName] || 0) - salesQty;
        });
      }

      // Format closing data - group by item, show batches as transactions
      const closingFormatted: any[] = [];
      Object.entries(closingMap).forEach(([itemName, batches]) => {
        Object.entries(batches).forEach(([batchName, qty]) => {
          if (qty > 0) {
            closingFormatted.push({
              itemName: itemName,
              hsnCode: itemInfo[itemName]?.hsnCode || "",
              unitName: itemInfo[itemName]?.unitName || "",
              batchNumber: batchName || "-",
              qty: qty, // This will be used for grouping
              closingQty: qty,
            });
          }
        });
      });

      console.log("Closing data:", closingFormatted);
      setData(closingFormatted);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ company_id, owner_type, owner_id });

      const [purchaseRes, salesRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL
          }/api/purchase-vouchers/purchase-history?${params.toString()}`
        ),
        fetch(
          `${import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?${params.toString()}`
        ),
      ]);

      const purchaseData = await purchaseRes.json();
      const salesData = await salesRes.json();

      const allFormatted: any[] = [];

      // Purchase
      if (Array.isArray(purchaseData.data)) {
        purchaseData.data.forEach((v: any) => {
          allFormatted.push({
            type: "Purchase",
            name: v.itemName,
            hsnCode: v.hsnCode,
            batchNumber: v.batchNumber,
            qty: `+${v.purchaseQuantity}`,
            date: v.purchaseDate,
          });
        });
      }

      // Sales
      if (Array.isArray(salesData.data)) {
        salesData.data.forEach((v: any) => {
          allFormatted.push({
            type: "Sales",
            name: v.itemName,
            hsnCode: v.hsnCode,
            batchNumber: v.batchNumber,
            qty: `-${Math.abs(v.qtyChange)}`,
            date: v.movementDate,
          });
        });
      }

      setData(allFormatted);
    } catch (err: any) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (integrate === "new") return;
    setExpandedItems(new Set()); // Reset expanded items when view changes
    if (reportView === "Opening") loadOpeningStock();
    else if (reportView === "Purchase") loadPurchaseData();
    else if (reportView === "Sales") loadSalesData();
    else if (reportView === "Closing") loadClosingData();
    else if (reportView === "All") loadAllData();
  }, [reportView, integrate]);

  // Group data by item name for Purchase, Sales, Closing, and All views
  const groupedData = useMemo(() => {
    if (reportView === "Opening") return data; // Opening doesn't need grouping

    const groups: Record<string, any[]> = {};
    
    data.forEach((item) => {
      const key = item.itemName || item.name || "";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return Object.entries(groups).map(([itemName, transactions]) => {
      // Calculate totals
      let totalQty = 0;
      const firstItem = transactions[0];
      const hsnCode = firstItem.hsnCode || "";
      const unitName = firstItem.unitName || "";
      
      transactions.forEach((t) => {
        let qty = 0;
        if (reportView === "Closing") {
          // For closing, use closingQty
          qty = Number(t.closingQty || t.qty || 0);
        } else {
          // For Purchase/Sales/All, parse qty string or number
          qty = typeof t.qty === "string" 
            ? parseFloat(t.qty.replace(/[+-]/g, "")) || 0
            : Number(t.qty) || 0;
        }
        totalQty += qty;
      });

      return {
        itemName,
        hsnCode,
        unitName,
        transactions,
        totalQty,
        transactionCount: transactions.length,
        isGroup: true,
      };
    });
  }, [data, reportView]);

  const toggleItem = (itemName: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemName)) {
        newSet.delete(itemName);
      } else {
        newSet.add(itemName);
      }
      return newSet;
    });
  };

  // Helper function to format date
  const formatDate = (dateValue: any): string => {
    if (!dateValue || dateValue === "-" || dateValue === null || dateValue === undefined) {
      return "-";
    }
    
    try {
      // If it's already a string in YYYY-MM-DD format
      if (typeof dateValue === "string") {
        // Check if it's a valid date string
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return dateValue; // Return as is if invalid
        }
        // Format as DD/MM/YYYY
        return date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      }
      
      // If it's a Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric"
        });
      }
      
      return "-";
    } catch (error) {
      console.error("Date formatting error:", error, dateValue);
      return "-";
    }
  };

  // TABLE COLUMNS
  const columns = useMemo(() => {
    if (reportView === "All") {
      return [
        { header: "S.No", accessor: "sno", align: "center" as const },
        { header: "Type", accessor: "type", align: "center" as const },
        { header: "Item", accessor: "name", align: "center" as const },
        { header: "HSN", accessor: "hsnCode", align: "center" as const },
        {
          header: "Batch",
          accessor: "batchNumber",
          align: "center" as const,
          render: (r: any) => r.batchNumber || "-",
        },
        {
          header: "Qty",
          accessor: "qty",
          align: "center" as const,
        },
        {
          header: "Date",
          accessor: "date",
          align: "center" as const,
          render: (r: any) => formatDate(r.date),
        },
      ];
    }

    if (reportView === "Purchase") {
      return [
        { header: "S.No", accessor: "sno", align: "center" as const },
        { header: "Item", accessor: "itemName", align: "center" as const },
        { header: "HSN", accessor: "hsnCode", align: "center" as const },
        { header: "Batch", accessor: "batchNumber", align: "center" as const },
        {
          header: "Qty (+)",
          accessor: "qty",
          align: "center" as const,
          render: (r: any) => `+${r.qty}`,
        },
        {
          header: "Date",
          accessor: "date",
          align: "center" as const,
          render: (r: any) => formatDate(r.date),
        },
      ];
    }

    if (reportView === "Sales") {
      return [
        { header: "S.No", accessor: "sno", align: "center" as const },
        { header: "Item", accessor: "itemName", align: "center" as const },
        { header: "HSN", accessor: "hsnCode", align: "center" as const },
        { header: "Batch", accessor: "batchNumber", align: "center" as const },
        {
          header: "Sale Qty (-)",
          accessor: "qty",
          align: "center" as const,
          render: (r: any) => `-${r.qty}`,
        },
        {
          header: "Sale Date",
          accessor: "date",
          align: "center" as const,
          render: (r: any) => formatDate(r.date),
        },
      ];
    }

    if (reportView === "Closing") {
      return [
        { header: "S.No", accessor: "sno", align: "center" as const },
        { header: "Item", accessor: "itemName", align: "center" as const },
        { header: "Unit", accessor: "unitName", align: "center" as const },
        { header: "HSN", accessor: "hsnCode", align: "center" as const },
        { header: "Batch", accessor: "batchNumber", align: "center" as const },
        {
          header: "Closing Qty",
          accessor: "closingQty",
          align: "center" as const,
          render: (r: any) => r.closingQty ?? r.qty ?? 0,
        },
      ];
    }

    // Opening Stock same
    return [
      {
        header: "Stock Item",
        accessor: "name",
        align: "center" as const,
        render: (r: any) => r.item?.name ?? "",
      },
      {
        header: "Unit",
        accessor: "unitName",
        align: "center" as const,
        render: (r: any) => r.item?.unitName ?? "",
      },
      {
        header: "HSN",
        accessor: "hsnCode",
        align: "center" as const,
        render: (r: any) => r.item?.hsnCode ?? "",
      },
      {
        header: "GST",
        accessor: "gstRate",
        align: "center" as const,
        render: (r: any) => (r.item?.gstRate ?? 0) + "%",
      },
      {
        header: "Tax Type",
        accessor: "taxType",
        align: "center" as const,
        render: (r: any) => r.item?.taxType ?? "",
      },
    ];
  }, [reportView]);

  const handleExport = () => {
    if (!data.length) return;
    
    // For grouped views, export all transactions/batches
    const exportData = reportView === "Opening"
      ? data 
      : reportView === "Closing"
      ? groupedData.flatMap((group) => group.transactions)
      : groupedData.flatMap((group) => group.transactions);
    
    const csv = [
      columns.map((c) => c.header).join(","),
      ...exportData.map((row: any) =>
        columns
          .map((c: any) => {
            if (c.render) {
              return c.render(row);
            }
            const value = row[c.accessor] ?? "";
            return typeof value === "string" ? value : String(value);
          })
          .join(",")
      ),
    ].join("\n");

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "stock-summary.csv";
    link.click();
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Stock Summary</h1>

        <div className="ml-auto flex space-x-2">
          <button onClick={() => window.print()} className="p-2 rounded-md">
            <Printer size={18} />
          </button>
          <button onClick={handleExport} className="p-2 rounded-md">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="p-6 rounded bg-white shadow">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Stock Summary Report</h2>

          {/* Integrated / New Selection */}
          <div className="flex justify-center gap-6 mt-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={integrate === "integrated"}
                onChange={() => setIntegrate("integrated")}
              />
              Integrated account with inventory
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={integrate === "new"}
                onChange={() => setIntegrate("new")}
              />
              Create new
            </label>
          </div>

          {/* Report Views */}
          {integrate === "integrated" && (
            <div className="mt-5 flex justify-center gap-8 ">
              {["Opening", "Purchase", "Sales", "Closing", "All"].map(
                (view) => (
                  <label key={view} className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={reportView === view}
                      onChange={() => setReportView(view as any)}
                    />
                    {view}
                  </label>
                )
              )}
            </div>
          )}

          {integrate === "new" && (
            <div className="mt-4">
              <button
                onClick={() => navigate("/app/masters/stock-item/create")}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Click to Redirect
              </button>
            </div>
          )}
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading &&
          !error &&
          integrate === "integrated" &&
          data.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No data available for {reportView} view</p>
            </div>
          )}

        {!loading &&
          !error &&
          integrate === "integrated" &&
          data.length > 0 && (
            <>
              {reportView === "Opening" ? (
                <ReportTable
                  theme={theme}
                  columns={columns}
                  data={data}
                  onRowClick={(row: any) => {
                    let itemId = row.item?.id ?? row.id ?? "";
                    navigate(`/app/reports/movement-analysis?itemId=${itemId}`);
                  }}
                />
              ) : (
                <div className="overflow-x-auto">
                  <table className={`w-full border-collapse`}>
                    <thead>
                      <tr className={theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-black"}>
                        {columns.map((col) => (
                          <th
                            key={col.accessor}
                            className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-${col.align || "left"} font-semibold`}
                          >
                            {col.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupedData.map((group, idx) => {
                        const isExpanded = expandedItems.has(group.itemName);
                        return (
                          <React.Fragment key={idx}>
                            {/* Group Header Row */}
                            <tr
                              className={`cursor-pointer ${
                                theme === "dark"
                                  ? "hover:bg-gray-600 text-white"
                                  : "hover:bg-gray-100 text-black"
                              } ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
                              onClick={() => toggleItem(group.itemName)}
                            >
                              <td
                                className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                              >
                                -
                              </td>
                              <td
                                className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"}`}
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                  <span className="font-semibold">{group.itemName}</span>
                                  <span className="text-xs opacity-70">
                                    ({group.transactionCount} transactions)
                                  </span>
                                </div>
                              </td>
                              {reportView === "All" && (
                                <td
                                  className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                >
                                  -
                                </td>
                              )}
                              {reportView === "Closing" && (
                                <td
                                  className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                >
                                  {group.unitName || "-"}
                                </td>
                              )}
                              <td
                                className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                              >
                                {group.hsnCode || "-"}
                              </td>
                              {(reportView !== "All" && reportView !== "Closing") && (
                                <td
                                  className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                >
                                  -
                                </td>
                              )}
                              {reportView === "All" && (
                                <td
                                  className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                >
                                  -
                                </td>
                              )}
                              {reportView === "Closing" && (
                                <td
                                  className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                >
                                  -
                                </td>
                              )}
                              <td
                                className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center font-semibold`}
                              >
                                {reportView === "Purchase"
                                  ? `+${group.totalQty}`
                                  : reportView === "Sales"
                                  ? `-${group.totalQty}`
                                  : reportView === "Closing"
                                  ? group.totalQty
                                  : group.totalQty}
                              </td>
                              {reportView === "All" && (
                                <td
                                  className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                >
                                  -
                                </td>
                              )}
                              {(reportView === "Purchase" || reportView === "Sales") && (
                                <td
                                  className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                >
                                  -
                                </td>
                              )}
                            </tr>
                            {/* Expanded Transaction Rows */}
                            {isExpanded &&
                              group.transactions.map((transaction: any, tIdx: number) => (
                                <tr
                                  key={`${idx}-${tIdx}`}
                                  className={`${
                                    theme === "dark"
                                      ? "bg-gray-900 text-white"
                                      : "bg-white text-black"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    let itemId = transaction.id || "";
                                    if (itemId) {
                                      navigate(`/app/reports/movement-analysis?itemId=${itemId}`);
                                    }
                                  }}
                                >
                                  {reportView === "All" ? (
                                    <>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {tIdx + 1}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center pl-8`}
                                      >
                                        {transaction.type}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.name}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.hsnCode || "-"}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.batchNumber || "-"}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.qty}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {formatDate(transaction.date)}
                                      </td>
                                    </>
                                  ) : reportView === "Closing" ? (
                                    <>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {tIdx + 1}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center pl-8`}
                                      >
                                        {transaction.itemName}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.unitName || "-"}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.hsnCode || "-"}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.batchNumber || "-"}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.closingQty ?? transaction.qty ?? 0}
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {tIdx + 1}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center pl-8`}
                                      >
                                        {transaction.itemName}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.hsnCode || "-"}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {transaction.batchNumber || "-"}
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {reportView === "Purchase"
                                          ? `+${transaction.qty}`
                                          : `-${transaction.qty}`}                                            
                                      </td>
                                      <td
                                        className={`p-2 border ${theme === "dark" ? "border-gray-500" : "border-gray-400"} text-center`}
                                      >
                                        {formatDate(transaction.date)}
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
      </div>
    </div>
  );
};

export default StockSummary;
