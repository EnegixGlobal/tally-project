import React, { useEffect, useState } from 'react';
import { createOrder } from '../../services/payments';
import { CheckCircle2, Tag, Zap, Star, Layout, ShieldCheck, ArrowRight, Sparkles, Gift } from 'lucide-react';

type Plan = {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  description?: string;
  popular?: boolean;
};

type Coupon = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableDuration: string;
  expiryDate: string | null;
};

const API_BASE = import.meta.env.VITE_API_URL || '';

const Pricing: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Per-plan coupon states
  const [appliedCoupons, setAppliedCoupons] = useState<Record<string, Coupon | null>>({});
  const [couponInputs, setCouponInputs] = useState<Record<string, string>>({});
  const [couponErrors, setCouponErrors] = useState<Record<string, string | null>>({});

  const handleApplyCoupon = (planId: string, code: string) => {
    const found = coupons.find(c => c.code.toLowerCase() === code.toLowerCase());
    if (found) {
      setAppliedCoupons(prev => ({ ...prev, [planId]: found }));
      setCouponErrors(prev => ({ ...prev, [planId]: null }));
    } else {
      setCouponErrors(prev => ({ ...prev, [planId]: 'Invalid code' }));
    }
  };

  const handleClearCoupon = (planId: string) => {
    setAppliedCoupons(prev => ({ ...prev, [planId]: null }));
    setCouponInputs(prev => ({ ...prev, [planId]: '' }));
    setCouponErrors(prev => ({ ...prev, [planId]: null }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, couponsRes] = await Promise.all([
          fetch(`${API_BASE}/api/subscriptions`),
          fetch(`${API_BASE}/api/coupons`),
        ]);

        const plansJson = await plansRes.json();
        const couponsJson = await couponsRes.json();

        if (plansJson.success) {
          setPlans(plansJson.data || []);
        }
        if (couponsJson.success) {
          setCoupons(couponsJson.data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load pricing information');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleBuy = async (plan: Plan) => {
    try {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      const companyId = localStorage.getItem('company_id');

      let phone = user?.phone || user?.phone_number || '';
      if (!phone) {
        const storedComp = localStorage.getItem('companyInfo');
        if (storedComp) {
          try {
            const parsed = JSON.parse(storedComp);
            phone = parsed?.phone_number || parsed?.phone || '';
          } catch (e) { }
        }
      }

      const selectedCoupon = appliedCoupons[plan.id];
      const discountAmount = selectedCoupon ? (
        selectedCoupon.discountType === 'percentage'
          ? (plan.price * selectedCoupon.discountValue) / 100
          : selectedCoupon.discountValue
      ) : 0;
      const finalAmount = Math.max(plan.price - discountAmount, 0);

      const payload = {
        orderId: `plan_${plan.id}_${Date.now()}`,
        amount: plan.price,
        currency: 'INR',
        user: { id: user?.id, name: `${user?.firstName || ''} ${user?.lastName || ''}`.trim(), email: user?.email, phone },
        productinfo: `Subscription: ${plan.name}${selectedCoupon ? ` (Coupon: ${selectedCoupon.code})` : ''}`,
        planId: plan.id,
        companyId: companyId || undefined,
        couponId: selectedCoupon?.id,
        discountAmount,
        finalAmount,
      };

      const resp = await createOrder(payload);
      if (!resp || !resp.order || !resp.key) {
        alert('Could not initiate payment.');
        return;
      }

      // Load Razorpay script if not already loaded
      const loadRazorpay = () => new Promise<void>((resolve, reject) => {
        if ((window as any).Razorpay) return resolve();
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Razorpay SDK failed to load'));
        document.body.appendChild(script);
      });

      try {
        await loadRazorpay();
      } catch (e) {
        console.error(e);
        alert('Payment SDK load failed.');
        return;
      }

      const options = {
        key: resp.key,
        amount: resp.order.amount,
        currency: resp.order.currency,
        name: 'Tally',
        description: payload.productinfo || 'Tally Payment',
        order_id: resp.order.id,
        prefill: {
          name: payload.user?.name || '',
          email: payload.user?.email || '',
          contact: payload.user?.phone || '',
        },
        handler: async function (response: any) {
          try {
            // Send payment details to backend for verification
            await import('../../services/payments').then(async (mod) => {
              await mod.confirmPayment({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              });
            });

            // Redirect to frontend success page
            window.location.href = `/app/payments/success?paymentId=${encodeURIComponent(response.razorpay_payment_id)}&orderId=${encodeURIComponent(response.razorpay_order_id)}`;
          } catch (err) {
            console.error('Payment confirmation failed', err);
            // window.location.href = `/app/payments/failure`;
          }
        },
        modal: {
          ondismiss: function () {
            // User closed the modal
          }
        }
      } as any;

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert('Payment error');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-gray-600 font-medium animate-pulse">Setting up your experience...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8 bg-white rounded-2xl shadow-xl text-center border border-red-100">
        <div className="text-red-500 mb-4 inline-block bg-red-50 p-4 rounded-full">
          <ShieldCheck size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-all">Try Again</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-white to-purple-50 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-10 pointer-events-none">
            <Sparkles size={120} className="text-indigo-600" />
          </div>
          <span className="inline-block px-4 py-1.5 mb-4 text-xs font-bold tracking-wider text-indigo-700 uppercase bg-indigo-100 rounded-full">
            Pricing Plans
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Scale Your Business?</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Choose the perfect plan for your accounting journey. Simple, transparent pricing for every stage of your growth.
          </p>
        </div>

        {/* Exclusive Offers Section */}
        {coupons.length > 0 && (
          <div className="mb-20">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl text-white shadow-xl shadow-indigo-100">
                  <Gift size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-gray-900 tracking-tight">VIP Offers Limited</h3>
                  <p className="text-sm text-gray-500 font-medium tracking-wide uppercase">Unlock premium features with these exclusive codes</p>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-2 px-5 py-2 bg-white rounded-full border border-indigo-100 shadow-sm animate-bounce">
                <Sparkles size={16} className="text-indigo-500" />
                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest whitespace-nowrap">Special Rewards Active</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {coupons.map((c) => (
                <div 
                  key={c.id} 
                  className="group relative bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/50 shadow-[0_20px_50px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.15)] hover:-translate-y-2 transition-all duration-500 overflow-hidden"
                >
                  {/* Glowing background effect */}
                  <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="relative">
                        <div className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-mono font-black text-lg shadow-lg group-hover:scale-110 transition-transform">
                          {c.code}
                        </div>
                        <div className="absolute -top-2 -right-2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white animate-ping"></div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-black text-gray-900 leading-none">
                          {c.discountType === 'percentage' ? `${c.discountValue}%` : `₹${c.discountValue}`}
                        </div>
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em]">Off</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                         <Zap size={12} className="text-yellow-400" /> Applicable for all plans
                      </div>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                        Valid for {c.applicableDuration} on first purchase.
                        {c.expiryDate && ` Time left: ${new Date(c.expiryDate).toLocaleDateString()}`}
                      </p>
                      
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(c.code);
                          import('sweetalert2').then((Swal) => {
                            Swal.default.fire({
                              toast: true,
                              position: 'top-end',
                              icon: 'success',
                              title: 'Code copied!',
                              showConfirmButton: false,
                              timer: 1500,
                              timerProgressBar: true,
                              background: '#4f46e5',
                              color: '#fff',
                              iconColor: '#fff'
                            });
                          });
                        }}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                         Tap to Copy Code
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pricing Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-${Math.min(plans.length, 3)} gap-8 justify-center`}>
          {plans.map((plan) => {
            const selectedCoupon = appliedCoupons[plan.id];
            const currentInput = couponInputs[plan.id] || '';
            const currentError = couponErrors[plan.id];

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col p-8 rounded-[2rem] border-2 transition-all duration-500 group ${plan.popular
                    ? 'border-indigo-600 bg-white shadow-2xl scale-105 z-10'
                    : 'border-white bg-white/70 backdrop-blur-md shadow-xl hover:scale-105'
                  }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-1.5 rounded-full text-sm font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                    <Star size={14} fill="white" /> Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{plan.name}</h4>
                  <p className="text-gray-500 mt-2 text-sm leading-relaxed">{plan.description}</p>
                </div>

                {/* In-Card Coupon Input - Local to this Plan */}
                <div className="mb-6 relative">
                  <div className={`flex items-center gap-2 p-1.5 border-2 rounded-xl transition-all duration-300 ${currentError ? 'border-red-300 bg-red-50' : 'border-indigo-50 bg-gray-50 focus-within:border-indigo-500 focus-within:bg-white'}`}>
                    <Tag size={16} className="text-indigo-400 ml-2" />
                    <input
                      type="text"
                      placeholder="Coupon code"
                      value={currentInput}
                      onChange={(e) => {
                        setCouponInputs(prev => ({ ...prev, [plan.id]: e.target.value }));
                        if (currentError) setCouponErrors(prev => ({ ...prev, [plan.id]: null }));
                      }}
                      className="flex-grow bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider placeholder:text-gray-400"
                      onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon(plan.id, currentInput)}
                    />
                    {selectedCoupon ? (
                      <button onClick={() => handleClearCoupon(plan.id)} className="px-2 py-1 text-[10px] font-black text-red-500 uppercase">Clear</button>
                    ) : (
                      <button onClick={() => handleApplyCoupon(plan.id, currentInput)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Apply</button>
                    )}
                  </div>
                  {currentError && <p className="absolute -bottom-4 left-1 text-[9px] font-bold text-red-500 uppercase">{currentError}</p>}
                  {selectedCoupon && <p className="absolute -bottom-4 left-1 text-[9px] font-bold text-green-600 uppercase flex items-center gap-1"><CheckCircle2 size={10} /> Applied!</p>}
                </div>

                <div className="mb-8 p-6 rounded-2xl bg-gray-50/50 border border-gray-100/50">
                  <div className="flex items-baseline gap-1">
                    {selectedCoupon ? (
                      <div className="flex flex-col">
                        <span className="text-base text-gray-400 line-through font-medium">₹{Number(plan.price).toLocaleString('en-IN')}</span>
                        <span className="text-4xl font-black text-gray-900">
                          ₹{Number(Math.max(plan.price - (selectedCoupon.discountType === 'percentage' ? (plan.price * selectedCoupon.discountValue) / 100 : selectedCoupon.discountValue), 0)).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-4xl font-black text-gray-900 tracking-tight">₹{Number(plan.price).toLocaleString('en-IN')}</span>
                    )}
                    <span className="text-gray-500 font-medium ml-1">/{plan.duration}</span>
                  </div>
                </div>

                <div className="flex-grow">
                  <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6 flex items-center gap-2">
                    <Layout size={14} /> Features Included
                  </div>
                  <ul className="space-y-4 mb-10">
                    {Array.isArray(plan.features) && plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 group/feature transition-all">
                        <div className={`mt-0.5 rounded-full p-0.5 ${plan.popular ? 'bg-indigo-100' : 'bg-gray-100'} group-hover/feature:bg-green-100 transition-colors`}>
                          <CheckCircle2 size={16} className={` transition-colors ${plan.popular ? 'text-indigo-600' : 'text-gray-400'} group-hover/feature:text-green-600`} />
                        </div>
                        <span className="text-gray-700 text-sm font-medium leading-tight group-hover/feature:text-gray-900">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleBuy(plan)}
                  className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 group/btn transition-all duration-300 shadow-lg active:scale-[0.98] ${plan.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-200 hover:shadow-2xl'
                      : 'bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200'
                    }`}
                >
                  Get Started
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>

                <div className="mt-4 text-center">
                  <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-tighter text-gray-400 font-bold">
                    <ShieldCheck size={10} /> Secure SSL Payment
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info/Trust indicators */}
        <div className="mt-24 text-center border-t border-gray-100 pt-16">
          <p className="text-gray-400 text-sm font-medium mb-8">Trusted by accounting teams nationwide</p>
          <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
            {/* Dynamic trust signals placeholder icons or logos */}
            <div className="flex items-center gap-2 font-black text-xl text-gray-600 italic"><Zap fill="currentColor" size={20} className="text-indigo-600" /> EXPRESS</div>
            <div className="flex items-center gap-2 font-black text-xl text-gray-600"><ShieldCheck fill="currentColor" size={20} className="text-indigo-600" /> SECURE-PAY</div>
            <div className="flex items-center gap-2 font-black text-xl text-gray-600"><Star fill="currentColor" size={20} className="text-indigo-600" /> ELITE-TIER</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
