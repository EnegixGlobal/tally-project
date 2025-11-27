import React, { useEffect, useState } from 'react';
import { Search, Filter, Edit, Trash2, Ban, Play } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  status: 'active' | 'suspended' | 'pending';
  lastLogin?: string | null;
}

const UserManagement: React.FC = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    status: 'active' as 'active' | 'suspended' | 'pending',
  });

  const API_URL = `${import.meta.env.VITE_API_URL}/api/adminUser`;

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      alert('Error fetching users');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (u) =>
      (u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === 'all' || u.status === statusFilter)
  );

  const handleAddUser = async () => {
    if (newUser.password !== newUser.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUser.name,
          phone: newUser.phone,
          email: newUser.email,
          password: newUser.password,
          status: newUser.status,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add user');
      }
      const data = await res.json();
      setUsers((prev) => [...prev, data]);
      resetForm();
    } catch (err) {
      console.error(err);
      alert(err);
    }
  };

const handleUpdateUser = async () => {
  if (!editingUser) return;

  if (newUser.password !== newUser.confirmPassword) {
    alert('Passwords do not match');
    return;
  }

  try {
    // Only send fields expected by the backend
    const payload: any = {
      name: newUser.name,
      phone: newUser.phone,
      email: newUser.email,
      status: newUser.status,
    };
    if (newUser.password) payload.password = newUser.password; // send password only if updated

    const res = await fetch(`${API_URL}/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Failed to update user');
    }

    const data = await res.json();
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? data : u))
    );
    resetForm();
  } catch (err) {
    console.error('Update failed:', err);
    alert('Failed to update user: ' + err);
  }
};


  const handleDeleteUser = async (id: string) => {
    await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

const handleStatusChange = async (id: string, status: 'active' | 'suspended') => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/adminUser/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      const text = await res.text(); // capture HTML or error message
      throw new Error(`API Error: ${text}`);
    }

    const data = await res.json();
    console.log('Status updated:', data);

    // Reload the page after successful update
    window.location.reload();

  } catch (err: any) {
    console.error('Status update failed:', err);
    alert('Failed to update user status: ' + err.message);
  }
};






  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name || '',
      phone: user.phone || '',
      email: user.email || '',
      password: '',
      confirmPassword: '',
      status: user.status || 'active',
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setNewUser({
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      status: 'active',
    });
    setEditingUser(null);
    setShowAddForm(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return theme === 'dark' ? 'bg-green-900 text-green-100' : 'bg-green-100 text-green-800';
      case 'suspended':
        return theme === 'dark' ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-800';
      case 'pending':
        return theme === 'dark' ? 'bg-yellow-900 text-yellow-100' : 'bg-yellow-100 text-yellow-800';
      default:
        return theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-2xl font-bold`}>User Management</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Manage users</p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark">Add New User</button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className={`rounded-xl border p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg font-semibold mb-4`}>
            {editingUser ? 'Edit User' : 'Add New User'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {['name', 'phone', 'email', 'password', 'confirmPassword'].map((field) => (
              <div key={field}>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                </label>
                <input
                  type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={newUser[field as keyof typeof newUser] || ''}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, [field]: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                  placeholder={`Enter ${field}`}
                />
              </div>
            ))}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser((prev) => ({ ...prev, status: e.target.value as 'active' | 'suspended' | 'pending' }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <button onClick={resetForm} className={`px-4 py-2 border rounded-lg ${theme === 'dark' ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-300 hover:bg-gray-50'}`}>Cancel</button>
            <button onClick={editingUser ? handleUpdateUser : handleAddUser} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark">{editingUser ? 'Update User' : 'Add User'}</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className={`rounded-xl shadow-sm border p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className={`rounded-xl shadow-sm border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>User</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Phone</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider hidden md:table-cell ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Last Login</th>
                <th className={`px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>{user.name}</span>
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs`}>{user.email}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}>{user.status}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">{user.phone}</td>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap text-sm hidden md:table-cell ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy') : 'Never'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button title="Edit User" onClick={() => handleEdit(user)} className="text-primary hover:text-primaryDark dark:text-purple-400 dark:hover:text-purple-200">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')} className={`${user.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}>
                        {user.status === 'active' ? <Ban className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button title="Delete User" onClick={() => handleDeleteUser(user.id)} className={`${theme === 'dark' ? 'text-red-400 hover:text-red-200' : 'text-red-600 hover:text-red-800'}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
