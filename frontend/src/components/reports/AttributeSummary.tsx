import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, Copy, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

const AttributeSummary: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [data, setData] = useState<any[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [copyCounts, setCopyCounts] = useState<Record<string, number>>({});

  const company_id = localStorage.getItem("company_id") || "";
  const owner_type = localStorage.getItem("supplier") || localStorage.getItem("owner_type") || "employee";
  const owner_id = localStorage.getItem(owner_type === "employee" ? "employee_id" : "user_id") || "";

  useEffect(() => {
    loadData();
    loadAttributes();
  }, [company_id, owner_type, owner_id]);

  const loadAttributes = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/stock-attributes`);
      const json = await res.json();
      if (json.success) setAttributes(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getAttributesData = (attributesData: any) => {
    if (!attributesData || attributesData.length === 0) return [];
    let parsedData = attributesData;
    if (typeof attributesData === 'string') {
        try { parsedData = JSON.parse(attributesData); } 
        catch { parsedData = attributesData.split(','); }
    }
    if (!Array.isArray(parsedData)) return [];
    return parsedData.map((attr: any) => {
      if (attr && typeof attr === 'object') {
        return { name: attr.attribute_name || attr.name, value: attr.value || '' };
      }
      const match = attributes.find(a => String(a.id) === String(attr));
      return match ? { name: match.name, value: '' } : null;
    }).filter(Boolean);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ company_id, owner_type, owner_id });
      
      const [stockRes, purRes, salRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/stock-items?${params}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/purchase-vouchers/purchase-history?${params}`),
        fetch(`${import.meta.env.VITE_API_URL}/api/sales-vouchers/sale-history?${params}`)
      ]);

      const stockData = await stockRes.json();
      const purData = await purRes.json();
      const salData = await salRes.json();

      const items = Array.isArray(stockData.data) ? stockData.data : [];
      const purchases = Array.isArray(purData.data) ? purData.data : [];
      const sales = Array.isArray(salData.data) ? salData.data : [];

      const formatted = items.map((item: any) => {
        const itemPurchases = purchases.filter((p: any) => p.itemName?.toLowerCase().trim() === item.name.toLowerCase().trim());
        const itemSales = sales.filter((s: any) => s.itemName?.toLowerCase().trim() === item.name.toLowerCase().trim());

        return {
          id: item.id,
          name: item.name,
          attributes: getAttributesData(item.attributes),
          purchases: itemPurchases,
          sales: itemSales,
        };
      });

      setData(formatted);
    } catch (err: any) {
      setError("Failed to load summary data.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleCopyAttribute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCopyCounts(prev => ({
      ...prev,
      [id]: (prev[id] ?? 1) + 1
    }));
  };

  const handleRemoveAttribute = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCopyCounts(prev => {
      const current = prev[id] ?? 1;
      if (current <= 1) return prev; // Minimum 1 row must remain
      return { ...prev, [id]: current - 1 };
    });
  };

  return (
    <div className={`min-h-screen pt-[60px] ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className={`p-2 rounded-full transition-colors ${theme === "dark" ? "hover:bg-gray-800" : "hover:bg-gray-200"}`}>
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold">Attribute Summary Report</h1>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`rounded-xl shadow-lg overflow-hidden border ${theme === "dark" ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : error ? (
              <div className="p-8 text-center text-red-500">{error}</div>
            ) : (
              <table className="w-full border-collapse text-sm">
                <thead className={`${theme === "dark" ? "bg-gray-700/50" : "bg-gray-50"}`}>
                  <tr>
                    <th className={`p-4 text-left border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} font-semibold min-w-[200px]`}>
                      Item Name
                    </th>
                    <th className={`p-3 text-right border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} font-semibold bg-green-500/10`}>Purchase</th>
                    <th className={`p-3 text-right border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} font-semibold bg-red-500/10`}>Sales</th>
                    <th className={`p-3 text-right border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} font-semibold bg-blue-500/10`}>Closing Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.length === 0 ? (
                    <tr><td colSpan={4} className="p-8 text-center text-gray-500">No stock data available.</td></tr>
                  ) : (
                    data.map((row) => {
                      const attributesString = row.attributes.length > 0 
                        ? row.attributes.map((a: any) => `${a.name}${a.value ? `: ${a.value}` : ''}`).join(', ')
                        : 'No attributes linked';
                      
                      // Extract IMEI from the attributes string to match with batchNumber
                      const imeiMatch = attributesString.match(/(?:imei|batch)[\s:]*([a-zA-Z0-9_-]+)/i);
                      const imei = imeiMatch ? imeiMatch[1].toLowerCase() : null;

                      let purQty = 0;
                      let salQty = 0;

                      if (imei) {
                        row.purchases.forEach((p: any) => {
                          if (p.batchNumber?.toLowerCase() === imei) purQty += Number(p.purchaseQuantity || 0);
                        });
                        row.sales.forEach((s: any) => {
                          if (s.batchNumber?.toLowerCase() === imei) salQty += Math.abs(Number(s.qtyChange || 0));
                        });
                      }

                      const closingQty = purQty - salQty;
                      
                      return (
                        <React.Fragment key={row.id}>
                          {/* Item Row */}
                          <tr 
                            onClick={() => toggleExpand(row.id)}
                            className={`cursor-pointer transition-colors ${theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"} ${expandedItems.has(row.id) ? 'font-bold' : ''}`}
                          >
                            <td className={`p-4 border ${theme === "dark" ? "border-gray-700" : "border-gray-200"} font-medium flex items-center gap-2`}>
                              {expandedItems.has(row.id) ? <ChevronDown size={16} className="text-blue-500"/> : <ChevronRight size={16} className="text-gray-400"/>}
                              {row.name}
                            </td>
                            {/* Empty columns for Purchase, Sales, Closing */}
                            <td className={`p-2 border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}></td>
                            <td className={`p-2 border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}></td>
                            <td className={`p-2 border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}></td>
                          </tr>

                          {/* Expanded Rows showing Attributes */}
                          {expandedItems.has(row.id) && (
                            Array.from({ length: copyCounts[row.id] ?? 1 }).map((_, index) => (
                              <tr key={`${row.id}-attr-${index}`} className={`${theme === "dark" ? "bg-gray-800" : "bg-blue-50"}`}>
                                <td className={`p-4 border ${theme === "dark" ? "border-gray-700" : "border-gray-300"} pl-10 ${theme === "dark" ? "text-white" : "text-black"} font-bold`}>
                                  <div className="flex items-center gap-2">
                                    <span>{index + 1}. ↳ {attributesString}</span>
                                    <button 
                                      onClick={(e) => handleCopyAttribute(row.id, e)} 
                                      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors" 
                                      title="Duplicate Attribute"
                                    >
                                      <Copy size={16} className="text-blue-600 dark:text-blue-400" />
                                    </button>
                                    {index > 0 && (
                                      <button 
                                        onClick={(e) => handleRemoveAttribute(row.id, e)} 
                                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors" 
                                        title="Remove Attribute"
                                      >
                                        <Trash2 size={16} className="text-red-500" />
                                      </button>
                                    )}
                                  </div>
                                </td>
                                {/* Purchase, Sales, Closing for the IMEI */}
                                <td className={`p-2 text-right border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>{purQty > 0 ? `${purQty} pcs` : ""}</td>
                                <td className={`p-2 text-right border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>{salQty > 0 ? `${salQty} pcs` : ""}</td>
                                <td className={`p-2 text-right border ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>{closingQty !== 0 ? `${closingQty} pcs` : ""}</td>
                              </tr>
                            ))
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttributeSummary;
