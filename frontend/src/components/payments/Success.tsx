import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Home, Printer, ShieldCheck, Star } from 'lucide-react';
import { useCompany } from '../../context/CompanyContext';
import { useAuth } from '../../home/context/AuthContext';
import SubscriptionInvoice from './SubscriptionInvoice';

const API_BASE = import.meta.env.VITE_API_URL || '';

const Success: React.FC = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const { companyInfo } = useCompany();
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const queryTxnid = search.get('txnid');
  const queryOrderId = search.get('orderId') || search.get('order_id') || 'N/A';
  const queryPaymentId = search.get('paymentId') || search.get('payment_id');
  const queryAmount = search.get('amount') || search.get('amount');
  const queryProduct = search.get('productinfo') || 'Subscription Plan';

  useEffect(() => {
    (async () => {
      try {
        const orderId = queryOrderId;
        if (!orderId || orderId === 'N/A') {
          setData({ 
            txnid: queryTxnid || queryPaymentId || 'N/A', 
            orderId: orderId || 'N/A', 
            amount: queryAmount || '0', 
            planName: queryProduct, 
            date: new Date().toISOString(),
            plan_duration: 'N/A' 
          });
          setLoading(false);
          return;
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/api/payments/status/${encodeURIComponent(orderId)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!res.ok) {
          setData({ txnid: queryTxnid || queryPaymentId || 'N/A', orderId, amount: queryAmount || '0', planName: queryProduct, date: new Date().toISOString() });
          setLoading(false);
          return;
        }

        const json = await res.json();
        const txnid = json.razorpay_payment_id || json.payu_txn_id || queryTxnid || queryPaymentId || 'N/A';
        const amount = json.final_amount || json.amount || queryAmount || 0;
        const planName = json.plan || json.productinfo || queryProduct || 'Subscription Plan';
        const date = json.updated_at || json.created_at || new Date().toISOString();
        const plan_duration = json.plan_duration || 'One-time';

        setData({ txnid, orderId: json.order_id || orderId, amount, planName, date, plan_duration });
      } catch (e) {
        setData({ 
          txnid: queryTxnid || queryPaymentId || 'N/A', 
          orderId: queryOrderId || 'N/A', 
          amount: queryAmount || '0', 
          planName: queryProduct, 
          date: new Date().toISOString(),
          plan_duration: 'N/A' 
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-100 border-t-indigo-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-indigo-600 rounded-full animate-bounce"></div>
          </div>
        </div>
        <p className="text-indigo-900 font-bold tracking-tight animate-pulse uppercase text-xs">Generating Your Bill...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-indigo-50 py-12 px-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">

        {/* Simple Success Confirmation */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-indigo-100/20 border border-indigo-50 p-8 text-center relative overflow-hidden no-print">
          <div className="absolute top-0 right-0 p-4">
            <div className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={14} />
              Verified Payment
            </div>
          </div>

          <div className="relative mb-6 inline-block">
            <div className="absolute inset-0 bg-green-100 rounded-full scale-110 animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-green-500 to-emerald-600 p-5 rounded-full shadow-lg shadow-green-200">
              <CheckCircle2 size={32} className="text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">
            Subscription <span className="text-green-600">Activated!</span>
          </h1>
          <p className="text-sm text-gray-500 font-medium mb-8">
            Thank you! Your payment of <span className="font-bold text-gray-900">₹{Number(data?.amount).toLocaleString('en-IN')}</span> has been processed successfully.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => navigate('/app')}
              className="w-full sm:w-auto group flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
            >
              <Home size={18} />
              Go to Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Professional Invoice Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 no-print">
            <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Official Tax Invoice</h2>
          </div>

          <SubscriptionInvoice
            data={{
              ...data,
              amount: data?.final_amount || data?.amount || '0',
              originalAmount: data?.amount || '0', // In our DB 'amount' is usually the base price and 'final_amount' is after discount
              discountAmount: data?.discount_amount || '0',
              duration: data?.plan_duration || 'One-time'
            }}
            buyerInfo={{
              name: user ? `${user.firstName} ${user.lastName}` : (companyInfo?.name || 'Customer Name'),
              address: user?.address || companyInfo?.address || 'Customer Address',
              gstNumber: !user ? companyInfo?.gstNumber : undefined,
              panNumber: user?.pan || companyInfo?.panNumber,
              tanNumber: !user ? companyInfo?.tanNumber : undefined,
              cinNumber: !user ? companyInfo?.cinNumber : undefined,
              phoneNumber: user?.phoneNumber || companyInfo?.phoneNumber,
              state: companyInfo?.state, // still use state from company context if possible
              pin: companyInfo?.pin,
              email: user?.email || companyInfo?.email
            }}
          />
        </div>

        <div className="text-center no-print">
          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">
            A confirmation email has been sent to your registered address.
            <br />
            <a href="/contact" className="text-indigo-600 hover:underline">Need help? Contact Billing Support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Success;
