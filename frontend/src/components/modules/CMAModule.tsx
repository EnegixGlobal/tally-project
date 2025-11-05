import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, BarChart, TrendingUp, Calculator, DollarSign } from 'lucide-react';

const CMAModule: React.FC = () => {
  const navigate = useNavigate();

  const reportTypes = [
    {
      id: 'cma-report',
      title: 'CMA Data Report',
      description: 'Complete Credit Monitoring Arrangement report with all financial forms',
      icon: FileText,
      path: '/app/audit/cma-report',
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      id: 'ratio-analysis',
      title: 'Ratio Analysis',
      description: 'Financial ratios and performance indicators analysis',
      icon: BarChart,
      path: '/app/audit/cma-report',
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow Statement',
      description: 'Funds flow and cash flow analysis',
      icon: TrendingUp,
      path: '/app/audit/cma-report',
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      id: 'mpbf-calculation',
      title: 'MPBF Calculation',
      description: 'Maximum Permissible Bank Finance computation',
      icon: Calculator,
      path: '/app/audit/cma-report',
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    },
    {
      id: 'working-capital',
      title: 'Working Capital Analysis',
      description: 'Current assets and liabilities analysis',
      icon: DollarSign,
      path: '/app/audit/cma-report',
      color: 'bg-indigo-50 border-indigo-200 hover:bg-indigo-100'
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            title='Back to Dashboard'
            type='button'
            onClick={() => navigate('/app')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">CMA (Credit Monitoring Arrangement)</h1>
        </div>

        {/* Module Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">CMA Data Reporting</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Generate comprehensive Credit Monitoring Arrangement reports for bank lending requirements. 
            Includes operating statements, balance sheet analysis, ratio calculations, and MPBF computations.
          </p>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">7</div>
              <div className="text-sm text-gray-600">Report Forms</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">25+</div>
              <div className="text-sm text-gray-600">Financial Ratios</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">5</div>
              <div className="text-sm text-gray-600">Year Projections</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">100%</div>
              <div className="text-sm text-gray-600">Bank Compliant</div>
            </div>
          </div>
        </div>

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${report.color}`}
              onClick={() => navigate(report.path)}
            >
              <div className="flex items-center gap-3 mb-4">
                <report.icon className="h-8 w-8 text-gray-700" />
                <h3 className="text-lg font-semibold text-gray-900">{report.title}</h3>
              </div>
              <p className="text-gray-600 text-sm">{report.description}</p>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white bg-opacity-70">
                  Click to access
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* CMA Forms Overview */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">CMA Data Report Forms</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Executive Summary</span>
                <p className="text-sm text-gray-600">Company overview and key financial highlights</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Form I</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Operating Statement</span>
                <p className="text-sm text-gray-600">Income, expenses, and profit/loss analysis</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">Form II</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Balance Sheet Analysis</span>
                <p className="text-sm text-gray-600">Assets, liabilities, and net worth breakdown</p>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Form III</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Current Assets & Liabilities</span>
                <p className="text-sm text-gray-600">Working capital components analysis</p>
              </div>
              <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">Form IV</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">MPBF Computation</span>
                <p className="text-sm text-gray-600">Maximum Permissible Bank Finance calculation</p>
              </div>
              <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full">Form V</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Funds Flow Statement</span>
                <p className="text-sm text-gray-600">Sources and application of funds</p>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">Form VI</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Ratio Analysis</span>
                <p className="text-sm text-gray-600">Financial ratios and performance metrics</p>
              </div>
              <span className="px-3 py-1 bg-pink-100 text-pink-800 text-xs rounded-full">Form VII</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center mt-8">
          <button
            onClick={() => navigate('/app/audit/cma-report')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            <FileText size={20} />
            Generate CMA Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default CMAModule;
