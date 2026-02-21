import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdmin } from '../hooks/useAdmin';

const ProtectedRoute: React.FC = () => {
    const { isAuthenticated } = useAdmin();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
