import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import ReportTable from "./ReportTable";

const StockSummary: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            unitName: item.unitName ?? "",
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

  const loadAllData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ company_id, owner_type, owner_id });

      const [openingRes, purchaseRes, salesRes] = await Promise.all([
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

      const openingData = await openingRes.json();
      const purchaseData = await purchaseRes.json();
      const salesData = await salesRes.json();

      const allFormatted: any[] = [];

      // Opening
      if (Array.isArray(openingData.data)) {
        openingData.data.forEach((item: any) => {
          // If item has batches, create a row for each batch
          if (Array.isArray(item.batches) && item.batches.length > 0) {
            item.batches.forEach((batch: any) => {
              allFormatted.push({
                type: "Opening",
                name: item.name,
                hsnCode: item.hsnCode,
                batchNumber: batch.batchName || "",
                qty: batch.batchQuantity || 0,
                date: "-",
              });
            });
          } else {
            // If no batches, create a single row with total opening balance
            allFormatted.push({
              type: "Opening",
              name: item.name,
              hsnCode: item.hsnCode,
              batchNumber: "",
              qty: Number(item.openingBalance || 0),
              date: "-",
            });
          }
        });
      }

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
    if (reportView === "Opening") loadOpeningStock();
    else if (reportView === "Purchase") loadPurchaseData();
    else if (reportView === "Sales") loadSalesData();
    else if (reportView === "All") loadAllData();
  }, [reportView, integrate]);

  // TABLE COLUMNS
  const columns = useMemo(() => {
    if (reportView === "All") {
      return [
        { header: "Type", accessor: "type", align: "center" },
        { header: "Item", accessor: "name", align: "center" },
        { header: "HSN", accessor: "hsnCode", align: "center" },
        {
          header: "Batch",
          accessor: "batchNumber",
          align: "center",
          render: (r: any) => r.batchNumber || "-",
        },
        {
          header: "Qty",
          accessor: "qty",
          align: "center",
        },
        {
          header: "Date",
          accessor: "date",
          align: "center",
          render: (r: any) =>
            r.date && r.date !== "-"
              ? new Date(r.date).toLocaleDateString("en-GB")
              : "-",
        },
      ];
    }

    if (reportView === "Purchase") {
      return [
        { header: "Item", accessor: "itemName", align: "center" },
        { header: "HSN", accessor: "hsnCode", align: "center" },
        { header: "Batch", accessor: "batchNumber", align: "center" },

        {
          header: "Qty (+)",
          accessor: "qty",
          align: "center",
          render: (r: any) => `+${r.qty}`,
        },

        {
          header: "Date",
          accessor: "date",
          align: "center",
          render: (r: any) =>
            r.date ? new Date(r.date).toLocaleDateString("en-GB") : "-",
        },
      ];
    }

    if (reportView === "Sales") {
      return [
        { header: "Item", accessor: "itemName", align: "center" },
        { header: "HSN", accessor: "hsnCode", align: "center" },
        { header: "Batch", accessor: "batchNumber", align: "center" },

        // Qty with -
        {
          header: "Sale Qty (-)",
          accessor: "qty",
          align: "center",
          render: (r: any) => `-${r.qty}`,
        },

        // Beautiful date formatting
        {
          header: "Sale Date",
          accessor: "date",
          align: "center",
          render: (r: any) =>
            r.date ? new Date(r.date).toLocaleDateString("en-GB") : "-",
        },
      ];
    }

    // Opening Stock same
    return [
      {
        header: "Stock Item",
        accessor: "name",
        align: "center",
        render: (r: any) => r.item?.name ?? "",
      },
      {
        header: "Unit",
        accessor: "unitName",
        align: "center",
        render: (r: any) => r.item?.unitName ?? "",
      },
      {
        header: "HSN",
        accessor: "hsnCode",
        align: "center",
        render: (r: any) => r.item?.hsnCode ?? "",
      },
      {
        header: "GST",
        accessor: "gstRate",
        align: "center",
        render: (r: any) => (r.item?.gstRate ?? 0) + "%",
      },
      {
        header: "Tax Type",
        accessor: "taxType",
        align: "center",
        render: (r: any) => r.item?.taxType ?? "",
      },
    ];
  }, [reportView]);

  const handleExport = () => {
    if (!data.length) return;
    const csv = [
      columns.map((c) => c.header).join(","),
      ...data.map((row: any) =>
        columns
          .map((c: any) => (c.render ? c.render(row) : row[c.accessor] ?? ""))
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
          data.length > 0 && (
            <ReportTable
              theme={theme}
              columns={columns}
              data={data}
              onRowClick={(row: any) => {
                let itemId = row.item?.id ?? row.id ?? "";
                navigate(`/app/reports/movement-analysis?itemId=${itemId}`);
              }}
            />
          )}
      </div>
    </div>
  );
};

export default StockSummary;
