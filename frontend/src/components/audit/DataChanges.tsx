import  { useState } from 'react';
import { Search, Calendar, Database, User, Edit, Trash2, Plus, Eye ,ArrowLeft} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DataChanges = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [operationFilter, setOperationFilter] = useState('all');
  const [moduleFilter, setModuleFilter] = useState('all');

  const dataChanges = [
    {
      id: 1,
      timestamp: '2024-01-15 10:45:12',
      user: 'John Doe',
      operation: 'UPDATE',
      table: 'customers',
      recordId: 'CUST-001',
      field: 'email',
      oldValue: 'old@email.com',
      newValue: 'new@email.com',
      module: 'CRM',
      ipAddress: '192.168.1.100',
      reason: 'Customer request'
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:30:25',
      user: 'Jane Smith',
      operation: 'INSERT',
      table: 'products',
      recordId: 'PROD-125',
      field: 'name',
      oldValue: null,
      newValue: 'New Product XYZ',
      module: 'Inventory',
      ipAddress: '192.168.1.105',
      reason: 'New product addition'
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:15:33',
      user: 'Mike Johnson',
      operation: 'DELETE',
      table: 'invoices',
      recordId: 'INV-089',
      field: 'status',
      oldValue: 'draft',
      newValue: null,
      module: 'Sales',
      ipAddress: '192.168.1.110',
      reason: 'Duplicate invoice'
    },
    {
      id: 4,
      timestamp: '2024-01-15 10:00:55',
      user: 'Sarah Wilson',
      operation: 'UPDATE',
      table: 'users',
      recordId: 'USER-025',
      field: 'role',
      oldValue: 'user',
      newValue: 'admin',
      module: 'User Management',
      ipAddress: '192.168.1.115',
      reason: 'Role promotion'
    },
    {
      id: 5,
      timestamp: '2024-01-15 09:45:10',
      user: 'Admin',
      operation: 'UPDATE',
      table: 'settings',
      recordId: 'SET-001',
      field: 'backup_frequency',
      oldValue: 'daily',
      newValue: 'hourly',
      module: 'System',
      ipAddress: '192.168.1.1',
      reason: 'Security enhancement'
    }
  ];

  const filteredChanges = dataChanges.filter(change => {
    const matchesSearch = change.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      change.recordId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOperation = operationFilter === 'all' || change.operation === operationFilter;
    const matchesModule = moduleFilter === 'all' || change.module === moduleFilter;
    return matchesSearch && matchesOperation && matchesModule;
  });

  const getOperationIcon = (operation:string) => {
    switch (operation) {
      case 'INSERT':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'UPDATE':
        return <Edit className="h-4 w-4 text-blue-600" />;
      case 'DELETE':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Database className="h-4 w-4 text-gray-600" />;
    }
  };

  const getOperationColor = (operation :string) => {
    switch (operation) {
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalChanges = filteredChanges.length;
  const insertions = filteredChanges.filter(c => c.operation === 'INSERT').length;
  const updates = filteredChanges.filter(c => c.operation === 'UPDATE').length;
  const deletions = filteredChanges.filter(c => c.operation === 'DELETE').length;

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
                    <h2 className="text-xl font-semibold text-gray-900">Data Changes Audit</h2>
                 </div>
        
        <p className="text-sm text-gray-600 mt-1">Track all data modifications and database changes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {/* Total */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <Database className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Changes</h3>
              <p className="text-2xl font-bold text-gray-900">{totalChanges}</p>
            </div>
          </div>
        </div>

        {/* Insertions */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Plus className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Insertions</h3>
              <p className="text-2xl font-bold text-gray-900">{insertions}</p>
            </div>
          </div>
        </div>

        {/* Updates */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Edit className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Updates</h3>
              <p className="text-2xl font-bold text-gray-900">{updates}</p>
            </div>
          </div>
        </div>

        {/* Deletions */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Deletions</h3>
              <p className="text-2xl font-bold text-gray-900">{deletions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 gap-y-4">
          <div className="relative w-full min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search changes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="w-full min-w-0">
            <select
            title='operation'
              value={operationFilter}
              onChange={(e) => setOperationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Operations</option>
              <option value="INSERT">Insertions</option>
              <option value="UPDATE">Updates</option>
              <option value="DELETE">Deletions</option>
            </select>
          </div>

          <div className="w-full min-w-0">
            <select
            title='filter'
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Modules</option>
              <option value="CRM">CRM</option>
              <option value="Sales">Sales</option>
              <option value="Inventory">Inventory</option>
              <option value="User Management">User Management</option>
              <option value="System">System</option>
            </select>
          </div>

          <div className="relative w-full min-w-0">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
            title='date'
             className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Changes Table */}
      <div className="bg-white border rounded-lg">
        <div className="w-full overflow-x-auto md:overflow-x-visible">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50 border-b">
              <tr>
                {[
                  'Timestamp', 'User', 'Operation', 'Table', 'Record ID',
                  'Field', 'Changes', 'Module', 'Actions'
                ].map((title) => (
                  <th key={title} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider break-words">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredChanges.map((change) => (
                <tr key={change.id} className="hover:bg-gray-50 align-top">
                  <td className="px-4 py-3 text-sm text-gray-900 break-words">{change.timestamp}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 break-words">
                    <div className="flex items-center">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      {change.user}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 break-words">
                    <div className="flex items-center">
                      {getOperationIcon(change.operation)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getOperationColor(change.operation)}`}>
                        {change.operation}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 break-words">{change.table}</td>
                  <td className="px-4 py-3 text-sm font-medium text-blue-600 break-words">{change.recordId}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 break-words">{change.field}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 break-words">
                    {change.oldValue && <div className="text-red-600">- {change.oldValue}</div>}
                    {change.newValue && <div className="text-green-600">+ {change.newValue}</div>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 break-words">{change.module}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <button className="text-blue-600 hover:text-blue-900 flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Text */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Click "View" on any change to see detailed information including reason and full context
        </p>
      </div>
    </div>
  );
};

export default DataChanges;
