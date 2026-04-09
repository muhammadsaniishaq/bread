import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import ManagerBottomNav from './ManagerBottomNav';
import { Fab } from './Fab';
import { useAuth } from '../store/AuthContext';

export const Layout: React.FC = () => {
  const { role } = useAuth();

  if (role === 'MANAGER') {
    return (
      <div className="bg-gray-50 min-h-screen dark:bg-zinc-950">
        <Outlet />
        <ManagerBottomNav />
      </div>
    );
  }

  // SUPPLIER has its own SupplierBottomNav rendered per-page
  if (role === 'SUPPLIER') {
    return (
      <div className="bg-gray-50 dark:bg-zinc-950 min-h-screen">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-zinc-950 min-h-screen">
      <Outlet />
      {role === 'STORE_KEEPER' && <Fab />}
      <BottomNav />
    </div>
  );
};

export default Layout;
