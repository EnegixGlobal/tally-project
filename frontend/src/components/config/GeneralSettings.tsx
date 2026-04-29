import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const GeneralSettings = () => {
  const navigate= useNavigate();

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
         <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/config')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
            </div>
        <div className="flex items-center justify-between">
          <div>
            
            <p className="text-sm text-gray-600 mt-1">Configure basic system settings and company information</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default GeneralSettings;