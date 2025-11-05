import React, { useState } from 'react';
import { RefreshCw, AlertTriangle, CheckCircle, FileText, Download, Upload , ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReconciliationItem {
  id: string;
  invoiceNo: string;
  supplierName: string;
  supplierGSTIN: string;
  invoiceDate: string;
  invoiceAmount: number;
  gstAmount: number;
  status: 'matched' | 'mismatched' | 'missing' | 'excess';
  gstr2aAmount?: number;
  difference?: number;
  remarks?: string;
}

const Reconciliation: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'itc' | 'outward' | 'summary'>('itc');
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [filterStatus, setFilterStatus] = useState('all');

  const reconciliationData: ReconciliationItem[] = [
    {
      id: '1',
      invoiceNo: 'INV-2024-001',
      supplierName: 'ABC Suppliers Ltd',
      supplierGSTIN: '27AAAAA0000A1Z5',
      invoiceDate: '2024-01-15',
      invoiceAmount: 100000,
      gstAmount: 18000,
      gstr2aAmount: 18000,
      status: 'matched'
    },
    {
      id: '2',
      invoiceNo: 'INV-2024-002',
      supplierName: 'XYZ Trading Co',
      supplierGSTIN: '27BBBBB1111B2Y4',
      invoiceDate: '2024-01-16',
      invoiceAmount: 75000,
      gstAmount: 13500,
      gstr2aAmount: 12500,
      difference: 1000,
      status: 'mismatched',
      remarks: 'GST amount mismatch'
    },
    {
      id: '3',
      invoiceNo: 'INV-2024-003',
      supplierName: 'PQR Industries',
      supplierGSTIN: '27CCCCC2222C3X3',
      invoiceDate: '2024-01-17',
      invoiceAmount: 50000,
      gstAmount: 9000,
      status: 'missing',
      remarks: 'Not found in GSTR-2A'
    },
    {
      id: '4',
      invoiceNo: 'INV-2024-004',
      supplierName: 'LMN Enterprises',
      supplierGSTIN: '27DDDDD3333D4W2',
      invoiceDate: '2024-01-18',
      invoiceAmount: 0,
      gstAmount: 0,
      gstr2aAmount: 5400,
      status: 'excess',
      remarks: 'Present in GSTR-2A but not in books'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'matched':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'mismatched':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'missing':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'excess':
        return <AlertTriangle className="h-5 w-5 text-blue-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-800';
      case 'mismatched':
        return 'bg-yellow-100 text-yellow-800';
      case 'missing':
        return 'bg-red-100 text-red-800';
      case 'excess':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = reconciliationData.filter(item => 
    filterStatus === 'all' || item.status === filterStatus
  );

  const getSummaryStats = () => {
    const matched = reconciliationData.filter(item => item.status === 'matched').length;
    const mismatched = reconciliationData.filter(item => item.status === 'mismatched').length;
    const missing = reconciliationData.filter(item => item.status === 'missing').length;
    const excess = reconciliationData.filter(item => item.status === 'excess').length;
    
    return { matched, mismatched, missing, excess };
  };

  const stats = getSummaryStats();

  return (
    <div className="min-h-screen pt-[56px] px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">

            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/gst')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Reconciliation</h1>
            </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <RefreshCw className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">GST Reconciliation</h1>
          </div>

          {/* Period Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Period
            </label>
            <select
            title='Select period for reconciliation'
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="current">Current Month (January 2024)</option>
              <option value="previous">Previous Month (December 2023)</option>
              <option value="quarter">Current Quarter (Q4 2023-24)</option>
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'itc', label: 'ITC Reconciliation' },
                { id: 'outward', label: 'Outward Supply' },
                { id: 'summary', label: 'Summary' }
              ].map((tab) => (
                <button
                title='Switch to ' 
                    type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'itc' | 'outward' | 'summary')}
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

          {/* ITC Reconciliation Tab */}
          {activeTab === 'itc' && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <RefreshCw className="h-4 w-4" />
                  Fetch GSTR-2A
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Upload className="h-4 w-4" />
                  Upload Purchase Data
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="h-4 w-4" />
                  Export Report
                </button>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-700">{stats.matched}</div>
                      <div className="text-sm text-green-600">Matched</div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-yellow-700">{stats.mismatched}</div>
                      <div className="text-sm text-yellow-600">Mismatched</div>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-red-700">{stats.missing}</div>
                      <div className="text-sm text-red-600">Missing</div>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-blue-700">{stats.excess}</div>
                      <div className="text-sm text-blue-600">Excess</div>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-4">
                <label className="text-sm font-medium text-gray-700">Filter by status:</label>
                <select
                title='Filter by status'
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="matched">Matched</option>
                  <option value="mismatched">Mismatched</option>
                  <option value="missing">Missing</option>
                  <option value="excess">Excess</option>
                </select>
              </div>

              {/* Reconciliation Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Status</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Invoice No</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Supplier</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">GSTIN</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Date</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Books GST</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">GSTR-2A GST</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Difference</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4 border-b">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(item.status)}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 border-b">
                          <span className="font-medium text-gray-900">{item.invoiceNo}</span>
                        </td>
                        <td className="p-4 border-b">
                          <span className="text-gray-700">{item.supplierName}</span>
                        </td>
                        <td className="p-4 border-b">
                          <span className="font-mono text-sm text-gray-600">{item.supplierGSTIN}</span>
                        </td>
                        <td className="p-4 border-b">
                          <span className="text-gray-700">{item.invoiceDate}</span>
                        </td>
                        <td className="p-4 border-b">
                          <span className="font-medium text-gray-900">
                            {item.gstAmount > 0 ? `₹${item.gstAmount.toLocaleString()}` : '-'}
                          </span>
                        </td>
                        <td className="p-4 border-b">
                          <span className="font-medium text-gray-900">
                            {item.gstr2aAmount ? `₹${item.gstr2aAmount.toLocaleString()}` : '-'}
                          </span>
                        </td>
                        <td className="p-4 border-b">
                          {item.difference ? (
                            <span className={`font-medium ${item.difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{Math.abs(item.difference).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-4 border-b">
                          <span className="text-sm text-gray-600">{item.remarks || '-'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Outward Supply Tab */}
          {activeTab === 'outward' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Outward Supply Reconciliation</h3>
                <p className="text-sm text-blue-700">
                  Compare your sales data with GSTR-1 filed returns to ensure accuracy.
                </p>
              </div>

              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500">Outward supply reconciliation feature coming soon</p>
              </div>
            </div>
          )}

          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">ITC Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total ITC Available (GSTR-2A):</span>
                      <span className="font-medium">₹2,45,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ITC Claimed (Books):</span>
                      <span className="font-medium">₹2,40,500</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Net Difference:</span>
                      <span className="font-medium text-green-600">₹4,500</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Reconciliation Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Invoices:</span>
                      <span className="font-medium">{reconciliationData.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Matched:</span>
                      <span className="font-medium text-green-600">{stats.matched}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Issues Found:</span>
                      <span className="font-medium text-red-600">{stats.mismatched + stats.missing + stats.excess}</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Accuracy Rate:</span>
                      <span className="font-medium text-blue-600">
                        {Math.round((stats.matched / reconciliationData.length) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Action Required</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• {stats.mismatched} invoices have amount mismatches - review and correct</li>
                  <li>• {stats.missing} invoices are missing from GSTR-2A - contact suppliers</li>
                  <li>• {stats.excess} invoices in GSTR-2A not found in books - verify and record</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reconciliation;