import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingCart, Users, Package, Banknote, MoreHorizontal } from 'lucide-react';

import './BottomNav.css';

const BottomNav: React.FC = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Home size={24} />
        <span>Dashboard</span>
      </NavLink>
      <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingCart size={24} />
        <span>Sales</span>
      </NavLink>
      <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Users size={24} />
        <span>Customers</span>
      </NavLink>
      <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Package size={24} />
        <span>Inventory</span>
      </NavLink>
      <NavLink to="/expenses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Banknote size={24} />
        <span>Expenses</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <MoreHorizontal size={24} />
        <span>More</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
