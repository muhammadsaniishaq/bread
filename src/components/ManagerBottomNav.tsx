import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileBarChart, Settings, Scale, Users } from 'lucide-react';
import './BottomNav.css';

const ManagerBottomNav: React.FC = () => {
  const location = useLocation();
  const isHomeActive = ['/manager', '/'].includes(location.pathname);

  return (
    <nav className="bottom-nav">
      <NavLink to="/manager" className={`nav-item ${isHomeActive ? 'active' : ''}`}>
        <LayoutDashboard size={22} strokeWidth={2.5} />
        <span>Control Panel</span>
      </NavLink>
      <NavLink to="/manager/reports" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <FileBarChart size={22} strokeWidth={2.5} />
        <span>Reports</span>
      </NavLink>
      <NavLink to="/manager/reconciliation" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Scale size={22} strokeWidth={2.5} />
        <span>Reconcile</span>
      </NavLink>
      <NavLink to="/manager/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Users size={22} strokeWidth={2.5} />
        <span>Profile</span>
      </NavLink>
      <NavLink to="/manager/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Settings size={22} strokeWidth={2.5} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
};

export default ManagerBottomNav;
