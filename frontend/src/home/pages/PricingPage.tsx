import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import Navigation from '../components/Navigation';
import PricingCard from '../components/PricingCard';
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

const API_BASE = import.meta.env.VITE_API_URL

const PricingPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/subscriptions`);
        const data = await res.json();
        if (data.success) {
          // Only show active plans, sorted by price ascending
          const activePlans: Plan[] = data.data
            .filter((p: Plan) => p.isActive)
            .sort((a: Plan, b: Plan) => a.price - b.price);

          // Mark the middle plan as "popular" if there are 3+
          if (activePlans.length >= 3) {
            const midIndex = Math.floor(activePlans.length / 2);
            activePlans[midIndex].popular = true;
          }

          setPlans(activePlans);
        } else {
          setError('Could not load plans.');
        }
      } catch {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
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

  // Map backend plan to PricingCard-compatible shape
  const mapPlanToCard = (plan: Plan) => ({
    id: plan.id,
    name: plan.name,
    price: `₹${Number(plan.price).toLocaleString('en-IN')}`,
    period: plan.duration ? `/${plan.duration}` : '/month',
    description: plan.description || `${plan.name} plan`,
    features: plan.features,
    popular: plan.popular || false,
    buttonText: 'Get Started',
  });

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

      {/* Pricing Cards */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading && (
            <div className="flex justify-center items-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
            <div className={`grid grid-cols-1 gap-8 ${
              plans.length === 1
                ? 'md:grid-cols-1 max-w-md mx-auto'
                : plans.length === 2
                ? 'md:grid-cols-2 max-w-3xl mx-auto'
                : 'md:grid-cols-3'
            }`}>
              {plans.map((plan) => (
                <PricingCard key={plan.id} plan={mapPlanToCard(plan)} />
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
