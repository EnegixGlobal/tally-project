import React, { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import {
  Book,
  DollarSign,
  ShoppingBag,
  Activity,
  PlusCircle,
} from "lucide-react";
import AddCaEmployeeForm from "./caemployee"; // adjust path as needed
import AssignCompaniesModal from "./AssignCompaniesModal"; // Adjust path accordingly
import DashboardCaEmployee from "./DashboardCaEmployee";

const Dashboard: React.FC = () => {
  const { theme, setCompanyInfo } = useAppContext();
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfoState] = useState<any>(null);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLimit, setUserLimit] = useState(1);
  const [allCompanies, setAllCompanies] = useState<AllCompanies[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [caAllCompanies, setCaAllCompanies] = useState<AllCompanies[]>([]);
  const [selectedCaCompany, setSelectedCaCompany] = useState("");
  const [caEmployees, setCaEmployees] = useState<any[]>([]); // Optional to reload list after create
  const [showAddForm, setShowAddForm] = useState(false);
  const caId = localStorage.getItem("user_id");
  const suppl: string | null = localStorage.getItem("supplier"); // employee | ca | ca_employee
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");

  type Company = {
    id: string | number;
    name: string;
    address?: string;
    gstNumber?: string;
    panNumber?: string;
    taxType?: string;
  };

  type Employee = {
    companyName: ReactNode;
    name: string;
    adhar: string;
    phone: string;
  };
  type AllCompanies = {
    employee_id: ReactNode;
    pan_number: ReactNode;
    id: number;
    name: string;
  };
  const [companies, setCompanies] = useState<Company[]>([]);

  const [employees, setEmployees] = useState<Employee[]>([
    {
      name: "Rahul Sharma",
      adhar: "1234-5678-9012",
      phone: "9876543210",
      companyName: undefined,
    },
    {
      name: "Priya Verma",
      adhar: "2234-5678-9912",
      phone: "9123456789",
      companyName: undefined,
    },
    {
      name: "Amit Singh",
      adhar: "3234-5678-8812",
      phone: "9988776655",
      companyName: undefined,
    },
  ]);

  const [newEmployee, setNewEmployee] = useState<Employee>({
    name: "",
    adhar: "",
    phone: "",
    companyName: undefined,
  });

  const [showModal, setShowModal] = useState(false);

  const employeeId = localStorage.getItem("employee_id");

  useEffect(() => {
  if (companyInfo?.id) {
    setSelectedCompany(companyInfo.id.toString());
  }
}, [companyInfo]);


  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/dashboard-data?employee_id=${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await res.json();
        console.log("this is data", data.companyInfo);
        if (data.success) {
          setCompanyInfoState(data.companyInfo);
          setCompanyInfo(data.companyInfo);
          setUserLimit(data.userLimit ?? 1);
          setCompanies(data.companies || []);
          setLedgers(data.ledgers || []);
          setVouchers(data.vouchers || []);
        } else {
          console.error("Failed to load dashboard data");
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    if (employeeId) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [employeeId, setCompanyInfo]);

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");

    if (!employeeId) return;

    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/companies-by-employee?employee_id=${employeeId}`
    )
      .then((res) => res.json())
      .then((data) => {
        setAllCompanies(data.companies || []);
      })
      .catch((err) => console.error("Error fetching companies:", err));
  }, []);

  useEffect(() => {
    const caId = localStorage.getItem("user_id");
    if (!caId) return;

    fetch(`${import.meta.env.VITE_API_URL}/api/companies-by-ca?ca_id=${caId}`)
      .then((res) => res.json())
      .then((data) => setCaAllCompanies(data.companies || []))
      .catch((err) => console.error("Error fetching CA companies:", err));
  }, []);

  const handleCreateCompany = () => {
    navigate("/app/company");
  };
  useEffect(() => {
    if (!caId) return;
    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/ca-employees-with-companies?ca_id=${caId}`
    )
      .then((res) => res.json())
      .then((data) => setCaEmployees(data.employees || []))
      .catch(console.error);
  }, [caId, showAddForm]); // Also refetch list when the add modal closes
  const openAssignModal = (employeeId: number, employeeName: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedEmployeeName(employeeName);
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setSelectedEmployeeId(null);
    setSelectedEmployeeName("");
    setShowAssignModal(false);
  };

  // Fetch function to reload employees after assignment
  const fetchEmployees = () => {
    fetch(
      `${
        import.meta.env.VITE_API_URL
      }/api/ca-employees-with-companies?ca_id=${caId}`
    )
      .then((res) => res.json())
      .then((data) => setCaEmployees(data.employees || []))
      .catch(console.error);
  };

  const stats = [
    {
      title: "Ledger Accounts",
      value: ledgers.length,
      icon: <Book size={24} />,
      color: theme === "dark" ? "bg-gray-800" : "bg-blue-50",
    },
    {
      title: "Total Vouchers",
      value: vouchers.length,
      icon: <ShoppingBag size={24} />,
      color: theme === "dark" ? "bg-gray-800" : "bg-green-50",
    },
    {
      title: "Cash Balance",
      value:
        "₹ " +
        (ledgers
          .find((l) => l.name === "Cash")
          ?.openingBalance?.toLocaleString() || "0"),
      icon: <DollarSign size={24} />,
      color: theme === "dark" ? "bg-gray-800" : "bg-amber-50",
    },
    {
      title: "Bank Balance",
      value:
        "₹ " +
        (ledgers
          .find((l) => l.name === "Bank Account")
          ?.openingBalance?.toLocaleString() || "0"),
      icon: <Activity size={24} />,
      color: theme === "dark" ? "bg-gray-800" : "bg-purple-50",
    },
  ];

  const companyCount = companies.length;
  const canCreateCompany = companyCount < userLimit;

  const handleAddEmployee = () => {
    if (!newEmployee.name || !newEmployee.adhar || !newEmployee.phone) return;
    setEmployees((prev) => [...prev, newEmployee]);
    setNewEmployee({ name: "", adhar: "", phone: "", companyName: undefined });
    setShowModal(false);
  };

  if (loading) {
    return (
      <div className="pt-[56px] px-4">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <>
      {suppl === "employee" ? (
        <div className="pt-[10px] px-4 ">
          {/* <h1 className="text-2xl font-bold mb-6">Dashboard</h1> */}

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-1">
                My Companies
              </h1>
              <div className="text-sm text-gray-500">
                {companyCount} of {userLimit} allowed
              </div>
            </div>
            {canCreateCompany ? (
              <button
                onClick={handleCreateCompany}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-lg shadow-md hover:scale-105 transition-transform font-medium"
              >
                <PlusCircle className="w-5 h-5" />
                Create Company
              </button>
            ) : (
              <span className="bg-red-100 text-red-700 px-4 py-2 rounded-full font-semibold text-sm">
                Company Limit Reached ({companyCount}/{userLimit})
              </span>
            )}

            <div className="pt-[56px] px-4 mb-6">
              <label className="block mb-2 font-medium text-gray-700">
                Switch Company
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => {
                  const companyId = e.target.value;

                  // ✅ Save to localStorage
                  localStorage.setItem("company_id", companyId);

                  // ✅ Update state
                  setSelectedCompany(companyId);

                  // ✅ Reload the page
                  window.location.reload();
                }}
                className="border rounded px-3 py-2 w-full max-w-xs"
              >
                <option value="">Select Company</option>
                {allCompanies.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Company Cards */}
          {companyCount === 0 ? (
            <div className="bg-white rounded-xl shadow p-8 text-center mb-8">
              <h2 className="text-lg font-semibold mb-2">
                No company created yet
              </h2>
              <p className="mb-4 text-gray-600">
                Use the button above to create your first company.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="bg-gradient-to-b from-purple-50 to-blue-50 shadow-md rounded-2xl p-6 hover:shadow-xl transition-shadow border border-indigo-100"
                >
                  <h3 className="text-lg font-bold mb-1">{c.name}</h3>

                  <div className="text-sm text-gray-500 mb-3">
                    {c.address || "—"}
                  </div>

                  <div className="flex flex-col gap-1 text-xs">
                    <span className="opacity-70">
                      GST: {c.gst_number || "—"}
                    </span>

                    <span className="opacity-70">
                      PAN: {c.pan_number || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ✅ If no company, show welcome */}
          {!companyInfo ? (
            <div
              className={`p-1 rounded-lg mb-6 ${
                theme === "dark" ? "bg-gray-800" : "bg-white shadow"
              }`}
            >
              {/* <h2 className="text-xl font-semibold mb-4">
                Welcome to Tally Prime
              </h2>
              <p className="mb-4">
                No company is currently open. Use the button below to create
                your first company.
              </p> */}
              {/* <button
                onClick={handleCreateCompany}
                className={`px-4 py-2 rounded-md cursor-pointer ${
                  theme === "dark"
                    ? "bg-blue-600 hover:bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Create Company
              </button> */}
            </div>
          ) : (
            <>
              {/* Company Info */}
              <div
                className={`p-6 rounded-lg mb-6 ${
                  theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                }`}
              >
                <h2 className="text-xl font-semibold mb-2">
                  {companyInfo.name}
                </h2>

                <p className="text-sm opacity-75 mb-1">
                  Financial Year: {companyInfo.financial_year}
                </p>

                <p className="text-sm opacity-75 mb-1">
                  Books Beginning From: {companyInfo.books_beginning_year}
                </p>

                <p className="text-sm opacity-75 mb-1">
                  GST Number: {companyInfo.gst_number}
                </p>

                <p className="text-sm opacity-75 mb-1">
                  PAN Number: {companyInfo.pan_number}
                </p>

                <p className="text-sm opacity-75 mb-1">
                  Address: {companyInfo.address}, {companyInfo.state} -{" "}
                  {companyInfo.pin}
                </p>

                <p className="text-sm opacity-75 mb-1">
                  Email: {companyInfo.email}
                </p>

                <p className="text-sm opacity-75">
                  Phone: {companyInfo.phone_number}
                </p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className={`p-6 rounded-lg ${stat.color} ${
                      theme === "dark" ? "" : "shadow"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm opacity-75 mb-1">{stat.title}</p>
                        <p className="text-2xl font-semibold">{stat.value}</p>
                      </div>
                      <div
                        className={`p-2 rounded-full ${
                          theme === "dark" ? "bg-gray-700" : "bg-white"
                        }`}
                      >
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Extra Reports Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Sales Report */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-green-50 to-green-100 shadow hover:shadow-lg transition">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Sales Report
                  </h3>
                  <p className="text-2xl font-bold text-green-700">
                    ₹ 1,25,000
                  </p>
                  <p className="text-sm text-gray-500">This Month</p>
                </div>

                {/* Purchase Report */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 shadow hover:shadow-lg transition">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Purchase Report
                  </h3>
                  <p className="text-2xl font-bold text-blue-700">₹ 75,000</p>
                  <p className="text-sm text-gray-500">This Month</p>
                </div>

                {/* Input Tax */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 shadow hover:shadow-lg transition">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Input Tax
                  </h3>
                  <p className="text-2xl font-bold text-purple-700">₹ 15,000</p>
                  <p className="text-sm text-gray-500">This Month</p>
                </div>

                {/* Output Tax */}
                <div className="p-6 rounded-xl bg-gradient-to-r from-orange-50 to-orange-100 shadow hover:shadow-lg transition">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    Output Tax
                  </h3>
                  <p className="text-2xl font-bold text-orange-700">₹ 20,000</p>
                  <p className="text-sm text-gray-500">This Month</p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : suppl === "ca" ? (
        <div className="pt-[56px] px-4 space-y-8">
          <div className="pt-4 px-4 mb-6">
            <label className="block mb-2 font-medium text-gray-700">
              Switch Company
            </label>
            <select
              value={selectedCaCompany}
              onChange={(e) => {
                const companyId = e.target.value;
                localStorage.setItem("company_id", companyId);
                setSelectedCaCompany(companyId);
                window.location.reload();
              }}
              className="border rounded px-3 py-2 w-full max-w-xs"
            >
              <option value="">Select Company</option>
              {caAllCompanies.map((c) => (
                <option key={c.id} value={c.id.toString()}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Company Details Table */}
          <div className="bg-white shadow rounded-2xl p-6 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">Company Details</h2>
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Company Name</th>
                  <th className="border p-2">Tax Type</th>
                  <th className="border p-2">Employees</th>
                </tr>
              </thead>
              <tbody>
                {caAllCompanies.map((company) => (
                  <tr key={company.id}>
                    <td className="border p-2">{company.name}</td>
                    <td className="border p-2">{company.pan_number}</td>
                    <td className="border p-2">{company.employee_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Employees Table */}
          <div className="bg-white shadow rounded-2xl p-6 overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Working Employees</h2>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Add Employee
              </button>
            </div>
            {showAddForm && (
              <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md relative">
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-black"
                  >
                    ×
                  </button>
                  <AddCaEmployeeForm
                    caId={caId || ""}
                    onSuccess={() => setShowAddForm(false)}
                  />
                </div>
              </div>
            )}
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Employee Name</th>
                  <th className="border p-2">Company Name</th>
                  <th className="border p-2">Adhar Number</th>
                  <th className="border p-2">Phone Number</th>
                  <th className="border p-2">Actions</th> {/* New */}
                </tr>
              </thead>
              <tbody>
                {caEmployees.map((emp, idx) => (
                  <tr key={emp.employee_id || idx}>
                    <td className="border p-2">{emp.name}</td>
                    <td className="border p-2">{emp.company_names || "—"}</td>
                    <td className="border p-2">{emp.adhar}</td>
                    <td className="border p-2">{emp.phone}</td>
                    <td className="border p-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() =>
                          openAssignModal(emp.employee_id, emp.name)
                        }
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Submit Employees */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => console.log("Submitted Employees:", employees)}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      ) : suppl === "ca_employee" ? (
        <div className="pt-[56px] px-4">
          <DashboardCaEmployee />
        </div>
      ) : null}
      {showAssignModal && selectedEmployeeId !== null && (
        <AssignCompaniesModal
          caId={caId || ""}
          employeeId={selectedEmployeeId}
          employeeName={selectedEmployeeName}
          onClose={closeAssignModal}
          onAssigned={() => {
            fetchEmployees(); // refresh list after update
          }}
        />
      )}

      {/* Modal for Adding Employee */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Employee</h3>

            <div className="space-y-3">
              <input
                type="text"
                placeholder="Employee Name"
                value={newEmployee.name}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, name: e.target.value })
                }
                className="border rounded-lg p-2 w-full"
              />
              <input
                type="text"
                placeholder="Aadhaar Number"
                value={newEmployee.adhar}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, adhar: e.target.value })
                }
                className="border rounded-lg p-2 w-full"
              />
              <input
                type="text"
                placeholder="Phone Number"
                value={newEmployee.phone}
                onChange={(e) =>
                  setNewEmployee({ ...newEmployee, phone: e.target.value })
                }
                className="border rounded-lg p-2 w-full"
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEmployee}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Dashboard;
