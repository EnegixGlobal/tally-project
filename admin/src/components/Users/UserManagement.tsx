import React, { useEffect, useState } from 'react';
import { Search, Filter, Edit, Trash2, Ban, Play, Users, MoreVertical, X, ExternalLink, FileText } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAdmin } from '../../hooks/useAdmin';
import { format } from 'date-fns';
import api from '../../services/api';
import Swal from 'sweetalert2';

interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  password: string;
  status: 'active' | 'suspended' | 'pending';
  lastLogin?: string | null;
  terms_file?: string | null;
}

const UserManagement: React.FC = () => {
  const { theme } = useTheme();
  const { adminData } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Details Modal States
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [caEmployees, setCaEmployees] = useState<any[]>([]);
  const [employeeCompanies, setEmployeeCompanies] = useState<any[]>([]);

  const getFileUrl = (filePath: string | null | undefined) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${import.meta.env.VITE_API_URL}${filePath}`;
  };

  const [newUser, setNewUser] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    status: 'active' as 'active' | 'suspended' | 'pending',
    terms_file: null as File | null,
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/adminUser');
      setUsers(res.data);
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Fetch Failed',
        text: err.response?.data?.error || err.message,
      });
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
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Passwords do not match',
      });
      return;
    }

    Swal.fire({
      title: 'Adding User...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const formData = new FormData();
      formData.append('name', newUser.name);
      formData.append('phone', newUser.phone);
      formData.append('email', newUser.email);
      formData.append('password', newUser.password);
      formData.append('status', newUser.status);
      if (newUser.terms_file) {
        formData.append('terms_file', newUser.terms_file);
      }

      const res = await api.post('/api/adminUser', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUsers((prev) => [...prev, res.data]);
      resetForm();
      Swal.fire({
        icon: 'success',
        title: 'User Added',
        text: 'The new admin has been created successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Operation Failed',
        text: err.response?.data?.error || 'Failed to add user',
      });
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;

    if (newUser.password && newUser.password !== newUser.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Passwords do not match',
      });
      return;
    }

    Swal.fire({
      title: 'Updating User...',
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      const formData = new FormData();
      formData.append('name', newUser.name);
      formData.append('phone', newUser.phone);
      formData.append('email', newUser.email);
      formData.append('status', newUser.status);
      if (newUser.password) formData.append('password', newUser.password);
      if (newUser.terms_file) {
        formData.append('terms_file', newUser.terms_file);
      }

      const res = await api.put(`/api/adminUser/${editingUser.id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...res.data } : u))
      );
      resetForm();
      Swal.fire({
        icon: 'success',
        title: 'User Updated',
        text: 'User profile has been updated successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (err: any) {
      console.error('Update failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.error || err.message,
      });
    }
  };


  const handleDeleteUser = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this user deletion!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/adminUser/${id}`);
        setUsers((prev) => prev.filter((u) => u.id !== id));
        Swal.fire(
          'Deleted!',
          'User has been removed from the system.',
          'success'
        );
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: err.response?.data?.error || err.message,
        });
      }
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'suspended') => {
    try {
      await api.patch(`/api/adminUser/${id}/status`, { status });

      // Update local state instead of reloading
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status } : u));

      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: `User status changed to ${status}`,
        showConfirmButton: false,
        timer: 3000
      });

    } catch (err: any) {
      console.error('Status update failed:', err);
      Swal.fire({
        icon: 'error',
        title: 'Status Update Failed',
        text: err.response?.data?.error || err.message,
      });
    }
  };

  const handleShowDetails = async (user: User) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
    setLoadingDetails(true);
    setCaEmployees([]);
    setEmployeeCompanies([]);

    try {
      if (adminData?.role === 'super_admin') {
        const res = await api.get(`/api/ca-employees-with-companies?ca_id=${user.id}`);
        setCaEmployees(res.data.employees || []);
      } else if (adminData?.role === 'ca_admin') {
        const res = await api.get(`/api/ca-employee-companies?ca_employee_id=${user.id}`);
        setEmployeeCompanies(res.data.companies || []);
      }
    } catch (err: any) {
      console.error('Failed to fetch details:', err);
    } finally {
      setLoadingDetails(false);
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
      terms_file: null,
    });
    setShowAddForm(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setNewUser({
      name: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      status: 'active',
      terms_file: null,
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
        <button onClick={() => setShowAddForm(true)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-all active:scale-95 shadow-lg shadow-primary/20">Add New User</button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className={`rounded-xl border p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl animate-in fade-in slide-in-from-top-4 duration-300`}>
          <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg font-semibold mb-4 flex items-center`}>
            {editingUser ? <Edit className="w-5 h-5 mr-2 text-primary" /> : <Users className="w-5 h-5 mr-2 text-primary" />}
            {editingUser ? 'Edit Admin Profile' : 'Create New Admin'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {['name', 'phone', 'email', 'password', 'confirmPassword'].map((field) => (
              <div key={field}>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                  {field === 'password' && editingUser && <span className="text-xs text-gray-400 font-normal ml-2">(Leave blank to keep current)</span>}
                </label>
                <input
                  type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
                  value={(newUser as any)[field] || ''}
                  onChange={(e) => setNewUser((prev) => ({ ...prev, [field]: e.target.value }))}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                  placeholder={`Enter ${field.toLowerCase()}...`}
                />
              </div>
            ))}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Account Status</label>
              <select
                value={newUser.status}
                onChange={(e) => setNewUser((prev) => ({ ...prev, status: e.target.value as 'active' | 'suspended' | 'pending' }))}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Terms & Condition (PDF/JPG)</label>
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewUser((prev) => ({ ...prev, terms_file: file }));
                    }}
                    className={`w-full px-4 py-2.5 border rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-gray-300 file:bg-gray-600 file:text-primary hover:file:bg-gray-500' : 'border-gray-200 bg-gray-50 text-gray-700 file:bg-blue-50 file:text-primary hover:file:bg-blue-100'} transition-all cursor-pointer`}
                  />
                </div>

                {/* Immediate Preview Section */}
                {newUser.terms_file && (
                  <div className={`shrink-0 w-12 h-12 rounded-xl border-2 border-dashed flex items-center justify-center p-1 ${theme === 'dark' ? 'border-gray-600 bg-gray-800' : 'border-gray-300 bg-white'}`}>
                    {newUser.terms_file.type === 'application/pdf' ? (
                      <FileText className="w-6 h-6 text-red-500" />
                    ) : (
                      <img
                        src={URL.createObjectURL(newUser.terms_file)}
                        alt="Preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                )}
              </div>

              {editingUser?.terms_file && !newUser.terms_file && (
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" /> Current file: <a href={getFileUrl(editingUser.terms_file)} target="_blank" rel="noreferrer" className="text-primary hover:underline">View Document</a>
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 border-t border-gray-700/10 pt-6">
            <button onClick={resetForm} className={`px-6 py-2.5 border rounded-xl font-medium transition-all ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancel</button>
            <button onClick={editingUser ? handleUpdateUser : handleAddUser} className="px-8 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primaryDark active:scale-95 shadow-lg shadow-primary/20">
              {editingUser ? 'Update Profile' : 'Create Admin'}
            </button>
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
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white text-gray-900'}`}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary cursor-pointer ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white text-gray-900'}`}
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
      <div className={`rounded-xl shadow-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Admin User</th>
                <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Phone Number</th>
                <th className={`px-4 sm:px-6 py-3 text-left font-semibold uppercase tracking-wider hidden md:table-cell ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Last Activity</th>
                <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Terms</th>
                <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className={`${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/30'} transition-colors`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold`}>{user.name}</span>
                      <span className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-xs italic`}>{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadge(user.status)} shadow-sm`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {user.phone || 'N/A'}
                  </td>
                  <td className={`px-4 sm:px-6 py-4 whitespace-nowrap hidden md:table-cell ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {user.lastLogin ? format(new Date(user.lastLogin), 'MMM dd, yyyy HH:mm') : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.terms_file ? (
                      <div className="flex items-center gap-2">
                        {/* Thumbnail or Icon */}
                        <div className={`w-8 h-8 rounded-lg border overflow-hidden flex items-center justify-center ${theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                          {user.terms_file.toLowerCase().endsWith('.pdf') ? (
                            <FileText className="w-4 h-4 text-red-500" />
                          ) : (
                            <img
                              src={getFileUrl(user.terms_file)}
                              alt="Terms"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/32?text=Doc';
                              }}
                            />
                          )}
                        </div>
                        <a
                          href={getFileUrl(user.terms_file)}
                          target="_blank"
                          rel="noreferrer"
                          className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all ${theme === 'dark' ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-800' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}
                        >
                          OPEN
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic text-[10px]">No file</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <button
                        title="Edit Admin"
                        onClick={() => handleEdit(user)}
                        className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        title="View Details"
                        onClick={() => handleShowDetails(user)}
                        className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      <button
                        title={user.status === 'active' ? 'Suspend Account' : 'Activate Account'}
                        onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'suspended' : 'active')}
                        className={`p-2 rounded-lg transition-all transform hover:scale-110 shadow-sm ${user.status === 'active'
                          ? 'bg-amber-100 text-amber-600 hover:bg-amber-600 hover:text-white'
                          : 'bg-green-100 text-green-600 hover:bg-green-600 hover:text-white'
                          }`}
                      >
                        {user.status === 'active' ? <Ban className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        title="Delete Permanently"
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                    No users found matching your search...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {
        showDetailsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border flex flex-col`}>
              {/* Modal Header */}
              <div className={`px-6 py-4 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-100 bg-gray-50/50'}`}>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {adminData?.role === 'super_admin' ? 'CA Employee Details' : 'Assigned Companies'}
                    </h3>
                    <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      Viewing information for <span className="font-semibold text-primary">{selectedUser?.name}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto p-6">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Fetching details...</p>
                  </div>
                ) : adminData?.role === 'super_admin' ? (
                  caEmployees.length > 0 ? (
                    <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <table className="w-full text-sm">
                        <thead className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold">Employee Name</th>
                            <th className="px-4 py-3 text-left font-semibold">Username (Email)</th>
                            <th className="px-4 py-3 text-left font-semibold">Phone</th>
                            <th className="px-4 py-3 text-left font-semibold">Allotted Companies</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                          {caEmployees.map((emp) => (
                            <tr key={emp.employee_id} className={theme === 'dark' ? 'hover:bg-gray-700/30' : 'hover:bg-gray-50'}>
                              <td className={`px-4 py-4 font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{emp.name}</td>
                              <td className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'} px-4 py-4 italic`}>{emp.email}</td>
                              <td className={`px-4 py-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{emp.phone || 'N/A'}</td>
                              <td className="px-4 py-4">
                                <div className="flex flex-wrap gap-1">
                                  {emp.company_names ? emp.company_names.split(',').map((c: string, i: number) => (
                                    <span key={i} className={`px-2 py-0.5 text-[10px] font-medium rounded-md ${theme === 'dark' ? 'bg-blue-900/40 text-blue-200' : 'bg-blue-50 text-blue-700'}`}>
                                      {c.trim()}
                                    </span>
                                  )) : (
                                    <span className="text-gray-400 italic text-xs">No companies assigned</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50/10 rounded-2xl border-2 border-dashed border-gray-700/20">
                      <p className="text-gray-500 italic">No employees found for this CA admin.</p>
                    </div>
                  )
                ) : (
                  employeeCompanies.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {employeeCompanies.map((comp) => (
                        <div key={comp.id} className={`p-4 rounded-xl border flex items-center justify-between group ${theme === 'dark' ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-all`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                              <ExternalLink className={`w-4 h-4 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                            </div>
                            <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{comp.name}</span>
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Allotted</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-gray-50/10 rounded-2xl border-2 border-dashed border-gray-700/20">
                      <p className="text-gray-500 italic">No companies allotted to this employee yet.</p>
                    </div>
                  )
                )}
              </div>

              {/* Modal Footer */}
              <div className={`px-6 py-4 border-t flex justify-end ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-gray-50'}`}>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-semibold hover:bg-primaryDark transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                  Close View
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default UserManagement;
