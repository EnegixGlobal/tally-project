import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useTheme } from '../../context/ThemeContext';
import StatsCard from './StatsCard';
import RevenueChart from './RevenueChart';
import { mockStats, mockChartData } from '../../data/mockData';
import { Users, CreditCard, DollarSign, AlertTriangle,  Receipt } from 'lucide-react'; //TrendingUp,

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    tl.fromTo(containerRef.current, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6 }
    );
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Welcome back! Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button className={`px-4 py-2 text-white rounded-lg transition-colors ${
            theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}>
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Total Users"
          value={mockStats.totalUsers.toLocaleString()}
          change="+12.5% from last month"
          changeType="positive"
          icon={Users}
          color="bg-primary"
        />
        <StatsCard
          title="Active Subscriptions"
          value={mockStats.activeSubscriptions.toLocaleString()}
          change="+8.2% from last month"
          changeType="positive"
          icon={CreditCard}
          color="bg-green-600"
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(mockStats.monthlyRevenue)}
          change="+15.3% from last month"
          changeType="positive"
          icon={DollarSign}
          color="bg-purple-600"
        />
        <StatsCard
          title="Failed Payments"
          value={mockStats.failedPayments.toString()}
          change="+2.1% from last month"
          changeType="negative"
          icon={Receipt}
          color="bg-red-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        <RevenueChart
          data={mockChartData}
          type="line"
          title="Monthly Revenue Trend"
        />
        <RevenueChart
          data={mockChartData}
          type="bar"
          title="Monthly Revenue Breakdown"
        />
      </div>

      {/* Recent Activity */}
      <div className={`rounded-xl shadow-sm border p-6 ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Recent Activity</h3>
        <div className="space-y-3">
          <div className={`flex items-center justify-between py-3 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 text-green-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>New user registered</p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>2 minutes ago</p>
              </div>
            </div>
            <span className={`text-sm ml-2 flex-shrink-0 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>John Doe</span>
          </div>
          <div className={`flex items-center justify-between py-3 border-b ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Payment received</p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>5 minutes ago</p>
              </div>
            </div>
            <span className={`text-sm ml-2 flex-shrink-0 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>₹2,999</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Payment failed</p>
                <p className={`text-xs ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>10 minutes ago</p>
              </div>
            </div>
            <span className={`text-sm ml-2 flex-shrink-0 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>₹1,499</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;