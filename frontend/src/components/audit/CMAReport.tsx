import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, Save, FileText, TrendingUp, DollarSign, PieChart, BarChart, Printer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Types for CMA Data Report
interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  constitution: string;
  companyType: string;
  workingCapitalLimit: number;
}

// Simplified interface for table row data
interface TableRowData {
  srNo: string | number;
  particulars: string;
  actualYear1?: number;
  actualYear2?: number;
  currentYear?: number;
  projectedYear1?: number;
  projectedYear2?: number;
  projectedYear3?: number;
  projectedYear4?: number;
  projectedYear5?: number;
  format?: string;
}

// Reusable Components
const SectionCard: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ 
  title, 
  children, 
  className = '' 
}) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-6 shadow-sm ${className}`}>
    <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b border-gray-200 pb-2">{title}</h3>
    {children}
  </div>
);

type YearField = 'actualYear1' | 'actualYear2' | 'currentYear' | 'projectedYear1' | 'projectedYear2' | 'projectedYear3' | 'projectedYear4' | 'projectedYear5';

const FinancialTable: React.FC<{
  title: string;
  data: TableRowData[];
  onChange: (rowIndex: number, field: YearField, value: number) => void;
}> = ({ title, data, onChange }) => (
  <div className="overflow-x-auto">
    <h4 className="font-medium text-gray-800 mb-3">{title}</h4>
    <table className="w-full border border-gray-300 text-xs">
      <thead className="bg-gray-50">
        <tr>
          <th className="border border-gray-300 px-2 py-1 text-left font-medium">Sr. No.</th>
          <th className="border border-gray-300 px-2 py-1 text-left font-medium">Particulars</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Actual Year 1</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Actual Year 2</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Current Year</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Projected Year 1</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Projected Year 2</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Projected Year 3</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Projected Year 4</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Projected Year 5</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="border border-gray-300 px-2 py-1 text-center">{row.srNo}</td>
            <td className="border border-gray-300 px-2 py-1 font-medium">{row.particulars}</td>
            {(['actualYear1','actualYear2','currentYear','projectedYear1','projectedYear2','projectedYear3','projectedYear4','projectedYear5'] as YearField[]).map((field) => (
              <td key={field} className="border border-gray-300 px-2 py-1 text-right">
                <input
                  aria-label={`${row.particulars} - ${field}`}
                  className="w-full bg-transparent text-right focus:outline-none focus:ring-1 focus:ring-blue-300 px-1 py-0.5"
                  type="number"
                  step={row.format === 'percentage' || row.format === 'ratio' ? 0.01 : 1}
                  value={(row[field] ?? '').toString()}
                  onChange={(e) => {
                    const val = e.target.value === '' ? NaN : Number(e.target.value);
                    onChange(index, field, isNaN(val) ? 0 : val);
                  }}
                  placeholder={row.format === 'percentage' ? '0.00' : '0'}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const CMAReport: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'executive' | 'operating' | 'balance' | 'current' | 'mpbf' | 'funds' | 'ratios'>('executive');

  // Handler functions for buttons
  const handleSaveReport = () => {
    try {
      const reportData = {
        companyInfo,
        operatingStatement: operatingStatementData,
        balanceSheet: balanceSheetData,
        currentAssets: currentAssetsData,
        mpbf: mpbfData,
        fundsFlow: fundsFlowData,
        ratios: ratioData,
        generatedDate: new Date().toISOString()
      };
      
      // Save to localStorage for now (in real app, this would be an API call)
      localStorage.setItem('cma_report_data', JSON.stringify(reportData));
      alert('Report saved successfully!');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    }
  };

  const handleDownloadReport = () => {
    try {
      const reportData = {
        companyInfo,
        operatingStatement: operatingStatementData,
        balanceSheet: balanceSheetData,
        currentAssets: currentAssetsData,
        mpbf: mpbfData,
        fundsFlow: fundsFlowData,
        ratios: ratioData,
        generatedDate: new Date().toISOString()
      };

      // Create and download JSON file
      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CMA_Report_${companyInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
    }
  };

  const handlePrintReport = () => {
    try {
      // Create a new window for printing
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the report.');
        return;
      }

      // Generate print-friendly HTML
      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>CMA Data Report - ${companyInfo.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-info { margin-bottom: 20px; }
            .section { margin-bottom: 30px; page-break-inside: avoid; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            @media print { 
              .no-print { display: none; }
              .page-break { page-break-before: always; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CMA Data Report</h1>
            <h2>${companyInfo.name}</h2>
            <p>${companyInfo.address}</p>
          </div>
          
          <div class="company-info">
            <p><strong>Constitution:</strong> ${companyInfo.constitution}</p>
            <p><strong>Company Type:</strong> ${companyInfo.companyType}</p>
            <p><strong>Proposed Working Capital Limit:</strong> ₹${companyInfo.workingCapitalLimit.toLocaleString()}</p>
          </div>

          <div class="section page-break">
            <h3>Operating Statement</h3>
            <table>
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Particulars</th>
                  <th>Actual Year 1</th>
                  <th>Actual Year 2</th>
                  <th>Current Year</th>
                  <th>Projected Year 1</th>
                  <th>Projected Year 2</th>
                  <th>Projected Year 3</th>
                  <th>Projected Year 4</th>
                  <th>Projected Year 5</th>
                </tr>
              </thead>
              <tbody>
                ${operatingStatementData.map(row => `
                  <tr>
                    <td class="text-center">${row.srNo}</td>
                    <td>${row.particulars}</td>
                    <td class="text-right">${row.format === 'currency' ? '₹' + (row.actualYear1?.toLocaleString() || '0') : row.actualYear1?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.format === 'currency' ? '₹' + (row.actualYear2?.toLocaleString() || '0') : row.actualYear2?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.format === 'currency' ? '₹' + (row.currentYear?.toLocaleString() || '0') : row.currentYear?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.format === 'currency' ? '₹' + (row.projectedYear1?.toLocaleString() || '0') : row.projectedYear1?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.format === 'currency' ? '₹' + (row.projectedYear2?.toLocaleString() || '0') : row.projectedYear2?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.format === 'currency' ? '₹' + (row.projectedYear3?.toLocaleString() || '0') : row.projectedYear3?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.format === 'currency' ? '₹' + (row.projectedYear4?.toLocaleString() || '0') : row.projectedYear4?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.format === 'currency' ? '₹' + (row.projectedYear5?.toLocaleString() || '0') : row.projectedYear5?.toLocaleString() || '0'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section page-break">
            <h3>MPBF Computation</h3>
            <table>
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Particulars</th>
                  <th>Actual Year 1</th>
                  <th>Actual Year 2</th>
                  <th>Current Year</th>
                  <th>Projected Year 1</th>
                  <th>Projected Year 2</th>
                  <th>Projected Year 3</th>
                  <th>Projected Year 4</th>
                  <th>Projected Year 5</th>
                </tr>
              </thead>
              <tbody>
                ${mpbfData.map(row => `
                  <tr>
                    <td class="text-center">${row.srNo}</td>
                    <td>${row.particulars}</td>
                    <td class="text-right">₹${row.actualYear1?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.actualYear2?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.currentYear?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.projectedYear1?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.projectedYear2?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.projectedYear3?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.projectedYear4?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.projectedYear5?.toLocaleString() || '0'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="section page-break">
            <h3>Ratio Analysis</h3>
            <table>
              <thead>
                <tr>
                  <th>Sr. No.</th>
                  <th>Particulars</th>
                  <th>Actual Year 1</th>
                  <th>Actual Year 2</th>
                  <th>Current Year</th>
                  <th>Projected Year 1</th>
                  <th>Projected Year 2</th>
                  <th>Projected Year 3</th>
                  <th>Projected Year 4</th>
                  <th>Projected Year 5</th>
                </tr>
              </thead>
              <tbody>
                ${ratioData.map(row => `
                  <tr>
                    <td class="text-center">${row.srNo}</td>
                    <td>${row.particulars}</td>
                    <td class="text-right">${row.actualYear1?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.actualYear2?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.currentYear?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.projectedYear1?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.projectedYear2?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.projectedYear3?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.projectedYear4?.toLocaleString() || '0'}</td>
                    <td class="text-right">${row.projectedYear5?.toLocaleString() || '0'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 50px; text-align: center; font-size: 12px;">
            <p>Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
      
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Error printing report. Please try again.');
    }
  };

  // Sample Company Data
  const companyInfo = useMemo<CompanyInfo>(() => ({
    name: "ABC Foods Pvt Ltd",
    address: "21, 2nd Floor, DEF Building, 27th Street, Mumbai. Phone 98xxxxxxxx",
    phone: "98xxxxxxxx",
    constitution: "Company",
    companyType: "Private Limited",
    workingCapitalLimit: 60000000
  }), []);

  // Operating Statement Data (placed into state below)
  const defaultOperatingStatementData: TableRowData[] = [
    { srNo: 1, particulars: "Sales Operation", actualYear1: 10000, actualYear2: 14000, currentYear: 16000, projectedYear1: 20540, projectedYear2: 26268, projectedYear3: 33814, projectedYear4: 43207, format: "currency" },
    { srNo: "", particulars: "Export Sales", actualYear1: 1000, actualYear2: 500, currentYear: 1100, projectedYear1: 1344, projectedYear2: 1560, projectedYear3: 2345, projectedYear4: 2412, format: "currency" },
    { srNo: "", particulars: "Gross Sales", actualYear1: 11000, actualYear2: 14500, currentYear: 17100, projectedYear1: 21884, projectedYear2: 28944, projectedYear3: 35659, projectedYear4: 45719, format: "currency" },
    { srNo: "", particulars: "Less: Sales Tax/Excise/VAT", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: "", particulars: "Other Income", actualYear1: 120, actualYear2: 150, currentYear: 110, projectedYear1: 109, projectedYear2: 108, projectedYear3: 107, projectedYear4: 106, format: "currency" },
    { srNo: "", particulars: "Total Gross Operating Income", actualYear1: 11120, actualYear2: 15050, currentYear: 17210, projectedYear1: 22000, projectedYear2: 28152, projectedYear3: 35966, projectedYear4: 45825, format: "currency" },
    { srNo: 2, particulars: "Cost of Production & Sales", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: "", particulars: "Raw Materials Consumed", actualYear1: 500, actualYear2: 400, currentYear: 550, projectedYear1: 715, projectedYear2: 915, projectedYear3: 1170, projectedYear4: 1491, format: "currency" },
    { srNo: "", particulars: "Stores and Spares consumed", actualYear1: 3200, actualYear2: 3200, currentYear: 11000, projectedYear1: 14225, projectedYear2: 18200, projectedYear3: 23227, projectedYear4: 29409, format: "currency" },
    { srNo: "", particulars: "Power/Fuel/Purchases", actualYear1: 9000, actualYear2: 9500, currentYear: 11550, projectedYear1: 14938, projectedYear2: 19121, projectedYear3: 24442, projectedYear4: 31151, format: "currency" },
    { srNo: "", particulars: "Add: Opening stock of W.I.P.", actualYear1: 500, actualYear2: 750, currentYear: 500, projectedYear1: 1000, projectedYear2: 1200, projectedYear3: 1525, projectedYear4: 2025, format: "currency" },
    { srNo: "", particulars: "Add: Opening stock of Raw Materials", actualYear1: 750, actualYear2: 500, currentYear: 1000, projectedYear1: 1500, projectedYear2: 1804, projectedYear3: 2350, projectedYear4: 2950, format: "currency" },
    { srNo: "", particulars: "sub-total", actualYear1: 8750, actualYear2: 9750, currentYear: 14450, projectedYear1: 14658, projectedYear2: 18778, projectedYear3: 26011, projectedYear4: 30613, format: "currency" }
  ];

  // Balance Sheet Data
  const defaultBalanceSheetData: TableRowData[] = [
    { srNo: 1, particulars: "Current Liabilities", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: "", particulars: "Short-term borrowings (including bills purchased)", actualYear1: 400, actualYear2: 410, currentYear: 460, projectedYear1: 600, projectedYear2: 600, projectedYear3: 600, projectedYear4: 600, format: "currency" },
    { srNo: "", particulars: "Trade Creditors", actualYear1: 300, actualYear2: 370, currentYear: 370, projectedYear1: 530, projectedYear2: 590, projectedYear3: 590, projectedYear4: 590, format: "currency" },
    { srNo: "", particulars: "Investment loans", actualYear1: 750, actualYear2: 670, currentYear: 810, projectedYear1: 950, projectedYear2: 950, projectedYear3: 950, projectedYear4: 950, format: "currency" },
    { srNo: "", particulars: "from Other Banks", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: "", particulars: "sub-total", actualYear1: 750, actualYear2: 670, currentYear: 810, projectedYear1: 950, projectedYear2: 950, projectedYear3: 950, projectedYear4: 950, format: "currency" },
    { srNo: "b", particulars: "Other Current Liabilities & Provisions", actualYear1: 50, actualYear2: 40, currentYear: 55, projectedYear1: 84, projectedYear2: 109, projectedYear3: 141, projectedYear4: 181, format: "currency" },
    { srNo: "", particulars: "Salary Payable/Wages", actualYear1: 1500, actualYear2: 2500, currentYear: 2200, projectedYear1: 2486, projectedYear2: 3528, projectedYear3: 4740, projectedYear4: 6119, format: "currency" },
    { srNo: "", particulars: "Other Statutory Liabilities (Excise/Custom duty etc.)", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: "", particulars: "Advance payments from Customers (Deposits from dealers & distributors)", actualYear1: 160, actualYear2: 160, currentYear: 160, projectedYear1: 253, projectedYear2: 330, projectedYear3: 426, projectedYear4: 554, format: "currency" }
  ];

  // Current Assets Data
  const defaultCurrentAssetsData: TableRowData[] = [
    { srNo: 6, particulars: "Current Assets", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: "", particulars: "Cash and Cash Equivalents", actualYear1: 100, actualYear2: 110, currentYear: 105, projectedYear1: 133, projectedYear2: 167, projectedYear3: 209, projectedYear4: 261, format: "currency" },
    { srNo: "", particulars: "Cash and bank balances", actualYear1: 10, actualYear2: 10, currentYear: 10, projectedYear1: 13, projectedYear2: 17, projectedYear3: 21, projectedYear4: 26, format: "currency" },
    { srNo: "", particulars: "Trade receivables", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: "b", particulars: "Export receivables", actualYear1: 500, actualYear2: 450, currentYear: 500, projectedYear1: 631, projectedYear2: 791, projectedYear3: 911, projectedYear4: 1196, format: "currency" },
    { srNo: "", particulars: "Other receivables", actualYear1: 2500, actualYear2: 3500, currentYear: 4300, projectedYear1: 5561, projectedYear2: 6880, projectedYear3: 8789, projectedYear4: 10947, format: "currency" },
    { srNo: "", particulars: "sub-total", actualYear1: 3000, actualYear2: 3550, currentYear: 4300, projectedYear1: 5561, projectedYear2: 6880, projectedYear3: 8789, projectedYear4: 10947, format: "currency" }
  ];

  // MPBF Data
  const defaultMpbfData: TableRowData[] = [
    { srNo: 1, particulars: "Total Current Assets", actualYear1: 6460, actualYear2: 7330, currentYear: 8395, projectedYear1: 10662, projectedYear2: 13406, projectedYear3: 16939, projectedYear4: 21290, format: "currency" },
    { srNo: 2, particulars: "Current Liabilities (Other than bank borrowing)", actualYear1: 2340, actualYear2: 2860, currentYear: 3105, projectedYear1: 4179, projectedYear2: 5393, projectedYear3: 6985, projectedYear4: 8997, format: "currency" },
    { srNo: 3, particulars: "Working Capital Gap (WCG)", actualYear1: 4120, actualYear2: 4470, currentYear: 5290, projectedYear1: 6503, projectedYear2: 8013, projectedYear3: 9955, projectedYear4: 12292, format: "currency" },
    { srNo: 4, particulars: "Maximum Stipulated Net Working Capital (25% of WCG excluding Sanctioned limit)", actualYear1: 955, actualYear2: 1005, currentYear: 1198, projectedYear1: 1473, projectedYear2: 1818, projectedYear3: 2261, projectedYear4: 2789, format: "currency" },
    { srNo: 5, particulars: "Actual / Projected Net Working Capital (NWC)", actualYear1: 3420, actualYear2: 3800, currentYear: 4480, projectedYear1: 5553, projectedYear2: 7063, projectedYear3: 9005, projectedYear4: 11342, format: "currency" },
    { srNo: 6, particulars: "Item no. 3 minus Item no. 4", actualYear1: 3215, actualYear2: 3465, currentYear: 4093, projectedYear1: 5030, projectedYear2: 6195, projectedYear3: 7694, projectedYear4: 9493, format: "currency" },
    { srNo: 7, particulars: "Item no. 3 minus Item no. 5", actualYear1: 700, actualYear2: 670, currentYear: 810, projectedYear1: 950, projectedYear2: 950, projectedYear3: 950, projectedYear4: 950, format: "currency" },
    { srNo: 8, particulars: "Maximum permissible bank finance (MPBF)", actualYear1: 700, actualYear2: 670, currentYear: 810, projectedYear1: 950, projectedYear2: 950, projectedYear3: 950, projectedYear4: 950, format: "currency" }
  ];

  // Funds Flow Data
  const defaultFundsFlowData: TableRowData[] = [
    { srNo: "A", particulars: "SOURCES OF FUNDS", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: 1, particulars: "Cash loss for the year", actualYear1: 600, actualYear2: 400, currentYear: 542, projectedYear1: 1266, projectedYear2: 1766, projectedYear3: 2399, projectedYear4: 3399, format: "currency" },
    { srNo: 2, particulars: "Depreciation", actualYear1: 700, actualYear2: 750, currentYear: 934, projectedYear1: 1122, projectedYear2: 1742, projectedYear3: 1569, projectedYear4: 1569, format: "currency" },
    { srNo: 3, particulars: "Increase in capital", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: 4, particulars: "Increase in reserves & surplus", actualYear1: 50, actualYear2: 0, currentYear: 11, projectedYear1: 10, projectedYear2: 9, projectedYear3: 8, projectedYear4: 8, format: "currency" },
    { srNo: 5, particulars: "Decrease in fixed assets", actualYear1: 0, actualYear2: 35, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "currency" },
    { srNo: 6, particulars: "Increase in other non-current liabilities", actualYear1: 0, actualYear2: 150, currentYear: 31, projectedYear1: 28, projectedYear2: 27, projectedYear3: 32, projectedYear4: 25, format: "currency" },
    { srNo: 7, particulars: "Other increase in term funds", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 56, projectedYear2: 889, projectedYear3: 586, projectedYear4: 586, format: "currency" },
    { srNo: "T1", particulars: "Total", actualYear1: 1350, actualYear2: 1530, currentYear: 1899, projectedYear1: 3463, projectedYear2: 3033, projectedYear3: 3735, projectedYear4: 0, format: "currency" }
  ];

  // Ratio Analysis Data
  const defaultRatioData: TableRowData[] = [
    { srNo: "A", particulars: "Long-term Solvency Ratios", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "" },
    { srNo: 1, particulars: "Debt Equity Ratio", actualYear1: 0.25, actualYear2: 0.26, currentYear: 0.21, projectedYear1: 0.18, projectedYear2: 0.15, projectedYear3: 0.12, projectedYear4: 0.10, format: "ratio" },
    { srNo: 2, particulars: "Capital Gearing Ratio", actualYear1: 0.25, actualYear2: 0.53, currentYear: 0.55, projectedYear1: 0.53, projectedYear2: 0.13, projectedYear3: 0.54, projectedYear4: 0.52, format: "ratio" },
    { srNo: 3, particulars: "Interest Coverage", actualYear1: -13.50, actualYear2: 14.75, currentYear: 12.73, projectedYear1: 20.25, projectedYear2: 24.24, projectedYear3: 31.89, projectedYear4: 41.67, format: "ratio" },
    { srNo: 4, particulars: "Liquidity and Leverage", actualYear1: 1.01, actualYear2: 1.38, currentYear: 6.30, projectedYear1: 9.60, projectedYear2: 18.2, projectedYear3: 1.16, projectedYear4: 1.56, format: "ratio" },
    { srNo: "B", particulars: "Short-term Solvency Ratios", actualYear1: 0, actualYear2: 0, currentYear: 0, projectedYear1: 0, projectedYear2: 0, projectedYear3: 0, projectedYear4: 0, format: "" },
    { srNo: 1, particulars: "Current Ratio", actualYear1: 2.13, actualYear2: 2.08, currentYear: 2.14, projectedYear1: 2.08, projectedYear2: 2.11, projectedYear3: 2.13, projectedYear4: 2.14, format: "ratio" },
    { srNo: 2, particulars: "Quick Ratio/Liquid Ratio/Acid Test Ratio", actualYear1: 1.42, actualYear2: 1.37, currentYear: 1.52, projectedYear1: 1.55, projectedYear2: 1.41, projectedYear3: 1.37, projectedYear4: 1.34, format: "ratio" },
    { srNo: 3, particulars: "Absolute Liquid Ratio", actualYear1: 0.04, actualYear2: 0.03, currentYear: 0.03, projectedYear1: 0.03, projectedYear2: 0.03, projectedYear3: 0.03, projectedYear4: 0.03, format: "ratio" }
  ];

  // State with localStorage hydration
  const [operatingStatementData, setOperatingStatementData] = useState<TableRowData[]>(() => {
    const saved = localStorage.getItem('cma_report_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const arr = parsed?.operatingStatement as TableRowData[] | undefined;
        if (Array.isArray(arr)) return arr.map(r => ({ ...r, projectedYear5: r.projectedYear5 ?? 0 }));
      } catch {
        /* ignore hydration errors */
      }
    }
    return defaultOperatingStatementData.map(r => ({ ...r, projectedYear5: 0 }));
  });
  const [balanceSheetData, setBalanceSheetData] = useState<TableRowData[]>(() => {
    const saved = localStorage.getItem('cma_report_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const arr = parsed?.balanceSheet as TableRowData[] | undefined;
        if (Array.isArray(arr)) return arr.map(r => ({ ...r, projectedYear5: r.projectedYear5 ?? 0 }));
      } catch {
        /* ignore hydration errors */
      }
    }
    return defaultBalanceSheetData.map(r => ({ ...r, projectedYear5: 0 }));
  });
  const [currentAssetsData, setCurrentAssetsData] = useState<TableRowData[]>(() => {
    const saved = localStorage.getItem('cma_report_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const arr = parsed?.currentAssets as TableRowData[] | undefined;
        if (Array.isArray(arr)) return arr.map(r => ({ ...r, projectedYear5: r.projectedYear5 ?? 0 }));
      } catch {
        /* ignore hydration errors */
      }
    }
    return defaultCurrentAssetsData.map(r => ({ ...r, projectedYear5: 0 }));
  });
  const [mpbfData, setMpbfData] = useState<TableRowData[]>(() => {
    const saved = localStorage.getItem('cma_report_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const arr = parsed?.mpbf as TableRowData[] | undefined;
        if (Array.isArray(arr)) return arr.map(r => ({ ...r, projectedYear5: r.projectedYear5 ?? 0 }));
      } catch {
        /* ignore hydration errors */
      }
    }
    return defaultMpbfData.map(r => ({ ...r, projectedYear5: 0 }));
  });
  const [fundsFlowData, setFundsFlowData] = useState<TableRowData[]>(() => {
    const saved = localStorage.getItem('cma_report_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const arr = parsed?.fundsFlow as TableRowData[] | undefined;
        if (Array.isArray(arr)) return arr.map(r => ({ ...r, projectedYear5: r.projectedYear5 ?? 0 }));
      } catch {
        /* ignore hydration errors */
      }
    }
    return defaultFundsFlowData.map(r => ({ ...r, projectedYear5: 0 }));
  });
  const [ratioData, setRatioData] = useState<TableRowData[]>(() => {
    const saved = localStorage.getItem('cma_report_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const arr = parsed?.ratios as TableRowData[] | undefined;
        if (Array.isArray(arr)) return arr.map(r => ({ ...r, projectedYear5: r.projectedYear5 ?? 0 }));
      } catch {
        /* ignore hydration errors */
      }
    }
    return defaultRatioData.map(r => ({ ...r, projectedYear5: 0 }));
  });

  // Auto-persist on change
  useEffect(() => {
    const reportData = {
      companyInfo,
      operatingStatement: operatingStatementData,
      balanceSheet: balanceSheetData,
      currentAssets: currentAssetsData,
      mpbf: mpbfData,
      fundsFlow: fundsFlowData,
      ratios: ratioData,
      generatedDate: new Date().toISOString()
    };
    try {
      localStorage.setItem('cma_report_data', JSON.stringify(reportData));
    } catch {
      /* ignore persistence errors */
    }
  }, [companyInfo, operatingStatementData, balanceSheetData, currentAssetsData, mpbfData, fundsFlowData, ratioData]);

  // Inline cell update helpers
  const updateRowField = (
    setter: React.Dispatch<React.SetStateAction<TableRowData[]>>,
    rowIndex: number,
    field: YearField,
    value: number
  ) => {
    setter(prev => prev.map((r, i) => (i === rowIndex ? { ...r, [field]: value } : r)));
  };

  const tabs = [
    { id: 'executive', label: 'Executive Summary', icon: TrendingUp },
    { id: 'operating', label: 'Operating Statement', icon: BarChart },
    { id: 'balance', label: 'Balance Sheet', icon: PieChart },
    { id: 'current', label: 'Current Assets & Liabilities', icon: DollarSign },
    { id: 'mpbf', label: 'MPBF Computation', icon: FileText },
    { id: 'funds', label: 'Funds Flow', icon: TrendingUp },
    { id: 'ratios', label: 'Ratio Analysis', icon: BarChart }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button
              title='Back to Audit Module'
              type='button'
              onClick={() => navigate('/app/audit')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">CMA Data Report</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSaveReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              Save Report
            </button>
            <button 
              onClick={handleDownloadReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              Download
            </button>
            <button 
              onClick={handlePrintReport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
          </div>
        </div>

        {/* Company Header Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-4">
            <div className="flex justify-between items-start">
              <div></div>
              <div>
                <h1 className="text-xl font-bold">CMA Data Report</h1>
                <h2 className="text-lg font-semibold text-blue-600 mt-2">{companyInfo.name}</h2>
                <p className="text-sm text-gray-600">{companyInfo.address}</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                CMA Data Report
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <span className="font-medium">Constitution:</span>
              <span className="ml-2">{companyInfo.constitution}</span>
            </div>
            <div>
              <span className="font-medium">Company Type:</span>
              <span className="ml-2">{companyInfo.companyType}</span>
            </div>
            <div>
              <span className="font-medium">Proposed Working Capital Limit:</span>
              <span className="ml-2">₹{companyInfo.workingCapitalLimit.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-2 py-3 px-4 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'text-blue-600 border-b-2 border-blue-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab.id as 'executive' | 'operating' | 'balance' | 'current' | 'mpbf' | 'funds' | 'ratios')}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Executive Summary */}
          {activeTab === 'executive' && (
            <SectionCard title="Executive Summary">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Revenue & Expense Breakdown</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Gross Operating Income:</span>
                          <span className="font-medium">₹45,825 Lacs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cost of Sales:</span>
                          <span className="font-medium">₹30,613 Lacs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>General, Admin, Selling Expenses:</span>
                          <span className="font-medium">₹8,997 Lacs</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Operating Profit before Interest:</span>
                          <span className="font-medium text-green-600">₹6,215 Lacs</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Financial Highlights</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Total Assets:</span>
                          <span className="font-medium">₹23,380 Lacs</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Current Ratio:</span>
                          <span className="font-medium">2.14</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Debt Equity Ratio:</span>
                          <span className="font-medium">0.10</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Net Profit Margin:</span>
                          <span className="font-medium text-blue-600">5.14%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Data at a Glance</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">₹60 Cr</div>
                      <div className="text-sm text-gray-600">Working Capital Limit</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">2.14</div>
                      <div className="text-sm text-gray-600">Current Ratio</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">0.10</div>
                      <div className="text-sm text-gray-600">Debt Equity Ratio</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">5.14%</div>
                      <div className="text-sm text-gray-600">Net Profit Margin</div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Operating Statement */}
      {activeTab === 'operating' && (
            <SectionCard title="Form II - Operating Statement">
              <FinancialTable
                title="Income and Expenditure Statement"
        data={operatingStatementData}
        onChange={(row, field, value) => updateRowField(setOperatingStatementData, row, field, value)}
              />
            </SectionCard>
          )}

          {/* Balance Sheet */}
      {activeTab === 'balance' && (
            <SectionCard title="Form III - Analysis of Balance Sheet">
              <FinancialTable
                title="Balance Sheet Analysis"
        data={balanceSheetData}
        onChange={(row, field, value) => updateRowField(setBalanceSheetData, row, field, value)}
              />
            </SectionCard>
          )}

          {/* Current Assets & Liabilities */}
      {activeTab === 'current' && (
            <SectionCard title="Form IV - Comparative Statement of Current Assets and Current Liabilities">
              <FinancialTable
                title="Current Assets and Liabilities Analysis"
        data={currentAssetsData}
        onChange={(row, field, value) => updateRowField(setCurrentAssetsData, row, field, value)}
              />
            </SectionCard>
          )}

          {/* MPBF Computation */}
      {activeTab === 'mpbf' && (
            <SectionCard title="Form V - Computation of Maximum Permissible Bank Finance (MPBF) for Working Capital">
              <FinancialTable
                title="MPBF Calculation"
        data={mpbfData}
        onChange={(row, field, value) => updateRowField(setMpbfData, row, field, value)}
              />
            </SectionCard>
          )}

          {/* Funds Flow */}
      {activeTab === 'funds' && (
            <SectionCard title="Form VI - Funds Flow Statement">
              <FinancialTable
                title="Sources and Application of Funds"
        data={fundsFlowData}
        onChange={(row, field, value) => updateRowField(setFundsFlowData, row, field, value)}
              />
            </SectionCard>
          )}

          {/* Ratio Analysis */}
      {activeTab === 'ratios' && (
            <SectionCard title="Ratio Analysis">
              <FinancialTable
                title="Financial Ratios"
        data={ratioData}
        onChange={(row, field, value) => updateRowField(setRatioData, row, field, value)}
              />
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default CMAReport;
