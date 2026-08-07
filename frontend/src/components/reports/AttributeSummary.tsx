import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { ChevronRight, ChevronDown, Tag, Save, Check } from 'lucide-react';
import Swal from 'sweetalert2';

interface Attribute {
  id: number;
  name: string;
}

interface StockItem {
  id: string;
  name: string;
  attributes?: string[] | string;
}

const AttributeSummary: React.FC = () => {
  const { theme } = useAppContext();
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  
  // Local state for tracking edited attribute values
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [savedIds, setSavedIds] = useState<string[]>([]);

  const companyId = localStorage.getItem("company_id");
  const ownerType = localStorage.getItem("supplier");
  const ownerId = localStorage.getItem(
    ownerType === "employee" ? "employee_id" : "user_id"
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!companyId || !ownerType || !ownerId) return;

      try {
        const attrRes = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-attributes`);
        const attrJson = await attrRes.json();
        if (attrJson.success) {
          setAttributes(attrJson.data || []);
        }

        const stockRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        const stockJson = await stockRes.json();
        if (stockJson.success) {
          setStockItems(stockJson.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch data for Attribute Summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId, ownerType, ownerId]);

  const getAttributesData = (attributesData: any) => {
    if (!attributesData || attributesData.length === 0) return [];
    
    let parsedData = attributesData;
    if (typeof attributesData === 'string') {
        try {
            parsedData = JSON.parse(attributesData);
        } catch {
            parsedData = attributesData.split(',');
        }
    }

    if (!Array.isArray(parsedData)) return [];

    const items = parsedData.map((attr: any) => {
      if (attr && typeof attr === 'object') {
        return { 
          linkId: String(attr.id), 
          name: attr.attribute_name || attr.name, 
          value: attr.value || '' 
        };
      }
      const match = attributes.find(a => String(a.id) === String(attr));
      return match ? { linkId: null, name: match.name, value: '' } : null;
    }).filter(Boolean);

    return items;
  };

  const toggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  const handleValueChange = (linkId: string, val: string) => {
    setEditValues(prev => ({ ...prev, [linkId]: val }));
    setSavedIds(prev => prev.filter(id => id !== linkId));
  };

  const handleSave = async (linkId: string, currentValue: string) => {
    if (!linkId) return;
    
    const valueToSave = editValues[linkId] !== undefined ? editValues[linkId] : currentValue;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-items/attribute/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: valueToSave })
      });
      const data = await res.json();
      if (data.success) {
        setSavedIds(prev => [...prev, linkId]);
        setTimeout(() => {
          setSavedIds(prev => prev.filter(id => id !== linkId));
        }, 2000);
      } else {
        Swal.fire('Error', data.message || 'Failed to save attribute', 'error');
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', 'An error occurred while saving the attribute', 'error');
    }
  };

  return (
    <div className='pt-[56px] px-4'>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Attribute Summary</h1>
      </div>

      <div className={`rounded-lg overflow-hidden ${theme === "dark" ? "bg-gray-800" : "bg-white shadow"}`}>
        <div className="flex flex-col">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                <thead className={`${theme === "dark" ? "bg-gray-700" : "bg-gray-50"}`}>
                  <tr>
                    <th scope="col" className={`px-6 py-4 text-left text-xs font-medium uppercase tracking-wider ${theme === "dark" ? "text-gray-300" : "text-gray-500"}`}>
                      Stock Item Name
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === "dark" ? "bg-gray-800 divide-gray-600" : "bg-white divide-gray-200"}`}>
                  {loading ? (
                    <tr>
                      <td className={`px-6 py-4 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        Loading...
                      </td>
                    </tr>
                  ) : stockItems.length === 0 ? (
                    <tr>
                      <td className={`px-6 py-4 text-center ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                        No stock items found
                      </td>
                    </tr>
                  ) : (
                    stockItems.map((item) => {
                      const isExpanded = expandedItemId === item.id;
                      const itemAttributes = getAttributesData(item.attributes);
                      
                      return (
                        <React.Fragment key={item.id}>
                          <tr 
                            onClick={() => toggleExpand(item.id)}
                            className={`cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-50"} ${isExpanded ? (theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50') : ''}`}
                          >
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center gap-2 ${theme === "dark" ? "text-gray-200" : "text-gray-900"}`}>
                              {isExpanded ? <ChevronDown size={18} className="text-blue-500" /> : <ChevronRight size={18} className="text-gray-400" />}
                              {item.name}
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className={`${theme === "dark" ? "bg-gray-750" : "bg-blue-50/30"}`}>
                              <td className="px-12 py-6">
                                <div className="flex flex-col gap-4">
                                  <h4 className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Tag size={14} /> Linked Attributes
                                  </h4>
                                  {itemAttributes.length === 0 ? (
                                    <p className={`text-sm italic ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                      No attributes linked to this item.
                                    </p>
                                  ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {itemAttributes.map((attr, idx) => (
                                        <div key={idx} className={`p-3 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'} flex flex-col gap-2`}>
                                          <label className={`text-sm font-medium flex items-center gap-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-500'}`}></div>
                                            {attr?.name}
                                          </label>
                                          <div className="flex gap-2">
                                            <input 
                                              type="text" 
                                              value={attr?.linkId && editValues[attr.linkId] !== undefined ? editValues[attr.linkId] : (attr?.value || '')}
                                              onChange={(e) => attr?.linkId && handleValueChange(attr.linkId, e.target.value)}
                                              placeholder={`Value...`}
                                              disabled={!attr?.linkId}
                                              className={`flex-1 px-3 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-1 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50'}`}
                                            />
                                            {attr?.linkId && (
                                              <button 
                                                onClick={() => handleSave(attr.linkId!, attr.value)}
                                                className={`p-1.5 rounded-md flex items-center justify-center transition-colors ${
                                                  savedIds.includes(attr.linkId) 
                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
                                                    : 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400'
                                                }`}
                                                title="Save Value"
                                              >
                                                {savedIds.includes(attr.linkId) ? <Check size={16} /> : <Save size={16} />}
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributeSummary;
