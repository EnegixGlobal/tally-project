import React, { useState } from 'react';
import { Settings as SettingsIcon, Users, Database, Shield, Bell, Globe, Save } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const Settings: React.FC = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: SettingsIcon },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Database },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Globe }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Company Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Company Name
                  </label>
                  <input
                  title='Company Name'
                    type="text"
                    value="Apna Book SaaS"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Contact Email
                  </label>
                  <input
                  title='Contact Email'
                    type="email"
                    value="admin@tallyprimeaas.com"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Time Zone
                  </label>
                  <select title='Select time zone' className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}>
                    <option>Asia/Kolkata</option>
                    <option>UTC</option>
                    <option>America/New_York</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Currency
                  </label>
                  <select title='Select Currency' className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}>
                    <option>INR - Indian Rupee</option>
                    <option>USD - US Dollar</option>
                    <option>EUR - Euro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'users':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Role Management</h3>
              <div className={`rounded-lg p-4 ${
                theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Super Admin</h4>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>Full access to all features</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Admin</h4>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>Manage users and subscriptions</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className={`font-medium ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>Support</h4>
                      <p className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                      }`}>Handle support tickets only</p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">Edit</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Apna Book Integration Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Connection Timeout (seconds)
                  </label>
                  <input
                  title='Connection Timeout'
                    type="number"
                    value="30"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Auto Sync Interval (minutes)
                  </label>
                  <input
                  title='Auto Sync Interval'
                    type="number"
                    value="15"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Max Concurrent Connections
                  </label>
                  <input
                  title='Max Concurrent Connections'
                    type="number"
                    value="5"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      theme === 'dark' 
                        ? 'border-gray-600 bg-gray-700 text-white' 
                        : 'border-gray-300 bg-white text-gray-900'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h3 className={`text-lg font-semibold mb-4 ${
                theme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>Security Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Two-Factor Authentication</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>Require 2FA for all admin users</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Enable</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>Session Timeout</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>Auto-logout after inactivity</p>
                  </div>
                  <select title='Session Timeout' className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    theme === 'dark' 
                      ? 'border-gray-600 bg-gray-700 text-white' 
                      : 'border-gray-300 bg-white text-gray-900'
                  }`}>
                    <option>15 minutes</option>
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`}>IP Whitelisting</h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`}>Restrict access to specific IPs</p>
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">Configure</button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className={`p-8 text-center ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
              <p>This section is under development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className={`text-2xl font-bold mb-2 ${
          theme === 'dark' ? 'text-white' : 'text-gray-900'
        }`}>Settings</h1>
        <p className={`${
          theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
        }`}>Configure your admin panel settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className={`lg:w-64 rounded-xl shadow-sm border p-4 ${
          theme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <nav className="space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? theme === 'dark'
                        ? 'bg-blue-900 text-blue-100'
                        : 'bg-blue-100 text-blue-700'
                      : theme === 'dark'
                        ? 'text-gray-300 hover:bg-gray-700'
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className={`rounded-xl shadow-sm border p-6 ${
            theme === 'dark' 
              ? 'bg-gray-800 border-gray-700' 
              : 'bg-white border-gray-200'
          }`}>
            {renderTabContent()}
            
            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-end">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
