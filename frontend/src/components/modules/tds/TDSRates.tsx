import React, { useState } from 'react';
import { Search, Filter, Download, Eye, Calculator , ArrowLeft} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TDSRate {
  id: string;
  section: string;
  description: string;
  rate: number;
  threshold: number;
  surcharge?: string;
  cess: number;
  effectiveFrom: string;
  applicableTo: string;
}

const TDSRates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const tdsRates: TDSRate[] = [
    {
      id: '1',
      section: '192',
      description: 'Salary',
      rate: 0,
      threshold: 250000,
      surcharge: 'As per slab rates',
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'Employees'
    },
    {
      id: '2',
      section: '192A',
      description: 'Premature withdrawal from EPF',
      rate: 10,
      threshold: 50000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'EPF subscribers'
    },
    {
      id: '3',
      section: '193',
      description: 'Interest on securities',
      rate: 10,
      threshold: 5000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'All persons'
    },
    {
      id: '4',
      section: '194',
      description: 'Dividend',
      rate: 10,
      threshold: 5000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'All persons'
    },
    {
      id: '5',
      section: '194A',
      description: 'Interest other than on securities',
      rate: 10,
      threshold: 5000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'All persons'
    },
    {
      id: '6',
      section: '194B',
      description: 'Winning from lottery/crossword puzzle',
      rate: 30,
      threshold: 10000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'All persons'
    },
    {
      id: '7',
      section: '194C',
      description: 'Payment to contractors',
      rate: 1,
      threshold: 30000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'Individual/HUF: 1%, Others: 2%'
    },
    {
      id: '8',
      section: '194D',
      description: 'Insurance commission',
      rate: 5,
      threshold: 15000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'All persons'
    },
    {
      id: '9',
      section: '194I',
      description: 'Rent',
      rate: 10,
      threshold: 240000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'All persons'
    },
    {
      id: '10',
      section: '194J',
      description: 'Professional/technical services',
      rate: 10,
      threshold: 30000,
      cess: 4,
      effectiveFrom: '2023-04-01',
      applicableTo: 'All persons'
    }
  ];

  // const categories = ['all', 'salary', 'interest', 'professional', 'rent', 'contractor', 'commission'];

  const filteredRates = tdsRates.filter(rate => {
    const matchesSearch = rate.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rate.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'salary' && rate.section.startsWith('192')) ||
                           (selectedCategory === 'interest' && ['193', '194A'].includes(rate.section)) ||
                           (selectedCategory === 'professional' && rate.section === '194J') ||
                           (selectedCategory === 'rent' && rate.section === '194I') ||
                           (selectedCategory === 'contractor' && rate.section === '194C') ||
                           (selectedCategory === 'commission' && rate.section === '194D');
    
    return matchesSearch && matchesCategory;
  });

  const getRateColor = (rate: number) => {
    if (rate === 0) return 'bg-gray-100 text-gray-800';
    if (rate <= 5) return 'bg-green-100 text-green-800';
    if (rate <= 10) return 'bg-blue-100 text-blue-800';
    if (rate <= 20) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="min-h-screen pt-[56px] px-4 n ">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/tds')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h1 className="text-2xl font-bold">Form 24Q</h1>
            </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">TDS Rates & Sections</h1>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by section or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
             title='Filter by Category'
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="salary">Salary</option>
              <option value="interest">Interest</option>
              <option value="professional">Professional Services</option>
              <option value="rent">Rent</option>
              <option value="contractor">Contractor</option>
              <option value="commission">Commission</option>
            </select>
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredRates.length} of {tdsRates.length} TDS sections
            </p>
          </div>

          {/* TDS Rates Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Section</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Description</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Rate</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Threshold</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Cess</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Applicable To</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b">
                      <span className="font-mono font-medium text-gray-900">{rate.section}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="text-gray-700">{rate.description}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRateColor(rate.rate)}`}>
                        {rate.rate}%
                      </span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="text-gray-700">₹{rate.threshold.toLocaleString()}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="text-gray-700">{rate.cess}%</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="text-sm text-gray-600">{rate.applicableTo}</span>
                    </td>
                    <td className="p-4 border-b">
                      <button
                      title='View Details'
                      type='button'
                       className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRates.length === 0 && (
            <div className="text-center py-8">
              <Filter className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No TDS rates found matching your criteria</p>
            </div>
          )}
        </div>

        {/* TDS Rate Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: '0% Rate', count: tdsRates.filter(r => r.rate === 0).length, color: 'bg-gray-50' },
            { label: '1-5% Rate', count: tdsRates.filter(r => r.rate > 0 && r.rate <= 5).length, color: 'bg-green-50' },
            { label: '6-10% Rate', count: tdsRates.filter(r => r.rate > 5 && r.rate <= 10).length, color: 'bg-blue-50' },
            { label: '11%+ Rate', count: tdsRates.filter(r => r.rate > 10).length, color: 'bg-red-50' }
          ].map((item, index) => (
            <div key={index} className={`${item.color} rounded-lg shadow-md p-6`}>
              <div className="text-2xl font-bold text-gray-900">{item.count}</div>
              <div className="text-sm text-gray-600">{item.label}</div>
            </div>
          ))}
        </div>

        {/* Important Notes */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Important Notes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Rates are applicable for FY 2023-24 and may change with budget updates</li>
            <li>• Surcharge and cess are applicable as per income tax rules</li>
            <li>• Different rates may apply for non-residents and companies</li>
            <li>• Always verify current rates from official IT Department notifications</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TDSRates;