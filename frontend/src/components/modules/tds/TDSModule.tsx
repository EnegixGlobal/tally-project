import React from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';


import { 
  FileText, Calculator, Users, BarChart2, 
  
} from 'lucide-react'; // CheckCircle, AlertTriangle ,Download, Upload,

const TDSModule: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const tdsFeatures = [
    {
      title: 'TDS Returns',
      items: [
        { icon: <FileText size={20} />, name: 'Form 24Q', path: '/app/tds/form-24q' },
        { icon: <FileText size={20} />, name: 'Form 26Q', path: '/app/tds/form-26q' },
        { icon: <FileText size={20} />, name: 'Form 27Q', path: '/app/tds/form-27q' },
         { icon: <FileText size={20} />, name: 'Form 27EQ', path: '/app/tds/form-27eq' },
         { icon: <FileText size={20} />, name: 'Form 26QB', path: '/app/tds/form-26qb' },
         { icon: <FileText size={20} />, name: 'Form 26QC', path: '/app/tds/form-26qc' },
        
      ]
    },
    {
      title: 'TDS Configuration',
      items: [
        { icon: <Calculator size={20} />, name: 'TDS Rates', path: '/app/tds/rates' },
        { icon: <Users size={20} />, name: 'Deductee Master', path: '/app/tds/deductees' },
        { icon: <BarChart2 size={20} />, name: 'TDS/TCS Summary', path: '/app/tds/summary' }
        // { icon: <CheckCircle size={20} />, name: 'TAN Registration', path: '/app/tds/tan' },
        // { icon: <AlertTriangle size={20} />, name: 'Compliance Check', path: '/app/tds/compliance' }
      ]
    },
    // {
    //   title: 'Certificates & Reports',
    //   items: [
    //     { icon: <FileText size={20} />, name: 'Form 16', path: '/app/tds/form-16' },
    //     { icon: <FileText size={20} />, name: 'Form 16A', path: '/app/tds/form-16a' },
    //     { icon: <Download size={20} />, name: 'Download Certificates', path: '/app/tds/certificates' },
    //     { icon: <Upload size={20} />, name: 'Upload Challan', path: '/app/tds/challan' }
    //   ]
    // }
  ];

  return (
    <div className='pt-[56px] px-4 '>
      <h1 className="text-2xl font-bold mb-6">TDS Module</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {tdsFeatures.map((category, index) => (
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
                      : 'bg-purple-50'
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
        theme === 'dark' ? 'bg-gray-800' : 'bg-purple-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">TDS Compliance:</span> File quarterly returns and issue certificates on time.
        </p>
      </div>
    </div>
  );
};

export default TDSModule;