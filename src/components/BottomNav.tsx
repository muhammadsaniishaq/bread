import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Users, Package, Banknote, MoreHorizontal } from 'lucide-react';
import { useAppContext } from '../store/AppContext';

import './BottomNav.css';

const BottomNav: React.FC = () => {
  const { appSettings, products } = useAppContext();
  const isAdmin = appSettings?.role === 'Admin' || !appSettings?.role; // Default to Admin for legacy

  const hasLowStock = products.some(p => p.active && p.stock > 0 && p.stock < 20);
  const location = useLocation();
  const isHomeActive = ['/', '/manager', '/supplier', '/store', '/customer', '/legacy'].includes(location.pathname);

  return (
    <nav className="bottom-nav">
      <NavLink to="/" className={`nav-item ${isHomeActive ? 'active' : ''}`}>
        <Home size={22} strokeWidth={2.5} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/sales" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <ShoppingCart size={22} strokeWidth={2.5} />
        <span>Sales</span>
      </NavLink>
      
      {/* Hide specific tabs from cashiers to make more room and secure the app */}
      {isAdmin && (
        <>
          <NavLink to="/customers" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users size={22} strokeWidth={2.5} />
            <span>Clients</span>
          </NavLink>
          <NavLink to="/inventory" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <div className="relative">
              <Package size={22} strokeWidth={2.5} />
              {hasLowStock && <div className="low-stock-badge"></div>}
            </div>
            <span>Stock</span>
          </NavLink>
          <NavLink to="/expenses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Banknote size={22} strokeWidth={2.5} />
            <span>Spend</span>
          </NavLink>
        </>
      )}

      <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <MoreHorizontal size={22} strokeWidth={2.5} />
        <span>More</span>
      </NavLink>
    </nav>
  );
};

export default BottomNav;
