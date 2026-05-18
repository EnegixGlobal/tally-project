import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Trash2,
  Database,
  Plus,
  Loader2,
  Tag,
  ArrowLeft,
  Info
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useAppContext } from '../../context/AppContext';

// --- Types ---
type Attribute = {
  id: number;
  name: string;
};

const ItemManagement: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAppContext();

  // --- State ---
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAttrName, setNewAttrName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Effects ---
  useEffect(() => {
    fetchAttributes();
  }, []);

  const fetchAttributes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-attributes`, {
        cache: 'no-store'
      });
      const json = await res.json();
      if (json.success) {
        setAttributes(json.data || []);
      }
    } catch (e) {
      console.error("Failed to load attributes", e);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to load attributes',
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAttribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAttrName.trim()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAttrName.trim() })
      });
      const json = await res.json();
      if (json.success) {
        setNewAttrName('');
        fetchAttributes();
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Attribute created successfully!',
          showConfirmButton: false,
          timer: 2000
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: json.message || 'Failed to create attribute',
        });
      }
    } catch (e) {
      console.error("Failed to create attribute", e);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred while creating the attribute.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttribute = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the attribute "${name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#4f46e5',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-attributes/${id}`, {
          method: 'DELETE'
        });
        const json = await res.json();
        if (json.success) {
          fetchAttributes();
          Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Attribute deleted!',
            showConfirmButton: false,
            timer: 2000
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: json.message || 'Failed to delete attribute',
          });
        }
      } catch (e) {
        console.error("Failed to delete attribute", e);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while deleting the attribute.',
        });
      }
    }
  };

  // --- Filtering ---
  const filteredAttributes = attributes.filter(attr =>
    attr.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'} transition-colors duration-300 pb-12 mt-[40px]`}>
      <div className="max-w-7xl mx-auto px-6 space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-gray-800 pb-8">
          <div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/app/masters')}
                className={`p-2 rounded-xl transition-all border ${
                  theme === 'dark'
                    ? 'border-gray-800 bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'border-gray-200 bg-white text-gray-500 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Back to Masters"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <Tag className="w-8 h-8 text-indigo-500" />
                Stock Attributes
              </h1>
            </div>
            <p className="text-xs font-bold text-gray-400 mt-2 ml-11 uppercase tracking-widest">
              Manage custom properties like Brand, Size, Color, or IMEI
            </p>
          </div>
          
          {/* Header Metric */}
          <div className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider flex items-center gap-2 ${
            theme === 'dark' ? 'bg-gray-900/60 border-gray-800 text-gray-300' : 'bg-white border-gray-200 text-gray-600'
          }`}>
            <Database className="w-4 h-4 text-indigo-500" />
            Total Attributes: {attributes.length}
          </div>
        </div>

        {/* Dashboard Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Create Form */}
          <div className="lg:col-span-4 space-y-6">
            <div className={`p-6 rounded-[2rem] border ${
              theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-100'
            } shadow-sm space-y-6`}>
              <div>
                <h2 className="text-md font-black uppercase tracking-tight flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  Add New Attribute
                </h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Create a custom item spec identifier
                </p>
              </div>

              <form onSubmit={handleAddAttribute} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                    Attribute Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="E.G. BRAND, IMEI, SIZE..."
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/50 text-xs font-black uppercase tracking-wide placeholder-gray-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !newAttrName.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Create Attribute
                    </>
                  )}
                </button>
              </form>

              {/* Informative Tip Banner */}
              <div className={`p-4 rounded-2xl border flex gap-3 ${
                theme === 'dark' ? 'bg-indigo-950/20 border-indigo-900/30 text-indigo-300' : 'bg-indigo-50/50 border-indigo-100 text-indigo-800'
              }`}>
                <Info className="w-5 h-5 flex-shrink-0" />
                <p className="text-[10px] leading-relaxed font-bold uppercase tracking-wide">
                  Once defined here, these attributes will automatically appear as fields when you create or edit items in the Stock Item Form.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Active Attributes List */}
          <div className="lg:col-span-8 space-y-6">
            <div className={`p-6 rounded-[2rem] border ${
              theme === 'dark' ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-100'
            } shadow-sm space-y-6`}>
              
              {/* List Header and Search */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h2 className="text-md font-black uppercase tracking-tight flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-500" />
                    Active Attributes
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                    Manage defined master attributes
                  </p>
                </div>

                {/* Search Attributes */}
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search attributes..."
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl outline-none text-xs font-black uppercase tracking-wide focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Attributes Grid/List */}
              {loading ? (
                <div className="py-16 text-center">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-3" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Loading Attributes...</span>
                </div>
              ) : filteredAttributes.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                  <Tag className="w-12 h-12 mx-auto opacity-10 mb-3 text-indigo-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                    {searchQuery ? "No matching attributes found" : "No attributes defined yet"}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredAttributes.map((attr) => (
                    <div
                      key={attr.id}
                      className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                        theme === 'dark'
                          ? 'bg-black/20 border-gray-800/60 hover:border-indigo-500/30 hover:bg-black/40'
                          : 'bg-gray-50/50 border-gray-100 hover:border-indigo-500/20 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${
                          theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          #{attr.id}
                        </span>
                        <span className="font-black text-sm uppercase tracking-wide">
                          {attr.name}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDeleteAttribute(attr.id, attr.name)}
                        className={`p-2 rounded-xl border opacity-0 group-hover:opacity-100 transition-all ${
                          theme === 'dark'
                            ? 'border-gray-800 text-gray-400 hover:text-red-400 hover:bg-red-950/20 hover:border-red-900/30'
                            : 'border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-100'
                        }`}
                        title="Delete attribute"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ItemManagement;

