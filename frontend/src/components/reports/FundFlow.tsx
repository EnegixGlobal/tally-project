import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Filter, TrendingUp, TrendingDown } from 'lucide-react';

interface FundFlowItem {
  category: string;
  items: {
    name: string;
    current: number;
    previous: number;
    change: number;
    isSource: boolean;
  }[];
}

const FundFlow: React.FC = () => {
  const { theme } = useAppContext();
  const navigate = useNavigate();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2024-25');
  const [fundFlowData, setFundFlowData] = useState<FundFlowItem[]>([]);
  const [totalSources, setTotalSources] = useState(0);
  const [totalApplications, setTotalApplications] = useState(0);
  const [netFundFlow, setNetFundFlow] = useState(0);
  const [, setLoading] = useState(false);
  const [, setError] = useState<string | null>(null);

  const companyId = localStorage.getItem("company_id") || '';
  const ownerType = localStorage.getItem("supplier") || '';
  const ownerId = localStorage.getItem(ownerType === "employee" ? "employee_id" : "user_id") || '';
  // Mock fund flow data
  // const fundFlowData: FundFlowItem[] = [
  //   {
  //     category: 'Sources of Funds',
  //     items: [
  //       { name: 'Capital Account', current: 5000000, previous: 4500000, change: 500000, isSource: true },
  //       { name: 'Retained Earnings', current: 2500000, previous: 2000000, change: 500000, isSource: true },
  //       { name: 'Long-term Loans', current: 3000000, previous: 2800000, change: 200000, isSource: true },
  //       { name: 'Depreciation', current: 800000, previous: 600000, change: 200000, isSource: true },
  //       { name: 'Decrease in Current Assets', current: 0, previous: 0, change: 0, isSource: true },
  //       { name: 'Increase in Current Liabilities', current: 1200000, previous: 1000000, change: 200000, isSource: true }
  //     ]
  //   },
  //   {
  //     category: 'Applications of Funds',
  //     items: [
  //       { name: 'Fixed Assets Addition', current: 4200000, previous: 3500000, change: 700000, isSource: false },
  //       { name: 'Increase in Current Assets', current: 2800000, previous: 2300000, change: 500000, isSource: false },
  //       { name: 'Decrease in Current Liabilities', current: 0, previous: 0, change: 0, isSource: false },
  //       { name: 'Dividend Payments', current: 300000, previous: 250000, change: 50000, isSource: false },
  //       { name: 'Loan Repayments', current: 400000, previous: 350000, change: 50000, isSource: false }
  //     ]
  //   }
  // ];
useEffect(() => {
    if (!companyId || !ownerType || !ownerId) {
      setError('Missing tenant information.');
      return;
    }

    const fetchFundFlow = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = new URL(`${import.meta.env.VITE_API_URL}/api/fund-flow`);
        url.searchParams.append('financialYear', selectedYear);
        url.searchParams.append('company_id', companyId);
        url.searchParams.append('owner_type', ownerType);
        url.searchParams.append('owner_id', ownerId);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`Failed to load fund flow data: ${res.statusText}`);
        const data = await res.json();

        setFundFlowData(data.fundFlowData || []);
        setTotalSources(data.totalSources || 0);
        setTotalApplications(data.totalApplications || 0);
        setNetFundFlow(data.netFundFlow || 0);
      } catch (e: any) {
        setError(e.message || 'Error loading fund flow data.');
      } finally {
        setLoading(false);
      }
    };

    fetchFundFlow();
  }, [selectedYear, companyId, ownerType, ownerId]);

  // Calculate totals
  // const totalSources = fundFlowData[0].items.reduce((sum, item) => sum + item.change, 0);
  // const totalApplications = fundFlowData[1].items.reduce((sum, item) => sum + item.change, 0);
  // const netFundFlow = totalSources - totalApplications;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(amount));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create HTML content for download
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fund Flow Statement - ${selectedYear}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .header { text-align: center; margin-bottom: 30px; }
            .total { font-weight: bold; background-color: #f9f9f9; }
            .currency { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Fund Flow Statement</h1>
            <h2>For the Year Ended ${selectedYear}</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Particulars</th>
                <th class="currency">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr class="total">
                <td><strong>Sources of Funds:</strong></td>
                <td></td>
              </tr>
              ${fundFlowData[0].items.map(item => 
                item.change > 0 ? `<tr><td>&nbsp;&nbsp;${item.name}</td><td class="currency">${formatCurrency(item.change)}</td></tr>` : ''
              ).join('')}
              <tr class="total">
                <td><strong>Total Sources</strong></td>
                <td class="currency"><strong>${formatCurrency(totalSources)}</strong></td>
              </tr>
              <tr class="total">
                <td><strong>Applications of Funds:</strong></td>
                <td></td>
              </tr>
              ${fundFlowData[1].items.map(item => 
                item.change > 0 ? `<tr><td>&nbsp;&nbsp;${item.name}</td><td class="currency">${formatCurrency(item.change)}</td></tr>` : ''
              ).join('')}
              <tr class="total">
                <td><strong>Total Applications</strong></td>
                <td class="currency"><strong>${formatCurrency(totalApplications)}</strong></td>
              </tr>
              <tr class="total">
                <td><strong>Net Fund Flow</strong></td>
                <td class="currency"><strong>${formatCurrency(netFundFlow)}</strong></td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Fund_Flow_Statement_${selectedYear}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className='pt-[56px] px-4'>
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          title='Back to Reports'
          type="button"
          onClick={() => navigate('/app/reports')}
          className={`mr-4 p-2 rounded-full ${
            theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
          }`}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold flex-1">Fund Flow Statement</h1>
        <div className="flex space-x-2">
          <button
            title='Show Filters'
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`p-2 rounded-lg ${
              showFilterPanel 
                ? (theme === 'dark' ? 'bg-blue-600' : 'bg-blue-500 text-white')
                : (theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200')
            }`}
          >
            <Filter size={16} />
          </button>
          <button
            title='Print Report'
            onClick={handlePrint}
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Printer size={16} />
          </button>
          <button
            title='Download Report'
            onClick={handleDownload}
            className={`p-2 rounded-lg ${
              theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilterPanel && (
        <div className={`p-4 rounded-lg mb-6 ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
        }`}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Financial Year</label>
              <select
                title="Select Financial Year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className={`w-full p-2 rounded border ${
                  theme === 'dark' 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-black'
                } outline-none`}
              >
                <option value="2024-25">2024-25</option>
                <option value="2023-24">2023-24</option>
                <option value="2022-23">2022-23</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Report Period */}
      <div className={`p-4 rounded-lg mb-6 ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <h3 className="font-semibold mb-2">Report Period</h3>
        <p className="text-sm">
          Financial Year: {selectedYear} | 
          Period: 1-Apr-{selectedYear.split('-')[0]} to 31-Mar-{selectedYear.split('-')[1]}
        </p>
      </div>

      {/* Fund Flow Statement */}
      <div className={`rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow'
      }`}>
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-center">
            Fund Flow Statement for the Year Ended {selectedYear}
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <th className="text-left p-3 font-semibold">Particulars</th>
                  <th className="text-right p-3 font-semibold">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {fundFlowData.map((section, sectionIndex) => (
                  <React.Fragment key={sectionIndex}>
                    <tr className={`${
                      theme === 'dark' ? 'bg-gray-750' : 'bg-gray-50'
                    }`}>
                      <td className="p-3 font-semibold">
                        {section.category}:
                        {sectionIndex === 0 ? (
                          <TrendingUp className="inline ml-2" size={16} />
                        ) : (
                          <TrendingDown className="inline ml-2" size={16} />
                        )}
                      </td>
                      <td></td>
                    </tr>
                    {section.items.map((item, itemIndex) => 
                      item.change > 0 ? (
                        <tr key={itemIndex} className={`border-b ${
                          theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
                        }`}>
                          <td className="p-3 pl-6">{item.name}</td>
                          <td className="p-3 text-right font-medium">
                            {formatCurrency(item.change)}
                          </td>
                        </tr>
                      ) : null
                    )}
                    <tr className={`font-semibold ${
                      theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <td className="p-3">
                        Total {section.category.split(' ')[0]}
                      </td>
                      <td className="p-3 text-right">
                        {formatCurrency(sectionIndex === 0 ? totalSources : totalApplications)}
                      </td>
                    </tr>
                  </React.Fragment>
                ))}
                
                {/* Net Fund Flow */}
                <tr className={`font-bold text-lg ${
                  theme === 'dark' ? 'bg-gray-750' : 'bg-blue-50'
                } ${netFundFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <td className="p-4">Net Fund Flow</td>
                  <td className="p-4 text-right">
                    {netFundFlow >= 0 ? '+' : '-'}{formatCurrency(netFundFlow)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className={`mt-6 p-4 rounded-lg ${
        theme === 'dark' ? 'bg-gray-800' : 'bg-blue-50'
      }`}>
        <p className="text-sm">
          <span className="font-semibold">Fund Flow Summary:</span> This statement shows the movement of funds 
          during the financial year. A positive net fund flow indicates that sources exceeded applications, 
          while a negative flow shows applications exceeded sources.
        </p>
      </div>
    </div>
  );
};

export default FundFlow;
