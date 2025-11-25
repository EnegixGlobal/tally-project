import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";
import ReportTable from "./ReportTable";
import type { StockItem, StockGroup } from "../../types";

// Define types for summary data
interface ItemSummary {
  item: StockItem;
  inwardQty: number;
  outwardQty: number;
  closingQty: number;
  closingValue: number;
  profit: number;
}

interface GroupSummary {
  group: StockGroup;
  inwardQty: number;
  outwardQty: number;
  closingQty: number;
  closingValue: number;
  profit: number;
}

// type SummaryData = ItemSummary | GroupSummary;

const StockSummary: React.FC = () => {
  const { theme, stockGroups, companyInfo } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [view, setView] = useState<"Item" | "Group">("Item");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integrate, setIntegrate] = useState<"integrated" | "new">("new");

  const [filters, setFilters] = useState({
    fromDate: companyInfo?.financialYear
      ? companyInfo.financialYear.split("-")[0] + "-04-01"
      : "2025-04-01",
    toDate: new Date().toISOString().slice(0, 10),
    stockGroupId: "",
    stockItemId: "",
    godownId: "",
    batchId: "",
    period: "Monthly",
    basis: "Quantity" as "Quantity" | "Value" | "Cost",
    show: false,
  });
  // Fetch data on filters change
  useEffect(() => {
    async function fetchSummary() {
      setLoading(true);
      setError(null);

      const owner_type = localStorage.getItem("userType") || "";
      const owner_id =
        localStorage.getItem(
          owner_type === "employee" ? "employee_id" : "user_id"
        ) || "";

      if (!owner_type || !owner_id) {
        setError("Missing tenant information.");
        setLoading(false);
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append("owner_type", owner_type);
        params.append("owner_id", owner_id);

        if (filters.fromDate) params.append("fromDate", filters.fromDate);
        if (filters.toDate) params.append("toDate", filters.toDate);
        if (filters.stockGroupId)
          params.append("stockGroupId", filters.stockGroupId);
        if (filters.stockItemId)
          params.append("stockItemId", filters.stockItemId);
        if (filters.godownId) params.append("godownId", filters.godownId);
        if (filters.batchId) params.append("batchId", filters.batchId);
        if (filters.period) params.append("period", filters.period);
        if (filters.basis) params.append("basis", filters.basis);
        if (filters.show) params.append("show", String(filters.show));

        const response = await fetch(
          `http://localhost:5000/api/stock-items?${params.toString()}`
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `Error: ${response.status}`);
        }

        const json = await response.json();

        // 🆕 Convert API data into Stock Summary Format
        const formatted = json.data.map((item: any) => {
          const openingQty = Number(item.openingBalance || 0);
          const inwardQty = 0;
          const outwardQty = 0;
          const closingQty = openingQty + inwardQty - outwardQty;

          return {
            item: {
              id: item.id,
              name: item.name,
              stockGroupId: item.stockGroupId,
              stockGroupName: item.stockGroupName,
              unit: item.unit,
              unitName: item.unitName,
              openingBalance: openingQty,
              hsnCode: item.hsnCode,
              gstRate: Number(item.gstRate || 0),
              barcode: item.barcode,
              taxType: item.taxType,
              batchNumber: item.batchNumber,
              batchExpiryDate: item.batchExpiryDate,
              batchManufacturingDate: item.batchManufacturingDate,
              batches: item.batches ? JSON.parse(item.batches) : [],
            },

            inwardQty,
            outwardQty,
            closingQty,
            closingValue: closingQty * 0,
            profit: 0,
          };
        });

        setData(formatted);
      } catch (e: any) {
        setError(e.message || "Failed to load data");
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [filters]);


  // Compute grouped data if view is Group, else use data directly
  const groupedData = useMemo(() => {
    if (view === "Group") {
      const groupsMap = new Map<string, any>();
      data.forEach((item) => {
        const groupId = item.item?.stockGroupId || item.group?.id || "unknown";
        if (!groupsMap.has(groupId)) {
          const group = stockGroups.find((g) => g.id === groupId);
          if (!group) return;
          groupsMap.set(groupId, {
            group,
            inwardQty: 0,
            outwardQty: 0,
            closingQty: 0,
            closingValue: 0,
            profit: 0,
          });
        }
        const grp = groupsMap.get(groupId);
        grp.inwardQty += item.inwardQty ?? 0;
        grp.outwardQty += item.outwardQty ?? 0;
        grp.closingQty += item.closingQty ?? 0;
        grp.closingValue += item.closingValue ?? 0;
        grp.profit += item.profit ?? 0;
      });
      return Array.from(groupsMap.values());
    }
    return data;
  }, [data, view, stockGroups]);

  // Define your columns (adjust accessors/renderers for your data)
  const columns = useMemo(
    () => [
      {
        header: view === "Item" ? "Stock Item" : "Stock Group",
        accessor: "name",
        align: "left" as const,
        render: (row: any) =>
          view === "Item" ? row.item?.name || "" : row.group?.name || "",
      },

      {
        header: "Unit",
        accessor: "unitName",
        align: "left" as const,
        render: (row: any) => (view === "Item" ? row.item?.unitName || "" : ""),
      },

      {
        header: "Opening Balance",
        accessor: "openingBalance",
        align: "right" as const,
        render: (row: any) => {
          const val = row.item?.openingBalance;
          return val ? val.toLocaleString() : "";
        },
      },

      {
        header: "HSN Code",
        accessor: "hsnCode",
        align: "right" as const,
        render: (row: any) => (row.item?.hsnCode ? row.item.hsnCode : ""),
      },

      {
        header: "GST Rate",
        accessor: "gstRate",
        align: "right" as const,
        render: (row: any) => (row.item?.gstRate ? `${row.item.gstRate}%` : ""),
      },

      {
        header: "Tax Type",
        accessor: "taxType",
        align: "right" as const,
        render: (row: any) => (row.item?.taxType ? row.item.taxType : ""),
      },

      ...(filters.show
        ? [
            {
              header: "Profit",
              accessor: "profit",
              align: "right" as const,
              render: (row: any) =>
                row.profit ? `₹${row.profit.toLocaleString()}` : "",
            },
          ]
        : []),
    ],
    [view, filters.show]
  );

  // Footer totals
  const footer = useMemo(() => {
    return [
      { accessor: "name", value: "Total" },
      { accessor: "unitName", value: "" },

      {
        accessor: "openingBalance",
        value: (() => {
          const total = data.reduce(
            (sum, r) => sum + (r.item?.openingBalance || 0),
            0
          );
          return total ? total.toLocaleString() : "";
        })(),
      },

      { accessor: "hsnCode", value: "" },
      { accessor: "gstRate", value: "" },
      { accessor: "taxType", value: "" },

      ...(filters.show
        ? [
            {
              accessor: "profit",
              value: (() => {
                const total = data.reduce((sum, r) => sum + (r.profit || 0), 0);
                return total ? `₹${total.toLocaleString()}` : "";
              })(),
            },
          ]
        : []),
    ];
  }, [data, filters.show]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Stock Summary</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{font-size:24px}table{width:100%;border-collapse:collapse}th,td{padding:8px;border:1px solid #ddd}</style></head>
          <body>
            <h1>${companyInfo?.name || "Hanuman Car Wash"} - Stock Summary</h1>
            <p>From ${filters.fromDate} to ${filters.toDate}</p>
            <table>
              <thead>
                <tr>${columns
                  .map(
                    (col) =>
                      `<th style="text-align:${col.align}">${col.header}</th>`
                  )
                  .join("")}</tr>
              </thead>
              <tbody>
                ${data
                  .map(
                    (row) =>
                      `<tr>${columns
                        .map(
                          (col) =>
                            `<td style="text-align:${col.align}">${
                              col.render
                                ? col.render(row)
                                : (row as Record<string, unknown>)[col.accessor]
                            }</td>`
                        )
                        .join("")}</tr>`
                  )
                  .join("")}
              </tbody>
              <tfoot>
                <tr>${footer
                  .map(
                    (f) =>
                      `<td style="text-align:${
                        columns.find((c) => c.accessor === f.accessor)?.align
                      }">${f.value}</td>`
                  )
                  .join("")}</tr>
              </tfoot>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [
    companyInfo?.name,
    filters.fromDate,
    filters.toDate,
    columns,
    data,
    footer,
  ]);

  const handleExport = useCallback(() => {
    const csv = [
      columns.map((col) => col.header).join(","),
      ...data.map((row) =>
        columns
          .map((col) =>
            col.render
              ? col.render(row)
              : (row as Record<string, unknown>)[col.accessor]
          )
          .join(",")
      ),
      footer.map((f) => f.value).join(","),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock_summary.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, data, footer]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        setFilters({ ...filters }); // Trigger re-render
      } else if (e.key === "F12") {
        e.preventDefault();
        alert("Configuration options not implemented yet.");
      } else if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        handleExport();
      } else if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filters, handleExport, handlePrint]);

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Reports"
          onClick={() => navigate("/app/reports/profit-loss")}
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
          Stock Summary
        </h1>

        <div className="ml-auto flex space-x-2">
          <select
            title="View Type"
            value={view}
            onChange={(e) => setView(e.target.value as "Item" | "Group")}
            className={`p-2 rounded border ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-gray-100"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          >
            <option value="Item">Stock Item-wise</option>
            <option value="Group">Stock Group-wise</option>
          </select>

          <button
            title="Toggle Filters"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
          </button>

          <button
            title="Print Report"
            onClick={handlePrint}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>

          <button
            title="Download Report"
            onClick={handleExport}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold">Stock Summary Report</h2>
          <p className="text-sm opacity-75">
            From {filters.fromDate} to {filters.toDate}
          </p>

          <div className="flex justify-center gap-6 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="integration"
                value="integrated"
                checked={integrate === "integrated"}
                onChange={() => setIntegrate("integrated")}
              />
              Integrated account with inventory
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="integration"
                value="new"
                checked={integrate === "new"}
                onChange={() => setIntegrate("new")}
              />
              Create new
            </label>
          </div>

          {integrate === "new" && (
            <div className="text-center mt-4">
              <button
                onClick={() => navigate("/app/masters/stock-item/create")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md shadow hover:bg-blue-700"
              >
                Click to Redirect
              </button>
            </div>
          )}
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && integrate !== "new" && (
          <ReportTable
            theme={theme}
            columns={columns}
            data={view === "Group" ? groupedData : data}
            footer={footer}
            onRowClick={(row) =>
              navigate(
                `/app/reports/movement-analysis?itemId=${
                  view === "Item" ? row.item?.id ?? "" : ""
                }&groupId=${view === "Group" ? row.group?.id ?? "" : ""}`
              )
            }
          />
        )}
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Keyboard Shortcuts:</span>
          F5 to refresh, F12 to configure, Ctrl+E to export, Ctrl+P to print.
        </p>
      </div>
    </div>
  );
};

export default StockSummary;
