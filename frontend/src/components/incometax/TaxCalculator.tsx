import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Calculator, Download, Printer, Info } from 'lucide-react';

interface TaxCalculation {
  income: number;
  regime: 'old' | 'new';
  deductions80C: number;
  deductions80D: number;
  otherDeductions: number;
  hra: number;
  professionalTax: number;
  standardDeduction: number;
}

const TaxCalculator: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<TaxCalculation>({
    income: 0,
    regime: 'old',
    deductions80C: 0,
    deductions80D: 0,
    otherDeductions: 0,
    hra: 0,
    professionalTax: 0,
    standardDeduction: 50000
  });

  const [showComparison, setShowComparison] = useState(false);

  const handleInputChange = (field: keyof TaxCalculation, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'regime' ? value : (typeof value === 'string' ? parseFloat(value) || 0 : value)
    }));
  };

  // Old Tax Regime Calculation
  const calculateOldRegimeTax = () => {
    const totalDeductions = formData.deductions80C + formData.deductions80D + 
                           formData.otherDeductions + formData.hra + formData.standardDeduction;
    const taxableIncome = Math.max(0, formData.income - totalDeductions - formData.professionalTax);
    
    let tax = 0;
    if (taxableIncome <= 250000) {
      tax = 0;
    } else if (taxableIncome <= 500000) {
      tax = (taxableIncome - 250000) * 0.05;
    } else if (taxableIncome <= 1000000) {
      tax = 12500 + (taxableIncome - 500000) * 0.20;
    } else {
      tax = 112500 + (taxableIncome - 1000000) * 0.30;
    }

    // Section 87A rebate
    const rebate87A = tax <= 12500 ? tax : 0;
    const taxAfterRebate = tax - rebate87A;
    
    // Health and education cess
    const cess = taxAfterRebate * 0.04;
    const totalTax = taxAfterRebate + cess;

    return {
      grossIncome: formData.income,
      totalDeductions,
      taxableIncome,
      taxBeforeRebate: tax,
      rebate87A,
      taxAfterRebate,
      cess,
      totalTax,
      takeHomeIncome: formData.income - totalTax - formData.professionalTax
    };
  };

  // New Tax Regime Calculation
  const calculateNewRegimeTax = () => {
    const taxableIncome = Math.max(0, formData.income - formData.standardDeduction - formData.professionalTax);
    
    let tax = 0;
    if (taxableIncome <= 300000) {
      tax = 0;
    } else if (taxableIncome <= 600000) {
      tax = (taxableIncome - 300000) * 0.05;
    } else if (taxableIncome <= 900000) {
      tax = 15000 + (taxableIncome - 600000) * 0.10;
    } else if (taxableIncome <= 1200000) {
      tax = 45000 + (taxableIncome - 900000) * 0.15;
    } else if (taxableIncome <= 1500000) {
      tax = 90000 + (taxableIncome - 1200000) * 0.20;
    } else {
      tax = 150000 + (taxableIncome - 1500000) * 0.30;
    }

    // Section 87A rebate (enhanced in new regime)
    const rebate87A = tax <= 25000 ? tax : 0;
    const taxAfterRebate = tax - rebate87A;
    
    // Health and education cess
    const cess = taxAfterRebate * 0.04;
    const totalTax = taxAfterRebate + cess;

    return {
      grossIncome: formData.income,
      totalDeductions: formData.standardDeduction,
      taxableIncome,
      taxBeforeRebate: tax,
      rebate87A,
      taxAfterRebate,
      cess,
      totalTax,
      takeHomeIncome: formData.income - totalTax - formData.professionalTax
    };
  };

  const oldRegimeResult = calculateOldRegimeTax();
  const newRegimeResult = calculateNewRegimeTax();
  const currentResult = formData.regime === 'old' ? oldRegimeResult : newRegimeResult;

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
        <h1 className="text-2xl font-bold">Income Tax Calculator</h1>
        <div className="ml-auto flex space-x-2">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-4 py-2 rounded-md ${
              showComparison 
                ? 'bg-blue-600 text-white' 
                : theme === 'dark' 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-200'
            }`}
          >
            Compare Regimes
          </button>
          <button
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Print"
          >
            <Printer size={18} />
          </button>
          <button
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Download"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className={sectionClass}>
          <div className="flex items-center mb-4">
            <Calculator size={20} className="mr-2" />
            <h2 className="text-xl font-semibold">Tax Calculation Input</h2>
          </div>

          {/* Tax Regime Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Tax Regime</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="regime"
                  value="old"
                  checked={formData.regime === 'old'}
                  onChange={(e) => handleInputChange('regime', e.target.value as 'old' | 'new')}
                  className="mr-2"
                />
                Old Tax Regime
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="regime"
                  value="new"
                  checked={formData.regime === 'new'}
                  onChange={(e) => handleInputChange('regime', e.target.value as 'old' | 'new')}
                  className="mr-2"
                />
                New Tax Regime
              </label>
            </div>
          </div>

          {/* Income Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Annual Gross Income</label>
            <input
              type="number"
              value={formData.income}
              onChange={(e) => handleInputChange('income', e.target.value)}
              className={inputClass}
              placeholder="Enter annual income"
            />
          </div>

          {/* Standard Deduction */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Standard Deduction</label>
            <input
              type="number"
              value={formData.standardDeduction}
              onChange={(e) => handleInputChange('standardDeduction', e.target.value)}
              className={inputClass}
              placeholder="50000"
            />
          </div>

          {/* Professional Tax */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Professional Tax</label>
            <input
              type="number"
              value={formData.professionalTax}
              onChange={(e) => handleInputChange('professionalTax', e.target.value)}
              className={inputClass}
              placeholder="2400"
            />
          </div>

          {/* Deductions (Only for Old Regime) */}
          {formData.regime === 'old' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">80C Deductions (Max ₹1,50,000)</label>
                <input
                  type="number"
                  value={formData.deductions80C}
                  onChange={(e) => handleInputChange('deductions80C', Math.min(150000, parseFloat(e.target.value) || 0))}
                  className={inputClass}
                  placeholder="Enter 80C investments"
                  max={150000}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">80D Deductions (Health Insurance)</label>
                <input
                  type="number"
                  value={formData.deductions80D}
                  onChange={(e) => handleInputChange('deductions80D', e.target.value)}
                  className={inputClass}
                  placeholder="Enter health insurance premium"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">HRA Exemption</label>
                <input
                  type="number"
                  value={formData.hra}
                  onChange={(e) => handleInputChange('hra', e.target.value)}
                  className={inputClass}
                  placeholder="Enter HRA exemption"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Other Deductions</label>
                <input
                  type="number"
                  value={formData.otherDeductions}
                  onChange={(e) => handleInputChange('otherDeductions', e.target.value)}
                  className={inputClass}
                  placeholder="Enter other deductions"
                />
              </div>
            </>
          )}
        </div>

        {/* Results */}
        <div className={sectionClass}>
          <h2 className="text-xl font-semibold mb-4">
            Tax Calculation Result ({formData.regime === 'old' ? 'Old' : 'New'} Regime)
          </h2>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Gross Annual Income:</span>
              <span className="font-medium">{formatCurrency(currentResult.grossIncome)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Total Deductions:</span>
              <span className="font-medium text-green-600">-{formatCurrency(currentResult.totalDeductions)}</span>
            </div>
            
            <div className="flex justify-between border-t pt-2">
              <span>Taxable Income:</span>
              <span className="font-medium">{formatCurrency(currentResult.taxableIncome)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Tax Before Rebate:</span>
              <span className="font-medium">{formatCurrency(currentResult.taxBeforeRebate)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Rebate u/s 87A:</span>
              <span className="font-medium text-green-600">-{formatCurrency(currentResult.rebate87A)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Tax After Rebate:</span>
              <span className="font-medium">{formatCurrency(currentResult.taxAfterRebate)}</span>
            </div>
            
            <div className="flex justify-between">
              <span>Health & Education Cess (4%):</span>
              <span className="font-medium">{formatCurrency(currentResult.cess)}</span>
            </div>
            
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total Tax Liability:</span>
              <span className="text-red-600">{formatCurrency(currentResult.totalTax)}</span>
            </div>
            
            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Take Home Income:</span>
              <span className="text-green-600">{formatCurrency(currentResult.takeHomeIncome)}</span>
            </div>
          </div>

          {/* Tax Slabs Information */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="font-semibold mb-2">
              {formData.regime === 'old' ? 'Old' : 'New'} Tax Regime Slabs
            </h3>
            {formData.regime === 'old' ? (
              <div className="text-sm space-y-1">
                <div>₹0 - ₹2,50,000: 0%</div>
                <div>₹2,50,001 - ₹5,00,000: 5%</div>
                <div>₹5,00,001 - ₹10,00,000: 20%</div>
                <div>Above ₹10,00,000: 30%</div>
              </div>
            ) : (
              <div className="text-sm space-y-1">
                <div>₹0 - ₹3,00,000: 0%</div>
                <div>₹3,00,001 - ₹6,00,000: 5%</div>
                <div>₹6,00,001 - ₹9,00,000: 10%</div>
                <div>₹9,00,001 - ₹12,00,000: 15%</div>
                <div>₹12,00,001 - ₹15,00,000: 20%</div>
                <div>Above ₹15,00,000: 30%</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      {showComparison && (
        <div className={sectionClass}>
          <h2 className="text-xl font-semibold mb-4">Regime Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                  <th className="px-4 py-2 text-left">Particulars</th>
                  <th className="px-4 py-2 text-right">Old Regime</th>
                  <th className="px-4 py-2 text-right">New Regime</th>
                  <th className="px-4 py-2 text-right">Difference</th>
                </tr>
              </thead>
              <tbody>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                  <td className="px-4 py-2">Gross Income</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(oldRegimeResult.grossIncome)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(newRegimeResult.grossIncome)}</td>
                  <td className="px-4 py-2 text-right">-</td>
                </tr>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                  <td className="px-4 py-2">Total Deductions</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(oldRegimeResult.totalDeductions)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(newRegimeResult.totalDeductions)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(oldRegimeResult.totalDeductions - newRegimeResult.totalDeductions)}</td>
                </tr>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-200'}`}>
                  <td className="px-4 py-2">Taxable Income</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(oldRegimeResult.taxableIncome)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(newRegimeResult.taxableIncome)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(oldRegimeResult.taxableIncome - newRegimeResult.taxableIncome)}</td>
                </tr>
                <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-200'} font-bold`}>
                  <td className="px-4 py-2">Total Tax</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(oldRegimeResult.totalTax)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(newRegimeResult.totalTax)}</td>
                  <td className={`px-4 py-2 text-right ${
                    oldRegimeResult.totalTax > newRegimeResult.totalTax ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formatCurrency(Math.abs(oldRegimeResult.totalTax - newRegimeResult.totalTax))}
                  </td>
                </tr>
                <tr className="font-bold">
                  <td className="px-4 py-2">Take Home Income</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(oldRegimeResult.takeHomeIncome)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(newRegimeResult.takeHomeIncome)}</td>
                  <td className={`px-4 py-2 text-right ${
                    oldRegimeResult.takeHomeIncome > newRegimeResult.takeHomeIncome ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(Math.abs(oldRegimeResult.takeHomeIncome - newRegimeResult.takeHomeIncome))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="flex items-center">
              <Info size={16} className="mr-2" />
              <span className="font-semibold">
                Recommendation: {oldRegimeResult.totalTax < newRegimeResult.totalTax ? 'Old Regime' : 'New Regime'} 
                saves you {formatCurrency(Math.abs(oldRegimeResult.totalTax - newRegimeResult.totalTax))} in taxes
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Note:</span> This calculator provides an estimate based on current tax slabs. 
          Actual tax may vary based on other factors like TDS, advance tax, and additional deductions. 
          Consult a tax professional for accurate advice.
        </p>
      </div>
    </div>
  );
};

export default TaxCalculator;
