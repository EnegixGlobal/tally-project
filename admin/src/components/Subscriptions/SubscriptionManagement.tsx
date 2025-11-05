import React, { useState } from 'react';
import { mockPlans } from '../../data/mockData';
import type { SubscriptionPlan } from '../../types';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const SubscriptionManagement: React.FC = () => {
  const { theme } = useTheme();
  const [plans, setPlans] = useState<SubscriptionPlan[]>(mockPlans);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    duration: 'monthly' as 'monthly' | 'yearly',
    features: [''],
    isActive: true
  });

  const handleAddPlan = () => {
    const plan: SubscriptionPlan = {
      id: Date.now().toString(),
      ...newPlan,
      features: newPlan.features.filter(f => f.trim() !== ''),
      createdAt: new Date().toISOString()
    };
    setPlans([...plans, plan]);
    setNewPlan({ name: '', price: 0, duration: 'monthly', features: [''], isActive: true });
    setShowAddForm(false);
  };

  const handleToggleActive = (id: string) => {
    setPlans(prev => prev.map(plan => 
      plan.id === id ? { ...plan, isActive: !plan.isActive } : plan
    ));
  };

  const handleDeletePlan = (id: string) => {
    setPlans(prev => prev.filter(plan => plan.id !== id));
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: [...plan.features],
      isActive: plan.isActive
    });
    setShowAddForm(true);
  };

  const handleUpdatePlan = () => {
    if (editingPlan) {
      setPlans(prev => prev.map(plan => 
        plan.id === editingPlan.id 
          ? { ...plan, ...newPlan, features: newPlan.features.filter(f => f.trim() !== '') }
          : plan
      ));
      setEditingPlan(null);
      setNewPlan({ name: '', price: 0, duration: 'monthly', features: [''], isActive: true });
      setShowAddForm(false);
    }
  };

  const addFeature = () => {
    setNewPlan(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const updateFeature = (index: number, value: string) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setNewPlan(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Subscription Plans</h1>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Manage subscription plans and pricing</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Plan
        </button>
      </div>

      {/* Add Plan Form */}
      {showAddForm && (
        <div className={`rounded-xl shadow-sm border p-6 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            {editingPlan ? 'Edit Plan' : 'Add New Plan'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Plan Name
              </label>
              <input
                title='Enter plan name'
                type="text"
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Price (₹)
              </label>
              <input
                title='Enter plan price'
                type="number"
                value={newPlan.price}
                onChange={(e) => setNewPlan(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Duration
              </label>
              <select
                title='Select plan duration'
                value={newPlan.duration}
                onChange={(e) => setNewPlan(prev => ({ ...prev, duration: e.target.value as 'monthly' | 'yearly' }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                  theme === 'dark' 
                    ? 'border-gray-600 bg-gray-700 text-white' 
                    : 'border-gray-300 bg-white text-gray-900'
                }`}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Features
              </label>
              <div className="space-y-2">
                {newPlan.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="Enter feature"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary ${
                        theme === 'dark' 
                          ? 'border-gray-600 bg-gray-700 text-white' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    />
                    {newPlan.features.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeFeature(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addFeature}
                  className="text-primary hover:text-primaryDark text-sm"
                >
                  + Add Feature
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingPlan(null);
                setNewPlan({ name: '', price: 0, duration: 'monthly', features: [''], isActive: true });
              }}
              className={`px-4 py-2 border rounded-lg transition-colors ${
                theme === 'dark' 
                  ? 'border-gray-600 hover:bg-gray-700' 
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={editingPlan ? handleUpdatePlan : handleAddPlan}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors"
            >
              {editingPlan ? 'Update Plan' : 'Add Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border p-6 ${
              theme === 'dark' 
                ? 'bg-gray-800 border-gray-700' 
                : 'bg-white border-gray-200'
            } ${!plan.isActive ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>{plan.name}</h3>
              <div className="flex items-center gap-2">
                <button
                  title={plan.isActive ? 'Disable plan' : 'Enable plan'}
                  onClick={() => handleToggleActive(plan.id)}
                  className={`p-1 rounded ${
                    plan.isActive 
                      ? 'text-green-600 hover:text-green-800' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {plan.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button
                  title='Edit plan'
                  onClick={() => handleEditPlan(plan)}
                  className="p-1 text-blue-600 hover:text-blue-800"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  title='Delete plan'
                  onClick={() => handleDeletePlan(plan.id)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="mb-4">
              <span className={`text-3xl font-bold ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>₹{plan.price.toLocaleString()}</span>
              <span className={`text-sm ml-2 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`}>/{plan.duration}</span>
            </div>
            
            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className={`text-sm flex items-center ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <span className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></span>
                  {feature}
                </li>
              ))}
            </ul>
            
            <div className={`text-xs px-3 py-1 rounded-full inline-flex items-center ${
              plan.isActive 
                ? theme === 'dark' 
                  ? 'bg-green-900 text-green-100' 
                  : 'bg-green-100 text-green-800'
                : theme === 'dark'
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {plan.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubscriptionManagement;
