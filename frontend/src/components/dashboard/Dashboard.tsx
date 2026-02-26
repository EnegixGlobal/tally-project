import React, { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import { useCompany } from "../../context/CompanyContext";
import {
  Book,
  DollarSign,
  ShoppingBag,
  Activity,
  PlusCircle,
  Lock as LucideLock,
  Building,
} from "lucide-react";
import AddCaEmployeeForm from "./caemployee"; // adjust path as needed
import AssignCompaniesModal from "./AssignCompaniesModal"; // Adjust path accordingly
import PermissionsModal from "./PermissionsModal";
import DashboardCaEmployee from "./DashboardCaEmployee";
import { useAuth } from "../../home/context/AuthContext";
import { Lock, ShieldCheck } from "lucide-react";

const Dashboard: React.FC = () => {
  const isSameCompany = (a: any, b: any) => {
    if (!a || !b) return false;
    return String(a.id) === String(b.id);
  };

  const { theme, setCompanyInfo } = useAppContext();
  const { switchCompany, activeCompanyId, setCompanies: setContextCompanies } = useCompany();
  const { checkPermission } = useAuth();
  const navigate = useNavigate();
  const [companyInfo, setCompanyInfoState] = useState<any>(null);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLimit, setUserLimit] = useState(1);
  const [allCompanies, setAllCompanies] = useState<AllCompanies[]>([]);
  const [caAllCompanies, setCaAllCompanies] = useState<AllCompanies[]>([]);
  const [selectedCaCompany, setSelectedCaCompany] = useState(() => {
    const storedCompanyId = localStorage.getItem("company_id");
    return storedCompanyId || "";
  });
  const [caEmployees, setCaEmployees] = useState<any[]>([]); // Optional to reload list after create
  const [showAddForm, setShowAddForm] = useState(false);
  const caId = localStorage.getItem("user_id") || localStorage.getItem("employee_id");
  const suppl: string | null = localStorage.getItem("supplier"); // employee | ca | ca_employee
  const userType = localStorage.getItem("userType");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  const [selectedEmployeeName, setSelectedEmployeeName] = useState<string>("");

  const openPermissionsModal = (employeeId: number, employeeName: string) => {
    setSelectedEmployeeId(employeeId);
    setSelectedEmployeeName(employeeName);
    setShowPermissionsModal(true);
  };

  const closePermissionsModal = () => {
    setSelectedEmployeeId(null);
    setSelectedEmployeeName("");
    setShowPermissionsModal(false);
  };

  type Company = {
    id: string | number;
    name: string;
    address?: string;
    gstNumber?: string;
    gst_number?: string;
    panNumber?: string;
    pan_number?: string;
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
    isLocked?: boolean | number;
  };
  const [companies, setCompanies] = useState<Company[]>([]);

  // Initialize selectedCompany from localStorage first
  const [selectedCompany, setSelectedCompany] = useState(() => {
    const storedCompanyId = localStorage.getItem("company_id");
    return storedCompanyId || "";
  });

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

  const handleCompanyUnlock = async (id: string) => {
    // Switch to that company in context immediately
    if (suppl === "employee") {
      await switchCompany(id);
      setSelectedCompany(id);
    } else {
      localStorage.setItem("company_id", id);
      setSelectedCaCompany(id);
      window.location.reload();
    }
  };

  const employeeId = localStorage.getItem("employee_id");

  // Removed this useEffect - it was causing infinite loop
  // CompanyContext now handles syncing automatically
  // useEffect(() => {
  //   // Only update if companyInfo exists and selectedCompany is empty or different
  //   if (companyInfo?.id) {
  //     const companyIdStr = companyInfo.id.toString();
  //     const storedCompanyId = localStorage.getItem("company_id");
  //     
  //     // If localStorage has a company_id, use it; otherwise use companyInfo.id
  //     if (storedCompanyId && storedCompanyId !== companyIdStr) {
  //       // If stored company is different, update selectedCompany but don't change localStorage
  //       setSelectedCompany(storedCompanyId);
  //     } else if (!storedCompanyId) {
  //       // If no stored company, use companyInfo.id and save it
  //       setSelectedCompany(companyIdStr);
  //       localStorage.setItem("company_id", companyIdStr);
  //     } else {
  //       // If they match, just ensure state is in sync
  //       setSelectedCompany(companyIdStr);
  //     }
  //   }
  // }, [companyInfo]);


  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token");
        const ownerType = localStorage.getItem("supplier");
        const restrictedId = localStorage.getItem("company_id");

        let ownerId =
          ownerType === "employee"
            ? localStorage.getItem("employee_id")
            : localStorage.getItem("user_id");

        // For CA employees, we want to see the owner's data
        let fetchOwnerType = ownerType;
        let fetchOwnerId = ownerId;

        if (userType === "ca_employee") {
          fetchOwnerType = "employee";
          fetchOwnerId = localStorage.getItem("employee_id");
        }

        let url = `${import.meta.env.VITE_API_URL}/api/dashboard-data?employee_id=${fetchOwnerId}`;

        if ((userType === 'company_user' || userType === 'ca_employee') && restrictedId) {
          url += `&company_id=${restrictedId}`;
        }

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await res.json();
        // console.log("this is data", data.companyInfo);
        if (data.success) {
          setCompanyInfoState((prev: any) => {
            if (isSameCompany(prev, data.companyInfo)) {
              return prev;
            }
            return data.companyInfo;
          });
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]); // Removed setCompanyInfo from dependencies to prevent infinite loop

  useEffect(() => {
    const employeeId = localStorage.getItem("employee_id");
    const caEmployeeId = localStorage.getItem("user_id");

    if (!employeeId && userType !== "ca_employee") return;

    if (userType === "ca_employee" && caEmployeeId) {
      fetch(
        `${import.meta.env.VITE_API_URL}/api/companies-by-ca-employee?ca_employee_id=${caEmployeeId}`
      )
        .then((res) => res.json())
        .then((data) => {
          const restrictedId = localStorage.getItem("company_id");
          let filteredAll = data.companies || [];
          if (restrictedId) {
            filteredAll = filteredAll.filter((c: any) => String(c.id) === String(restrictedId));
          }
          setAllCompanies(filteredAll);
        })
        .catch((err) => console.error("Error fetching CA employee companies:", err));
      return;
    }

    fetch(
      `${import.meta.env.VITE_API_URL
      }/api/companies-by-employee?employee_id=${employeeId}`
    )
      .then((res) => res.json())
      .then((data) => {
        const restrictedId = localStorage.getItem("company_id");
        let filteredAll = data.companies || [];
        if (userType === 'company_user' && restrictedId) {
          filteredAll = filteredAll.filter((c: any) => String(c.id) === String(restrictedId));
        }
        setAllCompanies(filteredAll);
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
      `${import.meta.env.VITE_API_URL
      }/api/ca-employees-with-companies?ca_id=${caId}`
    )
      .then((res) => res.json())
      .then((data) => setCaEmployees(data.employees || []))
      .catch(console.error);
  }, [caId, showAddForm]); // Also refetch list when the add modal closes

  // Auto-unlock logic removed - Direct access enabled

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

  useEffect(() => {
    if (!companyInfo) return;

    const stored = localStorage.getItem("companyInfo");

    if (stored) {
      const parsed = JSON.parse(stored);

      if (parsed?.id === companyInfo.id) return;
    }

    localStorage.setItem("companyInfo", JSON.stringify(companyInfo));
    setCompanyInfo(companyInfo);

  }, [companyInfo]);


  // Fetch function to reload employees after assignment
  const fetchEmployees = () => {
    fetch(
      `${import.meta.env.VITE_API_URL
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
  const canCreateCompany = companyCount < userLimit && userType === "employee";
  // Note: For 'ca_employee', userType is 'ca_employee', so canCreateCompany will be false.

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

  // Verification logic removed - Direct access enabled

  // Company gate logic removed - Direct access enabled

  return (
    <>
      {suppl === "employee" || suppl === "ca_employee" ? (
        <div className="pt-[40px] px-4 ">
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
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {userType !== "company_user" && (
                canCreateCompany ? (
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
                )
              )}

              {userType === "employee" && allCompanies.length > 1 && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-400 invisible sm:visible">Active:</span>
                  <select
                    value={activeCompanyId || selectedCompany}
                    onChange={(e) => handleCompanyUnlock(e.target.value)}
                    className="border-2 border-indigo-100 rounded-xl px-4 py-2 w-full sm:w-[220px] bg-white text-gray-700 outline-none focus:border-indigo-500 transition-all font-bold cursor-pointer"
                  >
                    <option value="" disabled>Select Company</option>
                    {allCompanies.map((c) => (
                      <option key={c.id} value={c.id.toString()}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
              {companies
                .filter(c => {
                  if (userType === 'company_user' || userType === 'ca_employee') {
                    const restrictedId = localStorage.getItem("company_id");
                    return String(c.id) === String(restrictedId);
                  }
                  return true;
                })
                .map((c) => {
                  const isSelected = c.id.toString() === selectedCompany;
                  return (
                    <div
                      key={c.id}
                      className={`rounded-2xl p-6 hover:shadow-xl transition-all border-2 ${isSelected
                        ? "bg-gradient-to-b from-indigo-100 to-purple-100 shadow-lg border-indigo-500 ring-2 ring-indigo-300 ring-offset-2"
                        : "bg-gradient-to-b from-purple-50 to-blue-50 shadow-md border-indigo-100"
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`text-lg font-bold ${isSelected ? "text-indigo-800" : "text-gray-800"
                          }`}>
                          {c.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <LucideLock className="w-4 h-4 text-green-500" />
                          {isSelected && (
                            <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                              Active Session
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`text-sm mb-3 ${isSelected ? "text-gray-600" : "text-gray-500"
                        }`}>
                        {c.address || "—"}
                      </div>

                      <div className="flex flex-col gap-1 text-xs">
                        <span className={isSelected ? "text-gray-700" : "opacity-70"}>
                          GST: {c.gst_number || c.gstNumber || "—"}
                        </span>

                        <span className={isSelected ? "text-gray-700" : "opacity-70"}>
                          PAN: {c.pan_number || c.panNumber || "—"}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* ✅ If no company, show welcome */}
          {!companyInfo ? (
            <div
              className={`p-1 rounded-lg mb-6 ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
                }`}
            >
              {/* <h2 className="text-xl font-semibold mb-4">
                Welcome to Apna Book 
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
                className={`p-6 rounded-lg mb-6 ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"
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
              {checkPermission('reports') && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {stats.map((stat, index) => (
                      <div
                        key={index}
                        className={`p-6 rounded-lg ${stat.color} ${theme === "dark" ? "" : "shadow"
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm opacity-75 mb-1">{stat.title}</p>
                            <p className="text-2xl font-semibold">{stat.value}</p>
                          </div>
                          <div
                            className={`p-2 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-white"
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
            </>

          )}
        </div>
      ) : suppl === "ca" ? (
        <div className="pt-[56px] px-4 space-y-8">
          {caAllCompanies.length > 0 && (
            <div className="mb-6">
              <label className="block mb-2 font-medium text-gray-700">
                Switch Company
              </label>
              <select
                value={selectedCaCompany}
                onChange={(e) => {
                  const companyId = e.target.value;
                  if (!companyId) return;

                  localStorage.setItem("company_id", companyId);
                  setSelectedCaCompany(companyId);
                  window.location.reload();
                }}
                className="border rounded px-3 py-2 w-full max-w-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer transition-all font-bold"
              >
                <option value="">Select Company</option>
                {caAllCompanies.map((c) => (
                  <option key={c.id} value={c.id.toString()}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Company Details Table */}
          <div className="bg-white shadow rounded-2xl p-6 overflow-x-auto">
            <h2 className="text-lg font-semibold mb-4">Company Details</h2>
            <table className="w-full border-collapse border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2">Company Name</th>
                  <th className="border p-2">Pan</th>
                </tr>
              </thead>
              <tbody>
                {caAllCompanies.map((company) => (
                  <tr key={company.id}>
                    <td className="border p-2">{company.name}</td>
                    <td className="border p-2">{company.pan_number}</td>
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
                  <th className="border p-2">Email</th>
                  <th className="border p-2">Password</th>
                  <th className="border p-2">Company Name</th>
                  <th className="border p-2">Adhar Number</th>
                  <th className="border p-2">Phone Number</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {caEmployees.map((emp, idx) => (
                  <tr key={emp.employee_id || idx} className="text-center">
                    <td className="border p-2">{emp.name}</td>
                    <td className="border p-2">{emp.email}</td>
                    <td className="border p-2">{emp.password || "*****"}</td>
                    <td className="border p-2">{emp.company_names || "—"}</td>
                    <td className="border p-2">{emp.adhar}</td>
                    <td className="border p-2">{emp.phone}</td>
                    <td className="border p-2 flex gap-2 justify-center cursor-pointer">
                      <button
                        className="text-blue-600 hover:underline flex items-center gap-1"
                        onClick={() =>
                          openAssignModal(emp.employee_id, emp.name)
                        }
                      >
                        Edit
                      </button>


                      <button
                        className="text-green-600 hover:underline flex items-center gap-1"
                        onClick={() =>
                          openPermissionsModal(emp.employee_id, emp.name)
                        }
                      >
                        <ShieldCheck size={14} />
                        Access
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

      {showPermissionsModal && selectedEmployeeId !== null && (
        <PermissionsModal
          employeeId={selectedEmployeeId}
          employeeName={selectedEmployeeName}
          onClose={closePermissionsModal}
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
