import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ShoppingCart, Users, Package, Receipt, MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { label: 'Home',    icon: LayoutDashboard, path: '/supplier' },
  { label: 'Sales',   icon: ShoppingCart,    path: '/sales' },
  { label: 'Clients', icon: Users,           path: '/customers' },
  { label: 'Stock',   icon: Package,         path: '/inventory' },
  { label: 'Spend',   icon: Receipt,         path: '/expenses' },
  { label: 'More',    icon: MoreHorizontal,  path: '/supplier/more' },
];

const SupplierBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (path: string) => {
    if (path === '/supplier') return pathname === '/supplier';
    return pathname.startsWith(path);
  };

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(0,0,0,0.07)',
      display: 'flex',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      fontFamily: "'Inter', system-ui, sans-serif",
      boxShadow: '0 -4px 32px rgba(0,0,0,0.06)',
    }}>
      {tabs.map(tab => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: '3px', padding: '10px 2px 12px',
              background: 'none', border: 'none', cursor: 'pointer',
              position: 'relative', minWidth: 0,
            }}
          >
            {/* Active top bar */}
            {active && (
              <motion.div
                layoutId="supplier-active-bar"
                style={{
                  position: 'absolute', top: 0, left: '15%', right: '15%',
                  height: '3px', borderRadius: '0 0 4px 4px',
                  background: 'linear-gradient(90deg,#4f46e5,#818cf8)',
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}

            {/* Icon pill */}
            <motion.div
              animate={{ scale: active ? 1.08 : 1 }}
              style={{
                width: '38px', height: '28px', borderRadius: '10px',
                background: active ? 'rgba(79,70,229,0.1)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.2s',
              }}
            >
              <tab.icon
                size={19}
                color={active ? '#4f46e5' : '#94a3b8'}
                strokeWidth={active ? 2.5 : 1.8}
              />
            </motion.div>

            <span style={{
              fontSize: '9px', fontWeight: active ? 800 : 600,
              color: active ? '#4f46e5' : '#94a3b8',
              letterSpacing: '0.01em',
              transition: 'color 0.2s',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
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
