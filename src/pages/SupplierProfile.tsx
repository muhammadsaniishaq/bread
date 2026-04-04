import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../store/AuthContext';
import { useTranslation } from '../store/LanguageContext';
import { User, Mail, LogOut, Phone, ShieldCheck, Languages, AlertTriangle } from 'lucide-react';
import { AnimatedPage } from '../components/AnimatedPage';
import SupplierBottomNav from '../components/SupplierBottomNav';
import { useAppContext } from '../store/AppContext';
import { motion } from 'framer-motion';

const T = {
  primary: '#4f46e5',
  pLight: 'rgba(79,70,229,0.08)',
  success: '#10b981',
  danger: '#ef4444',
  ink: '#0f172a',
  txt: '#1e293b',
  txt2: '#475569',
  txt3: '#94a3b8',
  bg: '#f8fafc',
  white: '#ffffff',
  border: 'rgba(0,0,0,0.06)',
  radius: '24px',
  shadow: '0 10px 40px -10px rgba(0,0,0,0.08)'
};

const fmt = (v: number) => "₦" + (v || 0).toLocaleString();

export default function SupplierProfile() {
  const { user, signOut } = useAuth();
  const { customers } = useAppContext();
  const { t, language, setLanguage } = useTranslation();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user!.id).single();
    if (data) setProfile(data);
  };

  const myAccount = useMemo(() => 
    customers.find(c => c.profile_id === user?.id), [customers, user]);

  return (
    <AnimatedPage>
      <div style={{ minHeight: '100vh', background: T.bg, paddingBottom: '120px', fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* Premium Header */}
        <div style={{ background: 'linear-gradient(135deg, #2e1065 0%, #4c1d95 100%)', padding: '60px 24px 80px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '180px', height: '180px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)' }} />
          
          <div style={{ position: 'relative', zIndex: 10 }}>
            <div style={{ width: '84px', height: '84px', borderRadius: '30px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
               <User size={36} color="#fff" />
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>{profile?.full_name || 'Supplier'}</h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: 'rgba(16,185,129,0.2)', color: '#10b981', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase' }}>
               <ShieldCheck size={12} /> {t('store.verifiedAccess') || 'Verified Supplier'}
            </div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginTop: '-40px', position: 'relative', zIndex: 20 }}>
          
          {/* Main Debt Counter */}
          <div style={{ background: T.white, borderRadius: '24px', padding: '24px', border: `1px solid ${T.border}`, boxShadow: T.shadow, textAlign: 'center', marginBottom: '24px' }}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '6px' }}>
                <AlertTriangle size={16} color={T.danger} />
                <span style={{ fontSize: '12px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase' }}>{t('dash.debtYouOwe')}</span>
             </div>
             <div style={{ fontSize: '36px', fontWeight: 900, color: T.danger }}>{fmt(myAccount?.debtBalance || 0)}</div>
             <div style={{ fontSize: '11px', fontWeight: 600, color: T.txt2, marginTop: '8px' }}>
                {t('store.pureSupplierLabel') || 'Settle debt with Store Keepers'}
             </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
             {/* Info Section */}
             <div style={{ background: T.white, borderRadius: '24px', padding: '20px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '13px', fontWeight: 800, color: T.txt3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('store.appSettings') || 'Account Details'}</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Mail size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Email</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{user?.email || 'N/A'}</div>
                      </div>
                   </div>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.txt2 }}>
                         <Phone size={18} />
                      </div>
                      <div>
                         <div style={{ fontSize: '10px', fontWeight: 700, color: T.txt3 }}>Phone Number</div>
                         <div style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{myAccount?.phone || profile?.phone || 'N/A'}</div>
                      </div>
                   </div>
                </div>
             </div>

             {/* Actions Section */}
             <div style={{ background: T.white, borderRadius: '24px', padding: '8px', border: `1px solid ${T.border}`, boxShadow: T.shadow }}>
                <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${T.bg}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: T.pLight, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Languages size={16} color={T.primary} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: T.ink }}>{language === 'en' ? 'Hausa Language' : 'English Language'}</span>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setLanguage(language === 'en' ? 'ha' : 'en')}
                    style={{ background: T.primary, color: '#fff', border: 'none', padding: '6px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                    {language === 'en' ? 'Sauya' : 'Switch'}
                  </motion.button>
                </div>

                <motion.button whileTap={{ scale: 0.98 }} onClick={signOut}
                  style={{ width: '100%', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(244,63,94,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <LogOut size={16} color={T.danger} />
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: T.danger }}>{t('store.logout')}</span>
                </motion.button>
             </div>

          </div>
        </div>
      </div>
      <SupplierBottomNav />
    </AnimatedPage>
  );
}
