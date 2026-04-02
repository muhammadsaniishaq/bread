import { User, TrendingUp, Settings, ShieldCheck, ChevronRight, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import StoreBottomNav from '../components/StoreBottomNav';
import { useAuth } from '../store/AuthContext';

const T = {
  primary: '#2563eb',
  pLight: 'rgba(37,99,235,0.08)',
  white: '#ffffff',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  bg2: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

export default function StoreMore() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const menuItems = [
    { title: 'My Profile',      desc: 'Personal details and performance', icon: User,       path: '/store/profile', color: T.primary },
    { title: 'Accounting',      desc: 'Bakery sync & Supplier link',      icon: TrendingUp,   path: '/store/accounting', color: '#10b981' },
    { title: 'Dispatch Stats',  desc: 'Detailed history and charts',    icon: Database,     path: '/store/records', color: '#8b5cf6' },
    { title: 'App Settings',    desc: 'System and display preferences', icon: Settings,     path: '/store/settings', color: '#64748b' },
  ];

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '110px', fontFamily: 'Inter, sans-serif' }}>
        
        {/* Header */}
        <div style={{ padding: '48px 20px 24px', background: T.white, borderBottom: `1px solid ${T.border}` }}>
          <h1 style={{ fontSize: '24px', fontWeight: 900, color: T.ink, letterSpacing: '-0.02em', margin: 0 }}>More Options</h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: T.txt2, fontWeight: 600 }}>Manage your store keeper account and links.</p>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {menuItems.map((item, idx) => (
              <motion.button key={idx} whileTap={{ scale: 0.98 }} onClick={() => navigate(item.path)}
                style={{ width: '100%', padding: '16px', borderRadius: '20px', border: `1px solid ${T.border}`, background: T.white, boxShadow: T.shadow, display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', textAlign: 'left' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${item.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                   <item.icon size={22} />
                </div>
                <div style={{ flex: 1 }}>
                   <div style={{ fontSize: '15px', fontWeight: 900, color: T.ink }}>{item.title}</div>
                   <div style={{ fontSize: '12px', fontWeight: 600, color: T.txt3 }}>{item.desc}</div>
                </div>
                <ChevronRight size={18} color={T.txt3} />
              </motion.button>
            ))}
          </div>

          <div style={{ marginTop: '32px', padding: '20px', background: T.pLight, borderRadius: '20px', textAlign: 'center' }}>
             <ShieldCheck size={32} color={T.primary} style={{ margin: '0 auto 8px' }} />
             <div style={{ fontSize: '14px', fontWeight: 900, color: T.primary }}>Official Store Access</div>
             <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt2, marginTop: '4px' }}>Authenticated as {user?.email}</div>
          </div>
        </div>

        <StoreBottomNav />
      </div>
    </AnimatedPage>
  );
}
