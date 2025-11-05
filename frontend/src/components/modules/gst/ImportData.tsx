import React, { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Download, RefreshCw,ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ImportHistory {
  id: string;
  fileName: string;
  type: string;
  status: 'success' | 'error' | 'processing';
  recordsProcessed: number;
  totalRecords: number;
  importDate: string;
  errors?: string[];
}

const ImportData: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'upload' | 'history' | 'templates'>('upload');
  const navigate = useNavigate();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState('invoices');

  const importHistory: ImportHistory[] = [
    {
      id: '1',
      fileName: 'sales_invoices_jan2024.xlsx',
      type: 'Sales Invoices',
      status: 'success',
      recordsProcessed: 150,
      totalRecords: 150,
      importDate: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      fileName: 'purchase_invoices_jan2024.csv',
      type: 'Purchase Invoices',
      status: 'error',
      recordsProcessed: 45,
      totalRecords: 100,
      importDate: '2024-01-14T14:20:00Z',
      errors: ['Invalid GST number in row 46', 'Missing HSN code in row 67', 'Invalid date format in row 89']
    },
    {
      id: '3',
      fileName: 'customer_master.xlsx',
      type: 'Customer Master',
      status: 'processing',
      recordsProcessed: 75,
      totalRecords: 200,
      importDate: '2024-01-16T09:15:00Z'
    }
  ];

  const importTemplates = [
    {
      name: 'Sales Invoices',
      description: 'Import sales invoices with GST details',
      fields: ['Invoice No', 'Date', 'Customer Name', 'GSTIN', 'Amount', 'GST Rate', 'HSN Code'],
      format: 'Excel/CSV'
    },
    {
      name: 'Purchase Invoices',
      description: 'Import purchase invoices from suppliers',
      fields: ['Invoice No', 'Date', 'Supplier Name', 'GSTIN', 'Amount', 'GST Rate', 'HSN Code'],
      format: 'Excel/CSV'
    },
    {
      name: 'Customer Master',
      description: 'Import customer master data',
      fields: ['Customer Name', 'GSTIN', 'Address', 'State', 'Email', 'Phone'],
      format: 'Excel/CSV'
    },
    {
      name: 'Supplier Master',
      description: 'Import supplier master data',
      fields: ['Supplier Name', 'GSTIN', 'Address', 'State', 'Email', 'Phone'],
      format: 'Excel/CSV'
    },
    {
      name: 'Item Master',
      description: 'Import item/product master data',
      fields: ['Item Name', 'HSN Code', 'GST Rate', 'Unit', 'Description'],
      format: 'Excel/CSV'
    }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
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
                <h1 className="text-2xl font-bold">Import</h1>
            </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Upload className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Import Data</h1>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'upload', label: 'Upload Data' },
                { id: 'history', label: 'Import History' },
                { id: 'templates', label: 'Templates' }
              ].map((tab) => (
                <button
                title='Switch to '
                    type='button'
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'upload' | 'history' | 'templates')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Import Type
                </label>
                <select
                title='Select Import Type'
                  value={importType}
                  onChange={(e) => setImportType(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="invoices">Sales Invoices</option>
                  <option value="purchases">Purchase Invoices</option>
                  <option value="customers">Customer Master</option>
                  <option value="suppliers">Supplier Master</option>
                  <option value="items">Item Master</option>
                </select>
              </div>

              {/* File Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your file here, or click to browse
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Supports Excel (.xlsx) and CSV (.csv) files up to 10MB
                </p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  Choose File
                </label>
              </div>

              {/* Selected File */}
              {selectedFile && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{selectedFile.name}</div>
                        <div className="text-sm text-gray-600">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}

              {/* Import Options */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-3">Import Options</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">Skip duplicate records</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" />
                    <span className="text-sm text-gray-700">Update existing records</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">Validate GST numbers</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-2" defaultChecked />
                    <span className="text-sm text-gray-700">Generate error report</span>
                  </label>
                </div>
              </div>

              {/* Import Button */}
              <div className="flex justify-end">
                <button
                  disabled={!selectedFile}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Start Import
                </button>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Import History</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              <div className="space-y-4">
                {importHistory.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <h4 className="font-medium text-gray-900">{item.fileName}</h4>
                          <p className="text-sm text-gray-600">{item.type}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status === 'success' && 'Completed'}
                        {item.status === 'error' && 'Failed'}
                        {item.status === 'processing' && 'Processing'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Records Processed</div>
                        <div className="text-sm font-medium text-gray-900">
                          {item.recordsProcessed} / {item.totalRecords}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Import Date</div>
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(item.importDate).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wide">Success Rate</div>
                        <div className="text-sm font-medium text-gray-900">
                          {Math.round((item.recordsProcessed / item.totalRecords) * 100)}%
                        </div>
                      </div>
                    </div>

                    {item.status === 'processing' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round((item.recordsProcessed / item.totalRecords) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(item.recordsProcessed / item.totalRecords) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {item.errors && item.errors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <h5 className="font-medium text-red-900 mb-2">Errors ({item.errors.length})</h5>
                        <ul className="text-sm text-red-700 space-y-1">
                          {item.errors.slice(0, 3).map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                          {item.errors.length > 3 && (
                            <li className="text-red-600">... and {item.errors.length - 3} more errors</li>
                          )}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button className="text-sm text-blue-600 hover:text-blue-800">
                        View Details
                      </button>
                      {item.status === 'error' && (
                        <button className="text-sm text-red-600 hover:text-red-800">
                          Download Error Report
                        </button>
                      )}
                      {item.status === 'success' && (
                        <button className="text-sm text-green-600 hover:text-green-800">
                          Download Summary
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Import Templates</h3>
                <p className="text-sm text-blue-700">
                  Download these templates to ensure your data is in the correct format for import.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {importTemplates.map((template, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {template.format}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Required Fields:</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.fields.map((field, fieldIndex) => (
                          <span key={fieldIndex} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                        <Download className="h-4 w-4" />
                        Download Excel
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                        <Download className="h-4 w-4" />
                        Download CSV
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Import Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Ensure all required fields are filled</li>
                  <li>• Use the exact column headers as shown in templates</li>
                  <li>• GST numbers should be in 15-digit format (e.g., 27AAAAA0000A1Z5)</li>
                  <li>• Dates should be in DD/MM/YYYY format</li>
                  <li>• Amount fields should contain only numeric values</li>
                  <li>• HSN codes should be 4, 6, or 8 digits</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportData;