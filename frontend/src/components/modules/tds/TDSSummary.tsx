import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Download,  ArrowLeft } from 'lucide-react';//Calendar,Filter
import { useNavigate } from 'react-router-dom';

interface TDSSummaryData {
  period: string;
  totalDeductions: number;
  totalDeposits: number;
  totalDeductees: number;
  form24Q: number;
  form26Q: number;
  form27Q: number;
  pendingDeposits: number;
}

const TDSSummary: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedYear, setSelectedYear] = useState('2024');
  const navigate = useNavigate()

  const summaryData: TDSSummaryData[] = [
    {
      period: 'Jan 2024',
      totalDeductions: 4500000,
      totalDeposits: 4500000,
      totalDeductees: 260,
      form24Q: 2500000,
      form26Q: 1500000,
      form27Q: 500000,
      pendingDeposits: 0
    },
    {
      period: 'Dec 2023',
      totalDeductions: 4200000,
      totalDeposits: 4200000,
      totalDeductees: 242,
      form24Q: 2300000,
      form26Q: 1400000,
      form27Q: 500000,
      pendingDeposits: 0
    },
    {
      period: 'Nov 2023',
      totalDeductions: 3900000,
      totalDeposits: 3900000,
      totalDeductees: 230,
      form24Q: 2200000,
      form26Q: 1300000,
      form27Q: 400000,
      pendingDeposits: 0
    }
  ];

  const currentPeriod = summaryData[0];
  const previousPeriod = summaryData[1];

  const getPercentageChange = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const sectionBreakdown = [
    { section: '192 - Salary', amount: 2500000, percentage: 55.6 },
    { section: '194C - Contractor', amount: 850000, percentage: 18.9 },
    { section: '194J - Professional', amount: 450000, percentage: 10.0 },
    { section: '194I - Rent', amount: 250000, percentage: 5.6 },
    { section: '206C - TCS', amount: 450000, percentage: 10.0 }
  ];

  return (
    <div className="min-h-screen pt-[56px] px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/tds')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">TDS Summaary</h1>
            </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">TDS Summary</h1>
            </div>
            <div className="flex gap-3">
              <select
              title='Select Period'
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <select
              title='Select Year'
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
              </select>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total TDS Deducted</div>
                  <div className="text-2xl font-bold">{formatCurrency(currentPeriod.totalDeductions)}</div>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    {getPercentageChange(currentPeriod.totalDeductions, previousPeriod.totalDeductions) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {Math.abs(getPercentageChange(currentPeriod.totalDeductions, previousPeriod.totalDeductions)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total TDS Deposited</div>
                  <div className="text-2xl font-bold">{formatCurrency(currentPeriod.totalDeposits)}</div>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    {getPercentageChange(currentPeriod.totalDeposits, previousPeriod.totalDeposits) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {Math.abs(getPercentageChange(currentPeriod.totalDeposits, previousPeriod.totalDeposits)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Total Deductees</div>
                  <div className="text-2xl font-bold">{currentPeriod.totalDeductees}</div>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    {getPercentageChange(currentPeriod.totalDeductees, previousPeriod.totalDeductees) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {Math.abs(getPercentageChange(currentPeriod.totalDeductees, previousPeriod.totalDeductees)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Pending Deposits</div>
                  <div className="text-2xl font-bold">{formatCurrency(currentPeriod.pendingDeposits)}</div>
                  <div className="text-sm mt-1">
                    {currentPeriod.pendingDeposits === 0 ? 'All Clear' : 'Action Required'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Period Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Form 24Q (Salary)</span>
                  <span className="font-medium">{formatCurrency(currentPeriod.form24Q)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Form 26Q (Non-Salary)</span>
                  <span className="font-medium">{formatCurrency(currentPeriod.form26Q)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Form 27Q (TCS)</span>
                  <span className="font-medium">{formatCurrency(currentPeriod.form27Q)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total TDS/TCS</span>
                    <span className="font-bold text-blue-600">{formatCurrency(currentPeriod.totalDeductions)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Section-wise Breakdown</h3>
              <div className="space-y-4">
                {sectionBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 w-32">{item.section}</span>
                      <div className="flex-1">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-900 ml-3">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trend */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trend</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left">
                    <th className="pb-3 text-sm font-medium text-gray-600">Period</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Deductees</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">TDS Deducted</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">TDS Deposited</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Form 24Q</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Form 26Q</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Form 27Q</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((data, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 text-sm font-medium text-gray-900">{data.period}</td>
                      <td className="py-3 text-sm text-gray-700">{data.totalDeductees}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.totalDeductions)}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.totalDeposits)}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.form24Q)}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.form26Q)}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.form27Q)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TDSSummary;