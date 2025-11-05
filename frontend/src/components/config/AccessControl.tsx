import { useState } from 'react';
import { Shield, Users, Lock, Key, Save, Plus, Edit, Trash2, Search, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Define the User type
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string;
  permissions: string[];
  ipRestrictions: string[];
  timeRestrictions: { start: string; end: string };
}

interface AccessRule {
  id: number;
  name: string;
  description: string;
  type: string;
  conditions: string[];
  permissions: string[];
  priority: number;
  enabled: boolean;
}

const AccessControl = () => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');  const [filterRole, setFilterRole] = useState('all');
  const navigate = useNavigate();

  // Helper functions
  const handleAddUser = () => {
    // Add user logic here
    console.log('Adding new user...');
    setShowAddUser(false);
  };

  const handleSaveUser = () => {
    // Save user changes logic here
    console.log('Saving user changes...');
    setSelectedUser(null);
  };

  const handleDeleteUser = (userId: number) => {
    // Delete user logic here
    console.log('Deleting user with ID:', userId);
  };

  const users = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john.doe@company.com',
      role: 'Admin',
      department: 'IT',
      status: 'active',
      lastLogin: '2024-01-15 10:30:00',
      permissions: ['read', 'write', 'delete', 'admin'],
      ipRestrictions: ['192.168.1.0/24'],
      timeRestrictions: { start: '09:00', end: '18:00' }
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane.smith@company.com',
      role: 'Manager',
      department: 'Sales',
      status: 'active',
      lastLogin: '2024-01-15 09:45:00',
      permissions: ['read', 'write'],
      ipRestrictions: [],
      timeRestrictions: { start: '08:00', end: '19:00' }
    },
    {
      id: 3,
      name: 'Mike Johnson',
      email: 'mike.johnson@company.com',
      role: 'User',
      department: 'Accounts',
      status: 'inactive',
      lastLogin: '2024-01-10 14:20:00',
      permissions: ['read'],
      ipRestrictions: ['192.168.1.100'],
      timeRestrictions: { start: '09:00', end: '17:00' }
    }
  ];

  const accessRules: AccessRule[] = [
    {
      id: 1,
      name: 'Admin Full Access',
      description: 'Complete system access for administrators',
      type: 'role-based',
      conditions: ['role = admin'],
      permissions: ['all'],
      priority: 1,
      enabled: true
    },
    {
      id: 2,
      name: 'Manager Department Access',
      description: 'Department-level access for managers',
      type: 'department-based',
      conditions: ['role = manager', 'department = own'],
      permissions: ['read', 'write', 'approve'],
      priority: 2,
      enabled: true
    },
    {
      id: 3,
      name: 'Time-based Restriction',
      description: 'Restrict access outside business hours',
      type: 'time-based',
      conditions: ['time between 09:00-18:00'],
      permissions: ['deny'],
      priority: 3,
      enabled: true
    }
  ];

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getStatusColor = (status:string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleColor = (role:string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800';
      case 'Manager':
        return 'bg-blue-100 text-blue-800';
      case 'User':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/config')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                 <h2 className="text-xl font-semibold text-gray-900">Access Control</h2>
            </div>
        <div className="flex items-center justify-between">
          <div>
           
            <p className="text-sm text-gray-600 mt-1">Manage user access permissions and security policies</p>
          </div>          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddUser(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add User</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Users</h3>
              <p className="text-2xl font-bold text-gray-900">{users.filter(u => u.status === 'active').length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Lock className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Access Rules</h3>
              <p className="text-2xl font-bold text-gray-900">{accessRules.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Key className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Permissions</h3>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Access Management */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">User Access Management</h3>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
              title='Filter by Role'
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Manager">Manager</option>
                <option value="User">User</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Department:</span>
                    <span className="ml-1 text-gray-900">{user.department}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Last Login:</span>
                    <span className="ml-1 text-gray-900">{user.lastLogin}</span>
                  </div>
                </div>

                <div className="mt-3">
                  <span className="font-medium text-gray-600 text-sm">Permissions:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {user.permissions.map((permission) => (
                      <span key={permission} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    <Edit className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Access Rules */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Access Rules</h3>
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Plus className="h-4 w-4" />
              <span>Add Rule</span>
            </button>
          </div>

          <div className="space-y-4">
            {accessRules.map((rule) => (
              <div key={rule.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{rule.name}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Priority: {rule.priority}</span>
                    <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Type:</span>
                    <span className="ml-1 text-gray-900">{rule.type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Conditions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.conditions.map((condition, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                          {condition}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Permissions:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {rule.permissions.map((permission, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                          {permission}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center space-x-2">
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    <Edit className="h-4 w-4 inline mr-1" />
                    Edit
                  </button>
                  <button className="text-red-600 hover:text-red-800 text-sm">
                    <Trash2 className="h-4 w-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* IP and Time Restrictions */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Restrictions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">IP Address Restrictions</h4>            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input 
                  id="enableIpRestrictions"
                  type="checkbox" 
                  className="rounded" 
                />
                <label htmlFor="enableIpRestrictions" className="text-sm text-gray-700">Enable IP restrictions</label>
              </div>
              <div>
                <label htmlFor="allowedIpRanges" className="block text-sm font-medium text-gray-700 mb-2">Allowed IP Ranges</label>
                <textarea
                  id="allowedIpRanges"
                  rows={3}
                  placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>          <div>
            <h4 className="font-medium text-gray-900 mb-3">Time-based Access</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input 
                  id="enableTimeRestrictions"
                  type="checkbox" 
                  className="rounded" 
                />
                <label htmlFor="enableTimeRestrictions" className="text-sm text-gray-700">Enable time restrictions</label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                  <input
                    id="startTime"
                    type="time"
                    defaultValue="09:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                  <input
                    id="endTime"
                    type="time"
                    defaultValue="18:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  id="userName"
                  type="text"
                  placeholder="Enter user name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  id="userEmail"
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  id="userRole"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select role</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="User">User</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Details - {selectedUser.name}</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editUserName" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    id="editUserName"
                    type="text"
                    defaultValue={selectedUser.name}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label htmlFor="editUserEmail" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    id="editUserEmail"
                    type="email"
                    defaultValue={selectedUser.email}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="editUserRole" className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    id="editUserRole"
                    defaultValue={selectedUser.role}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="User">User</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="editUserDepartment" className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    id="editUserDepartment"
                    type="text"
                    defaultValue={selectedUser.department}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {['read', 'write', 'delete', 'admin'].map((permission) => (
                    <label key={permission} className="flex items-center">
                      <input
                        type="checkbox"
                        defaultChecked={selectedUser.permissions.includes(permission)}
                        className="rounded mr-2"
                      />
                      <span className="text-sm capitalize">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessControl;