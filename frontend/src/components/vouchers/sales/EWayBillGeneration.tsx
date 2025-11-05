import React, { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {  Printer, Save, X } from 'lucide-react'; //ArrowLeft,
import type { VoucherEntry } from '../../../types';

interface ItemDetails {
  name: string;
  hsnCode?: string;
  unit: string;
}

interface TotalCalculation {
  subtotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  total: number;
}

interface EWayBillGenerationProps {
  theme: 'light' | 'dark';
  voucherData: Omit<VoucherEntry, 'id'>;
  onClose: () => void;
  getPartyName: (partyId: string) => string;
  getItemDetails: (itemId: string) => ItemDetails;
  calculateTotals: () => TotalCalculation;
}

const EWayBillGeneration: React.FC<EWayBillGenerationProps> = ({
  theme,
  voucherData,
  onClose,
  getPartyName,
  getItemDetails,
  calculateTotals
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const [eWayBillData, setEWayBillData] = useState({
    eWayBillNo: '',
    generatedDate: new Date().toISOString().split('T')[0],
    validUpto: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24 hours from now
    transportationMode: '1', // 1-Road, 2-Rail, 3-Air, 4-Ship
    vehicleType: '1', // 1-Regular, 2-Over Dimensional Cargo
    vehicleNo: '',
    transporterId: '',
    transporterName: '',
    driverName: '',
    driverLicense: '',
    approxDistance: '',
    transactionType: '1', // 1-Regular, 2-Bill To Ship To, 3-Bill From Dispatch From, 4-Combination of 2 and 3
    supplyType: 'O', // O-Outward, I-Inward
    subSupplyType: '1', // 1-Supply, 2-Import, 3-Export, 4-Job Work, 5-For Own Use, 6-Job work Returns, 7-Sales Return, 8-Others
    docType: 'INV', // INV-Tax Invoice, CHL-Delivery Challan, BIL-Bill of Supply, BOE-Bill of Entry, CNT-Credit Note, DNT-Debit Note
    // Shipping Address Details
    shipToName: '',
    shipToAddress: '',
    shipToGSTIN: '',
    shipToStateCode: '',
    shipToPlace: '',
    shipToPinCode: '',
    // From Address Details
    fromName: 'Your Company Name',
    fromAddress: 'Your Company Address',
    fromGSTIN: 'Your GST Number',
    fromStateCode: 'Your State Code',
    fromPlace: 'Your City',
    fromPinCode: 'Your PIN Code',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEWayBillData(prev => ({ ...prev, [name]: value }));
  };

  const generateEWayBillNumber = () => {
    // Generate a mock E-way bill number (12 digits)
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return timestamp + random;
  };

  const handleGenerate = () => {
    if (!eWayBillData.vehicleNo || !eWayBillData.approxDistance) {
      alert('Please fill all required fields!');
      return;
    }
    
    const eWayBillNo = generateEWayBillNumber();
    setEWayBillData(prev => ({ ...prev, eWayBillNo }));
    
    // Auto print after generation
    setTimeout(() => {
      handlePrint();
    }, 500);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `EWayBill_${eWayBillData.eWayBillNo || 'Draft'}_${voucherData.number}`,
  });

  const totals = calculateTotals();
  const selectedItems = voucherData.entries.filter(entry => entry.itemId && entry.itemId !== '' && entry.itemId !== 'select');

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
        {/* Header */}
        <div className={`p-6 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center">
              🚛 E-way Bill Generation
            </h2>
            <button
              title='Close'
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
              }`}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Section */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Transportation Mode */}
            <div>
              <label className="block text-sm font-medium mb-2">Transportation Mode *</label>
              <select
                title='Select Transportation Mode'
                name="transportationMode"
                value={eWayBillData.transportationMode}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                <option value="1">Road</option>
                <option value="2">Rail</option>
                <option value="3">Air</option>
                <option value="4">Ship</option>
              </select>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Type *</label>
              <select
                title='Select Vehicle Type'
                name="vehicleType"
                value={eWayBillData.vehicleType}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              >
                <option value="1">Regular</option>
                <option value="2">Over Dimensional Cargo</option>
              </select>
            </div>

            {/* Vehicle Number */}
            <div>
              <label className="block text-sm font-medium mb-2">Vehicle Number *</label>
              <input
                type="text"
                name="vehicleNo"
                value={eWayBillData.vehicleNo}
                onChange={handleChange}
                placeholder="Enter vehicle number"
                className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
              />
            </div>

            {/* Transporter ID */}
            <div>
              <label className="block text-sm font-medium mb-2">Transporter ID</label>
              <input
                type="text"
                name="transporterId"
                value={eWayBillData.transporterId}
                onChange={handleChange}
                placeholder="Enter transporter ID"
                className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>

            {/* Transporter Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Transporter Name</label>
              <input
                type="text"
                name="transporterName"
                value={eWayBillData.transporterName}
                onChange={handleChange}
                placeholder="Enter transporter name"
                className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
              />
            </div>

            {/* Approximate Distance */}
            <div>
              <label className="block text-sm font-medium mb-2">Approximate Distance (KM) *</label>
              <input
                type="number"
                name="approxDistance"
                value={eWayBillData.approxDistance}
                onChange={handleChange}
                placeholder="Enter distance in KM"
                className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                required
              />
            </div>
          </div>

          {/* Shipping Address Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Shipping Address (if different from billing)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Ship To Name */}
              <div>
                <label className="block text-sm font-medium mb-2">Ship To Name</label>
                <input
                  type="text"
                  name="shipToName"
                  value={eWayBillData.shipToName}
                  onChange={handleChange}
                  placeholder="Enter delivery contact name"
                  className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* Ship To Address */}
              <div>
                <label className="block text-sm font-medium mb-2">Ship To Address</label>
                <input
                  type="text"
                  name="shipToAddress"
                  value={eWayBillData.shipToAddress}
                  onChange={handleChange}
                  placeholder="Enter delivery address"
                  className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* Ship To GSTIN */}
              <div>
                <label className="block text-sm font-medium mb-2">Ship To GSTIN</label>
                <input
                  type="text"
                  name="shipToGSTIN"
                  value={eWayBillData.shipToGSTIN}
                  onChange={handleChange}
                  placeholder="Enter delivery GSTIN"
                  className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* Ship To State Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Ship To State Code</label>
                <input
                  type="text"
                  name="shipToStateCode"
                  value={eWayBillData.shipToStateCode}
                  onChange={handleChange}
                  placeholder="Enter state code"
                  className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* Ship To Place */}
              <div>
                <label className="block text-sm font-medium mb-2">Ship To Place</label>
                <input
                  type="text"
                  name="shipToPlace"
                  value={eWayBillData.shipToPlace}
                  onChange={handleChange}
                  placeholder="Enter delivery city"
                  className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>

              {/* Ship To PIN Code */}
              <div>
                <label className="block text-sm font-medium mb-2">Ship To PIN Code</label>
                <input
                  type="text"
                  name="shipToPinCode"
                  value={eWayBillData.shipToPinCode}
                  onChange={handleChange}
                  placeholder="Enter PIN code"
                  className={`w-full p-2 border rounded ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 mb-6">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center"
            >
              <Save size={16} className="mr-2" />
              Generate E-way Bill
            </button>
            {eWayBillData.eWayBillNo && (
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center"
              >
                <Printer size={16} className="mr-2" />
                Print
              </button>
            )}
          </div>
        </div>

        {/* E-way Bill Print Layout */}
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div ref={printRef} className="p-6">
            <style>
              {`
                @media print {
                  body { margin: 0; font-family: Arial, sans-serif; }
                  .no-print { display: none; }
                  .print-area { max-width: none; margin: 0; padding: 20px; }
                  table { border-collapse: collapse; width: 100%; }
                  th, td { border: 1px solid #000; padding: 8px; font-size: 11px; }
                  .header-title { font-size: 16px; font-weight: bold; text-align: center; }
                  .section-header { background-color: #f0f0f0; font-weight: bold; }
                }
              `}
            </style>
            
            <div className="print-area">
              {/* Header */}
              <div className="text-center mb-6">
                <h1 className="header-title text-2xl font-bold mb-2">GOODS AND SERVICES TAX</h1>
                <h2 className="text-xl font-semibold mb-2">E-WAY BILL</h2>
                {eWayBillData.eWayBillNo && (
                  <div className="text-lg font-bold text-blue-600">
                    E-way Bill No: {eWayBillData.eWayBillNo}
                  </div>
                )}
              </div>

              {/* Document Details */}
              <table className="w-full mb-4">
                <tr>
                  <td className="section-header" colSpan={4}>DOCUMENT DETAILS</td>
                </tr>
                <tr>
                  <td><strong>Document Type:</strong></td>
                  <td>{eWayBillData.docType}</td>
                  <td><strong>Document No:</strong></td>
                  <td>{voucherData.number}</td>
                </tr>
                <tr>
                  <td><strong>Document Date:</strong></td>
                  <td>{new Date(voucherData.date).toLocaleDateString('en-GB')}</td>
                  <td><strong>Value of Goods:</strong></td>
                  <td>₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td><strong>Transaction Type:</strong></td>
                  <td>Regular</td>
                  <td><strong>Supply Type:</strong></td>
                  <td>{eWayBillData.supplyType === 'O' ? 'Outward' : 'Inward'}</td>
                </tr>
              </table>

              {/* From (Consignor) Details */}
              <table className="w-full mb-4">
                <tr>
                  <td className="section-header" colSpan={2}>FROM (CONSIGNOR)</td>
                </tr>
                <tr>
                  <td><strong>Name:</strong></td>
                  <td>{eWayBillData.fromName}</td>
                </tr>
                <tr>
                  <td><strong>Address:</strong></td>
                  <td>{eWayBillData.fromAddress}</td>
                </tr>
                <tr>
                  <td><strong>GSTIN/UIN:</strong></td>
                  <td>{eWayBillData.fromGSTIN}</td>
                </tr>
                <tr>
                  <td><strong>State Code:</strong></td>
                  <td>{eWayBillData.fromStateCode}</td>
                </tr>
                <tr>
                  <td><strong>Place:</strong></td>
                  <td>{eWayBillData.fromPlace}</td>
                </tr>
                <tr>
                  <td><strong>PIN Code:</strong></td>
                  <td>{eWayBillData.fromPinCode}</td>
                </tr>
              </table>

              {/* To (Consignee) Details */}
              <table className="w-full mb-4">
                <tr>
                  <td className="section-header" colSpan={2}>TO (CONSIGNEE)</td>
                </tr>
                <tr>
                  <td><strong>Name:</strong></td>
                  <td>{getPartyName(voucherData.partyId || '')}</td>
                </tr>
                <tr>
                  <td><strong>Address:</strong></td>
                  <td>Party Address, City, State - PIN Code</td>
                </tr>
                <tr>
                  <td><strong>GSTIN/UIN:</strong></td>
                  <td>Party GST Number</td>
                </tr>
                <tr>
                  <td><strong>State Code:</strong></td>
                  <td>Party State Code</td>
                </tr>
                <tr>
                  <td><strong>Place:</strong></td>
                  <td>Party City</td>
                </tr>
                <tr>
                  <td><strong>PIN Code:</strong></td>
                  <td>Party PIN Code</td>
                </tr>
              </table>

              {/* Ship To Details */}
              <table className="w-full mb-4">
                <tr>
                  <td className="section-header" colSpan={2}>SHIP TO (DELIVERY ADDRESS)</td>
                </tr>
                <tr>
                  <td><strong>Name:</strong></td>
                  <td>{eWayBillData.shipToName || getPartyName(voucherData.partyId || '')}</td>
                </tr>
                <tr>
                  <td><strong>Address:</strong></td>
                  <td>{eWayBillData.shipToAddress || 'Same as billing address'}</td>
                </tr>
                <tr>
                  <td><strong>GSTIN/UIN:</strong></td>
                  <td>{eWayBillData.shipToGSTIN || 'Same as billing GSTIN'}</td>
                </tr>
                <tr>
                  <td><strong>State Code:</strong></td>
                  <td>{eWayBillData.shipToStateCode || 'Same as billing state'}</td>
                </tr>
                <tr>
                  <td><strong>Place:</strong></td>
                  <td>{eWayBillData.shipToPlace || 'Same as billing place'}</td>
                </tr>
                <tr>
                  <td><strong>PIN Code:</strong></td>
                  <td>{eWayBillData.shipToPinCode || 'Same as billing PIN'}</td>
                </tr>
              </table>

              {/* Goods Details */}
              <table className="w-full mb-4">
                <tr>
                  <td className="section-header" colSpan={6}>GOODS DETAILS</td>
                </tr>
                <tr>
                  <th>Sr No</th>
                  <th>HSN Code</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Taxable Value</th>
                </tr>
                {selectedItems.map((entry, index) => {
                  const itemDetails = getItemDetails(entry.itemId || '');
                  const baseAmount = (entry.quantity || 0) * (entry.rate || 0);
                  return (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td className="text-center">{entry.hsnCode || itemDetails.hsnCode || '-'}</td>
                      <td>{itemDetails.name}</td>
                      <td className="text-center">{entry.quantity}</td>
                      <td className="text-center">{itemDetails.unit}</td>
                      <td className="text-right">₹{baseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  );
                })}
                <tr>
                  <td colSpan={5} className="text-right"><strong>Total Taxable Value:</strong></td>
                  <td className="text-right"><strong>₹{totals.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
                <tr>
                  <td colSpan={5} className="text-right"><strong>Total Tax Amount:</strong></td>
                  <td className="text-right"><strong>₹{(totals.cgstTotal + totals.sgstTotal + totals.igstTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
                <tr>
                  <td colSpan={5} className="text-right"><strong>Total Invoice Value:</strong></td>
                  <td className="text-right"><strong>₹{totals.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong></td>
                </tr>
              </table>

              {/* Transportation Details */}
              <table className="w-full mb-4">
                <tr>
                  <td className="section-header" colSpan={4}>TRANSPORTATION DETAILS</td>
                </tr>
                <tr>
                  <td><strong>Transportation Mode:</strong></td>
                  <td>{['', 'Road', 'Rail', 'Air', 'Ship'][parseInt(eWayBillData.transportationMode)]}</td>
                  <td><strong>Vehicle Type:</strong></td>
                  <td>{['', 'Regular', 'Over Dimensional Cargo'][parseInt(eWayBillData.vehicleType)]}</td>
                </tr>
                <tr>
                  <td><strong>Vehicle Number:</strong></td>
                  <td>{eWayBillData.vehicleNo || 'Not Provided'}</td>
                  <td><strong>Approximate Distance:</strong></td>
                  <td>{eWayBillData.approxDistance ? `${eWayBillData.approxDistance} KM` : 'Not Provided'}</td>
                </tr>
                {eWayBillData.transporterName && (
                  <tr>
                    <td><strong>Transporter Name:</strong></td>
                    <td>{eWayBillData.transporterName}</td>
                    <td><strong>Transporter ID:</strong></td>
                    <td>{eWayBillData.transporterId || 'Not Provided'}</td>
                  </tr>
                )}
              </table>

              {/* E-way Bill Details */}
              {eWayBillData.eWayBillNo && (
                <table className="w-full mb-4">
                  <tr>
                    <td className="section-header" colSpan={4}>E-WAY BILL DETAILS</td>
                  </tr>
                  <tr>
                    <td><strong>E-way Bill Number:</strong></td>
                    <td>{eWayBillData.eWayBillNo}</td>
                    <td><strong>Generated Date:</strong></td>
                    <td>{new Date(eWayBillData.generatedDate).toLocaleDateString('en-GB')}</td>
                  </tr>
                  <tr>
                    <td><strong>Valid Upto:</strong></td>
                    <td>{new Date(eWayBillData.validUpto).toLocaleDateString('en-GB')}</td>
                    <td><strong>Generated By:</strong></td>
                    <td>Your Company Name</td>
                  </tr>
                </table>
              )}

              {/* Footer */}
              <div className="mt-8 text-center text-sm">
                <p><strong>Note:</strong> This E-way bill is generated electronically and does not require signature.</p>
                <p>For any queries, please visit www.ewaybillgst.gov.in</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EWayBillGeneration;
