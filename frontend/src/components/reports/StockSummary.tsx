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
          `${import.meta.env.VITE_API_URL
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
          `${import.meta.env.VITE_API_URL
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

  // console.log("group", groups);

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
      // console.log("json", json.data);
      const formatted = Array.isArray(json.data)
        ? json.data.map((item: any) => {
          let matchedUnitName = item.unitName || "";
          if (!matchedUnitName) {
            const matchedUnit = units.find((u) => String(u.id) === String(item.unit));
            if (matchedUnit && matchedUnit.name) {
              matchedUnitName = matchedUnit.name;
            } else if (item.unit && isNaN(Number(item.unit))) {
              matchedUnitName = item.unit;
            }
          }
          return {
            itemName: item.name,
            unitName: matchedUnitName,
          hsnCode: item.hsnCode || "",
          gstRate: Number(item.gstRate || 0),
          taxType: item.taxType || "",
          batches: (() => {
            const openingByBatches = (item.batches?.filter((b: any) => b.mode === "opening" || !b.mode) || []);
            if (openingByBatches.length > 0) {
              return openingByBatches.map((b: any) => ({
                batchName: b.batchName || "Default",
                opening: {
                  qty: Number(b.batchQuantity || 0),
                  rate: Number(b.openingRate || 0),
                  value: Number(b.batchQuantity || 0) * Number(b.openingRate || 0),
                },
              }));
            }
            if (Number(item.openingBalance || 0) > 0) {
              return [
                {
                  batchName: "Default",
                  opening: {
                    qty: Number(item.openingBalance || 0),
                    rate: Number(item.openingValue && item.openingBalance ? item.openingValue / item.openingBalance : item.rate || 0),
                    value: Number(item.openingValue || 0),
                  },
                },
              ];
            }
            return [];
          })(),
        };
      })
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

      const [historyRes, stockItemsRes] = await Promise.all([
        fetch(
          `${import.meta.env.VITE_API_URL}/api/purchase-vouchers/purchase-history?${params.toString()}`
        ),
        fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items?${params.toString()}`
        ),
      ]);

      if (!historyRes.ok) throw new Error("Failed to load purchase vouchers");
      if (!stockItemsRes.ok) throw new Error("Failed to load stock items");

      const historyJson = await historyRes.json();
      const stockItemsJson = await stockItemsRes.json();

      const purchaseHistory = Array.isArray(historyJson.data) ? historyJson.data : [];
      const stockItemsList = Array.isArray(stockItemsJson.data) ? stockItemsJson.data : [];

      const formatted = purchaseHistory.map((v: any) => ({
        id: v.id,
        itemName: v.itemName,
        hsnCode: v.hsnCode,
        batchNumber: v.batchNumber || "Default",
        qty: v.purchaseQuantity,
        rate: Number(v.rate || v.purchaseRate || 0),
        date: v.purchaseDate,
      }));

      // Find any imported purchase batches in stock items that are NOT present in purchase history
      stockItemsList.forEach((item: any) => {
        if (item.batches && item.batches.length > 0) {
          item.batches.forEach((b: any) => {
            if (b.mode === "purchase") {
              const batchName = b.batchName || "Default";
              // Check if already in formatted history
              const alreadyExists = formatted.some(
                (f) =>
                  f.itemName.toLowerCase().trim() === item.name.toLowerCase().trim() &&
                  (f.batchNumber || "Default").toLowerCase().trim() === batchName.toLowerCase().trim()
              );

              if (!alreadyExists) {
                // Backfill into history
                formatted.push({
                  id: `imported-${item.id}-${batchName}`,
                  itemName: item.name,
                  hsnCode: item.hsnCode || "",
                  batchNumber: batchName,
                  qty: Number(b.batchQuantity || 0),
                  rate: Number(b.openingRate || (b.batchQuantity ? b.openingValue / b.batchQuantity : 0)),
                  date: item.createdAt ? item.createdAt.split(" ")[0] : new Date().toISOString().split("T")[0],
                });
              }
            }
          });
        }
      });

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
          id: v.id,
          itemName: v.itemName,
          hsnCode: v.hsnCode,
          batchNumber: v.batchNumber,
          qty: Math.abs(v.qtyChange),
          rate: Number(v.rate || 0),
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
      const itemUnitMap: Record<string, { hsnCode: string; unitName: string }> =
        {};
      if (Array.isArray(stockItemsData.data)) {
        stockItemsData.data.forEach((item: any) => {
          let matchedUnitName = item.unitName || "";
          if (!matchedUnitName) {
            const matchedUnit = units.find((u) => String(u.id) === String(item.unit));
            if (matchedUnit && matchedUnit.name) {
              matchedUnitName = matchedUnit.name;
            } else if (item.unit && isNaN(Number(item.unit))) {
              matchedUnitName = item.unit;
            }
          }
          itemUnitMap[item.name] = {
            hsnCode: item.hsnCode || "",
            unitName: matchedUnitName,
          };
        });
      }

      // Track closing balance for each item and batch (only Purchase - Sales)
      // Batch-wise closing only for items with opening stock
      const closingMap: Record<string, Record<string, number>> = {};
      const itemInfo: Record<
        string,
        { originalName: string; hsnCode: string; unitName: string }
      > = {};
      const movementCheck: Record<string, boolean> = {}; // Track movement

      // 1️⃣ Opening stock => default batch
      if (Array.isArray(stockItemsData.data)) {
        stockItemsData.data.forEach((item: any) => {
          const itemName = item.name;
          const lookupKey = itemName.toLowerCase().trim();

          closingMap[lookupKey] = {};

          let matchedUnitName = item.unitName || "";
          if (!matchedUnitName) {
            const matchedUnit = units.find((u) => String(u.id) === String(item.unit));
            if (matchedUnit && matchedUnit.name) {
              matchedUnitName = matchedUnit.name;
            } else if (item.unit && isNaN(Number(item.unit))) {
              matchedUnitName = item.unit;
            }
          }

          itemInfo[lookupKey] = {
            originalName: itemName,
            hsnCode: item.hsnCode || "",
            unitName: matchedUnitName,
          };

          movementCheck[lookupKey] = false; // initially no movement

          let batchesProcessed = false;
          if (item.batches && item.batches.length > 0) {
            item.batches.forEach((b: any) => {
              if (!b.mode || b.mode === "opening") {
                const batch = (b.batchName || "default").toLowerCase().trim();
                closingMap[lookupKey][batch] =
                  (closingMap[lookupKey][batch] || 0) + Number(b.batchQuantity || 0);
                batchesProcessed = true;
              }
            });
          }

          // Fallback to item level opening balance if no batches were processed
          if (!batchesProcessed && (Number(item.openingBalance || 0) > 0)) {
            closingMap[lookupKey]["default"] = Number(item.openingBalance || 0);
          }

          // Ensure there is always a default batch key
          if (Object.keys(closingMap[lookupKey]).length === 0) {
            closingMap[lookupKey]["default"] = 0;
          }
        });
      }

      // 2️⃣ Purchase
      const purchaseList = Array.isArray(purchaseData.data) ? purchaseData.data : [];
      purchaseList.forEach((v: any) => {
        const lookupKey = v.itemName ? v.itemName.toLowerCase().trim() : "";
        const batch = v.batchNumber || "default";
        const qty = Number(v.purchaseQuantity || 0);

        if (!closingMap[lookupKey]) return; // no opening => skip

        closingMap[lookupKey][batch] =
          (closingMap[lookupKey][batch] || 0) + qty;

        movementCheck[lookupKey] = true;
      });

      // Backfill imported purchases into closingMap
      if (Array.isArray(stockItemsData.data)) {
        stockItemsData.data.forEach((item: any) => {
          const itemName = item.name;
          const lookupKey = itemName.toLowerCase().trim();
          if (item.batches && item.batches.length > 0) {
            item.batches.forEach((b: any) => {
              if (b.mode === "purchase") {
                const batch = b.batchName || "default";
                const alreadyExists = purchaseList.some(
                  (p: any) =>
                    p.itemName.toLowerCase().trim() === itemName.toLowerCase().trim() &&
                    (p.batchNumber || "default").toLowerCase().trim() === batch.toLowerCase().trim()
                );

                if (!alreadyExists && closingMap[lookupKey]) {
                  closingMap[lookupKey][batch] =
                    (closingMap[lookupKey][batch] || 0) + Number(b.batchQuantity || 0);
                  movementCheck[lookupKey] = true;
                }
              }
            });
          }
        });
      }

      // 3️⃣ Sales
      if (Array.isArray(salesData.data)) {
        salesData.data.forEach((v: any) => {
          const lookupKey = v.itemName ? v.itemName.toLowerCase().trim() : "";
          const batch = v.batchNumber || "default";
          const qty = Math.abs(Number(v.qtyChange || 0));

          if (!closingMap[lookupKey]) return;

          closingMap[lookupKey][batch] =
            (closingMap[lookupKey][batch] || 0) - qty;

          movementCheck[lookupKey] = true;
        });
      }

      // 4️⃣ Format Closing Data and Update State
      const formattedData: any[] = [];
      Object.entries(closingMap).forEach(([lookupKey, batches]) => {
        const info = itemInfo[lookupKey] || { originalName: "", hsnCode: "", unitName: "" };
        Object.entries(batches).forEach(([batchNumber, closingQty]) => {
          formattedData.push({
            itemName: info.originalName,
            unitName: info.unitName,
            hsnCode: info.hsnCode,
            batchNumber: batchNumber === "default" ? "Default" : batchNumber,
            closingQty: closingQty,
          });
        });
      });

      setData(formattedData);
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
        fetch(`${import.meta.env.VITE_API_URL}/api/stock-items?${params}`),
        fetch(
          `${import.meta.env.VITE_API_URL
          }/api/purchase-vouchers/purchase-history?${params}`
        ),
        fetch(
          `${import.meta.env.VITE_API_URL
          }/api/sales-vouchers/sale-history?${params}`
        ),
      ]);

      const stockItemsData = await stockItemsRes.json();
      const purchaseData = await purchaseRes.json();
      const salesData = await salesRes.json();

      const itemMap: Record<string, any> = {};

      const stockItemsList = Array.isArray(stockItemsData?.data) ? stockItemsData.data : [];
      const purchaseList = Array.isArray(purchaseData?.data) ? purchaseData.data : [];
      const salesList = Array.isArray(salesData?.data) ? salesData.data : [];

      // 1️⃣ OPENING STOCK (BATCH-WISE)
      stockItemsList.forEach((item: any) => {
        const itemName = item.name;
        const lookupKey = itemName.toLowerCase().trim();

        let matchedUnitName = item.unitName || "";
        if (!matchedUnitName) {
          const matchedUnit = units.find((u) => String(u.id) === String(item.unit));
          if (matchedUnit && matchedUnit.name) {
            matchedUnitName = matchedUnit.name;
          } else if (item.unit && isNaN(Number(item.unit))) {
            matchedUnitName = item.unit;
          }
        }

        const itemObj = {
          itemName: itemName,
          unitName: matchedUnitName,
          batches: {},
        };
        itemMap[lookupKey] = itemObj;

        let batchesProcessed = false;

        if (item.batches && item.batches.length > 0) {
          item.batches.forEach((b: any) => {
            const batchName = b.batchName || "Default";

            if (!itemObj.batches[batchName]) {
              itemObj.batches[batchName] = {
                batchName: batchName,
                opening: { qty: 0, rate: 0, value: 0 },
                inward: { qty: 0, rate: 0, value: 0 },
                outward: { qty: 0, rate: 0, value: 0 },
                closing: { qty: 0, rate: 0, value: 0 },
              };
            }

            const batch = itemObj.batches[batchName];

            if (b.mode === "purchase") {
              // Store imported purchase batch data so we can backfill if purchase_history is missing it
              batch.importedInward = {
                qty: Number(b.batchQuantity || 0),
                value: Number(b.openingValue || (Number(b.batchQuantity || 0) * Number(b.openingRate || 0))),
                rate: Number(b.openingRate || 0),
              };
            } else if (!b.mode || b.mode === "opening") {
              batch.opening.qty += Number(b.batchQuantity || 0);
              batch.opening.value += Number(b.batchQuantity || 0) * Number(b.openingRate || 0);
              batch.opening.rate = batch.opening.qty !== 0 ? batch.opening.value / batch.opening.qty : 0;
              batchesProcessed = true;
            }
          });
        }

        // ✅ Handle Case: Item has Opening Balance but NO Batches (Non-Batched Item)
        // If no batches were processed (or explicitly empty), but item has master opening balance
        if (!batchesProcessed && (Number(item.openingBalance) > 0 || Number(item.quantity) > 0)) {
          const batchName = "Default";
          if (!itemObj.batches[batchName]) {
            itemObj.batches[batchName] = {
              batchName: batchName,
              opening: { qty: 0, rate: 0, value: 0 },
              inward: { qty: 0, rate: 0, value: 0 },
              outward: { qty: 0, rate: 0, value: 0 },
              closing: { qty: 0, rate: 0, value: 0 },
            };
          }

          const batch = itemObj.batches[batchName];
          const opQty = Number(item.openingBalance || item.quantity || 0);
          const opRate = Number(item.openingRate || item.rate || 0); // Check field names from API

          batch.opening.qty += opQty;
          batch.opening.value += opQty * opRate;
          batch.opening.rate = opRate;
        }
      });

      // 2️⃣ PURCHASES (INWARD)
      purchaseList.forEach((p: any) => {
        const lookupKey = p.itemName ? p.itemName.toLowerCase().trim() : "";
        const item = itemMap[lookupKey];
        if (!item) return;

        const batchName = p.batchNumber || "Default";

        const batch =
          item.batches[batchName] ??
          (item.batches[batchName] = {
            batchName: batchName,
            opening: { qty: 0, rate: 0, value: 0 },
            inward: { qty: 0, rate: 0, value: 0 },
            outward: { qty: 0, rate: 0, value: 0 },
            closing: { qty: 0, rate: 0, value: 0 },
          });

        batch.inward.qty += Number(p.purchaseQuantity || 0);
        batch.inward.value +=
          Number(p.purchaseQuantity || 0) * Number(p.rate || 0);
        batch.inward.rate =
          batch.inward.qty > 0 ? batch.inward.value / batch.inward.qty : 0;
      });

      // 3️⃣ SALES (OUTWARD)
      salesList.forEach((s: any) => {
        const lookupKey = s.itemName ? s.itemName.toLowerCase().trim() : "";
        const item = itemMap[lookupKey];
        if (!item) return;

        const batchName = s.batchNumber || "Default";
        // If sales has a batch that wasn't in opening or purchases, we should probably create it or ignore it safely
        // Usually sales must happen from existing batch, but data might be inconsistent
        let batch = item.batches[batchName];

        if (!batch) {
          // Create if missing (e.g. direct negative stock sale without purchase, though typical logic prevents this)
          batch = item.batches[batchName] = {
            batchName: batchName,
            opening: { qty: 0, rate: 0, value: 0 },
            inward: { qty: 0, rate: 0, value: 0 },
            outward: { qty: 0, rate: 0, value: 0 },
            closing: { qty: 0, rate: 0, value: 0 },
          };
        }

        const qty = Math.abs(Number(s.qtyChange || 0));
        batch.outward.qty += qty;
        batch.outward.value += qty * Number(s.rate || 0);
        batch.outward.rate =
          batch.outward.qty > 0 ? batch.outward.value / batch.outward.qty : 0;
      });

      // 3.5️⃣ BACKFILL IMPORTED PURCHASES (INWARD) IF NOT PRESENT IN PURCHASE HISTORY
      Object.values(itemMap).forEach((item: any) => {
        Object.values(item.batches).forEach((b: any) => {
          if (b.importedInward && b.inward.qty === 0) {
            b.inward.qty = b.importedInward.qty;
            b.inward.value = b.importedInward.value;
            b.inward.rate = b.importedInward.rate;
          }
        });
      });

      // 4️⃣ CLOSING (TALLY LOGIC) – FIXED (FORWARD CALCULATION ONLY)
      Object.values(itemMap).forEach((item: any) => {
        Object.values(item.batches).forEach((b: any) => {
          // b.opening.qty and b.opening.value are already populated with the real opening balance.
          // No back-calculation is needed because the database stores the real opening balance.

          // ✅ Closing is ALWAYS forward calculated: Closing = Opening + Inward - Outward
          b.closing.qty = b.opening.qty + b.inward.qty - b.outward.qty;

          const totalInQty = b.opening.qty + b.inward.qty;
          const totalInValue = b.opening.value + b.inward.value;

          if (totalInQty > 0) {
            b.closing.rate = totalInValue / totalInQty;
          } else {
            b.closing.rate = b.outward.qty > 0 ? b.outward.value / b.outward.qty : 0;
          }
          b.closing.value = b.closing.qty * b.closing.rate;

          // 🔹 Safety (precision)
          if (Math.abs(b.opening.qty) < 0.001) b.opening.qty = 0;
          if (Math.abs(b.opening.value) < 0.01) b.opening.value = 0;
          if (Math.abs(b.closing.qty) < 0.001) b.closing.qty = 0;
          if (Math.abs(b.closing.value) < 0.01) b.closing.value = 0;
        });
      });

      // 5️⃣ FINAL ARRAY
      const finalData = Object.values(itemMap).map((item: any) => ({
        ...item,
        batches: Object.values(item.batches),
      }));

      setData(finalData);
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

  // Group data by item name for Purchase, Sales, Closing views
  // For All view, group by GST rate
  const groupedData = useMemo(() => {
    if (reportView === "Opening") return data;

    if (reportView === "All") {
      // Data is already grouped by item with batches from loadAllData
      return data;
    }

    // For Purchase, Sales, Closing views
    const groups: Record<string, any[]> = {};

    data.forEach((item) => {
      const key = item.itemName || item.name || "";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });

    return Object.entries(groups).map(([itemName, transactions]) => {
      let totalQty = 0;
      const firstItem = transactions[0];
      const hsnCode = firstItem.hsnCode || "";
      const unitName = firstItem.unitName || "";

      transactions.forEach((t) => {
        let qty = 0;
        if (reportView === "Closing") {
          qty = Number(t.closingQty || t.qty || 0);
        } else {
          qty =
            typeof t.qty === "string"
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

  // Helper to format currency
  const formatCurrency = (value: number) => {
    if (!value && value !== 0) return "-";
    return value.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // TABLE COLUMNS
  const columns = useMemo(() => {
    if (reportView === "All") {
      // Not used for All view - we render custom table
      return [];
    }

    if (reportView === "Purchase") {
      return [
        { header: "S.No", accessor: "sno", align: "center" as const },
        { header: "Item", accessor: "itemName", align: "center" as const },
        { header: "HSN", accessor: "hsnCode", align: "center" as const },
        { header: "Batch", accessor: "batchNumber", align: "center" as const },
        { header: "Qty ", accessor: "qty", align: "right" as const, render: (r: any) => `${r.qty}`, },
        { header: "Rate", accessor: "rate", align: "right" as const, render: (r: any) => formatCurrency(Number(r.rate || 0)), },
        { header: "Value", accessor: "value", align: "right" as const, render: (r: any) => formatCurrency(Number(r.qty || 0) * Number(r.rate || 0)), },
        { header: "Date", accessor: "date", align: "center" as const, render: (r: any) => formatDate(r.date), },
      ];
    }

    if (reportView === "Sales") {
      return [
        { header: "S.No", accessor: "sno", align: "center" as const },
        { header: "Item", accessor: "itemName", align: "center" as const },
        { header: "HSN", accessor: "hsnCode", align: "center" as const },
        { header: "Batch", accessor: "batchNumber", align: "center" as const },
        { header: "Qty", accessor: "qty", align: "right" as const, render: (r: any) => `${r.qty}`, },
        { header: "Rate", accessor: "rate", align: "right" as const, render: (r: any) => formatCurrency(Number(r.rate || 0)), },
        { header: "Value", accessor: "value", align: "right" as const, render: (r: any) => formatCurrency(Number(r.qty || 0) * Number(r.rate || 0)), },
        { header: "Sale Date", accessor: "date", align: "center" as const, render: (r: any) => formatDate(r.date), },
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
    // console.log("handle", ledger);
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
        `${import.meta.env.VITE_API_URL
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
                  Only Account
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
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className={theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200"}>
                        <th className="border p-2 text-left">Stock Item</th>
                        <th className="border p-2 text-center">Unit</th>
                        <th className="border p-2 text-center">HSN</th>
                        <th className="border p-2 text-center">GST</th>
                        <th className="border p-2 text-center">Tax Type</th>
                        <th className="border p-2 text-right">Qty</th>
                        <th className="border p-2 text-right">Rate</th>
                        <th className="border p-2 text-right">Value</th>
                      </tr>
                    </thead>

                    <tbody>
                      {data.map((item: any, idx: number) => {
                        const isExpanded = expandedItems.has(item.itemName);
                        const batches = item.batches || [];

                        const totalQty = batches.reduce((sum: number, b: any) => sum + Number(b.opening?.qty || 0), 0);
                        const totalValue = batches.reduce((sum: number, b: any) => sum + Number(b.opening?.value || 0), 0);
                        const avgRate = totalQty !== 0 ? totalValue / totalQty : 0;

                        return (
                          <React.Fragment key={idx}>
                            {/* ITEM ROW */}
                            <tr
                              className={`font-semibold ${batches.length > 0 ? "cursor-pointer" : "cursor-default"} ${theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-50"
                                }`}
                              onClick={() => batches.length > 0 && toggleItem(item.itemName)}
                            >
                              <td className="border p-2">
                                {batches.length > 0 && (isExpanded ? "▼ " : "▶ ")}{item.itemName}
                              </td>
                              <td className="border p-2 text-center">{item.unitName}</td>
                              <td className="border p-2 text-center">{item.hsnCode}</td>
                              <td className="border p-2 text-center">{item.gstRate}%</td>
                              <td className="border p-2 text-center">{item.taxType}</td>
                              <td className="border p-2 text-right">{totalQty}</td>
                              <td className="border p-2 text-right">{formatCurrency(avgRate)}</td>
                              <td className="border p-2 text-right">{formatCurrency(totalValue)}</td>
                            </tr>

                            {/* BATCH ROWS */}
                            {isExpanded &&
                              batches.map((b: any, bIdx: number) => (
                                <tr key={bIdx} className="bg-white hover:bg-yellow-50">
                                  <td className="border pl-8 italic">{b?.batchName || "-"}</td>
                                  <td className="border"></td>
                                  <td className="border"></td>
                                  <td className="border"></td>
                                  <td className="border"></td>
                                  <td className="border p-2 text-right">{b?.opening?.qty || 0}</td>
                                  <td className="border p-2 text-right">
                                    {formatCurrency(b?.opening?.rate || 0)}
                                  </td>
                                  <td className="border p-2 text-right">
                                    {formatCurrency(b?.opening?.value || 0)}
                                  </td>
                                </tr>
                              ))}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : reportView === "All" ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr
                        className={
                          theme === "dark"
                            ? "bg-gray-700 text-white"
                            : "bg-gray-200 text-black"
                        }
                      >
                        <th
                          rowSpan={2}
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-2 text-left font-semibold`}
                          style={{ minWidth: "200px" }}
                        >
                          Particulars
                        </th>
                        <th
                          colSpan={3}
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center font-semibold`}
                        >
                          Opening Balance
                        </th>
                        <th
                          colSpan={3}
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center font-semibold`}
                        >
                          Inwards
                        </th>
                        <th
                          colSpan={3}
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center font-semibold`}
                        >
                          Outwards
                        </th>
                        <th
                          colSpan={3}
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center font-semibold`}
                        >
                          Closing Balance
                        </th>
                      </tr>
                      {/* Sub Header Row */}
                      <tr
                        className={
                          theme === "dark"
                            ? "bg-gray-700 text-white"
                            : "bg-gray-200 text-black"
                        }
                      >
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Quantity
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Rate
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Value
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Quantity
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Rate
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Value
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Quantity
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Rate
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Value
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Quantity
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Rate
                        </th>
                        <th
                          className={`border ${theme === "dark"
                            ? "border-gray-500"
                            : "border-gray-400"
                            } p-1 text-center`}
                        >
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((item: any, idx: number) => {
                        const isExpanded = expandedItems.has(item.itemName);

                        // ✅ CALCULATE TOTALS FROM BATCHES
                        // const totals = item.batches.reduce(
                        //   (acc: any, b: any) => {
                        //     acc.openingQty += b.opening.qty;
                        //     acc.openingValue += b.opening.value;

                        //     acc.inwardQty += b.inward.qty;
                        //     acc.inwardValue += b.inward.value;

                        //     acc.outwardQty += b.outward.qty;
                        //     acc.outwardValue += b.outward.value;

                        //     acc.closingQty += b.closing.qty;
                        //     acc.closingValue += b.closing.value;
                        //     return acc;
                        //   },
                        //   {
                        //     openingQty: 0,
                        //     openingValue: 0,
                        //     inwardQty: 0,
                        //     inwardValue: 0,
                        //     outwardQty: 0,
                        //     outwardValue: 0,
                        //     closingQty: 0,
                        //     closingValue: 0,
                        //   }
                        // );

                        const batches = Array.isArray(item.batches)
                          ? item.batches
                          : [];

                        const totals = batches.reduce(
                          (acc: any, b: any) => {
                            acc.openingQty += b.opening?.qty || 0;
                            acc.openingValue += b.opening?.value || 0;
                            acc.inwardQty += b.inward?.qty || 0;
                            acc.inwardValue += b.inward?.value || 0;
                            acc.outwardQty += b.outward?.qty || 0;
                            acc.outwardValue += b.outward?.value || 0;
                            acc.closingQty += b.closing?.qty || 0;
                            acc.closingValue += b.closing?.value || 0;
                            return acc;
                          },
                          {
                            openingQty: 0,
                            openingValue: 0,
                            inwardQty: 0,
                            inwardValue: 0,
                            outwardQty: 0,
                            outwardValue: 0,
                            closingQty: 0,
                            closingValue: 0,
                          }
                        );

                        const closingRate =
                          totals.closingQty !== 0
                            ? Math.abs(totals.closingValue / totals.closingQty)
                            : 0;

                        const openingRate =
                          totals.openingQty > 0
                            ? totals.openingValue / totals.openingQty
                            : 0;

                        const inwardRate =
                          totals.inwardQty > 0
                            ? totals.inwardValue / totals.inwardQty
                            : 0;

                        const outwardRate =
                          totals.outwardQty > 0
                            ? totals.outwardValue / totals.outwardQty
                            : 0;

                        return (
                          <React.Fragment key={idx}>
                            {/* ITEM ROW */}
                            <tr
                              className={`cursor-pointer font-semibold ${theme === "dark"
                                ? "bg-gray-800 text-white hover:bg-gray-700"
                                : "bg-gray-50 hover:bg-gray-100"
                                }`}
                              onClick={() => {
                                if (batches.length === 1 && batches[0]?.batchName === "Default") {
                                  navigate(
                                    `/app/reports/item-monthly-summary?item=${item.itemName}&batch=Default`
                                  );
                                } else {
                                  toggleItem(item.itemName);
                                }
                              }}
                            >
                              <td className="border p-2">
                                <div className="flex items-center gap-2">
                                  {/* Hide Chevron if Single Default Batch (Direct Navigation) */
                                    (batches.length === 1 && batches[0]?.batchName === "Default") ? null :
                                      isExpanded ? (
                                        <ChevronDown size={16} />
                                      ) : (
                                        <ChevronRight size={16} />
                                      )}
                                  {item.itemName}
                                </div>
                              </td>

                              <td className="border p-2 text-right align-middle">
                                {totals.openingQty ? `${totals.openingQty} ${item.unitName}`.trim() : ""}
                              </td>
                              <td className="border p-2 text-right align-middle">
                                {formatCurrency(openingRate)}
                              </td>
                              <td className="border p-2 text-right align-middle">
                                {formatCurrency(totals.openingValue)}
                              </td>

                              <td className="border p-2 text-right align-middle">
                                {totals.inwardQty ? `${totals.inwardQty} ${item.unitName}`.trim() : ""}
                              </td>
                              <td className="border p-2 text-right align-middle">
                                {formatCurrency(inwardRate)}
                              </td>
                              <td className="border p-2 text-right align-middle">
                                {formatCurrency(totals.inwardValue)}
                              </td>

                              <td className="border p-2 text-right align-middle">
                                {totals.outwardQty ? `${totals.outwardQty} ${item.unitName}`.trim() : ""}
                              </td>
                              <td className="border p-2 text-right align-middle">
                                {formatCurrency(outwardRate)}
                              </td>
                              <td className="border p-2 text-right align-middle">
                                {formatCurrency(totals.outwardValue)}
                              </td>

                              <td className="border p-2 text-right align-middle">
                                {totals.closingQty ? `${totals.closingQty} ${item.unitName}`.trim() : ""}
                              </td>
                              <td className="border p-2 text-right align-middle">
                                {formatCurrency(closingRate)}
                              </td>
                              <td className="border p-2 text-right align-middle">
                                {formatCurrency(totals.closingValue)}
                              </td>
                            </tr>

                            {/* 🔽 BATCH ROWS - Hide if only one batch and it's Default */}
                            {isExpanded && batches.length > 0 && (batches.length > 1 || (batches[0]?.batchName !== "Default")) &&
                              batches.map((b: any, bIdx: number) => {
                                // Optional: Hide completely empty Default batches if desired, 
                                // but usually we want to see them if they have data.
                                // if (b.batchName === "Default" && b.opening.qty === 0 && b.inward.qty === 0 && b.outward.qty === 0 && b.closing.qty === 0) return null;

                                return (
                                  <tr
                                    key={bIdx}
                                    className={`cursor-pointer ${theme === "dark"
                                      ? "bg-gray-900"
                                      : "bg-white"
                                      } hover:bg-yellow-100`}
                                    onClick={() =>
                                      navigate(
                                        `/app/reports/item-monthly-summary?item=${item.itemName}&batch=${b.batchName}`
                                      )
                                    }
                                  >
                                    <td className="border pl-8 italic">
                                      {b.batchName}
                                    </td>

                                    <td className="border p-2 text-right align-middle">
                                      {b.opening.qty ? `${b.opening.qty} ${item.unitName}`.trim() : ""}
                                    </td>
                                    <td className="border p-2 text-right align-middle">
                                      {formatCurrency(b.opening.rate)}
                                    </td>
                                    <td className="border p-2 text-right align-middle">
                                      {formatCurrency(b.opening.value)}
                                    </td>

                                    <td className="border p-2 text-right align-middle">
                                      {b.inward.qty ? `${b.inward.qty} ${item.unitName}`.trim() : ""}
                                    </td>
                                    <td className="border p-2 text-right align-middle">
                                      {b.inward.rate
                                        ? formatCurrency(b.inward.rate)
                                        : ""}
                                    </td>
                                    <td className="border p-2 text-right align-middle">
                                      {b.inward.value
                                        ? formatCurrency(b.inward.value)
                                        : ""}
                                    </td>

                                    <td className="border p-2 text-right align-middle">
                                      {b.outward.qty ? `${b.outward.qty} ${item.unitName}`.trim() : ""}
                                    </td>
                                    <td className="border p-2 text-right align-middle">
                                      {b.outward.rate
                                        ? formatCurrency(b.outward.rate)
                                        : ""}
                                    </td>
                                    <td className="border p-2 text-right align-middle">
                                      {b.outward.value
                                        ? formatCurrency(b.outward.value)
                                        : ""}
                                    </td>

                                    <td className="border p-2 text-right align-middle">
                                      {b.closing.qty ? `${b.closing.qty} ${item.unitName}`.trim() : ""}
                                    </td>
                                    <td className="border p-2 text-right align-middle">
                                      {formatCurrency(b.closing.rate)}
                                    </td>
                                    <td className="border p-2 text-right align-middle">
                                      {formatCurrency(b.closing.value)}
                                    </td>
                                  </tr>
                                )
                              })}
                          </React.Fragment>
                        );
                      })}

                      {/* ✅ GRAND TOTAL */}
                      {(() => {
                        // const grand = data.reduce(
                        //   (acc: any, item: any) => {
                        //     item.batches.forEach((b: any) => {
                        //       acc.opening += b.opening.value;
                        //       acc.inward += b.inward.value;
                        //       acc.outward += b.outward.value;
                        //       acc.closing += b.closing.value;
                        //     });
                        //     return acc;
                        //   },
                        //   { opening: 0, inward: 0, outward: 0, closing: 0 }
                        // );
                        const grand = data.reduce(
                          (acc: any, item: any) => {
                            const batches = Array.isArray(item.batches)
                              ? item.batches
                              : [];
                            batches.forEach((b: any) => {
                              acc.openingQty += b.opening?.qty || 0;
                              acc.openingValue += b.opening?.value || 0;

                              acc.inwardQty += b.inward?.qty || 0;
                              acc.inwardValue += b.inward?.value || 0;

                              acc.outwardQty += b.outward?.qty || 0;
                              acc.outwardValue += b.outward?.value || 0;

                              acc.closingQty += b.closing?.qty || 0;
                              acc.closingValue += b.closing?.value || 0;
                            });
                            return acc;
                          },
                          {
                            openingQty: 0,
                            openingValue: 0,
                            inwardQty: 0,
                            inwardValue: 0,
                            outwardQty: 0,
                            outwardValue: 0,
                            closingQty: 0,
                            closingValue: 0,
                          }
                        );

                        // Calculate average rates
                        const safeRate = (val: number, qty: number) =>
                          qty !== 0 ? val / qty : 0;

                        return (
                          <tr className="font-bold bg-gray-200">
                            <td className="border p-2">Grand Total</td>

                            {/* Opening */}
                            <td className="border p-2 text-right align-middle">
                              {grand.openingQty || ""}
                            </td>
                            <td className="border p-2 text-right align-middle">
                              {/* Rate */}
                            </td>
                            <td className="border p-2 text-right align-middle">
                              {formatCurrency(grand.openingValue)}
                            </td>

                            {/* Inward */}
                            <td className="border p-2 text-right align-middle">
                              {grand.inwardQty || ""}
                            </td>
                            <td className="border p-2 text-right align-middle">
                              {/* Rate */}
                            </td>
                            <td className="border p-2 text-right align-middle">
                              {formatCurrency(grand.inwardValue)}
                            </td>

                            {/* Outward */}
                            <td className="border p-2 text-right align-middle">
                              {grand.outwardQty || ""}
                            </td>
                            <td className="border p-2 text-right align-middle">
                              {/* Rate */}
                            </td>
                            <td className="border p-2 text-right align-middle">
                              {formatCurrency(grand.outwardValue)}
                            </td>

                            {/* Closing */}
                            <td className="border p-2 text-right align-middle">
                              {grand.closingQty || ""}
                            </td>
                            <td className="border p-2 text-right align-middle">
                              {/* Rate */}
                            </td>
                            <td className="border p-2 text-right align-middle">
                              {formatCurrency(grand.closingValue)}
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
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
                            className={`p-2 border ${theme === "dark"
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
                      {groupedData.map((group: any, idx: number) => {
                        const isExpanded = expandedItems.has(group.itemName);
                        return (
                          <React.Fragment key={idx}>
                            {/* Group Header Row */}
                            <tr
                              className={`cursor-pointer ${theme === "dark"
                                ? "hover:bg-gray-600 text-white"
                                : "hover:bg-gray-100 text-black"
                                } ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                                }`}
                              onClick={() => toggleItem(group.itemName)}
                            >
                              <td
                                className={`p-2 border ${theme === "dark"
                                  ? "border-gray-500"
                                  : "border-gray-400"
                                  } text-center`}
                              >
                                -
                              </td>
                              <td
                                className={`p-2 border ${theme === "dark"
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
                              {reportView === "Closing" && (
                                <td
                                  className={`p-2 border ${theme === "dark"
                                    ? "border-gray-500"
                                    : "border-gray-400"
                                    } text-center`}
                                >
                                  {group.unitName || "-"}
                                </td>
                              )}
                              <td
                                className={`p-2 border ${theme === "dark"
                                  ? "border-gray-500"
                                  : "border-gray-400"
                                  } text-center`}
                              >
                                {group.hsnCode || "-"}
                              </td>
                              {/* Batch placeholder */}
                              <td
                                className={`p-2 border ${theme === "dark"
                                  ? "border-gray-500"
                                  : "border-gray-400"
                                  } text-center`}
                              >
                                -
                              </td>
                              {/* Qty */}
                              <td
                                className={`p-2 border ${theme === "dark"
                                  ? "border-gray-500"
                                  : "border-gray-400"
                                  } text-center font-semibold`}
                              >
                                {group.totalQty}
                              </td>
                              {/* Rate placeholder */}
                              {reportView !== "Closing" && (
                                <td
                                  className={`p-2 border ${theme === "dark"
                                    ? "border-gray-500"
                                    : "border-gray-400"
                                    } text-center`}
                                >
                                  -
                                </td>
                              )}
                              {/* Value placeholder */}
                              {reportView !== "Closing" && (
                                <td
                                  className={`p-2 border ${theme === "dark"
                                    ? "border-gray-500"
                                    : "border-gray-400"
                                    } text-center`}
                                >
                                  -
                                </td>
                              )}
                              {/* Date placeholder */}
                              {reportView !== "Closing" && (
                                <td
                                  className={`p-2 border ${theme === "dark"
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
                                    className={`${theme === "dark"
                                      ? "bg-gray-900 text-white"
                                      : "bg-white text-black"
                                      }`}
                                  >
                                    {reportView === "Closing" ? (
                                      <>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center`}
                                        >
                                          {tIdx + 1}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center pl-8`}
                                        >
                                          {transaction.itemName}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center`}
                                        >
                                          {transaction.unitName || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center`}
                                        >
                                          {transaction.hsnCode || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center`}
                                        >
                                          {transaction.batchNumber || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
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
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center`}
                                        >
                                          {tIdx + 1}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center pl-8`}
                                        >
                                          {transaction.itemName}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center`}
                                        >
                                          {transaction.hsnCode || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center`}
                                        >
                                          {transaction.batchNumber || "-"}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-center whitespace-nowrap`}
                                        >
                                          {Math.abs(
                                            Number(transaction.qty) || 0
                                          )}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-right font-mono`}
                                        >
                                          {formatCurrency(Number(transaction.rate || 0))}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
                                            ? "border-gray-500"
                                            : "border-gray-400"
                                            } text-right font-mono`}
                                        >
                                          {formatCurrency((Number(transaction.qty) || 0) * (Number(transaction.rate) || 0))}
                                        </td>
                                        <td
                                          className={`p-2 border ${theme === "dark"
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

