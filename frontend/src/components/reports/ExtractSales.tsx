import React, { useEffect, useState, useMemo, useRef } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Printer,
  Download,
  Filter,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  User,
  Grid3X3,
} from "lucide-react";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

interface SalesData {
  id: string;
  voucherNo: string;
  voucherType: string;
  date: string;
  partyName: string;
  partyGSTIN?: string;
  billAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  cessAmount: number;
  totalTaxAmount: number;
  netAmount: number;
  itemDetails: {
    itemName: string;
    hsnCode: string;
    quantity: number;
    rate: number;
    amount: number;
    discount?: number;
  }[];
  paymentTerms?: string;
  dueDate?: string;
  status: "Paid" | "Unpaid" | "Partially Paid" | "Overdue";
  reference?: string;
  narration?: string;
}

interface FilterState {
  dateRange: string;
  fromDate: string;
  toDate: string;
  partyFilter: string;
  itemFilter: string;
  voucherTypeFilter: string;
  statusFilter: string;
  amountRangeMin: string;
  amountRangeMax: string;
}

interface PartyGroup {
  partyName: string;
  partyGSTIN?: string;
  totalAmount: number;
  totalTax: number;
  transactionCount: number;
  transactions: SalesData[];
}

interface ItemGroup {
  itemName: string;
  hsnCode: string;
  totalQuantity: number;
  totalAmount: number;
  transactionCount: number;
  averageRate: number;
}

const ExtractSales: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  const [backendSales, setBackendSales] = useState<any[]>([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedView, setSelectedView] = useState<
    | "summary"
    | "extract"
    | "detailed"
    | "itemwise"
    | "partywise"
    | "billwise"
    | "billwiseprofit"
  >("summary");
  const [extractData, setExtractData] = useState<any>(null);
  const [loadingExtract, setLoadingExtract] = useState(false);
  const [selectedParty, setSelectedParty] = useState<{
    partyName: string;
    partyGSTIN?: string;
  } | null>(null);
  const [selectedSalesAccount, setSelectedSalesAccount] = useState<{
    ledgerName: string;
  } | null>(null);
  const [selectedTaxType, setSelectedTaxType] = useState<
    "cgst" | "sgst" | "igst" | null
  >(null);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: "this-month",
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), -100)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
    partyFilter: "",
    itemFilter: "",
    voucherTypeFilter: "",
    statusFilter: "",
    amountRangeMin: "",
    amountRangeMax: "",
  });

  const [sortConfig, setSortConfig] = useState<{
    key: keyof SalesData;
    direction: "asc" | "desc";
  }>({ key: "date", direction: "desc" });

  const [selectedSale, setSelectedSale] = useState<SalesData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  useEffect(() => {
    async function fetchSales() {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          company_id: companyId,
          owner_type: ownerType,
          owner_id: ownerId,
        });

        // add more if needed: params.append('partyId', filters.partyFilter)...

        // If you want you can process voucherType, amount etc. filters here

        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/sales-report?${params.toString()}`
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setBackendSales(data);
      } catch (e: any) {
        setError(e.message || "Failed to load sales data");
        setBackendSales([]);
      } finally {
        setLoading(false);
      }
    }
    // Only run if tenant/basic filter changes
    if (
      companyId &&
      ownerType &&
      ownerId &&
      filters.fromDate &&
      filters.toDate
    ) {
      fetchSales();
    }
  }, [companyId, ownerType, ownerId, filters.fromDate, filters.toDate]);

  const salesData: SalesData[] = useMemo(() => {
    const bills: Record<string, SalesData> = {};
    backendSales.forEach((row) => {
      if (!bills[row.saleId]) {
        bills[row.saleId] = {
          id: String(row.saleId),
          voucherNo: row.voucherNo,
          voucherType: row.voucherType,
          date: row.date,
          partyName: row.partyName,
          partyGSTIN: row.partyGSTIN || "",
          billAmount: Number(row.total) || 0,
          taxableAmount: Number(row.subtotal) || 0,
          cgstAmount: Number(row.cgstTotal) || 0,
          sgstAmount: Number(row.sgstTotal) || 0,
          igstAmount: Number(row.igstTotal) || 0,
          cessAmount: 0,
          totalTaxAmount:
            (Number(row.cgstTotal) || 0) +
            (Number(row.sgstTotal) || 0) +
            (Number(row.igstTotal) || 0),
          netAmount: Number(row.total) || 0,
          itemDetails: [],
          status: "Unpaid",
          reference: row.referenceNo,
          narration: row.narration,
        };
      }
      bills[row.saleId].itemDetails.push({
        itemName: row.itemName,
        hsnCode: row.hsnCode,
        quantity: Number(row.quantity) || 0,
        rate: Number(row.rate) || 0,
        amount: Number(row.amount) || 0,
        discount: Number(row.discount) || 0,
      });
    });
    return Object.values(bills);
  }, [backendSales]);

  // Filter sales data based on applied filters
  const filteredSalesData = useMemo(() => {
    return salesData.filter((sale) => {
      // Date filter
      const saleDate = new Date(sale.date);
      const fromDate = new Date(filters.fromDate);
      const toDate = new Date(filters.toDate);

      if (saleDate < fromDate || saleDate > toDate) return false;

      // Party filter
      if (
        filters.partyFilter &&
        !sale.partyName
          .toLowerCase()
          .includes(filters.partyFilter.toLowerCase())
      ) {
        return false;
      }

      // Item filter
      if (
        filters.itemFilter &&
        !sale.itemDetails.some((item) =>
          item.itemName.toLowerCase().includes(filters.itemFilter.toLowerCase())
        )
      ) {
        return false;
      }

      // Voucher type filter
      if (
        filters.voucherTypeFilter &&
        sale.voucherType !== filters.voucherTypeFilter
      ) {
        return false;
      }

      // Status filter
      if (filters.statusFilter && sale.status !== filters.statusFilter) {
        return false;
      }

      // Amount range filter
      if (
        filters.amountRangeMin &&
        sale.netAmount < parseFloat(filters.amountRangeMin)
      ) {
        return false;
      }
      if (
        filters.amountRangeMax &&
        sale.netAmount > parseFloat(filters.amountRangeMax)
      ) {
        return false;
      }

      return true;
    });
  }, [salesData, filters]);

  // Sort filtered data
  const sortedSalesData = useMemo(() => {
    return [...filteredSalesData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      return 0;
    });
  }, [filteredSalesData, sortConfig]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSales = filteredSalesData.reduce(
      (sum, sale) => sum + sale.netAmount,
      0
    );
    const totalTaxableAmount = filteredSalesData.reduce(
      (sum, sale) => sum + sale.taxableAmount,
      0
    );
    const totalTaxAmount = filteredSalesData.reduce(
      (sum, sale) => sum + sale.totalTaxAmount,
      0
    );
    const totalQuantity = filteredSalesData.reduce(
      (sum, sale) =>
        sum +
        sale.itemDetails.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    );

    const statusCounts = filteredSalesData.reduce((acc, sale) => {
      acc[sale.status] = (acc[sale.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSales,
      totalTaxableAmount,
      totalTaxAmount,
      totalTransactions: filteredSalesData.length,
      totalQuantity,
      averageSale: totalSales / (filteredSalesData.length || 1),
      statusCounts,
    };
  }, [filteredSalesData]);

  // Group data for different views
  const groupedData = useMemo(() => {
    if (selectedView === "partywise") {
      const partyGroups = filteredSalesData.reduce((acc, sale) => {
        const key = sale.partyName;
        if (!acc[key]) {
          acc[key] = {
            partyName: sale.partyName,
            partyGSTIN: sale.partyGSTIN,
            totalAmount: 0,
            totalTax: 0,
            transactionCount: 0,
            transactions: [],
          };
        }
        acc[key].totalAmount += sale.netAmount;
        acc[key].totalTax += sale.totalTaxAmount;
        acc[key].transactionCount += 1;
        acc[key].transactions.push(sale);
        return acc;
      }, {} as Record<string, PartyGroup>);

      return Object.values(partyGroups);
    }

    if (selectedView === "itemwise") {
      const itemGroups = filteredSalesData.reduce((acc, sale) => {
        sale.itemDetails.forEach((item) => {
          const key = item.itemName;
          if (!acc[key]) {
            acc[key] = {
              itemName: item.itemName,
              hsnCode: item.hsnCode,
              totalQuantity: 0,
              totalAmount: 0,
              transactionCount: 0,
              averageRate: 0,
            };
          }
          acc[key].totalQuantity += item.quantity;
          acc[key].totalAmount += item.amount;
          acc[key].transactionCount += 1;
        });
        return acc;
      }, {} as Record<string, ItemGroup>);

      // Calculate average rates
      Object.values(itemGroups).forEach((group: ItemGroup) => {
        group.averageRate = group.totalAmount / (group.totalQuantity || 1);
      });

      return Object.values(itemGroups);
    }

    return filteredSalesData;
  }, [filteredSalesData, selectedView]);

  const handleSort = (key: keyof SalesData) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDateRangeChange = (range: string) => {
    const today = new Date();
    let fromDate = "";
    let toDate = today.toISOString().split("T")[0];

    switch (range) {
      case "today":
        fromDate = toDate;
        break;
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        fromDate = toDate = yesterday.toISOString().split("T")[0];
        break;
      }
      case "this-week": {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        fromDate = weekStart.toISOString().split("T")[0];
        break;
      }
      case "this-month": {
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        break;
      }
      case "this-quarter": {
        const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
        fromDate = new Date(today.getFullYear(), quarterStartMonth, 1)
          .toISOString()
          .split("T")[0];
        break;
      }
      case "this-year": {
        fromDate = new Date(today.getFullYear(), 0, 1)
          .toISOString()
          .split("T")[0];
        break;
      }
      default:
        return;
    }

    setFilters((prev) => ({
      ...prev,
      dateRange: range,
      fromDate,
      toDate,
    }));
  };

  const exportToExcel = () => {
    const exportData = sortedSalesData.map((sale) => ({
      "Voucher No": sale.voucherNo,
      Date: sale.date,
      "Party Name": sale.partyName,
      "Party GSTIN": sale.partyGSTIN || "",
      "Taxable Amount": sale.taxableAmount,
      "CGST Amount": sale.cgstAmount,
      "SGST Amount": sale.sgstAmount,
      "IGST Amount": sale.igstAmount,
      "Total Tax": sale.totalTaxAmount,
      "Net Amount": sale.netAmount,
      Status: sale.status,
      Reference: sale.reference || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Extract Sales");
    XLSX.writeFile(
      wb,
      `Extract_Sales_${new Date().toISOString().split("T")[0]}.xlsx`
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Paid":
        return "text-green-600 bg-green-100";
      case "Unpaid":
        return "text-red-600 bg-red-100";
      case "Partially Paid":
        return "text-yellow-600 bg-yellow-100";
      case "Overdue":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const handleViewDetails = (sale: SalesData) => {
    setSelectedSale(sale);
    setShowDetailModal(true);
  };

  const handleViewPartyTransactions = (party: PartyGroup) => {
    // Show party transaction summary using SweetAlert2
    const transactionsList = party.transactions
      .map(
        (txn, index) =>
          `${index + 1}. ${txn.voucherNo} - ${new Date(
            txn.date
          ).toLocaleDateString("en-IN")} - ${formatCurrency(txn.netAmount)}`
      )
      .join("<br>");

    Swal.fire({
      title: `${party.partyName} - Transaction Details`,
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 5px;">
            <strong>Party Summary:</strong><br>
            <span style="font-size: 14px;">
              ${party.partyGSTIN ? `GSTIN: ${party.partyGSTIN}<br>` : ""}
              Total Transactions: ${party.transactionCount}<br>
              Total Amount: ${formatCurrency(party.totalAmount)}<br>
              Total Tax: ${formatCurrency(party.totalTax)}
            </span>
          </div>
          <div style="margin-bottom: 10px;">
            <strong>Transactions:</strong>
          </div>
          <div style="font-size: 13px; max-height: 300px; overflow-y: auto;">
            ${transactionsList}
          </div>
        </div>
      `,
      width: "600px",
      showCancelButton: true,
      confirmButtonText: "View First Transaction Details",
      cancelButtonText: "Close",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed && party.transactions.length > 0) {
        // Show detailed view of the first transaction
        setSelectedSale(party.transactions[0]);
        setShowDetailModal(true);
      }
    });
  };

  const handleProfitAnalysis = (sale: SalesData) => {
    // Calculate detailed profit analysis for the selected bill
    const salesAmount = sale.netAmount;
    const costAmount = sale.itemDetails.reduce((sum, item) => {
      const estimatedCost = item.amount * 0.7; // Mock cost calculation
      return sum + estimatedCost;
    }, 0);
    const grossProfit = salesAmount - costAmount;
    const profitPercentage =
      salesAmount > 0 ? (grossProfit / salesAmount) * 100 : 0;

    // Create detailed item breakdown
    const itemBreakdown = sale.itemDetails
      .map((item) => {
        const itemCost = item.amount * 0.7;
        const itemProfit = item.amount - itemCost;
        const itemProfitPercentage =
          item.amount > 0 ? (itemProfit / item.amount) * 100 : 0;

        return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${
            item.itemName
          }</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">${
            item.quantity
          }</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(
            item.amount
          )}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(
            itemCost
          )}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${
            itemProfit >= 0 ? "#059669" : "#dc2626"
          };">${formatCurrency(itemProfit)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${
            itemProfitPercentage >= 0 ? "#059669" : "#dc2626"
          };">${itemProfitPercentage.toFixed(1)}%</td>
        </tr>
      `;
      })
      .join("");

    Swal.fire({
      title: `Profit Analysis - ${sale.voucherNo}`,
      html: `
        <div style="text-align: left;">
          <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
              <div>
                <strong>Bill Information:</strong><br>
                <span style="font-size: 14px;">
                  Date: ${new Date(sale.date).toLocaleDateString("en-IN")}<br>
                  Party: ${sale.partyName}<br>
                  Items: ${sale.itemDetails.length}
                </span>
              </div>
              <div>
                <strong>Financial Summary:</strong><br>
                <span style="font-size: 14px;">
                  Sales: ${formatCurrency(salesAmount)}<br>
                  Cost: <span style="color: #dc2626;">${formatCurrency(
                    costAmount
                  )}</span><br>
                  Profit: <span style="color: ${
                    grossProfit >= 0 ? "#059669" : "#dc2626"
                  };">${formatCurrency(
        grossProfit
      )} (${profitPercentage.toFixed(1)}%)</span>
                </span>
              </div>
            </div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Item-wise Profit Breakdown:</strong>
          </div>
          
          <div style="max-height: 400px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
              <thead style="background-color: #f3f4f6; position: sticky; top: 0;">
                <tr>
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #d1d5db;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #d1d5db;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Sales</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Cost</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Profit</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #d1d5db;">Profit %</th>
                </tr>
              </thead>
              <tbody>
                ${itemBreakdown}
              </tbody>
            </table>
          </div>
          
          <div style="margin-top: 15px; padding: 10px; background-color: ${
            grossProfit >= 0 ? "#ecfdf5" : "#fef2f2"
          }; border-radius: 5px; text-align: center;">
            <strong style="color: ${grossProfit >= 0 ? "#059669" : "#dc2626"};">
              Overall Profit: ${formatCurrency(
                grossProfit
              )} (${profitPercentage.toFixed(1)}% margin)
            </strong>
          </div>
        </div>
      `,
      width: "800px",
      showCancelButton: true,
      confirmButtonText: "Export Analysis",
      cancelButtonText: "Close",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#6c757d",
    }).then((result: { isConfirmed: boolean }) => {
      if (result.isConfirmed) {
        // Export profit analysis to Excel or generate PDF
        Swal.fire({
          icon: "info",
          title: "Export Feature",
          text: "Profit analysis export feature will be implemented soon.",
          confirmButtonText: "OK",
        });
      }
    });
  };

  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedSale(null);
  };

  //sales repost month wise
  // ================= MONTH WISE SALES (REAL DATA) =================

  const [salesVouchers, setSalesVouchers] = useState<any[]>([]);
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

  const monthIndexToName: Record<number, string> = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December",
  };

  const monthDataMap = useMemo(() => {
    // 1️⃣ initialize all months with 0
    const map: Record<string, { credit: number; closingBalance: number }> = {};
    MONTHS.forEach((m) => {
      map[m] = { credit: 0, closingBalance: 0 };
    });

    // 2️⃣ aggregate API sales data

    salesVouchers.forEach((row) => {
      if (!row.date || !row.total) return;

      const d = new Date(row.date);
      const monthName = monthIndexToName[d.getMonth()];
      const amount = Number(row.total) || 0;

      if (map[monthName]) {
        map[monthName].credit += amount;
      }
    });

    // 🔴 closingBalance future me backend se ayega
    return map;
  }, [salesVouchers]);

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;

    const url = `${
      import.meta.env.VITE_API_URL
    }/api/sales-vouchers?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // safe handling
        if (Array.isArray(data)) {
          console.log("Sales Data", data);
          setSalesVouchers(data);
        } else if (Array.isArray(data?.data)) {
          setSalesVouchers(data.data);
        } else {
          setSalesVouchers([]);
        }
      })
      .catch((err) => {
        console.error("Sales voucher fetch error:", err);
        setSalesVouchers([]);
      });
  }, [companyId, ownerType, ownerId]);

  const fetchExtractData = async (month: number, year: number) => {
    if (!companyId || !ownerType || !ownerId) return;

    setLoadingExtract(true);
    try {
      const url = `${
        import.meta.env.VITE_API_URL
      }/api/extract-sales?month=${month}&year=${year}&company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log("Extract Sales Data", data);

      if (data.success) {
        setExtractData(data.data);
      } else {
        console.error("Failed to fetch extract data:", data.message);
        setExtractData(null);
      }
    } catch (error) {
      console.error("Extract data fetch error:", error);
      setExtractData(null);
    } finally {
      setLoadingExtract(false);
    }
  };

  return (
    <div
      className={`min-h-screen pt-[56px] ${
        theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
      }`}
    >
      {/* Header */}
      <div
        className={`p-4 border-b ${
          theme === "dark"
            ? "border-gray-700 bg-gray-800"
            : "border-gray-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/app/reports")}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Go back to reports"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Extract Sales</h1>
              <p className="text-sm opacity-70">
                Extract sales data in columnar format for reporting
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Filters"
            >
              <Filter size={18} />
            </button>
            <button
              onClick={exportToExcel}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Export to Excel"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => window.print()}
              className={`p-2 rounded-md ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
              title="Print"
            >
              <Printer size={18} />
            </button>
          </div>
        </div>

        {/* View Selection Tabs */}
        <div className="flex space-x-1 mt-4">
          {[
            { key: "summary", label: "Summary", icon: <BarChart3 size={16} /> },
            {
              key: "detailed",
              label: "Detailed",
              icon: <FileText size={16} />,
            },
            {
              key: "billwise",
              label: "Bill-wise",
              icon: <Grid3X3 size={16} />,
            },
            {
              key: "billwiseprofit",
              label: "Bill Wise Profit",
              icon: <TrendingUp size={16} />,
            },
            {
              key: "itemwise",
              label: "Item-wise",
              icon: <Package size={16} />,
            },
            { key: "partywise", label: "Party-wise", icon: <User size={16} /> },
          ].map((view) => (
            <button
              key={view.key}
              onClick={() =>
                setSelectedView(
                  view.key as
                    | "summary"
                    | "extract"
                    | "detailed"
                    | "itemwise"
                    | "partywise"
                    | "billwise"
                    | "billwiseprofit"
                )
              }
              className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                selectedView === view.key
                  ? theme === "dark"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-500 text-white"
                  : theme === "dark"
                  ? "bg-gray-700 hover:bg-gray-600"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {view.icon}
              <span>{view.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div
          className={`p-4 border-b ${
            theme === "dark"
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Date Range
              </label>
              <select
                title="Select Date Range"
                value={filters.dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="this-quarter">This Quarter</option>
                <option value="this-year">This Year</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-medium mb-1">
                From Date
              </label>
              <input
                type="date"
                title="Select From Date"
                value={filters.fromDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, fromDate: e.target.value }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                title="Select To Date"
                value={filters.toDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, toDate: e.target.value }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* Party Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Party</label>
              <input
                type="text"
                placeholder="Search party..."
                value={filters.partyFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    partyFilter: e.target.value,
                  }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                title="Select Status Filter"
                value={filters.statusFilter}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    statusFilter: e.target.value,
                  }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              >
                <option value="">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>

            {/* Amount Range */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Min Amount
              </label>
              <input
                type="number"
                placeholder="Min amount..."
                value={filters.amountRangeMin}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    amountRangeMin: e.target.value,
                  }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Max Amount
              </label>
              <input
                type="number"
                placeholder="Max amount..."
                value={filters.amountRangeMax}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    amountRangeMax: e.target.value,
                  }))
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 focus:border-blue-500"
                    : "bg-white border-gray-300 focus:border-blue-500"
                } outline-none`}
              />
            </div>

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={() =>
                  setFilters({
                    dateRange: "this-month",
                    fromDate: new Date(
                      new Date().getFullYear(),
                      new Date().getMonth(),
                      1
                    )
                      .toISOString()
                      .split("T")[0],
                    toDate: new Date().toISOString().split("T")[0],
                    partyFilter: "",
                    itemFilter: "",
                    voucherTypeFilter: "",
                    statusFilter: "",
                    amountRangeMin: "",
                    amountRangeMax: "",
                  })
                }
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-500 border-gray-600"
                    : "bg-gray-100 hover:bg-gray-200 border-gray-300"
                } transition-colors`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4" ref={printRef}>
        {/* Summary Statistics */}
        {selectedView === "summary" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Total Sales</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(summaryStats.totalSales)}
                  </p>
                </div>
                <DollarSign className="text-green-600" size={24} />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Total Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summaryStats.totalTransactions}
                  </p>
                </div>
                <FileText className="text-blue-600" size={24} />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Average Sale</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(summaryStats.averageSale)}
                  </p>
                </div>
                <TrendingUp className="text-purple-600" size={24} />
              </div>
            </div>

            <div
              className={`p-4 rounded-lg ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70">Total Tax</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {formatCurrency(summaryStats.totalTaxAmount)}
                  </p>
                </div>
                <Grid3X3 className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        )}

        {/* Status Distribution for Summary */}
        {selectedView === "summary" && (
          <div className="rounded-lg border-b">
            {/* Header */}
            <div className="grid grid-cols-3 bg-gray-100 font-semibold text-sm px-4 py-2">
              <div>Particulars</div>
              <div className="text-right">Credit</div>
              <div className="text-right">Closing Balance</div>
            </div>

            {[
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
            ].map((month) => {
              const row = monthDataMap[month] || {};
              const monthIndexMap: Record<string, number> = {
                January: 1,
                February: 2,
                March: 3,
                April: 4,
                May: 5,
                June: 6,
                July: 7,
                August: 8,
                September: 9,
                October: 10,
                November: 11,
                December: 12,
              };
              const currentYear = new Date().getFullYear();
              const financialYear =
                monthIndexMap[month] >= 4 ? currentYear : currentYear - 1;

              return (
                <div
                  key={month}
                  onClick={() => {
                    setSelectedView("extract");
                    fetchExtractData(monthIndexMap[month], financialYear);
                  }}
                  className={`grid grid-cols-3 px-4 py-2  text-sm cursor-pointer transition-colors ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                >
                  {/* Month */}
                  <div className="font-medium">{month}</div>

                  {/* Credit */}
                  <div className="text-right">
                    {row.credit > 0 ? `₹${row.credit.toLocaleString()}` : ""}
                  </div>

                  {/* Closing Balance */}
                  <div className="text-right">
                    {row.closingBalance > 0
                      ? `₹${row.closingBalance.toLocaleString()}`
                      : ""}
                  </div>
                </div>
              );
            })}
            {/* Totals row for Credits and Closing Balances */}
            <div
              className={`grid grid-cols-3 px-4 py-2 text-sm font-semibold border-t ${{
                true: "",
              } as any} ${theme === "dark" ? "bg-gray-800" : "bg-gray-50"}`}
            >
              <div>Total</div>
              <div className="text-right">
                {(() => {
                  const totalCredit = Object.values(monthDataMap).reduce(
                    (sum, m) => sum + (m?.credit || 0),
                    0
                  );
                  return totalCredit > 0 ? formatCurrency(totalCredit) : "-";
                })()}
              </div>
              <div className="text-right">
                {(() => {
                  const totalClosing = Object.values(monthDataMap).reduce(
                    (sum, m) => sum + (m?.closingBalance || 0),
                    0
                  );
                  return totalClosing > 0
                    ? formatCurrency(totalClosing)
                    : "-";
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div
          className={`rounded-lg overflow-hidden ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <div className="overflow-x-auto">
            {selectedView === "extract" && (
              <div
                className={`${theme === "dark" ? "bg-gray-800" : "bg-white"}`}
              >
                {/* Extract Header */}
                <div
                  className={`p-4 border-b ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <h2 className="text-lg font-bold">
                        Extract of All Sales Vouchers
                      </h2>
                    </div>
                    {extractData && (
                      <div className="text-sm opacity-70">
                        {new Date(extractData.fromDate).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}{" "}
                        to{" "}
                        {new Date(extractData.toDate).toLocaleDateString(
                          "en-IN",
                          { day: "numeric", month: "short", year: "numeric" }
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {loadingExtract ? (
                  <div className="p-8 text-center">
                    <p>Loading extract data...</p>
                  </div>
                ) : (selectedParty ||
                    selectedSalesAccount ||
                    selectedTaxType) &&
                  extractData ? (
                  <div>
                    {/* Back button and header */}
                    <div
                      className={`p-4 border-b ${
                        theme === "dark" ? "border-gray-700" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-4 mb-2">
                        <button
                          onClick={() => {
                            setSelectedParty(null);
                            setSelectedSalesAccount(null);
                            setSelectedTaxType(null);
                          }}
                          className={`p-2 rounded-md ${
                            theme === "dark"
                              ? "hover:bg-gray-700"
                              : "hover:bg-gray-200"
                          }`}
                          title="Back to Extract View"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <div>
                          <h2 className="text-lg font-bold">
                            Select Ledger Vouchers
                          </h2>
                          <p className="text-sm opacity-70">
                            Ledger :{" "}
                            {selectedParty?.partyName ||
                              selectedSalesAccount?.ledgerName ||
                              (selectedTaxType === "cgst"
                                ? "14% Cgst"
                                : selectedTaxType === "sgst"
                                ? "14% Sgst"
                                : selectedTaxType === "igst"
                                ? "IGST"
                                : "")}
                          </p>
                        </div>
                        {extractData && (
                          <div className="ml-auto text-sm opacity-70">
                            {new Date(extractData.fromDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}{" "}
                            to{" "}
                            {new Date(extractData.toDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Voucher Details Table */}
                    <table className="w-full">
                      <thead
                        className={`${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Particulars
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Vch Type
                          </th>
                          <th className="px-4 py-3 text-left font-medium">
                            Vch No.
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Debit
                          </th>
                          <th className="px-4 py-3 text-right font-medium">
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let filteredVouchers = extractData.vouchers;

                          if (selectedParty) {
                            filteredVouchers = filteredVouchers.filter(
                              (voucher: any) =>
                                voucher.partyName === selectedParty.partyName
                            );
                          } else if (selectedSalesAccount) {
                            filteredVouchers = filteredVouchers.filter(
                              (voucher: any) =>
                                voucher.salesLedgerName ===
                                selectedSalesAccount.ledgerName
                            );
                          } else if (selectedTaxType) {
                            filteredVouchers = extractData.vouchers; // All vouchers for tax calculation
                          }

                          return filteredVouchers
                            .map((voucher: any, index: number) => {
                              let creditAmount = 0;
                              let debitAmount = 0;
                              let particulars = "-";

                              if (selectedParty) {
                                debitAmount = parseFloat(voucher.total) || 0;
                                particulars = voucher.salesLedgerName || "-";
                              } else if (selectedSalesAccount) {
                                creditAmount =
                                  parseFloat(voucher.subtotal) || 0;
                                particulars = voucher.partyName || "-";
                              } else if (selectedTaxType) {
                                if (selectedTaxType === "cgst") {
                                  creditAmount =
                                    parseFloat(voucher.cgstTotal) || 0;
                                } else if (selectedTaxType === "sgst") {
                                  creditAmount =
                                    parseFloat(voucher.sgstTotal) || 0;
                                } else if (selectedTaxType === "igst") {
                                  creditAmount =
                                    parseFloat(voucher.igstTotal) || 0;
                                }
                                particulars = voucher.partyName || "-";
                              }

                              // Only show rows with non-zero amounts
                              if (debitAmount === 0 && creditAmount === 0)
                                return null;

                              return (
                                <tr
                                  key={index}
                                  className={`border-t ${
                                    theme === "dark"
                                      ? "border-gray-700"
                                      : "border-gray-200"
                                  }`}
                                >
                                  <td className="px-4 py-2">
                                    {new Date(voucher.date).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "numeric",
                                        month: "numeric",
                                        year: "numeric",
                                      }
                                    )}
                                  </td>
                                  <td className="px-4 py-2">{particulars}</td>
                                  <td className="px-4 py-2">Sales</td>
                                  <td className="px-4 py-2">
                                    {voucher.voucherNo}
                                  </td>
                                  <td className="px-4 py-2 text-right font-mono">
                                    {debitAmount > 0
                                      ? formatCurrency(debitAmount)
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-2 text-right font-mono">
                                    {creditAmount > 0
                                      ? formatCurrency(creditAmount)
                                      : "-"}
                                  </td>
                                </tr>
                              );
                            })
                            .filter((row: any) => row !== null);
                        })()}
                      </tbody>
                      <tfoot
                        className={`border-t-2 ${
                          theme === "dark"
                            ? "bg-gray-700 border-gray-600"
                            : "bg-gray-100 border-gray-300"
                        }`}
                      >
                        <tr className="font-bold">
                          <td colSpan={4} className="px-4 py-3 text-right">
                            Total :
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {(() => {
                              if (selectedParty) {
                                const total = extractData.vouchers
                                  .filter(
                                    (voucher: any) =>
                                      voucher.partyName ===
                                      selectedParty.partyName
                                  )
                                  .reduce(
                                    (sum: number, voucher: any) =>
                                      sum + (parseFloat(voucher.total) || 0),
                                    0
                                  );
                                return formatCurrency(total);
                              }
                              return "-";
                            })()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {(() => {
                              if (selectedSalesAccount) {
                                const total = extractData.vouchers
                                  .filter(
                                    (voucher: any) =>
                                      voucher.salesLedgerName ===
                                      selectedSalesAccount.ledgerName
                                  )
                                  .reduce(
                                    (sum: number, voucher: any) =>
                                      sum + (parseFloat(voucher.subtotal) || 0),
                                    0
                                  );
                                return formatCurrency(total);
                              } else if (selectedTaxType) {
                                const total = extractData.vouchers.reduce(
                                  (sum: number, voucher: any) => {
                                    if (selectedTaxType === "cgst") {
                                      return (
                                        sum +
                                        (parseFloat(voucher.cgstTotal) || 0)
                                      );
                                    } else if (selectedTaxType === "sgst") {
                                      return (
                                        sum +
                                        (parseFloat(voucher.sgstTotal) || 0)
                                      );
                                    } else if (selectedTaxType === "igst") {
                                      return (
                                        sum +
                                        (parseFloat(voucher.igstTotal) || 0)
                                      );
                                    }
                                    return sum;
                                  },
                                  0
                                );
                                return formatCurrency(total);
                              }
                              return "-";
                            })()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : extractData ? (
                  <table className="w-full">
                    <thead
                      className={`${
                        theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">
                          Particulars
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Debit Amt.
                        </th>
                        <th className="px-4 py-3 text-right font-medium">
                          Credit Amt.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Sundry Debtors Group */}
                      <tr
                        className={`${
                          theme === "dark" ? "bg-gray-800" : "bg-white"
                        }`}
                      >
                        <td className="px-4 py-2 font-semibold">
                          Sundry Debtors
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      {extractData.sundryDebtors.map(
                        (party: any, index: number) => (
                          <tr
                            key={index}
                            onClick={() =>
                              setSelectedParty({
                                partyName: party.partyName,
                                partyGSTIN: party.partyGSTIN,
                              })
                            }
                            className={`border-t cursor-pointer transition-colors ${
                              theme === "dark"
                                ? "border-gray-700 hover:bg-gray-700"
                                : "border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <td className="px-4 py-2 pl-8">
                              {party.partyName}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {formatCurrency(party.debit)}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {formatCurrency(party.credit)}
                            </td>
                          </tr>
                        )
                      )}

                      {/* Sales Accounts Group */}
                      <tr
                        className={`border-t-2 ${
                          theme === "dark"
                            ? "border-gray-600 bg-gray-800"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <td className="px-4 py-2 font-semibold">
                          Sales Accounts
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      {extractData.salesAccounts.map(
                        (account: any, index: number) => (
                          <tr
                            key={index}
                            onClick={() =>
                              setSelectedSalesAccount({
                                ledgerName: account.ledgerName,
                              })
                            }
                            className={`border-t cursor-pointer transition-colors ${
                              theme === "dark"
                                ? "border-gray-700 hover:bg-gray-700"
                                : "border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            <td className="px-4 py-2 pl-8">
                              {account.ledgerName}
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              -
                            </td>
                            <td className="px-4 py-2 text-right font-mono">
                              {formatCurrency(account.credit)}
                            </td>
                          </tr>
                        )
                      )}

                      {/* Current Liabilities Group */}
                      <tr
                        className={`border-t-2 ${
                          theme === "dark"
                            ? "border-gray-600 bg-gray-800"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <td className="px-4 py-2 font-semibold">
                          Current Liabilities
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      <tr
                        className={`border-t ${
                          theme === "dark"
                            ? "border-gray-700"
                            : "border-gray-200"
                        }`}
                      >
                        <td className="px-4 py-2 pl-8">Duties & Taxes</td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2"></td>
                      </tr>
                      {extractData.currentLiabilities.cgst > 0 && (
                        <tr
                          onClick={() => setSelectedTaxType("cgst")}
                          className={`border-t cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <td className="px-4 py-2 pl-12">14% Cgst</td>
                          <td className="px-4 py-2 text-right font-mono">-</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatCurrency(
                              extractData.currentLiabilities.cgst
                            )}
                          </td>
                        </tr>
                      )}
                      {extractData.currentLiabilities.sgst > 0 && (
                        <tr
                          onClick={() => setSelectedTaxType("sgst")}
                          className={`border-t cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <td className="px-4 py-2 pl-12">14% Sgst</td>
                          <td className="px-4 py-2 text-right font-mono">-</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatCurrency(
                              extractData.currentLiabilities.sgst
                            )}
                          </td>
                        </tr>
                      )}
                      {extractData.currentLiabilities.igst > 0 && (
                        <tr
                          onClick={() => setSelectedTaxType("igst")}
                          className={`border-t cursor-pointer transition-colors ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-100"
                          }`}
                        >
                          <td className="px-4 py-2 pl-12">IGST</td>
                          <td className="px-4 py-2 text-right font-mono">-</td>
                          <td className="px-4 py-2 text-right font-mono">
                            {formatCurrency(
                              extractData.currentLiabilities.igst
                            )}
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot
                      className={`border-t-2 ${
                        theme === "dark"
                          ? "bg-gray-700 border-gray-600"
                          : "bg-gray-100 border-gray-300"
                      }`}
                    >
                      <tr className="font-bold">
                        <td className="px-4 py-3 text-right">Grand Total :</td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(extractData.totals.grandTotal)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono">
                          {formatCurrency(extractData.totals.grandTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <div className="p-8 text-center">
                    <p className="opacity-70">
                      Click on a month to view extract data
                    </p>
                  </div>
                )}
              </div>
            )}

            {selectedView === "detailed" && (
              <table className="w-full">
                <thead
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <tr>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("voucherNo")}
                    >
                      Voucher No{" "}
                      {sortConfig.key === "voucherNo" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("date")}
                    >
                      Date{" "}
                      {sortConfig.key === "date" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("partyName")}
                    >
                      Party Name{" "}
                      {sortConfig.key === "partyName" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      Party GSTIN
                    </th>
                    <th
                      className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("taxableAmount")}
                    >
                      Taxable Amount{" "}
                      {sortConfig.key === "taxableAmount" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-4 py-3 text-right font-medium">CGST</th>
                    <th className="px-4 py-3 text-right font-medium">SGST</th>
                    <th className="px-4 py-3 text-right font-medium">IGST</th>
                    <th
                      className="px-4 py-3 text-right font-medium cursor-pointer hover:bg-opacity-75"
                      onClick={() => handleSort("netAmount")}
                    >
                      Net Amount{" "}
                      {sortConfig.key === "netAmount" &&
                        (sortConfig.direction === "asc" ? "↑" : "↓")}
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSalesData.map((sale) => (
                    <tr
                      key={sale.id}
                      className={`border-t ${
                        theme === "dark"
                          ? "border-gray-700 hover:bg-gray-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-mono text-sm">
                        {sale.voucherNo}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(sale.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium">
                        {sale.partyName}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {sale.partyGSTIN || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatCurrency(sale.taxableAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatCurrency(sale.cgstAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatCurrency(sale.sgstAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {formatCurrency(sale.igstAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono font-semibold">
                        {formatCurrency(sale.netAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            sale.status
                          )}`}
                        >
                          {sale.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewDetails(sale)}
                          className={`p-1 rounded ${
                            theme === "dark"
                              ? "hover:bg-gray-600"
                              : "hover:bg-gray-200"
                          }`}
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <tr className="font-semibold">
                    <td colSpan={4} className="px-4 py-3">
                      Total ({filteredSalesData.length} transactions)
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(summaryStats.totalTaxableAmount)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(
                        filteredSalesData.reduce(
                          (sum, sale) => sum + sale.cgstAmount,
                          0
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(
                        filteredSalesData.reduce(
                          (sum, sale) => sum + sale.sgstAmount,
                          0
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {formatCurrency(
                        filteredSalesData.reduce(
                          (sum, sale) => sum + sale.igstAmount,
                          0
                        )
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {formatCurrency(summaryStats.totalSales)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            )}

            {selectedView === "partywise" && (
              <table className="w-full">
                <thead
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Party Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium">GSTIN</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Total Tax
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Transactions
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(groupedData as PartyGroup[]).map((party, index) => (
                    <tr
                      key={index}
                      className={`border-t ${
                        theme === "dark"
                          ? "border-gray-700 hover:bg-gray-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {party.partyName}
                      </td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {party.partyGSTIN || "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(party.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(party.totalTax)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {party.transactionCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleViewPartyTransactions(party)}
                          className={`p-1 rounded ${
                            theme === "dark"
                              ? "hover:bg-gray-600"
                              : "hover:bg-gray-200"
                          }`}
                          title="View Party Transactions"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {selectedView === "itemwise" && (
              <table className="w-full">
                <thead
                  className={`${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  }`}
                >
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">
                      Item Name
                    </th>
                    <th className="px-4 py-3 text-left font-medium">
                      HSN Code
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Total Quantity
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Average Rate
                    </th>
                    <th className="px-4 py-3 text-right font-medium">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Transactions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(groupedData as ItemGroup[]).map((item, index) => (
                    <tr
                      key={index}
                      className={`border-t ${
                        theme === "dark"
                          ? "border-gray-700 hover:bg-gray-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">{item.itemName}</td>
                      <td className="px-4 py-3 font-mono text-sm">
                        {item.hsnCode}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {item.totalQuantity.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(item.averageRate)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.transactionCount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Bill-wise Sales View */}
            {selectedView === "billwise" && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-blue-50"
                  }`}
                >
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Grid3X3 size={20} className="mr-2" />
                    Bill-wise Sales Summary
                  </h3>
                  <p className="text-sm opacity-75">
                    Comprehensive view of all sales bills with individual bill
                    analysis
                  </p>
                </div>

                {/* Bill-wise Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Total Bills
                        </p>
                        <p className="text-2xl font-bold">
                          {filteredSalesData.length}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-blue-100"
                        }`}
                      >
                        <FileText size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Avg Bill Value
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            filteredSalesData.length > 0
                              ? filteredSalesData.reduce(
                                  (sum, sale) => sum + sale.netAmount,
                                  0
                                ) / filteredSalesData.length
                              : 0
                          )}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-green-100"
                        }`}
                      >
                        <TrendingUp size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Paid Bills
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {
                            filteredSalesData.filter(
                              (sale) => sale.status === "Paid"
                            ).length
                          }
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-green-100"
                        }`}
                      >
                        <DollarSign size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Pending Bills
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {
                            filteredSalesData.filter(
                              (sale) =>
                                sale.status === "Unpaid" ||
                                sale.status === "Overdue"
                            ).length
                          }
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-red-100"
                        }`}
                      >
                        <FileText size={24} className="text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <table className="w-full">
                  <thead
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Bill No.
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Party Name
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Items
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Taxable Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        GST Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Net Amount
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesData.map((sale) => (
                      <tr
                        key={sale.id}
                        className={`border-t ${
                          theme === "dark"
                            ? "border-gray-700 hover:bg-gray-700"
                            : "border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono font-medium text-blue-600">
                            {sale.voucherNo}
                          </div>
                          <div className="text-xs opacity-60">
                            {sale.voucherType}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {new Date(sale.date).toLocaleDateString("en-IN")}
                          </div>
                          <div className="text-xs opacity-60">
                            {new Date(sale.date).toLocaleDateString("en-IN", {
                              weekday: "short",
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{sale.partyName}</div>
                          {sale.partyGSTIN && (
                            <div className="text-xs font-mono opacity-60">
                              {sale.partyGSTIN}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            {sale.itemDetails.length} items
                          </div>
                          <div className="text-xs opacity-60 mt-1">
                            {sale.itemDetails.reduce(
                              (sum, item) => sum + item.quantity,
                              0
                            )}{" "}
                            qty
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono font-medium">
                            {formatCurrency(sale.taxableAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono">
                            {formatCurrency(sale.totalTaxAmount)}
                          </div>
                          <div className="text-xs opacity-60">
                            {(
                              (sale.totalTaxAmount / sale.taxableAmount) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="font-mono font-bold text-lg">
                            {formatCurrency(sale.netAmount)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              sale.status === "Paid"
                                ? "bg-green-100 text-green-800"
                                : sale.status === "Overdue"
                                ? "bg-red-100 text-red-800"
                                : sale.status === "Partially Paid"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {sale.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(sale)}
                              className={`p-1 rounded ${
                                theme === "dark"
                                  ? "hover:bg-gray-600"
                                  : "hover:bg-gray-200"
                              }`}
                              title="View Bill Details"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              className={`p-1 rounded ${
                                theme === "dark"
                                  ? "hover:bg-gray-600"
                                  : "hover:bg-gray-200"
                              }`}
                              title="Print Bill"
                            >
                              <Printer size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Bill Wise Profit View */}
            {selectedView === "billwiseprofit" && (
              <div className="space-y-4">
                <div
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-blue-50"
                  }`}
                >
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <TrendingUp size={20} className="mr-2" />
                    Bill Wise Profit Analysis
                  </h3>
                  <p className="text-sm opacity-75">
                    Detailed profit analysis for each sales bill including cost
                    analysis and margin calculations
                  </p>
                </div>

                {/* Profit Analysis Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Total Sales
                        </p>
                        <p className="text-2xl font-bold">
                          {formatCurrency(
                            filteredSalesData.reduce(
                              (sum, sale) => sum + sale.netAmount,
                              0
                            )
                          )}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-blue-100"
                        }`}
                      >
                        <DollarSign size={24} className="text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Total Cost
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {formatCurrency(
                            filteredSalesData.reduce((sum, sale) => {
                              const costAmount = sale.itemDetails.reduce(
                                (itemSum, item) => itemSum + item.amount * 0.7,
                                0
                              );
                              return sum + costAmount;
                            }, 0)
                          )}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-red-100"
                        }`}
                      >
                        <Package size={24} className="text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Gross Profit
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalSales = filteredSalesData.reduce(
                              (sum, sale) => sum + sale.netAmount,
                              0
                            );
                            const totalCost = filteredSalesData.reduce(
                              (sum, sale) => {
                                const costAmount = sale.itemDetails.reduce(
                                  (itemSum, item) =>
                                    itemSum + item.amount * 0.7,
                                  0
                                );
                                return sum + costAmount;
                              },
                              0
                            );
                            return formatCurrency(totalSales - totalCost);
                          })()}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-green-100"
                        }`}
                      >
                        <TrendingUp size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg ${
                      theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium opacity-75">
                          Avg Profit %
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalSales = filteredSalesData.reduce(
                              (sum, sale) => sum + sale.netAmount,
                              0
                            );
                            const totalCost = filteredSalesData.reduce(
                              (sum, sale) => {
                                const costAmount = sale.itemDetails.reduce(
                                  (itemSum, item) =>
                                    itemSum + item.amount * 0.7,
                                  0
                                );
                                return sum + costAmount;
                              },
                              0
                            );
                            const profitPercentage =
                              totalSales > 0
                                ? ((totalSales - totalCost) / totalSales) * 100
                                : 0;
                            return profitPercentage.toFixed(1) + "%";
                          })()}
                        </p>
                      </div>
                      <div
                        className={`p-3 rounded-full ${
                          theme === "dark" ? "bg-gray-600" : "bg-green-100"
                        }`}
                      >
                        <BarChart3 size={24} className="text-green-600" />
                      </div>
                    </div>
                  </div>
                </div>

                <table className="w-full">
                  <thead
                    className={`${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Bill No.
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Party Name
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Sales Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Cost Amount
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Gross Profit
                      </th>
                      <th className="px-4 py-3 text-right font-medium">
                        Profit %
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesData.map((sale) => {
                      // Calculate profit data for each bill
                      const salesAmount = sale.netAmount;
                      const costAmount = sale.itemDetails.reduce(
                        (sum, item) => {
                          // Mock cost calculation - in real scenario, this would come from purchase/cost data
                          const estimatedCost = item.amount * 0.7; // Assuming 70% cost ratio
                          return sum + estimatedCost;
                        },
                        0
                      );
                      const grossProfit = salesAmount - costAmount;
                      const profitPercentage =
                        salesAmount > 0 ? (grossProfit / salesAmount) * 100 : 0;

                      return (
                        <tr
                          key={sale.id}
                          className={`border-t ${
                            theme === "dark"
                              ? "border-gray-700 hover:bg-gray-700"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="font-mono font-medium text-blue-600">
                              {sale.voucherNo}
                            </div>
                            <div className="text-xs opacity-60">
                              {sale.voucherType}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">
                              {new Date(sale.date).toLocaleDateString("en-IN")}
                            </div>
                            <div className="text-xs opacity-60">
                              {new Date(sale.date).toLocaleDateString("en-IN", {
                                weekday: "short",
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{sale.partyName}</div>
                            {sale.partyGSTIN && (
                              <div className="text-xs font-mono opacity-60">
                                {sale.partyGSTIN}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-mono font-medium">
                              {formatCurrency(salesAmount)}
                            </div>
                            <div className="text-xs opacity-60">
                              {sale.itemDetails.length} items
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-mono text-red-600">
                              {formatCurrency(costAmount)}
                            </div>
                            <div className="text-xs opacity-60">Est. Cost</div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div
                              className={`font-mono font-bold ${
                                grossProfit >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {formatCurrency(grossProfit)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div
                              className={`font-mono font-bold text-lg ${
                                profitPercentage >= 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {profitPercentage.toFixed(1)}%
                            </div>
                            <div className="text-xs opacity-60">Margin</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                profitPercentage >= 25
                                  ? "bg-green-100 text-green-800"
                                  : profitPercentage >= 15
                                  ? "bg-yellow-100 text-yellow-800"
                                  : profitPercentage >= 0
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {profitPercentage >= 25
                                ? "High"
                                : profitPercentage >= 15
                                ? "Good"
                                : profitPercentage >= 0
                                ? "Low"
                                : "Loss"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => handleViewDetails(sale)}
                                className={`p-1 rounded ${
                                  theme === "dark"
                                    ? "hover:bg-gray-600"
                                    : "hover:bg-gray-200"
                                }`}
                                title="View Profit Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleProfitAnalysis(sale)}
                                className={`p-1 rounded ${
                                  theme === "dark"
                                    ? "hover:bg-gray-600"
                                    : "hover:bg-gray-200"
                                }`}
                                title="Detailed Profit Analysis"
                              >
                                <TrendingUp size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Profit Analysis Chart Placeholder */}
                <div
                  className={`p-6 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-white shadow"
                  }`}
                >
                  <h4 className="text-lg font-semibold mb-4">
                    Profit Trend Analysis
                  </h4>
                  <div
                    className={`h-64 flex items-center justify-center border-2 border-dashed rounded-lg ${
                      theme === "dark" ? "border-gray-600" : "border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <BarChart3
                        size={48}
                        className="mx-auto mb-2 opacity-50"
                      />
                      <p className="text-sm opacity-75">
                        Profit trend chart will be displayed here
                      </p>
                      <p className="text-xs opacity-50 mt-1">
                        Integration with charting library pending
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div
          className={`mt-4 p-3 rounded ${
            theme === "dark" ? "bg-gray-800" : "bg-gray-100"
          }`}
        >
          <p className="text-sm text-center opacity-70">
            Showing {filteredSalesData.length} of {salesData.length} sales
            transactions
            {filters.dateRange !== "custom" &&
              ` for ${filters.dateRange.replace("-", " ")}`}
          </p>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`p-6 border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Extract Sales Details</h2>
                <button
                  onClick={closeModal}
                  className={`p-2 rounded-md ${
                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                  }`}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Transaction Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Voucher No:</span>
                      <span className="font-mono">
                        {selectedSale.voucherNo}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Date:</span>
                      <span>
                        {new Date(selectedSale.date).toLocaleDateString(
                          "en-IN"
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Type:</span>
                      <span>{selectedSale.voucherType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          selectedSale.status
                        )}`}
                      >
                        {selectedSale.status}
                      </span>
                    </div>
                    {selectedSale.reference && (
                      <div className="flex justify-between">
                        <span className="font-medium">Reference:</span>
                        <span>{selectedSale.reference}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    Party Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Party Name:</span>
                      <span>{selectedSale.partyName}</span>
                    </div>
                    {selectedSale.partyGSTIN && (
                      <div className="flex justify-between">
                        <span className="font-medium">GSTIN:</span>
                        <span className="font-mono">
                          {selectedSale.partyGSTIN}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Amount Breakdown</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div
                    className={`p-3 rounded ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <div className="text-sm opacity-70">Taxable Amount</div>
                    <div className="font-mono font-semibold">
                      {formatCurrency(selectedSale.taxableAmount)}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <div className="text-sm opacity-70">CGST</div>
                    <div className="font-mono font-semibold">
                      {formatCurrency(selectedSale.cgstAmount)}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <div className="text-sm opacity-70">SGST</div>
                    <div className="font-mono font-semibold">
                      {formatCurrency(selectedSale.sgstAmount)}
                    </div>
                  </div>
                  <div
                    className={`p-3 rounded ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    <div className="text-sm opacity-70">IGST</div>
                    <div className="font-mono font-semibold">
                      {formatCurrency(selectedSale.igstAmount)}
                    </div>
                  </div>
                </div>
                <div
                  className={`mt-4 p-4 rounded border-2 ${
                    theme === "dark"
                      ? "bg-gray-700 border-green-600"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Net Amount:</span>
                    <span className="text-xl font-bold text-green-600">
                      {formatCurrency(selectedSale.netAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Item Details */}
              {selectedSale.itemDetails.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Item Details</h3>
                  <div className="overflow-x-auto">
                    <table
                      className={`w-full border rounded ${
                        theme === "dark" ? "border-gray-600" : "border-gray-300"
                      }`}
                    >
                      <thead
                        className={`${
                          theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                        }`}
                      >
                        <tr>
                          <th className="px-3 py-2 text-left">Item Name</th>
                          <th className="px-3 py-2 text-left">HSN Code</th>
                          <th className="px-3 py-2 text-right">Quantity</th>
                          <th className="px-3 py-2 text-right">Rate</th>
                          <th className="px-3 py-2 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSale.itemDetails.map((item, index) => (
                          <tr
                            key={index}
                            className={`border-t ${
                              theme === "dark"
                                ? "border-gray-600"
                                : "border-gray-300"
                            }`}
                          >
                            <td className="px-3 py-2">{item.itemName}</td>
                            <td className="px-3 py-2 font-mono text-sm">
                              {item.hsnCode}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {item.quantity}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {formatCurrency(item.rate)}
                            </td>
                            <td className="px-3 py-2 text-right font-mono">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Narration */}
              {selectedSale.narration && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Narration</h3>
                  <div
                    className={`p-3 rounded ${
                      theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                    }`}
                  >
                    {selectedSale.narration}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtractSales;
