import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Search, Download, Calculator } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface SalaryRecord {
  id: string;
  employerName: string;
  grossSalary: number;
  exemptAllowances: number;
  standardDeduction: number;
  professionalTax: number;
  netSalary: number;
  financialYear: string;
}

const SalaryIncomeManagement: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [records, setRecords] = useState<SalaryRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SalaryRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    employerName: '',
    grossSalary: 0,
    exemptAllowances: 0,
    professionalTax: 0,
    financialYear: '2025-26'
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('salary_income_records');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to localStorage whenever records change
  const saveRecords = (newRecords: SalaryRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('salary_income_records', JSON.stringify(newRecords));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'employerName' || name === 'financialYear' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const standardDeduction = 50000; // Standard deduction under Sec 16(ia)
    const netSalary = Math.max(0, formData.grossSalary - formData.exemptAllowances - standardDeduction - formData.professionalTax);

    const recordData: SalaryRecord = {
      id: editingRecord?.id || Date.now().toString(),
      employerName: formData.employerName,
      grossSalary: formData.grossSalary,
      exemptAllowances: formData.exemptAllowances,
      standardDeduction,
      professionalTax: formData.professionalTax,
      netSalary,
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

  const handleEdit = (record: SalaryRecord) => {
    setEditingRecord(record);
    setFormData({
      employerName: record.employerName,
      grossSalary: record.grossSalary,
      exemptAllowances: record.exemptAllowances,
      professionalTax: record.professionalTax,
      financialYear: record.financialYear
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this salary record?')) {
      const filtered = records.filter(r => r.id !== id);
      saveRecords(filtered);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      employerName: '',
      grossSalary: 0,
      exemptAllowances: 0,
      professionalTax: 0,
      financialYear: '2025-26'
    });
  };

  const filteredRecords = records.filter(r => 
    r.employerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.financialYear.includes(searchTerm)
  );

  const totalGross = filteredRecords.reduce((sum, r) => sum + r.grossSalary, 0);
  const totalDeductions = filteredRecords.reduce((sum, r) => sum + r.exemptAllowances + r.standardDeduction + r.professionalTax, 0);
  const totalNet = filteredRecords.reduce((sum, r) => sum + r.netSalary, 0);

  const inputClass = `w-full p-2.5 rounded border ${
    theme === 'dark' 
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
  } outline-none transition-colors`;

  const sectionClass = `p-6 mb-6 rounded-lg ${
    theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow border border-gray-200'
  }`;

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
        <h1 className="text-2xl font-bold">Salary Income Management</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Salary Record
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
            <div className="text-sm opacity-80 mt-1">Total Gross Salary</div>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">₹{totalDeductions.toLocaleString('en-IN')}</div>
            <div className="text-sm opacity-80 mt-1">Total Exemptions & Deductions</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">₹{totalNet.toLocaleString('en-IN')}</div>
            <div className="text-sm opacity-80 mt-1">Net Taxable Salary</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={sectionClass}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by employer name or financial year..."
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
                <th className="px-4 py-3 text-left">Employer Name</th>
                <th className="px-4 py-3 text-center">Financial Year</th>
                <th className="px-4 py-3 text-right">Gross Salary</th>
                <th className="px-4 py-3 text-right">Exempt Allowances</th>
                <th className="px-4 py-3 text-right">Standard Deduction</th>
                <th className="px-4 py-3 text-right">Professional Tax</th>
                <th className="px-4 py-3 text-right">Net Taxable Salary</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr 
                  key={record.id}
                  className={`${theme === 'dark' ? 'border-b border-gray-700 hover:bg-gray-700/50' : 'border-b border-gray-100 hover:bg-gray-50'} text-sm`}
                >
                  <td className="px-4 py-3 font-medium">{record.employerName}</td>
                  <td className="px-4 py-3 text-center">{record.financialYear}</td>
                  <td className="px-4 py-3 text-right">₹{record.grossSalary.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">₹{record.exemptAllowances.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-gray-500">₹{record.standardDeduction.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">₹{record.professionalTax.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">₹{record.netSalary.toLocaleString('en-IN')}</td>
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
              <p className="text-gray-500">No salary records found.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Add First Salary Record
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
                {editingRecord ? 'Edit Salary Record' : 'Add Salary Record'}
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
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Employer Name</label>
                <input 
                  type="text" 
                  name="employerName"
                  value={formData.employerName} 
                  onChange={handleInputChange}
                  required 
                  placeholder="e.g. Acme Corp Ltd"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Gross Salary (₹)</label>
                  <input 
                    type="number" 
                    name="grossSalary"
                    value={formData.grossSalary || ''} 
                    onChange={handleInputChange}
                    required 
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Exempt Allowances (₹)</label>
                  <input 
                    type="number" 
                    name="exemptAllowances"
                    value={formData.exemptAllowances || ''} 
                    onChange={handleInputChange}
                    placeholder="HRA, LTA etc."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Professional Tax (₹)</label>
                  <input 
                    type="number" 
                    name="professionalTax"
                    value={formData.professionalTax || ''} 
                    onChange={handleInputChange}
                    placeholder="0"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
                <div className="flex justify-between font-medium">
                  <span>Standard Deduction:</span>
                  <span>₹50,000 (Auto-Applied)</span>
                </div>
              </div>

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
                  {editingRecord ? 'Update' : 'Add'} Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalaryIncomeManagement;
