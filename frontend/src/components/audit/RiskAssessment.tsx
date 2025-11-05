import { useState } from 'react';
import { AlertTriangle, TrendingUp, Shield,  Activity, Target , ArrowLeft } from 'lucide-react';//Users, Database, Globe,
import { useNavigate } from 'react-router-dom';

const RiskAssessment = () => {
    const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');

  const riskCategories = [
    {
      id: 'security',
      name: 'Security Risks',
      icon: Shield,
      score: 75,
      level: 'Medium',
      trend: 'up',
      factors: [
        { name: 'Weak passwords detected', severity: 'high', count: 12 },
        { name: 'Unpatched systems', severity: 'medium', count: 5 },
        { name: 'Suspicious login attempts', severity: 'high', count: 8 },
        { name: 'Outdated access permissions', severity: 'low', count: 23 }
      ]
    },
    {
      id: 'operational',
      name: 'Operational Risks',
      icon: Activity,
      score: 45,
      level: 'High',
      trend: 'down',
      factors: [
        { name: 'System downtime incidents', severity: 'high', count: 3 },
        { name: 'Data backup failures', severity: 'high', count: 2 },
        { name: 'User errors in critical processes', severity: 'medium', count: 15 },
        { name: 'Workflow bottlenecks', severity: 'low', count: 8 }
      ]
    },
    {
      id: 'compliance',
      name: 'Compliance Risks',
      icon: Target,
      score: 85,
      level: 'Low',
      trend: 'stable',
      factors: [
        { name: 'Missing audit documentation', severity: 'medium', count: 4 },
        { name: 'Policy violations', severity: 'low', count: 7 },
        { name: 'Regulatory changes pending', severity: 'medium', count: 2 },
        { name: 'Training requirements overdue', severity: 'low', count: 12 }
      ]
    },
    {
      id: 'financial',
      name: 'Financial Risks',
      icon: TrendingUp,
      score: 65,
      level: 'Medium',
      trend: 'up',
      factors: [
        { name: 'Unusual transaction patterns', severity: 'high', count: 6 },
        { name: 'Budget overruns', severity: 'medium', count: 9 },
        { name: 'Vendor payment delays', severity: 'low', count: 14 },
        { name: 'Currency exposure', severity: 'medium', count: 3 }
      ]
    }
  ];

  const riskMatrix = [
    { probability: 'Very High', impact: ['Medium', 'High', 'Very High', 'Very High', 'Very High'] },
    { probability: 'High', impact: ['Low', 'Medium', 'High', 'High', 'Very High'] },
    { probability: 'Medium', impact: ['Low', 'Low', 'Medium', 'High', 'High'] },
    { probability: 'Low', impact: ['Very Low', 'Low', 'Low', 'Medium', 'High'] },
    { probability: 'Very Low', impact: ['Very Low', 'Very Low', 'Low', 'Low', 'Medium'] }
  ];

  const impactLabels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];

  const criticalRisks = [
    {
      id: 1,
      title: 'Multiple failed login attempts from foreign IPs',
      description: 'Detected coordinated brute force attack attempts',
      probability: 'High',
      impact: 'High',
      riskLevel: 'High',
      mitigation: 'Implement IP blocking and enhanced monitoring',
      owner: 'Security Team',
      dueDate: '2024-01-20'
    },
    {
      id: 2,
      title: 'Critical system backup failure',
      description: 'Main database backup system failed for 2 consecutive days',
      probability: 'Medium',
      impact: 'Very High',
      riskLevel: 'High',
      mitigation: 'Restore backup system and implement redundancy',
      owner: 'IT Operations',
      dueDate: '2024-01-18'
    },
    {
      id: 3,
      title: 'Regulatory compliance gap identified',
      description: 'New GDPR requirements not fully implemented',
      probability: 'High',
      impact: 'High',
      riskLevel: 'High',
      mitigation: 'Update privacy policies and data handling procedures',
      owner: 'Compliance Team',
      dueDate: '2024-01-25'
    }
  ];

  const getRiskColor = (level:string) => {
    switch (level.toLowerCase()) {
      case 'low':
      case 'very low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
      case 'very high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity:string) => {
    switch (severity) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend:string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'down':
        return <TrendingUp className="h-4 w-4 text-green-500 transform rotate-180" />;
      case 'stable':
        return <div className="h-4 w-4 bg-gray-400 rounded-full"></div>;
      default:
        return null;
    }
  };

  const overallRiskScore = Math.round(riskCategories.reduce((acc, cat) => acc + cat.score, 0) / riskCategories.length);
  const highRiskItems = riskCategories.reduce((acc, cat) => acc + cat.factors.filter(f => f.severity === 'high').length, 0);

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
                  <h1 className="text-xl font-semibold text-gray-900">Risk Assessment</h1>
                 </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mt-1">Comprehensive risk analysis and threat monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <select
            title='timeframe'
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="day">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
            </select>
          </div>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Overall Risk Score</h3>
              <p className="text-2xl font-bold text-gray-900">{overallRiskScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">High Risk Items</h3>
              <p className="text-2xl font-bold text-gray-900">{highRiskItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Target className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Active Mitigations</h3>
              <p className="text-2xl font-bold text-gray-900">{criticalRisks.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Categories */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Categories</h3>
          <div className="space-y-4">
            {riskCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div key={category.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <Icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{category.name}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(category.level)}`}>
                            {category.level} Risk
                          </span>
                          {getTrendIcon(category.trend)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{category.score}</p>
                      <p className="text-xs text-gray-500">Risk Score</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {category.factors.map((factor, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{factor.name}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">{factor.count}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(factor.severity)}`}>
                            {factor.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Matrix */}
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-xs font-medium text-gray-500 p-2"></th>
                  {impactLabels.map((label, index) => (
                    <th key={index} className="text-xs font-medium text-gray-500 p-2 text-center">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {riskMatrix.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    <td className="text-xs font-medium text-gray-500 p-2">{row.probability}</td>
                    {row.impact.map((cell, cellIndex) => (
                      <td key={cellIndex} className="p-2">
                        <div className={`w-full h-8 rounded flex items-center justify-center text-xs font-medium ${getRiskColor(cell)}`}>
                          {cell}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Probability (vertical) vs Impact (horizontal)
          </p>
        </div>
      </div>

      {/* Critical Risks */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Critical Risks Requiring Attention</h3>
        <div className="space-y-4">
          {criticalRisks.map((risk) => (
            <div key={risk.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-gray-900">{risk.title}</h4>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(risk.riskLevel)}`}>
                      {risk.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{risk.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Probability:</span>
                      <span className="ml-1 text-gray-900">{risk.probability}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Impact:</span>
                      <span className="ml-1 text-gray-900">{risk.impact}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Owner:</span>
                      <span className="ml-1 text-gray-900">{risk.owner}</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="font-medium text-gray-600">Mitigation:</span>
                    <span className="ml-1 text-gray-900">{risk.mitigation}</span>
                  </div>
                </div>
                <div className="ml-4 text-right">
                  <p className="text-sm font-medium text-gray-600">Due Date</p>
                  <p className="text-sm text-gray-900">{risk.dueDate}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RiskAssessment;