import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, Filter, Mail, Phone, Eye, Lock, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  status: string;
  lastLogin: string | null;
  createdAt: string | null;
  permissions: string[];
}

function UserAccounts() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter] = useState<string>('all');
  const [showAddUser, setShowAddUser] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [, setErrorMsg] = useState<string>('');

  // New User form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'User',
    department: '',
    password: '',
    confirmPassword: ''
  });
  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  // Assume we get logged-in employee ID from localStorage or auth context
  const creatorEmployeeId = localStorage.getItem('employee_id') || '';
// Fetch roles list on mount
  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch('http://localhost:5000/api/roles/names');
        const data = await res.json();
        if (data.success) {
          setAvailableRoles(data.roles);
          // Set the default newUser role to the first role (if you want)
          setNewUser(prev => ({
            ...prev,
            role: data.roles[0] || 'User'
          }));
        } else {
          setAvailableRoles(['User', 'Manager', 'Admin']); // fallback
        }
      } catch {
        setAvailableRoles(['User', 'Manager', 'Admin']);
      }
    }
    fetchRoles();
  }, []); // Only run once on mount

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, statusFilter, roleFilter]);

  async function fetchUsers() {
    if (!creatorEmployeeId) {
      setErrorMsg('Creator employee ID not found. Please login again.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    const params = new URLSearchParams({
      creatorEmployeeId,
      search: searchTerm,
      status: statusFilter,
      role: roleFilter,
    });

    try {
      const res = await fetch(`http://localhost:5000/api/users?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setErrorMsg(data.error || 'Failed to load users');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Unexpected error fetching users');
    }

    setLoading(false);
  }

  function getStatusColor(status: string) {
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
  }

  function getRoleColor(role: string) {
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
  }

  async function handleAddUser() {
      const companyId = localStorage.getItem("company_id") || '';

    setErrorMsg('');
    if (newUser.password !== newUser.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password) {
      alert('Please fill in all required fields.');
      return;
    }
    if (!creatorEmployeeId) {
      alert('Creator employee ID missing. Please login again.');
      return;
    }

    const payload = {
      ...newUser,
      creatorEmployeeId,
      companyId,
    };

    try {
      const res = await fetch(`http://localhost:5000/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        alert('User added successfully!');
        setShowAddUser(false);
        // Reset form
        setNewUser({
          name: '',
          email: '',
          phone: '',
          role: 'User',
          department: '',
          password: '',
          confirmPassword: ''
        });
        await fetchUsers();
      } else {
        alert(data.error || 'Failed to add user');
      }
    } catch (e: any) {
      alert(e.message || 'Unexpected error adding user');
    }
  }

  async function handleDeleteUser(user: User) {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        alert('User deleted successfully!');
        await fetchUsers();
      } else {
        alert(data.error || 'Failed to delete user');
      }
    } catch (e: any) {
      alert(e.message || 'Unexpected error deleting user');
    }
  }

  async function handleSuspendUser(user: User) {
    if (!window.confirm(`Are you sure you want to suspend ${user.name}?`)) return;
    try {
      const res = await fetch(`http://localhost:5000/api/users/${user.id}/suspend`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        alert('User suspended successfully!');
        await fetchUsers();
      } else {
        alert(data.error || 'Failed to suspend user');
      }
    } catch (e: any) {
      alert(e.message || 'Unexpected error suspending user');
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            title="Back to Reports"
            type="button"
            onClick={() => navigate('/app/config')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">User Accounts</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Manage user accounts and access permissions</p>
          </div>
          <button
            onClick={() => setShowAddUser(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <select
            title="Filter by Status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <select
              value={newUser.role}
              onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              aria-label="Role"
            >
            <option value="all">All Roles</option>

              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          <button className="flex items-center justify-center px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors">
            <Filter className="h-4 w-4 mr-1" />
            More Filters
          </button>
        </div>
      </div>

      {/* User Table */}
      <div className="bg-white border rounded overflow-x-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-600">Loading users...</div>
        ) : (
          <table className="min-w-full table-auto border-collapse">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="flex items-center text-gray-500 text-sm mt-1 space-x-2">
                        <Mail className="h-4 w-4" />
                        <span>{user.email}</span>
                      </div>
                      <div className="flex items-center text-gray-500 text-sm space-x-2">
                        <Phone className="h-4 w-4" />
                        <span>{user.phone}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{user.department}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{user.lastLogin || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{user.createdAt || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setSelectedUser(user)}
                        title="View Details"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      {/* Edit button: add implementation as needed */}
                      {/* Suspend */}
                      {user.status !== 'suspended' && (
                        <button
                          onClick={() => handleSuspendUser(user)}
                          title="Suspend User"
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Lock className="h-5 w-5" />
                        </button>
                      )}
                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteUser(user)}
                        title="Delete User"
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-6">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <div className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Full Name</span>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="John Doe"
                  aria-label="Full Name"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Email</span>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="email@example.com"
                  aria-label="Email"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Phone</span>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={e => setNewUser(prev => ({ ...prev, phone: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  placeholder="+1234567890"
                  aria-label="Phone"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Role</span>
                <select
              value={newUser.role}
              onChange={e => setNewUser(prev => ({ ...prev, role: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              aria-label="Role"
            >
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Department</span>
                <input
                  type="text"
                  value={newUser.department}
                  onChange={e => setNewUser(prev => ({ ...prev, department: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  aria-label="Department"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Password</span>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={e => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  aria-label="Password"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-gray-700">Confirm Password</span>
                <input
                  type="password"
                  value={newUser.confirmPassword}
                  onChange={e => setNewUser(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
                  aria-label="Confirm Password"
                />
              </label>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 border rounded border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button onClick={() => setSelectedUser(null)} aria-label="Close user details" className="text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-xl font-semibold text-blue-600">
                  {selectedUser.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-xl font-semibold">{selectedUser.name}</h4>
                  <p className="text-gray-600">{selectedUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                <div><strong>Role:</strong> {selectedUser.role}</div>
                <div><strong>Department:</strong> {selectedUser.department}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(selectedUser.status)}`}>
                    {selectedUser.status}
                  </span>
                </div>
                <div><strong>Phone:</strong> {selectedUser.phone}</div>
                <div><strong>Last Login:</strong> {selectedUser.lastLogin || '-'}</div>
                <div><strong>Created:</strong> {selectedUser.createdAt || '-'}</div>
              </div>
              <div>
                <strong>Permissions:</strong>
                <div className="mt-1 flex flex-wrap gap-2">
                  {selectedUser.permissions.length === 0 && '-'}
                  {selectedUser.permissions.map(p => (
                    <span key={p} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">{p}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
              >
                Close
              </button>
              {/* Implement edit action as needed */}
              {/* <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Edit User</button> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserAccounts;
