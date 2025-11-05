import React, { useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Clock, Upload, Download ,ArrowLeft } from 'lucide-react';//FileText
import {useNavigate } from 'react-router-dom';

interface RegistrationStep {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  documents?: string[];
}

const TANRegistration: React.FC = () => {
    const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'apply' | 'status' | 'documents'>('apply');
  const [applicationData, setApplicationData] = useState({
    businessName: '',
    pan: '',
    businessType: '',
    address: '',
    pincode: '',
    state: '',
    email: '',
    phone: ''
  });

  const registrationSteps: RegistrationStep[] = [
    {
      id: 1,
      title: 'Application Submission',
      description: 'Submit TAN application with required details',
      status: 'completed',
      documents: ['PAN Card', 'Address Proof', 'Business Registration']
    },
    {
      id: 2,
      title: 'Document Verification',
      description: 'Income Tax Department verifies submitted documents',
      status: 'current'
    },
    {
      id: 3,
      title: 'TAN Allotment',
      description: 'TAN number is allotted and certificate is issued',
      status: 'pending'
    },
    {
      id: 4,
      title: 'Certificate Download',
      description: 'Download TAN certificate from NSDL website',
      status: 'pending'
    }
  ];

  const requiredDocuments = [
    {
      name: 'PAN Card',
      description: 'Copy of PAN card of the applicant',
      status: 'uploaded',
      required: true
    },
    {
      name: 'Address Proof',
      description: 'Registered office address proof',
      status: 'uploaded',
      required: true
    },
    {
      name: 'Business Registration',
      description: 'Certificate of incorporation/registration',
      status: 'pending',
      required: true
    },
    {
      name: 'Bank Statement',
      description: 'Latest bank statement',
      status: 'pending',
      required: false
    },
    {
      name: 'Authorized Signatory',
      description: 'Board resolution for authorized signatory',
      status: 'not-required',
      required: false
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'current':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'uploaded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'not-required':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  return (
    <div className="min-h-screen pt-[56px] px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                onClick={() => navigate('/app/tds')}
                className="mr-4 p-2 rounded-full hover:bg-gray-200"
                    >
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">TAN Registration</h1>
         </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">TAN Registration</h1>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {[
                { id: 'apply', label: 'Apply for TAN' },
                { id: 'status', label: 'Application Status' },
                { id: 'documents', label: 'Documents' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'apply' | 'status' | 'documents')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Apply for TAN Tab */}
          {activeTab === 'apply' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">TAN Registration Information</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• TAN (Tax Deduction and Collection Account Number) is mandatory for TDS/TCS deduction</li>
                  <li>• Required for all entities deducting tax at source</li>
                  <li>• 10-digit alphanumeric number issued by Income Tax Department</li>
                  <li>• Valid across India and does not expire</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Business/Entity Name *
                  </label>
                  <input
                    type="text"
                    value={applicationData.businessName}
                    onChange={(e) => setApplicationData({...applicationData, businessName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter business name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Number *
                  </label>
                  <input
                    type="text"
                    value={applicationData.pan}
                    onChange={(e) => setApplicationData({...applicationData, pan: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ABCDE1234F"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Entity Type *
                  </label>
                  <select
                  title='Entity Type'
                    value={applicationData.businessType}
                    onChange={(e) => setApplicationData({...applicationData, businessType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select entity type</option>
                    <option value="company">Private Limited Company</option>
                    <option value="partnership">Partnership Firm</option>
                    <option value="llp">Limited Liability Partnership</option>
                    <option value="proprietorship">Proprietorship</option>
                    <option value="trust">Trust</option>
                    <option value="society">Society</option>
                    <option value="government">Government</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                  title='State'
                    value={applicationData.state}
                    onChange={(e) => setApplicationData({...applicationData, state: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select state</option>
                    <option value="maharashtra">Maharashtra</option>
                    <option value="delhi">Delhi</option>
                    <option value="karnataka">Karnataka</option>
                    <option value="tamil-nadu">Tamil Nadu</option>
                    <option value="gujarat">Gujarat</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={applicationData.email}
                    onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={applicationData.phone}
                    onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registered Address *
                  </label>
                  <textarea
                    value={applicationData.address}
                    onChange={(e) => setApplicationData({...applicationData, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter complete registered address"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-900 mb-2">Application Fee</h4>
                <p className="text-sm text-yellow-700">
                  TAN application fee: ₹65 (including GST). Payment can be made online through NSDL website.
                </p>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Submit Application
                </button>
              </div>
            </div>
          )}

          {/* Application Status Tab */}
          {activeTab === 'status' && (
            <div className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-green-900">Application Submitted</h3>
                    <p className="text-sm text-green-700">Application ID: TAN2024001234</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {registrationSteps.map((step) => (
                  <div key={step.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {getStatusIcon(step.status)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{step.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      {step.documents && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">Required documents:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {step.documents.map((doc, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                                {doc}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {step.status === 'completed' && 'Completed'}
                      {step.status === 'current' && 'In Progress'}
                      {step.status === 'pending' && 'Pending'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Current TAN Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-blue-600">TAN Number</div>
                    <div className="font-mono font-bold text-blue-900">ABCD12345E</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">Status</div>
                    <div className="font-medium text-blue-900">Active</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">Allotment Date</div>
                    <div className="font-medium text-blue-900">15-Jan-2024</div>
                  </div>
                  <div>
                    <div className="text-sm text-blue-600">Valid Till</div>
                    <div className="font-medium text-blue-900">Lifetime</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Required Documents</h3>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Download className="h-4 w-4" />
                  Download Checklist
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {requiredDocuments.map((doc, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{doc.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDocumentStatusColor(doc.status)}`}>
                        {doc.status === 'uploaded' && 'Uploaded'}
                        {doc.status === 'pending' && 'Pending'}
                        {doc.status === 'not-required' && 'Not Required'}
                      </span>
                    </div>

                    {doc.status === 'pending' && (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-xs text-gray-500">PDF, JPG, PNG up to 5MB</p>
                        <button className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                          Choose File
                        </button>
                      </div>
                    )}

                    {doc.status === 'uploaded' && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-700">Document uploaded successfully</span>
                          </div>
                          <button className="text-sm text-blue-600 hover:text-blue-800">
                            View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">Document Guidelines</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• All documents should be clear and legible</li>
                  <li>• File size should not exceed 5MB per document</li>
                  <li>• Accepted formats: PDF, JPG, PNG</li>
                  <li>• Ensure all information is visible and not cropped</li>
                  <li>• Documents should be self-attested</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TANRegistration;