import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import { ArrowLeft, Calendar, AlertTriangle, Package, Search, Filter } from 'lucide-react';

interface BatchInfo {
  id: string;
  name: string; // batchNumber
  expiryDate?: string;
  manufacturingDate?: string;
  stockItemId: string;
  stockItemName: string;
  stockUnit: string;
  currentStock: number;
  daysToExpiry: number;
  status: 'active' | 'expiring' | 'expired';
}

interface StockItem {
  id: string;
  name: string;
  unit: string;
  openingBalance: number;
  enableBatchTracking: boolean;
  batchNumber?: string;
  batchExpiryDate?: string;
  batchManufacturingDate?: string;
  // other fields omitted for brevity
}

const BatchList: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expiring' | 'expired'>('all');
  const [filterStockItem, setFilterStockItem] = useState('');

  // Fetch stock items on mount
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('http://localhost:5000/api/stock-items')
      .then(res => res.json())
      .then(json => {
        if (isMounted) {
          if (json.success) setStockItems(json.data);
          else setStockItems([]);
        }
      })
      .catch(() => {
        if (isMounted) setStockItems([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  // Construct batches from stock items
  const allBatches = useMemo(() => {
    const batches: BatchInfo[] = [];

    stockItems.forEach(item => {
      // if (item.enableBatchTracking && item.batchNumber) {
      if (item.batchNumber) {

        const today = new Date();
        const expiryDate = item.batchExpiryDate ? new Date(item.batchExpiryDate) : null;

        let daysToExpiry = 0;
        let status: 'active' | 'expiring' | 'expired' = 'active';

        if (expiryDate) {
          const diffTime = expiryDate.getTime() - today.getTime();
          daysToExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (daysToExpiry < 0) status = 'expired';
          else if (daysToExpiry <= 30) status = 'expiring';
        }

        batches.push({
          id: item.id,
          name: item.batchNumber,
          expiryDate: item.batchExpiryDate,
          manufacturingDate: item.batchManufacturingDate,
          stockItemId: item.id,
          stockItemName: item.name,
          stockUnit: item.unit,
          currentStock: item.openingBalance || 0,
          daysToExpiry,
          status,
        });
      }
    });

    return batches;
  }, [stockItems]);

  // Filter batches based on search and filters
  const filteredBatches = useMemo(() => {
    return allBatches.filter(batch => {
      const matchesSearch =
        batch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.stockItemName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'all' || batch.status === filterStatus;
      const matchesStockItem = !filterStockItem || batch.stockItemId === filterStockItem;

      return matchesSearch && matchesStatus && matchesStockItem;
    });
  }, [allBatches, searchTerm, filterStatus, filterStockItem]);

  // Statistics
  const stats = useMemo(() => ({
    total: allBatches.length,
    active: allBatches.filter(b => b.status === 'active').length,
    expiring: allBatches.filter(b => b.status === 'expiring').length,
    expired: allBatches.filter(b => b.status === 'expired').length
  }), [allBatches]);

  // Utility functions for UI
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expiring': return 'bg-yellow-100 text-yellow-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Package size={16} className="text-green-600" />;
      case 'expiring': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'expired': return <AlertTriangle size={16} className="text-red-600" />;
      default: return <Package size={16} className="text-gray-600" />;
    }
  };

  if (loading) {
    return <div className="pt-[56px] px-4">Loading...</div>;
  }

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/masters/stock-item')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Batch Management</h1>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center">
            <Package size={24} className="text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Total Batches</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center">
            <Package size={24} className="text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center">
            <AlertTriangle size={24} className="text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expiring}</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <div className="flex items-center">
            <AlertTriangle size={24} className="text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Expired</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className={`p-4 rounded-lg mb-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              <Search size={16} className="inline mr-1" />
              Search
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search batch or item name..."
              className={`w-full p-2 rounded border ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'
              } outline-none transition-colors`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <Filter size={16} className="inline mr-1" />
              Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'all' | 'active' | 'expiring' | 'expired')}
              title="Filter by Status"
              className={`w-full p-2 rounded border ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'
              } outline-none transition-colors`}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              <Package size={16} className="inline mr-1" />
              Stock Item
            </label>
            <select
              value={filterStockItem}
              onChange={(e) => setFilterStockItem(e.target.value)}
              title="Filter by Stock Item"
              className={`w-full p-2 rounded border ${
                theme === 'dark' ? 'bg-gray-700 border-gray-600 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'
              } outline-none transition-colors`}
            >
              <option value="">All Items</option>
              {stockItems
                .filter((item) => item.enableBatchTracking)
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterStockItem('');
              }}
              className={`w-full px-4 py-2 rounded ${
                theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Batch List */}
      <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Batch Details</h2>
            <span className="text-sm text-gray-500">
              Showing {filteredBatches.length} of {stats.total} batches
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Batch Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Stock Item</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Current Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Manufacturing Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Expiry Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Days to Expiry</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No batches found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => (
                  <tr
                    key={`${batch.stockItemId}-${batch.id}`}
                    className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(batch.status)}
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(batch.status)}`}>
                          {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap font-medium">{batch.name}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium">{batch.stockItemName}</div>
                        <div className="text-sm text-gray-500">Unit: {batch.stockUnit}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {batch.currentStock.toLocaleString()} {batch.stockUnit}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-400" />
                        {batch.manufacturingDate ? new Date(batch.manufacturingDate).toLocaleDateString() : 'Not specified'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-1 text-gray-400" />
                        {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : 'No expiry'}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {batch.expiryDate ? (
                        <span
                          className={`font-medium ${
                            batch.status === 'expired'
                              ? 'text-red-600'
                              : batch.status === 'expiring'
                              ? 'text-yellow-600'
                              : 'text-green-600'
                          }`}
                        >
                          {batch.daysToExpiry < 0
                            ? `Expired ${Math.abs(batch.daysToExpiry)} days ago`
                            : `${batch.daysToExpiry} days`}
                        </span>
                      ) : (
                        <span className="text-gray-500">No expiry</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchList;
