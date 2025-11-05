import React, { useState } from 'react';
import { Package, Save, RefreshCw, ArrowLeft, TrendingUp, Calendar, AlertTriangle, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FifoSettings {
  enableFifoForAllItems: boolean;
  enableFifoForCategories: string[];
  enableFifoForSpecificItems: string[];
  fifoCalculationMethod: 'strict_fifo' | 'weighted_average' | 'batch_wise';
  considerExpiryInFifo: boolean;
  autoAdjustNegativeStock: boolean;
  showFifoDetailsInReports: boolean;
  enableFifoForSales: boolean;
  enableFifoForConsumption: boolean;
  enableFifoForTransfers: boolean;
  fifoRoundingPrecision: number;
  treatZeroStockAs: 'error' | 'warning' | 'allow';
  enableBackdatedTransactions: boolean;
  fifoRevaluationMethod: 'automatic' | 'manual' | 'monthly';
}

interface FifoTransaction {
  id: string;
  date: string;
  type: 'purchase' | 'sale' | 'adjustment';
  itemCode: string;
  itemName: string;
  quantity: number;
  rate: number;
  batchNumber?: string;
  expiryDate?: string;
  remainingQuantity: number;
  isConsumed: boolean;
}

const SalesByFifo: React.FC = () => {
  const navigate = useNavigate();
  
  const [fifoSettings, setFifoSettings] = useState<FifoSettings>({
    enableFifoForAllItems: true,
    enableFifoForCategories: ['Electronics', 'Medicines', 'Perishables'],
    enableFifoForSpecificItems: [],
    fifoCalculationMethod: 'strict_fifo',
    considerExpiryInFifo: true,
    autoAdjustNegativeStock: false,
    showFifoDetailsInReports: true,
    enableFifoForSales: true,
    enableFifoForConsumption: true,
    enableFifoForTransfers: true,
    fifoRoundingPrecision: 2,
    treatZeroStockAs: 'warning',
    enableBackdatedTransactions: false,
    fifoRevaluationMethod: 'automatic'
  });

  const [fifoTransactions] = useState<FifoTransaction[]>([
    {
      id: '1',
      date: '2024-01-15',
      type: 'purchase',
      itemCode: 'ITM001',
      itemName: 'Laptop HP',
      quantity: 10,
      rate: 45000,
      batchNumber: 'BATCH001',
      remainingQuantity: 7,
      isConsumed: false
    },
    {
      id: '2',
      date: '2024-01-20',
      type: 'purchase',
      itemCode: 'ITM001',
      itemName: 'Laptop HP',
      quantity: 15,
      rate: 46000,
      batchNumber: 'BATCH002',
      remainingQuantity: 15,
      isConsumed: false
    },
    {
      id: '3',
      date: '2024-01-25',
      type: 'sale',
      itemCode: 'ITM001',
      itemName: 'Laptop HP',
      quantity: 3,
      rate: 45000,
      batchNumber: 'BATCH001',
      remainingQuantity: 0,
      isConsumed: true
    },
    {
      id: '4',
      date: '2024-02-01',
      type: 'purchase',
      itemCode: 'ITM002',
      itemName: 'Medicine XYZ',
      quantity: 100,
      rate: 150,
      batchNumber: 'MED001',
      expiryDate: '2024-12-31',
      remainingQuantity: 85,
      isConsumed: false
    },
    {
      id: '5',
      date: '2024-02-05',
      type: 'sale',
      itemCode: 'ITM002',
      itemName: 'Medicine XYZ',
      quantity: 15,
      rate: 150,
      batchNumber: 'MED001',
      remainingQuantity: 0,
      isConsumed: true
    }
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('FIFO settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all FIFO settings to default values?')) {
      setFifoSettings({
        enableFifoForAllItems: true,
        enableFifoForCategories: [],
        enableFifoForSpecificItems: [],
        fifoCalculationMethod: 'strict_fifo',
        considerExpiryInFifo: true,
        autoAdjustNegativeStock: false,
        showFifoDetailsInReports: true,
        enableFifoForSales: true,
        enableFifoForConsumption: true,
        enableFifoForTransfers: true,
        fifoRoundingPrecision: 2,
        treatZeroStockAs: 'warning',
        enableBackdatedTransactions: false,
        fifoRevaluationMethod: 'automatic'
      });
    }
  };

  const addCategory = () => {
    if (newCategory.trim() && !fifoSettings.enableFifoForCategories.includes(newCategory.trim())) {
      setFifoSettings({
        ...fifoSettings,
        enableFifoForCategories: [...fifoSettings.enableFifoForCategories, newCategory.trim()]
      });
      setNewCategory('');
    }
  };

  const removeCategory = (category: string) => {
    setFifoSettings({
      ...fifoSettings,
      enableFifoForCategories: fifoSettings.enableFifoForCategories.filter(cat => cat !== category)
    });
  };

  const calculateFifoValue = () => {
    const purchaseTransactions = fifoTransactions.filter(t => t.type === 'purchase' && t.remainingQuantity > 0);
    return purchaseTransactions.reduce((total, transaction) => {
      return total + (transaction.remainingQuantity * transaction.rate);
    }, 0);
  };

  const calculateOldestStock = () => {
    const purchaseTransactions = fifoTransactions
      .filter(t => t.type === 'purchase' && t.remainingQuantity > 0)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return purchaseTransactions[0] || null;
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
          <h2 className="text-xl font-semibold text-gray-900">Sales by FIFO Configuration</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mt-1">Configure First-In-First-Out (FIFO) inventory valuation and cost calculation</p>
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
        {/* FIFO Basic Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">FIFO Basic Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable FIFO for All Items</label>
              <input
                title="Enable FIFO for All Items"
                type="checkbox"
                checked={fifoSettings.enableFifoForAllItems}
                onChange={(e) => setFifoSettings({...fifoSettings, enableFifoForAllItems: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">FIFO Calculation Method</label>
              <select
                title="FIFO Calculation Method"
                value={fifoSettings.fifoCalculationMethod}
                onChange={(e) => setFifoSettings({...fifoSettings, fifoCalculationMethod: e.target.value as 'strict_fifo' | 'weighted_average' | 'batch_wise'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="strict_fifo">Strict FIFO</option>
                <option value="weighted_average">Weighted Average</option>
                <option value="batch_wise">Batch Wise FIFO</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zero Stock Treatment</label>
              <select
                title="Zero Stock Treatment"
                value={fifoSettings.treatZeroStockAs}
                onChange={(e) => setFifoSettings({...fifoSettings, treatZeroStockAs: e.target.value as 'error' | 'warning' | 'allow'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="error">Show Error</option>
                <option value="warning">Show Warning</option>
                <option value="allow">Allow Transaction</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rounding Precision</label>
              <input
                title="Rounding Precision"
                type="number"
                min="0"
                max="6"
                value={fifoSettings.fifoRoundingPrecision}
                onChange={(e) => setFifoSettings({...fifoSettings, fifoRoundingPrecision: parseInt(e.target.value) || 2})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Revaluation Method</label>
              <select
                title="Revaluation Method"
                value={fifoSettings.fifoRevaluationMethod}
                onChange={(e) => setFifoSettings({...fifoSettings, fifoRevaluationMethod: e.target.value as 'automatic' | 'manual' | 'monthly'})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Advanced FIFO Options */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Advanced FIFO Options</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Consider Expiry in FIFO</label>
              <input
                title="Consider Expiry in FIFO"
                type="checkbox"
                checked={fifoSettings.considerExpiryInFifo}
                onChange={(e) => setFifoSettings({...fifoSettings, considerExpiryInFifo: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Auto Adjust Negative Stock</label>
              <input
                title="Auto Adjust Negative Stock"
                type="checkbox"
                checked={fifoSettings.autoAdjustNegativeStock}
                onChange={(e) => setFifoSettings({...fifoSettings, autoAdjustNegativeStock: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Show FIFO Details in Reports</label>
              <input
                title="Show FIFO Details in Reports"
                type="checkbox"
                checked={fifoSettings.showFifoDetailsInReports}
                onChange={(e) => setFifoSettings({...fifoSettings, showFifoDetailsInReports: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable FIFO for Sales</label>
              <input
                title="Enable FIFO for Sales"
                type="checkbox"
                checked={fifoSettings.enableFifoForSales}
                onChange={(e) => setFifoSettings({...fifoSettings, enableFifoForSales: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable FIFO for Consumption</label>
              <input
                title="Enable FIFO for Consumption"
                type="checkbox"
                checked={fifoSettings.enableFifoForConsumption}
                onChange={(e) => setFifoSettings({...fifoSettings, enableFifoForConsumption: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable FIFO for Transfers</label>
              <input
                title="Enable FIFO for Transfers"
                type="checkbox"
                checked={fifoSettings.enableFifoForTransfers}
                onChange={(e) => setFifoSettings({...fifoSettings, enableFifoForTransfers: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Enable Backdated Transactions</label>
              <input
                title="Enable Backdated Transactions"
                type="checkbox"
                checked={fifoSettings.enableBackdatedTransactions}
                onChange={(e) => setFifoSettings({...fifoSettings, enableBackdatedTransactions: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FIFO Categories Management */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">FIFO Category Management</h3>
        </div>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <input
              title="New Category"
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter category name"
            />
            <button
              onClick={addCategory}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Add Category
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {fifoSettings.enableFifoForCategories.map((category, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
              >
                {category}
                <button
                  onClick={() => removeCategory(category)}
                  className="ml-2 text-purple-600 hover:text-purple-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FIFO Transaction Log */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Calendar className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">FIFO Transaction Log</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Type</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Item</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Batch</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Quantity</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Rate</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Remaining</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {fifoTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-4 py-2">{new Date(transaction.date).toLocaleDateString()}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      transaction.type === 'purchase' ? 'bg-green-100 text-green-800' :
                      transaction.type === 'sale' ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <div>
                      <div className="font-medium">{transaction.itemName}</div>
                      <div className="text-sm text-gray-500">{transaction.itemCode}</div>
                    </div>
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{transaction.batchNumber || '-'}</td>
                  <td className="border border-gray-300 px-4 py-2">{transaction.quantity}</td>
                  <td className="border border-gray-300 px-4 py-2">₹{transaction.rate.toLocaleString()}</td>
                  <td className="border border-gray-300 px-4 py-2">{transaction.remainingQuantity}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {transaction.isConsumed ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Consumed</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIFO Summary Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-blue-900">Total FIFO Value</h4>
          </div>
          <p className="text-2xl font-bold text-blue-600">₹{calculateFifoValue().toLocaleString()}</p>
          <p className="text-sm text-blue-700">Current inventory value based on FIFO</p>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <h4 className="text-lg font-semibold text-orange-900">Oldest Stock</h4>
          </div>
          {(() => {
            const oldest = calculateOldestStock();
            return oldest ? (
              <>
                <p className="text-lg font-bold text-orange-600">{oldest.itemName}</p>
                <p className="text-sm text-orange-700">Date: {new Date(oldest.date).toLocaleDateString()}</p>
                <p className="text-sm text-orange-700">Qty: {oldest.remainingQuantity}</p>
              </>
            ) : (
              <p className="text-sm text-orange-700">No stock available</p>
            );
          })()}
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h4 className="text-lg font-semibold text-red-900">FIFO Alerts</h4>
          </div>
          <p className="text-lg font-bold text-red-600">2 Items</p>
          <p className="text-sm text-red-700">Require attention for FIFO compliance</p>
        </div>
      </div>

      {/* FIFO Calculation Examples */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-semibold text-green-900">FIFO Calculation Example</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Purchase History</h4>
            <div className="space-y-1">
              <p>1. Jan 15: 10 units @ ₹100 each</p>
              <p>2. Jan 20: 15 units @ ₹110 each</p>
              <p>3. Jan 25: 20 units @ ₹120 each</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Sale on Jan 30: 25 units</h4>
            <div className="space-y-1">
              <p>Cost calculation (FIFO):</p>
              <p>10 units @ ₹100 = ₹1,000</p>
              <p>15 units @ ₹110 = ₹1,650</p>
              <p className="font-medium text-green-600">Total Cost: ₹2,650</p>
              <p className="font-medium text-green-600">Average Cost: ₹106 per unit</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesByFifo;
