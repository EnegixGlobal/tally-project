import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, Users,  Shield, 
  Monitor, 
} from 'lucide-react'; //Database,Printer, Mail, RefreshCcw 

const ConfigModule: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const configFeatures = [
    {
      title: 'System Configuration',
      items: [
        { icon: <Settings size={20} />, name: 'Sales by Fifo', path: '/app/config/sales-fifo' },
        { icon: <Settings size={20} />, name: 'Set Profit', path: '/app/config/set-profit' },
        // { icon: <Settings size={20} />, name: 'General Settings', path: '/app/config/general' },
        // { icon: <Database size={20} />, name: 'Database Settings', path: '/app/config/database' },
        // { icon: <RefreshCcw size={20} />, name: 'Backup & Restore', path: '/app/config/backup' },
        // { icon: <Monitor size={20} />, name: 'Display Settings', path: '/app/config/display' }
      ]
    },
    {
      title: 'User Management',
      items: [
        { icon: <Users size={20} />, name: 'User Accounts', path: '/app/config/users' },
        { icon: <Shield size={20} />, name: 'Permissions', path: '/app/config/permissions' },
        { icon: <Settings size={20} />, name: 'Role Management', path: '/app/config/roles' },
        { icon: <Monitor size={20} />, name: 'Access Control', path: '/app/config/access' }
      ]
    },
    {
      title: 'Integration & Output',
      items: [
        // { icon: <Printer size={20} />, name: 'Print Settings', path: '/app/config/print' },
        // { icon: <Mail size={20} />, name: 'Email Configuration', path: '/app/config/email' },
        // { icon: <Database size={20} />, name: 'Import/Export', path: '/app/config/import-export' },
        // { icon: <Settings size={20} />, name: 'API Settings', path: '/app/config/api' }
      ]
    }
  ];

  return (
    <div className='pt-[56px] px-4 '>
      <h1 className="text-2xl font-bold mb-6">Configuration</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {configFeatures.map((category, index) => (
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
                      : 'bg-indigo-50'
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
        theme === 'dark' ? 'bg-gray-800' : 'bg-indigo-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press Alt+F12 to quickly access Configuration settings.
        </p>
      </div>
    </div>
  );
};

export default ConfigModule;