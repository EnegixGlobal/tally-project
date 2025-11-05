import React, { useState } from 'react';
import { Search, Book, Download, Eye, Plus ,ArrowLeft} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HSNCode {
  id: string;
  code: string;
  description: string;
  chapter: string;
  section: string;
  gstRate: number;
  cess?: number;
  unit: string;
  exemptions?: string[];
}

const HSNCodes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [selectedRate, setSelectedRate] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Sample HSN codes data
  const hsnCodes: HSNCode[] = [
    {
      id: '1',
      code: '1001',
      description: 'Wheat and meslin',
      chapter: '10 - Cereals',
      section: 'II - Vegetable Products',
      gstRate: 0,
      unit: 'KGS',
      exemptions: ['Basic food item']
    },
    {
      id: '2',
      code: '2402',
      description: 'Cigars, cheroots, cigarillos and cigarettes',
      chapter: '24 - Tobacco',
      section: 'IV - Prepared Foodstuffs',
      gstRate: 28,
      cess: 290,
      unit: 'THD'
    },
    {
      id: '3',
      code: '3004',
      description: 'Medicaments consisting of mixed or unmixed products',
      chapter: '30 - Pharmaceutical Products',
      section: 'VI - Chemical Products',
      gstRate: 5,
      unit: 'KGS',
      exemptions: ['Life saving drugs']
    },
    {
      id: '4',
      code: '5208',
      description: 'Woven fabrics of cotton',
      chapter: '52 - Cotton',
      section: 'XI - Textiles',
      gstRate: 5,
      unit: 'MTR'
    },
    {
      id: '5',
      code: '8517',
      description: 'Telephone sets, including smartphones',
      chapter: '85 - Electrical Machinery',
      section: 'XVI - Machinery',
      gstRate: 12,
      unit: 'NOS'
    },
    {
      id: '6',
      code: '8703',
      description: 'Motor cars and other motor vehicles',
      chapter: '87 - Vehicles',
      section: 'XVII - Transport Equipment',
      gstRate: 28,
      cess: 15,
      unit: 'NOS'
    },
    {
      id: '7',
      code: '9403',
      description: 'Other furniture and parts thereof',
      chapter: '94 - Furniture',
      section: 'XX - Miscellaneous',
      gstRate: 18,
      unit: 'NOS'
    },
    {
      id: '8',
      code: '998314',
      description: 'Information technology software services',
      chapter: '99 - Services',
      section: 'XXI - Services',
      gstRate: 18,
      unit: 'OTH'
    }
  ];

  const chapters = ['all', ...Array.from(new Set(hsnCodes.map(code => code.chapter)))];
  const rates = ['all', '0', '5', '12', '18', '28'];

  const filteredCodes = hsnCodes.filter(code => {
    const matchesSearch = code.code.includes(searchTerm) ||
                         code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         code.chapter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChapter = selectedChapter === 'all' || code.chapter === selectedChapter;
    const matchesRate = selectedRate === 'all' || code.gstRate.toString() === selectedRate;
    
    return matchesSearch && matchesChapter && matchesRate;
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
    <div className="min-h-screen pt-[56px] px-4">
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
                <h1 className="text-2xl font-bold">Summary</h1>
            </div>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <Book className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">HSN Codes Directory</h1>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add HSN
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search HSN code or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
            title='Filter by Chapter'
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Chapters</option>
              {chapters.slice(1).map(chapter => (
                <option key={chapter} value={chapter}>{chapter}</option>
              ))}
            </select>

            <select
            title='Filter by GST Rate'
              value={selectedRate}
              onChange={(e) => setSelectedRate(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All GST Rates</option>
              {rates.slice(1).map(rate => (
                <option key={rate} value={rate}>{rate}% GST</option>
              ))}
            </select>
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredCodes.length} of {hsnCodes.length} HSN codes
            </p>
          </div>

          {/* HSN Codes Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCodes.map((code) => (
              <div key={code.id} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-xl font-bold text-gray-900 mb-1">{code.code}</div>
                    <div className="text-sm text-gray-600">{code.chapter}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRateColor(code.gstRate)}`}>
                      {code.gstRate}% GST
                    </span>
                    {code.cess && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        {code.cess}% Cess
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700">{code.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Section</div>
                    <div className="text-sm text-gray-900">{code.section}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">Unit</div>
                    <div className="text-sm text-gray-900">{code.unit}</div>
                  </div>
                </div>

                {code.exemptions && code.exemptions.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Exemptions</div>
                    <div className="flex flex-wrap gap-1">
                      {code.exemptions.map((exemption, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                          {exemption}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <button className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors">
                    <Eye className="h-4 w-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredCodes.length === 0 && (
            <div className="text-center py-12">
              <Book className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500">No HSN codes found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-gray-900">{hsnCodes.length}</div>
            <div className="text-sm text-gray-600">Total HSN Codes</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-blue-600">{chapters.length - 1}</div>
            <div className="text-sm text-gray-600">Chapters</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-green-600">{hsnCodes.filter(c => c.exemptions).length}</div>
            <div className="text-sm text-gray-600">With Exemptions</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-2xl font-bold text-orange-600">{hsnCodes.filter(c => c.cess).length}</div>
            <div className="text-sm text-gray-600">With Cess</div>
          </div>
        </div>
      </div>

      {/* Add HSN Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New HSN Code</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="HSN Code"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="Description"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
              title='Select Chapter'
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="">Select GST Rate</option>
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
                <option value="28">28%</option>
              </select>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Add HSN Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HSNCodes;