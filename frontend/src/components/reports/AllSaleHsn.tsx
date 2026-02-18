import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, Filter, Layers } from "lucide-react";
import * as XLSX from "xlsx";
import "./reports.css";

interface TransactionLine {
    id: any;
    voucherNo: string;
    date: string;
    netAmount: number;
    total: string;
    partyId: number;
    partyName: string;
    subtotal: string;
    cgstTotal: string;
    sgstTotal: string;
    igstTotal: string;
}

interface FilterState {
    dateRange: string;
    fromDate: string;
    toDate: string;
    businessFilter: string;
    typeFilter: string;
}

type ViewType = "dashboard";

const AllSaleHsn: React.FC = () => {
    const { theme } = useAppContext();
    const navigate = useNavigate();
    const printRef = useRef<HTMLDivElement | null>(null);

    // Example filters — can be moved to state and UI controlled
    const companyId = localStorage.getItem("company_id") || "";
    const ownerType = localStorage.getItem("supplier") || "";
    const ownerId =
        localStorage.getItem(
            ownerType === "employee" ? "employee_id" : "user_id"
        ) || "";

    const [showFilterPanel, setShowFilterPanel] = useState(false);
    const [selectedView, setSelectedView] = useState<ViewType>("dashboard");
    const [filters, setFilters] = useState<FilterState>({
        dateRange: "this-month",
        fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            .toISOString()
            .split("T")[0],
        toDate: new Date().toISOString().split("T")[0],
        businessFilter: "",
        typeFilter: "",
    });

    const handleFilterChange = (key: keyof FilterState, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const handleDateRangeChange = (range: string) => {
        const today = new Date();
        let fromDate = new Date();
        let toDate = new Date();

        switch (range) {
            case "today":
                fromDate = toDate = today;
                break;
            case "this-week":
                fromDate = new Date(
                    today.getTime() - today.getDay() * 24 * 60 * 60 * 1000
                );
                break;
            case "this-month":
                fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
                break;
            case "this-quarter": {
                const quarterStart = Math.floor(today.getMonth() / 3) * 3;
                fromDate = new Date(today.getFullYear(), quarterStart, 1);
                break;
            }
            case "this-year":
                fromDate = new Date(today.getFullYear(), 0, 1);
                break;
        }

        setFilters((prev) => ({
            ...prev,
            dateRange: range,
            fromDate: fromDate.toISOString().split("T")[0],
            toDate: toDate.toISOString().split("T")[0],
        }));
    };

    const [saleData, setSaleData] = useState<any[]>([]);
    const [partyIds, setPartyIds] = useState<number[]>([]);

    const [ledger, setLedger] = useState<any[]>([]);
    const [matchedSales, setMatchedSales] = useState<any[]>([]);

    // 1. Fetch Sales Vouchers
    useEffect(() => {
        if (!companyId || !ownerType || !ownerId) return;

        const loadSalesVouchers = async () => {
            try {
                const url = `${import.meta.env.VITE_API_URL
                    }/api/sales-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

                const res = await fetch(url);
                const json = await res.json();

                const vouchers = json?.data || json || [];

                const allPartyIds = vouchers
                    .map((v: any) => v.partyId)
                    .filter((id: any) => id !== null && id !== undefined);

                setSaleData(vouchers);
                setPartyIds(allPartyIds);
            } catch (err) {
                console.error("Failed to fetch sales vouchers:", err);
                setSaleData([]);
                setPartyIds([]);
            }
        };

        loadSalesVouchers();
    }, [companyId, ownerType, ownerId]);

    // 2. Fetch Ledgers
    useEffect(() => {
        const fetchLedger = async () => {
            try {
                const ledgerRes = await fetch(
                    `${import.meta.env.VITE_API_URL
                    }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
                );
                const ledgerData = await ledgerRes.json();
                setLedger(ledgerData || []);
            } catch (err) {
                console.error("Ledger fetch failed:", err);
                setLedger([]);
            }
        };

        fetchLedger();
    }, [companyId, ownerType, ownerId]);

    // 3. Match Sales with Ledgers (No filtering by GST here, we want ALL)
    useEffect(() => {
        if (!partyIds.length || !ledger.length || !saleData.length) return;

        const partyIdSet = new Set(partyIds);

        // Keep all ledgers that are involved in sales
        const relevantLedgers = ledger.filter((l: any) => partyIdSet.has(l.id));
        const relevantLedgerIdSet = new Set(relevantLedgers.map((l: any) => l.id));

        // Filter sales to valid ledgers (just to be safe)
        const filteredSales = saleData.filter((s: any) =>
            relevantLedgerIdSet.has(s.partyId)
        );

        setMatchedSales(filteredSales);
    }, [partyIds, ledger, saleData]);

    // Ledger quick lookup (id → ledger)
    const ledgerMap = useMemo(() => {
        const map = new Map<number, any>();
        ledger.forEach((l: any) => {
            map.set(l.id, l);
        });
        return map;
    }, [ledger]);

    // 4. Fetch Sales History (for HSN, Qty, Rate)
    const [salesHistory, setSalesHistory] = useState<any[]>([]);
    const [hsnSearch, setHsnSearch] = useState("");

    useEffect(() => {
        const fetchSalesHistory = async () => {
            try {
                const res = await fetch(
                    `${import.meta.env.VITE_API_URL
                    }/api/sales-vouchers/sale-history?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
                );
                const resJson = await res.json();
                const rows = Array.isArray(resJson?.data)
                    ? resJson.data
                    : Array.isArray(resJson)
                        ? resJson
                        : [];

                setSalesHistory(rows);
            } catch (err) {
                console.error("Sales history fetch failed", err);
                setSalesHistory([]);
            }
        };

        fetchSalesHistory();
    }, [companyId, ownerType, ownerId]);

    const salesHistoryMap = useMemo(() => {
        return new Map(salesHistory.map((h: any) => [h.voucherNumber, h]));
    }, [salesHistory]);

    const getHsnByVoucher = (voucherNo: string) => {
        return salesHistoryMap.get(voucherNo)?.hsnCode || "-";
    };

    const getQtyByVoucher = (voucherNo: string) => {
        const qty = salesHistoryMap.get(voucherNo)?.qtyChange;
        return qty ? Math.abs(qty) : "";
    };

    const getRateByVoucher = (voucherNo: string) => {
        return salesHistoryMap.get(voucherNo)?.rate || "";
    };

    // 5. Final Filtered Data based on UI controls
    const filteredAndSortedSales = useMemo(() => {
        return matchedSales.filter((sale: any) => {
            // Date Filter
            const transactionDate = new Date(sale.date);
            const fromDate = new Date(filters.fromDate);
            const toDate = new Date(filters.toDate);
            const dateInRange = transactionDate >= fromDate && transactionDate <= toDate;
            if (!dateInRange) return false;

            // Business/Party Filter
            const party = ledgerMap.get(sale.partyId);
            const partyName = party?.name || "";
            if (
                filters.businessFilter &&
                !partyName.toLowerCase().includes(filters.businessFilter.toLowerCase())
            ) {
                return false;
            }

            // HSN Search
            if (hsnSearch.trim()) {
                const hsn = getHsnByVoucher(sale.number);
                if (hsn?.toString().trim() !== hsnSearch.trim()) return false;
            }

            // Type Filter
            if (filters.typeFilter) {
                const isB2B = party?.gstNumber && String(party.gstNumber).trim() !== "";
                const type = isB2B ? "B2B" : "B2C";
                if (type !== filters.typeFilter) return false;
            }

            return true;
        });
    }, [matchedSales, filters, hsnSearch, ledgerMap, salesHistoryMap]);

    const handleExport = () => {
        const exportData = filteredAndSortedSales.map((sale: any) => {
            const partyLedger = ledgerMap.get(sale.partyId);
            const isB2B = partyLedger?.gstNumber && String(partyLedger.gstNumber).trim() !== "";
            const type = isB2B ? "B2B" : "B2C";

            return {
                Type: type,
                HSN: getHsnByVoucher(sale.number),
                Customer: partyLedger?.name || "Unknown Party",
                "Voucher No": sale.number,
                "GST No": partyLedger?.gstNumber || "-",
                QTY: getQtyByVoucher(sale.number),
                Rate: getRateByVoucher(sale.number),
                Amount: Number(sale.subtotal || 0),
                "Tax Value": (Number(sale.igstTotal || 0) + Number(sale.cgstTotal || 0) + Number(sale.sgstTotal || 0)),
                IGST: sale.igstTotal,
                CGST: sale.cgstTotal,
                SGST: sale.sgstTotal,
                "Total Amount": Number(sale.total || 0),
                Date: new Date(sale.date).toLocaleDateString("en-IN"),
            };
        });

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "All HSN Sales");
        XLSX.writeFile(
            wb,
            `All_HSN_Sales_Report_${new Date().toISOString().split("T")[0]}.xlsx`
        );
    };

    return (
        <div className="pt-[56px] px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate("/app/reports")}
                        title="Back to Reports"
                        className={`p-2 rounded-lg mr-3 ${theme === "dark"
                                ? "bg-gray-700 hover:bg-gray-600 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center">
                            <Layers className="mr-2 text-blue-600" size={28} />
                            All Sale HSN Report
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            Combined B2B and B2C sales with HSN details
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowFilterPanel(!showFilterPanel)}
                        title="Toggle Filters"
                        className={`p-2 rounded-lg ${showFilterPanel
                                ? theme === "dark"
                                    ? "bg-blue-600"
                                    : "bg-blue-500 text-white"
                                : theme === "dark"
                                    ? "bg-gray-700 hover:bg-gray-600"
                                    : "bg-gray-100 hover:bg-gray-200"
                            }`}
                    >
                        <Filter size={16} />
                    </button>
                    <button
                        onClick={handleExport}
                        title="Export to Excel"
                        className={`p-2 rounded-lg ${theme === "dark"
                                ? "bg-gray-700 hover:bg-gray-600"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                    >
                        <Download size={16} />
                    </button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilterPanel && (
                <div
                    className={`p-4 rounded-lg mb-6 ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"
                        }`}
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Date Range
                            </label>
                            <select
                                value={filters.dateRange}
                                onChange={(e) => handleDateRangeChange(e.target.value)}
                                title="Select date range"
                                className={`w-full p-2 rounded border ${theme === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-white border-gray-300 text-black"
                                    } outline-none`}
                            >
                                <option value="today">Today</option>
                                <option value="this-week">This Week</option>
                                <option value="this-month">This Month</option>
                                <option value="this-quarter">This Quarter</option>
                                <option value="this-year">This Year</option>
                                <option value="custom">Custom Range</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Business Name
                            </label>
                            <input
                                type="text"
                                placeholder="Search business..."
                                value={filters.businessFilter}
                                onChange={(e) =>
                                    handleFilterChange("businessFilter", e.target.value)
                                }
                                className={`w-full p-2 rounded border ${theme === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-white border-gray-300 text-black"
                                    } outline-none`}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Type
                            </label>
                            <select
                                value={filters.typeFilter}
                                onChange={(e) =>
                                    handleFilterChange("typeFilter", e.target.value)
                                }
                                title="Select Type"
                                className={`w-full p-2 rounded border ${theme === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white"
                                        : "bg-white border-gray-300 text-black"
                                    } outline-none`}
                            >
                                <option value="">All</option>
                                <option value="B2B">B2B</option>
                                <option value="B2C">B2C</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {/* View Selector (Only Dashboard for now) */}
            <div className="flex space-x-2 mb-6 overflow-x-auto">
                <button
                    className={`px-4 py-2 rounded-lg capitalize whitespace-nowrap ${theme === "dark" ? "bg-blue-600 text-white" : "bg-blue-500 text-white"
                        }`}
                >
                    Dashboard
                </button>
            </div>

            <div ref={printRef}>
                {/* Dashboard View */}
                {selectedView === "dashboard" && (
                    <div
                        className={`p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                            }`}
                    >
                        {/* Header + Search */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Transactions</h3>

                            {/* HSN Search Box */}
                            <input
                                type="text"
                                placeholder="Search HSN (Exact)..."
                                value={hsnSearch}
                                onChange={(e) => setHsnSearch(e.target.value)}
                                className={`px-3 py-2 text-sm rounded border w-56
          ${theme === "dark"
                                        ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                                        : "bg-white border-gray-300 text-black"
                                    } outline-none`}
                            />
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead
                                    className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                                        }`}
                                >
                                    <tr>
                                        <th className="text-left p-3">Type</th>
                                        <th className="text-left p-3">HSN</th>
                                        <th className="text-left p-3">Customer</th>
                                        <th className="text-left p-3">Voucher No</th>
                                        <th className="text-left p-3">GST No</th>
                                        <th className="text-left p-3">QTY</th>
                                        <th className="text-left p-3">Rate</th>
                                        <th className="text-left p-3">Amount</th>
                                        <th className="text-left p-3">Tax Value</th>
                                        <th className="text-left p-3">IGST</th>
                                        <th className="text-left p-3">CGST</th>
                                        <th className="text-left p-3">SGST</th>
                                        <th className="text-left p-3">Total Amount</th>
                                        <th className="text-left p-3">Date</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredAndSortedSales.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={14}
                                                className="text-center p-4 text-gray-500"
                                            >
                                                No data found
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredAndSortedSales
                                            .slice(0, 50) // Limit rows for performance if needed, or remove limit
                                            .map((sale: any, index: number) => {
                                                const partyLedger = ledgerMap.get(sale.partyId);
                                                const isB2B = partyLedger?.gstNumber && String(partyLedger.gstNumber).trim() !== "";
                                                const type = isB2B ? "B2B" : "B2C";

                                                const taxValue = Number(sale.igstTotal || 0) +
                                                    Number(sale.cgstTotal || 0) +
                                                    Number(sale.sgstTotal || 0);

                                                return (
                                                    <tr
                                                        key={sale.id || index}
                                                        className={`border-b ${theme === "dark"
                                                                ? "border-gray-700"
                                                                : "border-gray-200"
                                                            }`}
                                                    >
                                                        {/* Type */}
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 rounded text-xs ${type === 'B2B' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                                {type}
                                                            </span>
                                                        </td>

                                                        {/* HSN */}
                                                        <td className="p-3">
                                                            {getHsnByVoucher(sale.number)}
                                                        </td>

                                                        {/* Customer */}
                                                        <td className="p-3">
                                                            {partyLedger?.name || "Unknown Party"}
                                                        </td>

                                                        {/* Voucher No */}
                                                        <td className="p-3 font-mono">{sale.number}</td>

                                                        {/* GST No */}
                                                        <td className="p-3">
                                                            {partyLedger?.gstNumber || "-"}
                                                        </td>

                                                        {/* QTY */}
                                                        <td className="p-3">
                                                            {getQtyByVoucher(sale.number)}
                                                        </td>

                                                        {/* Rate */}
                                                        <td className="p-3">
                                                            {getRateByVoucher(sale.number)}
                                                        </td>

                                                        {/* Taxable Amount */}
                                                        <td className="p-3">
                                                            ₹{Number(sale.subtotal || 0).toFixed(2)}
                                                        </td>

                                                        {/* Tax Value */}
                                                        <td className="p-3">
                                                            ₹{taxValue.toFixed(2)}
                                                        </td>

                                                        {/* IGST */}
                                                        <td className="p-3">{sale.igstTotal}</td>

                                                        {/* CGST */}
                                                        <td className="p-3">{sale.cgstTotal}</td>

                                                        {/* SGST */}
                                                        <td className="p-3">{sale.sgstTotal}</td>

                                                        {/* Total */}
                                                        <td className="p-3 font-semibold">
                                                            ₹{Number(sale.total || 0).toFixed(2)}
                                                        </td>

                                                        {/* Date */}
                                                        <td className="p-3">
                                                            {new Date(sale.date).toLocaleDateString("en-IN")}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default AllSaleHsn;