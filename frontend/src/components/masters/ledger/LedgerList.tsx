import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, Plus, Search, ArrowLeft } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import type { Ledger, LedgerGroup } from "../../../types";
import { formatGSTNumber } from "../../../utils/ledgerUtils";
import Swal from "sweetalert2";

const LedgerList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "b2b" | "b2c">(
    "all"
  );
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  // const ownerType = localStorage.getItem('userType') || localStorage.getItem('userType');
  useEffect(() => {
    const fetchData = async () => {
      try {
        const companyId =
          localStorage.getItem("company_id") ||
          localStorage.getItem("company_id");
        const ownerType =
          localStorage.getItem("supplier") || localStorage.getItem("supplier");
        const ownerId =
          ownerType === "employee"
            ? localStorage.getItem("employee_id") ||
              localStorage.getItem("employee_id")
            : localStorage.getItem("user_id") ||
              localStorage.getItem("user_id");

        if (!companyId || !ownerType || !ownerId) {
          console.error("Missing required identifiers for ledger GET");
          setLedgers([]);
          return;
        }

        // Fetch ledgers scoped to company & owner
        const ledgerRes = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const ledgerData = await ledgerRes.json();

        if (ledgerRes.ok) {
          setLedgers(Array.isArray(ledgerData) ? ledgerData : []);
        } else {
          console.error(ledgerData.message || "Failed to fetch ledgers");
          setLedgers([]);
        }

        // Fetch ledger groups (no scoping in your current backend — optional to scope later)
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

  const getGroupName = (groupId: string): string => {
    const group = ledgerGroups.find((g) => g.id === groupId);
    return group ? group.name : "Unknown Group";
  };

  const filteredLedgers = Array.isArray(ledgers)
    ? ledgers.filter((ledger) => {
        const matchesSearch = ledger.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesCategory =
          categoryFilter === "all" ||
          (categoryFilter === "b2b" &&
            ledger.gstNumber &&
            ledger.gstNumber.trim().length > 0) ||
          (categoryFilter === "b2c" &&
            (!ledger.gstNumber || ledger.gstNumber.trim().length === 0));
        return matchesSearch && matchesCategory;
      })
    : [];

  const handleDelete = async (id: string | number) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "This ledger will be permanently deleted!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Yes, Delete",
  });

  if (!result.isConfirmed) return;

  try {
    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("supplier");
    const ownerId = localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    );

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/ledger/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
      { method: "DELETE" }
    );

    const data = await res.json();

    if (res.ok) {
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: data.message,
        timer: 1600,
        showConfirmButton: false,
      });

      // Refresh list (agar list page pe ho)
      setTimeout(() => window.location.reload(), 1000);
    } else {
      Swal.fire("Error", data.message || "Failed to delete ledger!", "error");
    }
  } catch (err) {
    Swal.fire("Network Error", "Unable to connect to server", "error");
    console.error("Delete error:", err);
  }
};


  return (
    <>
      <div className="pt-[56px] px-4 ">
        {/* header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center mb-6">
            <button
              title="Back to Group List"
              onClick={() => navigate("/app/masters")}
              className={`mr-4 p-2 rounded-full ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <h1
              className={`text-2xl font-bold ${
                theme === "dark" ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Ledger List
            </h1>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => navigate("/app/masters/ledger/bulk-create")}
              className={`flex items-center px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-green-600 hover:bg-green-700 text-white"
                  : "bg-green-600 hover:bg-green-700 text-white"
              }`}
            >
              <Plus size={18} className="mr-1" />
              Bulk Create
            </button>
            <button
              type="button"
              onClick={() => navigate("/app/masters/ledger/create")}
              className={`flex items-center px-4 py-2 rounded ${
                theme === "dark"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              <Plus size={18} className="mr-1" />
              Create Ledger
            </button>
          </div>
        </div>

        {/* table */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            {/* filters */}
            <div className="flex items-center space-x-4">
              <div
                className={`flex items-center max-w-md px-3 py-2 rounded-md ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-100"
                }`}
              >
                <Search size={18} className="mr-2 opacity-70" />
                <input
                  type="text"
                  placeholder="Search ledgers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full bg-transparent border-none outline-none ${
                    theme === "dark"
                      ? "placeholder-gray-500"
                      : "placeholder-gray-400"
                  }`}
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) =>
                  setCategoryFilter(e.target.value as "all" | "b2b" | "b2c")
                }
                className={`px-3 py-2 rounded-md border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="all">All Ledgers</option>
                <option value="b2b">B2B (With GST)</option>
                <option value="b2c">B2C (Without GST)</option>
              </select>
            </div>

            {/* stats */}
            <div className="flex items-center space-x-4 text-sm">
              <span
                className={`${
                  theme === "dark"
                    ? "bg-blue-900 text-blue-200"
                    : "bg-blue-100 text-blue-800"
                } px-2 py-1 rounded`}
              >
                B2B:{" "}
                {
                  ledgers.filter(
                    (l) => l.gstNumber && l.gstNumber.trim().length > 0
                  ).length
                }
              </span>
              <span
                className={`${
                  theme === "dark"
                    ? "bg-purple-900 text-purple-200"
                    : "bg-purple-100 text-purple-800"
                } px-2 py-1 rounded`}
              >
                B2C:{" "}
                {
                  ledgers.filter(
                    (l) => !l.gstNumber || l.gstNumber.trim().length === 0
                  ).length
                }
              </span>
            </div>
          </div>

          {/* list */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Under Group</th>
                  <th className="px-4 py-3 text-left">GST Number</th>
                  <th className="px-4 py-3 text-right">Opening Balance</th>
                  <th className="px-4 py-3 text-center">Type</th>
                  <th className="px-4 py-3 text-center">GST/Category</th>

                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedgers.map((ledger) => (
                  <tr
                    key={ledger.id}
                    className={`hover:bg-opacity-10 hover:bg-blue-500 ${
                      theme === "dark"
                        ? "border-b border-gray-700"
                        : "border-b border-gray-200"
                    }`}
                  >
                    <td className="px-4 py-3">{ledger.name}</td>
                    <td className="px-4 py-3">
                      {getGroupName(ledger.groupId)}
                    </td>
                    <td className="px-4 py-3">{ledger.gstNumber}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {ledger.openingBalance}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          ledger.balanceType === "debit"
                            ? theme === "dark"
                              ? "bg-red-900 text-red-200"
                              : "bg-red-100 text-red-800"
                            : theme === "dark"
                            ? "bg-green-900 text-green-200"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {ledger.balanceType?.toUpperCase() || "N/A"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ledger.gstNumber ? (
                        <>
                          <span
                            className={`${
                              theme === "dark"
                                ? "bg-blue-900 text-blue-200"
                                : "bg-blue-100 text-blue-800"
                            } px-2 py-1 rounded text-xs font-medium`}
                          >
                            B2B
                          </span>
                          <div className="text-xs text-gray-500 font-mono">
                            {formatGSTNumber(ledger.gstNumber)}
                          </div>
                        </>
                      ) : (
                        <span
                          className={`${
                            theme === "dark"
                              ? "bg-purple-900 text-purple-200"
                              : "bg-purple-100 text-purple-800"
                          } px-2 py-1 rounded text-xs font-medium`}
                        >
                          B2C
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={() =>
                            navigate(`/app/masters/ledger/edit/${ledger.id}`)
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
                          onClick={() => handleDelete(ledger.id)}
                          className={`p-1 rounded ${
                            theme === "dark"
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

          {filteredLedgers.length === 0 && (
            <div className="text-center py-8">
              <p className="opacity-70">
                No ledgers found matching your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LedgerList;
