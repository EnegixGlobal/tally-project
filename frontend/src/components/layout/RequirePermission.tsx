import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../home/context/AuthContext';

interface RequirePermissionProps {
    children: React.ReactNode;
    moduleId: string | string[];
}

const RequirePermission: React.FC<RequirePermissionProps> = ({ children, moduleId }) => {
    const { checkPermission, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-sm text-gray-500">Checking permissions...</div>
            </div>
        );
    }

    let hasPermission = false;
    if (Array.isArray(moduleId)) {
        hasPermission = moduleId.some(id => checkPermission(id));
    } else {
        hasPermission = checkPermission(moduleId);
    }

    if (!hasPermission) {
        // Redirect to dashboard or a "permission denied" page
        return <Navigate to="/app" replace />;
    }

    return <>{children}</>;
};

export default RequirePermission;
