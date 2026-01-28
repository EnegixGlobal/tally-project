import React, { useEffect, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Printer, Download } from "lucide-react";

const PurchaseDetail: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  /* ===================== PURCHASE LEDGERS ===================== */
  const [purchaseLedgers, setPurchaseLedgers] = useState<any[]>([]);
  const [purchaseIds, setPurchaseIds] = useState([]);
  const [purchaseTotals, setPurchaseTotals] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchPurchaseLedgers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/group-summary?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const data = await res.json();

        const ledgers = data.ledgers || [];

        const purchases = ledgers
          .filter((l: any) => String(l.group_id) === "-15")
          .map((l: any) => ({
            id: l.id,
            name: l.name,
            opening_balance: l.opening_balance,
            balance_type: l.balance_type,
            group_id: l.id,
          }));

        const ids = purchases.map((p: any) => p.id);

        console.log("Purchase:", purchases);
        console.log("IDs:", ids);

        setPurchaseLedgers(purchases);
        setPurchaseIds(ids);
      } catch (error) {
        console.error("Group Summary Error:", error);
        setPurchaseLedgers([]);
        setPurchaseIds([]);
      }
    };

    fetchPurchaseLedgers();
  }, [companyId, ownerId, ownerType]);

  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        if (purchaseIds.length === 0) return;

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/purchase?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}&ids=${purchaseIds.join(",")}`
        );

        const data = await res.json();

        if (data.success) {
          setPurchaseTotals(data.data);
        }

        console.log("Purchase API Data:", data);

      } catch (error) {
        console.error("Purchase API Error:", error);
      }
    };

    fetchPurchaseData();
  }, [companyId, ownerId, ownerType, purchaseIds]);

  /* ===================== ROW DATA ===================== */
  const getPurchaseAccountRows = () => {
    return purchaseLedgers.map((l: any) => {

      // ✅ TS safe access
      const apiAmount = purchaseTotals[l.id as number];

      const amount = apiAmount ? Number(apiAmount) : 0;

      return {
        name: l.name,
        groupId: Number(l.group_id),

        debit: l.balance_type === "debit" ? amount : "",
        credit: l.balance_type === "credit" ? amount : "",
      };
    });
  };

  /* ===================== ROW CLICK HANDLER ===================== */
  const handleRowClick = (ledgerName: string, groupId: number) => {
    navigate(
      `/app/reports/profit-loss/purchase/alldetails?ledger=${encodeURIComponent(
        ledgerName
      )}&groupId=${groupId}`
    );
  };

  /* ===================== UI ===================== */
  return (
    <div className="pt-[56px] px-4">
      {/* Top Bar */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate(-1)}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">Purchase Account</h1>

        <div className="ml-auto flex gap-2">
          <button className="p-2 rounded-md hover:bg-gray-200">
            <Printer size={18} />
          </button>
          <button className="p-2 rounded-md hover:bg-gray-200">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="w-full border border-gray-300 rounded-md overflow-hidden">
        <div className="bg-gray-100 border-b border-gray-300">
          <div className="py-3 text-center">
            <div className="text-lg font-semibold">Purchase Account</div>
            <div className="text-xs text-gray-500">
              For the year ended {new Date().getFullYear()}
            </div>
          </div>

          <div className="grid grid-cols-3 text-sm font-semibold border-t border-gray-300">
            <div className="px-3 py-2 text-center border-r border-gray-300">
              Particulars
            </div>
            <div className="px-3 py-2 text-center border-r border-gray-300">
              Debit
            </div>
            <div className="px-3 py-2 text-center">Credit</div>
          </div>
        </div>

        {getPurchaseAccountRows().map((row, index) => (
          <div
            key={index}
            onClick={() => handleRowClick(row.name, row.groupId)}
            className="grid grid-cols-3 text-sm border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
          >
            <div className="px-3 py-2 text-center  border-r border-gray-300 text-blue-600">
              {row.name}
            </div>

            <div className="px-3 py-2 text-center font-mono border-r border-gray-300">
              {row.debit !== "" ? row.debit.toLocaleString() : ""}
            </div>

            <div className="px-3 py-2 text-center font-mono">
              {row.credit !== "" ? row.credit.toLocaleString() : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PurchaseDetail;
