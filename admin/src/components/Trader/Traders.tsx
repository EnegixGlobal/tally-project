import React, { useEffect, useState } from 'react';
import { Search, Edit, Trash2, Users, Building2, Smartphone, Mail, Hash } from 'lucide-react';
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

    const handleUpdateLimit = async (id: number, currentLimit: number) => {
        const { value: newLimit } = await Swal.fire({
            title: 'Update Purchase Limit',
            input: 'number',
            inputLabel: 'Set maximum companies this trader can create',
            inputValue: currentLimit,
            showCancelButton: true,
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-2xl font-bold`}>Trader Management</h1>
                    <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Manage people who buy and own companies</p>
                </div>
            </div>

            {/* Filters */}
            <div className={`rounded-xl shadow-sm border p-4 ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="relative max-w-md">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, PAN or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${theme === 'dark' ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-200 bg-white text-gray-900'
                            }`}
                    />
                </div>
            </div>

            {/* Traders Grid/List */}
            <div className={`rounded-xl shadow-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className={`${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                            <tr>
                                <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Trader Info</th>
                                <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Contact & PAN</th>
                                <th className={`px-6 py-4 text-center font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Companies</th>
                                <th className={`px-6 py-4 text-center font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Purchase Limit</th>
                                <th className={`px-6 py-4 text-left font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
                            {!loading && filteredTraders.length > 0 ? filteredTraders.map((trader) => (
                                <tr key={trader.id} className={`${theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-blue-50/30'} transition-colors`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                {trader.firstName ? trader.firstName[0] : 'U'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} font-semibold truncate max-w-[150px]`}>
                                                    {trader.firstName} {trader.lastName}
                                                </span>
                                                <span className="text-xs text-gray-400">ID: #{trader.id} • {format(new Date(trader.created_at), 'MMM dd, yyyy')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Mail className="w-3 h-3 mr-1" /> {trader.email}
                                            </div>
                                            <div className="flex items-center text-xs text-gray-500">
                                                <Smartphone className="w-3 h-3 mr-1" /> {trader.phone}
                                            </div>
                                            <div className="flex items-center text-xs font-bold text-gray-400">
                                                <Hash className="w-3 h-3 mr-1" /> PAN: {trader.pan}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <div className="flex flex-col items-center">
                                            <div className={`text-lg font-bold ${trader.company_count >= trader.userLimit ? 'text-red-500' : 'text-primary'}`}>
                                                {trader.company_count}
                                            </div>
                                            <div className="text-[10px] uppercase text-gray-400">Companies Owned</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center whitespace-nowrap">
                                        <div className="inline-flex flex-col items-center px-3 py-1 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                                            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">{trader.userLimit}</span>
                                            <span className="text-[10px] uppercase text-violet-500/70">Max Limit</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <button
                                                title="Change Limit"
                                                onClick={() => handleUpdateLimit(trader.id, trader.userLimit)}
                                                className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                title="Delete Trader"
                                                onClick={() => handleDeleteTrader(trader.id)}
                                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-600 hover:text-white transition-all transform hover:scale-110 shadow-sm"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        {loading ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                                Loading traders...
                                            </div>
                                        ) : (
                                            'No traders found matching your criteria.'
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Traders;