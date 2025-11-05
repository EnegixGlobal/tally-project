import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../../context/AppContext';
import { ArrowLeft, Save, Printer } from 'lucide-react';
import type { StockGroup, GstClassification } from '../../../types';
import Swal from 'sweetalert2';

// Extended type for form data that includes all the properties used in the UI
type StockGroupFormData = StockGroup & {
  parent?: string;
  shouldQuantitiesBeAdded?: boolean;
  hsnSacDetails?: {
    setAlterHSNSAC: boolean;
    hsnSacClassificationId: string;
    hsnCode: string;
    description: string;
  };
  gstDetails?: {
    setAlterGST: boolean;
    gstClassificationId: string;
    taxability: string;
    integratedTaxRate: number;
    cess: number;
  };
};

const StockGroupForm: React.FC = () => {
  const { theme, stockGroups, gstClassifications,  companyInfo } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;
  const companyId = localStorage.getItem('company_id');
  const ownerType = localStorage.getItem('userType');
  const ownerId = localStorage.getItem(ownerType === 'employee' ? 'employee_id' : 'user_id');
  // Mock updateStockGroup function since it's not in context
  // const updateStockGroup = useCallback((stockGroup: StockGroup) => {
  //   console.log('Update stock group:', stockGroup);
  //   alert('Stock group updated successfully!');
  // }, []);

  const initialFormData: StockGroupFormData = {
    id: '',
    name: '',
    parent: '',
    shouldQuantitiesBeAdded: true,
    hsnSacDetails: {
      setAlterHSNSAC: false,
      hsnSacClassificationId: '',
      hsnCode: '',
      description: '',
    },
    gstDetails: {
      setAlterGST: false,
      gstClassificationId: '',
      taxability: 'Taxable',
      integratedTaxRate: 0,
      cess: 0,
    },
  };
const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);

useEffect(() => {
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
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    })
    .catch(() => setCategories([]));
}, []);

  const [formData, setFormData] = useState<StockGroupFormData>(
    isEditMode 
      ? {
          ...(stockGroups.find(g => g.id === id) || initialFormData),
          shouldQuantitiesBeAdded: true,
          hsnSacDetails: {
            setAlterHSNSAC: false,
            hsnSacClassificationId: '',
            hsnCode: '',
            description: '',
          },
          gstDetails: {
            setAlterGST: false,
            gstClassificationId: '',
            taxability: 'Taxable',
            integratedTaxRate: 0,
            cess: 0,
          },
        }
      : initialFormData
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Mock GST classifications
  const mockGstClassifications: GstClassification[] = [
    { id: 'GST1', name: 'GST 18%', hsnCode: '3402', gstRate: 18, cess: 0 },
    { id: 'GST2', name: 'GST 12%', hsnCode: '3403', gstRate: 12, cess: 0 },
  ];

  const validateForm = useCallback(() => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = 'Stock group name is required';
    if (formData.hsnSacDetails?.setAlterHSNSAC && !formData.hsnSacDetails.hsnCode) {
      newErrors.hsnCode = 'HSN/SAC code is required when set/alter is enabled';
    }
    if (formData.gstDetails?.setAlterGST && !formData.gstDetails.gstClassificationId && !formData.gstDetails.integratedTaxRate) {
      newErrors.gstRate = 'GST rate is required when set/alter GST is enabled';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    section?: 'hsnSacDetails' | 'gstDetails'
  ) => {
    const { name, value } = e.target;
    if (section) {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [name]: value },
      }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    section: 'hsnSacDetails' | 'gstDetails',
    field: 'setAlterHSNSAC' | 'setAlterGST'
  ) => {
    const { checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: checked },
    }));
  };


const handleSubmit = useCallback(async () => {
  if (!validateForm()) return;

  const stockGroupData = {
    ...formData,
    id: isEditMode ? formData.id : `SG-${Date.now()}`,
    companyId,
    ownerType,
    ownerId,
  };

  try {
    const response = await fetch('http://localhost:5000/api/stock-groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stockGroupData),
    });

    const result = await response.json();

    if (response.ok) {
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: result.message || 'Stock Group saved successfully',
      }).then(() => {
        navigate('/app/masters/stock-group');
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: result.error || 'Something went wrong.',
      });
    }
  } catch (error) {
    Swal.fire('Error', 'Something went wrong!', 'error');
  }
}, [formData, isEditMode, navigate, validateForm]);

  const handlePrint = useCallback(() => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head><title>Stock Group Details</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            </style>
          </head>
          <body>
            <h1>${companyInfo?.name || 'Hanuman Car Wash'} - Stock Group Details</h1>
            <table>
              <tr><th>Name</th><td>${formData.name}</td></tr>
              <tr><th>Parent Group</th><td>${stockGroups.find(g => g.id === formData.parent)?.name || 'None'}</td></tr>
              <tr><th>Should Quantities be Added</th><td>${formData.shouldQuantitiesBeAdded ? 'Yes' : 'No'}</td></tr>
              <tr><th>Set/Alter HSN/SAC</th><td>${formData.hsnSacDetails?.setAlterHSNSAC ? 'Yes' : 'No'}</td></tr>
              ${formData.hsnSacDetails?.setAlterHSNSAC ? `
                <tr><th>HSN/SAC Code</th><td>${formData.hsnSacDetails.hsnCode}</td></tr>
                <tr><th>HSN/SAC Description</th><td>${formData.hsnSacDetails.description || 'N/A'}</td></tr>
              ` : ''}
              <tr><th>Set/Alter GST Details</th><td>${formData.gstDetails?.setAlterGST ? 'Yes' : 'No'}</td></tr>
              ${formData.gstDetails?.setAlterGST ? `
                <tr><th>GST Classification</th><td>${gstClassifications.find(c => c.id === formData.gstDetails?.gstClassificationId)?.name || 'Manual'}</td></tr>
                <tr><th>Taxability</th><td>${formData.gstDetails?.taxability}</td></tr>
                <tr><th>GST Rate</th><td>${formData.gstDetails?.integratedTaxRate}%</td></tr>
                <tr><th>Cess</th><td>${formData.gstDetails?.cess || 0}%</td></tr>
              ` : ''}
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }, [companyInfo?.name, formData, stockGroups, gstClassifications]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      handleSubmit();
    } else if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      handlePrint();
    } else if (e.key === 'Escape') {
      navigate('/app/masters/stock-group');
    }
  }, [handleSubmit, handlePrint, navigate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          title="Back to Stock Groups"
          onClick={() => navigate('/app/masters/stock-group')}
          className={`mr-4 p-2 rounded-full ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
          {isEditMode ? 'Edit Stock Group' : 'New Stock Group'}
        </h1>
        <div className="ml-auto flex space-x-2">
          <button
            title="Save Stock Group"
            onClick={handleSubmit}
            className={`p-2 rounded-md ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white flex items-center`}
          >
            <Save size={18} className="mr-2" /> Save
          </button>
          <button
            title="Print Stock Group"
            onClick={handlePrint}
            className={`p-2 rounded-md ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <Printer size={18} />
          </button>
        </div>
      </div>

      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
              placeholder="Enter stock group name"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
    Name Under (Parent Group/Category)
  </label>
  <select
    name="parent"
    title="Name Under (Parent Group/Category)"
    value={formData.parent}
    onChange={handleChange}
    className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
  >
    <option value="">None</option>
    {/* Show groups */}
    {/* {stockGroups.filter(g => g.id !== formData.id).map(group => (
      <option key={`group-${group.id}`} value={group.id}>{group.name}</option>
    ))} */}
    {/* Show categories */}
    {categories.map(cat => (
      <option key={`cat-${cat.id}`} value={cat.id}>{cat.name} (Category)</option>
    ))}
  </select>
</div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Should Quantities of Items be Added
            </label>
            <select
              name="shouldQuantitiesBeAdded"
              title="Should Quantities of Items be Added"
              value={formData.shouldQuantitiesBeAdded ? 'Yes' : 'No'}
              onChange={(e) => setFormData(prev => ({ ...prev, shouldQuantitiesBeAdded: e.target.value === 'Yes' }))}
              className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Set/Alter HSN/SAC Details
            </label>
            <input
              type="checkbox"
              title="Set/Alter HSN/SAC Details"
              checked={formData.hsnSacDetails?.setAlterHSNSAC}
              onChange={(e) => handleCheckboxChange(e, 'hsnSacDetails', 'setAlterHSNSAC')}
              className={`p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
          </div>
          {formData.hsnSacDetails?.setAlterHSNSAC && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Source of HSN/SAC Details
                </label>
                <select
                  name="hsnSacClassificationId"
                  title="Source of HSN/SAC Details"
                  value={formData.hsnSacDetails?.hsnSacClassificationId}
                  onChange={(e) => handleChange(e, 'hsnSacDetails')}
                  className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
                >
                  <option value="">Manual</option>
                  {gstClassifications.concat(mockGstClassifications).map(classification => (
                    <option key={classification.id} value={classification.id}>{classification.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  HSN/SAC Code
                </label>
                <input
                  type="text"
                  name="hsnCode"
                  value={formData.hsnSacDetails?.hsnCode}
                  onChange={(e) => handleChange(e, 'hsnSacDetails')}
                  className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="Enter HSN/SAC code"
                />
                {errors.hsnCode && <p className="text-red-500 text-sm mt-1">{errors.hsnCode}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  HSN/SAC Description
                </label>
                <textarea
                  name="description"
                  value={formData.hsnSacDetails?.description}
                  onChange={(e) => handleChange(e, 'hsnSacDetails')}
                  className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="Enter HSN/SAC description"
                />
              </div>
            </>
          )}
          <div className="md:col-span-2">
            <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Set/Alter GST Details
            </label>
            <input
              type="checkbox"
              title="Set/Alter GST Details"
              checked={formData.gstDetails?.setAlterGST}
              onChange={(e) => handleCheckboxChange(e, 'gstDetails', 'setAlterGST')}
              className={`p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
            />
          </div>
          {formData.gstDetails?.setAlterGST && (
            <>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Source of GST Details
                </label>
                <select
                  name="gstClassificationId"
                  title="Source of GST Details"
                  value={formData.gstDetails?.gstClassificationId}
                  onChange={(e) => handleChange(e, 'gstDetails')}
                  className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
                >
                  <option value="">Manual</option>
                  {gstClassifications.concat(mockGstClassifications).map(classification => (
                    <option key={classification.id} value={classification.id}>{classification.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Taxability
                </label>
                <select
                  name="taxability"
                  title="Taxability"
                  value={formData.gstDetails?.taxability}
                  onChange={(e) => handleChange(e, 'gstDetails')}
                  className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
                >
                  <option value="Taxable">Taxable</option>
                  <option value="Exempt">Exempt</option>
                  <option value="Nil-rated">Nil-rated</option>
                </select>
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  name="integratedTaxRate"
                  value={formData.gstDetails?.integratedTaxRate}
                  onChange={(e) => handleChange(e, 'gstDetails')}
                  className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="Enter GST rate"
                />
                {errors.gstRate && <p className="text-red-500 text-sm mt-1">{errors.gstRate}</p>}
              </div>
              <div>
                <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Cess (%)
                </label>
                <input
                  type="number"
                  name="cess"
                  value={formData.gstDetails?.cess}
                  onChange={(e) => handleChange(e, 'gstDetails')}
                  className={`w-full p-2 rounded border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-gray-100' : 'bg-white border-gray-300 text-gray-900'} focus:border-blue-500 focus:ring-blue-500`}
                  placeholder="Enter cess rate"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className={`mt-6 p-4 rounded ${theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
        <p className="text-sm text-gray-700 dark:text-gray-300">
          <span className="font-semibold">Keyboard Shortcuts:</span> Ctrl+S to save, Ctrl+P to print, Esc to cancel.
        </p>
      </div>
    </div>
  );
};

export default StockGroupForm;