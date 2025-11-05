import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular?: boolean;
  buttonText?: string;
  buttonLink?: string;
  onPlanSelect?: (planId: string) => void;
}

interface PricingCardProps {
  plan: PricingPlan;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan }) => {
  const handlePlanClick = () => {
    if (plan.onPlanSelect) {
      plan.onPlanSelect(plan.id);
    }
    // Store selected plan in localStorage for the signup process
    localStorage.setItem('selectedPlan', plan.id);
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-8 relative ${plan.popular ? 'ring-2 ring-indigo-600 transform scale-105' : ''}`}>
      {plan.popular && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
          Most Popular
        </div>
      )}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-4">{plan.description}</p>
        <div className="mb-6">
          <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
          <span className="text-gray-600">{plan.period}</span>
        </div>
      </div>
      <ul className="space-y-3 mb-8">
        {plan.features.map((feature, featureIndex) => (
          <li key={featureIndex} className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
            <span className="text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
      <Link
        to={plan.buttonLink || "/signup"}
        onClick={handlePlanClick}
        className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition duration-150 ease-in-out block ${
          plan.popular 
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
        }`}
      >
        {plan.buttonText || 'Get Started'}
      </Link>
    </div>
  );
};

export default PricingCard;
