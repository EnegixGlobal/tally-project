import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Edit, Trash2, Search, Download, Calculator } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface HousePropertyRecord {
  id: string;
  propertyAddress: string;
  propertyType: 'self_occupied' | 'let_out';
  grossAnnualValue: number; // Rent received
  municipalTaxes: number;
  netAnnualValue: number;
  standardDeduction: number; // 30% of NAV
  homeLoanInterest: number;
  netIncome: number;
  financialYear: string;
}

const HousePropertyIncomeManagement: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [records, setRecords] = useState<HousePropertyRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HousePropertyRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    propertyAddress: '',
    propertyType: 'let_out' as 'self_occupied' | 'let_out',
    grossAnnualValue: 0,
    municipalTaxes: 0,
    homeLoanInterest: 0,
    financialYear: '2025-26'
  });

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('house_property_records');
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Save to localStorage
  const saveRecords = (newRecords: HousePropertyRecord[]) => {
    setRecords(newRecords);
    localStorage.setItem('house_property_records', JSON.stringify(newRecords));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'propertyAddress' || name === 'propertyType' || name === 'financialYear' ? value : parseFloat(value) || 0
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isSelfOccupied = formData.propertyType === 'self_occupied';
    
    // For self-occupied property, Gross Annual Value and Municipal Taxes are always 0
    const grossAnnualValue = isSelfOccupied ? 0 : formData.grossAnnualValue;
    const municipalTaxes = isSelfOccupied ? 0 : formData.municipalTaxes;
    
    const netAnnualValue = Math.max(0, grossAnnualValue - municipalTaxes);
    const standardDeduction = isSelfOccupied ? 0 : netAnnualValue * 0.30; // 30% of NAV standard deduction u/s 24(a)
    
    // Interest on borrowed capital deduction u/s 24(b)
    // Max cap for self-occupied is 2 Lakhs, no cap for let-out (usually, but let's keep it simple)
    const homeLoanInterest = isSelfOccupied 
      ? Math.min(200000, formData.homeLoanInterest) 
      : formData.homeLoanInterest;

    const netIncome = isSelfOccupied 
      ? -homeLoanInterest // Loss from house property
      : netAnnualValue - standardDeduction - homeLoanInterest;

    const recordData: HousePropertyRecord = {
      id: editingRecord?.id || Date.now().toString(),
      propertyAddress: formData.propertyAddress,
      propertyType: formData.propertyType,
      grossAnnualValue,
      municipalTaxes,
      netAnnualValue,
      standardDeduction,
      homeLoanInterest,
      netIncome,
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

  const handleEdit = (record: HousePropertyRecord) => {
    setEditingRecord(record);
    setFormData({
      propertyAddress: record.propertyAddress,
      propertyType: record.propertyType,
      grossAnnualValue: record.grossAnnualValue,
      municipalTaxes: record.municipalTaxes,
      homeLoanInterest: record.homeLoanInterest,
      financialYear: record.financialYear
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this property record?')) {
      const filtered = records.filter(r => r.id !== id);
      saveRecords(filtered);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setFormData({
      propertyAddress: '',
      propertyType: 'let_out',
      grossAnnualValue: 0,
      municipalTaxes: 0,
      homeLoanInterest: 0,
      financialYear: '2025-26'
    });
  };

  const filteredRecords = records.filter(r => 
    r.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.financialYear.includes(searchTerm)
  );

  const totalGAV = filteredRecords.reduce((sum, r) => sum + r.grossAnnualValue, 0);
  const totalInterest = filteredRecords.reduce((sum, r) => sum + r.homeLoanInterest, 0);
  const totalNet = filteredRecords.reduce((sum, r) => sum + r.netIncome, 0);

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
        <h1 className="text-2xl font-bold">House Property Income</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center transition-colors"
          >
            <Plus size={16} className="mr-2" />
            Add Property Record
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
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{totalGAV.toLocaleString('en-IN')}</div>
            <div className="text-sm opacity-80 mt-1">Total Rental Income (GAV)</div>
          </div>
          <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20 text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">₹{totalInterest.toLocaleString('en-IN')}</div>
            <div className="text-sm opacity-80 mt-1">Interest on Home Loan (Sec 24b)</div>
          </div>
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
            <div className={`text-2xl font-bold ${totalNet >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₹{totalNet.toLocaleString('en-IN')}
            </div>
            <div className="text-sm opacity-80 mt-1">Net Income / Loss from House Property</div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={sectionClass}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by address or financial year..."
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
                <th className="px-4 py-3 text-left">Property Address</th>
                <th className="px-4 py-3 text-center">Type</th>
                <th className="px-4 py-3 text-center">Financial Year</th>
                <th className="px-4 py-3 text-right">Rent Received (GAV)</th>
                <th className="px-4 py-3 text-right">Municipal Taxes</th>
                <th className="px-4 py-3 text-right">Standard Deduction (30%)</th>
                <th className="px-4 py-3 text-right">Loan Interest</th>
                <th className="px-4 py-3 text-right">Net Income</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record) => (
                <tr 
                  key={record.id}
                  className={`${theme === 'dark' ? 'border-b border-gray-700 hover:bg-gray-700/50' : 'border-b border-gray-100 hover:bg-gray-50'} text-sm`}
                >
                  <td className="px-4 py-3 font-medium">{record.propertyAddress}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      record.propertyType === 'self_occupied' 
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' 
                        : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    }`}>
                      {record.propertyType === 'self_occupied' ? 'Self Occupied' : 'Let Out'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{record.financialYear}</td>
                  <td className="px-4 py-3 text-right">₹{record.grossAnnualValue.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-red-500">₹{record.municipalTaxes.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right text-gray-500">₹{record.standardDeduction.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right">₹{record.homeLoanInterest.toLocaleString('en-IN')}</td>
                  <td className={`px-4 py-3 text-right font-bold ${
                    record.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'
                  }`}>
                    ₹{record.netIncome.toLocaleString('en-IN')}
                  </td>
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
              <p className="text-gray-500">No property records found.</p>
              <button 
                onClick={() => setShowForm(true)}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Add First Property
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
                {editingRecord ? 'Edit Property Record' : 'Add Property Record'}
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
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Property Address</label>
                <input 
                  type="text" 
                  name="propertyAddress"
                  value={formData.propertyAddress} 
                  onChange={handleInputChange}
                  required 
                  placeholder="e.g. Flat 402, Sunshine Heights, Mumbai"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Property Type</label>
                  <select 
                    name="propertyType"
                    value={formData.propertyType} 
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="let_out">Let Out</option>
                    <option value="self_occupied">Self Occupied</option>
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

              {formData.propertyType === 'let_out' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Annual Rent (GAV) (₹)</label>
                    <input 
                      type="number" 
                      name="grossAnnualValue"
                      value={formData.grossAnnualValue || ''} 
                      onChange={handleInputChange}
                      required 
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Municipal Taxes Paid (₹)</label>
                    <input 
                      type="number" 
                      name="municipalTaxes"
                      value={formData.municipalTaxes || ''} 
                      onChange={handleInputChange}
                      placeholder="0"
                      className={inputClass}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Interest on Home Loan (Sec 24b) (₹)
                </label>
                <input 
                  type="number" 
                  name="homeLoanInterest"
                  value={formData.homeLoanInterest || ''} 
                  onChange={handleInputChange}
                  placeholder={formData.propertyType === 'self_occupied' ? "Max deduction limit: ₹2,00,000" : "Enter interest amount"}
                  className={inputClass}
                />
              </div>

              {formData.propertyType === 'let_out' && (
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm">
                  <div className="flex justify-between font-medium">
                    <span>Standard Deduction (u/s 24a):</span>
                    <span>30% of Net Annual Value (Auto-Calculated)</span>
                  </div>
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
                  {editingRecord ? 'Update' : 'Add'} Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HousePropertyIncomeManagement;
