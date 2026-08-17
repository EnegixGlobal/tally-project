import React, { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Box } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";

interface SubAttribute {
  name: string;
  value: string;
}

interface AttributeReportRow {
  item_name: string;
  prime_attribute: string;
  attribute_name: string;
  sub_attributes: SubAttribute[];
  opening: number;
  purchase: number;
  sales: number;
  closing: number;
}

const AttributeSummary: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [data, setData] = useState<AttributeReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const company_id = localStorage.getItem("company_id") || "";

  useEffect(() => {
    loadData();
  }, [company_id]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ company_id });
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/attribute-summary-report?${params}`);
      
      const json = await res.json();
      if (json.success) {
        setData(json.data || []);
      } else {
        setError(json.message || "Failed to load summary data.");
      }
    } catch (err: any) {
      setError("Failed to load summary data.");
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === "dark";

  // Dynamically calculate unique attributes across all items
  const uniqueAttributes = useMemo(() => {
    const attributes = new Set<string>();
    data.forEach((row) => {
      if (row.attribute_name) {
        attributes.add(row.attribute_name);
      }
      if (row.sub_attributes && Array.isArray(row.sub_attributes)) {
        row.sub_attributes.forEach((sub) => {
          if (sub.name) attributes.add(sub.name);
        });
      }
    });
    return Array.from(attributes);
  }, [data]);

  return (
    <div className={`min-h-screen pt-[60px] ${isDark ? "bg-slate-950 text-slate-200" : "bg-slate-50 text-slate-800"} font-sans transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className={`p-2 rounded-xl transition-all duration-300 ${isDark ? "bg-slate-800/80 hover:bg-slate-700 text-slate-300" : "bg-white shadow-sm hover:shadow text-slate-600"}`}
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                Attribute Movement
              </h1>
              <p className={`text-sm mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>Track opening, purchase, and sales for specific item attributes</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className={`rounded-2xl shadow-xl overflow-hidden border backdrop-blur-sm ${isDark ? "bg-slate-900/60 border-slate-800 shadow-black/50" : "bg-white/80 border-slate-200 shadow-slate-200/50"}`}>
          
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 rounded-full border-4 border-blue-500/30 border-t-blue-500 animate-spin"></div>
                <p className={`font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>Syncing data...</p>
              </div>
            ) : error ? (
              <div className="p-12 text-center text-red-500 bg-red-500/10 rounded-xl m-4 border border-red-500/20">{error}</div>
            ) : (
              <table className={`w-full border-collapse whitespace-nowrap border text-sm ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>
                <thead className={`sticky top-0 z-10 shadow-sm ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <tr className={`font-semibold border-b ${isDark ? 'text-slate-300 border-slate-700' : 'text-slate-700 border-slate-300'}`}>
                    <th className={`min-w-[250px] px-6 py-3 text-left border-r ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>Item</th>
                    {uniqueAttributes.map((attr) => (
                      <th key={attr} className={`min-w-[180px] px-6 py-3 text-left border-r capitalize ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>{attr}</th>
                    ))}
                    <th className={`min-w-[140px] px-6 py-3 text-right border-r ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>Opening</th>
                    <th className={`min-w-[140px] px-6 py-3 text-right border-r ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>Purchase</th>
                    <th className={`min-w-[140px] px-6 py-3 text-right border-r ${isDark ? 'border-slate-700' : 'border-slate-300'}`}>Sales</th>
                    <th className="min-w-[140px] px-6 py-3 text-right">Closing</th>
                  </tr>
                </thead>
                <tbody className={isDark ? 'bg-slate-900' : 'bg-white'}>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5 + uniqueAttributes.length} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Box size={48} className={isDark ? "text-slate-700" : "text-slate-300"} />
                          <p className={`font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>No attribute data available for this company.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((row, index) => {
                      // Map all attributes for the current row
                      const rowAttributes: Record<string, string> = {};
                      if (row.attribute_name) {
                        rowAttributes[row.attribute_name] = row.prime_attribute;
                      }
                      if (row.sub_attributes && Array.isArray(row.sub_attributes)) {
                        row.sub_attributes.forEach((sub) => {
                          if (sub.name) {
                            rowAttributes[sub.name] = sub.value;
                          }
                        });
                      }

                      return (
                        <tr 
                          key={index} 
                          className={`border-b last:border-b-0 transition-colors ${isDark ? 'hover:bg-slate-800 border-slate-700' : 'hover:bg-blue-50 border-slate-300'}`}
                        >
                          <td className={`px-6 py-3 text-left border-r font-medium ${isDark ? 'border-slate-700 text-slate-200' : 'border-slate-300 text-slate-800'}`}>
                            {row.item_name}
                          </td>
                          
                          {uniqueAttributes.map((attr) => (
                            <td key={attr} className={`px-6 py-3 text-left border-r ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
                              {rowAttributes[attr] || "-"}
                            </td>
                          ))}
                          
                          <td className={`px-6 py-3 text-right border-r ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
                            {row.opening > 0 ? row.opening : "-"}
                          </td>
                          <td className={`px-6 py-3 text-right border-r ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
                            {row.purchase > 0 ? row.purchase : "-"}
                          </td>
                          <td className={`px-6 py-3 text-right border-r ${isDark ? 'border-slate-700 text-slate-400' : 'border-slate-300 text-slate-600'}`}>
                            {row.sales > 0 ? row.sales : "-"}
                          </td>
                          <td className={`px-6 py-3 text-right font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {row.closing}
                          </td>
                        </tr>
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
