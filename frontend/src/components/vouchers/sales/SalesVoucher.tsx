// import React, { useState } from 'react';
// import { useAppContext } from '../../../context/AppContext';
// import { useNavigate } from 'react-router-dom';
// import type { VoucherEntry, Ledger } from '../../../types';
// import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';

// const SalesVoucher: React.FC = () => {
//   const { theme, ledgers, addVoucher } = useAppContext();
//   const navigate = useNavigate();


//   const [mode, setMode] = useState<'item' | 'accounting' | 'voucher'>('accounting');
  
//   const [formData, setFormData] = useState<Omit<VoucherEntry, 'id'>>({
//     date: new Date().toISOString().split('T')[0],
//     type: 'sales',
//     number: '',
//     narration: '',
//     entries: [
//       { id: '1', ledgerId: '', amount: 0, type: 'debit' },
//       { id: '2', ledgerId: '', amount: 0, type: 'credit' }
//     ]
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleEntryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;
    
//     const updatedEntries = [...formData.entries];
//     updatedEntries[index] = {
//       ...updatedEntries[index],
//       [name]: type === 'number' ? parseFloat(value) || 0 : value
//     };
    
//     setFormData(prev => ({ ...prev, entries: updatedEntries }));
//   };

//   const addEntry = () => {
//     setFormData(prev => ({
//       ...prev,
//       entries: [
//         ...prev.entries,
//         { id: (prev.entries.length + 1).toString(), ledgerId: '', amount: 0, type: 'credit' }
//       ]
//     }));
//   };

//   const removeEntry = (index: number) => {
//     if (formData.entries.length <= 2) return;
    
//     const updatedEntries = [...formData.entries];
//     updatedEntries.splice(index, 1);
    
//     setFormData(prev => ({ ...prev, entries: updatedEntries }));
//   };

//   const totalDebit = formData.entries
//     .filter(entry => entry.type === 'debit')
//     .reduce((sum, entry) => sum + entry.amount, 0);
    
//   const totalCredit = formData.entries
//     .filter(entry => entry.type === 'credit')
//     .reduce((sum, entry) => sum + entry.amount, 0);
    
//   const isBalanced = totalDebit === totalCredit;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!isBalanced) {
//       alert('Total debit must equal total credit');
//       return;
//     }
    
//     const newVoucher: VoucherEntry = {
//       id: Math.random().toString(36).substring(2, 9),
//       ...formData
//     };
    
//     addVoucher(newVoucher);
//     navigate('/vouchers');
//   };

//   return (
//     <div className='pt-[56px] px-4 '>
//       <div className="flex items-center mb-6">
//         <button
//         title='Back to Vouchers'
//           onClick={() => navigate('/vouchers')}
//           className={`mr-4 p-2 rounded-full ${
//             theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//           }`}
//         >
//           <ArrowLeft size={20} />
//         </button>
//         <h1 className="text-2xl font-bold">Sales Voucher</h1>
//       </div>
      
//       <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//             <div>
//               <label className="block text-sm font-medium mb-1" htmlFor="date">
//                 Date
//               </label>
//               <input
//                 type="date"
//                 id="date"
//                 name="date"
//                 value={formData.date}
//                 onChange={handleChange}
//                 required
//                 className={`w-full p-2 rounded border ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                     : 'bg-white border-gray-300 focus:border-blue-500'
//                 } outline-none transition-colors`}
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium mb-1" htmlFor="number">
//                 Invoice No.
//               </label>
//               <input
//                 type="text"
//                 id="number"
//                 name="number"
//                 value={formData.number}
//                 onChange={handleChange}
//                 placeholder="Auto"
//                 className={`w-full p-2 rounded border ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                     : 'bg-white border-gray-300 focus:border-blue-500'
//                 } outline-none transition-colors`}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium mb-1" htmlFor="number">
//                Voucher mode.
//               </label>
//               <select
//             title='Select Voucher Mode'
//             value={mode}
//             onChange={(e) => {
//               setMode(e.target.value as 'item' | 'accounting' | 'voucher');
//               setFormData(prev => ({
//                 ...prev,
//                 entries: [
//                   { id: '1', ledgerId: '', amount: 0, type: 'debit', itemId: '', quantity: 0, rate: 0, gstRate: 0 },
//                   { id: '2', ledgerId: '', amount: 0, type: 'credit', itemId: '', quantity: 0, rate: 0, gstRate: 0 }
//                 ]
//               }));
//             }}
//             className={`w-full md:w-48 p-2 rounded border ${
//               theme === 'dark' 
//                 ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                 : 'bg-white border-gray-300 focus:border-blue-500'
//             } outline-none transition-colors`}
//           >
//             <option value="item">Item Invoice</option>
//             <option value="accounting">Accounting Invoice</option>
//             <option value="voucher">As Voucher</option>
//           </select>
//             </div>
//           </div>
          
//           <div className={`p-4 mb-6 rounded ${
//             theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
//           }`}>
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="font-semibold">Entries</h3>
//               <button
//                 type="button"
//                 onClick={addEntry}
//                 className={`flex items-center text-sm px-2 py-1 rounded ${
//                   theme === 'dark' 
//                     ? 'bg-blue-600 hover:bg-blue-700' 
//                     : 'bg-blue-600 hover:bg-blue-700 text-white'
//                 }`}
//               >
//                 <Plus size={16} className="mr-1" />
//                 Add Line
//               </button>
//             </div>
            
//             <div className="overflow-x-auto">
//               <table className="w-full mb-4">
//                 <thead>
//                   <tr className={`${
//                     theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'
//                   }`}>
//                     <th className="px-4 py-2 text-left">Ledger Account</th>
//                     <th className="px-4 py-2 text-left">Dr/Cr</th>
//                     <th className="px-4 py-2 text-right">Amount</th>
//                     <th className="px-4 py-2 text-center">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {formData.entries.map((entry, index) => (
//                     <tr 
//                       key={index}
//                       className={`${
//                         theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'
//                       }`}
//                     >
//                       <td className="px-4 py-2">
//                         <select
//                         title='Select Ledger Account'
//                           name="ledgerId"
//                           value={entry.ledgerId}
//                           onChange={(e) => handleEntryChange(index, e)}
//                           required
//                           className={`w-full p-2 rounded border ${
//                             theme === 'dark' 
//                               ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                               : 'bg-white border-gray-300 focus:border-blue-500'
//                           } outline-none transition-colors`}
//                         >
//                           <option value="">Select Ledger</option>
//                           {ledgers.map((ledger: Ledger) => (
//                             <option key={ledger.id} value={ledger.id}>
//                               {ledger.name}
//                             </option>
//                           ))}
//                         </select>
//                       </td>
//                       <td className="px-4 py-2">
//                         <select
//                             title='Select Debit or Credit'
//                           name="type"
//                           value={entry.type}
//                           onChange={(e) => handleEntryChange(index, e)}
//                           required
//                           className={`w-full p-2 rounded border ${
//                             theme === 'dark' 
//                               ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                               : 'bg-white border-gray-300 focus:border-blue-500'
//                           } outline-none transition-colors`}
//                         >
//                           <option value="debit">Dr</option>
//                           <option value="credit">Cr</option>
//                         </select>
//                       </td>
//                       <td className="px-4 py-2">
//                         <input
//                             title='Enter Amount'
//                           type="number"
//                           name="amount"
//                           value={entry.amount}
//                           onChange={(e) => handleEntryChange(index, e)}
//                           required
//                           min="0"
//                           step="0.01"
//                           className={`w-full p-2 rounded border text-right ${
//                             theme === 'dark' 
//                               ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                               : 'bg-white border-gray-300 focus:border-blue-500'
//                           } outline-none transition-colors`}
//                         />
//                       </td>
//                       <td className="px-4 py-2 text-center">
//                         <button
//                         title='Remove Entry'
//                           type="button"
//                           onClick={() => removeEntry(index)}
//                           disabled={formData.entries.length <= 2}
//                           className={`p-1 rounded ${
//                             formData.entries.length <= 2
//                               ? 'opacity-50 cursor-not-allowed'
//                               : theme === 'dark' 
//                                 ? 'hover:bg-gray-600' 
//                                 : 'hover:bg-gray-300'
//                           }`}
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//                 <tfoot>
//                   <tr className={`font-semibold ${
//                     theme === 'dark' ? 'border-t border-gray-600' : 'border-t border-gray-300'
//                   }`}>
//                     <td className="px-4 py-2 text-right" colSpan={2}>Totals:</td>
//                     <td className="px-4 py-2 text-right">
//                       <div className="flex flex-col">
//                         <span>Dr: {totalDebit.toLocaleString()}</span>
//                         <span>Cr: {totalCredit.toLocaleString()}</span>
//                       </div>
//                     </td>
//                     <td className="px-4 py-2 text-center">
//                       {isBalanced ? (
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
//                         }`}>
//                           Balanced
//                         </span>
//                       ) : (
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
//                         }`}>
//                           Unbalanced
//                         </span>
//                       )}
//                     </td>
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//           </div>
          
//           <div className="mb-6">
//             <label className="block text-sm font-medium mb-1" htmlFor="narration">
//               Narration
//             </label>
//             <textarea
//               id="narration"
//               name="narration"
//               value={formData.narration}
//               onChange={handleChange}
//               rows={3}
//               className={`w-full p-2 rounded border ${
//                 theme === 'dark' 
//                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                   : 'bg-white border-gray-300 focus:border-blue-500'
//               } outline-none transition-colors`}
//             />
//           </div>
          
//           <div className="flex justify-end space-x-4">
//             <button
//             title='Cancel'
//               type="button"
//               onClick={() => navigate('/vouchers')}
//               className={`px-4 py-2 rounded ${
//                 theme === 'dark' 
//                   ? 'bg-gray-700 hover:bg-gray-600' 
//                   : 'bg-gray-200 hover:bg-gray-300'
//               }`}
//             >
//               Cancel
//             </button>
//             <button
//                 title='Save Voucher'
//               type="submit"
//               disabled={!isBalanced}
//               className={`flex items-center px-4 py-2 rounded ${
//                 !isBalanced
//                   ? 'opacity-50 cursor-not-allowed bg-blue-600'
//                   : theme === 'dark' 
//                     ? 'bg-blue-600 hover:bg-blue-700' 
//                     : 'bg-blue-600 hover:bg-blue-700 text-white'
//               }`}
//             >
//               <Save size={18} className="mr-1" />
//               Save
//             </button>
//           </div>
//         </form>
//       </div>
      
//       <div className={`mt-6 p-4 rounded ${
//         theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
//       }`}>
//         <p className="text-sm">
//           <span className="font-semibold">Note:</span> Sales vouchers record revenue transactions and customer invoices.
//         </p>
//       </div>
//     </div>
//   );
// };

// export default SalesVoucher;



// import React, { useState } from 'react';
// import { useAppContext } from '../../../context/AppContext';
// import { useNavigate } from 'react-router-dom';
// import type { VoucherEntry, Ledger, StockItem } from '../../../types';
// import { Save, Plus, Trash2, ArrowLeft } from 'lucide-react';

// const SalesVoucher: React.FC = () => {
//   const { theme, ledgers, stockItems: items, addVoucher } = useAppContext();
//   const navigate = useNavigate();

//   const [mode, setMode] = useState<'item' | 'accounting' | 'voucher'>('accounting');
  
//   const [formData, setFormData] = useState<Omit<VoucherEntry, 'id'>>({
//     date: new Date().toISOString().split('T')[0],
//     type: 'sales',
//     number: '',
//     narration: '',
//     entries: [
//       { id: '1', ledgerId: '', amount: 0, type: 'debit', itemId: '', quantity: 0, rate: 0, gstRate: 0 },
//       { id: '2', ledgerId: '', amount: 0, type: 'credit', itemId: '', quantity: 0, rate: 0, gstRate: 0 }
//     ]
//   });

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleEntryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value, type } = e.target;
    
//     const updatedEntries = [...formData.entries];
//     const entry = updatedEntries[index];
    
//     if (mode === 'item' && (name === 'quantity' || name === 'rate' || name === 'itemId')) {
//       const quantity = name === 'quantity' ? parseFloat(value) || 0 : (entry.quantity ?? 0);
//       const rate = name === 'rate' ? parseFloat(value) || 0 : (entry.rate ?? 0);
//       const itemId = name === 'itemId' ? value : entry.itemId;
      
//       const selectedItem = items.find(item => item.id === itemId);
//       const gstRate = selectedItem?.gstRate ?? 0;
      
//       const baseAmount = quantity * rate;
//       const totalAmount = baseAmount + (baseAmount * gstRate / 100);
      
//       updatedEntries[index] = {
//         ...entry,
//         [name]: type === 'number' ? parseFloat(value) || 0 : value,
//         amount: totalAmount,
//         gstRate,
//         itemId
//       };
//     } else {
//       updatedEntries[index] = {
//         ...entry,
//         [name]: type === 'number' ? parseFloat(value) || 0 : value
//       };
//     }
    
//     setFormData(prev => ({ ...prev, entries: updatedEntries }));
//   };

//   const addEntry = () => {
//     setFormData(prev => ({
//       ...prev,
//       entries: [
//         ...prev.entries,
//         { 
//           id: (prev.entries.length + 1).toString(), 
//           ledgerId: '', 
//           amount: 0, 
//           type: 'credit', 
//           itemId: '', 
//           quantity: 0, 
//           rate: 0,
//           gstRate: 0 
//         }
//       ]
//     }));
//   };

//   const removeEntry = (index: number) => {
//     if (formData.entries.length <= 2) return;
    
//     const updatedEntries = [...formData.entries];
//     updatedEntries.splice(index, 1);
    
//     setFormData(prev => ({ ...prev, entries: updatedEntries }));
//   };

//   const totalDebit = formData.entries
//     .filter(entry => entry.type === 'debit')
//     .reduce((sum, entry) => sum + entry.amount, 0);
    
//   const totalCredit = formData.entries
//     .filter(entry => entry.type === 'credit')
//     .reduce((sum, entry) => sum + entry.amount, 0);
    
//   const isBalanced = totalDebit === totalCredit;

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
    
//     if (!isBalanced) {
//       alert('Total debit must equal total credit');
//       return;
//     }
    
//     if (mode === 'item' && formData.entries.some(entry => entry.itemId === '' && entry.type === 'debit')) {
//       alert('Please select an item for debit entries in Item Invoice mode');
//       return;
//     }
    
//     const newVoucher: VoucherEntry = {
//       id: Math.random().toString(36).substring(2, 9),
//       ...formData,
//       mode
//     };
    
//     addVoucher(newVoucher);
//     navigate('/vouchers');
//   };

//   return (
//     <div className='pt-[56px] px-4'>
//       <div className="flex items-center mb-6">
//         <button
//           title='Back to Vouchers'
//           onClick={() => navigate('/vouchers')}
//           className={`mr-4 p-2 rounded-full ${
//             theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
//           }`}
//         >
//           <ArrowLeft size={20} />
//         </button>
//         <h1 className="text-2xl font-bold">Sales Voucher</h1>
//       </div>
      
//       <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
//         <div className="mb-6">
//           <label className="block text-sm font-medium mb-1">Voucher Mode</label>
//           <select
//             title='Select Voucher Mode'
//             value={mode}
//             onChange={(e) => {
//               setMode(e.target.value as 'item' | 'accounting' | 'voucher');
//               setFormData(prev => ({
//                 ...prev,
//                 entries: [
//                   { id: '1', ledgerId: '', amount: 0, type: 'debit', itemId: '', quantity: 0, rate: 0, gstRate: 0 },
//                   { id: '2', ledgerId: '', amount: 0, type: 'credit', itemId: '', quantity: 0, rate: 0, gstRate: 0 }
//                 ]
//               }));
//             }}
//             className={`w-full md:w-48 p-2 rounded border ${
//               theme === 'dark' 
//                 ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                 : 'bg-white border-gray-300 focus:border-blue-500'
//             } outline-none transition-colors`}
//           >
//             <option value="item">Item Invoice</option>
//             <option value="accounting">Accounting Invoice</option>
//             <option value="voucher">As Voucher</option>
//           </select>
//         </div>

//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
//             <div>
//               <label className="block text-sm font-medium mb-1" htmlFor="date">
//                 Date
//               </label>
//               <input
//                 type="date"
//                 id="date"
//                 name="date"
//                 value={formData.date}
//                 onChange={handleChange}
//                 required
//                 className={`w-full p-2 rounded border ${
//                   theme === 'dark' 
//                     ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                     : 'bg-white border-gray-300 focus:border-blue-500'
//                 } outline-none transition-colors`}
//               />
//             </div>
            
//             {mode !== 'voucher' && (
//               <div>
//                 <label className="block text-sm font-medium mb-1" htmlFor="number">
//                   {mode === 'item' ? 'Invoice No.' : 'Voucher No.'}
//                 </label>
//                 <input
//                   type="text"
//                   id="number"
//                   name="number"
//                   value={formData.number}
//                   onChange={handleChange}
//                   placeholder="Auto"
//                   className={`w-full p-2 rounded border ${
//                     theme === 'dark' 
//                       ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                       : 'bg-white border-gray-300 focus:border-blue-500'
//                   } outline-none transition-colors`}
//                 />
//               </div>
//             )}
//           </div>
          
//           <div className={`p-4 mb-6 rounded ${
//             theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
//           }`}>
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="font-semibold">Entries</h3>
//               <button
//                 type="button"
//                 onClick={addEntry}
//                 className={`flex items-center text-sm px-2 py-1 rounded ${
//                   theme === 'dark' 
//                     ? 'bg-blue-600 hover:bg-blue-700' 
//                     : 'bg-blue-600 hover:bg-blue-700 text-white'
//                 }`}
//               >
//                 <Plus size={16} className="mr-1" />
//                 Add Line
//               </button>
//             </div>
            
//             <div className="overflow-x-auto">
//               <table className="w-full mb-4">
//                 <thead>
//                   <tr className={`${
//                     theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'
//                   }`}>
//                     {mode === 'item' ? (
//                       <>
//                         <th className="px-4 py-2 text-left">Item</th>
//                         <th className="px-4 py-2 text-left">Quantity</th>
//                         <th className="px-4 py-2 text-left">Unit</th>
//                         <th className="px-4 py-2 text-left">Rate</th>
//                         <th className="px-4 py-2 text-left">GST %</th>
//                         <th className="px-4 py-2 text-right">Amount</th>
//                         <th className="px-4 py-2 text-left">Ledger Account</th>
//                       </>
//                     ) : (
//                       <>
//                         <th className="px-4 py-2 text-left">Ledger Account</th>
//                         <th className="px-4 py-2 text-left">Dr/Cr</th>
//                         <th className="px-4 py-2 text-right">Amount</th>
//                       </>
//                     )}
//                     <th className="px-4 py-2 text-center">Action</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {formData.entries.map((entry, index) => (
//                     <tr 
//                       key={index}
//                       className={`${
//                         theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'
//                       }`}
//                     >
//                       {mode === 'item' ? (
//                         <>
//                           <td className="px-4 py-2">
//                             <select
//                               title='Select Item'
//                               name="itemId"
//                               value={entry.itemId}
//                               onChange={(e) => handleEntryChange(index, e)}
//                               required={entry.type === 'debit'}
//                               className={`w-full p-2 rounded border ${
//                                 theme === 'dark' 
//                                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                                   : 'bg-white border-gray-300 focus:border-blue-500'
//                               } outline-none transition-colors`}
//                             >
//                               <option value="">Select Item</option>
//                               {items.map((item: StockItem) => (
//                                 <option key={item.id} value={item.id}>
//                                   {item.name}
//                                 </option>
//                               ))}
//                             </select>
//                           </td>
//                           <td className="px-4 py-2">
//                             <input
//                               title='Enter Quantity'
//                               type="number"
//                               name="quantity"
//                               value={entry.quantity}
//                               onChange={(e) => handleEntryChange(index, e)}
//                               required={entry.type === 'debit'}
//                               min="0"
//                               step="0.01"
//                               className={`w-full p-2 rounded border text-right ${
//                                 theme === 'dark' 
//                                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                                   : 'bg-white border-gray-300 focus:border-blue-500'
//                               } outline-none transition-colors`}
//                             />
//                           </td>
//                           <td className="px-4 py-2">
//                             {items.find(item => item.id === entry.itemId)?.unit || '-'}
//                           </td>
//                           <td className="px-4 py-2">
//                             <input
//                               title='Enter Rate'
//                               type="number"
//                               name="rate"
//                               value={entry.rate}
//                               onChange={(e) => handleEntryChange(index, e)}
//                               required={entry.type === 'debit'}
//                               min="0"
//                               step="0.01"
//                               className={`w-full p-2 rounded border text-right ${
//                                 theme === 'dark' 
//                                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                                   : 'bg-white border-gray-300 focus:border-blue-500'
//                               } outline-none transition-colors`}
//                             />
//                           </td>
//                           <td className="px-4 py-2">
//                             {entry.gstRate || '-'}
//                           </td>
//                           <td className="px-4 py-2 text-right">
//                             {entry.amount.toLocaleString()}
//                           </td>
//                           <td className="px-4 py-2">
//                             <select
//                               title='Select Ledger Account'
//                               name="ledgerId"
//                               value={entry.ledgerId}
//                               onChange={(e) => handleEntryChange(index, e)}
//                               required
//                               className={`w-full p-2 rounded border ${
//                                 theme === 'dark' 
//                                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                                   : 'bg-white border-gray-300 focus:border-blue-500'
//                               } outline-none transition-colors`}
//                             >
//                               <option value="">Select Ledger</option>
//                               {ledgers.filter(ledger => mode === 'item' && entry.type === 'credit' ? ledger.type === 'sales' : true).map((ledger: Ledger) => (
//                                 <option key={ledger.id} value={ledger.id}>
//                                   {ledger.name}
//                                 </option>
//                               ))}
//                             </select>
//                           </td>
//                         </>
//                       ) : (
//                         <>
//                           <td className="px-4 py-2">
//                             <select
//                               title='Select Ledger Account'
//                               name="ledgerId"
//                               value={entry.ledgerId}
//                               onChange={(e) => handleEntryChange(index, e)}
//                               required
//                               className={`w-full p-2 rounded border ${
//                                 theme === 'dark' 
//                                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                                   : 'bg-white border-gray-300 focus:border-blue-500'
//                               } outline-none transition-colors`}
//                             >
//                               <option value="">Select Ledger</option>
//                               {ledgers.filter(ledger => mode === 'accounting' ? ledger.type === 'sales' || ledger.type === 'current-assets' : true).map((ledger: Ledger) => (
//                                 <option key={ledger.id} value={ledger.id}>
//                                   {ledger.name}
//                                 </option>
//                               ))}
//                             </select>
//                           </td>
//                           <td className="px-4 py-2">
//                             <select
//                               title='Select Debit or Credit'
//                               name="type"
//                               value={entry.type}
//                               onChange={(e) => handleEntryChange(index, e)}
//                               required
//                               className={`w-full p-2 rounded border ${
//                                 theme === 'dark' 
//                                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                                   : 'bg-white border-gray-300 focus:border-blue-500'
//                               } outline-none transition-colors`}
//                             >
//                               <option value="debit">Dr</option>
//                               <option value="credit">Cr</option>
//                             </select>
//                           </td>
//                           <td className="px-4 py-2">
//                             <input
//                               title='Enter Amount'
//                               type="number"
//                               name="amount"
//                               value={entry.amount}
//                               onChange={(e) => handleEntryChange(index, e)}
//                               required
//                               min="0"
//                               step="0.01"
//                               className={`w-full p-2 rounded border text-right ${
//                                 theme === 'dark' 
//                                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                                   : 'bg-white border-gray-300 focus:border-blue-500'
//                               } outline-none transition-colors`}
//                             />
//                           </td>
//                         </>
//                       )}
//                       <td className="px-4 py-2 text-center">
//                         <button
//                           title='Remove Entry'
//                           type="button"
//                           onClick={() => removeEntry(index)}
//                           disabled={formData.entries.length <= 2}
//                           className={`p-1 rounded ${
//                             formData.entries.length <= 2
//                               ? 'opacity-50 cursor-not-allowed'
//                               : theme === 'dark' 
//                                 ? 'hover:bg-gray-600' 
//                                 : 'hover:bg-gray-300'
//                           }`}
//                         >
//                           <Trash2 size={16} />
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//                 <tfoot>
//                   <tr className={`font-semibold ${
//                     theme === 'dark' ? 'border-t border-gray-600' : 'border-t border-gray-300'
//                   }`}>
//                     <td className="px-4 py-2 text-right" colSpan={mode === 'item' ? 6 : 2}>Totals:</td>
//                     <td className="px-4 py-2 text-right">
//                       <div className="flex flex-col">
//                         <span>Dr: {totalDebit.toLocaleString()}</span>
//                         <span>Cr: {totalCredit.toLocaleString()}</span>
//                       </div>
//                     </td>
//                     <td className="px-4 py-2 text-center">
//                       {isBalanced ? (
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
//                         }`}>
//                           Balanced
//                         </span>
//                       ) : (
//                         <span className={`px-2 py-1 rounded text-xs ${
//                           theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
//                         }`}>
//                           Unbalanced
//                         </span>
//                       )}
//                     </td>
//                   </tr>
//                 </tfoot>
//               </table>
//             </div>
//           </div>
          
//           <div className="mb-6">
//             <label className="block text-sm font-medium mb-1" htmlFor="narration">
//               Narration
//             </label>
//             <textarea
//               id="narration"
//               name="narration"
//               value={formData.narration}
//               onChange={handleChange}
//               rows={3}
//               className={`w-full p-2 rounded border ${
//                 theme === 'dark' 
//                   ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
//                   : 'bg-white border-gray-300 focus:border-blue-500'
//               } outline-none transition-colors`}
//             />
//           </div>
          
//           <div className="flex justify-end space-x-4">
//             <button
//               title='Cancel'
//               type="button"
//               onClick={() => navigate('/vouchers')}
//               className={`px-4 py-2 rounded ${
//                 theme === 'dark' 
//                   ? 'bg-gray-700 hover:bg-gray-600' 
//                   : 'bg-gray-200 hover:bg-gray-300'
//               }`}
//             >
//               Cancel
//             </button>
//             <button
//               title='Save Voucher'
//               type="submit"
//               disabled={!isBalanced}
//               className={`flex items-center px-4 py-2 rounded ${
//                 !isBalanced
//                   ? 'opacity-50 cursor-not-allowed bg-blue-600'
//                   : theme === 'dark' 
//                     ? 'bg-blue-600 hover:bg-blue-700' 
//                     : 'bg-blue-600 hover:bg-blue-700 text-white'
//               }`}
//             >
//               <Save size={18} className="mr-1" />
//               Save
//             </button>
//           </div>
//         </form>
//       </div>
      
//       <div className={`mt-40 p-4 mt-4 rounded ${
//         theme === 'dark' ? 'bg-blue-800' : 'bg-blue-50'
//       }`}>
//         <p className="text-sm">
//           <span className="font-semibold">Note:</span> Sales vouchers record revenue transactions and items. Use Item Invoice for sales, Accounting Invoice for ledger-based accounting, or As Voucher for general entries.
//         </p>
//       </div>
//     </div>
//   );
// };

// export default SalesVoucher;