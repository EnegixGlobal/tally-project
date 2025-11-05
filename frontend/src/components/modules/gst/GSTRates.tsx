import React, { useState } from 'react';
import { Search, Filter, Download, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GSTRate {
  id: string;
  category: string;
  description: string;
  hsnCode: string;
  gstRate: number;
  cess?: number;
  effectiveFrom: string;
}

const GSTRates: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const [selectedRate, setSelectedRate] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Sample GST rates data
  const gstRates: GSTRate[] = [
    {
      id: '1',
      category: 'Food Items',
      description: 'Rice, wheat, flour',
      hsnCode: '1001-1008',
      gstRate: 0,
      effectiveFrom: '2017-07-01'
    },
    {
      id: '2',
      category: 'Medicines',
      description: 'Life saving drugs',
      hsnCode: '3001-3006',
      gstRate: 5,
      effectiveFrom: '2017-07-01'
    },
    {
      id: '3',
      category: 'Textiles',
      description: 'Cotton fabrics',
      hsnCode: '5208-5212',
      gstRate: 5,
      effectiveFrom: '2017-07-01'
    },
    {
      id: '4',
      category: 'Electronics',
      description: 'Mobile phones',
      hsnCode: '8517',
      gstRate: 12,
      effectiveFrom: '2017-07-01'
    },
    {
      id: '5',
      category: 'Services',
      description: 'Restaurant services',
      hsnCode: '996331',
      gstRate: 18,
      effectiveFrom: '2017-07-01'
    },
    {
      id: '6',
      category: 'Automobiles',
      description: 'Motor cars',
      hsnCode: '8703',
      gstRate: 28,
      cess: 15,
      effectiveFrom: '2017-07-01'
    },
    {
      id: '7',
      category: 'Luxury Items',
      description: 'Cigarettes',
      hsnCode: '2402',
      gstRate: 28,
      cess: 290,
      effectiveFrom: '2017-07-01'
    },
    {
      id: '8',
      category: 'IT Services',
      description: 'Software development',
      hsnCode: '998314',
      gstRate: 18,
      effectiveFrom: '2017-07-01'
    }
  ];

  const categories = ['all', ...Array.from(new Set(gstRates.map(rate => rate.category)))];
  const rates = ['all', '0', '5', '12', '18', '28'];

  const filteredRates = gstRates.filter(rate => {
    const matchesSearch = rate.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rate.hsnCode.includes(searchTerm) ||
                         rate.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRate = selectedRate === 'all' || rate.gstRate.toString() === selectedRate;
    const matchesCategory = selectedCategory === 'all' || rate.category === selectedCategory;
    
    return matchesSearch && matchesRate && matchesCategory;
  });

  const getRateColor = (rate: number) => {
    switch (rate) {
      case 0: return 'bg-gray-100 text-gray-800';
      case 5: return 'bg-blue-100 text-blue-800';
      case 12: return 'bg-yellow-100 text-yellow-800';
      case 18: return 'bg-green-100 text-green-800';
      case 28: return 'bg-red-100 text-red-800';
      default: return 'bg-purple-100 text-purple-800';
    }
  };

  return (
    <div className="min-h-screen pt-[56px] px-4 ">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center mb-4">
        
                    <button
                        title='Back to Reports'
                        type='button'
                          onClick={() => navigate('/app/gst')}
                          className="mr-4 p-2 rounded-full hover:bg-gray-200"
                        >
                          <ArrowLeft size={20} />
                        </button>
                        <h1 className="text-2xl font-bold">GST Rates & HSN Codes</h1>
                    </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-900">GST Rates & HSN Codes</h1>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description, HSN code, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
            title='Select GST Rate'
              value={selectedRate}
              onChange={(e) => setSelectedRate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All GST Rates</option>
              {rates.slice(1).map(rate => (
                <option key={rate} value={rate}>{rate}% GST</option>
              ))}
            </select>

            <select
            title='Select Category'
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.slice(1).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredRates.length} of {gstRates.length} GST rates
            </p>
          </div>

          {/* GST Rates Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Category</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Description</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">HSN Code</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">GST Rate</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Cess</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Effective From</th>
                  <th className="text-left p-4 border-b font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b">
                      <span className="text-sm font-medium text-gray-900">{rate.category}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="text-sm text-gray-700">{rate.description}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className="text-sm font-mono text-gray-900">{rate.hsnCode}</span>
                    </td>
                    <td className="p-4 border-b">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRateColor(rate.gstRate)}`}>
                        {rate.gstRate}%
                      </span>
                    </td>
                    <td className="p-4 border-b">
                      {rate.cess ? (
                        <span className="text-sm text-orange-600 font-medium">{rate.cess}%</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4 border-b">
                      <span className="text-sm text-gray-600">{rate.effectiveFrom}</span>
                    </td>
                    <td className="p-4 border-b">
                      <button 
                      title='View Details'
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
              <p className="text-gray-500">No GST rates found matching your criteria</p>
            </div>
          )}
        </div>

        {/* GST Rate Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {[0, 5, 12, 18, 28].map(rate => {
            const count = gstRates.filter(r => r.gstRate === rate).length;
            return (
              <div key={rate} className="bg-white rounded-lg shadow-md p-6">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-3 ${getRateColor(rate)}`}>
                  {rate}% GST
                </div>
                <div className="text-2xl font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600">Items</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default GSTRates;