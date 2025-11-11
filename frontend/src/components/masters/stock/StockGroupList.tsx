import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import { Plus, Edit, Trash, Printer, Download, Filter, ArrowLeft } from 'lucide-react';
import ReportTable from '../../reports/ReportTable';
import type { StockGroup } from '../../../types';

const StockGroupList: React.FC = () => {
  const { theme, companyInfo } = useAppContext();
  const navigate = useNavigate();
  const [filterName, setFilterName] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [stockGroups, setStockGroupData] = useState<StockGroup[]>([]);
  useEffect(() => {
  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('userType');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');

  if (!companyId || !ownerType || !ownerId) return;

  const fetchData = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/stock-groups/list?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`);
      const data = await res.json();
      console.log('this is list data', data)
      setStockGroupData(data);
    } catch (err) {
      console.error('Failed to fetch stock groups:', err);
    }
  };

  fetchData();
}, []);
  
  // Mock deleteStockGroup function since it's not in context
  const deleteStockGroup = useCallback(async (id: string) => {
  const ownerType = localStorage.getItem('userType');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');

  if (!ownerType || !ownerId) return;

  if (!window.confirm('Are you sure you want to delete this stock group?')) return;

  try {
    const res = await fetch(`http://localhost:5000/api/stock-groups/delete/${id}?owner_type=${ownerType}&owner_id=${ownerId}`, {
      method: 'DELETE',
    });

    const result = await res.json();

    if (res.ok) {
      alert(result.message || 'Stock group deleted successfully!');
      // Update the state to remove the deleted group from the list
      setStockGroupData(prev => prev.filter(g => g.id !== id));
    } else {
      alert(result.message || 'Failed to delete stock group.');
    }
  } catch (err) {
    console.error('Failed to delete stock group:', err);
    alert('Failed to delete stock group. See console for details.');
  }
}, []);

  // Mock stock groups
  const [mockStockGroups] = useState<StockGroup[]>([
    {
      id: 'SG1',
      name: 'Cleaning Supplies',
      parent: '',
      shouldQuantitiesBeAdded: true,
      hsnSacDetails: { 
        setAlterHSNSAC: true, 
        hsnSacClassificationId: '',
        hsnCode: '3402', 
        description: 'Cleaning Products' 
      },
      gstDetails: { 
        setAlterGST: true, 
        gstClassificationId: '',
        taxability: 'Taxable', 
        integratedTaxRate: 18, 
        cess: 0 
      },
    },
    {
      id: 'SG2',
      name: 'Car Accessories',
      parent: 'SG1',
      shouldQuantitiesBeAdded: false,
      hsnSacDetails: { 
        setAlterHSNSAC: true, 
        hsnSacClassificationId: '',
        hsnCode: '8708', 
        description: 'Car Accessories' 
      },
      gstDetails: { 
        setAlterGST: true, 
        gstClassificationId: '',
        taxability: 'Taxable', 
        integratedTaxRate: 28, 
        cess: 1 
      },
    },
  ]);

  const filteredStockGroups = (stockGroups.length > 0 ? stockGroups : mockStockGroups).filter(
    g => g.name.toLowerCase().includes(filterName.toLowerCase())
  );

  const paginatedStockGroups = filteredStockGroups.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredStockGroups.length / itemsPerPage);

  const columns = useMemo(() => [
    { header: 'Name', accessor: 'name', align: 'left' as const },
    { 
      header: 'Parent Group', 
      accessor: 'parent', 
      align: 'left' as const, 
      render: (row: StockGroup) => stockGroups.find(g => g.id === row.parent)?.name || 'None' 
    },
    { 
      header: 'Quantities Added', 
      accessor: 'shouldQuantitiesBeAdded', 
      align: 'center' as const, 
      render: (row: StockGroup) => row.shouldQuantitiesBeAdded ? 'Yes' : 'No' 
    },
    { 
      header: 'HSN/SAC Code', 
      accessor: 'hsnCode', 
      align: 'left' as const, 
      render: (row: StockGroup) => row.hsnSacDetails?.hsnCode || 'N/A' 
    },
    { 
      header: 'GST Rate', 
      accessor: 'integratedTaxRate', 
      align: 'right' as const, 
      render: (row: StockGroup) => row.gstDetails?.integratedTaxRate ? `${row.gstDetails.integratedTaxRate}%` : 'N/A' 
    },
    { 
      header: 'Actions', 
      accessor: 'actions', 
      align: 'center' as const, 
      render: (row: StockGroup) => (
        <div className="flex space-x-2 justify-center">
          <button
            title="Edit Stock Group"
            onClick={() => navigate(`/app/masters/stock-group/edit/${row.id}`)}
            className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Edit size={16} />
          </button>
          <button
            title="Delete Stock Group"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this stock group?')) {
                deleteStockGroup(row.id);
              }
            }}
            className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-red-700' : 'hover:bg-red-200'}`}
          >
            <Trash size={16} />
          </button>
        </div>
      )
    },
  ], [stockGroups, navigate, theme, deleteStockGroup]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Stock Group List</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            </style>
          </head>
          <body>
            <h1>${companyInfo?.name || 'Hanuman Car Wash'} - Stock Group List</h1>
            <table>
              <thead>
                <tr>${columns.map(col => `<th style="text-align:${col.align}">${col.header}</th>`).join('')}</tr>
              </thead>
              <tbody>
                ${paginatedStockGroups.map(row => `<tr>${
                  columns.map(col => `<td style="text-align:${col.align}">${col.render ? col.render(row) : ''}</td>`).join('')
                }</tr>`).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [paginatedStockGroups, columns, companyInfo]);

  const handleExport = useCallback(() => {
    const csv = [
      columns.map(col => col.header).join(','),
      ...paginatedStockGroups.map(row => 
        columns.map(col => col.render ? col.render(row) : '').join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_group_list.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, [paginatedStockGroups, columns]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'F5') {
      e.preventDefault();
      setFilterName('');
      setCurrentPage(1);
    } else if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      handleExport();
    } else if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      handlePrint();
    }
  }, [handleExport, handlePrint]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Masters"
          onClick={() => navigate('/app/masters')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          Stock Groups
        </h1>
        <div className="ml-auto flex space-x-2">
          <Link
            to="/app/masters/stock-group/create"
            className={`flex items-center gap-2 px-4 py-2 rounded-md ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
          >
            <Plus size={18} /> New Stock Group
          </Link>
          <button
            title="Toggle Filters"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Filter size={18} />
          </button>
          <button
            title="Print List"
            onClick={handlePrint}
            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Printer size={18} />
          </button>
          <button
            title="Download List"
            onClick={handleExport}
            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {showFilterPanel && (
        <div className={`p-4 mb-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
          <h3 className="font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Stock Group Name
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
                placeholder="Search by name"
              />
            </div>
          </div>
        </div>
      )}

      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <ReportTable
          theme={theme}
          columns={columns}
          data={paginatedStockGroups}
        />
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(prev => prev - 1)}
          className={`px-4 py-2 rounded-md ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Previous
        </button>
        <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
          Page {currentPage} of {totalPages}
        </span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(prev => prev + 1)}
          className={`px-4 py-2 rounded-md ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          Next
        </button>
      </div>

      <div className={`mt-6 p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Keyboard Shortcuts:</span> F5 to refresh, Ctrl+E to export, Ctrl+P to print.
        </p>
      </div>
    </div>
  );
};

export default StockGroupList;