import React, { useEffect, useMemo, useState } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";

const SalesAddDetails: React.FC = () => {
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
  const [sales, setSales] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [parties, setParties] = useState<any[]>([]);

  /* ===================== FETCH SALES VOUCHERS ===================== */
  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/sales-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const data = await res.json();
        console.log("data", data);
        setSales(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        console.error("Sales fetch error:", err);
      }
    };

    if (ownerType && ownerId) {
      fetchSalesData();
    }
  }, [ownerType, ownerId]);

  /* ===================== FETCH LEDGERS (PARTIES) ===================== */
  useEffect(() => {
    const fetchParties = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const data = await res.json();
        console.log("ledger data", data);
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

  /* ===================== MONTH WISE CREDIT ===================== */
  const getMonthWiseCredit = () => {
    const totals: Record<string, number> = {};
    MONTHS.forEach((m) => (totals[m] = 0));

    sales
      // Fallback: if salesLedgerId is missing (old vouchers), still include them
      .filter((s) => Number(s.salesLedgerId ?? groupId) === groupId)
      .forEach((s) => {
        const d = new Date(s.date);
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
          totals[monthName] += Number(s.total || 0);
        }
      });

    return totals;
  };

  const monthWiseCredit = getMonthWiseCredit();

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
    ? sales.filter((s) => {
        const d = new Date(s.date);
        return (
          d.getMonth() === monthIndexMap[selectedMonth] &&
          Number(s.salesLedgerId ?? groupId) === groupId
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
          onClick={() => navigate(-1)}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-2xl font-bold">Sales Account</h1>

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
            <div className="text-lg font-semibold">Sales Account</div>
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
              <div className="px-3 py-2 text-center">0</div>
              <div className="px-3 py-2 text-center font-mono">
                {monthWiseCredit[month]
                  ? monthWiseCredit[month].toLocaleString()
                  : "0"}
              </div>
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
              <div className="px-3 py-2">Sales</div>
              <div className="px-3 py-2">{row.number}</div>
              <div className="px-3 py-2 text-right"></div>
              <div className="px-3 py-2 text-right font-mono">
                {Number(row.total).toLocaleString()}
              </div>
            </div>
          ))}

          <div className="grid grid-cols-6 bg-gray-100 font-semibold">
            <div className="col-span-4 px-3 py-2 text-right">Total :</div>
            <div className="px-3 py-2 text-right"></div>
            <div className="px-3 py-2 text-right font-mono">
              {selectedMonthTotal.toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesAddDetails;


