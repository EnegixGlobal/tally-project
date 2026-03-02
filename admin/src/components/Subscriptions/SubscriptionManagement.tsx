import React, { useState, useEffect } from 'react';
import type { SubscriptionPlan } from '../../types';
import { Plus, Edit, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../services/api';
import Swal from 'sweetalert2';

const SubscriptionManagement: React.FC = () => {
  const { theme } = useTheme();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const [newPlan, setNewPlan] = useState({
    name: '',
    price: 0,
    duration: 'monthly' as 'monthly' | 'yearly',
    features: [''],
    isActive: true
  });

  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage' as 'percentage' | 'fixed',
    discountValue: 0,
    applicableDuration: 'all' as 'monthly' | 'yearly' | 'all',
    expiryDate: '',
    maxUses: 0,
    isActive: true
  });

  // Fetch data on mount
  useEffect(() => {
    fetchPlans();
    fetchCoupons();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/subscriptions');
      if (response.data.success) {
        setPlans(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      Swal.fire('Error', 'Failed to fetch subscription plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const response = await api.get('/api/coupons');
      if (response.data.success) {
        setCoupons(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
    }
  };

  const handleAddCoupon = async () => {
    try {
      if (!newCoupon.code || newCoupon.discountValue <= 0) {
        Swal.fire('Warning', 'Please enter valid code and discount value', 'warning');
        return;
      }
      const response = await api.post('/api/coupons', newCoupon);
      if (response.data.success) {
        Swal.fire('Success', 'Coupon created successfully', 'success');
        fetchCoupons();
        setShowCouponModal(false);
      }
    } catch (error: any) {
      console.error('Error adding coupon:', error);
      Swal.fire('Error', error.response?.data?.error || 'Failed to create coupon', 'error');
    }
  };

  const handleToggleCoupon = async (id: string) => {
    try {
      const response = await api.patch(`/api/coupons/${id}/toggle`);
      if (response.data.success) {
        setCoupons(prev => prev.map(c => c.id === id ? { ...c, isActive: response.data.isActive } : c));
      }
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Coupon?',
        text: "This coupon will be removed permanently!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete'
      });

      if (result.isConfirmed) {
        const response = await api.delete(`/api/coupons/${id}`);
        if (response.data.success) {
          setCoupons(prev => prev.filter(c => c.id !== id));
          Swal.fire('Deleted', 'Coupon removed', 'success');
        }
      }
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  const handleAddPlan = async () => {
    try {
      if (!newPlan.name || newPlan.price <= 0) {
        Swal.fire('Warning', 'Please enter valid plan name and price', 'warning');
        return;
      }
      const response = await api.post('/api/subscriptions', {
        ...newPlan,
        features: newPlan.features.filter(f => f.trim() !== '')
      });
      if (response.data.success) {
        Swal.fire('Success', 'Subscription plan added successfully', 'success');
        fetchPlans();
        setNewPlan({ name: '', price: 0, duration: 'monthly', features: [''], isActive: true });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error adding plan:', error);
      Swal.fire('Error', 'Failed to add plan', 'error');
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const updatedPlan = { ...plan, isActive: !plan.isActive };
      const response = await api.put(`/api/subscriptions/${plan.id}`, updatedPlan);
      if (response.data.success) {
        setPlans(prev => prev.map(p => p.id === plan.id ? updatedPlan : p));
      }
    } catch (error) {
      console.error('Error updating status:', error);
      Swal.fire('Error', 'Failed to update plan status', 'error');
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await api.delete(`/api/subscriptions/${id}`);
        if (response.data.success) {
          Swal.fire('Deleted!', 'Plan has been deleted.', 'success');
          setPlans(prev => prev.filter(plan => plan.id !== id));
        }
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      Swal.fire('Error', 'Failed to delete plan', 'error');
    }
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

  const handleUpdatePlan = async () => {
    try {
      if (!editingPlan) return;
      if (!newPlan.name || newPlan.price <= 0) {
        Swal.fire('Warning', 'Please enter valid plan name and price', 'warning');
        return;
      }
      const response = await api.put(`/api/subscriptions/${editingPlan.id}`, {
        ...newPlan,
        features: newPlan.features.filter(f => f.trim() !== '')
      });
      if (response.data.success) {
        Swal.fire('Success', 'Subscription plan updated successfully', 'success');
        fetchPlans();
        setEditingPlan(null);
        setNewPlan({ name: '', price: 0, duration: 'monthly', features: [''], isActive: true });
        setShowAddForm(false);
      }
    } catch (error) {
      console.error('Error updating plan:', error);
      Swal.fire('Error', 'Failed to update plan', 'error');
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
          onClick={() => {
            setEditingPlan(null);
            setNewPlan({ name: '', price: 0, duration: 'monthly', features: [''], isActive: true });
            setShowAddForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add New Plan
        </button>
      </div>

      {/* Add/Edit Plan Form */}
      {showAddForm && (
        <div className={`rounded-xl shadow-sm border p-6 ${theme === 'dark'
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200'
          }`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
            {editingPlan ? 'Edit Plan' : 'Add New Plan'}
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Plan Name
              </label>
              <input
                title='Enter plan name'
                type="text"
                placeholder="Business Basic"
                value={newPlan.name}
                onChange={(e) => setNewPlan(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
                  }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Price (₹)
              </label>
              <input
                title='Enter plan price'
                type="number"
                placeholder="999"
                value={newPlan.price}
                onChange={(e) => setNewPlan(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
                  }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                Duration
              </label>
              <select
                title='Select plan duration'
                value={newPlan.duration}
                onChange={(e) => setNewPlan(prev => ({ ...prev, duration: e.target.value as 'monthly' | 'yearly' }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white'
                  : 'border-gray-300 bg-white text-gray-900'
                  }`}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
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
                      placeholder="Enter feature example: 5 Companies"
                      className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all ${theme === 'dark'
                        ? 'border-gray-600 bg-gray-700 text-white'
                        : 'border-gray-300 bg-white text-gray-900'
                        }`}
                    />
                    {newPlan.features.length > 1 && (
                      <button
                        type="button"
                        title='Remove feature'
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
                  className="text-primary hover:text-primaryDark text-sm font-medium"
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
              className={`px-4 py-2 border rounded-lg transition-colors ${theme === 'dark'
                ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
            >
              Cancel
            </button>
            <button
              onClick={editingPlan ? handleUpdatePlan : handleAddPlan}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primaryDark shadow-md transition-all active:scale-95"
            >
              {editingPlan ? 'Update Plan' : 'Add Plan'}
            </button>
          </div>
        </div>
      )}

      {/* Plans List or Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-20 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading subscription plans...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className={`text-center py-20 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
          }`}>
          <p className={`text-lg mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No subscription plans found</p>
          <button onClick={() => setShowAddForm(true)} className="text-primary hover:underline font-medium">Create your first plan</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border-2 p-6 overflow-hidden transition-all duration-300 ${theme === 'dark'
                ? 'bg-gray-800 border-gray-700 hover:border-indigo-500/50 hover:shadow-indigo-500/10'
                : 'bg-white border-gray-200 hover:border-indigo-500 hover:shadow-xl'
                } ${!plan.isActive ? 'grayscale opacity-70 scale-95' : 'hover:-translate-y-1 shadow-md'}`}
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>{plan.name}</h3>
                  <div className={`text-[10px] px-2 py-0.5 rounded-full inline-block mt-1 font-bold uppercase tracking-wide ${plan.isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                    }`}>
                    {plan.isActive ? 'Active' : 'Disabled'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    title={plan.isActive ? 'Disable plan' : 'Enable plan'}
                    onClick={() => handleToggleActive(plan)}
                    className={`p-2 rounded-lg transition-colors ${plan.isActive
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                  >
                    {plan.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    title='Edit plan'
                    onClick={() => handleEditPlan(plan)}
                    className="p-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    title='Delete plan'
                    onClick={() => handleDeletePlan(plan.id)}
                    className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="mb-6 pb-6 border-b border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex items-baseline">
                  <span id={`original-p-${plan.id}`} className={`text-4xl font-black transition-all ${theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>₹{plan.price.toLocaleString()}</span>
                  <span className={`text-sm font-medium ml-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>/{plan.duration}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 min-h-[120px]">
                {plan.features.map((feature, index) => (
                  <li key={index} className={`text-sm flex items-start ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                    <div className="mt-1 w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center mr-3 text-indigo-500 flex-shrink-0">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Coupon Preview Section */}
              <div className={`mb-6 p-3 rounded-xl border-2 border-dashed ${theme === 'dark' ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">Test Coupon Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. SAVE10"
                    className={`flex-1 text-xs p-2 rounded-lg border outline-none font-mono ${theme === 'dark' ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white border-gray-200'
                      }`}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      const coupon = coupons.find(c => c.code === code && c.isActive);
                      const planId = plan.id;
                      const previewEl = document.getElementById(`discount-p-${planId}`);
                      const originalEl = document.getElementById(`original-p-${planId}`);
                      const errorEl = document.getElementById(`error-p-${planId}`);

                      if (coupon) {
                        // Check compatibility
                        const isCompatible = coupon.applicableDuration === 'all' || coupon.applicableDuration === plan.duration;

                        if (!isCompatible) {
                          if (errorEl) errorEl.innerText = `Only for ${coupon.applicableDuration} plans`;
                          if (previewEl) previewEl.style.display = 'none';
                          return;
                        }

                        let discount = 0;
                        if (coupon.discountType === 'percentage') {
                          discount = (plan.price * coupon.discountValue) / 100;
                        } else {
                          discount = coupon.discountValue;
                        }
                        const finalPrice = Math.max(0, plan.price - discount);

                        if (previewEl) {
                          previewEl.innerText = `₹${finalPrice.toLocaleString()}`;
                          previewEl.style.display = 'block';
                        }
                        if (originalEl) originalEl.classList.add('line-through', 'opacity-40');
                        if (errorEl) errorEl.innerText = 'Coupon Applied!';
                        if (errorEl) errorEl.classList.replace('text-red-500', 'text-green-500');
                      } else {
                        if (previewEl) previewEl.style.display = 'none';
                        if (originalEl) originalEl.classList.remove('line-through', 'opacity-40');
                        if (errorEl) errorEl.innerText = '';
                      }
                    }}
                  />
                </div>
                <div id={`error-p-${plan.id}`} className="text-[10px] mt-1 text-red-500 font-medium"></div>
                <div id={`discount-p-${plan.id}`} className="text-xl font-black text-green-500 mt-1 hidden animate-bounce"></div>
              </div>

              <button
                disabled={!plan.isActive}
                className={`w-full py-2.5 rounded-xl font-bold transition-all ${plan.isActive
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
              >
                {plan.isActive ? 'Switch to this Plan' : 'Temporarily Unavailable'}
              </button>
            </div>
          ))}
        </div>
      )}
      {/* Separator */}
      <hr className={`border-t-2 border-dashed my-10 ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`} />

      {/* Coupon System Section */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Discount & Coupon System</h2>
          <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Manage promotional codes and special offers</p>
        </div>
        <button
          onClick={() => setShowCouponModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon
        </button>
      </div>

      {/* Coupons Table/List */}
      <div className={`rounded-xl border overflow-hidden ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200 shadow-sm'
        }`}>
        <table className="w-full text-left">
          <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Code</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Discount</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Applicable</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Expiry</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {coupons.map((coupon) => (
              <tr key={coupon.id} className={`${!coupon.isActive ? 'opacity-50' : ''}`}>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded font-mono font-bold">{coupon.code}</span>
                </td>
                <td className="px-6 py-4 font-semibold">
                  {coupon.discountType === 'percentage' ? `${coupon.discountValue}% Off` : `₹${coupon.discountValue} Off`}
                </td>
                <td className="px-6 py-4 text-gray-500 capitalize">{coupon.applicableDuration}</td>
                <td className="px-6 py-4 text-gray-500">
                  {coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {coupon.isActive ? 'Active' : 'Expired/Disabled'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleToggleCoupon(coupon.id)}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 transition-colors"
                    >
                      {coupon.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No active coupons found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-300 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}>
            <h3 className="text-xl font-bold mb-6">Create New Discount Coupon</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">Coupon Code</label>
                <input
                  type="text"
                  placeholder="OFFER2025"
                  className={`w-full p-2.5 rounded-xl border-2 outline-none transition-all focus:border-indigo-500 uppercase font-mono font-bold ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100'
                    }`}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 opacity-70">Discount Type</label>
                  <select
                    className={`w-full p-2.5 rounded-xl border-2 outline-none transition-all focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100'
                      }`}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value as 'percentage' | 'fixed' })}
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 opacity-70">Value</label>
                  <input
                    type="number"
                    placeholder="10"
                    className={`w-full p-2.5 rounded-xl border-2 outline-none transition-all focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100'
                      }`}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 opacity-70">Max Global Uses</label>
                  <input
                    type="number"
                    placeholder="Unlimited: 0"
                    className={`w-full p-2.5 rounded-xl border-2 outline-none transition-all focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100'
                      }`}
                    onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 opacity-70">Expiry Date</label>
                  <input
                    type="date"
                    className={`w-full p-2.5 rounded-xl border-2 outline-none transition-all focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100'
                      }`}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 opacity-70">Apply to Plan Duration</label>
                <select
                  className={`w-full p-2.5 rounded-xl border-2 outline-none transition-all focus:border-indigo-500 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-100'
                    }`}
                  onChange={(e) => setNewCoupon({ ...newCoupon, applicableDuration: e.target.value as 'monthly' | 'yearly' | 'all' })}
                >
                  <option value="all">All Subscriptions (Monthly & Yearly)</option>
                  <option value="monthly">Monthly Plans Only</option>
                  <option value="yearly">Yearly Plans Only</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => setShowCouponModal(false)}
                  className="px-6 py-2 rounded-xl font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCoupon}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95"
                >
                  Create Coupon
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
