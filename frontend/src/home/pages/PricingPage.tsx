import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Tag, X, Loader2, Copy, Check, Sparkles } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

interface Plan {
  id: string;
  name: string;
  price: number;
  duration: string;
  features: string[];
  isActive: boolean;
  popular?: boolean;
  description?: string;
}

interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  applicableDuration: 'monthly' | 'yearly' | 'all';
  expiryDate: string | null;
  maxUses: number;
  isActive: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL;

// ── Available Offers Banner ─────────────────────────────────────────────────
const OffersBar: React.FC<{ coupons: Coupon[] }> = ({ coupons }) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (coupons.length === 0) return null;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-yellow-300" />
          <h3 className="text-white font-bold text-lg">Available Offers</h3>
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            {coupons.length} Active
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {coupons.map((coupon) => {
            const discountLabel =
              coupon.discountType === 'percentage'
                ? `${coupon.discountValue}% OFF`
                : `₹${coupon.discountValue.toLocaleString('en-IN')} OFF`;
            const applicableLabel =
              coupon.applicableDuration === 'all'
                ? 'All Plans'
                : coupon.applicableDuration === 'monthly'
                ? 'Monthly Plans'
                : 'Yearly Plans';
            const expiryLabel = coupon.expiryDate
              ? `Expires ${new Date(coupon.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : 'No Expiry';

            return (
              <div
                key={coupon.id}
                className="flex items-stretch bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl overflow-hidden hover:bg-white/15 transition-all"
              >
                {/* Left colored strip */}
                <div className="w-2 bg-yellow-400 flex-shrink-0" />

                <div className="px-4 py-3 flex items-center gap-4">
                  {/* Coupon code */}
                  <div>
                    <p className="text-yellow-300 text-xs font-semibold uppercase tracking-wide mb-0.5">{discountLabel}</p>
                    <span className="font-mono font-bold text-white text-lg tracking-widest">{coupon.code}</span>
                  </div>

                  {/* Details */}
                  <div className="hidden sm:block border-l border-white/20 pl-4">
                    <p className="text-white/80 text-xs">{applicableLabel}</p>
                    <p className="text-white/60 text-xs">{expiryLabel}</p>
                  </div>

                  {/* Copy button */}
                  <button
                    onClick={() => handleCopy(coupon.code)}
                    className="ml-2 flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
                  >
                    {copied === coupon.code ? (
                      <><Check className="h-3 w-3 text-green-300" /> Copied!</>
                    ) : (
                      <><Copy className="h-3 w-3" /> Copy</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Per-plan coupon input ──────────────────────────────────────────────────
const PlanCard: React.FC<{ plan: Plan; coupons: Coupon[] }> = ({ plan, coupons }) => {
  const [showCoupon, setShowCoupon] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponMsg, setCouponMsg] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);

  const discountedPrice = () => {
    if (!appliedCoupon) return null;
    if (appliedCoupon.discountType === 'percentage') {
      return Math.max(0, plan.price - (plan.price * appliedCoupon.discountValue) / 100);
    }
    return Math.max(0, plan.price - appliedCoupon.discountValue);
  };

  const handleApplyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const coupon = coupons.find(
      (c) => c.code === code && c.isActive
    );

    if (!coupon) {
      setAppliedCoupon(null);
      setCouponMsg('Invalid or expired coupon code.');
      setCouponSuccess(false);
      return;
    }

    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      setAppliedCoupon(null);
      setCouponMsg('This coupon has expired.');
      setCouponSuccess(false);
      return;
    }

    // Check applicable duration
    const compatible =
      coupon.applicableDuration === 'all' ||
      coupon.applicableDuration === plan.duration;

    if (!compatible) {
      setAppliedCoupon(null);
      setCouponMsg(`This coupon applies only to ${coupon.applicableDuration} plans.`);
      setCouponSuccess(false);
      return;
    }

    setAppliedCoupon(coupon);
    setCouponSuccess(true);
    const discount =
      coupon.discountType === 'percentage'
        ? `${coupon.discountValue}% off`
        : `₹${coupon.discountValue.toLocaleString('en-IN')} off`;
    setCouponMsg(`🎉 Coupon applied! You save ${discount}.`);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMsg('');
    setCouponSuccess(false);
  };

  const finalPrice = discountedPrice();
  const displayPrice = finalPrice !== null ? finalPrice : plan.price;
  const periodLabel = plan.duration ? `/${plan.duration}` : '/month';

  return (
    <div
      className={`bg-white rounded-xl shadow-lg p-8 relative flex flex-col transition-transform duration-300 ${
        plan.popular ? 'ring-2 ring-indigo-600 scale-105 shadow-indigo-100 shadow-xl' : ''
      }`}
    >
      {plan.popular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow">
          Most Popular
        </div>
      )}

      {/* Plan Name & Description */}
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
        {plan.description && (
          <p className="text-gray-500 mt-1 text-sm">{plan.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        {finalPrice !== null ? (
          <>
            <div>
              <span className="text-2xl font-semibold text-gray-400 line-through mr-2">
                ₹{plan.price.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-indigo-600">
                ₹{displayPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-gray-500">{periodLabel}</span>
            </div>
            {appliedCoupon && (
              <span className="inline-block mt-2 text-xs bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">
                {appliedCoupon.discountType === 'percentage'
                  ? `${appliedCoupon.discountValue}% OFF applied`
                  : `₹${appliedCoupon.discountValue.toLocaleString('en-IN')} OFF applied`}
              </span>
            )}
          </>
        ) : (
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-gray-900">
              ₹{plan.price.toLocaleString('en-IN')}
            </span>
            <span className="text-gray-500">{periodLabel}</span>
          </div>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-3 mb-6 flex-1">
        {plan.features.map((feature, i) => (
          <li key={i} className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-gray-700 text-sm">{feature}</span>
          </li>
        ))}
      </ul>

      {/* Coupon Section */}
      <div className="mb-5">
        {!showCoupon && !appliedCoupon && (
          <button
            onClick={() => setShowCoupon(true)}
            className="w-full flex items-center justify-center gap-2 text-indigo-600 hover:text-indigo-800 text-sm font-medium py-2 border border-dashed border-indigo-300 rounded-lg hover:border-indigo-500 transition-all"
          >
            <Tag className="h-4 w-4" />
            Have a discount coupon?
          </button>
        )}

        {(showCoupon || appliedCoupon) && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={couponInput}
                  placeholder="Enter coupon code"
                  className="w-full pl-9 pr-3 py-2 text-sm font-mono uppercase border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    if (appliedCoupon) handleRemoveCoupon();
                    else { setCouponMsg(''); setCouponSuccess(false); }
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  disabled={!!appliedCoupon}
                />
              </div>
              {appliedCoupon ? (
                <button
                  onClick={handleRemoveCoupon}
                  className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
                >
                  <X className="h-3 w-3" />
                  Remove
                </button>
              ) : (
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  Apply
                </button>
              )}
            </div>

            {couponMsg && (
              <p
                className={`text-xs font-medium px-1 ${
                  couponSuccess ? 'text-green-600' : 'text-red-500'
                }`}
              >
                {couponMsg}
              </p>
            )}

            {!appliedCoupon && (
              <button
                onClick={() => { setShowCoupon(false); setCouponMsg(''); setCouponInput(''); }}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Cancel
              </button>
            )}
          </div>
        )}
      </div>

      {/* CTA Button */}
      <Link
        to="/signup"
        onClick={() => localStorage.setItem('selectedPlan', plan.id)}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition duration-150 ease-in-out block ${
          plan.popular
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        Get Started
      </Link>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, couponsRes] = await Promise.all([
          fetch(`${API_BASE}/api/subscriptions`),
          fetch(`${API_BASE}/api/coupons`),
        ]);

        const plansData = await plansRes.json();
        const couponsData = await couponsRes.json();

        if (plansData.success) {
          const activePlans: Plan[] = plansData.data
            .filter((p: Plan) => p.isActive)
            .sort((a: Plan, b: Plan) => a.price - b.price);

          if (activePlans.length >= 3) {
            const midIndex = Math.floor(activePlans.length / 2);
            activePlans[midIndex].popular = true;
          }
          setPlans(activePlans);
        } else {
          setError('Could not load plans.');
        }

        if (couponsData.success) {
          setCoupons(couponsData.data.filter((c: Coupon) => c.isActive));
        }
      } catch {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const faqs = [
    {
      question: "Can I switch plans anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and you'll be charged or credited accordingly."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, we offer a 14-day free trial for all plans. No credit card required to start your trial."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, UPI, net banking, and NEFT/RTGS transfers."
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-grade encryption and security measures to protect your data. All data is backed up regularly."
    },
    {
      question: "Do you offer customer support?",
      answer: "Yes, we provide email support for all plans, priority support for Professional users, and 24/7 phone support for Enterprise customers."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes, you can cancel your subscription at any time. There are no cancellation fees or long-term contracts."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation centered />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start with a 14-day free trial. No credit card required.{' '}
            Scale as your business grows with our flexible pricing options.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Available Offers Bar */}
      {!loading && coupons.length > 0 && <OffersBar coupons={coupons} />}

      {/* Pricing Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex justify-center items-center py-16 gap-3 text-indigo-600">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-gray-500">Loading plans…</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-16 text-red-500 text-lg">{error}</div>
          )}

          {!loading && !error && plans.length === 0 && (
            <div className="text-center py-16 text-gray-500 text-lg">
              No pricing plans available at the moment. Please check back soon.
            </div>
          )}

          {!loading && plans.length > 0 && (
            <div
              className={`grid grid-cols-1 gap-8 ${
                plans.length === 1
                  ? 'md:grid-cols-1 max-w-md mx-auto'
                  : plans.length === 2
                  ? 'md:grid-cols-2 max-w-3xl mx-auto'
                  : 'md:grid-cols-3'
              }`}
            >
              {plans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} coupons={coupons} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Got questions? We've got answers.
            </p>
          </div>

          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.question}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
            Join thousands of businesses that trust ApnaBook for their accounting needs.{' '}
            Start your free trial today - no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="bg-white text-indigo-600 hover:bg-gray-50 px-8 py-4 rounded-lg font-semibold text-lg transition duration-150 ease-in-out transform hover:scale-105"
            >
              Start Free Trial
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg transition duration-150 ease-in-out"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PricingPage;
