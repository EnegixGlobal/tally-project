import  { useState } from 'react';
import { Users, TrendingUp, Download,  BarChart3, PieChart, Activity } from 'lucide-react';//Search, Filter,

const UserReports = () => {
  const [selectedReport, setSelectedReport] = useState('activity');
  // const [selectedUser, setSelectedUser] = useState('all');
  const [timeRange, setTimeRange] = useState('month');

  const userMetrics = {
    totalUsers: 127,
    activeUsers: 98,
    newUsers: 12,
    suspendedUsers: 3,
    averageSessionTime: '2h 15m',
    totalSessions: 1547
  };

  const topUsers = [
    { name: 'John Doe', email: 'john.doe@company.com', sessions: 45, hours: 89.5, lastActive: '2024-01-15 10:45' },
    { name: 'Jane Smith', email: 'jane.smith@company.com', sessions: 42, hours: 84.2, lastActive: '2024-01-15 10:30' },
    { name: 'Mike Johnson', email: 'mike.johnson@company.com', sessions: 38, hours: 76.8, lastActive: '2024-01-15 10:15' },
    { name: 'Sarah Wilson', email: 'sarah.wilson@company.com', sessions: 35, hours: 71.3, lastActive: '2024-01-15 10:00' },
    { name: 'David Brown', email: 'david.brown@company.com', sessions: 33, hours: 68.7, lastActive: '2024-01-15 09:45' }
  ];

  const userActivity = [
    { date: '2024-01-15', logins: 89, transactions: 234, errors: 3, avgSession: '2h 18m' },
    { date: '2024-01-14', logins: 92, transactions: 267, errors: 5, avgSession: '2h 12m' },
    { date: '2024-01-13', logins: 85, transactions: 198, errors: 2, avgSession: '2h 25m' },
    { date: '2024-01-12', logins: 78, transactions: 189, errors: 4, avgSession: '2h 08m' },
    { date: '2024-01-11', logins: 94, transactions: 278, errors: 6, avgSession: '2h 32m' }
  ];

  const departmentBreakdown = [
    { department: 'Sales', users: 35, percentage: 27.6, avgHours: 42.5 },
    { department: 'Marketing', users: 22, percentage: 17.3, avgHours: 38.2 },
    { department: 'Finance', users: 18, percentage: 14.2, avgHours: 45.8 },
    { department: 'Operations', users: 28, percentage: 22.0, avgHours: 41.3 },
    { department: 'IT', users: 15, percentage: 11.8, avgHours: 48.7 },
    { department: 'HR', users: 9, percentage: 7.1, avgHours: 35.9 }
  ];

  const roleAnalysis = [
    { role: 'Admin', count: 8, permissions: 'Full Access', riskLevel: 'High' },
    { role: 'Manager', count: 25, permissions: 'Department Access', riskLevel: 'Medium' },
    { role: 'User', count: 78, permissions: 'Limited Access', riskLevel: 'Low' },
    { role: 'Viewer', count: 16, permissions: 'Read Only', riskLevel: 'Low' }
  ];

  const securityMetrics = [
    { metric: 'Failed Login Attempts', value: 23, trend: 'down', change: '-15%' },
    { metric: 'Password Resets', value: 8, trend: 'up', change: '+12%' },
    { metric: '2FA Enabled', value: 89, trend: 'up', change: '+5%' },
    { metric: 'Suspicious Activities', value: 3, trend: 'down', change: '-25%' }
  ];

  const reportTypes = [
    { id: 'activity', name: 'User Activity', icon: Activity },
    { id: 'performance', name: 'Performance', icon: TrendingUp },
    { id: 'security', name: 'Security', icon: Users },
    { id: 'compliance', name: 'Compliance', icon: BarChart3 }
  ];

  const getRiskColor = (level:string) => {
    switch (level.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendColor = (trend:string) => {
    return trend === 'up' ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Reports</h2>
            <p className="text-sm text-gray-600 mt-1">Comprehensive user analytics and behavior reports</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
            title='Select Time Range'
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* User Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Total Users</p>
              <p className="text-lg font-bold text-gray-900">{userMetrics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-lg font-bold text-gray-900">{userMetrics.activeUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">New Users</p>
              <p className="text-lg font-bold text-gray-900">{userMetrics.newUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Suspended</p>
              <p className="text-lg font-bold text-gray-900">{userMetrics.suspendedUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Sessions</p>
              <p className="text-lg font-bold text-gray-900">{userMetrics.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-orange-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Avg Session</p>
              <p className="text-lg font-bold text-gray-900">{userMetrics.averageSessionTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Type Selector */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-4">
          {reportTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedReport(type.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  selectedReport === type.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{type.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Report Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Users */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Active Users</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">User</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Sessions</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Hours</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {topUsers.map((user, index) => (
                    <tr key={index}>
                      <td className="py-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-900 text-right">{user.sessions}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{user.hours}h</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{user.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Daily Activity */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily User Activity</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Date</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Logins</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Transactions</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Errors</th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Avg Session</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userActivity.map((day, index) => (
                    <tr key={index}>
                      <td className="py-3 text-sm text-gray-900">{day.date}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{day.logins}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{day.transactions}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{day.errors}</td>
                      <td className="py-3 text-sm text-gray-900 text-right">{day.avgSession}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Department Breakdown */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Department Breakdown</h3>
            </div>
            <div className="space-y-3">
              {departmentBreakdown.map((dept, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{dept.department}</p>
                    <p className="text-xs text-gray-500">{dept.avgHours}h avg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{dept.users}</p>
                    <p className="text-xs text-gray-500">{dept.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Analysis */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Analysis</h3>
            <div className="space-y-3">
              {roleAnalysis.map((role, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-900">{role.role}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(role.riskLevel)}`}>
                      {role.riskLevel}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Users: {role.count}</span>
                    <span className="text-gray-600">{role.permissions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security Metrics */}
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Metrics</h3>
            <div className="space-y-3">
              {securityMetrics.map((metric, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{metric.metric}</p>
                    <p className="text-xs text-gray-600">This period</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                    <p className={`text-xs font-medium ${getTrendColor(metric.trend)}`}>
                      {metric.change}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserReports;