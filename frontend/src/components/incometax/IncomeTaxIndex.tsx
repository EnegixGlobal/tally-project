import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, FileText, Calculator, Download, Printer, User, Building, PiggyBank, TrendingUp, Receipt } from 'lucide-react';

const IncomeTaxIndex: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const incomeTaxOptions = [
    {
      title: 'ITR Filing',
      description: 'File Income Tax Return with all income sources',
      icon: <FileText size={24} />,
      path: '/app/income-tax/itr-filing',
      color: 'bg-blue-500'
    },
    {
      title: 'Tax Calculator',
      description: 'Calculate income tax liability',
      icon: <Calculator size={24} />,
      path: '/app/income-tax/calculator',
      color: 'bg-green-500'
    },
    {
      title: 'Assessee Management',
      description: 'Manage assessee details and profiles',
      icon: <User size={24} />,
      path: '/app/income-tax/assessee',
      color: 'bg-purple-500'
    },
    {
      title: 'Business Income',
      description: 'Manage business and professional income',
      icon: <Building size={24} />,
      path: '/app/income-tax/business',
      color: 'bg-orange-500'
    },
    {
      title: 'Investment & Deductions',
      description: 'Track 80C, 80D and other deductions',
      icon: <PiggyBank size={24} />,
      path: '/app/income-tax/deductions',
      color: 'bg-indigo-500'
    },
    {
      title: 'Capital Gains',
      description: 'Calculate short-term and long-term capital gains',
      icon: <TrendingUp size={24} />,
      path: '/app/income-tax/capital-gains',
      color: 'bg-red-500'
    },
    {
      title: 'TDS Management',
      description: 'Track TDS certificates and payments',
      icon: <Receipt size={24} />,
      path: '/app/income-tax/tds',
      color: 'bg-teal-500'
    },
    {
      title: 'Reports',
      description: 'Generate income tax reports and statements',
      icon: <Download size={24} />,
      path: '/app/income-tax/reports',
      color: 'bg-gray-500'
    }
  ];

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          title="Back to Dashboard"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Income Tax</h1>
        <div className="ml-auto flex space-x-2">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {incomeTaxOptions.map((option, index) => (
          <div
            key={index}
            onClick={() => navigate(option.path)}
            className={`p-6 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${
              theme === 'dark' 
                ? 'bg-gray-800 hover:bg-gray-700 border border-gray-700' 
                : 'bg-white hover:bg-gray-50 shadow-md hover:shadow-lg border border-gray-200'
            }`}
          >
            <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center text-white mb-4`}>
              {option.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{option.title}</h3>
            <p className="text-sm opacity-70">{option.description}</p>
          </div>
        ))}
      </div>

      <div className={`mt-8 p-6 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <h2 className="text-lg font-semibold mb-4">Quick Stats</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
            <div className="text-2xl font-bold text-blue-600">₹0</div>
            <div className="text-sm opacity-70">Total Taxable Income</div>
          </div>
          <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
            <div className="text-2xl font-bold text-green-600">₹0</div>
            <div className="text-sm opacity-70">Total Deductions</div>
          </div>
          <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
            <div className="text-2xl font-bold text-red-600">₹0</div>
            <div className="text-sm opacity-70">Tax Liability</div>
          </div>
          <div className={`p-4 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-white'}`}>
            <div className="text-2xl font-bold text-purple-600">₹0</div>
            <div className="text-sm opacity-70">Refund/Payable</div>
          </div>
        </div>
      </div>

      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Note:</span> Use Income Tax module to manage ITR filing, tax calculations, and compliance. Ensure all documents are verified before filing.
        </p>
      </div>
    </div>
  );
};

export default IncomeTaxIndex;
