import React,{ } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, BarChart3, DollarSign, FileText, Shield, Users, ArrowRight, Star } from 'lucide-react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [users, setUsers] = React.useState(2); // default 1 user
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  console.log('isAuthenticated:', isAuthenticated);
  const handleGetStarted = (planType: string) => {
  const planDetails = planType === 'single'
    ? { planType: 'single', userLimit: 1 }
    : { planType: 'multiple', userLimit: users };
  if (isAuthenticated) {
    navigate('/checkout', { state: planDetails });
  } else {
    navigate('/signup', { state: { ...planDetails, redirectTo: '/checkout' } });
  }
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
      content: "TallyPrime SaaS has transformed our accounting operations. The GST compliance features are outstanding!",
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
              Experience the power of TallyPrime in the cloud. Manage your business finances with ease, 
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
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricin
            </h2>
            <p className="text-xl text-gray-600">Choose the plan that fits your business needs</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Basic Plan */}
            <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Single</h3>
              <div className="text-4xl font-bold text-[#6D30D4] mb-6">
                ₹999<span className="text-lg text-gray-500">/month</span>
              </div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Single User</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Basic Accounting</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />GST Compliance</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Email Support</li>
              </ul>
              <button 
                onClick={() => handleGetStarted('single')}
                className="w-full bg-[#6922DF] hover:bg-[#6D30D4] text-white py-3 rounded-lg font-semibold transition-colors block"
              >
                Get Started
              </button>
            </div>

            {/* Professional Plan */}
{/* Professional Plan */}
<div className="bg-white border-2 border-[#6D30D4] rounded-xl p-8 text-center relative">
  {/* Badge */}
  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-[#6D30D4] text-white px-3 py-1 rounded-full text-sm font-medium">
    Most Popular
  </div>

  {/* Plan Title */}
  <h3 className="text-2xl font-bold text-gray-900 mb-4">Multiple</h3>

  {/* Price */}
  <div className="text-4xl font-bold text-[#6D30D4] mb-6">
    ₹{1999 + (users - 2) * 999}
    <span className="text-lg text-gray-500">/month</span>
  </div>

  {/* Features */}
  <ul className="text-left space-y-3 mb-6">
    <li className="flex items-center justify-between">
      <span className="flex items-center">
        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
        Multi-User Access
      </span>
      {/* Increment buttons inline */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setUsers(prev => Math.max(prev - 1, 2))}
          className="bg-gray-200 text-gray-700 px-2 py-1 rounded font-semibold hover:bg-gray-300 transition"
        >
          -
        </button>
        <span className="text-lg font-semibold">{users}</span>
        <button
          onClick={() => setUsers(prev => prev + 1)}
          className="bg-gray-200 text-gray-700 px-2 py-1 rounded font-semibold hover:bg-gray-300 transition"
        >
          +
        </button>
      </div>
    </li>

    <li className="flex items-center">
      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
      Advanced Features
    </li>
    <li className="flex items-center">
      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
      Multi-Company
    </li>
    <li className="flex items-center">
      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
      Priority Support
    </li>
  </ul>

  {/* Get Started Button */}
  <button 
  onClick={() => handleGetStarted('multiple')}
  className="w-full bg-[#6922DF] hover:bg-[#6D30D4] text-white py-3 rounded-lg font-semibold transition-colors block">
    Get Started
  </button>
</div>







            {/* Enterprise Plan */}
            {/* <div className="bg-white border-2 border-gray-200 rounded-xl p-8 text-center">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Enterprise</h3>
              <div className="text-4xl font-bold text-[#6D30D4] mb-6">
                ₹4,999<span className="text-lg text-gray-500">/month</span>
              </div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Unlimited Users</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />All Features</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />Custom Integration</li>
                <li className="flex items-center"><CheckCircle className="w-5 h-5 text-green-500 mr-3" />24/7 Support</li>
              </ul>
              <Link 
                to="/pricing"
                className="w-full bg-[#6922DF] hover:bg-[#6D30D4] text-white py-3 rounded-lg font-semibold transition-colors block"
              >
                Get Started
              </Link>
            </div> */}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-gray-50">
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
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-[#6D30D4] to-[#385192] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl mb-8 text-gray-100 max-w-2xl mx-auto">
            Join thousands of businesses that trust TallyPrime SaaS for their accounting needs.
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
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
