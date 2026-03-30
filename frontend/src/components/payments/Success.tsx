import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Home, Printer, ShieldCheck, Star } from 'lucide-react';

const Success: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const txnid = search.get('txnid') || 'N/A';
  const orderId = search.get('orderId') || 'N/A';
  const amount = search.get('amount') || '0';
  const planName = search.get('productinfo') || 'Subscription Plan';
  const date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-50 via-white to-indigo-50 py-20 px-6 flex items-center justify-center">
      <div className="max-w-xl w-full">
        {/* Main Success Card */}
        <div className="bg-white rounded-[2.5rem] shadow-[0_20px_70px_rgba(0,0,0,0.08)] border border-white p-10 text-center relative overflow-hidden">
          {/* Decorative Background Glow */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>

          {/* Success Icon */}
          <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 bg-green-100 rounded-full scale-110 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-full shadow-lg shadow-green-200">
              <CheckCircle2 size={48} className="text-white" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
            Subscription <span className="text-green-600">Activated!</span>
          </h1>
          <p className="text-lg text-gray-600 mb-10 font-medium">
            Thank you! Your payment has been processed successfully and your account has been upgraded.
          </p>

          {/* Receipt Style Details */}
          <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-10 text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1 bg-white rounded-md border border-gray-100 shadow-sm">
                <Star size={14} className="text-yellow-500" fill="currentColor" />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Transaction Summary</span>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400">Plan Name</span>
                <span className="text-sm font-black text-gray-700">{planName}</span>
              </div>
              <div className="flex justify-between items-center group">
                <span className="text-sm font-bold text-gray-400">Order ID</span>
                <span className="text-sm font-mono font-black text-gray-700 bg-white px-3 py-1 rounded-lg border border-gray-100">{orderId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-400">Transaction ID</span>
                <span className="text-xs font-mono font-black text-gray-500 break-all ml-4 text-right">{txnid}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-400">Date & Time</span>
                <span className="text-sm font-medium text-gray-600">{date}</span>
              </div>
              <div className="h-px bg-dashed border-t border-dashed border-gray-200 my-2"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-gray-900 uppercase">Amount Paid</span>
                <span className="text-xl font-black text-green-600">₹{Number(amount).toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
              onClick={() => navigate('/app')}
              className="group flex items-center justify-center gap-2 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:shadow-indigo-200 transition-all active:scale-95"
            >
              <Home size={18} />
              Go to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              className="flex items-center justify-center gap-2 py-4 bg-white text-gray-700 rounded-2xl font-bold text-sm border-2 border-gray-100 hover:border-indigo-100 hover:bg-gray-50 transition-all active:scale-95"
              onClick={() => window.print()}
            >
              <Printer size={18} />
              Print Receipt
            </button>
          </div>

          {/* Trust Footer */}
          <div className="mt-10 pt-8 border-t border-gray-50 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <ShieldCheck size={14} className="text-green-500" />
              Secure Payment
            </div>
            <div className="w-1 h-1 bg-gray-200 rounded-full"></div>
            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Star size={14} className="text-yellow-500" fill="currentColor" />
              Premium Service
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-gray-400 text-xs font-medium">
          A confirmation email has been sent to your registered email address.
          <br />Need help? <a href="/contact" className="text-indigo-600 font-bold hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
};

export default Success;
