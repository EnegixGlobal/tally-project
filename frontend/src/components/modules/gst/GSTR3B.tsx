import React, { useState, useEffect } from "react";
import { useAppContext } from "../../../context/AppContext";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Printer,
  Filter,
  Upload,
  Save,
  Calculator,
  FileText,
  X,
} from "lucide-react";

// Helper function to get month name
const getMonthName = (month: string): string => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[parseInt(month) - 1] || "";
};

const GSTR3B: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // get company Information
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  // New state variables for enhanced features
  const [showDraftPreview, setShowDraftPreview] = useState(false);
  const [showPreviewMode, setShowPreviewMode] = useState(false);
  const [showArnModal, setShowArnModal] = useState(false);
  const [generatedArn, setGeneratedArn] = useState("");
  const [draftData, setDraftData] = useState<any | null>(null);

  // get basedata
  const baseGroups = [
    { id: -1, name: "Branch Accounts", nature: "Assets", isSystem: true },
    { id: -2, name: "Branch OD A/c", nature: "Assets", isSystem: true },
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
  ];

  //basic information
  const [basicInfo, setBasicInfo] = useState({
    gstin: "",
    legalName: "",
    tradeName: "",
    arn: "",
  });

  useEffect(() => {
    const companyRaw = localStorage.getItem("companyInfo");

    if (!companyRaw) return;

    try {
      const company = JSON.parse(companyRaw);

      setBasicInfo({
        gstin: company.gst_number || "",
        legalName: company.name || "",
        tradeName: company.name || "",
        arn: "",
      });
    } catch (error) {
      console.error("Company data parse error", error);
    }
  }, []);

  const [threepointone, setThreepointone] = useState({
    a: {
      taxableValue: 0,
      integratedTax: 0,
      centralTax: 0,
      stateUTTax: 0,
      cess: 0,
    },
    b: {
      taxableValue: 0,
    },
    c: {
      taxableValue: 0,
    },
  });

  // get ledger data
  const [Data, setData] = useState<any[]>([]);

  // const filterledger = 'Nill Rated' ,'Exempted','Zero Rated'

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        if (!companyId || !ownerType || !ownerId) return;

        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/gstr3b?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const json = await res.json();
        if (!isMounted) return;

        const a = json?.a;
        const b = json?.b;
        const c = json?.c;

        const nilTotal = c?.nil?.total ?? 0;
        const exemptedTotal = c?.exempted?.total ?? 0;

        setThreepointone({
          a: {
            taxableValue: a?.taxable_value ?? 0,
            integratedTax: a?.integrated_tax ?? 0,
            centralTax: a?.central_tax ?? 0,
            stateUTTax: a?.state_tax ?? 0,
            cess: 0,
          },
          b: {
            taxableValue: b?.total ?? 0,
          },
          c: {
            taxableValue: nilTotal + exemptedTotal,
          },
        });
      } catch (err) {
        console.error("GSTR3B error", err);
      }
    })();

    return () => {
      isMounted = false; // 🔥 STRICTMODE SAFE
    };
  }, []);

  console.log("leder", threepointone.a);

  // sales data get
  const [saledata, setSalesdata] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        if (!companyId || !ownerType || !ownerId) return;

        const url = `${
          import.meta.env.VITE_API_URL
        }/api/gstr3b?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

        const res = await fetch(url);
        const json = await res.json();

        console.log("GSTR-3B API:", json);

        const a = json?.a;
        const b = json?.b;
        const c = json?.c;

        const nilTotal = c?.nil?.total ?? 0;
        const exemptedTotal = c?.exempted?.total ?? 0;

        setThreepointone({
          a: {
            taxableValue: a?.taxable_value ?? 0,
            integratedTax: a?.integrated_tax ?? 0,
            centralTax: a?.central_tax ?? 0,
            stateUTTax: a?.state_tax ?? 0,
            cess: 0,
          },

          // ✅ B SECTION FIX
          b: {
            taxableValue: b?.total ?? 0,
          },

          // ✅ C SECTION: combine nil + exempted totals
          c: {
            taxableValue: nilTotal + exemptedTotal,
          },
        });
      } catch (err) {
        console.error("❌ GSTR3B Fetch Error:", err);
      }
    })();
  }, []);

  console.log("saled", saledata);

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => navigate("/app/gst")}
          className={`mr-4 p-2 rounded-full ${
            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">GSTR-3B Return</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Load Draft"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <FileText size={18} />
          </button>
          <button
            title="Save Draft"
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Save size={18} />
          </button>
          <button
            title="Calculate"
            className={`p-2 rounded-md ${
              isCalculating ? "animate-pulse" : ""
            } ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <Calculator size={18} />
          </button>
          <button
            title="Toggle Filters"
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Upload Report"
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Upload size={18} />
          </button>
          <button
            title="Print Report"
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Download Report"
            type="button"
            className={`p-2 rounded-md ${
              theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div
          className={`p-4 mb-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h3 className="font-semibold mb-4">Return Period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Month</label>
              <select
                title="Select Month"
                // onChange={(e) => updateReturnPeriod("month", e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option
                    key={i + 1}
                    value={(i + 1).toString().padStart(2, "0")}
                  >
                    {getMonthName((i + 1).toString().padStart(2, "0"))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Year</label>
              {/* <select
                title="Select Year"
                value={gstr3bData.returnPeriod.year}
                onChange={(e) => updateReturnPeriod("year", e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600"
                    : "bg-white border-gray-300"
                }`}
              >
                {Array.from(
                  { length: 5 },
                  (_, i) => new Date().getFullYear() - i
                ).map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select> */}
            </div>
            {/* <div className="flex items-end">
              <button
                onClick={() => {
                  const currentMonth = (new Date().getMonth() + 1)
                    .toString()
                    .padStart(2, "0");
                  const currentYear = new Date().getFullYear().toString();
                  updateReturnPeriod("month", currentMonth);
                  updateReturnPeriod("year", currentYear);
                }}
                className={`px-4 py-2 rounded-md ${
                  theme === "dark"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Current Period
              </button>
            </div> */}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Information Section */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                GSTIN of Supplier *
              </label>
              <input
                type="text"
                value={basicInfo.gstin}
                readOnly
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Legal Name of Registered Person *
              </label>
              <input
                type="text"
                value={basicInfo.legalName}
                readOnly
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Trade Name (if any)
              </label>
              <input
                type="text"
                value={basicInfo.tradeName}
                readOnly
                className="w-full p-2 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">ARN</label>
              <input
                type="text"
                value={basicInfo.arn}
                readOnly
                placeholder="Auto-generated after submission"
                className="w-full p-2 rounded border"
              />
            </div>
          </div>
        </div>

        {/* Section 3.1 - Outward Supplies */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">
            3.1 Details of Outward Supplies and inward supplies liable to
            reverse charge
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b-2 border-gray-300"
                  }`}
                >
                  <th className="px-4 py-3 text-left">Nature of Supply</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>

              <tbody>
                {/* Row A */}

                <tr>
                  <td className="px-4 py-3">
                    (a) Outward taxable supplies (other than zero rated, nil
                    rated and exempted)
                  </td>

                  {/* Taxable Value */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={threepointone?.a?.taxableValue ?? 0}
                      readOnly
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>

                  {/* Integrated Tax */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={threepointone?.a?.integratedTax ?? 0}
                      readOnly
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>

                  {/* Central Tax */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={threepointone?.a?.centralTax ?? 0}
                      readOnly
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>

                  {/* State / UT Tax */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={threepointone?.a?.stateUTTax ?? 0}
                      readOnly
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>

                  {/* Cess */}
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={threepointone?.a?.cess ?? 0}
                      readOnly
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* Row B */}
                <tr>
                  <td className="px-4 py-3">
                    (b) Outward taxable supplies (zero rated)
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={threepointone.b.taxableValue}
                      readOnly
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* Row C */}
                <tr>
                  <td className="px-4 py-3">
                    (c) Other outward supplies (Nil rated, exempted)
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={threepointone.c.taxableValue}
                      readOnly
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* Row D */}
                <tr>
                  <td className="px-4 py-3">
                    (d) Inward supplies (liable to reverse charge)
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3.1.1 - Amendment to outward supplies */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">
            3.1.1 Amendment to outward supplies reported in returns of earlier
            tax periods
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b-2 border-gray-300"
                  }`}
                >
                  <th className="px-4 py-3 text-left">Particulars</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>

              <tbody>
                <tr>
                  <td className="px-4 py-3">Amendment to outward supplies</td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3.2 - Of the supplies shown in 3.1(a) above, details of inter-State supplies */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">
            3.2 Of the supplies shown in 3.1(a) above, details of inter-State
            supplies made to unregistered persons, composition taxable person
            and UIN holders
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b-2 border-gray-300"
                  }`}
                >
                  <th className="px-4 py-3 text-left">Nature of Supply</th>
                  <th className="px-4 py-3 text-right">Taxable Value</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>

              <tbody>
                {/* Unregistered Persons */}
                <tr>
                  <td className="px-4 py-3">
                    Supplies made to Unregistered Persons
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* Composition Taxable Persons */}
                <tr>
                  <td className="px-4 py-3">
                    Supplies made to Composition Taxable Persons
                  </td>

                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4 - Eligible ITC */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">4. Eligible ITC</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b-2 border-gray-300"
                  }`}
                >
                  <th className="px-4 py-3 text-left">Details</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>

              <tbody>
                {/* Header Row */}
                <tr
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }`}
                >
                  <td className="px-4 py-3 font-bold">
                    (A) ITC Available (whether in full or part)
                  </td>
                  <td className="px-4 py-3 text-center font-bold" colSpan={4}>
                    -
                  </td>
                </tr>

                {/* (1) Import of goods */}
                <tr>
                  <td className="px-4 py-3">(1) Import of goods</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* (2) Import of services */}
                <tr>
                  <td className="px-4 py-3">(2) Import of services</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* (3) Reverse charge */}
                <tr>
                  <td className="px-4 py-3">
                    (3) Inward supplies liable to reverse charge (other than 1 &
                    2 above)
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* (4) ISD */}
                <tr>
                  <td className="px-4 py-3">(4) Inward supplies from ISD</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* (5) Others */}
                <tr>
                  <td className="px-4 py-3">(5) All other ITC</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4.1 - ITC Reversed (Option B) */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">4.1 ITC Reversed</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b-2 border-gray-300"
                  }`}
                >
                  <th className="px-4 py-3 text-left">Details</th>
                  <th className="px-4 py-3 text-right">Integrated Tax</th>
                  <th className="px-4 py-3 text-right">Central Tax</th>
                  <th className="px-4 py-3 text-right">State/UT Tax</th>
                  <th className="px-4 py-3 text-right">Cess</th>
                </tr>
              </thead>

              <tbody>
                {/* Header Row */}
                <tr
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }`}
                >
                  <td className="px-4 py-3 font-bold">(B) ITC Reversed</td>
                  <td className="px-4 py-3 text-center font-bold" colSpan={4}>
                    -
                  </td>
                </tr>

                {/* (1) Rule 42 & 43 */}
                <tr>
                  <td className="px-4 py-3">
                    (1) As per Rule 42 &amp; 43 of CGST Rules
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* (2) Others */}
                <tr>
                  <td className="px-4 py-3">(2) Others</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 5 - Values of exempt, nil-rated and non-GST inward supplies */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">
            5. Values of exempt, nil-rated and non-GST inward supplies
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exempt / Nil Rated */}
            <div>
              <label className="block text-sm font-medium mb-2">
                From a supplier under composition scheme, Exempt and Nil rated
                supply
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-2 text-right border rounded"
              />
            </div>

            {/* Non-GST */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Non GST supply
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-2 text-right border rounded"
              />
            </div>
          </div>
        </div>

        {/* Section 6.1 - Interest & Late Fee */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">
            6.1 Interest & Late fee for previous tax period
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* IGST */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Integrated Tax
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-2 text-right border rounded"
              />
            </div>

            {/* CGST */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Central Tax
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-2 text-right border rounded"
              />
            </div>

            {/* SGST */}
            <div>
              <label className="block text-sm font-medium mb-2">
                State/UT Tax
              </label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-2 text-right border rounded"
              />
            </div>

            {/* CESS */}
            <div>
              <label className="block text-sm font-medium mb-2">Cess</label>
              <input
                type="number"
                placeholder="0.00"
                className="w-full p-2 text-right border rounded"
              />
            </div>
          </div>
        </div>

        {/* Section 6.2 - Payment of Tax */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">6.2 Payment of Tax</h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr
                  className={`${
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b-2 border-gray-300"
                  }`}
                >
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-right">Tax</th>
                  <th className="px-4 py-3 text-right">Interest</th>
                  <th className="px-4 py-3 text-right">Penalty</th>
                  <th className="px-4 py-3 text-right">Fees</th>
                  <th className="px-4 py-3 text-right">Others</th>
                </tr>
              </thead>

              <tbody>
                {/* IGST */}
                <tr
                  className={
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <td className="px-4 py-3">IGST</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* CGST */}
                <tr
                  className={
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <td className="px-4 py-3">CGST</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* SGST */}
                <tr
                  className={
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <td className="px-4 py-3">SGST</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>

                {/* CESS */}
                <tr
                  className={
                    theme === "dark"
                      ? "border-b border-gray-700"
                      : "border-b border-gray-200"
                  }
                >
                  <td className="px-4 py-3">CESS</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-full p-2 text-right border rounded"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Net Tax Liability Calculation */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Tax Liability Summary</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Net Tax Liability */}
            <div>
              <h3 className="font-semibold mb-4">Net Tax Liability</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Total Outward Tax</span>
                  <span className="font-mono text-lg">₹ 0.00</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Total Inward Tax</span>
                  <span className="font-mono text-lg">₹ 0.00</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Total Eligible ITC</span>
                  <span className="font-mono text-lg text-green-600">
                    - ₹ 0.00
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Total ITC Reversed</span>
                  <span className="font-mono text-lg text-red-600">
                    + ₹ 0.00
                  </span>
                </div>

                <hr
                  className={`my-3 ${
                    theme === "dark" ? "border-gray-600" : "border-gray-300"
                  }`}
                />

                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Net Tax Liability</span>
                  <span className="font-mono text-blue-600">₹ 0.00</span>
                </div>
              </div>
            </div>

            {/* Backup & Liability */}
            <div>
              <h3 className="font-semibold mb-4">Tax Backup & Liability</h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Tax Backup Available</span>
                  <span className="font-mono text-lg">₹ 0.00</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Current Liability</span>
                  <span className="font-mono text-lg">₹ 0.00</span>
                </div>

                <div className="flex justify-between items-center">
                  <span>Interest & Penalty</span>
                  <span className="font-mono text-lg">₹ 0.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <div
          className={`p-6 rounded-lg ${
            theme === "dark" ? "bg-gray-800" : "bg-white shadow"
          }`}
        >
          <h2 className="text-xl font-bold mb-4">Verification</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div>
              <label className="block text-sm font-medium mb-2">Date *</label>
              <input
                type="date"
                title="Select verification date"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>

            {/* Authorized Signatory */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Name of Authorized Signatory *
              </label>
              <input
                type="text"
                placeholder="Enter signatory name"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>

            {/* Designation */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Designation / Status *
              </label>
              <select
                title="Select designation or status"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              >
                <option value="">Select Designation</option>
                <option value="Proprietor">Proprietor</option>
                <option value="Partner">Partner</option>
                <option value="Director">Director</option>
                <option value="Company Secretary">Company Secretary</option>
                <option value="Chartered Accountant">
                  Chartered Accountant
                </option>
                <option value="Authorized Signatory">
                  Authorized Signatory
                </option>
              </select>
            </div>

            {/* Place */}
            <div>
              <label className="block text-sm font-medium mb-2">Place</label>
              <input
                type="text"
                placeholder="Enter place"
                className={`w-full p-2 rounded border ${
                  theme === "dark"
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mt-8 justify-center">
        <button
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          <Save size={20} />
          Save Draft
        </button>
        <button
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            theme === "dark"
              ? "bg-gray-600 hover:bg-gray-700 text-white"
              : "bg-gray-600 hover:bg-gray-700 text-white"
          }`}
        >
          <FileText size={20} />
          Load Draft
        </button>
        <button
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            theme === "dark"
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          <Calculator size={20} />
          Validate & Preview
        </button>
        <button
          className={`px-6 py-3 rounded-lg flex items-center gap-2 ${
            theme === "dark"
              ? "bg-purple-600 hover:bg-purple-700 text-white"
              : "bg-purple-600 hover:bg-purple-700 text-white"
          }`}
        >
          <Upload size={20} />
          Submit Return
        </button>
      </div>

      <div
        className={`mt-6 p-4 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-orange-50"
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm">
              <span className="font-semibold">GST Filing:</span> GSTR-3B is a
              monthly summary return that must be filed by the 20th of the
              following month.
            </p>
          </div>
          <div>
            <p className="text-sm">
              <span className="font-semibold">Current Period:</span>{" "}
            </p>
            <p className="text-sm">
              <span className="font-semibold">Net Tax Liability:</span> ₹{" "}
            </p>
          </div>
        </div>
      </div>

      {/* Draft Preview Modal */}
      {showDraftPreview && draftData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`sticky top-0 px-6 py-4 border-b ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <h3 className="text-lg font-semibold">Draft Preview</h3>
              <p className="text-sm text-gray-500">
                Review the draft before loading
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <p>
                    <span className="font-medium">GSTIN:</span>{" "}
                    {draftData.basicInfo.gstin || "Not provided"}
                  </p>
                  <p>
                    <span className="font-medium">Legal Name:</span>{" "}
                    {draftData.basicInfo.legalName || "Not provided"}
                  </p>
                  <p>
                    <span className="font-medium">Return Period:</span>{" "}
                    {getMonthName(draftData.returnPeriod.month)}{" "}
                    {draftData.returnPeriod.year}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Tax Summary</h4>
                </div>
              </div>
            </div>
            <div
              className={`sticky bottom-0 px-6 py-4 border-t flex justify-end gap-3 ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <button
                className={`px-4 py-2 rounded-md ${
                  theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Load Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Mode Modal */}
      {showPreviewMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`sticky top-0 px-6 py-4 border-b flex justify-between items-center ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div>
                <h3 className="text-lg font-semibold">GSTR-3B Preview</h3>
                <p className="text-sm text-gray-500"></p>
              </div>
              <button
                title="Close Preview"
                onClick={() => setShowPreviewMode(false)}
                className={`p-2 rounded-md ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
                }`}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Basic Info Preview */}
              <div
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <h4 className="font-semibold mb-3">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p>
                    <span className="font-medium">GSTIN:</span>{" "}
                  </p>
                  <p>
                    <span className="font-medium">Legal Name:</span>{" "}
                  </p>
                  <p>
                    <span className="font-medium">Trade Name:</span>{" "}
                  </p>
                  <p>
                    <span className="font-medium">Return Period:</span>{" "}
                  </p>
                </div>
              </div>

              {/* Tax Summary Preview */}
              <div
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <h4 className="font-semibold mb-3">Tax Liability Summary</h4>
                {(() => {
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <p>
                        <span className="font-medium">IGST:</span> ₹
                      </p>
                      <p>
                        <span className="font-medium">CGST:</span> ₹
                      </p>
                      <p>
                        <span className="font-medium">SGST:</span> ₹
                      </p>
                      <p>
                        <span className="font-medium">CESS:</span> ₹
                      </p>
                      <p className="font-bold text-lg col-span-full">
                        <span className="font-medium">Net Tax Liability:</span>{" "}
                        ₹
                      </p>
                    </div>
                  );
                })()}
              </div>

              {/* Verification Preview */}
              {/* <div
                className={`p-4 rounded-lg ${
                  theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                }`}
              >
                <h4 className="font-semibold mb-3">Verification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {gstr3bData.verification.date}
                  </p>
                  <p>
                    <span className="font-medium">Authorized Signatory:</span>{" "}
                    {gstr3bData.verification.authorizedSignatoryName}
                  </p>
                  <p>
                    <span className="font-medium">Designation:</span>{" "}
                    {gstr3bData.verification.designation}
                  </p>
                  <p>
                    <span className="font-medium">Place:</span>{" "}
                    {gstr3bData.verification.place}
                  </p>
                </div>
              </div> */}
            </div>
            <div
              className={`sticky bottom-0 px-6 py-4 border-t flex justify-end gap-3 ${
                theme === "dark"
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <button
                onClick={() => setShowPreviewMode(false)}
                className={`px-4 py-2 rounded-md ${
                  theme === "dark"
                    ? "bg-gray-600 hover:bg-gray-700"
                    : "bg-gray-300 hover:bg-gray-400"
                }`}
              >
                Back to Edit
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                Submit Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARN Display Modal */}
      {showArnModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div
            className={`max-w-md w-full mx-4 rounded-lg ${
              theme === "dark" ? "bg-gray-800" : "bg-white"
            }`}
          >
            <div
              className={`px-6 py-4 border-b ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <h3 className="text-lg font-semibold text-green-600">
                GSTR-3B Submitted Successfully!
              </h3>
            </div>
            <div className="p-6">
              <div className="text-center">
                <div className="mb-4">
                  <svg
                    className="w-16 h-16 text-green-500 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold mb-2">
                  Return Filed Successfully
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  Your GSTR-3B return has been submitted to the GST portal.
                </p>

                <div
                  className={`p-4 rounded-lg ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-50"
                  } mb-4`}
                >
                  <p className="text-sm font-medium mb-2">
                    Acknowledgement Reference Number (ARN)
                  </p>
                  <p className="text-xl font-mono font-bold text-blue-600">
                    {generatedArn}
                  </p>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">Return Period:</span>{" "}
                  </p>
                  <p>
                    <span className="font-medium">Filed Date:</span>{" "}
                    {new Date().toLocaleDateString("en-IN")}
                  </p>
                  <p>
                    <span className="font-medium">Filed Time:</span>{" "}
                    {new Date().toLocaleTimeString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
            <div
              className={`px-6 py-4 border-t flex justify-center ${
                theme === "dark" ? "border-gray-700" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => {
                  setShowArnModal(false);
                  setGeneratedArn("");
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GSTR3B;
