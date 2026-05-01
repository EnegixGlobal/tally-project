import React, { useState, useEffect, useMemo } from "react";
import { useAppContext } from "../../../context/AppContext";
import { Search, Eye, Folder, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ReportItem {
  id: number;
  name: string;
  entry_type: "group" | "ledger";
  closing_balance: string | number;
  balance_type: string;
  parent?: number;
  group_id?: number;
}

const OutstandingReceivables: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOutstandingData = async () => {
      setLoading(true);
      setError(null);

      const companyId = localStorage.getItem("company_id");
      const ownerType = localStorage.getItem("supplier");
      const ownerId = localStorage.getItem(
        ownerType === "employee" ? "employee_id" : "user_id"
      );

      if (!companyId || !ownerType || !ownerId) {
        setError("Missing tenant information.");
        setLoading(false);
        return;
      }

      try {
        const apiUrl = import.meta.env.VITE_API_URL || "";
        const url = `${apiUrl}/api/outstanding-receivables?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const jsonData = await response.json();
        setData(Array.isArray(jsonData) ? jsonData : []);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchOutstandingData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const lc = searchTerm.toLowerCase();
    return data.filter((item) => item.name.toLowerCase().includes(lc));
  }, [data, searchTerm]);

  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(Number(amount));

  return (
    <div className="space-y-6">
      <div
        className={`rounded-xl border p-6 ${
          theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              Receivables Outstanding
            </h2>
            <p className={`mt-1 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
              Subgroups and Ledgers under Sundry Debtors (-110)
            </p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`pl-10 pr-4 py-2 border rounded-lg w-full max-w-md ${
              theme === "dark"
                ? "bg-gray-700 border-gray-600 text-white"
                : "bg-white border-gray-300 text-gray-900"
            }`}
          />
        </div>

        {loading && (
          <div className="text-center py-8 text-gray-500">Loading data...</div>
        )}

        {error && (
          <div className="text-center py-8 text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left">
              <thead className={`${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
                <tr>
                  <th className="px-6 py-4 text-sm font-semibold">Name</th>
                  <th className="px-6 py-4 text-sm font-semibold">Type</th>
                  <th className="px-6 py-4 text-sm font-semibold text-right">Closing Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr
                      key={`${item.entry_type}-${item.id}`}
                      className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer`}
                      onClick={() => {
                        if (item.entry_type === "ledger") {
                          navigate(`/app/reports/ledger/${item.id}`);
                        }
                      }}
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        {item.entry_type === "group" ? (
                          <Folder className="w-5 h-5 text-amber-500 fill-amber-500" />
                        ) : (
                          <User className="w-5 h-5 text-blue-500" />
                        )}
                        <span className="font-medium">{item.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            item.entry_type === "group"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          }`}
                        >
                          {item.entry_type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-semibold">
                          {formatCurrency(item.closing_balance || 0)}
                          <span className="ml-1 text-xs font-normal text-gray-500 uppercase">
                            {item.balance_type}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500 italic">
                      No data found under Sundry Debtors.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutstandingReceivables;
