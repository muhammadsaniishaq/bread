import { 
  User, TrendingUp, Settings, ShieldCheck, ChevronRight, Database, 
  Languages, HelpCircle, LogOut, Phone, MessageSquare, Download
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AnimatedPage } from '../components/AnimatedPage';
import { useNavigate } from 'react-router-dom';
import StoreBottomNav from '../components/StoreBottomNav';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';

const T = {
  primary: '#2563eb',
  pLight: 'rgba(37,99,235,0.08)',
  success: '#10b981',
  danger: '#f43f5e',
  white: '#ffffff',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  border: 'rgba(0,0,0,0.06)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

export default function StoreMore() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { language, setLanguage } = useTranslation();

  const sections = [
    {
      label: 'Main Services',
      items: [
        { title: 'My Profile', desc: 'Manage your details', icon: User, path: '/store/profile', color: T.primary },
        { title: 'Accounting', desc: 'Supplier & Bakery sync', icon: TrendingUp, path: '/store/accounting', color: T.success },
        { title: 'Dispatch Stats', desc: 'Records & History', icon: Database, path: '/store/records', color: '#8b5cf6' },
      ]
    },
    {
      label: 'Preferences',
      items: [
        { title: 'App Settings', desc: 'Display & Security', icon: Settings, path: '/store/settings', color: '#64748b' },
      ]
    }
  ];

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Premium Header */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)', padding: '60px 24px 40px', position: 'relative', overflow: 'hidden', borderBottomLeftRadius: '32px', borderBottomRightRadius: '32px' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
          <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: '64px', height: '64px', borderRadius: '22px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: '#fff' }}>
                {user?.email?.charAt(0).toUpperCase() || 'S'}
             </div>
             <div>
                <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: 0 }}>Store Options</h1>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{user?.email}</p>
                <div style={{ marginTop: '8px', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
                   <ShieldCheck size={12} /> Verified Store Access
                </div>
             </div>
          </div>
        </div>

        <div style={{ padding: '24px 20px' }}>
          
          {/* Language Switcher Card */}
          <div style={{ background: T.white, borderRadius: '20px', padding: '16px', marginBottom: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <Languages size={20} />
                </div>
                <div>
                   <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>App Language</div>
                   <div style={{ fontSize: '11px', color: T.txt3, fontWeight: 700 }}>Choose your tongue</div>
                </div>
             </div>
             <div style={{ display: 'flex', background: T.bg, padding: '4px', borderRadius: '10px' }}>
                <button onClick={() => setLanguage('en')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: language === 'en' ? T.primary : 'transparent', color: language === 'en' ? '#fff' : T.txt3, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>EN</button>
                <button onClick={() => setLanguage('ha')} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', background: language === 'ha' ? T.primary : 'transparent', color: language === 'ha' ? '#fff' : T.txt3, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>HA</button>
             </div>
          </div>

          {/* Menu Sections */}
          {sections.map((sec, sIdx) => (
            <div key={sIdx} style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginLeft: '4px' }}>{sec.label}</div>
              <div style={{ background: T.white, borderRadius: '24px', padding: '8px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                {sec.items.map((item, iIdx) => (
                  <motion.button key={iIdx} whileTap={{ scale: 0.98 }} onClick={() => navigate(item.path)}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: '16px', border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', textAlign: 'left', position: 'relative' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                       <item.icon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontSize: '14px', fontWeight: 800, color: T.ink }}>{item.title}</div>
                       <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt3 }}>{item.desc}</div>
                    </div>
                    <ChevronRight size={16} color={T.txt3} />
                    {iIdx !== sec.items.length - 1 && (
                      <div style={{ position: 'absolute', bottom: 0, left: '60px', right: '16px', height: '1px', background: T.border }} />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          ))}

          {/* Support & Tools */}
          <div style={{ fontSize: '11px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', marginLeft: '4px' }}>Support & Tools</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
             <button style={{ padding: '16px', borderRadius: '20px', background: T.white, border: `1px solid ${T.border}`, textAlign: 'left', cursor: 'pointer' }}>
                <Phone size={20} color={T.primary} />
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, marginTop: '8px' }}>Call Support</div>
                <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>Talk to us</div>
             </button>
             <button style={{ padding: '16px', borderRadius: '20px', background: T.white, border: `1px solid ${T.border}`, textAlign: 'left', cursor: 'pointer' }}>
                <MessageSquare size={20} color="#25D366" />
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, marginTop: '8px' }}>WhatsApp</div>
                <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>Instant chat</div>
             </button>
             <button style={{ padding: '16px', borderRadius: '20px', background: T.white, border: `1px solid ${T.border}`, textAlign: 'left', cursor: 'pointer' }}>
                <Download size={20} color={T.success} />
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, marginTop: '8px' }}>Export CSV</div>
                <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>Accounting data</div>
             </button>
             <button style={{ padding: '16px', borderRadius: '20px', background: T.white, border: `1px solid ${T.border}`, textAlign: 'left', cursor: 'pointer' }}>
                <HelpCircle size={20} color="#ff8d00" />
                <div style={{ fontSize: '13px', fontWeight: 800, color: T.ink, marginTop: '8px' }}>Help Center</div>
                <div style={{ fontSize: '10px', color: T.txt3, fontWeight: 700 }}>FAQs & Guides</div>
             </button>
          </div>

          {/* Quick Actions / Logout */}
          <button onClick={() => signOut()}
            style={{ width: '100%', padding: '16px', borderRadius: '20px', border: `1px solid ${T.danger}20`, background: `${T.danger}05`, color: T.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 900, cursor: 'pointer', marginBottom: '32px' }}>
            <LogOut size={18} /> Sign Out Account
          </button>

          {/* App Footer */}
          <div style={{ textAlign: 'center', opacity: 0.5 }}>
             <div style={{ fontSize: '10px', fontWeight: 800, color: T.txt3 }}>BAKERY MANAGEMENT SYSTEM</div>
             <div style={{ fontSize: '9px', fontWeight: 700, color: T.txt3, marginTop: '4px' }}>Version 2.4.0 • Built with ❤️ in Nigeria</div>
          </div>

        </div>

        <StoreBottomNav />
      </div>
    </AnimatedPage>
  );
}
