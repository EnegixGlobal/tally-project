import { Filter, X } from "lucide-react";
import { useEffect, useState, Fragment, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { allSystemGroups as baseGroups } from "../../../constants/ledgerGroups";


const SalesRepostDetails = () => {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();

  const [sales, setSales] = useState<any[]>([]);
  const [showDetail, setShowDetail] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [groupedSales, setGroupedSales] = useState<
    {
      groupId: number;
      groupName: string;
      ledgers: {
        ledgerId: number;
        ledgerName: string;
        sales: any[];
      }[];
    }[]
  >([]);

  // Date filter states
  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
  });

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  // 🔹 current year (adjust later for FY logic)
  const year = new Date().getFullYear();

  // Fetch sales data from backend
  useEffect(() => {
    if (!month || !companyId || !ownerType || !ownerId) return;

    setLoading(true);

    // Build URL with date filters if provided
    let url = `${import.meta.env.VITE_API_URL
      }/api/sales-report/month-wise?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&month=${month}&year=${year}`;

    // Add date filters if provided (these will override month/year on backend)
    if (filters.fromDate && filters.toDate) {
      url += `&fromDate=${filters.fromDate}&toDate=${filters.toDate}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        let data: any[] = [];

        // ✅ normalize backend response
        if (res?.success && Array.isArray(res.data)) {
          data = res.data;
        } else if (Array.isArray(res)) {
          data = res;
        }

        // If date filters are not applied, still filter by month on frontend as fallback
        if (!filters.fromDate || !filters.toDate) {
          const filteredData = data.filter((sale) => {
            if (!sale.date) return false;

            const d = new Date(sale.date);
            const saleMonth = d.toLocaleString("en-US", {
              month: "long",
            });

            return (
              saleMonth.toLowerCase() === month.toLowerCase() &&
              d.getFullYear() === year
            );
          });
          setSales(filteredData);
        } else {
          setSales(data);
        }
      })
      .catch((err) => {
        console.error("Month-wise sales fetch error:", err);
        setSales([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [month, companyId, ownerType, ownerId, year, filters.fromDate, filters.toDate]);

  // get ledger and group data
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);

  // Close filter panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterPanelRef.current &&
        !filterPanelRef.current.contains(event.target as Node)
      ) {
        setShowFilterPanel(false);
      }
    };

    if (showFilterPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilterPanel]);

  const handleFilterChange = (name: string, value: string) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const resetFilters = () => {
    setFilters({
      fromDate: "",
      toDate: "",
    });
  };

  const hasActiveFilters = () => {
    return filters.fromDate !== "" || filters.toDate !== "";
  };

  // group name

  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyId = localStorage.getItem("company_id");
        const ownerType = localStorage.getItem("supplier");
        const ownerId =
          ownerType === "employee"
            ? localStorage.getItem("employee_id")
            : localStorage.getItem("user_id");

        if (!companyId || !ownerType || !ownerId) {
          console.error("Missing required identifiers for ledger GET");
          setLedgers([]);
          setLedgerGroups([]);
          return;
        }

        // 🔹 Ledgers
        const ledgerRes = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const ledgerData = await ledgerRes.json();
        setLedgers(Array.isArray(ledgerData) ? ledgerData : []);

        // 🔹 Ledger Groups
        const groupRes = await fetch(
          `${import.meta.env.VITE_API_URL
          }/api/ledger-groups?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const groupData = await groupRes.json();
        setLedgerGroups(Array.isArray(groupData) ? groupData : []);
      } catch (err) {
        console.error("Failed to load data", err);
        setLedgers([]);
        setLedgerGroups([]);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!sales.length || !ledgers.length) return;

    const result: any[] = [];
    const allGroups = [...ledgerGroups, ...baseGroups];

    sales.forEach((sale) => {
      const ledger = ledgers.find(
        (l: any) => String(l.id) === String(sale.partyId)
      );
      if (!ledger) return;

      const group = allGroups.find(
        (g: any) => String(g.id) === String(ledger.groupId)
      ) || {
        id: ledger.groupId,
        name: "Unknown Group",
      };

      let groupObj = result.find((g) => g.groupId === group.id);
      if (!groupObj) {
        groupObj = {
          groupId: group.id,
          groupName: group.name,
          ledgers: [],
        };
        result.push(groupObj);
      }

      let ledgerObj = groupObj.ledgers.find(
        (l: any) => l.ledgerId === ledger.id
      );
      if (!ledgerObj) {
        ledgerObj = {
          ledgerId: ledger.id,
          ledgerName: ledger.name,
          sales: [],
        };
        groupObj.ledgers.push(ledgerObj);
      }

      ledgerObj.sales.push(sale);
    });

    setGroupedSales(result);
  }, [sales, ledgers, ledgerGroups]);

  const getPartyName = (partyId: number | string) => {
    const ledger = ledgers.find((l: any) => String(l.id) === String(partyId));
    return ledger?.name || "-";
  };

  const getGroupTotal = (group: any) => {
    return group.ledgers.reduce((groupSum: number, ledger: any) => {
      const ledgerTotal = ledger.sales.reduce(
        (sum: number, sale: any) => sum + Number(sale.total || 0),
        0
      );
      return groupSum + ledgerTotal;
    }, 0);
  };

  const getGrandTotal = () => {
    return groupedSales.reduce((sum: number, group: any) => {
      return sum + getGroupTotal(group);
    }, 0);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Build Tally-style 3-level summary:
  //   Top Group  (e.g. "Sundry Debtors")
  //     Sub Group  (e.g. "B2B Customer")   ← only if ledger's group is NOT the top group
  //       Ledger
  //
  // Order: 1=Party top-group (Debit), 2=Sales Accounts (Credit),
  //        3=Duties & Taxes (Credit), 4=Discount (Debit)
  // ──────────────────────────────────────────────────────────────────────────
  const buildTallySummary = () => {
    const allGroups = [...ledgerGroups, ...baseGroups];

    // Resolve a group by id (searches both DB groups and system groups)
    const findGroup = (id: number | string | null | undefined) => {
      if (id == null) return null;
      return allGroups.find((g: any) => String(g.id) === String(id)) || null;
    };

    // For a ledger, resolve:
    //   topGroupName  – the ultimate ancestor (system group level)
    //   subGroupName  – the ledger's immediate group if it's NOT the top group, else null
    const resolveHierarchy = (ledgerId: number | string) => {
      const l = ledgers.find((x: any) => String(x.id) === String(ledgerId));
      if (!l) return { topGroupName: "Sundry Debtors", subGroupName: null as string | null, ledgerName: String(ledgerId) };

      const immediateGroup = findGroup(l.groupId);
      if (!immediateGroup) {
        return { topGroupName: "Unknown Group", subGroupName: null as string | null, ledgerName: l.name };
      }

      // Walk up to find the topmost group
      let topGroup = immediateGroup;
      while (topGroup.parent != null) {
        const parent = findGroup(topGroup.parent);
        if (!parent) break;
        topGroup = parent;
      }

      const isDirectlyUnderTop = String(immediateGroup.id) === String(topGroup.id);

      return {
        topGroupName: topGroup.name,
        subGroupName: isDirectlyUnderTop ? null : immediateGroup.name,
        ledgerName:   l.name,
      };
    };

    // Structure: topGroupName → { order, subGroups: Map<subGroupKey, { ledgers: Map<name,{debit,credit}> }> }
    // subGroupKey: use "__direct__" when no subgroup (ledger directly under top group)
    const DIRECT = "__direct__";
    const topMap = new Map<string, {
      order: number;
      subGroups: Map<string, Map<string, { debit: number; credit: number }>>;
    }>();

    const addEntry = (
      topGroupName: string,
      order: number,
      subGroupName: string | null,
      ledgerName: string,
      debit: number,
      credit: number
    ) => {
      if (!topMap.has(topGroupName)) {
        topMap.set(topGroupName, { order, subGroups: new Map() });
      }
      const top = topMap.get(topGroupName)!;
      const subKey = subGroupName ?? DIRECT;
      if (!top.subGroups.has(subKey)) {
        top.subGroups.set(subKey, new Map());
      }
      const ledgerMap = top.subGroups.get(subKey)!;
      const existing = ledgerMap.get(ledgerName) || { debit: 0, credit: 0 };
      existing.debit  += debit;
      existing.credit += credit;
      ledgerMap.set(ledgerName, existing);
    };

    sales.forEach((sale) => {
      const total    = Number(sale.total        || 0);
      const subtotal = Number(sale.subtotal     || 0);
      const cgst     = Number(sale.cgstTotal    || 0);
      const sgst     = Number(sale.sgstTotal    || 0);
      const igst     = Number(sale.igstTotal    || 0);
      const discount = Number(sale.discountTotal|| 0);

      // ── 1. Party → Debit side
      const { topGroupName, subGroupName, ledgerName: partyName } = resolveHierarchy(sale.partyId);
      addEntry(topGroupName, 1, subGroupName, partyName, total, 0);

      // ── 2. Sales Accounts → Credit side
      const { topGroupName: sTopGroup, subGroupName: sSubGroup, ledgerName: sLedgerName } = resolveHierarchy(sale.salesLedgerId);
      const resolvedSalesTopGroup = sTopGroup === "Unknown Group" ? "Sales Accounts" : sTopGroup;
      const salesLedgerDisplayName = sale.salesLedgerName || sLedgerName;
      const salesAmt = subtotal > 0 ? subtotal : total - cgst - sgst - igst - discount;
      addEntry(resolvedSalesTopGroup, 2, sSubGroup, salesLedgerDisplayName, 0, salesAmt > 0 ? salesAmt : 0);

      // ── 3. Duties & Taxes → Credit side (always flat – no subgroup)
      if (cgst > 0) addEntry("Duties & Taxes", 3, null, sale.cgstLedgerName || "CGST", 0, cgst);
      if (sgst > 0) addEntry("Duties & Taxes", 3, null, sale.sgstLedgerName || "SGST", 0, sgst);
      if (igst > 0) addEntry("Duties & Taxes", 3, null, sale.igstLedgerName || "IGST", 0, igst);

      // ── 4. Discount → Debit side
      if (discount > 0) addEntry("Discount", 4, null, sale.discountLedgerName || "Discount", discount, 0);
    });

    // Convert to sorted output array
    return Array.from(topMap.entries())
      .sort((a, b) => a[1].order - b[1].order)
      .map(([topGroupName, { subGroups }]) => {
        // Build sub-group list; DIRECT entries come first
        const subGroupList = Array.from(subGroups.entries())
          .map(([subKey, ledgerMap]) => {
            const isDirectly = subKey === DIRECT;
            const ledgerList = Array.from(ledgerMap.entries()).map(([name, amounts]) => ({
              name,
              debit:  amounts.debit,
              credit: amounts.credit,
            }));
            const totalDebit  = ledgerList.reduce((s, l) => s + l.debit,  0);
            const totalCredit = ledgerList.reduce((s, l) => s + l.credit, 0);
            return {
              subGroupName: isDirectly ? null : subKey,
              ledgers: ledgerList,
              totalDebit,
              totalCredit,
            };
          });

        const totalDebit  = subGroupList.reduce((s, sg) => s + sg.totalDebit,  0);
        const totalCredit = subGroupList.reduce((s, sg) => s + sg.totalCredit, 0);
        return { topGroupName, subGroupList, totalDebit, totalCredit };
      });
  };

  // Format number: show value if > 0, else "-"
  const fmt = (n: number) =>
    n > 0
      ? n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : "-";

  return (
    <div className="p-4 pt-[56px]">
      <div className="flex items-center justify-between mb-4">
        {/* 🔙 BACK BUTTON */}
        <button
          onClick={() => navigate(-1)}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back
        </button>

        {/* TITLE */}
        <h1 className="text-xl font-bold">Sales Details for {month}</h1>

        {/* 🔘 FILTER BUTTON & RADIO CONTROLS */}
        <div className="flex items-center pt-16 gap-4 text-sm font-medium">
          {/* 🔍 FILTER BUTTON */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${hasActiveFilters()
                ? "bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-100"
                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
            >
              <Filter className="w-4 h-4" />
              Filter
              {hasActiveFilters() && (
                <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {filters.fromDate && filters.toDate ? "1" : "0"}
                </span>
              )}
            </button>

            {/* FILTER PANEL DROPDOWN */}
            {showFilterPanel && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Date Filter</h3>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={filters.fromDate}
                        onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={filters.toDate}
                        onChange={(e) => handleFilterChange("toDate", e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Select a date range to filter sales data. Data will be fetched from the backend based on your selection.
                  </p>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={resetFilters}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Reset Filters
                  </button>
                  <button
                    onClick={() => setShowFilterPanel(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 🔘 RADIO CONTROLS */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="salesView"
                checked={!showDetail}
                onChange={() => setShowDetail(false)}
                className="accent-blue-600"
              />
              Summary
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="salesView"
                checked={showDetail}
                onChange={() => setShowDetail(true)}
                className="accent-blue-600"
              />
              Detail
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Loading sales data...</p>
      ) : sales.length === 0 ? (
        <p className="text-gray-500">
          No sales found {filters.fromDate && filters.toDate ? `for the selected date range` : `for ${month}`}
        </p>
      ) : !showDetail ? (
        (() => {
          const tallySummary = buildTallySummary();
          const grandDebit   = tallySummary.reduce((s, g) => s + g.totalDebit,  0);
          const grandCredit  = tallySummary.reduce((s, g) => s + g.totalCredit, 0);
          return (
            <>
              {/* ================= SUMMARY VIEW (Tally 3-level) ================= */}
              <div className="w-full border border-gray-200 rounded-md overflow-hidden">

                {/* ── Table Header ── */}
                <div className="grid grid-cols-3 px-4 py-2 font-bold bg-gray-100 border-b border-gray-300 text-sm">
                  <div>Particulars</div>
                  <div className="text-right">Debit</div>
                  <div className="text-right">Credit</div>
                </div>

                {/* ── Top Group rows ── */}
                {tallySummary.map((group) => (
                  <div key={group.topGroupName}>

                    {/* Level 1: Top Group Header */}
                    <div className="grid grid-cols-3 px-4 py-1.5 text-sm font-bold bg-gray-50 border-b border-gray-300">
                      <div>{group.topGroupName}</div>
                      <div className="text-right font-mono">{fmt(group.totalDebit)}</div>
                      <div className="text-right font-mono">{fmt(group.totalCredit)}</div>
                    </div>

                    {group.subGroupList.map((sg) => (
                      <div key={sg.subGroupName ?? "__direct__"}>

                        {/* Level 2: Sub Group Header (only if a named sub-group exists) */}
                        {sg.subGroupName && (
                          <div className="grid grid-cols-3 pl-6 pr-4 py-1.5 text-sm font-semibold border-b border-gray-200 bg-white">
                            <div className="text-gray-800">{sg.subGroupName}</div>
                            <div className="text-right font-mono text-gray-800">{fmt(sg.totalDebit)}</div>
                            <div className="text-right font-mono text-gray-800">{fmt(sg.totalCredit)}</div>
                          </div>
                        )}

                        {/* Level 3: Ledger rows */}
                        {sg.ledgers.map((led) => (
                          <div
                            key={led.name}
                            className={`grid grid-cols-3 pr-4 py-1 text-sm border-b border-gray-100 ${sg.subGroupName ? "pl-12" : "pl-8"}`}
                          >
                            <div className="text-gray-600">{led.name}</div>
                            <div className="text-right font-mono text-gray-600">{fmt(led.debit)}</div>
                            <div className="text-right font-mono text-gray-600">{fmt(led.credit)}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}

                {/* ── Grand Total Row ── */}
                <div className="grid grid-cols-3 px-4 py-2 font-bold bg-gray-100 border-t-2 border-gray-400 text-sm">
                  <div>Grand Total</div>
                  <div className="text-right font-mono">{fmt(grandDebit)}</div>
                  <div className="text-right font-mono">{fmt(grandCredit)}</div>
                </div>
              </div>
            </>
          );
        })()
      ) : (
        /* ================= DETAIL VIEW ================= */

        <div className="space-y-8">
          {/* 🔹 TABLE HEADER – ONLY ONCE */}
          <div className="grid grid-cols-6 px-3 py-2 text-xl border-b font-bold opacity-70">
            <div>Date</div>
            <div>Particulars</div>
            <div>Voucher Type</div>
            <div>Voucher No</div>
            <div className="text-right">Debit</div>
            <div className="text-right">Credit</div>
          </div>

          {groupedSales.map((group) => (
            <div key={group.groupId} className="space-y-6">
              {/* 🔹 GROUP / LEDGER HEADING */}
              {group.ledgers.map((ledger: any) => (
                <div key={ledger.ledgerId}>
                  {/* Ledger title */}
                  <div className="font-semibold py-2 px-3">
                    {group.groupName}
                  </div>

                  {/* Entries */}
                  {ledger.sales.map((sale: any, idx: number) => (
                    <Fragment key={sale.id || idx}>
                      <div className="grid grid-cols-6 px-3 py-2 text-sm">
                        <div>
                          {new Date(sale.date).toLocaleDateString("en-IN")}
                        </div>

                        <div>{sale.itemName || ledger.ledgerName}</div>

                        <div>{sale.voucherType || "Sales"}</div>

                        <div className="font-mono">
                          {sale.number || sale.voucherNo || "-"}
                        </div>

                        {/* Debit */}
                        <div className="text-right font-mono">
                          {sale.voucherType === "Purchase"
                            ? `₹${Number(sale.total).toLocaleString("en-IN")}`
                            : ""}
                        </div>

                        {/* Credit */}
                        <div className="text-right font-mono">
                          {sale.voucherType !== "Purchase"
                            ? `₹${Number(sale.total).toLocaleString("en-IN")}`
                            : ""}
                        </div>
                      </div>

                      {/* HR separator */}
                      <div className="h-px bg-gray-300 mx-3 opacity-60" />
                    </Fragment>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SalesRepostDetails;
