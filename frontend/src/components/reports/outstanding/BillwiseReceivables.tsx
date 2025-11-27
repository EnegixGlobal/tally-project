import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { 
  Search, Download, AlertTriangle, 
  TrendingUp, FileText, Target, Eye, Edit, Printer,
  Calculator, DollarSign
} from 'lucide-react';

interface BillDetails {
  id: string;
  partyName: string;
  billNo: string;
  billDate: string;
  dueDate: string;
  billAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  overdueDays: number;
  creditDays: number;
  interestAmount: number;
  voucherType: 'Sales' | 'Receipt' | 'Journal' | 'Debit Note' | 'Credit Note';
  reference?: string;
  narration?: string;
  ageingBucket: '0-30' | '31-60' | '61-90' | '90+';
  partyGroup: string;
  partyAddress?: string;
  partyPhone?: string;
  partyGSTIN?: string;
  creditLimit?: number;
  riskCategory: 'Low' | 'Medium' | 'High' | 'Critical';
}

const BillwiseReceivables: React.FC = () => {
  const { theme } = useAppContext();

  // Your existing states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState('');
  const [selectedAgeingBucket, setSelectedAgeingBucket] = useState('');
  const [selectedRiskCategory, setSelectedRiskCategory] = useState('');
  const [sortBy, setSortBy] = useState<'amount' | 'overdue' | 'party' | 'date'>('amount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
const [showInterestCalculator, setShowInterestCalculator] = useState(false);
const [showBillDetails, setShowBillDetails] = useState(false);

  // New state for fetched bills
  const [billsData, setBillsData] = useState<BillDetails[]>([]);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);


  // Fetch data
  useEffect(() => {
    async function fetchBills() {
      setLoading(true);
      setError(null);
      const company_id = localStorage.getItem('company_id') || '';
const owner_type = localStorage.getItem('userType') || '';
const owner_id = localStorage.getItem(owner_type === 'employee' ? 'employee_id' : 'user_id') || '';

  if (!company_id || !owner_type || !owner_id) {
        setError("Missing tenant information.");
        setLoading(false);
        return;
      }
      try {
        const params = new URLSearchParams();
        // tenant parameters
        params.append("company_id", company_id);
        params.append("owner_type", owner_type);
        params.append("owner_id", owner_id);
        if (searchTerm) params.append('searchTerm', searchTerm);
        if (selectedParty) params.append('partyName', selectedParty);
        if (selectedAgeingBucket) params.append('ageingBucket', selectedAgeingBucket);
        if (selectedRiskCategory) params.append('riskCategory', selectedRiskCategory);
        if (sortBy) params.append('sortBy', sortBy);
        if (sortOrder) params.append('sortOrder', sortOrder);

        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/billwise-receivables?${params.toString()}`);
        if (!res.ok) {
          throw new Error(`Error ${res.status} - ${await res.text()}`);
        }
        const data: BillDetails[] = await res.json();
        setBillsData(data);
        console.log('Tenant Params:', { company_id, owner_type, owner_id });

      } catch (e: any) {
        setError(e.message || 'Failed to load data');
        setBillsData([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, [searchTerm, selectedParty, selectedAgeingBucket, selectedRiskCategory, sortBy, sortOrder]);

  const filteredData = useMemo(() => {
    const filtered = billsData.filter(bill => {
      const matchesSearch = !searchTerm || 
        bill.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.reference?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesParty = !selectedParty || bill.partyName === selectedParty;
      const matchesAgeing = !selectedAgeingBucket || bill.ageingBucket === selectedAgeingBucket;
      const matchesRisk = !selectedRiskCategory || bill.riskCategory === selectedRiskCategory;

      return matchesSearch && matchesParty && matchesAgeing && matchesRisk;
    });


    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'amount':
          comparison = a.outstandingAmount - b.outstandingAmount;
          break;
        case 'overdue':
          comparison = a.overdueDays - b.overdueDays;
          break;
        case 'party':
          comparison = a.partyName.localeCompare(b.partyName);
          break;
        case 'date':
          comparison = new Date(a.billDate).getTime() - new Date(b.billDate).getTime();
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });


    return filtered;
  }, [billsData, searchTerm, selectedParty, selectedAgeingBucket, selectedRiskCategory, sortBy, sortOrder]);


  // *** Summary calculations ***
  const summaryData = useMemo(() => {
    const total = filteredData.reduce((sum, bill) => sum + bill.outstandingAmount, 0);
    const overdue = filteredData.filter(bill => bill.overdueDays > 0).reduce((sum, bill) => sum + bill.outstandingAmount, 0);
    const current = total - overdue;
    const totalInterest = filteredData.reduce((sum, bill) => sum + bill.interestAmount, 0);

    const ageingBreakdown = {
      '0-30': filteredData.filter(b => b.ageingBucket === '0-30').reduce((sum, b) => sum + b.outstandingAmount, 0),
      '31-60': filteredData.filter(b => b.ageingBucket === '31-60').reduce((sum, b) => sum + b.outstandingAmount, 0),
      '61-90': filteredData.filter(b => b.ageingBucket === '61-90').reduce((sum, b) => sum + b.outstandingAmount, 0),
      '90+': filteredData.filter(b => b.ageingBucket === '90+').reduce((sum, b) => sum + b.outstandingAmount, 0),
    };

    return { total, overdue, current, totalInterest, ageingBreakdown };
  }, [filteredData]);

  // Filtering and sorting logic
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-orange-600 bg-orange-100';
      case 'Critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAgeingColor = (bucket: string) => {
    switch (bucket) {
      case '0-30': return 'text-green-600 bg-green-100';
      case '31-60': return 'text-yellow-600 bg-yellow-100';
      case '61-90': return 'text-orange-600 bg-orange-100';
      case '90+': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className={`rounded-xl border p-6 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Bill-wise Receivables
            </h2>
            <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Complete bill-wise outstanding analysis - Tally Style
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setShowInterestCalculator(!showInterestCalculator)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Calculator className="w-4 h-4 mr-2 inline" />
              Interest Calculator
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4 mr-2 inline" />
              Export
            </button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Printer className="w-4 h-4 mr-2 inline" />
              Print
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Outstanding
                </p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  {formatCurrency(summaryData.total)}
                </p>
              </div>
              <TrendingUp className={`w-8 h-8 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Overdue Amount
                </p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                  {formatCurrency(summaryData.overdue)}
                </p>
              </div>
              <AlertTriangle className={`w-8 h-8 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Current Amount
                </p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
                  {formatCurrency(summaryData.current)}
                </p>
              </div>
              <Target className={`w-8 h-8 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Interest Amount
                </p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                  {formatCurrency(summaryData.totalInterest)}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
            </div>
          </div>

          <div className={`p-4 rounded-lg border ${
            theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Bills
                </p>
                <p className={`text-xl font-bold ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`}>
                  {filteredData.length}
                </p>
              </div>
              <FileText className={`w-8 h-8 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
          </div>
        </div>

        {/* Ageing Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.entries(summaryData.ageingBreakdown).map(([bucket, amount]) => (
            <div key={bucket} className={`p-4 rounded-lg border ${
              theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <div className="text-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getAgeingColor(bucket)}`}>
                  {bucket} Days
                </span>
                <p className={`text-lg font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(amount)}
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {((amount / summaryData.total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-xl border p-6 ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Filters & Search
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative">
            <Search className={`absolute left-3 top-2.5 w-4 h-4 ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search bills, parties..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full ${
                theme === 'dark'
                  ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>
          
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            aria-label="Filter by party"
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="">All Parties</option>
            {Array.from(new Set(billsData.map(b => b.partyName))).map(party => (
              <option key={party} value={party}>{party}</option>
            ))}
          </select>

          <select
            value={selectedAgeingBucket}
            onChange={(e) => setSelectedAgeingBucket(e.target.value)}
            aria-label="Filter by ageing bucket"
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="">All Ages</option>
            <option value="0-30">0-30 Days</option>
            <option value="31-60">31-60 Days</option>
            <option value="61-90">61-90 Days</option>
            <option value="90+">90+ Days</option>
          </select>

          <select
            value={selectedRiskCategory}
            onChange={(e) => setSelectedRiskCategory(e.target.value)}
            aria-label="Filter by risk category"
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="">All Risk Categories</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
            <option value="Critical">Critical Risk</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'amount' | 'overdue' | 'party' | 'date')}
            aria-label="Sort by"
            className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              theme === 'dark'
                ? 'border-gray-600 bg-gray-700 text-white'
                : 'border-gray-300 bg-white text-gray-900'
            }`}
          >
            <option value="amount">Sort by Amount</option>
            <option value="overdue">Sort by Overdue</option>
            <option value="party">Sort by Party</option>
            <option value="date">Sort by Date</option>
          </select>

          <div className="flex space-x-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
              className={`px-3 py-2 border rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                  : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
            <button
              onClick={() => setShowBillDetails(!showBillDetails)}
              aria-label={`${showBillDetails ? 'Hide' : 'Show'} bill details`}
              className={`px-3 py-2 border rounded-lg transition-colors ${
                showBillDetails
                  ? 'bg-blue-600 text-white border-blue-600'
                  : theme === 'dark'
                    ? 'border-gray-600 hover:bg-gray-700 text-gray-300'
                    : 'border-gray-300 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bill-wise Data Table */}
      <div className={`rounded-xl border ${
        theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${
          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Bill-wise Outstanding Details
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={`${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <tr>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Party Details
                </th>
                <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Bill Details
                </th>
                <th className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Amount Details
                </th>
                <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Ageing & Risk
                </th>
                <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-500'
                }`}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme === 'dark' ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredData.map((bill) => (
                <tr key={bill.id} className={`hover:bg-opacity-50 transition-colors ${
                  theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                }`}>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {bill.partyName}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {bill.partyGroup}
                      </div>
                      {showBillDetails && (
                        <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          <div>📍 {bill.partyAddress}</div>
                          <div>📞 {bill.partyPhone}</div>
                          <div>🏢 {bill.partyGSTIN}</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                        {bill.billNo}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        📅 {formatDate(bill.billDate)}
                      </div>
                      <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        ⏰ Due: {formatDate(bill.dueDate)}
                      </div>
                      {showBillDetails && bill.reference && (
                        <div className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                          📝 Ref: {bill.reference}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div>
                      <div className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(bill.outstandingAmount)}
                      </div>
                      {showBillDetails && (
                        <>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Bill: {formatCurrency(bill.billAmount)}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                            Received: {formatCurrency(bill.receivedAmount)}
                          </div>
                          {bill.interestAmount > 0 && (
                            <div className={`text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                              Interest: {formatCurrency(bill.interestAmount)}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="space-y-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAgeingColor(bill.ageingBucket)}`}>
                        {bill.ageingBucket} Days
                      </span>
                      <br />
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(bill.riskCategory)}`}>
                        {bill.riskCategory} Risk
                      </span>
                      {bill.overdueDays > 0 && (
                        <>
                          <br />
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            {bill.overdueDays} Days Overdue
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex space-x-2 justify-center">
                      <button
                        title="View Bill"
                        aria-label="View Bill"
                        className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        title="Edit Bill"
                        aria-label="Edit Bill"
                        className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        title="Print Bill"
                        aria-label="Print Bill"
                        className={`p-1 rounded ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interest Calculator Modal */}
      {showInterestCalculator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-xl p-6 max-w-md w-full mx-4 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Interest Calculator
            </h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Outstanding Amount
                </label>
                <input
                  type="number"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  placeholder="Enter rate"
                  defaultValue="18"
                />
              </div>
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Overdue Days
                </label>
                <input
                  type="number"
                  className={`w-full px-3 py-2 border rounded-lg ${
                    theme === 'dark'
                      ? 'border-gray-600 bg-gray-700 text-white'
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}
                  placeholder="Enter days"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowInterestCalculator(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  Calculate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillwiseReceivables;
