import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Download, Upload, FileText, Save, X } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import type { StockItem } from '../../../types';

interface BulkStockItemRow extends Omit<StockItem, 'id'> {
  categoryId: string;
  tempId: string;
  isValid: boolean;
  errors: { [key: string]: string };
}

const BulkStockItemCreate: React.FC = () => {
  const { theme, stockGroups = [] } = useAppContext();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
const [categories, setCategories] = useState<{ value: string, label: string }[]>([]);

React.useEffect(() => {
  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('userType');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');
  if (!companyId || !ownerType || !ownerId) return;

  const params = new URLSearchParams({
    company_id: companyId,
    owner_type: ownerType,
    owner_id: ownerId,
  });

  fetch(`http://localhost:5000/api/stock-categories?${params.toString()}`)
    .then(res => res.json())
    .then(categoriesData => {
      setCategories(Array.isArray(categoriesData) && categoriesData.length
        ? categoriesData.map((cat: any) => ({ value: cat.id.toString(), label: cat.name }))
        : [{ value: '', label: 'No categories available' }]
      );
    })
    .catch(error => {
      setCategories([{ value: '', label: 'Failed to load categories' }]);
      console.error(error);
    });
}, []);


//   const [dynamicStockGroups, setDynamicStockGroups] = useState<{ value: string, label: string }[]>([]);

// React.useEffect(() => {
//   const companyId = localStorage.getItem('company_id');
//   const ownerType = localStorage.getItem('userType');
//   const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');
//   if (!companyId || !ownerType || !ownerId) return;

//   const params = new URLSearchParams({
//     company_id: companyId,
//     owner_type: ownerType,
//     owner_id: ownerId,
//   });

//   fetch(`http://localhost:5000/api/stock-groups/list?${params.toString()}`)
//     .then(res => res.json())
//     .then(groups => {
//       setDynamicStockGroups(Array.isArray(groups) && groups.length
//         ? groups
//         : [{ value: '', label: 'No groups available' }]
//       );
//     })
//     .catch(error => {
//       setDynamicStockGroups([{ value: '', label: 'Failed to load groups' }]);
//       console.error(error);
//     });
// }, []);

  const [bulkItems, setBulkItems] = useState<BulkStockItemRow[]>([
    {
      tempId: '1',
      name: '',
      unit: 'Piece',
      openingBalance: 0,
      openingValue: 0,
      stockGroupId: '',
      categoryId: '', // NEW

      gstRate: 18,
      hsnCode: '',
      taxType: 'Taxable',
      standardPurchaseRate: 0,
      standardSaleRate: 0,
      enableBatchTracking: false,
      allowNegativeStock: false,
      maintainInPieces: true,
      secondaryUnit: '',
      isValid: false,
      errors: {}
    }
  ]);

  const [showPreview, setShowPreview] = useState(false);

  // Common units for dropdown
  const commonUnits = [
    'Piece', 'Box', 'Kg', 'Gram', 'Litre', 'Meter', 'Feet', 'Dozen', 'Set', 'Pack'
  ];

  // Sample CSV template data
  const csvTemplate = [
    ['Name', 'Unit', 'Opening Balance', 'Opening Value', 'Stock Group', 'GST Rate', 'HSN Code', 'Tax Type', 'Purchase Rate', 'Sale Rate', 'Enable Batch', 'Allow Negative', 'Maintain Pieces', 'Secondary Unit'],
    ['Laptop Dell Inspiron', 'Piece', '10', '450000', 'Electronics', '18', '8471', 'Taxable', '40000', '45000', 'false', 'false', 'true', ''],
    ['Mobile Samsung Galaxy', 'Piece', '25', '625000', 'Electronics', '18', '8517', 'Taxable', '22000', '25000', 'false', 'false', 'true', ''],
    ['Office Chair Premium', 'Piece', '15', '120000', 'Furniture', '18', '9401', 'Taxable', '7000', '8000', 'false', 'false', 'true', '']
  ];

  const addNewRow = () => {
    const newRow: BulkStockItemRow = {
      tempId: (bulkItems.length + 1).toString(),
      name: '',
      unit: 'Piece',
      openingBalance: 0,
      openingValue: 0,
      stockGroupId: '',
      categoryId: '', // NEW
      gstRate: 18,
      hsnCode: '',
      taxType: 'Taxable',
      standardPurchaseRate: 0,
      standardSaleRate: 0,
      enableBatchTracking: false,
      allowNegativeStock: false,
      maintainInPieces: true,
      secondaryUnit: '',
      isValid: false,
      errors: {}
    };
    setBulkItems(prev => [...prev, newRow]);
  };

  const removeRow = (tempId: string) => {
    if (bulkItems.length <= 1) return;
    setBulkItems(prev => prev.filter(item => item.tempId !== tempId));
  };

  const updateRow = (tempId: string, field: keyof Omit<BulkStockItemRow, 'tempId' | 'isValid' | 'errors'>, value: string | number | boolean) => {
    setBulkItems(prev => prev.map(item => {
      if (item.tempId === tempId) {
        const updatedItem = { ...item, [field]: value };
        const { isValid, errors } = validateRow(updatedItem);
        return { ...updatedItem, isValid, errors };
      }
      return item;
    }));
  };

  const validateRow = (item: BulkStockItemRow): { isValid: boolean; errors: { [key: string]: string } } => {
    const errors: { [key: string]: string } = {};

    if (!item.name.trim()) errors.name = 'Name is required';
    if (!item.unit.trim()) errors.unit = 'Unit is required';
    if (item.openingBalance < 0) errors.openingBalance = 'Opening balance cannot be negative';
    if (item.openingValue < 0) errors.openingValue = 'Opening value cannot be negative';
    if (item.gstRate && (item.gstRate < 0 || item.gstRate > 100)) errors.gstRate = 'GST rate must be between 0-100';
    if (item.standardPurchaseRate && item.standardPurchaseRate < 0) errors.standardPurchaseRate = 'Purchase rate cannot be negative';
    if (item.standardSaleRate && item.standardSaleRate < 0) errors.standardSaleRate = 'Sale rate cannot be negative';

    return { isValid: Object.keys(errors).length === 0, errors };
  };
const uploadCSVFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('http://localhost:5000/api/stock-items/bulk-csv', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      alert(`CSV processed successfully. Inserted ${data.inserted || 'N/A'} items.`);
      // Optionally refresh your stock items or UI here
    } else {
      alert('CSV upload failed: ' + data.message);
    }
  } catch (error) {
    alert('Error uploading CSV');
    console.error(error);
  }
};
const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    uploadCSVFile(file);
  }
};

  // const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = event.target.files?.[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = (e) => {
  //     try {
  //       const text = e.target?.result as string;
  //       const rows = text.split('\n').map(row => row.split(','));
        
  //       // Skip header row
  //       const dataRows = rows.slice(1).filter(row => row.length > 1 && row[0].trim());
        
  //       const newItems: BulkStockItemRow[] = dataRows.map((row, index) => {
  //         const item: BulkStockItemRow = {
  //           tempId: (index + 1).toString(),
  //           name: row[0]?.trim() || '',
  //           unit: row[1]?.trim() || 'Piece',
  //           openingBalance: parseFloat(row[2]) || 0,
  //           openingValue: parseFloat(row[3]) || 0,
  //           stockGroupId: '', // Will be mapped from group name
  //           gstRate: parseFloat(row[5]) || 18,
  //           hsnCode: row[6]?.trim() || '',
  //           taxType: (row[7]?.trim() as 'Taxable' | 'Exempt' | 'Nil-rated') || 'Taxable',
  //           standardPurchaseRate: parseFloat(row[8]) || 0,
  //           standardSaleRate: parseFloat(row[9]) || 0,
  //           enableBatchTracking: row[10]?.toLowerCase() === 'true',
  //           allowNegativeStock: row[11]?.toLowerCase() === 'true',
  //           maintainInPieces: row[12]?.toLowerCase() !== 'false',
  //           secondaryUnit: row[13]?.trim() || '',
  //           isValid: false,
  //           errors: {}
  //         };

  //         // Try to find matching stock group
  //         const groupName = row[4]?.trim();
  //         if (groupName) {
  //           const matchingGroup = stockGroups.find(g => 
  //             g.name.toLowerCase().includes(groupName.toLowerCase())
  //           );
  //           if (matchingGroup) {
  //             item.stockGroupId = matchingGroup.id;
  //           }
  //         }

  //         const { isValid, errors } = validateRow(item);
  //         return { ...item, isValid, errors };
  //       });

  //       setBulkItems(newItems);
  //       alert(`Successfully loaded ${newItems.length} items from CSV`);
  //     } catch (error) {
  //       alert('Error parsing CSV file. Please check the format.');
  //       console.error('CSV parsing error:', error);
  //     }
  //   };
  //   reader.readAsText(file);
    
  //   // Reset file input
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  // };

  const downloadTemplate = () => {
    const csvContent = csvTemplate.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stock_items_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };
// Assuming bulkItems is an array of validated stock items in your form state

const handleSaveAll = async (bulkItems: BulkStockItemRow[]) => {
  try {
    const companyId = localStorage.getItem('company_id');
    const ownerType = localStorage.getItem('userType');
    const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');

    // Attach tenant info to the payload, or send as query params
    const response = await fetch(`http://localhost:5000/api/stock-items/bulk?company_id=${companyId}&owner_type=${ownerType}&owner_id=${ownerId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        bulkItems.map(item => ({ ...item, companyId, ownerType, ownerId }))
      ),
   
    });
    const data = await response.json();

    if (data.success) {
      alert(`Successfully uploaded ${data.inserted} items. Skipped ${data.skipped}.`);
      navigate('/app/masters/stock-item');
    } else {
      alert('Upload failed: ' + data.message);
    }
  } catch (error) {
    alert('Error uploading data');
    console.error(error);
  }
};

  // const handleSaveAll = async () => {
  //   const validItems = bulkItems.filter(item => item.isValid);
    
  //   if (validItems.length === 0) {
  //     alert('No valid items to save. Please fix the errors and try again.');
  //     return;
  //   }

  //   if (validItems.length !== bulkItems.length) {
  //     const proceed = window.confirm(
  //       `${bulkItems.length - validItems.length} items have errors and will be skipped. ` +
  //       `Do you want to proceed with saving ${validItems.length} valid items?`
  //     );
  //     if (!proceed) return;
  //   }

  //   try {
  //     for (const item of validItems) {
  //       // eslint-disable-next-line @typescript-eslint/no-unused-vars
  //       const { tempId, isValid, errors, ...stockItem } = item;
  //       addStockItem(stockItem);
  //     }
      
  //     alert(`Successfully created ${validItems.length} stock items!`);
  //     navigate('/app/masters/stock-item');
  //   } catch (error) {
  //     alert('Error saving stock items. Please try again.');
  //     console.error('Save error:', error);
  //   }
  // };

  const validItemsCount = bulkItems.filter(item => item.isValid).length;
  const totalItemsCount = bulkItems.length;

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={() => navigate('/app/masters/stock-item')}
            className={`mr-4 p-2 rounded-full transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
            title="Back to Stock Items"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold">Bulk Stock Item Creation</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <span className={`text-sm px-3 py-1 rounded-full ${
            validItemsCount === totalItemsCount && totalItemsCount > 0
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {validItemsCount}/{totalItemsCount} Valid
          </span>
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              theme === 'dark' 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-gray-600 hover:bg-gray-700 text-white'
            }`}
          >
            <FileText size={18} />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          
          <button
            onClick={() => handleSaveAll(bulkItems)}
            disabled={validItemsCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              validItemsCount > 0
                ? theme === 'dark' 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-400 cursor-not-allowed text-gray-200'
            }`}
          >
            <Save size={18} />
            Save All ({validItemsCount})
          </button>
        </div>
      </div>

      {/* Instructions and Tools */}
      <div className={`p-4 mb-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <h3 className="font-semibold mb-3">Instructions & Tools</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h4 className="font-medium mb-2">Manual Entry</h4>
            <p className="text-sm mb-3">Add items one by one using the form below</p>
            <button
              onClick={addNewRow}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                theme === 'dark' 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              <Plus size={16} />
              Add Row
            </button>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">CSV Upload</h4>
            <p className="text-sm mb-3">Upload multiple items from CSV file</p>
            <input
             title='CSV Upload'
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                theme === 'dark' 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <Upload size={16} />
              Upload CSV
            </button>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Template</h4>
            <p className="text-sm mb-3">Download CSV template with sample data</p>
            <button
              onClick={downloadTemplate}
              className={`flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${
                theme === 'dark' 
                  ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              <Download size={16} />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Items Form */}
      <div className={`rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="p-4">
          <h3 className="font-semibold mb-4">Stock Items ({bulkItems.length})</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <th className="border px-3 py-2 text-left text-sm font-medium">S.No</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Name *</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Unit *</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Stock Group</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Opening Bal</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Opening Value</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">GST Rate</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">HSN Code</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Tax Type</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Purchase Rate</th>
                  <th className="border px-3 py-2 text-left text-sm font-medium">Sale Rate</th>
                  <th className="border px-3 py-2 text-center text-sm font-medium">Status</th>
                  <th className="border px-3 py-2 text-center text-sm font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {bulkItems.map((item, index) => (
                  <tr key={item.tempId} className={`${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                    <td className="border px-3 py-2 text-center">{index + 1}</td>
                    
                    <td className="border px-3 py-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateRow(item.tempId, 'name', e.target.value)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          item.errors.name 
                            ? 'border-red-500' 
                            : theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                        }`}
                        placeholder="Enter item name"
                      />
                      {item.errors.name && <span className="text-red-500 text-xs">{item.errors.name}</span>}
                    </td>
                    
                    <td className="border px-3 py-2">
                      <select
                        title='Unit'
                        value={item.unit}
                        onChange={(e) => updateRow(item.tempId, 'unit', e.target.value)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          item.errors.unit 
                            ? 'border-red-500' 
                            : theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                        }`}
                      >
                        {commonUnits.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                      {item.errors.unit && <span className="text-red-500 text-xs">{item.errors.unit}</span>}
                    </td>
                    
                    <td className="border px-3 py-2">
  <select
    title='Category'
    value={item.categoryId || ''}
    onChange={(e) => updateRow(item.tempId, 'categoryId', e.target.value)}
    className={`w-full px-2 py-1 text-sm border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
  >
    <option value="">-- Select Category --</option>
    {categories.map(cat => (
      <option key={cat.value} value={cat.value}>{cat.label}</option>
    ))}
  </select>
</td>
                    
                    <td className="border px-3 py-2">
                      <input
                       
                       title='for Opening Balance'
                        type="number"
                        value={item.openingBalance}
                        onChange={(e) => updateRow(item.tempId, 'openingBalance', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          item.errors.openingBalance 
                            ? 'border-red-500' 
                            : theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                        }`}
                        min="0"
                        step="0.01"
                      />
                      {item.errors.openingBalance && <span className="text-red-500 text-xs">{item.errors.openingBalance}</span>}
                    </td>
                    
                    <td className="border px-3 py-2">
                      <input
                       title='for Opening Value'
                        type="number"
                        value={item.openingValue}
                        onChange={(e) => updateRow(item.tempId, 'openingValue', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          item.errors.openingValue 
                            ? 'border-red-500' 
                            : theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                        }`}
                        min="0"
                        step="0.01"
                      />
                      {item.errors.openingValue && <span className="text-red-500 text-xs">{item.errors.openingValue}</span>}
                    </td>
                    
                    <td className="border px-3 py-2">
                      <input
                      title='GST Rate'
                        type="number"
                        value={item.gstRate || ''}
                        onChange={(e) => updateRow(item.tempId, 'gstRate', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          item.errors.gstRate 
                            ? 'border-red-500' 
                            : theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                        }`}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      {item.errors.gstRate && <span className="text-red-500 text-xs">{item.errors.gstRate}</span>}
                    </td>
                    
                    <td className="border px-3 py-2">
                      <input
                        type="text"
                        value={item.hsnCode || ''}
                        onChange={(e) => updateRow(item.tempId, 'hsnCode', e.target.value)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                        placeholder="HSN/SAC"
                      />
                    </td>
                    
                    <td className="border px-3 py-2">
                      <select
                        title='Tax Type'
                        value={item.taxType || 'Taxable'}
                        onChange={(e) => updateRow(item.tempId, 'taxType', e.target.value)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600' 
                            : 'bg-white border-gray-300'
                        }`}
                      >
                        <option value="Taxable">Taxable</option>
                        <option value="Exempt">Exempt</option>
                        <option value="Nil-rated">Nil-rated</option>
                      </select>
                    </td>
                    
                    <td className="border px-3 py-2">
                      <input
                        title='for Standard Purchase Rate'
                        type="number"
                        value={item.standardPurchaseRate || ''}
                        onChange={(e) => updateRow(item.tempId, 'standardPurchaseRate', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          item.errors.standardPurchaseRate 
                            ? 'border-red-500' 
                            : theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                        }`}
                        min="0"
                        step="0.01"
                      />
                      {item.errors.standardPurchaseRate && <span className="text-red-500 text-xs">{item.errors.standardPurchaseRate}</span>}
                    </td>
                    
                    <td className="border px-3 py-2">
                      <input
                        title='for Standard Sale Rate'
                        type="number"
                        value={item.standardSaleRate || ''}
                        onChange={(e) => updateRow(item.tempId, 'standardSaleRate', parseFloat(e.target.value) || 0)}
                        className={`w-full px-2 py-1 text-sm border rounded ${
                          item.errors.standardSaleRate 
                            ? 'border-red-500' 
                            : theme === 'dark' 
                              ? 'bg-gray-700 border-gray-600' 
                              : 'bg-white border-gray-300'
                        }`}
                        min="0"
                        step="0.01"
                      />
                      {item.errors.standardSaleRate && <span className="text-red-500 text-xs">{item.errors.standardSaleRate}</span>}
                    </td>
                    
                    <td className="border px-3 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        item.isValid 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {item.isValid ? '✓ Valid' : '✗ Invalid'}
                      </span>
                    </td>
                    
                    <td className="border px-3 py-2 text-center">
                      <button
                        onClick={() => removeRow(item.tempId)}
                        disabled={bulkItems.length <= 1}
                        className={`p-1 rounded transition-colors ${
                          bulkItems.length <= 1 
                            ? 'opacity-50 cursor-not-allowed' 
                            : theme === 'dark' 
                              ? 'hover:bg-gray-600 text-red-400' 
                              : 'hover:bg-gray-200 text-red-600'
                        }`}
                        title="Remove Row"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`max-w-4xl max-h-[80vh] overflow-y-auto rounded-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Preview - Valid Items ({validItemsCount})</h3>
                <button
                  title="Close Preview"
                  onClick={() => setShowPreview(false)}
                  className={`p-2 rounded transition-colors ${
                    theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                {bulkItems.filter(item => item.isValid).map((item, index) => (
                  <div key={item.tempId} className={`p-4 rounded border ${
                    theme === 'dark' ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
                  }`}>
                    <h4 className="font-medium mb-2">{index + 1}. {item.name}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div><strong>Unit:</strong> {item.unit}</div>
                      <div><strong>Stock Group:</strong> {stockGroups.find(g => g.id === item.stockGroupId)?.name || 'N/A'}</div>
                      <div><strong>Opening Balance:</strong> {item.openingBalance}</div>
                      <div><strong>Opening Value:</strong> ₹{item.openingValue.toLocaleString()}</div>
                      <div><strong>GST Rate:</strong> {item.gstRate}%</div>
                      <div><strong>HSN Code:</strong> {item.hsnCode || 'N/A'}</div>
                      <div><strong>Tax Type:</strong> {item.taxType}</div>
                      <div><strong>Purchase Rate:</strong> ₹{item.standardPurchaseRate?.toLocaleString() || 'N/A'}</div>
                      <div><strong>Sale Rate:</strong> ₹{item.standardSaleRate?.toLocaleString() || 'N/A'}</div>
                    </div>
                  </div>
                ))}
                
                {validItemsCount === 0 && (
                  <p className="text-center text-gray-500">No valid items to preview</p>
                )}
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPreview(false)}
                  className={`px-4 py-2 rounded transition-colors ${
                    theme === 'dark' 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowPreview(false);
                    handleSaveAll(bulkItems);
                  }}
                  disabled={validItemsCount === 0}
                  className={`flex items-center gap-2 px-4 py-2 rounded transition-colors ${
                    validItemsCount > 0
                      ? theme === 'dark' 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-400 cursor-not-allowed text-gray-200'
                  }`}
                >
                  <Save size={18} />
                  Save All ({validItemsCount})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkStockItemCreate;
