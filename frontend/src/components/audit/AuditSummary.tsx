
import { Shield, Users, AlertTriangle, CheckCircle, TrendingUp, Activity, Clock, Database ,ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AuditSummary = () => {
    const navigate = useNavigate()
  const summaryCards = [
    {
      title: 'Total Transactions',
      value: '12,547',
      change: '+15%',
      changeType: 'positive',
      icon: Database,
      color: 'blue'
    },
    {
      title: 'Active Users',
      value: '127',
      change: '+8%',
      changeType: 'positive',
      icon: Users,
      color: 'green'
    },
    {
      title: 'Security Alerts',
      value: '23',
      change: '-12%',
      changeType: 'negative',
      icon: AlertTriangle,
      color: 'yellow'
    },
    {
      title: 'Compliance Score',
      value: '98.5%',
      change: '+2%',
      changeType: 'positive',
      icon: CheckCircle,
      color: 'emerald'
    }
  ];

  const recentActivities = [
    { time: '10:30 AM', action: 'User login', user: 'John Doe', status: 'success' },
    { time: '10:15 AM', action: 'Data modification', user: 'Jane Smith', status: 'warning' },
    { time: '09:45 AM', action: 'Failed login attempt', user: 'Unknown', status: 'error' },
    { time: '09:30 AM', action: 'Report generated', user: 'Admin', status: 'success' },
    { time: '09:15 AM', action: 'Backup completed', user: 'System', status: 'success' }
  ];

  const riskFactors = [
    { category: 'Authentication', level: 'Low', score: 85 },
    { category: 'Data Access', level: 'Medium', score: 72 },
    { category: 'Financial Transactions', level: 'Low', score: 90 },
    { category: 'User Behavior', level: 'High', score: 45 }
  ];

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
            <h1 className="text-xl font-semibold text-gray-900">Audit Summary Dashboard</h1>
         </div>
        
        <p className="text-sm text-gray-600 mt-1">Overview of system security and audit metrics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {summaryCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white border rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className={`text-sm mt-1 ${
                    card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change} from last month
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-${card.color}-100`}>
                  <Icon className={`h-6 w-6 text-${card.color}-600`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Recent Activities</h3>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{activity.time}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-600">by {activity.user}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  activity.status === 'success' ? 'bg-green-100 text-green-800' :
                  activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Assessment */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Risk Assessment</h3>
          </div>
          <div className="space-y-4">
            {riskFactors.map((risk, index) => (
              <div key={index}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900">{risk.category}</span>
                  <span className={`text-sm px-2 py-1 rounded-full ${
                    risk.level === 'Low' ? 'bg-green-100 text-green-800' :
                    risk.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {risk.level}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      risk.score >= 80 ? 'bg-green-500' :
                      risk.score >= 60 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${risk.score}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 mt-1">Score: {risk.score}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-2 p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Generate Report</span>
          </button>
          <button className="flex items-center space-x-2 p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">Run Compliance Check</span>
          </button>
          <button className="flex items-center space-x-2 p-3 border border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Review Alerts</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditSummary;