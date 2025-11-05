import  { useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, BarChart3, PieChart, Download, } from 'lucide-react';/// Filter

const PeriodAnalysis = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  // const [comparisonPeriod, setComparisonPeriod] = useState('previous');
  // const [analysisType, setAnalysisType] = useState('overview');

  const periodData = {
    current: {
      period: 'January 2024',
      transactions: 15420,
      users: 1247,
      revenue: 2450000,
      errors: 23,
      securityIncidents: 5,
      complianceScore: 94.5
    },
    previous: {
      period: 'December 2023',
      transactions: 13890,
      users: 1198,
      revenue: 2280000,
      errors: 31,
      securityIncidents: 8,
      complianceScore: 92.1
    }
  };

  const trends = [
    {
      metric: 'Total Transactions',
      current: periodData.current.transactions,
      previous: periodData.previous.transactions,
      change: ((periodData.current.transactions - periodData.previous.transactions) / periodData.previous.transactions * 100).toFixed(1),
      trend: 'up'
    },
    {
      metric: 'Active Users',
      current: periodData.current.users,
      previous: periodData.previous.users,
      change: ((periodData.current.users - periodData.previous.users) / periodData.previous.users * 100).toFixed(1),
      trend: 'up'
    },
    {
      metric: 'Revenue',
      current: periodData.current.revenue,
      previous: periodData.previous.revenue,
      change: ((periodData.current.revenue - periodData.previous.revenue) / periodData.previous.revenue * 100).toFixed(1),
      trend: 'up'
    },
    {
      metric: 'System Errors',
      current: periodData.current.errors,
      previous: periodData.previous.errors,
      change: ((periodData.current.errors - periodData.previous.errors) / periodData.previous.errors * 100).toFixed(1),
      trend: 'down'
    },
    {
      metric: 'Security Incidents',
      current: periodData.current.securityIncidents,
      previous: periodData.previous.securityIncidents,
      change: ((periodData.current.securityIncidents - periodData.previous.securityIncidents) / periodData.previous.securityIncidents * 100).toFixed(1),
      trend: 'down'
    },
    {
      metric: 'Compliance Score',
      current: periodData.current.complianceScore,
      previous: periodData.previous.complianceScore,
      change: ((periodData.current.complianceScore - periodData.previous.complianceScore) / periodData.previous.complianceScore * 100).toFixed(1),
      trend: 'up'
    }
  ];

  const departmentAnalysis = [
    { department: 'Sales', transactions: 4520, revenue: 850000, errors: 5, compliance: 96.2 },
    { department: 'Marketing', transactions: 2340, revenue: 420000, errors: 3, compliance: 94.8 },
    { department: 'Finance', transactions: 3890, revenue: 680000, errors: 8, compliance: 97.1 },
    { department: 'Operations', transactions: 2870, revenue: 320000, errors: 4, compliance: 93.5 },
    { department: 'HR', transactions: 1800, revenue: 180000, errors: 3, compliance: 95.7 }
  ];

  const riskAnalysis = [
    { category: 'Financial Risk', score: 25, trend: 'down', incidents: 3 },
    { category: 'Operational Risk', score: 45, trend: 'up', incidents: 7 },
    { category: 'Compliance Risk', score: 15, trend: 'down', incidents: 2 },
    { category: 'Security Risk', score: 35, trend: 'stable', incidents: 5 }
  ];

  const auditActivities = [
    { date: '2024-01-15', activity: 'Quarterly Compliance Review', status: 'completed', findings: 3 },
    { date: '2024-01-12', activity: 'Security Audit', status: 'in-progress', findings: 5 },
    { date: '2024-01-10', activity: 'Financial Controls Testing', status: 'completed', findings: 1 },
    { date: '2024-01-08', activity: 'User Access Review', status: 'completed', findings: 8 },
    { date: '2024-01-05', activity: 'Data Privacy Assessment', status: 'scheduled', findings: 0 }
  ];

  const getTrendIcon = (trend:string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
    }
  };

  const getTrendColor = (trend:string, isPositive = true) => {
    if (trend === 'up') {
      return isPositive ? 'text-green-600' : 'text-red-600';
    } else if (trend === 'down') {
      return isPositive ? 'text-red-600' : 'text-green-600';
    }
    return 'text-gray-600';
  };

  const formatValue = (metric:string, value:number) => {
    if (metric === 'Revenue') {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (metric === 'Compliance Score') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Period Analysis</h2>
            <p className="text-sm text-gray-600 mt-1">Comprehensive analysis of audit metrics over time</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
            title='period'
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Period Comparison */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Period Comparison</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>{periodData.current.period} vs {periodData.previous.period}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trends.map((trend, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-600">{trend.metric}</h4>
                {getTrendIcon(trend.trend)}
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">
                  {formatValue(trend.metric, trend.current)}
                </p>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">vs</span>
                  <span className="text-sm text-gray-900">
                    {formatValue(trend.metric, trend.previous)}
                  </span>
                  <span className={`text-sm font-medium ${getTrendColor(trend.trend, !['System Errors', 'Security Incidents'].includes(trend.metric))}`}>
                    {/* {trend.change > 0 ? '+' : ''}{trend.change}% */}
                    {parseFloat(trend.change) > 0 ? '+' : ''}{trend.change}%

                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Analysis */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Department Analysis</h3>
            <BarChart3 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Department</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Transactions</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Revenue</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Errors</th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {departmentAnalysis.map((dept, index) => (
                  <tr key={index}>
                    <td className="py-3 text-sm font-medium text-gray-900">{dept.department}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">{dept.transactions.toLocaleString()}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">${(dept.revenue / 1000).toFixed(0)}K</td>
                    <td className="py-3 text-sm text-gray-900 text-right">{dept.errors}</td>
                    <td className="py-3 text-sm text-gray-900 text-right">{dept.compliance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Risk Analysis */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Risk Analysis</h3>
            <PieChart className="h-5 w-5 text-blue-600" />
          </div>
          <div className="space-y-4">
            {riskAnalysis.map((risk, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">{risk.category}</h4>
                  <p className="text-xs text-gray-600">{risk.incidents} incidents this period</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-gray-900">{risk.score}</span>
                    {getTrendIcon(risk.trend)}
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className={`h-2 rounded-full ${
                        risk.score <= 25 ? 'bg-green-500' :
                        risk.score <= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${risk.score}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit Activities */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Audit Activities</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Activity</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider py-2">Findings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {auditActivities.map((activity, index) => (
                <tr key={index}>
                  <td className="py-3 text-sm text-gray-900">{activity.date}</td>
                  <td className="py-3 text-sm text-gray-900">{activity.activity}</td>
                  <td className="py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      activity.status === 'completed' ? 'bg-green-100 text-green-800' :
                      activity.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {activity.status}
                    </span>
                  </td>
                  <td className="py-3 text-sm text-gray-900 text-right">{activity.findings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Insights */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Positive Trends</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Transaction volume increased by 11.0%</li>
              <li>• System errors reduced by 25.8%</li>
              <li>• Compliance score improved to 94.5%</li>
              <li>• Security incidents decreased by 37.5%</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Areas for Attention</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Operations department has highest error rate</li>
              <li>• Operational risk score trending upward</li>
              <li>• User access review found 8 findings</li>
              <li>• Security audit still in progress</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeriodAnalysis;