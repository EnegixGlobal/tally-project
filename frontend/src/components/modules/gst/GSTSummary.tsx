import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Download ,ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GSTSummaryData {
  period: string;
  totalSales: number;
  totalPurchases: number;
  outputGST: number;
  inputGST: number;
  netGST: number;
  itcClaimed: number;
  gstPaid: number;
}

const GSTSummary: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
    const navigate = useNavigate();
  const [selectedYear, setSelectedYear] = useState('2024');

  const summaryData: GSTSummaryData[] = [
    {
      period: 'Jan 2024',
      totalSales: 5000000,
      totalPurchases: 3000000,
      outputGST: 900000,
      inputGST: 540000,
      netGST: 360000,
      itcClaimed: 540000,
      gstPaid: 360000
    },
    {
      period: 'Dec 2023',
      totalSales: 4500000,
      totalPurchases: 2800000,
      outputGST: 810000,
      inputGST: 504000,
      netGST: 306000,
      itcClaimed: 504000,
      gstPaid: 306000
    },
    {
      period: 'Nov 2023',
      totalSales: 4200000,
      totalPurchases: 2600000,
      outputGST: 756000,
      inputGST: 468000,
      netGST: 288000,
      itcClaimed: 468000,
      gstPaid: 288000
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

  const gstRateBreakdown = [
    { rate: '0%', amount: 500000, percentage: 10 },
    { rate: '5%', amount: 1000000, percentage: 20 },
    { rate: '12%', amount: 1500000, percentage: 30 },
    { rate: '18%', amount: 1500000, percentage: 30 },
    { rate: '28%', amount: 500000, percentage: 10 }
  ];

  return (
    <div className="min-h-screen pt-[56px] px-4">
      <div className="max-w-7xl mx-auto">
         <div className="flex items-center mb-4">

            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/gst')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Summary</h1>
            </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">GST Summary</h1>
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
              <button
              type='button'
              title='Export Summary'
               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                  <div className="text-sm opacity-90">Total Sales</div>
                  <div className="text-2xl font-bold">{formatCurrency(currentPeriod.totalSales)}</div>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    {getPercentageChange(currentPeriod.totalSales, previousPeriod.totalSales) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {Math.abs(getPercentageChange(currentPeriod.totalSales, previousPeriod.totalSales)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Output GST</div>
                  <div className="text-2xl font-bold">{formatCurrency(currentPeriod.outputGST)}</div>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    {getPercentageChange(currentPeriod.outputGST, previousPeriod.outputGST) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {Math.abs(getPercentageChange(currentPeriod.outputGST, previousPeriod.outputGST)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Input GST</div>
                  <div className="text-2xl font-bold">{formatCurrency(currentPeriod.inputGST)}</div>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    {getPercentageChange(currentPeriod.inputGST, previousPeriod.inputGST) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {Math.abs(getPercentageChange(currentPeriod.inputGST, previousPeriod.inputGST)).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm opacity-90">Net GST Payable</div>
                  <div className="text-2xl font-bold">{formatCurrency(currentPeriod.netGST)}</div>
                  <div className="flex items-center gap-1 text-sm mt-1">
                    {getPercentageChange(currentPeriod.netGST, previousPeriod.netGST) > 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {Math.abs(getPercentageChange(currentPeriod.netGST, previousPeriod.netGST)).toFixed(1)}%
                    </span>
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
                  <span className="text-gray-600">Total Sales (Taxable Value)</span>
                  <span className="font-medium">{formatCurrency(currentPeriod.totalSales)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Output GST Collected</span>
                  <span className="font-medium">{formatCurrency(currentPeriod.outputGST)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Purchases (Taxable Value)</span>
                  <span className="font-medium">{formatCurrency(currentPeriod.totalPurchases)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Input GST Paid</span>
                  <span className="font-medium">{formatCurrency(currentPeriod.inputGST)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">ITC Claimed</span>
                  <span className="font-medium">{formatCurrency(currentPeriod.itcClaimed)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Net GST Payable</span>
                    <span className="font-bold text-red-600">{formatCurrency(currentPeriod.netGST)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">GST Rate-wise Breakdown</h3>
              <div className="space-y-4">
                {gstRateBreakdown.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 w-8">{item.rate}</span>
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
                    <th className="pb-3 text-sm font-medium text-gray-600">Sales</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Purchases</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Output GST</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Input GST</th>
                    <th className="pb-3 text-sm font-medium text-gray-600">Net GST</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryData.map((data, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 text-sm font-medium text-gray-900">{data.period}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.totalSales)}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.totalPurchases)}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.outputGST)}</td>
                      <td className="py-3 text-sm text-gray-700">{formatCurrency(data.inputGST)}</td>
                      <td className="py-3 text-sm font-medium text-red-600">{formatCurrency(data.netGST)}</td>
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

export default GSTSummary;