import { Filter, X } from "lucide-react";
import { useEffect, useState, Fragment, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PurchseReportDetil = () => {
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

  // Fetch purchase data from backend
  useEffect(() => {
    if (!month || !companyId || !ownerType || !ownerId) return;

    setLoading(true);

    // Build URL with date filters if provided
    let url = `${
      import.meta.env.VITE_API_URL
    }/api/purchase-vouchers/month-wise?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&month=${month}&year=${year}`;

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
        console.error("Month-wise purchase fetch error:", err);
        setSales([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [month, companyId, ownerType, ownerId, year, filters.fromDate, filters.toDate]);

  // get ledger and group data
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);

  // group name
  const baseGroups = [
    { id: -1, name: "Bank Accounts", nature: "Assets" },
    { id: -2, name: "Bank OD A/c", nature: "Assets" },
    { id: -3, name: "Branch/Division", nature: "Assets" },
    { id: -4, name: "Capital Account", nature: "Liabilities" },
    { id: -5, name: "Current Assets", nature: "Assets" },
    { id: -6, name: "Current Liabilities", nature: "Liabilities" },
    { id: -7, name: "Direct Expenses", nature: "Expenses" },
    { id: -8, name: "Direct Income", nature: "Income" },
    { id: -9, name: "Fixed Assets", nature: "Assets" },
    { id: -10, name: "Indirect Expenses", nature: "Expenses" },
    { id: -11, name: "Indirect Income", nature: "Income" },
    { id: -12, name: "Investments", nature: "Assets" },
    { id: -13, name: "Loan(Liability)", nature: "Liabilities" },
    { id: -14, name: "Misc expenses (Assets)", nature: "Assets" },
    { id: -15, name: "Purchase Accounts", nature: "Expenses" },
    { id: -16, name: "Sales Accounts", nature: "Income" },
    { id: -17, name: "Suspense A/C", nature: "Assets" },
    { id: -18, name: "Profit/Loss", nature: "Liabilities" },
  ];

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
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const ledgerData = await ledgerRes.json();
        setLedgers(Array.isArray(ledgerData) ? ledgerData : []);

        // 🔹 Ledger Groups
        const groupRes = await fetch(
          `${
            import.meta.env.VITE_API_URL
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
        <h1 className="text-xl font-bold">Purchase Details for {month}</h1>

        {/* 🔘 FILTER BUTTON & RADIO CONTROLS */}
        <div className="flex items-center pt-16 gap-4 text-sm font-medium">
          {/* 🔍 FILTER BUTTON */}
          <div className="relative" ref={filterPanelRef}>
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                hasActiveFilters()
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
                    Select a date range to filter purchase data. Data will be fetched from the backend based on your selection.
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
        <p className="text-gray-500">Loading purchase data...</p>
      ) : sales.length === 0 ? (
        <p className="text-gray-500">
          No Purchase found {filters.fromDate && filters.toDate ? `for the selected date range` : `for ${month}`}
        </p>
      ) : !showDetail ? (
        <>
          {/* ================= SUMMARY VIEW ================= */}
          <div className="max-full">
            {/* Header */}
            <div className="grid grid-cols-3 px-3 py-2 font-bold border-b">
              <div>Particulars</div>
              <div className="text-right">Debit</div>
              <div className="text-right">Credit</div>
            </div>

            {/* Rows */}
            {groupedSales.map((group) => {
              const total = getGroupTotal(group);

              return (
                <div
                  key={group.groupId}
                  className="grid grid-cols-3 px-3 py-2 text-sm"
                >
                  <div className="font-medium">{group.groupName}</div>

                  {/* Debit (only if negative type – optional future logic) */}
                  <div className="text-right font-mono">
                    {/* keep blank for sales */}
                  </div>

                  {/* Credit */}
                  <div className="text-right font-mono">
                    ₹{total.toLocaleString("en-IN")}
                  </div>
                </div>
              );
            })}

            {/* Divider */}
            <div className="border-t my-2" />

            {/* Grand Total */}
            <div className="grid grid-cols-3 px-3 py-2 font-bold">
              <div>Grand Total</div>
              <div className="text-right"></div>
              <div className="text-right font-mono">
                ₹{getGrandTotal().toLocaleString("en-IN")}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-sm border-t pt-3 text-right font-bold">
                Grand Total : ₹{getGrandTotal().toLocaleString()}
              </div>
            </div>
          </div>
        </>
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

export default PurchseReportDetil;
