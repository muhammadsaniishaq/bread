import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, History, User } from 'lucide-react';

export const CustomerBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const T = {
    primary: '#10b981',
    primaryGlow: 'rgba(16, 185, 129, 0.2)',
    inactive: '#94a3b8',
    bg: 'rgba(255, 255, 255, 0.9)',
    border: 'rgba(0,0,0,0.05)',
  };

  const currentPath = location.pathname;

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '76px',
      background: T.bg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${T.border}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      paddingBottom: 'env(safe-area-inset-bottom)',
      zIndex: 50,
      boxShadow: '0 -10px 40px rgba(0,0,0,0.04)'
    }}>
      
      {/* 1. Dashboard */}
      <div 
        onClick={() => navigate('/customer/dashboard')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
      >
        <div style={{ padding: '6px', borderRadius: '12px', background: currentPath.includes('/dashboard') ? T.primaryGlow : 'transparent', color: currentPath.includes('/dashboard') ? T.primary : T.inactive, transition: 'all 0.2s' }}>
          <Home size={22} strokeWidth={currentPath.includes('/dashboard') ? 2.5 : 2} />
        </div>
        <span style={{ fontSize: '10px', fontWeight: currentPath.includes('/dashboard') ? 800 : 600, color: currentPath.includes('/dashboard') ? T.primary : T.inactive }}>Home</span>
      </div>

      {/* 2. History */}
      <div 
        onClick={() => navigate('/customer/orders')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
      >
        <div style={{ padding: '6px', borderRadius: '12px', background: currentPath.includes('/orders') ? T.primaryGlow : 'transparent', color: currentPath.includes('/orders') ? T.primary : T.inactive, transition: 'all 0.2s' }}>
          <History size={22} strokeWidth={currentPath.includes('/orders') ? 2.5 : 2} />
        </div>
        <span style={{ fontSize: '10px', fontWeight: currentPath.includes('/orders') ? 800 : 600, color: currentPath.includes('/orders') ? T.primary : T.inactive }}>History</span>
      </div>

      {/* 3. STORE (Prominent Middle/Action Button) */}
      <div 
        onClick={() => navigate('/customer/store')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', position: 'relative' }}
      >
        <div style={{ 
          position: 'absolute', 
          top: '-24px', 
          width: '56px', 
          height: '56px', 
          borderRadius: '28px', 
          background: T.primary, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
          color: '#ffffff',
          border: '4px solid #ffffff',
          transform: currentPath.includes('/store') ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}>
          <ShoppingBag size={24} strokeWidth={2.5} />
        </div>
        <span style={{ fontSize: '10px', fontWeight: 800, color: currentPath.includes('/store') ? T.primary : T.inactive, marginTop: '34px' }}>Store</span>
      </div>

      {/* 4. Profile */}
      <div 
        onClick={() => navigate('/customer/profile')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
      >
        <div style={{ padding: '6px', borderRadius: '12px', background: currentPath.includes('/profile') ? T.primaryGlow : 'transparent', color: currentPath.includes('/profile') ? T.primary : T.inactive, transition: 'all 0.2s' }}>
          <User size={22} strokeWidth={currentPath.includes('/profile') ? 2.5 : 2} />
        </div>
        <span style={{ fontSize: '10px', fontWeight: currentPath.includes('/profile') ? 800 : 600, color: currentPath.includes('/profile') ? T.primary : T.inactive }}>Profile</span>
      </div>

    </div>
  );
};
