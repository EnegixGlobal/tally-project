import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, ArrowLeft } from 'lucide-react';

interface Budget {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  status: 'draft' | 'active';
}

const BudgetList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('supplier');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) {
      return;
    }
    fetch(`${import.meta.env.VITE_API_URL}/api/budgets?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`)
      .then((res) => res.json())
      .then((data) => setBudgets(data))
      .catch((err) => console.error('Failed to fetch budgets:', err));
  }, [companyId, ownerType, ownerId]);

    const handleDelete = async (id: number) => {
    if (!companyId || !ownerType || !ownerId) return;

    const confirmDelete = window.confirm(
      'Are you sure you want to delete this budget?'
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/budgets/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
        {
          method: 'DELETE',
        }
      );

      if (res.ok) {
        setBudgets((prev) => prev.filter((budget) => budget.id !== id));
      } else {
        console.error('Failed to delete budget');
      }
    } catch (err) {
      console.error('Error deleting budget:', err);
    }
  };

  const filteredBudgets = budgets.filter(budget =>
    budget.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button title="Back to Dashboard"
                  onClick={() => navigate('/app/masters')}
                  className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                >
                  <ArrowLeft size={20} />
                </button>
        <h1 className="text-2xl font-bold">Budget List</h1>
        <div className="ml-auto flex space-x-2">

        <button
          title='Create New Budget'
          onClick={() => navigate('/app/masters/budget/create')}
          className={`flex items-center px-4 py-2 rounded ${
            theme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus size={18} className="mr-1" />
          Create Budget
        </button>
      </div>
      </div>

      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="flex items-center mb-4">
          <div className={`flex items-center w-full max-w-md px-3 py-2 rounded-md ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Search size={18} className="mr-2 opacity-70" />
            <input
              type="text"
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full bg-transparent border-none outline-none ${
                theme === 'dark' ? 'placeholder-gray-500' : 'placeholder-gray-400'
              }`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${
                theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
              }`}>
                <th className="px-4 py-3 text-left">Budget Name</th>
                <th className="px-4 py-3 text-left">Start Date</th>
                <th className="px-4 py-3 text-left">End Date</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBudgets.map((budget) => (
                <tr 
                  key={budget.id}
                  className={`${
                    theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
                  } hover:bg-opacity-10 hover:bg-blue-500`}
                >
                  <td className="px-4 py-3">{budget.name}</td>
                  <td className="px-4 py-3">{budget.start_date}</td>
                  <td className="px-4 py-3">{budget.end_date}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-1 rounded text-xs ${
                      budget.status === 'active'
                        ? theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                        : theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {budget.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        title='Edit Budget'
                        onClick={() => navigate(`/app/masters/budget/edit/${budget.id}`)}
                        className={`p-1 rounded ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        title="Delete Budget"
                        onClick={() => handleDelete(budget.id)}
                        className={`p-1 rounded ${
                          theme === 'dark'
                            ? 'hover:bg-gray-700'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBudgets.length === 0 && (
          <div className="text-center py-8">
            <p className="opacity-70">No budgets found matching your search.</p>
          </div>
        )}
      </div>

      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Keyboard Shortcuts:</span> Ctrl+N to create a new budget, Ctrl+E to edit, Ctrl+D to delete.
        </p>
      </div>
    </div>
  );
};

export default BudgetList;
