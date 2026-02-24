import React, { useState } from 'react';
import { Lock, Building2, ArrowRight } from 'lucide-react';

interface CompanyGateProps {
    onUnlock: (companyId: string) => void;
    employeeId: string;
}

const CompanyGate: React.FC<CompanyGateProps> = ({ onUnlock, employeeId }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/login/global-verify-company-access`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: employeeId, username, password }),
            });

            const data = await res.json();

            if (data.success) {
                onUnlock(data.company_id.toString());
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#f8fafc] overflow-y-auto">
            <div className="w-full max-w-md p-6">
                {/* Logo/Brand Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 shadow-xl shadow-indigo-200 mb-4 animate-bounce-subtle">
                        <Building2 className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Unlock Company</h1>
                    <p className="text-gray-500 mt-2">Enter your company-specific credentials to provide secure access.</p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200/50 border border-gray-100 p-8 md:p-10">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-medium"
                                    placeholder="Enter company username"
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none text-gray-900 font-medium"
                                    placeholder="Enter company password"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3 animate-shake">
                                <div className="w-2 h-2 rounded-full bg-red-500" />
                                <span className="text-sm font-medium text-red-700">{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full group relative flex items-center justify-center gap-3 py-4 px-6 rounded-2xl text-white font-bold shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] ${loading
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600'
                                }`}
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                    <span>Verifying Access...</span>
                                </div>
                            ) : (
                                <>
                                    <span>Enter Business Dashboard</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400 font-medium">
                            <Lock className="inline w-3 h-3 mr-1" />
                            End-to-end encrypted company session
                        </p>
                    </div>
                </div>

                {/* Footer Credits */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-400 font-medium tracking-wide">
                        POWERED BY <span className="text-indigo-600 font-bold">APNA BOOK</span>
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    75% { transform: translateX(4px); }
                }
                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }
                @keyframes bounce-subtle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-4px); }
                }
                .animate-bounce-subtle {
                    animation: bounce-subtle 3s infinite ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default CompanyGate;
