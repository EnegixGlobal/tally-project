import React, { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Clock, FileText, Calendar ,ArrowLeft} from 'lucide-react';
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
  const [selectedPeriod, setSelectedPeriod] = useState('current');
    const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'returns' | 'payments' | 'reconciliation'>('overview');

  const complianceItems: ComplianceItem[] = [
    {
      id: '1',
      title: 'GSTR-1 Filing',
      description: 'Monthly return for outward supplies',
      status: 'compliant',
      dueDate: '2024-01-11',
      lastUpdated: '2024-01-10',
      action: 'Filed on time'
    },
    {
      id: '2',
      title: 'GSTR-3B Filing',
      description: 'Monthly summary return',
      status: 'warning',
      dueDate: '2024-01-20',
      lastUpdated: '2024-01-15',
      action: 'Filed with delay'
    },
    {
      id: '3',
      title: 'GST Payment',
      description: 'Monthly GST liability payment',
      status: 'critical',
      dueDate: '2024-01-20',
      action: 'Payment pending'
    },
    {
      id: '4',
      title: 'Input Tax Credit Reconciliation',
      description: 'ITC reconciliation with GSTR-2A',
      status: 'pending',
      dueDate: '2024-01-25',
      action: 'Reconciliation required'
    },
    {
      id: '5',
      title: 'E-way Bill Compliance',
      description: 'E-way bill generation for goods movement',
      status: 'compliant',
      lastUpdated: '2024-01-18',
      action: 'All bills generated'
    },
    {
      id: '6',
      title: 'Annual Return (GSTR-9)',
      description: 'Annual return filing',
      status: 'pending',
      dueDate: '2024-12-31',
      action: 'Due for FY 2023-24'
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
                  onClick={() => navigate('/app/gst')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Compliance</h1>
            </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">GST Compliance Check</h1>
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
              <option value="current">Current Month (January 2024)</option>
              <option value="previous">Previous Month (December 2023)</option>
              <option value="quarter">Current Quarter (Q4 2023-24)</option>
              <option value="year">Financial Year (2023-24)</option>
            </select>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {([
                { id: 'overview', label: 'Overview' },
                { id: 'returns', label: 'Returns' },
                { id: 'payments', label: 'Payments' },
                { id: 'reconciliation', label: 'Reconciliation' }
              ] as { id: 'overview' | 'returns' | 'payments' | 'reconciliation'; label: string }[]).map((tab) => (
                <button
                title='Switch to Tab'
                  type='button'
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['GSTR-1', 'GSTR-3B', 'GSTR-9'].map((returnType) => (
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
                        <span>11 Jan 2024</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Filed On:</span>
                        <span>10 Jan 2024</span>
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
                    <p className="text-sm text-red-700">GST payment of ₹1,25,000 is overdue by 5 days</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Period</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Tax Type</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Amount</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Due Date</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Status</th>
                      <th className="text-left p-4 border-b font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 border-b">Jan 2024</td>
                      <td className="p-4 border-b">CGST</td>
                      <td className="p-4 border-b">₹62,500</td>
                      <td className="p-4 border-b">20 Jan 2024</td>
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
                      <td className="p-4 border-b">Jan 2024</td>
                      <td className="p-4 border-b">SGST</td>
                      <td className="p-4 border-b">₹62,500</td>
                      <td className="p-4 border-b">20 Jan 2024</td>
                      <td className="p-4 border-b">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Overdue
                        </span>
                      </td>
                      <td className="p-4 border-b">
                        <button className="text-blue-600 hover:text-blue-800 text-sm">Pay Now</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reconciliation Tab */}
          {activeTab === 'reconciliation' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">ITC Reconciliation Status</h3>
                <p className="text-sm text-blue-700">
                  Reconcile your Input Tax Credit with GSTR-2A to ensure accurate claims
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">ITC Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ITC Available (GSTR-2A):</span>
                      <span className="font-medium">₹2,45,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">ITC Claimed (GSTR-3B):</span>
                      <span className="font-medium">₹2,40,000</span>
                    </div>
                    <div className="flex justify-between border-t pt-3">
                      <span className="text-gray-600">Difference:</span>
                      <span className="font-medium text-green-600">₹5,000</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Reconciliation Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Download GSTR-2A
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Generate Reconciliation Report
                    </button>
                    <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      View Mismatched Invoices
                    </button>
                  </div>
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