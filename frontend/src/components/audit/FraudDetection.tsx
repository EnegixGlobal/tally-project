import  { useState } from 'react';
import { AlertTriangle, Shield, TrendingUp, Eye, DollarSign, Clock, MapPin ,ArrowLeft} from 'lucide-react';//Users,
import { useNavigate } from 'react-router-dom';

const FraudDetection = () => {
    const navigate = useNavigate()
  const [alertLevel, setAlertLevel] = useState('all');
  const [timeRange, setTimeRange] = useState('24h');

  const fraudAlerts = [
    {
      id: 1,
      timestamp: '2024-01-15 10:45:12',
      type: 'Suspicious Transaction',
      severity: 'high',
      description: 'Multiple high-value transactions from new user account',
      user: 'user_12345',
      amount: 15000,
      location: 'Unknown Location (VPN)',
      ipAddress: '45.32.123.45',
      riskScore: 95,
      status: 'investigating',
      flags: ['New Account', 'High Value', 'VPN Usage', 'Velocity']
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:30:25',
      type: 'Account Takeover',
      severity: 'critical',
      description: 'Login from unusual location with immediate password change',
      user: 'john.doe@company.com',
      amount: 0,
      location: 'Romania',
      ipAddress: '78.96.45.123',
      riskScore: 98,
      status: 'blocked',
      flags: ['Geographic Anomaly', 'Credential Change', 'Failed 2FA']
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:15:33',
      type: 'Payment Fraud',
      severity: 'medium',
      description: 'Card testing with multiple failed payment attempts',
      user: 'guest_user',
      amount: 1.00,
      location: 'Multiple Locations',
      ipAddress: 'Various',
      riskScore: 75,
      status: 'monitoring',
      flags: ['Card Testing', 'Multiple Failures', 'Bot Behavior']
    },
    {
      id: 4,
      timestamp: '2024-01-15 10:00:55',
      type: 'Data Scraping',
      severity: 'medium',
      description: 'Automated requests to extract sensitive data',
      user: 'api_user_789',
      amount: 0,
      location: 'United States',
      ipAddress: '192.168.1.200',
      riskScore: 68,
      status: 'resolved',
      flags: ['High Request Rate', 'Automated', 'Data Access']
    }
  ];

  const fraudMetrics = {
    totalAlerts: 24,
    criticalAlerts: 3,
    blockedTransactions: 8,
    savedAmount: 45000,
    falsePositives: 12,
    averageResponseTime: '4.2 min'
  };

  const detectionRules = [
    {
      name: 'Velocity Checks',
      description: 'Multiple transactions in short time period',
      enabled: true,
      threshold: '5 transactions in 10 minutes',
      triggered: 15
    },
    {
      name: 'Geographic Anomaly',
      description: 'Login from unusual geographical location',
      enabled: true,
      threshold: 'Distance > 500 miles from usual location',
      triggered: 8
    },
    {
      name: 'High-Value Transactions',
      description: 'Transactions exceeding normal patterns',
      enabled: true,
      threshold: 'Amount > $10,000 or 3x average',
      triggered: 12
    },
    {
      name: 'Device Fingerprinting',
      description: 'Unknown or suspicious device characteristics',
      enabled: true,
      threshold: 'New device + high-risk behavior',
      triggered: 6
    },
    {
      name: 'Behavioral Analysis',
      description: 'Unusual user behavior patterns',
      enabled: false,
      threshold: 'ML model confidence < 30%',
      triggered: 0
    }
  ];

  const getSeverityColor = (severity:string) => {
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

  const getStatusColor = (status:string) => {
    switch (status) {
      case 'blocked':
        return 'bg-red-100 text-red-800';
      case 'investigating':
        return 'bg-yellow-100 text-yellow-800';
      case 'monitoring':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAlerts = fraudAlerts.filter(alert => {
    if (alertLevel === 'all') return true;
    return alert.severity === alertLevel;
  });

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
         <div className="flex items-center mb-4">
             <button
                title='Back to Reports'
                type='button'
                onClick={() => navigate('/app/audit')}
                className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                <ArrowLeft size={20} />
             </button>
                  <h2 className="text-xl font-semibold text-gray-900">Fraud Detection</h2>
         </div>
        <div className="flex items-center justify-between">
          <div>
           
            <p className="text-sm text-gray-600 mt-1">Real-time fraud monitoring and prevention system</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
            title='alert'
              value={alertLevel}
              onChange={(e) => setAlertLevel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Alerts</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
            title='timeRange'
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fraud Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Total Alerts</p>
              <p className="text-lg font-bold text-gray-900">{fraudMetrics.totalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <Shield className="h-5 w-5 text-red-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Critical</p>
              <p className="text-lg font-bold text-gray-900">{fraudMetrics.criticalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <Eye className="h-5 w-5 text-blue-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Blocked</p>
              <p className="text-lg font-bold text-gray-900">{fraudMetrics.blockedTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Saved</p>
              <p className="text-lg font-bold text-gray-900">${fraudMetrics.savedAmount.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">False +</p>
              <p className="text-lg font-bold text-gray-900">{fraudMetrics.falsePositives}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="h-5 w-5 text-indigo-600" />
            <div className="ml-3">
              <p className="text-xs text-gray-500">Avg Response</p>
              <p className="text-lg font-bold text-gray-900">{fraudMetrics.averageResponseTime}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fraud Alerts */}
        <div className="lg:col-span-2 bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Fraud Alerts</h3>
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{alert.type}</h4>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{alert.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">Risk: {alert.riskScore}%</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(alert.status)}`}>
                      {alert.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-medium text-gray-600">User:</span>
                    <span className="ml-1 text-gray-900">{alert.user}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Amount:</span>
                    <span className="ml-1 text-gray-900">
                      {alert.amount > 0 ? `$${alert.amount.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                    <span className="text-gray-900">{alert.location}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">IP:</span>
                    <span className="ml-1 text-gray-900">{alert.ipAddress}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {alert.flags.map((flag, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {flag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{alert.timestamp}</span>
                  <div className="space-x-2">
                    <button className="text-blue-600 hover:text-blue-800">Investigate</button>
                    <button className="text-green-600 hover:text-green-800">Approve</button>
                    <button className="text-red-600 hover:text-red-800">Block</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detection Rules */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detection Rules</h3>
          <div className="space-y-4">
            {detectionRules.map((rule, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{rule.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{rule.triggered}</span>
                    <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                <p className="text-xs text-gray-500">Threshold: {rule.threshold}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">ML Model Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Accuracy:</span>
                <span className="font-medium text-blue-900">94.2%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Precision:</span>
                <span className="font-medium text-blue-900">91.8%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Recall:</span>
                <span className="font-medium text-blue-900">96.5%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Last Updated:</span>
                <span className="font-medium text-blue-900">2 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FraudDetection;