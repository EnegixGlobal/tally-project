import  { useState } from 'react';
import { Shield, Key, Clock, AlertTriangle, Save, Settings, ArrowLeft } from 'lucide-react';//Lock , Users
import { useNavigate } from 'react-router-dom';

const SecuritySettings = () => {
    const navigate = useNavigate();
  const [settings, setSettings] = useState({
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      passwordExpiry: 90,
      preventReuse: 5
    },
    sessionSettings: {
      sessionTimeout: 30,
      maxConcurrentSessions: 3,
      requireReauth: true,
      rememberMe: false
    },
    twoFactor: {
      enabled: true,
      required: false,
      methods: ['sms', 'email', 'authenticator'],
      backupCodes: true
    },
    auditSettings: {
      logAllActions: true,
      logFailedLogins: true,
      logDataChanges: true,
      retentionPeriod: 365,
      realTimeAlerts: true
    },
    ipRestrictions: {
      enabled: false,
      allowedIPs: ['192.168.1.0/24'],
      blockSuspiciousIPs: true,
      geoBlocking: false
    }
  });

  const handleSave = () => {
    // Save settings logic
    alert('Security settings saved successfully!');
  };

  const securityScore = 85; // Calculate based on current settings

  return (
    <div className="pt-[56px] px-4">
      <div className="mb-6">
        
        <div className="flex items-center justify-between">
             <div className="flex items-center mb-4">
                        <button
                            title='Back to Reports'
                            type='button'
                            onClick={() => navigate('/app/audit')}
                            className="mr-4 p-2 rounded-full hover:bg-gray-200"
                                >
                            <ArrowLeft size={20} />
                        </button>
                      <h1 className="text-xl font-semibold text-gray-900">Security Settings</h1>
                     </div>
          <div>
            
            <p className="text-sm text-gray-600 mt-1">Configure system security policies and restrictions</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Security Score</p>
              <p className="text-2xl font-bold text-green-600">{securityScore}%</p>
            </div>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Password Policy */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Key className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Password Policy</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Password Length
              </label>
              <input
              title='password length'
                type="number"
                value={settings.passwordPolicy.minLength}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordPolicy: { ...settings.passwordPolicy, minLength: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireUppercase}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, requireUppercase: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Require uppercase letters</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireLowercase}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, requireLowercase: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Require lowercase letters</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireNumbers}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, requireNumbers: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Require numbers</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.passwordPolicy.requireSpecialChars}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: { ...settings.passwordPolicy, requireSpecialChars: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Require special characters</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Expiry (days)
              </label>
              <input
              title='Password Expiry'
                type="number"
                value={settings.passwordPolicy.passwordExpiry}
                onChange={(e) => setSettings({
                  ...settings,
                  passwordPolicy: { ...settings.passwordPolicy, passwordExpiry: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Session Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Session Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (minutes)
              </label>
              <input
              title='Session timeout'
                type="number"
                value={settings.sessionSettings.sessionTimeout}
                onChange={(e) => setSettings({
                  ...settings,
                  sessionSettings: { ...settings.sessionSettings, sessionTimeout: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Concurrent Sessions
              </label>
              <input
              title='Max Concurrent Sessions'
                type="number"
                value={settings.sessionSettings.maxConcurrentSessions}
                onChange={(e) => setSettings({
                  ...settings,
                  sessionSettings: { ...settings.sessionSettings, maxConcurrentSessions: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.sessionSettings.requireReauth}
                  onChange={(e) => setSettings({
                    ...settings,
                    sessionSettings: { ...settings.sessionSettings, requireReauth: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Require re-authentication for sensitive actions</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.sessionSettings.rememberMe}
                  onChange={(e) => setSettings({
                    ...settings,
                    sessionSettings: { ...settings.sessionSettings, rememberMe: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Allow "Remember Me" option</span>
              </label>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.twoFactor.enabled}
                onChange={(e) => setSettings({
                  ...settings,
                  twoFactor: { ...settings.twoFactor, enabled: e.target.checked }
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Enable 2FA for all users</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.twoFactor.required}
                onChange={(e) => setSettings({
                  ...settings,
                  twoFactor: { ...settings.twoFactor, required: e.target.checked }
                })}
                className="rounded"
              />
              <span className="text-sm text-gray-700">Make 2FA mandatory</span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Methods
              </label>
              <div className="space-y-2">
                {['SMS', 'Email', 'Authenticator App'].map((method, index) => (
                  <label key={index} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={settings.twoFactor.methods.includes(method.toLowerCase().replace(' ', ''))}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Audit Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Audit Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.auditSettings.logAllActions}
                  onChange={(e) => setSettings({
                    ...settings,
                    auditSettings: { ...settings.auditSettings, logAllActions: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Log all user actions</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.auditSettings.logFailedLogins}
                  onChange={(e) => setSettings({
                    ...settings,
                    auditSettings: { ...settings.auditSettings, logFailedLogins: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Log failed login attempts</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.auditSettings.logDataChanges}
                  onChange={(e) => setSettings({
                    ...settings,
                    auditSettings: { ...settings.auditSettings, logDataChanges: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Log data changes</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.auditSettings.realTimeAlerts}
                  onChange={(e) => setSettings({
                    ...settings,
                    auditSettings: { ...settings.auditSettings, realTimeAlerts: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Real-time security alerts</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Log Retention Period (days)
              </label>
              <input
              title='Log Retention Period (days)'
                type="number"
                value={settings.auditSettings.retentionPeriod}
                onChange={(e) => setSettings({
                  ...settings,
                  auditSettings: { ...settings.auditSettings, retentionPeriod: parseInt(e.target.value) }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Security Recommendations */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Security Recommendations</h4>
            <ul className="mt-2 text-sm text-yellow-700 space-y-1">
              <li>• Enable mandatory 2FA for all admin users</li>
              <li>• Set password expiry to 90 days or less</li>
              <li>• Enable IP restrictions for sensitive operations</li>
              <li>• Regularly review and update security policies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;