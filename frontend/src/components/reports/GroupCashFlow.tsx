import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Filter, Search } from 'lucide-react';

interface GroupCashFlowTransaction {
  id: number;
  date: string;
  particular: string;
  voucherType: string;
  voucherNo: string;
  inflow: number;
  outflow: number;
}

const GroupCashFlow: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { accountName } = useParams<{ accountName: string }>();
  const [searchTerm, setSearchTerm] = useState('');

  // Get the state passed from CashFlowSummary
  const locationState = location.state as { accountData?: { name: string; amount: number }; period?: string; monthCode?: string } | null;

  // Function to handle back navigation
  const handleBackNavigation = () => {
    if (locationState?.monthCode) {
      navigate(`/app/reports/cash-flow-summary/${locationState.monthCode}`);
    } else {
      // Fallback to cash flow main page
      navigate('/app/reports/cash-flow');
    }
  };

  // Mock transaction data for the selected account
  const getTransactionsForAccount = (account: string): GroupCashFlowTransaction[] => {
    const baseTransactions: Record<string, GroupCashFlowTransaction[]> = {
      'Capital Account': [
        {
          id: 1,
          date: '2025-04-01',
          particular: 'Mr Verma',
          voucherType: 'Receipt',
          voucherNo: 'REC001',
          inflow: 3000000,
          outflow: 0
        },
        {
          id: 2,
          date: '2025-04-15',
          particular: 'Additional Investment',
          voucherType: 'Receipt',
          voucherNo: 'REC015',
          inflow: 500000,
          outflow: 0
        }
      ],
      'Sales Accounts': [
        {
          id: 3,
          date: '2025-04-02',
          particular: 'ABC Enterprises',
          voucherType: 'Sales',
          voucherNo: 'SAL001',
          inflow: 850000,
          outflow: 0
        },
        {
          id: 4,
          date: '2025-04-05',
          particular: 'XYZ Corporation',
          voucherType: 'Sales',
          voucherNo: 'SAL002',
          inflow: 1200000,
          outflow: 0
        },
        {
          id: 5,
          date: '2025-04-10',
          particular: 'Tech Solutions Ltd',
          voucherType: 'Sales',
          voucherNo: 'SAL003',
          inflow: 750000,
          outflow: 0
        },
        {
          id: 6,
          date: '2025-04-20',
          particular: 'Global Trading Co',
          voucherType: 'Sales',
          voucherNo: 'SAL004',
          inflow: 650000,
          outflow: 0
        }
      ],
      'Fixed Assets': [
        {
          id: 7,
          date: '2025-04-03',
          particular: 'Office Equipment',
          voucherType: 'Purchase',
          voucherNo: 'PUR001',
          inflow: 0,
          outflow: 450000
        },
        {
          id: 8,
          date: '2025-04-12',
          particular: 'Computer Systems',
          voucherType: 'Purchase',
          voucherNo: 'PUR002',
          inflow: 0,
          outflow: 850000
        },
        {
          id: 9,
          date: '2025-04-25',
          particular: 'Furniture & Fixtures',
          voucherType: 'Purchase',
          voucherNo: 'PUR003',
          inflow: 0,
          outflow: 320000
        }
      ],
      'Purchase Accounts': [
        {
          id: 10,
          date: '2025-04-04',
          particular: 'Reliable Suppliers',
          voucherType: 'Purchase',
          voucherNo: 'PUR004',
          inflow: 0,
          outflow: 650000
        },
        {
          id: 11,
          date: '2025-04-18',
          particular: 'Material Suppliers',
          voucherType: 'Purchase',
          voucherNo: 'PUR005',
          inflow: 0,
          outflow: 480000
        }
      ]
    };

    return baseTransactions[account] || [];
  };

  const transactions = getTransactionsForAccount(accountName || 'Capital Account');
  
  const filteredTransactions = transactions.filter(transaction =>
    transaction.particular.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.voucherType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.voucherNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalInflow = filteredTransactions.reduce((sum, t) => sum + t.inflow, 0);
  const totalOutflow = filteredTransactions.reduce((sum, t) => sum + t.outflow, 0);

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
  };

  const getPeriodRange = () => {
    return '1-Apr-25 to 30-Apr-25';
  };

  return (
    <div className='pt-[56px] px-4'>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          title='Back to Cash Flow Summary'
          onClick={handleBackNavigation}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Group Cash Flow
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Company: Abd Pvt Ltd
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Account: {accountName || 'Capital Account'}
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Period: {getPeriodRange()}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            title='Print Report'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title='Download Report'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-xl border p-4 mb-6 ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className={`absolute left-3 top-2.5 w-4 h-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          <button
            className={`px-4 py-2 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4 mr-2 inline" />
            Filter
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className={`rounded-xl border ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        {/* Table Header */}
        <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-b font-medium text-sm ${
          theme === 'dark' 
            ? 'bg-gray-700 border-gray-600 text-gray-300' 
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <div className="col-span-2">Date</div>
          <div className="col-span-4">Particulars</div>
          <div className="col-span-2">Voucher Type</div>
          <div className="col-span-1">Voucher No</div>
          <div className="col-span-1 text-right">Inflow</div>
          <div className="col-span-2 text-right">Outflow</div>
        </div>

        {/* Transaction Rows */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredTransactions.map((transaction) => (
            <div 
              key={transaction.id}
              className={`grid grid-cols-12 gap-4 px-6 py-3 hover:bg-opacity-50 transition-colors ${
                theme === 'dark' 
                  ? 'hover:bg-gray-700 text-gray-300' 
                  : 'hover:bg-gray-50 text-gray-900'
              }`}
            >
              <div className="col-span-2 text-sm">
                {formatDate(transaction.date)}
              </div>
              <div className="col-span-4 text-sm font-medium">
                <button
                  onClick={() => navigate(`/app/reports/ledger-vouchers/${encodeURIComponent(transaction.particular)}`, {
                    state: { 
                      period: getPeriodRange(),
                      accountName: accountName 
                    }
                  })}
                  className={`text-left hover:underline transition-colors ${
                    theme === 'dark' 
                      ? 'text-gray-300 hover:text-blue-400' 
                      : 'text-gray-900 hover:text-blue-600'
                  }`}
                >
                  {transaction.particular}
                </button>
              </div>
              <div className="col-span-2 text-sm">
                {transaction.voucherType}
              </div>
              <div className="col-span-1 text-sm">
                {transaction.voucherNo}
              </div>
              <div className="col-span-1 text-sm text-right font-medium">
                {transaction.inflow > 0 && (
                  <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                    {formatCurrency(transaction.inflow)}
                  </span>
                )}
              </div>
              <div className="col-span-2 text-sm text-right font-medium">
                {transaction.outflow > 0 && (
                  <span className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>
                    {formatCurrency(transaction.outflow)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Grand Total */}
        <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-t font-bold ${
          theme === 'dark' 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-gray-50 border-gray-200 text-gray-900'
        }`}>
          <div className="col-span-9 text-sm">
            Grand Total
          </div>
          <div className="col-span-1 text-sm text-right">
            {totalInflow > 0 && (
              <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                {formatCurrency(totalInflow)}
              </span>
            )}
          </div>
          <div className="col-span-2 text-sm text-right">
            {totalOutflow > 0 && (
              <span className={theme === 'dark' ? 'text-red-400' : 'text-red-600'}>
                {formatCurrency(totalOutflow)}
              </span>
            )}
          </div>
        </div>

        {/* No Data Message */}
        {filteredTransactions.length === 0 && (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>No transactions found for the selected criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupCashFlow;
