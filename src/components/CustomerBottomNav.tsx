import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, FileText, User, ListOrdered } from 'lucide-react';
import { motion } from 'framer-motion';

export const CustomerBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const NAV = [
    { id: 'dashboard', label: 'Home',    icon: Home,         route: '/customer/dashboard' },
    { id: 'orders',    label: 'Orders',  icon: ListOrdered,  route: '/customer/orders' },
    { id: 'store',     label: 'Shop',    icon: ShoppingBag,  route: '/customer/store', isCenter: true },
    { id: 'docs',      label: 'Docs',    icon: FileText,     route: '/customer/docs' },
    { id: 'profile',   label: 'Profile', icon: User,         route: '/customer/profile' },
  ];

  const primary = '#7c3aed';
  const primaryGlow = 'rgba(124, 58, 237, 0.3)';

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      height: '76px',
      background: 'rgba(15, 12, 41, 0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -20px 60px rgba(0,0,0,0.5)'
    }}>
      {NAV.map((item) => {
        const isActive = path.includes(item.id) || (path === '/customer' && item.id === 'dashboard');
        const Icon = item.icon;

        if (item.isCenter) {
          return (
            <div key={item.id} onClick={() => navigate(item.route)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
              <motion.div whileTap={{ scale: 0.92 }} style={{
                position: 'absolute', top: '-28px',
                width: '58px', height: '58px', borderRadius: '19px',
                background: `linear-gradient(135deg, ${primary}, #06b6d4)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 10px 30px ${primaryGlow}`,
                border: '3px solid rgba(15,12,41,0.8)',
              }}>
                <Icon size={24} color="#fff" strokeWidth={2.5} />
              </motion.div>
              <span style={{ fontSize: '10px', fontWeight: 800, color: isActive ? primary : 'rgba(255,255,255,0.35)', marginTop: '34px' }}>
                {item.label}
              </span>
            </div>
          );
        }

        return (
          <motion.div key={item.id} whileTap={{ scale: 0.9 }}
            onClick={() => navigate(item.route)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', cursor: 'pointer' }}>
            <div style={{
              width: '40px', height: '36px', borderRadius: '12px',
              background: isActive ? 'rgba(124,58,237,0.2)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease'
            }}>
              <Icon size={22} color={isActive ? primary : 'rgba(255,255,255,0.35)'} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span style={{
              fontSize: '10px', fontWeight: isActive ? 800 : 600,
              color: isActive ? primary : 'rgba(255,255,255,0.35)',
              transition: 'all 0.2s'
            }}>{item.label}</span>
          </motion.div>
        );
      })}
    </div>
  );
};
