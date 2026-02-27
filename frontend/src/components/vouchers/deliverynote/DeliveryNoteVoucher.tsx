import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import type { VoucherEntry, Ledger } from '../../../types';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const DeliveryNoteVoucher: React.FC = () => {
  const { theme, ledgers} = useAppContext();
  const navigate = useNavigate();
  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('userType');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');
  const generateVoucherNumber = () => {
  const prefix = 'DLVRYNV';
  const randomNumber = Math.floor(100000 + Math.random() * 900000); // 6-digit
  return `${prefix}${randomNumber}`;
};
  const [formData, setFormData] = useState<Omit<VoucherEntry, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'sales',
    number: generateVoucherNumber(),
    narration: '',
    entries: [
      { id: '1', ledgerId: '', amount: 0, type: 'debit' },
      { id: '2', ledgerId: '', amount: 0, type: 'credit' }
    ]
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === "date") return; // ALWAYS locked for new
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEntryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    const updatedEntries = [...formData.entries];
    updatedEntries[index] = {
      ...updatedEntries[index],
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    };
    
    setFormData(prev => ({ ...prev, entries: updatedEntries }));
  };

  const addEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [
        ...prev.entries,
        { id: (prev.entries.length + 1).toString(), ledgerId: '', amount: 0, type: 'credit' }
      ]
    }));
  };

  const removeEntry = (index: number) => {
    if (formData.entries.length <= 2) return;
    
    const updatedEntries = [...formData.entries];
    updatedEntries.splice(index, 1);
    
    setFormData(prev => ({ ...prev, entries: updatedEntries }));
  };

  const totalDebit = formData.entries
    .filter(entry => entry.type === 'debit')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const totalCredit = formData.entries
    .filter(entry => entry.type === 'credit')
    .reduce((sum, entry) => sum + entry.amount, 0);
    
  const isBalanced = totalDebit === totalCredit;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isBalanced) {
        alert('Total debit must equal total credit');
        return;
    }


    const payload = {
        ...formData,
         companyId,
        ownerType,
        ownerId   };

    fetch(`${import.meta.env.VITE_API_URL}/api/DeliveryItem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(() => {
        Swal.fire({
            icon: 'success',
            title: 'Success!',
            text: 'Delivery Note Saved Successfully.',
            confirmButtonColor: '#3085d6'
        }).then(() => {
            navigate('/app/vouchers');
        });
    })
    .catch(err => console.error(err));
};


  return (
    <div className='pt-[56px] px-4 '>
      <div className="flex items-center mb-6">
        <button
        title='Back to Vouchers'
          onClick={() => navigate('/app/vouchers')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Delivery Note</h1>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="date">
                Date
              </label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                readOnly={true}
                min={new Date().toLocaleDateString('en-CA')}
                max={new Date().toLocaleDateString('en-CA')}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors opacity-70 cursor-not-allowed`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="number">
                Delivery Note No.
              </label>
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="Auto"
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } outline-none transition-colors`}
              />
            </div>
          </div>
          
          <div className={`p-4 mb-6 rounded ${
            theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Delivery Items</h3>
              <button
                type="button"
                onClick={addEntry}
                className={`flex items-center text-sm px-2 py-1 rounded ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Plus size={16} className="mr-1" />
                Add Item
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full mb-4">
                <thead>
                  <tr className={`${
                    theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'
                  }`}>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.entries.map((entry, index) => (
                    <tr 
                      key={index}
                      className={`${
                        theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'
                      }`}
                    >
                      <td className="px-4 py-2">
                        <select
                        title='Select Ledger'
                          name="ledgerId"
                          value={entry.ledgerId}
                          onChange={(e) => handleEntryChange(index, e)}
                          required
                          className={`w-full p-2 rounded border ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                              : 'bg-white border-gray-300 focus:border-blue-500'
                          } outline-none transition-colors`}
                        >
                          <option value="">Select Item</option>
                          {ledgers.map((ledger: Ledger) => (
                            <option key={ledger.id} value={ledger.id}>
                              {ledger.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                        title='Enter Quantity'
                          type="number"
                          name="quantity"
                          defaultValue={1}
                          min="0"
                          step="0.01"
                          className={`w-full p-2 rounded border text-right ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                              : 'bg-white border-gray-300 focus:border-blue-500'
                          } outline-none transition-colors`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                        title='Enter Rate'
                          type="number"
                          name="rate"
                          defaultValue={0}
                          min="0"
                          step="0.01"
                          className={`w-full p-2 rounded border text-right ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                              : 'bg-white border-gray-300 focus:border-blue-500'
                          } outline-none transition-colors`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                        title='Enter Amount'
                          type="number"
                          name="amount"
                          value={entry.amount}
                          onChange={(e) => handleEntryChange(index, e)}
                          required
                          min="0"
                          step="0.01"
                          className={`w-full p-2 rounded border text-right ${
                            theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                              : 'bg-white border-gray-300 focus:border-blue-500'
                          } outline-none transition-colors`}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                        title='Remove Entry'
                          type="button"
                          onClick={() => removeEntry(index)}
                          disabled={formData.entries.length <= 1}
                          className={`p-1 rounded ${
                            formData.entries.length <= 1
                              ? 'opacity-50 cursor-not-allowed'
                              : theme === 'dark' 
                                ? 'hover:bg-gray-600' 
                                : 'hover:bg-gray-300'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`font-semibold ${
                    theme === 'dark' ? 'border-t border-gray-600' : 'border-t border-gray-300'
                  }`}>
                    <td className="px-4 py-2 text-right" colSpan={3}>Total Amount:</td>
                    <td className="px-4 py-2 text-right">
                      {(totalDebit + totalCredit).toLocaleString()}
                    </td>
                    <td className="px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="narration">
              Delivery Instructions
            </label>
            <textarea
              id="narration"
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              rows={3}
              className={`w-full p-2 rounded border ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                  : 'bg-white border-gray-300 focus:border-blue-500'
              } outline-none transition-colors`}
            />
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/app/vouchers')}
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
              Save
            </button>
          </div>
        </form>
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Note:</span> Delivery notes track goods delivered to customers without immediate invoicing.
        </p>
      </div>
    </div>
  );
};

export default DeliveryNoteVoucher;