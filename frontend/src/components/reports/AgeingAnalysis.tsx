import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import FilterPanel from './FilterPanel';
import ReportTable from './ReportTable';
import { ArrowLeft, Filter } from 'lucide-react';
import type { StockGroup, StockItem, Godown } from '../../types';

type AgeingBucket = { label: string; qty: number; value: number };

type AgeingData = {
  item: { id: string; name: string; code?: string };
  ageing: AgeingBucket[];
  totalQty: number;
  totalValue: number;
};

const AgeingAnalysis: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<{
  fromDate: string;
  toDate: string;
  stockGroupId: string;
  stockItemId: string;
  godownId: string;
  batchId: string;
  period: 'Daily' | 'Weekly' | 'Fortnightly' | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';   // exact expected union type
  basis: 'Quantity' | 'Value' | 'Cost';
  showProfit: boolean;
}>({
  fromDate: '2023-04-01',
  toDate: new Date().toISOString().slice(0, 10),
  stockGroupId: '',
  stockItemId: '',
  godownId: '',
  batchId: '',
  period: 'Monthly',  // <-- Default initial value
  basis: 'Quantity',
  showProfit: false,
});


  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const [data, setData] = useState<AgeingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter options
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [godowns, setGodowns] = useState<Godown[]>([]);

  // Fetch filter options (stock groups, stock items, godowns)
  useEffect(() => {
    async function fetchFilterOptions() {
      const companyId = localStorage.getItem('company_id') || '';
      const ownerType = localStorage.getItem('supplier') || localStorage.getItem('userType') || '';
      const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id') || '';

      if (!companyId || !ownerType || !ownerId) return;

      try {
        // Fetch stock groups
        const stockGroupsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-groups/list?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        if (stockGroupsRes.ok) {
          const stockGroupsData = await stockGroupsRes.json();
          setStockGroups(Array.isArray(stockGroupsData) ? stockGroupsData.map((g: any) => ({ 
            id: String(g.id), 
            name: g.name 
          })) : []);
        }

        // Fetch stock items
        const stockItemsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/stock-items?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        if (stockItemsRes.ok) {
          const stockItemsData = await stockItemsRes.json();
          const items = stockItemsData.success && stockItemsData.data 
            ? stockItemsData.data 
            : Array.isArray(stockItemsData) 
              ? stockItemsData 
              : [];
          
          setStockItems(items.map((item: any) => ({ 
            id: String(item.id), 
            name: item.name,
            unit: item.unit || '',
            openingBalance: item.openingBalance || 0,
            openingValue: item.openingValue || 0,
            stockGroupId: item.stockGroupId ? String(item.stockGroupId) : undefined,
            batchDetails: item.batches || item.batchDetails || []
          } as StockItem)));
        }

        // Fetch godowns
        const godownsRes = await fetch(
          `${import.meta.env.VITE_API_URL}/api/godowns?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`
        );
        if (godownsRes.ok) {
          const godownsData = await godownsRes.json();
          const godownsList = godownsData.success && godownsData.data 
            ? godownsData.data 
            : Array.isArray(godownsData) 
              ? godownsData 
              : [];
          
          setGodowns(godownsList.map((g: any) => ({ 
            id: String(g.id), 
            name: g.name 
          })));
        }
      } catch (e) {
        console.error('Error fetching filter options:', e);
      }
    }
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    async function fetchData() {
      const companyId = localStorage.getItem('company_id') || '';
      const ownerType = localStorage.getItem('supplier') || localStorage.getItem('userType') || '';
      const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id') || '';

      if (!companyId || !ownerType || !ownerId) {
        setError("Missing tenant information. Please ensure you are logged in and have selected a company.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("companyId", companyId);
        params.append("ownerType", ownerType);
        params.append("ownerId", ownerId);
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value));
        });

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/ageing-analysis?${params.toString()}`);
        if (!res.ok) throw new Error(`Error fetching data: ${res.status}`);

        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message || 'Error');
        setData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [filters]);

  const columns = useMemo(() => {
    const buckets = ['0-30 Days', '31-60 Days', '61-90 Days', '91-180 Days', 'Above 180 Days'];

    return [
      { header: 'Item', accessor: 'item', render: (row: AgeingData) => row.item.name },
      ...buckets.map((b, i) => ({
        header: b,
        accessor: `ageing.${i}.qty`,
        render: (row: AgeingData) => row.ageing[i]?.qty.toLocaleString() ?? '0',
      })),
      {
        header: 'Total Qty',
        accessor: 'totalQty',
        render: (row: AgeingData) => row.totalQty.toLocaleString(),
      },
      {
        header: 'Total Value',
        accessor: 'totalValue',
        render: (row: AgeingData) => `₹${row.totalValue.toLocaleString()}`,
      },
    ];
  }, []);

  const footer = useMemo(() => {
    const totalBuckets = [0, 0, 0, 0, 0];
    let totalQty = 0;
    let totalVal = 0;

    data.forEach(item => {
      item.ageing.forEach((bucket, idx) => {
        totalBuckets[idx] += bucket.qty;
      });
      totalQty += item.totalQty;
      totalVal += item.totalValue;
    });

    const bucketsFooter = totalBuckets.map((val, i) => ({
      accessor: `ageing.${i}.qty`,
      value: val.toLocaleString(),
    }));

    return [
      { accessor: 'item', value: 'Total' },
      ...bucketsFooter,
      { accessor: 'totalQty', value: totalQty.toLocaleString() },
      { accessor: 'totalValue', value: `₹${totalVal.toLocaleString()}` },
    ];
  }, [data]);

  return (
    <div className="p-4 pt-14 min-h-screen">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          title="Back to Reports"
          onClick={() => navigate('/app/reports')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          Stock Ageing Analysis
        </h1>

        <button
          onClick={() => setShowFilterPanel(s => !s)}
          title="Toggle Filters"
          className={`ml-auto p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <FilterPanel
          theme={theme}
          show={showFilterPanel}
          filters={filters}
          onFilterChange={setFilters}
          onToggle={() => setShowFilterPanel(false)}
          stockGroups={stockGroups}
          stockItems={stockItems}
          godowns={godowns}
        />
      )}

      {/* Loading/Error */}
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {/* Report Table */}
      {!loading && !error && (
        <ReportTable columns={columns} data={data} footer={footer} theme={theme} />
      )}
    </div>
  );
};

export default AgeingAnalysis;
