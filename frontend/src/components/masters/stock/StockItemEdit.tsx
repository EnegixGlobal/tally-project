import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, X, ArrowLeft, Plus } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import type { StockItem, GodownAllocation, Godown, UnitOfMeasurement, StockGroup, GstClassification } from '../../../types';

// Interface for InputField props
interface InputFieldProps {
  id: string;
  name: string;
  label: string;
  type?: string;
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}

// Interface for SelectField props
interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
}

// Interface for GodownAllocationField props
interface GodownAllocationFieldProps {
  allocations: GodownAllocation[];
  setAllocations: React.Dispatch<React.SetStateAction<GodownAllocation[]>>;
  godowns: Godown[];
  errors: Record<string, string>;
}

// Reusable Input component
const InputField: React.FC<InputFieldProps> = ({ id, name, label, type = 'text', value, onChange, required = false, error = '' }) => {
  const { theme } = useAppContext();
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-2 rounded border ${
          error 
            ? 'border-red-500' 
            : theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
              : 'bg-white border-gray-300 focus:border-blue-500'
        } outline-none transition-colors`}
        required={required}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Reusable Select component
const SelectField: React.FC<SelectFieldProps> = ({ id, name, label, value, onChange, options, required = false, error = '' }) => {
  const { theme } = useAppContext();
  
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">
        {label}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        className={`w-full p-2 rounded border ${
          error 
            ? 'border-red-500' 
            : theme === 'dark' 
              ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
              : 'bg-white border-gray-300 focus:border-blue-500'
        } outline-none transition-colors`}
        required={required}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

// Reusable Godown Allocation component
const GodownAllocationField: React.FC<GodownAllocationFieldProps> = ({ allocations, setAllocations, godowns, errors }) => {
  const { theme } = useAppContext();

  const addAllocation = () => {
    setAllocations([...allocations, { godownId: '', quantity: 0, value: 0 }]);
  };

  const updateAllocation = (index: number, field: keyof GodownAllocation, value: string | number) => {
    setAllocations((prev) =>
      prev.map((alloc, i) =>
        i === index ? { ...alloc, [field]: field === 'godownId' ? value : Number(value) } : alloc
      )
    );
  };

  const removeAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="col-span-2">
      <label className="block text-sm font-medium mb-1">Godown Allocations</label>
      {allocations.map((alloc: GodownAllocation, index: number) => (
        <div key={index} className="flex gap-4 mt-2 items-center">
          <SelectField
            id={`godown-${index}`}
            name={`godown-${index}`}
            label="Godown"
            value={alloc.godownId}
            onChange={(e) => updateAllocation(index, 'godownId', e.target.value)}
            options={godowns.map((g) => ({ value: g.id, label: g.name }))}
            error={errors[`godown-${index}`]}
          />
          <InputField
            id={`quantity-${index}`}
            name={`quantity-${index}`}
            label="Quantity"
            type="number"
            value={alloc.quantity}
            onChange={(e) => updateAllocation(index, 'quantity', e.target.value)}
            error={errors[`quantity-${index}`]}
          />
          <InputField
            id={`value-${index}`}
            name={`value-${index}`}
            label="Value"
            type="number"
            value={alloc.value}
            onChange={(e) => updateAllocation(index, 'value', e.target.value)}
            error={errors[`value-${index}`]}
          />
          <button
            title='Remove Godown Allocation'
            type="button"
            onClick={() => removeAllocation(index)}
            className={`p-1 rounded mt-6 ${
              theme === 'dark' 
                ? 'hover:bg-gray-600 text-red-400 hover:text-red-300' 
                : 'hover:bg-gray-300 text-red-600 hover:text-red-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addAllocation}
        className={`mt-2 flex items-center gap-2 px-4 py-2 rounded text-sm ${
          theme === 'dark' 
            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <Plus className="w-4 h-4" />
        Add Godown
      </button>
    </div>
  );
};

const StockItemEdit = () => {
  const { theme, stockGroups = [], gstClassifications = [], units = [], godowns = [], companyInfo, stockItems = [], updateStockItem } = useAppContext();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  interface FormData {
    name: string;
    stockGroupId: string;
    unit: string;
    openingBalance: number;
    openingValue: number;
    hsnSacOption: 'as-per-company' | 'specify-details' | 'use-classification';
    hsnCode: string;
    gstRateOption: 'as-per-company' | 'specify-details' | 'use-classification';
    gstRate: string;
    gstClassification: string;
    taxType: 'Taxable' | 'Exempt' | 'Nil-rated';
    standardPurchaseRate: number;
    standardSaleRate: number;
    enableBatchTracking: boolean;
    batchName: string;
    batchExpiryDate: string;
    batchManufacturingDate: string;
    allowNegativeStock: boolean;
    maintainInPieces: boolean;
    secondaryUnit: string;
  }

  interface Errors {
    [key: string]: string;
  }

  const existingItem = stockItems.find((item: StockItem) => item.id === id);

  const [formData, setFormData] = useState<FormData>({
    name: existingItem?.name || '',
    stockGroupId: existingItem?.stockGroupId || '',
    unit: existingItem?.unit || '',
    openingBalance: existingItem?.openingBalance || 0,
    openingValue: existingItem?.openingValue || 0,
    hsnSacOption: existingItem?.hsnCode ? 'specify-details' : existingItem?.gstRate ? 'use-classification' : 'as-per-company',
    hsnCode: existingItem?.hsnCode || '',
    gstRateOption: existingItem?.gstRate ? 'specify-details' : existingItem?.gstRate ? 'use-classification' : 'as-per-company',
    gstRate: existingItem?.gstRate ? String(existingItem.gstRate) : '',
    gstClassification: '',
    taxType: existingItem?.taxType || 'Taxable',
    standardPurchaseRate: existingItem?.standardPurchaseRate || 0,
    standardSaleRate: existingItem?.standardSaleRate || 0,
    enableBatchTracking: existingItem?.enableBatchTracking || false,
    batchName: existingItem?.batchDetails?.[0]?.name || '',
    batchExpiryDate: existingItem?.batchDetails?.[0]?.expiryDate || '',
    batchManufacturingDate: existingItem?.batchDetails?.[0]?.manufacturingDate || '',
    allowNegativeStock: existingItem?.allowNegativeStock || true,
    maintainInPieces: existingItem?.maintainInPieces || false,
    secondaryUnit: existingItem?.secondaryUnit || ''
  });

  const [godownAllocations, setGodownAllocations] = useState<GodownAllocation[]>(existingItem?.godownAllocations || []);
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (!existingItem) {
      navigate('/app/masters/stock-item');
    }
  }, [existingItem, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors: Errors = {};
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.stockGroupId) newErrors.stockGroupId = 'Group is required';
    if (!formData.unit) newErrors.unit = 'Unit is required';
    if (!formData.taxType) newErrors.taxType = 'Tax Type is required';
    if (formData.openingBalance < 0 && !formData.allowNegativeStock) {
      newErrors.openingBalance = 'Opening Balance cannot be negative';
    }
    if (formData.openingValue < 0) newErrors.openingValue = 'Opening Value cannot be negative';
    if (formData.standardPurchaseRate < 0) newErrors.standardPurchaseRate = 'Purchase Rate cannot be negative';
    if (formData.standardSaleRate < 0) newErrors.standardSaleRate = 'Sale Rate cannot be negative';
    if (formData.taxType === 'Taxable' && formData.hsnSacOption === 'as-per-company' && !stockGroups.find((g: StockGroup) => g.id === formData.stockGroupId)?.hsnCode) {
      newErrors.hsnSacOption = 'Group must have HSN/SAC for taxable items';
    }
    if (formData.hsnSacOption === 'specify-details' && !formData.hsnCode) {
      newErrors.hsnCode = 'HSN/SAC Code is required';
    } else if (formData.hsnSacOption === 'specify-details') {
      const turnover = companyInfo?.turnover || 0;
      const hsnLength = formData.hsnCode.length;
      const requiredLength = turnover <= 50000000 ? 4 : turnover <= 150000000 ? 6 : 8;
      if (!/^\d{4,8}$/.test(formData.hsnCode) || hsnLength < requiredLength) {
        newErrors.hsnCode = `HSN/SAC must be at least ${requiredLength} digits for turnover ₹${(turnover / 10000000).toFixed(1)} crore`;
      }
    }
    if (formData.gstRateOption === 'specify-details' && !formData.gstRate) {
      newErrors.gstRate = 'GST Rate is required';
    } else if (formData.gstRateOption === 'specify-details' && (Number(formData.gstRate) < 0 || Number(formData.gstRate) > 28)) {
      newErrors.gstRate = 'GST Rate must be between 0 and 28%';
    }
    godownAllocations.forEach((alloc: GodownAllocation, index: number) => {
      if (!alloc.godownId) newErrors[`godown-${index}`] = 'Godown is required';
      if (alloc.quantity < 0) newErrors[`quantity-${index}`] = 'Quantity cannot be negative';
      if (alloc.value < 0) newErrors[`value-${index}`] = 'Value cannot be negative';
    });
    if (formData.enableBatchTracking && !formData.batchName) {
      newErrors.batchName = 'Batch Name is required';
    }
    if (formData.maintainInPieces && !formData.secondaryUnit) {
      newErrors.secondaryUnit = 'Secondary Unit is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      alert('Please fix the errors before submitting.');
      return;
    }

    const selectedGroup = stockGroups.find((g: StockGroup) => g.id === formData.stockGroupId);
    const totalQuantity = godownAllocations.reduce((sum, alloc) => sum + alloc.quantity, 0);
    if (totalQuantity !== Number(formData.openingBalance)) {
      alert('Total godown allocation quantity must equal opening balance');
      return;
    }

    const stockItem: StockItem = {
      id: id!,
      name: formData.name,
      stockGroupId: formData.stockGroupId,
      unit: formData.unit,
      openingBalance: Number(formData.openingBalance),
      openingValue: Number(formData.openingValue),
      hsnCode:
        formData.hsnSacOption === 'specify-details' ? formData.hsnCode :
        formData.hsnSacOption === 'use-classification' ?
          gstClassifications.find((c: GstClassification) => c.id === formData.gstClassification)?.hsnCode || '' :
        selectedGroup?.hsnCode || '',
      gstRate:
        formData.gstRateOption === 'specify-details' ? Number(formData.gstRate) :
        formData.gstRateOption === 'use-classification' ?
          Number(gstClassifications.find((c: GstClassification) => c.id === formData.gstClassification)?.gstRate || 0) :
        selectedGroup?.gstRate || 0,
      taxType: formData.taxType,
      standardPurchaseRate: Number(formData.standardPurchaseRate),
      standardSaleRate: Number(formData.standardSaleRate),
      enableBatchTracking: formData.enableBatchTracking,
      batchDetails: formData.enableBatchTracking ? [{
        id: existingItem?.batchDetails?.[0]?.id || Math.random().toString(36).substring(2, 9),
        name: formData.batchName,
        expiryDate: formData.batchExpiryDate || undefined,
        manufacturingDate: formData.batchManufacturingDate || undefined
      }] : undefined,
      godownAllocations: godownAllocations.length > 0 ? godownAllocations : undefined,
      allowNegativeStock: formData.allowNegativeStock,
      maintainInPieces: formData.maintainInPieces,
      secondaryUnit: formData.maintainInPieces ? formData.secondaryUnit : undefined
    };
    updateStockItem(id!, stockItem);
    navigate('/app/masters/stock-item');
  };

  const hsnSacOptions = [
    { value: 'as-per-company', label: 'As per Company/Group' },
    { value: 'specify-details', label: 'Specify Details Here' },
    { value: 'use-classification', label: 'Use GST Classification' }
  ];

  const gstRateOptions = [
    { value: 'as-per-company', label: 'As per Company/Group' },
    { value: 'specify-details', label: 'Specify Details Here' },
    { value: 'use-classification', label: 'Use GST Classification' }
  ];

  const taxTypeOptions = [
    { value: 'Taxable', label: 'Taxable' },
    { value: 'Exempt', label: 'Exempt' },
    { value: 'Nil-rated', label: 'Nil-rated' }
  ];

  const stockGroupOptions = stockGroups.length > 0
    ? stockGroups.map((group: StockGroup) => ({
        value: group.id,
        label: group.name,
      }))
    : [{ value: '', label: 'No groups available' }];

  const unitOptions = units.length > 0
    ? units.map((unit: UnitOfMeasurement) => ({
        value: unit.id,
        label: unit.name,
      }))
    : [{ value: '', label: 'No units available' }];

  const gstClassificationOptions = gstClassifications.length > 0
    ? gstClassifications.map((classification: GstClassification) => ({
        value: classification.id,
        label: `${classification.name} (HSN/SAC: ${classification.hsnCode}, GST: ${classification.gstRate}%)`,
      }))
    : [{ value: '', label: 'No classifications available' }];

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/masters/stock-item')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Edit Stock Item</h1>
      </div>

      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'}`}>
        <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField
            id="name"
            name="name"
            label="Name"
            value={formData.name}
            onChange={handleChange}
            required
            error={errors.name}
          />
          <SelectField
            id="stockGroupId"
            name="stockGroupId"
            label="Group"
            value={formData.stockGroupId}
            onChange={handleChange}
            options={stockGroupOptions}
            required
            error={errors.stockGroupId}
          />
          <SelectField
            id="unit"
            name="unit"
            label="Unit"
            value={formData.unit}
            onChange={handleChange}
            options={unitOptions}
            required
            error={errors.unit}
          />
          <InputField
            id="openingBalance"
            name="openingBalance"
            label="Opening Balance"
            type="number"
            value={formData.openingBalance}
            onChange={handleChange}
            error={errors.openingBalance}
          />
          <InputField
            id="openingValue"
            name="openingValue"
            label="Opening Value"
            type="number"
            value={formData.openingValue}
            onChange={handleChange}
            error={errors.openingValue}
          />
          <SelectField
            id="taxType"
            name="taxType"
            label="Tax Type"
            value={formData.taxType}
            onChange={handleChange}
            options={taxTypeOptions}
            required
            error={errors.taxType}
          />
          <SelectField
            id="hsnSacOption"
            name="hsnSacOption"
            label="HSN/SAC Option"
            value={formData.hsnSacOption}
            onChange={handleChange}
            options={hsnSacOptions}
            required
            error={errors.hsnSacOption}
          />
          {formData.hsnSacOption === 'specify-details' && (
            <InputField
              id="hsnCode"
              name="hsnCode"
              label="HSN/SAC Code"
              value={formData.hsnCode}
              onChange={handleChange}
              required
              error={errors.hsnCode}
              key="hsnCode"
            />
          )}
          {formData.hsnSacOption === 'use-classification' && (
            <SelectField
              id="gstClassification"
              name="gstClassification"
              label="GST Classification"
              value={formData.gstClassification}
              onChange={handleChange}
              options={gstClassificationOptions}
              error={errors.gstClassification}
              key="gstClassification-hsn"
            />
          )}
          <SelectField
            id="gstRateOption"
            name="gstRateOption"
            label="GST Rate Option"
            value={formData.gstRateOption}
            onChange={handleChange}
            options={gstRateOptions}
            required
            error={errors.gstRateOption}
          />
          {formData.gstRateOption === 'specify-details' && (
            <InputField
              id="gstRate"
              name="gstRate"
              label="GST Rate (%)"
              type="number"
              value={formData.gstRate}
              onChange={handleChange}
              required
              error={errors.gstRate}
              key="gstRate"
            />
          )}
          {formData.gstRateOption === 'use-classification' && (
            <SelectField
              id="gstClassification"
              name="gstClassification"
              label="GST Classification"
              value={formData.gstClassification}
              onChange={handleChange}
              options={gstClassificationOptions}
              error={errors.gstClassification}
              key="gstClassification-rate"
            />
          )}
          <InputField
            id="standardPurchaseRate"
            name="standardPurchaseRate"
            label="Standard Purchase Rate"
            type="number"
            value={formData.standardPurchaseRate}
            onChange={handleChange}
            error={errors.standardPurchaseRate}
          />
          <InputField
            id="standardSaleRate"
            name="standardSaleRate"
            label="Standard Sale Rate"
            type="number"
            value={formData.standardSaleRate}
            onChange={handleChange}
            error={errors.standardSaleRate}
          />
          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="enableBatchTracking"
                checked={formData.enableBatchTracking}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Enable Batch Tracking
            </label>
          </div>
          {formData.enableBatchTracking && (
            <>
              <InputField
                id="batchName"
                name="batchName"
                label="Batch Name"
                value={formData.batchName}
                onChange={handleChange}
                required
                error={errors.batchName}
              />
              <InputField
                id="batchExpiryDate"
                name="batchExpiryDate"
                label="Expiry Date"
                type="date"
                value={formData.batchExpiryDate}
                onChange={handleChange}
                error={errors.batchExpiryDate}
              />
              <InputField
                id="batchManufacturingDate"
                name="batchManufacturingDate"
                label="Manufacturing Date"
                type="date"
                value={formData.batchManufacturingDate}
                onChange={handleChange}
                error={errors.batchManufacturingDate}
              />
            </>
          )}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="allowNegativeStock"
                checked={formData.allowNegativeStock}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Allow Negative Stock
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="maintainInPieces"
                checked={formData.maintainInPieces}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              Maintain in Pieces
            </label>
          </div>
          {formData.maintainInPieces && (
            <SelectField
              id="secondaryUnit"
              name="secondaryUnit"
              label="Secondary Unit"
              value={formData.secondaryUnit}
              onChange={handleChange}
              options={unitOptions}
              required
              error={errors.secondaryUnit}
            />
          )}
          <GodownAllocationField
            allocations={godownAllocations}
            setAllocations={setGodownAllocations}
            godowns={godowns}
            errors={errors}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/masters/stock-item')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </form>
    </div>
    </div>
  );
};

export default StockItemEdit;