import React from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Landmark, FileText, CreditCard, PieChart, Activity } from 'lucide-react';

const LoanModule: React.FC = () => {
    const { theme } = useAppContext();
    const navigate = useNavigate();

    const loanFeatures = [
        {
            title: 'Loan Management',
            items: [
                { icon: <Activity size={20} />, name: 'CMA Data', path: '/app/loan/cma' },
            ]
        }
    ];

    return (
        <div className='pt-[56px] px-4 '>
            <h1 className="text-2xl font-bold mb-6">Loan Module</h1>

            <div className="grid grid-cols-1 gap-6">
                {loanFeatures.map((category, index) => (
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
                                    className={`p-4 rounded-lg flex flex-col items-center text-center transition-colors ${theme === 'dark'
                                        ? 'bg-gray-700 hover:bg-gray-600'
                                        : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full mb-2 ${theme === 'dark'
                                        ? 'bg-gray-600'
                                        : 'bg-blue-50'
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

            <div className={`mt-6 p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
                }`}>
                <p className="text-sm">
                    <span className="font-semibold">Note:</span> Loan module allows you to track and manage loans, EMI schedules, and repayments.
                </p>
            </div>
        </div>
    );
};

export default LoanModule;
