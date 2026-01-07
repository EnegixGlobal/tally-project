import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, ArrowRightCircle, ArrowLeftCircle, 
  FileText, ShoppingCart, ShoppingBag, 
  FileMinus, FilePlus, Truck, Clipboard,
  Package, BookKey, BarChart3,
  Printer, Download
} from 'lucide-react';


interface VoucherRegisterType {
  id: string;
  icon: React.ReactNode;
  name: string;
  path: string;
  color: string;
  iconBg: string;
  description: string;
  category: 'accounting' | 'trading' | 'inventory';
  count?: number;
}

interface VoucherRegisterSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  registers: VoucherRegisterType[];
}

const VoucherRegisterIndex: React.FC = () => {
  const { theme, vouchers } = useAppContext();
  const navigate = useNavigate();

  // Safe fallbacks
  const safeVouchers = vouchers || [];

  // Helper function to count vouchers by type
  const getVoucherCount = (type: string): number => {
    return safeVouchers.filter(v => v.type === type).length;
  };

  // Helper function to handle register navigation
  const handleRegisterClick = (register: VoucherRegisterType) => {
    navigate(register.path);
  };

  // Well-structured voucher register sections configuration
  const voucherRegisterSections: VoucherRegisterSection[] = [
    {
      title: "Accounting Registers",
      description: "Cash, Bank & Journal Entry Registers",
      icon: <DollarSign size={20} />,
      registers: [
        {
          id: 'payment-register',
          icon: <DollarSign size={20} />,
          name: 'Payment Register',
          path: '/app/voucher-register/payment',
          color: theme === 'dark' ? 'bg-red-900/50 hover:bg-red-800/50' : 'bg-red-50 hover:bg-red-100',
          iconBg: theme === 'dark' ? 'bg-red-800/70' : 'bg-red-100',
          description: 'View all payment vouchers',
          category: 'accounting',
          count: getVoucherCount('payment')
        },
        {
          id: 'receipt-register',
          icon: <ArrowRightCircle size={20} />,
          name: 'Receipt Register',
          path: '/app/voucher-register/receipt',
          color: theme === 'dark' ? 'bg-green-900/50 hover:bg-green-800/50' : 'bg-green-50 hover:bg-green-100',
          iconBg: theme === 'dark' ? 'bg-green-800/70' : 'bg-green-100',
          description: 'View all receipt vouchers',
          category: 'accounting',
          count: getVoucherCount('receipt')
        },
        {
          id: 'contra-register',
          icon: <ArrowLeftCircle size={20} />,
          name: 'Contra Register',
          path: '/app/voucher-register/contra',
          color: theme === 'dark' ? 'bg-purple-900/50 hover:bg-purple-800/50' : 'bg-purple-50 hover:bg-purple-100',
          iconBg: theme === 'dark' ? 'bg-purple-800/70' : 'bg-purple-100',
          description: 'View all contra vouchers',
          category: 'accounting',
          count: getVoucherCount('contra')
        },
        {
          id: 'journal-register',
          icon: <FileText size={20} />,
          name: 'Journal Register',
          path: '/app/voucher-register/journal',
          color: theme === 'dark' ? 'bg-amber-900/50 hover:bg-amber-800/50' : 'bg-amber-50 hover:bg-amber-100',
          iconBg: theme === 'dark' ? 'bg-amber-800/70' : 'bg-amber-100',
          description: 'View all journal vouchers',
          category: 'accounting',
          count: getVoucherCount('journal')
        }
      ]
    },
    {
      title: "Trading Registers",
      description: "Sales, Purchase & Order Registers",
      icon: <ShoppingCart size={20} />,
      registers: [
        {
          id: 'sales-register',
          icon: <ShoppingCart size={20} />,
          name: 'Sales Register',
          path: '/app/voucher-register/sales',
          color: theme === 'dark' ? 'bg-blue-900/50 hover:bg-blue-800/50' : 'bg-blue-50 hover:bg-blue-100',
          iconBg: theme === 'dark' ? 'bg-blue-800/70' : 'bg-blue-100',
          description: 'View all sales vouchers',
          category: 'trading',
          count: getVoucherCount('sales')
        },
        {
          id: 'purchase-register',
          icon: <ShoppingBag size={20} />,
          name: 'Purchase Register',
          path: '/app/voucher-register/purchase',
          color: theme === 'dark' ? 'bg-indigo-900/50 hover:bg-indigo-800/50' : 'bg-indigo-50 hover:bg-indigo-100',
          iconBg: theme === 'dark' ? 'bg-indigo-800/70' : 'bg-indigo-100',
          description: 'View all purchase vouchers',
          category: 'trading',
          count: getVoucherCount('purchase')
        },
        {
          id: 'sales-order-register',
          icon: <Clipboard size={20} />,
          name: 'Sales Order Register',
          path: '/app/voucher-register/sales-order',
          color: theme === 'dark' ? 'bg-sky-900/50 hover:bg-sky-800/50' : 'bg-sky-50 hover:bg-sky-100',
          iconBg: theme === 'dark' ? 'bg-sky-800/70' : 'bg-sky-100',
          description: 'View all sales orders',
          category: 'trading',
          count: getVoucherCount('sales-order')
        },
        {
          id: 'purchase-order-register',
          icon: <Clipboard size={20} />,
          name: 'Purchase Order Register',
          path: '/app/voucher-register/purchase-order',
          color: theme === 'dark' ? 'bg-sky-900/50 hover:bg-sky-800/50' : 'bg-sky-50 hover:bg-sky-100',
          iconBg: theme === 'dark' ? 'bg-sky-800/70' : 'bg-sky-100',
          description: 'View all sales orders',
          category: 'trading',
          count: getVoucherCount('purchase-order')
        },
        {
          id: 'quotation-register',
          icon: <FileText size={20} />,
          name: 'Quotation Register',
          path: '/app/voucher-register/quotation',
          color: theme === 'dark' ? 'bg-violet-900/50 hover:bg-violet-800/50' : 'bg-violet-50 hover:bg-violet-100',
          iconBg: theme === 'dark' ? 'bg-violet-800/70' : 'bg-violet-100',
          description: 'View all quotations',
          category: 'trading',
          count: getVoucherCount('quotation')
        }
      ]
    },
    {
      title: "Credit/Debit & Returns",
      description: "Adjustments & Return Registers",
      icon: <FilePlus size={20} />,
      registers: [
        {
          id: 'debit-note-register',
          icon: <FilePlus size={20} />,
          name: 'Debit Note Register',
          path: '/app/voucher-register/debit-note',
          color: theme === 'dark' ? 'bg-rose-900/50 hover:bg-rose-800/50' : 'bg-rose-50 hover:bg-rose-100',
          iconBg: theme === 'dark' ? 'bg-rose-800/70' : 'bg-rose-100',
          description: 'View all debit notes',
          category: 'trading',
          count: getVoucherCount('debit-note')
        },
        {
          id: 'credit-note-register',
          icon: <FileMinus size={20} />,
          name: 'Credit Note Register',
          path: '/app/voucher-register/credit-note',
          color: theme === 'dark' ? 'bg-teal-900/50 hover:bg-teal-800/50' : 'bg-teal-50 hover:bg-teal-100',
          iconBg: theme === 'dark' ? 'bg-teal-800/70' : 'bg-teal-100',
          description: 'View all credit notes',
          category: 'trading',
          count: getVoucherCount('credit-note')
        },
       
      ]
    },
    {
      title: "Inventory Registers",
      description: "Stock & Delivery Registers",
      icon: <Package size={20} />,
      registers: [
        {
          id: 'stock-journal-register',
          icon: <Package size={20} />,
          name: 'Stock Journal Register',
          path: '/app/voucher-register/stock-journal',
          color: theme === 'dark' ? 'bg-yellow-900/50 hover:bg-yellow-800/50' : 'bg-yellow-50 hover:bg-yellow-100',
          iconBg: theme === 'dark' ? 'bg-yellow-800/70' : 'bg-yellow-100',
          description: 'View all stock adjustments',
          category: 'inventory',
          count: getVoucherCount('stock-journal')
        },
        {
          id: 'delivery-note-register',
          icon: <Truck size={20} />,
          name: 'Delivery Note Register',
          path: '/app/voucher-register/delivery-note',
          color: theme === 'dark' ? 'bg-cyan-900/50 hover:bg-cyan-800/50' : 'bg-cyan-50 hover:bg-cyan-100',
          iconBg: theme === 'dark' ? 'bg-cyan-800/70' : 'bg-cyan-100',
          description: 'View all delivery notes',
          category: 'inventory',
          count: getVoucherCount('delivery-note')
        }
      ]
    }
  ];

  // Calculate total vouchers
  const totalVouchers = safeVouchers.length;

  return (
    <div className="pt-[56px] px-4 min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <BookKey className="mr-3" size={28} />
              Voucher Registers
            </h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              View, filter, and export all your vouchers by type
            </p>
          </div>
          
          {/* Quick Stats */}
          <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                {totalVouchers}
              </div>
              <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Vouchers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm border border-gray-200'}`}>
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {/* Handle export all */}}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Download size={16} className="mr-2" />
            Export All Registers
          </button>
          <button
            onClick={() => {/* Handle print all */}}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
          >
            <Printer size={16} className="mr-2" />
            Print Summary
          </button>
          <button
            onClick={() => navigate('/app/reports')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <BarChart3 size={16} className="mr-2" />
            Advanced Reports
          </button>
        </div>
      </div>
      
      {/* Voucher Register Sections */}
      <div className="space-y-6 mb-6">
        {voucherRegisterSections.map((section, sectionIndex) => (
          <div key={sectionIndex} className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm border border-gray-200'}`}>
            <div className="flex items-center mb-4">
              <div className={`p-2 rounded-lg mr-3 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {section.icon}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {section.description}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
              {section.registers.map((register) => (
                <button
                  key={register.id}
                  onClick={() => handleRegisterClick(register)}
                  className={`p-4 rounded-lg flex flex-col items-center text-center transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${register.color} group relative`}
                  aria-label={`View ${register.name} - ${register.description}`}
                  title={register.description}
                >
                  <div className={`p-3 rounded-full mb-3 transition-colors group-hover:scale-110 ${register.iconBg}`}>
                    {register.icon}
                  </div>
                  <span className="font-medium text-sm leading-tight">{register.name}</span>
                  <span className={`text-xs mt-1 opacity-70 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {register.category}
                  </span>
                  {/* Voucher count badge */}
                  {register.count !== undefined && register.count > 0 && (
                    <span className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                      theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    }`}>
                      {register.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Pro Tips Section */}
      <div className={`mt-6 p-4 rounded-lg border-l-4 ${
        theme === 'dark' 
          ? 'bg-blue-900/20 border-blue-500 text-blue-200' 
          : 'bg-blue-50 border-blue-400 text-blue-700'
      }`}>
        <h3 className="font-semibold text-sm mb-2">💡 Pro Tips</h3>
        <ul className="text-sm space-y-1">
          <li>• Click on any register to view detailed voucher list for that type</li>
          <li>• Use date range filters in individual registers for specific periods</li>
          <li>• Export registers to Excel for further analysis and record keeping</li>
          <li>• Numbers on badges show count of vouchers for each type</li>
        </ul>
      </div>
    </div>
  );
};

export default VoucherRegisterIndex;
