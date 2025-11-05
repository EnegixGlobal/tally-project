import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download } from 'lucide-react';

interface CashFlowAccount {
  name: string;
  amount: number;
}

interface CashFlowSummaryData {
  inflow: CashFlowAccount[];
  outflow: CashFlowAccount[];
}

const CashFlowSummary: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const { monthCode } = useParams<{ monthCode: string }>();

  const [cashFlowData, setCashFlowData] = useState<CashFlowSummaryData>({ inflow: [], outflow: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from backend API when component mounts or monthCode changes
  useEffect(() => {
    const fetchCashFlowSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        // Construct URL with optional monthCode param
        let url = `http://localhost:5000/api/cashflow/summary`;
        if (monthCode) {
          url += `/${encodeURIComponent(monthCode)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          const text = await response.text();
          throw new Error(`Error ${response.status}: ${text}`);
        }
        const data: CashFlowSummaryData = await response.json();
        setCashFlowData(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load cash flow summary');
      } finally {
        setLoading(false);
      }
    };

    fetchCashFlowSummary();
  }, [monthCode]);

  const totalInflow = cashFlowData.inflow.reduce((sum, acc) => sum + acc.amount, 0);
  const totalOutflow = cashFlowData.outflow.reduce((sum, acc) => sum + acc.amount, 0);
  const netInflow = totalInflow - totalOutflow;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 }).format(amount);

  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          title="Back to Cash Flow"
          onClick={() => navigate('/app/reports/cash-flow')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-xl font-bold`}>
            Cash Flow Summary
          </h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            Company: Abd Pvt Ltd
          </p>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
            Period: {monthCode || 'Current Month'}
          </p>
        </div>
        <div className="flex space-x-2">
          <button title="Print Report" type="button" className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Printer size={18} />
          </button>
          <button title="Download Report" type="button" className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Loading & Error */}
      {loading && <p>Loading cash flow summary...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {/* Data Sections */}
      {!loading && !error && (
        <div className={`rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="grid grid-cols-2 h-full">
            {/* Inflow Section */}
            <div className={`border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-blue-900' : 'border-gray-200 bg-blue-50'}`}>
                <h3 className={`text-lg font-semibold text-center ${theme === 'dark' ? 'text-blue-300' : 'text-blue-900'}`}>
                  Inflow
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {cashFlowData.inflow.map((account, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2">
                    <button
                      onClick={() => navigate(`/app/reports/group-cash-flow/${encodeURIComponent(account.name)}`, {
                        state: { accountData: account },
                      })}
                      className={`font-medium text-left hover:underline transition-colors ${
                        theme === 'dark' ? 'text-gray-200 hover:text-blue-400' : 'text-gray-800 hover:text-blue-600'
                      }`}
                    >
                      {account.name}
                    </button>
                    <span className={`font-semibold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency(account.amount)}
                    </span>
                  </div>
                ))}

                <div className={`border-t pt-3 mt-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className="flex justify-between items-center py-2 font-bold">
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Total</span>
                    <span className={`text-lg ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                      {formatCurrency(totalInflow)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Outflow Section */}
            <div>
              <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700 bg-red-900' : 'border-gray-200 bg-red-50'}`}>
                <h3 className={`text-lg font-semibold text-center ${theme === 'dark' ? 'text-red-300' : 'text-red-900'}`}>
                  Outflow
                </h3>
              </div>
              <div className="px-6 py-4 space-y-3">
                {cashFlowData.outflow.map((account, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2">
                    <button
                      onClick={() => navigate(`/app/reports/group-cash-flow/${encodeURIComponent(account.name)}`, {
                        state: { accountData: account },
                      })}
                      className={`font-medium text-left hover:underline transition-colors ${
                        theme === 'dark' ? 'text-gray-200 hover:text-red-400' : 'text-gray-800 hover:text-red-600'
                      }`}
                    >
                      {account.name}
                    </button>
                    <span className={`font-semibold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      {formatCurrency(account.amount)}
                    </span>
                  </div>
                ))}

                <div className={`border-t pt-3 mt-4 ${theme === 'dark' ? 'border-gray-600' : 'border-gray-300'}`}>
                  <div className="flex justify-between items-center py-2 font-bold">
                    <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Total</span>
                    <span className={`text-lg ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                      {formatCurrency(totalOutflow)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Net flow summary */}
          <div className={`border-t px-6 py-4 ${theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex justify-center">
              <div className="text-center">
                <span className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Net Inflow:{' '}
                </span>
                <span className={`text-xl font-bold ml-3 ${netInflow >= 0 ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : (theme === 'dark' ? 'text-red-400' : 'text-red-600')}`}>
                  {netInflow >= 0 ? '+' : '-'}
                  {formatCurrency(Math.abs(netInflow))}
                  {netInflow < 0 && ' (Outflow)'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashFlowSummary;
