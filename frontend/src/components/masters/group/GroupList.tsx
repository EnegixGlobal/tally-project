import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useAuth } from "../../../home/context/AuthContext";
import { useNavigate } from "react-router-dom";
import type { LedgerGroup, GstClassification } from "../../../types";
import { Edit, Trash2, Plus, Search, ArrowLeft, Settings } from "lucide-react";
import { apiFetch } from "../../../utils/apiFetch";
import Swal from "sweetalert2";

const GroupList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState<LedgerGroup[]>([]);
  const [gstClassifications] = useState<GstClassification[]>([]);
  const { user, companyId: authCompanyId } = useAuth();
  const [del, setDel] = useState(false);

  const baseGroups = [
    { id: -1, name: "Bank Accounts", nature: "Assets", isSystem: true },
    { id: -2, name: "Bank OD A/c", nature: "Assets", isSystem: true },
    { id: -3, name: "Branch/Division", nature: "Assets", isSystem: true },
    { id: -4, name: "Capital Account", nature: "Liabilities", isSystem: true },
    { id: -5, name: "Current Assets", nature: "Assets", isSystem: true },
    {
      id: -6,
      name: "Current Liabilities",
      nature: "Liabilities",
      isSystem: true,
    },
    { id: -7, name: "Direct Expenses", nature: "Expenses", isSystem: true },
    { id: -8, name: "Direct Income", nature: "Income", isSystem: true },
    { id: -9, name: "Fixed Assets", nature: "Assets", isSystem: true },
    { id: -10, name: "Indirect Expenses", nature: "Expenses", isSystem: true },
    { id: -11, name: "Indirect Income", nature: "Income", isSystem: true },
    { id: -12, name: "Investments", nature: "Assets", isSystem: true },
    { id: -13, name: "Loan(Liability)", nature: "Liabilities", isSystem: true },
    {
      id: -14,
      name: "Misc expenses (Assets)",
      nature: "Assets",
      isSystem: true,
    },
    { id: -15, name: "Purchase Accounts", nature: "Expenses", isSystem: true },
    { id: -16, name: "Sales Accounts", nature: "Income", isSystem: true },
    { id: -17, name: "Suspense A/C", nature: "Assets", isSystem: true },
    { id: -18, name: "Profit/Loss", nature: "Liabilities", isSystem: true },
    { id: -19, name: "TDS Payables", nature: "Liabilities", isSystem: true },
  ];

  // prefer AuthContext values, fall back to localStorage
  const companyId = authCompanyId ?? localStorage.getItem("company_id");
  let ownerType = localStorage.getItem("supplier");
  if (!ownerType) {
    ownerType = localStorage.getItem("employee_id") ? "employee" : "user";
  }
  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) ??
    user?.id ??
    null;

  useEffect(() => {
    const fetchLedgerGroups = async () => {
      if (!companyId || !ownerType || !ownerId) {
        setGroups([]);
        return;
      }

      try {
        const data = await apiFetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/ledger-groups?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        setGroups([...baseGroups, ...data]);
      } catch (err) {
        console.error("Failed to load ledger groups", err);
      }
    };

    fetchLedgerGroups();
  }, [companyId, ownerType, ownerId]);

  const handleDelete = async (id: string) => {
    const group = groups.find((g) => g.id === id);

    // 🚫 SYSTEM GROUP DELETE BLOCK
    if (group?.isSystem) {
      Swal.fire({
        icon: "warning",
        title: "Not Allowed",
        text: "System groups cannot be deleted.",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This group will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it",
    });

    if (!result.isConfirmed) return;

    Swal.fire({
      title: "Deleting...",
      text: "Please wait",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/ledger-groups/${id}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (res.ok) {
        setGroups((prev) => prev.filter((g) => g.id !== id));

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: data.message || "Group deleted successfully",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: data.message || "Unable to delete group",
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong!",
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const firstDbGroup = groups.find((g) => !g.isSystem);

    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();
      navigate("/app/masters/group/create");
    }

    if (e.ctrlKey && e.key === "a" && firstDbGroup) {
      e.preventDefault();
      navigate(`/app/masters/group/edit/${firstDbGroup.id}`);
    }

    if (e.ctrlKey && e.key === "d" && firstDbGroup) {
      e.preventDefault();
      handleDelete(firstDbGroup.id);
    }

    if (e.key === "F12") {
      e.preventDefault();
      alert("Configuration options not implemented yet.");
    }
  };

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="pt-[56px] px-4" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="flex justify-between items-center mb-6">
        {/* Left: Back + Title */}
        <div className="flex items-center">
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
            Group List
          </h1>
        </div>

        {/* Right: Create Group + Settings */}
        <div className="flex items-center gap-2">
          {/* Create Group Button */}
          <button
            type="button"
            title="Create Group"
            onClick={() => navigate("/app/masters/group/create")}
            className={`flex items-center px-4 py-2 rounded text-sm font-medium ${
              theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            <Plus size={18} className="mr-1" />
            Create Group
          </button>

          {/* Settings Icon */}
          <button
            type="button"
            title="Group Settings"
            onClick={() => setDel(!del)}
            className={`p-2 rounded ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Settings size={20} />
          </button>
        </div>
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
            <Search
              size={18}
              className={`mr-2 opacity-70 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            />
            <input
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-transparent border-none outline-none ${
                theme === "dark"
                  ? "text-gray-100 placeholder-gray-500"
                  : "text-gray-900 placeholder-gray-400"
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                className={`border-b ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <th
                  className={`px-4 py-3 text-left ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Name
                </th>

                <th
                  className={`px-4 py-3 text-left ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Parent Group
                </th>
                <th
                  className={`px-4 py-3 text-left ${
                    theme === "dark" ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Alias
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group: LedgerGroup) => (
                <tr
                  key={group.id}
                  className={`border-b ${
                    theme === "dark" ? "border-gray-700" : "border-gray-200"
                  } hover:bg-opacity-10 hover:bg-blue-500`}
                >
                  <td
                    className={`px-4 py-3 ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {group.name}
                  </td>

                  <td
                    className={`px-4 py-3 ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {group.parent
                      ? groups.find((g) => g.id === group.parent)?.name || "-"
                      : "Primary"}
                  </td>
                  <td
                    className={`px-4 py-3 ${
                      theme === "dark" ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    {group.alias}
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-2">
                      {ownerType !== "user" && (
                        <>
                          <button
                            disabled={group.isSystem}
                            title={
                              group.isSystem
                                ? "System group cannot be edited"
                                : "Edit Group"
                            }
                            onClick={() =>
                              !group.isSystem &&
                              navigate(`/app/masters/group/edit/${group.id}`)
                            }
                            className={`p-1 rounded ${
                              group.isSystem
                                ? "opacity-40 cursor-not-allowed"
                                : theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            disabled={group.isSystem}
                            title={
                              group.isSystem
                                ? "System group cannot be deleted"
                                : "Delete Group"
                            }
                            onClick={() =>
                              !group.isSystem && handleDelete(group.id)
                            }
                            className={`p-1 rounded transition-all ${
                              group.isSystem
                                ? "opacity-40 cursor-not-allowed"
                                : theme === "dark"
                                ? "hover:bg-gray-700"
                                : "hover:bg-gray-100"
                            }`}
                          >
                            {del && <Trash2 size={16} />}
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-8">
            <p
              className={`opacity-70 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}
            >
              No groups found matching your search.
            </p>
          </div>
        )}
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p
          className={`text-sm ${
            theme === "dark" ? "text-gray-300" : "text-gray-700"
          }`}
        >
          <span className="font-semibold">Keyboard Shortcuts:</span> Ctrl+C to
          create a new group, Ctrl+A to edit first group, Ctrl+D to delete first
          group, F12 to configure.
        </p>
      </div>
    </div>
  );
};

export default GroupList;
