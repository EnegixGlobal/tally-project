import React from 'react';
import type { StockGroup, StockItem, Godown } from '../../types';

interface FilterPanelProps {
  theme: 'light' | 'dark';
  show: boolean;
  onToggle: () => void;
  filters: {
    fromDate: string;
    toDate: string;
    stockGroupId: string;
    stockItemId: string;
    godownId: string;
    batchId: string;
    period: 'Daily' | 'Weekly' | 'Fortnightly' | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';
    basis: 'Quantity' | 'Value' | 'Cost';
    showProfit: boolean;
  };
  onFilterChange: (filters: FilterPanelProps['filters']) => void;
  stockGroups: StockGroup[];
  stockItems: StockItem[];
  godowns: Godown[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  theme,
  show,
  onToggle,
  filters,
  onFilterChange,
  stockGroups,
  stockItems,
  godowns,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    onFilterChange({ ...filters, [name]: checked });
  };

  return (
    <div className={`p-4 mb-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'} ${show ? '' : 'hidden'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Filters</h3>
        <button
          onClick={onToggle}
          className={`px-3 py-1 rounded text-sm ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          aria-label="Toggle filter panel"
        >
          Hide Filters
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="fromDate" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            From Date
          </label>
          <input
            id="fromDate"
            type="date"
            name="fromDate"
            value={filters.fromDate}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            aria-label="Select from date"
            title="Select from date"
          />
        </div>
        <div>
          <label htmlFor="toDate" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            To Date
          </label>
          <input
            id="toDate"
            type="date"
            name="toDate"
            value={filters.toDate}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            aria-label="Select to date"
            title="Select to date"
          />
        </div>
        <div>
          <label htmlFor="period" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Period
          </label>
          <select
            id="period"
            name="period"
            value={filters.period}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            aria-label="Select period"
            title="Select period"
          >
            <option value="Daily">Daily</option>
            <option value="Weekly">Weekly</option>
            <option value="Fortnightly">Fortnightly</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Half-Yearly">Half-Yearly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label htmlFor="stockGroupId" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Stock Group
          </label>
          <select
            id="stockGroupId"
            name="stockGroupId"
            value={filters.stockGroupId}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            aria-label="Select stock group"
            title="Select stock group"
          >
            <option value="">All Groups</option>
            {stockGroups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stockItemId" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Stock Item
          </label>
          <select
            id="stockItemId"
            name="stockItemId"
            value={filters.stockItemId}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            aria-label="Select stock item"
            title="Select stock item"
          >
            <option value="">All Items</option>
            {stockItems
              .filter(item => !filters.stockGroupId || item.stockGroupId === filters.stockGroupId)
              .map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="godownId" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Godown
          </label>
          <select
            id="godownId"
            name="godownId"
            value={filters.godownId}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            aria-label="Select godown"
            title="Select godown"
          >
            <option value="">All Godowns</option>
            {godowns.map(godown => (
              <option key={godown.id} value={godown.id}>{godown.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="batchId" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Batch
          </label>
          <select
            id="batchId"
            name="batchId"
            value={filters.batchId}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            aria-label="Select batch"
            title="Select batch"
          >
            <option value="">All Batches</option>
            {stockItems
              .find(item => item.id === filters.stockItemId)
              ?.batchDetails?.map(batch => (
                <option key={batch.id} value={batch.id}>{batch.name}</option>
              ))}
          </select>
        </div>
        <div>
          <label htmlFor="basis" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Basis of Values
          </label>
          <select
            id="basis"
            name="basis"
            value={filters.basis}
            onChange={handleChange}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'}`}
            aria-label="Select basis of values"
            title="Select basis of values"
          >
            <option value="Quantity">Quantity</option>
            <option value="Value">Value</option>
            <option value="Cost">Cost</option>
          </select>
        </div>
        <div>
          <label htmlFor="showProfit" className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            Show Profit
          </label>
          <input
            id="showProfit"
            type="checkbox"
            name="showProfit"
            checked={filters.showProfit}
            onChange={handleCheckboxChange}
            className={`p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            aria-label="Toggle show profit"
            title="Toggle show profit"
          />
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;