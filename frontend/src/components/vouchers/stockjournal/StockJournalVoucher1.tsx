import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useCompany } from '../../../context/CompanyContext';
import { useNavigate } from 'react-router-dom';
import type { VoucherEntry, StockItem, Godown } from '../../../types';
import { Save, Plus, Trash2, ArrowLeft, Settings } from 'lucide-react';
import Swal from 'sweetalert2';
import { useFinancialYear, getFinancialYearDefaults } from '../../../hooks/useFinancialYear';

const StockJournalVoucher: React.FC = () => {
  const { theme, addVoucher } = useAppContext();
  const navigate = useNavigate();
  const { activeCompanyId } = useCompany();
  const companyId = activeCompanyId ?? localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('supplier') || localStorage.getItem('userType') || 'admin';
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');
  const { selectedFinYear } = useFinancialYear();
  const { defaultDate, maxDate } = getFinancialYearDefaults(selectedFinYear);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfigPanel, setShowConfigPanel] = useState(false);
  const [config, setConfig] = useState({
    autoNumbering: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Omit<VoucherEntry, 'id'>>({
    date: defaultDate,
    type: 'stock-journal',
    number: '',
    narration: '',
    referenceNo: '',
    mode: 'transfer',
    entries: [
      { id: 's1', itemId: '', quantity: 0, rate: 0, amount: 0, type: 'source', cgstRate: 0, sgstRate: 0, igstRate: 0, godownId: '' },
      { id: 'd1', itemId: '', quantity: 0, rate: 0, amount: 0, type: 'destination', cgstRate: 0, sgstRate: 0, igstRate: 0, godownId: '' }
    ]
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!companyId || !ownerType || !ownerId) {
          console.warn('Missing authorization params:', { companyId, ownerType, ownerId });
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          company_id: companyId,
          owner_type: ownerType,
          owner_id: ownerId,
        });

        // Fetch stock items
        const itemRes = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-items?${params.toString()}`);
        const itemJson = await itemRes.json();
        let items: any[] = [];
        if (Array.isArray(itemJson)) {
          items = itemJson;
        } else if (itemJson && Array.isArray(itemJson.data)) {
          items = itemJson.data;
        } else {
          const arr = Object.values(itemJson || {}).find(v => Array.isArray(v));
          if (Array.isArray(arr)) items = arr;
        }
        setStockItems(items);

        // Fetch godowns
        const godownRes = await fetch(`${import.meta.env.VITE_API_URL}/api/godowns?${params.toString()}`);
        const godownJson = await godownRes.json();
        let godownsList: any[] = [];
        if (godownJson && godownJson.success && Array.isArray(godownJson.data)) {
          godownsList = godownJson.data;
        } else if (Array.isArray(godownJson)) {
          godownsList = godownJson;
        }
        setGodowns(godownsList);

        setLoading(false);
      } catch (err) {
        console.error('Error fetching stock journal initial data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId, ownerType, ownerId]);

  useEffect(() => {
    if (!config.autoNumbering || formData.number) return;
    if (!companyId || !ownerType || !ownerId) return;

    const fetchNextNumber = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/vouchers/next-number` +
          `?company_id=${companyId}` +
          `&owner_type=${ownerType}` +
          `&owner_id=${ownerId}` +
          `&voucherType=stock-journal` +
          `&date=${formData.date}`
        );

        const data = await res.json();

        if (data.success) {
          setFormData((prev) => ({
            ...prev,
            number: data.voucherNumber,
          }));
        }
      } catch (err) {
        console.error("Stock journal voucher number preview error", err);
      }
    };

    fetchNextNumber();
  }, [formData.date, config.autoNumbering, formData.number, companyId, ownerType, ownerId]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEntryChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const updatedEntries = [...formData.entries];
    const entry = updatedEntries[index]; if (name === 'itemId') {
      const selectedItem = stockItems.find(item => String(item.id) === String(value));
      const gstRate = selectedItem?.gstRate ?? 0;
      updatedEntries[index] = {
        ...entry,
        itemId: value,
        cgstRate: gstRate / 2,
        sgstRate: gstRate / 2,
        igstRate: 0,
        amount: (entry.quantity ?? 0) * (entry.rate ?? 0)
      };
    } else if (name === 'quantity' || name === 'rate') {
      const quantity = name === 'quantity' ? parseFloat(value) || 0 : (entry.quantity ?? 0);
      const rate = name === 'rate' ? parseFloat(value) || 0 : (entry.rate ?? 0);
      const baseAmount = quantity * rate;
      updatedEntries[index] = {
        ...entry,
        [name]: parseFloat(value) || 0,
        amount: baseAmount
      };
    } else {
      updatedEntries[index] = {
        ...entry,
        [name]: type === 'number' ? parseFloat(value) || 0 : value
      };
    }

    setFormData(prev => ({ ...prev, entries: updatedEntries }));
    setErrors(prev => ({ ...prev, [`entry${index}.${name}`]: '' }));
  };

  const addEntry = (type: 'source' | 'destination') => {
    setFormData(prev => ({
      ...prev,
      entries: [
        ...prev.entries,
        {
          id: `${type[0]}${prev.entries.length + 1}`,
          itemId: '',
          quantity: 0,
          rate: 0,
          amount: 0,
          type,
          gstRate: 0,
          godownId: ''
        }
      ]
    }));
  };

  const removeEntry = (index: number) => {
    const entry = formData.entries[index];
    const sameTypeEntries = formData.entries.filter(e => e.type === entry.type);
    if (sameTypeEntries.length <= 1) return;
    const updatedEntries = [...formData.entries];
    updatedEntries.splice(index, 1);
    setFormData(prev => ({ ...prev, entries: updatedEntries }));
  };

  // const validateForm = () => {
  //   const newErrors: { [key: string]: string } = {};
  //   if (!formData.date) newErrors.date = 'Date is required';

  //   const sourceEntries = formData.entries.filter(e => e.type === 'source');
  //   const destEntries = formData.entries.filter(e => e.type === 'destination');

  //   if (formData.mode === 'transfer' && (!sourceEntries.length || !destEntries.length)) {
  //     newErrors.entries = 'At least one source and one destination item are required for transfer';
  //   } else if (formData.mode === 'adjustment' && !formData.entries.length) {
  //     newErrors.entries = 'At least one item is required for adjustment';
  //   }

  //   formData.entries.forEach((entry, index) => {
  //     if (!entry.itemId) newErrors[`entry${index}.itemId`] = 'Item is required';
  //     if ((entry.quantity ?? 0) <= 0) newErrors[`entry${index}.quantity`] = 'Quantity must be greater than 0';
  //     if (godowns?.length > 0 && !entry.godownId) newErrors[`entry${index}.godownId`] = 'Godown is required';

  //     if (entry.type === 'source' && entry.itemId) {
  //       const stockItem = stockItems.find(item => item.id === entry.itemId);
  //       if (stockItem && (entry.quantity ?? 0) > stockItem.openingBalance) {
  //         newErrors[`entry${index}.quantity`] = `Quantity exceeds available stock (${stockItem.openingBalance})`;
  //       }
  //     }
  //   });

  //   setErrors(newErrors);
  //   return Object.keys(newErrors).length === 0;
  // };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    if (!formData.number) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Field',
        text: 'Voucher number is required',
      });
      return;
    }

    const formattedEntries = formData.entries.map(entry => ({
      id: entry.id,
      ledgerId: entry.itemId, // corrected from entry.ledgerId to map to selected stock item
      batchNumber: entry.batchNumber || '',
      quantity: parseFloat((entry.quantity || 0).toString()),
      rate: parseFloat((entry.rate || 0).toString()),
      amount: parseFloat((entry.amount || 0).toString()),
      type: entry.type === 'source' ? 'credit' : 'debit', // map 'source' to 'credit' and 'destination' to 'debit' to match DB enum constraints
    }));

    const payload = {
      date: formData.date,
      number: formData.number,
      narration: formData.narration,
      type: 'stock-journal',
      companyId,
      ownerType,
      ownerId,
      entries: formattedEntries,
    };

    try {
      setIsSubmitting(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/StockJournal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to save voucher');
      }

      addVoucher(data);
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: "Voucher created successfully",
      }).then(() => {
        navigate(new URLSearchParams(window.location.search).get("returnUrl") || "/app/vouchers");
      });
    } catch (err: any) {
      console.error(err);
      Swal.fire('Error', err.message || 'Failed to save voucher.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sourceEntries = formData.entries.filter(e => e.type === 'source');
  const destEntries = formData.entries.filter(e => e.type === 'destination');
  const totalSourceAmount = sourceEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalDestAmount = destEntries.reduce((sum, e) => sum + e.amount, 0);
  const isValueBalanced = Math.abs(totalSourceAmount - totalDestAmount) < 0.01;
  const handleAutoNumberingToggle = (checked: boolean) => {
    setConfig(prev => ({ ...prev, autoNumbering: checked }));
    if (checked) {
      setFormData(prev => ({ ...prev, number: '' }));
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'F12') {
      e.preventDefault();
      setShowConfigPanel(prev => !prev);
    } else if (e.key === 'Escape') {
      navigate(new URLSearchParams(window.location.search).get("returnUrl") || "/app/vouchers");
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [formData, showConfigPanel, isSubmitting]);

  if (loading) {
    return (
      <div className={`pt-[56px] px-4 flex items-center justify-center min-h-[400px]`}>
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Loading inventory items and godowns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`pt-[56px] px-4 ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="flex items-center mb-6">
        <button
          title='Back to Vouchers'
          onClick={() => navigate(new URLSearchParams(window.location.search).get("returnUrl") || "/app/vouchers")}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">New Stock Journal Voucher</h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Save Voucher"
            onClick={() => handleSubmit()}
            disabled={isSubmitting}
            className={`p-2 rounded-md ${theme === "dark"
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-blue-500 hover:bg-blue-600"
              } text-white flex items-center ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Save size={18} className="mr-2" /> {isSubmitting ? "Saving..." : "Save"}
          </button>
          <button
            title="Configure"
            onClick={() => setShowConfigPanel(!showConfigPanel)}
            className={`p-2 rounded-md ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}
          >
            <Settings size={18} />
          </button>
        </div>
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
                max={maxDate}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-red-500 text-xs mt-1">{errors.date}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="number">
                Voucher No.
              </label>
              <input
                type="text"
                id="number"
                name="number"
                value={formData.number}
                onChange={handleChange}
                placeholder={config.autoNumbering ? "Auto" : "Enter voucher number"}
                readOnly={config.autoNumbering}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${config.autoNumbering ? "opacity-50" : ""}`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="referenceNo">
                Reference No.
              </label>
              <input
                type="text"
                id="referenceNo"
                name="referenceNo"
                value={formData.referenceNo}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="mode">
                Voucher Mode
              </label>
              <select
                id="mode"
                name="mode"
                value={formData.mode}
                onChange={handleChange}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors`}
              >
                <option value="transfer">Transfer</option>
                <option value="adjustment">Adjustment</option>
              </select>
            </div>
          </div>

          {/* Source Items */}
          <div className={`p-4 mb-6 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Source (Consumption) Items</h3>
              <button
                title='Add Source Item'
                type="button"
                onClick={() => addEntry('source')}
                className={`flex items-center text-sm px-2 py-1 rounded ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <Plus size={16} className="mr-1" />
                Add Source
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full mb-4">
                <thead>
                  <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-left">HSN/SAC</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-left">Godown</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>                <tbody>
                  {sourceEntries.map((entry) => {
                    const globalIndex = formData.entries.indexOf(entry);
                    const selectedItem = stockItems.find(item => String(item.id) === String(entry.itemId));
                    return (
                      <tr key={globalIndex} className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                        <td className="px-4 py-2">
                          <select
                            title='Select Item'
                            name="itemId"
                            value={entry.itemId}
                            onChange={(e) => handleEntryChange(globalIndex, e)}
                            required
                            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${errors[`entry${globalIndex}.itemId`] ? 'border-red-500' : ''}`}
                          >
                            <option value="">Select Item</option>
                            {stockItems.map((item: StockItem) => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </select>
                          {errors[`entry${globalIndex}.itemId`] && <p className="text-red-500 text-xs mt-1">{errors[`entry${globalIndex}.itemId`]}</p>}
                        </td>
                        <td className="px-4 py-2">
                          {selectedItem?.hsnCode || '-'}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            title='Enter Quantity'
                            type="number"
                            name="quantity"
                            value={entry.quantity}
                            onChange={(e) => handleEntryChange(globalIndex, e)}
                            required
                            min="0"
                            step="0.01"
                            className={`w-full p-2 rounded border text-right ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${errors[`entry${globalIndex}.quantity`] ? 'border-red-500' : ''}`}
                          />
                          {errors[`entry${globalIndex}.quantity`] && <p className="text-red-500 text-xs mt-1">{errors[`entry${globalIndex}.quantity`]}</p>}
                        </td>
                        <td className="px-4 py-2">
                          {selectedItem?.unit || '-'}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            title='Enter Rate'
                            type="number"
                            name="rate"
                            value={entry.rate}
                            onChange={(e) => handleEntryChange(globalIndex, e)}
                            min="0"
                            step="0.01"
                            className={`w-full p-2 rounded border text-right ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors`}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          {entry.amount.toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <select
                            title='Select Godown'
                            name="godownId"
                            value={entry.godownId}
                            onChange={(e) => handleEntryChange(globalIndex, e)}
                            required={godowns?.length > 0}
                            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${errors[`entry${globalIndex}.godownId`] ? 'border-red-500' : ''}`}
                          >
                            <option value="">Select Godown</option>
                            {godowns?.length > 0 ? (
                              godowns.map((godown: Godown) => (
                                <option key={godown.id} value={godown.id}>{godown.name}</option>
                              ))
                            ) : (
                              <option value="" disabled>No godowns available</option>
                            )}
                          </select>
                          {errors[`entry${globalIndex}.godownId`] && <p className="text-red-500 text-xs mt-1">{errors[`entry${globalIndex}.godownId`]}</p>}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            title='Remove Item'
                            type="button"
                            onClick={() => removeEntry(globalIndex)}
                            disabled={sourceEntries.length <= 1}
                            className={`p-1 rounded ${sourceEntries.length <= 1 ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`font-semibold ${theme === 'dark' ? 'border-t border-gray-600' : 'border-t border-gray-300'}`}>
                    <td className="px-4 py-2 text-right" colSpan={5}>Total Amount:</td>
                    <td className="px-4 py-2 text-right">{totalSourceAmount.toLocaleString()}</td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Destination Items */}
          <div className={`p-4 mb-6 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold">Destination (Production) Items</h3>
              <button
                title='Add Destination Item'
                type="button"
                onClick={() => addEntry('destination')}
                className={`flex items-center text-sm px-2 py-1 rounded ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <Plus size={16} className="mr-1" />
                Add Destination
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full mb-4">
                <thead>
                  <tr className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                    <th className="px-4 py-2 text-left">Item</th>
                    <th className="px-4 py-2 text-left">HSN/SAC</th>
                    <th className="px-4 py-2 text-right">Quantity</th>
                    <th className="px-4 py-2 text-left">Unit</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2 text-left">Godown</th>
                    <th className="px-4 py-2 text-center">Action</th>
                  </tr>
                </thead>                <tbody>
                  {destEntries.map((entry) => {
                    const globalIndex = formData.entries.indexOf(entry);
                    const selectedItem = stockItems.find(item => String(item.id) === String(entry.itemId));
                    return (
                      <tr key={globalIndex} className={`${theme === 'dark' ? 'border-b border-gray-600' : 'border-b border-gray-300'}`}>
                        <td className="px-4 py-2">
                          <select
                            title='Select Item'
                            name="itemId"
                            value={entry.itemId}
                            onChange={(e) => handleEntryChange(globalIndex, e)}
                            required
                            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${errors[`entry${globalIndex}.itemId`] ? 'border-red-500' : ''}`}
                          >
                            <option value="">Select Item</option>
                            {stockItems.map((item: StockItem) => (
                              <option key={item.id} value={item.id}>{item.name}</option>
                            ))}
                          </select>
                          {errors[`entry${globalIndex}.itemId`] && <p className="text-red-500 text-xs mt-1">{errors[`entry${globalIndex}.itemId`]}</p>}
                        </td>
                        <td className="px-4 py-2">
                          {selectedItem?.hsnCode || '-'}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            title='Enter Quantity'
                            type="number"
                            name="quantity"
                            value={entry.quantity}
                            onChange={(e) => handleEntryChange(globalIndex, e)}
                            required
                            min="0"
                            step="0.01"
                            className={`w-full p-2 rounded border text-right ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${errors[`entry${globalIndex}.quantity`] ? 'border-red-500' : ''}`}
                          />
                          {errors[`entry${globalIndex}.quantity`] && <p className="text-red-500 text-xs mt-1">{errors[`entry${globalIndex}.quantity`]}</p>}
                        </td>
                        <td className="px-4 py-2">
                          {selectedItem?.unit || '-'}
                        </td>
                        <td className="px-4 py-2">
                          <input
                            title='Enter Rate'
                            type="number"
                            name="rate"
                            value={entry.rate}
                            onChange={(e) => handleEntryChange(globalIndex, e)}
                            min="0"
                            step="0.01"
                            className={`w-full p-2 rounded border text-right ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors`}
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          {entry.amount.toLocaleString()}
                        </td>
                        <td className="px-2 py-2">
                          <select
                            title='Select Godown'
                            name="godownId"
                            value={entry.godownId}
                            onChange={(e) => handleEntryChange(globalIndex, e)}
                            required={godowns?.length > 0}
                            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors ${errors[`entry${globalIndex}.godownId`] ? 'border-red-500' : ''}`}
                          >
                            <option value="">Select Godown</option>
                            {godowns?.length > 0 ? (
                              godowns.map((godown: Godown) => (
                                <option key={godown.id} value={godown.id}>{godown.name}</option>
                              ))
                            ) : (
                              <option value="" disabled>No godowns available</option>
                            )}
                          </select>
                          {errors[`entry${globalIndex}.godownId`] && <p className="text-red-500 text-xs mt-1">{errors[`entry${globalIndex}.godownId`]}</p>}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            title='Remove Item'
                            type="button"
                            onClick={() => removeEntry(globalIndex)}
                            disabled={destEntries.length <= 1}
                            className={`p-1 rounded ${destEntries.length <= 1 ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className={`font-semibold ${theme === 'dark' ? 'border-t border-gray-600' : 'border-t border-gray-300'}`}>
                    <td className="px-4 py-2 text-right" colSpan={5}>Total Amount:</td>
                    <td className="px-4 py-2 text-right">{totalDestAmount.toLocaleString()}</td>
                    <td className="px-4 py-2"></td>
                    <td className="px-4 py-2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1" htmlFor="narration">
              Narration
            </label>
            <textarea
              id="narration"
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              rows={3}
              className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'} outline-none transition-colors`}
            />
          </div>

          <div className={`p-4 mb-6 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="flex justify-between">
              <span className="font-semibold">Value Balance:</span>
              <span className={`px-2 py-1 rounded text-xs ${isValueBalanced ? theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800' : theme === 'dark' ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
                {isValueBalanced ? 'Balanced' : `Difference: ${(totalSourceAmount - totalDestAmount).toLocaleString()}`}
              </span>
            </div>
            {errors.entries && <p className="text-red-500 text-xs mt-1">{errors.entries}</p>}
          </div>

          {showConfigPanel && (
            <div className={`p-4 mb-6 rounded ${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
              <h3 className="font-semibold mb-4">Configuration (F12)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={config.autoNumbering}
                    onChange={(e) => handleAutoNumberingToggle(e.target.checked)}
                    className={`mr-2 rounded ${theme === "dark" ? "bg-gray-600 border-gray-500" : "bg-white border-gray-300"}`}
                  />
                  Auto Numbering
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button
              title='Cancel'
              type="button"
              onClick={() => navigate(new URLSearchParams(window.location.search).get("returnUrl") || "/app/vouchers")}
              className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              title='Save Voucher'
              type="submit"
              className={`flex items-center px-4 py-2 rounded ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <Save size={18} className="mr-1" />
              Save
            </button>
          </div>
        </form>
      </div>

      <div className={`mt-6 p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <p className="text-sm">
          <span className="font-semibold">Note:</span> Use Stock Journal for stock transfers or adjustments. Press F7 to create, F9 to save, F12 to configure, Esc to cancel.
        </p>
      </div>
    </div>
  );
};

export default StockJournalVoucher;
