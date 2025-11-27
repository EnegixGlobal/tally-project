import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../context/AppContext";
import {
  ArrowLeft,
  Edit,
  Trash,
  Printer,
  Download,
  Filter,
  Play,
} from "lucide-react";
import ReportTable from "../../reports/ReportTable";
import type { Scenario } from "../../../types";

const ScenarioList: React.FC = () => {
  const { theme, companyInfo } = useAppContext();
  const navigate = useNavigate();
  const [filterName, setFilterName] = useState("");
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [, setLoading] = useState(true);

  // Fetch from API
  useEffect(() => {
    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("userType");
    const ownerId = localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    );

    if (!companyId || !ownerType || !ownerId) return;

    const fetchScenarios = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/scenario/list?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const rawData = await response.json();

        const formatted = rawData.map((s: any) => ({
          id: s.id,
          name: s.name,
          includeActuals: s.include_actuals,
          includedVoucherTypes: s.included_voucher_types || [],
          excludedVoucherTypes: s.excluded_voucher_types || [],
          fromDate: s.from_date,
          toDate: s.to_date,
          createdAt: s.created_at,
          updatedAt: s.updated_at,
        }));

        setScenarios(formatted);
      } catch (err) {
        console.error("Error fetching scenarios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  // Mock delete function
  const deleteScenario = useCallback(async (id: string) => {
    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("userType");
    const ownerId = localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    );

    if (!ownerType || !ownerId) {
      alert("Missing company or user information.");
      return;
    }

    try {
      // 🔹 Backend route: DELETE /api/scenario/:id
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/scenario/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete scenario");
      }

      alert("Scenario deleted successfully");

      // 🔹 Remove deleted scenario from local list
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      console.error("Error deleting scenario:", err);
      alert(err.message || "Error deleting scenario");
    }
  }, []);

  const filteredScenarios = scenarios.filter((s: Scenario) =>
    s.name.toLowerCase().includes(filterName.toLowerCase())
  );

  const paginatedScenarios = filteredScenarios.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredScenarios.length / itemsPerPage);

  const columns = useMemo(
    () => [
      { header: "Name", accessor: "name", align: "left" as const },
      {
        header: "Include Actuals",
        accessor: "includeActuals",
        align: "center" as const,
        render: (row: Scenario) => (row.includeActuals ? "Yes" : "No"),
      },
      {
        header: "Included Vouchers",
        accessor: "includedVoucherTypes",
        align: "left" as const,
        render: (row: Scenario) =>
          row.includedVoucherTypes.join(", ") || "None",
      },
      {
        header: "Excluded Vouchers",
        accessor: "excludedVoucherTypes",
        align: "left" as const,
        render: (row: Scenario) =>
          row.excludedVoucherTypes.join(", ") || "None",
      },
      { header: "From Date", accessor: "fromDate", align: "left" as const },
      { header: "To Date", accessor: "toDate", align: "left" as const },
      {
        header: "Actions",
        accessor: "actions",
        align: "center" as const,
        render: (row: Scenario) => (
          <div className="flex space-x-2 justify-center">
            <button
              title="Apply Scenario"
              onClick={() =>
                navigate(`/reports/trial-balance?scenarioId=${row.id}`)
              }
              className={`p-1 rounded ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            >
              <Play size={16} />
            </button>
            <button
              title="Edit Scenario"
              onClick={() => navigate(`/app/masters/scenario/edit/${row.id}`)}
              className={`p-1 rounded ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            >
              <Edit size={16} />
            </button>
            <button
              title="Delete Scenario"
              onClick={() => {
                if (
                  window.confirm(
                    "Are you sure you want to delete this scenario?"
                  )
                ) {
                  deleteScenario(row.id);
                }
              }}
              className={`p-1 rounded ${
                theme === "dark" ? "hover:bg-red-700" : "hover:bg-red-200"
              }`}
            >
              <Trash size={16} />
            </button>
          </div>
        ),
      },
    ],
    [navigate, theme, deleteScenario]
  );

  const handlePrint = useCallback(() => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Scenario List</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            </style>
          </head>
          <body>
            <h1>${companyInfo?.name || "Hanuman Car Wash"} - Scenario List</h1>
            <table>
              <thead>
                <tr>${columns
                  .map(
                    (col) =>
                      `<th style="text-align:${col.align}">${col.header}</th>`
                  )
                  .join("")}</tr>
              </thead>
              <tbody>
                ${paginatedScenarios
                  .map(
                    (row) =>
                      `<tr>${columns
                        .map(
                          (col) =>
                            `<td style="text-align:${col.align}">${
                              col.render
                                ? col.render(row)
                                : String(
                                    (row as Record<string, unknown>)[
                                      col.accessor
                                    ]
                                  )
                            }</td>`
                        )
                        .join("")}</tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [companyInfo?.name, columns, paginatedScenarios]);

  const handleExport = useCallback(() => {
    const csv = [
      columns.map((col) => col.header).join(","),
      ...paginatedScenarios.map((row) =>
        columns
          .map((col) =>
            col.render
              ? col.render(row)
              : String((row as Record<string, unknown>)[col.accessor])
          )
          .join(",")
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scenario_list.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [columns, paginatedScenarios]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "F5") {
        e.preventDefault();
        setFilterName(""); // Reset filters
        setCurrentPage(1);
      } else if (e.ctrlKey && e.key === "e") {
        e.preventDefault();
        handleExport();
      } else if (e.ctrlKey && e.key === "p") {
        e.preventDefault();
        handlePrint();
      }
    },
    [handleExport, handlePrint]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Dashboard"
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
          Scenario List
        </h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Create Scenario"
            onClick={() => navigate("/app/masters/scenario/create")}
            className={`px-4 py-2 rounded-md ${
              theme === "dark"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-500 hover:bg-blue-600"
            } text-white`}
          >
            Create Scenario
          </button>
          <button
            title="Toggle Filters"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print List"
            onClick={handlePrint}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Download List"
            onClick={handleExport}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className={`block text-sm font-medium mb-1 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Scenario Name
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-gray-100"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
                placeholder="Search by name"
              />
            </div>
          </div>
        </div>
      )}

      <div
        className={`p-6 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-white shadow"
        }`}
      >
        <ReportTable
          theme={theme}
          columns={columns}
          data={paginatedScenarios}
        />
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
          className={`px-4 py-2 rounded-md ${
            currentPage === 1
              ? "opacity-50 cursor-not-allowed"
              : theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Previous
        </button>
        <span className={theme === "dark" ? "text-gray-300" : "text-gray-700"}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
          className={`px-4 py-2 rounded-md ${
            currentPage === totalPages
              ? "opacity-50 cursor-not-allowed"
              : theme === "dark"
              ? "bg-gray-700 hover:bg-gray-600"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Next
        </button>
      </div>

      <div
        className={`mt-6 p-4 rounded ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Keyboard Shortcuts:</span> F5 to
          refresh, Ctrl+E to export, Ctrl+P to print.
        </p>
      </div>
    </div>
  );
};

export default ScenarioList;
