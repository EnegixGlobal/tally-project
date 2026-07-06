import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../services/api';

interface CAUser {
  id?: number;
  name: string;
  email: string;
  phone: string;
  firm_name: string;
  registration_number: string;
  password?: string;
  confirmPassword?: string;
  status: 'active' | 'suspended' | 'pending';
  created_at?: string;
}

const CAManagement: React.FC = () => {
  const { theme } = useTheme();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCA, setEditingCA] = useState<CAUser | null>(null);
  const [caList, setCaList] = useState<CAUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newCA, setNewCA] = useState<CAUser>({
    name: '',
    email: '',
    phone: '',
    firm_name: '',
    registration_number: '',
    password: '',
    confirmPassword: '',
    status: 'active'
  });

  const fetchCAs = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/ca');
      setCaList(response.data);
    } catch (error) {
      console.error('Error fetching CAs:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load CA list',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCAs();
  }, []);

  const resetForm = () => {
    setShowAddForm(false);
    setEditingCA(null);
    setNewCA({
      name: '',
      email: '',
      phone: '',
      firm_name: '',
      registration_number: '',
      password: '',
      confirmPassword: '',
      status: 'active'
    });
  };

  const handleEditClick = (ca: CAUser) => {
    setEditingCA(ca);
    setNewCA({
      ...ca,
      password: '',
      confirmPassword: ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/api/ca/${id}`);
        Swal.fire('Deleted!', 'The CA has been deleted.', 'success');
        fetchCAs();
      } catch (error: any) {
        console.error('Error deleting CA:', error);
        Swal.fire('Error!', error.response?.data?.error || 'Failed to delete CA.', 'error');
      }
    }
  };

  const handleSaveCA = async () => {
    if (newCA.password && newCA.password !== newCA.confirmPassword) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Passwords do not match',
      });
      return;
    }

    if (!newCA.name || !newCA.email || !newCA.phone || !newCA.firm_name || !newCA.registration_number) {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please fill all mandatory fields',
      });
      return;
    }
    
    if (!editingCA && !newCA.password) {
        Swal.fire({
          icon: 'warning',
          title: 'Validation Error',
          text: 'Password is required for a new CA',
        });
        return;
    }

    try {
      Swal.fire({
        title: editingCA ? 'Updating CA...' : 'Creating CA...',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const payload = {
        name: newCA.name,
        email: newCA.email,
        phone: newCA.phone,
        firmName: newCA.firm_name,
        registrationNumber: newCA.registration_number,
        password: newCA.password,
        status: newCA.status
      };

      if (editingCA) {
        await api.put(`/api/ca/${editingCA.id}`, payload);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'CA updated successfully!',
        });
      } else {
        await api.post('/api/ca', payload);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'CA added successfully!',
        });
      }
      
      resetForm();
      fetchCAs(); // Refresh the list
    } catch (error: any) {
      console.error('Error saving CA:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed',
        text: error.response?.data?.error || 'An error occurred while saving CA',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 border border-green-200';
      case 'suspended':
        return 'bg-red-100 text-red-700 border border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            CA Management
          </h1>
          <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            Manage your CA accounts and permissions
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddForm(true);
          }}
          className="flex items-center px-4 py-2 bg-primary text-white rounded-xl hover:bg-primaryDark transition-all active:scale-95 shadow-lg shadow-primary/30"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add CA
        </button>
      </div>

      {/* Add / Edit CA Form */}
      {showAddForm && (
        <div className={`rounded-xl border p-4 sm:p-6 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow-xl animate-in fade-in slide-in-from-top-4 duration-300`}>
          <h3 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-lg font-semibold mb-4 flex items-center`}>
            {editingCA ? <Edit className="w-5 h-5 mr-2 text-primary" /> : <Users className="w-5 h-5 mr-2 text-primary" />}
            {editingCA ? 'Edit CA Profile' : 'Create New CA'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Full Name *
              </label>
              <input
                type="text"
                value={newCA.name}
                onChange={(e) => setNewCA({ ...newCA, name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                placeholder="Enter full name..."
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Email Address *
              </label>
              <input
                type="email"
                value={newCA.email}
                onChange={(e) => setNewCA({ ...newCA, email: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                placeholder="Enter email address..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Phone Number *
              </label>
              <input
                type="text"
                value={newCA.phone}
                onChange={(e) => setNewCA({ ...newCA, phone: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                placeholder="Enter phone number..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Firm Name *
              </label>
              <input
                type="text"
                value={newCA.firm_name}
                onChange={(e) => setNewCA({ ...newCA, firm_name: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                placeholder="Enter firm name..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                CA Registration Number *
              </label>
              <input
                type="text"
                value={newCA.registration_number}
                onChange={(e) => setNewCA({ ...newCA, registration_number: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                placeholder="Enter registration number..."
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Account Status
              </label>
              <select
                value={newCA.status}
                onChange={(e) => setNewCA({ ...newCA, status: e.target.value as any })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 flex items-center justify-between ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>Password {editingCA && <span className="text-xs text-gray-400 font-normal ml-2">(Leave blank to keep current)</span>}</span>
              </label>
              <input
                type="password"
                value={newCA.password}
                onChange={(e) => setNewCA({ ...newCA, password: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                placeholder={editingCA ? "Enter new password to change..." : "Enter password..."}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Confirm Password
              </label>
              <input
                type="password"
                value={newCA.confirmPassword}
                onChange={(e) => setNewCA({ ...newCA, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-gray-50 text-gray-900'}`}
                placeholder="Confirm password..."
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 border-t border-gray-700/10 pt-6">
            <button 
              onClick={resetForm} 
              className={`px-6 py-2.5 border rounded-xl font-medium transition-all ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Cancel
            </button>
            <button 
              onClick={handleSaveCA} 
              className="px-8 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primaryDark active:scale-95 shadow-lg shadow-primary/20"
            >
              {editingCA ? 'Update CA' : 'Create CA'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area - Table */}
      {!showAddForm && (
        <div className={`rounded-xl shadow-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : caList.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <tr>
                    <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>ID</th>
                    <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Name</th>
                    <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Firm Name</th>
                    <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Reg. No.</th>
                    <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Email</th>
                    <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Phone</th>
                    <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Status</th>
                    <th className={`px-6 py-4 text-right font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                  {caList.map((ca) => (
                    <tr key={ca.id} className={`${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/30'} transition-colors`}>
                      <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} text-sm`}>
                        {ca.id}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-medium`}>
                        {ca.name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {ca.firm_name}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {ca.registration_number}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {ca.email}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {ca.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadge(ca.status)} shadow-sm`}>
                          {ca.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            title="Edit CA"
                            onClick={() => handleEditClick(ca)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            title="Delete CA"
                            onClick={() => ca.id && handleDelete(ca.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`p-8 flex flex-col items-center justify-center min-h-[400px]`}>
              <div className={`p-4 rounded-full mb-4 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <Users className={`w-8 h-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
              </div>
              <h2 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                No CAs Found
              </h2>
              <p className={`text-sm text-center max-w-md ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                Get started by adding a new CA using the "Add CA" button above.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CAManagement;
