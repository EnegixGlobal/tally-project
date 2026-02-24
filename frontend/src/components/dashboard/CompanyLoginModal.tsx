import React, { useState } from 'react';
import { X, Lock } from 'lucide-react';

interface CompanyLoginModalProps {
    companyName: string;
    onLogin: (username: string, password: string) => Promise<void>;
    onClose: () => void;
    isLoading: boolean;
    error: string | null;
}

const CompanyLoginModal: React.FC<CompanyLoginModalProps> = ({
    companyName,
    onLogin,
    onClose,
    isLoading,
    error,
}) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(username, password);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform animate-in zoom-in-95 duration-200">
                <div className="relative h-24 bg-gradient-to-r from-indigo-600 to-purple-700 flex items-center justify-center">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>
                    <div className="bg-white/20 p-3 rounded-full backdrop-blur-md">
                        <Lock className="text-white w-8 h-8" />
                    </div>
                </div>

                <div className="p-8">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-bold text-gray-800">Company Access</h3>
                        <p className="text-gray-500 mt-1">
                            Enter credentials for <span className="font-semibold text-indigo-600">{companyName}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                placeholder="Enter username"
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                                placeholder="Enter password"
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm border border-red-100 animate-in shake duration-300">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 px-4 rounded-xl text-white font-semibold shadow-lg shadow-indigo-200 transition-all ${isLoading
                                    ? 'bg-indigo-400 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
                                }`}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Verifying...
                                </div>
                            ) : (
                                'Unlock & Access'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CompanyLoginModal;
