import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/supplier' },
  { label: 'Profile',   icon: UserCircle2,     path: '/supplier/profile' },
];

const SupplierBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'rgba(255,255,255,0.88)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      {tabs.map(tab => {
        const active = pathname === tab.path || (tab.path !== '/supplier' && pathname.startsWith(tab.path));
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '4px', padding: '12px 4px 14px',
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative',
            }}
          >
            {/* Active top bar */}
            {active && (
              <motion.div
                layoutId="supplier-active-bar"
                style={{
                  position: 'absolute', top: 0, left: '20%', right: '20%',
                  height: '3px', borderRadius: '0 0 4px 4px',
                  background: 'linear-gradient(90deg,#4f46e5,#818cf8)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}

            {/* Icon pill */}
            <motion.div
              animate={{ scale: active ? 1.05 : 1 }}
              style={{
                width: '46px', height: '34px', borderRadius: '12px',
                background: active ? 'rgba(79,70,229,0.1)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
            >
              <tab.icon
                size={22}
                color={active ? '#4f46e5' : '#94a3b8'}
                strokeWidth={active ? 2.5 : 1.8}
              />
            </motion.div>

            <span style={{
              fontSize: '10px', fontWeight: active ? 800 : 600,
              color: active ? '#4f46e5' : '#94a3b8',
              letterSpacing: '0.01em',
              transition: 'color 0.2s',
            }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SupplierBottomNav;
