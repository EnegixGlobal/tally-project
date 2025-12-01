import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Swal from 'sweetalert2';

interface GodownFormData {
  name: string;
  address: string;
  description: string;
}

const GodownForm: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('supplier');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');

  const [formData, setFormData] = useState<GodownFormData>({
    name: '',
    address: '',
    description: ''
  });

  useEffect(() => {
  if (isEditMode && id) {
    const fetchGodown = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/godowns/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const result = await response.json();

        if (result.success && result.data) {
          setFormData({
            name: result.data.name || '',
            address: result.data.address || '',
            description: result.data.description || ''
          });
        } else {
          Swal.fire('Error', result.message || 'Failed to fetch godown', 'error');
        }
      } catch (error) {
        console.error('Error fetching godown:', error);
        Swal.fire('Error', 'Something went wrong while fetching!', 'error');
      }
    };

    fetchGodown();
  }
}, [id, isEditMode]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const url = isEditMode
    ? `${import.meta.env.VITE_API_URL}/api/godowns/${id}`
    : `${import.meta.env.VITE_API_URL}/api/godowns`;

  const method = isEditMode ? 'PUT' : 'POST';

  try {
    const response = await fetch(
      `${url}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
      {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, companyId, ownerType, ownerId }),
      }
    );

    const result = await response.json();

    if (result.success) {
      Swal.fire('Success', result.message, 'success').then(() => {
        navigate('/app/masters/godowns');
      });
    } else {
      Swal.fire('Error', result.message, 'error');
    }
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'Something went wrong!', 'error');
  }
};


  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button
        title='Back to Godown List'
          onClick={() => navigate('/app/masters/godowns')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit' : 'Create'} Godown</h1>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Godown Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="address">
                Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1" htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/app/masters/godowns')}
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

export default GodownForm;