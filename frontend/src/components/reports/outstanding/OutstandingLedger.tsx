import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { Search, Filter, Download, Calendar, Clock, AlertTriangle } from 'lucide-react';
import type { Ledger } from '../../../types';

interface OutstandingLedgerData {
  id: number;
  ledgerName: string;
  entries: {
    id: number;
    date: string;
    refNo: string;
    particular: string;
    openingAmount: number;
    pendingAmount: number;
    dueOn: string;
    overdueByDays: number;
  }[];
}

const OutstandingLedger: React.FC = () => {
  const { theme } = useAppContext();
  const [selectedLedger] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  const [type] = useState<'sales' | 'purchase'>('sales');
  const [ledgerName, setLedgerName] = useState('');
  const [from] = useState('');
  const [to] = useState('');
  const [sortBy] = useState<'amount' | 'overdue' | 'party' | 'date'>('amount');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');

  const [data, setData] = useState<any[]>([]);



  const [ledgers, setLedgers] = useState<Ledger[]>([]);
const companyId = localStorage.getItem('company_id') || localStorage.getItem('company_id');
        const ownerType = localStorage.getItem('userType') || localStorage.getItem('userType');
        console.log(ownerType);
        const ownerId = ownerType === 'employee'
          ? localStorage.getItem('employee_id') || localStorage.getItem('employee_id')
          : localStorage.getItem('user_id') || localStorage.getItem('user_id');

  // Mock ledger options
    const [outstandingData] = useState<OutstandingLedgerData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

  // Mock outstanding data - grouped by ledger
  
   useEffect(() => {
    async function fetchOutstanding() {
      if (!companyId || !ownerType || !ownerId) {
        setError('Missing tenant info');
        return;
      }
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type,
        companyId,
        ownerType,
        ownerId,
        sortBy,
        sortOrder,
      });
      if (ledgerName) params.append('ledgerName', ledgerName);
      if (searchTerm) params.append('searchTerm', searchTerm);
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outstanding-ledger?${params.toString()}`);
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOutstanding();
  }, [type, ledgerName, from, to, sortBy, sortOrder, companyId, ownerType, ownerId]);

  useEffect(() => {
      const fetchLedgers = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ledger?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`);
          const data = await res.json();
          setLedgers(data);
        } catch (err) {
          console.error("Failed to load ledgers", err);
        }
      };
  
      fetchLedgers();
    }, []);
  
  const filteredData = outstandingData.filter(ledger => {
    const matchesLedger = !selectedLedger || ledger.ledgerName === selectedLedger;
    const matchesSearch = !searchTerm || 
      ledger.entries.some(entry => 
        entry.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.particular.toLowerCase().includes(searchTerm.toLowerCase())
      ) ||
      ledger.ledgerName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLedger && matchesSearch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getOverdueStatus = (days: number) => {
    if (days === 0) {
      return { text: 'Current', color: 'green' };
    } else if (days <= 30) {
      return { text: `${days} days`, color: 'yellow' };
    } else if (days <= 60) {
      return { text: `${days} days`, color: 'orange' };
    } else {
      return { text: `${days} days`, color: 'red' };
    }
  };

  const totalPending = filteredData.reduce((sum, ledger) => 
    sum + ledger.entries.reduce((entrySum, entry) => entrySum + entry.pendingAmount, 0), 0
  );
  
  const overdueAmount = filteredData.reduce((sum, ledger) => 
    sum + ledger.entries
      .filter(entry => entry.overdueByDays > 0)
      .reduce((entrySum, entry) => entrySum + entry.pendingAmount, 0), 0
  );

  const totalEntries = filteredData.reduce((sum, ledger) => sum + ledger.entries.length, 0);

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className={`rounded-xl border p-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Filters
        </h3>
        {loading && <div className="py-6 text-center">Loading...</div>}
        {error && <div className="py-6 text-center text-red-600">{error}</div>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ledger Dropdown */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Select Ledger
            </label>
            <select
  name="ledgerId"
  value={ledgerName}
  onChange={e => setLedgerName(e.target.value)}
  required
  title="Select party ledger"
  className={`w-full p-2 rounded border ${
    theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'
  } focus:border-blue-500 focus:ring-blue-500`}
>
  <option value="">Select Party Ledger</option>
  {ledgers.filter(l => l.type !== 'cash' && l.type !== 'bank').map((ledger: Ledger) => (
    <option key={ledger.id} value={ledger.name}>{ledger.name}</option>
  ))}
</select>

          </div>

          {/* Search */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Search
            </label>
            <div className="relative">
              <Search className={`absolute left-3 top-2.5 w-4 h-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search by Ref No..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  theme === 'dark'
                    ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
          </div>

          {/* Date From */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              From Date
            </label>
            <input
              title="From Date"
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>

          {/* Date To */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              To Date
            </label>
            <input
              title="To Date"
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
              }`}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <div className="flex space-x-2">
            <button className={`px-4 py-2 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}>
              <Filter className="w-4 h-4 mr-2 inline" />
              Clear Filters
            </button>
          </div>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4 mr-2 inline" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`rounded-xl border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Total Pending
              </h3>
              <p className={`text-2xl font-bold mt-2 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>
                {formatCurrency(totalPending)}
              </p>
            </div>
            <Calendar className={`w-8 h-8 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`} />
          </div>
        </div>

        <div className={`rounded-xl border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Overdue Amount
              </h3>
              <p className={`text-2xl font-bold mt-2 ${
                theme === 'dark' ? 'text-red-400' : 'text-red-600'
              }`}>
                {formatCurrency(overdueAmount)}
              </p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`} />
          </div>
        </div>

        <div className={`rounded-xl border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                Total Entries
              </h3>
              <p className={`text-2xl font-bold mt-2 ${
                theme === 'dark' ? 'text-green-400' : 'text-green-600'
              }`}>
                {totalEntries}
              </p>
            </div>
            <Clock className={`w-8 h-8 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`} />
          </div>
        </div>
      </div>

      {/* Outstanding Data Table */}
      <div className={`rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Ledger Outstanding Details
          </h3>
        </div>
        <div className="overflow-x-auto">
          {data.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ledger Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Bill No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Bill Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Bill Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Paid Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Outstanding</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Overdue Days</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Ageing Bucket</th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider">Risk</th>
                </tr>
              </thead>
              <tbody className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}>
                {data.map(item => {
                  const overdueStatus = getOverdueStatus(item.overdueDays);
                  return (
                    <tr key={item.id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">{item.ledgerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.billNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.billDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatDate(item.dueDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item.billAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item.paidAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(item.outstandingAmount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{item.overdueDays}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">{item.ageingBucket}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-center font-semibold ${
                        overdueStatus.color === 'green' ? 'text-green-600' :
                        overdueStatus.color === 'yellow' ? 'text-yellow-600' :
                        overdueStatus.color === 'orange' ? 'text-orange-600' : 'text-red-600'
                      }`}>{item.riskCategory}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="text-center p-6">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No outstanding records found</p>
            </div>
          )}
        </div>    
      </div>
    </div>
  );
};export default OutstandingLedger;
