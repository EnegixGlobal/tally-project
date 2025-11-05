import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
   Building, BarChart2, 
  FileText,  Activity, 
} from 'lucide-react'; //Package, Truck,Archive , ShoppingCart,

const InventoryModule: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const inventoryFeatures = [
    // {
    //   title: 'Inventory Masters',
    //   items: [
    //     { icon: <Package size={20} />, name: 'Stock Items', path: '/app/masters/stock-item' },
    //     { icon: <Archive size={20} />, name: 'Stock Groups', path: '/app/masters/stock-group' },
    //     { icon: <Building size={20} />, name: 'Godowns', path: '/app/masters/godowns' },
    //     { icon: <FileText size={20} />, name: 'Units', path: '/app/masters/units' }
    //   ]
    // },
    // {
    //   title: 'Stock Transactions',
    //   items: [
    //     { icon: <ShoppingCart size={20} />, name: 'Sales Voucher', path: '/app/vouchers/sales/create' },
    //     { icon: <Truck size={20} />, name: 'Purchase Voucher', path: '/app/vouchers/purchase/create' },
    //     { icon: <FileText size={20} />, name: 'Stock Journal', path: '/app/vouchers/stock-journal/create' },
    //     { icon: <Package size={20} />, name: 'Delivery Note', path: '/app/vouchers/delivery-note/create' }
    //   ]
    // },
    {
      title: 'Inventory Reports',
      items: [
        { icon: <BarChart2 size={20} />, name: 'Stock Summary', path: '/app/inventory/stock-summary' },
        { icon: <Activity size={20} />, name: 'Movement Analysis', path: '/app/inventory/movement-analysis' },
        { icon: <FileText size={20} />, name: 'Ageing Analysis', path: '/app/inventory/ageing-analysis' },
        { icon: <Building size={20} />, name: 'Godown Summary', path: '/app/inventory/godown-summary' }
      ]
    }
  ];

  return (
    <div className='pt-[56px] px-4 '>
      <h1 className="text-2xl font-bold mb-6">Inventory Module</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {inventoryFeatures.map((category, index) => (
          <div 
            key={index}
            className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}
          >
            <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {category.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => navigate(item.path)}
                  className={`p-4 rounded-lg flex flex-col items-center text-center transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className={`p-2 rounded-full mb-2 ${
                    theme === 'dark' 
                      ? 'bg-gray-600' 
                      : 'bg-green-50'
                  }`}>
                    {item.icon}
                  </div>
                  <span className="text-sm">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-green-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press Alt+F11 to quickly access Inventory features.
        </p>
      </div>
    </div>
  );
};

export default InventoryModule;