import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Filter, Printer, Download } from 'lucide-react';

// Types based on your data structure
interface Ledger {
  id: number;
  name: string;
  groupId: number;
  openingBalance: number;
  balanceType: 'debit' | 'credit';
}

interface GroupData {
  groupName: string;
  groupType: string;
  ledgers: Ledger[];
  total: { debit: number; credit: number };
}

// interface TrialBalanceResponse {
//   groupedData: Record<string, GroupData>;
//   totalDebit: number;
//   totalCredit: number;
// }

const TrialBalance: React.FC = () => {
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [groupedData, setGroupedData] = useState<Record<string, GroupData>>({});
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
const companyId = localStorage.getItem("company_id") || '';
const ownerType = localStorage.getItem("userType") || '';
const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || '';
  // Fetch trial balance data from backend
  const fetchTrialBalance = async () => {
  setLoading(true);
  setError(null);
  try {
    const url = `http://localhost:5000/api/trial-balance?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;
    const res = await fetch(url);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Server error: ${res.status}: ${text}`);
    }
    const data = await res.json();
    setGroupedData(data.groupedData);
    setTotalDebit(data.totalDebit);
    setTotalCredit(data.totalCredit);
  } catch (err: any) {
    setError(err.message || 'Error fetching data');
    setGroupedData({});
    setTotalDebit(0);
    setTotalCredit(0);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchTrialBalance();
}, []);

  const handleLedgerClick = (ledger: Ledger) => {
    navigate(`/app/reports/ledger?ledgerId=${ledger.id}`);
  };

  const handleGroupClick = (groupType: string) => {
    navigate(`/app/reports/group-summary/${groupType}`);
  };

  // Helper functions to display debit and credit amounts
  const getBalanceForDisplay = (amount: number, type: 'debit' | 'credit') =>
    type === 'debit' ? amount : 0;

  const getCreditBalanceForDisplay = (amount: number, type: 'debit' | 'credit') =>
    type === 'credit' ? amount : 0;

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Reports"
          type="button"
          onClick={() => navigate('/app/reports')}
          className="mr-4 p-2 rounded-full hover:bg-gray-200"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Trial Balance</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Toggle Filters"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className="p-2 rounded-md hover:bg-gray-200"
          >
            <Filter size={18} />
          </button>
          <button title="Print Report" className="p-2 rounded-md hover:bg-gray-200">
            <Printer size={18} />
          </button>
          <button title="Download Report" className="p-2 rounded-md hover:bg-gray-200">
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div className="p-4 mb-6 rounded-lg bg-white shadow">
          <h3 className="font-semibold mb-4">Filters (Coming Soon)</h3>
          {/* Add actual filter controls here */}
          <p className="text-sm text-gray-600">Filter functionality is not implemented yet.</p>
        </div>
      )}

      <div className="p-6 rounded-lg bg-white shadow">
        <div className="mb-4 text-center">
          <h2 className="text-xl font-bold">Trial Balance</h2>
          <p className="text-sm opacity-75">As of {new Date().toLocaleDateString()}</p>
        </div>

        {loading && <p className="text-center text-gray-500">Loading trial balance...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-300">
                  <th className="px-4 py-3 text-left">Particulars</th>
                  <th className="px-4 py-3 text-left">Opening Balance</th>
                  <th className="px-4 py-3 text-right">Debit (Dr)</th>
                  <th className="px-4 py-3 text-right">Credit (Cr)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedData).map(([groupType, groupData]) => (
                  <React.Fragment key={groupType}>
                    {/* Group Header */}
                    <tr
                      className="bg-gray-100 border-b border-gray-300 cursor-pointer hover:opacity-80"
                      title={`Click to view ${groupData.groupName} group summary`}
                      onClick={() => handleGroupClick(groupType)}
                    >
                      <td className="px-4 py-3 font-bold text-blue-600">{groupData.groupName}</td>
                      <td className="px-4 py-3 text-sm opacity-75">Group Total</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {groupData.total.debit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        {groupData.total.credit.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </td>
                    </tr>

                    {/* Ledgers */}
                    {groupData.ledgers.map((ledger) => (
                      <tr
                        key={ledger.id}
                        className="border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                        title={`Click to view ${ledger.name} ledger details`}
                        onClick={() => handleLedgerClick(ledger)}
                      >
                        <td className="px-8 py-2 text-sm">{ledger.name}</td>
                        <td className="px-4 py-2 text-sm opacity-75">
                          {ledger.openingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-sm">
                          {getBalanceForDisplay(ledger.openingBalance, ledger.balanceType).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                          )}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-sm">
                          {getCreditBalanceForDisplay(ledger.openingBalance, ledger.balanceType).toLocaleString(
                            undefined,
                            { minimumFractionDigits: 2, maximumFractionDigits: 2 }
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold border-t-2 border-gray-300">
                  <td className="px-4 py-3" colSpan={2}>
                    Total
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
                {totalDebit === totalCredit ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-center">
                      <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                        Trial Balance is in balance
                      </span>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-2 text-center">
                      <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800">
                        Out of balance by{' '}
                        {Math.abs(totalDebit - totalCredit).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 rounded bg-blue-50">
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press F5 to refresh the report, F12 to configure display options.
        </p>
      </div>
    </div>
  );
};

export default TrialBalance;
