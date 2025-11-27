import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Search, Download, Upload } from 'lucide-react';
import type { CapitalGain, CapitalAsset } from '../../types';
import { useAppContext } from '../../context/AppContext';

const API_BASE = `${import.meta.env.VITE_API_URL}/api/capital-gains`;

const CapitalGainsManagement: React.FC = () => {
  const { theme} = useAppContext();
  // Replace context for capitalGains with local state
  const [capitalGains, setCapitalGains] = useState<CapitalGain[]>([]);
  const navigate = useNavigate();
  // Other states as in your original code
  const [showForm, setShowForm] = useState(false);
  const [editingGain, setEditingGain] = useState<CapitalGain | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [formData, setFormData] = useState<Partial<CapitalGain>>({
    assetType: 'equity',
    gainType: 'short',
    purchaseDate: '',
    saleDate: '',
    purchaseValue: 0,
    saleValue: 0,
    indexationBenefit: 0,
    exemptionClaimed: 0,
    description: ''
  });

  const assetTypes: CapitalAsset[] = [
    'equity', 'mutual_fund', 'real_estate', 'gold', 'bonds', 'other'
  ];
  const employeeId = localStorage.getItem('employee_id') || '';
  // const theme: 'dark' | 'light' = 'light';

    // Fetch capital gains from backend API on mount
  useEffect(() => {
    const fetchGains = async () => {
      try {
        const res = await fetch(API_BASE);
        if (!res.ok) throw new Error('Failed to load capital gains');
        const data = await res.json();
        setCapitalGains(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchGains();
  }, [employeeId]);

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId) {
      alert('Employee ID not found. Please login again.');
      return;
    }

    const gainData: CapitalGain = {
      id: editingGain?.id || Date.now().toString(),
      employeeId, // include employeeId here
      assetType: formData.assetType!,
      gainType: formData.gainType!,
      purchaseDate: formData.purchaseDate!,
      saleDate: formData.saleDate!,
      purchaseValue: formData.purchaseValue!,
      saleValue: formData.saleValue!,
      indexationBenefit: formData.indexationBenefit || 0,
      exemptionClaimed: formData.exemptionClaimed || 0,
      description: formData.description || '',
      gainAmount: (formData.saleValue || 0) - (formData.purchaseValue || 0) - (formData.indexationBenefit || 0),
      taxableGain: Math.max(0, (formData.saleValue || 0) - (formData.purchaseValue || 0) - (formData.indexationBenefit || 0) - (formData.exemptionClaimed || 0)),
      createdAt: editingGain?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      if (editingGain) {
        // PUT update
        const res = await fetch(`${API_BASE}/${gainData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gainData)
        });
        if (!res.ok) throw new Error('Update failed');
        const updatedGain = await res.json();
        setCapitalGains((prev) =>
          prev.map((gain) => (gain.id === updatedGain.id ? updatedGain : gain))
        );
      } else {
        // POST create
        const res = await fetch(API_BASE, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(gainData)
        });
        if (!res.ok) throw new Error('Add failed');
        const newGain = await res.json();
        setCapitalGains((prev) => [newGain, ...prev]);
      }
      setShowForm(false);
      setEditingGain(null);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Failed to save capital gain.');
    }
  };

 // reset form and form state
 const resetForm = () => {
    setShowForm(false);
    setEditingGain(null);
    setFormData({
      assetType: 'equity',
      gainType: 'short',
      purchaseDate: '',
      saleDate: '',
      purchaseValue: 0,
      saleValue: 0,
      indexationBenefit: 0,
      exemptionClaimed: 0,
      description: ''
    });
  };
  //  const theme = '' 'light'; // Replace with your theme from context

  const handleEdit = (gain: CapitalGain) => {
    setEditingGain(gain);
    setFormData(gain);
    setShowForm(true);
  };

    // Delete capital gain using API
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this capital gain?')) return;
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setCapitalGains((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete capital gain.');
    }
  };

  const calculateTax = (gain: CapitalGain) => {
    if (gain.gainType === 'short') {
      // Short term capital gains tax based on income tax slab
      return gain.taxableGain * 0.30; // Assuming 30% for demonstration
    } else {
      // Long term capital gains tax
      if (gain.assetType === 'equity' || gain.assetType === 'mutual_fund') {
        return gain.taxableGain > 100000 ? (gain.taxableGain - 100000) * 0.10 : 0;
      } else {
        return gain.taxableGain * 0.20; // 20% for other assets
      }
    }
  };

  const filteredGains = capitalGains.filter(gain => {
    const matchesSearch = gain.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         gain.assetType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || gain.gainType === filterType;
    return matchesSearch && matchesType;
  });

  const totalGains = filteredGains.reduce((sum: number, gain: CapitalGain) => sum + gain.gainAmount, 0);
  const totalTaxableGains = filteredGains.reduce((sum: number, gain: CapitalGain) => sum + gain.taxableGain, 0);
  const totalTax = filteredGains.reduce((sum: number, gain: CapitalGain) => sum + calculateTax(gain), 0);

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
        <h1 className="text-2xl font-bold">Capital Gains Management</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Capital Gain
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

      {/* Summary Section */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">₹{totalGains.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Total Gains</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">₹{totalTaxableGains.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Taxable Gains</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">₹{totalTax.toLocaleString()}</div>
            <div className="text-sm text-gray-500">Tax Liability</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{filteredGains.length}</div>
            <div className="text-sm text-gray-500">Total Entries</div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by description or asset type"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={inputClass}
              title="Filter by Gain Type"
            >
              <option value="all">All Types</option>
              <option value="short">Short Term</option>
              <option value="long">Long Term</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 flex items-center">
            Total: {filteredGains.length} capital gain(s)
          </div>
        </div>
      </div>

      {/* Capital Gains List */}
      <div className={sectionClass}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                <th className="px-4 py-3 text-left">Asset Type</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Purchase Date</th>
                <th className="px-4 py-3 text-left">Sale Date</th>
                <th className="px-4 py-3 text-right">Purchase Value</th>
                <th className="px-4 py-3 text-right">Sale Value</th>
                <th className="px-4 py-3 text-right">Gain Amount</th>
                <th className="px-4 py-3 text-right">Tax</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGains.map((gain) => (
                <tr 
                  key={gain.id}
                  className={`${theme === 'dark' ? 'border-b border-gray-600 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      gain.assetType === 'equity' ? 'bg-blue-100 text-blue-800' :
                      gain.assetType === 'real_estate' ? 'bg-green-100 text-green-800' :
                      gain.assetType === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      gain.assetType === 'mutual_fund' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {gain.assetType.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">{gain.description}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      gain.gainType === 'short' 
                        ? 'bg-orange-100 text-orange-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {gain.gainType === 'short' ? 'Short Term' : 'Long Term'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{new Date(gain.purchaseDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-sm">{new Date(gain.saleDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">₹{gain.purchaseValue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">₹{gain.saleValue.toLocaleString()}</td>
                  <td className={`px-4 py-3 text-right font-medium ${gain.gainAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₹{gain.gainAmount.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-red-600">₹{calculateTax(gain).toLocaleString()}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(gain)}
                        className={`p-1 rounded ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(gain.id)}
                        className={`p-1 rounded ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        } text-red-600`}
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
          
          {filteredGains.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No capital gains found matching your criteria.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Add First Capital Gain
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-4xl max-h-[90vh] rounded-lg overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingGain ? 'Edit Capital Gain' : 'Add New Capital Gain'}
                </h3>
                <button 
                  onClick={() => {
                    setShowForm(false);
                    setEditingGain(null);
                    resetForm();
                  }}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Asset Type</label>
                  <select 
                    value={formData.assetType} 
                    onChange={(e) => setFormData({...formData, assetType: e.target.value as CapitalAsset})}
                    required
                    title="Select asset type"
                    className={inputClass}
                  >
                    {assetTypes.map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gain Type</label>
                  <select 
                    value={formData.gainType} 
                    onChange={(e) => setFormData({...formData, gainType: e.target.value as 'short' | 'long'})}
                    required
                    title="Select gain type"
                    className={inputClass}
                  >
                    <option value="short">Short Term (≤ 12 months)</option>
                    <option value="long">Long Term (&gt; 12 months)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Date</label>
                  <input 
                    type="date" 
                    value={formData.purchaseDate} 
                    onChange={(e) => setFormData({...formData, purchaseDate: e.target.value})}
                    required 
                    title="Enter purchase date"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sale Date</label>
                  <input 
                    type="date" 
                    value={formData.saleDate} 
                    onChange={(e) => setFormData({...formData, saleDate: e.target.value})}
                    required 
                    title="Enter sale date"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Value (₹)</label>
                  <input 
                    type="number" 
                    value={formData.purchaseValue} 
                    onChange={(e) => setFormData({...formData, purchaseValue: parseFloat(e.target.value) || 0})}
                    required 
                    placeholder="Enter purchase value"
                    title="Enter purchase value in rupees"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Sale Value (₹)</label>
                  <input 
                    type="number" 
                    value={formData.saleValue} 
                    onChange={(e) => setFormData({...formData, saleValue: parseFloat(e.target.value) || 0})}
                    required 
                    placeholder="Enter sale value"
                    title="Enter sale value in rupees"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Indexation Benefit (₹)</label>
                  <input 
                    type="number" 
                    value={formData.indexationBenefit} 
                    onChange={(e) => setFormData({...formData, indexationBenefit: parseFloat(e.target.value) || 0})}
                    placeholder="Enter indexation benefit"
                    title="Enter indexation benefit amount"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Exemption Claimed (₹)</label>
                  <input 
                    type="number" 
                    value={formData.exemptionClaimed} 
                    onChange={(e) => setFormData({...formData, exemptionClaimed: parseFloat(e.target.value) || 0})}
                    placeholder="Enter exemption amount"
                    title="Enter exemption claimed amount"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  placeholder="Enter description of the asset"
                  title="Enter description of the asset"
                  className={inputClass}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={() => resetForm()}
                  className={`px-4 py-2 rounded ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                >
                  {editingGain ? 'Update' : 'Add'} Capital Gain
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CapitalGainsManagement;