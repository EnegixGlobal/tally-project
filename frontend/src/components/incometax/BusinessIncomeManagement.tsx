import React, { useState,useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Building2, Plus, Edit, Trash2, Calculator, FileText, TrendingUp } from 'lucide-react';

interface BusinessIncome {
  id: string;
  assesseeId: string;
  businessName: string;
  businessType: 'profession' | 'business' | 'commission' | 'other';
  registrationNumber?: string;
  financialYear: string;
  // P&L Details
  grossReceipts: number;
  grossTurnover: number;
  otherIncome: number;
  totalIncome: number;
  // Expenses
  purchaseOfTradingGoods: number;
  directExpenses: number;
  employeeBenefits: number;
  financialCharges: number;
  depreciation: number;
  otherExpenses: number;
  totalExpenses: number;
  // Net Profit
  netProfitLoss: number;
  // Section Details
  section44AD: boolean;
  section44ADA: boolean;
  section44AB: boolean;
  presumptiveIncome?: number;
  auditRequired: boolean;
  // Additional Details
  booksProfitLoss: number;
  additions: number;
  deductions: number;
  computedIncome: number;
  status: 'draft' | 'finalized';
  createdDate: string;
}

const BusinessIncomeManagement: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [businessIncomes, setBusinessIncomes] = useState<BusinessIncome[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<BusinessIncome | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'calculator'>('list');

  const [formData, setFormData] = useState<Omit<BusinessIncome, 'id' | 'createdDate'>>({
    assesseeId: '',
    businessName: '',
    businessType: 'business',
    registrationNumber: '',
    financialYear: '2023-24',
    grossReceipts: 0,
    grossTurnover: 0,
    otherIncome: 0,
    totalIncome: 0,
    purchaseOfTradingGoods: 0,
    directExpenses: 0,
    employeeBenefits: 0,
    financialCharges: 0,
    depreciation: 0,
    otherExpenses: 0,
    totalExpenses: 0,
    netProfitLoss: 0,
    section44AD: false,
    section44ADA: false,
    section44AB: false,
    presumptiveIncome: 0,
    auditRequired: false,
    booksProfitLoss: 0,
    additions: 0,
    deductions: 0,
    computedIncome: 0,
    status: 'draft'
  });
   useEffect(() => {
    const fetchBusinessIncomes = async () => {
      try {
        const employee_id = localStorage.getItem('employee_id');
        if (!employee_id) {
          console.error('No employee_id in localStorage');
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/business-income?employee_id=${encodeURIComponent(employee_id)}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data: BusinessIncome[] = await response.json();
        setBusinessIncomes(data);
      } catch (error) {
        console.error('Error fetching business income:', error);
      }
    };

    fetchBusinessIncomes();
  }, []);
  // Auto-calculate fields
  // React.useEffect(() => {
  //   const totalIncome = formData.grossReceipts + formData.grossTurnover + formData.otherIncome;
  //   const totalExpenses = formData.purchaseOfTradingGoods + formData.directExpenses + 
  //                        formData.employeeBenefits + formData.financialCharges + 
  //                        formData.depreciation + formData.otherExpenses;
  //   const netProfitLoss = totalIncome - totalExpenses;
  //   const computedIncome = formData.booksProfitLoss + formData.additions - formData.deductions;

  //   setFormData(prev => ({
  //     ...prev,
  //     totalIncome,
  //     totalExpenses,
  //     netProfitLoss,
  //     booksProfitLoss: netProfitLoss,
  //     computedIncome
  //   }));
  // }, [
  //   formData.grossReceipts, formData.grossTurnover, formData.otherIncome,
  //   formData.purchaseOfTradingGoods, formData.directExpenses, formData.employeeBenefits,
  //   formData.financialCharges, formData.depreciation, formData.otherExpenses,
  //   formData.additions, formData.deductions, formData.booksProfitLoss
  // ]);

  // Check audit requirement
  // React.useEffect(() => {
  //   const auditRequired = (!formData.section44AD && !formData.section44ADA && formData.grossTurnover > 10000000) ||
  //                        (formData.section44AB && formData.grossTurnover > 20000000);
  //   setFormData(prev => ({ ...prev, auditRequired }));
  // }, [formData.section44AD, formData.section44ADA, formData.section44AB, formData.grossTurnover]);

  // Calculate presumptive income
  // React.useEffect(() => {
  //   let presumptiveIncome = 0;
  //   if (formData.section44AD) {
  //     presumptiveIncome = formData.grossTurnover * 0.08; // 8% of turnover
  //   } else if (formData.section44ADA) {
  //     presumptiveIncome = formData.grossReceipts * 0.50; // 50% of receipts
  //   }
  //   setFormData(prev => ({ ...prev, presumptiveIncome }));
  // }, [formData.section44AD, formData.section44ADA, formData.grossTurnover, formData.grossReceipts]);

  const handleInputChange = (field: keyof typeof formData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    const employee_id = localStorage.getItem('employee_id');
    if (!employee_id) {
      alert('Employee ID not found in local storage');
      return;
    }

    const payload = {
      ...formData,
      employee_id, // add employee_id here
    };

    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/business-income`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert('Failed to save business income: ' + (errorData.error || response.statusText));
      return;
    }

    const data = await response.json();

    if (data.success) {
      alert('Business income saved successfully.');
      setBusinessIncomes(prev => [...prev, data.businessIncome]);
      resetForm();
    } else {
      alert('Failed to save business income');
    }
  } catch (error: any) {
    alert('Error saving business income: ' + (error.message || 'Unknown error'));
  }
};


  const resetForm = () => {
    setFormData({
      assesseeId: '',
      businessName: '',
      businessType: 'business',
      registrationNumber: '',
      financialYear: '2023-24',
      grossReceipts: 0,
      grossTurnover: 0,
      otherIncome: 0,
      totalIncome: 0,
      purchaseOfTradingGoods: 0,
      directExpenses: 0,
      employeeBenefits: 0,
      financialCharges: 0,
      depreciation: 0,
      otherExpenses: 0,
      totalExpenses: 0,
      netProfitLoss: 0,
      section44AD: false,
      section44ADA: false,
      section44AB: false,
      presumptiveIncome: 0,
      auditRequired: false,
      booksProfitLoss: 0,
      additions: 0,
      deductions: 0,
      computedIncome: 0,
      status: 'draft'
    });
    setEditingIncome(null);
    setShowForm(false);
  };

  const handleEdit = (income: BusinessIncome) => {
    setFormData(income);
    setEditingIncome(income);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
  if (!window.confirm('Are you sure you want to delete this business income record?')) return;

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/business-income/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json();
      alert('Failed to delete business income: ' + (errorData.error || response.statusText));
      return;
    }

    const data = await response.json();
    if (data.success) {
      alert('Deleted successfully');
      setBusinessIncomes(prev => prev.filter(item => item.id !== id));
    }
  } catch (error) {
    alert('Error deleting business income');
  }
};


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
        <h1 className="text-2xl font-bold">Business Income Management</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'list' 
                ? 'bg-blue-600 text-white' 
                : theme === 'dark' 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-200'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'calculator' 
                ? 'bg-blue-600 text-white' 
                : theme === 'dark' 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-200'
            }`}
          >
            Calculator
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md flex items-center"
          >
            <Plus size={16} className="mr-2" />
            Add Business
          </button>
        </div>
      </div>

      {activeTab === 'list' && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Businesses</p>
                  <p className="text-xl font-bold">{businessIncomes.length}</p>
                </div>
                <Building2 size={24} className="text-blue-500" />
              </div>
            </div>
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Turnover</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(businessIncomes.reduce((sum, b) => sum + b.grossTurnover, 0))}
                  </p>
                </div>
                <TrendingUp size={24} className="text-green-500" />
              </div>
            </div>
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Net Profit</p>
                  <p className="text-xl font-bold">
                    {formatCurrency(businessIncomes.reduce((sum, b) => sum + b.netProfitLoss, 0))}
                  </p>
                </div>
                <Calculator size={24} className="text-purple-500" />
              </div>
            </div>
            <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Audit Required</p>
                  <p className="text-xl font-bold">
                    {businessIncomes.filter(b => b.auditRequired).length}
                  </p>
                </div>
                <FileText size={24} className="text-red-500" />
              </div>
            </div>
          </div>

          {/* Business Income List */}
          <div className={sectionClass}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                    <th className="px-4 py-3 text-left">Business Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-right">Turnover</th>
                    <th className="px-4 py-3 text-right">Net Profit</th>
                    <th className="px-4 py-3 text-left">Section</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {businessIncomes.map((income) => (
                    <tr 
                      key={income.id}
                      className={`${theme === 'dark' ? 'border-b border-gray-600 hover:bg-gray-700' : 'border-b border-gray-200 hover:bg-gray-50'}`}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{income.businessName}</div>
                          <div className="text-sm text-gray-500">FY: {income.financialYear}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          income.businessType === 'profession' ? 'bg-blue-100 text-blue-800' :
                          income.businessType === 'business' ? 'bg-green-100 text-green-800' :
                          income.businessType === 'commission' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {income.businessType.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {formatCurrency(income.grossTurnover)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        <span className={income.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(income.netProfitLoss)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {income.section44AD && <div className="text-blue-600">44AD</div>}
                          {income.section44ADA && <div className="text-green-600">44ADA</div>}
                          {income.section44AB && <div className="text-purple-600">44AB</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            income.status === 'finalized' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {income.status}
                          </span>
                          {income.auditRequired && (
                            <div className="text-xs text-red-600">Audit Required</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(income)}
                            className={`p-1 rounded ${
                              theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                            }`}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(income.id)}
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

              {businessIncomes.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No business income records found. Add your first business to get started.
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'calculator' && (
        <div className={sectionClass}>
          <h2 className="text-xl font-semibold mb-4">Business Income Calculator</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div>
              <h3 className="font-medium mb-4">Enter Business Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Gross Turnover</label>
                  <input
                    type="number"
                    value={formData.grossTurnover}
                    onChange={(e) => handleInputChange('grossTurnover', parseFloat(e.target.value) || 0)}
                    className={inputClass}
                    placeholder="Enter turnover"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Business Type</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => handleInputChange('businessType', e.target.value as 'business' | 'profession')}
                    className={inputClass}
                    title="Select Business Type"
                  >
                    <option value="business">Business</option>
                    <option value="profession">Profession</option>
                    <option value="commission">Commission</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.section44AD}
                      onChange={(e) => handleInputChange('section44AD', e.target.checked)}
                      className="mr-2"
                    />
                    Section 44AD (Presumptive Taxation for Business)
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.section44ADA}
                      onChange={(e) => handleInputChange('section44ADA', e.target.checked)}
                      className="mr-2"
                    />
                    Section 44ADA (Presumptive Taxation for Profession)
                  </label>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div>
              <h3 className="font-medium mb-4">Calculated Results</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Gross Turnover:</span>
                  <span className="font-medium">{formatCurrency(formData.grossTurnover)}</span>
                </div>
                
                {formData.section44AD && (
                  <div className="flex justify-between">
                    <span>Presumptive Income (8%):</span>
                    <span className="font-medium text-blue-600">{formatCurrency(formData.presumptiveIncome || 0)}</span>
                  </div>
                )}
                
                {formData.section44ADA && (
                  <div className="flex justify-between">
                    <span>Presumptive Income (50%):</span>
                    <span className="font-medium text-blue-600">{formatCurrency(formData.presumptiveIncome || 0)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Audit Required:</span>
                  <span className={`font-medium ${formData.auditRequired ? 'text-red-600' : 'text-green-600'}`}>
                    {formData.auditRequired ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="pt-4 border-t">
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>• Section 44AD: 8% of turnover for business</div>
                    <div>• Section 44ADA: 50% of receipts for profession</div>
                    <div>• Audit required if turnover {'>'} ₹2 crores (without presumptive)</div>
                    <div>• Audit required if turnover {'>'} ₹10 crores (with presumptive)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-6xl max-h-[90vh] rounded-lg overflow-hidden ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  {editingIncome ? 'Edit Business Income' : 'Add New Business Income'}
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
                  <h4 className="font-medium mb-4">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Name *</label>
                      <input
                        type="text"
                        value={formData.businessName}
                        onChange={(e) => handleInputChange('businessName', e.target.value)}
                        className={inputClass}
                        required
                        placeholder="Enter business name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Business Type *</label>
                      <select
                        value={formData.businessType}
                        onChange={(e) => handleInputChange('businessType', e.target.value as 'business' | 'profession')}
                        className={inputClass}
                        required
                        title="Select Business Type"
                      >
                        <option value="business">Business</option>
                        <option value="profession">Profession</option>
                        <option value="commission">Commission</option>
                        <option value="other">Other</option>
                      </select>
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
                </div>

                {/* Income Details */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Income Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Gross Receipts</label>
                      <input
                        type="number"
                        value={formData.grossReceipts}
                        onChange={(e) => handleInputChange('grossReceipts', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Gross Turnover</label>
                      <input
                        type="number"
                        value={formData.grossTurnover}
                        onChange={(e) => handleInputChange('grossTurnover', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Other Income</label>
                      <input
                        type="number"
                        value={formData.otherIncome}
                        onChange={(e) => handleInputChange('otherIncome', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="font-medium">Total Income:</span>
                      <span className="font-bold text-lg">{formatCurrency(formData.totalIncome)}</span>
                    </div>
                  </div>
                </div>

                {/* Expense Details */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Expense Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Purchase of Trading Goods</label>
                      <input
                        type="number"
                        value={formData.purchaseOfTradingGoods}
                        onChange={(e) => handleInputChange('purchaseOfTradingGoods', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Direct Expenses</label>
                      <input
                        type="number"
                        value={formData.directExpenses}
                        onChange={(e) => handleInputChange('directExpenses', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee Benefits</label>
                      <input
                        type="number"
                        value={formData.employeeBenefits}
                        onChange={(e) => handleInputChange('employeeBenefits', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Financial Charges</label>
                      <input
                        type="number"
                        value={formData.financialCharges}
                        onChange={(e) => handleInputChange('financialCharges', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Depreciation</label>
                      <input
                        type="number"
                        value={formData.depreciation}
                        onChange={(e) => handleInputChange('depreciation', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Other Expenses</label>
                      <input
                        type="number"
                        value={formData.otherExpenses}
                        onChange={(e) => handleInputChange('otherExpenses', parseFloat(e.target.value) || 0)}
                        className={inputClass}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <span className="font-medium">Total Expenses:</span>
                      <span className="font-bold text-lg">{formatCurrency(formData.totalExpenses)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="font-medium">Net Profit/Loss:</span>
                      <span className={`font-bold text-lg ${formData.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(formData.netProfitLoss)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sections and Computation */}
                <div className="mb-6">
                  <h4 className="font-medium mb-4">Sections & Computation</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.section44AD}
                            onChange={(e) => handleInputChange('section44AD', e.target.checked)}
                            className="mr-2"
                          />
                          Section 44AD (Presumptive Business)
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.section44ADA}
                            onChange={(e) => handleInputChange('section44ADA', e.target.checked)}
                            className="mr-2"
                          />
                          Section 44ADA (Presumptive Profession)
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.section44AB}
                            onChange={(e) => handleInputChange('section44AB', e.target.checked)}
                            className="mr-2"
                          />
                          Section 44AB (Tax Audit)
                        </label>
                      </div>
                      
                      {(formData.section44AD || formData.section44ADA) && (
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <div className="text-sm font-medium">Presumptive Income</div>
                          <div className="text-lg font-bold">{formatCurrency(formData.presumptiveIncome || 0)}</div>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Additions to Profit</label>
                          <input
                            type="number"
                            value={formData.additions}
                            onChange={(e) => handleInputChange('additions', parseFloat(e.target.value) || 0)}
                            className={inputClass}
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Deductions from Profit</label>
                          <input
                            type="number"
                            value={formData.deductions}
                            onChange={(e) => handleInputChange('deductions', parseFloat(e.target.value) || 0)}
                            className={inputClass}
                            placeholder="0"
                          />
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="text-sm font-medium">Computed Income</div>
                          <div className="text-lg font-bold">{formatCurrency(formData.computedIncome)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {formData.auditRequired && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200">
                      <div className="text-red-600 font-medium">⚠️ Tax Audit Required</div>
                      <div className="text-sm text-red-600 mt-1">
                        Annual turnover exceeds the prescribed limit. Tax audit under Section 44AB is mandatory.
                      </div>
                    </div>
                  )}
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
                    {editingIncome ? 'Update' : 'Add'} Business Income
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
          <span className="font-semibold">Note:</span> Maintain detailed records of all business income and expenses. 
          Consider presumptive taxation schemes (44AD/44ADA) for simplified compliance. 
          Ensure tax audit compliance for eligible businesses.
        </p>
      </div>
    </div>
  );
};

export default BusinessIncomeManagement;
