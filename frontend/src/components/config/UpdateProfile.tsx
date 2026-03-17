import React, { useState, useEffect } from "react";
import { useAppContext } from "../../context/AppContext";
import { useAuth } from "../../home/context/AuthContext";
import Swal from "sweetalert2";
import {
    User,
    Mail,
    Phone,
    CreditCard,
    Save,
    Loader2,
    Calendar,
    ShieldCheck,
    UserCheck,
    ArrowLeft,
    BadgeCheck,
    Cpu,
    ExternalLink,
    Lock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProfileData {
    id: string | number;
    firstName: string;
    lastName?: string;
    email: string;
    phoneNumber: string;
    pan: string;
    address?: string;
    userLimit?: number;
    created_at?: string;
}

const UpdateProfile: React.FC = () => {
    const { theme } = useAppContext();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        id: "",
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        pan: "",
        address: "",
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/my-profile`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                setProfile(data.profile);
            } else {
                throw new Error(data.message || "Failed to fetch profile");
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: "Could not load profile information",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/profile/update-profile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phoneNumber: profile.phoneNumber,
                    address: profile.address,
                }),
            });

            const data = await res.json();
            if (data.success) {
                Swal.fire({
                    icon: "success",
                    title: "Updated!",
                    text: "Profile saved successfully.",
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true,
                });

                const savedUser = JSON.parse(localStorage.getItem("user") || "{}");
                localStorage.setItem("user", JSON.stringify({
                    ...savedUser,
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    phoneNumber: profile.phoneNumber,
                    address: profile.address,
                }));
            } else {
                throw new Error(data.message || "Update failed");
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            Swal.fire({
                icon: "error",
                title: "Update Failed",
                text: "Something went wrong while saving.",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProfile((prev) => ({ ...prev, [name]: value }));
    };

    if (loading) {
        return (
            <div className={`flex flex-col items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-gray-950' : 'bg-gray-50'}`}>
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <User className="text-blue-500" size={24} />
                    </div>
                </div>
                <p className={`mt-4 font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Synchronizing profile...</p>
            </div>
        );
    }

    const userType = localStorage.getItem("userType")?.replace('_', ' ').toUpperCase() || "USER";

    return (
        <div className={`min-h-screen pt-20 px-4 pb-20 ${theme === 'dark' ? 'bg-[#0a0c10]' : 'bg-[#f8fafc]'} relative overflow-hidden transition-colors duration-500`}>
            {/* Ambient Background Glows */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                    <div>
                        <button
                            onClick={() => navigate(-1)}
                            className={`flex items-center gap-2 text-sm font-semibold mb-3 ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors group`}
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Settings
                        </button>
                        <h1 className={`text-4xl font-extrabold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"} flex items-center gap-4`}>
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                                My Profile
                            </span>
                        </h1>
                        <p className={`mt-2 text-lg font-medium ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                            Configure your personal credentials and account settings.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex flex-col items-end px-4 py-2 rounded-2xl border ${theme === 'dark' ? 'bg-gray-800/40 border-gray-700/50' : 'bg-white border-slate-200'} shadow-sm`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Account Status</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className={`text-sm font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>Active Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* ID Card Style Profile Summary */}
                    <div className="lg:col-span-4 transition-all duration-500 hover:translate-y-[-4px]">
                        <div className={`relative overflow-hidden group ${theme === "dark" ? "bg-gray-900/40 border-gray-800" : "bg-white border-slate-100"} backdrop-blur-2xl rounded-[2.5rem] p-1 border shadow-2xl`}>
                            <div className={`p-8 rounded-[2.25rem] ${theme === 'dark' ? 'bg-gradient-to-b from-gray-800/50 to-transparent' : 'bg-gradient-to-b from-slate-50 to-transparent'}`}>

                                <div className="relative mb-8 group/avatar flex justify-center">
                                    <div className="absolute inset-0 bg-blue-500 blur-2xl opacity-20 scale-110 group-hover/avatar:opacity-30 transition-opacity"></div>
                                    <div className="relative w-32 h-32 rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-1 shadow-2xl rotate-3 group-hover/avatar:rotate-6 transition-all duration-500">
                                        <div className={`w-full h-full rounded-[1.85rem] ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center text-5xl font-black overflow-hidden`}>
                                            <span className="bg-clip-text text-transparent bg-gradient-to-br from-blue-500 to-indigo-600">
                                                {profile.firstName?.charAt(0)}
                                            </span>
                                        </div>
                                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg border-2 border-white dark:border-gray-900">
                                            <BadgeCheck size={18} />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center mb-8">
                                    <h2 className={`text-2xl font-black tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                                        {profile.firstName} {profile.lastName}
                                    </h2>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-50 text-blue-600 border border-blue-100"}`}>
                                            {userType}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className={`group/item flex items-center gap-4 p-4 rounded-3xl transition-all ${theme === "dark" ? "hover:bg-gray-800/60" : "hover:bg-slate-50"}`}>
                                        <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-gray-800 text-blue-400" : "bg-blue-50 text-blue-600"} shadow-sm transition-transform group-hover/item:scale-110`}>
                                            <Mail size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Official Email</p>
                                            <p className={`text-sm font-bold truncate ${theme === "dark" ? "text-gray-200" : "text-slate-700"}`}>{profile.email}</p>
                                        </div>
                                    </div>

                                    <div className={`group/item flex items-center gap-4 p-4 rounded-3xl transition-all ${theme === "dark" ? "hover:bg-gray-800/60" : "hover:bg-slate-50"}`}>
                                        <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-gray-800 text-indigo-400" : "bg-indigo-50 text-indigo-600"} shadow-sm transition-transform group-hover/item:scale-110`}>
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Company ID</p>
                                            <p className={`text-sm font-bold truncate ${theme === "dark" ? "text-gray-200" : "text-slate-700"}`}>{profile.id}</p>
                                        </div>
                                    </div>

                                    {profile.address && (
                                        <div className={`group/item flex items-center gap-4 p-4 rounded-3xl transition-all ${theme === "dark" ? "hover:bg-gray-800/60" : "hover:bg-slate-50"}`}>
                                            <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-gray-800 text-blue-400" : "bg-blue-50 text-blue-600"} shadow-sm transition-transform group-hover/item:scale-110`}>
                                                <ExternalLink size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Current Address</p>
                                                <p className={`text-sm font-bold break-words ${theme === "dark" ? "text-gray-200" : "text-slate-700"}`}>{profile.address}</p>
                                            </div>
                                        </div>
                                    )}

                                    {profile.created_at && (
                                        <div className={`group/item flex items-center gap-4 p-4 rounded-3xl transition-all ${theme === "dark" ? "hover:bg-gray-800/60" : "hover:bg-slate-50"}`}>
                                            <div className={`p-3 rounded-2xl ${theme === "dark" ? "bg-gray-800 text-amber-400" : "bg-amber-50 text-amber-600"} shadow-sm transition-transform group-hover/item:scale-110`}>
                                                <Calendar size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-[10px] font-black uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Member Since</p>
                                                <p className={`text-sm font-bold truncate ${theme === "dark" ? "text-gray-200" : "text-slate-700"}`}>
                                                    {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className={`mt-8 pt-8 border-t ${theme === 'dark' ? 'border-gray-800' : 'border-slate-100'} flex justify-center gap-4`}>
                                    <div className="text-center">
                                        <p className={`text-sm font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{profile.userLimit || 1}</p>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Limit</p>
                                    </div>
                                    <div className={`w-[1px] ${theme === 'dark' ? 'bg-gray-800' : 'bg-slate-100'}`}></div>
                                    <div className="text-center">
                                        <p className={`text-sm font-black ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>Premium</p>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Tier</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="lg:col-span-8">
                        <div className={`group ${theme === "dark" ? "bg-gray-900/40 border-gray-800" : "bg-white border-slate-200"} backdrop-blur-2xl rounded-[2.5rem] border shadow-2xl overflow-hidden`}>
                            <div className={`px-8 py-6 border-b flex items-center justify-between ${theme === 'dark' ? 'border-gray-800 bg-gray-800/30' : 'border-slate-100 bg-slate-50/50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl text-white shadow-lg">
                                        <Cpu size={20} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Personal Information</h3>
                                        <p className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>Details shown reflect your primary identity.</p>
                                    </div>
                                </div>
                                <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-slate-200 bg-white'}`}>
                                    <ShieldCheck size={14} className="text-emerald-500" />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-300' : 'text-slate-600'}`}>Encrypted Form</span>
                                </div>
                            </div>

                            <form onSubmit={handleUpdate} className="p-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                                    <div className="space-y-2">
                                        <label className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                                            First Name <span className="text-blue-500">*</span>
                                        </label>
                                        <div className="relative group/field">
                                            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-600 group-focus-within/field:text-blue-500' : 'text-slate-300 group-focus-within/field:text-blue-500'}`}>
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="firstName"
                                                value={profile.firstName}
                                                onChange={handleChange}
                                                className={`block w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all duration-300 font-bold ${theme === "dark"
                                                    ? "bg-gray-800/40 border-gray-700/50 text-white focus:border-blue-500/50 focus:bg-gray-800"
                                                    : "bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500/30 focus:bg-white"
                                                    }`}
                                                placeholder="Enter first name"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                                            Last Name
                                        </label>
                                        <div className="relative group/field">
                                            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-600 group-focus-within/field:text-blue-500' : 'text-slate-300 group-focus-within/field:text-blue-500'}`}>
                                                <User size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="lastName"
                                                value={profile.lastName}
                                                onChange={handleChange}
                                                className={`block w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all duration-300 font-bold ${theme === "dark"
                                                    ? "bg-gray-800/40 border-gray-700/50 text-white focus:border-blue-500/50 focus:bg-gray-800"
                                                    : "bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500/30 focus:bg-white"
                                                    }`}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                                            Official Phone <span className="text-green-500">*</span>
                                        </label>
                                        <div className="relative group/field">
                                            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${theme === 'dark' ? 'text-gray-600 group-focus-within/field:text-green-500' : 'text-slate-300 group-focus-within/field:text-green-500'}`}>
                                                <Phone size={18} />
                                            </div>
                                            <input
                                                type="tel"
                                                name="phoneNumber"
                                                value={profile.phoneNumber}
                                                onChange={handleChange}
                                                className={`block w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all duration-300 font-bold ${theme === "dark"
                                                    ? "bg-gray-800/40 border-gray-700/50 text-white focus:border-blue-500/50 focus:bg-gray-800"
                                                    : "bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500/30 focus:bg-white"
                                                    }`}
                                                placeholder="Enter phone number"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                                                Permanent PAN
                                            </label>
                                            <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase tracking-tighter">
                                                <Lock size={10} /> Locked
                                            </div>
                                        </div>
                                        <div className="relative group/field cursor-not-allowed">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                                                <CreditCard size={18} />
                                            </div>
                                            <input
                                                type="text"
                                                name="pan"
                                                value={profile.pan}
                                                disabled
                                                className={`block w-full pl-12 pr-4 py-4 rounded-2xl border-2 outline-none transition-all duration-300 font-bold cursor-not-allowed ${theme === "dark"
                                                    ? "bg-gray-950/60 border-gray-800/50 text-gray-600"
                                                    : "bg-slate-100 border-slate-200 text-slate-400"
                                                    }`}
                                                placeholder="PAN locked"
                                            />
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-widest ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                                            Permanent Address
                                        </label>
                                        <div className="relative group/field">
                                            <textarea
                                                name="address"
                                                value={profile.address}
                                                onChange={(e: any) => handleChange(e)}
                                                className={`block w-full px-4 py-4 rounded-2xl border-2 outline-none transition-all duration-300 font-bold min-h-[100px] ${theme === "dark"
                                                    ? "bg-gray-800/40 border-gray-700/50 text-white focus:border-blue-500/50 focus:bg-gray-800"
                                                    : "bg-slate-50 border-slate-100 text-slate-900 focus:border-blue-500/30 focus:bg-white"
                                                    }`}
                                                placeholder="Enter full address"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className={`mt-12 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-6 ${theme === 'dark' ? 'border-gray-800' : 'border-slate-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-amber-500/10 text-amber-500' : 'bg-amber-50 text-amber-600'}`}>
                                            <UserCheck size={18} />
                                        </div>
                                        <p className={`text-xs font-semibold leading-relaxed max-w-[280px] ${theme === 'dark' ? 'text-gray-500' : 'text-slate-500'}`}>
                                            Keep your contact details up to date to ensure seamless authentication and communication.
                                        </p>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="group relative flex items-center justify-center gap-3 px-10 py-4 w-full sm:w-auto overflow-hidden bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white font-black uppercase tracking-widest text-[11px] rounded-[1.25rem] shadow-2xl shadow-blue-500/40 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
                                    >
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                        {saving ? (
                                            <Loader2 className="animate-spin" size={18} />
                                        ) : (
                                            <Save size={18} className="relative z-10" />
                                        )}
                                        <span className="relative z-10">{saving ? "Saving Changes..." : "Commit Changes"}</span>
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Footer Tips */}
                        <div className="mt-8 flex flex-wrap justify-center gap-8">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-500" />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>SSL Secured</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <UserCheck size={16} className="text-blue-500" />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Identity Verified</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ExternalLink size={16} className="text-purple-500" />
                                <span className={`text-[10px] font-bold uppercase tracking-widest ${theme === 'dark' ? 'text-gray-500' : 'text-slate-400'}`}>Global Sync</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateProfile;
