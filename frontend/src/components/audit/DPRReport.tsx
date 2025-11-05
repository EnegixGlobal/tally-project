import React, { useEffect, useState } from 'react';
import { ArrowLeft, Download, Save, FileText, TrendingUp, DollarSign, BarChart, Printer, Building, Target, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Types for DPR Data Report
interface ProjectInfo {
  name: string;
  promoter: string;
  address: string;
  phone: string;
  email: string;
  projectType: string;
  industry: string;
  proposedCapacity: string;
  totalProjectCost: number;
  loanAmount: number;
  promoterContribution: number;
  implementationPeriod: string;
}

interface FinancialProjection {
  year: string;
  revenue: number;
  expenses: number;
  ebitda: number;
  netProfit: number;
  cashFlow: number;
}

interface CostBreakdown {
  particular: string;
  amount: number;
  percentage: number;
}

type YearField = 'year1' | 'year2' | 'year3' | 'year4' | 'year5';

interface TableRowData {
  srNo: string | number;
  particulars: string;
  year1?: number;
  year2?: number;
  year3?: number;
  year4?: number;
  year5?: number;
  format?: string;
  unit?: string;
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

const ProjectionTable: React.FC<{
  title: string;
  data: TableRowData[];
  editable?: boolean;
  onChange?: (rowIndex: number, field: YearField, value: number | undefined) => void;
}> = ({ title, data, editable = false, onChange }) => (
  <div className="overflow-x-auto">
    <h4 className="font-medium text-gray-800 mb-3">{title}</h4>
    <table className="w-full border border-gray-300 text-xs">
      <thead className="bg-gray-50">
        <tr>
          <th className="border border-gray-300 px-2 py-1 text-left font-medium">Sr. No.</th>
          <th className="border border-gray-300 px-2 py-1 text-left font-medium">Particulars</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Year 1</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Year 2</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Year 3</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Year 4</th>
          <th className="border border-gray-300 px-2 py-1 text-center font-medium">Year 5</th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            <td className="border border-gray-300 px-2 py-1 text-center">{row.srNo}</td>
            <td className="border border-gray-300 px-2 py-1 font-medium">{row.particulars}</td>
            {(['year1','year2','year3','year4','year5'] as YearField[]).map((field) => (
              <td key={field} className="border border-gray-300 px-2 py-1 text-right">
                {editable ? (
                  <div className="flex items-center justify-end gap-1">
                    {row.format === 'currency' && <span className="text-gray-500">₹</span>}
                    <input
                      className="w-24 border border-gray-300 rounded px-1 py-0.5 text-right focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      type="number"
                      step={row.format === 'percentage' || row.format === 'ratio' ? 0.01 : 1}
                      aria-label={`${row.particulars} ${field}`}
                      placeholder={row.format === 'percentage' ? '0.00' : '0'}
                      value={(row[field] ?? '').toString()}
                      onChange={(e) => {
                        const v = e.target.value;
                        const num = v === '' ? undefined : Number(v);
                        if (onChange) {
                          onChange(index, field, isNaN(Number(num)) ? undefined : num);
                        }
                      }}
                    />
                    {row.format === 'percentage' && <span className="text-gray-500">%</span>}
                    {row.unit && <span className="text-gray-500">{row.unit}</span>}
                  </div>
                ) : (
                  <span>
                    {row.format === 'currency' ? `₹${row[field]?.toLocaleString() || '0'}` :
                     row.format === 'percentage' ? `${row[field] ?? '0'}%` :
                     row.unit ? `${row[field]?.toLocaleString() || '0'} ${row.unit}` :
                     row[field]?.toLocaleString() || '0'}
                  </span>
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const DPRReport: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'projections' | 'ratios' | 'implementation' | 'risk' | 'conclusion'>('overview');

  // Handler functions for buttons
  const handleSaveReport = () => {
    try {
      const reportData = {
        projectInfo,
        financialProjections,
        costBreakdown,
        profitabilityProjections,
        cashFlowProjections,
        ratioAnalysis,
        implementationSchedule,
        riskAnalysis,
        generatedDate: new Date().toISOString()
      };
      
      localStorage.setItem('dpr_report_data', JSON.stringify(reportData));
      alert('DPR Report saved successfully!');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Error saving report. Please try again.');
    }
  };

  const handleDownloadReport = () => {
    try {
      const reportData = {
        projectInfo,
        financialProjections,
        costBreakdown,
        profitabilityProjections,
        cashFlowProjections,
        ratioAnalysis,
        implementationSchedule,
        riskAnalysis,
        generatedDate: new Date().toISOString()
      };

      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DPR_Report_${projectInfo.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
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
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow popups to print the report.');
        return;
      }

      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>DPR Report - ${projectInfo.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .project-info { margin-bottom: 20px; }
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
            <h1>Detailed Project Report (DPR)</h1>
            <h2>${projectInfo.name}</h2>
            <p>${projectInfo.address}</p>
          </div>
          
          <div class="project-info">
            <h3>Project Information</h3>
            <p><strong>Promoter:</strong> ${projectInfo.promoter}</p>
            <p><strong>Industry:</strong> ${projectInfo.industry}</p>
            <p><strong>Project Type:</strong> ${projectInfo.projectType}</p>
            <p><strong>Total Project Cost:</strong> ₹${projectInfo.totalProjectCost.toLocaleString()}</p>
            <p><strong>Loan Amount:</strong> ₹${projectInfo.loanAmount.toLocaleString()}</p>
          </div>

          <div class="section page-break">
            <h3>Financial Projections (5 Years)</h3>
            <table>
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Year 1</th>
                  <th>Year 2</th>
                  <th>Year 3</th>
                  <th>Year 4</th>
                  <th>Year 5</th>
                </tr>
              </thead>
              <tbody>
                ${profitabilityProjections.map(row => `
                  <tr>
                    <td>${row.particulars}</td>
                    <td class="text-right">₹${row.year1?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.year2?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.year3?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.year4?.toLocaleString() || '0'}</td>
                    <td class="text-right">₹${row.year5?.toLocaleString() || '0'}</td>
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
      
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 1000);
      
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Error printing report. Please try again.');
    }
  };

  // Sample Project Data
  const projectInfo: ProjectInfo = {
    name: "Manufacturing Unit - ABC Products Pvt Ltd",
    promoter: "Mr. Rajesh Kumar",
    address: "Plot No. 123, Industrial Area, Phase-II, Gurgaon, Haryana - 122001",
    phone: "+91-9876543210",
    email: "rajesh.kumar@abcproducts.com",
    projectType: "Manufacturing",
    industry: "Automotive Components",
    proposedCapacity: "50,000 units per annum",
    totalProjectCost: 150000000, // 15 Crores
    loanAmount: 105000000, // 10.5 Crores (70%)
    promoterContribution: 45000000, // 4.5 Crores (30%)
    implementationPeriod: "18 months"
  };

  // Financial Projections Data
  const financialProjections: FinancialProjection[] = [
    { year: "Year 1", revenue: 80000000, expenses: 65000000, ebitda: 15000000, netProfit: 8000000, cashFlow: 12000000 },
    { year: "Year 2", revenue: 120000000, expenses: 95000000, ebitda: 25000000, netProfit: 18000000, cashFlow: 22000000 },
    { year: "Year 3", revenue: 160000000, expenses: 125000000, ebitda: 35000000, netProfit: 28000000, cashFlow: 32000000 },
    { year: "Year 4", revenue: 200000000, expenses: 155000000, ebitda: 45000000, netProfit: 38000000, cashFlow: 42000000 },
    { year: "Year 5", revenue: 240000000, expenses: 180000000, ebitda: 60000000, netProfit: 52000000, cashFlow: 56000000 }
  ];

  // Cost Breakdown (editable)
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdown[]>([
    { particular: "Land & Site Development", amount: 25000000, percentage: 16.67 },
    { particular: "Building & Civil Works", amount: 35000000, percentage: 23.33 },
    { particular: "Plant & Machinery", amount: 60000000, percentage: 40.00 },
    { particular: "Technical Know-how", amount: 5000000, percentage: 3.33 },
    { particular: "Pre-operative Expenses", amount: 8000000, percentage: 5.33 },
    { particular: "Working Capital", amount: 17000000, percentage: 11.33 }
  ]);

  // Profitability Projections (editable)
  const [profitabilityProjections, setProfitabilityProjections] = useState<TableRowData[]>([
    { srNo: 1, particulars: "Sales Revenue", year1: 80000000, year2: 120000000, year3: 160000000, year4: 200000000, year5: 240000000, format: "currency" },
    { srNo: 2, particulars: "Cost of Goods Sold", year1: 48000000, year2: 72000000, year3: 96000000, year4: 120000000, year5: 144000000, format: "currency" },
    { srNo: 3, particulars: "Gross Profit", year1: 32000000, year2: 48000000, year3: 64000000, year4: 80000000, year5: 96000000, format: "currency" },
    { srNo: 4, particulars: "Operating Expenses", year1: 17000000, year2: 23000000, year3: 29000000, year4: 35000000, year5: 36000000, format: "currency" },
    { srNo: 5, particulars: "EBITDA", year1: 15000000, year2: 25000000, year3: 35000000, year4: 45000000, year5: 60000000, format: "currency" },
    { srNo: 6, particulars: "Depreciation", year1: 4000000, year2: 4000000, year3: 4000000, year4: 4000000, year5: 4000000, format: "currency" },
    { srNo: 7, particulars: "Interest", year1: 3000000, year2: 3000000, year3: 3000000, year4: 3000000, year5: 4000000, format: "currency" },
    { srNo: 8, particulars: "PBT (Profit Before Tax)", year1: 8000000, year2: 18000000, year3: 28000000, year4: 38000000, year5: 52000000, format: "currency" },
    { srNo: 9, particulars: "Tax", year1: 0, year2: 0, year3: 0, year4: 0, year5: 0, format: "currency" },
    { srNo: 10, particulars: "PAT (Profit After Tax)", year1: 8000000, year2: 18000000, year3: 28000000, year4: 38000000, year5: 52000000, format: "currency" }
  ]);

  // Cash Flow Projections (editable)
  const [cashFlowProjections, setCashFlowProjections] = useState<TableRowData[]>([
    { srNo: 1, particulars: "Cash from Operations", year1: 12000000, year2: 22000000, year3: 32000000, year4: 42000000, year5: 56000000, format: "currency" },
    { srNo: 2, particulars: "Cash from Investments", year1: -150000000, year2: -5000000, year3: -8000000, year4: -10000000, year5: -12000000, format: "currency" },
    { srNo: 3, particulars: "Cash from Financing", year1: 105000000, year2: -8000000, year3: -10000000, year4: -12000000, year5: -15000000, format: "currency" },
    { srNo: 4, particulars: "Net Cash Flow", year1: -33000000, year2: 9000000, year3: 14000000, year4: 20000000, year5: 29000000, format: "currency" },
    { srNo: 5, particulars: "Cumulative Cash Flow", year1: -33000000, year2: -24000000, year3: -10000000, year4: 10000000, year5: 39000000, format: "currency" }
  ]);

  // Ratio Analysis (editable)
  const [ratioAnalysis, setRatioAnalysis] = useState<TableRowData[]>([
    { srNo: 1, particulars: "Gross Profit Margin (%)", year1: 40.0, year2: 40.0, year3: 40.0, year4: 40.0, year5: 40.0, format: "percentage" },
    { srNo: 2, particulars: "EBITDA Margin (%)", year1: 18.75, year2: 20.83, year3: 21.88, year4: 22.50, year5: 25.0, format: "percentage" },
    { srNo: 3, particulars: "Net Profit Margin (%)", year1: 10.0, year2: 15.0, year3: 17.5, year4: 19.0, year5: 21.67, format: "percentage" },
    { srNo: 4, particulars: "Return on Investment (%)", year1: 5.33, year2: 12.0, year3: 18.67, year4: 25.33, year5: 34.67, format: "percentage" },
    { srNo: 5, particulars: "Debt Service Coverage Ratio", year1: 1.5, year2: 2.8, year3: 4.0, year4: 5.3, year5: 7.0, format: "ratio" },
    { srNo: 6, particulars: "Current Ratio", year1: 1.8, year2: 2.2, year3: 2.5, year4: 2.8, year5: 3.2, format: "ratio" }
  ]);

  // Implementation Schedule (editable)
  const [implementationSchedule, setImplementationSchedule] = useState<TableRowData[]>([
    { srNo: 1, particulars: "Land Acquisition", year1: 1, year2: 0, year3: 0, year4: 0, year5: 0, unit: "Months" },
    { srNo: 2, particulars: "Project Approvals", year1: 3, year2: 0, year3: 0, year4: 0, year5: 0, unit: "Months" },
    { srNo: 3, particulars: "Civil Construction", year1: 8, year2: 0, year3: 0, year4: 0, year5: 0, unit: "Months" },
    { srNo: 4, particulars: "Machinery Installation", year1: 4, year2: 0, year3: 0, year4: 0, year5: 0, unit: "Months" },
    { srNo: 5, particulars: "Trial Production", year1: 2, year2: 0, year3: 0, year4: 0, year5: 0, unit: "Months" },
    { srNo: 6, particulars: "Commercial Production", year1: 0, year2: 1, year3: 0, year4: 0, year5: 0, unit: "Start" }
  ]);

  // Risk Analysis (editable)
  const [riskAnalysis, setRiskAnalysis] = useState<TableRowData[]>([
    { srNo: 1, particulars: "Market Risk", year1: 15, year2: 12, year3: 10, year4: 8, year5: 5, format: "percentage" },
    { srNo: 2, particulars: "Technology Risk", year1: 10, year2: 8, year3: 5, year4: 3, year5: 2, format: "percentage" },
    { srNo: 3, particulars: "Financial Risk", year1: 20, year2: 15, year3: 12, year4: 10, year5: 8, format: "percentage" },
    { srNo: 4, particulars: "Regulatory Risk", year1: 12, year2: 10, year3: 8, year4: 6, year5: 5, format: "percentage" },
    { srNo: 5, particulars: "Operational Risk", year1: 18, year2: 15, year3: 12, year4: 10, year5: 8, format: "percentage" }
  ]);

  // Load saved data if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('dpr_report_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.costBreakdown)) setCostBreakdown(parsed.costBreakdown);
        if (Array.isArray(parsed.profitabilityProjections)) setProfitabilityProjections(parsed.profitabilityProjections);
        if (Array.isArray(parsed.cashFlowProjections)) setCashFlowProjections(parsed.cashFlowProjections);
        if (Array.isArray(parsed.ratioAnalysis)) setRatioAnalysis(parsed.ratioAnalysis);
        if (Array.isArray(parsed.implementationSchedule)) setImplementationSchedule(parsed.implementationSchedule);
        if (Array.isArray(parsed.riskAnalysis)) setRiskAnalysis(parsed.riskAnalysis);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  // Generic change helpers for editable tables
  const handleRowChange = (
    setter: React.Dispatch<React.SetStateAction<TableRowData[]>>,
    rowIndex: number,
    field: YearField,
    value: number | undefined
  ) => {
    setter(prev => {
      const copy = [...prev];
      copy[rowIndex] = { ...copy[rowIndex], [field]: value } as TableRowData;
      return copy;
    });
  };

  const tabs = [
    { id: 'overview', label: 'Project Overview', icon: Building },
    { id: 'financial', label: 'Financial Structure', icon: DollarSign },
    { id: 'projections', label: 'Financial Projections', icon: TrendingUp },
    { id: 'ratios', label: 'Ratio Analysis', icon: BarChart },
    { id: 'implementation', label: 'Implementation', icon: Calendar },
    { id: 'risk', label: 'Risk Analysis', icon: Target },
    { id: 'conclusion', label: 'Conclusion', icon: FileText }
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
            <h1 className="text-2xl font-bold">Detailed Project Report (DPR)</h1>
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

        {/* Project Header Info */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="text-center mb-4">
            <div className="flex justify-between items-start">
              <div></div>
              <div>
                <h1 className="text-xl font-bold">Detailed Project Report</h1>
                <h2 className="text-lg font-semibold text-blue-600 mt-2">{projectInfo.name}</h2>
                <p className="text-sm text-gray-600">{projectInfo.address}</p>
              </div>
              <div className="text-right text-sm text-gray-600">
                DPR Document
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div>
              <span className="font-medium">Promoter:</span>
              <span className="ml-2">{projectInfo.promoter}</span>
            </div>
            <div>
              <span className="font-medium">Industry:</span>
              <span className="ml-2">{projectInfo.industry}</span>
            </div>
            <div>
              <span className="font-medium">Total Project Cost:</span>
              <span className="ml-2">₹{projectInfo.totalProjectCost.toLocaleString()}</span>
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
                onClick={() => setActiveTab(tab.id as 'overview' | 'financial' | 'projections' | 'ratios' | 'implementation' | 'risk' | 'conclusion')}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-6">
          {/* Project Overview */}
          {activeTab === 'overview' && (
            <SectionCard title="Project Overview & Executive Summary">
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Project Details</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Project Type:</span>
                          <span>{projectInfo.projectType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Proposed Capacity:</span>
                          <span>{projectInfo.proposedCapacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Implementation Period:</span>
                          <span>{projectInfo.implementationPeriod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Contact:</span>
                          <span>{projectInfo.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Email:</span>
                          <span>{projectInfo.email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Financial Summary</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">Total Project Cost:</span>
                          <span>₹{projectInfo.totalProjectCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Loan Amount (70%):</span>
                          <span>₹{projectInfo.loanAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Promoter Contribution (30%):</span>
                          <span>₹{projectInfo.promoterContribution.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Expected ROI:</span>
                          <span className="text-green-600">34.67% (Year 5)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Payback Period:</span>
                          <span className="text-blue-600">3.5 Years</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Project Cost Breakdown</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {costBreakdown.map((item, index) => (
                      <div key={index} className="bg-blue-50 p-4 rounded-lg text-center">
                        <div className="text-lg font-bold text-blue-600">₹{(item.amount / 1000000).toFixed(1)}Cr</div>
                        <div className="text-xs text-gray-600">{item.particular}</div>
                        <div className="text-sm font-medium text-blue-800">{item.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Financial Structure */}
          {activeTab === 'financial' && (
            <SectionCard title="Financial Structure & Cost Analysis">
              <div className="space-y-6">
                <div className="overflow-x-auto">
                  <h4 className="font-medium text-gray-800 mb-3">Project Cost Breakdown</h4>
                  <table className="w-full border border-gray-300 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-4 py-2 text-left">Particulars</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Amount (₹)</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">Percentage (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costBreakdown.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-2 font-medium">{item.particular}</td>
                          <td className="border border-gray-300 px-2 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-gray-500">₹</span>
                              <input
                                className="w-36 border border-gray-300 rounded px-2 py-1 text-right focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                type="number"
                                step={1}
                                aria-label={`${item.particular} amount`}
                                placeholder="0"
                                value={item.amount ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const num = v === '' ? 0 : Number(v);
                                  setCostBreakdown(prev => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], amount: isNaN(num) ? 0 : num };
                                    return copy;
                                  });
                                }}
                              />
                            </div>
                          </td>
                          <td className="border border-gray-300 px-2 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <input
                                className="w-24 border border-gray-300 rounded px-2 py-1 text-right focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                type="number"
                                step={0.01}
                                aria-label={`${item.particular} percentage`}
                                placeholder="0.00"
                                value={item.percentage ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const num = v === '' ? 0 : Number(v);
                                  setCostBreakdown(prev => {
                                    const copy = [...prev];
                                    copy[index] = { ...copy[index], percentage: isNaN(num) ? 0 : num };
                                    return copy;
                                  });
                                }}
                              />
                              <span className="text-gray-500">%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {(() => {
                        const totalAmount = costBreakdown.reduce((sum, i) => sum + (i.amount || 0), 0);
                        const totalPct = costBreakdown.reduce((sum, i) => sum + (i.percentage || 0), 0);
                        return (
                          <tr className="bg-blue-50 font-semibold">
                            <td className="border border-gray-300 px-4 py-2">Total Project Cost</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">₹{totalAmount.toLocaleString()}</td>
                            <td className="border border-gray-300 px-4 py-2 text-right">{totalPct.toFixed(2)}%</td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Financing Pattern</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span>Term Loan (70%)</span>
                          <span className="font-semibold">₹{projectInfo.loanAmount.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full w-[70%]"></div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Promoter Contribution (30%)</span>
                          <span className="font-semibold">₹{projectInfo.promoterContribution.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full w-[30%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">Loan Terms</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Loan Amount:</span>
                          <span className="font-medium">₹{projectInfo.loanAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Interest Rate:</span>
                          <span className="font-medium">10.5% p.a.</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Repayment Period:</span>
                          <span className="font-medium">10 Years</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Moratorium Period:</span>
                          <span className="font-medium">18 Months</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-medium">Monthly EMI:</span>
                          <span className="font-medium text-blue-600">₹14,25,000</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Financial Projections */}
          {activeTab === 'projections' && (
            <SectionCard title="Financial Projections (5 Years)">
              <ProjectionTable
                title="Profitability Projections"
                data={profitabilityProjections}
                editable
                onChange={(rowIdx, field, value) => handleRowChange(setProfitabilityProjections, rowIdx, field, value)}
              />
              <div className="mt-8">
                <ProjectionTable
                  title="Cash Flow Projections"
                  data={cashFlowProjections}
                  editable
                  onChange={(rowIdx, field, value) => handleRowChange(setCashFlowProjections, rowIdx, field, value)}
                />
              </div>
            </SectionCard>
          )}

          {/* Ratio Analysis */}
      {activeTab === 'ratios' && (
            <SectionCard title="Financial Ratio Analysis">
              <ProjectionTable
                title="Key Financial Ratios"
        data={ratioAnalysis}
        editable
        onChange={(rowIdx, field, value) => handleRowChange(setRatioAnalysis, rowIdx, field, value)}
              />
            </SectionCard>
          )}

          {/* Implementation Schedule */}
      {activeTab === 'implementation' && (
            <SectionCard title="Implementation Schedule & Timeline">
              <ProjectionTable
                title="Project Implementation Timeline"
        data={implementationSchedule}
        editable
        onChange={(rowIdx, field, value) => handleRowChange(setImplementationSchedule, rowIdx, field, value)}
              />
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-3">Critical Milestones</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">Month 1</div>
                    <div className="text-sm text-gray-600">Land Acquisition & Approvals</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-lg font-bold text-green-600">Month 12</div>
                    <div className="text-sm text-gray-600">Construction Completion</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">Month 18</div>
                    <div className="text-sm text-gray-600">Commercial Production</div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Risk Analysis */}
      {activeTab === 'risk' && (
            <SectionCard title="Risk Analysis & Mitigation">
              <ProjectionTable
                title="Risk Assessment (Probability %)"
        data={riskAnalysis}
        editable
        onChange={(rowIdx, field, value) => handleRowChange(setRiskAnalysis, rowIdx, field, value)}
              />
              <div className="mt-6">
                <h4 className="font-medium text-gray-800 mb-3">Risk Mitigation Strategies</h4>
                <div className="space-y-4">
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <h5 className="font-semibold text-red-800">Market Risk</h5>
                    <p className="text-sm text-red-700">Mitigation: Diversified customer base, long-term contracts, market research</p>
                  </div>
                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                    <h5 className="font-semibold text-yellow-800">Financial Risk</h5>
                    <p className="text-sm text-yellow-700">Mitigation: Conservative leverage, adequate cash reserves, working capital management</p>
                  </div>
                  <div className="bg-orange-50 border-l-4 border-orange-500 p-4">
                    <h5 className="font-semibold text-orange-800">Operational Risk</h5>
                    <p className="text-sm text-orange-700">Mitigation: Skilled workforce, preventive maintenance, quality systems</p>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Conclusion */}
          {activeTab === 'conclusion' && (
            <SectionCard title="Conclusion & Recommendations">
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Project Viability Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">Excellent</div>
                      <div className="text-sm text-gray-600">Market Potential</div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">Strong</div>
                      <div className="text-sm text-gray-600">Financial Returns</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">Low-Medium</div>
                      <div className="text-sm text-gray-600">Risk Profile</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-600">Recommended</div>
                      <div className="text-sm text-gray-600">Overall Rating</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Key Recommendations</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>The project shows strong financial viability with attractive returns and reasonable payback period.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>Market demand for automotive components supports the proposed capacity and growth projections.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>The promoter has relevant experience and adequate financial backing for the project.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">→</span>
                        <span>Recommend proceeding with the proposed financing structure and terms.</span>
                      </li>
                      <li className="flex items-start">
                        <span className="text-blue-600 mr-2">→</span>
                        <span>Implement suggested risk mitigation measures for optimal project execution.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Financial Highlights</h4>
                  <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">21.67%</div>
                        <div className="text-sm text-gray-600">Net Profit Margin (Year 5)</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">34.67%</div>
                        <div className="text-sm text-gray-600">ROI (Year 5)</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-purple-600">7.0</div>
                        <div className="text-sm text-gray-600">DSCR (Year 5)</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">3.5 Yrs</div>
                        <div className="text-sm text-gray-600">Payback Period</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
};

export default DPRReport;
