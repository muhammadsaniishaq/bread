import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import { Fab } from './Fab';

export const Layout: React.FC = () => {
  return (
    <>
      <Outlet />
      <Fab />
      <BottomNav />
    </>
  );
};

export default Layout;
