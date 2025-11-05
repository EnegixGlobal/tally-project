import React, { useState } from 'react';
import { Users, Edit, Trash2, Eye, EyeOff, UserPlus } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const RoleManagement: React.FC = () => {
  const { theme } = useTheme();
  
  // Sub-admin management state
  const [showCreateSubAdmin, setShowCreateSubAdmin] = useState(false);
  const [subAdmins, setSubAdmins] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Admin',
      status: 'Active',
      createdAt: '2024-01-15',
      permissions: {
        dashboard: true,
        userManagement: true,
        subscriptions: true,
        payments: false,
        settings: false,
        support: true
      }
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Support',
      status: 'Active',
      createdAt: '2024-01-20',
      permissions: {
        dashboard: true,
        userManagement: false,
        subscriptions: false,
        payments: false,
        settings: false,
        support: true
      }
    }
  ]);
  
  const [newSubAdmin, setNewSubAdmin] = useState({
    name: '',
    email: '',
    role: 'Support',
    password: '',
    permissions: {
      dashboard: true,
      userManagement: false,
      subscriptions: false,
      payments: false,
      settings: false,
      support: true
    }
  });
  
  const [showPassword, setShowPassword] = useState(false);

  // Role definitions with permissions
  const roleDefinitions = {
    'Super Admin': {
      description: 'Full access to all features',
      permissions: {
        dashboard: true,
        userManagement: true,
        subscriptions: true,
        payments: true,
        settings: true,
        support: true
      }
    },
    'Admin': {
      description: 'Manage users and subscriptions',
      permissions: {
        dashboard: true,
        userManagement: true,
        subscriptions: true,
        payments: true,
        settings: false,
        support: true
      }
    },
    'Support': {
      description: 'Handle support tickets only',
      permissions: {
        dashboard: true,
        userManagement: false,
        subscriptions: false,
        payments: false,
        settings: false,
        support: true
      }
    }
  };

  // Helper functions
  const handleCreateSubAdmin = () => {
    if (newSubAdmin.name && newSubAdmin.email && newSubAdmin.password) {
      const subAdmin = {
        id: Date.now(),
        ...newSubAdmin,
        status: 'Active',
        createdAt: new Date().toISOString().split('T')[0]
      };
      setSubAdmins([...subAdmins, subAdmin]);
      setNewSubAdmin({
        name: '',
        email: '',
        role: 'Support',
        password: '',
        permissions: roleDefinitions['Support'].permissions
      });
      setShowCreateSubAdmin(false);
    }
  };

  const handleDeleteSubAdmin = (id: number) => {
    setSubAdmins(subAdmins.filter(admin => admin.id !== id));
  };

  const handleRoleChange = (role: string) => {
    setNewSubAdmin({
      ...newSubAdmin,
      role,
      permissions: roleDefinitions[role as keyof typeof roleDefinitions]?.permissions || newSubAdmin.permissions
    });
  };

  const handlePermissionChange = (permission: string, value: boolean) => {
    setNewSubAdmin({
      ...newSubAdmin,
      permissions: {
        ...newSubAdmin.permissions,
        [permission]: value
      }
    });
  };

  const toggleSubAdminStatus = (id: number) => {
    setSubAdmins(subAdmins.map(admin => 
      admin.id === id 
        ? { ...admin, status: admin.status === 'Active' ? 'Inactive' : 'Active' }
        : admin
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className={`text-lg font-semibold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Role Management</h3>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>Create and manage sub-admin accounts with custom permissions</p>
        </div>
        <button
          onClick={() => setShowCreateSubAdmin(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Sub-Admin
        </button>
      </div>

      {/* Create Sub-Admin Form */}
      {showCreateSubAdmin && (
        <div className={`rounded-lg border p-6 ${
          theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h4 className={`text-lg font-medium ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>Create New Sub-Admin</h4>
            <button
              onClick={() => setShowCreateSubAdmin(false)}
              className={`text-gray-500 hover:text-gray-700 ${
                theme === 'dark' ? 'hover:text-gray-300' : ''
              }`}
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Full Name
              </label>
              <input
                type="text"
                title="Full Name"
                value={newSubAdmin.name}
                onChange={(e) => setNewSubAdmin({...newSubAdmin, name: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-800 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Email Address
              </label>
              <input
                type="email"
                title="Email Address"
                value={newSubAdmin.email}
                onChange={(e) => setNewSubAdmin({...newSubAdmin, email: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-800 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
                placeholder="Enter email address"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Role
              </label>
              <select
                title="Select Role"
                value={newSubAdmin.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-800 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="Support">Support</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  title="Password"
                  value={newSubAdmin.password}
                  onChange={(e) => setNewSubAdmin({...newSubAdmin, password: e.target.value})}
                  className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-800 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute inset-y-0 right-0 pr-3 flex items-center ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Custom Permissions */}
          <div className="mb-6">
            <h5 className={`text-sm font-medium mb-3 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Custom Permissions
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(newSubAdmin.permissions).map(([permission, enabled]) => (
                <label key={permission} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={`text-sm capitalize ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {permission.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowCreateSubAdmin(false)}
              className={`px-4 py-2 border rounded-lg ${
                theme === 'dark' 
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-600' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSubAdmin}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Sub-Admin
            </button>
          </div>
        </div>
      )}

      {/* Sub-Admins List */}
      <div className={`rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h4 className={`text-lg font-medium ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>Existing Sub-Admins</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Name
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Email
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Role
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Status
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Created
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {subAdmins.map((admin) => (
                <tr key={admin.id} className={
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>
                      {admin.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {admin.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      admin.role === 'Admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleSubAdminStatus(admin.id)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        admin.status === 'Active'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }`}
                    >
                      {admin.status}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {admin.createdAt}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {/* TODO: Implement edit functionality */}}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSubAdmin(admin.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {subAdmins.length === 0 && (
            <div className={`text-center py-8 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No sub-admins created yet</p>
              <p className="text-sm">Click "Add Sub-Admin" to create your first sub-admin account</p>
            </div>
          )}
        </div>
      </div>

      {/* Role Definitions */}
      <div className={`rounded-lg border p-6 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h4 className={`text-lg font-medium mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Role Definitions</h4>
        <div className="space-y-4">
          {Object.entries(roleDefinitions).map(([role, definition]) => (
            <div key={role} className={`p-4 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <h5 className={`font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>{role}</h5>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  role === 'Super Admin' 
                    ? 'bg-purple-100 text-purple-800'
                    : role === 'Admin'
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-green-100 text-green-800'
                }`}>
                  {Object.values(definition.permissions).filter(Boolean).length} permissions
                </span>
              </div>
              <p className={`text-sm mb-3 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>
                {definition.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(definition.permissions).map(([permission, enabled]) => (
                  enabled && (
                    <span key={permission} className={`px-2 py-1 text-xs rounded-full ${
                      theme === 'dark' 
                        ? 'bg-gray-600 text-gray-300' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {permission.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleManagement;
