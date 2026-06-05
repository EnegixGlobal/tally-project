import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Landmark, Users } from 'lucide-react';
import { Form26QForm } from './form26forms/Form26QForm';
import { Form26QChallan } from './form26forms/Form26QChallan';
import { Form26QAnnexure } from './form26forms/Form26QAnnexure';
import { useAppContext } from '../../../context/AppContext';

type TabType = 'form' | 'challan' | 'annexure';

const Form26Q: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'form';
  const [returnId, setReturnId] = useState<number | null>(null);

  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'form', label: 'Form', icon: FileText },
    { id: 'challan', label: 'Challan', icon: Landmark },
    { id: 'annexure', label: 'Annexure(Deducted details)', icon: Users },
  ] as const;

  return (
    <div className="min-h-screen pt-16 px-4 md:px-8 pb-12 bg-gray-50 text-black">
      <div className="w-full space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-black pb-5">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(window.location.pathname.includes('tds-report') ? '/app/tds-report' : '/app/tds')}
              className="p-2.5 rounded-xl border border-black bg-white text-black hover:bg-gray-50 shadow-sm transition-all duration-300"
              title="Back to TDS Dashboard"
            >
              <ArrowLeft size={20} className="transition-transform duration-200 hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">
                Form 26Q Quarterly Return
              </h1>
              <p className="text-sm font-semibold text-gray-700 mt-1">
                TDS Return for Payments Other Than Salary (Non-Resident & Resident Deductee)
              </p>
            </div>
          </div>
        </div>

        {/* High-Contrast Tabbed Navigation Bar */}
        <div className="rounded-2xl p-1.5 border border-black bg-white shadow-sm flex space-x-2 w-full md:w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Form Component Content */}
        <div className="mt-6">
          {activeTab === 'form' && <Form26QForm setReturnId={setReturnId} />}
          {activeTab === 'challan' && <Form26QChallan returnId={returnId} />}
          {activeTab === 'annexure' && <Form26QAnnexure returnId={returnId} />}
        </div>

      </div>
    </div>
  );
};

export default Form26Q;
