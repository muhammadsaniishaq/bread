import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import type { UserRole } from '../store/AuthContext';

export const RoleGuard: React.FC<{ children: React.ReactNode, allowedRoles: UserRole[] }> = ({ children, allowedRoles }) => {
  const { role, loading } = useAuth();
  
  if (loading) return <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'var(--background-color)', color:'var(--primary-color)'}}>Loading Roles...</div>;
  
  // If the user doesn't have the explicit role, redirect them or show an unauthorized page
  if (!role || !allowedRoles.includes(role)) {
    // For now, redirect to login if unauthorized for that specific page, or could go to '/' to route properly
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

export default RoleGuard;
