import React, { } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, BarChart3, DollarSign, FileText, Shield, Users, ArrowRight, Star } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';

const HomePage: React.FC = () => {
  const [plans, setPlans] = React.useState<any[]>([]);
  const [coupons, setCoupons] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [users, setUsers] = React.useState(2);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [plansRes, couponsRes] = await Promise.all([
          axiosInstance.get('/subscriptions'),
          axiosInstance.get('/coupons')
        ]);

        if ((plansRes.data as any).success) setPlans((plansRes.data as any).data);
        if ((couponsRes.data as any).success) setCoupons((couponsRes.data as any).data.filter((c: any) => c.isActive));
      } catch (error) {
        console.error('Error fetching dynamic data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGetStarted = (plan: any) => {
    const planDetails = {
      planId: plan.id,
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      userLimit: plan.name.toLowerCase().includes('multiple') ? users : 1
    };

    if (isAuthenticated) {
      navigate('/checkout', { state: planDetails });
    } else {
      navigate('/signup', { state: { ...planDetails, redirectTo: '/checkout' } });
    }
  };

  const getDiscountedPrice = (plan: any) => {
    const bestCoupon = coupons.find(c =>
      c.isActive && (c.applicableDuration === 'all' || c.applicableDuration === plan.duration)
    );

    if (!bestCoupon) return null;

    let discount = 0;
    if (bestCoupon.discountType === 'percentage') {
      discount = (plan.price * bestCoupon.discountValue) / 100;
    } else {
      discount = bestCoupon.discountValue;
    }
    return {
      price: Math.max(0, plan.price - discount),
      code: bestCoupon.code,
      value: bestCoupon.discountType === 'percentage' ? `${bestCoupon.discountValue}%` : `₹${bestCoupon.discountValue}`
    };
  };
  const features = [
    {
      icon: <BarChart3 className="w-8 h-8 text-[#6D30D4]" />,
      title: "Advanced Analytics",
      description: "Get detailed insights into your business with comprehensive reporting and analytics."
    },
    {
      icon: <DollarSign className="w-8 h-8 text-[#6D30D4]" />,
      title: "GST Compliance",
      description: "Stay compliant with automated GST calculations and return filing capabilities."
    },
    {
      icon: <FileText className="w-8 h-8 text-[#6D30D4]" />,
      title: "Invoice Management",
      description: "Create, manage, and track invoices with professional templates and automation."
    },
    {
      icon: <Shield className="w-8 h-8 text-[#6D30D4]" />,
      title: "Secure & Reliable",
      description: "Bank-level security with 99.9% uptime guarantee for your peace of mind."
    },
    {
      icon: <Users className="w-8 h-8 text-[#6D30D4]" />,
      title: "Multi-User Access",
      description: "Collaborate with your team with role-based access controls and permissions."
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-[#6D30D4]" />,
      title: "Easy Integration",
      description: "Seamlessly integrate with banks, payment gateways, and other business tools."
    }
  ];

  const testimonials = [
    {
      name: "Rajesh Kumar",
      company: "Kumar Enterprises",
      content: "ApnaBook SaaS has transformed our accounting operations. The GST compliance features are outstanding!",
      rating: 5
    },
    {
      name: "Priya Sharma",
      company: "Tech Solutions Pvt Ltd",
      content: "The user interface is intuitive and the analytics provide valuable insights for business decisions.",
      rating: 5
    },
    {
      name: "Amit Patel",
      company: "Patel Trading Co.",
      content: "Excellent customer support and the cloud-based approach makes it accessible from anywhere.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#6D30D4] via-[#9D78DB] to-[#385192] text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Modern Accounting
              <span className="block text-[#9D78DB]">Made Simple</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-gray-100 max-w-3xl mx-auto">
              Experience the power of Apnabook in the cloud. Manage your business finances with ease,
              stay GST compliant, and access your data from anywhere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/signup"
                className="bg-white text-[#6D30D4] hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center"
              >
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/pricing"
                className="border-2 border-white text-white hover:bg-white hover:text-[#6D30D4] px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                View Pricing
              </Link>
            </div>
            <p className="mt-4 text-sm text-gray-200">No credit card required • 14-day free trial</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features for Modern Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to manage your business finances efficiently and stay compliant with regulations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your business needs</p>
          </div>

          {/* Styled Active Offers Section (Moved Above Plans) */}
          {!loading && coupons.length > 0 && (
            <div className="mb-16">
              <div className="flex flex-wrap justify-center gap-6">
                {coupons.map((coupon) => (
                  <div key={coupon.id} className="relative group overflow-visible">
                    {/* Background Glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

                    {/* Ticket Style Coupon */}
                    <div className="relative flex bg-white border-2 border-dashed border-indigo-200 rounded-2xl p-0 hover:border-indigo-500 transition-all transform hover:-translate-y-1 overflow-hidden shadow-xl">
                      {/* Left Side: Value */}
                      <div className="bg-gradient-to-br from-[#6D30D4] to-[#4c1da5] text-white p-6 flex flex-col items-center justify-center min-w-[120px]">
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Save</span>
                        <div className="text-3xl font-black">
                          {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                        </div>
                        <span className="text-[10px] font-medium uppercase mt-1">Limited</span>
                      </div>

                      {/* Right Side: Code & Info */}
                      <div className="p-5 flex flex-col justify-center bg-white pr-8">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="px-3 py-1 bg-indigo-50 text-[#6D30D4] rounded-lg font-mono font-black text-sm tracking-wider border border-indigo-100">
                            {coupon.code}
                          </div>
                          <span className="text-[10px] font-bold text-green-500 uppercase flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Active
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-medium">
                          Applicable on <span className="text-[#6D30D4] font-bold">{coupon.applicableDuration === 'all' ? 'All' : coupon.applicableDuration}</span> plans
                        </p>
                        <p className="text-[9px] text-gray-400 mt-2 italic">Copy code & apply at checkout</p>
                      </div>

                      {/* Ticket Cutouts */}
                      <div className="absolute top-1/2 -left-3 w-6 h-6 bg-gray-50 rounded-full transform -translate-y-1/2 border-r-2 border-indigo-200"></div>
                      <div className="absolute top-1/2 -right-3 w-6 h-6 bg-gray-50 rounded-full transform -translate-y-1/2 border-l-2 border-indigo-200"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-[#6D30D4] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {plans.filter(p => p.isActive).map((plan) => {
                const discount = getDiscountedPrice(plan);
                const isMultiple = plan.name.toLowerCase().includes('multiple');

                return (
                  <div key={plan.id} className={`bg-white border-2 rounded-2xl p-8 text-center relative transition-all hover:shadow-2xl ${isMultiple ? 'border-[#6D30D4] shadow-xl scale-105' : 'border-gray-100'
                    }`}>
                    {isMultiple && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#6D30D4] text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                        Most Popular
                      </div>
                    )}

                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-8">
                      {discount ? (
                        <div className="flex flex-col items-center">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-red-500 line-through text-xl font-bold opacity-50 italic">₹{plan.price}</span>
                            <span className="bg-red-50 text-red-600 text-[10px] px-2 py-1 rounded-md font-black uppercase tracking-tighter border border-red-100 shadow-sm transition-all hover:scale-110">
                              You Save {discount.value}
                            </span>
                          </div>
                          <div className="text-6xl font-black text-[#6D30D4] tracking-tight">
                            ₹{discount.price}
                            <span className="text-lg text-gray-500 font-medium">/{plan.duration}</span>
                          </div>
                          <div className="mt-4 px-4 py-1.5 bg-indigo-50 text-[#6D30D4] rounded-xl text-[10px] font-black tracking-widest border border-indigo-100 uppercase animate-pulse shadow-sm">
                            Apply Code: <span className="text-[#6D30D4] select-all cursor-pointer font-black">{discount.code}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-5xl font-black text-[#6D30D4] py-2">
                          ₹{plan.price}
                          <span className="text-lg text-gray-500 font-medium">/{plan.duration}</span>
                        </div>
                      )}
                    </div>

                    <ul className="text-left space-y-4 mb-8 min-h-[160px]">
                      {isMultiple && (
                        <li className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                          <span className="flex items-center text-sm font-semibold text-gray-700">
                            <Users className="w-4 h-4 text-[#6D30D4] mr-2" />
                            Users: {users}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button onClick={() => setUsers(prev => Math.max(prev - 1, 2))} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 shadow-sm">-</button>
                            <button onClick={() => setUsers(prev => prev + 1)} className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 shadow-sm">+</button>
                          </div>
                        </li>
                      )}
                      {plan.features.map((feature: any, i: number) => (
                        <li key={i} className="flex items-start text-gray-600 text-sm">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleGetStarted(plan)}
                      className="w-full bg-[#6D30D4] hover:bg-[#5a27ae] text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-purple-200 transition-all active:scale-95"
                    >
                      Choose Plan
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section >

      {/* Testimonials Section */}
      < section id="testimonials" className="py-20 bg-gray-50" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600">Trusted by thousands of businesses across India</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section >

      {/* Call to Action Section */}
      < section className="py-20 bg-gradient-to-r from-[#6D30D4] to-[#385192] text-white" >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-gray-100 max-w-2xl mx-auto">
            Join thousands of businesses that trust ApnaBook SaaS for their accounting needs.
            Start your free trial today!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/signup"
              className="bg-white text-[#6D30D4] hover:bg-gray-100 px-8 py-4 rounded-lg font-semibold text-lg transition-colors flex items-center"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/contact"
              className="border-2 border-white text-white hover:bg-white hover:text-[#6D30D4] px-8 py-4 rounded-lg font-semibold text-lg transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section >

      <Footer />
    </div >
  );
};

export default HomePage;
