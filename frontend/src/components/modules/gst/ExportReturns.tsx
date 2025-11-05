import React, { useState } from 'react';
import { Download, FileText,  CheckCircle, Clock ,ArrowLeft} from 'lucide-react';//Calendar, Filter,
import { useNavigate } from 'react-router-dom';

interface ReturnType {
  id: string;
  name: string;
  description: string;
  frequency: string;
  dueDate: string;
  status: 'ready' | 'pending' | 'filed';
  lastGenerated?: string;
}

const ExportReturns: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState('json');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Export options state
  const [exportOptions, setExportOptions] = useState({
    includeTransactionDetails: true,
    includeTaxCalculations: true,
    includeAmendments: false,
    generateSeparateFiles: false
  });

  const handleExportOptionChange = (option: keyof typeof exportOptions) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleExport = () => {
    if (selectedReturns.length === 0) {
      alert('Please select at least one return to export.');
      return;
    }
    
    // Export logic here
    console.log('Exporting returns:', {
      returns: selectedReturns,
      period: selectedPeriod,
      format: exportFormat,
      customDates: selectedPeriod === 'custom' ? { from: customDateFrom, to: customDateTo } : null,
      options: exportOptions
    });
  };

  const handlePreview = () => {
    if (selectedReturns.length === 0) {
      alert('Please select at least one return to preview.');
      return;
    }
    
    // Preview logic here
    console.log('Previewing returns:', selectedReturns);
  };

  const returnTypes: ReturnType[] = [
    {
      id: 'gstr1',
      name: 'GSTR-1',
      description: 'Details of outward supplies of goods or services',
      frequency: 'Monthly',
      dueDate: '11th of next month',
      status: 'ready',
      lastGenerated: '2024-01-10T10:30:00Z'
    },
    {
      id: 'gstr3b',
      name: 'GSTR-3B',
      description: 'Monthly summary return',
      frequency: 'Monthly',
      dueDate: '20th of next month',
      status: 'ready',
      lastGenerated: '2024-01-15T14:20:00Z'
    },
    {
      id: 'gstr2a',
      name: 'GSTR-2A',
      description: 'Auto-populated return of inward supplies',
      frequency: 'Monthly',
      dueDate: 'Auto-generated',
      status: 'ready'
    },
    {
      id: 'gstr9',
      name: 'GSTR-9',
      description: 'Annual return',
      frequency: 'Annual',
      dueDate: '31st December',
      status: 'pending'
    },
    {
      id: 'gstr4',
      name: 'GSTR-4',
      description: 'Return for composition taxpayers',
      frequency: 'Quarterly',
      dueDate: '18th of next month',
      status: 'pending'
    },
    {
      id: 'gstr5',
      name: 'GSTR-5',
      description: 'Return for non-resident taxable persons',
      frequency: 'Monthly',
      dueDate: '20th of next month',
      status: 'pending'
    }
  ];

  const exportFormats = [
    { value: 'json', label: 'JSON Format', description: 'For GST portal upload' },
    { value: 'excel', label: 'Excel Format', description: 'For analysis and review' },
    { value: 'csv', label: 'CSV Format', description: 'For data processing' },
    { value: 'pdf', label: 'PDF Format', description: 'For printing and records' }
  ];

  const periods = [
    { value: 'current', label: 'Current Month (January 2024)' },
    { value: 'previous', label: 'Previous Month (December 2023)' },
    { value: 'quarter', label: 'Current Quarter (Q4 2023-24)' },
    { value: 'custom', label: 'Custom Period' }
  ];

  const handleReturnSelection = (returnId: string) => {
    setSelectedReturns(prev => 
      prev.includes(returnId) 
        ? prev.filter(id => id !== returnId)
        : [...prev, returnId]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'filed':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'filed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen pt-[56px] px-4">
      <div className="max-w-6xl mx-auto">
         <div className="flex items-center mb-4">

            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/gst')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">GST Returns</h1>
            </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Download className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Export GST Returns</h1>
          </div>

          {/* Period and Format Selection */}          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="selectPeriod" className="block text-sm font-medium text-gray-700 mb-2">
                Select Period
              </label>
              <select
                id="selectPeriod"
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {periods.map(period => (
                  <option key={period.value} value={period.value}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="exportFormat" className="block text-sm font-medium text-gray-700 mb-2">
                Export Format
              </label>
              <select
                id="exportFormat"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {exportFormats.map(format => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {exportFormats.find(f => f.value === exportFormat)?.description}
              </p>
            </div>
          </div>

          {/* Custom Period Selection */}
          {selectedPeriod === 'custom' && (            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>                <input
                  id="fromDate"
                  type="date"
                  value={customDateFrom}
                  onChange={(e) => setCustomDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="toDate" className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>                <input
                  id="toDate"
                  type="date"
                  value={customDateTo}
                  onChange={(e) => setCustomDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Return Types Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Returns to Export</h3>              <div className="flex gap-2">
                <button
                  type='button'
                  onClick={() => setSelectedReturns(returnTypes.filter(r => r.status === 'ready').map(r => r.id))}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Select All Ready
                </button>
                <button
                  type='button'
                  onClick={() => setSelectedReturns([])}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {returnTypes.map((returnType) => (
                <div
                  key={returnType.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedReturns.includes(returnType.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${returnType.status === 'pending' ? 'opacity-60' : ''}`}
                  onClick={() => returnType.status !== 'pending' && handleReturnSelection(returnType.id)}
                >                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        id={`return-${returnType.id}`}
                        type="checkbox"
                        checked={selectedReturns.includes(returnType.id)}
                        onChange={() => handleReturnSelection(returnType.id)}
                        disabled={returnType.status === 'pending'}
                        className="mt-1"
                      />
                      <div>
                        <label htmlFor={`return-${returnType.id}`} className="font-semibold text-gray-900 cursor-pointer">{returnType.name}</label>
                        <p className="text-sm text-gray-600">{returnType.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(returnType.status)}
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(returnType.status)}`}>
                        {returnType.status === 'ready' && 'Ready'}
                        {returnType.status === 'filed' && 'Filed'}
                        {returnType.status === 'pending' && 'Pending'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Frequency:</span>
                      <span className="ml-1 text-gray-900">{returnType.frequency}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Due:</span>
                      <span className="ml-1 text-gray-900">{returnType.dueDate}</span>
                    </div>
                  </div>

                  {returnType.lastGenerated && (
                    <div className="mt-2 text-xs text-gray-500">
                      Last generated: {new Date(returnType.lastGenerated).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>            <div className="space-y-3">
              <label className="flex items-center">
                <input 
                  id="includeTransactionDetails" 
                  type="checkbox" 
                  className="mr-2" 
                  checked={exportOptions.includeTransactionDetails}
                  onChange={() => handleExportOptionChange('includeTransactionDetails')}
                />
                <span className="text-sm text-gray-700">Include transaction details</span>
              </label>
              <label className="flex items-center">
                <input 
                  id="includeTaxCalculations" 
                  type="checkbox" 
                  className="mr-2" 
                  checked={exportOptions.includeTaxCalculations}
                  onChange={() => handleExportOptionChange('includeTaxCalculations')}
                />
                <span className="text-sm text-gray-700">Include tax calculations</span>
              </label>
              <label className="flex items-center">
                <input 
                  id="includeAmendments" 
                  type="checkbox" 
                  className="mr-2" 
                  checked={exportOptions.includeAmendments}
                  onChange={() => handleExportOptionChange('includeAmendments')}
                />
                <span className="text-sm text-gray-700">Include amendments and corrections</span>
              </label>
              <label className="flex items-center">
                <input 
                  id="generateSeparateFiles" 
                  type="checkbox" 
                  className="mr-2" 
                  checked={exportOptions.generateSeparateFiles}
                  onChange={() => handleExportOptionChange('generateSeparateFiles')}
                />
                <span className="text-sm text-gray-700">Generate separate files for each return</span>
              </label>
            </div>
          </div>

          {/* Export Summary */}
          {selectedReturns.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Export Summary</h4>
              <div className="text-sm text-blue-700">
                <p>Selected returns: {selectedReturns.length}</p>
                <p>Period: {periods.find(p => p.value === selectedPeriod)?.label}</p>
                <p>Format: {exportFormats.find(f => f.value === exportFormat)?.label}</p>
              </div>
            </div>
          )}

          {/* Export Actions */}          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type='button'
              disabled={selectedReturns.length === 0}
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Selected Returns
            </button>
            <button 
              type="button"
              onClick={handlePreview}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Preview Before Export
            </button>
          </div>

          {/* Recent Exports */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exports</h3>
            <div className="space-y-3">
              {[
                { name: 'GSTR-1_Jan2024.json', date: '2024-01-15', size: '2.3 MB', status: 'completed' },
                { name: 'GSTR-3B_Jan2024.xlsx', date: '2024-01-14', size: '1.8 MB', status: 'completed' },
                { name: 'GSTR-2A_Dec2023.csv', date: '2024-01-10', size: '3.1 MB', status: 'completed' }
              ].map((export_, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium text-gray-900">{export_.name}</div>
                      <div className="text-sm text-gray-600">
                        {export_.date} • {export_.size}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {export_.status}
                    </span>                    <button 
                      type="button" 
                      className="text-blue-600 hover:text-blue-800 text-sm"
                      aria-label={`Download ${export_.name}`}
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReturns;