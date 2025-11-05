import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Printer, Download, Filter } from 'lucide-react';

interface MovementEntry {
  date: string;
  stockItemId: number | string;
  stockItemName: string;
  voucherType: string;
  voucherNumber: string;
  inwardQty: number;
  outwardQty: number;
  rate: number;
  value: number;
}

const MovementAnalysis: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation(); // For receiving state from navigation if needed
  const params = useParams<{ id?: string }>(); // if you want to get query param or param id

  // You may have filter states here
  const [fromDate, setFromDate] = useState(() => {
    // Default to start of financial year or some default, e.g., 6 months ago
    const fd = new Date();
    fd.setMonth(fd.getMonth() - 6);
    return fd.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [stockItemId, setStockItemId] = useState<string | undefined>(undefined);

  const [data, setData] = useState<MovementEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate stockItemId from navigation state or query param if needed
  useEffect(() => {
    // Option 1: Try loading from location state
    if (location.state && (location.state as any).stockItemId) {
      setStockItemId((location.state as any).stockItemId);
    }

    // Option 2: Try from params or query string (adapt as per your routing)
    if (params.id) {
      setStockItemId(params.id);
    }
  }, [location.state, params.id]);

  useEffect(() => {
    const fetchMovementData = async () => {
      setLoading(true);
      setError(null);
      const companyId = localStorage.getItem('company_id') || '';
      const ownerType = localStorage.getItem('userType') || '';
      const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id') || '';

        if (!companyId || !ownerType || !ownerId) {
              setError("Missing tenant information.");
              setLoading(false);
              return;
            }
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("companyId", companyId);
        queryParams.append("ownerType", ownerType);
        queryParams.append("ownerId", ownerId);
        if (fromDate) queryParams.append('fromDate', fromDate);
        if (toDate) queryParams.append('toDate', toDate);
        if (stockItemId) queryParams.append('stockItemId', stockItemId);

        const url = `http://localhost:5000/api/movement-analysis?${queryParams.toString()}`;
        const response = await fetch(url);

        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || 'Failed to load movement data');
        }

        const result: MovementEntry[] = await response.json();
        setData(result);
      } catch (e: any) {
        setError(e.message || 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMovementData();
  }, [fromDate, toDate, stockItemId]);


  return (
    <div className="pt-[56px] px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          type="button"
          title="Back to Reports"
          onClick={() => navigate('/app/reports')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Movement Analysis</h1>
        <div className="ml-auto flex gap-2">
          <button
            title="Toggle Filters"
            type="button"
            onClick={() => alert('Filter panel not implemented')} // Add your own toggle
            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Filter size={18} />
          </button>
          <button title="Print Report" type="button" className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Printer size={18} />
          </button>
          <button title="Download Report" type="button" className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}>
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="fromDate" className="block text-sm font-medium mb-1">
            From Date
          </label>
          <input
            id="fromDate"
            type="date"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
          />
        </div>
        <div>
          <label htmlFor="toDate" className="block text-sm font-medium mb-1">
            To Date
          </label>
          <input
            id="toDate"
            type="date"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
          />
        </div>
        <div>
          <label htmlFor="stockItemId" className="block text-sm font-medium mb-1">
            Stock Item
          </label>
          <input
            id="stockItemId"
            type="text"
            placeholder="Filter by Stock Item ID"
            value={stockItemId ?? ''}
            onChange={e => setStockItemId(e.target.value)}
            className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`}
          />
        </div>
      </div>

      {/* Loading, Error */}
      {loading && <p>Loading movement data...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-black'}`}>
              <th className="p-2 border border-gray-400">Date</th>
              <th className="p-2 border border-gray-400">Stock Item</th>
              <th className="p-2 border border-gray-400">Voucher Type</th>
              <th className="p-2 border border-gray-400">Voucher No</th>
              <th className="p-2 border border-gray-400 text-right">Inward Qty</th>
              <th className="p-2 border border-gray-400 text-right">Outward Qty</th>
              <th className="p-2 border border-gray-400 text-right">Rate</th>
              <th className="p-2 border border-gray-400 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={8} className="p-4 text-center opacity-70">
                  No movement data found for selected criteria.
                </td>
              </tr>
            )}
            {data.map((entry, idx) => (
              <tr
                key={idx}
                className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-400"
                onClick={() => {
                  // Optional: navigate to detailed view or open modal
                  alert(`Selected: ${entry.stockItemName} on ${entry.date}`);
                }}
              >
                <td className="p-2 border border-gray-400">{new Date(entry.date).toLocaleDateString()}</td>
                <td className="p-2 border border-gray-400">{entry.stockItemName}</td>
                <td className="p-2 border border-gray-400">{entry.voucherType}</td>
                <td className="p-2 border border-gray-400">{entry.voucherNumber}</td>
                <td className="p-2 border border-gray-400 text-right">{(entry.inwardQty ?? 0).toLocaleString()}</td>
                <td className="p-2 border border-gray-400 text-right">{(entry.outwardQty ?? 0).toLocaleString()}</td>
                <td className="p-2 border border-gray-400 text-right">{(entry.rate ?? 0).toLocaleString()}</td>
                <td className="p-2 border border-gray-400 text-right">{(entry.value ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className={`mt-4 px-2 text-sm text-center text-gray-500`}>
        Use filters above to change report range or item.
      </div>
    </div>
  );
};

export default MovementAnalysis;
