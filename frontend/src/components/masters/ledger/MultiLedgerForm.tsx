import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import type { LedgerGroup } from '../../../types';
import { ArrowLeft, Save, Plus, Trash2, Copy } from 'lucide-react';
import Swal from 'sweetalert2';

interface MultiLedgerEntry {
  tempId: string;
  name: string;
  groupId: string;
  openingBalance: number;
  balanceType: 'debit' | 'credit';
}

const MultiLedgerForm: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [ledgerGroups, setLedgerGroups] = useState<LedgerGroup[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<MultiLedgerEntry[]>([
    {
      tempId: '1',
      name: '',
      groupId: '',
      openingBalance: 0,
      balanceType: 'debit'
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
const companyId = localStorage.getItem("company_id");
const ownerType = localStorage.getItem("supplier");
const ownerId = ownerType === "employee"
  ? localStorage.getItem("employee_id")
  : localStorage.getItem("user_id");

  useEffect(() => {
      const fetchLedgerGroups = async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ledger-groups?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`);
          const data = await res.json();
          if (res.ok) {
            setLedgerGroups(Array.isArray(data) ? data : []);
          } else {
            console.error("Failed to load ledger groups", data.message);
          }
        } catch (err) {
          console.error("Failed to load ledger groups", err);
        }
      };
  
      fetchLedgerGroups();
    }, []);
  

  const addNewEntry = () => {
    const newEntry: MultiLedgerEntry = {
      tempId: Date.now().toString(),
      name: '',
      groupId: '',
      openingBalance: 0,
      balanceType: 'debit'
    };
    setLedgerEntries([...ledgerEntries, newEntry]);
  };

  const removeEntry = (tempId: string) => {
    if (ledgerEntries.length > 1) {
      setLedgerEntries(ledgerEntries.filter(entry => entry.tempId !== tempId));
    }
  };

  const duplicateEntry = (tempId: string) => {
    const entryToDuplicate = ledgerEntries.find(entry => entry.tempId === tempId);
    if (entryToDuplicate) {
      const newEntry: MultiLedgerEntry = {
        ...entryToDuplicate,
        tempId: Date.now().toString(),
        name: '' // Clear name for new entry
      };
      const index = ledgerEntries.findIndex(entry => entry.tempId === tempId);
      const newEntries = [...ledgerEntries];
      newEntries.splice(index + 1, 0, newEntry);
      setLedgerEntries(newEntries);
    }
  };

  const updateEntry = (tempId: string, field: keyof MultiLedgerEntry, value: string | number) => {
    setLedgerEntries(entries =>
      entries.map(entry =>
        entry.tempId === tempId
          ? { ...entry, [field]: field === 'openingBalance' ? parseFloat(value as string) || 0 : value }
          : entry
      )
    );
  };

  const validateEntries = (): boolean => {
    const validEntries = ledgerEntries.filter(entry => entry.name.trim() && entry.groupId);
    if (validEntries.length === 0) {
      Swal.fire("Validation Error", "Please fill at least one complete ledger entry", "error");
      return false;
    }
    
    // Check for duplicate names
    const names = validEntries.map(entry => entry.name.toLowerCase().trim());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      Swal.fire("Validation Error", "Duplicate ledger names are not allowed", "error");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEntries()) return;

    setIsSubmitting(true);

    try {
      const validEntries = ledgerEntries.filter(entry => entry.name.trim() && entry.groupId);
      const ledgersToCreate = validEntries.map(entry => ({
        name: entry.name.trim(),
        groupId: entry.groupId,
        openingBalance: entry.openingBalance,
        balanceType: entry.balanceType,
        address: '',
        email: '',
        phone: '',
        gstNumber: '',
        panNumber: ''
      }));

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ledger/bulk`, {
        method: "POST",
        headers: {
        'Content-Type': 'application/json'
      },
        body: JSON.stringify({ companyId, ownerType, ownerId, ledgers: ledgersToCreate })
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          title: "Success",
          text: `${data.message}`,
          icon: "success",
          confirmButtonText: "OK"
        }).then(() => {
          navigate("/app/masters/ledger");
        });
      } else {
        Swal.fire("Error", data.message || "Failed to create ledgers", "error");
      }
       
      
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire("Error", "Something went wrong!", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='pt-[56px] px-4'>
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/masters/ledger')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          Multi Ledger Creation
        </h1>
      </div>
      
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
            Create Multiple Ledgers
          </h2>
          <button
            type="button"
            onClick={addNewEntry}
            className={`flex items-center px-3 py-2 rounded text-sm ${
              theme === 'dark' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Plus size={16} className="mr-1" />
            Add Row
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${
                  theme === 'dark' ? 'border-b border-gray-700 bg-gray-700' : 'border-b border-gray-200 bg-gray-50'
                }`}>
                  <th className="px-3 py-3 text-left text-sm font-medium">S.No</th>
                  <th className="px-3 py-3 text-left text-sm font-medium">Under Group</th>
                  <th className="px-3 py-3 text-left text-sm font-medium">Ledger Name</th>
                  <th className="px-3 py-3 text-center text-sm font-medium">Opening Balance</th>
                  <th className="px-3 py-3 text-center text-sm font-medium">Dr/Cr</th>
                  <th className="px-3 py-3 text-center text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((entry, index) => (
                  <tr 
                    key={entry.tempId} 
                    className={`${
                      theme === 'dark' ? 'border-b border-gray-700' : 'border-b border-gray-200'
                    } hover:bg-opacity-10 hover:bg-blue-500`}
                  >
                    <td className="px-3 py-2 text-center text-sm font-mono">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={entry.groupId}
                        onChange={(e) => updateEntry(entry.tempId, 'groupId', e.target.value)}
                        title="Select Under Group"
                        className={`w-full p-1.5 text-sm rounded border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                            : 'bg-white border-gray-300 focus:border-blue-500'
                        } outline-none transition-colors`}
                      >
                        <option value="">Select Group</option>
                        {ledgerGroups.map((group) => (
                          <option key={group.id} value={group.id}>
                            {group.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        value={entry.name}
                        onChange={(e) => updateEntry(entry.tempId, 'name', e.target.value)}
                        placeholder="Enter ledger name"
                        className={`w-full p-1.5 text-sm rounded border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                            : 'bg-white border-gray-300 focus:border-blue-500'
                        } outline-none transition-colors`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={entry.openingBalance}
                        onChange={(e) => updateEntry(entry.tempId, 'openingBalance', e.target.value)}
                        step="0.01"
                        title="Opening Balance"
                        placeholder="0.00"
                        className={`w-full p-1.5 text-sm rounded border text-right font-mono ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
                            : 'bg-white border-gray-300 focus:border-blue-500'
                        } outline-none transition-colors`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center space-x-2">
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name={`balanceType_${entry.tempId}`}
                            value="debit"
                            checked={entry.balanceType === 'debit'}
                            onChange={(e) => updateEntry(entry.tempId, 'balanceType', e.target.value)}
                            className="mr-1"
                          />
                          Dr
                        </label>
                        <label className="flex items-center text-sm">
                          <input
                            type="radio"
                            name={`balanceType_${entry.tempId}`}
                            value="credit"
                            checked={entry.balanceType === 'credit'}
                            onChange={(e) => updateEntry(entry.tempId, 'balanceType', e.target.value)}
                            className="mr-1"
                          />
                          Cr
                        </label>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex justify-center space-x-1">
                        <button
                          type="button"
                          onClick={() => duplicateEntry(entry.tempId)}
                          title="Duplicate Row"
                          className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <Copy size={14} />
                        </button>
                        {ledgerEntries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.tempId)}
                            title="Delete Row"
                            className={`p-1 rounded text-red-500 ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <div className="text-sm opacity-70">
              <p>
                <span className="font-semibold">Tips:</span> Fill Under Group and Ledger Name for each row you want to create. 
                Empty rows will be ignored.
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/app/masters/ledger')}
                disabled={isSubmitting}
                className={`px-4 py-2 rounded ${
                  theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'
                } disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex items-center px-4 py-2 rounded ${
                  theme === 'dark' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50`}
              >
                <Save size={18} className="mr-1" />
                {isSubmitting ? 'Creating...' : 'Create All Ledgers'}
              </button>
            </div>
          </div>
        </form>
      </div>
      
      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Keyboard Shortcuts:</span> Ctrl+N to add new row, 
          Ctrl+D to duplicate row, Delete to remove row.
        </p>
      </div>
    </div>
  );
};

export default MultiLedgerForm;
