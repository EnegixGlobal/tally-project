import React, { useEffect, useState, type ReactNode } from "react";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Building } from "lucide-react";
interface GroupType {
  id: number;
  name: string;
  nature?: string;
  description: string;
  icon: ReactNode;
  color: string;
}

const GroupSummaryIndex: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [, setLoading] = useState(true);
  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const [selectedNature, setSelectedNature] = useState<string | null>(null);

  const ownerId =
    localStorage.getItem(
      ownerType === "employee" ? "employee_id" : "user_id"
    ) || "";

  const baseGroups = [
    { id: -1, name: "Bank Accounts", nature: "Assets" },
    { id: -2, name: "Bank OD A/c", nature: "Assets" },
    { id: -3, name: "Branch/Division", nature: "Assets" },
    { id: -4, name: "Capital Account", nature: "Liabilities" },
    { id: -5, name: "Current Assets", nature: "Assets" },
    { id: -6, name: "Current Liabilities", nature: "Liabilities" },
    { id: -7, name: "Direct Expenses", nature: "Expenses" },
    { id: -8, name: "Direct Income", nature: "Income" },
    { id: -9, name: "Fixed Assets", nature: "Assets" },
    { id: -10, name: "Indirect Expenses", nature: "Expenses" },
    { id: -11, name: "Indirect Income", nature: "Income" },
    { id: -12, name: "Investments", nature: "Assets" },
    { id: -13, name: "Loan(Liability)", nature: "Liabilities" },
    { id: -14, name: "Misc expenses (Assets)", nature: "Assets" },
    { id: -15, name: "Purchase Accounts", nature: "Expenses" },
    { id: -16, name: "Sales Accounts", nature: "Income" },
    { id: -17, name: "Suspense A/C", nature: "Assets" },
    { id: -18, name: "Profit/Loss", nature: "Liabilities" },
    { id: -19, name: "TDS Payables", nature: "Liabilities" },
  ];

  //fixed ui

  const Assets = [
    {
      name: "Assets",
      type: "Assets",
      description: "View all asset accounts",
      icon: <Building size={24} />,
      color: "bg-green-500",
    },
    {
      name: "Liabilities",
      type: "Liabilities",
      description: "View all liability accounts",
      icon: <Building size={24} />,
      color: "bg-red-500",
    },
    {
      name: "Expenses",
      type: "Expenses",
      description: "View all expense accounts",
      icon: <Building size={24} />,
      color: "bg-yellow-500",
    },
    {
      name: "Income",
      type: "Income",
      description: "View all income accounts",
      icon: <Building size={24} />,
      color: "bg-blue-500",
    },
  ];

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const res = await fetch(
          `${
            import.meta.env.VITE_API_URL
          }/api/group-summary?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );

        const data = await res.json();
        console.log("Fetched groups data:", data);

        const backendGroups = (data.ledgerGroups || []).map((g: any) => ({
          id: g.id,
          type: g.id,
          name: g.name,
          nature: g.nature,
          description: `View ${g.name} accounts summary`,
          icon: <Building size={24} />,
          color: "bg-blue-500",
        }));

        const baseGroupMapped = baseGroups.map((g) => ({
          id: g.id,
          // type: `base-${Math.abs(g.id)}`,
          type: g.id,
          name: g.name,
          nature: g.nature,
          description: `View ${g.name} accounts summary`,
          icon: <Building size={24} />,
          color: "bg-green-500",
        }));

        // marge backed or baseGroup data
        const mergedGroups = [...baseGroupMapped, ...backendGroups];

        setGroupTypes(mergedGroups);
      } catch (err) {
        console.error("Failed to fetch groups:", err);
        setGroupTypes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const handleGroupClick = (groupType: string) => {
    navigate(`/app/reports/group-summary/${groupType}`);
  };

  const handleBackClick = () => {
    navigate("/app/reports");
  };

  const filteredGroups = selectedNature
    ? groupTypes.filter((g) => g.nature === selectedNature)
    : [];

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBackClick}
            title="Go back to Reports"
            className={`p-2 rounded-lg mr-3 ${
              theme === "dark"
                ? "bg-gray-700 hover:bg-gray-600 text-white"
                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Group Summary</h1>
        </div>
      </div>

      {/* Description */}
      <div
        className={`p-4 rounded-lg mb-6 ${
          theme === "dark" ? "bg-gray-800" : "bg-blue-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Group Summary</span> shows the
          summarized view of ledger accounts grouped by their category. Select a
          group type below to view detailed summary of accounts under that
          category.
        </p>
      </div>

      {selectedNature && (
        <button
          onClick={() => setSelectedNature(null)}
          className="mb-6 px-4 py-2 rounded bg-blue-200 hover:bg-blue-300"
        >
          ← Back to Categories
        </button>
      )}

      {/* GroupType Assest */}
      {!selectedNature && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {Assets.map((group, index) => (
            <div
              key={index}
              onClick={() => setSelectedNature(group.type)}
              className={`p-6 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-white hover:bg-gray-50 shadow-md hover:shadow-lg"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg text-white ${group.color}`}>
                  {group.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {group.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {Array.isArray(groupTypes) &&
          filteredGroups.map((group, index) => (
            <div
              key={index}
              onClick={() => navigate(`/app/reports/group-summary/${group.id}`)}
              className={`p-6 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                theme === "dark"
                  ? "bg-gray-800 hover:bg-gray-700"
                  : "bg-white hover:bg-gray-50 shadow-md hover:shadow-lg"
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg text-white ${group.color}`}>
                  {group.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                  <p
                    className={`text-sm ${
                      theme === "dark" ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    {group.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Pro Tip */}
      <div
        className={`mt-6 p-4 rounded-lg ${
          theme === "dark" ? "bg-gray-800" : "bg-gray-50"
        }`}
      >
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Click on any group
          type above to view detailed ledger-wise summary. You can drill down
          further by clicking on individual ledgers in the summary.
        </p>
      </div>
    </div>
  );
};

export default GroupSummaryIndex;
