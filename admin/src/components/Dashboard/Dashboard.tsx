import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useTheme } from '../../context/ThemeContext';
import StatsCard from './StatsCard';
import RevenueChart from './RevenueChart';
import { mockChartData } from '../../data/mockData';
import { Users, Building2, UserCheck, DollarSign, Receipt, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface DashboardStats {
  totalCA: number;
  totalEmployees: number;
  totalCompanies: number;
  monthlyRevenue: number;
  failedPayments: number;
}

interface Activity {
  type: string;
  title: string;
  time: string;
  user: string;
  owner: string;
}

import api from '../../services/api';

const Dashboard: React.FC = () => {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/admin/dashboard-stats');
      setStats(response.data.stats);
      setActivities(response.data.recentActivity);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Dashboard</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Welcome back! Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
        <StatsCard
          title="Total Admin Users"
          value={stats?.totalCA.toLocaleString() || '0'}
          change="+2 from last week"
          changeType="positive"
          icon={UserCheck}
          color="bg-primary"
        />
        <StatsCard
          title="Total App Users"
          value={stats?.totalEmployees.toLocaleString() || '0'}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          color="bg-blue-600"
        />
        <StatsCard
          title="Total Companies"
          value={stats?.totalCompanies.toLocaleString() || '0'}
          change="+5 new today"
          changeType="positive"
          icon={Building2}
          color="bg-green-600"
        />
        <StatsCard
          title="Monthly Revenue"
          value={formatCurrency(stats?.monthlyRevenue || 0)}
          change="+15.3% from last month"
          changeType="positive"
          icon={DollarSign}
          color="bg-purple-600"
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
      <div className={`rounded-xl shadow-sm border p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Recent Activity</h3>
        <div className="space-y-3">
          {activities.length > 0 ? activities.map((activity, index) => (
            <div key={index} className={`flex items-center justify-between py-3 border-b last:border-0 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
              }`}>
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.type === 'company_created' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                  {activity.type === 'company_created' ? (
                    <Building2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Users className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                    {activity.title}: <span className="text-primary">{activity.user}</span>
                  </p>
                  <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                    {formatDistanceToNow(new Date(activity.time), { addSuffix: true })} • Owner: {activity.owner || 'System'}
                  </p>
                </div>
              </div>
            </div>
          )) : (
            <p className="text-center py-4 text-gray-500">No recent activity found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;