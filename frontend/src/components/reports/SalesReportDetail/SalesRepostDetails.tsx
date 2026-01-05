import { useEffect, useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";

const SalesRepostDetails = () => {
  const { month } = useParams<{ month: string }>();
  const navigate = useNavigate();

  const [sales, setSales] = useState<any[]>([]);
  const [showDetail, setShowDetail] = useState(false);
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

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  // 🔹 current year (adjust later for FY logic)
  const year = new Date().getFullYear();

  useEffect(() => {
    if (!month || !companyId || !ownerType || !ownerId) return;

    const url = `${
      import.meta.env.VITE_API_URL
    }/api/sales-report/?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&month=${month}&year=${year}`;

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

        // ✅ STRICT MONTH + YEAR FILTER (MAIN FIX)
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

        // ✅ ONLY SELECTED MONTH DATA SET
        setSales(filteredData);
      })
      .catch((err) => {
        console.error("Month-wise sales fetch error:", err);
        setSales([]);
      });
  }, [month, companyId, ownerType, ownerId, year]);

  // get ledger and group data
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);

  // group name
  const baseGroups = [
    { id: -1, name: "Branch Accounts", nature: "Assets" },
    { id: -2, name: "Branch OD A/c", nature: "Assets" },
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
        <h1 className="text-xl font-bold">Sales Details for {month}</h1>

        {/* 🔘 RADIO CONTROLS */}
        <div className="flex items-center pt-16 gap-6 text-sm font-medium">
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

      {sales.length === 0 ? (
        <p className="text-gray-500">No sales found for {month}</p>
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

export default SalesRepostDetails;
