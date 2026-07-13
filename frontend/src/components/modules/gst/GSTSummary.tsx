import React, { useState, useEffect } from 'react';
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
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(String(currentYear));
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const company_id = localStorage.getItem("company_id");
  const owner_type = localStorage.getItem("supplier");
  const owner_id = localStorage.getItem(owner_type === "employee" ? "employee_id" : "user_id") || "";

  const [summaryData, setSummaryData] = useState<GSTSummaryData[]>([]);
  const [rateBreakdown, setRateBreakdown] = useState([
    { rate: '0%', amount: 0, percentage: 0 },
    { rate: '5%', amount: 0, percentage: 0 },
    { rate: '12%', amount: 0, percentage: 0 },
    { rate: '18%', amount: 0, percentage: 0 },
    { rate: '28%', amount: 0, percentage: 0 }
  ]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!company_id || !owner_type || !owner_id) return;

    const fetchGSTSummary = async () => {
      try {
        setLoading(true);

        const [purchaseRes, salesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/gst-assessment/purchase?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}&year=${selectedYear}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/gst-assessment/sales?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}&year=${selectedYear}`)
        ]);

        const purchaseJson = await purchaseRes.json();
        const salesJson = await salesRes.json();

        if (purchaseJson.success && salesJson.success) {
          const pData = purchaseJson.data.monthlyData || {};
          const sData = salesJson.data.monthlyData || {};
          
          const ledgerMap = new Map();
          if (purchaseJson.data.ledgers) {
            Object.values(purchaseJson.data.ledgers).flat().forEach((l: any) => ledgerMap.set(String(l.id), l));
          }
          if (salesJson.data.ledgers) {
            Object.values(salesJson.data.ledgers).flat().forEach((l: any) => ledgerMap.set(String(l.id), l));
          }

          const getRate = (id: string) => {
            const ledger = ledgerMap.get(String(id));
            if (!ledger) return 0;
            const match = ledger.name.match(/(\d+(\.\d+)?)/);
            const rate = match ? parseFloat(match[0]) : 0;
            return [0, 5, 12, 18, 28].includes(rate) ? rate : 0;
          };

          const monthNames = [
            "Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
          ];

          const monthlyDataRaw = monthNames.map(mName => {
            const pMonth = pData[mName] || { totalIntraPurchase: 0, totalInterPurchase: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0 };
            const sMonth = sData[mName] || { totalIntraSales: 0, totalInterSales: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0 };

            const totalSales = sMonth.totalIntraSales + sMonth.totalInterSales;
            const totalPurchases = pMonth.totalIntraPurchase + pMonth.totalInterPurchase;
            const outputGST = sMonth.totalCGST + sMonth.totalSGST + sMonth.totalIGST;
            const inputGST = pMonth.totalCGST + pMonth.totalSGST + pMonth.totalIGST;
            const netGST = outputGST - inputGST;

            return {
              period: `${mName} ${selectedYear}`,
              totalSales,
              totalPurchases,
              outputGST,
              inputGST,
              netGST: netGST > 0 ? netGST : 0,
              itcClaimed: inputGST,
              gstPaid: netGST > 0 ? netGST : 0,
            };
          });

          let combinedData: GSTSummaryData[] = [];
          let totalBreakdown: Record<number, number> = { 0: 0, 5: 0, 12: 0, 18: 0, 28: 0 };

          monthNames.forEach(mName => {
             const pMonth = pData[mName];
             if (pMonth) {
                Object.entries(pMonth.intraPurchase || {}).forEach(([id, amt]) => {
                   const rate = getRate(id);
                   if (totalBreakdown[rate] !== undefined) totalBreakdown[rate] += Number(amt);
                });
                Object.entries(pMonth.interPurchase || {}).forEach(([id, amt]) => {
                   const rate = getRate(id);
                   if (totalBreakdown[rate] !== undefined) totalBreakdown[rate] += Number(amt);
                });
             }
             const sMonth = sData[mName];
             if (sMonth) {
                Object.entries(sMonth.intraSales || {}).forEach(([id, amt]) => {
                   const rate = getRate(id);
                   if (totalBreakdown[rate] !== undefined) totalBreakdown[rate] += Number(amt);
                });
                Object.entries(sMonth.interSales || {}).forEach(([id, amt]) => {
                   const rate = getRate(id);
                   if (totalBreakdown[rate] !== undefined) totalBreakdown[rate] += Number(amt);
                });
             }
          });

          const totalAmount = Object.values(totalBreakdown).reduce((a, b) => a + b, 0);
          setRateBreakdown([0, 5, 12, 18, 28].map(rate => ({
             rate: `${rate}%`,
             amount: totalBreakdown[rate],
             percentage: totalAmount > 0 ? Math.round((totalBreakdown[rate] / totalAmount) * 100) : 0
          })));

          if (selectedPeriod === 'monthly') {
            combinedData = monthlyDataRaw;
          } else if (selectedPeriod === 'quarterly') {
            const quarters = [
              { name: 'Q1', start: 0, end: 3 },
              { name: 'Q2', start: 3, end: 6 },
              { name: 'Q3', start: 6, end: 9 },
              { name: 'Q4', start: 9, end: 12 },
            ];
            
            combinedData = quarters.map(q => {
              const qData = monthlyDataRaw.slice(q.start, q.end);
              return {
                period: `${q.name} ${selectedYear}`,
                totalSales: qData.reduce((sum, d) => sum + d.totalSales, 0),
                totalPurchases: qData.reduce((sum, d) => sum + d.totalPurchases, 0),
                outputGST: qData.reduce((sum, d) => sum + d.outputGST, 0),
                inputGST: qData.reduce((sum, d) => sum + d.inputGST, 0),
                netGST: qData.reduce((sum, d) => sum + d.netGST, 0),
                itcClaimed: qData.reduce((sum, d) => sum + d.itcClaimed, 0),
                gstPaid: qData.reduce((sum, d) => sum + d.gstPaid, 0),
              };
            });
          } else if (selectedPeriod === 'yearly') {
            combinedData = [{
              period: `Year ${selectedYear}`,
              totalSales: monthlyDataRaw.reduce((sum, d) => sum + d.totalSales, 0),
              totalPurchases: monthlyDataRaw.reduce((sum, d) => sum + d.totalPurchases, 0),
              outputGST: monthlyDataRaw.reduce((sum, d) => sum + d.outputGST, 0),
              inputGST: monthlyDataRaw.reduce((sum, d) => sum + d.inputGST, 0),
              netGST: monthlyDataRaw.reduce((sum, d) => sum + d.netGST, 0),
              itcClaimed: monthlyDataRaw.reduce((sum, d) => sum + d.itcClaimed, 0),
              gstPaid: monthlyDataRaw.reduce((sum, d) => sum + d.gstPaid, 0),
            }];
          }

          // Filter out periods with no data if preferred, but usually we want to see the periods
          const filteredData = combinedData.filter(d => 
            d.totalSales > 0 || d.totalPurchases > 0 || d.outputGST > 0 || d.inputGST > 0
          ).reverse(); // Reverse to show latest first

          setSummaryData(filteredData.length > 0 ? filteredData : [{
            period: `No Data ${selectedYear}`,
            totalSales: 0, totalPurchases: 0, outputGST: 0, inputGST: 0, netGST: 0, itcClaimed: 0, gstPaid: 0
          }]);
        } else {
          setError("Failed to load GST Summary data");
        }
      } catch (err) {
        console.error("GST Summary Fetch Error:", err);
        setError("Error loading GST Summary");
      } finally {
        setLoading(false);
      }
    };

    fetchGSTSummary();
  }, [company_id, owner_type, owner_id, selectedYear, selectedPeriod]);

  if (loading) {
    return (
      <div className="min-h-screen pt-[56px] px-4 flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium animate-pulse">Loading Summary Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-[56px] px-4 flex items-center justify-center bg-gray-50">
        <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-center">
          <p className="text-red-600 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  const currentPeriod = summaryData[0] || { totalSales: 0, totalPurchases: 0, outputGST: 0, inputGST: 0, netGST: 0, itcClaimed: 0, gstPaid: 0 };
  const previousPeriod = summaryData[1] || { totalSales: 0, totalPurchases: 0, outputGST: 0, inputGST: 0, netGST: 0, itcClaimed: 0, gstPaid: 0 };

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
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
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
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
                {rateBreakdown.map((item, index) => (
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