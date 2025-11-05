import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Filter } from 'lucide-react';

const GSTAnalysis: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button
        title='Back to Reports'
          onClick={() => navigate('/app/gst')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">GST Analysis</h1>
        <div className="ml-auto flex space-x-2">
          <button
          title='Toggle Filters'
            type='button'
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Filter size={18} />
          </button>
          <button
          type='button'
          title='Print Report'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title='Download Report'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>
      
      {showFilterPanel && (
        <div className={`p-4 mb-6 rounded-lg ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
        }`}>
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Period
              </label>
              <select
              title='Select Period'
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="current-month">Current Month</option>
                <option value="current-quarter">Current Quarter</option>
                <option value="current-year">Current Financial Year</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                GST Rate
              </label>
              <select
              title='Select GST Rate'
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600' 
                    : 'bg-white border-gray-300'
                }`}
              >
                <option value="">All Rates</option>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* GST Summary Cards */}
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="text-lg font-semibold mb-4">Output GST</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>CGST</span>
              <span className="font-mono">₹ 0.00</span>
            </div>
            <div className="flex justify-between">
              <span>SGST</span>
              <span className="font-mono">₹ 0.00</span>
            </div>
            <div className="flex justify-between">
              <span>IGST</span>
              <span className="font-mono">₹ 0.00</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
              <span>Total Output GST</span>
              <span className="font-mono">₹ 0.00</span>
            </div>
          </div>
        </div>

        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="text-lg font-semibold mb-4">Input GST</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>CGST</span>
              <span className="font-mono">₹ 0.00</span>
            </div>
            <div className="flex justify-between">
              <span>SGST</span>
              <span className="font-mono">₹ 0.00</span>
            </div>
            <div className="flex justify-between">
              <span>IGST</span>
              <span className="font-mono">₹ 0.00</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
              <span>Total Input GST</span>
              <span className="font-mono">₹ 0.00</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="mb-4">
          <h2 className="text-xl font-bold">GST Rate-wise Analysis</h2>
          <p className="text-sm opacity-75">Breakdown by GST rates for selected period</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${
                theme === 'dark' ? 'border-b border-gray-700' : 'border-b-2 border-gray-300'
              }`}>
                <th className="px-4 py-3 text-left">GST Rate</th>
                <th className="px-4 py-3 text-right">Taxable Value</th>
                <th className="px-4 py-3 text-right">CGST</th>
                <th className="px-4 py-3 text-right">SGST</th>
                <th className="px-4 py-3 text-right">IGST</th>
                <th className="px-4 py-3 text-right">Total Tax</th>
                <th className="px-4 py-3 text-right">Total Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className={`${
                theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
              }`}>
                <td className="px-4 py-3">0%</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
              </tr>
              <tr className={`${
                theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
              }`}>
                <td className="px-4 py-3">5%</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
              </tr>
              <tr className={`${
                theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
              }`}>
                <td className="px-4 py-3">12%</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
              </tr>
              <tr className={`${
                theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
              }`}>
                <td className="px-4 py-3">18%</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
              </tr>
              <tr className={`${
                theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
              }`}>
                <td className="px-4 py-3">28%</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
              </tr>
            </tbody>
            <tfoot>
              <tr className={`font-bold ${
                theme === 'dark' ? 'border-t-2 border-gray-600' : 'border-t-2 border-gray-300'
              }`}>
                <td className="px-4 py-3">Total</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
                <td className="px-4 py-3 text-right font-mono">0.00</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-orange-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">GST Analysis:</span> Monitor your GST liability and input tax credit to optimize tax efficiency.
        </p>
      </div>
    </div>
  );
};

export default GSTAnalysis;