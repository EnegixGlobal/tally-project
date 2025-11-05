import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, Plus, Search, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const UnitList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [units, setUnits] = useState<any[]>([]);
  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('userType');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');

  // 🔹 Fetch units from backend
  const fetchUnits = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/stock-units?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`);
      const data = await res.json();
      setUnits(data);
    } catch (error) {
      console.error('Failed to fetch units:', error);
    }
  };

  // 🔹 Delete unit with confirmation
  const handleDelete = async (unitId: string) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will permanently delete the unit.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await fetch(`http://localhost:5000/api/stock-units/${unitId}`, {
          method: 'DELETE'
        });

        const result = await res.json();

        if (!res.ok) {
          Swal.fire('Error', result.message || 'Failed to delete unit', 'error');
          return;
        }

        Swal.fire('Deleted!', result.message || 'Unit deleted successfully', 'success');
        fetchUnits(); // Refresh list
      } catch (error) {
        Swal.fire('Error', 'Server error. Please try again later.', 'error');
      }
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='pt-[56px] px-4 '>
        <div className="flex justify-between items-center mb-6">
         <div className="flex items-center mb-6">        
          <button
            title="Back to Masters"
            onClick={() => navigate('/app/masters')}
            className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <ArrowLeft size={20} />
          </button>
        <h1 className="text-2xl font-bold">Units of Measurement</h1>
        </div>
        <button
          title='Create New Unit'
          onClick={() => navigate('/app/masters/unit/create')}
          className={`flex items-center px-4 py-2 rounded ${
            theme === 'dark' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          <Plus size={18} className="mr-1" />
          Create Unit
        </button>
      </div>

      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="flex items-center mb-4">
          <div className={`flex items-center w-full max-w-md px-3 py-2 rounded-md ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <Search size={18} className="mr-2 opacity-70" />
            <input
              type="text"
              placeholder="Search units..."
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
              <tr className={`${theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'}`}>
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Symbol</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr 
                  key={unit.id}
                  className={`${
                    theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
                  } hover:bg-opacity-10 hover:bg-blue-500`}
                >
                  <td className="px-4 py-3">{unit.name}</td>
                  <td className="px-4 py-3 font-mono">{unit.symbol}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center space-x-2">
                      <button
                        title="Edit Unit"
                        onClick={() => navigate(`/app/masters/unit/edit/${unit.id}`)}
                        className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        title="Delete Unit"
                        onClick={() => handleDelete(unit.id)}
                        className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
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

        {filteredUnits.length === 0 && (
          <div className="text-center py-8">
            <p className="opacity-70">No units found matching your search.</p>
          </div>
        )}
      </div>

      <div className={`mt-6 p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <p className="text-sm">
          <span className="font-semibold">Pro Tip:</span> Press Alt+F3 to access Masters, then use arrow keys to navigate to Units.
        </p>
      </div>
    </div>
  );
};

export default UnitList;
