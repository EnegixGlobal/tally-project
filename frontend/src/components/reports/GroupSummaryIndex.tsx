import React, { useEffect, useState, type ReactNode } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building } from 'lucide-react';
interface GroupType {
  icon: ReactNode;
  type: string;
  name: string;
  description: string;
  color: string;
}

const GroupSummaryIndex: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
const [groupTypes, setGroupTypes] = useState<GroupType[]>([]);
  const [, setLoading] = useState(true);
const companyId = localStorage.getItem("company_id") || '';
  const ownerType = localStorage.getItem("supplier") || '';
  const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || '';

useEffect(() => {
  const fetchGroups = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/group-summary?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
      );
      const data = await res.json();

      console.log("API response:", data);

      // groups hamesha data.ledgerGroups ke andar milenge
      const groupsArray = data.ledgerGroups || [];

      // ab unko map karke UI ke liye enrich karte hain
      const mappedGroups = groupsArray.map((g: any) => ({
        type: g.type || "unknown",
        name: g.name,
        description: `View ${g.name} accounts summary`,
        icon: <Building size={24} />, // default icon (chahe switch case bana lo)
        color: "bg-blue-500"
      }));

      setGroupTypes(mappedGroups);
    } catch (err) {
      console.error("Failed to fetch groups:", err);
      setGroupTypes([]);
    } finally {
      setLoading(false);
    }
  };

  fetchGroups();
}, []);

  // const groupTypes = [
  //   {
  //     type: 'capital',
  //     name: 'Capital Account',
  //     description: 'View capital and equity accounts',
  //     icon: <Building size={24} />,
  //     color: 'bg-blue-500'
  //   },
  //   {
  //     type: 'loans',
  //     name: 'Loans (Liability)',
  //     description: 'View loan and liability accounts',
  //     icon: <Briefcase size={24} />,
  //     color: 'bg-red-500'
  //   },
  //   {
  //     type: 'current-liabilities',
  //     name: 'Current Liabilities',
  //     description: 'View current liability accounts',
  //     icon: <TrendingUp size={24} />,
  //     color: 'bg-orange-500'
  //   },
  //   {
  //     type: 'current-assets',
  //     name: 'Current Assets',
  //     description: 'View current asset accounts',
  //     icon: <Wallet size={24} />,
  //     color: 'bg-green-500'
  //   },
  //   {
  //     type: 'fixed-assets',
  //     name: 'Fixed Assets',
  //     description: 'View fixed asset accounts',
  //     icon: <Building size={24} />,
  //     color: 'bg-purple-500'
  //   },
  //   {
  //     type: 'sales',
  //     name: 'Sales',
  //     description: 'View sales accounts summary',
  //     icon: <ShoppingCart size={24} />,
  //     color: 'bg-emerald-500'
  //   },
  //   {
  //     type: 'purchase',
  //     name: 'Purchases',
  //     description: 'View purchase accounts summary',
  //     icon: <ShoppingCart size={24} />,
  //     color: 'bg-amber-500'
  //   },
  //   {
  //     type: 'direct-expenses',
  //     name: 'Direct Expenses',
  //     description: 'View direct expense accounts',
  //     icon: <DollarSign size={24} />,
  //     color: 'bg-red-400'
  //   },
  //   {
  //     type: 'indirect-expenses',
  //     name: 'Indirect Expenses',
  //     description: 'View indirect expense accounts',
  //     icon: <DollarSign size={24} />,
  //     color: 'bg-orange-400'
  //   },
  //   {
  //     type: 'indirect-income',
  //     name: 'Indirect Income',
  //     description: 'View indirect income accounts',
  //     icon: <BarChart3 size={24} />,
  //     color: 'bg-cyan-500'
  //   }
  // ];

  const handleGroupClick = (groupType: string) => {
    navigate(`/app/reports/group-summary/${groupType}`);
  };

  const handleBackClick = () => {
    navigate('/app/reports');
  };

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBackClick}
            title="Go back to Reports"
            className={`p-2 rounded-lg mr-3 ${
              theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Group Summary</h1>
        </div>
      </div>

      {/* Description */}
      <div className={`p-4 rounded-lg mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Group Summary</span> shows the summarized view of ledger accounts grouped by their category. 
          Select a group type below to view detailed summary of accounts under that category.
        </p>
      </div>

      {/* Group Type Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {Array.isArray(groupTypes) && groupTypes.map((group, index) => (
          <div
            key={index}
            onClick={() => handleGroupClick(group.type)}
            className={`p-6 rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700' 
                : 'bg-white hover:bg-gray-50 shadow-md hover:shadow-lg'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg text-white ${group.color}`}>
                {group.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{group.name}</h3>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {group.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pro Tip */}
      <div className={`mt-6 p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Click on any group type above to view detailed ledger-wise summary. 
          You can drill down further by clicking on individual ledgers in the summary.
        </p>
      </div>
    </div>
  );
};

export default GroupSummaryIndex;
