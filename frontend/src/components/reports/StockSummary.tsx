import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  ChevronDown,
  ChevronRight,
  Settings,
  Edit,
  Check,
  X,
} from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import ReportTable from "./ReportTable";

const StockSummary: React.FC = () => {
  const { theme, units } = useAppContext();

  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showSettings, setShowSettings] = useState(false);
  const [editLedgerId, setEditLedgerId] = useState<number | null>(null);
  const [editClosingBalance, setEditClosingBalance] = useState<string>("");

  const [integrate, setIntegrate] = useState<"integrated" | "new">(
    () => (localStorage.getItem("stock_integrate") as any) || "new"
  );

  const [reportView, setReportView] = useState<
    "Opening" | "Purchase" | "Sales" | "Closing" | "All"
  >(() => (localStorage.getItem("stock_report_view") as any) || "Opening");

  useEffect(() => {
    localStorage.setItem("stock_integrate", integrate);
  }, [integrate]);

  useEffect(() => {
    localStorage.setItem("stock_report_view", reportView);
  }, [reportView]);

  const company_id = localStorage.getItem("company_id") || "";
  const owner_type = localStorage.getItem("owner_type") || "employee";
  const owner_id =
    localStorage.getItem(
      owner_type === "employee" ? "employee_id" : "user_id"
    ) || "";

  //ledger-group and ledger data get filte Stock-in-hand

  //get all ledger-group
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!company_id || !owner_type || !owner_id) {
        setGroups([]);
        return;
      }

      try {
        const groupRes = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger-groups?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
        );

        if (!groupRes.ok) {
          throw new Error("Failed to fetch ledger groups");
        }

        const groupData = await groupRes.json();

        const stockGroup = Array.isArray(groupData)
          ? groupData.find(
              (g: any) =>
                typeof g?.name === "string" &&
                g.name.toLowerCase() === "stock-in-hand"
            )
          : null;

        if (!stockGroup) {
          console.warn("Stock-in-hand group not found");
          setGroups([]);
          return;
        }

        const stockGroupId = stockGroup.id;

        const ledgerRes = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`
        );

        if (!ledgerRes.ok) {
          throw new Error("Failed to fetch ledgers");
        }

        const ledgerData = await ledgerRes.json();

        const filteredLedgers = Array.isArray(ledgerData)
          ? ledgerData.filter(
              (l: any) => Number(l.groupId) === Number(stockGroupId)
            )
          : [];

        setGroups(filteredLedgers);
      } catch (error) {
        console.error("Error loading stock-in-hand ledgers", error);
        setGroups([]);
      }
    };

    fetchData();
  }, [company_id, owner_type, owner_id]);

  console.log("group", groups);

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
      console.log("json", json.data);
      const formatted = Array.isArray(json.data)
        ? json.data.map((item: any) => ({
            item: {
              id: item.id,
              name: item.name,
              unitName: units.find((u) => u.id === item.unit)?.name ?? "",
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
        `${
          import.meta.env.VITE_API_URL
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
        `${
          import.meta.env.VITE_API_URL
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
          `${
            import.meta.env.VITE_API_URL
          }/api/purchase-vouchers/purchase-history?${params.toString()}`
        ),
        fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?${params.toString()}`
        ),
      ]);

      const stockItemsData = await stockItemsRes.json();
      const purchaseData = await purchaseRes.json();
      const salesData = await salesRes.json();

      // Create a map of item names to their unit info
      const itemUnitMap: Record<string, { hsnCode: string; unitName: string }> =
        {};
      if (Array.isArray(stockItemsData.data)) {
        stockItemsData.data.forEach((item: any) => {
          itemUnitMap[item.name] = {
            hsnCode: item.hsnCode || "",
            unitName: units.find((u) => u.id === item.unit)?.name ?? "",
          };
        });
      }

      // Track closing balance for each item and batch (only Purchase - Sales)
      // Batch-wise closing only for items with opening stock
      const closingMap: Record<string, Record<string, number>> = {};
      const itemInfo: Record<string, { hsnCode: string; unitName: string }> =
        {};
      const movementCheck: Record<string, boolean> = {}; // Track movement

      // 1️⃣ Opening stock => default batch
      if (Array.isArray(stockItemsData.data)) {
        stockItemsData.data.forEach((item: any) => {
          const itemName = item.name;

          closingMap[itemName] = {
            default: Number(item.openingBalance || 0),
          };

          itemInfo[itemName] = {
            hsnCode: item.hsnCode || "",
            unitName: units.find((u) => u.id === item.unit)?.name ?? "",
          };

          movementCheck[itemName] = false; // initially no movement
        });
      }

      // 2️⃣ Purchase
      if (Array.isArray(purchaseData.data)) {
        purchaseData.data.forEach((v: any) => {
          const itemName = v.itemName;
          const batch = v.batchNumber || "default";
          const qty = Number(v.purchaseQuantity || 0);

          if (!closingMap[itemName]) return; // no opening => skip

          closingMap[itemName][batch] =
            (closingMap[itemName][batch] || 0) + qty;

          movementCheck[itemName] = true;
        });
      }

      // 3️⃣ Sales
      if (Array.isArray(salesData.data)) {
        salesData.data.forEach((v: any) => {
          const itemName = v.itemName;
          const batch = v.batchNumber || "default";
          const qty = Math.abs(Number(v.qtyChange || 0));

          if (!closingMap[itemName]) return;

          closingMap[itemName][batch] =
            (closingMap[itemName][batch] || 0) - qty;

          movementCheck[itemName] = true;
        });
      }
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

      const [stockItemsRes, purchaseRes, salesRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items?${params.toString()}`
        ),
        fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/purchase-vouchers/purchase-history?${params.toString()}`
        ),
        fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?${params.toString()}`
        ),
      ]);

      const stockItemsData = await stockItemsRes.json();
      const purchaseData = await purchaseRes.json();
      const salesData = await salesRes.json();

      // Create opening balance map
      const openingBalanceMap: Record<string, number> = {};
      if (Array.isArray(stockItemsData.data)) {
        stockItemsData.data.forEach((item: any) => {
          openingBalanceMap[item.name] = Number(item.openingBalance || 0);
        });
      }

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
            qtyValue: Number(v.purchaseQuantity || 0),
            date: v.purchaseDate,
            openingBalance: openingBalanceMap[v.itemName] || 0,
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
            qtyValue: -Math.abs(Number(v.qtyChange || 0)),
            date: v.movementDate,
            openingBalance: openingBalanceMap[v.itemName] || 0,
          });
        });
      }

      // Sort by date and calculate closing balance
      allFormatted.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });

      // Calculate running closing balance per item
      const closingBalanceMap: Record<string, number> = {};
      allFormatted.forEach((transaction) => {
        const itemName = transaction.name;
        if (!closingBalanceMap.hasOwnProperty(itemName)) {
          closingBalanceMap[itemName] = openingBalanceMap[itemName] || 0;
        }
        closingBalanceMap[itemName] += transaction.qtyValue;
        transaction.closingBalance = closingBalanceMap[itemName];
      });

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
      // Sort transactions by date within each group (for All view)
      if (reportView === "All") {
        transactions.sort((a, b) => {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return dateA - dateB;
        });
      }

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
          qty =
            typeof t.qty === "string"
              ? parseFloat(t.qty.replace(/[+-]/g, "")) || 0
              : Number(t.qty) || 0;
        }
        totalQty += qty;
      });

      // Calculate final closing balance for All view
      let finalClosingBalance = 0;
      if (reportView === "All" && transactions.length > 0) {
        // Recalculate closing balance per item group to ensure accuracy
        // Get opening balance from the first transaction
        let runningBalance = transactions[0].openingBalance ?? 0;

        // Recalculate closing balance for each transaction in this group
        transactions.forEach((t) => {
          runningBalance += t.qtyValue ?? 0;
          t.closingBalance = runningBalance;
        });

        finalClosingBalance = runningBalance;
      }

      return {
        itemName,
        hsnCode,
        unitName,
        transactions,
        totalQty,
        finalClosingBalance,
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
    if (
      !dateValue ||
      dateValue === "-" ||
      dateValue === null ||
      dateValue === undefined
    ) {
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
          year: "numeric",
        });
      }

      // If it's a Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
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
          header: "Closing",
          accessor: "closingBalance",
          align: "center" as const,
          render: (r: any) => r.closingBalance ?? 0,
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
    const exportData =
      reportView === "Opening"
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

  // handleEdit
  const handleEditClick = (ledger: any) => {
    console.log("handle", ledger);
    setEditLedgerId(ledger.id);
    setEditClosingBalance(ledger.closingBalance ?? "");
  };

  const handleCancelEdit = () => {
    setEditLedgerId(null);
    setEditClosingBalance("");
  };

  const handleSaveEdit = async (ledgerId: number) => {
    try {
      const res = await fetch(
        `${
          import.meta.env.VITE_API_URL
        }/api/ledger?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ledgerId,
            closingBalance: editClosingBalance,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update closing balance");
      }

      // Update UI after success
      setGroups((prev) =>
        prev.map((l) =>
          l.id === ledgerId ? { ...l, closingBalance: editClosingBalance } : l
        )
      );

      setEditLedgerId(null);
      setEditClosingBalance("");
    } catch (error) {
      console.error("Closing balance update failed", error);
      alert("Failed to update closing balance");
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Stock Summary</h1>

        <div className="ml-auto flex space-x-2 relative">
          <button
            onClick={() => setShowSettings((p) => !p)}
            className="p-2 rounded-md hover:bg-gray-200"
            title="Settings"
          >
            <Settings size={18} />
          </button>

          <button onClick={() => window.print()} className="p-2 rounded-md">
            <Printer size={18} />
          </button>

          <button onClick={handleExport} className="p-2 rounded-md">
            <Download size={18} />
          </button>

          {/* 🔽 Dropdown */}
          {showSettings && (
            <div className="absolute right-0 top-10 w-64 bg-white border shadow rounded z-50">
              <div className="p-3 border-b font-semibold text-sm">
                Inventory Settings
              </div>

              <div className="p-3 space-y-2 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={integrate === "integrated"}
                    onChange={() => {
                      setIntegrate("integrated");
                      setShowSettings(false);
                    }}
                  />
                  Integrated account with inventory
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={integrate === "new"}
                    onChange={() => {
                      setIntegrate("new");
                      setShowSettings(false);
                    }}
                  />
                  Create new
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 rounded bg-white shadow">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">Stock Summary Report</h2>

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
            <div className="mt-6 overflow-x-auto">
              <h2 className="text-lg font-semibold mb-3 text-center">
                Stock-in-Hand Ledgers
              </h2>

              {groups.length === 0 ? (
                <p className="text-center text-gray-500">
                  No Stock-in-Hand data found
                </p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr
                      className={
                        theme === "dark"
                          ? "bg-gray-700 text-white"
                          : "bg-gray-200 text-black"
                      }
                    >
                      <th className="p-2 border text-center">S.No</th>
                      <th className="p-2 border text-center">Ledger Name</th>
                      <th className="p-2 border text-center">
                        Opening Balance
                      </th>
                      <th className="p-2 border text-center">
                        Closing Balance
                      </th>
                      <th className="p-2 border text-center">Balance Type</th>
                      <th className="p-2 border text-center">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {groups.map((ledger, index) => (
                      <tr
                        key={ledger.id}
                        className={
                          theme === "dark"
                            ? "bg-gray-900 text-white"
                            : "bg-white text-black"
                        }
                      >
                        <td className="p-2 border text-center">{index + 1}</td>

                        <td className="p-2 border text-center font-medium">
                          {ledger.name}
                        </td>

                        <td className="p-2 border text-center">
                          {ledger.openingBalance}
                        </td>

                        {/* 🔹 Closing Balance (Editable) */}
                        <td className="p-2 border text-center">
                          {editLedgerId === ledger.id ? (
                            <input
                              type="number"
                              className="w-24 px-2 py-1 border rounded text-center"
                              value={editClosingBalance}
                              onChange={(e) =>
                                setEditClosingBalance(e.target.value)
                              }
                            />
                          ) : (
                            ledger.closingBalance
                          )}
                        </td>

                        <td className="p-2 border text-center capitalize">
                          {ledger.balanceType}
                        </td>

                        {/* 🔹 Action */}
                        <td className="p-2 border text-center">
                          {editLedgerId === ledger.id ? (
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(ledger.id)}
                                className="text-green-600 hover:text-green-800"
                                title="Save"
                              >
                                <Check size={18} />
                              </button>

                              <button
                                onClick={handleCancelEdit}
                                className="text-red-600 hover:text-red-800"
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditClick(ledger)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit Closing Balance"
                            >
                              <Edit size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
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
              <p className="text-gray-500">
                No data available for {reportView} view
              </p>
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
                      <tr
                        className={
                          theme === "dark"
                            ? "bg-gray-700 text-white"
                            : "bg-gray-200 text-black"
                        }
                      >
                        {columns.map((col) => (
                          <th
                            key={col.accessor}
                            className={`p-2 border ${
                              theme === "dark"
                                ? "border-gray-500"
                                : "border-gray-400"
                            } text-${col.align || "left"} font-semibold`}
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
                              } ${
                                theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                              }`}
                              onClick={() => toggleItem(group.itemName)}
                            >
                              <td
                                className={`p-2 border ${
                                  theme === "dark"
                                    ? "border-gray-500"
                                    : "border-gray-400"
                                } text-center`}
                              >
                                -
                              </td>
                              <td
                                className={`p-2 border ${
                                  theme === "dark"
                                    ? "border-gray-500"
                                    : "border-gray-400"
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown size={16} />
                                  ) : (
                                    <ChevronRight size={16} />
                                  )}
                                  <span className="font-semibold">
                                    {group.itemName}
                                  </span>
                                  <span className="text-xs opacity-70">
                                    ({group.transactionCount} transactions)
                                  </span>
                                </div>
                              </td>
                              {reportView === "All" && (
                                <td
                                  className={`p-2 border ${
                                    theme === "dark"
                                      ? "border-gray-500"
                                      : "border-gray-400"
                                  } text-center`}
                                >
                                  -
                                </td>
                              )}
                              {reportView === "Closing" && (
                                <td
                                  className={`p-2 border ${
                                    theme === "dark"
                                      ? "border-gray-500"
                                      : "border-gray-400"
                                  } text-center`}
                                >
                                  {group.unitName || "-"}
                                </td>
                              )}
                              <td
                                className={`p-2 border ${
                                  theme === "dark"
                                    ? "border-gray-500"
                                    : "border-gray-400"
                                } text-center`}
                              >
                                {group.hsnCode || "-"}
                              </td>
                              {reportView !== "All" &&
                                reportView !== "Closing" && (
                                  <td
                                    className={`p-2 border ${
                                      theme === "dark"
                                        ? "border-gray-500"
                                        : "border-gray-400"
                                    } text-center`}
                                  >
                                    -
                                  </td>
                                )}
                              {reportView === "All" && (
                                <td
                                  className={`p-2 border ${
                                    theme === "dark"
                                      ? "border-gray-500"
                                      : "border-gray-400"
                                  } text-center`}
                                >
                                  -
                                </td>
                              )}
                              {reportView === "Closing" && (
                                <td
                                  className={`p-2 border ${
                                    theme === "dark"
                                      ? "border-gray-500"
                                      : "border-gray-400"
                                  } text-center`}
                                >
                                  -
                                </td>
                              )}
                              <td
                                className={`p-2 border ${
                                  theme === "dark"
                                    ? "border-gray-500"
                                    : "border-gray-400"
                                } text-center font-semibold`}
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
                                  className={`p-2 border ${
                                    theme === "dark"
                                      ? "border-gray-500"
                                      : "border-gray-400"
                                  } text-center font-semibold`}
                                >
                                  {group.finalClosingBalance ?? 0}
                                </td>
                              )}
                              {reportView === "All" && (
                                <td
                                  className={`p-2 border ${
                                    theme === "dark"
                                      ? "border-gray-500"
                                      : "border-gray-400"
                                  } text-center`}
                                >
                                  -
                                </td>
                              )}
                              {(reportView === "Purchase" ||
                                reportView === "Sales") && (
                                <td
                                  className={`p-2 border ${
                                    theme === "dark"
                                      ? "border-gray-500"
                                      : "border-gray-400"
                                  } text-center`}
                                >
                                  -
                                </td>
                              )}
                            </tr>
                            {/* Expanded Transaction Rows */}
                            {isExpanded &&
                              group.transactions.map(
                                (transaction: any, tIdx: number) => (
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
                                        navigate(
                                          `/app/reports/movement-analysis?itemId=${itemId}`
                                        );
                                      }
                                    }}
                                  >
                                    {reportView === "All" ? (
                                      <>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {tIdx + 1}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center pl-8`}
                                        >
                                          {transaction.type}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.name}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.hsnCode || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.batchNumber || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.qty}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.closingBalance ?? 0}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {formatDate(transaction.date)}
                                        </td>
                                      </>
                                    ) : reportView === "Closing" ? (
                                      <>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {tIdx + 1}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center pl-8`}
                                        >
                                          {transaction.itemName}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.unitName || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.hsnCode || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.batchNumber || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.closingQty ??
                                            transaction.qty ??
                                            0}
                                        </td>
                                      </>
                                    ) : (
                                      <>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {tIdx + 1}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center pl-8`}
                                        >
                                          {transaction.itemName}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.hsnCode || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {transaction.batchNumber || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {reportView === "Purchase"
                                            ? `+${transaction.qty}`
                                            : `-${transaction.qty}`}
                                        </td>
                                        <td
                                          className={`p-2 border ${
                                            theme === "dark"
                                              ? "border-gray-500"
                                              : "border-gray-400"
                                          } text-center`}
                                        >
                                          {formatDate(transaction.date)}
                                        </td>
                                      </>
                                    )}
                                  </tr>
                                )
                              )}
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
