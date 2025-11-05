import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Download, 
  Printer,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface Form3CAData {
  // Assessee Details
  nameOfAssessee: string;
  panOfAssessee: string;
  addressOfAssessee: string;
  
  // Audit Report Details
  dateOfAuditReport: string;
  periodOfAudit: string;
  financialYearFrom: string;
  financialYearTo: string;
  
  // Auditor Details
  auditorName: string;
  auditorMembershipNumber: string;
  auditorFirmRegistrationNumber: string;
  auditorAddress: string;
  auditorPhone: string;
  auditorEmail: string;
  
  // Audit Opinion Declaration
  properBooksOfAccountMaintained: 'Yes' | 'No';
  informationAndExplanationsObtained: 'Yes' | 'No';
  auditReportTrueAndCorrect: 'Yes' | 'No';
  
  // Annexure Attachments
  balanceSheetAttached: 'Yes' | 'No';
  profitLossAccountAttached: 'Yes' | 'No';
  form3CDAttached: 'Yes' | 'No';
  otherDocumentsAttached: 'Yes' | 'No';
  otherDocumentsDetails: string;
  
  // Qualifications/Observations
  anyQualifications: 'Yes' | 'No';
  qualificationDetails: string;
  anyObservations: 'Yes' | 'No';
  observationDetails: string;
  
  // Compliance Details
  requirementOfOtherLaw: string;
  otherLawDetails: string;
  
  // Signature and Date
  placeOfSigning: string;
  dateOfSigning: string;
}

const Form3CA: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Form3CAData>({
    // Assessee Details
    nameOfAssessee: '',
    panOfAssessee: '',
    addressOfAssessee: '',
    
    // Audit Report Details
    dateOfAuditReport: '',
    periodOfAudit: '',
    financialYearFrom: '2023-04-01',
    financialYearTo: '2024-03-31',
    
    // Auditor Details
    auditorName: '',
    auditorMembershipNumber: '',
    auditorFirmRegistrationNumber: '',
    auditorAddress: '',
    auditorPhone: '',
    auditorEmail: '',
    
    // Audit Opinion Declaration
    properBooksOfAccountMaintained: 'Yes',
    informationAndExplanationsObtained: 'Yes',
    auditReportTrueAndCorrect: 'Yes',
    
    // Annexure Attachments
    balanceSheetAttached: 'Yes',
    profitLossAccountAttached: 'Yes',
    form3CDAttached: 'Yes',
    otherDocumentsAttached: 'No',
    otherDocumentsDetails: '',
    
    // Qualifications/Observations
    anyQualifications: 'No',
    qualificationDetails: '',
    anyObservations: 'No',
    observationDetails: '',
    
    // Compliance Details
    requirementOfOtherLaw: '',
    otherLawDetails: '',
    
    // Signature and Date
    placeOfSigning: '',
    dateOfSigning: ''
  });
  
  const handleInputChange = (field: keyof Form3CAData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    console.log('Saving Form 3CA data:', formData);
    // API call to save data
  };

  const handleSubmit = () => {
    console.log('Submitting Form 3CA:', formData);
    // API call to submit form
  };

  return (
    <div className="pt-[56px] px-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <button
            title='Back to Audit Module'
            onClick={() => navigate('/app/audit')}
            className={`mr-4 p-2 rounded-full ${
              theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Form 3CA</h1>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Report of tax audit under section 44AB of the Income-tax Act, 1961
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
          >
            <Save size={14} className="mr-1" />
            Save
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
          >
            <FileCheck size={14} className="mr-1" />
            Submit
          </button>
          <button className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center text-sm">
            <Download size={14} className="mr-1" />
            Download
          </button>
          <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center text-sm">
            <Printer size={14} className="mr-1" />
            Print
          </button>
        </div>
      </div>

      {/* Official Form Header */}
      <div className={`rounded-xl border p-6 mb-6 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="text-center">
          <h2 className="text-lg font-bold mb-2">Form No. 3CA</h2>
          <p className="text-sm font-medium mb-4">
            [See rule 6G]
          </p>
          <h3 className="text-base font-semibold">
            Report of tax audit under section 44AB of the Income-tax Act, 1961
          </h3>
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-6">
        
        {/* Assessee Details */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-blue-600">Details of the Assessee</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name of the assessee *</label>
              <input
                type="text"
                value={formData.nameOfAssessee}
                onChange={(e) => handleInputChange('nameOfAssessee', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Enter name of the assessee"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Permanent Account Number (PAN) *</label>
              <input
                type="text"
                value={formData.panOfAssessee}
                onChange={(e) => handleInputChange('panOfAssessee', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="ABCDE1234F"
                maxLength={10}
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Address of the assessee *</label>
            <textarea
              value={formData.addressOfAssessee}
              onChange={(e) => handleInputChange('addressOfAssessee', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              rows={3}
              placeholder="Enter complete address of the assessee"
            />
          </div>
        </div>

        {/* Audit Report Details */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-green-600">Audit Report Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Date of audit report *</label>
              <input
                title="Select date of audit report"
                type="date"
                value={formData.dateOfAuditReport}
                onChange={(e) => handleInputChange('dateOfAuditReport', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Period of audit</label>
              <input
                type="text"
                value={formData.periodOfAudit}
                onChange={(e) => handleInputChange('periodOfAudit', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., Financial Year 2023-24"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Financial Year From *</label>
              <input
                title='Select financial year start date'
                type="date"
                value={formData.financialYearFrom}
                onChange={(e) => handleInputChange('financialYearFrom', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Financial Year To *</label>
              <input
                title='Select financial year end date'
                type="date"
                value={formData.financialYearTo}
                onChange={(e) => handleInputChange('financialYearTo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Auditor Details */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-purple-600">Auditor Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Name of the Chartered Accountant *</label>
              <input
                type="text"
                value={formData.auditorName}
                onChange={(e) => handleInputChange('auditorName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Enter CA name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Membership Number *</label>
              <input
                type="text"
                value={formData.auditorMembershipNumber}
                onChange={(e) => handleInputChange('auditorMembershipNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Enter ICAI membership number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Firm Registration Number (FRN)</label>
              <input
                type="text"
                value={formData.auditorFirmRegistrationNumber}
                onChange={(e) => handleInputChange('auditorFirmRegistrationNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Enter firm registration number"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Phone Number</label>
              <input
                type="tel"
                value={formData.auditorPhone}
                onChange={(e) => handleInputChange('auditorPhone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="+91 9876543210"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={formData.auditorEmail}
                onChange={(e) => handleInputChange('auditorEmail', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="auditor@email.com"
              />
            </div>
          </div>
          
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Address of the Chartered Accountant *</label>
            <textarea
              value={formData.auditorAddress}
              onChange={(e) => handleInputChange('auditorAddress', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                theme === 'dark' 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300'
              }`}
              rows={3}
              placeholder="Enter complete address of the chartered accountant"
            />
          </div>
        </div>

        {/* Audit Opinion and Declaration */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-orange-600">Audit Opinion and Declaration</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">
                Whether proper books of account have been kept by the assessee so far as appears from examination of such books? *
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.properBooksOfAccountMaintained === 'Yes'}
                    onChange={(e) => handleInputChange('properBooksOfAccountMaintained', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.properBooksOfAccountMaintained === 'No'}
                    onChange={(e) => handleInputChange('properBooksOfAccountMaintained', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">
                Whether all the information and explanations which were necessary for the purpose of audit have been obtained? *
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.informationAndExplanationsObtained === 'Yes'}
                    onChange={(e) => handleInputChange('informationAndExplanationsObtained', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.informationAndExplanationsObtained === 'No'}
                    onChange={(e) => handleInputChange('informationAndExplanationsObtained', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">
                Whether the particulars given in the annexed balance sheet, profit and loss account and other documents are true and correct subject to any qualification(s) or observation(s), if any? *
              </label>
              <div className="flex space-x-6">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.auditReportTrueAndCorrect === 'Yes'}
                    onChange={(e) => handleInputChange('auditReportTrueAndCorrect', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.auditReportTrueAndCorrect === 'No'}
                    onChange={(e) => handleInputChange('auditReportTrueAndCorrect', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Annexure Attachments */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-teal-600">Annexure Attachments</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-3">Balance Sheet attached? *</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.balanceSheetAttached === 'Yes'}
                    onChange={(e) => handleInputChange('balanceSheetAttached', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.balanceSheetAttached === 'No'}
                    onChange={(e) => handleInputChange('balanceSheetAttached', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">Profit & Loss Account attached? *</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.profitLossAccountAttached === 'Yes'}
                    onChange={(e) => handleInputChange('profitLossAccountAttached', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.profitLossAccountAttached === 'No'}
                    onChange={(e) => handleInputChange('profitLossAccountAttached', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">Form 3CD attached? *</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.form3CDAttached === 'Yes'}
                    onChange={(e) => handleInputChange('form3CDAttached', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.form3CDAttached === 'No'}
                    onChange={(e) => handleInputChange('form3CDAttached', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3">Other documents attached?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.otherDocumentsAttached === 'Yes'}
                    onChange={(e) => handleInputChange('otherDocumentsAttached', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.otherDocumentsAttached === 'No'}
                    onChange={(e) => handleInputChange('otherDocumentsAttached', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
          </div>
          
          {formData.otherDocumentsAttached === 'Yes' && (
            <div className="mt-6">
              <label className="block text-sm font-medium mb-2">Details of other documents attached</label>
              <textarea
                value={formData.otherDocumentsDetails}
                onChange={(e) => handleInputChange('otherDocumentsDetails', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                rows={3}
                placeholder="Provide details of other documents attached"
              />
            </div>
          )}
        </div>

        {/* Qualifications and Observations */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-red-600">Qualifications and Observations</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-3">Any qualifications in the audit report?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.anyQualifications === 'Yes'}
                    onChange={(e) => handleInputChange('anyQualifications', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.anyQualifications === 'No'}
                    onChange={(e) => handleInputChange('anyQualifications', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
            
            {formData.anyQualifications === 'Yes' && (
              <div>
                <label className="block text-sm font-medium mb-2">Details of qualifications</label>
                <textarea
                  value={formData.qualificationDetails}
                  onChange={(e) => handleInputChange('qualificationDetails', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                  rows={4}
                  placeholder="Provide detailed qualifications, if any"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium mb-3">Any observations in the audit report?</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="Yes"
                    checked={formData.anyObservations === 'Yes'}
                    onChange={(e) => handleInputChange('anyObservations', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  Yes
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="No"
                    checked={formData.anyObservations === 'No'}
                    onChange={(e) => handleInputChange('anyObservations', e.target.value as 'Yes' | 'No')}
                    className="mr-2"
                  />
                  No
                </label>
              </div>
            </div>
            
            {formData.anyObservations === 'Yes' && (
              <div>
                <label className="block text-sm font-medium mb-2">Details of observations</label>
                <textarea
                  value={formData.observationDetails}
                  onChange={(e) => handleInputChange('observationDetails', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    theme === 'dark' 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300'
                  }`}
                  rows={4}
                  placeholder="Provide detailed observations, if any"
                />
              </div>
            )}
          </div>
        </div>

        {/* Compliance Details */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-indigo-600">Compliance Details</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Requirement of audit under any other law
              </label>
              <input
                type="text"
                value={formData.requirementOfOtherLaw}
                onChange={(e) => handleInputChange('requirementOfOtherLaw', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="e.g., Companies Act, 2013"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Details of other law requirement</label>
              <textarea
                value={formData.otherLawDetails}
                onChange={(e) => handleInputChange('otherLawDetails', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                rows={3}
                placeholder="Provide details of the audit requirement under other law"
              />
            </div>
          </div>
        </div>

        {/* Signature and Date */}
        <div className={`rounded-xl border p-6 ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <h2 className="text-xl font-semibold mb-6 text-yellow-600">Signature and Date</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Place of signing *</label>
              <input
                type="text"
                value={formData.placeOfSigning}
                onChange={(e) => handleInputChange('placeOfSigning', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
                placeholder="Enter place of signing"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Date of signing *</label>
              <input
              title='Select date of signing'
                type="date"
                value={formData.dateOfSigning}
                onChange={(e) => handleInputChange('dateOfSigning', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300'
                }`}
              />
            </div>
          </div>
          
          {/* Signature Area */}
          <div className="mt-6 p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
            <p className="text-gray-500 mb-2">Signature of the Chartered Accountant</p>
            <p className="text-sm text-gray-400">
              (With stamp/seal)
            </p>
          </div>
        </div>
      </div>

      {/* Form Info */}
      <div className={`mt-8 p-4 rounded-lg border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-start">
          <AlertCircle size={20} className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-blue-800 mb-1">Form 3CA Information</p>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
              Form 3CA is to be filed by entities whose accounts are required to be audited under section 44AB 
              and who are also required under any other law to get their accounts audited.
            </p>
            <ul className={`mt-2 space-y-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <li>• All mandatory fields marked with (*) must be filled</li>
              <li>• This form is simpler than Form 3CB and relies on annexed documents</li>
              <li>• Form 3CD must be attached along with this form</li>
              <li>• Due date: September 30th of the assessment year</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Form3CA;
