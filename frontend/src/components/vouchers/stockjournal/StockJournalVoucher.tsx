import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import type { VoucherEntry, Ledger } from '../../../types';
import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';

const StockJournalVoucher: React.FC = () => {
  const { theme, ledgers, addVoucher } = useAppContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<Omit<VoucherEntry, 'id'>>({
    date: new Date().toISOString().split('T')[0],
    type: 'journal',
    number: '',
    narration: '',
    entries: [
      { id: '1', ledgerId: '', batchNumber: '', quantity: 1, rate: 0, amount: 0, type: 'debit' },
      { id: '2', ledgerId: '', batchNumber: '', quantity: 1, rate: 0, amount: 0, type: 'credit' },
    ],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEntryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const updatedEntries = [...formData.entries];

    updatedEntries[index] = {
      ...updatedEntries[index],
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    };

    const { quantity, rate } = updatedEntries[index];
    updatedEntries[index].amount = (quantity || 0) * (rate || 0);

    setFormData(prev => ({ ...prev, entries: updatedEntries }));
  };

  const addEntry = () => {
    setFormData(prev => ({
      ...prev,
      entries: [
        ...prev.entries,
        { id: (prev.entries.length + 1).toString(), ledgerId: '', batchNumber: '', quantity: 1, rate: 0, amount: 0, type: 'credit' },
      ],
    }));
  };

  const removeEntry = (index: number) => {
    if (formData.entries.length <= 2) return;
    const updatedEntries = [...formData.entries];
    updatedEntries.splice(index, 1);
    setFormData(prev => ({ ...prev, entries: updatedEntries }));
  };

  const totalDebit = formData.entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
  const totalCredit = formData.entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
  const isBalanced = totalDebit === totalCredit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) {
      alert('Total debit must equal total credit');
      return;
    }

    const employeeId = localStorage.getItem('employee_id');

    const formattedEntries = formData.entries.map(entry => ({
      id: entry.id,
      ledgerId: entry.ledgerId,
      batchNumber: entry.batchNumber || '',
      quantity: parseFloat((entry.quantity || 0).toString()),
      rate: parseFloat((entry.rate || 0).toString()),
      amount: parseFloat((entry.amount || 0).toString()),
      type: entry.type,
    }));

    const payload = {
      date: formData.date,
      number: formData.number || 'Auto',
      narration: formData.narration,
      type: 'journal',
      employee_id: employeeId,
      entries: formattedEntries,
    };

    try {
      const response = await fetch('http://localhost:5000/api/StockJournal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to save voucher');

      addVoucher(await response.json());
      alert('Voucher saved successfully!');
      // navigate('/app/vouchers');
    } catch (err) {
      console.error(err);
      alert('Failed to save voucher.');
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Vouchers"
          type="button"
          onClick={() => navigate('/app/vouchers')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Stock Journal Voucher</h1>
      </div>

      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1">Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Voucher No.</label>
              <input
                type="text"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder="Auto"
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>
          </div>

          <div className={`p-4 mb-6 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Stock Entries</h3>
              <button
                type="button"
                onClick={addEntry}
                className={`flex items-center text-sm px-2 py-1 rounded ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <Plus size={16} className="mr-1" />
                Add Line
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full mb-4 border-collapse">
                <thead>
                  <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                    <th className="px-4 py-2 text-left">Stock Item</th>
                    <th className="px-4 py-2 text-left">Batch No.</th>
                    <th className="px-4 py-2 text-left">In/Out</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.entries.map((entry, index) => (
                    <tr key={index} className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                      <td className="px-4 py-2">
                        <select
                          name="ledgerId"
                          value={entry.ledgerId}
                          onChange={(e) => handleEntryChange(index, e)}
                          required
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        >
                          <option value="">Select Stock Item</option>
                          {ledgers.map((ledger: Ledger) => (
                            <option key={ledger.id} value={ledger.id}>{ledger.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          name="batchNumber"
                          value={entry.batchNumber}
                          onChange={(e) => handleEntryChange(index, e)}
                          placeholder="Batch No."
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <select
                          name="type"
                          value={entry.type}
                          onChange={(e) => handleEntryChange(index, e)}
                          className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        >
                          <option value="debit">In</option>
                          <option value="credit">Out</option>
                        </select>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          name="quantity"
                          value={entry.quantity}
                          onChange={(e) => handleEntryChange(index, e)}
                          min="0"
                          step="0.01"
                          className={`w-full p-2 rounded border text-right ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          name="rate"
                          value={entry.rate}
                          onChange={(e) => handleEntryChange(index, e)}
                          min="0"
                          step="0.01"
                          className={`w-full p-2 rounded border text-right ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          name="amount"
                          value={entry.amount}
                          readOnly
                          className={`w-full p-2 rounded border text-right ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        />
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeEntry(index)}
                          disabled={formData.entries.length <= 2}
                          className={`p-1 rounded ${formData.entries.length <= 2 ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className={`font-semibold ${theme === 'dark' ? 'border-t border-gray-600' : 'border-t border-gray-300'}`}>
                    <td className="px-4 py-2 text-right" colSpan={4}>Totals:</td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex flex-col">
                        <span>In: {totalDebit.toLocaleString()}</span>
                        <span>Out: {totalCredit.toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-center">
                      {isBalanced ? (
                        <span className={`px-2 py-1 rounded text-xs ${theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'}`}>
                          Balanced
                        </span>
                      ) : (
                        <span className={`px-2 py-1 rounded text-xs ${theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                          Unbalanced
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Narration</label>
            <textarea
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              rows={3}
              className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/app/vouchers')}
              className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isBalanced}
              className={`flex items-center px-4 py-2 rounded ${!isBalanced ? 'opacity-50 cursor-not-allowed bg-blue-600' : theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <Save size={18} className="mr-1" />
              Save
            </button>
          </div>
        </form>
      </div>

      <div className={`mt-6 p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <p className="text-sm"><span className="font-semibold">Note:</span> Stock journal vouchers are used for stock transfers and adjustments.</p>
      </div>
    </div>
  );
};

export default StockJournalVoucher;
