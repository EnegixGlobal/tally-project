import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Search, Download, Calculator } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface OtherSourceRecord {
  id: string;
  sourceName: string;
  incomeType: 'bank_interest' | 'fd_interest' | 'dividends' | 'lottery_winnings' | 'family_pension' | 'other';
  grossAmount: number;
  deductionsClaimed: number; // u/s 57
  netAmount: number;
  financialYear: string;
}

const OtherSourcesIncomeManagement: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [records, setRecords] = useState<OtherSourceRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OtherSourceRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    sourceName: '',
    incomeType: 'bank_interest' as 'bank_interest' | 'fd_interest' | 'dividends' | 'lottery_winnings' | 'family_pension' | 'other',
    grossAmount: 0,
    deductionsClaimed: 0,
    financialYear: '2025-26'
  });

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('other_sources_records');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to localStorage
  const saveRecords = (newRecords: OtherSourceRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('other_sources_records', JSON.stringify(newRecords));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'sourceName' || name === 'incomeType' || name === 'financialYear' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Family pension deduction limit: 1/3rd of family pension received or Rs 15,000, whichever is less
    let deductionsClaimed = formData.deductionsClaimed;
    if (formData.incomeType === 'family_pension') {
      const standardPensionLimit = Math.min(formData.grossAmount / 3, 15000);
      deductionsClaimed = Math.max(deductionsClaimed, standardPensionLimit);
    }

    const netAmount = Math.max(0, formData.grossAmount - deductionsClaimed);

    const recordData: OtherSourceRecord = {
      id: editingRecord?.id || Date.now().toString(),
      sourceName: formData.sourceName,
      incomeType: formData.incomeType,
      grossAmount: formData.grossAmount,
      deductionsClaimed,
      netAmount,
      financialYear: formData.financialYear
    };

    if (editingRecord) {
      const updated = records.map(r => r.id === recordData.id ? recordData : r);
      saveRecords(updated);
    } else {
      saveRecords([recordData, ...records]);
    }

    resetForm();
  };

  const handleEdit = (record: OtherSourceRecord) => {
    setEditingRecord(record);
    setFormData({
      sourceName: record.sourceName,
      incomeType: record.incomeType,
      grossAmount: record.grossAmount,
      deductionsClaimed: record.deductionsClaimed,
      financialYear: record.financialYear
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      const filtered = records.filter(r => r.id !== id);
      saveRecords(filtered);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      sourceName: '',
      incomeType: 'bank_interest',
      grossAmount: 0,
      deductionsClaimed: 0,
      financialYear: '2025-26'
    });
  };

  const filteredRecords = records.filter(r => 
    r.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.financialYear.includes(searchTerm) ||
    r.incomeType.replace('_', ' ').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalGross = filteredRecords.reduce((sum, r) => sum + r.grossAmount, 0);
  const totalDeductions = filteredRecords.reduce((sum, r) => sum + r.deductionsClaimed, 0);
  const totalNet = filteredRecords.reduce((sum, r) => sum + r.netAmount, 0);

  const inputClass = `w-full p-2.5 rounded border ${
    theme === 'dark' 
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
  } outline-none transition-colors`;

  const sectionClass = `p-6 mb-6 rounded-lg ${
    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow border border-gray-200'
  }`;

  const formatIncomeType = (type: string) => {
    return type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/income-tax')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-200 text-gray-800'
          }`}
          title="Back to Income Tax"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Income from Other Sources</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Other Income
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className={sectionClass}>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Calculator size={18} /> Financial Summary
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{totalGross.toLocaleString('en-IN')}</div>
            <div className="text-sm opacity-80 mt-1">Total Gross Other Income</div>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">₹{totalDeductions.toLocaleString('en-IN')}</div>
            <div className="text-sm opacity-80 mt-1">Total Deductions (Sec 57)</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{totalNet.toLocaleString('en-IN')}</div>
            <div className="text-sm opacity-80 mt-1">Net Taxable Other Income</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={sectionClass}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by source, category, or financial year..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputClass} pl-10`}
          />
        </div>
      </div>

      {/* Records Table */}
      <div className={sectionClass}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'border-b border-gray-700 text-gray-400' : 'border-b border-gray-200 text-gray-600'} text-sm font-medium`}>
                <th className="px-4 py-3 text-left">Source / Institution</th>
                <th className="px-4 py-3 text-center">Income Category</th>
                <th className="px-4 py-3 text-center">Financial Year</th>
                <th className="px-4 py-3 text-right">Gross Amount</th>
                <th className="px-4 py-3 text-right">Deductions (Sec 57)</th>
                <th className="px-4 py-3 text-right">Net Taxable Amount</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr 
                  key={record.id}
                  className={`${theme === 'dark' ? 'border-b border-gray-700 hover:bg-gray-700/50' : 'border-b border-gray-100 hover:bg-gray-50'} text-sm`}
                >
                  <td className="px-4 py-3 font-medium">{record.sourceName}</td>
                  <td className="px-4 py-3 text-center text-xs">
                    <span className={`px-2.5 py-1 rounded-full font-semibold ${
                      record.incomeType === 'bank_interest' ? 'bg-blue-100 text-blue-800' :
                      record.incomeType === 'fd_interest' ? 'bg-teal-100 text-teal-800' :
                      record.incomeType === 'dividends' ? 'bg-green-100 text-green-800' :
                      record.incomeType === 'lottery_winnings' ? 'bg-red-100 text-red-800' :
                      record.incomeType === 'family_pension' ? 'bg-indigo-100 text-indigo-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {formatIncomeType(record.incomeType)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{record.financialYear}</td>
                  <td className="px-4 py-3 text-right">₹{record.grossAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-red-500">₹{record.deductionsClaimed.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">₹{record.netAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(record)}
                        className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(record.id)}
                        className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} text-red-500`}
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
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No records found.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Add Other Income Source
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-lg rounded-xl overflow-hidden shadow-2xl ${
            theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white'
          }`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingRecord ? 'Edit Income Source' : 'Add Other Income Source'}
              </h3>
              <button 
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold focus:outline-none"
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Source / Institution Name</label>
                <input 
                  type="text" 
                  name="sourceName"
                  value={formData.sourceName} 
                  onChange={handleInputChange}
                  required 
                  placeholder="e.g. SBI Savings Bank Interest, HDFC Dividends"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Income Category</label>
                  <select 
                    name="incomeType"
                    value={formData.incomeType} 
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="bank_interest">Savings Bank Interest</option>
                    <option value="fd_interest">FD Interest</option>
                    <option value="dividends">Dividend Income</option>
                    <option value="family_pension">Family Pension</option>
                    <option value="lottery_winnings">Lottery/Prizes Winnings</option>
                    <option value="other">Other Miscellaneous</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Financial Year</label>
                  <select 
                    name="financialYear"
                    value={formData.financialYear} 
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="2025-26">2025-26</option>
                    <option value="2024-25">2024-25</option>
                    <option value="2023-24">2023-24</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gross Amount Received (₹)</label>
                  <input 
                    type="number" 
                    name="grossAmount"
                    value={formData.grossAmount || ''} 
                    onChange={handleInputChange}
                    required 
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Deductions (u/s 57) (₹)</label>
                  <input 
                    type="number" 
                    name="deductionsClaimed"
                    value={formData.deductionsClaimed || ''} 
                    onChange={handleInputChange}
                    placeholder="e.g. expenses directly incurred"
                    className={inputClass}
                    disabled={formData.incomeType === 'family_pension'}
                  />
                </div>
              </div>

              {formData.incomeType === 'family_pension' && (
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-semibold">Note for Family Pension:</span> A standard deduction of 1/3rd of the pension or ₹15,000 (whichever is less) will be automatically applied.
                </div>
              )}

              {formData.incomeType === 'lottery_winnings' && (
                <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                  <span className="font-semibold">Warning:</span> Lottery, crossword puzzle, or game winnings are taxed at a flat rate of 30% u/s 115BB. No deductions u/s 57 are allowed.
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  type="button" 
                  onClick={resetForm}
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium"
                >
                  {editingRecord ? 'Update' : 'Add'} Income
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OtherSourcesIncomeManagement;
