import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Search, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2'; 

const CostCenterList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const [costCenters, setCostCenters] = useState<{ id: string; name: string; category: string }[]>([]);

 const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('userType');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');

  useEffect(() => {
    if (!companyId || !ownerType || !ownerId) return;
    fetch(`http://localhost:5000/api/cost-centers/list/all?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`)
      .then(res => res.json())
      .then(data => setCostCenters(data))
      .catch(err => console.error('Error loading cost centers:', err));
  }, [companyId, ownerType, ownerId]);


  const handleDelete = async (id: string) => {
    if (!companyId || !ownerType || !ownerId) return;

    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/cost-centers/${id}?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        Swal.fire('Deleted!', 'Cost center has been deleted.', 'success');
        setCostCenters(prev => prev.filter(center => center.id !== id));
      } else {
        const errorData = await response.json();
        Swal.fire('Error', errorData.message || 'Failed to delete cost center', 'error');
      }
    } catch (err) {
      console.error('Error deleting cost center:', err);
      Swal.fire('Error', 'Network or server error', 'error');
    }
  };


  const filteredCostCenters = costCenters.filter(center =>
    center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    center.category.toLowerCase().includes(searchTerm.toLowerCase())
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
                <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  Cost Center List
                </h1>
            <div className="ml-auto flex space-x-2">

        <button
        title='Create New Cost Center'
          onClick={() => navigate('/app/masters/cost-center/create')}
          className={`flex items-center px-4 py-2 rounded ${
            theme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus size={18} className="mr-1" />
          Create Cost Center
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
              placeholder="Search cost centers..."
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
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCostCenters.map((center) => (
                <tr 
                  key={center.id}
                  className={`${
                    theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
                  } hover:bg-opacity-10 hover:bg-blue-500`}
                >
                  <td className="px-4 py-3">{center.name}</td>
                  <td className="px-4 py-3">{center.category}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        title="Edit Cost Center"
                        onClick={() => navigate(`/app/masters/cost-center/edit/${center.id}`)}
                        className={`p-1 rounded ${
                          theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                        }`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
  title="Delete Cost Center"
  onClick={() => handleDelete(center.id)}   // <-- add this
  className={`p-1 rounded ${
    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
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
        
        {filteredCostCenters.length === 0 && (
          <div className="text-center py-8">
            <p className="opacity-70">No cost centers found matching your search.</p>
          </div>
        )}
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Keyboard Shortcuts:</span> Ctrl+C to create a new cost center, Ctrl+A to alter, Ctrl+D to delete.
        </p>
      </div>
    </div>
    
  );
};

export default CostCenterList;