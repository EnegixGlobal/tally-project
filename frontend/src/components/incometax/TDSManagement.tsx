import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Plus, Edit, Trash2 } from 'lucide-react';
import type { TDSEntry, TDSSection } from '../../types';

const TDSManagement: React.FC = () => {
  const { tdsEntries, addTDSEntry, updateTDSEntry, deleteTDSEntry, theme } = useAppContext();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TDSEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'deducted' | 'collected'>('deducted');
  const [formData, setFormData] = useState<Partial<TDSEntry>>({
    type: 'deducted',
    section: '194A',
    deductorName: '',
    deductorPAN: '',
    amount: 0,
    tdsAmount: 0,
    rate: 0,
    assessmentYear: '',
    quarter: 'Q1',
    dateOfDeduction: '',
    challanNumber: '',
    description: ''
  });

  const tdsSections: TDSSection[] = [
    '194A', '194B', '194C', '194D', '194G', '194H', '194I', '194J', '194K', '194LA', '194M', '194N', '194O', '194P', '194Q', '194R', '194S'
  ];

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tdsData: TDSEntry = {
      id: editingEntry?.id || Date.now().toString(),
      type: formData.type!,
      section: formData.section!,
      deductorName: formData.deductorName!,
      deductorPAN: formData.deductorPAN!,
      amount: formData.amount!,
      tdsAmount: formData.tdsAmount!,
      rate: formData.rate!,
      assessmentYear: formData.assessmentYear!,
      quarter: formData.quarter!,
      dateOfDeduction: formData.dateOfDeduction!,
      challanNumber: formData.challanNumber || '',
      description: formData.description || '',
      createdAt: editingEntry?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (editingEntry) {
      updateTDSEntry(tdsData);
    } else {
      addTDSEntry(tdsData);
    }

    setShowForm(false);
    setEditingEntry(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      type: 'deducted',
      section: '194A',
      deductorName: '',
      deductorPAN: '',
      amount: 0,
      tdsAmount: 0,
      rate: 0,
      assessmentYear: '',
      quarter: 'Q1',
      dateOfDeduction: '',
      challanNumber: '',
      description: ''
    });
  };

  const handleEdit = (entry: TDSEntry) => {
    setEditingEntry(entry);
    setFormData(entry);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this TDS entry?')) {
      deleteTDSEntry(id);
    }
  };

  const calculateTDSRate = (section: TDSSection): number => {
    const rates: Record<TDSSection, number> = {
      '194A': 10, '194B': 30, '194C': 1, '194D': 5, '194G': 5,
      '194H': 5, '194I': 10, '194J': 10, '194K': 5, '194LA': 10,
      '194M': 5, '194N': 2, '194O': 1, '194P': 5, '194Q': 0.1,
      '194R': 5, '194S': 5
    };
    return rates[section] || 10;
  };

  const filteredEntries = tdsEntries.filter(entry => entry.type === activeTab);
  const totalAmount = filteredEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalTDS = filteredEntries.reduce((sum, entry) => sum + entry.tdsAmount, 0);

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
        <h1 className="text-2xl font-bold">TDS Management</h1>
        <div className="ml-auto">
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add TDS Entry
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
          <p className="text-2xl font-bold">₹{totalAmount.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="text-sm font-medium text-gray-500">Total TDS</h3>
          <p className="text-2xl font-bold">₹{totalTDS.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="text-sm font-medium text-gray-500">Average Rate</h3>
          <p className="text-2xl font-bold">{totalAmount ? ((totalTDS / totalAmount) * 100).toFixed(2) : 0}%</p>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="text-sm font-medium text-gray-500">Total Entries</h3>
          <p className="text-2xl font-bold">{filteredEntries.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('deducted')}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === 'deducted'
              ? 'bg-blue-600 text-white'
              : theme === 'dark'
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          TDS Deducted
        </button>
        <button
          onClick={() => setActiveTab('collected')}
          className={`px-4 py-2 rounded-md font-medium ${
            activeTab === 'collected'
              ? 'bg-blue-600 text-white'
              : theme === 'dark'
              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          TCS Collected
        </button>
      </div>

      {/* TDS Entries List */}
      <div className={`rounded-lg overflow-hidden ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deductor/Collector</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAN</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TDS/TCS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quarter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-600' : 'divide-gray-200'}`}>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    No TDS entries found
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{entry.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.deductorName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.deductorPAN}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">₹{entry.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">₹{entry.tdsAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.rate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(entry.dateOfDeduction).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{entry.quarter}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
                  {editingEntry ? 'Edit TDS Entry' : 'Add TDS Entry'}
                </h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingEntry(null);
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Type *</label>
                    <select 
                      value={formData.type} 
                      onChange={(e) => setFormData({...formData, type: e.target.value as 'deducted' | 'collected'})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required
                      title="Select TDS type"
                    >
                      <option value="deducted">TDS Deducted</option>
                      <option value="collected">TCS Collected</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Section *</label>
                    <select 
                      value={formData.section} 
                      onChange={(e) => {
                        const section = e.target.value as TDSSection;
                        const rate = calculateTDSRate(section);
                        setFormData({
                          ...formData, 
                          section,
                          rate,
                          tdsAmount: formData.amount ? (formData.amount * rate) / 100 : 0
                        });
                      }}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required
                      title="Select TDS section"
                    >
                      {tdsSections.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Deductor/Collector Name *</label>
                    <input 
                      type="text" 
                      value={formData.deductorName} 
                      onChange={(e) => setFormData({...formData, deductorName: e.target.value})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required 
                      placeholder="Enter deductor name"
                      title="Enter name of deductor/collector"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Deductor/Collector PAN *</label>
                    <input 
                      type="text" 
                      value={formData.deductorPAN} 
                      onChange={(e) => setFormData({...formData, deductorPAN: e.target.value.toUpperCase()})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required 
                      placeholder="ABCDE1234F"
                      title="Enter PAN of deductor/collector"
                      maxLength={10}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                    <input 
                      type="number" 
                      value={formData.amount} 
                      onChange={(e) => {
                        const amount = parseFloat(e.target.value) || 0;
                        const tdsAmount = (amount * (formData.rate || 0)) / 100;
                        setFormData({...formData, amount, tdsAmount});
                      }}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required 
                      placeholder="Enter amount"
                      title="Enter transaction amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Rate (%) *</label>
                    <input 
                      type="number" 
                      value={formData.rate} 
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        const tdsAmount = (formData.amount || 0) * rate / 100;
                        setFormData({...formData, rate, tdsAmount});
                      }}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required 
                      placeholder="Enter TDS rate"
                      title="Enter TDS rate percentage"
                      step="0.01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">TDS/TCS Amount (₹) *</label>
                    <input 
                      type="number" 
                      value={formData.tdsAmount} 
                      onChange={(e) => setFormData({...formData, tdsAmount: parseFloat(e.target.value) || 0})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required 
                      placeholder="TDS amount (auto-calculated)"
                      title="TDS/TCS amount"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Date of Deduction *</label>
                    <input 
                      type="date" 
                      value={formData.dateOfDeduction} 
                      onChange={(e) => setFormData({...formData, dateOfDeduction: e.target.value})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required 
                      title="Enter date of TDS deduction"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Quarter *</label>
                    <select 
                      value={formData.quarter} 
                      onChange={(e) => setFormData({...formData, quarter: e.target.value as 'Q1' | 'Q2' | 'Q3' | 'Q4'})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required
                      title="Select quarter"
                    >
                      {quarters.map(quarter => (
                        <option key={quarter} value={quarter}>{quarter}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Assessment Year *</label>
                    <input 
                      type="text" 
                      value={formData.assessmentYear} 
                      onChange={(e) => setFormData({...formData, assessmentYear: e.target.value})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      required 
                      placeholder="2024-25"
                      title="Enter assessment year"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Challan Number</label>
                    <input 
                      type="text" 
                      value={formData.challanNumber} 
                      onChange={(e) => setFormData({...formData, challanNumber: e.target.value})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      placeholder="Enter challan number"
                      title="Enter challan number (optional)"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea 
                      value={formData.description} 
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className={`w-full p-2 rounded border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                          : 'bg-white border-gray-300 focus:border-blue-500'
                      } outline-none transition-colors`}
                      rows={3}
                      placeholder="Enter transaction description"
                      title="Enter description of the transaction"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button 
                    type="button" 
                    onClick={() => {
                      setShowForm(false);
                      setEditingEntry(null);
                      resetForm();
                    }}
                    className={`px-4 py-2 rounded-md ${
                      theme === 'dark' 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
                  >
                    {editingEntry ? 'Update' : 'Add'} TDS Entry
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

export default TDSManagement;