import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";

const PurchaseAddDetails: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const ledgerName = searchParams.get("ledger");
  const groupId = Number(searchParams.get("groupId"));

  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const MONTHS = [
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
    "January",
    "February",
    "March",
  ];

  /* ===================== STATES ===================== */
  const [purchase, setPurchase] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [parties, setParties] = useState<any[]>([]);

  /* ===================== FETCH PURCHASE ===================== */
  useEffect(() => {
    const fetchPurchaseData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/purchase-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        setPurchase(data.data || []);
      } catch (err) {
        console.error("Purchase fetch error:", err);
      }
    };

    if (companyId && ownerType && ownerId) {
      fetchPurchaseData();
    }
  }, [companyId, ownerType, ownerId]);

  /* ===================== FETCH LEDGERS (PARTIES) ===================== */
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const data = await res.json();

        // ✅ IMPORTANT FIX (LedgerList jaisa)
        setParties(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error("Party fetch error:", err);
      }
    };

    if (companyId && ownerType && ownerId) {
      fetchParties();
    }
  }, [companyId, ownerType, ownerId]);

  /* ===================== PARTY MAP (FAST LOOKUP) ===================== */
  const partyMap = useMemo(() => {
    const map: Record<number, string> = {};
    parties.forEach((p: any) => {
      map[Number(p.id)] = p.name;
    });
    return map;
  }, [parties]);

  const getPartyNameById = (partyId: number | string) =>
    partyMap[Number(partyId)] || "-";

  /* ===================== MONTH WISE DEBIT ===================== */
  const getMonthWiseDebit = () => {
    const totals: Record<string, number> = {};
    MONTHS.forEach((m) => (totals[m] = 0));

    purchase
      .filter((p) => Number(p.purchaseLedgerId) === groupId)
      .forEach((p) => {
        const d = new Date(p.date);
        const monthName = [
          "January",
          "February",
          "March",
          "April",
          "May",
          "June",
          "July",
          "August",
          "September",
          "October",
          "November",
          "December",
        ][d.getMonth()];

        if (totals[monthName] !== undefined) {
          totals[monthName] += Number(p.total || 0);
        }
      });

    return totals;
  };

  const monthWiseDebit = getMonthWiseDebit();

  /* ===================== MONTH FILTER ===================== */
  const monthIndexMap: Record<string, number> = {
    January: 0,
    February: 1,
    March: 2,
    April: 3,
    May: 4,
    June: 5,
    July: 6,
    August: 7,
    September: 8,
    October: 9,
    November: 10,
    December: 11,
  };

  const selectedMonthData = selectedMonth
    ? purchase.filter((p) => {
        const d = new Date(p.date);
        return (
          d.getMonth() === monthIndexMap[selectedMonth] &&
          Number(p.purchaseLedgerId) === groupId
        );
      })
    : [];

  const selectedMonthTotal = selectedMonthData.reduce(
    (sum, r) => sum + Number(r.total || 0),
    0
  );

  /* ===================== UI ===================== */
  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">Purchase Account</h1>

        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="p-2 rounded hover:bg-gray-200"
          >
            <Filter size={18} />
          </button>
          <button className="p-2 rounded hover:bg-gray-200">
            <Printer size={18} />
          </button>
          <button className="p-2 rounded hover:bg-gray-200">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* ================= MONTH SUMMARY ================= */}
      {!selectedMonth && (
        <div>
          <div className="bg-gray-100 border-b text-center py-3">
            <div className="text-lg font-semibold">Purchase Account</div>
            <div className="text-sm text-gray-600">{ledgerName}</div>
          </div>

          <div className="grid grid-cols-3 font-semibold bg-gray-50 border-b">
            <div className="px-3 py-2">Month</div>
            <div className="px-3 py-2 text-center">Debit</div>
            <div className="px-3 py-2 text-center">Credit</div>
          </div>

          {MONTHS.map((month) => (
            <div
              key={month}
              onClick={() => setSelectedMonth(month)}
              className="grid grid-cols-3 border-b cursor-pointer hover:bg-blue-50"
            >
              <div className="px-3 py-2">{month}</div>
              <div className="px-3 py-2 text-center font-mono">
                {monthWiseDebit[month]
                  ? monthWiseDebit[month].toLocaleString()
                  : "0"}
              </div>
              <div className="px-3 py-2 text-center">0</div>
            </div>
          ))}
        </div>
      )}

      {/* ================= MONTH DETAILS ================= */}
      {selectedMonth && (
        <div className="mt-4">
          <div className="flex items-center bg-gray-100 p-3 border-b relative">
            <button
              onClick={() => setSelectedMonth(null)}
              className="text-lg font-semibold"
            >
              ← Back
            </button>

            <div className="absolute left-1/2 -translate-x-1/2 font-semibold">
              Ledger: {ledgerName} | {selectedMonth}
            </div>
          </div>

          <div className="grid grid-cols-6 font-semibold bg-gray-50 border-b">
            <div className="px-3 py-2">Date</div>
            <div className="px-3 py-2">Particular</div>
            <div className="px-3 py-2">Voucher Type</div>
            <div className="px-3 py-2">Voucher No</div>
            <div className="px-3 py-2 text-right">Debit</div>
            <div className="px-3 py-2 text-right">Credit</div>
          </div>

          {selectedMonthData.map((row, i) => (
            <div key={i} className="grid grid-cols-6 border-b text-sm">
              <div className="px-3 py-2">
                {new Date(row.date).toLocaleDateString()}
              </div>
              <div className="px-3 py-2">
                {getPartyNameById(row.partyId)}
              </div>
              <div className="px-3 py-2">Purchase</div>
              <div className="px-3 py-2">{row.number}</div>
              <div className="px-3 py-2 text-right font-mono">
                {Number(row.total).toLocaleString()}
              </div>
              <div className="px-3 py-2 text-right"></div>
            </div>
          ))}

          <div className="grid grid-cols-6 bg-gray-100 font-semibold">
            <div className="col-span-4 px-3 py-2 text-right">Total :</div>
            <div className="px-3 py-2 text-right font-mono">
              {selectedMonthTotal.toLocaleString()}
            </div>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseAddDetails;
