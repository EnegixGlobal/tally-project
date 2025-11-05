import { useState } from 'react';
import {
  Users,
  Clock,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  ArrowLeft
} from 'lucide-react';// Search,
import { useNavigate } from 'react-router-dom';

const UserActivity = () => {
  const [selectedUser, setSelectedUser] = useState('all');
  const [timeFilter, setTimeFilter] = useState('today');
  const navigate = useNavigate();

  const userActivities = [
    {
      id: 1,
      user: 'John Doe',
      email: 'john.doe@company.com',
      action: 'Created new invoice',
      module: 'Sales',
      timestamp: '2024-01-15 10:45:12',
      ipAddress: '192.168.1.100',
      device: 'Desktop',
      browser: 'Chrome',
      location: 'New York, USA',
      duration: '15 min',
      status: 'active'
    },
    {
      id: 2,
      user: 'Jane Smith',
      email: 'jane.smith@company.com',
      action: 'Updated customer record',
      module: 'CRM',
      timestamp: '2024-01-15 10:30:45',
      ipAddress: '192.168.1.105',
      device: 'Mobile',
      browser: 'Safari',
      location: 'Los Angeles, USA',
      duration: '8 min',
      status: 'idle'
    },
    {
      id: 3,
      user: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      action: 'Generated financial report',
      module: 'Accounts',
      timestamp: '2024-01-15 10:15:33',
      ipAddress: '192.168.1.110',
      device: 'Tablet',
      browser: 'Edge',
      location: 'Chicago, USA',
      duration: '25 min',
      status: 'active'
    },
    {
      id: 4,
      user: 'Sarah Wilson',
      email: 'sarah.wilson@company.com',
      action: 'Logged out',
      module: 'System',
      timestamp: '2024-01-15 10:00:21',
      ipAddress: '192.168.1.115',
      device: 'Desktop',
      browser: 'Firefox',
      location: 'Miami, USA',
      duration: '2 hours',
      status: 'offline'
    }
  ];

  const getDeviceIcon = (device:string) => {
    switch (device) {
      case 'Desktop':
        return <Monitor className="h-4 w-4" />;
      case 'Mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'Tablet':
        return <Tablet className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status:string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'idle':
        return 'bg-yellow-100 text-yellow-800';
      case 'offline':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const activeUsers = userActivities.filter(a => a.status === 'active').length;
  const totalSessions = userActivities.length;
  const avgSessionTime = '45 min';

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
            <h1 className="text-xl font-semibold text-gray-900">User Activity Monitor</h1>
         </div>
        
        <p className="text-sm text-gray-600">Real-time tracking of user actions and sessions</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-6 flex items-center">
          <div className="p-2 bg-green-100 rounded-lg">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
            <p className="text-2xl font-bold text-gray-900">{activeUsers}</p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 flex items-center">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Globe className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
            <p className="text-2xl font-bold text-gray-900">{totalSessions}</p>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6 flex items-center">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Avg Session Time</h3>
            <p className="text-2xl font-bold text-gray-900">{avgSessionTime}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select User</label>
            <select
            title='Select User'
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Users</option>
              <option value="john.doe">John Doe</option>
              <option value="jane.smith">Jane Smith</option>
              <option value="mike.johnson">Mike Johnson</option>
              <option value="sarah.wilson">Sarah Wilson</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
            <select
             title='Time Period'
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-lg overflow-auto">
        <table className="min-w-full text-sm text-left">
          <thead className="bg-gray-50 border-b text-xs text-gray-500 uppercase">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Module</th>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Device</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {userActivities.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {a.user
                        .split(' ')
                        .map((n) => n[0])
                        .join('')}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">{a.user}</p>
                      <p className="text-xs text-gray-500">{a.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">{a.action}</td>
                <td className="px-4 py-3">{a.module}</td>
                <td className="px-4 py-3">{a.timestamp}</td>
                <td className="px-4 py-3 flex items-center gap-2">
                  {getDeviceIcon(a.device)}
                  <span>{a.device}</span>
                </td>
                <td className="px-4 py-3">{a.location}</td>
                <td className="px-4 py-3">{a.duration}</td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                      a.status
                    )}`}
                  >
                    {a.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserActivity;
