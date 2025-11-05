import  { useState } from 'react';
import { AlertCircle, Filter, Download, Calendar, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';

const ExceptionReports = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [dateRange, setDateRange] = useState('week');

  const exceptions = [
    {
      id: 1,
      timestamp: '2024-01-15 10:45:12',
      category: 'Financial',
      type: 'Variance Exception',
      description: 'Budget variance exceeds 15% threshold in Marketing department',
      severity: 'high',
      amount: 25000,
      threshold: 15,
      actual: 28.5,
      responsible: 'Marketing Manager',
      status: 'open',
      dueDate: '2024-01-20'
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:30:25',
      category: 'Operational',
      type: 'Process Exception',
      description: 'Invoice approval workflow bypassed for high-value transaction',
      severity: 'critical',
      amount: 50000,
      threshold: 10000,
      actual: 50000,
      responsible: 'Finance Director',
      status: 'investigating',
      dueDate: '2024-01-18'
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:15:33',
      category: 'Compliance',
      type: 'Policy Violation',
      description: 'Segregation of duties violation in payment processing',
      severity: 'high',
      amount: 0,
      threshold: 0,
      actual: 0,
      responsible: 'Compliance Officer',
      status: 'resolved',
      dueDate: '2024-01-16'
    },
    {
      id: 4,
      timestamp: '2024-01-15 10:00:55',
      category: 'System',
      type: 'Data Integrity',
      description: 'Duplicate customer records detected in CRM system',
      severity: 'medium',
      amount: 0,
      threshold: 5,
      actual: 12,
      responsible: 'IT Administrator',
      status: 'in-progress',
      dueDate: '2024-01-22'
    },
    {
      id: 5,
      timestamp: '2024-01-15 09:45:10',
      category: 'Security',
      type: 'Access Exception',
      description: 'User accessed system outside of authorized hours',
      severity: 'medium',
      amount: 0,
      threshold: 0,
      actual: 0,
      responsible: 'Security Team',
      status: 'closed',
      dueDate: '2024-01-17'
    }
  ];

  const exceptionSummary = {
    total: exceptions.length,
    critical: exceptions.filter(e => e.severity === 'critical').length,
    high: exceptions.filter(e => e.severity === 'high').length,
    medium: exceptions.filter(e => e.severity === 'medium').length,
    open: exceptions.filter(e => e.status === 'open' || e.status === 'investigating' || e.status === 'in-progress').length,
    overdue: exceptions.filter(e => new Date(e.dueDate) < new Date() && e.status !== 'closed' && e.status !== 'resolved').length
  };

  const categoryBreakdown = [
    { name: 'Financial', count: 1, percentage: 20 },
    { name: 'Operational', count: 1, percentage: 20 },
    { name: 'Compliance', count: 1, percentage: 20 },
    { name: 'System', count: 1, percentage: 20 },
    { name: 'Security', count: 1, percentage: 20 }
  ];

  const filteredExceptions = exceptions.filter(exception => {
    const matchesCategory = selectedCategory === 'all' || exception.category.toLowerCase() === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || exception.severity === selectedSeverity;
    return matchesCategory && matchesSeverity;
  });
   
 type Severity = 'critical' | 'high' | 'medium' | 'low' | string;

  const getSeverityColor = (severity:Severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  type Status = 'open' | 'investigating' | 'in-progress' | 'resolved' | 'closed' | string; 
  const getStatusColor = (status:Status) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityIcon = (severity:Severity) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'medium':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Exception Reports</h2>
            <p className="text-sm text-gray-600 mt-1">Monitor and manage business rule exceptions and anomalies</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-bold text-gray-900">{exceptionSummary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Critical</p>
              <p className="text-lg font-bold text-gray-900">{exceptionSummary.critical}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">High</p>
              <p className="text-lg font-bold text-gray-900">{exceptionSummary.high}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Medium</p>
              <p className="text-lg font-bold text-gray-900">{exceptionSummary.medium}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Open</p>
              <p className="text-lg font-bold text-gray-900">{exceptionSummary.open}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <Calendar className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Overdue</p>
              <p className="text-lg font-bold text-gray-900">{exceptionSummary.overdue}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              title='category'
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
              <option value="compliance">Compliance</option>
              <option value="system">System</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
            <select
            title='severity'
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              title='Range'
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <Filter className="h-4 w-4" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exception List */}
        <div className="lg:col-span-2 bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exception Details</h3>
          <div className="space-y-4">
            {filteredExceptions.map((exception) => (
              <div key={exception.id} className={`border rounded-lg p-4 ${getSeverityColor(exception.severity)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    {getSeverityIcon(exception.severity)}
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900">{exception.type}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(exception.severity)}`}>
                          {exception.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{exception.description}</p>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(exception.status)}`}>
                    {exception.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-medium text-gray-600">Category:</span>
                    <span className="ml-1 text-gray-900">{exception.category}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Responsible:</span>
                    <span className="ml-1 text-gray-900">{exception.responsible}</span>
                  </div>
                  {exception.amount > 0 && (
                    <div>
                      <span className="font-medium text-gray-600">Amount:</span>
                      <span className="ml-1 text-gray-900">${exception.amount.toLocaleString()}</span>
                    </div>
                  )}
                  {exception.threshold > 0 && (
                    <div>
                      <span className="font-medium text-gray-600">Threshold:</span>
                      <span className="ml-1 text-gray-900">{exception.threshold}%</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Due: {exception.dueDate}</span>
                  <span>{exception.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Exception Categories</h3>
          <div className="space-y-4">
            {categoryBreakdown.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-900">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{category.count}</span>
                  <span className="text-xs text-gray-500 ml-1">({category.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trend Analysis */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Trend Analysis</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">This Week:</span>
                <span className="font-medium text-gray-900">5 exceptions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Week:</span>
                <span className="font-medium text-gray-900">8 exceptions</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Change:</span>
                <span className="font-medium text-green-600">-37.5% ↓</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Create Exception Report
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Schedule Automated Review
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                Configure Alert Thresholds
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExceptionReports;