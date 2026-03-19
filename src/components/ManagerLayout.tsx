import React from 'react';
import { Outlet } from 'react-router-dom';
import ManagerBottomNav from './ManagerBottomNav';

const ManagerLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <main className="main-content">
        <Outlet />
      </main>
      <ManagerBottomNav />
    </div>
  );
};

export default ManagerLayout;
