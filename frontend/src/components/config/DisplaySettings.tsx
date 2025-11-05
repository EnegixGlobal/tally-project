import  { useState } from 'react';
import { Monitor, Palette, Type, Layout, Save, RefreshCw, Eye, Grid ,ArrowLeft} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DisplaySettings = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    theme: 'light',
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    fontSize: 'medium',
    fontFamily: 'Inter',
    sidebarWidth: 'normal',
    headerHeight: 'normal',
    compactMode: false,
    showBreadcrumbs: true,
    showTooltips: true,
    animationsEnabled: true,
    highContrast: false,
    reducedMotion: false,
    tableRowsPerPage: 25,
    dateFormat: 'DD/MM/YYYY',
    numberFormat: 'US',
    currencyPosition: 'before',
    showGridLines: true,
    alternateRowColors: true,
    stickyHeaders: true
  });

  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = () => {
    alert('Display settings saved successfully!');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all display settings to default?')) {
      setSettings({
        theme: 'light',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        fontSize: 'medium',
        fontFamily: 'Inter',
        sidebarWidth: 'normal',
        headerHeight: 'normal',
        compactMode: false,
        showBreadcrumbs: true,
        showTooltips: true,
        animationsEnabled: true,
        highContrast: false,
        reducedMotion: false,
        tableRowsPerPage: 25,
        dateFormat: 'DD/MM/YYYY',
        numberFormat: 'US',
        currencyPosition: 'before',
        showGridLines: true,
        alternateRowColors: true,
        stickyHeaders: true
      });
    }
  };

  const colorPresets = [
    { name: 'Blue', primary: '#3B82F6', secondary: '#10B981' },
    { name: 'Purple', primary: '#8B5CF6', secondary: '#F59E0B' },
    { name: 'Green', primary: '#10B981', secondary: '#3B82F6' },
    { name: 'Red', primary: '#EF4444', secondary: '#8B5CF6' },
    { name: 'Orange', primary: '#F59E0B', secondary: '#EF4444' },
    { name: 'Teal', primary: '#14B8A6', secondary: '#F59E0B' }
  ];

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
                <h2 className="text-xl font-semibold text-gray-900">Display Settings</h2>
            </div>
        <div className="flex items-center justify-between">
          <div>
            
            <p className="text-sm text-gray-600 mt-1">Customize the appearance and layout of the application</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="h-4 w-4" />
              <span>{previewMode ? 'Exit Preview' : 'Preview'}</span>
            </button>
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
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
        {/* Theme & Colors */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Palette className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Theme & Colors</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {['light', 'dark', 'auto'].map((theme) => (
                  <button
                    key={theme}
                    onClick={() => setSettings({...settings, theme})}
                    className={`p-3 border rounded-lg text-sm font-medium capitalize transition-colors ${
                      settings.theme === theme
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color Presets</label>
              <div className="grid grid-cols-3 gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setSettings({
                      ...settings,
                      primaryColor: preset.primary,
                      secondaryColor: preset.secondary
                    })}
                    className="flex items-center space-x-2 p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex space-x-1">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.primary }}
                      ></div>
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.secondary }}
                      ></div>
                    </div>
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                  title='Primary Color'
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="w-12 h-10 border border-gray-300 rounded-lg"
                  />
                  <input
                    title='Primary Color'
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({...settings, primaryColor: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
                <div className="flex items-center space-x-2">
                  <input
                  title='Secondary Color'
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                    className="w-12 h-10 border border-gray-300 rounded-lg"
                  />
                  <input
                    title='Secondary Color'
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({...settings, secondaryColor: e.target.value})}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Type className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Family</label>
              <select
                title='Font Family'
                value={settings.fontFamily}
                onChange={(e) => setSettings({...settings, fontFamily: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Poppins">Poppins</option>
                <option value="Nunito">Nunito</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Font Size</label>
              <div className="grid grid-cols-4 gap-2">
                {['small', 'medium', 'large', 'extra-large'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSettings({...settings, fontSize: size})}
                    className={`p-2 border rounded-lg text-xs font-medium capitalize transition-colors ${
                      settings.fontSize === size
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {size.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.highContrast}
                  onChange={(e) => setSettings({...settings, highContrast: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">High Contrast Mode</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => setSettings({...settings, reducedMotion: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Reduce Motion</span>
              </label>
            </div>
          </div>
        </div>

        {/* Layout Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Layout className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Layout Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sidebar Width</label>
                <select
                  title='Sidebar Width'
                  value={settings.sidebarWidth}
                  onChange={(e) => setSettings({...settings, sidebarWidth: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="narrow">Narrow</option>
                  <option value="normal">Normal</option>
                  <option value="wide">Wide</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Header Height</label>
                <select
                  title='Header Height'
                  value={settings.headerHeight}
                  onChange={(e) => setSettings({...settings, headerHeight: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="tall">Tall</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={(e) => setSettings({...settings, compactMode: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Compact Mode</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.showBreadcrumbs}
                  onChange={(e) => setSettings({...settings, showBreadcrumbs: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Show Breadcrumbs</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.showTooltips}
                  onChange={(e) => setSettings({...settings, showTooltips: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Show Tooltips</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.animationsEnabled}
                  onChange={(e) => setSettings({...settings, animationsEnabled: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Enable Animations</span>
              </label>
            </div>
          </div>
        </div>

        {/* Table & Grid Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Grid className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Table & Grid Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rows Per Page</label>
              <select
                title='Rows Per Page'
                value={settings.tableRowsPerPage}
                onChange={(e) => setSettings({...settings, tableRowsPerPage: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.showGridLines}
                  onChange={(e) => setSettings({...settings, showGridLines: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Show Grid Lines</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.alternateRowColors}
                  onChange={(e) => setSettings({...settings, alternateRowColors: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Alternate Row Colors</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.stickyHeaders}
                  onChange={(e) => setSettings({...settings, stickyHeaders: e.target.checked})}
                  className="rounded"
                />
                <span className="text-sm text-gray-700">Sticky Headers</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Format Settings */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Monitor className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Format Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Currency Position</label>
            <select
              title='Currency Position'
              value={settings.currencyPosition}
              onChange={(e) => setSettings({...settings, currencyPosition: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="before">Before ($100)</option>
              <option value="after">After (100$)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview Section */}
      {previewMode && (
        <div className="mt-6 bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-center text-gray-600">
              Preview of your display settings would appear here
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisplaySettings;