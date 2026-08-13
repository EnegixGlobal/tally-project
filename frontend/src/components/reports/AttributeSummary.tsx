import React, { useState, useEffect } from "react";
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
              <table className="w-full border-collapse">
                <thead>
                  <tr className={`${isDark ? "bg-slate-800/80 text-slate-300" : "bg-slate-100/80 text-slate-600"} uppercase text-xs tracking-wider font-bold`}>
                    <th className="p-5 text-left min-w-[300px]">Item & Attributes</th>
                    <th className="p-5 text-right w-32 border-l border-white/5">Opening</th>
                    <th className="p-5 text-right w-32 border-l border-white/5">Purchase</th>
                    <th className="p-5 text-right w-32 border-l border-white/5">Sales</th>
                    <th className="p-5 text-right w-32 border-l border-white/5">Closing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/10 dark:divide-slate-800/50">
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <Box size={48} className={isDark ? "text-slate-700" : "text-slate-300"} />
                          <p className={`font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>No attribute data available for this company.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    data.map((row, index) => (
                      <tr 
                        key={index} 
                        className={`group transition-all duration-300 ${isDark ? "hover:bg-slate-800/60" : "hover:bg-blue-50/50 hover:shadow-sm"}`}
                      >
                        <td className="p-5">
                          <div className="flex flex-col gap-2">
                            {/* Item Name */}
                            <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>
                              {row.item_name}
                            </span>
                            
                            {/* Prime Attribute */}
                            <div className="flex items-center gap-2">
                              <span className={`px-2.5 py-1 rounded-md text-sm font-semibold border ${isDark ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-white border-slate-200 shadow-sm text-slate-800"}`}>
                                <span className={isDark ? "text-slate-400" : "text-slate-500"}>{row.attribute_name}:</span> {row.prime_attribute}
                              </span>
                            </div>

                            {/* Sub Attributes */}
                            {row.sub_attributes && row.sub_attributes.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-1">
                                {row.sub_attributes.map((sub, idx) => (
                                  <span 
                                    key={idx} 
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                                      isDark 
                                        ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-300 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40" 
                                        : "bg-blue-50 border-blue-100 text-blue-700 group-hover:bg-blue-100 group-hover:border-blue-200"
                                    }`}
                                  >
                                    <span className="opacity-75">{sub.name}:</span> {sub.value}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="p-5 text-right font-medium text-slate-500">
                          {row.opening > 0 ? (
                            <span className="px-3 py-1 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400">{row.opening}</span>
                          ) : "-"}
                        </td>
                        <td className="p-5 text-right font-medium">
                          {row.purchase > 0 ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{row.purchase}</span>
                          ) : "-"}
                        </td>
                        <td className="p-5 text-right font-medium">
                          {row.sales > 0 ? (
                            <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">{row.sales}</span>
                          ) : "-"}
                        </td>
                        <td className="p-5 text-right">
                          <span className={`text-lg font-bold ${row.closing < 0 ? "text-rose-500" : row.closing > 0 ? "text-blue-500 dark:text-blue-400" : "text-slate-400"}`}>
                            {row.closing}
                          </span>
                        </td>
                      </tr>
                    ))
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
