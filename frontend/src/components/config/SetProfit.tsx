import React, { useState } from 'react';
import { TrendingUp, Save, RefreshCw, ArrowLeft, Calculator, Percent, DollarSign, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfitRule {
  id: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'markup';
  value: number;
  applicableToCategories: string[];
  applicableToItems: string[];
  minQuantity?: number;
  maxQuantity?: number;
  isActive: boolean;
  priority: number;
}

const SetProfit: React.FC = () => {
  const navigate = useNavigate();
  
  const [profitSettings, setProfitSettings] = useState({
    defaultProfitMethod: 'percentage', // percentage, fixed_amount, markup
    defaultProfitValue: 20,
    allowNegativeProfit: false,
    profitRoundingMethod: 'round', // round, floor, ceil
    profitDecimalPlaces: 2,
    autoCalculateSellingPrice: true,
    showProfitInVouchers: true,
    profitCalculationBase: 'cost_price', // cost_price, last_purchase_price, average_cost
    enableDynamicPricing: false,
    enableQuantityBasedProfit: false,
    enableCustomerGroupPricing: false
  });

  const [profitRules, setProfitRules] = useState<ProfitRule[]>([
    {
      id: '1',
      name: 'Electronics High Margin',
      type: 'percentage',
      value: 25,
      applicableToCategories: ['Electronics', 'Mobile'],
      applicableToItems: [],
      minQuantity: 1,
      maxQuantity: 10,
      isActive: true,
      priority: 1
    },
    {
      id: '2',
      name: 'Bulk Sale Discount',
      type: 'percentage',
      value: 15,
      applicableToCategories: [],
      applicableToItems: [],
      minQuantity: 50,
      isActive: true,
      priority: 2
    },
    {
      id: '3',
      name: 'Premium Items Fixed',
      type: 'fixed_amount',
      value: 500,
      applicableToCategories: ['Premium'],
      applicableToItems: [],
      isActive: true,
      priority: 3
    }
  ]);

  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ProfitRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<ProfitRule>>({
    name: '',
    type: 'percentage',
    value: 0,
    applicableToCategories: [],
    applicableToItems: [],
    isActive: true,
    priority: profitRules.length + 1
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Profit settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all profit settings to default values?')) {
      setProfitSettings({
        defaultProfitMethod: 'percentage',
        defaultProfitValue: 20,
        allowNegativeProfit: false,
        profitRoundingMethod: 'round',
        profitDecimalPlaces: 2,
        autoCalculateSellingPrice: true,
        showProfitInVouchers: true,
        profitCalculationBase: 'cost_price',
        enableDynamicPricing: false,
        enableQuantityBasedProfit: false,
        enableCustomerGroupPricing: false
      });
      setProfitRules([]);
    }
  };

  const handleAddRule = () => {
    if (newRule.name && newRule.value !== undefined) {
      const rule: ProfitRule = {
        id: Date.now().toString(),
        name: newRule.name,
        type: newRule.type || 'percentage',
        value: newRule.value,
        applicableToCategories: newRule.applicableToCategories || [],
        applicableToItems: newRule.applicableToItems || [],
        minQuantity: newRule.minQuantity,
        maxQuantity: newRule.maxQuantity,
        isActive: newRule.isActive || true,
        priority: newRule.priority || profitRules.length + 1
      };
      setProfitRules([...profitRules, rule]);
      setNewRule({
        name: '',
        type: 'percentage',
        value: 0,
        applicableToCategories: [],
        applicableToItems: [],
        isActive: true,
        priority: profitRules.length + 2
      });
      setShowAddRuleModal(false);
    }
  };

  const handleEditRule = (rule: ProfitRule) => {
    setEditingRule(rule);
    setNewRule(rule);
    setShowAddRuleModal(true);
  };

  const handleUpdateRule = () => {
    if (editingRule && newRule.name && newRule.value !== undefined) {
      const updatedRules = profitRules.map(rule => 
        rule.id === editingRule.id 
          ? { ...rule, ...newRule } as ProfitRule
          : rule
      );
      setProfitRules(updatedRules);
      setEditingRule(null);
      setNewRule({
        name: '',
        type: 'percentage',
        value: 0,
        applicableToCategories: [],
        applicableToItems: [],
        isActive: true,
        priority: profitRules.length + 1
      });
      setShowAddRuleModal(false);
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    if (confirm('Are you sure you want to delete this profit rule?')) {
      setProfitRules(profitRules.filter(rule => rule.id !== ruleId));
    }
  };

  const toggleRuleActive = (ruleId: string) => {
    setProfitRules(profitRules.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <button
            title='Back to Config'
            type='button'
            onClick={() => navigate('/app/config')}
            className="mr-4 p-2 rounded-full hover:bg-gray-200"
          >
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-gray-900">Set Profit Configuration</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mt-1">Configure profit calculation methods and custom profit rules</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Default Profit Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Default Profit Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Profit Method</label>
              <select
                title="Default Profit Method"
                value={profitSettings.defaultProfitMethod}
                onChange={(e) => setProfitSettings({...profitSettings, defaultProfitMethod: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="percentage">Percentage on Cost</option>
                <option value="fixed_amount">Fixed Amount</option>
                <option value="markup">Markup on Cost</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Default Profit Value ({profitSettings.defaultProfitMethod === 'fixed_amount' ? '₹' : '%'})
              </label>
              <input
                title="Default Profit Value"
                type="number"
                step="0.01"
                value={profitSettings.defaultProfitValue}
                onChange={(e) => setProfitSettings({...profitSettings, defaultProfitValue: parseFloat(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Profit Calculation Base</label>
              <select
                title="Profit Calculation Base"
                value={profitSettings.profitCalculationBase}
                onChange={(e) => setProfitSettings({...profitSettings, profitCalculationBase: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="cost_price">Cost Price</option>
                <option value="last_purchase_price">Last Purchase Price</option>
                <option value="average_cost">Average Cost</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rounding Method</label>
                <select
                  title="Rounding Method"
                  value={profitSettings.profitRoundingMethod}
                  onChange={(e) => setProfitSettings({...profitSettings, profitRoundingMethod: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="round">Round</option>
                  <option value="floor">Round Down</option>
                  <option value="ceil">Round Up</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Decimal Places</label>
                <input
                  title="Decimal Places"
                  type="number"
                  min="0"
                  max="4"
                  value={profitSettings.profitDecimalPlaces}
                  onChange={(e) => setProfitSettings({...profitSettings, profitDecimalPlaces: parseInt(e.target.value) || 2})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calculator className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Advanced Profit Options</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Auto Calculate Selling Price</label>
              <input
                title="Auto Calculate Selling Price"
                type="checkbox"
                checked={profitSettings.autoCalculateSellingPrice}
                onChange={(e) => setProfitSettings({...profitSettings, autoCalculateSellingPrice: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Show Profit in Vouchers</label>
              <input
                title="Show Profit in Vouchers"
                type="checkbox"
                checked={profitSettings.showProfitInVouchers}
                onChange={(e) => setProfitSettings({...profitSettings, showProfitInVouchers: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Allow Negative Profit</label>
              <input
                title="Allow Negative Profit"
                type="checkbox"
                checked={profitSettings.allowNegativeProfit}
                onChange={(e) => setProfitSettings({...profitSettings, allowNegativeProfit: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable Dynamic Pricing</label>
              <input
                title="Enable Dynamic Pricing"
                type="checkbox"
                checked={profitSettings.enableDynamicPricing}
                onChange={(e) => setProfitSettings({...profitSettings, enableDynamicPricing: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Quantity Based Profit</label>
              <input
                title="Quantity Based Profit"
                type="checkbox"
                checked={profitSettings.enableQuantityBasedProfit}
                onChange={(e) => setProfitSettings({...profitSettings, enableQuantityBasedProfit: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Customer Group Pricing</label>
              <input
                title="Customer Group Pricing"
                type="checkbox"
                checked={profitSettings.enableCustomerGroupPricing}
                onChange={(e) => setProfitSettings({...profitSettings, enableCustomerGroupPricing: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Profit Rules Section */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Percent className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Custom Profit Rules</h3>
          </div>
          <button
            onClick={() => setShowAddRuleModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Rule</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Priority</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Rule Name</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Value</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Categories</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Quantity Range</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {profitRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{rule.priority}</td>
                  <td className="border border-gray-300 px-4 py-2 font-medium">{rule.name}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      rule.type === 'percentage' ? 'bg-blue-100 text-blue-800' :
                      rule.type === 'fixed_amount' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {rule.type === 'percentage' ? 'Percentage' : 
                       rule.type === 'fixed_amount' ? 'Fixed Amount' : 'Markup'}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {rule.type === 'fixed_amount' ? '₹' : ''}{rule.value}{rule.type !== 'fixed_amount' ? '%' : ''}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {rule.applicableToCategories.length > 0 ? rule.applicableToCategories.join(', ') : 'All'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {rule.minQuantity || rule.maxQuantity ? 
                      `${rule.minQuantity || 0} - ${rule.maxQuantity || '∞'}` : 'Any'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <button
                      onClick={() => toggleRuleActive(rule.id)}
                      className={`px-2 py-1 rounded-full text-xs ${
                        rule.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditRule(rule)}
                        className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                        title="Edit Rule"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1 text-red-600 hover:bg-red-100 rounded"
                        title="Delete Rule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Rule Modal */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {editingRule ? 'Edit Profit Rule' : 'Add New Profit Rule'}
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rule Name</label>
                <input
                  title="Rule Name"
                  type="text"
                  value={newRule.name || ''}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter rule name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profit Type</label>
                <select
                  title="Profit Type"
                  value={newRule.type || 'percentage'}
                  onChange={(e) => setNewRule({...newRule, type: e.target.value as 'percentage' | 'fixed_amount' | 'markup'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed_amount">Fixed Amount</option>
                  <option value="markup">Markup</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profit Value ({newRule.type === 'fixed_amount' ? '₹' : '%'})
                </label>
                <input
                  title="Profit Value"
                  type="number"
                  step="0.01"
                  value={newRule.value || 0}
                  onChange={(e) => setNewRule({...newRule, value: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <input
                  title="Priority"
                  type="number"
                  min="1"
                  value={newRule.priority || 1}
                  onChange={(e) => setNewRule({...newRule, priority: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Quantity</label>
                <input
                  title="Min Quantity"
                  type="number"
                  min="0"
                  value={newRule.minQuantity || ''}
                  onChange={(e) => setNewRule({...newRule, minQuantity: parseInt(e.target.value) || undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Quantity</label>
                <input
                  title="Max Quantity"
                  type="number"
                  min="0"
                  value={newRule.maxQuantity || ''}
                  onChange={(e) => setNewRule({...newRule, maxQuantity: parseInt(e.target.value) || undefined})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Applicable Categories (comma separated)</label>
              <input
                title="Applicable Categories"
                type="text"
                value={newRule.applicableToCategories?.join(', ') || ''}
                onChange={(e) => setNewRule({...newRule, applicableToCategories: e.target.value.split(',').map(s => s.trim()).filter(s => s)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Electronics, Mobile, etc."
              />
            </div>

            <div className="flex items-center mt-4">
              <input
                title="Is Active"
                type="checkbox"
                checked={newRule.isActive || false}
                onChange={(e) => setNewRule({...newRule, isActive: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-2"
              />
              <label className="text-sm font-medium text-gray-700">Active</label>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowAddRuleModal(false);
                  setEditingRule(null);
                  setNewRule({
                    name: '',
                    type: 'percentage',
                    value: 0,
                    applicableToCategories: [],
                    applicableToItems: [],
                    isActive: true,
                    priority: profitRules.length + 1
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingRule ? handleUpdateRule : handleAddRule}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingRule ? 'Update Rule' : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profit Calculation Examples */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <DollarSign className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">Profit Calculation Examples</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Percentage Method</h4>
            <p className="text-gray-600">Cost Price: ₹1000</p>
            <p className="text-gray-600">Profit: 20%</p>
            <p className="font-medium text-green-600">Selling Price: ₹1200</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Fixed Amount Method</h4>
            <p className="text-gray-600">Cost Price: ₹1000</p>
            <p className="text-gray-600">Profit: ₹300</p>
            <p className="font-medium text-green-600">Selling Price: ₹1300</p>
          </div>
          
          <div className="bg-white p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Markup Method</h4>
            <p className="text-gray-600">Cost Price: ₹1000</p>
            <p className="text-gray-600">Markup: 25%</p>
            <p className="font-medium text-green-600">Selling Price: ₹1250</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SetProfit;
