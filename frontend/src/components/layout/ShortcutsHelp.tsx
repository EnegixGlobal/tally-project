import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { X } from 'lucide-react';
import { keyboardShortcuts } from '../../data/defaultData';

interface ShortcutsHelpProps {
  onClose: () => void;
}

const ShortcutsHelp: React.FC<ShortcutsHelpProps> = ({ onClose }) => {
  const { theme } = useAppContext();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-2/3 max-w-2xl max-h-[80vh] overflow-auto rounded-lg ${
        theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-900'
      } shadow-xl`}>
        <div className={`flex justify-between items-center p-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold">Keyboard Shortcuts</h2>
          <button 
          title='Close Shortcuts Help'
            onClick={onClose}
            className={`p-1 rounded-md ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(keyboardShortcuts).map(([key, description], index) => (
              <div key={index} className="flex items-center">
                <kbd className={`px-2 py-1 text-xs font-semibold rounded mr-2 ${
                  theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                }`}>
                  {key}
                </kbd>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </div>
        <div className={`p-4 border-t ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        } text-center text-sm`}>
          Press <kbd className={`px-2 py-1 text-xs font-semibold rounded ${
            theme === 'dark' ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-800'
          }`}>Esc</kbd> to close
        </div>
      </div>
    </div>
  );
};

export default ShortcutsHelp;