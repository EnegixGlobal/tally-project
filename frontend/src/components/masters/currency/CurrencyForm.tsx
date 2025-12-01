import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Swal from 'sweetalert2';

interface CurrencyFormData {
  code: string;
  symbol: string;
  name: string;
  exchangeRate: number;
  isBase: boolean;
}

const CurrencyForm: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('supplier'); // e.g. 'employee' or 'user'
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');
  const [formData, setFormData] = useState<CurrencyFormData>({
    code: '',
    symbol: '',
    name: '',
    exchangeRate: 1,
    isBase: false
  });


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!companyId || !ownerType || !ownerId) {
    Swal.fire("Error", "Invalid session. Please login again.", "error");
    return;
  }

  const payload = {
    ...formData,
    companyId,
    ownerType,
    ownerId,
  };

  const queryParams = `?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`;

  const url = isEditMode
    ? `${import.meta.env.VITE_API_URL}/api/currencies/${id}${queryParams}`
    : `${import.meta.env.VITE_API_URL}/api/currencies${queryParams}`;

  const method = isEditMode ? "PUT" : "POST";

  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (res.ok) {
      Swal.fire("Success", data.message, "success");
      navigate("/app/masters/currency");
    } else {
      Swal.fire("Error", data.message || "Operation failed", "error");
    }
  } catch (err) {
    console.error("Submit Error:", err);
    Swal.fire("Error", "Something went wrong!", "error");
  }
};


  

 useEffect(() => {
  if (isEditMode && id) {
    const fetchCurrency = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/currencies/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`);
        const data = await res.json();

        if (res.ok && data) {
          setFormData({
            code: data.code,
            symbol: data.symbol,
            name: data.name,
            exchangeRate: data.exchangeRate,
            isBase: data.isBase
          });
        } else {
          Swal.fire('Error', 'Failed to fetch currency data', 'error');
        }
      } catch (err) {
        console.error('Fetch currency error:', err);
        Swal.fire('Error', 'Something went wrong while fetching currency!', 'error');
      }
    };

    fetchCurrency();
  }
}, [id, isEditMode, companyId, ownerType, ownerId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   // Handle form submission
  //   navigate('/masters/currency');
  // };

  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button
        title='Back to Currency List'
          onClick={() => navigate('/app/masters/currency')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit' : 'Create'} Currency</h1>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="code">
                Currency Code
              </label>
              <input
                type="text"
                id="code"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                maxLength={3}
                placeholder="e.g., USD"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="symbol">
                Symbol
              </label>
              <input
                type="text"
                id="symbol"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                required
                maxLength={1}
                placeholder="e.g., $"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Currency Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="e.g., US Dollar"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="exchangeRate">
                Exchange Rate
              </label>
              <input
                type="number"
                id="exchangeRate"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleChange}
                required
                min="0"
                step="0.0001"
                placeholder="1.0000"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="isBase"
                  checked={formData.isBase}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Set as base currency</span>
              </label>
              <p className="mt-1 text-sm opacity-70">
                Base currency has an exchange rate of 1.0000. All other currencies are converted relative to the base currency.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/app/masters/currency')}
              className={`px-4 py-2 rounded ${
                theme === 'dark' 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex items-center px-4 py-2 rounded ${
                theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <Save size={18} className="mr-1" />
              {isEditMode ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press F9 to save, Esc to cancel.
        </p>
      </div>
    </div>
  );
};

export default CurrencyForm;