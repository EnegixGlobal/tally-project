import React from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';


import { 
  FileText, Calculator, Users, BarChart2, 
  
} from 'lucide-react'; // CheckCircle, AlertTriangle ,Download, Upload,

const TDSReportModule: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const tdsFeatures = [
    {
      title: 'TDS Returns Reports',
      items: [
        { icon: <FileText size={20} />, name: 'Form 24Q Report', path: '/app/tds-report/form-24q' },
        { icon: <FileText size={20} />, name: 'Form 26Q Report', path: '/app/tds-report/form-26q' },
        { icon: <FileText size={20} />, name: 'Form 27Q Report', path: '/app/tds-report/form-27q' },
         { icon: <FileText size={20} />, name: 'Form 27EQ Report', path: '/app/tds-report/form-27eq' },
         { icon: <FileText size={20} />, name: 'Form 26QB Report', path: '/app/tds-report/form-26qb' },
         { icon: <FileText size={20} />, name: 'Form 26QC Report', path: '/app/tds-report/form-26qc' },
        
      ]
    },
    {
      title: 'TDS Configuration Reports',
      items: [
        { icon: <Calculator size={20} />, name: 'TDS Rates Report', path: '/app/tds-report/rates' },
        { icon: <Users size={20} />, name: 'Deductee Master Report', path: '/app/tds-report/deductees' },
        { icon: <BarChart2 size={20} />, name: 'TDS/TCS Summary Report', path: '/app/tds-report/summary' }
      ]
    }
  ];

  return (
    <div className='pt-[56px] px-4 '>
      <h1 className="text-2xl font-bold mb-6 text-black ">TDS Report Module</h1>
      
      <div className="grid grid-cols-1 gap-6">
        {tdsFeatures.map((category, index) => (
          <div 
            key={index}
            className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-black shadow'}`}
          >
            <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {category.items.map((item, itemIndex) => (
                <button
                  key={itemIndex}
                  onClick={() => navigate(item.path)}
                  className={`p-4 rounded-lg flex flex-col items-center text-center transition-colors cursor-pointer ${
                    theme === 'dark' 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-gray-50 hover:bg-gray-100 text-black'
                  }`}
                >
                  <div className={`p-2 rounded-full mb-2 ${
                    theme === 'dark' 
                      ? 'bg-gray-600' 
                      : 'bg-purple-50'
                  }`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-semibold">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-purple-50 text-black'
      }`}>
        <p className="text-sm font-semibold">
          <span className="font-bold">TDS Compliance Reports:</span> Track quarterly returns and check compliance status.
        </p>
      </div>
    </div>
  );
};

export default TDSReportModule;
