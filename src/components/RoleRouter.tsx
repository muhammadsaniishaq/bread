import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export const RoleRouter: React.FC = () => {
  const { role, loading } = useAuth();

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-primary">Loading...</div>;
  }

  switch (role) {
    case 'MANAGER':
      return <Navigate to="/manager" replace />;
    case 'STORE_KEEPER':
      return <Navigate to="/store" replace />;
    case 'SUPPLIER':
      return <Navigate to="/supplier" replace />;
    case 'CUSTOMER':
      return <Navigate to="/customer" replace />;
    default:
      // Fallback if role is undefined or unrecognized
      return <Navigate to="/customer" replace />;
  }
};

export default RoleRouter;
