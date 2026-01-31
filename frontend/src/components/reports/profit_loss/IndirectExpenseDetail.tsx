import React, { useEffect, useState, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";

const IndirectExpenseDetail: React.FC = () => {
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
    const [vouchers, setVouchers] = useState<any[]>([]);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
    const [parties, setParties] = useState<any[]>([]);

    /* ===================== FETCH VOUCHER ENTRIES ===================== */
    useEffect(() => {
        const fetchVoucherEntries = async () => {
            try {
                // Fetch all vouchers with entries from daybook API
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/daybook-table2?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
                );

                if (res.ok) {
                    const data = await res.json();
                    const allVouchers = Array.isArray(data) ? data : data.data || [];

                    // Filter vouchers that have entries for this ledger
                    const voucherMap = new Map();

                    allVouchers.forEach((v: any) => {
                        if (v.entries && Array.isArray(v.entries)) {
                            const hasLedgerEntry = v.entries.some((e: any) => Number(e.ledger_id) === groupId);
                            if (hasLedgerEntry && !voucherMap.has(v.id)) {
                                voucherMap.set(v.id, v);
                            }
                        }
                    });

                    setVouchers(Array.from(voucherMap.values()));
                }
            } catch (err) {
                console.error("Voucher entries fetch error:", err);
            }
        };

        if (companyId && ownerType && ownerId && groupId) {
            fetchVoucherEntries();
        }
    }, [companyId, ownerType, ownerId, groupId]);

    /* ===================== FETCH LEDGERS (PARTIES) ===================== */
    useEffect(() => {
        const fetchParties = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
                );

                const data = await res.json();
                setParties(Array.isArray(data) ? data : data.data || []);
            } catch (err) {
                console.error("Party fetch error:", err);
            }
        };

        if (companyId && ownerType && ownerId) {
            fetchParties();
        }
    }, [companyId, ownerType, ownerId]);

    /* ===================== PARTY MAP ===================== */
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

        vouchers.forEach((v) => {
            const d = new Date(v.date || v.createdAt || new Date());
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
                // Get the amount for this ledger from voucher entries
                const entryAmount = v.entries?.find((e: any) => Number(e.ledger_id) === groupId)?.amount || 0;
                totals[monthName] += Number(entryAmount || v.total || 0);
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
        ? vouchers.filter((v) => {
            const d = new Date(v.date || v.createdAt || new Date());
            return d.getMonth() === monthIndexMap[selectedMonth];
        })
        : [];

    const selectedMonthTotal = selectedMonthData.reduce((sum, v) => {
        const entryAmount = v.entries?.find((e: any) => Number(e.ledger_id) === groupId)?.amount || 0;
        return sum + Number(entryAmount || v.total || 0);
    }, 0);

    /* ===================== UI ===================== */
    return (
        <div className="pt-[56px] px-4">
            {/* Header */}
            <div className="flex items-center mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                        }`}
                >
                    <ArrowLeft size={20} />
                </button>

                <h1 className="text-2xl font-bold">Indirect Expense Account</h1>

                <div className="ml-auto flex gap-2">
                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        className={`p-2 rounded ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                            }`}
                    >
                        <Filter size={18} />
                    </button>
                    <button
                        className={`p-2 rounded ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                            }`}
                    >
                        <Printer size={18} />
                    </button>
                    <button
                        className={`p-2 rounded ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                            }`}
                    >
                        <Download size={18} />
                    </button>
                </div>
            </div>

            {/* ================= MONTH SUMMARY ================= */}
            {!selectedMonth && (
                <div>
                    <div
                        className={`border-b text-center py-3 ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                            }`}
                    >
                        <div className="text-lg font-semibold">Indirect Expense Account</div>
                        <div className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"
                            }`}>{ledgerName}</div>
                    </div>

                    <div
                        className={`grid grid-cols-3 font-semibold border-b ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                            }`}
                    >
                        <div className="px-3 py-2">Month</div>
                        <div className="px-3 py-2 text-center">Debit</div>
                        <div className="px-3 py-2 text-center">Credit</div>
                    </div>

                    {MONTHS.map((month) => (
                        <div
                            key={month}
                            onClick={() => setSelectedMonth(month)}
                            className={`grid grid-cols-3 border-b cursor-pointer ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-blue-50"
                                }`}
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
                    <div
                        className={`flex items-center p-3 border-b relative ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"
                            }`}
                    >
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

                    <div
                        className={`grid grid-cols-6 font-semibold border-b ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                            }`}
                    >
                        <div className="px-3 py-2">Date</div>
                        <div className="px-3 py-2">Particular</div>
                        <div className="px-3 py-2">Voucher Type</div>
                        <div className="px-3 py-2">Voucher No</div>
                        <div className="px-3 py-2 text-right">Debit</div>
                        <div className="px-3 py-2 text-right">Credit</div>
                    </div>

                    {selectedMonthData.length === 0 ? (
                        <div className="px-3 py-8 text-center text-gray-500">
                            No transactions found for {selectedMonth}
                        </div>
                    ) : (
                        <>
                            {selectedMonthData.map((row, i) => {
                                const entryAmount = row.entries?.find((e: any) => Number(e.ledger_id) === groupId)?.amount || 0;
                                const amount = Number(entryAmount || row.total || 0);

                                return (
                                    <div key={i} className={`grid grid-cols-6 border-b text-sm ${theme === "dark" ? "border-gray-700" : ""
                                        }`}>
                                        <div className="px-3 py-2">
                                            {new Date(row.date || row.createdAt || new Date()).toLocaleDateString()}
                                        </div>
                                        <div className="px-3 py-2">
                                            {getPartyNameById(row.partyId || row.party_id)}
                                        </div>
                                        <div className="px-3 py-2">{row.type || "Voucher"}</div>
                                        <div className="px-3 py-2">{row.number || "-"}</div>
                                        <div className="px-3 py-2 text-right font-mono">
                                            {amount.toLocaleString()}
                                        </div>
                                        <div className="px-3 py-2 text-right"></div>
                                    </div>
                                );
                            })}

                            <div
                                className={`grid grid-cols-6 font-semibold ${theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                                    }`}
                            >
                                <div className="col-span-4 px-3 py-2 text-right">Total :</div>
                                <div className="px-3 py-2 text-right font-mono">
                                    {selectedMonthTotal.toLocaleString()}
                                </div>
                                <div></div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default IndirectExpenseDetail;
