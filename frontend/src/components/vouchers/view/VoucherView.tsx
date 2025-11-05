import React from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Edit, Copy } from 'lucide-react';

interface VoucherEntry {
  ledger: string;
  debit: number;
  credit: number;
}

interface VoucherDetails {
  voucherNo: string;
  voucherType: string;
  date: string;
  narration: string;
  entries: VoucherEntry[];
}

const VoucherView: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const { voucherType, voucherNo } = useParams<{ voucherType: string; voucherNo: string }>();

  // Mock voucher details
  const voucherDetails: VoucherDetails = {
    voucherNo: voucherNo || '1',
    voucherType: voucherType ? (voucherType.charAt(0).toUpperCase() + voucherType.slice(1)) : 'Receipt',
    date: '2025-04-01',
    narration: 'Being initial investment received from Mr. Verma for business capital',
    entries: [
      {
        ledger: 'Cash',
        debit: 300000,
        credit: 0
      },
      {
        ledger: 'Mr. Verma (Capital)',
        debit: 0,
        credit: 300000
      }
    ]
  };

  const formatCurrency = (amount: number) => {
    if (amount === 0) return '';
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

  const totalDebit = voucherDetails.entries.reduce((sum, entry) => sum + entry.debit, 0);
  const totalCredit = voucherDetails.entries.reduce((sum, entry) => sum + entry.credit, 0);

  return (
    <div className='pt-[56px] px-4'>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          title='Back to Ledger Vouchers'
          onClick={() => navigate(-1)}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {voucherDetails.voucherType} Voucher
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Company: Abd Pvt Ltd
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Voucher No: {voucherDetails.voucherNo}
          </p>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Date: {formatDate(voucherDetails.date)}
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            title='Edit Voucher'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Edit size={18} />
          </button>
          <button
            title='Copy Voucher'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Copy size={18} />
          </button>
          <button
            title='Print Voucher'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Printer size={18} />
          </button>
          <button
            title='Download Voucher'
            type='button'
            className={`p-2 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Voucher Details */}
      <div className={`rounded-xl border ${
        theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
      }`}>
        {/* Voucher Header */}
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className={`text-lg font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                {voucherDetails.voucherType} Voucher
              </h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                No: {voucherDetails.voucherNo}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Date: {formatDate(voucherDetails.date)}
              </p>
            </div>
          </div>
        </div>

        {/* Voucher Entries */}
        <div className="px-6 py-4">
          <table className="w-full">
            <thead className={`${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Ledger Account
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Debit
                </th>
                <th className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Credit
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${
              theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'
            }`}>
              {voucherDetails.entries.map((entry, index) => (
                <tr 
                  key={index}
                  className={theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}
                >
                  <td className="px-4 py-3 text-sm font-medium">
                    {entry.ledger}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {entry.debit > 0 && (
                      <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                        {formatCurrency(entry.debit)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium">
                    {entry.credit > 0 && (
                      <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
                        {formatCurrency(entry.credit)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              
              {/* Total Row */}
              <tr className={`font-bold border-t-2 ${
                theme === 'dark' 
                  ? 'border-gray-600 bg-gray-700 text-white' 
                  : 'border-gray-300 bg-gray-50 text-gray-900'
              }`}>
                <td className="px-4 py-3 text-sm">
                  Total
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className={theme === 'dark' ? 'text-green-400' : 'text-green-600'}>
                    {formatCurrency(totalDebit)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}>
                    {formatCurrency(totalCredit)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Narration */}
        {voucherDetails.narration && (
          <div className={`px-6 py-4 border-t ${
            theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h4 className={`text-sm font-medium mb-2 ${
              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Narration:
            </h4>
            <p className={`text-sm ${
              theme === 'dark' ? 'text-gray-200' : 'text-gray-900'
            }`}>
              {voucherDetails.narration}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoucherView;
