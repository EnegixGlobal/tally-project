import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Trash2,
  Edit3,
  Layers,
  Barcode,
  Database,
  Plus,
  Save,
  Package,
  Loader2,
  X,
  CheckCircle2,
  Tag
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useAppContext } from '../../context/AppContext';

// --- Types ---
type Attr = { id?: number; name: string; value: string };
type Item = {
  id: number;
  name: string;
  unit?: string;
  company_id?: number;
  attributes?: Attr[];
  stockGroupId?: string;
  categoryId?: string;
  hsnCode?: string;
  taxType?: string;
  openingBalance?: number;
  openingValue?: number;
  gstRate?: number;
  gstLedgerId?: string;
  cgstLedgerId?: string;
  sgstLedgerId?: string;
  standardPurchaseRate?: number;
  standardSaleRate?: number;
  enableBatchTracking?: boolean;
  allowNegativeStock?: boolean;
  maintainInPieces?: boolean;
  secondaryUnit?: string;
  barcode?: string;
  batches?: any[];
  owner_type?: string;
  owner_id?: string;
  image?: string;
};

const ItemManagement: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAppContext();

  // --- State ---
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  // Inline Attribute Inputs per item ID
  const [newAttrs, setNewAttrs] = useState<Record<number, Attr>>({});
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const companyId = localStorage.getItem('company_id');

  // --- Effects ---
  useEffect(() => {
    fetchItems();
  }, [companyId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (companyId) params.set('company_id', companyId);
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-items?` + params.toString());
      const json = await res.json();
      if (json && json.data) {
        // Ensure attributes is an array
        const normalized = json.data.map((item: any) => ({
          ...item,
          attributes: Array.isArray(item.attributes) ? item.attributes : []
        }));
        setItems(normalized);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error('Failed to load items', e);
    } finally {
      setLoading(false);
    }
  };

  // --- Inline Attribute Handlers ---
  const handleAttrChange = (id: number, field: keyof Attr, val: string) => {
    setNewAttrs(prev => ({
      ...prev,
      [id]: { ...(prev[id] || { name: '', value: '' }), [field]: val }
    }));
  };

  const addAttributeToItem = async (item: Item) => {
    const attrToAdd = newAttrs[item.id];
    if (!attrToAdd || !attrToAdd.name.trim() || !attrToAdd.value.trim()) {
      Swal.fire({
        toast: true,
        position: 'top-end',
        title: 'Please enter both name and value',
        icon: 'warning',
        showConfirmButton: false,
        timer: 2000
      });
      return;
    }

    setUpdatingId(item.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-item-attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stock_item_id: item.id,
          attribute_name: attrToAdd.name,
          attribute_value: attrToAdd.value
        }),
      });

      if (res.ok) {
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Attribute added!',
          showConfirmButton: false,
          timer: 1500
        });
        // Clear input
        setNewAttrs(prev => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
        // Refresh local state
        fetchItems();
      } else {
        const err = await res.json();
        Swal.fire('Error', err.message || 'Update failed', 'error');
      }
    } catch (e) {
      console.error('Update failed', e);
      Swal.fire('Error', 'Update failed', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const removeAttributeFromItem = async (item: Item, attrId: number | undefined) => {
    if (!attrId) return;
    setUpdatingId(item.id);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-item-attributes/${attrId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchItems();
      } else {
        Swal.fire('Error', 'Failed to remove attribute', 'error');
      }
    } catch (e) {
      console.error('Remove failed', e);
    } finally {
      setUpdatingId(null);
    }
  };


  // --- Render Helpers ---
  const filtered = items.filter(i => i.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300 pb-12 mt-[40px]`}>

      <div className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Simplified Header Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-gray-800 pb-8">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
              <Layers className="w-8 h-8 text-indigo-500" />
              Stock Item Attributes
            </h1>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Manage properties for all inventory items</p>
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Find an item..."
                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl outline-none text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 transition-all"
              />
            </div>
            <button
               onClick={() => navigate('/app/masters/stock-item/create')}
               className="p-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
               title="Create New Item"
            >
              <Plus className="w-6 h-6 font-bold" />
            </button>
          </div>
        </div>

        {/* Card Grid Layout */}
        {loading ? (
          <div className="py-24 text-center">
             <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-500 mb-4" />
             <span className="text-xs font-black uppercase tracking-widest opacity-30">Loading Inventory...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
             <Package className="w-20 h-20 mx-auto opacity-10 mb-6" />
             <span className="text-xs font-black uppercase tracking-widest opacity-20">No matching items found</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((item) => (
              <div 
                key={item.id} 
                className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-300 transform hover:-translate-y-1 group ${
                  theme === 'dark' 
                  ? 'bg-gray-900/40 border-gray-800 hover:border-indigo-500/30 shadow-2xl' 
                  : 'bg-white border-gray-100 hover:border-indigo-500/20 shadow-xl'
                }`}
              >
                {/* Item Logo & Basic Info */}
                <div className="flex items-center gap-4 mb-8">
                  <div className={`w-14 h-14 rounded-3xl flex items-center justify-center font-black text-xl shadow-inner transition-transform group-hover:scale-110 ${
                    theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {item.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-black text-lg uppercase truncate tracking-tight">{item.name}</h3>
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-gray-400">ID #{item.id}</span>
                       <span className="w-1 h-1 rounded-full bg-indigo-500/30"></span>
                       <span className="text-[10px] font-black text-indigo-500/60 uppercase">{item.unit || 'NO UNIT'}</span>
                    </div>
                  </div>
                </div>

                {/* Attribute Display Section */}
                <div className="flex-1 space-y-3 mb-8">
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 opacity-50 block mb-2">Specifications</span>
                  <div className="flex flex-col gap-2">
                    {(item.attributes || []).length > 0 ? (
                      item.attributes?.map((a, idx) => (
                        <div key={idx} className="flex items-center justify-between group/attr py-1 border-b border-gray-50 dark:border-gray-800/50 last:border-0">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase text-indigo-500/40 min-w-[60px]">{a.name}:</span>
                              <span className="text-xs font-bold tracking-tight">{a.value}</span>
                           </div>
                           <button 
                             onClick={() => removeAttributeFromItem(item, a.id)}
                             className="p-1 hover:text-red-500 opacity-0 group-hover/attr:opacity-100 transition-all"
                           >
                             <X className="w-3 h-3" />
                           </button>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center border-2 border-dashed border-gray-50 dark:border-gray-800/30 rounded-2xl">
                         <span className="text-[9px] font-black uppercase text-gray-300">No properties set</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Add Form Section */}
                <div className={`p-5 rounded-3xl border ${
                  theme === 'dark' ? 'bg-black/20 border-gray-800' : 'bg-gray-50/50 border-gray-100'
                }`}>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="NAME (Color)"
                        value={newAttrs[item.id]?.name || ''}
                        onChange={e => handleAttrChange(item.id, 'name', e.target.value)}
                        className="bg-transparent text-[10px] font-black uppercase outline-none border-b border-gray-200 dark:border-gray-700 py-1"
                      />
                      <input
                        placeholder="VALUE (Red)"
                        value={newAttrs[item.id]?.value || ''}
                        onChange={e => handleAttrChange(item.id, 'value', e.target.value)}
                        className="bg-transparent text-[10px] font-black uppercase outline-none border-b border-gray-200 dark:border-gray-700 py-1"
                      />
                    </div>
                    <button
                      onClick={() => addAttributeToItem(item)}
                      disabled={updatingId === item.id}
                      className={`w-full py-2.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        updatingId === item.id
                        ? 'bg-gray-400 text-white'
                        : 'bg-indigo-600 text-white hover:bg-slate-900 active:scale-95 shadow-lg shadow-indigo-500/10'
                      }`}
                    >
                      {updatingId === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Add Property'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemManagement;
