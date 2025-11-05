import React from 'react';
import { Printer, FileText, Truck, Mail, MessageCircle, X } from 'lucide-react';

interface PrintOptionsProps {
  theme: string;
  showPrintOptions: boolean;
  onClose: () => void;
  onGenerateInvoice: () => void;
  onGenerateEWayBill: () => void;
  onGenerateEInvoice: () => void;
  onSendToEmail: () => void;
  onSendToWhatsApp: () => void;
}

const PrintOptions: React.FC<PrintOptionsProps> = ({
  theme,
  showPrintOptions,
  onClose,
  onGenerateInvoice,
  onGenerateEWayBill,
  onGenerateEInvoice,
  onSendToEmail,
  onSendToWhatsApp
}) => {
  if (!showPrintOptions) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`p-8 rounded-lg max-w-md w-full mx-4 ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 shadow-xl'}`}>
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center">
            <Printer className="mr-3 text-blue-600" size={28} />
            Print Options
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              theme === 'dark' 
                ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
            }`}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Print Options Grid */}
        <div className="grid grid-cols-1 gap-4">
          {/* Generate Invoice */}
          <button
            onClick={onGenerateInvoice}
            className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-blue-500 hover:bg-gray-700 bg-gray-750'
                : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 bg-white'
            } group`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mr-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">📄 Generate Invoice</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Print regular tax invoice
              </p>
            </div>
          </button>

          {/* Generate E-way Bill */}
          <button
            onClick={onGenerateEWayBill}
            className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-green-500 hover:bg-gray-700 bg-gray-750'
                : 'border-gray-200 hover:border-green-500 hover:bg-green-50 bg-white'
            } group`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <Truck size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">🚛 Generate E-way Bill</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Generate E-way bill for transportation
              </p>
            </div>
          </button>

          {/* Generate E-Invoice */}
          <button
            onClick={onGenerateEInvoice}
            className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-purple-500 hover:bg-gray-700 bg-gray-750'
                : 'border-gray-200 hover:border-purple-500 hover:bg-purple-50 bg-white'
            } group`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mr-4 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileText size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">⚡ Generate E-Invoice</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Generate government E-Invoice
              </p>
            </div>
          </button>

          {/* Send to Email */}
          <button
            onClick={onSendToEmail}
            className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-orange-500 hover:bg-gray-700 bg-gray-750'
                : 'border-gray-200 hover:border-orange-500 hover:bg-orange-50 bg-white'
            } group`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mr-4 group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Mail size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">📧 Send to Email</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Email invoice to customer
              </p>
            </div>
          </button>

          {/* Send to WhatsApp */}
          <button
            onClick={onSendToWhatsApp}
            className={`flex items-center p-4 rounded-lg border-2 transition-all duration-200 ${
              theme === 'dark'
                ? 'border-gray-600 hover:border-green-500 hover:bg-gray-700 bg-gray-750'
                : 'border-gray-200 hover:border-green-500 hover:bg-green-50 bg-white'
            } group`}
          >
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mr-4 group-hover:bg-green-600 group-hover:text-white transition-colors">
              <MessageCircle size={24} />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">💬 Send to WhatsApp</h3>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Share invoice via WhatsApp
              </p>
            </div>
          </button>
        </div>

        {/* Modal Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            onClick={onClose}
            className={`w-full py-2 px-4 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrintOptions;
