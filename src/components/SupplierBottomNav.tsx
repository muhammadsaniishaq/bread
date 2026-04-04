import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, User } from 'lucide-react';
import { motion } from 'framer-motion';

const T = {
  primary: '#4f46e5',
  pLight: 'rgba(79,70,229,0.1)',
  white: '#ffffff',
  txt3: '#94a3b8',
  borderL: 'rgba(0,0,0,0.07)',
};

const tabs = [
  { label: 'Dash', icon: LayoutDashboard, path: '/supplier' },
  { label: 'Profile', icon: User, path: '/supplier/profile' },
];

const SupplierBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)',
      borderTop: `1px solid ${T.borderL}`,
      display: 'flex', padding: '8px 4px 20px',
      fontFamily: "'Inter', -apple-system, sans-serif",
    }}>
      {tabs.map(tab => {
        const active = pathname === tab.path || (tab.path !== '/supplier' && pathname.startsWith(tab.path));
        return (
          <button key={tab.path} onClick={() => navigate(tab.path)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 4px', position: 'relative', fontFamily: 'inherit' }}>
            {active && (
              <motion.div layoutId="supplier-nav-pill"
                style={{ position: 'absolute', top: 0, left: '30%', right: '30%', height: '3px', background: T.primary, borderRadius: '0 0 3px 3px' }} />
            )}
            <div style={{ width: '40px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', background: active ? T.pLight : 'transparent', transition: 'background 0.2s' }}>
              <tab.icon size={20} color={active ? T.primary : T.txt3} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: active ? 800 : 600, color: active ? T.primary : T.txt3, transition: 'color 0.2s' }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default SupplierBottomNav;
