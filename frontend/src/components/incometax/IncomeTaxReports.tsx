import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Download, Printer, FileText, Calculator, TrendingUp } from 'lucide-react';
import ReportViewer from './reports/ReportViewer';

const IncomeTaxReports: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [selectedReport, setSelectedReport] = useState<string>('');
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [filters, setFilters] = useState({
    assessmentYear: '2024-25',
    fromDate: '',
    toDate: '',
    assesseeType: 'all'
  });

  const reports = [
    {
      id: 'itr-summary',
      name: 'ITR Summary Report',
      description: 'Comprehensive summary of all ITR filings',
      icon: FileText,
      category: 'ITR'
    },
    {
      id: 'tax-computation',
      name: 'Tax Computation Report',
      description: 'Detailed tax calculation and computation',
      icon: Calculator,
      category: 'TAX'
    },
    {
      id: 'tds-summary',
      name: 'TDS Summary Report',
      description: 'Summary of all TDS deductions and collections',
      icon: TrendingUp,
      category: 'TDS'
    },
    {
      id: 'capital-gains',
      name: 'Capital Gains Report',
      description: 'Report of all capital gains transactions',
      icon: TrendingUp,
      category: 'CAPITAL'
    },
    {
      id: 'business-income',
      name: 'Business Income Report',
      description: 'Business income and P&L analysis',
      icon: TrendingUp,
      category: 'BUSINESS'
    },
    {
      id: 'investment-summary',
      name: 'Investment Summary',
      description: 'Summary of all investments and tax benefits',
      icon: TrendingUp,
      category: 'INVESTMENT'
    },
    {
      id: 'deduction-analysis',
      name: 'Deduction Analysis',
      description: 'Analysis of all deductions claimed',
      icon: Calculator,
      category: 'DEDUCTION'
    },
    {
      id: 'quarterly-tds',
      name: 'Quarterly TDS Report',
      description: 'Quarter-wise TDS analysis and compliance',
      icon: FileText,
      category: 'TDS'
    }
  ];

  const categories = ['ALL', 'ITR', 'TAX', 'TDS', 'CAPITAL', 'BUSINESS', 'INVESTMENT', 'DEDUCTION'];
  const [activeCategory, setActiveCategory] = useState('ALL');

  const filteredReports = reports.filter(report => 
    activeCategory === 'ALL' || report.category === activeCategory
  );

  const generateReport = (reportId: string) => {
    setSelectedReport(reportId);
  };

  const exportReport = (format: 'pdf' | 'excel' | 'csv') => {
    if (!selectedReport) {
      alert('Please select a report first');
      return;
    }
    console.log(`Exporting ${selectedReport} as ${format}`);
  };

  const printReport = () => {
    if (!selectedReport) {
      alert('Please select a report first');
      return;
    }
    window.print();
  };

  // When a report is selected, scroll preview into view so it "opens" visually
  useEffect(() => {
    if (selectedReport && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedReport]);

  return (
    <div className={`min-h-screen pt-16 ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Print CSS: only print the report preview area */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body * { visibility: hidden !important; }
          #report-preview, #report-preview * { visibility: visible !important; }
          #report-preview { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/app/income-tax')}
              className={`mr-4 p-2 rounded-full ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
              title="Back to Income Tax"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-bold">Income Tax Reports</h1>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={printReport}
              className={`p-2 rounded-md ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
              title="Print Report"
            >
              <Printer size={18} />
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className={`p-2 rounded-md ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
              title="Export as PDF"
            >
              <Download size={18} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={`p-6 rounded-lg mb-8 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h2 className="text-xl font-semibold mb-4">Report Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="assessmentYear" className="block text-sm font-medium mb-1">Assessment Year</label>
              <select
                id="assessmentYear"
                value={filters.assessmentYear}
                onChange={(e) => setFilters({...filters, assessmentYear: e.target.value})}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
                title="Select assessment year"
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
                <option value="2021-22">2021-22</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium mb-1">From Date</label>
              <input
                id="fromDate"
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
                title="Select from date"
              />
            </div>
            
            <div>
              <label htmlFor="toDate" className="block text-sm font-medium mb-1">To Date</label>
              <input
                id="toDate"
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({...filters, toDate: e.target.value})}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
                title="Select to date"
              />
            </div>
            
            <div>
              <label htmlFor="assesseeType" className="block text-sm font-medium mb-1">Assessee Type</label>
              <select
                id="assesseeType"
                value={filters.assesseeType}
                onChange={(e) => setFilters({...filters, assesseeType: e.target.value})}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
                title="Select assessee type"
              >
                <option value="all">All</option>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="partnership">Partnership</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : theme === 'dark'
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Reports Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const IconComponent = report.icon;
            return (
              <div
                key={report.id}
                className={`p-6 rounded-lg cursor-pointer transition-all hover:shadow-lg ${
                  selectedReport === report.id
                    ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700'
                    : 'bg-white hover:bg-gray-50 shadow'
                }`}
                onClick={() => generateReport(report.id)}
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg mr-4 ${
                    selectedReport === report.id
                      ? 'bg-blue-600 text-white'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    <IconComponent size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{report.name}</h3>
                    <span className={`text-xs px-2 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {report.category}
                    </span>
                  </div>
                </div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {report.description}
                </p>
                <div className="mt-4">
                  <button
                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                    onClick={(e) => { e.stopPropagation(); generateReport(report.id); }}
                    title="Open report"
                  >
                    View Report
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Export Options */}
        {selectedReport && (
          <div className={`mt-8 p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h3 className="text-lg font-semibold mb-4">Export Options</h3>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => exportReport('pdf')}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
              >
                Export as PDF
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
              >
                Export as Excel
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              >
                Export as CSV
              </button>
              <button
                onClick={printReport}
                className={`px-6 py-2 rounded-md transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Print Report
              </button>
            </div>
          </div>
        )}

        {/* Report Preview Area */}
        {selectedReport && (
          <div id="report-preview" ref={previewRef} className={`mt-8 p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
            <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
            <ReportViewer reportId={selectedReport} filters={filters} />
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeTaxReports;
