import  { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Download, Shield, FileText, Users, Database,ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ComplianceCheck = () => {
    const navigate = useNavigate();
  const [lastScan, setLastScan] = useState('2024-01-15 09:30:00');
  const [isScanning, setIsScanning] = useState(false);

  const complianceStandards = [
    {
      id: 'gdpr',
      name: 'GDPR (General Data Protection Regulation)',
      description: 'European Union data protection and privacy regulation',
      score: 92,
      status: 'compliant',
      lastChecked: '2024-01-15 09:30:00',
      issues: 2,
      requirements: 15
    },
    {
      id: 'sox',
      name: 'SOX (Sarbanes-Oxley Act)',
      description: 'Financial reporting and corporate governance',
      score: 88,
      status: 'compliant',
      lastChecked: '2024-01-15 09:30:00',
      issues: 3,
      requirements: 12
    },
    {
      id: 'pci-dss',
      name: 'PCI DSS',
      description: 'Payment Card Industry Data Security Standard',
      score: 75,
      status: 'warning',
      lastChecked: '2024-01-15 09:30:00',
      issues: 5,
      requirements: 20
    },
    {
      id: 'hipaa',
      name: 'HIPAA',
      description: 'Health Insurance Portability and Accountability Act',
      score: 95,
      status: 'compliant',
      lastChecked: '2024-01-15 09:30:00',
      issues: 1,
      requirements: 10
    }
  ];

  const complianceChecks = [
    {
      category: 'Data Protection',
      checks: [
        { name: 'Data encryption at rest', status: 'pass', severity: 'high' },
        { name: 'Data encryption in transit', status: 'pass', severity: 'high' },
        { name: 'Data retention policies', status: 'pass', severity: 'medium' },
        { name: 'Data access controls', status: 'warning', severity: 'high' },
        { name: 'Personal data inventory', status: 'fail', severity: 'medium' }
      ]
    },
    {
      category: 'Access Control',
      checks: [
        { name: 'Multi-factor authentication', status: 'pass', severity: 'high' },
        { name: 'Role-based access control', status: 'pass', severity: 'high' },
        { name: 'Regular access reviews', status: 'warning', severity: 'medium' },
        { name: 'Privileged account monitoring', status: 'pass', severity: 'high' },
        { name: 'Session management', status: 'pass', severity: 'medium' }
      ]
    },
    {
      category: 'Audit & Monitoring',
      checks: [
        { name: 'Comprehensive audit logging', status: 'pass', severity: 'high' },
        { name: 'Log integrity protection', status: 'pass', severity: 'high' },
        { name: 'Real-time monitoring', status: 'pass', severity: 'medium' },
        { name: 'Incident response procedures', status: 'warning', severity: 'high' },
        { name: 'Regular compliance assessments', status: 'pass', severity: 'medium' }
      ]
    }
  ];

  const getStatusIcon = (status:string) => {
    switch (status) {
      case 'compliant':
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
      case 'non-compliant':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status:string) => {
    switch (status) {
      case 'compliant':
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'fail':
      case 'non-compliant':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity:string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const runComplianceScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setLastScan(new Date().toLocaleString());
    }, 3000);
  };

  const overallScore = Math.round(complianceStandards.reduce((acc, std) => acc + std.score, 0) / complianceStandards.length);
  const compliantStandards = complianceStandards.filter(std => std.status === 'compliant').length;
  const totalIssues = complianceStandards.reduce((acc, std) => acc + std.issues, 0);

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
        <div className="flex items-center mb-4">
                        <button
                            title='Back to Reports'
                            type='button'
                            onClick={() => navigate('/app/audit')}
                            className="mr-4 p-2 rounded-full hover:bg-gray-200"
                                >
                            <ArrowLeft size={20} />
                        </button>
                     <h1 className="text-xl font-semibold text-gray-900">Compliance Check</h1>
                     </div>
        <div className="flex items-center justify-between">
          <div>
            
            <p className="text-sm text-gray-600 mt-1">Monitor compliance with regulatory standards and internal policies</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Last Scan: {lastScan}</p>
              <p className="text-xs text-gray-400">Next scan in 6 hours</p>
            </div>
            <button
              onClick={runComplianceScan}
              disabled={isScanning}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Run Scan'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Overall Score</h3>
              <p className="text-2xl font-bold text-gray-900">{overallScore}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Compliant Standards</h3>
              <p className="text-2xl font-bold text-gray-900">{compliantStandards}/{complianceStandards.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Users className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Issues</h3>
              <p className="text-2xl font-bold text-gray-900">{totalIssues}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Database className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Standards Tracked</h3>
              <p className="text-2xl font-bold text-gray-900">{complianceStandards.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Standards */}
      <div className="bg-white border rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Compliance Standards</h3>
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-800">
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {complianceStandards.map((standard) => (
            <div key={standard.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{standard.name}</h4>
                  <p className="text-sm text-gray-600">{standard.description}</p>
                </div>
                {getStatusIcon(standard.status)}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Compliance Score</span>
                  <span className="text-sm font-semibold">{standard.score}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      standard.score >= 90 ? 'bg-green-500' :
                      standard.score >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${standard.score}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{standard.requirements - standard.issues} of {standard.requirements} requirements met</span>
                  <span>{standard.issues} issues</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(standard.status)}`}>
                  {standard.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">Last checked: {standard.lastChecked}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Compliance Checks */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Compliance Checks</h3>

        <div className="space-y-6">
          {complianceChecks.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h4 className="font-medium text-gray-900 mb-3">{category.category}</h4>
              <div className="space-y-2">
                {category.checks.map((check, checkIndex) => (
                  <div key={checkIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(check.status)}
                      <span className="text-sm text-gray-900">{check.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(check.severity)}`}>
                        {check.severity}
                      </span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(check.status)}`}>
                        {check.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComplianceCheck;