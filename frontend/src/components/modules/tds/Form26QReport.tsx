import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FileText, Landmark, Users, Search, Loader2, Edit, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import { useAuth } from '../../../home/context/AuthContext';
import axiosInstance from '../../../api/axiosInstance';
import Swal from 'sweetalert2';

type TabType = 'form' | 'challan' | 'annexure';

interface Form26QReturn {
  id: number;
  assessmentYear: string;
  tan: string;
  panOfDeductor: string;
  deductorName: string;
  category: string;
  totalDeductees: number;
  totalTaxDeducted: number;
  totalTaxDeposited: number;
  createdAt: string;
  // additional fields for details
  deductor_flat_no?: string;
  deductor_premises_name?: string;
  deductor_road_street?: string;
  deductor_area?: string;
  deductor_town_city?: string;
  deductor_state?: string;
  deductor_pin_code?: string;
  resp_name?: string;
  resp_designation?: string;
  verification_full_name?: string;
  verification_date?: string;
}

const assessmentYears = [
  { value: '2027-28', label: 'AY 2027-28' },
  { value: '2026-27', label: 'AY 2026-27' },
  { value: '2025-26', label: 'AY 2025-26' },
  { value: '2024-25', label: 'AY 2024-25' }
];

export const Form26QReport: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAppContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as TabType) || 'form';

  const [year, setYear] = useState(assessmentYears[0].value);
  const [data, setData] = useState<Form26QReturn[]>([]);
  const [challansData, setChallansData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { companyId } = useAuth();
  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

  const setActiveTab = (tab: TabType) => {
    setSearchParams({ tab });
  };

  const handleEdit = (id: number) => {
    navigate(`/app/tds/form-26q?editId=${id}`);
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the Form 26Q return and all associated Challans and Annexures!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/tds26q/${id}`);
        Swal.fire({
          title: 'Deleted!',
          text: 'The Form 26Q return has been deleted.',
          icon: 'success',
          confirmButtonColor: '#000000',
        });
        fetchReturns();
      } catch (err) {
        console.error('Delete error', err);
        Swal.fire('Error', 'Failed to delete the record', 'error');
      }
    }
  };

  const handleEditChallan = (id: number) => {
    navigate(`/app/tds/form-26q?tab=challan`);
  };

  const handleDeleteChallan = async (id: number) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This will permanently delete the Challan entry!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axiosInstance.delete(`/tds26q_challan/${id}`);
        Swal.fire({
          title: 'Deleted!',
          text: 'The Challan has been deleted.',
          icon: 'success',
          confirmButtonColor: '#000000',
        });
        fetchChallans();
      } catch (err) {
        console.error('Delete error', err);
        Swal.fire('Error', 'Failed to delete the challan', 'error');
      }
    }
  };

  const fetchReturns = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/tds26q?year=${year}`);
      setData(response.data);
    } catch (err: any) {
      console.error('Error fetching Form 26Q returns:', err);
      setError('Failed to fetch report data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchChallans = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosInstance.get(`/tds26q_challan?companyId=${companyId || ''}`);
      setChallansData(response.data);
    } catch (err: any) {
      console.error('Error fetching Challans:', err);
      setError('Failed to fetch challan data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'form') {
      fetchReturns();
    } else if (activeTab === 'challan') {
      fetchChallans();
    }
  }, [year, activeTab, companyId]);

  const tabs = [
    { id: 'form', label: 'Form Returns', icon: FileText },
    { id: 'challan', label: 'Challan Details', icon: Landmark },
    { id: 'annexure', label: 'Annexure Details', icon: Users },
  ] as const;

  return (
    <div className="min-h-screen pt-16 px-4 md:px-8 pb-12 bg-gray-50 text-black">
      <div className="w-full space-y-6">
        
        {/* Header Section */}
        <div className="flex items-center justify-between border-b border-black pb-5">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/app/tds-report')}
              className="p-2.5 rounded-xl border border-black bg-white text-black hover:bg-gray-50 shadow-sm transition-all duration-300"
              title="Back to TDS Reports"
            >
              <ArrowLeft size={20} className="transition-transform duration-200 hover:-translate-x-1" />
            </button>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-black">
                Form 26Q Report
              </h1>
              <p className="text-sm font-semibold text-gray-700 mt-1">
                View filed Form 26Q returns and associated details
              </p>
            </div>
          </div>
        </div>

        {/* High-Contrast Tabbed Navigation Bar */}
        <div className="rounded-2xl p-1.5 border border-black bg-white shadow-sm flex space-x-2 w-full md:w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-black text-white shadow-md'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-black'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Filters */}
        {activeTab === 'form' && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-black flex items-center gap-4 w-max">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Assessment Year</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-64 p-2 rounded-lg border bg-white text-black border-black focus:ring-2 focus:ring-blue-500 outline-none font-semibold text-sm"
              >
                {assessmentYears.map(ay => (
                  <option key={ay.value} value={ay.value}>{ay.label}</option>
                ))}
              </select>
            </div>
            <div className="pt-5">
              <button 
                onClick={fetchReturns}
                className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg font-bold border border-black hover:bg-gray-800 transition-colors"
              >
                <Search size={16} />
                Search
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-black overflow-hidden">
          {activeTab === 'form' && (
            <div className="p-0">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="animate-spin text-gray-500" size={32} />
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-600 font-bold">{error}</div>
              ) : data.length === 0 ? (
                <div className="p-12 text-center text-gray-500 font-semibold">
                  No Form 26Q Returns found for {year}.
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-black text-black">
                      <tr>
                        <th className="p-4 font-bold border-r border-black w-10"></th>
                        <th className="p-4 font-bold border-r border-black">Sr No.</th>
                        <th className="p-4 font-bold border-r border-black">Date Filed</th>
                        <th className="p-4 font-bold border-r border-black">TAN</th>
                        <th className="p-4 font-bold border-r border-black">Deductor Name</th>
                        <th className="p-4 font-bold border-r border-black">Category</th>
                        <th className="p-4 font-bold border-r border-black text-center">Total Deductees</th>
                        <th className="p-4 font-bold border-r border-black text-right">Tax Deducted</th>
                        <th className="p-4 font-bold border-r border-black text-right">Tax Deposited</th>
                        <th className="p-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.map((row, index) => (
                        <React.Fragment key={row.id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="p-4 text-center border-r border-black">
                              <button 
                                onClick={() => setExpandedRowId(expandedRowId === row.id ? null : row.id)}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                {expandedRowId === row.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>
                            <td className="p-4 font-semibold border-r border-black">{index + 1}</td>
                            <td className="p-4 font-medium border-r border-black">
                              {new Date(row.createdAt).toLocaleString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </td>
                            <td className="p-4 font-bold font-mono text-blue-700 border-r border-black">{row.tan}</td>
                            <td className="p-4 font-medium border-r border-black">{row.deductorName}</td>
                            <td className="p-4 font-medium border-r border-black">{row.category}</td>
                            <td className="p-4 font-bold text-center border-r border-black">{row.totalDeductees}</td>
                            <td className="p-4 font-bold text-right text-green-700 border-r border-black">
                              ₹{Number(row.totalTaxDeducted).toLocaleString()}
                            </td>
                            <td className="p-4 font-bold text-right text-blue-700 border-r border-black">
                              ₹{Number(row.totalTaxDeposited).toLocaleString()}
                            </td>
                            <td className="p-4 font-medium text-center space-x-2">
                              <button onClick={() => handleEdit(row.id)} className="p-1.5 text-black hover:bg-gray-200 rounded transition-colors" title="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDelete(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                          
                          {expandedRowId === row.id && (
                            <tr className="bg-gray-100">
                              <td colSpan={10} className="p-6 border-b border-black">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                                  <div>
                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Deductor Details</h4>
                                    <p className="mb-1"><span className="font-semibold">PAN:</span> {row.panOfDeductor}</p>
                                    <p className="mb-1"><span className="font-semibold">Address:</span> {row.deductor_flat_no}, {row.deductor_premises_name}, {row.deductor_road_street}, {row.deductor_area}</p>
                                    <p className="mb-1"><span className="font-semibold">City/State:</span> {row.deductor_town_city}, {row.deductor_state} - {row.deductor_pin_code}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Responsible Person</h4>
                                    <p className="mb-1"><span className="font-semibold">Name:</span> {row.resp_name}</p>
                                    <p className="mb-1"><span className="font-semibold">Designation:</span> {row.resp_designation}</p>
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">Verification</h4>
                                    <p className="mb-1"><span className="font-semibold">Full Name:</span> {row.verification_full_name}</p>
                                    <p className="mb-1"><span className="font-semibold">Date:</span> {row.verification_date ? new Date(row.verification_date).toLocaleDateString() : 'N/A'}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'challan' && (
            <div className="p-0">
              {loading ? (
                <div className="flex justify-center items-center p-12">
                  <Loader2 className="animate-spin text-gray-500" size={32} />
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-600 font-bold">{error}</div>
              ) : challansData.length === 0 ? (
                <div className="p-12 text-center text-gray-500 font-semibold">
                  No Challan details found.
                </div>
              ) : (
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-gray-50 border-b border-black text-black">
                      <tr>
                        <th className="p-4 font-bold border-r border-black">Sr No.</th>
                        <th className="p-4 font-bold border-r border-black">BSR Code</th>
                        <th className="p-4 font-bold border-r border-black">Date of Deposit</th>
                        <th className="p-4 font-bold border-r border-black">Challan Serial No.</th>
                        <th className="p-4 font-bold border-r border-black text-right">Tax</th>
                        <th className="p-4 font-bold border-r border-black text-right">Total Amount</th>
                        <th className="p-4 font-bold border-r border-black text-center">Status</th>
                        <th className="p-4 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {challansData.map((row, index) => (
                        <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-semibold border-r border-black">{index + 1}</td>
                          <td className="p-4 font-medium border-r border-black">{row.bsr_code}</td>
                          <td className="p-4 font-medium border-r border-black">
                            {row.date_of_deposit ? new Date(row.date_of_deposit).toLocaleDateString('en-IN') : '-'}
                          </td>
                          <td className="p-4 font-medium border-r border-black">{row.challan_serial_no}</td>
                          <td className="p-4 font-medium text-right border-r border-black">₹{Number(row.tax).toLocaleString()}</td>
                          <td className="p-4 font-bold text-right text-green-700 border-r border-black">
                            ₹{Number(row.total_amount).toLocaleString()}
                          </td>
                          <td className="p-4 font-medium text-center border-r border-black">
                            <span className={`px-2 py-1 rounded-md text-xs font-bold ${row.status === 'Deposited' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="p-4 font-medium text-center space-x-2">
                            <button onClick={() => handleEditChallan(row.id)} className="p-1.5 text-black hover:bg-gray-200 rounded transition-colors" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDeleteChallan(row.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'annexure' && (
            <div className="p-12 text-center text-gray-500 font-semibold">
              Annexure Report View - To be implemented
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Form26QReport;
