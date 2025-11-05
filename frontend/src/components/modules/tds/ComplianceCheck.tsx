import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Calendar, Download ,ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ComplianceItem {
  id: string;
  title: string;
  description: string;
  status: 'compliant' | 'warning' | 'critical' | 'pending';
  dueDate?: string;
  lastUpdated?: string;
  action?: string;
}

const ComplianceCheck: React.FC = () => {
    const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [activeTab, setActiveTab] = useState<'overview' | 'returns' | 'payments' | 'certificates'>('overview');

  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      title: 'Form 24Q Filing',
      description: 'Quarterly TDS return for salary payments',
      status: 'compliant',
      dueDate: '2024-01-31',
      lastUpdated: '2024-01-15',
      action: 'Filed on time'
    },
    {
      id: '2',
      title: 'Form 26Q Filing',
      description: 'Quarterly TDS return for non-salary payments',
      status: 'warning',
      dueDate: '2024-01-31',
      lastUpdated: '2024-01-30',
      action: 'Filed with delay'
    },
    {
      id: '3',
      title: 'Form 27Q Filing',
      description: 'Quarterly TCS return',
      status: 'compliant',
      dueDate: '2024-01-31',
      lastUpdated: '2024-01-20',
      action: 'Filed on time'
    },
    {
      id: '4',
      title: 'TDS Payment',
      description: 'Monthly TDS deposit to government',
      status: 'critical',
      dueDate: '2024-01-07',
      action: 'Payment overdue'
    },
    {
      id: '5',
      title: 'Form 16 Generation',
      description: 'Annual TDS certificate for employees',
      status: 'pending',
      dueDate: '2024-05-31',
      action: 'Due for FY 2023-24'
    },
    {
      id: '6',
      title: 'Form 16A Generation',
      description: 'TDS certificate for non-salary payments',
      status: 'compliant',
      lastUpdated: '2024-01-25',
      action: 'Generated for Q3'
    },
    {
      id: '7',
      title: 'TAN Registration',
      description: 'Tax Deduction Account Number validity',
      status: 'compliant',
      lastUpdated: '2024-01-01',
      action: 'Valid and active'
    },
    {
      id: '8',
      title: 'Challan Upload',
      description: 'Upload TDS payment challans',
      status: 'warning',
      dueDate: '2024-01-10',
      action: 'Some challans pending'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'compliant':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplianceScore = () => {
    const compliant = complianceItems.filter(item => item.status === 'compliant').length;
    return Math.round((compliant / complianceItems.length) * 100);
  };

  const upcomingDeadlines = complianceItems
    .filter(item => item.dueDate && new Date(item.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 3);

  return (
    <div className="min-h-screen pt-[56px] px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
                    <button
                        title='Back to Reports'
                        type='button'
                          onClick={() => navigate('/app/tds')}
                          className="mr-4 p-2 rounded-full hover:bg-gray-200"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold">Form 16</h1>
                    </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">TDS Compliance Check</h1>
          </div>

          {/* Period Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Period
            </label>
            <select
            title='Select Period'
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="current">Current Quarter (Q4 2023-24)</option>
              <option value="previous">Previous Quarter (Q3 2023-24)</option>
              <option value="year">Financial Year (2023-24)</option>
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'returns', label: 'Returns' },
                { id: 'payments', label: 'Payments' },
                { id: 'certificates', label: 'Certificates' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'overview' )}
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

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Compliance Score */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{getComplianceScore()}%</div>
                      <div className="text-blue-100">Compliance Score</div>
                    </div>
                    <Shield className="h-12 w-12 text-blue-200" />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {complianceItems.filter(item => item.status === 'compliant').length}
                      </div>
                      <div className="text-gray-600">Compliant Items</div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold text-red-600">
                        {complianceItems.filter(item => item.status === 'critical').length}
                      </div>
                      <div className="text-gray-600">Critical Issues</div>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </div>
              </div>

              {/* Upcoming Deadlines */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Upcoming Deadlines
                </h3>
                <div className="space-y-3">
                  {upcomingDeadlines.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                      <div>
                        <div className="font-medium text-gray-900">{item.title}</div>
                        <div className="text-sm text-gray-600">{item.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-yellow-700">
                          Due: {new Date(item.dueDate!).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.ceil((new Date(item.dueDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compliance Items */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Compliance Status</h3>
                {complianceItems.map((item) => (
                  <div key={item.id} className={`border rounded-lg p-4 ${getStatusColor(item.status)}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getStatusIcon(item.status)}
                        <div>
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm opacity-80 mt-1">{item.description}</p>
                          {item.action && (
                            <p className="text-sm font-medium mt-2">{item.action}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        {item.dueDate && (
                          <div>Due: {new Date(item.dueDate).toLocaleDateString()}</div>
                        )}
                        {item.lastUpdated && (
                          <div className="opacity-75">Updated: {new Date(item.lastUpdated).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Returns Tab */}
          {activeTab === 'returns' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['Form 24Q', 'Form 26Q', 'Form 27Q'].map((returnType) => (
                  <div key={returnType} className="bg-gray-50 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">{returnType}</h3>
                      <FileText className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Status:</span>
                        <span className="font-medium text-green-600">Filed</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Due Date:</span>
                        <span>31 Jan 2024</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Filed On:</span>
                        <span>30 Jan 2024</span>
                      </div>
                    </div>
                    <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      View Return
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  <div>
                    <h3 className="font-semibold text-red-900">Payment Overdue</h3>
                    <p className="text-sm text-red-700">TDS payment of ₹2,50,000 is overdue by 3 days</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Month</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">TDS Amount</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Due Date</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Payment Date</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Status</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 border-b">Jan 2024</td>
                      <td className="p-4 border-b">₹2,50,000</td>
                      <td className="p-4 border-b">07 Feb 2024</td>
                      <td className="p-4 border-b">-</td>
                      <td className="p-4 border-b">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Overdue
                        </span>
                      </td>
                      <td className="p-4 border-b">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Pay Now</button>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 border-b">Dec 2023</td>
                      <td className="p-4 border-b">₹2,30,000</td>
                      <td className="p-4 border-b">07 Jan 2024</td>
                      <td className="p-4 border-b">05 Jan 2024</td>
                      <td className="p-4 border-b">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Paid
                        </span>
                      </td>
                      <td className="p-4 border-b">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">View Challan</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Certificates Tab */}
          {activeTab === 'certificates' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">TDS Certificates</h3>
                <p className="text-sm text-blue-700">
                  Generate and download TDS certificates for employees and vendors
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Form 16 (Salary)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Employees:</span>
                      <span className="font-medium">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certificates Generated:</span>
                      <span className="font-medium text-green-600">156</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">For Period:</span>
                      <span className="font-medium">FY 2023-24</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Generate Form 16
                  </button>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Form 16A (Non-Salary)</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Deductees:</span>
                      <span className="font-medium">85</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Certificates Generated:</span>
                      <span className="font-medium text-green-600">85</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">For Quarter:</span>
                      <span className="font-medium">Q3 2023-24</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Generate Form 16A
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Recent Certificates</h4>
                <div className="space-y-2">
                  {[
                    { name: 'Form 16 - Q3 2023-24', date: '2024-01-15', count: '156 certificates' },
                    { name: 'Form 16A - Q3 2023-24', date: '2024-01-20', count: '85 certificates' },
                    { name: 'Form 16A - Q2 2023-24', date: '2023-10-15', count: '78 certificates' }
                  ].map((cert, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <div>
                          <div className="font-medium text-gray-900">{cert.name}</div>
                          <div className="text-sm text-gray-600">{cert.date} • {cert.count}</div>
                        </div>
                      </div>
                      <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm">
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceCheck;