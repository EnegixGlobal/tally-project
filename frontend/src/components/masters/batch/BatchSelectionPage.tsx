import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Package, AlertTriangle, Plus, Edit, Trash2, Eye } from 'lucide-react';

interface BatchSelectionPageProps {
  stockItemId?: string;
  selectedBatch?: string;
  onBatchSelect?: (batchNumber: string, expiryDate?: string, manufacturingDate?: string) => void;
  showExpiry?: boolean;
  required?: boolean;
  error?: string;
}

const BatchSelectionPage: React.FC<BatchSelectionPageProps> = ({
  stockItemId: propStockItemId,
  selectedBatch = '',
  onBatchSelect,
  showExpiry = true,
  required = false,
  error
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme, stockItems } = useAppContext();
  
  // Use stockItemId from props or URL params
  const stockItemId = propStockItemId || id || '';
  
  const [newBatchName, setNewBatchName] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newManufacturingDate, setNewManufacturingDate] = useState('');
  const [showNewBatchForm, setShowNewBatchForm] = useState(false);

  // Find stock item
  const stockItem = stockItems.find(item => item.id === stockItemId);
  
  if (!stockItem) {
    return (
      <div className={`p-4 rounded-lg border ${
        theme === 'dark' 
          ? 'bg-gray-800 border-gray-700 text-gray-300' 
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        <p>Stock item not found</p>
        {propStockItemId ? null : (
          <button 
            onClick={() => navigate('/app/masters/stock-item')}
            className="mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            Go back to Stock Items
          </button>
        )}
      </div>
    );
  }

  // Get batches for this stock item (mock data for now)
  const batches = [
    {
      id: '1',
      batchNumber: 'BATCH001',
      manufacturingDate: '2024-01-15',
      expiryDate: '2024-07-15',
      quantity: 100,
      availableQuantity: 85,
      costPrice: 50.00,
      mrp: 75.00
    },
    {
      id: '2', 
      batchNumber: 'BATCH002',
      manufacturingDate: '2024-02-01',
      expiryDate: '2024-08-01',
      quantity: 150,
      availableQuantity: 120,
      costPrice: 48.00,
      mrp: 75.00
    },
    {
      id: '3',
      batchNumber: 'BATCH003',
      manufacturingDate: '2024-03-10',
      expiryDate: '2024-09-10',
      quantity: 200,
      availableQuantity: 200,
      costPrice: 52.00,
      mrp: 75.00
    }
  ];

  interface BatchType {
    id: string;
    batchNumber: string;
    manufacturingDate: string;
    expiryDate: string;
    quantity: number;
    availableQuantity: number;
    costPrice: number;
    mrp: number;
  }

  const handleBatchSelect = (batch: BatchType) => {
    if (onBatchSelect) {
      onBatchSelect(batch.batchNumber, batch.expiryDate, batch.manufacturingDate);
    }
  };

  const handleNewBatchCreate = () => {
    if (newBatchName.trim()) {
      // Here you would typically save to backend
      const newBatch = {
        batchNumber: newBatchName,
        expiryDate: newExpiryDate,
        manufacturingDate: newManufacturingDate
      };
      
      if (onBatchSelect) {
        onBatchSelect(newBatch.batchNumber, newBatch.expiryDate, newBatch.manufacturingDate);
      }
      
      // Reset form
      setNewBatchName('');
      setNewExpiryDate('');
      setNewManufacturingDate('');
      setShowNewBatchForm(false);
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  return (
    <div className={`space-y-6 p-6 rounded-lg border ${
      theme === 'dark' 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-xl font-semibold ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Batch Selection - {stockItem.name}
          </h2>
          <p className={`text-sm ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
          }`}>
            Select or create a batch for this stock item
          </p>
        </div>
        
        <button
          onClick={() => setShowNewBatchForm(!showNewBatchForm)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            theme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 border-blue-600 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          New Batch
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className={`p-3 rounded-lg border ${
          theme === 'dark'
            ? 'bg-red-900/20 border-red-700 text-red-400'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {error}
        </div>
      )}

      {/* New Batch Form */}
      {showNewBatchForm && (
        <div className={`p-4 rounded-lg border ${
          theme === 'dark'
            ? 'bg-gray-700 border-gray-600'
            : 'bg-gray-50 border-gray-200'
        }`}>
          <h3 className={`text-lg font-medium mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-900'
          }`}>
            Create New Batch
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Batch Number {required && <span className="text-red-500">*</span>}
              </label>
              <input
                type="text"
                value={newBatchName}
                onChange={(e) => setNewBatchName(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter batch number"
                title="Batch Number"
              />
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Manufacturing Date
              </label>
              <input
                type="date"
                value={newManufacturingDate}
                onChange={(e) => setNewManufacturingDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-800 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                title="Manufacturing Date"
              />
            </div>
            
            {showExpiry && (
              <div>
                <label className={`block text-sm font-medium mb-2 ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                  title="Expiry Date"
                />
              </div>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleNewBatchCreate}
              disabled={!newBatchName.trim()}
              className={`px-4 py-2 rounded-lg font-medium ${
                !newBatchName.trim()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : theme === 'dark'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              Create Batch
            </button>
            <button
              onClick={() => setShowNewBatchForm(false)}
              className={`px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Batch Selection */}
      <div className="space-y-4">
        <h3 className={`text-lg font-medium ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>
          Available Batches
        </h3>
        
        {batches.length === 0 ? (
          <div className={`text-center py-8 ${
            theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No batches available for this item</p>
            <p className="text-sm">Create a new batch to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {batches.map((batch) => (
              <div
                key={batch.id}
                className={`p-4 rounded-lg border cursor-pointer transition-all ${
                  selectedBatch === batch.batchNumber
                    ? theme === 'dark'
                      ? 'border-blue-500 bg-blue-900/20'
                      : 'border-blue-500 bg-blue-50'
                    : theme === 'dark'
                    ? 'border-gray-600 hover:border-gray-500 bg-gray-700'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => handleBatchSelect(batch)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>
                        {batch.batchNumber}
                      </h4>
                      
                      {isExpired(batch.expiryDate) && (
                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Expired
                        </span>
                      )}
                      
                      {isExpiringSoon(batch.expiryDate) && !isExpired(batch.expiryDate) && (
                        <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Expiring Soon
                        </span>
                      )}
                      
                      {selectedBatch === batch.batchNumber && (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                          Selected
                        </span>
                      )}
                    </div>
                    
                    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ${
                      theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      <div>
                        <span className="font-medium">Manufacturing:</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(batch.manufacturingDate).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {showExpiry && (
                        <div>
                          <span className="font-medium">Expiry:</span>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(batch.expiryDate).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium">Available:</span>
                        <div>{batch.availableQuantity} / {batch.quantity}</div>
                      </div>
                      
                      <div>
                        <span className="font-medium">Cost Price:</span>
                        <div>₹{batch.costPrice.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle view batch details
                      }}
                      className={`p-2 rounded-lg ${
                        theme === 'dark'
                          ? 'hover:bg-gray-600 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit batch
                      }}
                      className={`p-2 rounded-lg ${
                        theme === 'dark'
                          ? 'hover:bg-gray-600 text-gray-400'
                          : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Edit Batch"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle delete batch
                      }}
                      className={`p-2 rounded-lg ${
                        theme === 'dark'
                          ? 'hover:bg-red-900 text-red-400'
                          : 'hover:bg-red-100 text-red-500'
                      }`}
                      title="Delete Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Batch Information Summary */}
      {selectedBatch && (
        <div className={`p-4 rounded-lg border ${
          theme === 'dark'
            ? 'bg-green-900/20 border-green-700'
            : 'bg-green-50 border-green-200'
        }`}>
          <h4 className={`font-medium mb-2 ${
            theme === 'dark' ? 'text-green-400' : 'text-green-800'
          }`}>
            Selected Batch Information
          </h4>
          
          {(() => {
            const batch = batches.find(b => b.batchNumber === selectedBatch);
            if (!batch) return null;
            
            return (
              <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 text-sm ${
                theme === 'dark' ? 'text-green-300' : 'text-green-700'
              }`}>
                <div>
                  <span className="font-medium">Batch:</span>
                  <div>{batch.batchNumber}</div>
                </div>
                <div>
                  <span className="font-medium">Available Qty:</span>
                  <div>{batch.availableQuantity}</div>
                </div>
                <div>
                  <span className="font-medium">Cost Price:</span>
                  <div>₹{batch.costPrice.toFixed(2)}</div>
                </div>
                <div>
                  <span className="font-medium">MRP:</span>
                  <div>₹{batch.mrp.toFixed(2)}</div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Navigation */}
      {!propStockItemId && (
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/app/masters/stock-item')}
            className={`px-4 py-2 rounded-lg border ${
              theme === 'dark'
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Back to Stock Items
          </button>
          
          <button
            onClick={() => navigate('/app/masters/stock-item/batches')}
            className={`px-4 py-2 rounded-lg ${
              theme === 'dark'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            View All Batches
          </button>
        </div>
      )}
    </div>
  );
};

export default BatchSelectionPage;
