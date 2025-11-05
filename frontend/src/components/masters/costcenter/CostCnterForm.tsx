import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import Swal from 'sweetalert2';

interface CostCenterFormData {
  name: string;
  category: string;
  description: string;
}

const CostCenterForm: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('userType');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');
  const [formData, setFormData] = useState<CostCenterFormData>({
    name: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    if (isEditMode && id) {
      fetch(`http://localhost:5000/api/cost-centers/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`)
        .then(res => res.json())
        .then(data => {
          setFormData({
            name: data.name,
            category: data.category,
            description: data.description,
          });
        })
        .catch(err => console.error('Error fetching cost center:', err));
    }
  }, [id, isEditMode, companyId, ownerType, ownerId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
const validateForm = () => {
    if (!formData.name.trim()) {
      Swal.fire('Validation Error', 'Cost Center Name is required.', 'warning');
      return false;
    }
    if (!formData.category.trim()) {
      Swal.fire('Validation Error', 'Category is required.', 'warning');
      return false;
    }
    return true;
  };
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validateForm()) return;

  const payload = {
    ...formData,
    companyId,
    ownerType,
    ownerId,
  };

  try {
    const url = isEditMode
      ? `http://localhost:5000/api/cost-centers/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
      : 'http://localhost:5000/api/cost-centers/save';

    const method = isEditMode ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: data.message,
      }).then(() => {
        navigate('/app/masters/cost-centers');
      });
    } else {
      Swal.fire('Error', data.message || 'Something went wrong', 'error');
    }
  } catch (error) {
    console.error('Error:', error);
    Swal.fire('Network Error', 'Failed to connect to the server.', 'error');
  }
};


//   const handleSubmit = async (e: React.FormEvent) => {
//   e.preventDefault();
// try {
//     const response = await fetch('http://localhost:5000/api/cost-centers/save', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ ...formData, id }),
//     });
//     const result = await response.json();

//     if (result.success) {
//       alert(result.message);
//       navigate('/app/masters/cost-centers');
//     } else {
//       alert('Error: ' + (result.error || 'Something went wrong'));
//     }
//   } catch (err) {
//     console.error('Failed to save cost center:', err);
//     alert('Network or server error');
//   }
// };


  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button
        title='Back to Cost Centers'
          onClick={() => navigate('/app/masters/cost-centers')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">{isEditMode ? 'Edit' : 'Create'} Cost Center</h1>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="name">
                Cost Center Name
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
              <label className="block text-sm font-medium mb-1" htmlFor="category">
                Category
              </label>
              <input
                type="text"
                id="category"
                name="category"
                value={formData.category}
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
              onClick={() => navigate('/app/masters/cost-center')}
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

export default CostCenterForm;