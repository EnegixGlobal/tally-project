import React, { useState } from 'react';
import { FileText, Download, Search, Calendar, Users,ArrowLeft } from 'lucide-react'; //, Filter
import { useNavigate } from 'react-router-dom';

interface Employee {
  id: string;
  name: string;
  employeeId: string;
  pan: string;
  designation: string;
  department: string;
  grossSalary: number;
  tdsDeducted: number;
  form16Status: 'generated' | 'pending' | 'sent';
  lastGenerated?: string;
}

const Form16: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState('2023-24');

  const employees: Employee[] = [
    {
      id: '1',
      name: 'John Doe',
      employeeId: 'EMP001',
      pan: 'ABCDE1234F',
      designation: 'Software Engineer',
      department: 'IT',
      grossSalary: 1200000,
      tdsDeducted: 125000,
      form16Status: 'generated',
      lastGenerated: '2024-05-15'
    },
    {
      id: '2',
      name: 'Jane Smith',
      employeeId: 'EMP002',
      pan: 'FGHIJ5678K',
      designation: 'Senior Manager',
      department: 'Finance',
      grossSalary: 1800000,
      tdsDeducted: 285000,
      form16Status: 'generated',
      lastGenerated: '2024-05-15'
    },
    {
      id: '3',
      name: 'Mike Johnson',
      employeeId: 'EMP003',
      pan: 'LMNOP9012Q',
      designation: 'Marketing Executive',
      department: 'Marketing',
      grossSalary: 800000,
      tdsDeducted: 45000,
      form16Status: 'pending'
    },
    {
      id: '4',
      name: 'Sarah Wilson',
      employeeId: 'EMP004',
      pan: 'RSTUV3456W',
      designation: 'HR Manager',
      department: 'HR',
      grossSalary: 1500000,
      tdsDeducted: 195000,
      form16Status: 'sent',
      lastGenerated: '2024-05-10'
    }
  ];

  const departments = ['all', ...Array.from(new Set(employees.map(emp => emp.department)))];
  // const statuses = ['all', 'generated', 'pending', 'sent'];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.pan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    const matchesStatus = selectedStatus === 'all' || employee.form16Status === selectedStatus;
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'generated':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSummaryStats = () => {
    const total = employees.length;
    const generated = employees.filter(emp => emp.form16Status === 'generated').length;
    const pending = employees.filter(emp => emp.form16Status === 'pending').length;
    const sent = employees.filter(emp => emp.form16Status === 'sent').length;
    
    return { total, generated, pending, sent };
  };

  const stats = getSummaryStats();

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
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Form 16 - TDS Certificate</h1>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-700">{stats.total}</div>
                  <div className="text-sm text-blue-600">Total Employees</div>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-700">{stats.generated}</div>
                  <div className="text-sm text-green-600">Generated</div>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                  <div className="text-sm text-yellow-600">Pending</div>
                </div>
                <Calendar className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-purple-700">{stats.sent}</div>
                  <div className="text-sm text-purple-600">Sent to Employees</div>
                </div>
                <Download className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
            title='fy'
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="2023-24">FY 2023-24</option>
              <option value="2022-23">FY 2022-23</option>
              <option value="2021-22">FY 2021-22</option>
            </select>

            <select
            title='All '
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Departments</option>
              {departments.slice(1).map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>

            <select
            title='All Status'
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="generated">Generated</option>
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FileText className="h-4 w-4" />
              Generate All Form 16
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="h-4 w-4" />
              Download All
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-4 w-4" />
              Send to Employees
            </button>
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredEmployees.length} of {employees.length} employees
            </p>
          </div>

          {/* Employees Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Employee</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Employee ID</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">PAN</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Department</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Gross Salary</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">TDS Deducted</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Status</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b">
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-600">{employee.designation}</div>
                      </div>
                    </td>
                    <td className="p-4 border-b">
                      <span className="font-mono text-sm text-gray-900">{employee.employeeId}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="font-mono text-sm text-gray-900">{employee.pan}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="text-gray-700">{employee.department}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="font-medium text-gray-900">₹{employee.grossSalary.toLocaleString()}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="font-medium text-gray-900">₹{employee.tdsDeducted.toLocaleString()}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(employee.form16Status)}`}>
                        {employee.form16Status}
                      </span>
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex gap-2">
                        {employee.form16Status === 'pending' ? (
                          <button className="text-blue-600 hover:text-blue-800 text-sm">Generate</button>
                        ) : (
                          <>
                            <button className="text-green-600 hover:text-green-800 text-sm">Download</button>
                            <button className="text-blue-600 hover:text-blue-800 text-sm">Send</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredEmployees.length === 0 && (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No employees found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Form 16 Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Form 16 Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What is Form 16?</h4>
              <p className="text-sm text-gray-600">
                Form 16 is a TDS certificate issued by employers to employees showing the tax deducted from their salary during a financial year. It's mandatory for all employees whose tax has been deducted.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Key Components</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Employee and employer details</li>
                <li>• Salary breakup and allowances</li>
                <li>• Tax deducted month-wise</li>
                <li>• Investment declarations</li>
                <li>• Net taxable income</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form16;