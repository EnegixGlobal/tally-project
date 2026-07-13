import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Download ,ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAppContext } from '../../../context/AppContext';

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
  const { theme } = useAppContext();
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
  const financialMonths = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  const quarters = ["Q1", "Q2", "Q3", "Q4"];

  const calendarMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthName = calendarMonths[new Date().getMonth()];

  const [selectedSubPeriod, setSelectedSubPeriod] = useState(currentMonthName);

  useEffect(() => {
    if (selectedPeriod === 'monthly') setSelectedSubPeriod(currentMonthName);
    else if (selectedPeriod === 'quarterly') setSelectedSubPeriod(quarters[0]);
    else if (selectedPeriod === 'yearly') setSelectedSubPeriod(String(currentYear));
  }, [selectedPeriod]);

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
        const queryYear = selectedPeriod === 'yearly' ? selectedSubPeriod : String(currentYear);

        const [purchaseRes, salesRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/api/gst-assessment/purchase?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}&year=${queryYear}`),
          fetch(`${import.meta.env.VITE_API_URL}/api/gst-assessment/sales?company_id=${company_id}&owner_type=${owner_type}&owner_id=${owner_id}&year=${queryYear}`)
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

          // Use financial year mapping (Apr to Mar)
          const monthlyDataRaw = financialMonths.map(mName => {
            const pMonth = pData[mName] || { totalIntraPurchase: 0, totalInterPurchase: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0 };
            const sMonth = sData[mName] || { totalIntraSales: 0, totalInterSales: 0, totalCGST: 0, totalSGST: 0, totalIGST: 0 };

            const totalSales = sMonth.totalIntraSales + sMonth.totalInterSales;
            const totalPurchases = pMonth.totalIntraPurchase + pMonth.totalInterPurchase;
            const outputGST = sMonth.totalCGST + sMonth.totalSGST + sMonth.totalIGST;
            const inputGST = pMonth.totalCGST + pMonth.totalSGST + pMonth.totalIGST;
            const netGST = outputGST - inputGST;

            return {
              period: mName,
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

          const quarters = [
            { name: 'Q1', start: 0, end: 3 },
            { name: 'Q2', start: 3, end: 6 },
            { name: 'Q3', start: 6, end: 9 },
            { name: 'Q4', start: 9, end: 12 },
          ];

          let monthsToProcess = financialMonths;
          if (selectedPeriod === 'monthly') {
            monthsToProcess = [selectedSubPeriod];
          } else if (selectedPeriod === 'quarterly') {
            const quarter = quarters.find(q => q.name === selectedSubPeriod);
            if (quarter) {
              monthsToProcess = financialMonths.slice(quarter.start, quarter.end);
            }
          }

          monthsToProcess.forEach(mName => {
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
            combinedData = quarters.map(q => {
              const qData = monthlyDataRaw.slice(q.start, q.end);
              return {
                period: q.name,
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
              period: queryYear,
              totalSales: monthlyDataRaw.reduce((sum, d) => sum + d.totalSales, 0),
              totalPurchases: monthlyDataRaw.reduce((sum, d) => sum + d.totalPurchases, 0),
              outputGST: monthlyDataRaw.reduce((sum, d) => sum + d.outputGST, 0),
              inputGST: monthlyDataRaw.reduce((sum, d) => sum + d.inputGST, 0),
              netGST: monthlyDataRaw.reduce((sum, d) => sum + d.netGST, 0),
              itcClaimed: monthlyDataRaw.reduce((sum, d) => sum + d.itcClaimed, 0),
              gstPaid: monthlyDataRaw.reduce((sum, d) => sum + d.gstPaid, 0),
            }];
          }

          // In Tally, we normally show all periods in the trend
          const filteredData = combinedData;

          setSummaryData(filteredData.length > 0 ? filteredData : [{
            period: `No Data`,
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
  }, [company_id, owner_type, owner_id, selectedPeriod, selectedSubPeriod]);

  if (loading) {
    return (
      <div className={`min-h-screen pt-[56px] px-4 flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className={`w-10 h-10 border-4 ${theme === 'dark' ? 'border-blue-500' : 'border-blue-600'} border-t-transparent rounded-full animate-spin`}></div>
          <p className={`font-medium animate-pulse ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Loading Summary Data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen pt-[56px] px-4 flex items-center justify-center transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`p-6 border rounded-xl text-center shadow-lg ${theme === 'dark' ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'}`}>
          <p className={`font-semibold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        </div>
      </div>
    );
  }

  const currentIndex = summaryData.findIndex(d => d.period === selectedSubPeriod);
  const currentPeriod = currentIndex !== -1 ? summaryData[currentIndex] : summaryData[0] || { totalSales: 0, totalPurchases: 0, outputGST: 0, inputGST: 0, netGST: 0, itcClaimed: 0, gstPaid: 0 };
  const previousPeriod = currentIndex > 0 ? summaryData[currentIndex - 1] : { totalSales: 0, totalPurchases: 0, outputGST: 0, inputGST: 0, netGST: 0, itcClaimed: 0, gstPaid: 0 };

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

  const handleExportExcel = () => {
    let companyName = "Company Name";
    try {
      const companyInfo = JSON.parse(localStorage.getItem("companyInfo") || "{}");
      companyName = companyInfo.company_name || companyInfo.name || "Company Name";
    } catch(e) {}

    const exportData = [
      [companyName],
      [`GST Summary - ${selectedPeriod} (${selectedSubPeriod})`],
      [],
      ["Period", "Sales", "Purchases", "Output GST", "Input GST", "Net GST"],
      ...summaryData.map(data => [
        data.period,
        data.totalSales,
        data.totalPurchases,
        data.outputGST,
        data.inputGST,
        data.netGST
      ])
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'GST_Summary');
    XLSX.writeFile(workbook, `GST_Summary_${selectedPeriod}.xlsx`);
  };

  const handleExportPDF = () => {
    let companyName = "Company Name";
    try {
      const companyInfo = JSON.parse(localStorage.getItem("companyInfo") || "{}");
      companyName = companyInfo.company_name || companyInfo.name || "Company Name";
    } catch(e) {}

    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text(companyName, 14, 20);
    doc.setFontSize(14);
    doc.text(`GST Summary (${selectedPeriod} - ${selectedSubPeriod})`, 14, 30);
    
    const tableColumn = ["Period", "Sales", "Purchases", "Output GST", "Input GST", "Net GST"];
    const formatForPDF = (amount: number) => amount.toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    const tableRows = summaryData.map(data => [
      data.period,
      formatForPDF(data.totalSales),
      formatForPDF(data.totalPurchases),
      formatForPDF(data.outputGST),
      formatForPDF(data.inputGST),
      formatForPDF(data.netGST)
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
    });
    
    doc.save(`GST_Summary_${selectedPeriod}.pdf`);
  };

  return (
    <div className={`min-h-screen pt-[56px] px-4 pb-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center pt-4">
          <button
            title='Back to Reports'
            type='button'
            onClick={() => navigate('/app/gst')}
            className={`mr-4 p-2 rounded-full transition-all duration-200 ${
              theme === 'dark' ? 'hover:bg-gray-800 text-gray-300 hover:text-white' : 'hover:bg-gray-200 text-gray-600 hover:text-gray-900'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-3xl font-bold tracking-tight">Summary</h1>
        </div>
        
        <div className={`rounded-2xl shadow-xl overflow-hidden transition-colors duration-300 border ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'
        }`}>
          <div className={`p-6 border-b flex flex-col md:flex-row items-center justify-between gap-4 ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <BarChart3 className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold">GST Overview</h2>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                title='Select Period'
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
              <select
                title='Select Sub Period'
                value={selectedSubPeriod}
                onChange={(e) => setSelectedSubPeriod(e.target.value)}
                className={`px-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 shadow-sm ${
                  theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                }`}
              >
                {selectedPeriod === 'monthly' && financialMonths.map(m => <option key={m} value={m}>{m}</option>)}
                {selectedPeriod === 'quarterly' && quarters.map(q => <option key={q} value={q}>{q}</option>)}
                {selectedPeriod === 'yearly' && years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              
              <div className="flex gap-2 ml-auto md:ml-0">
                <button
                  type='button'
                  onClick={handleExportPDF}
                  title='Export PDF'
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl shadow-md hover:from-red-600 hover:to-red-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">PDF</span>
                </button>
                <button
                  type='button'
                  onClick={handleExportExcel}
                  title='Export Excel'
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-md hover:from-green-600 hover:to-green-700 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
                >
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">Excel</span>
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Sales', value: currentPeriod.totalSales, prev: previousPeriod.totalSales, gradient: 'from-blue-500 to-blue-600' },
                { label: 'Output GST', value: currentPeriod.outputGST, prev: previousPeriod.outputGST, gradient: 'from-emerald-500 to-emerald-600' },
                { label: 'Input GST', value: currentPeriod.inputGST, prev: previousPeriod.inputGST, gradient: 'from-amber-500 to-orange-500' },
                { label: 'Net GST Payable', value: currentPeriod.netGST, prev: previousPeriod.netGST, gradient: 'from-rose-500 to-red-600' },
              ].map((metric, idx) => {
                const change = getPercentageChange(metric.value, metric.prev);
                const isPositive = change > 0;
                
                return (
                  <div key={idx} className={`relative overflow-hidden bg-gradient-to-br ${metric.gradient} rounded-2xl p-6 text-white shadow-lg transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl`}>
                    {/* Decorative glassmorphism circle */}
                    <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10">
                      <div className="text-white/80 text-sm font-medium tracking-wide uppercase mb-1">{metric.label}</div>
                      <div className="text-3xl font-bold tracking-tight mb-2">{formatCurrency(metric.value)}</div>
                      
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <div className={`flex items-center justify-center p-1 rounded-full ${isPositive ? 'bg-white/20' : 'bg-black/20'}`}>
                          {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                        </div>
                        <span className="opacity-90">
                          {Math.abs(change).toFixed(1)}% vs Prev.
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detailed Summary & Rate Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-750' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'
              }`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                  Current Period Summary
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Total Sales (Taxable Value)', value: currentPeriod.totalSales },
                    { label: 'Output GST Collected', value: currentPeriod.outputGST },
                    { label: 'Total Purchases (Taxable Value)', value: currentPeriod.totalPurchases },
                    { label: 'Input GST Paid', value: currentPeriod.inputGST },
                    { label: 'ITC Claimed', value: currentPeriod.itcClaimed },
                  ].map((row, idx) => (
                    <div key={idx} className="flex justify-between items-center group">
                      <span className={`transition-colors ${theme === 'dark' ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-700'}`}>{row.label}</span>
                      <span className="font-semibold text-lg">{formatCurrency(row.value)}</span>
                    </div>
                  ))}
                  <div className={`mt-6 pt-4 border-t flex justify-between items-center ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <span className="font-bold text-lg">Net GST Payable</span>
                    <span className="font-bold text-2xl text-red-500">{formatCurrency(currentPeriod.netGST)}</span>
                  </div>
                </div>
              </div>

              <div className={`p-6 rounded-2xl border transition-colors duration-300 ${
                theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-750' : 'bg-gray-50/50 border-gray-100 hover:bg-gray-50'
              }`}>
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-purple-500 rounded-full"></span>
                  GST Rate-wise Breakdown
                </h3>
                <div className="space-y-6">
                  {rateBreakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4 flex-1">
                        <span className={`w-10 text-sm font-bold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{item.rate}</span>
                        <div className="flex-1 max-w-sm">
                          <div className={`w-full h-2.5 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end min-w-[100px]">
                        <span className="font-semibold text-base">{formatCurrency(item.amount)}</span>
                        <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{item.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Monthly Trend */}
            <div className={`rounded-2xl border overflow-hidden transition-colors duration-300 ${
              theme === 'dark' ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50/50 border-gray-100'
            }`}>
              <div className="p-6 pb-0">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                  Monthly Trend
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`${theme === 'dark' ? 'bg-gray-800 border-b border-gray-700 text-gray-400' : 'bg-gray-100 border-b border-gray-200 text-gray-500'}`}>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wider">Period</th>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wider">Sales</th>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wider">Purchases</th>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wider">Output GST</th>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wider">Input GST</th>
                      <th className="py-4 px-6 text-sm font-semibold uppercase tracking-wider">Net GST</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-100'}`}>
                    {summaryData.map((data, index) => (
                      <tr 
                        key={index} 
                        className={`transition-colors duration-150 group ${
                          data.period === selectedSubPeriod 
                            ? (theme === 'dark' ? 'bg-blue-900/60 font-semibold' : 'bg-blue-100 font-semibold') 
                            : (theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50')
                        }`}
                      >
                        <td className="py-4 px-6 text-sm font-bold">
                          <span className={data.period === selectedSubPeriod ? 'text-blue-500' : ''}>{data.period}</span>
                        </td>
                        <td className="py-4 px-6 text-sm font-medium">{formatCurrency(data.totalSales)}</td>
                        <td className="py-4 px-6 text-sm font-medium">{formatCurrency(data.totalPurchases)}</td>
                        <td className="py-4 px-6 text-sm font-medium">{formatCurrency(data.outputGST)}</td>
                        <td className="py-4 px-6 text-sm font-medium">{formatCurrency(data.inputGST)}</td>
                        <td className="py-4 px-6 text-sm font-bold text-red-500">{formatCurrency(data.netGST)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default GSTSummary;