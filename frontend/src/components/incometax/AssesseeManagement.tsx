import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { useCompany } from '../../context/CompanyContext';
import { 
  ArrowLeft, User, Plus, Edit, Trash2, Search, Download, Upload,
  Building2, MapPin, Mail, Phone, Calendar, Shield, ChevronDown, ChevronUp, Briefcase, Globe, FileText
} from 'lucide-react';

interface Assessee {
  id: string;
  name: string;
  fatherName: string;
  dateOfBirth: string;
  pan: string;
  aadhar: string;
  email: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  profession: string;
  category: 'individual' | 'huf' | 'firm' | 'company';
  assessmentYear: string;
  status: 'active' | 'inactive';
  createdDate: string;
}

const AssesseeManagement: React.FC = () => {
  const { theme } = useAppContext();
  const { companyInfo } = useCompany();
  const navigate = useNavigate();

  const [showCompanyDetails, setShowCompanyDetails] = useState(true);
  const [assessees, setAssessees] = useState<Assessee[]>([]);

  const cInfo = companyInfo ? {
    name: companyInfo.name,
    panNumber: companyInfo.pan_number || companyInfo.panNumber || '',
    tanNumber: companyInfo.tan_number || companyInfo.tanNumber || '',
    gstNumber: companyInfo.gst_number || companyInfo.gstNumber || companyInfo.gstin || '',
    vatNumber: companyInfo.vat_number || companyInfo.vatNumber || '',
    taxType: companyInfo.tax_type || companyInfo.taxType || 'GST',
    phoneNumber: companyInfo.phone_number || companyInfo.phoneNumber || companyInfo.phone || '',
    email: companyInfo.email || '',
    address: companyInfo.address || '',
    pin: companyInfo.pin || companyInfo.pin_code || companyInfo.pincode || '',
    state: companyInfo.state || '',
    country: companyInfo.country || 'India',
    financialYear: companyInfo.financial_year || companyInfo.financialYear || '',
    booksBeginningYear: companyInfo.books_beginning_year || companyInfo.booksBeginningYear || '',
    backDateAllowed: companyInfo.back_date_allowed !== undefined 
      ? (companyInfo.back_date_allowed === 1 || companyInfo.back_date_allowed === true || companyInfo.back_date_allowed === '1')
      : (companyInfo.backDateAllowed === 1 || companyInfo.backDateAllowed === true || companyInfo.backDateAllowed === '1'),
    maintainBy: companyInfo.fdAccountType || companyInfo.maintainBy || companyInfo.maintain_by || 'self',
    accountantName: companyInfo.fdAccountantName || companyInfo.accountantName || companyInfo.accountant_name || ''
  } : null;

useEffect(() => {
  const fetchAssessees = async () => {
    try {
      const employee_id = localStorage.getItem('employee_id');
      const company_id = localStorage.getItem('company_id');

      if (!employee_id || !company_id) {
        console.error('Employee ID or Company ID not found in local storage');
        return;
      }

      // Add employee_id and company_id as query parameters
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assessee?employee_id=${encodeURIComponent(employee_id)}&company_id=${encodeURIComponent(company_id)}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error fetching assessees: ${response.statusText}`);
      }

      const data: Assessee[] = await response.json();
      setAssessees(data);
    } catch (error: any) {
      console.error('Failed to fetch assessees:', error);
      // Optional: set error state or notify user here
    }
  };

  fetchAssessees();
}, []);



  const [showForm, setShowForm] = useState(false);
  const [editingAssessee, setEditingAssessee] = useState<Assessee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
// Persist/Load assessees locally so other modules (like ITR Filing) can fetch by PAN without backend
  const ASSESSEE_STORAGE_KEY = 'assessee_list_v1';

  // Load from localStorage once on mount (if present), otherwise keep initial seed
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(ASSESSEE_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved) && saved.length >= 0) {
          setAssessees(saved);
        }
      }
    } catch (e) {
      // ignore JSON/Storage errors silently
      console.warn('Failed to read assessees from localStorage', e);
    }
  }, []);

  // Save to localStorage whenever list changes
  React.useEffect(() => {
    try {
      localStorage.setItem(ASSESSEE_STORAGE_KEY, JSON.stringify(assessees));
    } catch (e) {
      console.warn('Failed to save assessees to localStorage', e);
    }
  }, [assessees]);
  const [formData, setFormData] = useState<Omit<Assessee, 'id' | 'createdDate'>>({
    name: '',
    fatherName: '',
    dateOfBirth: '',
    pan: '',
    aadhar: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: ''
    },
    profession: '',
    category: 'individual',
    assessmentYear: '2024-25',
    status: 'active'
  });
  
  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const employee_id = localStorage.getItem('employee_id');
      const company_id = localStorage.getItem('company_id') || '';

      if (!employee_id) {
        alert('Employee ID not found in local storage');
        return;
      }

      const payload = {
        ...formData,
        employee_id,
        company_id,
      };

      const url = editingAssessee
        ? `${import.meta.env.VITE_API_URL}/api/assessee/${editingAssessee.id}` // For update (assuming you have PUT)
        : `${import.meta.env.VITE_API_URL}/api/assessee`; // For create

      const method = editingAssessee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert('Failed to save assessee: ' + (errorData.error || response.statusText));
        return;
      }

      const data = await response.json();

      if (data.success) {
        alert(`Assessee ${editingAssessee ? 'updated' : 'added'} successfully.`);

        if (editingAssessee) {
          // Update assessee in list
          setAssessees(prev =>
            prev.map(a => (a.id === editingAssessee.id ? data.assessee : a))
          );
        } else {
          // Add new assessee to list
          setAssessees(prev => [...prev, data.assessee]);
        }

        resetForm();
      } else {
        alert('Failed to save assessee');
      }
    } catch (error: any) {
      alert('Error submitting form: ' + (error.message || 'Unknown error'));
    }
  };

  // Reset form data and close form
  const resetForm = () => {
    setFormData({
      name: '',
      fatherName: '',
      dateOfBirth: '',
      pan: '',
      aadhar: '',
      email: '',
      phone: '',
      address: { line1: '', line2: '', city: '', state: '', pincode: '' },
      profession: '',
      category: 'individual',
      assessmentYear: '2024-25',
      status: 'active',
    });
    setEditingAssessee(null);
    setShowForm(false);
  };


 // Initialize form for edit
  const handleEdit = (assessee: Assessee) => {
    setFormData({
      name: assessee.name,
      fatherName: assessee.fatherName,
      dateOfBirth: assessee.dateOfBirth,
      pan: assessee.pan,
      aadhar: assessee.aadhar || '',
      email: assessee.email,
      phone: assessee.phone,
      address: assessee.address,
      profession: assessee.profession,
      category: assessee.category,
      assessmentYear: assessee.assessmentYear,
      status: assessee.status,
    });
    setEditingAssessee(assessee);
    setShowForm(true);
  };

const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assessee?')) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assessee/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        alert('Failed to delete assessee');
        return;
      }
      setAssessees(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert('Error deleting assessee');
    }
  };

  const filteredAssessees = assessees.filter(assessee => {
    const matchesSearch = assessee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessee.pan.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assessee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || assessee.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const inputClass = `w-full p-2 rounded border ${
    theme === 'dark' 
      ? 'bg-gray-700 border-gray-600 focus:border-blue-500' 
      : 'bg-white border-gray-300 focus:border-blue-500'
  } outline-none transition-colors`;

  const sectionClass = `p-6 mb-6 rounded-lg ${
    theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
  }`;

  return (
    <div className="pt-[56px] px-4">
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/app/income-tax')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
          title="Back to Income Tax"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold">Assessee Management</h1>
      </div>

      {/* Active Company Details Panel */}
      {cInfo && (
        <div className={`mb-6 rounded-lg border transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700 text-white' 
            : 'bg-white border-gray-200 shadow-sm text-gray-800'
        }`}>
          {/* Header row */}
          <div 
            onClick={() => setShowCompanyDetails(!showCompanyDetails)}
            className={`p-4 flex items-center justify-between cursor-pointer select-none rounded-t-lg transition-colors ${
              theme === 'dark' ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  {cInfo.name}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-600'
                  }`}>
                    Active Company
                  </span>
                </h3>
                <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {cInfo.panNumber && <span className="font-mono">PAN: {cInfo.panNumber}</span>}
                  {cInfo.tanNumber && <span className="font-mono">TAN: {cInfo.tanNumber}</span>}
                  {cInfo.gstNumber && <span className="font-mono">GSTIN: {cInfo.gstNumber}</span>}
                  {cInfo.vatNumber && <span className="font-mono">VAT: {cInfo.vatNumber}</span>}
                </div>
              </div>
            </div>
            <button 
              className={`p-1.5 rounded-md transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
              title={showCompanyDetails ? "Collapse Details" : "Expand Details"}
              onClick={(e) => {
                e.stopPropagation();
                setShowCompanyDetails(!showCompanyDetails);
              }}
            >
              {showCompanyDetails ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

          {/* Collapsible Content */}
          {showCompanyDetails && (
            <div className={`p-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-150'}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Registration & Tax */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Tax & Registration</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2 text-sm">
                      <Shield size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">PAN / TAN Number</span>
                        <span className="font-mono font-medium">{cInfo.panNumber || 'N/A'} {cInfo.tanNumber ? ` / ${cInfo.tanNumber}` : ''}</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 text-sm">
                      <FileText size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">Tax Registration ({cInfo.taxType || 'GST'})</span>
                        <span className="font-mono font-medium">{cInfo.gstNumber || cInfo.vatNumber || 'Not Registered'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Contact Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2 text-sm">
                      <Phone size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">Phone Number</span>
                        <span className="font-medium">{cInfo.phoneNumber || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 text-sm">
                      <Mail size={16} className="text-green-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">Email Address</span>
                        <span className="font-medium truncate max-w-[200px] block" title={cInfo.email}>{cInfo.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Details */}
                <div className="space-y-3 md:col-span-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Address Details</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2 text-sm">
                      <MapPin size={16} className="text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">Registered Address</span>
                        <span className="font-medium block leading-tight">{cInfo.address || 'N/A'}</span>
                        <span className="font-medium block mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {[cInfo.state, cInfo.pin, cInfo.country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial & Management */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Financial & Management</h4>
                  <div className="space-y-2">
                    <div className="flex items-start space-x-2 text-sm">
                      <Calendar size={16} className="text-purple-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">Financial / Books Year</span>
                        <span className="font-medium">FY {cInfo.financialYear || 'N/A'} (From {cInfo.booksBeginningYear || 'N/A'})</span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 text-sm">
                      <Briefcase size={16} className="text-purple-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">Books Managed By</span>
                        <span className="font-medium text-xs">
                          {cInfo.maintainBy === 'accountant' ? `CA / Accountant (${cInfo.accountantName || 'N/A'})` : 'Self Managed'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-start space-x-2 text-sm">
                      <Globe size={16} className="text-purple-500 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block text-xs">Back Date Allowed</span>
                        <span className="font-medium text-xs">
                          {cInfo.backDateAllowed ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      <div className={`mt-6 p-4 rounded ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Note:</span> Maintain accurate assessee records for proper tax filing. 
          PAN is mandatory for all tax-related transactions. Keep contact information updated for timely communications.
        </p>
      </div>
    </div>
  );
};

export default AssesseeManagement;
