import React, { useEffect, useState, useRef } from "react";
import { Search, Printer, Check, Trash2, LayoutGrid, List as ListIcon, X } from "lucide-react";
import { useAppContext } from "../../../context/AppContext";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import Swal from "sweetalert2";

interface StockItem {
    id: string;
    name: string;
    barcode: string;
    unit?: string;
}

interface PrintItem extends StockItem {
    copies: number;
}

const BarcodeManagement = () => {
    const { theme } = useAppContext();
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [printQueue, setPrintQueue] = useState<PrintItem[]>([]);

    const companyId = localStorage.getItem("company_id");
    const ownerType = localStorage.getItem("supplier");
    const ownerId = localStorage.getItem(
        ownerType === "employee" ? "employee_id" : "user_id"
    );

    const componentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchStockItems();
    }, [companyId, ownerType, ownerId]);

    const fetchStockItems = async () => {
        if (!companyId || !ownerType || !ownerId) return;
        try {
            setLoading(true);
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
            );
            const json = await res.json();
            if (json.success) {
                // Filter items that actually have barcodes
                setStockItems(json.data.filter((item: StockItem) => item.barcode));
            }
        } catch (err) {
            console.error("Failed to fetch stock items:", err);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: "Barcodes",
    });

    const addToPrintQueue = (item: StockItem) => {
        const existing = printQueue.find(qi => qi.id === item.id);
        if (existing) {
            setPrintQueue(printQueue.map(qi =>
                qi.id === item.id ? { ...qi, copies: qi.copies + 1 } : qi
            ));
        } else {
            setPrintQueue([...printQueue, { ...item, copies: 1 }]);
        }

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Added to print queue',
            showConfirmButton: false,
            timer: 1000
        });
    };

    const removeFromPrintQueue = (id: string) => {
        setPrintQueue(printQueue.filter(item => item.id !== id));
    };

    const updateCopies = (id: string, copies: number) => {
        if (copies < 1) return;
        setPrintQueue(printQueue.map(item =>
            item.id === id ? { ...item, copies } : item
        ));
    };

    const filteredItems = stockItems.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="pt-[56px] px-4 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Barcode Management</h1>
                    <p className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"} text-sm mt-1`}>
                        Search items and generate/print barcodes for your stock items
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all ${theme === "dark"
                                    ? "bg-gray-800 border-gray-700 text-white"
                                    : "bg-white border-gray-200 text-gray-900"
                                }`}
                        />
                    </div>

                    <div className={`flex items-center border rounded-lg p-1 ${theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-blue-600') : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? (theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-blue-600') : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Item Selection Area */}
                <div className="xl:col-span-3">
                    {loading ? (
                        <div className="flex items-center justify-center p-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className={`text-center p-20 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                            <ScanBarcode className="mx-auto w-12 h-12 mb-4 opacity-20" />
                            <p>No items with barcodes found.</p>
                            {searchQuery && <p className="text-sm">Try searching for something else.</p>}
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`p-4 rounded-xl border transition-all hover:shadow-lg group ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-semibold text-wrap line-clamp-1 pr-2 uppercase text-xs tracking-wider">{item.name}</h3>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setPrintQueue([{ ...item, copies: 1 }]);
                                                    setTimeout(() => handlePrint(), 100);
                                                }}
                                                className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${theme === 'dark' ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-green-50 text-green-600 border border-green-100'
                                                    }`}
                                                title="Print Now"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={() => addToPrintQueue(item)}
                                                className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${theme === 'dark' ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                    }`}
                                                title="Add to Print Queue"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-center bg-white p-4 rounded-lg border border-gray-100 mb-3 overflow-hidden">
                                        <Barcode
                                            value={item.barcode}
                                            width={1.2}
                                            height={50}
                                            fontSize={12}
                                            background="#ffffff"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-xs opacity-60">
                                        <span>Barcode: {item.barcode}</span>
                                        <button
                                            onClick={() => addToPrintQueue(item)}
                                            className={`flex items-center gap-1 font-medium sm:hidden ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}
                                        >
                                            <Plus size={12} /> Add to Print
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200 shadow-sm'}`}>
                            <table className="w-full text-left">
                                <thead className={`${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50'}`}>
                                    <tr>
                                        <th className="px-6 py-4 font-semibold text-sm">Item Name</th>
                                        <th className="px-6 py-4 font-semibold text-sm">Barcode</th>
                                        <th className="px-6 py-4 font-semibold text-sm text-center">Visual</th>
                                        <th className="px-6 py-4 font-semibold text-sm text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                                    {filteredItems.map(item => (
                                        <tr key={item.id} className={`border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                                            <td className="px-6 py-4 text-sm font-medium">{item.name}</td>
                                            <td className="px-6 py-4 text-sm font-mono opacity-70">{item.barcode}</td>
                                            <td className="px-6 py-4 flex justify-center">
                                                <div className="bg-white p-1 rounded">
                                                    <Barcode value={item.barcode} width={0.8} height={25} fontSize={10} />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setPrintQueue([{ ...item, copies: 1 }]);
                                                            setTimeout(() => handlePrint(), 100);
                                                        }}
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${theme === 'dark' ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                            }`}
                                                    >
                                                        <Printer size={14} /> Print
                                                    </button>
                                                    <button
                                                        onClick={() => addToPrintQueue(item)}
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${theme === 'dark' ? 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                                            }`}
                                                    >
                                                        <Plus size={14} /> Queue
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Print Queue Sidebar */}
                <div className="xl:col-span-1">
                    <div className={`sticky top-[80px] rounded-xl border overflow-hidden flex flex-col max-h-[calc(100vh-120px)] ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-lg'
                        }`}>
                        <div className={`p-4 border-b flex justify-between items-center ${theme === 'dark' ? 'border-gray-700 bg-gray-900/30' : 'border-gray-100 bg-gray-50/50'}`}>
                            <h2 className="font-bold flex items-center gap-2">
                                <Printer size={18} /> Print Queue
                            </h2>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'}`}>
                                {printQueue.length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {printQueue.length === 0 ? (
                                <div className="text-center py-10 opacity-40">
                                    <p className="text-sm italic">Queue is empty</p>
                                </div>
                            ) : (
                                printQueue.map(item => (
                                    <div key={item.id} className={`p-3 rounded-lg border flex flex-col gap-2 ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex justify-between items-start">
                                            <span className="text-sm font-medium line-clamp-2 leading-tight">{item.name}</span>
                                            <button
                                                onClick={() => removeFromPrintQueue(item.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex justify-between items-center mt-1">
                                            <div className="flex items-center gap-2">
                                                <label className="text-[10px] uppercase font-bold text-gray-500">Copies:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.copies}
                                                    onChange={(e) => updateCopies(item.id, parseInt(e.target.value) || 1)}
                                                    className={`w-12 h-6 text-center text-xs rounded border outline-none ${theme === 'dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200 shadow-inner'
                                                        }`}
                                                />
                                            </div>
                                            <span className="text-[10px] text-gray-500 font-mono">{item.barcode}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-700 bg-gray-900/10 mt-auto">
                            <button
                                onClick={() => handlePrint()}
                                disabled={printQueue.length === 0}
                                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold transition-all ${printQueue.length === 0
                                        ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-600/20 active:scale-[0.98]"
                                    }`}
                            >
                                <Printer size={20} /> Print Labels
                            </button>
                            {printQueue.length > 0 && (
                                <button
                                    onClick={() => setPrintQueue([])}
                                    className="w-full mt-2 text-xs text-gray-500 hover:text-red-500 transition-colors font-medium text-center"
                                >
                                    Clear All
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden Print Container */}
            <div className="hidden">
                <div ref={componentRef} className="print-labels-container p-4">
                    <div className="grid grid-cols-3 gap-8" style={{ width: "100%", padding: "10mm" }}>
                        {printQueue.flatMap(item =>
                            Array.from({ length: item.copies }).map((_, i) => (
                                <div key={`${item.id}-${i}`} className="flex flex-col items-center justify-center border p-4 border-gray-100 mb-8 break-inside-avoid shadow-sm rounded">
                                    <span className="text-[10px] font-bold mb-1 truncate w-full text-center uppercase tracking-tight">{item.name}</span>
                                    <div className="flex justify-center bg-white p-1">
                                        <Barcode
                                            value={item.barcode}
                                            width={1.2}
                                            height={35}
                                            fontSize={11}
                                            margin={0}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Styles for Printing */}
            <style>{`
        @media print {
          .print-labels-container {
            display: block !important;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 10mm;
          }
          .break-inside-avoid {
            page-break-inside: avoid;
          }
        }
      `}</style>
        </div>
    );
};

const ScanBarcode = ({ className, ...props }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M3 7V5a2 2 0 0 1 2-2h2" />
        <path d="M17 3h2a2 2 0 0 1 2 2v2" />
        <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
        <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
        <polyline points="7 12 12 7 17 12" />
        <line x1="12" y1="7" x2="12" y2="17" />
    </svg>
);

const Plus = ({ size = 24, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export default BarcodeManagement;
