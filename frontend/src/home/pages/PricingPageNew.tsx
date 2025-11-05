import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import PricingCard from '../components/PricingCard';
import Footer from '../components/Footer';

const PricingPage: React.FC = () => {
  const pricingPlans = [
    {
      id: 'starter',
      name: "Starter",
      price: "₹999",
      period: "/month",
      description: "Perfect for small businesses and startups",
      features: [
        "Up to 100 transactions/month",
        "Basic GST reports",
        "Single user access",
        "Email support",
        "Basic inventory tracking",
        "Standard templates"
      ],
      popular: false,
      buttonText: "Start Starter Plan"
    },
    {
      id: 'professional',
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
        "API access",
        "Custom workflows",
        "Audit trails",
        "Data export/import"
      ],
      popular: true,
      buttonText: "Start Professional Plan"
    },
    {
      id: 'enterprise',
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
        "24/7 phone support",
        "White-label options",
        "Advanced security",
        "Custom training",
        "SLA guarantees"
      ],
      popular: false,
      buttonText: "Contact Sales"
    }
  ];

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
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choose Your Perfect Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Start with a 14-day free trial. No credit card required. 
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

      {/* Pricing Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan) => (
              <PricingCard key={plan.id} plan={plan} />
            ))}
          </div>
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
            Join thousands of businesses that trust TallyPrime for their accounting needs. 
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
