import React, { useEffect, useState, useRef } from "react";
import { Search, Printer, Check, Trash2, LayoutGrid, List as ListIcon, X, ScanBarcode as ScanIcon, Terminal, Package, ArrowRight, Zap, Info, Settings } from "lucide-react";
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
    const [showSettings, setShowSettings] = useState(false);
    const [showNameOnBarcode, setShowNameOnBarcode] = useState(false);

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
                setStockItems(json.data.filter((item: StockItem) => item.barcode));
            }
        } catch (err) {
            console.error("Failed to fetch stock items:", err);
        } finally {
            setTimeout(() => setLoading(false), 500); // Smooth loading transition
        }
    };

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Barcodes_${new Date().toLocaleDateString()}`,
        pageStyle: `
            @page { 
                size: 3in 2in; 
                margin: 0 !important; 
            } 
            @media print { 
                * {
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                    image-rendering: pixelated !important;
                    font-family: 'Courier New', Courier, monospace !important;
                }
                html, body {
                    margin: 0 !important;
                    padding: 0 !important;
                    width: 3in !important;
                    height: 2in !important;
                    background: #ffffff !important;
                }
                .print-matrix {
                    display: block !important;
                    width: 3in !important;
                }
                .label-page {
                    width: 3in !important;
                    height: 2in !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    page-break-after: always !important;
                    page-break-inside: avoid !important;
                    margin: 0 !important;
                    padding: 0.1in !important;
                    overflow: hidden !important;
                    background: white !important;
                    box-sizing: border-box !important;
                }
                canvas, svg {
                    max-width: 2.8in !important;
                    max-height: 1.5in !important;
                    height: auto !important;
                }
                .label-name {
                    font-size: 13px !important;
                    font-weight: bold !important;
                    text-align: center !important;
                    width: 2.8in !important;
                    white-space: nowrap !important;
                    overflow: hidden !important;
                    text-overflow: ellipsis !important;
                    margin-bottom: 4px !important;
                    color: #000000 !important;
                    font-family: 'Courier New', Courier, monospace !important;
                    letter-spacing: 0.02em !important;
                }
            }
        `,
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

        const Toast = Swal.mixin({
            toast: true,
            position: 'bottom-end',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        Toast.fire({
            icon: 'success',
            title: `"${item.name}" added to queue`,
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#f3f4f6' : '#111827',
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

    const totalLabelsInQueue = printQueue.reduce((acc, item) => acc + item.copies, 0);

    return (
        <div className={`pt-20 px-6 min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-10 gap-8 animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            Inventory Tools
                        </span>
                        <div className={`h-1 w-1 rounded-full ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                            Masters
                        </span>
                    </div>
                    <h1 className={`text-4xl font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent"> Barcode</span>
                    </h1>
                    <p className={`max-w-xl text-md ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                        High-precision label management system. Search inventory and deploy barcodes for physical stock tracking.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                    <div className="relative group flex-1 xl:w-80">
                        <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-500 group-focus-within:text-blue-400' : 'text-slate-400 group-focus-within:text-blue-500'}`}>
                            <Search size={18} />
                        </div>
                        <input
                            type="text"
                            placeholder="Identify items by name or ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 rounded-2xl border-2 transition-all outline-none text-sm font-medium ${theme === 'dark'
                                ? 'bg-slate-800/50 border-slate-700/50 text-white focus:border-blue-500/50 focus:bg-slate-800'
                                : 'bg-white border-slate-200 text-slate-900 focus:border-blue-500 focus:shadow-xl focus:shadow-blue-500/10'
                                }`}
                        />
                    </div>

                    <div className={`flex items-center p-1 rounded-2xl border-2 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white shadow-sm'}`}>
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === "grid" ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30') : 'text-gray-500 hover:text-blue-400'}`}
                        >
                            <LayoutGrid size={16} /> Grid
                        </button>
                        <button
                            onClick={() => setViewMode("list")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === "list" ? (theme === 'dark' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30') : 'text-gray-500 hover:text-blue-400'}`}
                        >
                            <ListIcon size={16} /> List
                        </button>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-3 rounded-2xl border-2 transition-all ${theme === 'dark'
                                ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800 text-gray-400 hover:text-blue-400'
                                : 'bg-white border-slate-200 text-slate-500 hover:text-blue-600 hover:shadow-lg'}`}
                        >
                            <Settings size={20} className={showSettings ? "animate-spin-slow" : ""} />
                        </button>

                        {showSettings && (
                            <div className={`absolute right-0 mt-3 w-64 p-5 rounded-[1.8rem] border-2 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-300 ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-100 text-slate-900'
                                }`}>
                                <h4 className="font-black text-[11px] uppercase tracking-widest mb-4 opacity-50 flex items-center gap-2">
                                    <Settings size={12} /> Label Configuration
                                </h4>
                                <div className="space-y-4">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`relative w-10 h-6 border-2 rounded-full transition-colors ${showNameOnBarcode ? 'bg-blue-600 border-blue-600' : theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={showNameOnBarcode}
                                                onChange={() => setShowNameOnBarcode(!showNameOnBarcode)}
                                            />
                                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-sm ${showNameOnBarcode ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className="text-sm font-bold transition-colors group-hover:text-blue-500">Show Item Name</span>
                                    </label>
                                    <p className={`text-[10px] leading-relaxed opacity-60 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                        When enabled, the item name will be printed above the barcode signal.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="xl:col-span-3 space-y-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center p-24 space-y-4">
                            <div className="relative w-16 h-16">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20"></div>
                                <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 animate-spin"></div>
                            </div>
                            <p className={`text-sm font-bold tracking-widest animate-pulse ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>INITIALIZING INVENTORY</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className={`group flex flex-col items-center justify-center p-24 rounded-[2.5rem] border-4 border-dashed transition-colors duration-500 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/20 hover:border-slate-700' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                            <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-transform group-hover:scale-110 duration-500 ${theme === 'dark' ? 'bg-slate-800 text-slate-600' : 'bg-slate-50 text-slate-300'}`}>
                                <ScanIcon size={48} strokeWidth={1} />
                            </div>
                            <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>No Assets Found</h3>
                            <p className={`text-sm max-w-xs text-center ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>
                                {searchQuery ? `We couldn't locate any records matching "${searchQuery}" in our system.` : 'Start by assigning barcodes to your stock items in the editor.'}
                            </p>
                        </div>
                    ) : viewMode === "grid" ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                            {filteredItems.map(item => (
                                <div
                                    key={item.id}
                                    className={`relative p-6 rounded-[2rem] border-2 transition-all duration-300 group hover:-translate-y-2 ${theme === 'dark'
                                        ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-blue-500/30 shadow-2xl shadow-black/20'
                                        : 'bg-white border-slate-200/60 shadow-xl shadow-slate-200/50 hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="space-y-1">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-blue-500' : 'text-blue-600'}`}>Stock Unit</span>
                                            <h3 className={`font-bold leading-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{item.name}</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => {
                                                    setPrintQueue([{ ...item, copies: 1 }]);
                                                    setTimeout(() => handlePrint(), 100);
                                                }}
                                                className={`p-2.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                                                    }`}
                                                title="Immediate Print"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            <button
                                                onClick={() => addToPrintQueue(item)}
                                                className={`p-2.5 rounded-xl transition-all active:scale-95 ${theme === 'dark' ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'
                                                    }`}
                                                title="Add to Deployment Queue"
                                            >
                                                <PlusIcon size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white p-5 rounded-3xl border border-slate-100 flex items-center justify-center transition-all group-hover:shadow-inner">
                                        <Barcode
                                            value={item.barcode}
                                            width={1.4}
                                            height={60}
                                            fontSize={12}
                                            background="#ffffff"
                                            lineColor="#0f172a"
                                        />
                                    </div>

                                    <div className="mt-4 flex justify-between items-center">
                                        <div className={`flex items-center gap-2 text-[11px] font-mono font-bold ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                            <Terminal size={12} />
                                            {item.barcode}
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
                                            Active
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={`rounded-[2.5rem] overflow-hidden border-2 transition-colors duration-500 ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50 shadow-2xl' : 'border-slate-200 bg-white shadow-xl'}`}>
                            <table className="w-full text-left">
                                <thead className={`${theme === 'dark' ? 'bg-slate-800/80 backdrop-blur-md text-slate-400' : 'bg-slate-50/80 backdrop-blur-md text-slate-500'}`}>
                                    <tr>
                                        <th className="px-8 py-5 font-black text-[11px] uppercase tracking-[0.2em]">Deployment Asset</th>
                                        <th className="px-8 py-5 font-black text-[11px] uppercase tracking-[0.2em]">Protocol (ID)</th>
                                        <th className="px-8 py-5 font-black text-[11px] uppercase tracking-[0.2em] text-center">Visual Signal</th>
                                        <th className="px-8 py-5 font-black text-[11px] uppercase tracking-[0.2em] text-right">Operations</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredItems.map(item => (
                                        <tr key={item.id} className={`border-t transition-colors ${theme === 'dark' ? 'border-slate-800 hover:bg-slate-800/40 text-slate-300' : 'border-slate-100 hover:bg-slate-50 text-slate-600'}`}>
                                            <td className="px-8 py-4 font-bold text-sm tracking-tight">{item.name}</td>
                                            <td className="px-8 py-4 text-xs font-mono opacity-60 tracking-tighter">{item.barcode}</td>
                                            <td className="px-8 py-4">
                                                <div className="flex justify-center">
                                                    <div className="bg-white px-3 py-1 rounded-xl shadow-sm border border-slate-50">
                                                        <Barcode value={item.barcode} width={0.8} height={25} fontSize={10} />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-4">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => {
                                                            setPrintQueue([{ ...item, copies: 1 }]);
                                                            setTimeout(() => handlePrint(), 100);
                                                        }}
                                                        className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-emerald-500/20 text-emerald-400' : 'hover:bg-emerald-50 text-emerald-600'}`}
                                                    >
                                                        <Printer size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => addToPrintQueue(item)}
                                                        className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                                                    >
                                                        <PlusIcon size={15} />
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

                {/* Vertical Control Panel (Sidebar) */}
                <div className="xl:col-span-1">
                    <div className={`sticky top-24 rounded-[2.5rem] border-2 overflow-hidden flex flex-col transition-all duration-500 max-h-[calc(100vh-140px)] ${theme === 'dark' ? 'bg-slate-900 border-slate-800 shadow-2xl shadow-blue-900/10' : 'bg-white border-slate-200/80 shadow-2xl shadow-slate-300/40'
                        }`}>
                        <div className={`p-8 border-b transition-colors ${theme === 'dark' ? 'border-slate-800 bg-slate-900/10' : 'border-slate-50 bg-slate-50/30'}`}>
                            <div className="flex justify-between items-center mb-1">
                                <h2 className={`font-black text-xs uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Deployment Queue</h2>
                                <Zap size={14} className="text-yellow-500 fill-yellow-500 animate-pulse" />
                            </div>
                            <p className={`text-[11px] font-medium leading-relaxed ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>
                                Select item quantities for high-precision deployment.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                            {printQueue.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 space-y-4 opacity-50 grayscale transition-all hover:grayscale-0">
                                    <div className={`p-4 rounded-[1.5rem] ${theme === 'dark' ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                        <Package size={24} className={theme === 'dark' ? 'text-slate-600' : 'text-slate-400'} />
                                    </div>
                                    <p className={`text-xs font-bold uppercase tracking-widest text-center ${theme === 'dark' ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Operational Queue Empty
                                    </p>
                                </div>
                            ) : (
                                printQueue.map(item => (
                                    <div key={item.id} className={`group p-4 rounded-[1.8rem] border-2 transition-all duration-300 ${theme === 'dark'
                                        ? 'bg-slate-800/30 border-slate-800 hover:border-slate-700'
                                        : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 shadow-sm'
                                        }`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1 pr-4">
                                                <h4 className={`text-xs font-black uppercase tracking-tight line-clamp-2 leading-none mb-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-800'}`}>
                                                    {item.name}
                                                </h4>
                                                <span className="text-[10px] font-mono opacity-40 font-bold">{item.barcode}</span>
                                            </div>
                                            <button
                                                onClick={() => removeFromPrintQueue(item.id)}
                                                className={`p-1.5 rounded-lg transition-colors scale-0 group-hover:scale-100 duration-300 ${theme === 'dark' ? 'text-slate-500 hover:text-rose-500 hover:bg-rose-500/10' : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'}`}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className={`flex items-center p-1 rounded-xl border ${theme === 'dark' ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                                                <button
                                                    onClick={() => updateCopies(item.id, item.copies - 1)}
                                                    className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors font-bold ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.copies}
                                                    onChange={(e) => updateCopies(item.id, parseInt(e.target.value) || 1)}
                                                    className="w-10 text-center text-xs font-black bg-transparent outline-none border-none"
                                                />
                                                <button
                                                    onClick={() => updateCopies(item.id, item.copies + 1)}
                                                    className={`w-6 h-6 flex items-center justify-center rounded-lg transition-colors font-bold ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-50 text-slate-500'}`}
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black ${theme === 'dark' ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-slate-100 border-slate-100 text-slate-500'}`}>
                                                <Check size={10} className="text-emerald-500" /> STAGED
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Summary & Activation */}
                        <div className={`p-8 border-t transition-colors ${theme === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-50 bg-slate-50/20'}`}>
                            <div className="flex justify-between items-center mb-6 px-1">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`}>Cumulative Count</span>
                                <span className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{totalLabelsInQueue} <span className="text-[10px] text-blue-500 -ml-1 uppercase">Units</span></span>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => handlePrint()}
                                    disabled={printQueue.length === 0}
                                    className={`group w-full py-4 rounded-[1.5rem] flex items-center justify-center gap-3 font-black text-sm transition-all duration-500 active:scale-95 ${printQueue.length === 0
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed border-none shadow-none"
                                        : "bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-2xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-[1.02]"
                                        }`}
                                >
                                    <Printer size={18} className="group-hover:rotate-12 transition-transform" />
                                    GENERATE LABELS
                                    <ArrowRight size={16} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                                </button>

                                {printQueue.length > 0 && (
                                    <button
                                        onClick={() => setPrintQueue([])}
                                        className={`w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${theme === 'dark' ? 'text-slate-600 hover:text-rose-500' : 'text-slate-400 hover:text-rose-600'}`}
                                    >
                                        <Trash2 size={12} /> Purge Terminal Cache
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hidden High-Definition Print Matrix */}
            <div className="hidden">
                <div ref={componentRef} className="print-matrix">
                    {printQueue.flatMap(item =>
                        Array.from({ length: item.copies }).map((_, i) => (
                            <div key={`${item.id}-${i}`} className="label-page">
                                {/* Item Name above barcode */}
                                {showNameOnBarcode && <div className="label-name">{item.name}</div>}
                                <Barcode
                                    value={item.barcode}
                                    width={2}
                                    height={80}
                                    fontSize={16}
                                    margin={10}
                                    background="#ffffff"
                                    lineColor="#000000"
                                    displayValue={true}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Global UI Styles */}
            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: ${theme === 'dark' ? '#334155' : '#e2e8f0'};
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #3b82f6;
                }
                
                @media print {
                    @page {
                        size: 3in 2in;
                        margin: 0;
                    }
                    html, body {
                        width: 3in;
                        height: 2in;
                        margin: 0 !important;
                        padding: 0 !important;
                        overflow: hidden;
                    }
                    .print-matrix {
                        display: block !important;
                        width: 3in;
                        height: 2in;
                    }
                    .label-page {
                        width: 3in;
                        height: 2in;
                        display: flex !important;
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        page-break-after: always;
                        page-break-inside: avoid;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white;
                    }
                    .barcode-wrapper {
                        transform: scale(1.1); /* Slightly scale up to fill space */
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                }
                
                @keyframes shimmer {
                    0% { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                
                .animate-shimmer {
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
                    background-size: 200% 100%;
                    animation: shimmer 2s infinite;
                }

                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

// Icon Components for consistent look
const PlusIcon = ({ size = 24, className }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export default BarcodeManagement;
