import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Calendar, FileText, Building, TrendingUp, TrendingDown, ArrowLeft, Receipt, CreditCard } from 'lucide-react';
import OutstandingReceivables from './OutstandingReceivables';
import OutstandingPayables from './OutstandingPayables';
import OutstandingLedger from './OutstandingLedger';
import OutstandingGroup from './OutstandingGroup';
import BillwiseReceivables from './BillwiseReceivables';
import BillwisePayables from './BillwisePayables';

const OutstandingReports: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);
const [summary, setSummary] = useState<{totalReceivables: number, totalPayables: number, netOutstanding: number} | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      setSummaryError(null);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outstanding-summary`);
        if (!res.ok) throw new Error('Failed to load summary');
        setSummary(await res.json());
      } catch (e:any) {
        setSummaryError(e.message || 'Failed to load summary');
        setSummary(null);
      }
    }
    fetchSummary();
  }, []);

  const sections = [
    {
      id: 'receivables',
      title: 'Receivables Outstanding',
      description: 'Outstanding amounts from customers',
      icon: TrendingUp,
      color: 'green',
      component: OutstandingReceivables
    },
    {
      id: 'payables',
      title: 'Payables Outstanding',
      description: 'Outstanding amounts to suppliers',
      icon: TrendingDown,
      color: 'red',
      component: OutstandingPayables
    },
    {
      id: 'billwise-receivables',
      title: 'Bill-wise Receivables',
      description: 'Detailed bill-wise receivables analysis (Tally Style)',
      icon: Receipt,
      color: 'blue',
      component: BillwiseReceivables
    },
    {
      id: 'billwise-payables',
      title: 'Bill-wise Payables',
      description: 'Detailed bill-wise payables analysis (Tally Style)',
      icon: CreditCard,
      color: 'orange',
      component: BillwisePayables
    },
    {
      id: 'ledger',
      title: 'Ledger Outstanding',
      description: 'Outstanding for specific ledger accounts',
      icon: FileText,
      color: 'indigo',
      component: OutstandingLedger
    },
    {
      id: 'group',
      title: 'Group Outstanding',
      description: 'Outstanding grouped by ledger groups',
      icon: Building,
      color: 'purple',
      component: OutstandingGroup
    }
  ];

  const handleSectionClick = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleBack = () => {
    setActiveSection(null);
  };

  const handleBackToReports = () => {
    navigate('/app/reports');
  };

  if (activeSection) {
    const section = sections.find(s => s.id === activeSection);
    if (section) {
      const Component = section.component;
      return (
        <div className='pt-[56px] px-4'>
          <div className="flex items-center mb-6">
            <button
              type="button"
              title="Back to Outstanding Reports"
              onClick={handleBack}
              className={`mr-4 p-2 rounded-full ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">{section.title}</h1>
          </div>
          <Component />
        </div>
      );
    }
  }

  return (
    <div className='pt-[56px] px-4'>
      <div className="flex items-center mb-6">
        <button
          type="button"
          title="Back to Reports"
          onClick={handleBackToReports}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Outstanding Reports</h1>
      </div>

      <div className="space-y-6">
        <p className={`${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>
          View and analyze outstanding amounts across different categories
        </p>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section) => {
            const Icon = section.icon;
            const colorClasses = {
              green: 'from-green-500 to-green-600',
              red: 'from-red-500 to-red-600',
              blue: 'from-blue-500 to-blue-600',
              orange: 'from-orange-500 to-orange-600',
              indigo: 'from-indigo-500 to-indigo-600',
              purple: 'from-purple-500 to-purple-600'
            };

            return (
              <button
                key={section.id}
                onClick={() => handleSectionClick(section.id)}
                className={`p-6 rounded-xl border text-left transition-all duration-200 hover:scale-105 hover:shadow-lg ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-700 hover:bg-gray-750'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-r ${colorClasses[section.color as keyof typeof colorClasses]}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <Calendar className={`w-5 h-5 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                </div>
                
                <h3 className={`text-lg font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  {section.title}
                </h3>
                
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {section.description}
                </p>
                
                <div className="mt-4 flex items-center text-sm text-blue-600 dark:text-blue-400">
                  <span>View Report</span>
                  <span className="ml-1">→</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Outstanding Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              theme === 'dark' ? 'text-green-400' : 'text-green-600'
            }`}>
              {summary ? 
                summary.totalReceivables.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) 
                : 'Loading...'}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Receivables
            </div>
          </div>
            
            <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              theme === 'dark' ? 'text-red-400' : 'text-red-600'
            }`}>
              {summary ? 
                summary.totalPayables.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) 
                : 'Loading...'}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Total Payables
            </div>
          </div>
            
            <div className="text-center">
            <div className={`text-2xl font-bold mb-1 ${
              theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
            }`}>
              {summary ? 
                summary.netOutstanding.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) 
                : 'Loading...'}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Net Outstanding
            </div>
          </div>
          </div>
          {summaryError && <div className="text-center text-red-600 mt-2">{summaryError}</div>}
        </div>
      </div>
    </div>
  );
};

export default OutstandingReports;
