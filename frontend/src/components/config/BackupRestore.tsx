// import  { useState } from 'react';
// import { Download, Upload, RefreshCw, Calendar, HardDrive, Clock, CheckCircle, AlertTriangle, Trash2, Play } from 'lucide-react';

// type BackupStatus = 'completed' | 'failed' | 'pending';

// const BackupRestore = () => {
//   const [isBackingUp, setIsBackingUp] = useState(false);
//   const [isRestoring, setIsRestoring] = useState(false);
//   const [selectedBackup, setSelectedBackup] = useState(null);
//   const [backupSettings, setBackupSettings] = useState({
//     autoBackup: true,
//     frequency: 'daily',
//     time: '02:00',
//     retention: 30,
//     compression: true,
//     includeFiles: true,
//     location: 'local'
//   });

//   const backupHistory = [
//     {
//       id: 1,
//       name: 'backup_2024_01_15_02_00.sql',
//       date: '2024-01-15 02:00:00',
//       size: '245 MB',
//       type: 'Automatic',
//       status: 'completed',
//       duration: '3m 45s'
//     },
//     {
//       id: 2,
//       name: 'backup_2024_01_14_02_00.sql',
//       date: '2024-01-14 02:00:00',
//       size: '243 MB',
//       type: 'Automatic',
//       status: 'completed',
//       duration: '3m 52s'
//     },
//     {
//       id: 3,
//       name: 'backup_manual_2024_01_13_15_30.sql',
//       date: '2024-01-13 15:30:00',
//       size: '241 MB',
//       type: 'Manual',
//       status: 'completed',
//       duration: '3m 38s'
//     },
//     {
//       id: 4,
//       name: 'backup_2024_01_13_02_00.sql',
//       date: '2024-01-13 02:00:00',
//       size: '240 MB',
//       type: 'Automatic',
//       status: 'failed',
//       duration: '0m 15s'
//     },
//     {
//       id: 5,
//       name: 'backup_2024_01_12_02_00.sql',
//       date: '2024-01-12 02:00:00',
//       size: '238 MB',
//       type: 'Automatic',
//       status: 'completed',
//       duration: '3m 41s'
//     }
//   ];

//   const handleCreateBackup = async () => {
//     setIsBackingUp(true);
//     // Simulate backup process
//     await new Promise(resolve => setTimeout(resolve, 3000));
//     setIsBackingUp(false);
//     alert('Backup created successfully!');
//   };

//   const handleRestore = async (backup) => {
//     if (confirm(`Are you sure you want to restore from ${backup.name}? This will overwrite current data.`)) {
//       setIsRestoring(true);
//       setSelectedBackup(backup.id);
//       // Simulate restore process
//       await new Promise(resolve => setTimeout(resolve, 5000));
//       setIsRestoring(false);
//       setSelectedBackup(null);
//       alert('Database restored successfully!');
//     }
//   };

//   const handleDeleteBackup = (backup) => {
//     if (confirm(`Are you sure you want to delete ${backup.name}?`)) {
//       alert('Backup deleted successfully!');
//     }
//   };

//   const getStatusIcon = (status) => {
//     switch (status) {
//       case 'completed':
//         return <CheckCircle className="h-4 w-4 text-green-600" />;
//       case 'failed':
//         return <AlertTriangle className="h-4 w-4 text-red-600" />;
//       default:
//         return <Clock className="h-4 w-4 text-gray-600" />;
//     }
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'completed':
//         return 'bg-green-100 text-green-800';
//       case 'failed':
//         return 'bg-red-100 text-red-800';
//       default:
//         return 'bg-gray-100 text-gray-800';
//     }
//   };

import { useState } from "react";
import {
  Download,
  Upload,
  RefreshCw,
  Calendar,
  HardDrive,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
  Play,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type BackupStatus = "completed" | "failed" | "pending";

interface BackupEntry {
  id: number;
  name: string;
  date: string;
  size: string;
  type: string;
  status: BackupStatus;
  duration: string;
}

interface BackupSettings {
  autoBackup: boolean;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  time: string;
  retention: number;
  compression: boolean;
  includeFiles: boolean;
  location: "local" | "cloud" | "ftp" | "network";
}

const BackupRestore = () => {
  const navigate = useNavigate();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<number | null>(null);
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackup: true,
    frequency: "daily",
    time: "02:00",
    retention: 30,
    compression: true,
    includeFiles: true,
    location: "local",
  });

  const backupHistory: BackupEntry[] = [
    {
      id: 1,
      name: "backup_2024_01_15_02_00.sql",
      date: "2024-01-15 02:00:00",
      size: "245 MB",
      type: "Automatic",
      status: "completed",
      duration: "3m 45s",
    },
    {
      id: 2,
      name: "backup_2024_01_14_02_00.sql",
      date: "2024-01-14 02:00:00",
      size: "243 MB",
      type: "Automatic",
      status: "completed",
      duration: "3m 52s",
    },
    {
      id: 3,
      name: "backup_manual_2024_01_13_15_30.sql",
      date: "2024-01-13 15:30:00",
      size: "241 MB",
      type: "Manual",
      status: "completed",
      duration: "3m 38s",
    },
    {
      id: 4,
      name: "backup_2024_01_13_02_00.sql",
      date: "2024-01-13 02:00:00",
      size: "240 MB",
      type: "Automatic",
      status: "failed",
      duration: "0m 15s",
    },
    {
      id: 5,
      name: "backup_2024_01_12_02_00.sql",
      date: "2024-01-12 02:00:00",
      size: "238 MB",
      type: "Automatic",
      status: "completed",
      duration: "3m 41s",
    },
  ];

  const handleCreateBackup = async () => {
    setIsBackingUp(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setIsBackingUp(false);
    alert("Backup created successfully!");
  };

  const handleRestore = async (backup: BackupEntry) => {
    if (
      confirm(
        `Are you sure you want to restore from ${backup.name}? This will overwrite current data.`
      )
    ) {
      setIsRestoring(true);
      setSelectedBackup(backup.id);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      setIsRestoring(false);
      setSelectedBackup(null);
      alert("Database restored successfully!");
    }
  };

  const handleDeleteBackup = (backup: BackupEntry) => {
    if (confirm(`Are you sure you want to delete ${backup.name}?`)) {
      alert("Backup deleted successfully!");
    }
  };

  const getStatusIcon = (status: BackupStatus) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: BackupStatus) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
                <h2 className="text-xl font-semibold text-gray-900">
              Backup & Restore
            </h2>
            </div>
        <div className="flex items-center justify-between">
          <div>
            
            <p className="text-sm text-gray-600 mt-1">
              Manage database backups and restore operations
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCreateBackup}
              disabled={isBackingUp}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isBackingUp ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>
                {isBackingUp ? "Creating Backup..." : "Create Backup"}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Backup Settings */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <HardDrive className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Backup Settings
            </h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={backupSettings.autoBackup}
                onChange={(e) =>
                  setBackupSettings({
                    ...backupSettings,
                    autoBackup: e.target.checked,
                  })
                }
                className="rounded"
              />
              <span className="text-sm text-gray-700">
                Enable Automatic Backup
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                title="Frequency"
                value={backupSettings.frequency}
                onChange={(e) =>
                  setBackupSettings({
                    ...backupSettings,
                    frequency: e.target.value as BackupSettings["frequency"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Time
              </label>
              <input
              title="Backup Time"
                type="time"
                value={backupSettings.time}
                onChange={(e) =>
                  setBackupSettings({ ...backupSettings, time: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Retention Period (days)
              </label>
              <input
               title="Retention"
                type="number"
                value={backupSettings.retention}
                onChange={(e) =>
                  setBackupSettings({
                    ...backupSettings,
                    retention: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Location
              </label>
              <select
              title="Storage Location"
                value={backupSettings.location}
                onChange={(e) =>
                  setBackupSettings({
                    ...backupSettings,
                    location: e.target.value as BackupSettings["location"],
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="local">Local Storage</option>
                <option value="cloud">Cloud Storage</option>
                <option value="ftp">FTP Server</option>
                <option value="network">Network Drive</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={backupSettings.compression}
                  onChange={(e) =>
                    setBackupSettings({
                      ...backupSettings,
                      compression: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  Enable Compression
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={backupSettings.includeFiles}
                  onChange={(e) =>
                    setBackupSettings({
                      ...backupSettings,
                      includeFiles: e.target.checked,
                    })
                  }
                  className="rounded"
                />
                <span className="text-sm text-gray-700">
                  Include File Attachments
                </span>
              </label>
            </div>

            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              Save Settings
            </button>
          </div>
        </div>

        {/* Backup History */}
        <div className="lg:col-span-2 bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Backup History
              </h3>
            </div>
            <div className="text-sm text-gray-600">
              Total: {backupHistory.length} backups
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Backup Name
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Date
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Size
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Type
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Duration
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {backupHistory.map((backup) => (
                  <tr key={backup.id} className="hover:bg-gray-50">
                    <td className="py-3 text-sm text-gray-900">
                      {backup.name}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {backup.date}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {backup.size}
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {backup.type}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(backup.status)}
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            backup.status
                          )}`}
                        >
                          {backup.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-900">
                      {backup.duration}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center space-x-2">
                        {backup.status === "completed" && (
                          <>
                            <button
                              onClick={() => handleRestore(backup)}
                              disabled={isRestoring}
                              className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                              title="Restore"
                            >
                              {isRestoring && selectedBackup === backup.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              className="text-green-600 hover:text-green-800"
                              title="Download"
                            >
                              <Download className="h-4 w-4" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDeleteBackup(backup)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Backup Statistics */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Backup Statistics
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">1.2 GB</div>
            <div className="text-sm text-gray-600">Total Backup Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">98.5%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">3m 45s</div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">15</div>
            <div className="text-sm text-gray-600">Days Since Last</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center space-x-2 p-3 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
            <Play className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">
              Test Backup Process
            </span>
          </button>
          <button className="flex items-center space-x-2 p-3 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-700">
              Verify Backup Integrity
            </span>
          </button>
          <button className="flex items-center space-x-2 p-3 border border-purple-200 rounded-lg hover:bg-purple-50 transition-colors">
            <HardDrive className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">
              Check Storage Space
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
