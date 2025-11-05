import { useState } from 'react';
import { Search, Calendar, MapPin, Shield, AlertTriangle, CheckCircle, X , ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LoginHistory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  const loginHistory = [
    {
      id: 1,
      user: 'John Doe',
      email: 'john.doe@company.com',
      timestamp: '2024-01-15 10:45:12',
      ipAddress: '192.168.1.100',
      location: 'New York, USA',
      device: 'Chrome on Windows',
      status: 'success',
      sessionDuration: '2h 15m',
      twoFactor: true,
      riskScore: 'Low'
    },
    {
      id: 2,
      user: 'Jane Smith',
      email: 'jane.smith@company.com',
      timestamp: '2024-01-15 10:30:25',
      ipAddress: '192.168.1.105',
      location: 'Los Angeles, USA',
      device: 'Safari on macOS',
      status: 'success',
      sessionDuration: '1h 45m',
      twoFactor: true,
      riskScore: 'Low'
    },
    {
      id: 3,
      user: 'Unknown User',
      email: 'hacker@malicious.com',
      timestamp: '2024-01-15 10:15:33',
      ipAddress: '45.32.123.45',
      location: 'Unknown Location',
      device: 'Firefox on Linux',
      status: 'failed',
      sessionDuration: '0m',
      twoFactor: false,
      riskScore: 'High'
    },
    {
      id: 4,
      user: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      timestamp: '2024-01-15 09:45:10',
      ipAddress: '192.168.1.110',
      location: 'Chicago, USA',
      device: 'Edge on Windows',
      status: 'success',
      sessionDuration: '3h 20m',
      twoFactor: true,
      riskScore: 'Low'
    },
    {
      id: 5,
      user: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      timestamp: '2024-01-15 09:30:55',
      ipAddress: '10.0.0.15',
      location: 'Miami, USA',
      device: 'Mobile Safari on iOS',
      status: 'locked',
      sessionDuration: '0m',
      twoFactor: false,
      riskScore: 'Medium'
    }
  ];

  const filteredLogins = loginHistory.filter(login => {
    const matchesSearch = login.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.ipAddress.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || login.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status:string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      case 'locked':
        return <Shield className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status:string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'locked':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk:string) => {
    switch (risk) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const successfulLogins = filteredLogins.filter(login => login.status === 'success').length;
  const failedLogins = filteredLogins.filter(login => login.status === 'failed').length;
  const blockedAttempts = filteredLogins.filter(login => login.status === 'locked').length;

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
          <h1 className="text-lg md:text-xl font-semibold text-gray-900">Login History</h1>
         </div>
        
        <p className="text-sm text-gray-600 mt-1">Track all login attempts and security events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Successful Logins</h3>
              <p className="text-xl font-bold text-gray-900">{successfulLogins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <X className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Failed Attempts</h3>
              <p className="text-xl font-bold text-gray-900">{failedLogins}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Shield className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Blocked Attempts</h3>
              <p className="text-xl font-bold text-gray-900">{blockedAttempts}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users, emails, or IP addresses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
          title='status'
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
            <option value="locked">Locked</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select title='day' className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg">
        <table className="w-full table-fixed text-xs sm:text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">User</th>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">Timestamp</th>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">IP</th>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">Location</th>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">Device</th>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">Status</th>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">2FA</th>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">Risk</th>
              <th className="px-2 sm:px-4 py-2 text-left text-gray-500 font-medium">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredLogins.map(login => (
              <tr key={login.id} className="hover:bg-gray-50">
                <td className="px-2 sm:px-4 py-2 whitespace-normal break-words min-w-0">
                  <p className="font-medium text-gray-900 truncate">{login.user}</p>
                  <p className="text-gray-500 text-xs truncate">{login.email}</p>
                </td>
                <td className="px-2 sm:px-4 py-2 truncate">{login.timestamp}</td>
                <td className="px-2 sm:px-4 py-2 truncate">{login.ipAddress}</td>
                <td className="px-2 sm:px-4 py-2">
                  <div className="flex items-center space-x-1 truncate">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="truncate">{login.location}</span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2 truncate">{login.device}</td>
                <td className="px-2 sm:px-4 py-2">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(login.status)}
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(login.status)}`}>
                      {login.status}
                    </span>
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-2">
                  {login.twoFactor ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-red-600" />
                  )}
                </td>
                <td className="px-2 sm:px-4 py-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(login.riskScore)}`}>
                    {login.riskScore}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-2 truncate">{login.sessionDuration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoginHistory;
