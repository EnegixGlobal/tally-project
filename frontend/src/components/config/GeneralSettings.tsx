import  { useState } from 'react';
import { Settings, Save, RefreshCw, Globe, Calendar, Clock, Building ,ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';


const GeneralSettings = () => {
  const navigate= useNavigate();
  const [settings, setSettings] = useState({
    companyName: 'Acme Corporation',
    companyAddress: '123 Business Street, City, State 12345',
    companyPhone: '+1 (555) 123-4567',
    companyEmail: 'info@acme.com',
    companyWebsite: 'www.acme.com',
    financialYear: '2024-2025',
    financialYearStart: '2024-04-01',
    financialYearEnd: '2025-03-31',
    baseCurrency: 'USD',
    decimalPlaces: 2,
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24',
    timezone: 'UTC+05:30',
    language: 'English',
    numberFormat: 'US',
    taxRegistration: 'TAX123456789',
    panNumber: 'ABCDE1234F',
    gstNumber: '27ABCDE1234F1Z5',
    autoBackup: true,
    backupFrequency: 'daily',
    enableAuditLog: true,
    sessionTimeout: 30,
    multiCurrency: false,
    inventoryTracking: true,
    barcodeGeneration: false,
    emailNotifications: true,
    smsNotifications: false
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    alert('General settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      // Reset to default values
      setSettings({
        ...settings,
        companyName: 'Acme Corporation',
        baseCurrency: 'USD',
        decimalPlaces: 2,
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        timezone: 'UTC+05:30',
        language: 'English'
      });
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
                <h2 className="text-xl font-semibold text-gray-900">General Settings</h2>
            </div>
        <div className="flex items-center justify-between">
          <div>
            
            <p className="text-sm text-gray-600 mt-1">Configure basic system settings and company information</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Building className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Company Information</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
              title='Company Name'
                type="text"
                value={settings.companyName}
                onChange={(e) => setSettings({...settings, companyName: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                title='Company Address'
                value={settings.companyAddress}
                onChange={(e) => setSettings({...settings, companyAddress: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  title='Company Phone'
                  type="text"
                  value={settings.companyPhone}
                  onChange={(e) => setSettings({...settings, companyPhone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                title='Company Email'
                  type="email"
                  value={settings.companyEmail}
                  onChange={(e) => setSettings({...settings, companyEmail: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
              title='Company Website'
                type="url"
                value={settings.companyWebsite}
                onChange={(e) => setSettings({...settings, companyWebsite: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Calendar className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Financial Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Financial Year</label>
              <input
              title='Financial Year'
                type="text"
                value={settings.financialYear}
                onChange={(e) => setSettings({...settings, financialYear: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                title='Financial Year Start Date'
                  type="date"
                  value={settings.financialYearStart}
                  onChange={(e) => setSettings({...settings, financialYearStart: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                title='Financial Year End Date'
                  type="date"
                  value={settings.financialYearEnd}
                  onChange={(e) => setSettings({...settings, financialYearEnd: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Currency</label>
                <select
                title='Base Currency'
                  value={settings.baseCurrency}
                  onChange={(e) => setSettings({...settings, baseCurrency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="INR">INR - Indian Rupee</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Decimal Places</label>
                <select
                title='Decimal Places'
                  value={settings.decimalPlaces}
                  onChange={(e) => setSettings({...settings, decimalPlaces: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Regional Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Globe className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Regional Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                <select
                title='Date Format'
                  value={settings.dateFormat}
                  onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
                <select
                title='Time Format'
                  value={settings.timeFormat}
                  onChange={(e) => setSettings({...settings, timeFormat: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="12">12 Hour</option>
                  <option value="24">24 Hour</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
              title='Timezone'
                value={settings.timezone}
                onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UTC+05:30">UTC+05:30 (India Standard Time)</option>
                <option value="UTC+00:00">UTC+00:00 (Greenwich Mean Time)</option>
                <option value="UTC-05:00">UTC-05:00 (Eastern Standard Time)</option>
                <option value="UTC-08:00">UTC-08:00 (Pacific Standard Time)</option>
                <option value="UTC+01:00">UTC+01:00 (Central European Time)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  title='Language'
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish</option>
                  <option value="French">French</option>
                  <option value="German">German</option>
                  <option value="Hindi">Hindi</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Number Format</label>
                <select
                title='Number Format'
                  value={settings.numberFormat}
                  onChange={(e) => setSettings({...settings, numberFormat: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="US">US (1,234.56)</option>
                  <option value="EU">EU (1.234,56)</option>
                  <option value="IN">IN (1,23,456.78)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Tax Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Tax & Registration</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Registration Number</label>
              <input
              title='Tax Registration Number'
                type="text"
                value={settings.taxRegistration}
                onChange={(e) => setSettings({...settings, taxRegistration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">PAN Number</label>
              <input
              title='PAN Number'
                type="text"
                value={settings.panNumber}
                onChange={(e) => setSettings({...settings, panNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">GST Number</label>
              <input
              title='GST Number'
                type="text"
                value={settings.gstNumber}
                onChange={(e) => setSettings({...settings, gstNumber: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Features */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">System Features</h3>
          </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.autoBackup}
                onChange={(e) => setSettings({...settings, autoBackup: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Enable Auto Backup</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.enableAuditLog}
                onChange={(e) => setSettings({...settings, enableAuditLog: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Enable Audit Logging</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.multiCurrency}
                onChange={(e) => setSettings({...settings, multiCurrency: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Multi-Currency Support</span>
            </label>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.inventoryTracking}
                onChange={(e) => setSettings({...settings, inventoryTracking: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Inventory Tracking</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.barcodeGeneration}
                onChange={(e) => setSettings({...settings, barcodeGeneration: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Barcode Generation</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Email Notifications</span>
            </label>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings({...settings, smsNotifications: e.target.checked})}
                className="rounded"
              />
              <span className="text-sm text-gray-700">SMS Notifications</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
              <input
              title='Session Timeout'
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
              <select
              title='Backup Frequency'
                value={settings.backupFrequency}
                onChange={(e) => setSettings({...settings, backupFrequency: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;