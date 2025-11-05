import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, PiggyBank, Plus, Edit, Trash2, Calculator, TrendingUp } from 'lucide-react';

interface Investment {
  id: string;
  assesseeId: string;
  section: '80C' | '80D' | '80E' | '80G' | '80TTA' | '80TTB' | 'ELSS' | 'NPS';
  investmentType: string;
  instituteName: string;
  policyNumber?: string;
  amount: number;
  dateOfInvestment: string;
  maturityDate?: string;
  interestRate?: number;
  taxBenefit: number;
  financialYear: string;
  status: 'active' | 'matured' | 'surrendered';
  documents: string[];
  createdDate: string;
}

const InvestmentManagement: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [investments, setInvestments] = useState<Investment[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>('all');

  const [formData, setFormData] = useState<Omit<Investment, 'id' | 'createdDate' | 'taxBenefit'>>({
    assesseeId: '',
    section: '80C',
    investmentType: '',
    instituteName: '',
    policyNumber: '',
    amount: 0,
    dateOfInvestment: '',
    maturityDate: '',
    interestRate: 0,
    financialYear: '2023-24',
    status: 'active',
    documents: []
  });

  // Investment type options based on section
  const getInvestmentTypes = (section: string) => {
    const types: { [key: string]: string[] } = {
      '80C': ['LIC Premium', 'PPF', 'EPF', 'ELSS', 'NSC', 'Tax Saver FD', 'ULIP', 'Home Loan Principal', 'Tuition Fees'],
      '80D': ['Health Insurance Premium', 'Preventive Health Check-up'],
      '80E': ['Education Loan Interest'],
      '80G': ['Charitable Donations'],
      '80TTA': ['Savings Account Interest'],
      '80TTB': ['Senior Citizen Interest'],
      'ELSS': ['Equity Linked Savings Scheme'],
      'NPS': ['National Pension System']
    };
    return types[section] || [];
  };

  // Calculate tax benefit based on section and amount
  const calculateTaxBenefit = (section: string, amount: number) => {
    switch (section) {
      case '80C':
        return Math.min(amount, 150000); // Max benefit ₹1.5L
      case '80D':
        return Math.min(amount, 25000); // Max benefit ₹25K (can be higher for senior citizens)
      case '80E':
        return amount; // No upper limit
      case '80G':
        return amount * 0.5; // Usually 50% deduction
      case '80TTA':
        return Math.min(amount, 10000); // Max benefit ₹10K
      case '80TTB':
        return Math.min(amount, 50000); // Max benefit ₹50K for senior citizens
      case 'ELSS':
        return Math.min(amount, 150000); // Part of 80C
      case 'NPS':
        return Math.min(amount, 50000); // Additional 80CCD(1B)
      default:
        return amount;
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
useEffect(() => {
  const fetchInvestments = async () => {
    const employee_id = localStorage.getItem('employee_id');
    if (!employee_id) {
      console.error('No employee_id found in localStorage');
      setInvestments([]); // Optional: clear on logout
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/investments?employee_id=${encodeURIComponent(employee_id)}`, {
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch investments');
      }
      const data = await response.json();
      setInvestments(data);
    } catch (err) {
      console.error('Error fetching investments:', err);
      setInvestments([]);
    }
  };

  fetchInvestments();
}, []);
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee_id = localStorage.getItem('employee_id');
    if (!employee_id) return alert('Employee ID missing');
    const taxBenefit = calculateTaxBenefit(formData.section, formData.amount);

    const payload = {
      ...formData,
      employee_id,
      taxBenefit
    };

    const url = editingInvestment
      ? `http://localhost:5000/api/investments/${editingInvestment.id}`
      : 'http://localhost:5000/api/investments';
    const method = editingInvestment ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json();
      alert('Error: ' + (errData.error || res.statusText));
      return;
    }

    const data = await res.json();
    if (editingInvestment) {
      setInvestments((prev) =>
        prev.map((inv) =>
          inv.id === editingInvestment.id ? { ...data.investment, id: editingInvestment.id } : inv
        )
      );
    } else {
      setInvestments((prev) => [...prev, data.investment]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      assesseeId: '',
      section: '80C',
      investmentType: '',
      instituteName: '',
      policyNumber: '',
      amount: 0,
      dateOfInvestment: '',
      maturityDate: '',
      interestRate: 0,
      financialYear: '2023-24',
      status: 'active',
      documents: []
    });
    setEditingInvestment(null);
    setShowForm(false);
  };

   const handleEdit = (inv: Investment) => {
    setFormData({ ...inv });
    setEditingInvestment(inv);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this investment?')) return;
    const res = await fetch(`http://localhost:5000/api/investments/${id}`, { method: 'DELETE' });
    if (res.ok) setInvestments((prev) => prev.filter((inv) => inv.id !== id));
    else alert('Delete failed');
  };

  const filteredInvestments = investments.filter(investment => 
    selectedSection === 'all' || investment.section === selectedSection
  );

  // Calculate totals by section
  const totalsBySection = investments.reduce((acc, inv) => {
    acc[inv.section] = (acc[inv.section] || 0) + inv.taxBenefit;
    return acc;
  }, {} as { [key: string]: number });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

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
        <h1 className="text-2xl font-bold">Investment Management</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Investment
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">80C Deductions</p>
              <p className="text-xl font-bold">{formatCurrency(totalsBySection['80C'] || 0)}</p>
              <p className="text-xs text-gray-500">Max: ₹1,50,000</p>
            </div>
            <PiggyBank size={24} className="text-blue-500" />
          </div>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">80D Deductions</p>
              <p className="text-xl font-bold">{formatCurrency(totalsBySection['80D'] || 0)}</p>
              <p className="text-xs text-gray-500">Max: ₹25,000</p>
            </div>
            <TrendingUp size={24} className="text-green-500" />
          </div>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Investments</p>
              <p className="text-xl font-bold">{investments.length}</p>
            </div>
            <Calculator size={24} className="text-purple-500" />
          </div>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tax Benefit</p>
              <p className="text-xl font-bold">
                {formatCurrency(Object.values(totalsBySection).reduce((sum, amount) => sum + amount, 0))}
              </p>
            </div>
            <TrendingUp size={24} className="text-orange-500" />
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className={sectionClass}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Filter by Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className={inputClass}
              title="Filter by Section"
            >
              <option value="all">All Sections</option>
              <option value="80C">Section 80C</option>
              <option value="80D">Section 80D</option>
              <option value="80E">Section 80E</option>
              <option value="80G">Section 80G</option>
              <option value="80TTA">Section 80TTA</option>
              <option value="80TTB">Section 80TTB</option>
              <option value="ELSS">ELSS</option>
              <option value="NPS">NPS</option>
            </select>
          </div>
          <div className="text-sm text-gray-500 flex items-end">
            Showing: {filteredInvestments.length} investment(s)
          </div>
        </div>
      </div>

      {/* Investments List */}
      <div className={sectionClass}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                <th className="px-4 py-3 text-left">Investment Details</th>
                <th className="px-4 py-3 text-left">Section</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Tax Benefit</th>
                <th className="px-4 py-3 text-left">Dates</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestments.map((investment) => (
                <tr 
                  key={investment.id}
                  className={`${theme === 'dark' ? 'border-b border-gray-600 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{investment.investmentType}</div>
                      <div className="text-sm text-gray-500">{investment.instituteName}</div>
                      {investment.policyNumber && (
                        <div className="text-xs text-gray-400">Policy: {investment.policyNumber}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      investment.section === '80C' ? 'bg-blue-100 text-blue-800' :
                      investment.section === '80D' ? 'bg-green-100 text-green-800' :
                      investment.section === '80E' ? 'bg-purple-100 text-purple-800' :
                      investment.section === '80G' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {investment.section}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {formatCurrency(investment.amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-green-600">
                    {formatCurrency(investment.taxBenefit)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      <div>Invested: {new Date(investment.dateOfInvestment).toLocaleDateString('en-IN')}</div>
                      {investment.maturityDate && (
                        <div className="text-gray-500">
                          Maturity: {new Date(investment.maturityDate).toLocaleDateString('en-IN')}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      investment.status === 'active' ? 'bg-green-100 text-green-800' :
                      investment.status === 'matured' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {investment.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => handleEdit(investment)}
                        className={`p-1 rounded ${
                          theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                        }`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(investment.id)}
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

          {filteredInvestments.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No investments found for the selected criteria
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
                  {editingInvestment ? 'Edit Investment' : 'Add New Investment'}
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
                {/* Basic Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Investment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Section *</label>
                      <select
                        value={formData.section}
                        onChange={(e) => {
                          handleInputChange('section', e.target.value as '80C' | '80D' | '80E' | '80G' | '80TTA' | '80TTB' | 'ELSS' | 'NPS');
                          handleInputChange('investmentType', ''); // Reset investment type
                        }}
                        className={inputClass}
                        required
                        title="Select Tax Section"
                      >
                        <option value="80C">Section 80C</option>
                        <option value="80D">Section 80D</option>
                        <option value="80E">Section 80E</option>
                        <option value="80G">Section 80G</option>
                        <option value="80TTA">Section 80TTA</option>
                        <option value="80TTB">Section 80TTB</option>
                        <option value="ELSS">ELSS</option>
                        <option value="NPS">NPS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Investment Type *</label>
                      <select
                        value={formData.investmentType}
                        onChange={(e) => handleInputChange('investmentType', e.target.value)}
                        className={inputClass}
                        required
                        title="Select Investment Type"
                      >
                        <option value="">-- Select Type --</option>
                        {getInvestmentTypes(formData.section).map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Institute/Company Name *</label>
                      <input
                        type="text"
                        value={formData.instituteName}
                        onChange={(e) => handleInputChange('instituteName', e.target.value)}
                        className={inputClass}
                        required
                        placeholder="Enter institute name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Policy/Account Number</label>
                      <input
                        type="text"
                        value={formData.policyNumber}
                        onChange={(e) => handleInputChange('policyNumber', e.target.value)}
                        className={inputClass}
                        placeholder="Enter policy/account number"
                      />
                    </div>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Financial Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Investment Amount *</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        required
                        placeholder="Enter amount"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Interest Rate (%)</label>
                      <input
                        type="number"
                        value={formData.interestRate}
                        onChange={(e) => handleInputChange('interestRate', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="Enter interest rate"
                        min="0"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Financial Year *</label>
                      <select
                        value={formData.financialYear}
                        onChange={(e) => handleInputChange('financialYear', e.target.value)}
                        className={inputClass}
                        required
                        title="Select Financial Year"
                      >
                        <option value="2023-24">2023-24</option>
                        <option value="2022-23">2022-23</option>
                        <option value="2021-22">2021-22</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-sm font-medium">Estimated Tax Benefit:</div>
                    <div className="text-lg font-bold text-green-600">
                      {formatCurrency(calculateTaxBenefit(formData.section, formData.amount))}
                    </div>
                  </div>
                </div>

                {/* Date Information */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Date Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Date of Investment *</label>
                      <input
                        type="date"
                        value={formData.dateOfInvestment}
                        onChange={(e) => handleInputChange('dateOfInvestment', e.target.value)}
                        className={inputClass}
                        required
                        title="Date of Investment"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Maturity Date</label>
                      <input
                        type="date"
                        value={formData.maturityDate}
                        onChange={(e) => handleInputChange('maturityDate', e.target.value)}
                        className={inputClass}
                        title="Maturity Date"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => handleInputChange('status', e.target.value as 'active' | 'matured' | 'surrendered')}
                        className={inputClass}
                        title="Select Status"
                      >
                        <option value="active">Active</option>
                        <option value="matured">Matured</option>
                        <option value="surrendered">Surrendered</option>
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
                    {editingInvestment ? 'Update' : 'Add'} Investment
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
          <span className="font-semibold">Investment Tips:</span> Diversify your 80C investments across different instruments. 
          Keep track of lock-in periods and maturity dates. Maintain all investment documents for tax filing. 
          Consider tax-saving mutual funds (ELSS) for potentially higher returns.
        </p>
      </div>
    </div>
  );
};

export default InvestmentManagement;
