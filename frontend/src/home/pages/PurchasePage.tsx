import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PurchasePage: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const { user, updateSubscription } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if user already has an active subscription
    if (user.hasSubscription) {
      navigate('/app');
      return;
    }

    // Get selected plan from localStorage (from pricing page)
    const storedPlan = localStorage.getItem('selectedPlan');
    if (storedPlan) {
      setSelectedPlan(storedPlan);
      localStorage.removeItem('selectedPlan'); // Clean up
    } else {
      setSelectedPlan('professional'); // Default to professional
    }
  }, [user, navigate]);

  const pricingPlans = {
    starter: {
      name: "Starter",
      price: "₹999",
      period: "/month",
      description: "Perfect for small businesses and startups",
      features: [
        "Up to 100 transactions/month",
        "Basic GST reports",
        "Single user access",
        "Email support",
        "Basic inventory tracking"
      ]
    },
    professional: {
      name: "Professional",
      price: "₹2,999",
      period: "/month",
      description: "Ideal for growing businesses",
      features: [
        "Unlimited transactions",
        "Advanced GST compliance",
        "Up to 5 users",
        "Priority support",
        "Advanced reporting",
        "Multi-location support",
        "API access"
      ]
    },
    enterprise: {
      name: "Enterprise",
      price: "₹9,999",
      period: "/month",
      description: "For large enterprises with complex needs",
      features: [
        "Everything in Professional",
        "Unlimited users",
        "Custom integrations",
        "Dedicated account manager",
        "Advanced audit trails",
        "Custom workflows",
        "24/7 phone support"
      ]
    }
  };

  const handlePlanChange = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handlePurchase = async () => {
    if (!selectedPlan || !user) return;

    setProcessingPayment(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update subscription based on selected plan
      const planMapping = {
        starter: 'basic' as const,
        professional: 'professional' as const,
        enterprise: 'enterprise' as const
      };
      
      updateSubscription(planMapping[selectedPlan as keyof typeof planMapping]);
      
      // Redirect to dashboard on successful purchase
      navigate('/app');
    } catch {
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const currentPlan = selectedPlan ? pricingPlans[selectedPlan as keyof typeof pricingPlans] : null;

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-indigo-600">ApnaBook</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {`${user.firstName} ${user.lastName}`}</span>
              <button
                onClick={() => navigate('/app')}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Complete Your Setup
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your plan to unlock the full power of ApnaBook. 
            You can change or cancel your subscription at any time.
          </p>
        </div>

        {/* Trial Notice */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-green-800">
                Your 14-day free trial is active!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>
                  You have full access to all features during your trial period. 
                  Subscribe now to continue using ApnaBook after your trial ends.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(pricingPlans).map(([planId, plan]) => (
            <div
              key={planId}
              className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 ${
                selectedPlan === planId
                  ? 'ring-2 ring-indigo-600 transform scale-105'
                  : 'hover:shadow-lg'
              }`}
              onClick={() => handlePlanChange(planId)}
            >
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-600 mt-1">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </div>
              
              <ul className="space-y-2 mb-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="text-center">
                <div className={`w-4 h-4 rounded-full mx-auto ${
                  selectedPlan === planId ? 'bg-indigo-600' : 'bg-gray-300'
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        {currentPlan && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Payment Summary
            </h3>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-700">{currentPlan.name} Plan</span>
              <span className="font-semibold text-gray-900">
                {currentPlan.price}{currentPlan.period}
              </span>
            </div>
            <div className="flex justify-between items-center mb-4 text-sm text-gray-600">
              <span>14-day free trial</span>
              <span>₹0</span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-900">
                  Due today
                </span>
                <span className="text-lg font-semibold text-gray-900">₹0</span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Your first payment of {currentPlan.price} will be charged after your 14-day trial ends.
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/app')}
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition duration-150 ease-in-out"
          >
            Continue with Trial
          </button>
          <button
            onClick={handlePurchase}
            disabled={!selectedPlan || processingPayment}
            className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processingPayment ? 'Processing...' : `Subscribe to ${currentPlan?.name}`}
          </button>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            🔒 Your payment information is secure and encrypted. 
            You can cancel or change your subscription at any time.
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">When will I be charged?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Your first payment will be processed after your 14-day free trial ends. 
                You'll receive an email reminder before the trial expires.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Can I change my plan later?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Yes, you can upgrade or downgrade your plan at any time from your account settings. 
                Changes take effect immediately.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Can I cancel anytime?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Absolutely. You can cancel your subscription at any time with no cancellation fees. 
                You'll continue to have access until the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchasePage;
