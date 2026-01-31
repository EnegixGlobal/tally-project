import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { ArrowLeft, Printer, Download, Filter } from "lucide-react";

// Interfaces copied from your structure
interface Ledger {
  id: number;
  name: string;
  groupId: number;
  openingBalance: number;
  balanceType: "debit" | "credit";
  groupName: string;
  groupType: string | null;
}

interface LedgerGroup {
  id: number;
  name: string;
  type: string | null;
}

const BalanceSheet: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debitCreditData, setDebitCreditData] = useState<Record<number, { debit: number; credit: number }>>({});

  const companyId = localStorage.getItem("company_id") || "";
  const ownerType = localStorage.getItem("supplier") || "";
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${import.meta.env.VITE_API_URL
          }/api/balance-sheet?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load balance sheet data");
        const data = await res.json();
        // ... rest remains unchanged
        const normalizedLedgers = data.ledgers.map((l: any) => ({
          id: l.id,
          name: l.name,
          groupId: l.group_id,
          openingBalance: parseFloat(l.opening_balance) || 0,
          balanceType: l.balance_type,
          groupName: l.group_name,
          groupType: l.group_type,
        }));
        setLedgers(normalizedLedgers);
        setLedgerGroups(data.ledgerGroups);
      } catch (err: any) {
        setError(err.message || "Unknown error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId, ownerType, ownerId]);

  // calculate total balance
  const [calculatedTotal, setCalculatedTotal] = useState({
    CapitalAccount: 0,
    Loans: 0,
    CurrentLiabilities: 0,
    FixedAssets: 0,
    CurrentAssets: 0,
    LaiblityTotal: 0,
    AssetTotal: 0,
  });

  useEffect(() => {
    // Calculate totals using closing balances
    const capitalTotal = calculateGroupTotal(-4);
    const loanLability = calculateGroupTotal(-13);
    const currentLiability = calculateGroupTotal(-6);
    const fixedAssets = calculateGroupTotal(-9);
    const CurrentAssets = calculateGroupTotal(-5);

    setCalculatedTotal({
      CapitalAccount: capitalTotal,
      Loans: loanLability,
      CurrentLiabilities: currentLiability,
      FixedAssets: fixedAssets,
      CurrentAssets: CurrentAssets,
      LaiblityTotal: capitalTotal + loanLability + currentLiability,
      AssetTotal: fixedAssets + CurrentAssets,
    });
  }, [ledgers, debitCreditData]);

  // Fetch debit/credit data for all ledgers to calculate closing balances
  useEffect(() => {
    const fetchDebitCreditData = async () => {
      if (!companyId || !ownerType || !ownerId || ledgers.length === 0) {
        return;
      }

      try {
        const ledgerIds = ledgers.map((l) => l.id).join(",");
        const url = `${import.meta.env.VITE_API_URL}/api/group` +
          `?company_id=${companyId}` +
          `&owner_type=${ownerType}` +
          `&owner_id=${ownerId}` +
          `&ledgerIds=${ledgerIds}`;

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load debit/credit data");
        const data = await res.json();

        if (data.success && data.data) {
          setDebitCreditData(data.data);
        }
      } catch (err) {
        console.error("Error fetching debit/credit data:", err);
      }
    };

    fetchDebitCreditData();
  }, [ledgers, companyId, ownerType, ownerId]);

  // Calculate closing balance for a ledger
  const calculateClosingBalance = (ledger: Ledger): number => {
    const opening = Number(ledger.openingBalance) || 0;
    const debit = debitCreditData[ledger.id]?.debit || 0;
    const credit = debitCreditData[ledger.id]?.credit || 0;

    if (ledger.balanceType === "debit") {
      return opening + debit - credit;
    } else {
      return opening + credit - debit;
    }
  };

  // Calculate group total with closing balances
  const calculateGroupTotal = (groupId: number): number => {
    const groupLedgers = ledgers.filter((l) => Number(l.groupId) === groupId);
    return groupLedgers.reduce((sum, ledger) => {
      const closing = calculateClosingBalance(ledger);
      return sum + Math.abs(closing);
    }, 0);
  };

  // Navigation handlers
  const handleGroupClick = (groupType: number) => {
    navigate(`/app/reports/group-summary/${groupType}`);
  };

  const handleProfitLossClick = () => {
    navigate("/app/reports/profit-loss");
  };

  // const handleStockClick = () => {
  //   navigate('/app/reports/stock-summary');
  // };



  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => navigate("/app/reports")}
          className={`mr-4 p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          disabled={loading}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Balance Sheet</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Toggle Filters"
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            disabled={loading}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print Report"
            type="button"
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Download Report"
            type="button"
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
            }`}
        >
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-1"
                htmlFor="filter-date"
              >
                As on Date
              </label>
              <input
                id="filter-date"
                title="Select Date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                className={`w-full p-2 rounded border ${theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                  }`}
                disabled={loading}
              />
            </div>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <div className=" flex gap-5">
            {/* Liabilities Section */}
            <div
              className={`p-6 rounded-lg w-1/2 ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                }`}
            >
              <h2 className="mb-4 text-xl font-bold text-center">
                Liabilities
              </h2>

              {/* Header */}
              <div className="grid grid-cols-3 gap-2 pb-2 border-b-2 border-gray-400 dark:border-gray-500 font-semibold text-sm">
                <div>Particulars</div>

                <div className="text-right">Closing</div>
              </div>

              <div className="space-y-1 mt-2">
                {/* Capital Account */}
                <div
                  className={`grid grid-cols-3 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  onClick={() => handleGroupClick(-4)}
                >
                  <span className="text-blue-600 dark:text-blue-400 underline">
                    Capital Account
                  </span>
                  <span className="text-right font-mono">
                    {calculatedTotal.CapitalAccount.toLocaleString()}
                  </span>
                </div>

                {/* Loans */}
                <div
                  className={`grid grid-cols-3 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  onClick={() => handleGroupClick(-13)}
                >
                  <span className="text-blue-600 dark:text-blue-400 underline">
                    Loans (Liability)
                  </span>
                  <span className="text-right font-mono">
                    {calculatedTotal.Loans.toLocaleString()}
                  </span>
                </div>

                {/* Current Liabilities */}
                <div
                  className={`grid grid-cols-3 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  onClick={() => handleGroupClick(-6)}
                >
                  <span className="text-blue-600 dark:text-blue-400 underline">
                    Current Liabilities
                  </span>
                  <span className="text-right font-mono">
                    {calculatedTotal.CurrentLiabilities.toLocaleString()}
                  </span>
                </div>

                {/* Profit & Loss */}
                <div
                  className={`grid grid-cols-3 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  onClick={handleProfitLossClick}
                >
                  <span className="text-blue-600 dark:text-blue-400 underline">
                    Profit & Loss A/c
                  </span>
                  <span className="text-right font-mono">0</span>
                </div>

                {/* Total */}
                <div className="grid grid-cols-3 gap-2 py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500 mt-2">
                  <span>Total Liabilities</span>
                  <span className="text-right font-mono">
                    {calculatedTotal.LaiblityTotal}
                  </span>
                </div>
              </div>
            </div>

            {/* Assets Section */}
            <div
              className={`p-6 rounded-lg w-1/2 ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                }`}
            >
              <h2 className="mb-4 text-xl font-bold text-center">Assets</h2>

              {/* Header */}
              <div className="grid grid-cols-3 gap-2 pb-2 border-b-2 border-gray-400 dark:border-gray-500 font-semibold text-sm">
                <div>Particulars</div>
                <div className="text-right">Closing</div>
              </div>

              <div className="space-y-1 mt-2">
                {/* Fixed Assets */}
                <div
                  className={`grid grid-cols-3 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  onClick={() => handleGroupClick(-9)}
                  title="Click to view Fixed Assets details"
                >
                  <span className="text-blue-600 dark:text-blue-400 underline">
                    Fixed Assets
                  </span>
                  <span className="text-right font-mono">
                    {calculatedTotal.FixedAssets.toLocaleString()}
                  </span>
                </div>

                {/* Current Assets */}
                <div
                  className={`grid grid-cols-3 gap-2 py-2 border-b border-gray-300 dark:border-gray-600 cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    }`}
                  onClick={() => handleGroupClick(-5)}
                  title="Click to view Current Assets details"
                >
                  <span className="text-blue-600 dark:text-blue-400 underline">
                    Current Assets
                  </span>
                  <span className="text-right font-mono">
                    {calculatedTotal.CurrentAssets.toLocaleString()}
                  </span>
                </div>

                {/* Total Assets */}
                <div className="grid grid-cols-3 gap-2 py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500 mt-2">
                  <span>Total Assets</span>
                  <span className="text-right font-mono">
                    {calculatedTotal.AssetTotal}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Verification Section */}
          <div
            className={`mt-6 p-6 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
          >
            <div className="text-center">
              <h2 className="mb-4 text-xl font-bold">Balance Verification</h2>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="col-span-2">
                  <p className="text-sm opacity-75">Total Assets (Opening)</p>
                  <p className="text-xl font-bold">
                    {calculatedTotal.AssetTotal}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm opacity-75">Total Assets (Closing)</p>
                  <p className="text-xl font-bold">
                    ₹ {calculatedTotal.AssetTotal}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm opacity-75">
                    Total Liabilities (Opening)
                  </p>
                  <p className="text-xl font-bold">
                    ₹ {calculatedTotal.LaiblityTotal}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-sm opacity-75">
                    Total Liabilities (Closing)
                  </p>
                  <p className="text-xl font-bold">
                    ₹ {calculatedTotal.LaiblityTotal}
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* Footer / Pro Tips */}
          <div
            className={`mt-6 p-4 rounded ${theme === "dark" ? "bg-gray-800" : "bg-blue-50"
              }`}
          >
            <p className="text-sm">
              <span className="font-semibold">Navigation:</span> Click on Loans,
              Current Liabilities, or Current Assets to view group details.
              Click on Profit & Loss A/c to view P&L statement.
            </p>
            <p className="text-sm mt-1">
              <span className="font-semibold">Pro Tip:</span> Press F5 to
              refresh, F12 to configure display options.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default BalanceSheet;
