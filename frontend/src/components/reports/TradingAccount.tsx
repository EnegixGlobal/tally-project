// import React, { useState } from 'react';
// import { useAppContext } from '../../context/AppContext';
// import { useNavigate } from 'react-router-dom';
// import { ArrowLeft, Printer, Download, Filter } from 'lucide-react';
// import { Bar } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   Filler,
//   Title,
//   Tooltip,
//   Legend
// } from 'chart.js';
// import type { ChartData, ChartOptions, ScriptableContext, TooltipItem } from 'chart.js';
// import './TradingAccount.css';

// // Register Chart.js components
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   LineElement,
//   PointElement,
//   Filler,
//   Title,
//   Tooltip,
//   Legend
// );

// type TradingAccountProps = Record<string, never>;

// const TradingAccount: React.FC<TradingAccountProps> = () => {
//   const { theme, ledgers, ledgerGroups } = useAppContext();
//   const navigate = useNavigate();
//   const [showFilterPanel, setShowFilterPanel] = useState(false);

//   // Calculate total sales (from ledgers in the 'sales' group)
//   const getSalesTotal = () => {
//     return ledgers
//       .filter(ledger => {
//         const group = ledgerGroups.find(g => g.id === ledger.groupId);
//         return group?.type === 'sales';
//       })
//       .reduce((sum, ledger) => sum + ledger.openingBalance, 0);
//   };

//   // Calculate total purchases (from ledgers in the 'purchase' group)
//   const getPurchasesTotal = () => {
//     return ledgers
//       .filter(ledger => {
//         const group = ledgerGroups.find(g => g.id === ledger.groupId);
//         return group?.type === 'purchase';
//       })
//       .reduce((sum, ledger) => sum + ledger.openingBalance, 0);
//   };

//   // Calculate total direct expenses (from ledgers in the 'direct-expenses' group)
//   const getDirectExpensesTotal = () => {
//     return ledgers
//       .filter(ledger => {
//         const group = ledgerGroups.find(g => g.id === ledger.groupId);
//         return group?.type === 'direct-expenses';
//       })
//       .reduce((sum, ledger) => sum + ledger.openingBalance, 0);
//   };

//   // Calculate totals
//   const salesTotal = getSalesTotal();
//   const purchasesTotal = getPurchasesTotal();
//   const directExpensesTotal = getDirectExpensesTotal();
//   const costOfGoodsSold = purchasesTotal + directExpensesTotal;
//   const grossProfit = salesTotal - costOfGoodsSold;

//   // Chart data
//   const chartData: ChartData<'bar', number[], unknown> = {
//     labels: ['Sales', 'Cost of Goods Sold', 'Gross Profit/Loss'],
//     datasets: [
//       {
//         label: 'Sales & COGS',
//         data: [salesTotal, costOfGoodsSold, 0],
//         backgroundColor: (context: ScriptableContext<'bar'>) => {
//           const chart = context.chart;
//           const { ctx, chartArea } = chart;
//           if (!chartArea) return 'transparent';
//           const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
//           if (context.dataIndex === 0) {
//             gradient.addColorStop(0, 'rgba(6, 205, 255, 0.9)');
//             gradient.addColorStop(1, 'rgba(0, 102, 204, 0.7)');
//           } else {
//             gradient.addColorStop(0, 'rgba(255, 85, 165, 0.9)');
//             gradient.addColorStop(1, 'rgba(153, 0, 102, 0.7)');
//           }
//           return gradient;
//         },
//         borderColor: ['#06CDFF', '#FF55A5'],
//         borderWidth: 2,
//         borderRadius: 12,
//         barThickness: 45,
//       },
//       {
//         label: 'Gross Profit/Loss',
//         data: [0, 0, Math.abs(grossProfit)],
//         backgroundColor: grossProfit >= 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)',
//         borderColor: grossProfit >= 0 ? '#22C55E' : '#EF4444',
//         type: 'bar' as const,
//       }
//     ],
//   };

//   // Chart options
//   const chartOptions: ChartOptions<'bar'> = {
//     responsive: true,
//     maintainAspectRatio: false,
//     scales: {
//       y: {
//         beginAtZero: true,
//         title: {
//           display: true,
//           text: 'Amount (₹)',
//           color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
//           font: { size: 16, weight: 'bold', family: 'Inter' },
//         },
//         ticks: {
//           color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
//           callback: function(tickValue: string | number) {
//             return '₹' + (typeof tickValue === 'number' ? tickValue.toLocaleString() : tickValue);
//           },
//           font: { size: 12, family: 'Inter' },
//         },
//         grid: {
//           color: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
//         },
//       },
//       x: {
//         title: {
//           display: true,
//           text: 'Metrics',
//           color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
//           font: { size: 16, weight: 'bold', family: 'Inter' },
//         },
//         ticks: {
//           color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
//           font: { size: 12, family: 'Inter' },
//         },
//         grid: {
//           display: false,
//         },
//         border: {
//           color: theme === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
//         },
//       },
//     },
//     plugins: {
//       legend: {
//         display: true,
//         position: 'top' as const,
//         labels: {
//           color: theme === 'dark' ? '#D1D5DB' : '#1F2937',
//           font: { size: 12, family: 'Inter' },
//           padding: 20,
//           boxWidth: 20,
//         },
//       },
//       tooltip: {
//         enabled: true,
//         backgroundColor: theme === 'dark' ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
//         titleColor: theme === 'dark' ? '#E5E7EB' : '#1F2937',
//         bodyColor: theme === 'dark' ? '#E5E7EB' : '#1F2937',
//         borderColor: grossProfit >= 0 ? '#22C55E' : '#EF4444',
//         borderWidth: 2,
//         cornerRadius: 8,
//         padding: 12,
//         callbacks: {
//           label: function(context: TooltipItem<'bar'>) {
//             const value = context.parsed.y;
//             return `₹${value?.toLocaleString() ?? '0'}`;
//           },
//         },
//       },
//     },
//     interaction: {
//       mode: 'index' as const,
//       intersect: false,
//     },
//     hover: {
//       mode: 'index' as const,
//       intersect: false,
//     },
//     animation: {
//       duration: 1200,
//       easing: 'easeOutQuart',
//     },
//   };

//   return (
//     <div className="pt-[56px] px-4 ">
//       <div className="flex items-center mb-6">
//         <button
//           type="button"
//           title="Back to Reports"
//           onClick={() => navigate('/app/reports')}
//           className={`mr-4 p-2 rounded-full ${
//             theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//           }`}
//         >
//           <ArrowLeft size={20} />
//         </button>
//         <h1 className="text-2xl font-bold">Trading Account</h1>
//         <div className="ml-auto flex space-x-2">
//           <button
//             title="Toggle Filters"
//             type="button"
//             onClick={() => setShowFilterPanel(!showFilterPanel)}
//             className={`p-2 rounded-md ${
//               theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//             }`}
//           >
//             <Filter size={18} />
//           </button>
//           <button
//             title="Print Report"
//             type="button"
//             className={`p-2 rounded-md ${
//               theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//             }`}
//           >
//             <Printer size={18} />
//           </button>
//           <button
//             title="Download Report"
//             type="button"
//             className={`p-2 rounded-md ${
//               theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//             }`}
//           >
//             <Download size={18} />
//           </button>
//         </div>
//       </div>

//       {showFilterPanel && (
//         <div
//           className={`p-4 mb-6 rounded-lg ${
//             theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//           }`}
//         >
//           <h3 className="font-semibold mb-4">Filters</h3>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-sm font-medium mb-1">Period</label>
//               <select
//                 title="Select Period"
//                 className={`w-full p-2 rounded border ${
//                   theme === 'dark'
//                     ? 'bg-gray-700 border-gray-600'
//                     : 'bg-white border-gray-300'
//                 }`}
//               >
//                 <option value="current-month">Current Month</option>
//                 <option value="current-quarter">Current Quarter</option>
//                 <option value="current-year">Current Financial Year</option>
//                 <option value="previous-year">Previous Financial Year</option>
//                 <option value="custom">Custom Period</option>
//               </select>
//             </div>
//           </div>
//         </div>
//       )}

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Income Section (Sales) */}
//         <div
//           className={`p-6 rounded-lg ${
//             theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//           }`}
//         >
//           <h2 className="text-xl font-bold mb-4 text-center">Income</h2>
//           <div className="space-y-2">
//             <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
//               <span>Sales</span>
//               <span className="font-mono">{salesTotal.toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
//               <span>Total Income</span>
//               <span className="font-mono">{salesTotal.toLocaleString()}</span>
//             </div>
//           </div>
//         </div>

//         {/* Expenses Section (Purchases + Direct Expenses) */}
//         <div
//           className={`p-6 rounded-lg ${
//             theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//           }`}
//         >
//           <h2 className="text-xl font-bold mb-4 text-center">Expenses</h2>
//           <div className="space-y-2">
//             <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
//               <span>Purchases</span>
//               <span className="font-mono">{purchasesTotal.toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between py-2 border-b border-gray-300 dark:border-gray-600">
//               <span>Direct Expenses</span>
//               <span className="font-mono">{directExpensesTotal.toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between py-2 font-bold text-lg border-t-2 border-gray-400 dark:border-gray-500">
//               <span>Total Cost of Goods Sold</span>
//               <span className="font-mono">{costOfGoodsSold.toLocaleString()}</span>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Gross Profit/Loss */}
//       <div
//         className={`mt-6 p-6 rounded-lg ${
//           theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
//         }`}
//       >
//         <div className="text-center">
//           <h2 className="text-2xl font-bold mb-4">
//             {grossProfit >= 0 ? 'Gross Profit' : 'Gross Loss'}
//           </h2>
//           <div
//             className={`text-3xl font-bold ${
//               grossProfit >= 0 ? 'text-green-600' : 'text-red-600'
//             }`}
//           >
//             ₹ {Math.abs(grossProfit).toLocaleString()}
//           </div>
//         </div>
//       </div>

//       {/* Trading Account Chart */}
//       <div
//         className="mt-12 p-8 rounded-xl bg-white shadow-lg animate-pulse-border"
//       >
//         {/* Metric Badges */}
//         <div className="flex flex-wrap justify-center gap-4 mb-6">
//           <div className="text-center">
//             <span className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-700 text-white text-sm font-semibold shadow-lg transform hover:scale-105 transition-transform animate-bounce-in">
//               Sales: ₹{salesTotal.toLocaleString()}
//             </span>
//           </div>
//           <div className="text-center">
//             <span className="inline-block px-5 py-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-700 text-white text-sm font-semibold shadow-lg transform hover:scale-105 transition-transform animate-bounce-in">
//               COGS: ₹{costOfGoodsSold.toLocaleString()}
//             </span>
//           </div>
//           <div className="text-center">
//             <span className={`inline-block px-5 py-2 rounded-full bg-gradient-to-r ${
//               grossProfit >= 0
//                 ? 'from-green-500 to-green-700'
//                 : 'from-red-500 to-red-700'
//             } text-white text-sm font-semibold shadow-lg transform hover:scale-105 transition-transform animate-bounce-in`}>
//               {grossProfit >= 0 ? 'Profit' : 'Loss'}: ₹{Math.abs(grossProfit).toLocaleString()}
//             </span>
//           </div>
//         </div>

//         <h2 className="text-2xl font-bold text-center mb-6 animate-neon-glow chart-title">
//           Trading Account Overview
//         </h2>

//         <div className="relative w-full chart-container">
//           <Bar data={chartData} options={chartOptions} />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default TradingAccount;