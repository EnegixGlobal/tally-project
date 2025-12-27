import { useEffect, useState, Fragment } from "react";
import { useParams, useNavigate } from "react-router-dom";

const PurchseReportDetil = () => {
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
    }/api/purchase-vouchers/?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&month=${month}&year=${year}`;

    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        // backend response: { success, data }
        if (res?.success && Array.isArray(res.data)) {
          setSales(res.data);
        } else if (Array.isArray(res)) {
          // fallback if backend sends array directly
          setSales(res);
        } else {
          setSales([]);
        }
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
        <h1 className="text-xl font-bold">Purchase Details for {month}</h1>

        {/* 🔘 RADIO CONTROLS */}
        <div className="flex items-center gap-6 text-sm font-medium">
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
        /* ================= SUMMARY VIEW ================= */
        <>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Particular</th>
                <th className="border px-3 py-2 text-right">Total</th>
              </tr>
            </thead>

            <tbody>
              {groupedSales.map((group) => (
                <tr key={group.groupId} className="font-semibold">
                  <td className="border px-3 py-2">{group.groupName}</td>
                  <td className="border px-3 py-2 text-right">
                    ₹{getGroupTotal(group).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm border-t pt-3 text-right font-bold">
              Grand Total : ₹{getGrandTotal().toLocaleString()}
            </div>
          </div>
        </>
      ) : (
        /* ================= DETAIL VIEW ================= */
        <div className="space-y-8">
          {groupedSales.map((group) => (
            <div key={group.groupId}>
              {/* 🔹 GROUP NAME */}
              <h2 className="text-lg font-bold mb-2">{group.groupName}</h2>

              <table className="w-full border-collapse text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-left">Date</th>
                    <th className="border px-3 py-2 text-left">Particular</th>
                    <th className="border px-3 py-2 text-left">Voucher Type</th>
                    <th className="border px-3 py-2 text-left">Voucher No</th>
                    <th className="border px-3 py-2 text-right">Debit</th>
                    <th className="border px-3 py-2 text-right">Credit</th>
                  </tr>
                </thead>

                <tbody>
                  {group.ledgers.flatMap((ledger: any) =>
                    ledger.sales.map((sale: any) => (
                      <tr key={sale.id}>
                        <td className="border px-3 py-2">
                          {new Date(sale.date).toLocaleDateString("en-IN")}
                        </td>
                        <td className="border px-3 py-2 font-mono">
                          {getPartyName(sale.partyId)}
                        </td>
                        <td className="border px-3 py-2">Purchase</td>
                        <td className="border px-3 py-2 font-mono">
                          {sale.number}
                        </td>
                        <td className="border px-3 py-2 text-right font-semibold">
                          ₹{Number(sale.total).toLocaleString()}
                        </td>
                        <td className="border px-3 py-2 text-right font-semibold">
                          0
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchseReportDetil;
