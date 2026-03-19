import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Edit, Trash2, Building2, ShieldCheck,
    UserCheck, Mail, Map, Smartphone, Hash,
    ArrowUpRight, Clock, MoreVertical, LayoutGrid
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { format } from 'date-fns';
import api from '../../services/api';
import Swal from 'sweetalert2';

interface Trader {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    pan: string;
    userLimit: number;
    created_at: string;
    company_count: number;
}

const Traders: React.FC = () => {
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [traders, setTraders] = useState<Trader[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchTraders = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/traders');
            setTraders(res.data);
        } catch (err: any) {
            console.error(err);
            Swal.fire({
                icon: 'error',
                title: 'Fetch Failed',
                text: err.response?.data?.error || err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTraders();
    }, []);

    const stats = useMemo(() => {
        const total = traders.length;
        const totalCompanies = traders.reduce((acc, t) => acc + (t.company_count || 0), 0);
        const avgLimit = total > 0 ? (traders.reduce((acc, t) => acc + (t.userLimit || 0), 0) / total).toFixed(1) : 0;

        return [
            { label: 'Active Traders', value: total, icon: UserCheck, color: 'from-blue-500 to-indigo-600', trend: '+12%' },
            { label: 'Total Companies', value: totalCompanies, icon: Building2, color: 'from-emerald-500 to-teal-600', trend: '+5.4%' },
        ];
    }, [traders]);

    const handleUpdateLimit = async (id: number, currentLimit: number) => {
        const { value: newLimit } = await Swal.fire({
            title: 'Update Purchase Limit',
            input: 'number',
            inputLabel: 'Set maximum companies this trader can create',
            inputValue: currentLimit,
            showCancelButton: true,
            confirmButtonColor: '#6366f1',
            inputValidator: (value) => {
                if (!value || parseInt(value) < 1) {
                    return 'Please enter a valid limit (min 1)';
                }
            }
        });

        if (newLimit) {
            try {
                await api.patch(`/api/traders/${id}/limit`, { userLimit: parseInt(newLimit) });
                setTraders(prev => prev.map(t => t.id === id ? { ...t, userLimit: parseInt(newLimit) } : t));
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Trader purchase limit updated successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Update Failed',
                    text: err.response?.data?.error || err.message,
                });
            }
        }
    };

    const handleDeleteTrader = async (id: number) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This will delete the trader account permanently!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/api/traders/${id}`);
                setTraders(prev => prev.filter(t => t.id !== id));
                Swal.fire('Deleted!', 'Trader has been removed.', 'success');
            } catch (err: any) {
                Swal.fire({
                    icon: 'error',
                    title: 'Delete Failed',
                    text: err.response?.data?.error || err.message,
                });
            }
        }
    };

    const filteredTraders = traders.filter(
        (t) =>
            (t.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.pan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.phone || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleViewDetails = (id: number) => {
        navigate(`/trader/${id}`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ... rest of the component remains the same ... */}
            {/* Header & Stats Row */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div>
                    <h1 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-3xl font-black tracking-tight flex items-center gap-3`}>
                        <LayoutGrid className="w-8 h-8 text-indigo-600" />
                        Trader Management
                    </h1>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} mt-1 font-medium`}>
                        Overseeing your network of business owners.
                    </p>
                </div>

                {/* Compact Stats Grid */}
                <div className="flex flex-wrap items-center gap-3">
                    {stats.map((stat, idx) => (
                        <div key={idx} className={`relative overflow-hidden rounded-2xl p-3 px-5 transition-all duration-300 hover:translate-y-[-2px] group ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-gray-100 shadow-sm'} border min-w-[180px]`}>
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg shadow-indigo-500/10`}>
                                    <stat.icon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none">{stat.label}</p>
                                    <h3 className={`text-xl font-black mt-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stat.value}</h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Search Bar - Full Width */}
            <div className={`rounded-2xl p-3 flex items-center gap-3 border backdrop-blur-md ${theme === 'dark' ? 'bg-gray-800/20 border-gray-700/30' : 'bg-white/80 border-gray-100 shadow-xl shadow-indigo-500/5'}`}>
                <div className="relative flex-1 group">
                    <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by name, email, PAN..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-sm ${theme === 'dark' ? 'border-gray-700/50 bg-gray-900/40 text-white' : 'border-gray-100 bg-gray-50/50 text-gray-900'}`}
                    />
                </div>
            </div>

            {/* Traders Table Container */}
            <div className={`rounded-[2rem] border overflow-hidden shadow-2xl transition-all ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700/50 shadow-black/20' : 'bg-white border-gray-100 shadow-indigo-500/5'
                }`}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className={`${theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50/50'} text-[11px] font-black uppercase tracking-[0.2em]`}>
                                <th className="px-8 py-6 text-left text-gray-400">Master Intelligence</th>
                                <th className="px-6 py-6 text-left text-gray-400">Secure Access</th>
                                <th className="px-6 py-6 text-left text-gray-400">Pan</th>
                                <th className="px-6 py-6 text-center text-gray-400">Architecture</th>
                                <th className="px-6 py-6 text-center text-gray-400">Capacity</th>
                                <th className="px-8 py-6 text-right text-gray-400">Management</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700/50' : 'divide-gray-100'}`}>
                            {!loading && filteredTraders.length > 0 ? filteredTraders.map((trader) => (
                                <tr key={trader.id} className="group hover:bg-indigo-500/[0.02] transition-colors duration-300">
                                    <td className="px-8 py-7 whitespace-nowrap">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-lg font-black shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
                                                {trader.firstName ? trader.firstName[0] : 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-bold text-lg leading-tight`}>
                                                    {trader.firstName} {trader.lastName}
                                                </span>
                                                <div className="flex items-center gap-1.5 mt-1 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                                                    <Clock className="w-3 h-3 text-emerald-500" />
                                                    {format(new Date(trader.created_at), 'dd MMM, yyyy')}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-7 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center text-sm font-bold text-gray-500 group-hover:text-indigo-400 transition-colors">
                                                <Mail className="w-4 h-4 mr-2 opacity-50" /> {trader.email}
                                            </div>
                                            <div className="flex items-center text-xs font-medium text-gray-400 italic">
                                                <Smartphone className="w-3 h-3 mr-2 opacity-30" /> {trader.phone || 'No phone'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-7 whitespace-nowrap">
                                        <div className="inline-flex items-center px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                            <Hash className="w-4 h-4 mr-2 text-indigo-500/50" />
                                            <span className={`${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-600'} font-black uppercase text-xs tracking-widest`}>
                                                {trader.pan || 'TAX-VOID'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-7 text-center whitespace-nowrap">
                                        <div className="flex flex-col items-center group/count">
                                            <span className={`text-2xl font-black mb-0.5 ${trader.company_count >= trader.userLimit ? 'text-red-500' : 'text-emerald-500'}`}>
                                                {trader.company_count}
                                            </span>
                                            <span className="text-[9px] font-black uppercase text-gray-400 tracking-tighter group-hover/count:text-indigo-500 transition-colors">Companies</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-7 text-center whitespace-nowrap text-inherit">
                                        <div className="inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 bg-gray-100 dark:bg-gray-900 rounded-xl font-black text-indigo-500 ring-1 ring-indigo-500/20">
                                            {trader.userLimit}
                                        </div>
                                    </td>
                                    <td className="px-8 py-7 whitespace-nowrap">
                                        <div className="flex items-center justify-end gap-3 transition-all duration-300">
                                            <button
                                                title="Upgrade Privilege (Disabled)"
                                                disabled
                                                className="p-3 bg-blue-500/50 text-white rounded-xl cursor-not-allowed transition-all shadow-lg"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                title="Revoke Node Access (Disabled)"
                                                disabled
                                                className="p-3 bg-red-500/50 text-white rounded-xl cursor-not-allowed transition-all shadow-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleViewDetails(trader.id)}
                                                className={`p-3 rounded-xl hover:bg-indigo-500 hover:text-white transition-all ${theme === 'dark' ? 'bg-gray-800 text-gray-500' : 'bg-gray-100 text-gray-500'}`}>
                                                <MoreVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center">
                                        {loading ? (
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p className="text-gray-400 font-black uppercase tracking-widest text-xs animate-pulse">Initializing Platform Assets...</p>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4 opacity-40">
                                                <Search className="w-16 h-16 text-gray-400" />
                                                <p className="text-gray-500 font-bold">No intelligence matches the criteria.</p>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer Info Hub */}
                <div className={`px-8 py-6 flex items-center justify-end border-t ${theme === 'dark' ? 'border-gray-700/50 bg-gray-900/20' : 'bg-gray-50/50 border-gray-100'
                    }`}>
                    <div className="flex items-center gap-4 text-xs font-black text-indigo-500 uppercase tracking-widest">
                        Total {filteredTraders.length} Traders Detected
                    </div>
                </div>
            </div>

        </div>
    );
};


export default Traders;