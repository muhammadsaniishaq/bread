import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, FileText, User, ListOrdered } from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const primary = '#635bff';
  const primaryLight = 'rgba(99,91,255,0.10)';

  const NAV = [
    { id: 'dashboard', label: 'Home',    icon: Home,        route: '/customer/dashboard' },
    { id: 'orders',    label: 'Orders',  icon: ListOrdered, route: '/customer/orders' },
    { id: 'store',     label: 'Shop',    icon: ShoppingBag, route: '/customer/store', isCenter: true },
    { id: 'docs',      label: 'Docs',    icon: FileText,    route: '/customer/docs' },
    { id: 'profile',   label: 'Profile', icon: User,        route: '/customer/profile' },
  ];

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      height: '74px',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1.5px solid rgba(99,91,255,0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -4px 30px rgba(99,91,255,0.06)'
    }}>
      {NAV.map((item) => {
        const isActive = path.includes(item.id) || (path === '/customer' && item.id === 'dashboard');
        const Icon = item.icon;

        if (item.isCenter) {
          return (
            <div key={item.id} onClick={() => navigate(item.route)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
              <motion.div whileTap={{ scale: 0.90 }}
                style={{
                  position: 'absolute', top: '-28px',
                  width: '56px', height: '56px', borderRadius: '18px',
                  background: `linear-gradient(135deg, ${primary}, #06b6d4)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(99,91,255,0.35)',
                  border: '3px solid white',
                }}>
                <Icon size={23} color="#fff" strokeWidth={2.5} />
              </motion.div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: isActive ? primary : '#94a3b8', marginTop: '32px' }}>
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <motion.div key={item.id} whileTap={{ scale: 0.88 }}
            onClick={() => navigate(item.route)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <div style={{
              width: '40px', height: '34px', borderRadius: '11px',
              background: isActive ? primaryLight : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s ease'
            }}>
              <Icon size={21} color={isActive ? primary : '#94a3b8'} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: isActive ? 800 : 600, color: isActive ? primary : '#94a3b8', transition: 'all 0.18s' }}>
              {item.label}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
};
