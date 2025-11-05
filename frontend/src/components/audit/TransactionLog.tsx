import { useState } from 'react';
import { Search, Filter, Download, Calendar, User, DollarSign, FileText, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TransactionLog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState('today');

  const transactions = [
    {
      id: 'TXN-2024-001',
      timestamp: '2024-01-15 10:30:45',
      user: 'John Doe',
      action: 'Sale Transaction',
      amount: 1250.0,
      status: 'completed',
      module: 'Sales',
      details: 'Invoice #INV-001 created',
      ipAddress: '192.168.1.100',
    },
    {
      id: 'TXN-2024-002',
      timestamp: '2024-01-15 10:25:12',
      user: 'Jane Smith',
      action: 'Purchase Order',
      amount: 3500.0,
      status: 'pending',
      module: 'Purchase',
      details: 'PO #PO-001 created',
      ipAddress: '192.168.1.105',
    },
    {
      id: 'TXN-2024-003',
      timestamp: '2024-01-15 10:20:33',
      user: 'Mike Johnson',
      action: 'Payment Receipt',
      amount: 850.0,
      status: 'completed',
      module: 'Accounts',
      details: 'Payment received for INV-050',
      ipAddress: '192.168.1.110',
    },
    {
      id: 'TXN-2024-004',
      timestamp: '2024-01-15 10:15:21',
      user: 'Sarah Wilson',
      action: 'Inventory Update',
      amount: 0,
      status: 'failed',
      module: 'Inventory',
      details: 'Stock adjustment failed',
      ipAddress: '192.168.1.115',
    },
    {
      id: 'TXN-2024-005',
      timestamp: '2024-01-15 10:10:08',
      user: 'Admin',
      action: 'User Creation',
      amount: 0,
      status: 'completed',
      module: 'User Management',
      details: 'New user account created',
      ipAddress: '192.168.1.1',
    },
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.action.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || transaction.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status:string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
         <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                onClick={() => navigate('/app/audit')}
                className="mr-4 p-2 rounded-full hover:bg-gray-200"
                    >
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Transaction Log</h1>
         </div>
        
        <p className="text-sm text-gray-600 mt-1">Complete audit trail of all system transactions</p>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
            title='Filter'
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              title='Calender'
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>

          <button className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transaction ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Module</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-blue-600">{transaction.id}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{transaction.timestamp}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{transaction.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{transaction.action}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">
                        {transaction.amount > 0 ? transaction.amount.toFixed(2) : '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{transaction.module}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button className="text-green-600 hover:text-green-900">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-sm text-gray-700">
          Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of{' '}
          <span className="font-medium">{filteredTransactions.length}</span> results
        </div>
        <div className="flex flex-wrap space-x-2">
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Previous</button>
          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">1</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">2</button>
          <button className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Next</button>
        </div>
      </div>
    </div>
  );
};

export default TransactionLog;
