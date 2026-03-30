import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { XCircle, AlertCircle, RefreshCcw, Home, MessageCircle, ShieldX, HelpCircle } from 'lucide-react';

const Failure: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const txnid = search.get('txnid') || 'TXN_ERROR_789';
  const error = search.get('error') || 'The transaction was declined by the bank or the payment provider.';

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-red-50 via-white to-orange-50 py-20 px-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Main Failure Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_70px_rgba(0,0,0,0.08)] border border-white p-10 text-center relative overflow-hidden">
          {/* Decorative Background Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-red-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>

          {/* Failure Icon */}
          <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 bg-red-100 rounded-full scale-110 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-red-500 to-rose-600 p-6 rounded-full shadow-lg shadow-red-200">
              <XCircle size={48} className="text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
            Payment <span className="text-red-600">Failed</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 font-medium">
            We couldn't process your payment. Don't worry, no funds were deducted from your account.
          </p>

          {/* Error Details Section */}
          <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100/50 mb-10 text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1 bg-white rounded-md border border-red-100 shadow-sm">
                <AlertCircle size={14} className="text-red-500" />
              </div>
              <span className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none">Issue Details</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-gray-400 uppercase">Reason</span>
                <p className="text-sm font-bold text-gray-700 leading-relaxed">{error}</p>
              </div>
              <div className="h-px bg-red-100/50 my-2"></div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400">Transaction Ref</span>
                <span className="text-sm font-mono font-black text-gray-500">{txnid}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/app/pricing')}
              className="group flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95"
            >
              <RefreshCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </button>
            <button 
              onClick={() => navigate('/app')}
              className="flex items-center justify-center gap-2 py-4 bg-white text-gray-700 rounded-2xl font-bold text-sm border-2 border-gray-100 hover:border-indigo-100 hover:bg-gray-50 transition-all active:scale-95"
            >
              <Home size={18} />
              Go to Dashboard
            </button>
          </div>

          {/* Support Footer */}
          <div className="mt-10 pt-8 border-t border-gray-50 flex flex-wrap items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <ShieldX size={14} className="text-red-400" />
              Payment Guard
            </div>
            <div className="hidden sm:block w-1 h-1 bg-gray-200 rounded-full"></div>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors">
              <HelpCircle size={14} className="text-indigo-400" />
              Need Help?
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex items-center justify-center gap-4 text-gray-400 text-xs font-medium">
          <div className="flex items-center gap-1">
            <MessageCircle size={14} />
            <a href="/contact" className="text-indigo-600 font-bold hover:underline">Chat with Support</a>
          </div>
          <span>|</span>
          <p>Available 24/7</p>
        </div>
      </div>
    </div>
  );
};

export default Failure;
