import  { useState } from 'react';
import { Database, Save, TestTube, AlertTriangle, CheckCircle, RefreshCw, HardDrive, Activity, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DatabaseSettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    host: 'localhost',
    port: '5432',
    database: 'accounting_db',
    username: 'admin',
    password: '',
    connectionTimeout: 30,
    maxConnections: 100,
    enableSSL: true,
    autoVacuum: true,
    backupRetention: 30,
    logQueries: false,
    performanceMode: 'balanced'
  });

  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] =  useState<string | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setConnectionStatus('testing');
    
    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const success = Math.random() > 0.3; // 70% success rate for demo
    setConnectionStatus(success ? 'connected' : 'failed');
    setTestResult(success ? 'Connection successful!' : 'Connection failed. Please check your settings.');
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('Database settings saved successfully!');
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'testing':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      default:
        return <Database className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'testing':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
         <div className="flex items-center mb-4">
            <button
                title='Back to Reports'
                type='button'
                  onClick={() => navigate('/app/config')}
                  className="mr-4 p-2 rounded-full hover:bg-gray-200"
                >
                  <ArrowLeft size={20} />
                </button>
                <h2 className="text-xl font-semibold text-gray-900">Database Settings</h2>
            </div>
        <div className="flex items-center justify-between">
          <div>
            
            <p className="text-sm text-gray-600 mt-1">Configure database connection and performance settings</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleTestConnection}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <TestTube className="h-4 w-4" />
              <span>Test Connection</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mb-6 bg-white border rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-medium text-gray-900">Database Connection Status</h3>
              <p className={`text-sm ${getStatusColor()}`}>
                {connectionStatus === 'connected' && 'Connected successfully'}
                {connectionStatus === 'failed' && 'Connection failed'}
                {connectionStatus === 'testing' && 'Testing connection...'}
                {connectionStatus === 'disconnected' && 'Not connected'}
              </p>
            </div>
          </div>
          {testResult && (
            <div className={`text-sm ${connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'}`}>
              {testResult}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Connection Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Connection Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Database Type</label>
              <select 
              title='Select Database Type'
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="postgresql">PostgreSQL</option>
                <option value="mysql">MySQL</option>
                <option value="sqlite">SQLite</option>
                <option value="mssql">SQL Server</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Host</label>
                <input
                title='Database Host'
                  type="text"
                  value={settings.host}
                  onChange={(e) => setSettings({...settings, host: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Port</label>
                <input
                title='Enter Database Port'
                  type="number"
                  value={settings.port}
                  onChange={(e) => setSettings({...settings, port: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Database Name</label>
              <input
              title='Enter Database Name'
                type="text"
                value={settings.database}
                onChange={(e) => setSettings({...settings, database: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                title='Enter Database Username'
                  type="text"
                  value={settings.username}
                  onChange={(e) => setSettings({...settings, username: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                title='Enter Database Password'
                  type="password"
                  value={settings.password}
                  onChange={(e) => setSettings({...settings, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.enableSSL}
                  onChange={(e) => setSettings({...settings, enableSSL: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Enable SSL Connection</span>
              </label>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Performance Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Connection Timeout (seconds)</label>
              <input
                title='Enter Connection Timeout in Seconds'
                type="number"
                value={settings.connectionTimeout}
                onChange={(e) => setSettings({...settings, connectionTimeout: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Connections</label>
              <input
              title='Enter Maximum Connections'
                type="number"
                value={settings.maxConnections}
                onChange={(e) => setSettings({...settings, maxConnections: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Performance Mode</label>
              <select
              title='Select Performance Mode'
                value={settings.performanceMode}
                onChange={(e) => setSettings({...settings, performanceMode: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="conservative">Conservative</option>
                <option value="balanced">Balanced</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Backup Retention (days)</label>
              <input
              title='Enter Backup Retention Period in Days'
                type="number"
                value={settings.backupRetention}
                onChange={(e) => setSettings({...settings, backupRetention: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoVacuum}
                  onChange={(e) => setSettings({...settings, autoVacuum: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Enable Auto Vacuum</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.logQueries}
                  onChange={(e) => setSettings({...settings, logQueries: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Log Database Queries</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Database Statistics */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <HardDrive className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Database Statistics</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">2.4 GB</div>
            <div className="text-sm text-gray-600">Database Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">1,247</div>
            <div className="text-sm text-gray-600">Total Tables</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">45,892</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">12</div>
            <div className="text-sm text-gray-600">Active Connections</div>
          </div>
        </div>
      </div>

      {/* Connection Pool Status */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Pool Status</h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Active Connections</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '30%' }}></div>
              </div>
              <span className="text-sm font-medium">12/100</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Idle Connections</span>
            <div className="flex items-center space-x-2">
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '70%' }}></div>
              </div>
              <span className="text-sm font-medium">88/100</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Average Response Time</span>
            <span className="text-sm font-medium text-green-600">45ms</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Queries per Second</span>
            <span className="text-sm font-medium text-blue-600">127</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSettings;