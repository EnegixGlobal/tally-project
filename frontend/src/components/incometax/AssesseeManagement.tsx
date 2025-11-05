import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, User, Plus, Edit, Trash2, Search, Download, Upload } from 'lucide-react';

interface Assessee {
  id: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  pan: string;
  aadhar: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  profession: string;
  category: 'individual' | 'huf' | 'firm' | 'company';
  assessmentYear: string;
  status: 'active' | 'inactive';
  createdDate: string;
}

const AssesseeManagement: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [assessees, setAssessees] = useState<Assessee[]>([]);

useEffect(() => {
  const fetchAssessees = async () => {
    try {
      const employee_id = localStorage.getItem('employee_id');

      if (!employee_id) {
        console.error('Employee ID not found in local storage');
        return;
      }

      // Add employee_id as a query parameter
      const response = await fetch(`http://localhost:5000/api/assessee?employee_id=${encodeURIComponent(employee_id)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching assessees: ${response.statusText}`);
      }

      const data: Assessee[] = await response.json();
      setAssessees(data);
    } catch (error: any) {
      console.error('Failed to fetch assessees:', error);
      // Optional: set error state or notify user here
    }
  };

  fetchAssessees();
}, []);



  const [showForm, setShowForm] = useState(false);
  const [editingAssessee, setEditingAssessee] = useState<Assessee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
// Persist/Load assessees locally so other modules (like ITR Filing) can fetch by PAN without backend
  const ASSESSEE_STORAGE_KEY = 'assessee_list_v1';

  // Load from localStorage once on mount (if present), otherwise keep initial seed
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(ASSESSEE_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length >= 0) {
          setAssessees(saved);
        }
      }
    } catch (e) {
      // ignore JSON/Storage errors silently
      console.warn('Failed to read assessees from localStorage', e);
    }
  }, []);

  // Save to localStorage whenever list changes
  React.useEffect(() => {
    try {
      localStorage.setItem(ASSESSEE_STORAGE_KEY, JSON.stringify(assessees));
    } catch (e) {
      console.warn('Failed to save assessees to localStorage', e);
    }
  }, [assessees]);
  const [formData, setFormData] = useState<Omit<Assessee, 'id' | 'createdDate'>>({
    name: '',
    fatherName: '',
    dateOfBirth: '',
    pan: '',
    aadhar: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: ''
    },
    profession: '',
    category: 'individual',
    assessmentYear: '2024-25',
    status: 'active'
  });
  
  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const employee_id = localStorage.getItem('employee_id');
      const company_id = localStorage.getItem('company_id') || '';

      if (!employee_id) {
        alert('Employee ID not found in local storage');
        return;
      }

      const payload = {
        ...formData,
        employee_id,
        company_id,
      };

      const url = editingAssessee
        ? `http://localhost:5000/api/assessee/${editingAssessee.id}` // For update (assuming you have PUT)
        : 'http://localhost:5000/api/assessee'; // For create

      const method = editingAssessee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Failed to save assessee: ' + (errorData.error || response.statusText));
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert(`Assessee ${editingAssessee ? 'updated' : 'added'} successfully.`);

        if (editingAssessee) {
          // Update assessee in list
          setAssessees(prev =>
            prev.map(a => (a.id === editingAssessee.id ? data.assessee : a))
          );
        } else {
          // Add new assessee to list
          setAssessees(prev => [...prev, data.assessee]);
        }

        resetForm();
      } else {
        alert('Failed to save assessee');
      }
    } catch (error: any) {
      alert('Error submitting form: ' + (error.message || 'Unknown error'));
    }
  };

  // Reset form data and close form
  const resetForm = () => {
    setFormData({
      name: '',
      fatherName: '',
      dateOfBirth: '',
      pan: '',
      aadhar: '',
      email: '',
      phone: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '' },
      profession: '',
      category: 'individual',
      assessmentYear: '2024-25',
      status: 'active',
    });
    setEditingAssessee(null);
    setShowForm(false);
  };


 // Initialize form for edit
  const handleEdit = (assessee: Assessee) => {
    setFormData({
      name: assessee.name,
      fatherName: assessee.fatherName,
      dateOfBirth: assessee.dateOfBirth,
      pan: assessee.pan,
      aadhar: assessee.aadhar || '',
      email: assessee.email,
      phone: assessee.phone,
      address: assessee.address,
      profession: assessee.profession,
      category: assessee.category,
      assessmentYear: assessee.assessmentYear,
      status: assessee.status,
    });
    setEditingAssessee(assessee);
    setShowForm(true);
  };

const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assessee?')) return;

    try {
      const response = await fetch(`http://localhost:5000/api/assessee/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        alert('Failed to delete assessee');
        return;
      }
      setAssessees(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert('Error deleting assessee');
    }
  };

  const filteredAssessees = assessees.filter(assessee => {
    const matchesSearch = assessee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessee.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || assessee.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const inputClass = `w-full p-2 rounded border ${
    theme === 'dark' 
      ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
      : 'bg-white border-gray-300 focus:border-blue-500'
  } outline-none transition-colors`;

  const sectionClass = `p-6 mb-6 rounded-lg ${
    theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
  }`;

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/income-tax')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          title="Back to Income Tax"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Assessee Management</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Assessee
          </button>
          <button
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Import"
          >
            <Upload size={18} />
          </button>
          <button
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Export"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, PAN, or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className={inputClass}
              title="Filter by Category"
            >
              <option value="all">All Categories</option>
              <option value="individual">Individual</option>
              <option value="huf">HUF</option>
              <option value="firm">Firm</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            Total: {filteredAssessees.length} assessee(s)
          </div>
        </div>
      </div>

      {/* Assessees List */}
      <div className={sectionClass}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">PAN</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Profession</th>
                <th className="px-4 py-3 text-left">Contact</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessees.map((assessee) => (
                <tr 
                  key={assessee.id}
                  className={`${theme === 'dark' ? 'border-b border-gray-600 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{assessee.name}</div>
                      <div className="text-sm text-gray-500">S/o {assessee.fatherName}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono">{assessee.pan}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      assessee.category === 'individual' ? 'bg-blue-100 text-blue-800' :
                      assessee.category === 'huf' ? 'bg-green-100 text-green-800' :
                      assessee.category === 'firm' ? 'bg-purple-100 text-purple-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {assessee.category.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">{assessee.profession}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div>{assessee.email}</div>
                      <div className="text-gray-500">{assessee.phone}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      assessee.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {assessee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(assessee)}
                        className={`p-1 rounded ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(assessee.id)}
                        className={`p-1 rounded text-red-600 ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredAssessees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No assessees found matching your criteria
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingAssessee ? 'Edit Assessee' : 'Add New Assessee'}
                </h3>
                <button
                  onClick={resetForm}
                  className={`p-2 rounded-full ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <form onSubmit={handleSubmit}>
                {/* Personal Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4 flex items-center">
                    <User size={16} className="mr-2" />
                    Personal Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={inputClass}
                        required
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Father's Name *</label>
                      <input
                        type="text"
                        value={formData.fatherName}
                        onChange={(e) => handleInputChange('fatherName', e.target.value)}
                        className={inputClass}
                        required
                        placeholder="Enter father's name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className={inputClass}
                        required
                        title="Date of Birth"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => handleInputChange('category', e.target.value)}
                        className={inputClass}
                        required
                        title="Select Category"
                      >
                        <option value="individual">Individual</option>
                        <option value="huf">HUF</option>
                        <option value="firm">Firm</option>
                        <option value="company">Company</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Identity Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Identity Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">PAN *</label>
                      <input
                        type="text"
                        value={formData.pan}
                        onChange={(e) => handleInputChange('pan', e.target.value.toUpperCase())}
                        className={inputClass}
                        required
                        placeholder="ABCDE1234F"
                        maxLength={10}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Aadhar Number</label>
                      <input
                        type="text"
                        value={formData.aadhar}
                        onChange={(e) => handleInputChange('aadhar', e.target.value)}
                        className={inputClass}
                        placeholder="123456789012"
                        maxLength={12}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={inputClass}
                        required
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={inputClass}
                        required
                        placeholder="9876543210"
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Address Information</h4>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line 1 *</label>
                      <input
                        type="text"
                        value={formData.address.line1}
                        onChange={(e) => handleInputChange('address.line1', e.target.value)}
                        className={inputClass}
                        required
                        placeholder="Enter address line 1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Address Line 2</label>
                      <input
                        type="text"
                        value={formData.address.line2}
                        onChange={(e) => handleInputChange('address.line2', e.target.value)}
                        className={inputClass}
                        placeholder="Enter address line 2"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">City *</label>
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => handleInputChange('address.city', e.target.value)}
                          className={inputClass}
                          required
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">State *</label>
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => handleInputChange('address.state', e.target.value)}
                          className={inputClass}
                          required
                          placeholder="Enter state"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Pincode *</label>
                        <input
                          type="text"
                          value={formData.address.pincode}
                          onChange={(e) => handleInputChange('address.pincode', e.target.value)}
                          className={inputClass}
                          required
                          placeholder="400001"
                          maxLength={6}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Professional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Profession</label>
                      <input
                        type="text"
                        value={formData.profession}
                        onChange={(e) => handleInputChange('profession', e.target.value)}
                        className={inputClass}
                        placeholder="Enter profession"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Assessment Year</label>
                      <select
                        value={formData.assessmentYear}
                        onChange={(e) => handleInputChange('assessmentYear', e.target.value)}
                        className={inputClass}
                        title="Select Assessment Year"
                      >
                        <option value="2024-25">2024-25</option>
                        <option value="2023-24">2023-24</option>
                        <option value="2022-23">2022-23</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        className={inputClass}
                        title="Select Status"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className={`px-4 py-2 rounded ${
                      theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600' 
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                  >
                    {editingAssessee ? 'Update' : 'Add'} Assessee
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Note:</span> Maintain accurate assessee records for proper tax filing. 
          PAN is mandatory for all tax-related transactions. Keep contact information updated for timely communications.
        </p>
      </div>
    </div>
  );
};

export default AssesseeManagement;
