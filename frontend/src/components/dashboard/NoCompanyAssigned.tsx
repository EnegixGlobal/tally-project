import React from 'react';

const NoCompanyAssigned: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-700 dark:text-gray-300 text-lg">
          No Company Assigned. Please contact your administrator.
        </p>
      </div>
    </div>
  );
};

export default NoCompanyAssigned;
