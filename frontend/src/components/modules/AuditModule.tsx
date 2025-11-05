import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';//Search, FileText, Shield, Activity, 
  //CheckCircle, AlertTriangle, Clock, Users 

const AuditModule: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const auditFeatures = [
    {
      title: 'Audit Trail',
      items: [
        { icon: <Activity size={20} />, name: 'DPR', path: '/app/audit/dpr' },
        { icon: <Activity size={20} />, name: 'CMA', path: '/app/audit/cma' },
        { icon: <Activity size={20} />, name: '3CB', path: '/app/audit/3-Cb' },
        { icon: <Activity size={20} />, name: '3CD', path: '/app/audit/3-cd' },
        { icon: <Activity size={20} />, name: '3CA', path: '/app/audit/3-ca' },
                { icon: <Activity size={20} />, name: '3CB', path: '/app/audit/3-cb' },
        // { icon: <Activity size={20} />, name: 'Transaction Log', path: '/app/audit/transaction-log' },
        // { icon: <Users size={20} />, name: 'User Activity', path: '/app/audit/user-activity' },
        // { icon: <Clock size={20} />, name: 'Login History', path: '/app/audit/login-history' },
        // { icon: <FileText size={20} />, name: 'Data Changes', path: '/app/audit/data-changes' }
      ]
    },
    // {
    //   title: 'Security & Compliance',
    //   items: [
    //     { icon: <Shield size={20} />, name: 'Security Settings', path: '/app/audit/security' },
    //     { icon: <CheckCircle size={20} />, name: 'Compliance Check', path: '/app/audit/compliance' },
    //     { icon: <AlertTriangle size={20} />, name: 'Risk Assessment', path: '/app/audit/risk' },
    //     { icon: <Search size={20} />, name: 'Fraud Detection', path: '/app/audit/fraud' }
    //   ]
    // },
    // {
    //   title: 'Audit Reports',
    //   items: [
    //     { icon: <FileText size={20} />, name: 'Audit Summary', path: '/app/audit/summary' },
    //     { icon: <Activity size={20} />, name: 'Exception Reports', path: '/app/audit/exceptions' },
    //     { icon: <Clock size={20} />, name: 'Period Analysis', path: '/app/audit/period-analysis' },
    //     { icon: <Users size={20} />, name: 'User Reports', path: '/app/audit/user-reports' }
    //   ]
    // }
  ];

  return (
    <div className='pt-[56px] px-4 '>
      <h1 className="text-2xl font-bold mb-6">Audit Module</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {auditFeatures.map((category, index) => (
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
                      : 'bg-red-50'
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
        theme === 'dark' ? 'bg-gray-800' : 'bg-red-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Audit Trail:</span> All system activities are automatically logged for compliance and security.
        </p>
      </div>
    </div>
  );
};

export default AuditModule;