import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, ArrowRightCircle, ArrowLeftCircle, 
  FileText, ShoppingCart, ShoppingBag, 
  FileMinus, FilePlus, Truck,  Clipboard,
  Package, 
  ImportIcon
} from 'lucide-react';

interface VoucherType {
  id: string;
  icon: React.ReactNode;
  name: string;
  path: string;
  color: string;
  iconBg: string;
  description: string;
  category: 'accounting' | 'trading' | 'inventory' | 'import';
}

interface VoucherSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  vouchers: VoucherType[];
}

const VouchersIndex: React.FC = () => {
  const { theme, vouchers, ledgers } = useAppContext();
  const navigate = useNavigate();

  // Safe fallbacks with proper typing
  const safeVouchers = vouchers || [];
  const safeLedgers = ledgers || [];

  // Helper function to get party name with better error handling
  const getPartyName = (partyId: string | undefined): string => {
    if (!partyId) return 'No Party';
    const party = safeLedgers.find(l => l.id === partyId);
    return party?.name || 'Unknown Party';
  };

  // Helper function to handle voucher navigation
  const handleVoucherClick = (voucher: VoucherType) => {
    navigate(voucher.path);
  };

  // Helper function to format date consistently
  const formatDate = (date: string | Date): string => {
    try {
      return new Date(date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  // Well-structured voucher sections configuration
  const voucherSections: VoucherSection[] = [
    {
      title: "Accounting Vouchers",
      description: "Cash, Bank & Journal Entries",
      icon: <DollarSign size={20} />,
      vouchers: [
        {
          id: 'payment',
          icon: <DollarSign size={20} />,
          name: 'Payment',
          path: '/app/vouchers/payment/create',
          color: theme === 'dark' ? 'bg-red-900/50 hover:bg-red-800/50' : 'bg-red-50 hover:bg-red-100',
          iconBg: theme === 'dark' ? 'bg-red-800/70' : 'bg-red-100',
          description: 'Record cash/bank payments',
          category: 'accounting'
        },
        {
          id: 'receipt',
          icon: <ArrowRightCircle size={20} />,
          name: 'Receipt',
          path: '/app/vouchers/receipt/create',
          color: theme === 'dark' ? 'bg-green-900/50 hover:bg-green-800/50' : 'bg-green-50 hover:bg-green-100',
          iconBg: theme === 'dark' ? 'bg-green-800/70' : 'bg-green-100',
          description: 'Record cash/bank receipts',
          category: 'accounting'
        },
        {
          id: 'contra',
          icon: <ArrowLeftCircle size={20} />,
          name: 'Contra',
          path: '/app/vouchers/contra/create',
          color: theme === 'dark' ? 'bg-purple-900/50 hover:bg-purple-800/50' : 'bg-purple-50 hover:bg-purple-100',
          iconBg: theme === 'dark' ? 'bg-purple-800/70' : 'bg-purple-100',
          description: 'Transfer between accounts',
          category: 'accounting'
        },
        {
          id: 'journal',
          icon: <FileText size={20} />,
          name: 'Journal',
          path: '/app/vouchers/journal/create',
          color: theme === 'dark' ? 'bg-amber-900/50 hover:bg-amber-800/50' : 'bg-amber-50 hover:bg-amber-100',
          iconBg: theme === 'dark' ? 'bg-amber-800/70' : 'bg-amber-100',
          description: 'General journal entries',
          category: 'accounting'
        }
      ]
    },
    {
      title: "Trading Vouchers",
      description: "Sales, Purchase & Orders",
      icon: <ShoppingCart size={20} />,
      vouchers: [
        {
          id: 'sales',
          icon: <ShoppingCart size={20} />,
          name: 'Sales',
          path: '/app/vouchers/sales/create',
          color: theme === 'dark' ? 'bg-blue-900/50 hover:bg-blue-800/50' : 'bg-blue-50 hover:bg-blue-100',
          iconBg: theme === 'dark' ? 'bg-blue-800/70' : 'bg-blue-100',
          description: 'Sales invoices',
          category: 'trading'
        },
        {
          id: 'purchase',
          icon: <ShoppingBag size={20} />,
          name: 'Purchase',
          path: '/app/vouchers/purchase/create',
          color: theme === 'dark' ? 'bg-indigo-900/50 hover:bg-indigo-800/50' : 'bg-indigo-50 hover:bg-indigo-100',
          iconBg: theme === 'dark' ? 'bg-indigo-800/70' : 'bg-indigo-100',
          description: 'Purchase invoices',
          category: 'trading'
        },
        {
          id: 'sales-order',
          icon: <Clipboard size={20} />,
          name: 'Sales Order',
          path: '/app/vouchers/sales-order/create',
          color: theme === 'dark' ? 'bg-sky-900/50 hover:bg-sky-800/50' : 'bg-sky-50 hover:bg-sky-100',
          iconBg: theme === 'dark' ? 'bg-sky-800/70' : 'bg-sky-100',
          description: 'Sales orders',
          category: 'trading'
        },
        {
          id: 'purchase-order',
          icon: <Package size={20} />,
          name: 'Purchase Order',
          path: '/app/vouchers/purchase-order/create',
          color: theme === 'dark' ? 'bg-cyan-900/50 hover:bg-cyan-800/50' : 'bg-cyan-50 hover:bg-cyan-100',
          iconBg: theme === 'dark' ? 'bg-cyan-800/70' : 'bg-cyan-100',
          description: 'Purchase orders',
          category: 'trading'
        },
        {
          id: 'quotation',
          icon: <FileText size={20} />,
          name: 'Quotation',
          path: '/app/vouchers/quotation/list',
          color: theme === 'dark' ? 'bg-violet-900/50 hover:bg-violet-800/50' : 'bg-violet-50 hover:bg-violet-100',
          iconBg: theme === 'dark' ? 'bg-violet-800/70' : 'bg-violet-100',
          description: 'Price quotations',
          category: 'trading'
        }
      ]
    },
    {
      title: "Credit/Debit Notes",
      description: "Adjustments & Returns",
      icon: <FilePlus size={20} />,
      vouchers: [
        {
          id: 'debit-note',
          icon: <FilePlus size={20} />,
          name: 'Debit Note',
          path: '/app/vouchers/debit-note/create',
          color: theme === 'dark' ? 'bg-rose-900/50 hover:bg-rose-800/50' : 'bg-rose-50 hover:bg-rose-100',
          iconBg: theme === 'dark' ? 'bg-rose-800/70' : 'bg-rose-100',
          description: 'Debit adjustments',
          category: 'trading'
        },
        {
          id: 'credit-note',
          icon: <FileMinus size={20} />,
          name: 'Credit Note',
          path: '/app/vouchers/credit-note/create',
          color: theme === 'dark' ? 'bg-teal-900/50 hover:bg-teal-800/50' : 'bg-teal-50 hover:bg-teal-100',
          iconBg: theme === 'dark' ? 'bg-teal-800/70' : 'bg-teal-100',
          description: 'Credit adjustments',
          category: 'trading'
        },
        // {
        //   id: 'sales-return',
        //   icon: <RotateCcw size={20} />,
        //   name: 'Sales Return',
        //   path: '/app/vouchers/sales-return/create',
        //   color: theme === 'dark' ? 'bg-orange-900/50 hover:bg-orange-800/50' : 'bg-orange-50 hover:bg-orange-100',
        //   iconBg: theme === 'dark' ? 'bg-orange-800/70' : 'bg-orange-100',
        //   description: 'Sales returns',
        //   category: 'trading'
        // },
        // {
        //   id: 'purchase-return',
        //   icon: <RefreshCcw size={20} />,
        //   name: 'Purchase Return',
        //   path: '/app/vouchers/purchase-return/create',
        //   color: theme === 'dark' ? 'bg-emerald-900/50 hover:bg-emerald-800/50' : 'bg-emerald-50 hover:bg-emerald-100',
        //   iconBg: theme === 'dark' ? 'bg-emerald-800/70' : 'bg-emerald-100',
        //   description: 'Purchase returns',
        //   category: 'trading'
        // }
      ]
    },
    {
      title: "Inventory Vouchers",
      description: "Stock & Delivery Management",
      icon: <Package size={20} />,
      vouchers: [
        {
          id: 'stock-journal',
          icon: <Package size={20} />,
          name: 'Stock Journal',
          path: '/app/vouchers/stock-journal/create',
          color: theme === 'dark' ? 'bg-yellow-900/50 hover:bg-yellow-800/50' : 'bg-yellow-50 hover:bg-yellow-100',
          iconBg: theme === 'dark' ? 'bg-yellow-800/70' : 'bg-yellow-100',
          description: 'Stock adjustments',
          category: 'inventory'
        },
        {
          id: 'delivery-note',
          icon: <Truck size={20} />,
          name: 'Delivery Note',
          path: '/app/vouchers/delivery-note/create',
          color: theme === 'dark' ? 'bg-cyan-900/50 hover:bg-cyan-800/50' : 'bg-cyan-50 hover:bg-cyan-100',
          iconBg: theme === 'dark' ? 'bg-cyan-800/70' : 'bg-cyan-100',
          description: 'Delivery notes',
          category: 'inventory'
        }
      ]
    },
    {
      title: "Import Vouchers",
      description: "Import vouchers from Excel/CSV files",
      icon: <ImportIcon size={20} />,
      vouchers: [
        {
          id: 'import-vouchers',
          icon: <ImportIcon size={20} />,
          name: 'Import Vouchers',
          path: '/app/vouchers/import',
          color: theme === 'dark' ? 'bg-teal-900/50 hover:bg-teal-800/50' : 'bg-teal-50 hover:bg-teal-100',
          iconBg: theme === 'dark' ? 'bg-teal-800/70' : 'bg-teal-100',
          description: 'Import from Excel/CSV files',
          category: 'import'
        }
      ]
    },
    
  ];

  return (
    <div className="pt-[56px] px-4 min-h-screen">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Voucher Management</h1>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Create, manage, and track all your vouchers in one place
        </p>
      </div>
      
      {/* Voucher Types by Section */}
      <div className="space-y-6 mb-6">
        {voucherSections.map((section, sectionIndex) => (
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
              {section.vouchers.map((voucher) => (
                <button
                  key={voucher.id}
                  onClick={() => handleVoucherClick(voucher)}
                  className={`p-4 rounded-lg flex flex-col items-center text-center transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${voucher.color} group`}
                  aria-label={`Create ${voucher.name} voucher - ${voucher.description}`}
                  title={voucher.description}
                >
                  <div className={`p-3 rounded-full mb-3 transition-colors group-hover:scale-110 ${voucher.iconBg}`}>
                    {voucher.icon}
                  </div>
                  <span className="font-medium text-sm leading-tight">{voucher.name}</span>
                  <span className={`text-xs mt-1 opacity-70 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    {voucher.category}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Vouchers Section */}
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800 border border-gray-700' : 'bg-white shadow-sm border border-gray-200'}`}>
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <FileText className="mr-2" size={20} />
          Recent Vouchers
        </h2>
        
        {safeVouchers && safeVouchers.length > 0 ? (
          <div className="space-y-3">
            {safeVouchers.slice(-5).reverse().map((voucher, index) => (
              <div
                key={voucher.id || `voucher-${index}`}
                className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  theme === 'dark' 
                    ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700 hover:border-gray-500' 
                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                }`}
                onClick={() => {
                  console.log('Voucher details:', voucher);
                  // In a real app, this would navigate to voucher details
                  alert(`Voucher Details:\nNumber: ${voucher.number}\nType: ${voucher.type}\nDate: ${formatDate(voucher.date)}\nParty: ${getPartyName(voucher.partyId)}`);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    alert(`Voucher Details:\nNumber: ${voucher.number}\nType: ${voucher.type}\nDate: ${formatDate(voucher.date)}\nParty: ${getPartyName(voucher.partyId)}`);
                  }
                }}
                aria-label={`View voucher ${voucher.number} - ${voucher.type}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-sm truncate">
                        {voucher.number}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                        voucher.type === 'quotation' || voucher.isQuotation === true
                          ? theme === 'dark' ? 'bg-violet-900/50 text-violet-300' : 'bg-violet-100 text-violet-700'
                          : theme === 'dark' ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {voucher.type === 'quotation' || voucher.isQuotation === true ? 'Quotation' : voucher.type}
                      </span>
                    </div>
                    
                    <div className={`text-xs space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Date:</span>
                        <span>{formatDate(voucher.date)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">Party:</span>
                        <span className="truncate">{getPartyName(voucher.partyId)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4 flex-shrink-0">
                    <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      {voucher.entries?.length || 0} items
                    </div>
                    <div className={`text-xs mt-1 px-2 py-1 rounded ${
                      theme === 'dark' ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {voucher.mode || 'item-invoice'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
            <FileText size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No vouchers found</p>
            <p className="text-sm">Create your first voucher to get started!</p>
          </div>
        )}
      </div>
      
      {/* Pro Tips Section */}
      <div className={`mt-6 p-4 rounded-lg border-l-4 ${
        theme === 'dark' 
          ? 'bg-blue-900/20 border-blue-500 text-blue-200' 
          : 'bg-blue-50 border-blue-400 text-blue-700'
      }`}>
        <h3 className="font-semibold text-sm mb-2">💡 Pro Tips</h3>
        <ul className="text-sm space-y-1">
          <li>• Press <kbd className={`px-1 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border'}`}>Alt+F5</kbd> to quickly access Vouchers</li>
          <li>• Use <kbd className={`px-1 py-0.5 rounded text-xs ${theme === 'dark' ? 'bg-gray-700' : 'bg-white border'}`}>Ctrl+N</kbd> to create a new Voucher</li>
          <li>• Click on recent vouchers to view details</li>
        </ul>
      </div>
    </div>
  );
};

export default VouchersIndex;