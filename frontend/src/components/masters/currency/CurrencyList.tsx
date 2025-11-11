import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import Swal from "sweetalert2";

interface Currency {
  id: number;
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number;
  isBase: boolean;
}

const CurrencyList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState(true);
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("userType"); // e.g., 'employee' or 'user'
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  console.log(companyId, "companyId")
  console.log(ownerType, "ownerType")
  console.log(ownerId, "ownerId")
  useEffect(() => {
    if ( !ownerType || !ownerId) {
      setLoading(false);
      return; // Or handle error appropriately
    }

    fetch(
      `http://localhost:5000/api/currencies?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
    )
      .then((res) => res.json())
      .then((data) => {
        setCurrencies(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching currencies:", error);
        setLoading(false);
      });
  }, [companyId, ownerType, ownerId]);

  const handleDelete = async (currencyId: number) => {
    if (!window.confirm("Are you sure you want to delete this currency?"))
      return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/currencies/${currencyId}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json();
      if (res.ok) {
        Swal.fire("Deleted!", data.message, "success");
        // Remove the deleted currency from state
        setCurrencies((prev) => prev.filter((c) => c.id !== currencyId));
      } else {
        Swal.fire("Error", data.message || "Failed to delete", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire("Error", "Something went wrong!", "error");
    }
  };

  const filteredCurrencies = currencies.filter(
    (currency) =>
      currency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      currency.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-[56px] px-4 ">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Currency List</h1>

        <button
          title="Create New Currency"
          onClick={() => navigate("/app/masters/currency/create")}
          className={`flex items-center px-4 py-2 rounded ${
            theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Plus size={18} className="mr-1" />
          Create Currency
        </button>
      </div>

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <div className="flex items-center mb-4">
          <div
            className={`flex items-center w-full max-w-md px-3 py-2 rounded-md ${
              theme === "dark" ? "bg-gray-700" : "bg-gray-100"
            }`}
          >
            <Search size={18} className="mr-2 opacity-70" />
            <input
              type="text"
              placeholder="Search currencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-transparent border-none outline-none ${
                theme === "dark"
                  ? "placeholder-gray-500"
                  : "placeholder-gray-400"
              }`}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading currencies...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr
                    className={`${
                      theme === "dark"
                        ? "border-b border-gray-700"
                        : "border-b border-gray-200"
                    }`}
                  >
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Symbol</th>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-right">Exchange Rate</th>
                    <th className="px-4 py-3 text-center">Base</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCurrencies.map((currency) => (
                    <tr
                      key={currency.id}
                      className={`${
                        theme === "dark"
                          ? "border-b border-gray-700"
                          : "border-b border-gray-200"
                      } hover:bg-opacity-10 hover:bg-blue-500`}
                    >
                      <td className="px-4 py-3 font-mono">{currency.code}</td>
                      <td className="px-4 py-3">{currency.symbol}</td>
                      <td className="px-4 py-3">{currency.name}</td>
                      <td className="px-4 py-3 text-right font-mono">
                        {currency.exchangeRate}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {currency.isBase && (
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              theme === "dark"
                                ? "bg-green-900 text-green-200"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            Base
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2">
                          <button
                            title="Edit Currency"
                            onClick={() =>
                              navigate(
                                `/app/masters/currency/edit/${currency.id}`
                              )
                            }
                            className={`p-1 rounded ${
                              theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            title="Delete Currency"
                            disabled={currency.isBase}
                            onClick={() => handleDelete(currency.id)}
                            className={`p-1 rounded ${
                              currency.isBase
                                ? "opacity-50 cursor-not-allowed"
                                : theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredCurrencies.length === 0 && (
              <div className="text-center py-8">
                <p className="opacity-70">
                  No currencies found matching your search.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press Alt+F3 to access
          Masters, then use arrow keys to navigate to Currency.
        </p>
      </div>
    </div>
  );
};

export default CurrencyList;
