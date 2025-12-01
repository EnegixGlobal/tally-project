import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';

interface MonthlyCashFlow {
  month: string;
  monthCode: string;
  inflow: number;
  outflow: number;
  netFlow: number;
}

const CashFlow: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024-25');
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
  const [cashFlowData, setCashFlowData] = useState<MonthlyCashFlow[]>([]);
  const [selectedMonth] = useState('Apr-24');

  // Calculate totals
 
const [totalInflow, setTotalInflow] = useState<number>(0);
const [totalOutflow, setTotalOutflow] = useState<number>(0);
const [totalNetFlow, setTotalNetFlow] = useState<number>(0);
const companyId = localStorage.getItem("company_id") || '';
const ownerType = localStorage.getItem("supplier") || '';
const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || '';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const handleMonthClick = (monthData: MonthlyCashFlow) => {
    // Navigate to detailed cash flow summary for the month
    navigate(`/app/reports/cash-flow-summary/${monthData.monthCode}`, {
      state: { monthData }
    });
  };
useEffect(() => {
  async function fetchCashFlow() {
    try {
      // If custom range, pass both dates; else pass financial year
      const params = [
        `company_id=${companyId}`,
        `owner_type=${ownerType}`,
        `owner_id=${ownerId}`
      ];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (!startDate && !endDate) params.push(`financialYear=${selectedYear}`);

      const url = `${import.meta.env.VITE_API_URL}/api/cash-flow?${selectedMonth}&${params.join('&')}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load cash flow data');
      const data = await res.json();
      setCashFlowData(data.cashFlowData);
      setTotalInflow(data.totalInflow);
      setTotalOutflow(data.totalOutflow);
      setTotalNetFlow(data.totalNetFlow);
    } catch (e) {
      // handle errors
    }
  }
  fetchCashFlow();
}, [selectedYear, startDate, endDate]);
  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button
          type="button"
          title='Back to Reports'
          onClick={() => navigate('/app/reports')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Cash Flow</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title='Toggle Filters'
            type='button'
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
          </button>
          <button
            title='Print Report'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title='Download Report'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      {showFilterPanel && (
        <div className={`p-4 mb-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
        }`}>
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Financial Year
              </label>
              <select
                title='Select Financial Year'
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                From Date
              </label>
              <input
                type="date"
                title='From Date'
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                To Date
              </label>
              <input
                type="date"
                title='To Date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}

                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className={`rounded-xl border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Total Inflow
              </h3>
              <p className={`text-2xl font-bold mt-2 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                {formatCurrency(totalInflow)}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
        </div>

        <div className={`rounded-xl border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Total Outflow
              </h3>
              <p className={`text-2xl font-bold mt-2 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {formatCurrency(totalOutflow)}
              </p>
            </div>
            <TrendingDown className={`w-8 h-8 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`} />
          </div>
        </div>

        <div className={`rounded-xl border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Net Flow
              </h3>
              <p className={`text-2xl font-bold mt-2 ${
                totalNetFlow >= 0
                  ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  : theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {totalNetFlow >= 0 ? '+' : '-'}{formatCurrency(totalNetFlow)}
              </p>
            </div>
            <TrendingUp className={`w-8 h-8 ${
              totalNetFlow >= 0
                ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                : theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`} />
          </div>
        </div>
      </div>
      
      {/* Monthly Cash Flow Table */}
      <div className={`rounded-xl border ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Monthly Cash Movement - {selectedYear}
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Month
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Inflow
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Outflow
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Net Flow
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {cashFlowData.map((monthData, index) => (
                <tr 
                  key={index} 
                  onClick={() => handleMonthClick(monthData)}
                  className={`cursor-pointer transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {monthData.month}
                    </div>
                    <div className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {monthData.monthCode}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {formatCurrency(monthData.inflow)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {formatCurrency(monthData.outflow)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-bold ${
                      monthData.netFlow >= 0
                        ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                        : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {monthData.netFlow >= 0 ? '+' : '-'}{formatCurrency(monthData.netFlow)}
                    </div>
                  </td>
                </tr>
              ))}
              
              {/* Grand Total Row */}
              <tr className={`border-t-2 font-bold ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700' 
                  : 'border-gray-400 bg-gray-100'
              }`}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>
                    Grand Total
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {formatCurrency(totalInflow)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold ${
                    theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {formatCurrency(totalOutflow)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className={`text-sm font-bold ${
                    totalNetFlow >= 0
                      ? theme === 'dark' ? 'text-green-400' : 'text-green-600'
                      : theme === 'dark' ? 'text-red-400' : 'text-red-600'
                  }`}>
                    {totalNetFlow >= 0 ? '+' : '-'}{formatCurrency(totalNetFlow)}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Click on any month to view detailed cash flow summary. Press F5 to refresh, F12 to configure display options.
        </p>
      </div>
    </div>
  );
};

export default CashFlow;